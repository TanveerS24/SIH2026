import { z } from 'zod';

export const WorkflowItemTypeEnum = z.enum([
  'FORENSIC_REPORT',
  'WITNESS_STATEMENT',
  'REQUIRED_SIGNATURES',
  'EVIDENCE_METADATA',
  'OFFICER_VERIFICATION',
]);

export type WorkflowItemType = z.infer<typeof WorkflowItemTypeEnum>;

export const WorkflowRequirementSchema = z.object({
  id: z.string(),
  type: WorkflowItemTypeEnum,
  title: z.string(),
  description: z.string(),
  isSatisfied: z.boolean(),
  mandatoryForFiling: z.boolean(),
  satisfiedAt: z.string().nullable().optional(),
  satisfiedBy: z.string().nullable().optional(),
  documentRefId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type WorkflowRequirement = z.infer<typeof WorkflowRequirementSchema>;

export const CaseWorkflowStatusSchema = z.object({
  caseId: z.string(),
  caseNumber: z.string(),
  canFile: z.boolean(),
  status: z.string(),
  progressPercentage: z.number(),
  requirements: z.array(WorkflowRequirementSchema),
  missingRequirements: z.array(z.string()),
  isFiled: z.boolean(),
  filedAt: z.string().nullable().optional(),
  filedBy: z.string().nullable().optional(),
  filingLedgerTxId: z.string().nullable().optional(),
});

export type CaseWorkflowStatus = z.infer<typeof CaseWorkflowStatusSchema>;

export const FileChargeSheetRequestSchema = z.object({
  filingNotes: z.string().min(5, 'Filing notes are mandatory for judicial record'),
  designatedCourt: z.string().min(3, 'Designated court jurisdiction required'),
  prosecutorConfirmation: z.boolean().refine(val => val === true, {
    message: 'Prosecutor / IO must confirm all statutory requirements are satisfied',
  }),
});

export type FileChargeSheetRequest = z.infer<typeof FileChargeSheetRequestSchema>;
