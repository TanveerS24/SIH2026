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
    expect(body.disclaimer).toContain('DEMONSTRATION DATA');
  });
});
