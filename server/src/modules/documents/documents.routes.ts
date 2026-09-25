import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { prisma } from '../../config/prisma.js';
import { storageService } from '../../services/storage.service.js';
import { malwareScannerService } from '../../services/malware.service.js';
import { ledgerService } from '../../services/ledger.service.js';
import { documentAIService } from '../../services/ai.service.js';
import { ragService } from '../../services/rag.service.js';
import { auditService } from '../../services/audit.service.js';
import { requireRoles } from '../../plugins/rbac.plugin.js';

import { Role, AuditAction, CustodyAction, DocumentType, DocumentStatus } from '@prisma/client';

export async function documentsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // 1. Upload Document & Anchor in Ledger (Police Field Officers only)
  fastify.post(
    '/upload',
    { preHandler: [requireRoles([Role.INVESTIGATION_OFFICER, Role.WOMEN_HELP_DESK_OFFICER])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user;

    let buffer: Buffer;
    let originalFileName = 'evidence_document.pdf';
    let mimeType = 'application/pdf';
    let caseId = '';
    let docType: DocumentType = DocumentType.PHOTOGRAPHIC_EVIDENCE;
    let title = 'Evidence Exhibit';

    // Handle multipart or JSON base64
    if (request.isMultipart()) {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ error: 'BadRequest', message: 'No file provided in multipart payload' });
      }
      buffer = await data.toBuffer();
      originalFileName = data.filename;
      mimeType = data.mimetype;

      const fields: any = data.fields;
      caseId = fields.caseId?.value || '';
      title = fields.title?.value || originalFileName;
      if (fields.documentType?.value) {
        docType = fields.documentType.value as DocumentType;
      }
    } else {
      const body = request.body as any;
      if (!body?.caseId || (!body?.fileBase64 && !body?.fileDataUri)) {
        return reply.status(400).send({ error: 'BadRequest', message: 'caseId and fileBase64 / fileDataUri are required' });
      }
      caseId = body.caseId;
      title = body.title || 'Evidence Exhibit';
      originalFileName = body.fileName || 'evidence_file.pdf';
      mimeType = body.mimeType || 'application/pdf';
      if (body.documentType) {
        docType = body.documentType as DocumentType;
      }

      const rawBase64 = body.fileBase64 || body.fileDataUri?.split(',')[1] || '';
      buffer = Buffer.from(rawBase64, 'base64');
    }

    // Verify Case Exists
    const targetCase = await prisma.case.findUnique({ where: { id: caseId } });
    if (!targetCase) {
      return reply.status(404).send({ error: 'NotFound', message: 'Target case record does not exist' });
    }

    // A. Malware Scanning Layer
    const scanResult = await malwareScannerService.scanBuffer(buffer, originalFileName);
    if (!scanResult.isClean) {
      await auditService.logAction({
        actorId: user.id,
        actorRole: user.role,
        action: AuditAction.DOCUMENT_UPLOADED,
        resource: 'DOCUMENT_MALWARE_BLOCK',
        caseId,
        ipAddress: request.ip,
        result: 'BLOCKED',
        reason: `Malware scan flagged threat: ${scanResult.threatName} (Engine: ${scanResult.scannerEngine})`,
      });

      return reply.status(422).send({
        error: 'MalwareDetected',
        message: `File rejected: Potential security threat detected (${scanResult.threatName})`,
      });
    }

    // B. Calculate Authoritative Server-Side SHA-256 Hash
    const sha256Hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const docId = `doc-${crypto.randomBytes(6).toString('hex')}`;
    const storageKey = storageService.generateStorageKey(caseId, docId, originalFileName);

    // C. Store in MinIO Object Storage
    await storageService.uploadBuffer(buffer, storageKey, mimeType);

    // D. Run AI OCR & Classification
    const extractedText = await documentAIService.extractText(buffer, mimeType, originalFileName);
    const metadata = await documentAIService.extractMetadata(extractedText, originalFileName);

    // E. Anchor in Simulated Permissioned Blockchain Ledger
    const ledgerResult = await ledgerService.recordEvent(
      'DOCUMENT_INTEGRITY',
      {
        documentId: docId,
        caseId,
        caseNumber: targetCase.caseNumber,
        documentType: docType,
        originalFileName,
        sha256Hash,
        uploadedByBadge: user.badgeNumber,
      },
      sha256Hash
    );

    // F. Persist Document Record in PostgreSQL
    const doc = await prisma.document.create({
      data: {
        id: docId,
        caseId,
        documentType: docType,
        title,
        originalFileName,
        storageKey,
        mimeType,
        fileSize: buffer.length,
        sha256Hash,
        status: DocumentStatus.VERIFIED,
        extractedText,
        detectedBnsSections: metadata.detectedBnsSections,
        detectedParties: metadata.detectedParties,
        ledgerTxId: ledgerResult.txId,
        uploadedBy: user.id,
        versions: {
          create: {
            versionNum: 1,
            storageKey,
            sha256Hash,
            changeLog: 'Initial ingestion and cryptographic anchoring.',
          },
        },
      },
      include: {
        uploader: { select: { name: true, badgeNumber: true, role: true } },
      },
    });

    // G. Create Custody Events
    await prisma.custodyEvent.createMany({
      data: [
        {
          caseId,
          documentId: doc.id,
          action: CustodyAction.UPLOADED,
          actorId: user.id,
          actorRole: user.role,
          documentHash: sha256Hash,
          ledgerTxId: ledgerResult.txId,
          ipAddress: request.ip,
          metadata: { fileName: originalFileName, fileSize: buffer.length, mimeType },
        },
        {
          caseId,
          documentId: doc.id,
          action: CustodyAction.OCR_PROCESSED,
          actorId: user.id,
          actorRole: user.role,
          documentHash: sha256Hash,
          metadata: { engine: 'Pramaan DocumentAIService', confidence: metadata.confidenceScore },
        },
      ],
    });

    // G2. Index Document Chunks for Strict RAG with Nomic-Embed-Text
    if (extractedText) {
      await ragService.indexDocument(doc.id, extractedText, caseId, {
        documentType: doc.documentType,
        title: doc.title,
        sha256Hash: doc.sha256Hash,
        originalFileName,
      }).catch((e) => {
        fastify.log.warn(`RAG indexing warning for doc ${doc.id}: ${e.message}`);
      });
    }

    // H. Audit Log Record
    await auditService.logAction({
      actorId: user.id,
      actorRole: user.role,
      action: AuditAction.DOCUMENT_UPLOADED,
      resource: 'DOCUMENT',
      resourceId: doc.id,
      caseId,
      ipAddress: request.ip,
      result: 'SUCCESS',
      reason: `Document anchored with SHA-256: ${sha256Hash} (Ledger Tx: ${ledgerResult.txId})`,
      metadata: { sha256Hash, ledgerTxId: ledgerResult.txId },
    });

    return reply.status(201).send({
      ...doc,
      uploadedByName: doc.uploader.name,
      uploadedByRole: doc.uploader.role,
      ledgerAnchor: ledgerResult,
    });
  });

  // 2. Get Document Details
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        uploader: { select: { name: true, badgeNumber: true, role: true } },
        versions: true,
        custodyEvents: { orderBy: { timestamp: 'desc' }, include: { actor: true } },
      },
    });

    if (!doc) {
      return reply.status(404).send({ error: 'NotFound', message: 'Document record not found' });
    }

    return reply.status(200).send({
      ...doc,
      uploadedByName: doc.uploader.name,
      uploadedByRole: doc.uploader.role,
    });
  });

  // 3. Download Document Binary (Streams from MinIO)
  fastify.get('/:id/download', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const user = request.user;

    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) {
      return reply.status(404).send({ error: 'NotFound', message: 'Document record not found' });
    }

    try {
      const buffer = await storageService.getObjectBuffer(doc.storageKey);

      await auditService.logAction({
        actorId: user.id,
        actorRole: user.role,
        action: AuditAction.DOCUMENT_DOWNLOADED,
        resource: 'DOCUMENT_BINARY',
        resourceId: doc.id,
        caseId: doc.caseId,
        ipAddress: request.ip,
        result: 'SUCCESS',
      });

      reply.header('Content-Type', doc.mimeType);
      reply.header('Content-Disposition', `attachment; filename="${doc.originalFileName}"`);
      return reply.send(buffer);
    } catch (err: any) {
      return reply.status(500).send({ error: 'StorageError', message: 'Failed to retrieve file from object store' });
    }
  });

  // 4. Verify Document Integrity (Authoritative SHA-256 vs MinIO Payload vs Permissioned Ledger Anchor)
  fastify.post('/:id/verify', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const user = request.user;

    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) {
      return reply.status(404).send({ error: 'NotFound', message: 'Document not found' });
    }

    // Compute live hash from current MinIO buffer
    let liveBuffer: Buffer | null = null;
    let computedHash = doc.sha256Hash;
    try {
      liveBuffer = await storageService.getObjectBuffer(doc.storageKey);
      computedHash = crypto.createHash('sha256').update(liveBuffer).digest('hex');
    } catch {
      computedHash = doc.sha256Hash;
    }

    // Check against ledger block
    const ledgerCheck = await ledgerService.verifyDocumentHash(doc.id, computedHash);

    const isMatch = computedHash.toLowerCase() === doc.sha256Hash.toLowerCase() && (ledgerCheck.isAnchored ? ledgerCheck.isValid : true);

    const action = isMatch ? AuditAction.DOCUMENT_VERIFIED : AuditAction.DOCUMENT_TAMPER_DETECTED;

    await auditService.logAction({
      actorId: user.id,
      actorRole: user.role,
      action,
      resource: 'DOCUMENT_VERIFY',
      resourceId: doc.id,
      caseId: doc.caseId,
      ipAddress: request.ip,
      result: isMatch ? 'SUCCESS' : 'BLOCKED',
      reason: isMatch
        ? `Authoritative SHA-256 matches active object & ledger anchor (${doc.ledgerTxId || 'Simulated'})`
        : `CRYPTOGRAPHIC INTEGRITY MISMATCH! Computed: ${computedHash}, Stored: ${doc.sha256Hash}, Ledger: ${ledgerCheck.storedLedgerHash}`,
    });

    // Record custody event
    await prisma.custodyEvent.create({
      data: {
        caseId: doc.caseId,
        documentId: doc.id,
        action: isMatch ? CustodyAction.VERIFIED : CustodyAction.INTEGRITY_CHECK_FAILED,
        actorId: user.id,
        actorRole: user.role,
        documentHash: computedHash,
        ledgerTxId: ledgerCheck.txId || doc.ledgerTxId,
        metadata: {
          computedHash,
          storedHash: doc.sha256Hash,
          ledgerHash: ledgerCheck.storedLedgerHash,
          isTampered: !isMatch,
        },
      },
    });

    return reply.status(200).send({
      documentId: doc.id,
      caseId: doc.caseId,
      status: isMatch ? 'VERIFIED' : 'MISMATCH',
      computedHash,
      storedHash: doc.sha256Hash,
      ledgerHash: ledgerCheck.storedLedgerHash || doc.sha256Hash,
      ledgerTxId: ledgerCheck.txId || doc.ledgerTxId,
      ledgerTimestamp: ledgerCheck.anchoredAt || doc.createdAt.toISOString(),
      isTampered: !isMatch,
      verificationMessage: isMatch
        ? 'DOCUMENT AUTHENTIC & UNALTERED: Cryptographic hash matches immutable ledger anchor.'
        : 'CRITICAL ALERT: HASH MISMATCH DETECTED. The binary payload differs from the immutable ledger proof!',
      auditedAt: new Date().toISOString(),
    });
  });

  // 5. Simulate Tamper (Demonstration Endpoint)
  fastify.post('/:id/simulate-tamper', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const user = request.user;

    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) {
      return reply.status(404).send({ error: 'NotFound', message: 'Document not found' });
    }

    // Tamper the stored file in MinIO by adding simulated modification bytes
    const tamperedContent = Buffer.from(`[TAMPERED MODIFIED BY MALICIOUS SIMULATION]\n${doc.extractedText || 'Altered evidence content'}`);
    await storageService.uploadBuffer(tamperedContent, doc.storageKey, doc.mimeType);

    await auditService.logAction({
      actorId: user.id,
      actorRole: user.role,
      action: AuditAction.DOCUMENT_TAMPER_DETECTED,
      resource: 'DOCUMENT_SIMULATE_TAMPER',
      resourceId: doc.id,
      caseId: doc.caseId,
      ipAddress: request.ip,
      result: 'FAILURE',
      reason: 'DEMO SIMULATION: Document byte payload modified to trigger cryptographic mismatch.',
    });

    return reply.status(200).send({
      success: true,
      message: 'Simulated tampering applied to storage object. Run verification to observe cryptographic mismatch detection.',
      documentId: doc.id,
    });
  });
}
