import { 
  RegulatoryReference, 
  AuditCheck, 
  RegulatoryResource,
  CSRDESRSDependency,
  DatapointRegulatoryMapping 
} from '@/types/compliance';

// ============================================================================
// REGULATORY REFERENCES - Base de conformité CSRD/ESRS
// ============================================================================

export const regulatoryReferences: RegulatoryReference[] = [
  // ESRS E1 - Climate Change
  {
    id: 'ref-esrs-e1',
    reference_code: 'ESRS-E1',
    reference_type: 'esrs_standard',
    esrs_standard: 'ESRS E1',
    esrs_pillar: 'environmental',
    title_en: 'ESRS E1 - Climate Change',
    title_fr: 'ESRS E1 - Changement climatique',
    description_en: 'This Standard sets out the disclosure requirements for climate change',
    requirement_nature: 'both',
    is_mandatory: true,
    is_conditional: false,
    assurance_level: 'limited',
    audit_priority: 'critical',
    efrag_document_url: 'https://www.efrag.org/Assets/Download?assetUrl=/sites/webpublishing/SiteAssets/ESRS-E1.pdf',
    version: 'v1.0',
    status: 'active',
    created_at: new Date('2023-07-31'),
    updated_at: new Date('2023-07-31'),
  },
  
  // ESRS E1-6 - GHG Emissions
  {
    id: 'ref-e1-6',
    reference_code: 'ESRS-E1-6',
    reference_type: 'disclosure_requirement',
    parent_reference_id: 'ref-esrs-e1',
    csrd_article: 'Directive (EU) 2022/2464 - Article 29b(2)(d)',
    esrs_standard: 'ESRS E1',
    esrs_pillar: 'environmental',
    esrs_disclosure_requirement: 'E1-6',
    esrs_paragraph: '§44-55',
    title_en: 'Disclosure Requirement E1-6 – Gross Scopes 1, 2, 3 and Total GHG emissions',
    title_fr: 'Exigence d\'information E1-6 – Émissions brutes de GES Scopes 1, 2, 3 et totales',
    description_en: 'The undertaking shall disclose its gross GHG emissions in tonnes of CO2 equivalent',
    requirement_nature: 'quantitative',
    is_mandatory: true,
    is_conditional: false,
    assurance_level: 'limited',
    audit_priority: 'critical',
    eur_lex_url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022L2464',
    efrag_document_url: 'https://www.efrag.org/Assets/Download?assetUrl=/sites/webpublishing/SiteAssets/ESRS-E1.pdf',
    efrag_pdf_page: 28,
    version: 'v1.0',
    status: 'active',
    created_at: new Date('2023-07-31'),
    updated_at: new Date('2023-07-31'),
  },
  
  // ESRS E1-6 Scope 1 (datapoint)
  {
    id: 'ref-e1-6-scope1',
    reference_code: 'ESRS-E1-6-SCOPE1',
    reference_type: 'datapoint',
    parent_reference_id: 'ref-e1-6',
    csrd_article: 'Directive (EU) 2022/2464 - Article 29b(2)(d)',
    esrs_standard: 'ESRS E1',
    esrs_pillar: 'environmental',
    esrs_disclosure_requirement: 'E1-6',
    esrs_paragraph: '§44, §48',
    title_en: 'Gross Scope 1 GHG emissions in tonnes of CO2 equivalent',
    title_fr: 'Émissions brutes de GES Scope 1 en tonnes équivalent CO2',
    requirement_nature: 'quantitative',
    is_mandatory: true,
    is_conditional: false,
    assurance_level: 'limited',
    audit_priority: 'critical',
    eur_lex_url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022L2464',
    efrag_document_url: 'https://www.efrag.org/Assets/Download?assetUrl=/sites/webpublishing/SiteAssets/ESRS-E1.pdf',
    efrag_pdf_page: 28,
    version: 'v1.0',
    status: 'active',
    created_at: new Date('2023-07-31'),
    updated_at: new Date('2023-07-31'),
  },
  
  // ESRS 2 - General Disclosures
  {
    id: 'ref-esrs-2',
    reference_code: 'ESRS-2',
    reference_type: 'esrs_standard',
    esrs_standard: 'ESRS 2',
    esrs_pillar: 'cross_cutting',
    title_en: 'ESRS 2 - General Disclosures',
    title_fr: 'ESRS 2 - Informations générales',
    description_en: 'General disclosures required for all undertakings',
    requirement_nature: 'both',
    is_mandatory: true,
    is_conditional: false,
    assurance_level: 'limited',
    audit_priority: 'critical',
    version: 'v1.0',
    status: 'active',
    created_at: new Date('2023-07-31'),
    updated_at: new Date('2023-07-31'),
  },
  
  // ESRS 2 - GOV-1
  {
    id: 'ref-esrs-2-gov1',
    reference_code: 'ESRS-2-GOV1',
    reference_type: 'disclosure_requirement',
    parent_reference_id: 'ref-esrs-2',
    esrs_standard: 'ESRS 2',
    esrs_pillar: 'cross_cutting',
    esrs_disclosure_requirement: 'GOV-1',
    title_en: 'The role of the administrative, management and supervisory bodies',
    title_fr: 'Rôle des organes d\'administration, de direction et de surveillance',
    description_en: 'Information about governance structure and oversight of sustainability matters',
    requirement_nature: 'qualitative',
    is_mandatory: true,
    is_conditional: false,
    assurance_level: 'limited',
    audit_priority: 'critical',
    version: 'v1.0',
    status: 'active',
    created_at: new Date('2023-07-31'),
    updated_at: new Date('2023-07-31'),
  },
  
  // ESRS S1 - Own Workforce
  {
    id: 'ref-esrs-s1',
    reference_code: 'ESRS-S1',
    reference_type: 'esrs_standard',
    esrs_standard: 'ESRS S1',
    esrs_pillar: 'social',
    title_en: 'ESRS S1 - Own Workforce',
    title_fr: 'ESRS S1 - Effectifs de l\'entreprise',
    description_en: 'This Standard sets out disclosure requirements for own workforce',
    requirement_nature: 'both',
    is_mandatory: true,
    is_conditional: false,
    assurance_level: 'limited',
    audit_priority: 'high',
    version: 'v1.0',
    status: 'active',
    created_at: new Date('2023-07-31'),
    updated_at: new Date('2023-07-31'),
  },
];

// ============================================================================
// AUDIT CHECKS - Règles de vérification
// ============================================================================

export const auditChecks: AuditCheck[] = [
  // Structure Checks
  {
    id: 'check-str-001',
    check_code: 'STR-001',
    check_category: 'structure',
    check_name: 'Présence des informations générales ESRS 2',
    check_description: 'Vérifier que toutes les sections obligatoires ESRS 2 sont présentes',
    check_type: 'presence',
    validation_logic: {
      required_sections: ['ESRS2-GOV1', 'ESRS2-GOV2', 'ESRS2-SBM1', 'ESRS2-IRO1', 'ESRS2-BP1', 'ESRS2-BP2']
    },
    severity: 'critical',
    blocking: true,
    weight: 2.0,
    max_points: 10,
    is_automated: true,
    requires_manual_review: false,
    failure_message_template: 'Sections ESRS 2 manquantes : {{missing_sections}}',
    recommendation_template: 'Veuillez compléter les sections suivantes : {{missing_sections}}',
    is_active: true,
  },
  
  {
    id: 'check-str-002',
    check_code: 'STR-002',
    check_category: 'structure',
    check_name: 'Double matérialité documentée',
    check_description: 'Vérifier qu\'une analyse de double matérialité a été réalisée',
    check_type: 'completeness',
    validation_logic: {
      entity: 'materiality_assessment',
      required_fields: ['impact_score', 'financial_score', 'conclusion'],
      min_assessed_topics: 10
    },
    severity: 'critical',
    blocking: true,
    weight: 2.0,
    max_points: 10,
    is_automated: true,
    requires_manual_review: false,
    failure_message_template: 'Analyse de double matérialité incomplète',
    recommendation_template: 'Réalisez une analyse de double matérialité avec au moins 10 enjeux évalués',
    is_active: true,
  },
  
  // Datapoint Checks
  {
    id: 'check-data-e1-6-scope1',
    check_code: 'DATA-E1-6-SCOPE1',
    check_category: 'datapoint',
    check_name: 'Émissions Scope 1 - Présence et validation',
    check_description: 'Vérifier la présence et la validité des émissions Scope 1',
    check_type: 'validation',
    validation_logic: {
      datapoint_code: 'E1-6-SCOPE1',
      rules: { min: 0, unit: 'tCO2e', type: 'number' }
    },
    regulatory_reference_id: 'ref-e1-6-scope1',
    severity: 'critical',
    blocking: true,
    weight: 1.5,
    max_points: 10,
    is_automated: true,
    requires_manual_review: false,
    failure_message_template: 'Émissions Scope 1 manquantes ou invalides',
    recommendation_template: 'Saisissez les émissions Scope 1 en tCO2e avec source et preuves',
    is_active: true,
  },
  
  // Evidence Checks
  {
    id: 'check-evid-001',
    check_code: 'EVID-GHG-CRITICAL',
    check_category: 'evidence',
    check_name: 'Preuves pour émissions GES critiques',
    check_description: 'Vérifier la présence de preuves pour les émissions GES Scope 1-2-3',
    check_type: 'quality',
    validation_logic: {
      datapoint_codes: ['E1-6-SCOPE1', 'E1-6-SCOPE2', 'E1-6-SCOPE3'],
      min_evidence_files: 1,
      required_metadata: ['source', 'calculation_method']
    },
    severity: 'major',
    blocking: false,
    weight: 1.0,
    max_points: 10,
    is_automated: true,
    requires_manual_review: false,
    failure_message_template: 'Preuves insuffisantes pour {{datapoint_name}}',
    recommendation_template: 'Uploadez les factures, relevés ou calculs justifiant les émissions',
    is_active: true,
  },
  
  // Coherence Checks
  {
    id: 'check-coh-001',
    check_code: 'COH-GHG-TOTAL',
    check_category: 'coherence',
    check_name: 'Cohérence total émissions GES',
    check_description: 'Vérifier que Scope 1 + Scope 2 + Scope 3 = Total GES',
    check_type: 'consistency',
    validation_logic: {
      expression: 'Scope1 + Scope2 + Scope3 = TotalGHG',
      tolerance: 0.01
    },
    severity: 'critical',
    blocking: false,
    weight: 1.5,
    max_points: 10,
    is_automated: true,
    requires_manual_review: false,
    failure_message_template: 'Incohérence : Total GES ({{total}}) ≠ Somme des scopes ({{sum}})',
    recommendation_template: 'Vérifiez vos calculs GES et corrigez le total',
    is_active: true,
  },
  
  // Materiality Checks
  {
    id: 'check-mat-001',
    check_code: 'MAT-MATERIAL-COVERAGE',
    check_category: 'materiality',
    check_name: 'Couverture des enjeux matériels',
    check_description: 'Vérifier que tous les enjeux matériels ont des disclosures ESRS',
    check_type: 'completeness',
    validation_logic: {
      rule: 'FOR EACH material_topic, EXISTS at_least_one ESRS_disclosure'
    },
    severity: 'critical',
    blocking: true,
    weight: 2.0,
    max_points: 10,
    is_automated: true,
    requires_manual_review: false,
    failure_message_template: 'Enjeu matériel "{{topic}}" sans disclosure {{esrs_code}}',
    recommendation_template: 'Documentez les données pour {{esrs_code}} (enjeu matériel)',
    is_active: true,
  },
  
  // Format Checks
  {
    id: 'check-fmt-001',
    check_code: 'FORMAT-XHTML',
    check_category: 'format',
    check_name: 'Structure XHTML valide',
    check_description: 'Vérifier que le rapport généré est conforme XHTML/ESEF',
    check_type: 'validation',
    validation_logic: {
      format: 'xhtml',
      schema_validation: true
    },
    severity: 'major',
    blocking: false,
    weight: 0.5,
    max_points: 10,
    is_automated: true,
    requires_manual_review: false,
    failure_message_template: 'Erreurs de validation XHTML : {{errors}}',
    recommendation_template: 'Corrigez les erreurs de structure avant publication',
    is_active: true,
  },
];

// ============================================================================
// REGULATORY RESOURCES - Documentation officielle
// ============================================================================

export const regulatoryResources: RegulatoryResource[] = [
  {
    id: 'res-csrd-directive',
    resource_type: 'directive',
    title: 'Directive (EU) 2022/2464 of the European Parliament and of the Council on corporate sustainability reporting (CSRD)',
    short_name: 'CSRD Directive',
    reference_code: 'Directive (EU) 2022/2464',
    description: 'The Corporate Sustainability Reporting Directive',
    language: 'en',
    publisher: 'European Commission',
    publication_date: new Date('2022-12-14'),
    url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022L2464',
    pdf_url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32022L2464',
    is_official: true,
    tags: ['csrd', 'directive', 'sustainability reporting'],
    related_esrs: ['ESRS 1', 'ESRS 2', 'E1', 'E2', 'E3', 'E4', 'E5', 'S1', 'S2', 'S3', 'S4', 'G1'],
    target_audience: ['companies', 'consultants', 'auditors', 'regulators'],
    status: 'published',
    created_at: new Date('2022-12-14'),
    updated_at: new Date('2022-12-14'),
  },
  
  {
    id: 'res-esrs-set1',
    resource_type: 'delegated_act',
    title: 'Commission Delegated Regulation (EU) 2023/2772 - European Sustainability Reporting Standards (ESRS)',
    short_name: 'ESRS Set 1',
    reference_code: 'C(2023) 5303 final',
    description: 'First set of ESRS standards',
    language: 'en',
    publisher: 'EFRAG / European Commission',
    publication_date: new Date('2023-07-31'),
    url: 'https://www.efrag.org/lab6',
    is_official: true,
    tags: ['esrs', 'standards', 'set 1'],
    related_esrs: ['ESRS 1', 'ESRS 2', 'E1', 'E2', 'E3', 'E4', 'E5', 'S1', 'S2', 'S3', 'S4', 'G1'],
    target_audience: ['companies', 'consultants', 'auditors'],
    status: 'published',
    created_at: new Date('2023-07-31'),
    updated_at: new Date('2023-07-31'),
  },
  
  {
    id: 'res-esrs-e1',
    resource_type: 'guidance',
    title: 'ESRS E1 - Climate Change',
    short_name: 'ESRS E1',
    reference_code: 'ESRS E1',
    description: 'Standard on climate change disclosures',
    language: 'en',
    publisher: 'EFRAG',
    publication_date: new Date('2023-07-31'),
    url: 'https://www.efrag.org/Assets/Download?assetUrl=/sites/webpublishing/SiteAssets/ESRS-E1.pdf',
    pdf_url: 'https://www.efrag.org/Assets/Download?assetUrl=/sites/webpublishing/SiteAssets/ESRS-E1.pdf',
    is_official: true,
    tags: ['esrs', 'climate', 'environment', 'ghg emissions'],
    related_esrs: ['E1'],
    target_audience: ['companies', 'consultants'],
    status: 'published',
    created_at: new Date('2023-07-31'),
    updated_at: new Date('2023-07-31'),
  },
  
  {
    id: 'res-efrag-faq',
    resource_type: 'faq',
    title: 'EFRAG Q&A on ESRS - Frequently Asked Questions',
    short_name: 'EFRAG FAQ',
    description: 'Official answers to common ESRS questions',
    language: 'en',
    publisher: 'EFRAG',
    publication_date: new Date('2024-03-01'),
    url: 'https://www.efrag.org/lab3',
    is_official: true,
    tags: ['faq', 'questions', 'interpretation'],
    target_audience: ['companies', 'consultants', 'auditors'],
    status: 'published',
    created_at: new Date('2024-03-01'),
    updated_at: new Date('2024-03-01'),
  },
];

// ============================================================================
// CSRD/ESRS DEPENDENCY MATRIX
// ============================================================================

export const csrdEsrsDependencies: CSRDESRSDependency[] = [
  {
    id: 'dep-e1',
    csrd_article: 'Article 29b(2)(d)',
    csrd_obligation_text: 'Informations nécessaires pour comprendre les impacts de l\'entreprise sur le changement climatique',
    csrd_obligation_type: 'disclosure',
    esrs_standard: 'ESRS E1',
    esrs_disclosure_requirements: ['E1-1', 'E1-2', 'E1-3', 'E1-4', 'E1-5', 'E1-6', 'E1-7', 'E1-8', 'E1-9'],
    dependency_type: 'mandatory',
    conditionality_rule: 'Le changement climatique est présumé matériel sauf preuve contraire (ESRS 1 §AR16)',
    coverage_scope: 'full',
    coverage_percentage: 100,
    implementation_notes: 'E1 est la norme ESRS la plus détaillée. Les entreprises doivent fournir des données quantitatives (E1-5, E1-6) et des informations qualitatives (E1-1 à E1-4, E1-7 à E1-9). Les émissions GES (E1-6) requièrent une assurance limitée de 2024 à 2027, puis une assurance raisonnable à partir de 2028.',
    common_gaps: [
      'Émissions Scope 3 manquantes (catégories 1-15)',
      'Plan de transition incomplet (E1-1)',
      'Absence d\'objectifs avec baseline et échéancier clairs (E1-4)',
      'Consommation énergétique non ventilée renouvelable/non-renouvelable (E1-5)'
    ],
  },
  
  {
    id: 'dep-esrs-2',
    csrd_article: 'Article 29b(1)',
    csrd_obligation_text: 'Informations générales sur la gouvernance, la stratégie et la gestion des impacts, risques et opportunités',
    csrd_obligation_type: 'disclosure',
    esrs_standard: 'ESRS 2',
    esrs_disclosure_requirements: ['GOV-1', 'GOV-2', 'GOV-3', 'GOV-4', 'GOV-5', 'SBM-1', 'SBM-2', 'SBM-3', 'IRO-1', 'IRO-2'],
    dependency_type: 'mandatory',
    coverage_scope: 'full',
    coverage_percentage: 100,
    implementation_notes: 'ESRS 2 est obligatoire pour toutes les entreprises et fournit le contexte général pour toutes les autres normes ESRS. Ces informations générales sont le socle de la déclaration de durabilité.',
    common_gaps: [
      'Structure de gouvernance non clairement décrite',
      'Analyse de double matérialité manquante ou incomplète',
      'Absence de lien clair entre enjeux matériels et divulgations ESRS',
      'Processus IRO (Impacts, Risques, Opportunités) non documenté'
    ],
  },
];

// ============================================================================
// DATAPOINT REGULATORY MAPPING
// ============================================================================

export const datapointMappings: DatapointRegulatoryMapping[] = [
  {
    id: 'map-e1-6-scope1',
    datapoint_id: 'dp-scope1',
    datapoint_code: 'E1-6-SCOPE1',
    regulatory_reference_id: 'ref-e1-6-scope1',
    mapping_type: 'direct',
    validation_rules: {
      type: 'number',
      min: 0,
      unit: 'tCO2e',
      decimals: 2,
      calculation_method: 'GHG Protocol Scope 1',
      sources_accepted: ['measured', 'estimated_with_method']
    },
    calculation_formula: 'SUM(stationary_combustion + mobile_combustion + process_emissions + fugitive_emissions)',
    data_quality_requirements: {
      source: 'measured_or_estimated',
      confidence_level: 'high',
      evidence_required: true,
      calculation_methodology_documented: true
    },
    is_primary_mapping: true,
    coverage_percentage: 100,
    created_at: new Date(),
    updated_at: new Date(),
  },
];
