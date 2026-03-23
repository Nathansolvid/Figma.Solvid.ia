/**
 * Solvid.IA — IndexedDB persistence layer
 * Stores: dossiers, vsme_values, mission_notes
 * Write-through: async sync to Supabase via syncEngine
 */
import { openDB, type IDBPDatabase } from 'idb';
import type { Dossier } from '@/contexts/DossierContext';
import { syncEngine } from './syncEngine';

const DB_NAME = 'solvid-ia-db';
const DB_VERSION = 4;

/** Période par défaut (exercice fiscal annuel) */
export const DEFAULT_PERIOD = '2025';

export interface VSMEValue {
  id: string;          // `${dossierId}::${code}::${period}`
  dossierId: string;
  code: string;        // ex: "B3.1"
  rawValue: string;    // toujours string pour l'input
  statut: 'empty' | 'partial' | 'filled';
  updatedAt: string;
  period: string;      // 🆕 Phase 12 : "2025", "2025-T1", "2025-T2", etc.
}

export interface MissionNote {
  id: string;          // `${dossierId}::note::${timestamp}`
  dossierId: string;
  content: string;
  author: string;
  category: 'general' | 'relance' | 'blocage' | 'decision' | 'observation';
  createdAt: string;
}

// Singleton DB promise
let _db: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!_db) {
    _db = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        // v1 — stores de base
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains('dossiers')) {
            db.createObjectStore('dossiers', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('vsme_values')) {
            const store = db.createObjectStore('vsme_values', { keyPath: 'id' });
            store.createIndex('by_dossier', 'dossierId', { unique: false });
          }
        }
        // v2 — notes de mission
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('dossiers')) {
            db.createObjectStore('dossiers', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('vsme_values')) {
            const store = db.createObjectStore('vsme_values', { keyPath: 'id' });
            store.createIndex('by_dossier', 'dossierId', { unique: false });
          }
          if (!db.objectStoreNames.contains('mission_notes')) {
            const store = db.createObjectStore('mission_notes', { keyPath: 'id' });
            store.createIndex('by_dossier', 'dossierId', { unique: false });
          }
        }
        // v3 — Phase 12 : support des périodes (trimestriel/annuel)
        if (oldVersion < 3) {
          if (db.objectStoreNames.contains('vsme_values')) {
            const store = transaction.objectStore('vsme_values');
            if (!store.indexNames.contains('by_dossier_period')) {
              store.createIndex('by_dossier_period', ['dossierId', 'period'], { unique: false });
            }
          }
        }
        // v4 — RGPD Phase 1 : index dossiers par organisation
        if (oldVersion < 4) {
          if (db.objectStoreNames.contains('dossiers')) {
            const dossierStore = transaction.objectStore('dossiers');
            if (!dossierStore.indexNames.contains('by_org')) {
              dossierStore.createIndex('by_org', 'organizationId', { unique: false });
            }
          }
        }
      },
    });
  }
  return _db;
}

// ─── Migration v2→v3 : ajout du champ period aux records existants ───────────
let _migrationDone = false;

async function ensurePeriodMigration(): Promise<void> {
  if (_migrationDone) return;
  _migrationDone = true;

  try {
    const db = await getDB();
    const all = await db.getAll('vsme_values');
    const needsMigration = all.filter((r: any) => !r.period);

    if (needsMigration.length === 0) return;

    const tx = db.transaction('vsme_values', 'readwrite');
    for (const record of needsMigration) {
      const newId = `${record.dossierId}::${record.code}::${DEFAULT_PERIOD}`;
      // Supprimer l'ancien enregistrement (ancien format d'ID)
      await tx.store.delete(record.id);
      // Réécrire avec le nouveau format
      await tx.store.put({
        ...record,
        id: newId,
        period: DEFAULT_PERIOD,
      });
    }
    await tx.done;
  } catch (e) {
    console.error('[IDB] Migration v3 error:', e);
    _migrationDone = false; // Retry on next access
  }
}

// ─── Dossiers ────────────────────────────────────────────────────────────────
export async function idbGetDossiers(): Promise<Dossier[]> {
  try {
    const db = await getDB();
    return await db.getAll('dossiers');
  } catch (e) {
    console.error('[IDB] getAll dossiers error:', e);
    return [];
  }
}

/** RGPD Phase 1 : Récupère les dossiers filtrés par organisation */
export async function idbGetDossiersByOrg(orgId: string): Promise<Dossier[]> {
  try {
    await ensurePeriodMigration();
    const db = await getDB();
    if (!orgId) return db.getAll('dossiers');
    return db.getAllFromIndex('dossiers', 'by_org', orgId);
  } catch (e) {
    console.error('[IDB] getDossiersByOrg error:', e);
    return [];
  }
}

export async function idbPutDossier(dossier: Dossier): Promise<void> {
  try {
    const db = await getDB();
    await db.put('dossiers', dossier);
    // Write-through to Supabase (non-blocking)
    if (syncEngine.enabled && syncEngine.organizationId) {
      syncEngine.syncToCloud('dossiers', 'UPDATE', {
        id: dossier.id,
        name: dossier.name,
        client_org: dossier.clientOrg,
        fiscal_year: dossier.fiscalYear,
        referentiel_id: (dossier as any).referentielId ?? null,
        mission_type: dossier.missionType,
        pathway_type: dossier.pathwayType,
        provider_org: dossier.providerOrg,
        lead_consultant: dossier.leadConsultant,
        start_date: dossier.startDate,
        end_date: dossier.endDate ?? null,
        selected_workflows: (dossier as any).selectedWorkflows ?? [],
        pack_type: (dossier as any).packType ?? null,
        status: dossier.status ?? 'active',
        period_mode: dossier.periodMode ?? 'annuel',
        custom_periods: dossier.customPeriods ?? [],
        organization_id: syncEngine.organizationId,
        owner_id: syncEngine.userId,
        updated_at: new Date().toISOString(),
      }).catch(() => {}); // queued if offline
    }
  } catch (e) {
    console.error('[IDB] put dossier error:', e);
  }
}

export async function idbDeleteDossier(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('dossiers', id);
    // Write-through to Supabase
    if (syncEngine.enabled) {
      syncEngine.syncToCloud('dossiers', 'DELETE', { id }).catch(() => {});
    }
  } catch (e) {
    console.error('[IDB] delete dossier error:', e);
  }
}

// ─── VSME Values ─────────────────────────────────────────────────────────────

/** Récupère toutes les valeurs d'un dossier (toutes périodes confondues) */
export async function idbGetValuesByDossier(dossierId: string): Promise<VSMEValue[]> {
  try {
    await ensurePeriodMigration();
    const db = await getDB();
    return await db.getAllFromIndex('vsme_values', 'by_dossier', dossierId);
  } catch (e) {
    console.error('[IDB] getValues error:', e);
    return [];
  }
}

/** 🆕 Phase 12 : Récupère les valeurs d'un dossier pour une période spécifique */
export async function idbGetValuesByDossierPeriod(dossierId: string, period: string): Promise<VSMEValue[]> {
  try {
    await ensurePeriodMigration();
    const db = await getDB();
    return await db.getAllFromIndex('vsme_values', 'by_dossier_period', [dossierId, period]);
  } catch (e) {
    console.error('[IDB] getValuesByPeriod error:', e);
    return [];
  }
}

/** 🆕 Phase 12 : Liste toutes les périodes utilisées pour un dossier */
export async function idbGetAllPeriodsForDossier(dossierId: string): Promise<string[]> {
  try {
    await ensurePeriodMigration();
    const db = await getDB();
    const all = await db.getAllFromIndex('vsme_values', 'by_dossier', dossierId);
    const periods = new Set(all.map(v => v.period || DEFAULT_PERIOD));
    return Array.from(periods).sort();
  } catch (e) {
    console.error('[IDB] getAllPeriods error:', e);
    return [DEFAULT_PERIOD];
  }
}

export async function idbPutValue(val: VSMEValue): Promise<void> {
  try {
    await ensurePeriodMigration();
    const db = await getDB();
    const withPeriod = { ...val, period: val.period || DEFAULT_PERIOD };
    await db.put('vsme_values', withPeriod);
    // Write-through to Supabase
    if (syncEngine.enabled && syncEngine.organizationId) {
      syncEngine.syncToCloud('vsme_values', 'UPDATE', {
        id: withPeriod.id,
        dossier_id: withPeriod.dossierId,
        code: withPeriod.code,
        raw_value: withPeriod.rawValue,
        statut: withPeriod.statut,
        period: withPeriod.period,
        organization_id: syncEngine.organizationId,
        updated_at: withPeriod.updatedAt || new Date().toISOString(),
      }).catch(() => {});
    }
  } catch (e) {
    console.error('[IDB] putValue error:', e);
  }
}

export async function idbDeleteValuesByDossier(dossierId: string): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('vsme_values', 'readwrite');
    const keys = await tx.store.index('by_dossier').getAllKeys(dossierId);
    await Promise.all(keys.map(k => tx.store.delete(k)));
    await tx.done;
  } catch (e) {
    console.error('[IDB] deleteValues error:', e);
  }
}

/** Génère l'ID composite d'une valeur (avec période) */
export function makeValueId(dossierId: string, code: string, period?: string): string {
  const p = period || DEFAULT_PERIOD;
  return `${dossierId}::${code}::${p}`;
}

// ─── Helpers périodes ────────────────────────────────────────────────────────

import type { PeriodMode, CustomPeriod } from '@/contexts/DossierContext';

/** Définition d'une période (id + labels) */
export interface PeriodDefinition {
  id: string;         // "2025", "2025-T1", "2025-M01", "S1"
  label: string;      // "Exercice 2025", "T1 2025 (Jan-Mar)", "Janvier 2025"
  shortLabel: string; // "2025", "T1 2025", "Jan 2025", "Semestre 1"
}

const MONTH_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const MONTH_SHORT = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
  'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
];

/**
 * 🆕 Phase 12b : Génère la liste des périodes selon le mode du dossier.
 * C'est LA fonction centrale qui remplace getQuarterlyPeriods().
 */
export function getPeriodsForDossier(
  fiscalYear: string,
  periodMode: PeriodMode = 'annuel',
  customPeriods?: CustomPeriod[],
): PeriodDefinition[] {
  switch (periodMode) {
    case 'annuel':
      return [{ id: fiscalYear, label: `Exercice ${fiscalYear}`, shortLabel: fiscalYear }];

    case 'trimestriel':
      return [
        { id: `${fiscalYear}-T1`, label: `T1 ${fiscalYear} (Jan-Mar)`, shortLabel: `T1 ${fiscalYear}` },
        { id: `${fiscalYear}-T2`, label: `T2 ${fiscalYear} (Avr-Jun)`, shortLabel: `T2 ${fiscalYear}` },
        { id: `${fiscalYear}-T3`, label: `T3 ${fiscalYear} (Jul-Sep)`, shortLabel: `T3 ${fiscalYear}` },
        { id: `${fiscalYear}-T4`, label: `T4 ${fiscalYear} (Oct-Déc)`, shortLabel: `T4 ${fiscalYear}` },
      ];

    case 'mensuel':
      return MONTH_LABELS.map((label, i) => ({
        id: `${fiscalYear}-M${String(i + 1).padStart(2, '0')}`,
        label: `${label} ${fiscalYear}`,
        shortLabel: `${MONTH_SHORT[i]} ${fiscalYear}`,
      }));

    case 'personnalise':
      return (customPeriods ?? []).map(cp => ({
        id: cp.id,
        label: cp.label,
        shortLabel: cp.label,
      }));

    default:
      return [{ id: fiscalYear, label: `Exercice ${fiscalYear}`, shortLabel: fiscalYear }];
  }
}

/** Rétrocompatibilité : alias pour le mode trimestriel uniquement */
export function getQuarterlyPeriods(year: string): PeriodDefinition[] {
  return getPeriodsForDossier(year, 'trimestriel');
}

/** Retourne la période précédente (pour calcul Δ) — supporte annuel, trimestriel et mensuel */
export function getPreviousPeriod(periodId: string): string | null {
  // Trimestriel : "2025-T3" → "2025-T2"
  if (periodId.includes('-T')) {
    const [year, quarter] = periodId.split('-T');
    const q = parseInt(quarter, 10);
    if (q > 1) return `${year}-T${q - 1}`;
    return `${parseInt(year, 10) - 1}-T4`;
  }
  // Mensuel : "2025-M03" → "2025-M02"
  if (periodId.includes('-M')) {
    const [year, month] = periodId.split('-M');
    const m = parseInt(month, 10);
    if (m > 1) return `${year}-M${String(m - 1).padStart(2, '0')}`;
    return `${parseInt(year, 10) - 1}-M12`;
  }
  // Annuel → année précédente
  const y = parseInt(periodId, 10);
  return isNaN(y) ? null : `${y - 1}`;
}

/** Retourne la période précédente dans une liste de périodes custom */
export function getPreviousPeriodInList(
  periodId: string,
  periods: PeriodDefinition[],
): string | null {
  const idx = periods.findIndex(p => p.id === periodId);
  return idx > 0 ? periods[idx - 1].id : null;
}

/** Détermine l'exercice fiscal à partir d'un ID de période */
export function getFiscalYear(periodId: string): string {
  return periodId.split('-')[0] || DEFAULT_PERIOD;
}

// ─── Mission Notes ────────────────────────────────────────────────────────────
export async function idbGetNotesByDossier(dossierId: string): Promise<MissionNote[]> {
  try {
    const db = await getDB();
    const notes = await db.getAllFromIndex('mission_notes', 'by_dossier', dossierId);
    return notes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (e) {
    console.error('[IDB] getNotes error:', e);
    return [];
  }
}

export async function idbPutNote(note: MissionNote): Promise<void> {
  try {
    const db = await getDB();
    await db.put('mission_notes', note);
    // Write-through to Supabase
    if (syncEngine.enabled && syncEngine.organizationId) {
      syncEngine.syncToCloud('mission_notes', 'UPDATE', {
        id: note.id,
        dossier_id: note.dossierId,
        content: note.content,
        author: note.author,
        category: note.category,
        organization_id: syncEngine.organizationId,
        created_at: note.createdAt,
      }).catch(() => {});
    }
  } catch (e) {
    console.error('[IDB] putNote error:', e);
  }
}

export async function idbDeleteNote(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('mission_notes', id);
    // Write-through to Supabase
    if (syncEngine.enabled) {
      syncEngine.syncToCloud('mission_notes', 'DELETE', { id }).catch(() => {});
    }
  } catch (e) {
    console.error('[IDB] deleteNote error:', e);
  }
}
