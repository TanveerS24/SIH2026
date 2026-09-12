import { z } from 'zod';

export const CaseStatusEnum = z.enum([
  'UNDER_INVESTIGATION',
  'EVIDENCE_COLLECTION',
  'FORENSIC_PENDING',
  'CHARGE_SHEET_PREPARED',
  'FILED',
  'JUDICIAL_PROCEEDINGS',
  'DISPOSED',
]);

export type CaseStatus = z.infer<typeof CaseStatusEnum>;

export const CasePriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL_URGENT']);
export type CasePriority = z.infer<typeof CasePriorityEnum>;

export const SensitivityLevelEnum = z.enum([
  'PUBLIC',
  'INTERNAL',
  'SENSITIVE',
  'HIGHLY_SENSITIVE',
]);
export type SensitivityLevel = z.infer<typeof SensitivityLevelEnum>;

export const CreateCaseSchema = z.object({
  caseNumber: z.string().min(3),
  title: z.string().min(5),
  description: z.string().min(10),
  firNumber: z.string().optional(),
  firDate: z.string().datetime().optional(),
  jurisdiction: z.string().min(2),
  policeStation: z.string().min(2),
  bnsSections: z.array(z.string()).min(1),
  priority: CasePriorityEnum.default('HIGH'),
  sensitivity: SensitivityLevelEnum.default('HIGHLY_SENSITIVE'),
  incidentDate: z.string().datetime().optional(),
  incidentLocation: z.string().min(3),
  victimName: z.string().optional(),
  victimAge: z.number().optional(),
  suspects: z.array(z.string()).default([]),
  assignedOfficerId: z.string().optional(),
});

export type CreateCaseDto = z.infer<typeof CreateCaseSchema>;

export const CaseSummarySchema = z.object({
  id: z.string(),
  caseNumber: z.string(),
  title: z.string(),
  status: CaseStatusEnum,
  priority: CasePriorityEnum,
  sensitivity: SensitivityLevelEnum,
  jurisdiction: z.string(),
  policeStation: z.string(),
  bnsSections: z.array(z.string()),
  incidentDate: z.string().nullable(),
  incidentLocation: z.string(),
  documentCount: z.number(),
  custodyCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  assignedOfficerName: z.string().nullable().optional(),
});

export type CaseSummary = z.infer<typeof CaseSummarySchema>;
