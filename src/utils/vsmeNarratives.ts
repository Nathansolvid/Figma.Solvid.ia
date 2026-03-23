/**
 * VSME NARRATIVES — Contenus narratifs pour rapports de durabilité détaillés
 *
 * Fournit les textes explicatifs, méthodologies et glossaire
 * pour produire des rapports ESG de niveau corporate (style DPEF / sustainability statement).
 *
 * Structure : chaque section VSME (B1–B11, C1–C9) a un bloc narratif :
 *   - intro : paragraphe d'introduction de la section
 *   - methodology : note méthodologique (comment les données sont collectées/calculées)
 *   - context : contexte réglementaire ou sectoriel
 *   - esrsMapping : mapping vers les normes ESRS correspondantes
 */

// ==================== SECTION NARRATIVES ====================

export interface SectionNarrative {
  intro: string;
  methodology: string;
  context: string;
  esrsRef: string;        // ex: "ESRS E1-5, E1-6"
  keyMessage: string;     // phrase clé résumant l'enjeu
  iconLabel: string;      // label court pour picto/chip
}

export const SECTION_NARRATIVES: Record<string, SectionNarrative> = {
  B1: {
    intro: `Cette section présente les informations générales de l'entreprise qui constituent le socle de la déclaration de durabilité. Ces données permettent de contextualiser l'ensemble des indicateurs ESG rapportés et d'assurer la comparabilité avec d'autres organisations du même secteur.`,
    methodology: `Les données sont issues des systèmes d'information RH (effectifs ETP), de la comptabilité générale (chiffre d'affaires, total bilan) et du registre des activités (codes NACE). Les effectifs sont comptabilisés en Équivalent Temps Plein (ETP) à la date de clôture de l'exercice.`,
    context: `Conformément au standard VSME de l'EFRAG, les informations générales sont obligatoires pour toutes les entreprises soumises à l'obligation de reporting extra-financier. Elles servent de base au calcul des indicateurs d'intensité (par employé, par M€ de chiffre d'affaires).`,
    esrsRef: 'ESRS 2 (BP-1, BP-2)',
    keyMessage: 'Données fondamentales de l\'entreprise',
    iconLabel: 'Général',
  },
  B2: {
    intro: `Le changement climatique représente un enjeu stratégique majeur pour les entreprises. Cette section évalue les engagements de l'organisation en matière de réduction des émissions de gaz à effet de serre, ses cibles chiffrées et son exposition aux risques physiques liés au climat.`,
    methodology: `Les engagements et cibles sont documentés à partir des décisions stratégiques formalisées (procès-verbaux de CA, plans stratégiques). L'exposition aux risques physiques est évaluée selon les scénarios climatiques du GIEC (RCP 4.5 et 8.5) appliqués aux zones géographiques d'implantation.`,
    context: `La CSRD et les standards ESRS E1 imposent aux entreprises de déclarer leurs politiques de transition climatique, leurs objectifs de réduction GES et l'analyse de leur exposition aux risques physiques et de transition. Le standard VSME simplifie ces exigences pour les PME non cotées.`,
    esrsRef: 'ESRS E1-1, E1-4, E1-9',
    keyMessage: 'Stratégie et engagements climatiques',
    iconLabel: 'Climat',
  },
  B3: {
    intro: `La gestion de l'énergie est au cœur de la transition écologique. Cette section quantifie la consommation énergétique totale de l'organisation, la part d'énergie renouvelable dans le mix, et les objectifs de réduction. L'intensité énergétique rapportée au chiffre d'affaires permet de mesurer l'efficacité énergétique de l'activité.`,
    methodology: `Les données de consommation sont collectées à partir des factures d'énergie (électricité, gaz, fioul), des relevés de compteurs et des contrats de fourniture d'énergie renouvelable (certificats de garantie d'origine). L'intensité énergétique est calculée en rapportant la consommation totale (MWh) au chiffre d'affaires net (M€).`,
    context: `La directive Efficacité Énergétique (2023/1791) et les ESRS E1-5 requièrent la déclaration de la consommation d'énergie totale, ventilée par source (renouvelable / non renouvelable). Les indicateurs d'intensité sont essentiels pour le benchmarking sectoriel.`,
    esrsRef: 'ESRS E1-5, E1-4',
    keyMessage: 'Consommation et efficacité énergétique',
    iconLabel: 'Énergie',
  },
  B4: {
    intro: `L'eau est une ressource vitale dont la gestion durable est un enjeu croissant dans un contexte de stress hydrique. Cette section quantifie les volumes d'eau prélevés, identifie les prélèvements en zones de stress hydrique et documente les engagements de réduction.`,
    methodology: `Les volumes sont mesurés par les compteurs d'eau des sites. L'identification des zones de stress hydrique s'appuie sur l'outil Aqueduct du World Resources Institute (WRI). Les données sont consolidées au niveau du groupe pour l'exercice fiscal considéré.`,
    context: `Les ESRS E3 (Eau et ressources marines) demandent la déclaration des prélèvements et rejets d'eau, avec une attention particulière aux zones de stress hydrique. La raréfaction de l'eau douce est identifiée par le Forum Économique Mondial comme l'un des risques globaux majeurs.`,
    esrsRef: 'ESRS E3-4, E3-2',
    keyMessage: 'Gestion et préservation des ressources en eau',
    iconLabel: 'Eau',
  },
  B5: {
    intro: `La gestion des déchets est un pilier de l'économie circulaire. Cette section quantifie les déchets générés par l'activité, distingue les déchets dangereux des non dangereux, et mesure le taux de valorisation (recyclage, réutilisation, valorisation énergétique).`,
    methodology: `Les données proviennent des bordereaux de suivi des déchets (BSD) pour les déchets dangereux et des registres de collecte pour les déchets non dangereux. Le taux de valorisation est calculé comme le ratio des déchets recyclés/réutilisés sur le total généré.`,
    context: `La directive cadre Déchets (2008/98/CE révisée) impose une hiérarchie de traitement : prévention, réemploi, recyclage, valorisation, puis élimination. Les ESRS E5 demandent une déclaration détaillée des flux de déchets et des objectifs de réduction.`,
    esrsRef: 'ESRS E5-5',
    keyMessage: 'Production et valorisation des déchets',
    iconLabel: 'Déchets',
  },
  B6: {
    intro: `La préservation de la biodiversité et des écosystèmes est devenue un enjeu aussi critique que le changement climatique. Cette section identifie les activités de l'entreprise situées dans ou à proximité de zones protégées et les mesures de protection mises en place.`,
    methodology: `L'identification des zones sensibles est réalisée par croisement des implantations avec les bases de données Natura 2000, ZNIEFF et la liste rouge UICN. Les mesures de protection sont documentées à partir des plans de gestion environnementale des sites.`,
    context: `Le Cadre mondial pour la biodiversité de Kunming-Montréal (COP15) et les ESRS E4 imposent aux entreprises de déclarer leurs impacts sur la biodiversité et les mesures de remédiation. Le règlement européen sur la restauration de la nature (2024) renforce ces obligations.`,
    esrsRef: 'ESRS E4-5, E4-4',
    keyMessage: 'Protection de la biodiversité et des écosystèmes',
    iconLabel: 'Biodiversité',
  },
  B7: {
    intro: `Les émissions de gaz à effet de serre (GES) constituent l'indicateur environnemental le plus scruté par les investisseurs, régulateurs et parties prenantes. Cette section détaille les émissions Scope 1 (directes), Scope 2 (indirectes liées à l'énergie) et l'intensité carbone de l'activité.`,
    methodology: `Les émissions Scope 1 sont calculées selon la méthode du GHG Protocol à partir des consommations de combustibles fossiles et des facteurs d'émission de l'ADEME (Base Carbone). Les émissions Scope 2 sont déclarées selon les deux approches : market-based (contrats d'énergie) et location-based (mix réseau). L'intensité est rapportée au chiffre d'affaires net.`,
    context: `L'Accord de Paris (2015), la Taxonomie européenne et les ESRS E1-6 exigent la déclaration des émissions GES Scope 1 et 2, avec un encouragement au Scope 3 pour les entreprises significatives. L'objectif collectif est la neutralité carbone en 2050.`,
    esrsRef: 'ESRS E1-6',
    keyMessage: 'Bilan carbone : émissions directes et indirectes',
    iconLabel: 'GES',
  },
  B8: {
    intro: `Le capital humain est l'actif le plus précieux de toute organisation. Cette section présente les indicateurs sociaux clés : effectifs, diversité de genre, équité salariale, formation, santé-sécurité et couverture par convention collective. Ces données reflètent les conditions de travail et l'engagement social de l'entreprise.`,
    methodology: `Les données sont extraites du SIRH (effectifs, genre, formation), du bilan social (accidents du travail) et de la DSN (déclarations sociales). Le taux de fréquence des accidents (TF) est calculé selon la formule : (nombre d'accidents avec arrêt × 1 000 000) / nombre d'heures travaillées. L'écart de rémunération F/H est mesuré selon la méthodologie de l'index Égalité.`,
    context: `La directive CSRD et les ESRS S1 (Main-d'œuvre propre) imposent une déclaration détaillée des indicateurs sociaux. En France, l'index Égalité professionnelle et le Document Unique d'Évaluation des Risques Professionnels (DUERP) encadrent ces obligations.`,
    esrsRef: 'ESRS S1-6, S1-13, S1-14, S1-16',
    keyMessage: 'Conditions de travail, diversité et bien-être des collaborateurs',
    iconLabel: 'Social',
  },
  B9: {
    intro: `La responsabilité de l'entreprise s'étend au-delà de ses murs, à travers sa chaîne d'approvisionnement. Cette section évalue les politiques de diligence raisonnable en matière de droits humains, l'évaluation ESG des fournisseurs et les incidents signalés.`,
    methodology: `Les données sont collectées via les questionnaires d'évaluation fournisseurs (EcoVadis, audits internes), le registre des incidents et plaintes, et les revues de conformité à la loi sur le devoir de vigilance. Le taux de couverture représente le pourcentage de fournisseurs stratégiques (top 80% des achats) ayant fait l'objet d'une évaluation ESG.`,
    context: `La loi française sur le devoir de vigilance (2017), la directive CS3D européenne (2024) et les ESRS S2 (Travailleurs de la chaîne de valeur) imposent une vigilance sur les impacts sociaux et environnementaux tout au long de la chaîne de valeur.`,
    esrsRef: 'ESRS S2-1, S2-4, S2-5',
    keyMessage: 'Responsabilité sociale dans la chaîne d\'approvisionnement',
    iconLabel: 'Supply Chain',
  },
  B10: {
    intro: `La diversité au sein des instances de gouvernance et les politiques d'inclusion constituent des leviers essentiels de performance et de résilience. Cette section mesure la représentation féminine aux postes de direction et documente les politiques de diversité et les actions de sensibilisation.`,
    methodology: `Le taux de femmes en postes de direction est calculé sur la base de l'organigramme au 31/12. La politique D&I est évaluée sur la base des documents formalisés (charte, plan d'action). Les formations sont comptabilisées à partir du plan de développement des compétences.`,
    context: `La loi Rixain (2021) impose un quota de 30% puis 40% de femmes dans les instances dirigeantes des grandes entreprises. Les ESRS G1 et les critères ISR intègrent la diversité comme facteur de gouvernance. L'ODD 5 (Égalité des sexes) guide les engagements internationaux.`,
    esrsRef: 'ESRS G1-1',
    keyMessage: 'Diversité, équité et inclusion dans la gouvernance',
    iconLabel: 'Diversité',
  },
  B11: {
    intro: `Une gouvernance solide et éthique est le fondement de la confiance des parties prenantes. Cette section évalue les dispositifs anti-corruption, la protection des données, les certifications obtenues et l'organisation de la fonction ESG au sein de l'entreprise.`,
    methodology: `Les données proviennent du registre des incidents, du référent éthique, du DPO (protection des données) et des services qualité (certifications). Les heures de formation sont comptabilisées à partir du plan de formation compliance.`,
    context: `La loi Sapin II (2016), le RGPD (2018) et les ESRS G1 (Conduite des affaires) imposent des dispositifs anti-corruption, de protection des lanceurs d'alerte et de protection des données personnelles. La gouvernance ESG est un critère clé des agences de notation extra-financière.`,
    esrsRef: 'ESRS G1-1, G1-3, G1-4, G1-5',
    keyMessage: 'Éthique, conformité et gouvernance responsable',
    iconLabel: 'Gouvernance',
  },
};

// ==================== REPORT SECTIONS TEXT ====================

export const REPORT_INTRO_TEXT = `Le présent rapport constitue la déclaration de durabilité de l'organisation, établie conformément au référentiel VSME (Voluntary SME Standard) publié par l'EFRAG. Ce standard, spécifiquement conçu pour les petites et moyennes entreprises non cotées, permet de structurer et communiquer de manière transparente les informations environnementales, sociales et de gouvernance (ESG).

Ce document couvre les données quantitatives et qualitatives collectées sur la période de référence. Il s'articule autour des trois piliers du développement durable : l'Environnement (E), le Social (S) et la Gouvernance (G). Pour chaque thématique, les indicateurs clés sont présentés avec leur méthodologie de calcul, leur statut de collecte et les preuves documentaires associées.`;

export const METHODOLOGY_INTRO = `La collecte des données ESG suit une approche structurée et documentée. Les indicateurs quantitatifs sont issus des systèmes d'information de l'entreprise (comptabilité, RH, environnement) et des données de gestion opérationnelle. Les indicateurs qualitatifs et narratifs sont documentés par les référents métier et validés par le comité ESG.

Le périmètre de reporting couvre l'ensemble des entités consolidées en intégration globale. Sauf mention contraire, les données sont rapportées sur une base annuelle correspondant à l'exercice fiscal. Les facteurs d'émission utilisés sont ceux de la Base Carbone de l'ADEME (version la plus récente disponible).`;

export const SCOPE_TEXT = `Ce rapport s'inscrit dans le cadre du Module B (indicateurs de base) du standard VSME de l'EFRAG. Le Module B comprend 47 datapoints organisés en 11 sections thématiques couvrant les informations générales, les enjeux environnementaux (énergie, eau, déchets, biodiversité, GES), les enjeux sociaux (main-d'œuvre, chaîne d'approvisionnement) et la gouvernance (diversité, éthique, conformité).

Chaque datapoint est classé comme « obligatoire » ou « recommandé » selon les exigences du référentiel. Le niveau de complétude de chaque section est mesuré et présenté dans ce rapport.`;

export const LIMITATIONS_TEXT = `Les données présentées dans ce rapport reflètent l'état de la collecte à la date de génération. Certains indicateurs peuvent être en cours de validation ou en attente de données complémentaires. Les indicateurs calculés (intensités, ratios) dépendent de la disponibilité des données sous-jacentes.

Pour les indicateurs qualitatifs et narratifs, l'évaluation repose sur l'auto-déclaration documentée de l'entreprise. Une vérification par un tiers indépendant est recommandée dans le cadre d'un audit formel.`;

// ==================== GLOSSARY ====================

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export const ESG_GLOSSARY: GlossaryTerm[] = [
  { term: 'CSRD', definition: 'Corporate Sustainability Reporting Directive — directive européenne (2022/2464) imposant le reporting de durabilité aux entreprises.' },
  { term: 'ESRS', definition: 'European Sustainability Reporting Standards — normes européennes de reporting de durabilité, développées par l\'EFRAG.' },
  { term: 'VSME', definition: 'Voluntary SME Standard — standard simplifié de reporting ESG pour les PME non cotées, publié par l\'EFRAG.' },
  { term: 'EFRAG', definition: 'European Financial Reporting Advisory Group — organisme technique qui développe les standards ESRS.' },
  { term: 'ESG', definition: 'Environnement, Social et Gouvernance — les trois piliers du développement durable en finance et reporting.' },
  { term: 'GES / GHG', definition: 'Gaz à Effet de Serre / Greenhouse Gas — gaz contribuant au réchauffement climatique (CO₂, CH₄, N₂O, etc.).' },
  { term: 'Scope 1', definition: 'Émissions directes de GES provenant de sources possédées ou contrôlées par l\'entreprise (combustion, procédés).' },
  { term: 'Scope 2', definition: 'Émissions indirectes liées à l\'énergie achetée (électricité, chaleur, vapeur). Deux méthodes : market-based et location-based.' },
  { term: 'Scope 3', definition: 'Autres émissions indirectes (chaîne de valeur amont et aval) : achats, transport, déplacements, usage des produits, fin de vie.' },
  { term: 'ETP / FTE', definition: 'Équivalent Temps Plein / Full-Time Equivalent — unité de mesure des effectifs rapportée au temps complet.' },
  { term: 'TF', definition: 'Taux de Fréquence des accidents du travail : (nombre d\'AT avec arrêt × 1 000 000) / heures travaillées.' },
  { term: 'TG', definition: 'Taux de Gravité des accidents du travail : (nombre de jours d\'arrêt × 1 000) / heures travaillées.' },
  { term: 'Double matérialité', definition: 'Approche d\'analyse qui considère à la fois l\'impact de l\'entreprise sur son environnement et l\'impact de l\'environnement sur l\'entreprise.' },
  { term: 'NACE', definition: 'Nomenclature statistique des activités économiques dans la Communauté européenne — classification sectorielle de l\'UE.' },
  { term: 'GHG Protocol', definition: 'Protocole international de quantification et reporting des émissions de GES, développé par le WRI et le WBCSD.' },
  { term: 'Taxonomie européenne', definition: 'Règlement (UE) 2020/852 définissant les activités économiques durables sur le plan environnemental.' },
  { term: 'DPEF', definition: 'Déclaration de Performance Extra-Financière — obligation française de reporting ESG (remplacée par la CSRD).' },
  { term: 'ISR', definition: 'Investissement Socialement Responsable — stratégie d\'investissement intégrant les critères ESG.' },
  { term: 'ODD / SDG', definition: 'Objectifs de Développement Durable / Sustainable Development Goals — 17 objectifs adoptés par l\'ONU en 2015.' },
];

// ==================== RECOMMENDATIONS TEMPLATES ====================

export interface RecommendationTemplate {
  condition: string;         // description de la condition
  threshold: number;         // seuil (% completion)
  direction: 'below' | 'above';
  category?: string;         // E, S, G ou null pour global
  text: string;
}

export const RECOMMENDATION_TEMPLATES: RecommendationTemplate[] = [
  // Global
  { condition: 'score_global_low', threshold: 50, direction: 'below', text: 'Le niveau de complétude global est insuffisant. Il est recommandé de prioriser la collecte des indicateurs obligatoires avant d\'aborder les indicateurs recommandés.' },
  { condition: 'score_global_medium', threshold: 70, direction: 'below', text: 'Des progrès significatifs ont été réalisés. Concentrer les efforts sur les sections présentant les écarts les plus importants pour atteindre un niveau de complétude satisfaisant.' },
  { condition: 'score_global_high', threshold: 90, direction: 'above', text: 'Le niveau de complétude est excellent. Maintenir la qualité de la collecte et préparer la documentation pour une éventuelle vérification par un tiers indépendant.' },
  // Environnement
  { condition: 'env_low', threshold: 60, direction: 'below', category: 'E', text: 'Les données environnementales sont insuffisantes. Prioriser la collecte des consommations d\'énergie (B3), des émissions GES (B7) et des volumes de déchets (B5), qui constituent le socle du reporting environnemental.' },
  // Social
  { condition: 'social_low', threshold: 60, direction: 'below', category: 'S', text: 'Les indicateurs sociaux nécessitent un renforcement. S\'assurer que les données RH (effectifs, diversité, accidents du travail) sont à jour et documentées. La mise en place d\'un processus d\'évaluation des fournisseurs est recommandée.' },
  // Gouvernance
  { condition: 'gov_low', threshold: 60, direction: 'below', category: 'G', text: 'La gouvernance ESG doit être renforcée. Formaliser la politique anti-corruption, désigner un responsable ESG et documenter les dispositifs de conformité (RGPD, éthique).' },
  // Preuves
  { condition: 'evidence_gap', threshold: 0, direction: 'below', text: 'Attacher des preuves documentaires (factures, rapports, attestations) à chaque indicateur déclaré pour renforcer la crédibilité du reporting et faciliter un éventuel audit.' },
];

// ==================== PILLAR SUMMARIES ====================

export const PILLAR_DESCRIPTIONS: Record<string, { title: string; description: string; scope: string }> = {
  E: {
    title: 'Pilier Environnement',
    description: 'Le pilier environnemental couvre les impacts de l\'organisation sur le milieu naturel : consommation d\'énergie, émissions de gaz à effet de serre, gestion de l\'eau, production de déchets et préservation de la biodiversité. Ces indicateurs sont essentiels pour évaluer la trajectoire de décarbonation et la gestion des ressources naturelles.',
    scope: 'Sections B2 à B7 : Climat, Énergie & GES, Eau, Déchets, Biodiversité, Émissions GES',
  },
  S: {
    title: 'Pilier Social',
    description: 'Le pilier social évalue les pratiques de l\'organisation en matière de gestion des ressources humaines, de conditions de travail, de santé-sécurité, de diversité et d\'engagement avec les parties prenantes. Il reflète la responsabilité sociale de l\'entreprise envers ses collaborateurs et sa chaîne de valeur.',
    scope: 'Sections B8 à B9 : Main-d\'œuvre & Conditions de travail, Chaîne d\'approvisionnement & Droits humains',
  },
  G: {
    title: 'Pilier Gouvernance',
    description: 'Le pilier gouvernance mesure la qualité des pratiques de direction, l\'éthique des affaires, la diversité au sein des organes de décision et les dispositifs de conformité. Une gouvernance solide est le fondement d\'une stratégie ESG crédible et pérenne.',
    scope: 'Sections B10 à B11 : Diversité & Inclusion, Gouvernance & Conduite des affaires',
  },
};
