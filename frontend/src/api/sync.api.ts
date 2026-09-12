import { BaseApiClient } from './client';
import { SyncItem, BatchSyncResponse } from '@pramaan/shared-types';

export class SyncApi extends BaseApiClient {
  async syncBatch(items: SyncItem[]): Promise<BatchSyncResponse> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${this.baseUrl}/sync`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    return this.handleResponse<BatchSyncResponse>(res);
  }
}

export const syncApi = new SyncApi();
