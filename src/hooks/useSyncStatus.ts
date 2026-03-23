/**
 * Hook React pour le statut de synchronisation cloud
 */
import { useState, useEffect } from 'react';
import { syncEngine, type SyncStatus } from '@/services/syncEngine';
import { syncQueue } from '@/services/syncQueue';

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>(syncEngine.status);
  const [pendingCount, setPendingCount] = useState(syncQueue.count());

  useEffect(() => {
    const unsub = syncEngine.onStatusChange((s) => {
      setStatus(s);
      setPendingCount(syncQueue.count());
    });

    // Refresh pending count periodically
    const interval = setInterval(() => {
      setPendingCount(syncQueue.count());
    }, 10_000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  return { status, pendingCount, enabled: syncEngine.enabled };
}
