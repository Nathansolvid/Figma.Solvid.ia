import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {
  idbGetDossiers,
  idbPutDossier,
  idbDeleteDossier,
} from '@/services/idbService';
import { useUser } from '@/contexts/UserContext';
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

  // ── Charger depuis IDB au démarrage ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    idbGetDossiers().then(stored => {
      if (cancelled) return;
      // RGPD: filter by organization if user has one (backward compat: keep all if no org)
      const filtered = currentUser?.organizationId
        ? stored.filter(d => !d.organizationId || d.organizationId === currentUser.organizationId)
        : stored;
      setDossiers(filtered);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [currentUser?.organizationId]);

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const createDossier = (data: Omit<Dossier, 'id' | 'createdAt' | 'status'>): string => {
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
  };

  const getDossier = (id: string) => dossiers.find(d => d.id === id);

  const updateDossier = (id: string, updates: Partial<Dossier>) => {
    setDossiers(prev =>
      prev.map(d => {
        if (d.id !== id) return d;
        const updated = { ...d, ...updates };
        idbPutDossier(updated);
        return updated;
      })
    );
  };

  const deleteDossier = (id: string) => {
    setDossiers(prev => prev.filter(d => d.id !== id));
    idbDeleteDossier(id);
  };

  return (
    <DossierContext.Provider value={{ dossiers, loading, createDossier, getDossier, updateDossier, deleteDossier }}>
      {children}
    </DossierContext.Provider>
  );
}

export function useDossiers() {
  const ctx = useContext(DossierContext);
  if (!ctx) throw new Error('useDossiers must be used within DossierProvider');
  return ctx;
}
