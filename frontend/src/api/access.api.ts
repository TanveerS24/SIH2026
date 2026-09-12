import { BaseApiClient } from './client';
import { AccessRequestSummary } from '@pramaan/shared-types';

export class AccessApi extends BaseApiClient {
  async getAccessRequests(): Promise<AccessRequestSummary[]> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/access-requests`, { headers });
    return this.handleResponse<AccessRequestSummary[]>(res);
  }

  async createAccessRequest(caseId: string, reason: string, durationHours: number = 24): Promise<any> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/access-requests`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId, reason, durationHours }),
    });
    return this.handleResponse<any>(res);
  }

  async reviewAccessRequest(requestId: string, approved: boolean): Promise<any> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/access-requests/${requestId}/review`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved }),
    });
    return this.handleResponse<any>(res);
  }
}

export const accessApi = new AccessApi();
