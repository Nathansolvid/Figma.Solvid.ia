// Configuration des 4 Packs V1 selon spécifications "Option A"

import { PackTemplate, PackType } from "@/types/packs";

export const PACK_TEMPLATES: Record<PackType, PackTemplate> = {
  "donneur-ordre": {
    id: "donneur-ordre",
    name: "Pack Donneur d'Ordre",
    description: "Réponse aux demandes d'un grand groupe soumis à la CSRD. Focus indicateurs E/S/G clés + preuves documentaires.",
    icon: "🏢",
    color: "bg-blue-600",
    targetSegment: "Fournisseurs de grands groupes CSRD",
    estimatedDuration: "2-3 semaines",
    checklistItems: [
      // ENVIRONNEMENT (E)
      {
        id: "e1-ghg-scope1",
        name: "Émissions GES Scope 1",
        type: "indicator",
        category: "E",
        subcategory: "E1-Climate",
        description: "Émissions directes de GES (installations fixes, véhicules)",
        isMandatory: true,
        expectedEvidence: ["Bilan GES", "Factures énergie", "Relevés compteurs"],
        guidanceUrl: "https://ghgprotocol.org"
      },
      {
        id: "e1-ghg-scope2",
        name: "Émissions GES Scope 2",
        type: "indicator",
        category: "E",
        subcategory: "E1-Climate",
        description: "Émissions indirectes (électricité, chaleur, vapeur)",
        isMandatory: true,
        expectedEvidence: ["Bilan GES", "Factures électricité"],
      },
      {
        id: "e1-ghg-scope3",
        name: "Émissions GES Scope 3",
        type: "indicator",
        category: "E",
        subcategory: "E1-Climate",
        description: "Autres émissions indirectes (transport, déchets, achats)",
        isMandatory: false,
        expectedEvidence: ["Bilan GES étendu", "Données fournisseurs"],
      },
      {
        id: "e1-energy-consumption",
        name: "Consommation d'énergie totale",
        type: "indicator",
        category: "E",
        subcategory: "E1-Climate",
        description: "Électricité, gaz, fioul, renouvelables (MWh)",
        isMandatory: true,
        expectedEvidence: ["Factures énergie", "Relevés"],
      },
      {
        id: "e2-waste",
        name: "Production de déchets",
        type: "indicator",
        category: "E",
        subcategory: "E2-Pollution",
        description: "Déchets dangereux et non-dangereux (tonnes)",
        isMandatory: true,
        expectedEvidence: ["Bordereaux de suivi", "Contrats prestataires"],
      },
      {
        id: "e3-water",
        name: "Consommation d'eau",
        type: "indicator",
        category: "E",
        subcategory: "E3-Water",
        description: "Prélèvements d'eau totaux (m³)",
        isMandatory: false,
        expectedEvidence: ["Factures eau", "Relevés compteurs"],
      },
      // SOCIAL (S)
      {
        id: "s1-workforce",
        name: "Effectif total",
        type: "indicator",
        category: "S",
        subcategory: "S1-Workers",
        description: "Nombre de salariés (ETP)",
        isMandatory: true,
        expectedEvidence: ["Export SIRH", "DADS", "Registre du personnel"],
      },
      {
        id: "s1-training",
        name: "Heures de formation",
        type: "indicator",
        category: "S",
        subcategory: "S1-Workers",
        description: "Total heures de formation dispensées",
        isMandatory: true,
        expectedEvidence: ["Plan de formation", "Attestations", "Déclaration OPCO"],
      },
      {
        id: "s1-accidents",
        name: "Taux de fréquence accidents",
        type: "indicator",
        category: "S",
        subcategory: "S1-Workers",
        description: "Nombre d'accidents avec arrêt / million d'heures",
        isMandatory: true,
        expectedEvidence: ["DUERP", "Registre AT", "Déclarations CPAM"],
      },
      {
        id: "s1-gender-gap",
        name: "Écart salarial Femmes/Hommes",
        type: "indicator",
        category: "S",
        subcategory: "S1-Workers",
        description: "Écart de rémunération moyenne F/H (%)",
        isMandatory: true,
        expectedEvidence: ["Index égalité professionnelle", "Export paie"],
      },
      {
        id: "s1-turnover",
        name: "Taux de turnover",
        type: "indicator",
        category: "S",
        subcategory: "S1-Workers",
        description: "Départs volontaires / effectif moyen (%)",
        isMandatory: false,
        expectedEvidence: ["SIRH", "Bilan social"],
      },
      // GOUVERNANCE (G)
      {
        id: "g1-certifications",
        name: "Certifications qualité/environnement",
        type: "qualitative-info",
        category: "G",
        subcategory: "G1-Governance",
        description: "ISO 9001, ISO 14001, ISO 45001, etc.",
        isMandatory: true,
        expectedEvidence: ["Certificats ISO", "Attestations"],
      },
      {
        id: "g1-ethics-policy",
        name: "Politique anti-corruption",
        type: "qualitative-info",
        category: "G",
        subcategory: "G1-Governance",
        description: "Existence d'une politique formalisée",
        isMandatory: true,
        expectedEvidence: ["Charte éthique", "Code de conduite"],
      },
      {
        id: "g1-whistleblowing",
        name: "Dispositif d'alerte",
        type: "qualitative-info",
        category: "G",
        subcategory: "G1-Governance",
        description: "Système de signalement interne",
        isMandatory: false,
        expectedEvidence: ["Procédure", "Plateforme externe"],
      },
    ],
    excelTemplate: {
      filename: "Template_Pack_Donneur_Ordre.xlsx",
      columns: [
        { name: "Entité", field: "entity", type: "text", required: true, example: "Siège social" },
        { name: "Période", field: "period", type: "text", required: true, example: "2024" },
        { name: "Catégorie", field: "category", type: "dropdown", required: true, options: ["E", "S", "G"] },
        { name: "Sous-catégorie", field: "subcategory", type: "text", required: false, example: "E1-Climate" },
        { name: "Indicateur", field: "indicator_code", type: "text", required: true, example: "E1-GHG-Scope1" },
        { name: "Valeur", field: "value", type: "number", required: true, example: "1520" },
        { name: "Unité", field: "unit", type: "text", required: true, example: "tCO2e" },
        { name: "Source", field: "source", type: "text", required: false, example: "Bilan GES 2024" },
      ]
    }
  },

  "questionnaire-esg": {
    id: "questionnaire-esg",
    name: "Pack Questionnaire ESG",
    description: "PME/ETI répondant à EcoVadis, achats responsables, appels d'offres. Checklist E/S/G simplifiée (≈15-20 indicateurs).",
    icon: "📝",
    color: "bg-green-600",
    targetSegment: "PME/ETI questionnaires ESG",
    estimatedDuration: "1-2 semaines",
    checklistItems: [
      // Version simplifiée avec moins d'indicateurs
      {
        id: "esg-carbon",
        name: "Bilan carbone simplifié",
        type: "indicator",
        category: "E",
        subcategory: "Climate",
        description: "Scope 1+2 minimum",
        isMandatory: true,
        expectedEvidence: ["Bilan GES", "Estimation"],
      },
      {
        id: "esg-waste",
        name: "Gestion des déchets",
        type: "qualitative-info",
        category: "E",
        description: "Tri, recyclage, valorisation",
        isMandatory: true,
        expectedEvidence: ["Bordereaux", "Contrats"],
      },
      {
        id: "esg-workforce",
        name: "Effectif et répartition",
        type: "indicator",
        category: "S",
        description: "CDI/CDD, H/F",
        isMandatory: true,
        expectedEvidence: ["SIRH", "Registre"],
      },
      {
        id: "esg-safety",
        name: "Santé et sécurité",
        type: "qualitative-info",
        category: "S",
        description: "DUERP, formations SST",
        isMandatory: true,
        expectedEvidence: ["DUERP", "Attestations"],
      },
      {
        id: "esg-ethics",
        name: "Éthique et compliance",
        type: "qualitative-info",
        category: "G",
        description: "Charte, code de conduite",
        isMandatory: true,
        expectedEvidence: ["Charte", "Politique"],
      },
    ],
    excelTemplate: {
      filename: "Template_Questionnaire_ESG.xlsx",
      columns: [
        { name: "Période", field: "period", type: "text", required: true, example: "2024" },
        { name: "Catégorie E/S/G", field: "category", type: "dropdown", required: true, options: ["E", "S", "G"] },
        { name: "Indicateur", field: "indicator_name", type: "text", required: true, example: "Bilan carbone" },
        { name: "Valeur", field: "value", type: "text", required: true, example: "500 tCO2e" },
        { name: "Commentaire", field: "comment", type: "text", required: false },
      ]
    }
  },

  "banque": {
    id: "banque",
    name: "Pack Due Diligence Financière",
    description: "Demande banque/investisseur (prêt vert, levée de fonds). Focus carbone + taxonomie verte + gouvernance.",
    icon: "🏦",
    color: "bg-purple-600",
    targetSegment: "Banques, investisseurs, fonds",
    estimatedDuration: "1 semaine",
    checklistItems: [
      {
        id: "dd-carbon-total",
        name: "Empreinte carbone totale",
        type: "indicator",
        category: "E",
        subcategory: "Climate",
        description: "Scopes 1+2+3 si disponible",
        isMandatory: true,
        expectedEvidence: ["Bilan GES certifié", "Rapport RSE"],
      },
      {
        id: "dd-taxonomy",
        name: "Éligibilité taxonomie verte",
        type: "qualitative-info",
        category: "E",
        description: "% CA aligné taxonomie UE",
        isMandatory: true,
        expectedEvidence: ["Analyse taxonomie", "Rapport CSRD"],
      },
      {
        id: "dd-governance",
        name: "Structure de gouvernance ESG",
        type: "qualitative-info",
        category: "G",
        description: "Comité ESG, responsable RSE",
        isMandatory: true,
        expectedEvidence: ["Organigramme", "Procès-verbaux"],
      },
      {
        id: "dd-risks",
        name: "Cartographie risques ESG",
        type: "qualitative-info",
        category: "G",
        description: "Identification risques climat, sociaux, gouvernance",
        isMandatory: true,
        expectedEvidence: ["Matrice risques", "Rapport risques"],
      },
      {
        id: "dd-bcorp",
        name: "Certifications ESG",
        type: "qualitative-info",
        category: "G",
        description: "B Corp, Label Lucie, Engagé RSE",
        isMandatory: false,
        expectedEvidence: ["Certificats"],
      },
    ],
    excelTemplate: {
      filename: "Template_Due_Diligence_Banque.xlsx",
      columns: [
        { name: "Période", field: "period", type: "text", required: true, example: "2024" },
        { name: "Indicateur", field: "indicator_name", type: "text", required: true },
        { name: "Valeur", field: "value", type: "text", required: true },
        { name: "Preuve jointe", field: "evidence", type: "text", required: false },
      ]
    }
  },

  "audit-ready": {
    id: "audit-ready",
    name: "Pack Audit-Ready Full ESG",
    description: "Pré-audit interne ou audit externe. Checklist E/S/G complète (≈50 indicateurs) + preuves exhaustives + audit trail.",
    icon: "🔍",
    color: "bg-orange-600",
    targetSegment: "Entreprises en pré-audit / audit externe",
    estimatedDuration: "4-6 semaines",
    checklistItems: [
      // Version exhaustive (on met juste quelques exemples, en vrai il y en aurait 50+)
      {
        id: "audit-e1-scope1",
        name: "GES Scope 1 détaillé",
        type: "indicator",
        category: "E",
        subcategory: "E1-Climate",
        description: "Par source d'émission",
        isMandatory: true,
        expectedEvidence: ["Bilan GES détaillé", "Méthodologie", "Facteurs émission"],
      },
      {
        id: "audit-e1-scope2-market",
        name: "GES Scope 2 (market-based)",
        type: "indicator",
        category: "E",
        subcategory: "E1-Climate",
        description: "Méthode market-based",
        isMandatory: true,
        expectedEvidence: ["Contrats énergie verte", "Garanties d'origine"],
      },
      {
        id: "audit-e1-scope3-full",
        name: "GES Scope 3 complet (15 catégories)",
        type: "indicator",
        category: "E",
        subcategory: "E1-Climate",
        description: "Toutes catégories GHG Protocol",
        isMandatory: true,
        expectedEvidence: ["Bilan Scope 3", "Données fournisseurs", "Hypothèses"],
      },
      {
        id: "audit-s1-workforce-full",
        name: "Effectif détaillé (10+ critères)",
        type: "indicator",
        category: "S",
        subcategory: "S1-Workers",
        description: "CDI/CDD, H/F, âge, ancienneté, CSP",
        isMandatory: true,
        expectedEvidence: ["SIRH complet", "DADS", "BSI"],
      },
      {
        id: "audit-g1-board",
        name: "Composition conseil d'administration",
        type: "qualitative-info",
        category: "G",
        subcategory: "G1-Governance",
        description: "Indépendance, diversité, compétences ESG",
        isMandatory: true,
        expectedEvidence: ["PV AG", "Déclarations indépendance"],
      },
      // ... (en production, il y aurait 45+ items supplémentaires)
    ],
    excelTemplate: {
      filename: "Template_Audit_Ready_Full.xlsx",
      columns: [
        { name: "Entité", field: "entity", type: "text", required: true },
        { name: "Période", field: "period", type: "text", required: true },
        { name: "Catégorie", field: "category", type: "dropdown", required: true, options: ["E", "S", "G"] },
        { name: "Sous-catégorie", field: "subcategory", type: "text", required: true },
        { name: "Code indicateur", field: "indicator_code", type: "text", required: true },
        { name: "Nom indicateur", field: "indicator_name", type: "text", required: true },
        { name: "Valeur numérique", field: "value_numeric", type: "number", required: false },
        { name: "Valeur texte", field: "value_text", type: "text", required: false },
        { name: "Unité", field: "unit", type: "text", required: true },
        { name: "Méthode de calcul", field: "calculation_method", type: "text", required: false },
        { name: "Source", field: "source", type: "text", required: true },
        { name: "Preuves", field: "evidence_list", type: "text", required: true },
        { name: "Commentaires", field: "comments", type: "text", required: false },
      ]
    }
  }
};

// Helper pour obtenir un pack par ID
export function getPackTemplate(packType: PackType): PackTemplate {
  return PACK_TEMPLATES[packType];
}

// Helper pour calculer % complétude
export function calculateCompletionPercentage(
  items: ChecklistItem[]
): number {
  if (items.length === 0) return 0;
  
  const completedItems = items.filter(
    item => item.status === "accepted" || item.status === "provided"
  ).length;
  
  return Math.round((completedItems / items.length) * 100);
}

// Helper pour obtenir statistiques checklist
export interface ChecklistStats {
  total: number;
  missing: number;
  inProgress: number;
  provided: number;
  needsReview: number;
  accepted: number;
  rejected: number;
}

export function getChecklistStats(items: ChecklistItem[]): ChecklistStats {
  return {
    total: items.length,
    missing: items.filter(i => i.status === "missing").length,
    inProgress: items.filter(i => i.status === "in-progress").length,
    provided: items.filter(i => i.status === "provided").length,
    needsReview: items.filter(i => i.status === "needs-review").length,
    accepted: items.filter(i => i.status === "accepted").length,
    rejected: items.filter(i => i.status === "rejected").length,
  };
}
