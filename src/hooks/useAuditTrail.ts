import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { dataProvider } from '@/services/dataProvider'; // 🆕 Add dataProvider import
import { toast } from 'sonner';

// Query Keys
export const auditKeys = {
  all: ['audit'] as const,
  lists: () => [...auditKeys.all, 'list'] as const,
  list: (filters?: any) => [...auditKeys.lists(), filters] as const,
  indicator: (indicatorId: string) => [...auditKeys.all, 'indicator', indicatorId] as const,
  pack: (packId: string) => [...auditKeys.all, 'pack', packId] as const,
  user: (userId: string) => [...auditKeys.all, 'user', userId] as const,
  dateRange: (start: string, end: string) => [...auditKeys.all, 'dateRange', start, end] as const,
  organization: () => [...auditKeys.all, 'organization'] as const,
  statistics: () => [...auditKeys.all, 'statistics'] as const,
};

// Types
export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  userId: string;
  role: 'client' | 'consultant' | 'auditeur';
  action: 'create' | 'update' | 'validate' | 'reject' | 'delete' | 'evidence_added' | 'evidence_removed';
  entityType: 'indicator' | 'pack' | 'evidence' | 'folder';
  entityId: string;
  entityName?: string;
  field?: string;
  oldValue?: string | number;
  newValue?: string | number;
  justification?: string;
  comment?: string;
  affectedFields?: string[];
  metadata?: Record<string, any>;
}

export interface AuditFilters {
  indicatorId?: string;
  packId?: string;
  userId?: string;
  action?: AuditEntry['action'] | AuditEntry['action'][];
  entityType?: AuditEntry['entityType'] | AuditEntry['entityType'][];
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AuditStatistics {
  totalEntries: number;
  entriesByAction: Record<AuditEntry['action'], number>;
  entriesByEntityType: Record<AuditEntry['entityType'], number>;
  entriesByUser: { userId: string; userName: string; count: number }[];
  mostActiveEntities: { entityId: string; entityName: string; entityType: string; count: number }[];
  recentActivity: { date: string; count: number }[];
}

// Hook: Get audit trail for indicator
export function useIndicatorAuditTrail(indicatorId: string | null) {
  return useQuery({
    queryKey: auditKeys.indicator(indicatorId || ''),
    queryFn: async () => {
      if (!indicatorId) throw new Error('Indicator ID is required');

      try {
        const entries = await dataProvider.store.listByIndex('audit_logs', 'entityId', indicatorId);
        return entries as unknown as AuditEntry[];
      } catch (error: any) {
        console.warn(`⚠️ Failed to load audit trail for indicator ${indicatorId}:`, error.message);
        return [];
      }
    },
    enabled: !!indicatorId,
    staleTime: 2 * 60 * 1000, // 2 minutes - audit trail change fréquemment
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook: Get audit trail for pack
export function usePackAuditTrail(packId: string | null) {
  return useQuery({
    queryKey: auditKeys.pack(packId || ''),
    queryFn: async () => {
      if (!packId) throw new Error('Pack ID is required');
      
      
      try {
        // 🆕 Use dataProvider.store.listByIndex instead of apiClient.request
        const entries = await dataProvider.store.listByIndex('audit_logs', 'entityId', packId);
        return entries;
      } catch (error: any) {
        // If loading fails, return empty array instead of crashing
        console.warn(`⚠️ Failed to load audit trail for pack ${packId}:`, error.message);
        return [];
      }
    },
    enabled: !!packId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

// Hook: Get filtered audit trail
export function useAuditTrail(filters?: AuditFilters) {
  return useQuery({
    queryKey: auditKeys.list(filters),
    queryFn: async () => {
      const response = await apiClient.getAuditTrail(filters);
      return response.entries as AuditEntry[];
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

// Hook: Get audit trail for date range
export function useAuditTrailByDateRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: auditKeys.dateRange(startDate, endDate),
    queryFn: async () => {
      const response = await apiClient.getAuditTrail({
        startDate,
        endDate,
      });
      return response.entries as AuditEntry[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes pour historique
    gcTime: 10 * 60 * 1000,
  });
}

// Hook: Create audit entry (automatic via mutations, but can be manual)
export function useCreateAuditEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
      const response = await apiClient.createAuditEntry(entry);
      return response.entry as AuditEntry;
    },
    onSuccess: (newEntry) => {
      // Invalidate relevant audit trails
      queryClient.invalidateQueries({ queryKey: auditKeys.lists() });
      
      if (newEntry.entityType === 'indicator') {
        queryClient.invalidateQueries({ queryKey: auditKeys.indicator(newEntry.entityId) });
      } else if (newEntry.entityType === 'pack') {
        queryClient.invalidateQueries({ queryKey: auditKeys.pack(newEntry.entityId) });
      }
      
      // Don't show toast for automatic audit entries (too noisy)
      // Only show for manual entries if needed
    },
    onError: (error: any) => {
      console.error('Failed to create audit entry:', error);
      // Silent fail for audit entries - don't disrupt user flow
    },
  });
}

// Hook: Export audit trail to CSV/PDF
export function useExportAuditTrail() {
  return useMutation({
    mutationFn: async ({ 
      filters, 
      format 
    }: { 
      filters?: AuditFilters; 
      format: 'csv' | 'pdf' | 'json' 
    }) => {
      const response = await apiClient.exportAuditTrail(filters, format);
      return response;
    },
    onSuccess: (data, variables) => {
      toast.success('Export réussi', {
        description: `Audit trail exporté en ${variables.format.toUpperCase()}`,
      });
    },
    onError: (error: any) => {
      toast.error('Erreur lors de l\'export', {
        description: error.message || 'Une erreur est survenue',
      });
    },
  });
}

// Utility: Format action label
export function getActionLabel(action: AuditEntry['action']): string {
  const labels: Record<AuditEntry['action'], string> = {
    create: 'Créé',
    update: 'Modifié',
    validate: 'Validé',
    reject: 'Rejeté',
    delete: 'Supprimé',
    evidence_added: 'Preuve ajoutée',
    evidence_removed: 'Preuve supprimée',
  };
  return labels[action] || action;
}

// Utility: Get action color
export function getActionColor(action: AuditEntry['action']): string {
  const colors: Record<AuditEntry['action'], string> = {
    create: 'bg-blue-100 text-blue-800',
    update: 'bg-amber-100 text-amber-800',
    validate: 'bg-green-100 text-green-800',
    reject: 'bg-red-100 text-red-800',
    delete: 'bg-red-100 text-red-800',
    evidence_added: 'bg-purple-100 text-purple-800',
    evidence_removed: 'bg-orange-100 text-orange-800',
  };
  return colors[action] || 'bg-gray-100 text-gray-800';
}

// Utility: Format timestamp
export function formatAuditTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

// Hook: Get organization-wide audit trail with pagination
export function useOrganizationAuditTrail(filters?: AuditFilters) {
  return useQuery({
    queryKey: [...auditKeys.organization(), filters],
    queryFn: async () => {
      const response = await apiClient.getOrganizationAuditTrail(filters);
      return {
        entries: (response.entries ?? []) as AuditEntry[],
        total: (response.total ?? 0) as number,
        hasMore: (response.hasMore ?? false) as boolean,
      };
    },
    staleTime: 1 * 60 * 1000,
    gcTime: 3 * 60 * 1000,
    retry: 0, // No retry — local data, failures are immediate
  });
}

// Hook: Get audit statistics
export function useAuditStatistics(filters?: Omit<AuditFilters, 'limit' | 'offset'>) {
  return useQuery({
    queryKey: [...auditKeys.statistics(), filters],
    queryFn: async () => {
      const response = await apiClient.getAuditStatistics(filters);
      return { statistics: response.statistics as AuditStatistics };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 0,
  });
}

// Utility: Get entity type label
export function getEntityTypeLabel(entityType: AuditEntry['entityType']): string {
  const labels: Record<AuditEntry['entityType'], string> = {
    indicator: 'Indicateur',
    pack: 'Pack',
    evidence: 'Preuve',
    folder: 'Dossier',
  };
  return labels[entityType] || entityType;
}

// Utility: Get entity type icon
export function getEntityTypeColor(entityType: AuditEntry['entityType']): string {
  const colors: Record<AuditEntry['entityType'], string> = {
    indicator: 'bg-green-100 text-green-800',
    pack: 'bg-blue-100 text-blue-800',
    evidence: 'bg-purple-100 text-purple-800',
    folder: 'bg-gray-100 text-gray-800',
  };
  return colors[entityType] || 'bg-gray-100 text-gray-800';
}