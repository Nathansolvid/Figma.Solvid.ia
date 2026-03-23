/**
 * VSME — Référentiel complet (EFRAG, version PME non cotées)
 * Module B : 47 datapoints (B1–B11)
 * Module C : 32 datapoints (C1–C9)
 */

export type Pilier = "E" | "S" | "G" | "Général";
export type TypeIndicateur = "Quantitatif" | "Calculé" | "Qualitatif" | "Narratif";
export type StatutSaisie = "empty" | "partial" | "filled";

/** Types de données fins pour l'affichage dans le formulaire de saisie */
export type DataType = "Numérique" | "Narratif" | "URL" | "Liste déroulante" | "Tableau" | "Oui/Non" | "Choix multiple";

/** Options prédéfinies pour les champs de type "Liste déroulante" */
export const DROPDOWN_OPTIONS: Record<string, string[]> = {
  "B1.4": ["Agriculture", "Industrie manufacturière", "Construction", "Commerce", "Transport", "Hébergement et restauration", "Information et communication", "Activités financières", "Activités immobilières", "Services aux entreprises", "Enseignement", "Santé", "Autre"],
  "B2.1": ["Oui, engagement formel", "En cours de définition", "Non, pas encore"],
  "B2.3": ["Exposition faible", "Exposition modérée", "Exposition élevée", "Non évalué"],
  "B6.1": ["Oui, activités en zone protégée", "Oui, activités proches", "Non"],
};

/** Mapping code → type de donnée fin (prérempli selon le référentiel) */
export const DATAPOINT_TYPES: Record<string, DataType> = {
  // B1 — Informations générales
  "B1.1": "Numérique",
  "B1.2": "Numérique",
  "B1.3": "Numérique",
  "B1.4": "Liste déroulante",
  // B2 — Changement climatique
  "B2.1": "Liste déroulante",
  "B2.2": "Numérique",
  "B2.3": "Liste déroulante",
  // B3 — Énergie
  "B3.1": "Numérique",
  "B3.2": "Numérique",
  "B3.3": "Numérique",
  "B3.4": "Numérique",
  "B3.5": "Narratif",
  // B4 — Eau
  "B4.1": "Numérique",
  "B4.2": "Numérique",
  "B4.3": "Narratif",
  // B5 — Déchets
  "B5.1": "Numérique",
  "B5.2": "Numérique",
  "B5.3": "Numérique",
  "B5.4": "Numérique",
  // B6 — Biodiversité
  "B6.1": "Liste déroulante",
  "B6.2": "Narratif",
  // B7 — GES
  "B7.1": "Numérique",
  "B7.2": "Numérique",
  "B7.3": "Numérique",
  "B7.4": "Numérique",
  "B7.5": "Numérique",
  // B8 — Main d'œuvre
  "B8.1": "Numérique",
  "B8.2": "Numérique",
  "B8.3": "Numérique",
  "B8.4": "Numérique",
  "B8.5": "Numérique",
  "B8.6": "Numérique",
  "B8.7": "Numérique",
  "B8.8": "Numérique",
  // B9 — Conditions de travail
  "B9.1": "Oui/Non",
  "B9.2": "Narratif",
  // B10 — Diversité
  "B10.1": "Numérique",
  "B10.2": "Numérique",
  // B11 — Gouvernance
  "B11.1": "Oui/Non",
  "B11.2": "Numérique",
  "B11.3": "Narratif",
};

export interface Datapoint {
  code: string;
  intitule: string;
  pilier: Pilier;
  type: TypeIndicateur;
  unite?: string;
  obligatoire: boolean;
  esrs_equivalent?: string;
  computed?: boolean;   // true = read-only, calculé automatiquement
}

export interface SectionVSME {
  id: string;          // ex: "B3"
  titre: string;
  pilier: Pilier;
  datapoints: Datapoint[];
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE B — 47 datapoints
// ─────────────────────────────────────────────────────────────────────────────
export const MODULE_B: SectionVSME[] = [
  {
    id: "B1",
    titre: "Informations générales",
    pilier: "Général",
    datapoints: [
      { code: "B1.1", intitule: "Nombre d'employés (ETP)", pilier: "Général", type: "Quantitatif", unite: "ETP", obligatoire: true },
      { code: "B1.2", intitule: "Chiffre d'affaires net", pilier: "Général", type: "Quantitatif", unite: "€", obligatoire: true },
      { code: "B1.3", intitule: "Total bilan", pilier: "Général", type: "Quantitatif", unite: "€", obligatoire: true },
      { code: "B1.4", intitule: "Secteurs d'activité principaux (codes NACE)", pilier: "Général", type: "Qualitatif", obligatoire: true },
    ],
  },
  {
    id: "B2",
    titre: "Changement climatique — Risques et opportunités",
    pilier: "E",
    datapoints: [
      { code: "B2.1", intitule: "Engagement de réduction des émissions GES", pilier: "E", type: "Qualitatif", obligatoire: false, esrs_equivalent: "E1-1" },
      { code: "B2.2", intitule: "Cible chiffrée de réduction GES (%)", pilier: "E", type: "Quantitatif", unite: "%", obligatoire: false, esrs_equivalent: "E1-4" },
      { code: "B2.3", intitule: "Exposition aux risques physiques climatiques", pilier: "E", type: "Narratif", obligatoire: false, esrs_equivalent: "E1-9" },
    ],
  },
  {
    id: "B3",
    titre: "Énergie & GES",
    pilier: "E",
    datapoints: [
      { code: "B3.1", intitule: "Consommation totale d'énergie", pilier: "E", type: "Quantitatif", unite: "MWh/an", obligatoire: true, esrs_equivalent: "E1-5" },
      { code: "B3.2", intitule: "dont énergie renouvelable", pilier: "E", type: "Quantitatif", unite: "MWh/an", obligatoire: true, esrs_equivalent: "E1-5" },
      { code: "B3.3", intitule: "dont énergie non renouvelable", pilier: "E", type: "Calculé", unite: "MWh/an", obligatoire: true, esrs_equivalent: "E1-5", computed: true },
      { code: "B3.4", intitule: "Intensité énergétique (par M€ de CA)", pilier: "E", type: "Calculé", unite: "MWh/M€", obligatoire: false, esrs_equivalent: "E1-5", computed: true },
      { code: "B3.5", intitule: "Cible de réduction de la consommation d'énergie", pilier: "E", type: "Qualitatif", obligatoire: false, esrs_equivalent: "E1-4" },
    ],
  },
  {
    id: "B4",
    titre: "Eau & Ressources marines",
    pilier: "E",
    datapoints: [
      { code: "B4.1", intitule: "Volume total d'eau prélevée", pilier: "E", type: "Quantitatif", unite: "m³/an", obligatoire: true, esrs_equivalent: "E3-4" },
      { code: "B4.2", intitule: "dont eau prélevée en zones de stress hydrique", pilier: "E", type: "Quantitatif", unite: "m³/an", obligatoire: false, esrs_equivalent: "E3-4" },
      { code: "B4.3", intitule: "Engagement ou cible de réduction eau", pilier: "E", type: "Qualitatif", obligatoire: false, esrs_equivalent: "E3-2" },
    ],
  },
  {
    id: "B5",
    titre: "Déchets",
    pilier: "E",
    datapoints: [
      { code: "B5.1", intitule: "Déchets totaux générés", pilier: "E", type: "Quantitatif", unite: "tonnes/an", obligatoire: true, esrs_equivalent: "E5-5" },
      { code: "B5.2", intitule: "dont déchets dangereux", pilier: "E", type: "Quantitatif", unite: "tonnes/an", obligatoire: true, esrs_equivalent: "E5-5" },
      { code: "B5.3", intitule: "dont déchets valorisés (recyclage, réutilisation)", pilier: "E", type: "Quantitatif", unite: "tonnes/an", obligatoire: false, esrs_equivalent: "E5-5" },
      { code: "B5.4", intitule: "Taux de valorisation des déchets", pilier: "E", type: "Calculé", unite: "%", obligatoire: false, esrs_equivalent: "E5-5", computed: true },
    ],
  },
  {
    id: "B6",
    titre: "Biodiversité & Usage des terres",
    pilier: "E",
    datapoints: [
      { code: "B6.1", intitule: "Activités dans ou proches de zones protégées", pilier: "E", type: "Qualitatif", obligatoire: false, esrs_equivalent: "E4-5" },
      { code: "B6.2", intitule: "Mesures de protection de la biodiversité", pilier: "E", type: "Narratif", obligatoire: false, esrs_equivalent: "E4-4" },
    ],
  },
  {
    id: "B7",
    titre: "Émissions de gaz à effet de serre",
    pilier: "E",
    datapoints: [
      { code: "B7.1", intitule: "Émissions GES Scope 1 (combustion directe)", pilier: "E", type: "Quantitatif", unite: "tCO₂e/an", obligatoire: true, esrs_equivalent: "E1-6" },
      { code: "B7.2", intitule: "Émissions GES Scope 2 — market-based", pilier: "E", type: "Quantitatif", unite: "tCO₂e/an", obligatoire: true, esrs_equivalent: "E1-6" },
      { code: "B7.3", intitule: "Émissions GES Scope 2 — location-based", pilier: "E", type: "Quantitatif", unite: "tCO₂e/an", obligatoire: false, esrs_equivalent: "E1-6" },
      { code: "B7.4", intitule: "Total Scope 1 + 2 (market-based)", pilier: "E", type: "Calculé", unite: "tCO₂e/an", obligatoire: true, esrs_equivalent: "E1-6", computed: true },
      { code: "B7.5", intitule: "Intensité GES (par M€ de CA)", pilier: "E", type: "Calculé", unite: "tCO₂e/M€", obligatoire: false, esrs_equivalent: "E1-6", computed: true },
    ],
  },
  {
    id: "B8",
    titre: "Main d'œuvre & Conditions de travail",
    pilier: "S",
    datapoints: [
      { code: "B8.1", intitule: "Effectif total (ETP)", pilier: "S", type: "Quantitatif", unite: "ETP", obligatoire: true, esrs_equivalent: "S1-6" },
      { code: "B8.2", intitule: "Répartition par genre — % femmes", pilier: "S", type: "Quantitatif", unite: "%", obligatoire: true, esrs_equivalent: "S1-6" },
      { code: "B8.3", intitule: "Écart de rémunération femmes/hommes", pilier: "S", type: "Quantitatif", unite: "%", obligatoire: true, esrs_equivalent: "S1-16" },
      { code: "B8.4", intitule: "Taux de turnover volontaire", pilier: "S", type: "Calculé", unite: "%", obligatoire: false, esrs_equivalent: "S1-6", computed: true },
      { code: "B8.5", intitule: "Jours de formation par employé", pilier: "S", type: "Quantitatif", unite: "jours/ETP", obligatoire: false, esrs_equivalent: "S1-13" },
      { code: "B8.6", intitule: "Taux de fréquence des accidents du travail (TF)", pilier: "S", type: "Quantitatif", unite: "tf", obligatoire: true, esrs_equivalent: "S1-14" },
      { code: "B8.7", intitule: "Taux de gravité des accidents du travail (TG)", pilier: "S", type: "Quantitatif", unite: "tg", obligatoire: false, esrs_equivalent: "S1-14" },
      { code: "B8.8", intitule: "Employés couverts par convention collective", pilier: "S", type: "Quantitatif", unite: "%", obligatoire: false, esrs_equivalent: "S1-8" },
    ],
  },
  {
    id: "B9",
    titre: "Chaîne d'approvisionnement & Droits humains",
    pilier: "S",
    datapoints: [
      { code: "B9.1", intitule: "Politique droits humains formalisée", pilier: "S", type: "Qualitatif", obligatoire: false, esrs_equivalent: "S2-1" },
      { code: "B9.2", intitule: "Processus d'évaluation ESG des fournisseurs", pilier: "S", type: "Qualitatif", obligatoire: false, esrs_equivalent: "S2-4" },
      { code: "B9.3", intitule: "Incidents droits humains signalés (nbre)", pilier: "S", type: "Quantitatif", unite: "nbre", obligatoire: false, esrs_equivalent: "S2-5" },
      { code: "B9.4", intitule: "Fournisseurs évalués sur critères sociaux (%)", pilier: "S", type: "Quantitatif", unite: "%", obligatoire: false, esrs_equivalent: "S2-4" },
    ],
  },
  {
    id: "B10",
    titre: "Diversité & Inclusion",
    pilier: "G",
    datapoints: [
      { code: "B10.1", intitule: "Femmes en postes de direction / conseil (%)", pilier: "G", type: "Quantitatif", unite: "%", obligatoire: true, esrs_equivalent: "G1-1" },
      { code: "B10.2", intitule: "Politique diversité & inclusion formalisée", pilier: "G", type: "Qualitatif", obligatoire: false, esrs_equivalent: "G1-1" },
      { code: "B10.3", intitule: "Formations sensibilisation non-discrimination", pilier: "G", type: "Qualitatif", obligatoire: false, esrs_equivalent: "G1-1" },
    ],
  },
  {
    id: "B11",
    titre: "Gouvernance & Conduite des affaires",
    pilier: "G",
    datapoints: [
      { code: "B11.1", intitule: "Politique anti-corruption formalisée", pilier: "G", type: "Qualitatif", obligatoire: true, esrs_equivalent: "G1-3" },
      { code: "B11.2", intitule: "Incidents de corruption ou de fraude signalés", pilier: "G", type: "Quantitatif", unite: "nbre", obligatoire: true, esrs_equivalent: "G1-4" },
      { code: "B11.3", intitule: "Politique de protection des données (RGPD)", pilier: "G", type: "Qualitatif", obligatoire: false, esrs_equivalent: "G1-5" },
      { code: "B11.4", intitule: "Certifications ou normes obtenues (ISO, etc.)", pilier: "G", type: "Qualitatif", obligatoire: false },
      { code: "B11.5", intitule: "Responsable ESG ou comité dédié", pilier: "G", type: "Qualitatif", obligatoire: false, esrs_equivalent: "G1-1" },
      { code: "B11.6", intitule: "Heures de formation à l'éthique & conformité", pilier: "G", type: "Quantitatif", unite: "h/an", obligatoire: false, esrs_equivalent: "G1-3" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MODULE C — 32 datapoints
// ─────────────────────────────────────────────────────────────────────────────
export const MODULE_C: SectionVSME[] = [
  {
    id: "C1",
    titre: "Stratégie & Modèle d'affaires",
    pilier: "Général",
    datapoints: [
      { code: "C1.1", intitule: "Description du modèle d'affaires et chaîne de valeur", pilier: "Général", type: "Narratif", obligatoire: true },
      { code: "C1.2", intitule: "Principaux impacts, risques et opportunités ESG identifiés", pilier: "Général", type: "Narratif", obligatoire: true },
      { code: "C1.3", intitule: "Processus de double matérialité (si applicable)", pilier: "Général", type: "Narratif", obligatoire: false },
      { code: "C1.4", intitule: "Engagements pris envers les parties prenantes", pilier: "Général", type: "Narratif", obligatoire: false },
    ],
  },
  {
    id: "C2",
    titre: "Changement climatique — Politique et plans",
    pilier: "E",
    datapoints: [
      { code: "C2.1", intitule: "Politique de transition bas-carbone", pilier: "E", type: "Narratif", obligatoire: false, esrs_equivalent: "E1-2" },
      { code: "C2.2", intitule: "Plan d'action de réduction GES à horizon 2030/2050", pilier: "E", type: "Narratif", obligatoire: false, esrs_equivalent: "E1-3" },
      { code: "C2.3", intitule: "Investissements réalisés dans la transition climatique (€)", pilier: "E", type: "Quantitatif", unite: "€/an", obligatoire: false, esrs_equivalent: "E1-7" },
      { code: "C2.4", intitule: "Émissions GES Scope 3 (catégories significatives)", pilier: "E", type: "Quantitatif", unite: "tCO₂e/an", obligatoire: false, esrs_equivalent: "E1-6" },
    ],
  },
  {
    id: "C3",
    titre: "Pollution & Substances préoccupantes",
    pilier: "E",
    datapoints: [
      { code: "C3.1", intitule: "Émissions de polluants atmosphériques (NOₓ, SOₓ, etc.)", pilier: "E", type: "Quantitatif", unite: "tonnes/an", obligatoire: false, esrs_equivalent: "E2-4" },
      { code: "C3.2", intitule: "Substances chimiques préoccupantes utilisées ou rejetées", pilier: "E", type: "Qualitatif", obligatoire: false, esrs_equivalent: "E2-5" },
      { code: "C3.3", intitule: "Plan de réduction des substances polluantes", pilier: "E", type: "Narratif", obligatoire: false, esrs_equivalent: "E2-3" },
    ],
  },
  {
    id: "C4",
    titre: "Eau & Ressources marines — Politique",
    pilier: "E",
    datapoints: [
      { code: "C4.1", intitule: "Politique de gestion de l'eau", pilier: "E", type: "Narratif", obligatoire: false, esrs_equivalent: "E3-2" },
      { code: "C4.2", intitule: "Plan d'action réduction consommation d'eau", pilier: "E", type: "Narratif", obligatoire: false, esrs_equivalent: "E3-3" },
      { code: "C4.3", intitule: "Volume d'eau recyclée ou réutilisée (m³)", pilier: "E", type: "Quantitatif", unite: "m³/an", obligatoire: false, esrs_equivalent: "E3-4" },
    ],
  },
  {
    id: "C5",
    titre: "Biodiversité — Politique et plans",
    pilier: "E",
    datapoints: [
      { code: "C5.1", intitule: "Politique biodiversité et engagement no-net-loss", pilier: "E", type: "Narratif", obligatoire: false, esrs_equivalent: "E4-2" },
      { code: "C5.2", intitule: "Superficie utilisée ou impactée (ha)", pilier: "E", type: "Quantitatif", unite: "ha", obligatoire: false, esrs_equivalent: "E4-5" },
      { code: "C5.3", intitule: "Actions de restauration des écosystèmes", pilier: "E", type: "Narratif", obligatoire: false, esrs_equivalent: "E4-4" },
    ],
  },
  {
    id: "C6",
    titre: "Économie circulaire & Déchets",
    pilier: "E",
    datapoints: [
      { code: "C6.1", intitule: "Politique d'économie circulaire et d'écoconception", pilier: "E", type: "Narratif", obligatoire: false, esrs_equivalent: "E5-2" },
      { code: "C6.2", intitule: "Matières premières recyclées utilisées (%)", pilier: "E", type: "Quantitatif", unite: "%", obligatoire: false, esrs_equivalent: "E5-5" },
      { code: "C6.3", intitule: "Cibles de réduction des déchets mis en décharge", pilier: "E", type: "Narratif", obligatoire: false, esrs_equivalent: "E5-3" },
    ],
  },
  {
    id: "C7",
    titre: "Main d'œuvre — Politique et plans",
    pilier: "S",
    datapoints: [
      { code: "C7.1", intitule: "Politique de santé-sécurité au travail", pilier: "S", type: "Narratif", obligatoire: true, esrs_equivalent: "S1-4" },
      { code: "C7.2", intitule: "Plan d'action pour l'égalité professionnelle F/H", pilier: "S", type: "Narratif", obligatoire: false, esrs_equivalent: "S1-4" },
      { code: "C7.3", intitule: "Politique de développement des compétences / formation", pilier: "S", type: "Narratif", obligatoire: false, esrs_equivalent: "S1-4" },
      { code: "C7.4", intitule: "Mécanismes de dialogue social (syndicats, CSE, etc.)", pilier: "S", type: "Narratif", obligatoire: false, esrs_equivalent: "S1-3" },
      { code: "C7.5", intitule: "Canal de signalement (lanceurs d'alerte)", pilier: "S", type: "Qualitatif", obligatoire: false, esrs_equivalent: "G1-2" },
    ],
  },
  {
    id: "C8",
    titre: "Communautés & Parties prenantes",
    pilier: "S",
    datapoints: [
      { code: "C8.1", intitule: "Politique d'engagement envers les communautés locales", pilier: "S", type: "Narratif", obligatoire: false, esrs_equivalent: "S3-2" },
      { code: "C8.2", intitule: "Investissements sociétaux (dons, mécénat, etc.) (€)", pilier: "S", type: "Quantitatif", unite: "€/an", obligatoire: false },
      { code: "C8.3", intitule: "Consultation des parties prenantes et résultats", pilier: "S", type: "Narratif", obligatoire: false, esrs_equivalent: "S3-4" },
      { code: "C8.4", intitule: "Impacts sur les communautés — mesures correctives", pilier: "S", type: "Narratif", obligatoire: false, esrs_equivalent: "S3-5" },
    ],
  },
  {
    id: "C9",
    titre: "Gouvernance — Structure & Rémunérations",
    pilier: "G",
    datapoints: [
      { code: "C9.1", intitule: "Structure de gouvernance (CA, comités, etc.)", pilier: "G", type: "Narratif", obligatoire: true, esrs_equivalent: "G1-1" },
      { code: "C9.2", intitule: "Politique de rémunération liée aux critères ESG", pilier: "G", type: "Narratif", obligatoire: false, esrs_equivalent: "G1-1" },
      { code: "C9.3", intitule: "Rapport de durabilité ou extra-financier publié", pilier: "G", type: "Qualitatif", obligatoire: false },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Total datapoints par module */
export const MODULE_B_TOTAL = MODULE_B.reduce((n, s) => n + s.datapoints.length, 0); // 47
export const MODULE_C_TOTAL = MODULE_C.reduce((n, s) => n + s.datapoints.length, 0); // 32

/** Couleur principale selon pilier */
export const PILIER_COLOR: Record<Pilier, string> = {
  E: "#2d7a55",
  S: "#1a5f8a",
  G: "#6c3483",
  Général: "#475569",
};

export const PILIER_BG: Record<Pilier, string> = {
  E: "#edf7f1",
  S: "#ebf5fb",
  G: "#f5eef8",
  Général: "#f1f5f9",
};

export const PILIER_LABEL: Record<Pilier, string> = {
  E: "Environnement",
  S: "Social",
  G: "Gouvernance",
  Général: "Général",
};

/** Cycle 3 états checkbox */
export function nextStatut(current: StatutSaisie): StatutSaisie {
  if (current === "empty") return "partial";
  if (current === "partial") return "filled";
  return "empty";
}
