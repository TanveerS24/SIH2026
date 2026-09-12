import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/server';
import { prisma } from '../src/config/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Role, CasePriority, SensitivityLevel, CaseStatus, DocumentType } from '@prisma/client';

describe('Pramaan Cryptographic Integrity Suite', () => {
  let app: FastifyInstance;
  let ioToken: string;
  let testDocId: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    const pass = await bcrypt.hash('TestPass123!', 10);
    const ioUser = await prisma.user.upsert({
      where: { email: 'crypto_io@example.gov' },
      update: {},
      create: {
        email: 'crypto_io@example.gov',
        passwordHash: pass,
        name: 'Forensic Officer',
        badgeNumber: 'FO-991',
        department: 'Forensic Wing',
        jurisdiction: 'District Central',
        role: Role.INVESTIGATION_OFFICER,
      },
    });

    const c = await prisma.case.upsert({
      where: { caseNumber: 'TEST-CRYPTO-CASE-001' },
      update: {},
      create: {
        caseNumber: 'TEST-CRYPTO-CASE-001',
        title: 'Tamper Verification Test Case',
        description: 'Testing authoritative SHA-256 verification and tampering alerts.',
        jurisdiction: 'District Central',
        policeStation: 'Central AWPS',
        bnsSections: ['BNS 70'],
        priority: CasePriority.HIGH,
        sensitivity: SensitivityLevel.HIGHLY_SENSITIVE,
        status: CaseStatus.UNDER_INVESTIGATION,
        incidentLocation: 'Central Station',
        assignments: {
          create: { userId: ioUser.id, role: Role.INVESTIGATION_OFFICER },
        },
      },
    });

    ioToken = app.jwt.sign({ id: ioUser.id, email: ioUser.email, role: ioUser.role });

    // Upload an authentic document through API
    const sampleText = 'OFFICIAL SEIZURE MEMO: iPhone 14 Pro Serial #992100812 recovered at scene.';
    const uploadRes = await app.inject({
      method: 'POST',
      url: '/documents/upload',
      headers: { authorization: `Bearer ${ioToken}` },
      payload: {
        caseId: c.id,
        title: 'Seizure Memo for Mobile Handset',
        fileName: 'Seizure_Memo_Mobile.pdf',
        mimeType: 'application/pdf',
        documentType: 'SEIZURE_MEMO',
        fileBase64: Buffer.from(sampleText).toString('base64'),
      },
    });

    const uploadBody = JSON.parse(uploadRes.body);
    testDocId = uploadBody.id;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('Authentic unaltered document verifies successfully with VERIFIED status', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/documents/${testDocId}/verify`,
      headers: { authorization: `Bearer ${ioToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('VERIFIED');
    expect(body.isTampered).toBe(false);
    expect(body.storedHash).toBe(body.computedHash);
  });

  it('Simulating tampering immediately triggers MISMATCH and integrity alert', async () => {
    // 1. Simulate tampering
    const tamperRes = await app.inject({
      method: 'POST',
      url: `/documents/${testDocId}/simulate-tamper`,
      headers: { authorization: `Bearer ${ioToken}` },
    });
    expect(tamperRes.statusCode).toBe(200);

    // 2. Run verification
    const verifyRes = await app.inject({
      method: 'POST',
      url: `/documents/${testDocId}/verify`,
      headers: { authorization: `Bearer ${ioToken}` },
    });

    expect(verifyRes.statusCode).toBe(200);
    const verifyBody = JSON.parse(verifyRes.body);
    expect(verifyBody.status).toBe('MISMATCH');
    expect(verifyBody.isTampered).toBe(true);
    expect(verifyBody.verificationMessage).toContain('HASH MISMATCH DETECTED');
  });
});
