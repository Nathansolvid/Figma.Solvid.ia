// Types pour le système d'import Excel/CSV (Phase 4)

export type ImportStatus = "idle" | "uploading" | "parsing" | "mapping" | "smart_preview" | "completed" | "error";

export interface ImportedFile {
  id: string;
  filename: string;
  fileSize: number;
  fileType: "csv" | "xlsx";
  uploadedAt: Date;
  status: ImportStatus;
  errorMessage?: string;
  rowCount: number;
  columnCount: number;
}

export interface ParsedRow {
  rowNumber: number;
  data: Record<string, any>;
  isValid: boolean;
  validationErrors?: string[];
}

export interface ColumnMapping {
  sourceColumn: string; // Nom de la colonne dans le fichier Excel/CSV
  targetField: ImportFieldType; // Champ cible dans le système
  isRequired: boolean;
  example?: string;
}

export type ImportFieldType =
  | "entity"           // Entité (Site, Filiale, etc.)
  | "period"           // Période (année, trimestre)
  | "category"         // Catégorie E/S/G
  | "subcategory"      // Sous-catégorie (E1-Climate, S1-Workers, etc.)
  | "indicator_code"   // Code indicateur (GHG-SCOPE1, etc.)
  | "indicator_name"   // Nom indicateur
  | "value_numeric"    // Valeur numérique
  | "value_text"       // Valeur texte
  | "unit"             // Unité (tCO2e, MWh, etc.)
  | "source"           // Source de la donnée
  | "calculation_method" // Méthode de calcul
  | "evidence_list"    // Liste preuves associées
  | "comments"         // Commentaires
  | "skip";            // Colonne ignorée

export interface MappingTemplate {
  id: string;
  name: string;
  description: string;
  dossierId?: string; // Si lié à un dossier spécifique
  packType?: string; // Si lié à un pack
  mappings: ColumnMapping[];
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface DataImportSession {
  id: string;
  dossierId: string;
  packId?: string;
  file: ImportedFile;
  parsedData: ParsedRow[];
  mappings: ColumnMapping[];
  mappingTemplateId?: string;
  createdAt: Date;
  importedBy: string; // User ID
  importedRowCount?: number;
  skippedRowCount?: number;
  errorRowCount?: number;
}
