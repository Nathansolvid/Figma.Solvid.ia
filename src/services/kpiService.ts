/**
 * KPI SERVICE - Gestion des KPIs en mode local
 * 
 * Fonctionnalités :
 * - Mise à jour des valeurs KPI
 * - Validation des KPIs
 * - Liaison avec preuves
 * - Calcul automatique des KPIs computed
 */

import { dataProvider, KPIRequirement } from './dataProvider';
import { toast } from 'sonner';

class KPIService {
  private static instance: KPIService;

  private constructor() {}

  static getInstance(): KPIService {
    if (!KPIService.instance) {
      KPIService.instance = new KPIService();
    }
    return KPIService.instance;
  }

  /**
   * Update KPI value
   */
  async updateKPI(
    kpiId: string,
    updates: Partial<KPIRequirement>,
    userId: string,
    userName: string,
    userRole: string
  ): Promise<void> {
    try {
      const kpi = await dataProvider.store.read('kpi_requirements', kpiId);
      
      if (!kpi) {
        throw new Error('KPI not found');
      }

      const updatedKPI: KPIRequirement = {
        ...kpi,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await dataProvider.store.update('kpi_requirements', updatedKPI);

      // Log action
      await dataProvider.store.logAction({
        entityType: 'kpi',
        entityId: kpiId,
        action: 'KPI_VALUE_UPDATED',
        userId,
        userName,
        userRole,
        before: JSON.stringify({ value: kpi.value, status: kpi.status }),
        after: JSON.stringify({ value: updates.value, status: updates.status }),
        details: JSON.stringify({ code: kpi.code, name: kpi.name }),
      });

      toast.success('KPI mis à jour', {
        description: kpi.name,
      });
    } catch (error: any) {
      console.error('❌ Update KPI error:', error);
      toast.error('Erreur lors de la mise à jour', { description: error.message });
      throw error;
    }
  }

  /**
   * Validate KPI
   */
  async validateKPI(
    kpiId: string,
    userId: string,
    userName: string,
    userRole: string
  ): Promise<void> {
    try {
      const kpi = await dataProvider.store.read('kpi_requirements', kpiId);
      
      if (!kpi) {
        throw new Error('KPI not found');
      }

      if (kpi.status !== 'provided') {
        throw new Error('KPI must be in "provided" status to be validated');
      }

      const updatedKPI: KPIRequirement = {
        ...kpi,
        status: 'validated',
        updatedAt: new Date().toISOString(),
      };

      await dataProvider.store.update('kpi_requirements', updatedKPI);

      // Log action
      await dataProvider.store.logAction({
        entityType: 'kpi',
        entityId: kpiId,
        action: 'KPI_VALIDATED',
        userId,
        userName,
        userRole,
        details: JSON.stringify({ code: kpi.code, name: kpi.name }),
      });

      toast.success('KPI validé', {
        description: kpi.name,
      });
    } catch (error: any) {
      console.error('❌ Validate KPI error:', error);
      toast.error('Erreur lors de la validation', { description: error.message });
      throw error;
    }
  }

  /**
   * Get KPI by ID
   */
  async getKPI(kpiId: string): Promise<KPIRequirement | null> {
    try {
      return await dataProvider.store.read('kpi_requirements', kpiId);
    } catch (error) {
      console.error('❌ Get KPI error:', error);
      return null;
    }
  }

  /**
   * List KPIs by pack
   */
  async listKPIsByPack(packId: string): Promise<KPIRequirement[]> {
    try {
      return await dataProvider.store.listByIndex('kpi_requirements', 'packId', packId);
    } catch (error) {
      console.error('❌ List KPIs error:', error);
      return [];
    }
  }

  /**
   * List all KPIs
   */
  async listAllKPIs(): Promise<KPIRequirement[]> {
    try {
      return await dataProvider.store.list('kpi_requirements');
    } catch (error) {
      console.error('❌ List all KPIs error:', error);
      return [];
    }
  }
}

export const kpiService = KPIService.getInstance();
