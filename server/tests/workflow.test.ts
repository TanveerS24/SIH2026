import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/server';
import { prisma } from '../src/config/prisma';
import bcrypt from 'bcrypt';
import { Role, CasePriority, SensitivityLevel, CaseStatus } from '@prisma/client';

describe('Pramaan Workflow Suite: Charge-Sheet Server Enforcement', () => {
  let app: FastifyInstance;
  let ioToken: string;
  let workflowCaseId: string;
  let unsatisfiedReqId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    const pass = await bcrypt.hash('TestPass123!', 10);
    const ioUser = await prisma.user.upsert({
      where: { email: 'workflow_io@example.gov' },
      update: {},
      create: {
        email: 'workflow_io@example.gov',
        passwordHash: pass,
        name: 'Workflow Inspector',
        badgeNumber: 'WF-IO-101',
        department: 'Crime Division',
        jurisdiction: 'Metro Division',
        role: Role.INVESTIGATION_OFFICER,
      },
    });

    await prisma.case.deleteMany({ where: { caseNumber: 'TEST-WF-CASE-001' } });

    const wfCase = await prisma.case.create({
      data: {
        caseNumber: 'TEST-WF-CASE-001',
        title: 'State vs Test Accused (Workflow Filing Test)',
        description: 'Testing charge-sheet statutory gatekeeping.',
        jurisdiction: 'Metro Division',
        policeStation: 'Metro AWPS',
        bnsSections: ['BNS 64', 'BNS 70'],
        priority: CasePriority.HIGH,
        sensitivity: SensitivityLevel.HIGHLY_SENSITIVE,
        status: CaseStatus.UNDER_INVESTIGATION,
        incidentLocation: 'Sector 5 Hub',
        assignments: {
          create: { userId: ioUser.id, role: Role.INVESTIGATION_OFFICER },
        },
        workflowRequirements: {
          create: [
            {
              type: 'FORENSIC_REPORT',
              title: 'Forensic Lab Extraction',
              description: 'Digital forensics evidence.',
              isSatisfied: true,
              mandatoryForFiling: true,
            },
            {
              type: 'WITNESS_STATEMENT',
              title: 'BNSS Section 180 Witness Statement',
              description: 'Deposition of spot witness.',
              isSatisfied: true,
              mandatoryForFiling: true,
            },
            {
              type: 'REQUIRED_SIGNATURES',
              title: 'Supervisory ACP Endorsement',
              description: 'Supervisory sign-off.',
              isSatisfied: false, // Incomplete prerequisite!
              mandatoryForFiling: true,
            },
          ],
        },
      },
      include: { workflowRequirements: true },
    });

    workflowCaseId = wfCase.id;
    unsatisfiedReqId = wfCase.workflowRequirements.find((r) => !r.isSatisfied)!.id;
    ioToken = app.jwt.sign({ id: ioUser.id, email: ioUser.email, role: ioUser.role });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('Premature filing attempt is blocked by backend with 409 Conflict', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/cases/${workflowCaseId}/file`,
      headers: { authorization: `Bearer ${ioToken}` },
      payload: {
        filingNotes: 'Attempting early submission without ACP signature.',
        designatedCourt: 'City Sessions Fast Track Court',
        prosecutorConfirmation: true,
      },
    });

    expect(res.statusCode).toBe(409);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('WorkflowIncomplete');
    expect(body.missingRequirements).toContain('Supervisory ACP Endorsement');
  });

  it('Satisfying missing requirement unlocks filing capability', async () => {
    const satisfyRes = await app.inject({
      method: 'POST',
      url: `/cases/${workflowCaseId}/workflow/satisfy`,
      headers: { authorization: `Bearer ${ioToken}` },
      payload: {
        requirementId: unsatisfiedReqId,
        notes: 'Signed and endorsed by ACP Cyber Crime.',
      },
    });

    expect(satisfyRes.statusCode).toBe(200);

    // Verify workflow status is now ready
    const statusRes = await app.inject({
      method: 'GET',
      url: `/cases/${workflowCaseId}/workflow`,
      headers: { authorization: `Bearer ${ioToken}` },
    });

    const statusBody = JSON.parse(statusRes.body);
    expect(statusBody.canFile).toBe(true);
    expect(statusBody.progressPercentage).toBe(100);
  });

  it('Filing with all requirements satisfied succeeds, anchors in ledger and updates status', async () => {
    const fileRes = await app.inject({
      method: 'POST',
      url: `/cases/${workflowCaseId}/file`,
      headers: { authorization: `Bearer ${ioToken}` },
      payload: {
        filingNotes: 'Formal charge sheet ready with all statutory forensic and witness attachments.',
        designatedCourt: 'City Sessions Fast Track Court',
        prosecutorConfirmation: true,
      },
    });

    expect(fileRes.statusCode).toBe(200);
    const fileBody = JSON.parse(fileRes.body);
    expect(fileBody.success).toBe(true);
    expect(fileBody.case.status).toBe('FILED');
    expect(fileBody.ledgerRecord.txId).toBeDefined();
  });
});
