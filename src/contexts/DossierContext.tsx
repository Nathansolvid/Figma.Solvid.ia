import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Dossier {
  id: string;
  name: string;
  clientOrg: string;
  fiscalYear: string;
  
  // Type de mission = posture principale
  missionType: "Conseil" | "Audit";
  
  // Contexte réglementaire (secondaire)
  pathwayType: "CSRD_Mandatory" | "ESG_Voluntary";
  
  providerOrg: string;
  leadConsultant: string;
  startDate: string;
  endDate?: string;
  
  // 🆕 Workflows sélectionnés (remplace packType)
  selectedWorkflows?: string[];
  packType?: string; // Deprecated, keep for backward compatibility
  
  createdAt: string;
  status: "draft" | "active" | "completed";
}

interface DossierContextType {
  dossiers: Dossier[];
  createDossier: (dossier: Omit<Dossier, 'id' | 'createdAt' | 'status'>) => string;
  getDossier: (id: string) => Dossier | undefined;
  updateDossier: (id: string, updates: Partial<Dossier>) => void;
  deleteDossier: (id: string) => void;
}

const DossierContext = createContext<DossierContextType | undefined>(undefined);

export function DossierProvider({ children }: { children: ReactNode }) {
  const [dossiers, setDossiers] = useState<Dossier[]>([
    // Dossiers de démo
    {
      id: "dossier-001",
      name: "Entreprise Example SAS - CSRD 2025",
      clientOrg: "example-sas",
      fiscalYear: "2025",
      missionType: "Conseil",
      pathwayType: "CSRD_Mandatory",
      providerOrg: "Cabinet ABC",
      leadConsultant: "sophie",
      startDate: "2025-01-15",
      endDate: "2025-12-31",
      selectedWorkflows: ["bilan-carbone", "csrd-complete", "due-diligence"],
      createdAt: "2025-01-10T10:00:00Z",
      status: "active"
    },
    {
      id: "dossier-002",
      name: "Tech Innovate SARL - ESG 2025",
      clientOrg: "tech-innovate",
      fiscalYear: "2025",
      missionType: "Conseil",
      pathwayType: "ESG_Voluntary",
      providerOrg: "ESG Consulting",
      leadConsultant: "thomas",
      startDate: "2025-02-01",
      selectedWorkflows: ["bilan-carbone", "diagnostic-esg"],
      createdAt: "2025-01-20T14:30:00Z",
      status: "active"
    }
  ]);

  // 🔧 Debug: Confirm provider is mounted (only once)
  useEffect(() => {
    console.log('✅ DossierProvider mounted with', dossiers.length, 'initial dossiers');
  }, []); // Empty dependency array = only run once on mount

  // 🔧 Debug: Log whenever dossiers change
  useEffect(() => {
    console.log('📊 Dossiers state updated. Current count:', dossiers.length);
  }, [dossiers]);

  const createDossier = (dossierData: Omit<Dossier, 'id' | 'createdAt' | 'status'>): string => {
    const newDossier: Dossier = {
      ...dossierData,
      id: `dossier-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: "active"
    };
    
    console.log('🆕 Creating new dossier:', newDossier);
    setDossiers(prev => {
      const updated = [...prev, newDossier];
      console.log('✅ Dossiers updated. New count:', updated.length);
      return updated;
    });
    
    return newDossier.id;
  };

  const getDossier = (id: string): Dossier | undefined => {
    return dossiers.find(d => d.id === id);
  };

  const updateDossier = (id: string, updates: Partial<Dossier>) => {
    setDossiers(prev => 
      prev.map(d => d.id === id ? { ...d, ...updates } : d)
    );
  };

  const deleteDossier = (id: string) => {
    setDossiers(prev => prev.filter(d => d.id !== id));
  };

  return (
    <DossierContext.Provider value={{
      dossiers,
      createDossier,
      getDossier,
      updateDossier,
      deleteDossier
    }}>
      {children}
    </DossierContext.Provider>
  );
}

export function useDossiers() {
  const context = useContext(DossierContext);
  if (!context) {
    throw new Error('useDossiers must be used within a DossierProvider');
  }
  return context;
}