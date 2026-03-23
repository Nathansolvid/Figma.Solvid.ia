/**
 * SYNC ENGINE — Orchestrateur de synchronisation cloud
 *
 * Pattern: Write-through avec IDB comme cache
 * - Online: Supabase first → IDB cache
 * - Offline: IDB first → queue pour sync ultérieur
 * - Lecture: IDB (instantané) + background pull Supabase
 */
import { supabase } from '@/lib/supabase';
import { syncQueue, type QueuedOperation } from './syncQueue';
import { supabaseProvider } from './supabaseProvider';

export type SyncStatus = 'online' | 'offline' | 'syncing';

const MAX_RETRIES = 3;
const HEALTH_CHECK_INTERVAL = 30_000; // 30s

class SyncEngine {
  private static instance: SyncEngine;
  private _status: SyncStatus = 'offline';
  private _enabled = false;
  private _organizationId: string | null = null;
  private _userId: string | null = null;
  private listeners = new Set<(status: SyncStatus) => void>();
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null;

  private constructor() {}

  static getInstance(): SyncEngine {
    if (!SyncEngine.instance) {
      SyncEngine.instance = new SyncEngine();
    }
    return SyncEngine.instance;
  }

  // ─── Getters ────────────────────────────────────────

  get status(): SyncStatus { return this._status; }
  get enabled(): boolean { return this._enabled; }
  get organizationId(): string | null { return this._organizationId; }
  get userId(): string | null { return this._userId; }

  isOnline(): boolean {
    return this._status === 'online' || this._status === 'syncing';
  }

  // ─── Lifecycle ──────────────────────────────────────

  async enableSync(userId: string, organizationId: string): Promise<void> {
    this._userId = userId;
    this._organizationId = organizationId;
    this._enabled = true;

    // Check connectivity
    const online = await this.checkOnline();
    this.setStatus(online ? 'online' : 'offline');

    // Flush any queued operations
    if (online && syncQueue.count() > 0) {
      await this.flushQueue();
    }

    // Start periodic health check
    if (!this.healthCheckTimer) {
      this.healthCheckTimer = setInterval(async () => {
        if (!this._enabled) return;
        const wasOffline = this._status === 'offline';
        const online = await this.checkOnline();
        this.setStatus(online ? 'online' : 'offline');
        // Auto-flush when coming back online
        if (online && wasOffline && syncQueue.count() > 0) {
          await this.flushQueue();
        }
      }, HEALTH_CHECK_INTERVAL);
    }
  }

  disableSync(): void {
    this._enabled = false;
    this._organizationId = null;
    this._userId = null;
    this.setStatus('offline');
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  // ─── Connectivity ───────────────────────────────────

  async checkOnline(): Promise<boolean> {
    if (!navigator.onLine) return false;
    try {
      const { data } = await supabase.auth.getSession();
      return !!data?.session;
    } catch {
      return false;
    }
  }

  // ─── Write-through ──────────────────────────────────

  /**
   * Write-through: try Supabase, queue if offline.
   * The local write should already be done before calling this.
   */
  async syncToCloud(
    table: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (!this._enabled) return;

    if (!this.isOnline()) {
      syncQueue.enqueue({ table, operation, payload });
      return;
    }

    try {
      await this.executeSyncOp({ table, operation, payload } as Omit<QueuedOperation, 'id' | 'timestamp' | 'retries'>);
    } catch (err) {
      console.warn(`[SyncEngine] Cloud write failed for ${table}, queuing:`, err);
      syncQueue.enqueue({ table, operation, payload });
      // Maybe we went offline
      const online = await this.checkOnline();
      if (!online) this.setStatus('offline');
    }
  }

  // ─── Queue Flush ────────────────────────────────────

  async flushQueue(): Promise<{ succeeded: number; failed: number }> {
    const pending = syncQueue.peek();
    if (pending.length === 0) return { succeeded: 0, failed: 0 };

    this.setStatus('syncing');
    let succeeded = 0;
    let failed = 0;

    for (const op of pending) {
      if (op.retries >= MAX_RETRIES) {
        syncQueue.remove(op.id);
        failed++;
        continue;
      }
      try {
        await this.executeSyncOp(op);
        syncQueue.remove(op.id);
        succeeded++;
      } catch {
        syncQueue.markFailed(op.id);
        failed++;
      }
    }

    this.setStatus(await this.checkOnline() ? 'online' : 'offline');
    return { succeeded, failed };
  }

  // ─── Execute a single sync operation ────────────────

  private async executeSyncOp(op: Pick<QueuedOperation, 'table' | 'operation' | 'payload'>): Promise<void> {
    const { table, operation, payload } = op;

    switch (table) {
      case 'dossiers': {
        if (operation === 'DELETE') {
          await supabaseProvider.deleteDossier(payload.id as string);
        } else {
          await supabaseProvider.upsertDossier(payload as any);
        }
        break;
      }
      case 'vsme_values': {
        if (operation === 'DELETE') {
          // Single value delete not common, skip
        } else {
          await supabaseProvider.upsertVSMEValue(payload as any);
        }
        break;
      }
      case 'mission_notes': {
        if (operation === 'DELETE') {
          await supabaseProvider.deleteNote(payload.id as string);
        } else {
          await supabaseProvider.upsertNote(payload as any);
        }
        break;
      }
      case 'profiles': {
        if (operation !== 'DELETE') {
          await supabaseProvider.upsertProfile(payload as any);
        }
        break;
      }
      case 'organizations': {
        if (operation === 'UPDATE') {
          await supabaseProvider.updateOrganization(payload.id as string, payload as any);
        }
        break;
      }

      // ─── Pack Management ──────────────────────────────
      case 'pack_templates': {
        if (operation !== 'DELETE') {
          await supabaseProvider.upsertPackTemplate(payload as any);
        }
        break;
      }
      case 'pack_instances': {
        if (operation === 'DELETE') {
          await supabaseProvider.deletePackInstance(payload.id as string);
        } else {
          await supabaseProvider.upsertPackInstance(payload as any);
        }
        break;
      }
      case 'checklist_items': {
        if (operation === 'DELETE') {
          await supabaseProvider.deleteChecklistItem(payload.id as string);
        } else {
          await supabaseProvider.upsertChecklistItem(payload as any);
        }
        break;
      }
      case 'kpi_requirements': {
        if (operation === 'DELETE') {
          await supabaseProvider.deleteKPIRequirement(payload.id as string);
        } else {
          await supabaseProvider.upsertKPIRequirement(payload as any);
        }
        break;
      }
      case 'folders': {
        if (operation === 'DELETE') {
          await supabaseProvider.deleteFolder(payload.id as string);
        } else {
          await supabaseProvider.upsertFolder(payload as any);
        }
        break;
      }
      case 'indicators': {
        if (operation === 'DELETE') {
          await supabaseProvider.deleteIndicator(payload.id as string);
        } else {
          await supabaseProvider.upsertIndicator(payload as any);
        }
        break;
      }

      // ─── Evidence ─────────────────────────────────────
      case 'evidence': {
        if (operation === 'DELETE') {
          await supabaseProvider.deleteEvidence(payload.id as string);
        } else {
          await supabaseProvider.upsertEvidence(payload as any);
        }
        break;
      }
      case 'evidence_links': {
        if (operation === 'DELETE') {
          await supabaseProvider.deleteEvidenceLink(payload.id as string);
        } else {
          await supabaseProvider.upsertEvidenceLink(payload as any);
        }
        break;
      }

      // ─── Data Imports ─────────────────────────────────
      case 'data_imports': {
        if (operation !== 'DELETE') {
          await supabaseProvider.upsertDataImport(payload as any);
        }
        break;
      }
      case 'data_rows': {
        if (operation === 'DELETE') {
          await supabaseProvider.deleteDataRow(payload.id as string);
        } else {
          await supabaseProvider.upsertDataRow(payload as any);
        }
        break;
      }

      // ─── Tasks & Notifications ────────────────────────
      case 'tasks': {
        if (operation === 'DELETE') {
          await supabaseProvider.deleteTask(payload.id as string);
        } else {
          await supabaseProvider.upsertTask(payload as any);
        }
        break;
      }
      case 'notifications': {
        if (operation !== 'DELETE') {
          await supabaseProvider.upsertNotification(payload as any);
        }
        break;
      }

      // ─── Audit & Export ───────────────────────────────
      case 'audit_logs': {
        if (operation === 'INSERT') {
          await supabaseProvider.appendAuditLog(payload as any);
        }
        break;
      }
      case 'export_history': {
        if (operation === 'DELETE') {
          await supabaseProvider.deleteExportHistory(payload.id as string);
        } else {
          await supabaseProvider.upsertExportHistory(payload as any);
        }
        break;
      }

      // ─── Invitations ──────────────────────────────────
      case 'invitations': {
        if (operation === 'DELETE') {
          await supabaseProvider.deleteInvitation(payload.id as string);
        } else {
          await supabaseProvider.upsertInvitation(payload as any);
        }
        break;
      }

      // ─── ERP ──────────────────────────────────────────
      case 'erp_connections': {
        if (operation === 'DELETE') {
          await supabaseProvider.deleteERPConnection(payload.id as string);
        } else {
          await supabaseProvider.upsertERPConnection(payload as any);
        }
        break;
      }
      case 'erp_mappings': {
        if (operation === 'DELETE') {
          await supabaseProvider.deleteERPMapping(payload.id as string);
        } else {
          await supabaseProvider.upsertERPMapping(payload as any);
        }
        break;
      }
      case 'erp_sync_jobs': {
        if (operation !== 'DELETE') {
          await supabaseProvider.upsertERPSyncJob(payload as any);
        }
        break;
      }
      case 'esg_data_points': {
        if (operation === 'DELETE') {
          await supabaseProvider.deleteESGDataPoint(payload.id as string);
        } else {
          await supabaseProvider.upsertESGDataPoint(payload as any);
        }
        break;
      }

      default:
        console.warn(`[SyncEngine] Unknown table: ${table}`);
    }
  }

  // ─── Status Management ──────────────────────────────

  private setStatus(status: SyncStatus): void {
    if (this._status === status) return;
    this._status = status;
    this.listeners.forEach(cb => cb(status));
  }

  onStatusChange(cb: (status: SyncStatus) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
}

export const syncEngine = SyncEngine.getInstance();
