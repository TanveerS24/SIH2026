import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/prisma.js';
import { checkCaseAccess } from '../../plugins/rbac.plugin.js';
import { CustodyAction } from '@prisma/client';

export async function custodyRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // 1. Get Custody Timeline for a Case
  fastify.get('/:id/custody', { preHandler: [checkCaseAccess as any] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    const events = await prisma.custodyEvent.findMany({
      where: { caseId: id },
      orderBy: { timestamp: 'desc' },
      include: {
        actor: { select: { name: true, badgeNumber: true, role: true, department: true } },
        document: { select: { title: true, documentType: true, sha256Hash: true } },
      },
    });

    const formatted = events.map((e) => ({
      id: e.id,
      caseId: e.caseId,
      documentId: e.documentId,
      action: e.action,
      actorId: e.actorId,
      actorName: e.actor.name,
      actorRole: e.actorRole,
      actorBadge: e.actor.badgeNumber,
      timestamp: e.timestamp.toISOString(),
      documentHash: e.documentHash,
      previousHash: e.previousHash,
      ledgerTxId: e.ledgerTxId,
      metadata: e.metadata as any,
      ipAddress: e.ipAddress,
      documentTitle: e.document?.title,
    }));

    return reply.status(200).send(formatted);
  });

  // 2. Add Custody Event
  fastify.post('/:id/custody', { preHandler: [checkCaseAccess as any] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const user = request.user;
    const body = request.body as any;

    if (!body?.action) {
      return reply.status(400).send({ error: 'BadRequest', message: 'Action is required' });
    }

    const event = await prisma.custodyEvent.create({
      data: {
        caseId: id,
        documentId: body.documentId || null,
        action: body.action as CustodyAction,
        actorId: user.id,
        actorRole: user.role,
        documentHash: body.documentHash || null,
        ledgerTxId: body.ledgerTxId || null,
        metadata: body.metadata || {},
        ipAddress: request.ip,
      },
      include: {
        actor: { select: { name: true, badgeNumber: true, role: true } },
      },
    });

    return reply.status(201).send({
      ...event,
      actorName: event.actor.name,
      actorBadge: event.actor.badgeNumber,
    });
  });
}
