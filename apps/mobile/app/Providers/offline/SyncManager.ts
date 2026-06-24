import axios from 'axios';
import { AuthService } from '../auth/AuthService';
import { OfflineQueue } from './OfflineQueue';

const MAX_RETRIES = 5;

let syncing = false;

export const SyncManager = {
  async sync(): Promise<{ synced: number; failed: number }> {
    if (syncing) return { synced: 0, failed: 0 };
    syncing = true;

    let synced = 0;
    let failed = 0;

    try {
      const pending = await OfflineQueue.getAll();
      if (pending.length === 0) return { synced: 0, failed: 0 };

      const token = await AuthService.getToken();

      for (const item of pending) {
        if (item.retryCount >= MAX_RETRIES) {
          await OfflineQueue.remove(item.id);
          failed++;
          continue;
        }

        try {
          const headers: Record<string, string> = JSON.parse(item.headers);
          if (token) headers['Authorization'] = `Bearer ${token.trim()}`;
          headers['Content-Type'] = 'application/json';

          await axios({
            method: item.method.toLowerCase(),
            url: item.url,
            baseURL: item.baseURL,
            data: item.data ? JSON.parse(item.data) : undefined,
            headers,
            timeout: 15000,
          });

          await OfflineQueue.remove(item.id);
          synced++;
        } catch {
          await OfflineQueue.incrementRetry(item.id);
          failed++;
        }
      }
    } finally {
      syncing = false;
    }

    return { synced, failed };
  },
};
