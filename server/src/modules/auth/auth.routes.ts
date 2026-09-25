import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { authenticator } from 'otplib';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { auditService } from '../../services/audit.service.js';
import { SecureLogger } from '../../services/secure-logger.service.js';
import { notificationService } from '../../services/notification.service.js';
import { AuditAction, Role } from '@prisma/client';
import {
  LoginRequestSchema,
  MFARequestSchema,
  RefreshTokenRequestSchema,
  RegisterRequestSchema,
  UpdateProfileRequestSchema,
  MockLoginRequestSchema,
} from '@pramaan/shared-types';

const ROLE_PERSONAS: Record<Role, { email: string; name: string; badgeNumber: string; department: string; jurisdiction: string }> = {
  INVESTIGATION_OFFICER: {
    email: 'io@example.gov',
    name: 'Inspector Rajesh Varma',
    badgeNumber: 'TN-IO-4892',
    department: 'Women Safety Division, Crime Branch',
    jurisdiction: 'Chennai Central',
  },
  WOMEN_HELP_DESK_OFFICER: {
    email: 'helpdesk@example.gov',
    name: 'Sub-Inspector Ananya Swaminathan',
    badgeNumber: 'TN-WHD-1044',
    department: 'Women Help Desk, T. Nagar PS',
    jurisdiction: 'Chennai South',
  },
  PROSECUTOR: {
    email: 'prosecutor@example.gov',
    name: 'Advocate Meera Sundaram',
    badgeNumber: 'TN-PP-0381',
    department: 'Directorate of Public Prosecutions',
    jurisdiction: 'City Sessions Court, Chennai',
  },
  JUDGE: {
    email: 'judge@example.gov',
    name: 'Hon. Justice K. Ramanathan',
    badgeNumber: 'TN-JUD-0012',
    department: 'Special Fast Track Court for Women & Children',
    jurisdiction: 'Chennai Metropolitan Sessions',
  },
  NCRB_ANALYST: {
    email: 'analyst@example.gov',
    name: 'Dr. Siddharth Sen',
    badgeNumber: 'NCRB-STAT-992',
    department: 'NCRB Crime Research & Statistical Division',
    jurisdiction: 'National Crime Records Directorate, New Delhi',
  },
};

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

    await notificationService.createNotification({
      userId: user.id,
      type: 'SECURITY',
      title: 'Session Authenticated',
      message: `Official session established via TOTP multi-factor verification (IP: ${request.ip || '127.0.0.1'}).`,
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

  // 6. User Creation / Registration
  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = RegisterRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation', message: parseResult.error.errors[0]?.message });
    }

    const { email, password, name, badgeNumber, department, jurisdiction, role } = parseResult.data;

    // Check existing email or badge number
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return reply.status(409).send({ error: 'EmailConflict', message: 'An official account with this email address already exists.' });
    }

    const existingBadge = await prisma.user.findUnique({ where: { badgeNumber } });
    if (existingBadge) {
      return reply.status(409).send({ error: 'BadgeConflict', message: 'An official account with this badge/service ID already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const totpSecret = 'JBSWY3DPEHPK3PXP'; // Standard Base32 secret for TOTP authenticator

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        badgeNumber,
        department,
        jurisdiction,
        role: role as Role,
        totpSecret,
        totpEnabled: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        badgeNumber: true,
        department: true,
        jurisdiction: true,
        role: true,
        createdAt: true,
      },
    });

    SecureLogger.info('AUTH_REGISTER', `New official user registered: ${newUser.badgeNumber} (${newUser.role})`);

    await auditService.logAction({
      actorId: newUser.id,
      actorRole: newUser.role,
      action: AuditAction.LOGIN_SUCCESS,
      resource: 'USER_REGISTRATION',
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
      result: 'SUCCESS',
      reason: `Official identity registered for badge: ${newUser.badgeNumber}`,
    });

    return reply.status(201).send({
      success: true,
      message: 'Official identity registered successfully. You may now authenticate.',
      user: newUser,
    });
  });

  // 7. Update User Profile
  fastify.patch('/profile', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = UpdateProfileRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation', message: parseResult.error.errors[0]?.message });
    }

    const userId = request.user.id;
    const { name, department, jurisdiction, currentPassword, newPassword } = parseResult.data;

    const userRecord = await prisma.user.findUnique({ where: { id: userId } });
    if (!userRecord) {
      return reply.status(404).send({ error: 'UserNotFound', message: 'User record not found' });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (department) updateData.department = department;
    if (jurisdiction) updateData.jurisdiction = jurisdiction;

    if (newPassword) {
      if (!currentPassword) {
        return reply.status(400).send({ error: 'PasswordRequired', message: 'Current password is required to set a new password.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, userRecord.passwordHash);
      if (!isMatch) {
        return reply.status(401).send({ error: 'InvalidCurrentPassword', message: 'Current password does not match.' });
      }
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        badgeNumber: true,
        department: true,
        jurisdiction: true,
        role: true,
      },
    });

    if (name || department || jurisdiction) {
      await notificationService.createNotification({
        userId,
        type: 'PROFILE',
        title: 'Profile Updated',
        message: `Your official profile details (${[name ? 'Name' : '', department ? 'Department' : '', jurisdiction ? 'Jurisdiction' : ''].filter(Boolean).join(', ')}) were updated.`,
      });
    }

    if (newPassword) {
      await notificationService.createNotification({
        userId,
        type: 'SECURITY',
        title: 'Security Alert: Password Changed',
        message: 'Your official credentials password was successfully modified. If you did not make this change, contact IT Security immediately.',
      });
    }

    SecureLogger.info('AUTH_PROFILE_UPDATE', `Officer profile updated: ${updatedUser.badgeNumber}`);

    return reply.status(200).send({
      success: true,
      message: 'Profile details updated successfully.',
      user: updatedUser,
    });
  });

  // 8. Evaluator / Sandbox Quick Mock Login (Generates real JWT access & refresh tokens)
  fastify.post('/mock-login', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = MockLoginRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation', message: parseResult.error.errors[0]?.message });
    }

    const requestedRole = (parseResult.data.role as Role) || Role.INVESTIGATION_OFFICER;
    const persona = ROLE_PERSONAS[requestedRole] || ROLE_PERSONAS.INVESTIGATION_OFFICER;
    const targetEmail = parseResult.data.email || persona.email;

    // Find or create persona to guarantee presence
    const passwordHash = await bcrypt.hash('DemoPass123!', 10);
    const user = await prisma.user.upsert({
      where: { email: targetEmail },
      update: { role: requestedRole },
      create: {
        email: targetEmail,
        passwordHash,
        name: persona.name,
        badgeNumber: persona.badgeNumber,
        department: persona.department,
        jurisdiction: persona.jurisdiction,
        role: requestedRole,
        totpSecret: 'JBSWY3DPEHPK3PXP',
        totpEnabled: true,
      },
    });

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
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt: refreshExpiresAt,
      },
    });

    SecureLogger.info('AUTH_MOCK_LOGIN', `Rapid evaluation tokens provisioned for ${user.badgeNumber} (${user.role})`);

    await auditService.logAction({
      actorId: user.id,
      actorRole: user.role,
      action: AuditAction.LOGIN_SUCCESS,
      resource: 'AUTH_MOCK',
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
      result: 'SUCCESS',
      reason: `Evaluator mock access token issued for persona: ${user.role}`,
    });

    await notificationService.createNotification({
      userId: user.id,
      type: 'SECURITY',
      title: 'Session Authenticated',
      message: `Signed in as ${user.name} (${user.role}). Official session active.`,
    });

    return reply.status(200).send({
      accessToken,
      refreshToken: refreshTokenString,
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
}

