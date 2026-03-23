/**
 * REPORT TYPES — Types partagés pour tous les modules de rapport
 *
 * Centralise les interfaces, constantes et labels utilisés par :
 * - professionalReports.ts (génération PDF)
 * - pdfExport.ts (export pack)
 * - exportService.ts (orchestrateur)
 * - pdfCharts.ts (diagrammes)
 * - reportHelpers.ts (utilitaires)
 */

// ==================== BRAND CONFIG ====================

export interface BrandConfig {
  organizationName: string;
  logoBase64: string | null;   // base64 PNG/JPEG pour jsPDF addImage
  primaryColor: string;         // hex, ex: '#2D7A55'
  secondaryColor: string;       // hex, ex: '#0D3B27'
}

// ==================== REPORT DATA ====================

export interface VSMESectionData {
  sectionId: string;        // ex: "B3"
  sectionTitle: string;     // ex: "Énergie & GES"
  pillar: ESGCategory;
  datapoints: Array<{
    code: string;
    label: string;
    type: string;           // Quantitatif, Qualitatif, Narratif, Calculé
    unit?: string;
    obligatoire: boolean;
    esrsEquivalent?: string;
    value?: string;         // raw value if filled
    status: 'filled' | 'missing';
  }>;
}

export interface ReportPackData {
  pack: {
    id: string;
    name: string;
    templateCode: string;
    templateName: string;
    status: string;
    completionScore: number;
    ownerId?: string;
    owner?: string;
    createdAt: string;
    updatedAt: string;
    fiscalYear?: string;
    clientOrg?: string;
  };
  checklistItems: ReportChecklistItem[];
  kpiRequirements: ReportKPIRequirement[];
  evidences: ReportEvidence[];
  auditLogs?: ReportAuditLog[];
  /** Structured VSME section data for detailed narrative reports */
  vsmeSections?: VSMESectionData[];
}

export interface ReportChecklistItem {
  id: string;
  code: string;
  label: string;
  category: ESGCategory;
  requirementLevel: 'MANDATORY' | 'RECOMMENDED';
  status: 'MISSING' | 'PROVIDED' | 'NEEDS_REVIEW' | 'ACCEPTED' | 'REJECTED';
  description?: string;
  comment?: string;
  assignedTo?: string;
  dueDate?: string;
}

export interface ReportKPIRequirement {
  id: string;
  code: string;
  name: string;
  unit: string;
  category: ESGCategory;
  status: string;
  value?: number;
  period?: string;
  hasEvidence: boolean;
  evidenceCount: number;
  calculationType?: string;
  formula?: string;
  sources?: string;
  methodology?: string;
}

export interface ReportEvidence {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  period?: string;
  category?: ESGCategory;
  uploadedBy?: string;
  uploadedAt: string;
  linkedIndicators: string[];
}

export interface ReportAuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  details?: unknown;
  timestamp: string;
}

// ==================== REPORT OPTIONS ====================

export interface ReportOptions {
  reportType: 'standard' | 'executive' | 'audit';
  includeExecutiveSummary: boolean;
  includeEvidence: boolean;
  includeAuditTrail: boolean;
  brandConfig?: BrandConfig;
}

// ==================== ESG CATEGORIES ====================

export type ESGCategory = 'E' | 'S' | 'G';

export const ESG_CATEGORY_NAMES: Record<ESGCategory, string> = {
  E: 'Environnement',
  S: 'Social',
  G: 'Gouvernance',
};

export const ESG_CATEGORIES: ESGCategory[] = ['E', 'S', 'G'];

// ==================== STATUS LABELS ====================

export const STATUS_LABELS: Record<string, string> = {
  // Checklist items (uppercase)
  MISSING: 'Manquant',
  PROVIDED: 'Fourni',
  COMPUTED: 'Calculé',
  NEEDS_REVIEW: 'À réviser',
  ACCEPTED: 'Validé',
  APPROVED: 'Approuvé',
  REJECTED: 'Rejeté',
  // Pack statuses
  DRAFT: 'Brouillon',
  IN_PROGRESS: 'En cours',
  READY_FOR_REVIEW: 'Prêt pour revue',
  CHANGES_REQUESTED: 'Modifications demandées',
  // KPI statuses (lowercase)
  missing: 'Manquant',
  'in-progress': 'En cours',
  provided: 'Fourni',
  validated: 'Validé',
};

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

// ==================== REQUIREMENT LABELS ====================

export const REQUIREMENT_LABELS: Record<string, string> = {
  MANDATORY: 'Obligatoire',
  RECOMMENDED: 'Recommandé',
};

// ==================== FILE TYPE LABELS ====================

export function getFileTypeLabel(fileType: string): string {
  if (fileType.includes('pdf')) return 'PDF';
  if (fileType.includes('image')) return 'Image';
  if (fileType.includes('sheet') || fileType.includes('excel')) return 'Excel';
  if (fileType.includes('csv')) return 'CSV';
  if (fileType.includes('word') || fileType.includes('document')) return 'Word';
  return 'Fichier';
}
