// Types pour système d'indicateurs avec transparence totale (Phase 6)

import { ChecklistItemStatus } from "./packs";

export type IndicatorCategory = "E" | "S" | "G";

export type CalculationMethod = 
  | "sum"           // Somme simple
  | "average"       // Moyenne
  | "weighted_avg"  // Moyenne pondérée
  | "formula"       // Formule personnalisée
  | "manual";       // Saisie manuelle

export interface SourceDataLine {
  id: string;
  importId: string;           // Référence à l'import
  filename: string;           // Nom fichier Excel/CSV
  sheetName?: string;         // Nom de la feuille (si Excel)
  rowNumber: number;          // Numéro de ligne dans le fichier
  entity: string;             // Entité
  period: string;             // Période
  value: number | string;     // Valeur
  unit: string;               // Unité
  importedAt: Date;           // Date import
  importedBy: string;         // User qui a importé
}

export interface CalculationFormula {
  id: string;
  expression: string;         // Ex: "SUM(scope1) + SUM(scope2)"
  variables: Record<string, string>; // Ex: { scope1: "GHG-SCOPE1", scope2: "GHG-SCOPE2" }
  description: string;        // Description en français
  unit: string;               // Unité du résultat
}

export interface CalculationStep {
  step: number;
  description: string;
  operation: string;          // Ex: "SUM", "AVG", "MULTIPLY"
  inputs: SourceDataLine[];   // Lignes sources utilisées
  result: number | string;    // Résultat de cette étape
  unit: string;
}

export interface Evidence {
  id: string;
  indicatorId: string;
  name: string;
  type: "file" | "link";
  fileType?: string;          // PDF, Excel, image, etc.
  fileSize?: number;          // en bytes
  url?: string;               // Pour liens externes
  uploadedAt: Date;
  uploadedBy: string;
  period: string;             // Période couverte
  entity?: string;            // Entité concernée (optionnel)
  description?: string;
  tags?: string[];
}

export interface ValidationRule {
  id: string;
  type: "required_evidence" | "min_value" | "max_value" | "consistency_check";
  description: string;
  parameters?: Record<string, any>;
  errorMessage: string;
}

export interface Indicator {
  id: string;
  code: string;               // Ex: "GHG-SCOPE1-TOTAL"
  name: string;               // Ex: "Émissions GES Scope 1 totales"
  category: IndicatorCategory;
  subcategory?: string;       // Ex: "E1-Climate"
  
  // Valeur actuelle
  currentValue: number | string | null;
  unit: string;
  period: string;             // Ex: "2024"
  entity?: string;            // Ex: "Siège social" (si spécifique)
  
  // Statut
  status: ChecklistItemStatus;
  lastUpdated: Date;
  lastUpdatedBy: string;
  
  // Calcul et transparence
  calculationMethod: CalculationMethod;
  formula?: CalculationFormula;
  sourceDataLines: SourceDataLine[];    // Lignes Excel/CSV sources
  calculationSteps: CalculationStep[];  // Étapes de calcul détaillées
  assumptions: string[];                // Hypothèses de calcul
  
  // Preuves
  evidences: Evidence[];
  validationRules: ValidationRule[];
  
  // Métadonnées
  description?: string;
  notes?: string;
  tags?: string[];
  priority: "low" | "medium" | "high" | "critical";
  isMandatory: boolean;
  
  // Audit trail
  history: IndicatorHistoryEntry[];
}

export interface IndicatorHistoryEntry {
  id: string;
  timestamp: Date;
  action: "created" | "updated" | "calculated" | "validated" | "rejected" | "evidence_added" | "evidence_removed";
  userId: string;
  userName: string;
  oldValue?: any;
  newValue?: any;
  comment?: string;
  affectedFields: string[];  // Champs modifiés
}

export interface RecalculationResult {
  indicatorId: string;
  oldValue: number | string | null;
  newValue: number | string | null;
  changed: boolean;
  timestamp: Date;
  affectedIndicators: string[]; // Autres indicateurs impactés
  calculationLog: string[];     // Log détaillé du calcul
}

export interface TransparencyData {
  indicator: Indicator;
  calculation: {
    method: CalculationMethod;
    formula?: CalculationFormula;
    steps: CalculationStep[];
    assumptions: string[];
    lastCalculated: Date;
  };
  sources: {
    dataLines: SourceDataLine[];
    totalLines: number;
    imports: {
      importId: string;
      filename: string;
      importedAt: Date;
      lineCount: number;
    }[];
  };
  evidences: {
    files: Evidence[];
    totalSize: number;
    missingEvidences: string[]; // Liste types preuves manquantes
  };
  validation: {
    rules: ValidationRule[];
    passed: boolean;
    errors: string[];
    warnings: string[];
  };
  auditTrail: {
    entries: IndicatorHistoryEntry[];
    totalChanges: number;
    lastChange: Date;
    contributors: string[]; // Liste users ayant contribué
  };
}
