import { z } from 'zod';

export const SyncStatusEnum = z.enum(['QUEUED', 'SYNCING', 'SYNCED', 'FAILED']);
export type SyncStatus = z.infer<typeof SyncStatusEnum>;

export const SyncOperationEnum = z.enum([
  'CREATE_FIELD_RECORD',
  'UPLOAD_EVIDENCE',
  'SIGN_STATEMENT',
]);
export type SyncOperation = z.infer<typeof SyncOperationEnum>;

export const SyncRecordPayloadSchema = z.object({
  caseNumber: z.string().optional(),
  caseTitle: z.string().optional(),
  documentType: z.string(),
  title: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  fileDataUri: z.string().optional(),
  fileBase64: z.string().optional(),
  fileSize: z.number(),
  capturedAt: z.string(),
  capturedLocation: z.string().optional(),
  victimName: z.string().optional(),
  victimAge: z.number().optional(),
  bnsSections: z.array(z.string()).default([]),
  statementText: z.string().optional(),
  signatureSvg: z.string().optional(),
  signatureBase64: z.string().optional(),
  officerNotes: z.string().optional(),
});

export type SyncRecordPayload = z.infer<typeof SyncRecordPayloadSchema>;

export const SyncItemSchema = z.object({
  localId: z.string(),
  idempotencyKey: z.string(),
  operation: SyncOperationEnum,
  payload: SyncRecordPayloadSchema,
  createdAt: z.string(),
  retryCount: z.number().default(0),
  status: SyncStatusEnum,
  errorMessage: z.string().nullable().optional(),
  serverRecordId: z.string().nullable().optional(),
  syncedAt: z.string().nullable().optional(),
});

export type SyncItem = z.infer<typeof SyncItemSchema>;

export const BatchSyncRequestSchema = z.object({
  items: z.array(SyncItemSchema),
});

export type BatchSyncRequest = z.infer<typeof BatchSyncRequestSchema>;

export const BatchSyncResponseSchema = z.object({
  processedCount: z.number(),
  results: z.array(
    z.object({
      localId: z.string(),
      idempotencyKey: z.string(),
      status: SyncStatusEnum,
      serverRecordId: z.string().optional(),
      caseId: z.string().optional(),
      documentId: z.string().optional(),
      error: z.string().optional(),
    })
  ),
});

export type BatchSyncResponse = z.infer<typeof BatchSyncResponseSchema>;
