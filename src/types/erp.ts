/**
 * ERP CONNECTOR TYPES
 *
 * Architecture de connexion universelle ERP → Solvid.IA
 * Permet à toute entreprise de connecter son ERP pour alimenter
 * automatiquement les référentiels ESG (VSME, CSRD, etc.)
 */

// ─── Connecteurs disponibles ────────────────────────────────────────

export type ERPProvider =
  | 'pennylane'
  | 'odoo'
  | 'sage'
  | 'cegid'
  | 'sap'
  | 'oracle'
  | 'quickbooks'
  | 'xero'
  | 'custom_api'
  | 'fec_import';   // Fichier des Écritures Comptables (standard FR)

export type AuthMethod = 'api_key' | 'oauth2' | 'basic' | 'file_upload';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'expired';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'partial' | 'error';

export type DataCategory = 'comptabilite' | 'rh' | 'achats' | 'energie' | 'dechets' | 'transport';

// ─── Catalogue de connecteurs ───────────────────────────────────────

export interface ERPConnectorDefinition {
  id: ERPProvider;
  name: string;
  description: string;
  logo: string;                // Emoji ou URL
  authMethod: AuthMethod;
  categories: DataCategory[];  // Types de données extractibles
  status: 'available' | 'coming_soon' | 'beta';
  region: string[];            // fr, eu, us, global
  fields: AuthField[];         // Champs de configuration requis
  endpoints: ERPEndpoint[];    // Points de données disponibles
}

export interface AuthField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url' | 'file';
  placeholder?: string;
  required: boolean;
  helpText?: string;
}

export interface ERPEndpoint {
  id: string;
  name: string;
  description: string;
  category: DataCategory;
  dataFields: ERPDataField[];
}

export interface ERPDataField {
  key: string;
  label: string;
  type: 'number' | 'string' | 'date' | 'currency';
  unit?: string;
}

// ─── Connexion active ───────────────────────────────────────────────

export interface ERPConnection {
  id: string;
  organizationId: string;
  provider: ERPProvider;
  name: string;                // Nom donné par l'utilisateur
  status: ConnectionStatus;
  credentials: Record<string, string>;  // Chiffré côté client
  config: ERPConnectionConfig;
  createdAt: string;
  updatedAt: string;
  lastSyncAt?: string;
  lastSyncStatus?: SyncStatus;
  errorMessage?: string;
}

export interface ERPConnectionConfig {
  autoSync: boolean;
  syncFrequency: 'manual' | 'daily' | 'weekly' | 'monthly';
  syncTime?: string;           // HH:mm
  enabledEndpoints: string[];  // IDs des endpoints activés
  defaultPeriod?: string;      // ex: "2025"
  defaultEntity?: string;      // ex: "Siège"
}

// ─── Mapping ERP → ESG ─────────────────────────────────────────────

export interface ERPMapping {
  id: string;
  connectionId: string;
  name: string;
  description?: string;
  rules: MappingRule[];
  createdAt: string;
  updatedAt: string;
}

export interface MappingRule {
  id: string;
  erpEndpoint: string;         // Endpoint source ERP
  erpField: string;            // Champ ERP (ex: "compte_6061")
  targetCode: string;          // Code VSME cible (ex: "B3.1")
  targetName: string;          // Nom indicateur cible
  transformation: TransformationType;
  transformParams?: Record<string, any>;
  unit?: string;
  category: 'E' | 'S' | 'G';
  isActive: boolean;
}

export type TransformationType =
  | 'direct'                   // Valeur brute
  | 'sum'                      // Somme de plusieurs lignes
  | 'average'                  // Moyenne
  | 'count'                    // Comptage
  | 'formula'                  // Formule personnalisée
  | 'factor'                   // Multiplication par facteur (ex: kWh → MWh)
  | 'filter_sum';              // Somme filtrée (ex: comptes 6061*)

// ─── Historique de synchronisation ──────────────────────────────────

export interface SyncJob {
  id: string;
  connectionId: string;
  status: SyncStatus;
  startedAt: string;
  completedAt?: string;
  triggeredBy: 'manual' | 'auto' | 'system';
  stats: SyncStats;
  errors: SyncError[];
  dataPreview?: SyncDataPreview[];
}

export interface SyncStats {
  totalRecords: number;
  mappedRecords: number;
  importedRecords: number;
  skippedRecords: number;
  errorRecords: number;
  indicatorsUpdated: number;
  duration?: number;           // ms
}

export interface SyncError {
  field: string;
  message: string;
  severity: 'warning' | 'error';
  row?: number;
}

export interface SyncDataPreview {
  erpField: string;
  erpValue: string | number;
  targetCode: string;
  targetName: string;
  transformedValue: number | string;
  unit: string;
  status: 'mapped' | 'unmapped' | 'error';
}

// ─── Mappings prédéfinis comptables → ESG ───────────────────────────

export interface AccountMappingTemplate {
  id: string;
  name: string;
  description: string;
  provider: ERPProvider | 'universal';
  rules: PredefinedMappingRule[];
}

export interface PredefinedMappingRule {
  accountPattern: string;      // ex: "6061*" ou "601*"
  accountLabel: string;        // ex: "Fournitures non stockables - Énergie"
  targetCode: string;          // ex: "B3.1"
  targetName: string;          // ex: "Consommation totale d'énergie"
  transformation: TransformationType;
  transformParams?: Record<string, any>;
  unit: string;
  category: 'E' | 'S' | 'G';
  confidence: number;          // 0-1 : fiabilité du mapping
}

// ─── Extraction multi-niveaux (v2) ──────────────────────────────────

export type ESGSupplierCategory =
  | 'energy_electricity'
  | 'energy_gas'
  | 'energy_fuel'
  | 'energy_other'
  | 'water'
  | 'waste_collection'
  | 'waste_recycling'
  | 'transport_freight'
  | 'transport_business_travel'
  | 'audit_legal'
  | 'training'
  | 'insurance'
  | 'telecom'
  | 'it_services'
  | 'office_supplies'
  | 'uncategorized';

export type DataConfidenceLevel =
  | 'direct_measurement'       // Quantité physique extraite de facture
  | 'supplier_classified'      // Fournisseur identifié, montant converti
  | 'account_estimated'        // Compte PCG avec facteur de conversion
  | 'monetary_proxy';          // Montant EUR brut, ratio générique

// ─── Fournisseurs ───────────────────────────────────────────────────

export interface ERPSupplier {
  id: string;                  // CompAuxNum (FEC) ou partner_id (Odoo)
  name: string;
  category?: ESGSupplierCategory;
  categoryConfidence?: number;
}

export interface SupplierClassification {
  supplierId: string;
  supplierName: string;
  category: ESGSupplierCategory;
  confidence: number;
  matchMethod: 'known_list' | 'name_pattern' | 'account_code' | 'description_parse' | 'manual';
  vsmeTargets: string[];
}

// ─── Factures ───────────────────────────────────────────────────────

export interface ERPInvoice {
  id: string;
  type: 'supplier' | 'customer';
  invoiceNumber: string;
  date: string;
  supplier: ERPSupplier;
  totalHT: number;
  totalTTC?: number;
  currency: string;
  accountCode?: string;
  lines: ERPInvoiceLine[];
  rawDescription?: string;
}

export interface ERPInvoiceLine {
  id: string;
  description: string;
  accountCode: string;
  amount: number;
  quantity?: number;
  unitPrice?: number;
  unit?: string;               // kWh, m3, L, kg, tonnes
}

// ─── Écritures comptables (FEC granulaire) ──────────────────────────

export interface ERPJournalEntry {
  id: string;
  journalCode: string;
  date: string;
  accountCode: string;
  accountLabel: string;
  auxiliaryCode?: string;      // CompAuxNum (code fournisseur)
  auxiliaryLabel?: string;     // CompAuxLib (nom fournisseur)
  description: string;         // EcritureLib — clé pour extraction
  debit: number;
  credit: number;
  pieceRef?: string;           // Référence pièce (n° facture)
}

// ─── Données RH (Odoo uniquement) ──────────────────────────────────

export interface ERPEmployee {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
  department?: string;
  jobTitle?: string;
  contractType?: 'cdi' | 'cdd' | 'interim' | 'apprentice' | 'other';
  fte: number;                 // 1.0 = temps plein
  startDate?: string;
  endDate?: string;
  salary?: number;             // Brut annuel
}

export interface ERPHRSummary {
  headcountFTE: number;
  totalEmployees: number;
  genderBreakdown: { male: number; female: number; other: number };
  genderPercentFemale: number;
  totalTrainingHours?: number;
  totalSalaryMass: number;
  turnoverRate?: number;
}

// ─── Quantités physiques extraites ──────────────────────────────────

export interface ExtractedQuantity {
  value: number;
  unit: string;
  normalizedUnit: string;      // MWh, m3, tonnes
  normalizedValue: number;
  confidence: number;
  sourceText: string;
}

// ─── Résultat ESG enrichi ───────────────────────────────────────────

export interface ESGDataPoint {
  vsmeCode: string;
  vsmeName: string;
  value: number;
  unit: string;
  confidence: DataConfidenceLevel;
  confidenceScore: number;
  pillar: 'E' | 'S' | 'G';
  sources: ESGDataSource[];
  method: string;              // Description humaine de la méthode
}

export interface ESGDataSource {
  type: 'invoice' | 'journal_entry' | 'hr_record' | 'account_balance';
  reference: string;
  supplierName?: string;
  description?: string;
  amount: number;
  physicalQuantity?: number;
  physicalUnit?: string;
  date: string;
}

export interface EnrichedSyncDataPreview extends SyncDataPreview {
  confidence: DataConfidenceLevel;
  confidenceScore: number;
  sourceCount: number;
  sources: ESGDataSource[];
  method: string;
}

// ─── Capacités adaptateur ───────────────────────────────────────────

export interface ERPAdapterCapabilities {
  hasInvoices: boolean;
  hasInvoiceLines: boolean;
  hasJournalEntries: boolean;
  hasHR: boolean;
  hasPhysicalQuantities: boolean;
}
