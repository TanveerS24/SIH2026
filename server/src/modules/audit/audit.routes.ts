import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { auditService } from '../../services/audit.service.js';
import { checkCaseAccess } from '../../plugins/rbac.plugin.js';
import { AuditAction } from '@prisma/client';

export async function auditRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // 1. Global Audit Trail (Available for Senior Officers, Prosecutors, Judges, Analysts)
  fastify.get('/', async (request: FastifyRequest<{ Querystring: { caseId?: string; actorId?: string; action?: string; limit?: string } }>, reply: FastifyReply) => {
    const { caseId, actorId, action, limit } = request.query;

    const logs = await auditService.getAuditLogs({
      caseId,
      actorId,
      action: action as AuditAction,
      limit: limit ? parseInt(limit, 10) : 100,
    });

    const formatted = logs.map((l) => ({
      id: l.id,
      actorId: l.actorId,
      actorName: l.actor?.name || 'System / Anonymous',
      actorRole: l.actorRole,
      action: l.action,
      resource: l.resource,
      resourceId: l.resourceId,
      caseId: l.caseId,
      caseNumber: l.case?.caseNumber,
      timestamp: l.timestamp.toISOString(),
      ipAddress: l.ipAddress,
      userAgent: l.userAgent,
      result: l.result,
      reason: l.reason,
      metadata: l.metadata as any,
    }));

    return reply.status(200).send(formatted);
  });

  // 2. Case-Specific Audit Trail
  fastify.get('/:id/audit', { preHandler: [checkCaseAccess as any] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    const logs = await auditService.getAuditLogs({
      caseId: id,
      limit: 100,
    });

    const formatted = logs.map((l) => ({
      id: l.id,
      actorId: l.actorId,
      actorName: l.actor?.name || 'System',
      actorRole: l.actorRole,
      action: l.action,
      resource: l.resource,
      resourceId: l.resourceId,
      caseId: l.caseId,
      timestamp: l.timestamp.toISOString(),
      ipAddress: l.ipAddress,
      result: l.result,
      reason: l.reason,
      metadata: l.metadata as any,
    }));

    return reply.status(200).send(formatted);
  });
}
