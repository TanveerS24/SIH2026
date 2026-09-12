import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../config/prisma.js';
import { auditService } from '../../services/audit.service.js';
import { checkCaseAccess, requireRoles } from '../../plugins/rbac.plugin.js';
import { Role, AuditAction, CaseStatus, CasePriority, SensitivityLevel } from '@prisma/client';
import { CreateCaseSchema } from '@pramaan/shared-types';

export async function casesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // 1. List Cases Register
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    let where: any = {};

    if (user.role === Role.INVESTIGATION_OFFICER) {
      where = {
        OR: [
          { assignments: { some: { userId: user.id } } },
          { jurisdiction: user.jurisdiction },
        ],
      };
    } else if (user.role === Role.WOMEN_HELP_DESK_OFFICER) {
      where = {
        OR: [
          { documents: { some: { uploadedBy: user.id } } },
          { jurisdiction: user.jurisdiction },
        ],
      };
    } else if (user.role === Role.PROSECUTOR) {
      // Prosecutors view filed cases or cases explicitly assigned
      where = {
        OR: [
          { isFiled: true },
          { assignments: { some: { userId: user.id } } },
          { status: { in: [CaseStatus.CHARGE_SHEET_PREPARED, CaseStatus.FILED, CaseStatus.JUDICIAL_PROCEEDINGS] } },
        ],
      };
    } else if (user.role === Role.JUDGE) {
      // Judicial scrutiny
      where = { isFiled: true };
    } else if (user.role === Role.NCRB_ANALYST) {
      // Analysts see high-level metadata (names redacted)
      where = {};
    }

    const cases = await prisma.case.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { documents: true, custodyEvents: true },
        },
        assignments: {
          include: { user: { select: { name: true, badgeNumber: true, role: true } } },
        },
      },
    });

    const formatted = cases.map((c) => {
      const assignedIO = c.assignments.find((a) => a.role === Role.INVESTIGATION_OFFICER);
      const isAnalyst = user.role === Role.NCRB_ANALYST;

      return {
        id: c.id,
        caseNumber: c.caseNumber,
        title: c.title,
        status: c.status,
        priority: c.priority,
        sensitivity: c.sensitivity,
        jurisdiction: c.jurisdiction,
        policeStation: c.policeStation,
        bnsSections: c.bnsSections,
        incidentDate: c.incidentDate?.toISOString() ?? null,
        incidentLocation: isAnalyst ? 'REDACTED (DISTRICT LEVEL ONLY)' : c.incidentLocation,
        documentCount: c._count.documents,
        custodyCount: c._count.custodyEvents,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        assignedOfficerName: assignedIO?.user.name ?? 'Unassigned',
      };
    });

    return reply.status(200).send(formatted);
  });

  // 2. Get Single Case File
  fastify.get('/:id', { preHandler: [checkCaseAccess as any] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const user = request.user;

    const caseRecord = await prisma.case.findUnique({
      where: { id },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
          include: {
            uploader: { select: { name: true, badgeNumber: true, role: true } },
          },
        },
        assignments: {
          include: { user: { select: { id: true, name: true, badgeNumber: true, role: true } } },
        },
        workflowRequirements: {
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { custodyEvents: true, auditLogs: true },
        },
      },
    });

    if (!caseRecord) {
      return reply.status(404).send({ error: 'NotFound', message: 'Case record not found' });
    }

    await auditService.logAction({
      actorId: user.id,
      actorRole: user.role,
      action: AuditAction.CASE_VIEWED,
      resource: 'CASE',
      resourceId: caseRecord.id,
      caseId: caseRecord.id,
      ipAddress: request.ip,
      result: 'SUCCESS',
      reason: `Case ${caseRecord.caseNumber} inspected by ${user.role}`,
    });

    // Privacy Redaction for Sensitive & Protected Records
    const shouldRedactVictim = user.role === Role.NCRB_ANALYST || user.role === Role.WOMEN_HELP_DESK_OFFICER;

    return reply.status(200).send({
      ...caseRecord,
      victimName: shouldRedactVictim ? '████████████ (PROTECTED)' : caseRecord.victimName,
      victimAge: shouldRedactVictim ? null : caseRecord.victimAge,
      documents: caseRecord.documents.map((d) => ({
        ...d,
        uploadedByName: d.uploader.name,
        uploadedByRole: d.uploader.role,
      })),
    });
  });

  // 3. Create Case
  fastify.post(
    '/',
    { preHandler: [requireRoles([Role.INVESTIGATION_OFFICER, Role.WOMEN_HELP_DESK_OFFICER])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parseResult = CreateCaseSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: 'Validation', message: parseResult.error.errors[0]?.message });
      }

      const data = parseResult.data;
      const user = request.user;

      const newCase = await prisma.case.create({
        data: {
          caseNumber: data.caseNumber,
          title: data.title,
          description: data.description,
          firNumber: data.firNumber,
          firDate: data.firDate ? new Date(data.firDate) : new Date(),
          jurisdiction: data.jurisdiction,
          policeStation: data.policeStation,
          bnsSections: data.bnsSections,
          priority: data.priority as CasePriority,
          sensitivity: data.sensitivity as SensitivityLevel,
          status: CaseStatus.UNDER_INVESTIGATION,
          incidentDate: data.incidentDate ? new Date(data.incidentDate) : new Date(),
          incidentLocation: data.incidentLocation,
          victimName: data.victimName,
          victimAge: data.victimAge,
          suspects: data.suspects,
          assignments: {
            create: {
              userId: user.id,
              role: user.role,
            },
          },
          workflowRequirements: {
            create: [
              {
                type: 'FORENSIC_REPORT',
                title: 'State Forensic Science Laboratory (FSL) Report',
                description: 'Certified scientific report / digital extraction analysis.',
                isSatisfied: false,
                mandatoryForFiling: true,
              },
              {
                type: 'WITNESS_STATEMENT',
                title: 'Recorded Witness Statements & Depositions (BNSS Sec 180)',
                description: 'Independent eyewitness testimonies or spot Panchnama.',
                isSatisfied: false,
                mandatoryForFiling: true,
              },
              {
                type: 'REQUIRED_SIGNATURES',
                title: 'Supervisory Officer Endorsement & Signatures',
                description: 'Digital seal from Senior Inspector or ACP.',
                isSatisfied: false,
                mandatoryForFiling: true,
              },
              {
                type: 'EVIDENCE_METADATA',
                title: 'Cryptographic Document Hashing & Ledger Anchors',
                description: 'All exhibits verified and anchored to audit ledger.',
                isSatisfied: false,
                mandatoryForFiling: true,
              },
              {
                type: 'OFFICER_VERIFICATION',
                title: 'Investigating Officer Case Verification',
                description: 'Officer verification of charge sheet readiness.',
                isSatisfied: false,
                mandatoryForFiling: true,
              },
            ],
          },
        },
      });

      await auditService.logAction({
        actorId: user.id,
        actorRole: user.role,
        action: AuditAction.CASE_CREATED,
        resource: 'CASE',
        resourceId: newCase.id,
        caseId: newCase.id,
        ipAddress: request.ip,
        result: 'SUCCESS',
        reason: `New case registered: ${newCase.caseNumber}`,
      });

      return reply.status(201).send(newCase);
    }
  );

  // 4. Cross-Case Intelligence Linkages
  fastify.get('/:id/relationships', { preHandler: [checkCaseAccess as any] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const currentCase = await prisma.case.findUnique({ where: { id } });
    if (!currentCase) {
      return reply.status(404).send({ error: 'NotFound', message: 'Case not found' });
    }

    // Search for other cases sharing suspects, location keywords, or sections
    const allOtherCases = await prisma.case.findMany({
      where: { id: { not: id } },
      include: { assignments: { include: { user: true } } },
    });

    const links: any[] = [];

    for (const other of allOtherCases) {
      const sharedSuspects = currentCase.suspects.filter((s) => other.suspects.includes(s));
      const hasSharedLocation =
        currentCase.incidentLocation.toLowerCase().includes('t. nagar') &&
        other.incidentLocation.toLowerCase().includes('t. nagar');

      const sharedSections = currentCase.bnsSections.filter((sec) => other.bnsSections.includes(sec));

      if (sharedSuspects.length > 0 || hasSharedLocation || sharedSections.length >= 2) {
        links.push({
          targetCaseId: other.id,
          targetCaseNumber: other.caseNumber,
          targetTitle: other.title,
          targetStatus: other.status,
          correlationType: sharedSuspects.length > 0 ? 'SUSPECT_MATCH' : hasSharedLocation ? 'GEOGRAPHIC_PROXIMITY' : 'MODUS_OPERANDI',
          sharedAttributes: {
            suspects: sharedSuspects,
            locationMatch: hasSharedLocation,
            sharedSections,
          },
          confidenceScore: sharedSuspects.length > 0 ? 0.95 : 0.72,
          investigativeNotice: 'INVESTIGATIVE LEAD ONLY — NOT CONCLUSIVE PROOF OF CONNECTION',
        });
      }
    }

    return reply.status(200).send({
      sourceCaseId: id,
      sourceCaseNumber: currentCase.caseNumber,
      relationshipsCount: links.length,
      relationships: links,
    });
  });
}
