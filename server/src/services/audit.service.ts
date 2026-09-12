import { Role, AuditAction } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export interface LogActionParams {
  actorId: string;
  actorRole: Role;
  action: AuditAction;
  resource: string;
  resourceId?: string | null;
  caseId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  result: 'SUCCESS' | 'DENIED' | 'FAILURE' | 'BLOCKED';
  reason?: string | null;
  metadata?: Record<string, any> | null;
}

class AuditService {
  public async logAction(params: LogActionParams): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          actorId: params.actorId,
          actorRole: params.actorRole,
          action: params.action,
          resource: params.resource,
          resourceId: params.resourceId ?? null,
          caseId: params.caseId ?? null,
          ipAddress: params.ipAddress ?? null,
          userAgent: params.userAgent ?? null,
          result: params.result,
          reason: params.reason ?? null,
          metadata: params.metadata ?? undefined,
        },
      });
    } catch (err) {
      console.error('⚠️ Critical: Failed to write audit log record:', err);
    }
  }

  public async getAuditLogs(filter?: { caseId?: string; actorId?: string; action?: AuditAction; limit?: number }) {
    const where: any = {};
    if (filter?.caseId) where.caseId = filter.caseId;
    if (filter?.actorId) where.actorId = filter.actorId;
    if (filter?.action) where.action = filter.action;

    return prisma.auditLog.findMany({
      where,
      take: filter?.limit || 100,
      orderBy: { timestamp: 'desc' },
      include: {
        actor: {
          select: { id: true, name: true, badgeNumber: true, role: true },
        },
        case: {
          select: { id: true, caseNumber: true, title: true },
        },
      },
    });
  }
}

export const auditService = new AuditService();
