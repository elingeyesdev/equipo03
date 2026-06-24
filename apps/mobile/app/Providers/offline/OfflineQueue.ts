import * as SQLite from 'expo-sqlite';

export interface QueuedMutation {
  id: number;
  method: string;
  url: string;
  baseURL: string;
  data: string | null;
  headers: string;
  createdAt: string;
  retryCount: number;
}

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('gymsync_offline.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS pending_mutations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        method TEXT NOT NULL,
        url TEXT NOT NULL,
        base_url TEXT NOT NULL,
        data TEXT,
        headers TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        retry_count INTEGER NOT NULL DEFAULT 0
      );
    `);
  }
  return db;
}

export const OfflineQueue = {
  async enqueue(config: {
    method?: string;
    url?: string;
    baseURL?: string;
    data?: unknown;
    headers?: Record<string, string>;
  }): Promise<number> {
    const d = await getDb();
    const result = await d.runAsync(
      `INSERT INTO pending_mutations (method, url, base_url, data, headers) VALUES (?, ?, ?, ?, ?)`,
      config.method?.toUpperCase() ?? 'POST',
      config.url ?? '',
      config.baseURL ?? '',
      config.data != null ? JSON.stringify(config.data) : null,
      JSON.stringify(config.headers ?? {}),
    );
    return result.lastInsertRowId;
  },

  async getAll(): Promise<QueuedMutation[]> {
    const d = await getDb();
    const rows = await d.getAllAsync<{
      id: number; method: string; url: string; base_url: string;
      data: string | null; headers: string; created_at: string; retry_count: number;
    }>('SELECT * FROM pending_mutations ORDER BY id ASC');
    return rows.map(r => ({
      id: r.id,
      method: r.method,
      url: r.url,
      baseURL: r.base_url,
      data: r.data,
      headers: r.headers,
      createdAt: r.created_at,
      retryCount: r.retry_count,
    }));
  },

  async count(): Promise<number> {
    const d = await getDb();
    const row = await d.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM pending_mutations');
    return row?.c ?? 0;
  },

  async remove(id: number): Promise<void> {
    const d = await getDb();
    await d.runAsync('DELETE FROM pending_mutations WHERE id = ?', id);
  },

  async incrementRetry(id: number): Promise<void> {
    const d = await getDb();
    await d.runAsync('UPDATE pending_mutations SET retry_count = retry_count + 1 WHERE id = ?', id);
  },

  async clear(): Promise<void> {
    const d = await getDb();
    await d.execAsync('DELETE FROM pending_mutations');
  },
};
