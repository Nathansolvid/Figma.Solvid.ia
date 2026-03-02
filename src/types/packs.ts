// Types pour le système de Packs (architecture Option A)

export type PackType = 
  | "donneur-ordre"      // Fournisseur de donneur d'ordre CSRD
  | "questionnaire-esg"  // PME/ETI répondant à questionnaires ESG
  | "banque"            // Due diligence banque/investisseur
  | "audit-ready";      // Pré-audit / Audit externe

export type ChecklistItemStatus = 
  | "missing"        // 🔴 Rien fourni
  | "in-progress"    // 🟡 Donnée partielle
  | "provided"       // 🟢 Fourni, en attente validation
  | "needs-review"   // 🔵 Demande complément auditeur
  | "accepted"       // ✅ Validé auditeur
  | "rejected";      // ❌ Rejeté

export type ItemType = "indicator" | "evidence" | "qualitative-info";

export interface PackTemplate {
  id: PackType;
  name: string;
  description: string;
  icon: string;
  color: string;
  targetSegment: string;
  estimatedDuration: string;
  checklistItems: ChecklistTemplate[];
  excelTemplate: ExcelTemplateConfig;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  type: ItemType;
  category: "E" | "S" | "G";
  subcategory?: string;
  description: string;
  isMandatory: boolean;
  expectedEvidence: string[];
  guidanceUrl?: string;
}

export interface ExcelTemplateConfig {
  filename: string;
  columns: {
    name: string;
    field: string;
    type: "text" | "number" | "date" | "dropdown";
    required: boolean;
    example?: string;
    options?: string[]; // Pour dropdown
  }[];
}

export interface ESGPack {
  id: string;
  dossierId: string;
  packType: PackType;
  name: string;
  description: string;
  isActive: boolean;
  completionPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistItem {
  id: string;
  packId: string;
  dossierId: string;
  indicatorId?: string; // Nullable si type = evidence ou qualitative-info
  name: string;
  type: ItemType;
  category: "E" | "S" | "G";
  subcategory?: string;
  status: ChecklistItemStatus;
  assignedTo?: string; // User ID
  dueDate?: Date;
  priority: "low" | "medium" | "high";
  evidenceCount: number;
  lastUpdated: Date;
  comments: number;
}
