import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types pour les données de matérialité
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

// Types pour les données ESRS
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
  value?: any;
  evidence?: string[];
}

// Types pour les données quantitatives
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

// Types pour les données qualitatives
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

// Types pour la collaboration
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

// État global des données d'un dossier
interface DossierData {
  materialityIssues: MaterialityIssue[];
  esrsStandards: ESRSStandard[];
  quantitativeData: QuantitativeData[];
  qualitativeData: QualitativeData[];
  teamMembers: TeamMember[];
  comments: Comment[];
}

interface DossierDataContextType {
  getDossierData: (dossierId: string) => DossierData | undefined;
  updateMaterialityIssues: (dossierId: string, issues: MaterialityIssue[]) => void;
  addMaterialityIssue: (dossierId: string, issue: MaterialityIssue) => void;
  updateESRSStandards: (dossierId: string, standards: ESRSStandard[]) => void;
  addQuantitativeData: (dossierId: string, data: QuantitativeData) => void;
  updateQuantitativeData: (dossierId: string, dataId: string, data: Partial<QuantitativeData>) => void;
  addQualitativeData: (dossierId: string, data: QualitativeData) => void;
  updateQualitativeData: (dossierId: string, dataId: string, data: Partial<QualitativeData>) => void;
  addTeamMember: (dossierId: string, member: TeamMember) => void;
  addComment: (dossierId: string, comment: Comment) => void;
}

const DossierDataContext = createContext<DossierDataContextType | undefined>(undefined);

export function DossierDataProvider({ children }: { children: ReactNode }) {
  // État: Map de dossierId -> DossierData
  const [dossierDataMap, setDossierDataMap] = useState<Record<string, DossierData>>({});

  const getDossierData = (dossierId: string): DossierData | undefined => {
    // Si le dossier n'existe pas encore, retourner un état vide
    if (!dossierDataMap[dossierId]) {
      return {
        materialityIssues: [],
        esrsStandards: [],
        quantitativeData: [],
        qualitativeData: [],
        teamMembers: [],
        comments: [],
      };
    }
    return dossierDataMap[dossierId];
  };

  const updateMaterialityIssues = (dossierId: string, issues: MaterialityIssue[]) => {
    setDossierDataMap(prev => ({
      ...prev,
      [dossierId]: {
        ...(prev[dossierId] || {
          materialityIssues: [],
          esrsStandards: [],
          quantitativeData: [],
          qualitativeData: [],
          teamMembers: [],
          comments: [],
        }),
        materialityIssues: issues,
      },
    }));
  };

  const addMaterialityIssue = (dossierId: string, issue: MaterialityIssue) => {
    setDossierDataMap(prev => {
      const existing = prev[dossierId] || {
        materialityIssues: [],
        esrsStandards: [],
        quantitativeData: [],
        qualitativeData: [],
        teamMembers: [],
        comments: [],
      };
      return {
        ...prev,
        [dossierId]: {
          ...existing,
          materialityIssues: [...existing.materialityIssues, issue],
        },
      };
    });
  };

  const updateESRSStandards = (dossierId: string, standards: ESRSStandard[]) => {
    setDossierDataMap(prev => ({
      ...prev,
      [dossierId]: {
        ...(prev[dossierId] || {
          materialityIssues: [],
          esrsStandards: [],
          quantitativeData: [],
          qualitativeData: [],
          teamMembers: [],
          comments: [],
        }),
        esrsStandards: standards,
      },
    }));
  };

  const addQuantitativeData = (dossierId: string, data: QuantitativeData) => {
    setDossierDataMap(prev => {
      const existing = prev[dossierId] || {
        materialityIssues: [],
        esrsStandards: [],
        quantitativeData: [],
        qualitativeData: [],
        teamMembers: [],
        comments: [],
      };
      return {
        ...prev,
        [dossierId]: {
          ...existing,
          quantitativeData: [...existing.quantitativeData, data],
        },
      };
    });
  };

  const updateQuantitativeData = (dossierId: string, dataId: string, data: Partial<QuantitativeData>) => {
    setDossierDataMap(prev => {
      const existing = prev[dossierId];
      if (!existing) return prev;

      return {
        ...prev,
        [dossierId]: {
          ...existing,
          quantitativeData: existing.quantitativeData.map(item =>
            item.id === dataId ? { ...item, ...data } : item
          ),
        },
      };
    });
  };

  const addQualitativeData = (dossierId: string, data: QualitativeData) => {
    setDossierDataMap(prev => {
      const existing = prev[dossierId] || {
        materialityIssues: [],
        esrsStandards: [],
        quantitativeData: [],
        qualitativeData: [],
        teamMembers: [],
        comments: [],
      };
      return {
        ...prev,
        [dossierId]: {
          ...existing,
          qualitativeData: [...existing.qualitativeData, data],
        },
      };
    });
  };

  const updateQualitativeData = (dossierId: string, dataId: string, data: Partial<QualitativeData>) => {
    setDossierDataMap(prev => {
      const existing = prev[dossierId];
      if (!existing) return prev;

      return {
        ...prev,
        [dossierId]: {
          ...existing,
          qualitativeData: existing.qualitativeData.map(item =>
            item.id === dataId ? { ...item, ...data } : item
          ),
        },
      };
    });
  };

  const addTeamMember = (dossierId: string, member: TeamMember) => {
    setDossierDataMap(prev => {
      const existing = prev[dossierId] || {
        materialityIssues: [],
        esrsStandards: [],
        quantitativeData: [],
        qualitativeData: [],
        teamMembers: [],
        comments: [],
      };
      return {
        ...prev,
        [dossierId]: {
          ...existing,
          teamMembers: [...existing.teamMembers, member],
        },
      };
    });
  };

  const addComment = (dossierId: string, comment: Comment) => {
    setDossierDataMap(prev => {
      const existing = prev[dossierId] || {
        materialityIssues: [],
        esrsStandards: [],
        quantitativeData: [],
        qualitativeData: [],
        teamMembers: [],
        comments: [],
      };
      return {
        ...prev,
        [dossierId]: {
          ...existing,
          comments: [...existing.comments, comment],
        },
      };
    });
  };

  return (
    <DossierDataContext.Provider
      value={{
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
      }}
    >
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
