import { BaseApiClient } from './client';

export class CustodyApi extends BaseApiClient {
  async getCustodyTimeline(caseId: string): Promise<any[]> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/cases/${caseId}/custody`, { headers });
    return this.handleResponse<any[]>(res);
  }
}

export const custodyApi = new CustodyApi();
