import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/server';
import { prisma } from '../src/config/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Role } from '@prisma/client';

describe('Pramaan Offline Sync Suite: Idempotency and Deduplication', () => {
  let app: FastifyInstance;
  let whdoToken: string;
  const testIdempotencyKey = `IDEM-KEY-${crypto.randomBytes(6).toString('hex')}`;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    const pass = await bcrypt.hash('TestPass123!', 10);
    const whdoUser = await prisma.user.upsert({
      where: { email: 'sync_whdo@example.gov' },
      update: {},
      create: {
        email: 'sync_whdo@example.gov',
        passwordHash: pass,
        name: 'Field Help Desk Officer',
        badgeNumber: 'SYNC-WHD-12',
        department: 'Women Help Desk',
        jurisdiction: 'Metro Division',
        role: Role.WOMEN_HELP_DESK_OFFICER,
      },
    });

    whdoToken = app.jwt.sign({ id: whdoUser.id, email: whdoUser.email, role: whdoUser.role });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('First sync attempt creates record, anchors in ledger, returns SYNCED', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/sync',
      headers: { authorization: `Bearer ${whdoToken}` },
      payload: {
        items: [
          {
            localId: 'local-record-001',
            idempotencyKey: testIdempotencyKey,
            operation: 'CREATE_FIELD_RECORD',
            payload: {
              caseTitle: 'Field Domestic Dispute Report',
              title: 'Spot Deposition Record',
              fileName: 'spot_deposition.pdf',
              mimeType: 'application/pdf',
              documentType: 'WITNESS_STATEMENT',
              statementText: 'Complainant statement recorded at field outpost.',
              capturedAt: new Date().toISOString(),
              capturedLocation: 'Field Outpost Point 4',
              bnsSections: ['BNS 85', 'BNS 351'],
              fileSize: 120,
            },
            createdAt: new Date().toISOString(),
            retryCount: 0,
            status: 'QUEUED',
          },
        ],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.processedCount).toBe(1);
    expect(body.results[0].status).toBe('SYNCED');
    expect(body.results[0].serverRecordId).toBeDefined();
  });

  it('Repeated sync submission with identical idempotencyKey prevents duplicates', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/sync',
      headers: { authorization: `Bearer ${whdoToken}` },
      payload: {
        items: [
          {
            localId: 'local-record-001',
            idempotencyKey: testIdempotencyKey,
            operation: 'CREATE_FIELD_RECORD',
            payload: {
              title: 'Spot Deposition Record',
              fileName: 'spot_deposition.pdf',
              mimeType: 'application/pdf',
              documentType: 'WITNESS_STATEMENT',
              fileSize: 120,
              capturedAt: new Date().toISOString(),
              bnsSections: ['BNS 85'],
            },
            createdAt: new Date().toISOString(),
            retryCount: 1,
            status: 'QUEUED',
          },
        ],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results[0].status).toBe('SYNCED');

    // Confirm that only 1 sync record exists in DB for this key
    const count = await prisma.syncRecord.count({
      where: { idempotencyKey: testIdempotencyKey },
    });
    expect(count).toBe(1);
  });
});
