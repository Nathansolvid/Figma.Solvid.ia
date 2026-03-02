/**
 * 📚 BIBLIOTHÈQUE DE WORKFLOWS - VERSION OPTIMISÉE
 * Workflows essentiels pour éviter surcharge du bundle
 */

export type WorkflowCategory = 'Environnement' | 'Social' | 'Gouvernance' | 'Transverse' | 'Réglementaire';

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
  regulatory: boolean;
  audience: string[];
  tags: string[];
}

export const WORKFLOW_LIBRARY: WorkflowDefinition[] = [
  {
    id: 'bilan-carbone-complet',
    name: 'Bilan Carbone® Complet',
    category: 'Environnement',
    description: 'Calcul exhaustif des émissions GES sur les 3 scopes',
    icon: '🌍',
    difficulty: 'Avancé',
    estimatedDuration: '15-25 heures',
    templatesRequired: ['emissions-scope1', 'emissions-scope2', 'emissions-scope3', 'consommation-energie'],
    templatesOptional: ['dechets', 'consommation-eau'],
    regulatory: false,
    audience: ['PME', 'ETI', 'Grande Entreprise'],
    tags: ['GES', 'Climat', 'Carbone'],
  },
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
    regulatory: false,
    audience: ['PME', 'ETI', 'Grande Entreprise'],
    tags: ['Énergie', 'Efficacité'],
  },
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
    regulatory: false,
    audience: ['PME', 'ETI', 'Grande Entreprise'],
    tags: ['Déchets', 'Économie circulaire'],
  },
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
    regulatory: false,
    audience: ['PME', 'ETI', 'Grande Entreprise'],
    tags: ['RH', 'Social', 'QVT'],
  },
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
    regulatory: false,
    audience: ['PME', 'ETI', 'Grande Entreprise'],
    tags: ['SST', 'Prévention'],
  },
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
    regulatory: false,
    audience: ['ETI', 'Grande Entreprise'],
    tags: ['Gouvernance', 'Compliance'],
  },
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
    regulatory: false,
    audience: ['PME'],
    tags: ['ESG', 'PME', 'Diagnostic'],
  },
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
    regulatory: true,
    audience: ['Grande Entreprise'],
    tags: ['CSRD', 'ESRS', 'E1'],
  },
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
    regulatory: true,
    audience: ['Grande Entreprise'],
    tags: ['CSRD', 'ESRS', 'S1'],
  },
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
    regulatory: false,
    audience: ['PME', 'ETI', 'Grande Entreprise'],
    tags: ['Finance', 'Banque'],
  },
];

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
