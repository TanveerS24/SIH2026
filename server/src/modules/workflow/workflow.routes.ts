import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { prisma } from '../../config/prisma.js';
import { ledgerService } from '../../services/ledger.service.js';
import { auditService } from '../../services/audit.service.js';
import { checkCaseAccess, requireRoles } from '../../plugins/rbac.plugin.js';
import { Role, CaseStatus, AuditAction, CustodyAction } from '@prisma/client';
import { FileChargeSheetRequestSchema } from '@pramaan/shared-types';

export async function workflowRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // 1. Get Charge-Sheet Workflow Status & Checklist
  fastify.get('/:id/workflow', { preHandler: [checkCaseAccess as any] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    const caseRecord = await prisma.case.findUnique({
      where: { id },
      include: {
        workflowRequirements: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!caseRecord) {
      return reply.status(404).send({ error: 'NotFound', message: 'Case not found' });
    }

    const requirements = caseRecord.workflowRequirements;
    const mandatory = requirements.filter((r) => r.mandatoryForFiling);
    const satisfiedMandatory = mandatory.filter((r) => r.isSatisfied);
    const missing = mandatory.filter((r) => !r.isSatisfied).map((r) => r.title);

    const progressPercentage = mandatory.length > 0
      ? Math.round((satisfiedMandatory.length / mandatory.length) * 100)
      : 100;

    const canFile = mandatory.length > 0 && missing.length === 0 && !caseRecord.isFiled;

    return reply.status(200).send({
      caseId: caseRecord.id,
      caseNumber: caseRecord.caseNumber,
      canFile,
      status: caseRecord.status,
      progressPercentage,
      requirements,
      missingRequirements: missing,
      isFiled: caseRecord.isFiled,
      filedAt: caseRecord.filedAt?.toISOString() ?? null,
      filingLedgerTxId: caseRecord.filingLedgerTxId,
    });
  });

  // 2. Mark / Satisfy Workflow Requirement
  fastify.post(
    '/:id/workflow/satisfy',
    { preHandler: [requireRoles([Role.INVESTIGATION_OFFICER, Role.PROSECUTOR])] },
    (async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const user = request.user;
      const body = request.body as any;

      if (!body?.requirementId) {
        return reply.status(400).send({ error: 'BadRequest', message: 'requirementId is required' });
      }

      const updated = await prisma.workflowRequirement.update({
        where: { id: body.requirementId },
        data: {
          isSatisfied: true,
          satisfiedAt: new Date(),
          satisfiedBy: user.name,
          documentRefId: body.documentRefId ?? null,
          notes: body.notes ?? 'Endorsed by authorized officer.',
        },
      });

      await auditService.logAction({
        actorId: user.id,
        actorRole: user.role,
        action: AuditAction.DOCUMENT_SIGNED,
        resource: 'WORKFLOW_REQUIREMENT',
        resourceId: updated.id,
        caseId: id,
        ipAddress: request.ip,
        result: 'SUCCESS',
        reason: `Requirement satisfied: ${updated.title}`,
      });

      return reply.status(200).send(updated);
    }) as any
  );

  // 3. File Formal Charge Sheet (Server-Side Hard Enforcement - BNSS Section 193)
  fastify.post(
    '/:id/file',
    { preHandler: [requireRoles([Role.INVESTIGATION_OFFICER])] },
    (async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const user = request.user;

      const caseRecord = await prisma.case.findUnique({
        where: { id },
        include: { workflowRequirements: true },
      });

      if (!caseRecord) {
        return reply.status(404).send({ error: 'NotFound', message: 'Case not found' });
      }

      if (caseRecord.isFiled) {
        return reply.status(400).send({
          error: 'AlreadyFiled',
          message: `Charge sheet for case ${caseRecord.caseNumber} has already been filed in court.`,
        });
      }

      // Check all mandatory requirements
      const mandatory = caseRecord.workflowRequirements.filter((r) => r.mandatoryForFiling);
      const unsatisfied = mandatory.filter((r) => !r.isSatisfied);

      if (unsatisfied.length > 0) {
        const missingTitles = unsatisfied.map((u) => u.title);

        await auditService.logAction({
          actorId: user.id,
          actorRole: user.role,
          action: AuditAction.CHARGE_SHEET_ATTEMPT_BLOCKED,
          resource: 'CHARGE_SHEET_FILING',
          resourceId: caseRecord.id,
          caseId: caseRecord.id,
          ipAddress: request.ip,
          result: 'BLOCKED',
          reason: `Charge-sheet filing rejected server-side. Incomplete statutory requirements: ${missingTitles.join(', ')}`,
        });

        return reply.status(409).send({
          error: 'WorkflowIncomplete',
          message: 'CHARGE SHEET FILING BLOCKED: Statutory prerequisites are incomplete.',
          missingRequirements: missingTitles,
        });
      }

      // Validate filing form payload
      const parseResult = FileChargeSheetRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: 'Validation', message: parseResult.error.errors[0]?.message });
      }

      const { filingNotes, designatedCourt } = parseResult.data;

      // Anchor Charge Sheet in Ledger
      const filingHash = cryptoHash(`${caseRecord.id}:CHARGE_SHEET_FILED:${new Date().toISOString()}`);
      const ledgerResult = await ledgerService.recordEvent(
        'CHARGE_SHEET_FILING',
        {
          caseId: caseRecord.id,
          caseNumber: caseRecord.caseNumber,
          filedBy: user.name,
          filedByBadge: user.badgeNumber,
          court: designatedCourt,
          notes: filingNotes,
        },
        filingHash
      );

      // Update Case to FILED
      const updatedCase = await prisma.case.update({
        where: { id: caseRecord.id },
        data: {
          status: CaseStatus.FILED,
          isFiled: true,
          filedAt: new Date(),
          filingLedgerTxId: ledgerResult.txId,
        },
      });

      // Record Custody Event
      await prisma.custodyEvent.create({
        data: {
          caseId: caseRecord.id,
          action: CustodyAction.FILED,
          actorId: user.id,
          actorRole: user.role,
          documentHash: filingHash,
          ledgerTxId: ledgerResult.txId,
          ipAddress: request.ip,
          metadata: { court: designatedCourt, notes: filingNotes },
        },
      });

      // Record Audit Log
      await auditService.logAction({
        actorId: user.id,
        actorRole: user.role,
        action: AuditAction.CHARGE_SHEET_FILED,
        resource: 'CHARGE_SHEET_FILING',
        resourceId: caseRecord.id,
        caseId: caseRecord.id,
        ipAddress: request.ip,
        result: 'SUCCESS',
        reason: `Charge sheet formally filed in ${designatedCourt}. Ledger Tx: ${ledgerResult.txId}`,
        metadata: { ledgerTxId: ledgerResult.txId, designatedCourt },
      });

      return reply.status(200).send({
        success: true,
        message: `Charge sheet for case ${caseRecord.caseNumber} filed successfully.`,
        case: updatedCase,
        ledgerRecord: ledgerResult,
      });
    }) as any
  );
}

function cryptoHash(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}
