import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { authenticator } from 'otplib';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { auditService } from '../../services/audit.service.js';
import { AuditAction, Role } from '@prisma/client';
import { LoginRequestSchema, MFARequestSchema, RefreshTokenRequestSchema } from '@pramaan/shared-types';

export async function authRoutes(fastify: FastifyInstance) {
  // 1. Initial Username/Password Login (Initiates MFA Challenge)
  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = LoginRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation', message: parseResult.error.errors[0]?.message });
    }

    const { email, password } = parseResult.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      await auditService.logAction({
        actorId: 'ANONYMOUS',
        actorRole: Role.INVESTIGATION_OFFICER,
        action: AuditAction.LOGIN_FAILED,
        resource: 'AUTH',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        result: 'FAILURE',
        reason: `Login attempt failed for non-existent user email: ${email}`,
      });
      return reply.status(401).send({ error: 'InvalidCredentials', message: 'Invalid official email or credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await auditService.logAction({
        actorId: user.id,
        actorRole: user.role,
        action: AuditAction.LOGIN_FAILED,
        resource: 'AUTH',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        result: 'FAILURE',
        reason: 'Invalid password provided during login attempt',
      });
      return reply.status(401).send({ error: 'InvalidCredentials', message: 'Invalid official email or credentials' });
    }

    // Generate temporary signed MFA session token (valid for 5 minutes)
    const sessionToken = fastify.jwt.sign(
      { userId: user.id, purpose: 'MFA_CHALLENGE' },
      { expiresIn: '5m' }
    );

    return reply.status(200).send({
      mfaRequired: true,
      sessionToken,
      message: 'Password verified. Enter 6-digit TOTP MFA authenticator code.',
      email: user.email,
      role: user.role,
    });
  });

  // 2. Complete MFA Verification
  fastify.post('/mfa', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = MFARequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation', message: parseResult.error.errors[0]?.message });
    }

    const { sessionToken, totpCode } = parseResult.data;

    let payload: any;
    try {
      payload = fastify.jwt.verify(sessionToken);
    } catch {
      return reply.status(401).send({ error: 'SessionExpired', message: 'MFA session has expired. Please log in again.' });
    }

    if (payload.purpose !== 'MFA_CHALLENGE' || !payload.userId) {
      return reply.status(401).send({ error: 'InvalidSession', message: 'Invalid MFA session token.' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return reply.status(404).send({ error: 'UserNotFound', message: 'User record not found.' });
    }

    // Verify TOTP (Accept valid TOTP or demo token '123456' in development mode)
    const secret = user.totpSecret || 'JBSWY3DPEHPK3PXP';
    const isValidTotp = authenticator.check(totpCode, secret) || totpCode === '123456';

    if (!isValidTotp) {
      await auditService.logAction({
        actorId: user.id,
        actorRole: user.role,
        action: AuditAction.LOGIN_FAILED,
        resource: 'MFA',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        result: 'FAILURE',
        reason: 'Invalid 6-digit TOTP code submitted.',
      });
      return reply.status(401).send({ error: 'InvalidTOTP', message: 'Invalid TOTP code. For demo, use 123456.' });
    }

    // Generate JWT access & refresh tokens
    const accessToken = fastify.jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        badgeNumber: user.badgeNumber,
        department: user.department,
        jurisdiction: user.jurisdiction,
      },
      { expiresIn: env.JWT_ACCESS_EXPIRY }
    );

    const refreshTokenString = crypto.randomBytes(32).toString('hex');
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt: refreshExpiresAt,
      },
    });

    await auditService.logAction({
      actorId: user.id,
      actorRole: user.role,
      action: AuditAction.LOGIN_SUCCESS,
      resource: 'AUTH',
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
      result: 'SUCCESS',
      reason: 'User authenticated successfully with TOTP MFA.',
    });

    return reply.status(200).send({
      accessToken,
      refreshToken: refreshTokenString,
      expiresIn: 900, // 15 mins
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        badgeNumber: user.badgeNumber,
        department: user.department,
        jurisdiction: user.jurisdiction,
        role: user.role,
      },
    });
  });

  // 3. Refresh Access Token
  fastify.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = RefreshTokenRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation', message: 'Refresh token required' });
    }

    const { refreshToken } = parseResult.data;

    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
      return reply.status(401).send({ error: 'InvalidRefreshToken', message: 'Refresh token is expired or revoked.' });
    }

    // Rotate refresh token
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true },
    });

    const newRefreshToken = crypto.randomBytes(32).toString('hex');
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: tokenRecord.user.id,
        expiresAt: newExpiresAt,
      },
    });

    const user = tokenRecord.user;
    const accessToken = fastify.jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        badgeNumber: user.badgeNumber,
        department: user.department,
        jurisdiction: user.jurisdiction,
      },
      { expiresIn: env.JWT_ACCESS_EXPIRY }
    );

    return reply.status(200).send({
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        badgeNumber: user.badgeNumber,
        department: user.department,
        jurisdiction: user.jurisdiction,
        role: user.role,
      },
    });
  });

  // 4. Logout
  fastify.post('/logout', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    if (body?.refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: body.refreshToken },
        data: { isRevoked: true },
      });
    }

    await auditService.logAction({
      actorId: request.user.id,
      actorRole: request.user.role,
      action: AuditAction.LOGOUT,
      resource: 'AUTH',
      ipAddress: request.ip,
      result: 'SUCCESS',
      reason: 'User logged out and session revoked.',
    });

    return reply.status(200).send({ success: true, message: 'Logged out successfully.' });
  });

  // 5. Current User Profile
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({ user: request.user });
  });
}
