import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/prisma.js';
import { ragService } from '../../services/rag.service.js';
import { auditService } from '../../services/audit.service.js';
import { checkCaseAccess, requireRoles } from '../../plugins/rbac.plugin.js';
import { AuditAction, Role } from '@prisma/client';

export async function ragRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  /**
   * Health Check: Verify connectivity to Ollama and model availability
   */
  fastify.get('/health', async (_request: FastifyRequest, reply: FastifyReply) => {
    const health = await ragService.checkHealth();
    return reply.status(200).send(health);
  });

  /**
   * Interactive Strict RAG Query across Evidence Exhibits
   */
  fastify.post(
    '/query',
    async (
      request: FastifyRequest<{
        Body: { query: string; caseId?: string; topK?: number };
      }>,
      reply: FastifyReply
    ) => {
      const { query, caseId, topK } = request.body || {};
      const user = request.user;

      if (!query || typeof query !== 'string' || !query.trim()) {
        return reply.status(400).send({
          error: 'BadRequest',
          message: 'A valid "query" string parameter is required.',
        });
      }

      const result = await ragService.query(query.trim(), {
        caseId: caseId || undefined,
        topK: topK ? Number(topK) : undefined,
      });

      // Audit the AI inquiry for judicial traceability
      await auditService.logAction({
        actorId: user.id,
        actorRole: user.role,
        action: AuditAction.SEARCH_PERFORMED,
        resource: 'RAG_EVIDENCE_QUERY',
        caseId: caseId || null,
        ipAddress: request.ip,
        result: result.isGrounded ? 'SUCCESS' : 'FAILURE',
        reason: `RAG Query: "${query.substring(0, 100)}"`,
        metadata: {
          retrievedChunksCount: result.retrievedChunks.length,
          modelUsed: result.modelUsed,
          latencyMs: result.latencyMs,
          isGrounded: result.isGrounded,
        },
      });

      return reply.status(200).send(result);
    }
  );

  /**
   * Generate Strict RAG Digest for a Case
   */
  fastify.post(
    '/case-digest/:caseId',
    { preHandler: [checkCaseAccess as any] },
    async (
      request: FastifyRequest<{ Params: { caseId: string } }>,
      reply: FastifyReply
    ) => {
      const { caseId } = request.params;
      const user = request.user;

      const digest = await ragService.generateCaseDigest(caseId);

      await auditService.logAction({
        actorId: user.id,
        actorRole: user.role,
        action: AuditAction.SEARCH_PERFORMED,
        resource: 'RAG_CASE_DIGEST',
        caseId,
        ipAddress: request.ip,
        result: 'SUCCESS',
        reason: `Generated Strict RAG Case Digest`,
      });

      return reply.status(200).send({
        caseId,
        digest,
        disclaimer:
          'AI ADVISORY DIGEST — STRICT RAG GROUNDED ON REGISTERED EVIDENCE EXHIBITS UNDER BSA 2023.',
      });
    }
  );

  /**
   * Re-index and chunk an existing document
   */
  fastify.post(
    '/index-document/:documentId',
    { preHandler: [requireRoles([Role.INVESTIGATION_OFFICER, Role.WOMEN_HELP_DESK_OFFICER, Role.PROSECUTOR])] },
    (async (
      request: FastifyRequest<{ Params: { documentId: string } }>,
      reply: FastifyReply
    ) => {
      const { documentId } = request.params;

      const doc = await prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!doc) {
        return reply.status(404).send({
          error: 'NotFound',
          message: `Document ${documentId} not found.`,
        });
      }

      if (!doc.extractedText) {
        return reply.status(400).send({
          error: 'BadRequest',
          message: 'Document contains no extracted OCR text to chunk.',
        });
      }

      const chunkCount = await ragService.indexDocument(
        doc.id,
        doc.extractedText,
        doc.caseId,
        {
          documentType: doc.documentType,
          title: doc.title,
          sha256Hash: doc.sha256Hash,
          originalFileName: doc.originalFileName,
        }
      );

      return reply.status(200).send({
        message: 'Document successfully chunked and embedded in vector store.',
        documentId: doc.id,
        chunksCreated: chunkCount,
      });
    }) as any
  );

  /**
   * List indexed chunks for a document
   */
  fastify.get(
    '/chunks/:documentId',
    async (
      request: FastifyRequest<{ Params: { documentId: string } }>,
      reply: FastifyReply
    ) => {
      const { documentId } = request.params;

      const chunks = await prisma.documentChunk.findMany({
        where: { documentId },
        orderBy: { chunkIndex: 'asc' },
        select: {
          id: true,
          chunkIndex: true,
          content: true,
          startChar: true,
          endChar: true,
          tokenCount: true,
          createdAt: true,
          metadata: true,
        },
      });

      return reply.status(200).send({
        documentId,
        chunkCount: chunks.length,
        chunks,
      });
    }
  );
}
