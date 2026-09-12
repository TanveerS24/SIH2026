import { BaseApiClient } from './client';
import { CaseSummary } from '@pramaan/shared-types';

export class CasesApi extends BaseApiClient {
  async getCases(): Promise<CaseSummary[]> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/cases`, { headers });
    return this.handleResponse<CaseSummary[]>(res);
  }

  async getCaseById(id: string): Promise<any> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/cases/${id}`, { headers });
    return this.handleResponse<any>(res);
  }

  async createCase(payload: any): Promise<any> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/cases`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return this.handleResponse<any>(res);
  }

  async getCaseRelationships(id: string): Promise<any> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/cases/${id}/relationships`, { headers });
    return this.handleResponse<any>(res);
  }
}

export const casesApi = new CasesApi();
