/**
 * SYNC QUEUE — File d'attente persistante pour les opérations offline
 * Stockée dans localStorage (simple et fiable, pas besoin d'IDB pour ça)
 */

const QUEUE_KEY = 'solvid_sync_queue';

export interface QueuedOperation {
  id: string;
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: Record<string, unknown>;
  timestamp: string;
  retries: number;
}

function generateId(): string {
  return `sq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readQueue(): QueuedOperation[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedOperation[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export const syncQueue = {
  enqueue(op: Omit<QueuedOperation, 'id' | 'timestamp' | 'retries'>): void {
    const queue = readQueue();
    queue.push({
      ...op,
      id: generateId(),
      timestamp: new Date().toISOString(),
      retries: 0,
    });
    writeQueue(queue);
  },

  dequeue(): QueuedOperation | null {
    const queue = readQueue();
    if (queue.length === 0) return null;
    const [first, ...rest] = queue;
    writeQueue(rest);
    return first;
  },

  peek(): QueuedOperation[] {
    return readQueue();
  },

  markFailed(id: string): void {
    const queue = readQueue();
    const op = queue.find(q => q.id === id);
    if (op) {
      op.retries += 1;
      writeQueue(queue);
    }
  },

  remove(id: string): void {
    const queue = readQueue().filter(q => q.id !== id);
    writeQueue(queue);
  },

  count(): number {
    return readQueue().length;
  },

  clear(): void {
    localStorage.removeItem(QUEUE_KEY);
  },
};
