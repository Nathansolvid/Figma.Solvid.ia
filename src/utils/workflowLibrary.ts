/**
 * BIBLIOTHÈQUE DE WORKFLOWS - VERSION ENRICHIE
 * Workflows essentiels + preuves obligatoires par workflow
 */

import { MODULE_B } from '@/data/vsme-data';

export type WorkflowCategory = 'Environnement' | 'Social' | 'Gouvernance' | 'Transverse' | 'Réglementaire';

// ─── Preuve obligatoire rattachée à un workflow ──────────────────────────────
export interface RequiredEvidence {
  /** Identifiant unique de la preuve, ex: "factures-energie-12m" */
  id: string;
  /** Libellé court affiché dans la checklist */
  label: string;
  /** Description détaillée du document attendu */
  description: string;
  /** Catégorie ESG */
  category: 'E' | 'S' | 'G';
  /** Codes VSME associés (pour lier les preuves uploadées via indicatorId) */
  linkedIndicators: string[];
  /** Types de fichiers acceptés */
  fileTypes?: string[];
  /** Obligatoire = bloque la validation du workflow */
  mandatory: boolean;
}

// ─── Définition d'un workflow ────────────────────────────────────────────────
export interface WorkflowDefinition {
  id: string;
  name: string;
  category: WorkflowCategory;
  description: string;
  icon: string;
  difficulty: 'Débutant' | 'Intermédiaire' | 'Avancé';
  estimatedDuration: string;
  templatesRequired: string[];
  templatesOptional: string[];
  /** Preuves & justificatifs obligatoires pour ce workflow */
  requiredEvidence: RequiredEvidence[];
  /** 🆕 Sections VSME pertinentes pour ce workflow (ex: ["B3","B7"]) */
  indicators: string[];
  regulatory: boolean;
  audience: string[];
  tags: string[];
}

// ─── Bibliothèque complète ───────────────────────────────────────────────────

export const WORKFLOW_LIBRARY: WorkflowDefinition[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. VSME — Rapport de durabilité
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'vsme',
    name: 'VSME — Rapport de durabilité',
    category: 'Réglementaire',
    description: 'Référentiel EFRAG 2024 pour PME non cotées — 47 données E/S/G',
    icon: '🌿',
    difficulty: 'Intermédiaire',
    estimatedDuration: '10-20 heures',
    templatesRequired: ['vsme-environnement', 'vsme-social', 'vsme-gouvernance'],
    templatesOptional: ['vsme-general'],
    indicators: ['B1','B2','B3','B4','B5','B6','B7','B8','B9','B10','B11'],
    requiredEvidence: [
      // B1 — Informations générales
      {
        id: 'bilan-social-dsn',
        label: 'Bilan social / DSN annuelle',
        description: 'Bilan social, DSN annuelle ou extrait DADS justifiant le nombre d\'employés',
        category: 'S',
        linkedIndicators: ['B1.1'],
        fileTypes: ['pdf', 'excel'],
        mandatory: true,
      },
      {
        id: 'liasse-fiscale',
        label: 'Liasse fiscale ou bilan comptable',
        description: 'Liasse fiscale ou bilan comptable signé par le CAC (chiffre d\'affaires)',
        category: 'G',
        linkedIndicators: ['B1.2', 'B1.3'],
        fileTypes: ['pdf'],
        mandatory: true,
      },
      {
        id: 'kbis-insee',
        label: 'Extrait Kbis ou avis INSEE',
        description: 'Extrait Kbis récent ou avis de situation INSEE pour identifier les secteurs d\'activité',
        category: 'G',
        linkedIndicators: ['B1.4'],
        fileTypes: ['pdf'],
        mandatory: true,
      },
      // B3 — Énergie
      {
        id: 'factures-energie-12m',
        label: 'Factures d\'énergie (12 mois)',
        description: 'Factures électricité, gaz, fioul sur 12 mois glissants (EDF, Engie, etc.)',
        category: 'E',
        linkedIndicators: ['B3.1', 'B3.2'],
        fileTypes: ['pdf', 'excel'],
        mandatory: true,
      },
      {
        id: 'attestation-energie-verte',
        label: 'Attestation énergie verte',
        description: 'Attestation contrat énergie verte ou certificats de garantie d\'origine',
        category: 'E',
        linkedIndicators: ['B3.2'],
        fileTypes: ['pdf'],
        mandatory: false,
      },
      // B4 — Eau
      {
        id: 'factures-eau-12m',
        label: 'Factures d\'eau (12 mois)',
        description: 'Factures eau (12 mois) ou relevé de compteurs certifié',
        category: 'E',
        linkedIndicators: ['B4.1'],
        fileTypes: ['pdf', 'excel'],
        mandatory: true,
      },
      // B5 — Déchets
      {
        id: 'bsd-dechets',
        label: 'Bordereaux de suivi déchets (BSD)',
        description: 'BSD annuels ou relevé prestataire de collecte des déchets non dangereux',
        category: 'E',
        linkedIndicators: ['B5.1'],
        fileTypes: ['pdf', 'excel'],
        mandatory: true,
      },
      {
        id: 'bsdd-dangereux',
        label: 'BSD déchets dangereux (BSDD)',
        description: 'BSDD ou certificat prestataire agréé pour les déchets dangereux',
        category: 'E',
        linkedIndicators: ['B5.2'],
        fileTypes: ['pdf'],
        mandatory: true,
      },
      // B7 — GES
      {
        id: 'factures-carburant-flotte',
        label: 'Factures carburant + registre flotte',
        description: 'Factures carburant (12 mois) + registre de la flotte de véhicules (Scope 1)',
        category: 'E',
        linkedIndicators: ['B7.1'],
        fileTypes: ['pdf', 'excel'],
        mandatory: true,
      },
      {
        id: 'factures-elec-ges',
        label: 'Factures électricité (GES Scope 2)',
        description: 'Factures électricité + attestation contrat ou marché énergie pour calcul Scope 2',
        category: 'E',
        linkedIndicators: ['B7.2'],
        fileTypes: ['pdf'],
        mandatory: true,
      },
      // B8 — Main d'œuvre
      {
        id: 'index-egalite-pro',
        label: 'Index égalité professionnelle',
        description: 'Index égalité professionnelle (obligatoire ≥ 50 salariés) ou bilan social genré',
        category: 'S',
        linkedIndicators: ['B8.2', 'B8.3'],
        fileTypes: ['pdf'],
        mandatory: true,
      },
      {
        id: 'registre-accidents',
        label: 'Registre accidents du travail',
        description: 'Registre AT, déclaration CPAM et/ou DUERP à jour',
        category: 'S',
        linkedIndicators: ['B8.6'],
        fileTypes: ['pdf', 'excel'],
        mandatory: true,
      },
      // B10 — Diversité gouvernance
      {
        id: 'organigramme-direction',
        label: 'Organigramme direction / CA',
        description: 'Organigramme direction + PV de nomination CA ou conseil de surveillance',
        category: 'G',
        linkedIndicators: ['B10.1'],
        fileTypes: ['pdf', 'word'],
        mandatory: true,
      },
      // B11 — Éthique
      {
        id: 'code-ethique',
        label: 'Code éthique / Charte anti-corruption',
        description: 'Code éthique, charte ou procédure anti-corruption (loi Sapin II si applicable)',
        category: 'G',
        linkedIndicators: ['B11.1'],
        fileTypes: ['pdf', 'word'],
        mandatory: true,
      },
      {
        id: 'registre-incidents',
        label: 'Registre incidents éthiques',
        description: 'Registre incidents ou attestation sur l\'honneur zéro incident',
        category: 'G',
        linkedIndicators: ['B11.2'],
        fileTypes: ['pdf'],
        mandatory: false,
      },
    ],
    regulatory: true,
    audience: ['PME', 'ETI'],
    tags: ['VSME', 'EFRAG', 'Durabilité', 'ESG'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. Bilan Carbone® Complet
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'bilan-carbone-complet',
    name: 'Bilan Carbone® Complet',
    category: 'Environnement',
    description: 'Calcul exhaustif des émissions carbone : directes, électricité et chaîne de valeur',
    icon: '🌍',
    difficulty: 'Avancé',
    estimatedDuration: '15-25 heures',
    templatesRequired: ['emissions-scope1', 'emissions-scope2', 'emissions-scope3', 'consommation-energie'],
    templatesOptional: ['dechets', 'consommation-eau'],
    indicators: ['B3','B7'],
    requiredEvidence: [
      {
        id: 'factures-carburant-bc',
        label: 'Factures carburant flotte (Scope 1)',
        description: 'Factures carburant véhicules + registre flotte (12 mois)',
        category: 'E',
        linkedIndicators: ['B7.1'],
        fileTypes: ['pdf', 'excel'],
        mandatory: true,
      },
      {
        id: 'factures-gaz-chauffage',
        label: 'Factures gaz / chauffage (Scope 1)',
        description: 'Factures gaz naturel, fioul, propane pour chauffage et process industriel',
        category: 'E',
        linkedIndicators: ['B7.1', 'B3.1'],
        fileTypes: ['pdf', 'excel'],
        mandatory: true,
      },
      {
        id: 'factures-electricite-bc',
        label: 'Factures électricité (Scope 2)',
        description: 'Factures électricité tous sites (12 mois) + attestation fournisseur',
        category: 'E',
        linkedIndicators: ['B7.2', 'B3.1'],
        fileTypes: ['pdf', 'excel'],
        mandatory: true,
      },
      {
        id: 'donnees-deplacements',
        label: 'Données déplacements professionnels (Scope 3)',
        description: 'Billets avion/train, notes de frais kilométriques, relevés transport',
        category: 'E',
        linkedIndicators: ['B7.3'],
        fileTypes: ['pdf', 'excel'],
        mandatory: true,
      },
      {
        id: 'donnees-fret-transport',
        label: 'Données fret & transport marchandises (Scope 3)',
        description: 'Factures transporteurs, données logistiques, tonnages expédiés',
        category: 'E',
        linkedIndicators: ['B7.3'],
        fileTypes: ['pdf', 'excel'],
        mandatory: true,
      },
      {
        id: 'factures-achats-scope3',
        label: 'Factures achats majeurs (Scope 3)',
        description: 'Factures fournisseurs principaux pour calcul des émissions amont',
        category: 'E',
        linkedIndicators: ['B7.3'],
        fileTypes: ['pdf', 'excel'],
        mandatory: false,
      },
    ],
    regulatory: false,
    audience: ['PME', 'ETI', 'Grande Entreprise'],
    tags: ['GES', 'Climat', 'Carbone'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. Diagnostic Énergétique
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'diagnostic-energie',
    name: 'Diagnostic Énergétique',
    category: 'Environnement',
    description: 'Analyse des consommations énergétiques par site',
    icon: '⚡',
    difficulty: 'Débutant',
    estimatedDuration: '3-5 heures',
    templatesRequired: ['consommation-energie'],
    templatesOptional: ['emissions-scope2'],
    indicators: ['B3'],
    requiredEvidence: [
      {
        id: 'factures-elec-de',
        label: 'Factures électricité (12 mois)',
        description: 'Factures électricité complètes sur 12 mois pour tous les sites',
        category: 'E',
        linkedIndicators: ['B3.1', 'B3.2'],
        fileTypes: ['pdf', 'excel'],
        mandatory: true,
      },
      {
        id: 'factures-gaz-de',
        label: 'Factures gaz naturel (12 mois)',
        description: 'Factures gaz naturel sur 12 mois (si applicable)',
        category: 'E',
        linkedIndicators: ['B3.1'],
        fileTypes: ['pdf', 'excel'],
        mandatory: true,
      },
      {
        id: 'contrat-energie-verte-de',
        label: 'Contrat énergie renouvelable',
        description: 'Attestation de contrat énergie verte ou certificats de garantie d\'origine',
        category: 'E',
        linkedIndicators: ['B3.2'],
        fileTypes: ['pdf'],
        mandatory: false,
      },
    ],
    regulatory: false,
    audience: ['PME', 'ETI', 'Grande Entreprise'],
    tags: ['Énergie', 'Efficacité'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. Gestion des Déchets
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'gestion-dechets',
    name: 'Gestion des Déchets',
    category: 'Environnement',
    description: 'Suivi production et valorisation des déchets',
    icon: '♻️',
    difficulty: 'Débutant',
    estimatedDuration: '2-4 heures',
    templatesRequired: ['dechets'],
    templatesOptional: [],
    indicators: ['B5'],
    requiredEvidence: [
      {
        id: 'bsd-annuel',
        label: 'Bordereaux de suivi déchets (BSD)',
        description: 'BSD annuels ou attestation prestataire collecte déchets non dangereux',
        category: 'E',
        linkedIndicators: ['B5.1'],
        fileTypes: ['pdf', 'excel'],
        mandatory: true,
      },
      {
        id: 'bsdd-annuel',
        label: 'BSDD déchets dangereux',
        description: 'Bordereaux de suivi des déchets dangereux ou certificat prestataire agréé',
        category: 'E',
        linkedIndicators: ['B5.2'],
        fileTypes: ['pdf'],
        mandatory: true,
      },
      {
        id: 'attestation-valorisation',
        label: 'Attestation de valorisation',
        description: 'Certificat de valorisation / recyclage du prestataire déchets',
        category: 'E',
        linkedIndicators: ['B5.3'],
        fileTypes: ['pdf'],
        mandatory: false,
      },
    ],
    regulatory: false,
    audience: ['PME', 'ETI', 'Grande Entreprise'],
    tags: ['Déchets', 'Économie circulaire'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. Diagnostic Social Complet
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'diagnostic-social',
    name: 'Diagnostic Social Complet',
    category: 'Social',
    description: 'Évaluation effectifs, formation, santé-sécurité',
    icon: '👥',
    difficulty: 'Intermédiaire',
    estimatedDuration: '8-12 heures',
    templatesRequired: ['effectifs', 'formation', 'sante-securite'],
    templatesOptional: ['remuneration'],
    indicators: ['B8','B9'],
    requiredEvidence: [
      {
        id: 'dsn-bilan-social-ds',
        label: 'DSN / Bilan social annuel',
        description: 'Déclaration sociale nominative annuelle ou bilan social avec effectifs',
        category: 'S',
        linkedIndicators: ['B8.1', 'B8.2'],
        fileTypes: ['pdf', 'excel'],
        mandatory: true,
      },
      {
        id: 'plan-formation',
        label: 'Plan de formation annuel',
        description: 'Plan de développement des compétences + bilan heures de formation',
        category: 'S',
        linkedIndicators: ['B8.5'],
        fileTypes: ['pdf', 'excel'],
        mandatory: true,
      },
      {
        id: 'duerp',
        label: 'DUERP à jour',
        description: 'Document Unique d\'Évaluation des Risques Professionnels (mise à jour annuelle)',
        category: 'S',
        linkedIndicators: ['B8.6'],
        fileTypes: ['pdf', 'word'],
        mandatory: true,
      },
      {
        id: 'registre-at-ds',
        label: 'Registre accidents du travail',
        description: 'Registre des accidents du travail et déclarations CPAM de l\'année',
        category: 'S',
        linkedIndicators: ['B8.6'],
        fileTypes: ['pdf', 'excel'],
        mandatory: true,
      },
      {
        id: 'index-egalite-ds',
        label: 'Index égalité femmes-hommes',
        description: 'Index égalité professionnelle publié (obligatoire ≥ 50 salariés)',
        category: 'S',
        linkedIndicators: ['B8.3'],
        fileTypes: ['pdf'],
        mandatory: true,
      },
    ],
    regulatory: false,
    audience: ['PME', 'ETI', 'Grande Entreprise'],
    tags: ['RH', 'Social', 'QVT'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. Santé et Sécurité
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'sante-securite-travail',
    name: 'Santé et Sécurité',
    category: 'Social',
    description: 'Accidents, maladies pro, prévention',
    icon: '🛡️',
    difficulty: 'Intermédiaire',
    estimatedDuration: '4-6 heures',
    templatesRequired: ['sante-securite'],
    templatesOptional: ['effectifs'],
    indicators: ['B8'],
    requiredEvidence: [
      {
        id: 'duerp-sst',
        label: 'DUERP à jour',
        description: 'Document Unique d\'Évaluation des Risques Professionnels',
        category: 'S',
        linkedIndicators: ['B8.6'],
        fileTypes: ['pdf', 'word'],
        mandatory: true,
      },
      {
        id: 'registre-at-sst',
        label: 'Registre des accidents du travail',
        description: 'Registre AT + déclarations CPAM + analyse des causes',
        category: 'S',
        linkedIndicators: ['B8.6'],
        fileTypes: ['pdf', 'excel'],
        mandatory: true,
      },
      {
        id: 'pv-cssct',
        label: 'PV CSSCT ou réunion sécurité',
        description: 'Procès-verbaux des réunions CSSCT ou commission sécurité',
        category: 'S',
        linkedIndicators: ['B8.6'],
        fileTypes: ['pdf', 'word'],
        mandatory: false,
      },
    ],
    regulatory: false,
    audience: ['PME', 'ETI', 'Grande Entreprise'],
    tags: ['SST', 'Prévention'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. Gouvernance & Conformité
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'diagnostic-gouvernance',
    name: 'Gouvernance & Conformité',
    category: 'Gouvernance',
    description: 'Structure gouvernance, éthique, risques ESG',
    icon: '⚖️',
    difficulty: 'Avancé',
    estimatedDuration: '10-15 heures',
    templatesRequired: ['structure-gouvernance', 'ethique-conformite', 'risques-esg'],
    templatesOptional: ['chaine-valeur'],
    indicators: ['B2','B10','B11'],
    requiredEvidence: [
      {
        id: 'organigramme-gov',
        label: 'Organigramme direction / CA',
        description: 'Organigramme de la direction + PV de nomination au CA ou conseil de surveillance',
        category: 'G',
        linkedIndicators: ['B10.1'],
        fileTypes: ['pdf', 'word'],
        mandatory: true,
      },
      {
        id: 'code-ethique-gov',
        label: 'Code éthique / Charte anti-corruption',
        description: 'Code éthique, charte anti-corruption ou procédure de conformité Sapin II',
        category: 'G',
        linkedIndicators: ['B11.1'],
        fileTypes: ['pdf', 'word'],
        mandatory: true,
      },
      {
        id: 'registre-incidents-gov',
        label: 'Registre incidents éthiques',
        description: 'Registre des incidents ou attestation sur l\'honneur zéro incident éthique',
        category: 'G',
        linkedIndicators: ['B11.2'],
        fileTypes: ['pdf'],
        mandatory: true,
      },
      {
        id: 'cartographie-risques',
        label: 'Cartographie des risques ESG',
        description: 'Matrice de matérialité ou cartographie des risques ESG identifiés',
        category: 'G',
        linkedIndicators: [],
        fileTypes: ['pdf', 'excel'],
        mandatory: false,
      },
    ],
    regulatory: false,
    audience: ['ETI', 'Grande Entreprise'],
    tags: ['Gouvernance', 'Compliance'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. Diagnostic ESG PME
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'diagnostic-esg-pme',
    name: 'Diagnostic ESG PME',
    category: 'Transverse',
    description: 'Évaluation ESG simplifiée adaptée PME',
    icon: '📊',
    difficulty: 'Débutant',
    estimatedDuration: '6-10 heures',
    templatesRequired: ['consommation-energie', 'effectifs', 'strategie-esg'],
    templatesOptional: ['emissions-scope1', 'dechets'],
    indicators: ['B1','B2','B3','B7','B8','B9'],
    requiredEvidence: [
      {
        id: 'factures-energie-pme',
        label: 'Factures d\'énergie (12 mois)',
        description: 'Factures électricité et gaz sur 12 mois glissants',
        category: 'E',
        linkedIndicators: ['B3.1'],
        fileTypes: ['pdf', 'excel'],
        mandatory: true,
      },
      {
        id: 'effectifs-pme',
        label: 'Registre du personnel / DSN',
        description: 'Registre unique du personnel ou DSN récapitulatif annuel',
        category: 'S',
        linkedIndicators: ['B8.1'],
        fileTypes: ['pdf', 'excel'],
        mandatory: true,
      },
      {
        id: 'liasse-fiscale-pme',
        label: 'Liasse fiscale / Bilan',
        description: 'Liasse fiscale ou bilan comptable pour le chiffre d\'affaires et total bilan',
        category: 'G',
        linkedIndicators: ['B1.2', 'B1.3'],
        fileTypes: ['pdf'],
        mandatory: true,
      },
    ],
    regulatory: false,
    audience: ['PME'],
    tags: ['ESG', 'PME', 'Diagnostic'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. CSRD E1 - Changement Climatique
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'csrd-e1-climat',
    name: 'CSRD E1 - Changement Climatique',
    category: 'Réglementaire',
    description: 'Reporting ESRS E1 complet',
    icon: '🌡️',
    difficulty: 'Avancé',
    estimatedDuration: '20-30 heures',
    templatesRequired: ['emissions-scope1', 'emissions-scope2', 'emissions-scope3', 'consommation-energie'],
    templatesOptional: ['risques-esg'],
    indicators: ['B3','B7'],
    requiredEvidence: [
      {
        id: 'factures-energie-csrd',
        label: 'Factures énergie complètes',
        description: 'Factures électricité, gaz, fioul, vapeur sur 12 mois pour tous les sites',
        category: 'E',
        linkedIndicators: ['B3.1', 'B3.2'],
        fileTypes: ['pdf', 'excel'],
        mandatory: true,
      },
      {
        id: 'factures-carburant-csrd',
        label: 'Factures carburant flotte (Scope 1)',
        description: 'Factures carburant + registre flotte véhicules avec kilométrage',
        category: 'E',
        linkedIndicators: ['B7.1'],
        fileTypes: ['pdf', 'excel'],
        mandatory: true,
      },
      {
        id: 'factures-elec-csrd',
        label: 'Factures électricité (Scope 2)',
        description: 'Factures électricité + attestation fournisseur pour Scope 2 market-based',
        category: 'E',
        linkedIndicators: ['B7.2'],
        fileTypes: ['pdf'],
        mandatory: true,
      },
      {
        id: 'donnees-scope3-csrd',
        label: 'Données Scope 3 (déplacements, fret, achats)',
        description: 'Notes de frais déplacements, factures transport, données achats fournisseurs',
        category: 'E',
        linkedIndicators: ['B7.3'],
        fileTypes: ['pdf', 'excel'],
        mandatory: true,
      },
      {
        id: 'plan-transition-csrd',
        label: 'Plan de transition climatique',
        description: 'Plan de transition / stratégie climat avec objectifs de réduction (si existant)',
        category: 'E',
        linkedIndicators: [],
        fileTypes: ['pdf', 'word'],
        mandatory: false,
      },
    ],
    regulatory: true,
    audience: ['Grande Entreprise'],
    tags: ['CSRD', 'ESRS', 'E1'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. CSRD S1 - Personnel
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'csrd-s1-personnel',
    name: 'CSRD S1 - Personnel',
    category: 'Réglementaire',
    description: 'Reporting ESRS S1 complet',
    icon: '👨‍💼',
    difficulty: 'Avancé',
    estimatedDuration: '15-25 heures',
    templatesRequired: ['effectifs', 'formation', 'sante-securite'],
    templatesOptional: [],
    indicators: ['B8','B9'],
    requiredEvidence: [
      {
        id: 'dsn-csrd-s1',
        label: 'DSN / Bilan social annuel',
        description: 'Déclaration sociale nominative ou bilan social avec ventilation par catégorie',
        category: 'S',
        linkedIndicators: ['B8.1', 'B8.2'],
        fileTypes: ['pdf', 'excel'],
        mandatory: true,
      },
      {
        id: 'plan-formation-csrd',
        label: 'Plan de formation',
        description: 'Plan de développement des compétences + bilan heures de formation par catégorie',
        category: 'S',
        linkedIndicators: ['B8.5'],
        fileTypes: ['pdf', 'excel'],
        mandatory: true,
      },
      {
        id: 'duerp-csrd',
        label: 'DUERP + registre AT',
        description: 'Document Unique d\'Évaluation des Risques + registre accidents du travail',
        category: 'S',
        linkedIndicators: ['B8.6'],
        fileTypes: ['pdf'],
        mandatory: true,
      },
      {
        id: 'index-egalite-csrd',
        label: 'Index égalité professionnelle',
        description: 'Index égalité femmes-hommes publié + écart de rémunération par catégorie',
        category: 'S',
        linkedIndicators: ['B8.3'],
        fileTypes: ['pdf'],
        mandatory: true,
      },
      {
        id: 'politique-rh-csrd',
        label: 'Politique RH / Convention collective',
        description: 'Politique RH, accords d\'entreprise, convention collective applicable',
        category: 'S',
        linkedIndicators: [],
        fileTypes: ['pdf', 'word'],
        mandatory: false,
      },
    ],
    regulatory: true,
    audience: ['Grande Entreprise'],
    tags: ['CSRD', 'ESRS', 'S1'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. Questionnaire ESG Bancaire
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'questionnaire-banque',
    name: 'Questionnaire ESG Bancaire',
    category: 'Réglementaire',
    description: 'Données ESG pour banques/investisseurs',
    icon: '🏦',
    difficulty: 'Intermédiaire',
    estimatedDuration: '6-10 heures',
    templatesRequired: ['strategie-esg', 'structure-gouvernance', 'emissions-scope1'],
    templatesOptional: ['effectifs'],
    indicators: ['B1','B2','B3','B7','B10','B11'],
    requiredEvidence: [
      {
        id: 'liasse-fiscale-banque',
        label: 'Liasse fiscale certifiée',
        description: 'Liasse fiscale ou bilan comptable certifié par CAC (CA + total bilan)',
        category: 'G',
        linkedIndicators: ['B1.2', 'B1.3'],
        fileTypes: ['pdf'],
        mandatory: true,
      },
      {
        id: 'factures-energie-banque',
        label: 'Factures énergie / carburant',
        description: 'Factures énergie 12 mois pour calcul empreinte carbone Scope 1 & 2',
        category: 'E',
        linkedIndicators: ['B3.1', 'B7.1', 'B7.2'],
        fileTypes: ['pdf', 'excel'],
        mandatory: true,
      },
      {
        id: 'strategie-esg-banque',
        label: 'Document stratégie ESG',
        description: 'Note de stratégie ESG, politique RSE ou rapport de durabilité existant',
        category: 'G',
        linkedIndicators: [],
        fileTypes: ['pdf', 'word'],
        mandatory: true,
      },
      {
        id: 'kbis-banque',
        label: 'Extrait Kbis récent',
        description: 'Extrait Kbis de moins de 3 mois',
        category: 'G',
        linkedIndicators: ['B1.4'],
        fileTypes: ['pdf'],
        mandatory: true,
      },
    ],
    regulatory: false,
    audience: ['PME', 'ETI', 'Grande Entreprise'],
    tags: ['Finance', 'Banque'],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getWorkflowById(id: string) {
  return WORKFLOW_LIBRARY.find(w => w.id === id);
}

export function getWorkflowsByCategory(category: WorkflowCategory) {
  return WORKFLOW_LIBRARY.filter(w => w.category === category);
}

export function getWorkflowTemplateCount(workflow: WorkflowDefinition) {
  return {
    required: workflow.templatesRequired.length,
    optional: workflow.templatesOptional.length,
    total: workflow.templatesRequired.length + workflow.templatesOptional.length,
  };
}

export function getWorkflowEvidenceCount(workflow: WorkflowDefinition) {
  const evidence = workflow.requiredEvidence ?? [];
  const mandatory = evidence.filter(e => e.mandatory).length;
  const optional = evidence.filter(e => !e.mandatory).length;
  return { mandatory, optional, total: evidence.length };
}

// ─── 🆕 Helpers pour indépendance workflow → indicateurs ────────────────────

/**
 * Retourne les IDs de section VSME associés à un workflow (ex: ["B3","B7"])
 */
export function getSectionsForWorkflow(workflowId: string): string[] {
  const workflow = getWorkflowById(workflowId);
  return workflow?.indicators ?? [];
}

/**
 * Retourne les codes indicateurs détaillés pour un workflow
 * en résolvant les sections depuis MODULE_B (vsme-data.ts)
 */
export function getIndicatorCodesForWorkflow(workflowId: string): string[] {
  const sections = getSectionsForWorkflow(workflowId);
  if (sections.length === 0) return [];

  return MODULE_B
    .filter(section => sections.includes(section.id))
    .flatMap(section => section.datapoints.map(dp => dp.code));
}

/**
 * Vérifie si un code indicateur appartient à un workflow donné
 */
export function isIndicatorInWorkflow(workflowId: string, indicatorCode: string): boolean {
  const sections = getSectionsForWorkflow(workflowId);
  if (sections.length === 0) return true; // Pas de filtre = tout visible
  // Le code B3.1 appartient à la section B3
  const sectionId = indicatorCode.replace(/\.\d+$/, '');
  return sections.includes(sectionId);
}
