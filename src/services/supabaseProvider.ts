/**
 * SUPABASE PROVIDER — Wrapper typé pour les requêtes Supabase
 * CRUD par table avec gestion d'erreur uniforme
 */
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Tables = Database['public']['Tables'];

class SupabaseProvider {
  // ─── Profiles ───────────────────────────────────────

  async getProfile(userId: string): Promise<Tables['profiles']['Row'] | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null; // not found
      throw error;
    }
    return data;
  }

  async upsertProfile(data: Tables['profiles']['Insert']): Promise<Tables['profiles']['Row']> {
    const { data: result, error } = await supabase
      .from('profiles')
      .upsert(data, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return result;
  }

  // ─── Organizations ──────────────────────────────────

  async getOrganization(orgId: string): Promise<Tables['organizations']['Row'] | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async updateOrganization(orgId: string, updates: Tables['organizations']['Update']): Promise<void> {
    const { error } = await supabase
      .from('organizations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', orgId);
    if (error) throw error;
  }

  // ─── Dossiers ───────────────────────────────────────

  async listDossiers(orgId: string): Promise<Tables['dossiers']['Row'][]> {
    const { data, error } = await supabase
      .from('dossiers')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  // Admin only — fetch all dossiers across all organizations
  async listAllDossiers(): Promise<Tables['dossiers']['Row'][]> {
    const { data, error } = await supabase
      .from('dossiers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async getDossier(id: string): Promise<Tables['dossiers']['Row'] | null> {
    const { data, error } = await supabase
      .from('dossiers')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async upsertDossier(data: Tables['dossiers']['Insert']): Promise<Tables['dossiers']['Row']> {
    const { data: result, error } = await supabase
      .from('dossiers')
      .upsert(data, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return result;
  }

  async deleteDossier(id: string): Promise<void> {
    const { error } = await supabase
      .from('dossiers')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // ─── VSME Values ───────────────────────────────────

  async listVSMEValues(dossierId: string, period?: string): Promise<Tables['vsme_values']['Row'][]> {
    let query = supabase
      .from('vsme_values')
      .select('*')
      .eq('dossier_id', dossierId);
    if (period) {
      query = query.eq('period', period);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async upsertVSMEValue(data: Tables['vsme_values']['Insert']): Promise<void> {
    const { error } = await supabase
      .from('vsme_values')
      .upsert(data, { onConflict: 'id' });
    if (error) throw error;
  }

  async upsertVSMEValuesBatch(rows: Tables['vsme_values']['Insert'][]): Promise<void> {
    if (rows.length === 0) return;
    const { error } = await supabase
      .from('vsme_values')
      .upsert(rows, { onConflict: 'id' });
    if (error) throw error;
  }

  async deleteVSMEValuesByDossier(dossierId: string): Promise<void> {
    const { error } = await supabase
      .from('vsme_values')
      .delete()
      .eq('dossier_id', dossierId);
    if (error) throw error;
  }

  // ─── Mission Notes ──────────────────────────────────

  async listNotes(dossierId: string): Promise<Tables['mission_notes']['Row'][]> {
    const { data, error } = await supabase
      .from('mission_notes')
      .select('*')
      .eq('dossier_id', dossierId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async upsertNote(data: Tables['mission_notes']['Insert']): Promise<void> {
    const { error } = await supabase
      .from('mission_notes')
      .upsert(data, { onConflict: 'id' });
    if (error) throw error;
  }

  async deleteNote(id: string): Promise<void> {
    const { error } = await supabase
      .from('mission_notes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // ─── Generic helpers ─────────────────────────────────

  private async _list<T extends keyof Tables>(
    table: T,
    filters: Record<string, unknown> = {},
    orderBy?: { column: string; ascending?: boolean }
  ): Promise<Tables[T]['Row'][]> {
    let query = supabase.from(table).select('*') as any;
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Tables[T]['Row'][];
  }

  private async _upsert<T extends keyof Tables>(
    table: T,
    row: Tables[T]['Insert']
  ): Promise<void> {
    const { error } = await supabase
      .from(table)
      .upsert(row as any, { onConflict: 'id' }) as any;
    if (error) throw error;
  }

  private async _delete<T extends keyof Tables>(
    table: T,
    id: string
  ): Promise<void> {
    const { error } = await supabase.from(table).delete().eq('id', id) as any;
    if (error) throw error;
  }

  // ─── Pack Templates ──────────────────────────────────

  async listPackTemplates(): Promise<Tables['pack_templates']['Row'][]> {
    return this._list('pack_templates');
  }

  async upsertPackTemplate(data: Tables['pack_templates']['Insert']): Promise<void> {
    return this._upsert('pack_templates', data);
  }

  // ─── Pack Instances ──────────────────────────────────

  async listPackInstances(dossierId?: string): Promise<Tables['pack_instances']['Row'][]> {
    const filters: Record<string, unknown> = {};
    if (dossierId) filters.dossier_id = dossierId;
    return this._list('pack_instances', filters, { column: 'created_at' });
  }

  async upsertPackInstance(data: Tables['pack_instances']['Insert']): Promise<void> {
    return this._upsert('pack_instances', data);
  }

  async deletePackInstance(id: string): Promise<void> {
    return this._delete('pack_instances', id);
  }

  // ─── Checklist Items ─────────────────────────────────

  async listChecklistItems(packId: string): Promise<Tables['checklist_items']['Row'][]> {
    return this._list('checklist_items', { pack_id: packId });
  }

  async upsertChecklistItem(data: Tables['checklist_items']['Insert']): Promise<void> {
    return this._upsert('checklist_items', data);
  }

  async deleteChecklistItem(id: string): Promise<void> {
    return this._delete('checklist_items', id);
  }

  // ─── KPI Requirements ────────────────────────────────

  async listKPIRequirements(packId: string): Promise<Tables['kpi_requirements']['Row'][]> {
    return this._list('kpi_requirements', { pack_id: packId });
  }

  async upsertKPIRequirement(data: Tables['kpi_requirements']['Insert']): Promise<void> {
    return this._upsert('kpi_requirements', data);
  }

  async deleteKPIRequirement(id: string): Promise<void> {
    return this._delete('kpi_requirements', id);
  }

  // ─── Folders ─────────────────────────────────────────

  async listFolders(packId: string): Promise<Tables['folders']['Row'][]> {
    return this._list('folders', { pack_id: packId });
  }

  async upsertFolder(data: Tables['folders']['Insert']): Promise<void> {
    return this._upsert('folders', data);
  }

  async deleteFolder(id: string): Promise<void> {
    return this._delete('folders', id);
  }

  // ─── Indicators ──────────────────────────────────────

  async listIndicators(packId: string): Promise<Tables['indicators']['Row'][]> {
    return this._list('indicators', { pack_id: packId });
  }

  async upsertIndicator(data: Tables['indicators']['Insert']): Promise<void> {
    return this._upsert('indicators', data);
  }

  async deleteIndicator(id: string): Promise<void> {
    return this._delete('indicators', id);
  }

  // ─── Evidence ────────────────────────────────────────

  async listEvidence(packId: string): Promise<Tables['evidence']['Row'][]> {
    return this._list('evidence', { pack_id: packId }, { column: 'uploaded_at' });
  }

  async upsertEvidence(data: Tables['evidence']['Insert']): Promise<void> {
    return this._upsert('evidence', data);
  }

  async deleteEvidence(id: string): Promise<void> {
    return this._delete('evidence', id);
  }

  // ─── Evidence Links ──────────────────────────────────

  async listEvidenceLinks(evidenceId: string): Promise<Tables['evidence_links']['Row'][]> {
    return this._list('evidence_links', { evidence_id: evidenceId });
  }

  async upsertEvidenceLink(data: Tables['evidence_links']['Insert']): Promise<void> {
    return this._upsert('evidence_links', data);
  }

  async deleteEvidenceLink(id: string): Promise<void> {
    return this._delete('evidence_links', id);
  }

  // ─── Data Imports ────────────────────────────────────

  async listDataImports(packId: string): Promise<Tables['data_imports']['Row'][]> {
    return this._list('data_imports', { pack_id: packId }, { column: 'created_at' });
  }

  async upsertDataImport(data: Tables['data_imports']['Insert']): Promise<void> {
    return this._upsert('data_imports', data);
  }

  // ─── Data Rows ───────────────────────────────────────

  async listDataRows(importId: string): Promise<Tables['data_rows']['Row'][]> {
    return this._list('data_rows', { import_id: importId });
  }

  async upsertDataRow(data: Tables['data_rows']['Insert']): Promise<void> {
    return this._upsert('data_rows', data);
  }

  async deleteDataRow(id: string): Promise<void> {
    return this._delete('data_rows', id);
  }

  // ─── Tasks ───────────────────────────────────────────

  async listTasks(): Promise<Tables['tasks']['Row'][]> {
    return this._list('tasks', {}, { column: 'created_at' });
  }

  async upsertTask(data: Tables['tasks']['Insert']): Promise<void> {
    return this._upsert('tasks', data);
  }

  async deleteTask(id: string): Promise<void> {
    return this._delete('tasks', id);
  }

  // ─── Notifications ───────────────────────────────────

  async listNotifications(userId: string): Promise<Tables['notifications']['Row'][]> {
    return this._list('notifications', { user_id: userId }, { column: 'created_at' });
  }

  async upsertNotification(data: Tables['notifications']['Insert']): Promise<void> {
    return this._upsert('notifications', data);
  }

  async markNotificationRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    if (error) throw error;
  }

  // ─── Audit Logs (append-only) ────────────────────────

  async appendAuditLog(data: Tables['audit_logs']['Insert']): Promise<void> {
    const { error } = await supabase
      .from('audit_logs')
      .insert(data);
    if (error) throw error;
  }

  async listAuditLogs(entityType?: string, entityId?: string): Promise<Tables['audit_logs']['Row'][]> {
    const filters: Record<string, unknown> = {};
    if (entityType) filters.entity_type = entityType;
    if (entityId) filters.entity_id = entityId;
    return this._list('audit_logs', filters, { column: 'timestamp' });
  }

  // ─── Export History ──────────────────────────────────

  async listExportHistory(packId?: string): Promise<Tables['export_history']['Row'][]> {
    const filters: Record<string, unknown> = {};
    if (packId) filters.pack_id = packId;
    return this._list('export_history', filters, { column: 'generated_at' });
  }

  async upsertExportHistory(data: Tables['export_history']['Insert']): Promise<void> {
    return this._upsert('export_history', data);
  }

  async deleteExportHistory(id: string): Promise<void> {
    return this._delete('export_history', id);
  }

  // ─── Invitations ─────────────────────────────────────

  async listInvitations(): Promise<Tables['invitations']['Row'][]> {
    return this._list('invitations', {}, { column: 'created_at' });
  }

  async upsertInvitation(data: Tables['invitations']['Insert']): Promise<void> {
    return this._upsert('invitations', data);
  }

  async deleteInvitation(id: string): Promise<void> {
    return this._delete('invitations', id);
  }

  // ─── ERP Connections ─────────────────────────────────

  async listERPConnections(): Promise<Tables['erp_connections']['Row'][]> {
    return this._list('erp_connections', {}, { column: 'created_at' });
  }

  async upsertERPConnection(data: Tables['erp_connections']['Insert']): Promise<void> {
    return this._upsert('erp_connections', data);
  }

  async deleteERPConnection(id: string): Promise<void> {
    return this._delete('erp_connections', id);
  }

  // ─── ERP Mappings ────────────────────────────────────

  async listERPMappings(connectionId?: string): Promise<Tables['erp_mappings']['Row'][]> {
    const filters: Record<string, unknown> = {};
    if (connectionId) filters.connection_id = connectionId;
    return this._list('erp_mappings', filters);
  }

  async upsertERPMapping(data: Tables['erp_mappings']['Insert']): Promise<void> {
    return this._upsert('erp_mappings', data);
  }

  async deleteERPMapping(id: string): Promise<void> {
    return this._delete('erp_mappings', id);
  }

  // ─── ERP Sync Jobs ───────────────────────────────────

  async listERPSyncJobs(connectionId?: string): Promise<Tables['erp_sync_jobs']['Row'][]> {
    const filters: Record<string, unknown> = {};
    if (connectionId) filters.connection_id = connectionId;
    return this._list('erp_sync_jobs', filters, { column: 'created_at' });
  }

  async upsertERPSyncJob(data: Tables['erp_sync_jobs']['Insert']): Promise<void> {
    return this._upsert('erp_sync_jobs', data);
  }

  // ─── ESG Data Points ─────────────────────────────────

  async listESGDataPoints(): Promise<Tables['esg_data_points']['Row'][]> {
    return this._list('esg_data_points');
  }

  async upsertESGDataPoint(data: Tables['esg_data_points']['Insert']): Promise<void> {
    return this._upsert('esg_data_points', data);
  }

  async deleteESGDataPoint(id: string): Promise<void> {
    return this._delete('esg_data_points', id);
  }

  // ─── Supabase Storage ────────────────────────────────

  async uploadFile(
    bucket: 'evidence' | 'exports',
    path: string,
    file: Blob | File
  ): Promise<string> {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  }

  async downloadFile(bucket: 'evidence' | 'exports', path: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);
    if (error) throw error;
    return data;
  }

  async getFileUrl(bucket: 'evidence' | 'exports', path: string): Promise<string> {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  }

  async deleteFile(bucket: 'evidence' | 'exports', paths: string[]): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths);
    if (error) throw error;
  }
}

export const supabaseProvider = new SupabaseProvider();
