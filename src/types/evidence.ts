// Types pour Evidence Vault (Phase 7)

import { Evidence } from "./indicators";

export type EvidenceType = "file" | "link";
export type EvidenceFileType = "pdf" | "excel" | "image" | "word" | "other";
export type EvidenceStatus = "pending" | "approved" | "rejected";

export interface EvidenceFilter {
  searchQuery?: string;
  type?: EvidenceType | "all";
  fileType?: EvidenceFileType | "all";
  period?: string | "all";
  entity?: string | "all";
  indicatorId?: string | "all";
  status?: EvidenceStatus | "all";
  uploadedBy?: string | "all";
}

export interface EvidenceUploadProgress {
  filename: string;
  progress: number; // 0-100
  status: "uploading" | "processing" | "completed" | "error";
  errorMessage?: string;
}

export interface EvidenceMetadata {
  // Métadonnées obligatoires
  name: string;
  type: EvidenceType;
  period: string; // Ex: "2024", "Q1-2024"
  
  // Métadonnées fichier (si type = "file")
  file?: File;
  fileType?: EvidenceFileType;
  fileSize?: number;
  mimeType?: string;
  
  // Métadonnées lien (si type = "link")
  url?: string;
  
  // Métadonnées optionnelles
  entity?: string;
  description?: string;
  tags?: string[];
  
  // Liaisons
  indicatorIds: string[]; // Many-to-many avec indicateurs
}

export interface EvidenceValidationRule {
  id: string;
  name: string;
  description: string;
  validator: (evidence: Evidence) => {
    isValid: boolean;
    errorMessage?: string;
  };
}

export interface EvidenceStats {
  total: number;
  byType: {
    file: number;
    link: number;
  };
  byFileType: {
    pdf: number;
    excel: number;
    image: number;
    word: number;
    other: number;
  };
  byStatus: {
    pending: number;
    approved: number;
    rejected: number;
  };
  totalSize: number; // en bytes
  averageSize: number; // en bytes
  oldestEvidence: Date | null;
  newestEvidence: Date | null;
}

export interface EvidenceBulkAction {
  action: "delete" | "approve" | "reject" | "assign_indicator" | "add_tag";
  evidenceIds: string[];
  parameters?: Record<string, any>;
}

// Règles de validation
export const EVIDENCE_VALIDATION_RULES: EvidenceValidationRule[] = [
  {
    id: "max-file-size",
    name: "Taille maximale fichier",
    description: "Les fichiers ne doivent pas dépasser 10 MB",
    validator: (evidence: Evidence) => {
      if (evidence.type === "link") return { isValid: true };
      const maxSize = 10 * 1024 * 1024; // 10 MB
      const isValid = !evidence.fileSize || evidence.fileSize <= maxSize;
      return {
        isValid,
        errorMessage: isValid ? undefined : `Fichier trop volumineux (max 10 MB)`,
      };
    },
  },
  {
    id: "valid-url",
    name: "URL valide",
    description: "Les liens doivent être des URLs valides",
    validator: (evidence: Evidence) => {
      if (evidence.type === "file") return { isValid: true };
      try {
        if (evidence.url) {
          new URL(evidence.url);
        }
        return { isValid: true };
      } catch {
        return {
          isValid: false,
          errorMessage: "URL invalide",
        };
      }
    },
  },
  {
    id: "has-period",
    name: "Période obligatoire",
    description: "Toute preuve doit avoir une période définie",
    validator: (evidence: Evidence) => {
      const isValid = !!evidence.period && evidence.period.trim() !== "";
      return {
        isValid,
        errorMessage: isValid ? undefined : "La période est obligatoire",
      };
    },
  },
];

// Constantes
export const ACCEPTED_FILE_TYPES = {
  pdf: ".pdf",
  excel: ".xlsx,.xls,.csv",
  image: ".jpg,.jpeg,.png,.gif,.webp",
  word: ".doc,.docx",
  other: "*",
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const FILE_TYPE_ICONS: Record<EvidenceFileType, string> = {
  pdf: "📄",
  excel: "📊",
  image: "🖼️",
  word: "📝",
  other: "📎",
};

export const FILE_TYPE_COLORS: Record<EvidenceFileType, string> = {
  pdf: "text-red-600 bg-red-50",
  excel: "text-green-600 bg-green-50",
  image: "text-blue-600 bg-blue-50",
  word: "text-indigo-600 bg-indigo-50",
  other: "text-gray-600 bg-gray-50",
};
