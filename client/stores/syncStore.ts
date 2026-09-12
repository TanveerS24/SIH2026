import { create } from 'zustand';
import { SyncItem, SyncOperation, SyncRecordPayload } from '@pramaan/shared-types';
import { offlineQueueService } from '../services/offline-queue';

interface SyncState {
  queue: SyncItem[];
  isOffline: boolean;
  isSyncing: boolean;
  lastSyncResult: { succeeded: number; failed: number } | null;
  error: string | null;

  initSync: () => Promise<void>;
  toggleOffline: () => void;
  setOffline: (offline: boolean) => void;
  enqueueRecord: (operation: SyncOperation, payload: SyncRecordPayload) => Promise<SyncItem>;
  triggerSync: () => Promise<void>;
  clearSynced: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  queue: [],
  isOffline: false,
  isSyncing: false,
  lastSyncResult: null,
  error: null,

  initSync: async () => {
    await offlineQueueService.init();
    const queue = await offlineQueueService.getQueue();
    set({ queue });
  },

  toggleOffline: () => {
    set((state) => ({ isOffline: !state.isOffline }));
  },

  setOffline: (offline: boolean) => {
    set({ isOffline: offline });
  },

  enqueueRecord: async (operation: SyncOperation, payload: SyncRecordPayload) => {
    const item = await offlineQueueService.enqueue(operation, payload);
    const queue = await offlineQueueService.getQueue();
    set({ queue });
    return item;
  },

  triggerSync: async () => {
    if (get().isOffline) return;
    set({ isSyncing: true, error: null });
    try {
      const result = await offlineQueueService.syncAll();
      const queue = await offlineQueueService.getQueue();
      set({
        queue,
        isSyncing: false,
        lastSyncResult: { succeeded: result.succeeded, failed: result.failed },
      });
    } catch (err: any) {
      const queue = await offlineQueueService.getQueue();
      set({
        queue,
        isSyncing: false,
        error: err.message || 'Sync failed',
      });
    }
  },

  clearSynced: async () => {
    await offlineQueueService.clearSynced();
    const queue = await offlineQueueService.getQueue();
    set({ queue });
  },
}));
