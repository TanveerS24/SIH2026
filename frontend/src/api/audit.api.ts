import { BaseApiClient } from './client';

export class AuditApi extends BaseApiClient {
  async getAuditLogs(params?: { caseId?: string; actorId?: string }): Promise<any[]> {
    const headers = await this.getAuthHeader();
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${this.baseUrl}/audit${query ? `?${query}` : ''}`, { headers });
    return this.handleResponse<any[]>(res);
  }
}

export const auditApi = new AuditApi();
