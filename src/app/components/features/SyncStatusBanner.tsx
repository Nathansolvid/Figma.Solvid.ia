/**
 * SyncStatusBanner — Bandeau de statut de synchronisation cloud
 * Affiché en haut de l'app quand la sync est activée
 */
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { Cloud, CloudOff, Loader2, AlertCircle } from 'lucide-react';

export function SyncStatusBanner() {
  const { status, pendingCount, enabled } = useSyncStatus();

  if (!enabled) return null;

  const config = {
    online: {
      icon: <Cloud className="w-3.5 h-3.5" />,
      text: pendingCount > 0 ? `${pendingCount} modification${pendingCount > 1 ? 's' : ''} en attente` : 'Synchronise',
      bg: pendingCount > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    offline: {
      icon: <CloudOff className="w-3.5 h-3.5" />,
      text: 'Mode hors-ligne',
      bg: 'bg-red-50 text-red-700 border-red-200',
    },
    syncing: {
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      text: 'Synchronisation...',
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
    },
  }[status];

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium border rounded-full ${config.bg}`}>
      {config.icon}
      <span>{config.text}</span>
      {pendingCount > 0 && status === 'offline' && (
        <span className="flex items-center gap-0.5 ml-1">
          <AlertCircle className="w-3 h-3" />
          {pendingCount}
        </span>
      )}
    </div>
  );
}
