/**
 * Glossaire ESG — Définitions centralisées des termes métier
 * Utilisé par : GuideAide, tooltips contextuels, aide inline
 */

export interface GlossaryEntry {
  term: string;
  /** Acronyme ou abréviation (ex: "CSRD", "GES") */
  acronym?: string;
  /** Définition courte (1 phrase) — affichée dans les tooltips */
  shortDef: string;
  /** Définition complète — affichée dans le glossaire */
  fullDef: string;
  /** Catégorie pour le regroupement */
  category: 'reglementation' | 'framework' | 'indicateur' | 'plateforme' | 'methode';
  /** Termes liés */
  related?: string[];
}

export const GLOSSARY: GlossaryEntry[] = [
  // ─── Réglementation ────────────────────────────────────────────────────────
  {
    term: 'CSRD',
    acronym: 'CSRD',
    shortDef: 'Directive européenne de reporting développement durable, obligatoire pour certaines entreprises.',
    fullDef: 'La Corporate Sustainability Reporting Directive (CSRD) est une directive européenne entrée en vigueur en 2024. Elle impose aux grandes entreprises et PME cotées de publier un rapport de durabilité selon des standards précis (ESRS). Les entreprises doivent déclarer leurs impacts environnementaux, sociaux et de gouvernance (ESG).',
    category: 'reglementation',
    related: ['ESRS', 'VSME', 'ESG'],
  },
  {
    term: 'ESRS',
    acronym: 'ESRS',
    shortDef: 'Standards européens de reporting développement durable — le référentiel détaillé pour les grandes entreprises.',
    fullDef: 'Les European Sustainability Reporting Standards (ESRS) sont les normes techniques développées par l\'EFRAG. Ils définissent précisément quelles informations ESG doivent être publiées. Les ESRS sont destinés aux grandes entreprises soumises à la CSRD. Pour les PME, une version simplifiée existe : le VSME.',
    category: 'reglementation',
    related: ['CSRD', 'VSME', 'EFRAG'],
  },
  {
    term: 'VSME',
    acronym: 'VSME',
    shortDef: 'Standard simplifié de reporting ESG pour les PME — version allégée des ESRS.',
    fullDef: 'Le Voluntary Sustainability Reporting Standard for SMEs (VSME) est un standard développé par l\'EFRAG spécifiquement pour les petites et moyennes entreprises. Il comprend environ 47 indicateurs répartis en modules (Module B pour les indicateurs de base). C\'est une version simplifiée et volontaire des ESRS, adaptée aux ressources limitées des PME.',
    category: 'framework',
    related: ['ESRS', 'CSRD', 'Module B', 'EFRAG'],
  },
  {
    term: 'EFRAG',
    acronym: 'EFRAG',
    shortDef: 'Organisme européen qui développe les standards de reporting ESRS et VSME.',
    fullDef: 'L\'European Financial Reporting Advisory Group (EFRAG) est l\'organisme mandaté par la Commission européenne pour développer les standards de reporting de durabilité (ESRS et VSME). C\'est l\'équivalent de ce qu\'est l\'IASB pour les normes comptables IFRS.',
    category: 'reglementation',
    related: ['ESRS', 'VSME', 'CSRD'],
  },

  // ─── Framework & Structure ─────────────────────────────────────────────────
  {
    term: 'Module B',
    shortDef: 'Ensemble des indicateurs ESG de base du VSME — c\'est la partie principale à remplir.',
    fullDef: 'Le Module B est le cœur du standard VSME. Il contient les indicateurs quantitatifs et qualitatifs de base que chaque PME doit renseigner. Il est organisé en 11 sections (B1 à B11) couvrant l\'environnement, le social et la gouvernance. C\'est le module que vous remplissez dans l\'écran de saisie.',
    category: 'framework',
    related: ['VSME', 'Indicateur', 'Section'],
  },
  {
    term: 'Pilier ESG',
    shortDef: 'Les 3 axes du reporting : Environnement (E), Social (S), Gouvernance (G).',
    fullDef: 'Les piliers ESG sont les trois grandes catégories du reporting de durabilité :\n\n• **Environnement (E)** — Émissions carbone, énergie, eau, déchets, biodiversité\n• **Social (S)** — Emploi, formation, santé-sécurité, diversité, droits humains\n• **Gouvernance (G)** — Éthique, conformité, structure de gouvernance, anti-corruption\n\nChaque indicateur VSME est rattaché à un pilier, identifié par un code couleur dans la plateforme.',
    category: 'framework',
    related: ['ESG', 'Module B', 'Indicateur'],
  },
  {
    term: 'ESG',
    acronym: 'ESG',
    shortDef: 'Environnement, Social, Gouvernance — les 3 piliers du reporting de durabilité.',
    fullDef: 'ESG désigne les trois dimensions de la performance extra-financière d\'une entreprise : Environnement (impact écologique), Social (impact sur les personnes) et Gouvernance (éthique et gestion). Ces critères sont utilisés par les investisseurs, régulateurs et parties prenantes pour évaluer la durabilité d\'une organisation.',
    category: 'framework',
    related: ['Pilier ESG', 'CSRD'],
  },
  {
    term: 'Section',
    shortDef: 'Groupe thématique d\'indicateurs dans le Module B (ex: B3 = Énergie, B7 = Émissions).',
    fullDef: 'Une section est un regroupement thématique d\'indicateurs au sein du Module B du VSME. Par exemple :\n• B1-B2 : Informations générales\n• B3 : Consommation d\'énergie\n• B4-B6 : Eau, biodiversité, déchets\n• B7 : Émissions de gaz à effet de serre\n• B8-B9 : Emploi et social\n• B10-B11 : Gouvernance\n\nDans la plateforme, les sections sont regroupées en onglets thématiques pour faciliter la saisie.',
    category: 'framework',
    related: ['Module B', 'Indicateur'],
  },

  // ─── Indicateurs & Données ─────────────────────────────────────────────────
  {
    term: 'Indicateur',
    shortDef: 'Une donnée ESG à renseigner, identifiée par un code (ex: B3.1 = consommation d\'énergie totale).',
    fullDef: 'Un indicateur est une information spécifique que vous devez renseigner dans votre rapport ESG. Chaque indicateur a :\n• Un **code** (ex: B3.1) qui l\'identifie dans le standard VSME\n• Un **intitulé** (ex: "Consommation d\'énergie totale")\n• Un **type** : Quantitatif (nombre), Qualitatif (texte), ou Narratif (description détaillée)\n• Une **unité** (ex: MWh, tCO₂e, %)\n• Un **pilier** (E, S ou G)\n\nDans la plateforme, chaque indicateur correspond à une ligne dans le tableau de saisie.',
    category: 'indicateur',
    related: ['Module B', 'Section', 'Pilier ESG'],
  },
  {
    term: 'GES',
    acronym: 'GES',
    shortDef: 'Gaz à Effet de Serre — les émissions carbone de votre organisation (CO₂, méthane, etc.).',
    fullDef: 'Les Gaz à Effet de Serre (GES) sont les émissions qui contribuent au réchauffement climatique. Dans le reporting ESG, ils sont mesurés en tonnes équivalent CO₂ (tCO₂e) et classés en 3 périmètres :\n• **Scope 1** : Émissions directes (combustion sur site, véhicules de l\'entreprise)\n• **Scope 2** : Émissions indirectes liées à l\'énergie achetée (électricité, chaleur)\n• **Scope 3** : Autres émissions indirectes (fournisseurs, déplacements, déchets)\n\nCorrespond aux indicateurs B7.1 à B7.3 dans le VSME.',
    category: 'indicateur',
    related: ['Scope 1/2/3', 'Indicateur', 'Pilier ESG'],
  },
  {
    term: 'Scope 1/2/3',
    shortDef: 'Classification des émissions carbone : directes (1), énergie achetée (2), chaîne de valeur (3).',
    fullDef: 'Les Scopes sont une classification internationale des émissions de GES :\n• **Scope 1** — Émissions directes : combustion de carburants, fuites de gaz réfrigérants, procédés industriels sur vos sites\n• **Scope 2** — Énergie achetée : électricité, vapeur, chaleur ou froid que vous achetez\n• **Scope 3** — Chaîne de valeur : tout le reste (achats, transport de marchandises, déplacements des salariés, utilisation des produits vendus, fin de vie)\n\nLe Scope 3 représente généralement 70-90% des émissions totales.',
    category: 'methode',
    related: ['GES', 'Indicateur'],
  },
  {
    term: 'Double matérialité',
    shortDef: 'Analyse des impacts ESG dans les deux sens : impact de l\'entreprise sur le monde ET du monde sur l\'entreprise.',
    fullDef: 'La double matérialité est un concept clé de la CSRD. Elle impose d\'analyser chaque enjeu ESG sous deux angles :\n• **Matérialité d\'impact** : Quels sont les impacts (positifs ou négatifs) de votre entreprise sur l\'environnement et la société ?\n• **Matérialité financière** : Comment les enjeux ESG (changement climatique, pénurie de ressources…) affectent-ils la performance financière de votre entreprise ?\n\nCette analyse détermine quels indicateurs sont "matériels" et doivent être reportés en priorité.',
    category: 'methode',
    related: ['CSRD', 'ESG'],
  },

  // ─── Plateforme Solvid.IA ────────────────────────────────────────────────
  {
    term: 'Dossier',
    shortDef: 'Espace de travail pour un client et un exercice fiscal — contient toutes les données ESG.',
    fullDef: 'Un dossier dans Solvid.IA représente une mission ESG pour un client donné sur un exercice fiscal. Il regroupe :\n• Les **informations générales** (client, année, type de mission)\n• Les **workflows** sélectionnés (référentiels à remplir)\n• Les **données saisies** (indicateurs quantitatifs et qualitatifs)\n• Les **preuves** et documents justificatifs\n• Les **rapports IA** générés\n\nChaque dossier peut être en mode Annuel, Trimestriel, Mensuel ou Personnalisé selon la fréquence de saisie choisie.',
    category: 'plateforme',
    related: ['Workflow', 'Indicateur', 'Fréquence de saisie'],
  },
  {
    term: 'Mission',
    shortDef: 'Type d\'intervention : Conseil (accompagnement) ou Audit (vérification indépendante).',
    fullDef: 'Le type de mission définit votre rôle par rapport au client :\n• **Mission Conseil** : Vous accompagnez le client dans la collecte et la déclaration de ses données ESG. Vous pouvez saisir et modifier les données.\n• **Mission Audit** : Vous vérifiez de manière indépendante les données déclarées par le client. Vous avez un accès en lecture avec des outils de contrôle.\n\n⚠️ Règle CSRD : La même organisation ne peut pas être à la fois conseil et auditeur sur un même dossier (indépendance).',
    category: 'plateforme',
    related: ['Dossier', 'CSRD'],
  },
  {
    term: 'Workflow',
    shortDef: 'Référentiel ESG pré-configuré avec ses templates et indicateurs associés.',
    fullDef: 'Un workflow dans Solvid.IA est un parcours de collecte de données basé sur un référentiel ESG (ex: VSME Complet, Bilan Carbone, CSRD). Chaque workflow définit :\n• Les **sections** d\'indicateurs à remplir\n• Les **templates Excel** pré-formatés à télécharger\n• Les **preuves** obligatoires à fournir\n• La **difficulté** estimée et le temps nécessaire\n\nVous pouvez sélectionner plusieurs workflows par dossier selon les besoins du client.',
    category: 'plateforme',
    related: ['Dossier', 'Template', 'Indicateur'],
  },
  {
    term: 'Template',
    shortDef: 'Fichier Excel pré-formaté pour collecter les données ESG auprès de vos équipes.',
    fullDef: 'Un template est un fichier Excel (.xlsx) pré-configuré par la plateforme. Il contient :\n• Les **colonnes** correspondant aux indicateurs VSME (code, intitulé, unité)\n• Une colonne **"Valeur à saisir"** que vos équipes remplissent\n• Des **instructions** et exemples dans chaque cellule\n\nUne fois rempli, le template peut être ré-importé dans Solvid.IA via l\'Import Center — les données sont automatiquement mappées aux bons indicateurs.',
    category: 'plateforme',
    related: ['Workflow', 'Import', 'Indicateur'],
  },
  {
    term: 'Fréquence de saisie',
    shortDef: 'Rythme de collecte des données : annuel, trimestriel, mensuel ou personnalisé.',
    fullDef: 'La fréquence de saisie définit à quelle granularité vous collectez les données ESG :\n• **Annuel** — Une seule saisie par exercice fiscal (le plus simple)\n• **Trimestriel** — 4 périodes : T1 (Jan-Mar), T2 (Avr-Jun), T3 (Jul-Sep), T4 (Oct-Déc)\n• **Mensuel** — 12 périodes, de Janvier à Décembre\n• **Personnalisé** — Périodes libres (ex: Semestre 1, Semestre 2)\n\nPlus la fréquence est élevée, plus vous pouvez suivre les tendances et détecter les anomalies. Le mode est défini à la création du dossier et reste modifiable ensuite.',
    category: 'plateforme',
    related: ['Dossier', 'Indicateur'],
  },
  {
    term: 'Preuve',
    shortDef: 'Document justificatif requis pour valider un indicateur ou un workflow (facture, certificat, etc.).',
    fullDef: 'Une preuve est un document qui atteste de la véracité d\'une donnée déclarée. Exemples :\n• Facture d\'énergie (pour les données de consommation)\n• Certificat ISO 14001 (pour les pratiques environnementales)\n• Registre du personnel (pour les données sociales)\n• PV de conseil d\'administration (pour la gouvernance)\n\nCertaines preuves sont obligatoires selon le workflow sélectionné. La plateforme vous indique lesquelles manquent.',
    category: 'plateforme',
    related: ['Workflow', 'Indicateur'],
  },
];

/** Catégories avec labels et couleurs */
export const GLOSSARY_CATEGORIES: Record<string, { label: string; color: string; bg: string }> = {
  reglementation: { label: 'Réglementation', color: '#b45309', bg: '#fffbeb' },
  framework:      { label: 'Cadre & Structure', color: '#2d7a55', bg: '#f0fdf4' },
  indicateur:     { label: 'Indicateurs & Données', color: '#1a5f8a', bg: '#eff6ff' },
  methode:        { label: 'Méthodologie', color: '#6c3483', bg: '#faf5ff' },
  plateforme:     { label: 'Plateforme Solvid.IA', color: '#0A3B2E', bg: '#E8F3F0' },
};

/** Lookup rapide par terme (insensible à la casse) */
export function findGlossaryEntry(term: string): GlossaryEntry | undefined {
  const lower = term.toLowerCase();
  return GLOSSARY.find(e =>
    e.term.toLowerCase() === lower ||
    e.acronym?.toLowerCase() === lower
  );
}

/** Recherche partielle dans le glossaire */
export function searchGlossary(query: string): GlossaryEntry[] {
  if (!query.trim()) return GLOSSARY;
  const lower = query.toLowerCase();
  return GLOSSARY.filter(e =>
    e.term.toLowerCase().includes(lower) ||
    e.acronym?.toLowerCase().includes(lower) ||
    e.shortDef.toLowerCase().includes(lower)
  );
}

/** Trouve le premier terme du glossaire présent dans un texte (pour tooltips contextuels) */
export function findGlossaryTermInText(text: string): GlossaryEntry | undefined {
  const lower = text.toLowerCase();
  // Chercher les acronymes en priorité (GES, CSRD, etc.) puis les termes complets
  return GLOSSARY.find(e =>
    (e.acronym && lower.includes(e.acronym.toLowerCase())) ||
    lower.includes(e.term.toLowerCase())
  );
}
