import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { prisma } from '../../config/prisma.js';
import { storageService } from '../../services/storage.service.js';
import { ledgerService } from '../../services/ledger.service.js';
import { auditService } from '../../services/audit.service.js';
import { requireRoles } from '../../plugins/rbac.plugin.js';
import { AuditAction, CustodyAction, DocumentType, DocumentStatus, SyncStatus, CasePriority, SensitivityLevel, CaseStatus, Role } from '@prisma/client';
import { BatchSyncRequestSchema } from '@pramaan/shared-types';

export async function syncRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.post(
    '/',
    { preHandler: [requireRoles([Role.INVESTIGATION_OFFICER, Role.WOMEN_HELP_DESK_OFFICER])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = BatchSyncRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation', message: parseResult.error.errors[0]?.message });
    }

    const { items } = parseResult.data;
    const user = request.user;
    const results: any[] = [];

    for (const item of items) {
      try {
        // 1. Idempotency Check: Prevent duplicate processing if already synced
        const existingSync = await prisma.syncRecord.findUnique({
          where: { idempotencyKey: item.idempotencyKey },
        });

        if (existingSync && existingSync.status === SyncStatus.SYNCED) {
          results.push({
            localId: item.localId,
            idempotencyKey: item.idempotencyKey,
            status: 'SYNCED',
            serverRecordId: existingSync.serverRecordId,
            caseId: (existingSync.payload as any)?.caseId,
            documentId: (existingSync.payload as any)?.documentId,
          });
          continue;
        }

        const payload = item.payload;

        // 2. Find or Create Associated Case
        let targetCase: any;
        if (payload.caseNumber) {
          targetCase = await prisma.case.findUnique({ where: { caseNumber: payload.caseNumber } });
        }

        if (!targetCase) {
          const generatedCaseNum = payload.caseNumber || `TN-2026-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
          targetCase = await prisma.case.create({
            data: {
              caseNumber: generatedCaseNum,
              title: payload.caseTitle || payload.title || 'Field Recorded Incident',
              description: payload.statementText || payload.officerNotes || 'Field evidence record captured offline.',
              jurisdiction: user.jurisdiction || 'Chennai South',
              policeStation: user.department || 'T. Nagar AWPS',
              bnsSections: payload.bnsSections.length > 0 ? payload.bnsSections : ['BNS 70 (Harassment)'],
              priority: CasePriority.HIGH,
              sensitivity: SensitivityLevel.HIGHLY_SENSITIVE,
              status: CaseStatus.UNDER_INVESTIGATION,
              incidentLocation: payload.capturedLocation || 'Field Location Recorded via GPS',
              victimName: payload.victimName,
              victimAge: payload.victimAge,
              assignments: {
                create: { userId: user.id, role: user.role },
              },
              workflowRequirements: {
                create: [
                  { type: 'FORENSIC_REPORT', title: 'Forensic Lab Report', description: 'Scientific examination.', isSatisfied: false, mandatoryForFiling: true },
                  { type: 'WITNESS_STATEMENT', title: 'Witness Deposition', description: 'BNSS Section 180 statement.', isSatisfied: true, mandatoryForFiling: true, satisfiedAt: new Date(), satisfiedBy: user.name },
                  { type: 'REQUIRED_SIGNATURES', title: 'Supervisory Officer Endorsement', description: 'Senior review.', isSatisfied: false, mandatoryForFiling: true },
                  { type: 'EVIDENCE_METADATA', title: 'Cryptographic Hashing', description: 'Anchored in ledger.', isSatisfied: true, mandatoryForFiling: true, satisfiedAt: new Date() },
                  { type: 'OFFICER_VERIFICATION', title: 'Officer Verification', description: 'Case verification.', isSatisfied: true, mandatoryForFiling: true, satisfiedAt: new Date(), satisfiedBy: user.name },
                ],
              },
            },
          });
        }

        // 3. Process File / Statement Buffer
        let buffer: Buffer;
        if (payload.fileBase64 || payload.fileDataUri) {
          const raw = payload.fileBase64 || payload.fileDataUri?.split(',')[1] || '';
          buffer = Buffer.from(raw, 'base64');
        } else {
          buffer = Buffer.from(payload.statementText || 'Digital Statement Exhibit Captured Offline', 'utf8');
        }

        const sha256Hash = crypto.createHash('sha256').update(buffer).digest('hex');
        const docId = `doc-sync-${crypto.randomBytes(6).toString('hex')}`;
        const fileName = payload.fileName || `field_capture_${docId}.pdf`;
        const storageKey = storageService.generateStorageKey(targetCase.id, docId, fileName);

        // Upload to MinIO
        await storageService.uploadBuffer(buffer, storageKey, payload.mimeType || 'application/pdf');

        // Anchor in Ledger
        const ledgerRecord = await ledgerService.recordEvent(
          'OFFLINE_FIELD_CAPTURE_SYNC',
          {
            documentId: docId,
            caseId: targetCase.id,
            caseNumber: targetCase.caseNumber,
            capturedBy: user.name,
            capturedByBadge: user.badgeNumber,
            capturedLocation: payload.capturedLocation,
            idempotencyKey: item.idempotencyKey,
          },
          sha256Hash
        );

        const resolveDocumentType = (val?: string): DocumentType => {
          if (!val) return DocumentType.PHOTOGRAPHIC_EVIDENCE;
          if (val === 'PHOTO_EXHIBIT' || val === 'PHOTO' || val === 'IMAGE') return DocumentType.PHOTOGRAPHIC_EVIDENCE;
          if (val === 'STATEMENT') return DocumentType.WITNESS_STATEMENT;
          if (val === 'SEIZURE') return DocumentType.SEIZURE_MEMO;
          if (Object.values(DocumentType).includes(val as any)) return val as DocumentType;
          return DocumentType.PHOTOGRAPHIC_EVIDENCE;
        };

        // Insert Document Record
        const newDoc = await prisma.document.create({
          data: {
            id: docId,
            caseId: targetCase.id,
            documentType: resolveDocumentType(payload.documentType),
            title: payload.title || fileName,
            originalFileName: fileName,
            storageKey,
            mimeType: payload.mimeType || 'application/pdf',
            fileSize: buffer.length,
            sha256Hash,
            status: DocumentStatus.VERIFIED,
            extractedText: payload.statementText,
            detectedBnsSections: payload.bnsSections,
            ledgerTxId: ledgerRecord.txId,
            uploadedBy: user.id,
          },
        });

        // Insert Signature if present
        if (payload.signatureSvg || payload.signatureBase64) {
          const sigHash = crypto.createHash('sha256').update(payload.signatureSvg || payload.signatureBase64 || '').digest('hex');
          await prisma.signature.create({
            data: {
              documentId: newDoc.id,
              userId: user.id,
              role: user.role,
              signatureSvg: payload.signatureSvg,
              signatureHash: sigHash,
            },
          });
        }

        // Custody Events
        await prisma.custodyEvent.create({
          data: {
            caseId: targetCase.id,
            documentId: newDoc.id,
            action: CustodyAction.UPLOADED,
            actorId: user.id,
            actorRole: user.role,
            documentHash: sha256Hash,
            ledgerTxId: ledgerRecord.txId,
            ipAddress: request.ip,
            metadata: {
              source: 'OFFLINE_MOBILE_SQLITE_QUEUE',
              idempotencyKey: item.idempotencyKey,
              location: payload.capturedLocation,
            },
          },
        });

        // Record Sync in DB
        await prisma.syncRecord.upsert({
          where: { idempotencyKey: item.idempotencyKey },
          update: {
            status: SyncStatus.SYNCED,
            serverRecordId: newDoc.id,
            syncedAt: new Date(),
          },
          create: {
            localId: item.localId,
            idempotencyKey: item.idempotencyKey,
            userId: user.id,
            operation: item.operation,
            payload: { caseId: targetCase.id, documentId: newDoc.id },
            status: SyncStatus.SYNCED,
            serverRecordId: newDoc.id,
            syncedAt: new Date(),
          },
        });

        await auditService.logAction({
          actorId: user.id,
          actorRole: user.role,
          action: AuditAction.DOCUMENT_UPLOADED,
          resource: 'SYNC_RECORD',
          resourceId: newDoc.id,
          caseId: targetCase.id,
          ipAddress: request.ip,
          result: 'SUCCESS',
          reason: `Offline field capture synchronized (Idempotency: ${item.idempotencyKey})`,
        });

        results.push({
          localId: item.localId,
          idempotencyKey: item.idempotencyKey,
          status: 'SYNCED',
          serverRecordId: newDoc.id,
          caseId: targetCase.id,
          documentId: newDoc.id,
        });
      } catch (err: any) {
        console.error('Error syncing item:', item.idempotencyKey, err);
        results.push({
          localId: item.localId,
          idempotencyKey: item.idempotencyKey,
          status: 'FAILED',
          error: err.message || 'Sync processing error',
        });
      }
    }

    return reply.status(200).send({
      processedCount: results.length,
      results,
    });
  });
}
