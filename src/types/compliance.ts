// ============================================================================
// TYPES - BIBLIOTHÈQUE DE CONFORMITÉ CSRD/ESRS
// ============================================================================

export type ReferenceType = 'directive' | 'esrs_standard' | 'disclosure_requirement' | 'datapoint' | 'guidance';
export type ESRSPillar = 'cross_cutting' | 'environmental' | 'social' | 'governance';
export type RequirementNature = 'quantitative' | 'qualitative' | 'both';
export type AssuranceLevel = 'reasonable' | 'limited' | 'none';
export type AuditPriority = 'critical' | 'high' | 'medium' | 'low';
export type RegulatoryStatus = 'draft' | 'active' | 'deprecated' | 'superseded';

export interface RegulatoryReference {
  id: string;
  reference_code: string;
  reference_type: ReferenceType;
  parent_reference_id?: string;
  
  // Hiérarchie réglementaire
  csrd_article?: string;
  esrs_standard?: string;
  esrs_pillar?: ESRSPillar;
  esrs_disclosure_requirement?: string;
  esrs_paragraph?: string;
  
  // Contenu
  title_en: string;
  title_fr?: string;
  description_en?: string;
  description_fr?: string;
  requirement_text?: string;
  
  // Métadonnées de conformité
  requirement_nature: RequirementNature;
  is_mandatory: boolean;
  is_conditional: boolean;
  materiality_condition?: string;
  
  // Applicabilité
  applicable_from?: Date;
  applicable_to_entity_types?: string[];
  sector_specific?: boolean;
  sector_codes?: string[];
  
  // Niveau d'assurance audit
  assurance_level: AssuranceLevel;
  audit_priority: AuditPriority;
  
  // Documentation externe
  eur_lex_url?: string;
  efrag_document_url?: string;
  efrag_pdf_page?: number;
  national_guide_url?: string;
  
  // Versioning
  version: string;
  effective_date?: Date;
  superseded_by?: string;
  status: RegulatoryStatus;
  
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// TYPES - AUDIT CHECKS
// ============================================================================

export type CheckCategory = 'structure' | 'datapoint' | 'materiality' | 'evidence' | 'format' | 'coherence';
export type CheckType = 'presence' | 'completeness' | 'validation' | 'consistency' | 'quality';
export type CheckSeverity = 'critical' | 'major' | 'minor' | 'info';
export type CheckStatus = 'passed' | 'failed' | 'warning' | 'not_applicable' | 'manual_review_required';

export interface AuditCheck {
  id: string;
  check_code: string;
  check_category: CheckCategory;
  check_name: string;
  check_description?: string;
  
  // Règle de vérification
  check_type: CheckType;
  validation_logic: any; // JSON
  
  // Liaison réglementaire
  regulatory_reference_id?: string;
  
  // Criticité
  severity: CheckSeverity;
  blocking: boolean;
  
  // Scoring
  weight: number;
  max_points: number;
  
  // Automatisation
  is_automated: boolean;
  automation_function?: string;
  requires_manual_review: boolean;
  
  // Documentation
  failure_message_template?: string;
  recommendation_template?: string;
  help_url?: string;
  
  is_active: boolean;
}

export interface AuditCheckResult {
  id: string;
  dossier_id: string;
  audit_run_id: string;
  audit_check_id: string;
  
  // Résultat
  check_status: CheckStatus;
  score_obtained: number;
  score_max: number;
  
  // Détails
  failure_details?: any; // JSON
  affected_entities?: string[]; // IDs des entités concernées
  
  // Recommandations
  recommendation?: string;
  priority?: 'immediate' | 'high' | 'medium' | 'low';
  estimated_effort?: 'quick' | 'moderate' | 'extensive';
  
  // Traçabilité
  checked_at: Date;
  checked_by: string;
  
  // Résolution
  is_resolved: boolean;
  resolved_at?: Date;
  resolved_by?: string;
  resolution_notes?: string;
}

export type AuditType = 'auto_check' | 'pre_audit' | 'external_audit';
export type AuditScope = 'full' | 'incremental' | 'specific_module';
export type AuditRunStatus = 'running' | 'completed' | 'failed' | 'cancelled';
export type ComplianceStatus = 'non_compliant' | 'partial' | 'substantially_compliant' | 'fully_compliant';

export interface AuditRun {
  id: string;
  dossier_id: string;
  
  // Type d'audit
  audit_type: AuditType;
  audit_scope: AuditScope;
  
  // Déclenchement
  triggered_by: string;
  trigger_reason?: string;
  
  // Exécution
  started_at: Date;
  completed_at?: Date;
  duration_seconds?: number;
  status: AuditRunStatus;
  
  // Résultats globaux
  total_checks: number;
  passed_checks: number;
  failed_checks: number;
  warning_checks: number;
  
  overall_score: number; // 0-100
  compliance_status: ComplianceStatus;
  audit_ready: boolean;
  
  // Blocages
  critical_issues_count: number;
  blocking_issues?: string[]; // check_codes
  
  // Rapport
  report_generated: boolean;
  report_url?: string;
}

// ============================================================================
// TYPES - COMPLIANCE COVERAGE
// ============================================================================

export interface ComplianceCoverage {
  id: string;
  dossier_id: string;
  calculation_date: Date;
  
  // Scores globaux
  overall_csrd_compliance_pct: number;
  overall_esrs_coverage_pct: number;
  
  // Scores par pilier
  environmental_compliance_pct: number;
  social_compliance_pct: number;
  governance_compliance_pct: number;
  
  // Scores par norme ESRS
  esrs_scores: {
    [key: string]: {
      coverage: number;
      status: 'compliant' | 'partial' | 'not_applicable' | 'non_compliant';
    };
  };
  
  // Détails par type d'exigence
  quantitative_compliance_pct: number;
  qualitative_compliance_pct: number;
  
  // Gaps identifiés
  missing_disclosures: string[];
  incomplete_disclosures: string[];
  critical_gaps: string[];
  
  // Statut global
  compliance_status: ComplianceStatus;
  audit_readiness: 'not_ready' | 'preparation' | 'pre_audit_ready' | 'audit_ready';
  
  calculated_by: string;
}

// ============================================================================
// TYPES - REGULATORY RESOURCES
// ============================================================================

export type ResourceType = 'directive' | 'delegated_act' | 'guidance' | 'faq' | 
                           'interpretation' | 'national_guide' | 'industry_guide' | 'template';
export type ResourceStatus = 'draft' | 'consultation' | 'published' | 'updated' | 'archived';

export interface RegulatoryResource {
  id: string;
  resource_type: ResourceType;
  
  // Identification
  title: string;
  short_name?: string;
  reference_code?: string;
  
  // Contenu
  description?: string;
  language: string;
  publisher: string;
  publication_date?: Date;
  version?: string;
  
  // Accès
  url?: string;
  pdf_url?: string;
  download_url?: string;
  is_official: boolean;
  
  // Métadonnées
  tags?: string[];
  related_esrs?: string[];
  target_audience?: string[];
  
  // Statut
  status: ResourceStatus;
  supersedes?: string;
  
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// TYPES - CSRD/ESRS DEPENDENCY MATRIX
// ============================================================================

export type DependencyType = 'mandatory' | 'conditional' | 'optional';
export type CoverageScope = 'full' | 'partial' | 'contributory';

export interface CSRDESRSDependency {
  id: string;
  
  // Côté CSRD
  csrd_article: string;
  csrd_obligation_text?: string;
  csrd_obligation_type: 'disclosure' | 'assurance' | 'publication' | 'governance';
  
  // Côté ESRS
  esrs_standard: string;
  esrs_disclosure_requirements: string[];
  
  // Nature de la dépendance
  dependency_type: DependencyType;
  conditionality_rule?: string;
  
  // Couverture
  coverage_scope: CoverageScope;
  coverage_percentage: number;
  
  // Métadonnées
  implementation_notes?: string;
  common_gaps?: string[];
}

// ============================================================================
// TYPES - DATAPOINT MAPPING
// ============================================================================

export type MappingType = 'direct' | 'contributory' | 'supporting' | 'contextual';

export interface DatapointRegulatoryMapping {
  id: string;
  
  // Liaison avec datapoint métier
  datapoint_id: string;
  datapoint_code: string;
  
  // Liaison avec référence réglementaire
  regulatory_reference_id: string;
  
  // Nature de la liaison
  mapping_type: MappingType;
  
  // Règles de validation
  validation_rules?: any; // JSON
  calculation_formula?: string;
  data_quality_requirements?: any; // JSON
  
  // Métadonnées
  is_primary_mapping: boolean;
  coverage_percentage: number;
  
  created_at: Date;
  updated_at: Date;
}
