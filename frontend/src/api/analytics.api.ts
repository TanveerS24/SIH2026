import { BaseApiClient } from './client';
import { AnalyticsOverview } from '@pramaan/shared-types';

export class AnalyticsApi extends BaseApiClient {
  async getAnalytics(): Promise<AnalyticsOverview> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/analytics/overview`, { headers });
    return this.handleResponse<AnalyticsOverview>(res);
  }
}

export const analyticsApi = new AnalyticsApi();
