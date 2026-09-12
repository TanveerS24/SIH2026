import { BaseApiClient } from './client';

export class SearchApi extends BaseApiClient {
  async search(query: string): Promise<any> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`, { headers });
    return this.handleResponse<any>(res);
  }
}

export const searchApi = new SearchApi();
