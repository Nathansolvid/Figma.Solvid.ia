/**
 * VSMEDataContext — Persistance des valeurs saisies par dossier + période
 * Chaque valeur = { dossierId, code, rawValue, statut, period }
 * Persisté dans IndexedDB (store: vsme_values)
 * Calcule automatiquement les champs "Calculé"
 *
 * 🆕 Phase 12 : Support des périodes (annuel / trimestriel)
 */
import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import {
  idbGetValuesByDossierPeriod,
  idbGetAllPeriodsForDossier,
  idbPutValue,
  idbDeleteValuesByDossier,
  makeValueId,
  DEFAULT_PERIOD,
  type VSMEValue,
} from '@/services/idbService';
import type { StatutSaisie } from '@/data/vsme-data';
import { MODULE_B, MODULE_C } from '@/data/vsme-data';

// ─── Computed field formulas ─────────────────────────────────────────────────
const COMPUTED_FORMULAS: Record<string, (v: Record<string, string>) => string> = {
  "B3.3": v => {
    const a = parseFloat(v["B3.1"] ?? ""), b = parseFloat(v["B3.2"] ?? "");
    return isNaN(a) || isNaN(b) ? "" : String(Math.max(0, a - b));
  },
  "B3.4": v => {
    const e = parseFloat(v["B3.1"] ?? ""), ca = parseFloat(v["B1.2"] ?? "");
    return isNaN(e) || isNaN(ca) || ca === 0 ? "" : (e / (ca / 1_000_000)).toFixed(2);
  },
  "B5.4": v => {
    const val = parseFloat(v["B5.3"] ?? ""), tot = parseFloat(v["B5.1"] ?? "");
    return isNaN(val) || isNaN(tot) || tot === 0 ? "" : ((val / tot) * 100).toFixed(1);
  },
  "B7.4": v => {
    const s1 = parseFloat(v["B7.1"] ?? ""), s2 = parseFloat(v["B7.2"] ?? "");
    return isNaN(s1) || isNaN(s2) ? "" : String(s1 + s2);
  },
  "B7.5": v => {
    const ges = parseFloat(v["B7.4"] ?? ""), ca = parseFloat(v["B1.2"] ?? "");
    return isNaN(ges) || isNaN(ca) || ca === 0 ? "" : (ges / (ca / 1_000_000)).toFixed(2);
  },
  "B8.4": v => {
    const _ = v; void _;
    return "";
  },
};

// ─── Cumul annuel : détermination de la méthode par indicateur ────────────────

/** Unités cumulatives (flux) : le total annuel = somme des trimestres */
const SUM_UNITS = ['MWh/an', 'tCO₂e/an', 'm³/an', 'tonnes/an', '€/an', 'h/an', 'nbre', 'ETP', '€', 'ha'];

/** Unités en ratio/pourcentage : la valeur annuelle = moyenne des trimestres */
const AVG_UNITS = ['%', 'MWh/M€', 'tCO₂e/M€', 'tf', 'tg', 'jours/ETP'];

/** Tous les datapoints indexés par code */
const ALL_DPS_BY_CODE = new Map(
  [...MODULE_B, ...MODULE_C]
    .flatMap(s => s.datapoints)
    .map(dp => [dp.code, dp])
);

type AggMethod = 'sum' | 'average' | 'latest';

function getAggMethod(code: string): AggMethod {
  const dp = ALL_DPS_BY_CODE.get(code);
  if (!dp) return 'latest';
  if (dp.type === 'Narratif' || dp.type === 'Qualitatif') return 'latest';
  if (dp.type === 'Calculé') return 'sum'; // recalculé après cumul
  const unite = dp.unite ?? '';
  if (SUM_UNITS.some(u => unite === u)) return 'sum';
  if (AVG_UNITS.some(u => unite === u)) return 'average';
  return 'sum'; // default pour Quantitatif
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface DossierValues {
  values: Record<string, string>;          // code → rawValue
  statuts: Record<string, StatutSaisie>;   // code → statut
  loaded: boolean;
}

interface StatResult {
  filled: number;
  total: number;
  pct: number;
}

interface ValueComparison {
  value1: string;
  value2: string;
  delta: number | null;
  deltaPct: number | null;
}

interface VSMEDataContextType {
  // Données d'un dossier (utilise la période active si non spécifiée)
  getValues: (dossierId: string, period?: string) => DossierValues;
  // Met à jour une valeur
  setValue: (dossierId: string, code: string, raw: string, statut: StatutSaisie, period?: string) => void;
  // Force le rechargement depuis IDB
  loadDossier: (dossierId: string, period?: string) => Promise<void>;
  // Supprime toutes les valeurs d'un dossier
  clearDossier: (dossierId: string) => Promise<void>;
  // Stats de completion
  getStats: (dossierId: string, module: 'B' | 'C' | 'all', period?: string) => StatResult;
  // Stats par pilier E/S/G
  getStatsByPilier: (dossierId: string, period?: string) => Record<'E' | 'S' | 'G', StatResult>;

  // 🆕 Phase 12 : Gestion des périodes
  getActivePeriod: (dossierId: string) => string;
  setActivePeriod: (dossierId: string, period: string) => void;
  getAvailablePeriods: (dossierId: string) => string[];
  loadAvailablePeriods: (dossierId: string) => Promise<string[]>;
  getValueComparison: (dossierId: string, code: string, period1: string, period2: string) => ValueComparison;
  // 🆕 Phase 12 Step 4 : Cumul annuel
  computeAnnualValues: (dossierId: string, year: string) => DossierValues;
}

const VSMEDataContext = createContext<VSMEDataContextType | undefined>(undefined);

/** Clé composite pour le cache : dossierId + period */
function cacheKey(dossierId: string, period: string): string {
  return `${dossierId}::${period}`;
}

export function VSMEDataProvider({ children }: { children: ReactNode }) {
  // data[cacheKey] = DossierValues  (cacheKey = dossierId::period)
  const [data, setData] = useState<Record<string, DossierValues>>({});

  // 🆕 Période active par dossier
  const [activePeriods, setActivePeriodsState] = useState<Record<string, string>>({});

  // 🆕 Périodes disponibles par dossier
  const [availablePeriods, setAvailablePeriods] = useState<Record<string, string[]>>({});

  // ── Helpers période ────────────────────────────────────────────────────────
  const getActivePeriod = useCallback((dossierId: string): string => {
    return activePeriods[dossierId] || DEFAULT_PERIOD;
  }, [activePeriods]);

  const setActivePeriod = useCallback((dossierId: string, period: string) => {
    setActivePeriodsState(prev => ({ ...prev, [dossierId]: period }));
  }, []);

  const getAvailablePeriods = useCallback((dossierId: string): string[] => {
    return availablePeriods[dossierId] || [DEFAULT_PERIOD];
  }, [availablePeriods]);

  const loadAvailablePeriods = useCallback(async (dossierId: string): Promise<string[]> => {
    const periods = await idbGetAllPeriodsForDossier(dossierId);
    const result = periods.length > 0 ? periods : [DEFAULT_PERIOD];
    setAvailablePeriods(prev => ({ ...prev, [dossierId]: result }));
    return result;
  }, []);

  // ── Charger un dossier depuis IDB (avec période) ──────────────────────────
  const loadDossier = useCallback(async (dossierId: string, period?: string) => {
    const p = period || activePeriods[dossierId] || DEFAULT_PERIOD;
    const stored = await idbGetValuesByDossierPeriod(dossierId, p);
    const values: Record<string, string> = {};
    const statuts: Record<string, StatutSaisie> = {};
    for (const item of stored) {
      values[item.code] = item.rawValue;
      statuts[item.code] = item.statut;
    }
    const key = cacheKey(dossierId, p);
    setData(prev => ({
      ...prev,
      [key]: { values, statuts, loaded: true },
    }));
    // Charger aussi les périodes disponibles
    loadAvailablePeriods(dossierId);
  }, [activePeriods, loadAvailablePeriods]);

  // ── Récupère les données d'un dossier ─────────────────────────────────────
  const getValues = useCallback((dossierId: string, period?: string): DossierValues => {
    const p = period || activePeriods[dossierId] || DEFAULT_PERIOD;
    const key = cacheKey(dossierId, p);
    const existing = data[key];
    if (!existing) {
      loadDossier(dossierId, p);
      return { values: {}, statuts: {}, loaded: false };
    }
    return existing;
  }, [data, activePeriods, loadDossier]);

  // ── Mettre à jour une valeur ──────────────────────────────────────────────
  const setValue = useCallback((
    dossierId: string,
    code: string,
    raw: string,
    statut: StatutSaisie,
    period?: string,
  ) => {
    const p = period || activePeriods[dossierId] || DEFAULT_PERIOD;
    const key = cacheKey(dossierId, p);

    setData(prev => {
      const dossierData = prev[key] ?? { values: {}, statuts: {}, loaded: true };
      const newValues = { ...dossierData.values, [code]: raw };
      const newStatuts = { ...dossierData.statuts, [code]: statut };

      // Recalcul des champs calculés qui dépendent de cette valeur
      for (const [computedCode, formula] of Object.entries(COMPUTED_FORMULAS)) {
        const result = formula(newValues);
        newValues[computedCode] = result;
        newStatuts[computedCode] = result !== "" ? "filled" : "empty";
      }

      // Persister la valeur principale (avec période)
      const now = new Date().toISOString();
      const oldValue = dossierData.values[code] || '';
      const vsmeVal: VSMEValue = {
        id: makeValueId(dossierId, code, p),
        dossierId,
        code,
        rawValue: raw,
        statut,
        updatedAt: now,
        period: p,
      };
      idbPutValue(vsmeVal);

      // ── Audit trail: debounced — only log final value after user stops typing
      if (oldValue !== raw) {
        const auditTimerKey = `__audit_timer_${dossierId}_${code}`;
        const auditStartKey = `__audit_start_${dossierId}_${code}`;
        // Store the "before" value on first keystroke
        if (!(window as any)[auditStartKey]) {
          (window as any)[auditStartKey] = oldValue;
        }
        // Clear previous timer
        if ((window as any)[auditTimerKey]) {
          clearTimeout((window as any)[auditTimerKey]);
        }
        // Set new timer — log after 1.5s of inactivity
        (window as any)[auditTimerKey] = setTimeout(() => {
          const startValue = (window as any)[auditStartKey] ?? '';
          const finalValue = raw;
          if (startValue !== finalValue) {
            const auditKey = `solvid_audit_${dossierId}`;
            try {
              const existing = JSON.parse(localStorage.getItem(auditKey) || '[]');
              existing.push({
                code,
                period: p,
                oldValue: startValue,
                newValue: finalValue,
                timestamp: new Date().toISOString(),
                userId: (window as any).__solvid_current_user_name || 'unknown',
              });
              if (existing.length > 500) existing.splice(0, existing.length - 500);
              localStorage.setItem(auditKey, JSON.stringify(existing));
            } catch { /* ignore */ }
          }
          // Reset start value
          delete (window as any)[auditStartKey];
          delete (window as any)[auditTimerKey];
        }, 1500);
      }

      // Persister les computed aussi
      for (const [computedCode] of Object.entries(COMPUTED_FORMULAS)) {
        if (computedCode !== code) {
          idbPutValue({
            id: makeValueId(dossierId, computedCode, p),
            dossierId,
            code: computedCode,
            rawValue: newValues[computedCode] ?? "",
            statut: newStatuts[computedCode] ?? "empty",
            updatedAt: now,
            period: p,
          });
        }
      }

      return {
        ...prev,
        [key]: { values: newValues, statuts: newStatuts, loaded: true },
      };
    });

    // Mettre à jour la liste des périodes disponibles si c'est une nouvelle période
    setAvailablePeriods(prev => {
      const existing = prev[dossierId] || [DEFAULT_PERIOD];
      if (!existing.includes(p)) {
        return { ...prev, [dossierId]: [...existing, p].sort() };
      }
      return prev;
    });

    // Notifier le dashboard et les autres composants
    window.dispatchEvent(new CustomEvent('vsme-value-changed', {
      detail: { dossierId, code, value: raw, period: p },
    }));
  }, [activePeriods]);

  // ── Stats par pilier E/S/G ────────────────────────────────────────────────
  const getStatsByPilier = useCallback((
    dossierId: string,
    period?: string,
  ): Record<'E' | 'S' | 'G', StatResult> => {
    const p = period || activePeriods[dossierId] || DEFAULT_PERIOD;
    const key = cacheKey(dossierId, p);
    const dossierData = data[key];

    const result = {} as Record<'E' | 'S' | 'G', StatResult>;
    for (const pilier of ['E', 'S', 'G'] as const) {
      const dps = MODULE_B
        .flatMap(s => s.datapoints)
        .filter(dp => dp.pilier === pilier && !dp.computed);
      const total = dps.length;
      const filled = dossierData
        ? dps.filter(dp => dossierData.statuts[dp.code] === 'filled').length
        : 0;
      result[pilier] = { total, filled, pct: total > 0 ? Math.round((filled / total) * 100) : 0 };
    }
    return result;
  }, [data, activePeriods]);

  const clearDossier = useCallback(async (dossierId: string) => {
    await idbDeleteValuesByDossier(dossierId);
    setData(prev => {
      const next = { ...prev };
      // Supprimer toutes les entrées de cache pour ce dossier
      for (const k of Object.keys(next)) {
        if (k.startsWith(`${dossierId}::`)) {
          delete next[k];
        }
      }
      return next;
    });
    setAvailablePeriods(prev => {
      const next = { ...prev };
      delete next[dossierId];
      return next;
    });
  }, []);

  // ── Stats de complétion ───────────────────────────────────────────────────
  const getStats = useCallback((dossierId: string, module: 'B' | 'C' | 'all', period?: string): StatResult => {
    const p = period || activePeriods[dossierId] || DEFAULT_PERIOD;
    const key = cacheKey(dossierId, p);
    const dossierData = data[key];
    if (!dossierData) return { filled: 0, total: 0, pct: 0 };

    const sections = module === 'B' ? MODULE_B : module === 'C' ? MODULE_C : [...MODULE_B, ...MODULE_C];
    const allDps = sections.flatMap(s => s.datapoints).filter(dp => !dp.computed);
    const total = allDps.length;
    const filled = allDps.filter(dp => dossierData.statuts[dp.code] === 'filled').length;
    const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
    return { filled, total, pct };
  }, [data, activePeriods]);

  // 🆕 Phase 12 : Comparaison entre 2 périodes
  const getValueComparison = useCallback((
    dossierId: string,
    code: string,
    period1: string,
    period2: string,
  ): ValueComparison => {
    const key1 = cacheKey(dossierId, period1);
    const key2 = cacheKey(dossierId, period2);
    const data1 = data[key1];
    const data2 = data[key2];

    const value1 = data1?.values[code] ?? "";
    const value2 = data2?.values[code] ?? "";

    const num1 = parseFloat(value1);
    const num2 = parseFloat(value2);

    let delta: number | null = null;
    let deltaPct: number | null = null;

    if (!isNaN(num1) && !isNaN(num2)) {
      delta = num2 - num1;
      if (num1 !== 0) {
        deltaPct = Math.round(((num2 - num1) / Math.abs(num1)) * 100);
      }
    }

    return { value1, value2, delta, deltaPct };
  }, [data]);

  // 🆕 Phase 12 Step 4 : Cumul annuel automatique
  const computeAnnualValues = useCallback((dossierId: string, year: string): DossierValues => {
    const quarters = [`${year}-T1`, `${year}-T2`, `${year}-T3`, `${year}-T4`];
    const quarterData = quarters.map(q => {
      const k = cacheKey(dossierId, q);
      return data[k];
    });

    // Si aucun trimestre n'est chargé, retourner vide
    if (quarterData.every(d => !d)) {
      return { values: {}, statuts: {}, loaded: false };
    }

    // Collecter tous les codes existants dans les trimestres
    const allCodes = new Set<string>();
    for (const qd of quarterData) {
      if (qd) {
        for (const code of Object.keys(qd.values)) {
          allCodes.add(code);
        }
      }
    }

    const values: Record<string, string> = {};
    const statuts: Record<string, StatutSaisie> = {};

    for (const code of allCodes) {
      const method = getAggMethod(code);
      const dp = ALL_DPS_BY_CODE.get(code);
      if (dp?.computed) continue; // Les calculés seront recalculés après

      const quarterValues = quarters
        .map((_, i) => quarterData[i]?.values[code])
        .filter((v): v is string => v !== undefined && v !== '');
      const numValues = quarterValues.map(parseFloat).filter(n => !isNaN(n));

      if (method === 'sum') {
        if (numValues.length > 0) {
          values[code] = String(numValues.reduce((a, b) => a + b, 0));
          statuts[code] = 'filled';
        }
      } else if (method === 'average') {
        if (numValues.length > 0) {
          const avg = numValues.reduce((a, b) => a + b, 0) / numValues.length;
          values[code] = avg.toFixed(2);
          statuts[code] = 'filled';
        }
      } else {
        // latest: prendre la dernière valeur remplie (T4 > T3 > T2 > T1)
        for (let i = quarters.length - 1; i >= 0; i--) {
          const val = quarterData[i]?.values[code];
          if (val && val.trim() !== '') {
            values[code] = val;
            statuts[code] = 'filled';
            break;
          }
        }
      }
    }

    // Recalculer les champs calculés sur les valeurs cumulées
    for (const [computedCode, formula] of Object.entries(COMPUTED_FORMULAS)) {
      const result = formula(values);
      values[computedCode] = result;
      statuts[computedCode] = result !== '' ? 'filled' : 'empty';
    }

    return { values, statuts, loaded: true };
  }, [data]);

  const value = useMemo(() => ({
    getValues,
    setValue,
    loadDossier,
    clearDossier,
    getStats,
    getStatsByPilier,
    getActivePeriod,
    setActivePeriod,
    getAvailablePeriods,
    loadAvailablePeriods,
    getValueComparison,
    computeAnnualValues,
  }), [
    getValues, setValue, loadDossier, clearDossier,
    getStats, getStatsByPilier, getActivePeriod, setActivePeriod,
    getAvailablePeriods, loadAvailablePeriods, getValueComparison, computeAnnualValues,
  ]);

  return (
    <VSMEDataContext.Provider value={value}>
      {children}
    </VSMEDataContext.Provider>
  );
}

export function useVSMEData() {
  const ctx = useContext(VSMEDataContext);
  if (!ctx) throw new Error('useVSMEData must be used within VSMEDataProvider');
  return ctx;
}
