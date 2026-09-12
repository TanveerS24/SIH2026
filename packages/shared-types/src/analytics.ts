import { z } from 'zod';

export const StateStatisticsSchema = z.object({
  stateName: z.string(),
  stateCode: z.string(),
  totalRegistered: z.number(),
  underInvestigation: z.number(),
  chargeSheetsFiled: z.number(),
  convictionRatePercent: z.number(),
  avgDaysToChargeSheet: z.number(),
  forensicTurnaroundDays: z.number(),
});

export type StateStatistics = z.infer<typeof StateStatisticsSchema>;

export const CategoryBreakdownSchema = z.object({
  category: z.string(),
  bnsSection: z.string(),
  caseCount: z.number(),
  percentage: z.number(),
  chargeSheetRate: z.number(),
});

export type CategoryBreakdown = z.infer<typeof CategoryBreakdownSchema>;

export const MonthlyTrendSchema = z.object({
  month: z.string(),
  reported: z.number(),
  chargeSheeted: z.number(),
  disposed: z.number(),
});

export type MonthlyTrend = z.infer<typeof MonthlyTrendSchema>;

export const AnalyticsOverviewSchema = z.object({
  disclaimer: z.string(),
  totalCases: z.number(),
  activeInvestigations: z.number(),
  chargeSheetsFiledRate: z.number(),
  avgChargeSheetDays: z.number(),
  evidenceTamperAlerts: z.number(),
  totalEvidenceAnchored: z.number(),
  states: z.array(StateStatisticsSchema),
  categories: z.array(CategoryBreakdownSchema),
  monthlyTrends: z.array(MonthlyTrendSchema),
  lastUpdated: z.string(),
});

export type AnalyticsOverview = z.infer<typeof AnalyticsOverviewSchema>;

export const AccessRequestStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']);
export type AccessRequestStatus = z.infer<typeof AccessRequestStatusEnum>;

export const CreateAccessRequestSchema = z.object({
  caseId: z.string(),
  reason: z.string().min(20, 'Written statutory justification must be at least 20 characters'),
  durationHours: z.number().min(1).max(72).default(24),
});

export type CreateAccessRequestDto = z.infer<typeof CreateAccessRequestSchema>;

export const AccessRequestSummarySchema = z.object({
  id: z.string(),
  caseId: z.string(),
  caseNumber: z.string(),
  caseTitle: z.string(),
  requesterId: z.string(),
  requesterName: z.string(),
  requesterRole: z.string(),
  reason: z.string(),
  status: AccessRequestStatusEnum,
  expiresAt: z.string().nullable().optional(),
  reviewedBy: z.string().nullable().optional(),
  reviewedByName: z.string().nullable().optional(),
  reviewedAt: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type AccessRequestSummary = z.infer<typeof AccessRequestSummarySchema>;
