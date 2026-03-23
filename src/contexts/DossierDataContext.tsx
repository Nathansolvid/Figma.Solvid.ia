import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { dataProvider } from '@/services/dataProvider';

// ── Types ────────────────────────────────────────────────────────────────────

export interface MaterialityIssue {
  id: string;
  name: string;
  description: string;
  impactScore: number;
  financialScore: number;
  stakeholders: string[];
  esrsMapping: string[];
  mappingValidated: boolean;
  justification?: string;
  auditStatus?: "valide" | "reserve" | "invalide";
}

export interface ESRSStandard {
  code: string;
  name: string;
  category: 'E' | 'S' | 'G';
  isApplicable: boolean;
  dataPoints: ESRSDataPoint[];
  progress: number;
}

export interface ESRSDataPoint {
  id: string;
  code: string;
  label: string;
  type: 'quantitative' | 'qualitative';
  mandatory: boolean;
  completed: boolean;
  value?: string | number | null;
  evidence?: string[];
}

export interface QuantitativeData {
  id: string;
  indicatorCode: string;
  indicatorName: string;
  category: string;
  unit: string;
  value: number | null;
  period: string;
  source: string;
  evidence: string[];
  auditStatus?: 'validated' | 'pending' | 'rejected';
  comments?: string;
}

export interface QualitativeData {
  id: string;
  dataPointCode: string;
  dataPointName: string;
  category: string;
  content: string;
  wordCount: number;
  evidence: string[];
  lastUpdated: string;
  author: string;
  auditStatus?: 'validated' | 'pending' | 'rejected';
  comments?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string;
  permissions: string[];
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  section: string;
  resolved: boolean;
}

// ── DossierData shape ────────────────────────────────────────────────────────

interface DossierData {
  materialityIssues: MaterialityIssue[];
  esrsStandards: ESRSStandard[];
  quantitativeData: QuantitativeData[];
  qualitativeData: QualitativeData[];
  teamMembers: TeamMember[];
  comments: Comment[];
}

const EMPTY_DATA: DossierData = {
  materialityIssues: [],
  esrsStandards: [],
  quantitativeData: [],
  qualitativeData: [],
  teamMembers: [],
  comments: [],
};

// IDB store key for dossier data
const IDB_STORE = 'dossier_data' as const;

// ── Context type ─────────────────────────────────────────────────────────────

interface DossierDataContextType {
  getDossierData: (dossierId: string) => DossierData;
  updateMaterialityIssues: (dossierId: string, issues: MaterialityIssue[]) => void;
  addMaterialityIssue: (dossierId: string, issue: MaterialityIssue) => void;
  updateESRSStandards: (dossierId: string, standards: ESRSStandard[]) => void;
  addQuantitativeData: (dossierId: string, data: QuantitativeData) => void;
  updateQuantitativeData: (dossierId: string, dataId: string, data: Partial<QuantitativeData>) => void;
  addQualitativeData: (dossierId: string, data: QualitativeData) => void;
  updateQualitativeData: (dossierId: string, dataId: string, data: Partial<QualitativeData>) => void;
  addTeamMember: (dossierId: string, member: TeamMember) => void;
  addComment: (dossierId: string, comment: Comment) => void;
  loading: boolean;
}

const DossierDataContext = createContext<DossierDataContextType | undefined>(undefined);

// ── Persistence helpers ──────────────────────────────────────────────────────

const IDB_KEY_PREFIX = 'dossier-data::';

async function loadFromIDB(dossierId: string): Promise<DossierData | null> {
  try {
    const stored = localStorage.getItem(`${IDB_KEY_PREFIX}${dossierId}`);
    if (stored) return JSON.parse(stored);
    return null;
  } catch {
    return null;
  }
}

function saveToIDB(dossierId: string, data: DossierData): void {
  try {
    localStorage.setItem(`${IDB_KEY_PREFIX}${dossierId}`, JSON.stringify(data));
  } catch (e) {
    console.warn('[DossierData] Failed to persist:', e);
  }
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function DossierDataProvider({ children }: { children: ReactNode }) {
  const [dossierDataMap, setDossierDataMap] = useState<Record<string, DossierData>>({});
  const [loading, setLoading] = useState(true);
  const [loadedDossiers, setLoadedDossiers] = useState<Set<string>>(new Set());

  // Load all persisted dossier data on mount
  useEffect(() => {
    const loadAll = () => {
      try {
        const map: Record<string, DossierData> = {};
        const loaded = new Set<string>();
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(IDB_KEY_PREFIX)) {
            const dossierId = key.slice(IDB_KEY_PREFIX.length);
            try {
              const data = JSON.parse(localStorage.getItem(key) || '');
              if (data) {
                map[dossierId] = { ...EMPTY_DATA, ...data };
                loaded.add(dossierId);
              }
            } catch { /* skip corrupted entries */ }
          }
        }
        setDossierDataMap(map);
        setLoadedDossiers(loaded);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  // Helper: update map + persist
  const updateDossier = useCallback((dossierId: string, updater: (prev: DossierData) => DossierData) => {
    setDossierDataMap(prev => {
      const existing = prev[dossierId] || { ...EMPTY_DATA };
      const updated = updater(existing);
      // Persist async (fire-and-forget)
      saveToIDB(dossierId, updated);
      return { ...prev, [dossierId]: updated };
    });
  }, []);

  // ── Public API ─────────────────────────────────────────────────────────────

  const getDossierData = useCallback((dossierId: string): DossierData => {
    return dossierDataMap[dossierId] || EMPTY_DATA;
  }, [dossierDataMap]);

  const updateMaterialityIssues = useCallback((dossierId: string, issues: MaterialityIssue[]) => {
    updateDossier(dossierId, prev => ({ ...prev, materialityIssues: issues }));
  }, [updateDossier]);

  const addMaterialityIssue = useCallback((dossierId: string, issue: MaterialityIssue) => {
    updateDossier(dossierId, prev => ({
      ...prev,
      materialityIssues: [...prev.materialityIssues, issue],
    }));
  }, [updateDossier]);

  const updateESRSStandards = useCallback((dossierId: string, standards: ESRSStandard[]) => {
    updateDossier(dossierId, prev => ({ ...prev, esrsStandards: standards }));
  }, [updateDossier]);

  const addQuantitativeData = useCallback((dossierId: string, data: QuantitativeData) => {
    updateDossier(dossierId, prev => ({
      ...prev,
      quantitativeData: [...prev.quantitativeData, data],
    }));
  }, [updateDossier]);

  const updateQuantitativeData = useCallback((dossierId: string, dataId: string, data: Partial<QuantitativeData>) => {
    updateDossier(dossierId, prev => ({
      ...prev,
      quantitativeData: prev.quantitativeData.map(item =>
        item.id === dataId ? { ...item, ...data } : item
      ),
    }));
  }, [updateDossier]);

  const addQualitativeData = useCallback((dossierId: string, data: QualitativeData) => {
    updateDossier(dossierId, prev => ({
      ...prev,
      qualitativeData: [...prev.qualitativeData, data],
    }));
  }, [updateDossier]);

  const updateQualitativeData = useCallback((dossierId: string, dataId: string, data: Partial<QualitativeData>) => {
    updateDossier(dossierId, prev => ({
      ...prev,
      qualitativeData: prev.qualitativeData.map(item =>
        item.id === dataId ? { ...item, ...data } : item
      ),
    }));
  }, [updateDossier]);

  const addTeamMember = useCallback((dossierId: string, member: TeamMember) => {
    updateDossier(dossierId, prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, member],
    }));
  }, [updateDossier]);

  const addComment = useCallback((dossierId: string, comment: Comment) => {
    updateDossier(dossierId, prev => ({
      ...prev,
      comments: [...prev.comments, comment],
    }));
  }, [updateDossier]);

  // ── Memoized value ─────────────────────────────────────────────────────────

  const value = useMemo(() => ({
    getDossierData,
    updateMaterialityIssues,
    addMaterialityIssue,
    updateESRSStandards,
    addQuantitativeData,
    updateQuantitativeData,
    addQualitativeData,
    updateQualitativeData,
    addTeamMember,
    addComment,
    loading,
  }), [
    getDossierData, updateMaterialityIssues, addMaterialityIssue,
    updateESRSStandards, addQuantitativeData, updateQuantitativeData,
    addQualitativeData, updateQualitativeData, addTeamMember, addComment,
    loading,
  ]);

  return (
    <DossierDataContext.Provider value={value}>
      {children}
    </DossierDataContext.Provider>
  );
}

export function useDossierData() {
  const context = useContext(DossierDataContext);
  if (context === undefined) {
    throw new Error('useDossierData must be used within a DossierDataProvider');
  }
  return context;
}
