import { z } from 'zod';

export const DocumentTypeEnum = z.enum([
  'FIR',
  'WITNESS_STATEMENT',
  'VICTIM_STATEMENT',
  'FORENSIC_REPORT',
  'MEDICAL_EXAM_REPORT',
  'SEIZURE_MEMO',
  'PHOTOGRAPHIC_EVIDENCE',
  'CHARGE_SHEET',
  'PANCHNAMA',
  'SUPPLEMENTARY_REPORT',
]);

export type DocumentType = z.infer<typeof DocumentTypeEnum>;

export const DocumentStatusEnum = z.enum([
  'PENDING_SCAN',
  'SCAN_PASSED',
  'SCAN_FLAGGED',
  'OCR_PROCESSED',
  'VERIFIED',
  'TAMPER_FLAGGED',
  'REDACTED',
  'ARCHIVED',
]);

export type DocumentStatus = z.infer<typeof DocumentStatusEnum>;

export const DocumentSummarySchema = z.object({
  id: z.string(),
  caseId: z.string(),
  documentType: DocumentTypeEnum,
  title: z.string(),
  originalFileName: z.string(),
  storageKey: z.string(),
  mimeType: z.string(),
  fileSize: z.number(),
  sha256Hash: z.string(),
  status: DocumentStatusEnum,
  uploadedBy: z.string(),
  uploadedByName: z.string().optional(),
  uploadedByRole: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  extractedText: z.string().nullable().optional(),
  detectedBnsSections: z.array(z.string()).optional(),
  detectedParties: z.record(z.any()).nullable().optional(),
  ledgerTxId: z.string().nullable().optional(),
  isVerified: z.boolean().default(false),
});

export type DocumentSummary = z.infer<typeof DocumentSummarySchema>;

export const VerifyDocumentResponseSchema = z.object({
  documentId: z.string(),
  caseId: z.string(),
  status: z.enum(['VERIFIED', 'MISMATCH', 'NOT_ANCHORED']),
  computedHash: z.string(),
  storedHash: z.string(),
  ledgerHash: z.string().nullable(),
  ledgerTxId: z.string().nullable(),
  ledgerTimestamp: z.string().nullable(),
  isTampered: z.boolean(),
  verificationMessage: z.string(),
  auditedAt: z.string(),
});

export type VerifyDocumentResponse = z.infer<typeof VerifyDocumentResponseSchema>;
