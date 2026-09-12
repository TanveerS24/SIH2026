import { z } from 'zod';
import { RoleEnum } from './roles.js';

export const AuditActionEnum = z.enum([
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'MFA_VERIFIED',
  'LOGOUT',
  'CASE_CREATED',
  'CASE_VIEWED',
  'DOCUMENT_UPLOADED',
  'DOCUMENT_VIEWED',
  'DOCUMENT_DOWNLOADED',
  'DOCUMENT_VERIFIED',
  'DOCUMENT_TAMPER_DETECTED',
  'DOCUMENT_SIGNED',
  'DOCUMENT_REDACTED',
  'CHARGE_SHEET_FILED',
  'CHARGE_SHEET_ATTEMPT_BLOCKED',
  'SEARCH_PERFORMED',
  'ACCESS_REQUEST_SUBMITTED',
  'ACCESS_REQUEST_APPROVED',
  'ACCESS_REQUEST_DENIED',
  'ELEVATED_CASE_ACCESS_UTILIZED',
]);

export type AuditAction = z.infer<typeof AuditActionEnum>;

export const AuditLogSchema = z.object({
  id: z.string(),
  actorId: z.string(),
  actorName: z.string(),
  actorRole: RoleEnum,
  action: AuditActionEnum,
  resource: z.string(),
  resourceId: z.string().nullable().optional(),
  caseId: z.string().nullable().optional(),
  caseNumber: z.string().nullable().optional(),
  timestamp: z.string(),
  ipAddress: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  result: z.enum(['SUCCESS', 'DENIED', 'FAILURE', 'BLOCKED']),
  reason: z.string().nullable().optional(),
  metadata: z.record(z.any()).nullable().optional(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;
