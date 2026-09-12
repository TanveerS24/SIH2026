import { SyncItem, SyncOperation, SyncRecordPayload } from '@pramaan/shared-types';
import { storage } from './storage';
import { api } from './api';

const QUEUE_STORAGE_KEY = 'pramaan_offline_sqlite_queue';

export class OfflineQueueService {
  private queue: SyncItem[] = [];
  private isInitialized = false;

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    try {
      const raw = await storage.getItem(QUEUE_STORAGE_KEY);
      if (raw) {
        this.queue = JSON.parse(raw);
      }
    } catch {
      this.queue = [];
    }
    this.isInitialized = true;
  }

  private async persist(): Promise<void> {
    await storage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
  }

  public async enqueue(
    operation: SyncOperation,
    payload: SyncRecordPayload
  ): Promise<SyncItem> {
    await this.init();

    const localId = `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const idempotencyKey = `IDEM-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const item: SyncItem = {
      localId,
      idempotencyKey,
      operation,
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: 'QUEUED',
    };

    this.queue.unshift(item);
    await this.persist();
    return item;
  }

  public async getQueue(): Promise<SyncItem[]> {
    await this.init();
    return [...this.queue];
  }

  public async getQueuedCount(): Promise<number> {
    await this.init();
    return this.queue.filter((i) => i.status === 'QUEUED' || i.status === 'FAILED').length;
  }

  public async syncAll(): Promise<{ succeeded: number; failed: number }> {
    await this.init();

    const pending = this.queue.filter((i) => i.status === 'QUEUED' || i.status === 'FAILED');
    if (pending.length === 0) {
      return { succeeded: 0, failed: 0 };
    }

    try {
      const response = await api.syncBatch(pending);
      let succeeded = 0;
      let failed = 0;

      for (const result of response.results) {
        const queueIndex = this.queue.findIndex((i) => i.localId === result.localId);
        if (queueIndex !== -1) {
          const currentItem = this.queue[queueIndex];
          if (result.status === 'SYNCED' && currentItem) {
            this.queue[queueIndex] = {
              ...currentItem,
              status: 'SYNCED',
              syncedAt: new Date().toISOString(),
              serverRecordId: result.serverRecordId,
            };
            succeeded++;
          } else if (currentItem) {
            this.queue[queueIndex] = {
              ...currentItem,
              status: 'FAILED',
              retryCount: (currentItem.retryCount || 0) + 1,
              errorMessage: result.error,
            };
            failed++;
          }
        }
      }

      await this.persist();
      return { succeeded, failed };
    } catch (err: any) {
      return { succeeded: 0, failed: pending.length };
    }
  }

  public async clearSynced(): Promise<void> {
    await this.init();
    this.queue = this.queue.filter((i) => i.status !== 'SYNCED');
    await this.persist();
  }
}

export const offlineQueueService = new OfflineQueueService();
