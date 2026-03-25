/**
 * API CLIENT STUB - DEPRECATED
 * 
 * Ce fichier est un stub pour éviter les erreurs d'import.
 * L'application fonctionne maintenant 100% en mode LOCAL.
 * 
 * Utilisez plutôt :
 * - authService pour l'authentification
 * - packService pour les packs
 * - kpiService pour les KPIs
 * - evidenceService pour les preuves
 * - dataProvider pour l'accès direct aux données
 */

import { packService } from './packService';
import { authService } from './authService';
import { evidenceService } from './evidenceService';
import { dataProvider } from './dataProvider'; // 🆕 Add dataProvider import

// 🆕 API Client qui forward vers les vrais services
export const apiClient = {
  // Auth (forward to authService)
  signup: () => { throw new Error('API deprecated - use authService'); },
  login: () => { throw new Error('API deprecated - use authService'); },
  logout: () => { throw new Error('API deprecated - use authService'); },
  getSession: () => { throw new Error('API deprecated - use authService'); },
  
  // Packs (forward to packService)
  listPacks: () => { throw new Error('API deprecated - use packService'); },
  createPack: (data: any) => packService.createPack(data),
  getPack: () => { throw new Error('API deprecated - use packService'); },
  deletePack: () => { throw new Error('API deprecated - use packService'); },
  updatePack: (id: string, data: any) => packService.updatePack(id, data),
  listPacksDirect: () => packService.listPacksLocal(),
  getPackFull: () => { throw new Error('API deprecated - use packService'); },
  getPackFullDirect: async (packId: string) => {
    const pack = await packService.getPack(packId);
    return { pack };
  },
  deletePackDirect: (id: string) => packService.deletePackDirect(id),
  
  // KPIs / Indicators
  updateIndicator: () => { throw new Error('API deprecated - use kpiService'); },
  markIndicatorAsProvided: async (packId: string, folderId: string, indicatorId: string) => {
    const indicator = await dataProvider.store.read('indicators', indicatorId);
    if (!indicator) throw new Error('Indicator not found');
    await dataProvider.store.update('indicators', { ...indicator, status: 'provided', updatedAt: new Date().toISOString() });
    return { success: true };
  },
  markIndicatorAsMissing: async (packId: string, folderId: string, indicatorId: string) => {
    const indicator = await dataProvider.store.read('indicators', indicatorId);
    if (!indicator) throw new Error('Indicator not found');
    await dataProvider.store.update('indicators', { ...indicator, status: 'missing', updatedAt: new Date().toISOString() });
    return { success: true };
  },
  deleteIndicator: async (packId: string, folderId: string, indicatorId: string) => {
    await dataProvider.store.delete('indicators', indicatorId);
    return { success: true };
  },
  
  // Evidence (forward to evidenceService)
  uploadEvidence: () => { throw new Error('API deprecated - use evidenceService'); },
  listEvidence: () => { throw new Error('API deprecated - use evidenceService'); },
  deleteEvidence: () => { throw new Error('API deprecated - use evidenceService'); },
  downloadEvidence: async (evidenceId: string) => {
    const evidence = await dataProvider.store.read('evidence', evidenceId);
    if (!evidence) throw new Error('Evidence not found');
    return { evidence };
  },
  
  // Audit Trail (local IndexedDB — graceful fallback if store missing)
  getAuditTrail: async (filters?: any) => {
    try {
      const entries = await dataProvider.store.list('audit_logs');
      return { entries: entries ?? [] };
    } catch { return { entries: [] }; }
  },
  getOrganizationAuditTrail: async (filters?: any) => {
    try {
      const entries = await dataProvider.store.list('audit_logs') ?? [];
      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;
      return {
        entries: entries.slice(offset, offset + limit),
        total: entries.length,
        hasMore: offset + limit < entries.length,
      };
    } catch {
      return { entries: [], total: 0, hasMore: false };
    }
  },
  getIndicatorAuditTrail: async (indicatorId: string) => {
    try {
      const entries = await dataProvider.store.listByIndex('audit_logs', 'entityId', indicatorId);
      return { entries: entries ?? [] };
    } catch { return { entries: [] }; }
  },
  getAuditStatistics: async (filters?: any) => {
    try {
      const entries = await dataProvider.store.list('audit_logs') ?? [];
      return {
        statistics: {
          totalEntries: entries.length,
          entriesByAction: {},
          entriesByEntityType: {},
          entriesByUser: [],
          mostActiveEntities: [],
          recentActivity: [],
        },
      };
    } catch {
      return {
        statistics: {
          totalEntries: 0, entriesByAction: {}, entriesByEntityType: {},
          entriesByUser: [], mostActiveEntities: [], recentActivity: [],
        },
      };
    }
  },
  createAuditEntry: async (entry: any) => {
    const newEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    await dataProvider.store.create('audit_logs', newEntry);
    return { entry: newEntry };
  },
  exportAuditTrail: async (filters?: any, format?: string) => {
    const entries = await dataProvider.store.list('audit_logs');
    return { entries, format };
  },

  // 🆕 Transparency / Calculation (return empty data - not implemented yet)
  getCalculationProfile: async (indicatorId: string) => {
    return { profile: null };
  },
  getCalculationInputs: async (profileId: string) => {
    return { inputs: [] };
  },
  getCalculationFactors: async (profileId: string) => {
    return { factors: [] };
  },
  getCalculationLogs: async (profileId: string) => {
    return { logs: [] };
  },
  getCalculationSummary: async (indicatorId: string) => {
    return { summary: null };
  },
  getCalculationWarnings: async (indicatorId: string) => {
    return { warnings: [] };
  },
  updateCalculationProfile: async (profileId: string, updates: any) => {
    return { profile: { id: profileId, ...updates } };
  },
  addCalculationInput: async (input: any) => {
    return { input: { ...input, id: crypto.randomUUID() } };
  },
  updateCalculationInput: async (inputId: string, updates: any) => {
    return { input: { id: inputId, ...updates } };
  },
  deleteCalculationInput: async (inputId: string) => {
    return { success: true };
  },
  validateCalculation: async (profileId: string, comment?: string) => {
    return { profile: { id: profileId, validated: true, comment } };
  },
  
  // 🆕 Autres méthodes manquantes
  getOrganization: () => { throw new Error('API deprecated'); },
  request: async (url: string, options?: any) => {
    console.warn(`⚠️ apiClient.request() called with URL: ${url} - This method is deprecated`);
    return { data: null };
  },
};