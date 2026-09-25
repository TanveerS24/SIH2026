import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/prisma.js';
import { auditService } from '../../services/audit.service.js';
import { requireRoles } from '../../plugins/rbac.plugin.js';
import { Role, AuditAction, AccessRequestStatus } from '@prisma/client';
import { CreateAccessRequestSchema } from '@pramaan/shared-types';

export async function accessRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // 1. List Access Requests
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    let where: any = {};

    if (user.role === Role.NCRB_ANALYST) {
      where = { requesterId: user.id };
    }

    const requests = await prisma.accessRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        case: {
          select: {
            caseNumber: true,
            title: true,
            assignments: { select: { userId: true } },
          },
        },
        requester: { select: { name: true, badgeNumber: true, role: true } },
        reviewer: { select: { name: true, badgeNumber: true, role: true } },
      },
    });

    const formatted = requests.map((r) => {
      const isAssigned = r.case.assignments.some((a) => a.userId === user.id);
      const isSelf = r.requesterId === user.id;
      // Authority check:
      // 1. Separation of duties: Never approve own request
      // 2. Judges and Prosecutors hold supervisory clearance authority
      // 3. IOs can only review requests for cases they are assigned to
      const canReview = !isSelf && (
        user.role === Role.JUDGE ||
        user.role === Role.PROSECUTOR ||
        (user.role === Role.INVESTIGATION_OFFICER && isAssigned)
      );

      return {
        id: r.id,
        caseId: r.caseId,
        caseNumber: r.case.caseNumber,
        caseTitle: r.case.title,
        requesterId: r.requesterId,
        requesterName: r.requester.name,
        requesterRole: r.requester.role,
        reason: r.reason,
        status: r.status,
        durationHours: r.durationHours,
        expiresAt: r.expiresAt?.toISOString() ?? null,
        reviewedBy: r.reviewedBy,
        reviewedByName: r.reviewer?.name ?? null,
        reviewedAt: r.reviewedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        canReview,
        isSelf,
      };
    });

    return reply.status(200).send(formatted);
  });

  // 2. Submit Elevated Access Request
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = CreateAccessRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation', message: parseResult.error.errors[0]?.message });
    }

    const { caseId, reason, durationHours } = parseResult.data;
    const user = request.user;

    const targetCase = await prisma.case.findUnique({ where: { id: caseId } });
    if (!targetCase) {
      return reply.status(404).send({ error: 'NotFound', message: 'Target case record not found' });
    }

    const newRequest = await prisma.accessRequest.create({
      data: {
        caseId,
        requesterId: user.id,
        reason,
        durationHours: durationHours || 24,
        status: AccessRequestStatus.PENDING,
      },
      include: {
        case: true,
        requester: true,
      },
    });

    await auditService.logAction({
      actorId: user.id,
      actorRole: user.role,
      action: AuditAction.ACCESS_REQUEST_SUBMITTED,
      resource: 'ACCESS_REQUEST',
      resourceId: newRequest.id,
      caseId,
      ipAddress: request.ip,
      result: 'SUCCESS',
      reason: `Elevated access requested by ${user.name} (${user.role}). Statutory justification: ${reason}`,
    });

    return reply.status(201).send(newRequest);
  });

  // 3. Review / Approve / Reject Access Request
  fastify.post(
    '/:id/review',
    { preHandler: [requireRoles([Role.INVESTIGATION_OFFICER, Role.PROSECUTOR, Role.JUDGE])] },
    (async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const user = request.user;
      const body = request.body as any;

      const accessReq = await prisma.accessRequest.findUnique({
        where: { id },
        include: {
          case: {
            include: {
              assignments: true,
            },
          },
        },
      });
      if (!accessReq) {
        return reply.status(404).send({ error: 'NotFound', message: 'Access request not found' });
      }

      if (accessReq.status !== AccessRequestStatus.PENDING) {
        return reply.status(400).send({
          error: 'BadRequest',
          message: `Access request has already been reviewed (${accessReq.status}).`,
        });
      }

      // 1. Separation of duties: Self-approval is strictly forbidden
      if (accessReq.requesterId === user.id) {
        await auditService.logAction({
          actorId: user.id,
          actorRole: user.role,
          action: AuditAction.ACCESS_REQUEST_DENIED,
          resource: 'ACCESS_REQUEST',
          resourceId: id,
          caseId: accessReq.caseId,
          ipAddress: request.ip,
          result: 'DENIED',
          reason: `Conflict of interest: ${user.name} (${user.role}) attempted to self-approve own access request ${id}`,
        });

        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Separation of duties violation: Officers cannot approve or review their own access requests.',
        });
      }

      // 2. Authority check:
      // Judges and Prosecutors have supervisory clearance authority.
      // Investigation Officers can only review requests for cases they are actively assigned to.
      if (user.role === Role.INVESTIGATION_OFFICER) {
        const isAssigned = accessReq.case.assignments.some((a) => a.userId === user.id);
        if (!isAssigned) {
          await auditService.logAction({
            actorId: user.id,
            actorRole: user.role,
            action: AuditAction.ACCESS_REQUEST_DENIED,
            resource: 'ACCESS_REQUEST',
            resourceId: id,
            caseId: accessReq.caseId,
            ipAddress: request.ip,
            result: 'DENIED',
            reason: `Unauthorized approval attempt: ${user.name} is not assigned to case ${accessReq.case.caseNumber}`,
          });

          return reply.status(403).send({
            error: 'Forbidden',
            message: 'Authority violation: Investigation Officers can only review access requests for cases they are actively assigned to.',
          });
        }
      }

      const isApproved = body?.approved === true;
      const expiresAt = isApproved ? new Date(Date.now() + accessReq.durationHours * 60 * 60 * 1000) : null;

      const updated = await prisma.accessRequest.update({
        where: { id },
        data: {
          status: isApproved ? AccessRequestStatus.APPROVED : AccessRequestStatus.REJECTED,
          reviewedBy: user.id,
          reviewedAt: new Date(),
          expiresAt,
        },
      });

      await auditService.logAction({
        actorId: user.id,
        actorRole: user.role,
        action: isApproved ? AuditAction.ACCESS_REQUEST_APPROVED : AuditAction.ACCESS_REQUEST_DENIED,
        resource: 'ACCESS_REQUEST',
        resourceId: id,
        caseId: accessReq.caseId,
        ipAddress: request.ip,
        result: isApproved ? 'SUCCESS' : 'DENIED',
        reason: isApproved
          ? `Elevated access granted for ${accessReq.durationHours} hours by ${user.name} (${user.role})`
          : `Elevated access denied by ${user.name} (${user.role})`,
      });

      return reply.status(200).send(updated);
    }) as any
  );
}
