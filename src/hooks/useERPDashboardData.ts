/**
 * Hook for loading ERP-derived ESG data into the dashboard.
 * Reads ESGDataPoints and supplier summary from localStorage
 * (persisted by erpConnectorService after each enriched sync).
 */

import { useState, useEffect, useCallback } from 'react';
import type { ESGDataPoint } from '@/types/erp';
import type { SupplierCategorySummary } from '@/services/erpCategorizationEngine';

const STORAGE_KEY_ESG = 'solvid_erp_esg_points';
const STORAGE_KEY_SUPPLIERS = 'solvid_erp_supplier_summary';
const STORAGE_KEY_SYNC_META = 'solvid_erp_last_sync_meta';

export interface ERPSyncMeta {
  connectionId: string;
  connectionName: string;
  provider: string;
  syncDate: string;
  recordCount: number;
}

export interface ERPDashboardData {
  esgPoints: ESGDataPoint[];
  supplierSummary: SupplierCategorySummary[];
  syncMeta: ERPSyncMeta | null;
  hasData: boolean;
  // Derived helpers
  getPoint: (vsmeCode: string) => ESGDataPoint | undefined;
  getPointsByPillar: (pillar: 'E' | 'S' | 'G') => ESGDataPoint[];
  totalEmissions: number; // Scope 1 + 2 + 3
  scope1: number;
  scope2: number;
  scope3: number;
  reload: () => void;
}

export function useERPDashboardData(): ERPDashboardData {
  const [esgPoints, setEsgPoints] = useState<ESGDataPoint[]>([]);
  const [supplierSummary, setSupplierSummary] = useState<SupplierCategorySummary[]>([]);
  const [syncMeta, setSyncMeta] = useState<ERPSyncMeta | null>(null);

  const load = useCallback(() => {
    try {
      const rawEsg = localStorage.getItem(STORAGE_KEY_ESG);
      const rawSup = localStorage.getItem(STORAGE_KEY_SUPPLIERS);
      const rawMeta = localStorage.getItem(STORAGE_KEY_SYNC_META);
      setEsgPoints(rawEsg ? JSON.parse(rawEsg) : []);
      setSupplierSummary(rawSup ? JSON.parse(rawSup) : []);
      setSyncMeta(rawMeta ? JSON.parse(rawMeta) : null);
    } catch (e) {
      console.error('[useERPDashboardData] Failed to load:', e);
      setEsgPoints([]);
      setSupplierSummary([]);
      setSyncMeta(null);
    }
  }, []);

  useEffect(() => {
    load();
    // Listen for ERP sync events
    const handler = () => load();
    window.addEventListener('erp-sync-completed', handler);
    return () => window.removeEventListener('erp-sync-completed', handler);
  }, [load]);

  const getPoint = useCallback(
    (vsmeCode: string) => esgPoints.find(p => p.vsmeCode === vsmeCode),
    [esgPoints],
  );

  const getPointsByPillar = useCallback(
    (pillar: 'E' | 'S' | 'G') => esgPoints.filter(p => p.pillar === pillar),
    [esgPoints],
  );

  const scope1 = esgPoints.find(p => p.vsmeCode === 'B7.1')?.value ?? 0;
  const scope2 = esgPoints.find(p => p.vsmeCode === 'B7.2')?.value ?? 0;
  const scope3 = esgPoints.find(p => p.vsmeCode === 'B7.3')?.value ?? 0;

  return {
    esgPoints,
    supplierSummary,
    syncMeta,
    hasData: esgPoints.length > 0,
    getPoint,
    getPointsByPillar,
    totalEmissions: scope1 + scope2 + scope3,
    scope1,
    scope2,
    scope3,
    reload: load,
  };
}
