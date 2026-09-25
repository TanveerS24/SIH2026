import { FastifyRequest, FastifyReply } from 'fastify';
import { Role, AuditAction, AccessRequestStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { auditService } from '../services/audit.service.js';

export function requireRoles(allowedRoles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Authentication required' });
    }

    if (!allowedRoles.includes(user.role)) {
      await auditService.logAction({
        actorId: user.id,
        actorRole: user.role,
        action: AuditAction.LOGIN_FAILED,
        resource: request.routerPath || request.url,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        result: 'DENIED',
        reason: `Role '${user.role}' denied access. Required roles: [${allowedRoles.join(', ')}]`,
      });

      return reply.status(403).send({
        error: 'Forbidden',
        message: `Your role (${user.role}) does not have permission for this resource.`,
      });
    }
  };
}

export async function checkCaseAccess(
  request: FastifyRequest<{ Params: { id?: string; caseId?: string } }>,
  reply: FastifyReply
) {
  const user = request.user;
  const caseId = request.params.id || request.params.caseId;

  if (!user || !caseId) {
    return;
  }

  // 1. Judge has judicial jurisdiction read-only access
  if (user.role === Role.JUDGE) {
    if (request.method !== 'GET') {
      await auditService.logAction({
        actorId: user.id,
        actorRole: user.role,
        action: AuditAction.DOCUMENT_REDACTED,
        resource: 'CASE_WRITE',
        resourceId: caseId,
        caseId,
        ipAddress: request.ip,
        result: 'DENIED',
        reason: 'Judicial role possesses read-only scrutiny access; cannot mutate case artifacts.',
      });

      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Judicial officers possess read-only scrutiny access. Case mutations are strictly prohibited.',
      });
    }
    return;
  }

  // 2. NCRB Analyst: Needs approved active AccessRequest for individual case details
  if (user.role === Role.NCRB_ANALYST) {
    const activeRequest = await prisma.accessRequest.findFirst({
      where: {
        caseId,
        requesterId: user.id,
        status: 'APPROVED',
        expiresAt: { gt: new Date() },
      },
    });

    if (!activeRequest) {
      await auditService.logAction({
        actorId: user.id,
        actorRole: user.role,
        action: AuditAction.ACCESS_REQUEST_DENIED,
        resource: 'CASE_INDIVIDUAL_VIEW',
        resourceId: caseId,
        caseId,
        ipAddress: request.ip,
        result: 'DENIED',
        reason: 'NCRB Analyst attempted unapproved individual case record access without elevated clearance.',
      });

      return reply.status(403).send({
        error: 'Forbidden',
        message: 'NCRB Analysts are restricted to aggregate statistics. Individual case inspection requires a formal written Access Request and supervisor approval.',
      });
    }

    // Log utilization of elevated access
    await auditService.logAction({
      actorId: user.id,
      actorRole: user.role,
      action: AuditAction.ELEVATED_CASE_ACCESS_UTILIZED,
      resource: 'CASE_INDIVIDUAL_VIEW',
      resourceId: caseId,
      caseId,
      ipAddress: request.ip,
      result: 'SUCCESS',
      reason: `Elevated access utilized under approved Request ID: ${activeRequest.id}`,
    });

    return;
  }

  // 3. Check for active approved AccessRequest for this user and case
  const activeAccessRequest = await prisma.accessRequest.findFirst({
    where: {
      caseId,
      requesterId: user.id,
      status: AccessRequestStatus.APPROVED,
      expiresAt: { gt: new Date() },
    },
  });

  if (activeAccessRequest) {
    return;
  }

  // 4. Investigation Officer & WHDO & Prosecutor: Verify assignment or jurisdiction
  const assignment = await prisma.caseAssignment.findFirst({
    where: {
      caseId,
      userId: user.id,
    },
  });

  const caseObj = await prisma.case.findUnique({
    where: { id: caseId },
    select: { jurisdiction: true, status: true, isFiled: true },
  });

  if (!caseObj) {
    return reply.status(404).send({ error: 'NotFound', message: 'Case record not found' });
  }

  // Prosecutor can access cases once filed or assigned
  if (user.role === Role.PROSECUTOR) {
    if (caseObj.isFiled || assignment) {
      return;
    }
  }

  // Check if assigned or in same station
  if (!assignment) {
    // If not directly assigned, allow IO in same jurisdiction read access for joint investigation
    if (user.role === Role.INVESTIGATION_OFFICER && user.jurisdiction === caseObj.jurisdiction) {
      return;
    }

    await auditService.logAction({
      actorId: user.id,
      actorRole: user.role,
      action: AuditAction.CASE_VIEWED,
      resource: 'CASE',
      resourceId: caseId,
      caseId,
      ipAddress: request.ip,
      result: 'DENIED',
      reason: 'User is not assigned to this case and jurisdiction mismatch.',
    });

    return reply.status(403).send({
      error: 'Forbidden',
      message: 'You are not assigned to this case record.',
    });
  }
}
