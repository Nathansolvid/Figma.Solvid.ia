import { createContext, useContext, useState, useMemo, useCallback, ReactNode, useEffect } from 'react';
import {
  idbGetDossiers,
  idbPutDossier,
  idbDeleteDossier,
} from '@/services/idbService';
import { useUser } from '@/contexts/UserContext';
import { Role } from '@/permissions';
import { v4 as uuidv4 } from 'uuid';

// Phase 12b : types de période
export type PeriodMode = 'annuel' | 'trimestriel' | 'mensuel' | 'personnalise';

export interface CustomPeriod {
  id: string;     // ex: "S1", "B1" — slug libre (sans "::")
  label: string;  // ex: "Semestre 1", "Bimestre Jan-Fév"
}

export interface Dossier {
  id: string;
  name: string;
  clientOrg: string;
  fiscalYear: string;
  referentielId?: string;   // ex: "vsme-complet", "bilan-carbone"
  missionType: "Conseil" | "Audit";
  pathwayType: "CSRD_Mandatory" | "ESG_Voluntary";
  providerOrg: string;
  leadConsultant: string;
  startDate: string;
  endDate?: string;
  selectedWorkflows?: string[];
  packType?: string;
  createdAt: string;
  status: "draft" | "active" | "completed";
  // Phase 12b : mode de période (optionnel pour rétrocompatibilité)
  periodMode?: PeriodMode;
  customPeriods?: CustomPeriod[];
  // RGPD Phase 1 : isolation par organisation
  organizationId?: string;
  ownerId?: string;
}


interface DossierContextType {
  dossiers: Dossier[];
  loading: boolean;
  createDossier: (dossier: Omit<Dossier, 'id' | 'createdAt' | 'status'>) => string;
  getDossier: (id: string) => Dossier | undefined;
  updateDossier: (id: string, updates: Partial<Dossier>) => void;
  deleteDossier: (id: string) => void;
}

const DossierContext = createContext<DossierContextType | undefined>(undefined);

export function DossierProvider({ children }: { children: ReactNode }) {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useUser();

  // ── Charger depuis IDB (initial + après sync cloud) ──────────────────────
  const loadFromIDB = useCallback(() => {
    idbGetDossiers().then(stored => {
      const isAdmin = currentUser?.role === Role.ADMIN;
      const filtered = isAdmin
        ? stored
        : stored.filter(d => {
            // Dossiers avec org correspondante
            if (d.organizationId && currentUser?.organizationId) {
              return d.organizationId === currentUser.organizationId;
            }
            // Dossiers legacy (sans organizationId) — visible par leur propriétaire
            if (!d.organizationId) {
              return !currentUser?.id || d.ownerId === currentUser.id;
            }
            return false;
          });
      setDossiers(filtered);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [currentUser?.organizationId, currentUser?.role, currentUser?.id]);

  useEffect(() => {
    loadFromIDB();
  }, [loadFromIDB]);

  // Re-read IDB when cloud pull completes (new data pulled from Supabase)
  useEffect(() => {
    const handler = () => loadFromIDB();
    window.addEventListener('solvid:cloud-pull-complete', handler);
    return () => window.removeEventListener('solvid:cloud-pull-complete', handler);
  }, [loadFromIDB]);

  // ── CRUD (memoized) ─────────────────────────────────────────────────────
  const createDossier = useCallback((data: Omit<Dossier, 'id' | 'createdAt' | 'status'>): string => {
    const newDossier: Dossier = {
      ...data,
      id: `dossier-${uuidv4()}`,
      createdAt: new Date().toISOString(),
      status: 'active',
      organizationId: data.organizationId || currentUser?.organizationId || '',
      ownerId: data.ownerId || currentUser?.id || '',
    };
    setDossiers(prev => [...prev, newDossier]);
    idbPutDossier(newDossier);
    return newDossier.id;
  }, [currentUser?.organizationId, currentUser?.id]);

  const getDossier = useCallback((id: string) => dossiers.find(d => d.id === id), [dossiers]);

  const updateDossier = useCallback((id: string, updates: Partial<Dossier>) => {
    setDossiers(prev =>
      prev.map(d => {
        if (d.id !== id) return d;
        const updated = { ...d, ...updates };
        idbPutDossier(updated);
        return updated;
      })
    );
  }, []);

  const deleteDossier = useCallback((id: string) => {
    setDossiers(prev => prev.filter(d => d.id !== id));
    idbDeleteDossier(id);
  }, []);

  const value = useMemo(() => ({
    dossiers, loading, createDossier, getDossier, updateDossier, deleteDossier,
  }), [dossiers, loading, createDossier, getDossier, updateDossier, deleteDossier]);

  return (
    <DossierContext.Provider value={value}>
      {children}
    </DossierContext.Provider>
  );
}

export function useDossiers() {
  const ctx = useContext(DossierContext);
  if (!ctx) throw new Error('useDossiers must be used within DossierProvider');
  return ctx;
}
