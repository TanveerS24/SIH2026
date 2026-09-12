import { z } from 'zod';
import { RoleEnum } from './roles.js';

export const CustodyActionEnum = z.enum([
  'UPLOADED',
  'MALWARE_SCANNED',
  'OCR_PROCESSED',
  'REVIEWED',
  'SIGNED',
  'VERIFIED',
  'INTEGRITY_CHECK_FAILED',
  'SHARED',
  'DOWNLOADED',
  'REDACTED',
  'FILED',
  'ACCESS_REQUESTED',
  'ACCESS_GRANTED',
  'ACCESS_DENIED',
]);

export type CustodyAction = z.infer<typeof CustodyActionEnum>;

export const CustodyEventSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  documentId: z.string().nullable().optional(),
  action: CustodyActionEnum,
  actorId: z.string(),
  actorName: z.string(),
  actorRole: RoleEnum,
  actorBadge: z.string().optional(),
  timestamp: z.string(),
  documentHash: z.string().nullable().optional(),
  previousHash: z.string().nullable().optional(),
  ledgerTxId: z.string().nullable().optional(),
  metadata: z.record(z.any()).nullable().optional(),
  ipAddress: z.string().nullable().optional(),
});

export type CustodyEvent = z.infer<typeof CustodyEventSchema>;
