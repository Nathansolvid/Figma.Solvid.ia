// ============================================================================
// TYPES - MODULE DE TRANSPARENCE DES CALCULS
// ============================================================================

export type AggregationType = 'sum' | 'avg' | 'ratio' | 'weighted_avg' | 'custom';
export type DisplayFormat = 'number' | 'percent' | 'currency' | 'text' | 'score';
export type QualityLevel = 'measured' | 'estimated' | 'mixed' | 'calculated';
export type InputType = 'activity_data' | 'factor' | 'constant' | 'manual' | 'imported';
export type SourceType = 'invoice' | 'erp' | 'estimation' | 'provider' | 'sensor' | 'survey' | 'other';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type FactorSource = 'ademe' | 'ghg_protocol' | 'provider' | 'acv' | 'custom' | 'other';
export type CalculationAction = 'created' | 'updated' | 'input_changed' | 'factor_changed' | 'validated' | 'rejected' | 'archived';
export type ValidationStatus = 'draft' | 'pending_review' | 'validated' | 'rejected' | 'archived';

// ============================================================================
// TABLE 1: INDICATOR
// ============================================================================

export interface Indicator {
  id: string;
  name: string;
  code: string; // ex: E1_CO2_TOTAL, S1_EMPLOYEE_COUNT, G1_BOARD_DIVERSITY
  description: string;
  norm_reference?: string; // ex: CSRD E1-6, ESRS S1-6
  unit: string; // tCO2e, %, €, nombre, score
  aggregation_type: AggregationType;
  display_format: DisplayFormat;
  transparency_profile_id?: string;
  
  // Métadonnées
  category: 'environmental' | 'social' | 'governance' | 'cross_cutting';
  pillar?: 'E' | 'S' | 'G';
  is_mandatory: boolean;
  is_material: boolean;
  
  // Affichage
  display_order?: number;
  tooltip?: string;
  
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// TABLE 2: CALCULATION_PROFILE
// ============================================================================

export interface CalculationProfile {
  id: string;
  indicator_id: string;
  
  // Méthode de calcul
  calculation_method_text: string; // Description humaine
  formula_text: string; // ex: Σ(activity × emission_factor)
  formula_latex?: string; // Pour affichage mathématique
  steps: string[]; // Liste ordonnée d'étapes
  
  // Contexte
  assumptions: string; // Hypothèses retenues
  limitations: string; // Limites de la méthode
  quality_level: QualityLevel;
  
  // Métadonnées
  methodology_reference?: string; // ex: GHG Protocol, Bilan Carbone
  version: string;
  valid_from?: Date;
  valid_to?: Date;
  
  // Validation
  validation_status: ValidationStatus;
  validated_by?: string;
  validated_at?: Date;
  validation_comment?: string;
  
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by?: string;
}

// ============================================================================
// TABLE 3: CALCULATION_INPUT
// ============================================================================

export interface CalculationInput {
  id: string;
  calculation_profile_id: string;
  
  // Identification
  input_name: string;
  input_code?: string;
  input_type: InputType;
  
  // Valeur
  value: number | string;
  unit: string;
  
  // Source
  source_type: SourceType;
  source_reference: string; // Facture n°XXX, Export ERP du JJ/MM/AAAA
  source_system?: string; // Nom du système source
  
  // Contexte
  period_start?: Date;
  period_end?: Date;
  entity?: string; // Site, filiale, département
  scope?: string; // Périmètre organisationnel
  
  // Preuve
  evidence_link?: string; // URL vers fichier / document
  evidence_filename?: string;
  evidence_uploaded_at?: Date;
  
  // Qualité
  confidence_level: ConfidenceLevel;
  data_quality_note?: string;
  
  // Métadonnées
  is_estimated: boolean;
  estimation_method?: string;
  
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

// ============================================================================
// TABLE 4: CALCULATION_FACTOR
// ============================================================================

export interface CalculationFactor {
  id: string;
  calculation_profile_id: string;
  
  // Identification
  factor_name: string;
  factor_code?: string; // ex: FE_GAZ_NATUREL_2024
  factor_type?: string; // emission_factor, conversion_factor, coefficient
  
  // Valeur
  factor_value: number;
  factor_unit: string;
  uncertainty_range?: string; // ex: "±10%"
  
  // Source
  factor_source: FactorSource;
  source_reference: string; // ex: "Base Carbone ADEME v12.1"
  source_url?: string;
  source_document?: string;
  
  // Validité
  valid_from?: Date;
  valid_to?: Date;
  is_expired: boolean;
  
  // Contexte
  geographical_scope?: string; // France, Europe, Global
  sector?: string;
  justification_text?: string;
  
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// TABLE 5: CALCULATION_LOG
// ============================================================================

export interface CalculationLog {
  id: string;
  calculation_profile_id: string;
  
  // Action
  action: CalculationAction;
  action_detail?: string;
  
  // Changements
  field_changed?: string;
  old_value?: string | number;
  new_value?: string | number;
  
  // Contexte
  performed_by: string;
  performed_by_role?: string;
  performed_at: Date;
  
  // Commentaire
  comment?: string;
  
  // Métadonnées
  ip_address?: string;
  user_agent?: string;
}

// ============================================================================
// TYPES AUXILIAIRES
// ============================================================================

export interface CalculationWarning {
  type: 'missing_evidence' | 'expired_factor' | 'low_confidence' | 'estimation' | 'incomplete_data';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  field?: string;
  recommendation?: string;
}

export interface CalculationSummary {
  indicator: Indicator;
  profile: CalculationProfile;
  inputs: CalculationInput[];
  factors: CalculationFactor[];
  logs: CalculationLog[];
  warnings: CalculationWarning[];
  computed_value?: number | string;
  last_updated?: Date;
}

export interface TransparencyExport {
  indicator_code: string;
  indicator_name: string;
  calculated_value: number | string;
  unit: string;
  calculation_date: Date;
  methodology: string;
  formula: string;
  inputs: Array<{
    name: string;
    value: number | string;
    unit: string;
    source: string;
    confidence: string;
  }>;
  factors: Array<{
    name: string;
    value: number;
    unit: string;
    source: string;
    validity: string;
  }>;
  quality_level: string;
  warnings: string[];
  audit_trail: Array<{
    date: Date;
    action: string;
    user: string;
  }>;
}
