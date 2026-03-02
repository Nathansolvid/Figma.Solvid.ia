/**
 * EXCEL TEMPLATES GENERATOR
 * Génération de templates Excel téléchargeables pour la collecte de données ESG
 */

import * as XLSX from 'xlsx';

export interface TemplateColumn {
  header: string;
  key: string;
  width?: number;
  example?: string;
}

export interface TemplateConfig {
  templateName: string;
  category: 'E' | 'S' | 'G';
  instructions: string;
  columns: TemplateColumn[];
  sampleData?: any[];
}

/**
 * Générer et télécharger un template Excel
 */
export function downloadExcelTemplate(config: TemplateConfig): void {
  // Créer un nouveau workbook
  const wb = XLSX.utils.book_new();

  // === Feuille 1 : Instructions ===
  const instructionsData = [
    ['TEMPLATE SOLVID.IA - Collecte de données ESG'],
    [''],
    ['Nom du template:', config.templateName],
    ['Catégorie:', config.category === 'E' ? 'Environnement' : config.category === 'S' ? 'Social' : 'Gouvernance'],
    ['Date de génération:', new Date().toLocaleDateString('fr-FR')],
    [''],
    ['INSTRUCTIONS:'],
    [config.instructions],
    [''],
    ['IMPORTANT:'],
    ['- Ne modifiez pas les en-têtes de colonnes'],
    ['- Respectez les formats indiqués'],
    ['- Les colonnes marquées (*) sont obligatoires'],
    ['- Supprimez les lignes d\'exemple avant l\'import'],
    [''],
    ['AIDE:'],
    ['Pour toute question, contactez support@solvid.ia'],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  
  // Styling basique (largeurs)
  wsInstructions['!cols'] = [
    { wch: 25 },
    { wch: 60 },
  ];

  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  // === Feuille 2 : Données ===
  const headers = config.columns.map(col => col.header);
  const examples = config.columns.map(col => col.example || '');

  const dataRows = [
    headers,
    examples, // Ligne d'exemple
    ...(config.sampleData || []), // Données d'exemple additionnelles
  ];

  const wsData = XLSX.utils.aoa_to_sheet(dataRows);

  // Définir les largeurs de colonnes
  wsData['!cols'] = config.columns.map(col => ({ wch: col.width || 20 }));

  XLSX.utils.book_append_sheet(wb, wsData, 'Données');

  // Télécharger le fichier
  const fileName = `Template_${config.templateName.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Templates prédéfinis par catégorie
 */

export const TEMPLATE_ENERGIE: TemplateConfig = {
  templateName: 'Consommations Énergétiques',
  category: 'E',
  instructions: 'Renseignez vos consommations d\'énergie par source (électricité, gaz, fioul) pour la période concernée. Les données doivent provenir de vos factures énergétiques.',
  columns: [
    { header: 'Type d\'énergie *', key: 'energyType', width: 25, example: 'Électricité' },
    { header: 'Période *', key: 'period', width: 15, example: '2025' },
    { header: 'Consommation (kWh) *', key: 'consumption', width: 20, example: '125000' },
    { header: 'Source de données', key: 'source', width: 30, example: 'Facture EDF Q4 2025' },
    { header: 'Commentaire', key: 'comment', width: 40, example: 'Inclut tous les sites' },
  ],
  sampleData: [
    ['Gaz naturel', '2025', '85000', 'Facture ENGIE 2025', 'Site principal uniquement'],
    ['Fioul domestique', '2025', '12000', 'Bon de livraison 2025', ''],
  ],
};

export const TEMPLATE_GES: TemplateConfig = {
  templateName: 'Émissions GES',
  category: 'E',
  instructions: 'Renseignez vos émissions de gaz à effet de serre par scope (1, 2, 3). Utilisez les facteurs d\'émission de l\'ADEME ou votre méthodologie propre.',
  columns: [
    { header: 'Scope *', key: 'scope', width: 15, example: 'Scope 1' },
    { header: 'Catégorie', key: 'category', width: 30, example: 'Combustion de gaz naturel' },
    { header: 'Période *', key: 'period', width: 15, example: '2025' },
    { header: 'Émissions (tCO2e) *', key: 'emissions', width: 20, example: '1245.5' },
    { header: 'Méthodologie', key: 'methodology', width: 40, example: 'Base Carbone ADEME v23' },
    { header: 'Source de données', key: 'source', width: 30, example: 'Calcul interne' },
  ],
  sampleData: [
    ['Scope 2', 'Électricité réseau', '2025', '830.2', 'Facteur réseau RTE 2025', 'Factures EDF'],
    ['Scope 3', 'Achats de biens', '2025', '4560.0', 'Estimation basée CA', 'Comptabilité'],
  ],
};

export const TEMPLATE_EAU: TemplateConfig = {
  templateName: 'Consommation d\'Eau',
  category: 'E',
  instructions: 'Renseignez vos consommations d\'eau par site ou par usage. Les données doivent provenir de vos factures d\'eau ou de vos relevés de compteurs.',
  columns: [
    { header: 'Site / Usage *', key: 'site', width: 30, example: 'Site Paris - Bureaux' },
    { header: 'Période *', key: 'period', width: 15, example: '2025' },
    { header: 'Consommation (m³) *', key: 'consumption', width: 20, example: '12450' },
    { header: 'Source de données', key: 'source', width: 30, example: 'Facture Veolia 2025' },
    { header: 'Commentaire', key: 'comment', width: 40, example: '' },
  ],
};

export const TEMPLATE_DECHETS: TemplateConfig = {
  templateName: 'Production de Déchets',
  category: 'E',
  instructions: 'Renseignez vos quantités de déchets produits par type et mode de traitement (recyclage, valorisation, enfouissement).',
  columns: [
    { header: 'Type de déchet *', key: 'wasteType', width: 25, example: 'DIB (non dangereux)' },
    { header: 'Mode de traitement *', key: 'treatment', width: 25, example: 'Recyclage' },
    { header: 'Période *', key: 'period', width: 15, example: '2025' },
    { header: 'Quantité (tonnes) *', key: 'quantity', width: 20, example: '3.2' },
    { header: 'Prestataire', key: 'provider', width: 30, example: 'Veolia Propreté' },
  ],
  sampleData: [
    ['Papier/Carton', 'Recyclage', '2025', '1.8', 'Paprec'],
    ['DIB (non dangereux)', 'Enfouissement', '2025', '1.4', 'Veolia Propreté'],
  ],
};

export const TEMPLATE_EFFECTIFS: TemplateConfig = {
  templateName: 'Effectifs et Données RH',
  category: 'S',
  instructions: 'Renseignez vos effectifs par catégorie et les principaux indicateurs RH (turnover, formation, etc.).',
  columns: [
    { header: 'Catégorie *', key: 'category', width: 25, example: 'Cadres' },
    { header: 'Période *', key: 'period', width: 15, example: '2025' },
    { header: 'Effectif total *', key: 'headcount', width: 20, example: '187' },
    { header: 'Dont femmes', key: 'women', width: 15, example: '84' },
    { header: 'Dont CDI', key: 'permanent', width: 15, example: '165' },
    { header: 'Commentaire', key: 'comment', width: 40, example: '' },
  ],
  sampleData: [
    ['Employés', '2025', '78', '42', '70', ''],
    ['Managers', '2025', '24', '12', '24', ''],
  ],
};

export const TEMPLATE_FORMATION: TemplateConfig = {
  templateName: 'Formation et Développement',
  category: 'S',
  instructions: 'Renseignez les heures de formation dispensées par thématique et catégorie de personnel.',
  columns: [
    { header: 'Thématique *', key: 'topic', width: 30, example: 'Sécurité au travail' },
    { header: 'Catégorie personnel', key: 'category', width: 20, example: 'Tous' },
    { header: 'Période *', key: 'period', width: 15, example: '2025' },
    { header: 'Heures totales *', key: 'hours', width: 20, example: '245' },
    { header: 'Nombre de participants', key: 'participants', width: 20, example: '187' },
  ],
};

export const TEMPLATE_GOUVERNANCE: TemplateConfig = {
  templateName: 'Gouvernance et Conformité',
  category: 'G',
  instructions: 'Renseignez les indicateurs de gouvernance : composition du conseil, comités, formations éthique, etc.',
  columns: [
    { header: 'Indicateur *', key: 'indicator', width: 40, example: 'Nombre de réunions du conseil' },
    { header: 'Période *', key: 'period', width: 15, example: '2025' },
    { header: 'Valeur *', key: 'value', width: 15, example: '12' },
    { header: 'Unité', key: 'unit', width: 15, example: 'réunions' },
    { header: 'Commentaire', key: 'comment', width: 40, example: '' },
  ],
  sampleData: [
    ['% de femmes au conseil', '2025', '42', '%', 'Sur 12 membres'],
    ['Formation éthique dispensées', '2025', '24', 'sessions', ''],
  ],
};

/**
 * Obtenir tous les templates disponibles
 */
export function getAllTemplates(): TemplateConfig[] {
  return [
    TEMPLATE_ENERGIE,
    TEMPLATE_GES,
    TEMPLATE_EAU,
    TEMPLATE_DECHETS,
    TEMPLATE_EFFECTIFS,
    TEMPLATE_FORMATION,
    TEMPLATE_GOUVERNANCE,
  ];
}

/**
 * Obtenir un template par son nom exact
 */
export function getTemplateByName(name: string): TemplateConfig | undefined {
  const templates: { [key: string]: TemplateConfig } = {
    // Noms exacts des templates existants
    'Consommations Énergétiques': TEMPLATE_ENERGIE,
    'Consommation d\'Énergie': TEMPLATE_ENERGIE,
    'Émissions GES': TEMPLATE_GES,
    'Émissions GES Scope 1 - Combustibles': TEMPLATE_GES,
    'Émissions GES Scope 2 - Électricité': TEMPLATE_GES,
    'Émissions GES Scope 3 - Achats': TEMPLATE_GES,
    'Consommation d\'Eau': TEMPLATE_EAU,
    'Production de Déchets': TEMPLATE_DECHETS,
    'Effectifs et Données RH': TEMPLATE_EFFECTIFS,
    'Formation et Développement': TEMPLATE_FORMATION,
    'Gouvernance et Conformité': TEMPLATE_GOUVERNANCE,
    'Plan d\'Actions ESG': TEMPLATE_GOUVERNANCE, // Fallback vers gouvernance
  };
  
  return templates[name];
}

/**
 * Obtenir le template approprié selon la catégorie
 */
export function getTemplateByCategory(category: 'E' | 'S' | 'G', subCategory?: string): TemplateConfig {
  if (category === 'E') {
    if (subCategory?.toLowerCase().includes('énergie')) return TEMPLATE_ENERGIE;
    if (subCategory?.toLowerCase().includes('ges') || subCategory?.toLowerCase().includes('émission')) return TEMPLATE_GES;
    if (subCategory?.toLowerCase().includes('eau')) return TEMPLATE_EAU;
    if (subCategory?.toLowerCase().includes('déchet')) return TEMPLATE_DECHETS;
    return TEMPLATE_ENERGIE; // Défaut E
  }
  
  if (category === 'S') {
    if (subCategory?.toLowerCase().includes('formation')) return TEMPLATE_FORMATION;
    return TEMPLATE_EFFECTIFS; // Défaut S
  }
  
  return TEMPLATE_GOUVERNANCE; // Défaut G
}