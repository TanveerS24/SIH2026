import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/prisma.js';
import { ragService } from '../../services/rag.service.js';
import { auditService } from '../../services/audit.service.js';
import { AuditAction } from '@prisma/client';

export async function searchRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get('/', async (request: FastifyRequest<{ Querystring: { q?: string; section?: string; jurisdiction?: string } }>, reply: FastifyReply) => {
    const { q, section, jurisdiction } = request.query;
    const user = request.user;
    const searchQuery = (q || '').trim();

    if (!searchQuery && !section && !jurisdiction) {
      return reply.status(200).send({
        query: '',
        matchingCases: [],
        matchingDocuments: [],
        aiSummary: 'Enter keywords, case numbers, statutory sections, or location references to query the digital evidence archive.',
      });
    }

    // 1. Search Cases
    const caseWhere: any = {};
    if (searchQuery) {
      caseWhere.OR = [
        { caseNumber: { contains: searchQuery, mode: 'insensitive' } },
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
        { incidentLocation: { contains: searchQuery, mode: 'insensitive' } },
        { suspects: { hasSome: [searchQuery] } },
      ];
    }
    if (section) {
      caseWhere.bnsSections = { hasSome: [section] };
    }
    if (jurisdiction) {
      caseWhere.jurisdiction = { contains: jurisdiction, mode: 'insensitive' };
    }

    const matchingCases = await prisma.case.findMany({
      where: caseWhere,
      take: 20,
      include: {
        _count: { select: { documents: true } },
      },
    });

    // 2. Search Documents (Extracted OCR Text + Title + File Name)
    const docWhere: any = {};
    if (searchQuery) {
      docWhere.OR = [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { originalFileName: { contains: searchQuery, mode: 'insensitive' } },
        { extractedText: { contains: searchQuery, mode: 'insensitive' } },
        { sha256Hash: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    const matchingDocuments = await prisma.document.findMany({
      where: docWhere,
      take: 20,
      include: {
        case: { select: { caseNumber: true, title: true } },
        uploader: { select: { name: true, badgeNumber: true } },
      },
    });

    // 3. AI Strict RAG Grounded Summary
    let aiSummary = '';
    let citedEvidence: any[] = [];
    let isGrounded = false;

    if (searchQuery) {
      try {
        const ragResult = await ragService.query(searchQuery, { topK: 4 });
        aiSummary = ragResult.answer;
        citedEvidence = ragResult.citedEvidence;
        isGrounded = ragResult.isGrounded;
      } catch (err: any) {
        aiSummary = `Query '${searchQuery}' returned ${matchingCases.length} registered case(s) and ${matchingDocuments.length} document record(s).`;
      }
    }

    // Log search in audit
    await auditService.logAction({
      actorId: user.id,
      actorRole: user.role,
      action: AuditAction.SEARCH_PERFORMED,
      resource: 'SEARCH',
      ipAddress: request.ip,
      result: 'SUCCESS',
      reason: `Query: "${searchQuery}"`,
      metadata: { query: searchQuery, casesFound: matchingCases.length, docsFound: matchingDocuments.length },
    });

    return reply.status(200).send({
      query: searchQuery,
      caseCount: matchingCases.length,
      documentCount: matchingDocuments.length,
      matchingCases: matchingCases.map((c) => ({
        id: c.id,
        caseNumber: c.caseNumber,
        title: c.title,
        status: c.status,
        jurisdiction: c.jurisdiction,
        bnsSections: c.bnsSections,
        incidentLocation: c.incidentLocation,
        documentCount: c._count.documents,
        createdAt: c.createdAt.toISOString(),
      })),
      matchingDocuments: matchingDocuments.map((d) => ({
        id: d.id,
        caseId: d.caseId,
        caseNumber: d.case.caseNumber,
        documentType: d.documentType,
        title: d.title,
        sha256Hash: d.sha256Hash,
        status: d.status,
        uploaderName: d.uploader.name,
        createdAt: d.createdAt.toISOString(),
      })),
      aiSummary,
      citedEvidence,
      isGrounded,
      aiNotice: 'Strict RAG advisory digest sourced strictly from verified custody exhibits under BSA 2023.',
    });
  });
}
