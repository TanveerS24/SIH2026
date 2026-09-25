import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/server';
import { prisma } from '../src/config/prisma';
import bcrypt from 'bcrypt';
import { Role, CasePriority, SensitivityLevel, CaseStatus } from '@prisma/client';

describe('Pramaan Security Suite: RBAC Enforcement', () => {
  let app: FastifyInstance;
  let ioToken: string;
  let judgeToken: string;
  let analystToken: string;
  let testCaseId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    // Create unique mock users and tokens for testing
    const pass = await bcrypt.hash('TestPass123!', 10);

    const testIO = await prisma.user.upsert({
      where: { email: 'test_io@example.gov' },
      update: {},
      create: {
        email: 'test_io@example.gov',
        passwordHash: pass,
        name: 'Test IO Officer',
        badgeNumber: 'TEST-IO-999',
        department: 'Special Unit',
        jurisdiction: 'District North',
        role: Role.INVESTIGATION_OFFICER,
      },
    });

    const testJudge = await prisma.user.upsert({
      where: { email: 'test_judge@example.gov' },
      update: {},
      create: {
        email: 'test_judge@example.gov',
        passwordHash: pass,
        name: 'Test Magistrate',
        badgeNumber: 'TEST-JUD-888',
        department: 'Sessions Court',
        jurisdiction: 'District North',
        role: Role.JUDGE,
      },
    });

    const testAnalyst = await prisma.user.upsert({
      where: { email: 'test_analyst@example.gov' },
      update: {},
      create: {
        email: 'test_analyst@example.gov',
        passwordHash: pass,
        name: 'Test Analyst',
        badgeNumber: 'TEST-STAT-777',
        department: 'NCRB Research',
        jurisdiction: 'National HQ',
        role: Role.NCRB_ANALYST,
      },
    });

    const testProsecutor = await prisma.user.upsert({
      where: { email: 'test_prosecutor@example.gov' },
      update: {},
      create: {
        email: 'test_prosecutor@example.gov',
        passwordHash: pass,
        name: 'Test Prosecutor',
        badgeNumber: 'TEST-PROS-666',
        department: 'Directorate of Prosecution',
        jurisdiction: 'District North',
        role: Role.PROSECUTOR,
      },
    });

    const testWHDO = await prisma.user.upsert({
      where: { email: 'test_whdo@example.gov' },
      update: {},
      create: {
        email: 'test_whdo@example.gov',
        passwordHash: pass,
        name: 'Test WHDO Officer',
        badgeNumber: 'TEST-WHDO-555',
        department: 'Women Help Desk PS',
        jurisdiction: 'District North',
        role: Role.WOMEN_HELP_DESK_OFFICER,
      },
    });

    // Create a restricted case assigned strictly to District South
    const testCase = await prisma.case.upsert({
      where: { caseNumber: 'TEST-CASE-RBAC-001' },
      update: {},
      create: {
        caseNumber: 'TEST-CASE-RBAC-001',
        title: 'Confidential Evidence Record',
        description: 'Testing RBAC case boundary access enforcement.',
        jurisdiction: 'District South', // Deliberate mismatch with testIO (District North)
        policeStation: 'South Awps',
        bnsSections: ['BNS 70'],
        priority: CasePriority.HIGH,
        sensitivity: SensitivityLevel.HIGHLY_SENSITIVE,
        status: CaseStatus.UNDER_INVESTIGATION,
        incidentLocation: 'South Sector Point B',
      },
    });
    testCaseId = testCase.id;

    // Generate JWTs
    ioToken = app.jwt.sign({ id: testIO.id, email: testIO.email, role: testIO.role });
    judgeToken = app.jwt.sign({ id: testJudge.id, email: testJudge.email, role: testJudge.role });
    analystToken = app.jwt.sign({ id: testAnalyst.id, email: testAnalyst.email, role: testAnalyst.role });
    const prosecutorToken = app.jwt.sign({ id: testProsecutor.id, email: testProsecutor.email, role: testProsecutor.role });
    const whdoToken = app.jwt.sign({ id: testWHDO.id, email: testWHDO.email, role: testWHDO.role });
    (global as any).__prosecutorToken = prosecutorToken;
    (global as any).__whdoToken = whdoToken;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('IO: denied access to unrelated unassigned case in differing jurisdiction', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/cases/${testCaseId}`,
      headers: { authorization: `Bearer ${ioToken}` },
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Forbidden');
  });

  it('Judge: denied mutation / write operations on case files', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/cases',
      headers: { authorization: `Bearer ${judgeToken}` },
      payload: {
        caseNumber: 'ILLEGAL-JUDGE-MUTATION',
        title: 'Should be rejected',
        description: 'Judges cannot create or alter cases.',
        jurisdiction: 'District North',
        policeStation: 'North PS',
        bnsSections: ['BNS 70'],
        incidentLocation: 'Court Room',
      },
    });

    expect(res.statusCode).toBe(403);
  });

  it('NCRB Analyst: denied individual case scrutiny without elevated access request', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/cases/${testCaseId}`,
      headers: { authorization: `Bearer ${analystToken}` },
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.message).toContain('restricted to aggregate statistics');
  });

  it('NCRB Analyst: permitted access to aggregate statistics overview', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/analytics/overview',
      headers: { authorization: `Bearer ${analystToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.states).toBeDefined();
    expect(body.disclaimer).toContain('OFFICIAL SYSTEM TELEMETRY');
  });

  it('Audit Trail: IO and WHDO denied global audit trail access (403)', async () => {
    const resIO = await app.inject({
      method: 'GET',
      url: '/audit',
      headers: { authorization: `Bearer ${ioToken}` },
    });
    expect(resIO.statusCode).toBe(403);

    const resWHDO = await app.inject({
      method: 'GET',
      url: '/audit',
      headers: { authorization: `Bearer ${(global as any).__whdoToken}` },
    });
    expect(resWHDO.statusCode).toBe(403);
  });

  it('Audit Trail: Judge, Prosecutor, and Analyst permitted global audit trail access (200)', async () => {
    const resJudge = await app.inject({
      method: 'GET',
      url: '/audit',
      headers: { authorization: `Bearer ${judgeToken}` },
    });
    expect(resJudge.statusCode).toBe(200);

    const resPros = await app.inject({
      method: 'GET',
      url: '/audit',
      headers: { authorization: `Bearer ${(global as any).__prosecutorToken}` },
    });
    expect(resPros.statusCode).toBe(200);

    const resAnalyst = await app.inject({
      method: 'GET',
      url: '/audit',
      headers: { authorization: `Bearer ${analystToken}` },
    });
    expect(resAnalyst.statusCode).toBe(200);
  });

  it('Document Ingestion: Judge, Prosecutor, and Analyst denied uploading raw evidence (403)', async () => {
    const resJudge = await app.inject({
      method: 'POST',
      url: '/documents/upload',
      headers: { authorization: `Bearer ${judgeToken}` },
      payload: { caseId: testCaseId, fileBase64: 'dGVzdA==' },
    });
    expect(resJudge.statusCode).toBe(403);

    const resPros = await app.inject({
      method: 'POST',
      url: '/documents/upload',
      headers: { authorization: `Bearer ${(global as any).__prosecutorToken}` },
      payload: { caseId: testCaseId, fileBase64: 'dGVzdA==' },
    });
    expect(resPros.statusCode).toBe(403);

    const resAnalyst = await app.inject({
      method: 'POST',
      url: '/documents/upload',
      headers: { authorization: `Bearer ${analystToken}` },
      payload: { caseId: testCaseId, fileBase64: 'dGVzdA==' },
    });
    expect(resAnalyst.statusCode).toBe(403);
  });

  it('Workflow: Prosecutor denied filing formal charge sheet under BNSS Sec 193 (403)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/cases/${testCaseId}/file`,
      headers: { authorization: `Bearer ${(global as any).__prosecutorToken}` },
      payload: { filingNotes: 'Prosecutor trying to file', designatedCourt: 'Sessions Court' },
    });
    expect(res.statusCode).toBe(403);
  });
});
