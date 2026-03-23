/**
 * EXCEL TEMPLATES GENERATOR — VSME Native, stylisé avec ExcelJS
 * Templates alignés sur le référentiel VSME (EFRAG — PME non cotées)
 *
 * Chaque template génère un fichier .xlsx avec :
 *   - Feuille 1 "Données VSME" : questions en français clair, couleurs par pilier
 *   - Feuille 2 "Instructions"  : guide de saisie étape par étape
 *
 * L'ImportCenter détecte automatiquement le format via la colonne "Code VSME"
 * et écrit directement dans IndexedDB (vsme_values) sans mapping manuel.
 */

import ExcelJS from 'exceljs';
import { MODULE_B, MODULE_C, type SectionVSME } from '@/data/vsme-data';

// ─── Colonnes standardisées ────────────────────────────────────────────────────
// IMPORTANT : ces noms sont détectés automatiquement par ImportCenter.tsx
// Ne pas les modifier sans mettre à jour la détection côté import.
export const VSME_COL = {
  CODE:        'Code VSME',       // ← clé IDB (B3.1, B7.2…) — NE PAS MODIFIER
  SECTION:     'Section',
  INTITULE:    'Intitulé',
  PILIER:      'Pilier',
  TYPE:        'Type',
  UNITE:       'Unité',
  OBLIGATOIRE: 'Obligatoire',
  VALEUR:      'Valeur à saisir', // ← colonne à compléter — NE PAS MODIFIER
  COMMENTAIRE: 'Commentaire',
} as const;

// ─── Interface ─────────────────────────────────────────────────────────────────
export interface TemplateConfig {
  templateName: string;
  category: 'E' | 'S' | 'G';
  instructions: string;
  vsmeSections: SectionVSME[];
  dpCodes?: string[];
}

// ─── Palette de couleurs Solvid.IA ────────────────────────────────────────────
const C = {
  darkGreen:    '0F4C3A',  // fond bannière
  accentGreen:  '059669',  // titre template (vert vif)
  headerBg:     '134E38',  // fond en-têtes colonnes
  answerHeader: 'A16207',  // en-tête colonne réponse (ambre foncé)
  // Fond lignes par pilier
  rowE:         'DCFCE7',  // Environnement — vert pâle
  rowS:         'DBEAFE',  // Social — bleu pâle
  rowG:         'EDE9FE',  // Gouvernance — violet pâle
  rowGeneral:   'F3F4F6',  // Général — gris
  // Colonne réponse
  answerBg:     'FEF9C3',  // jaune doux
  answerBorder: 'FCD34D',  // ambre
  // Textes
  white:        'FFFFFF',
  dark:         '1F2937',
  muted:        '6B7280',
  mandatory:    'DC2626',  // rouge — champs obligatoires
  // Bordures
  border:       'E5E7EB',
  // Bloc instructions
  instrBg:      'F0FDF4',
  instrBorder:  '86EFAC',
  instrText:    '14532D',
} as const;

// ─── Questions en français simple + exemples ───────────────────────────────────
const FRIENDLY_LABELS: Record<string, { question: string; exemple: string }> = {
  // ── B1 — Informations générales ──────────────────────────────────────────────
  'B1.1': { question: "Combien d'employés travaillent dans votre entreprise (équivalent temps plein) ?", exemple: '42' },
  'B1.2': { question: "Quel est votre chiffre d'affaires annuel net ?", exemple: '2 500 000 €' },
  'B1.3': { question: "Quel est votre total bilan / actif total ?", exemple: '1 800 000 €' },
  'B1.4': { question: "Dans quel(s) secteur(s) exercez-vous votre activité principale ? (code NACE)", exemple: '62.01 – Développement logiciel' },
  // ── B2 — Engagements climatiques ──────────────────────────────────────────────
  'B2.1': { question: "Avez-vous pris un engagement formel pour réduire vos émissions de CO₂ ?", exemple: "Oui — objectif -30 % d'ici 2030, validé en CA" },
  'B2.2': { question: "Quelle est votre cible de réduction des émissions de CO₂ (en %) ?", exemple: '30' },
  'B2.3': { question: "Votre entreprise est-elle exposée à des risques climatiques (inondations, chaleur extrême, sécheresse...) ?", exemple: "Exposition modérée aux vagues de chaleur, impact productivité" },
  // ── B3 — Énergie ─────────────────────────────────────────────────────────────
  'B3.1': { question: "Quelle quantité totale d'énergie avez-vous consommée cette année (électricité + gaz + fioul) ?", exemple: '450 MWh' },
  'B3.2': { question: "Quelle part de cette énergie provient de sources renouvelables (panneaux solaires, contrat énergie verte...) ?", exemple: '120 MWh' },
  'B3.5': { question: "Avez-vous un objectif de réduction de votre consommation d'énergie ?", exemple: "Réduction 15 % d'ici 2026 grâce à l'isolation des locaux" },
  // ── B4 — Eau ─────────────────────────────────────────────────────────────────
  'B4.1': { question: "Combien de m³ d'eau avez-vous consommés au total cette année ?", exemple: '1 250 m³' },
  'B4.2': { question: "Quelle part de cette eau provient de zones géographiques en manque d'eau (stress hydrique) ?", exemple: '0 m³ (pas de zone concernée)' },
  'B4.3': { question: "Avez-vous un engagement ou un objectif de réduction de votre consommation d'eau ?", exemple: "Installation récupérateurs d'eau de pluie prévue en 2025" },
  // ── B5 — Déchets ─────────────────────────────────────────────────────────────
  'B5.1': { question: "Quelle quantité totale de déchets avez-vous générée cette année ?", exemple: '12,5 tonnes' },
  'B5.2': { question: "Dont déchets dangereux (produits chimiques, DEEE, piles, solvants...) ?", exemple: '0,8 tonnes' },
  'B5.3': { question: "Dont déchets valorisés (recyclés ou réutilisés) ?", exemple: '9,2 tonnes' },
  // ── B6 — Biodiversité ────────────────────────────────────────────────────────
  'B6.1': { question: "Vos locaux ou activités sont-ils situés dans ou à proximité de zones naturelles protégées ?", exemple: "Non — locaux en zone industrielle urbaine" },
  'B6.2': { question: "Quelles mesures concrètes prenez-vous pour protéger la biodiversité ?", exemple: "Toiture végétalisée + haie champêtre plantée en 2024" },
  // ── B7 — Émissions GES ───────────────────────────────────────────────────────
  'B7.1': { question: "Émissions directes de CO₂ de vos véhicules de flotte et équipements (Scope 1), en tCO₂e ?", exemple: '85 tCO₂e' },
  'B7.2': { question: "Émissions CO₂ de votre électricité achetée — méthode contrat énergie verte (Scope 2 market-based), en tCO₂e ?", exemple: '42 tCO₂e' },
  'B7.3': { question: "Émissions CO₂ de votre électricité achetée — méthode mix réseau national (Scope 2 location-based), en tCO₂e ?", exemple: '68 tCO₂e' },
  // ── B8 — Main d'œuvre ────────────────────────────────────────────────────────
  'B8.1': { question: "Quel est votre effectif total en équivalent temps plein (ETP) ?", exemple: '38 ETP' },
  'B8.2': { question: "Quel pourcentage de votre effectif est composé de femmes ?", exemple: '45 %' },
  'B8.3': { question: "Quel est l'écart de rémunération entre les femmes et les hommes dans votre entreprise ? (valeur négative = femmes moins payées)", exemple: '-8 %' },
  'B8.5': { question: "Combien de jours de formation chaque employé a-t-il reçu en moyenne cette année ?", exemple: '2,5 jours/ETP' },
  'B8.6': { question: "Quel est votre taux de fréquence des accidents du travail ? (nb accidents × 1 000 000 ÷ heures travaillées)", exemple: '4,2' },
  'B8.7': { question: "Quel est votre taux de gravité des accidents du travail ? (jours perdus × 1 000 ÷ heures travaillées)", exemple: '0,15' },
  'B8.8': { question: "Quel pourcentage de vos employés est couvert par une convention collective ?", exemple: '100 %' },
  // ── B9 — Chaîne d'approvisionnement & droits humains ─────────────────────────
  'B9.1': { question: "Avez-vous une politique formelle sur les droits humains dans votre chaîne d'approvisionnement ?", exemple: "Oui — Charte fournisseurs signée depuis 2023" },
  'B9.2': { question: "Évaluez-vous vos fournisseurs sur des critères sociaux et environnementaux ?", exemple: "Oui — Questionnaire ESG envoyé aux 10 principaux fournisseurs" },
  'B9.3': { question: "Combien d'incidents liés aux droits humains ont été signalés chez vos fournisseurs cette année ?", exemple: '0' },
  'B9.4': { question: "Quel pourcentage de vos fournisseurs a été évalué sur des critères sociaux ?", exemple: '30 %' },
  // ── B10 — Diversité & Inclusion ───────────────────────────────────────────────
  'B10.1': { question: "Quel pourcentage des postes de direction ou du conseil d'administration est occupé par des femmes ?", exemple: '33 %' },
  'B10.2': { question: "Avez-vous une politique de diversité et d'inclusion formalisée (charte, procédure...) ?", exemple: "Oui — Charte diversité signée et affichée dans tous les locaux" },
  'B10.3': { question: "Proposez-vous des formations de sensibilisation à la non-discrimination à vos managers ?", exemple: "Oui — Formation 2h obligatoire pour tous les managers" },
  // ── B11 — Gouvernance & Conduite des affaires ─────────────────────────────────
  'B11.1': { question: "Avez-vous une politique anti-corruption formalisée (code éthique, procédure de signalement...) ?", exemple: "Oui — Code éthique disponible sur l'intranet depuis 2022" },
  'B11.2': { question: "Combien d'incidents de corruption ou de fraude ont été signalés cette année ?", exemple: '0' },
  'B11.3': { question: "Disposez-vous d'une politique de protection des données personnelles conforme au RGPD ?", exemple: "Oui — DPO nommé, registre des traitements à jour" },
  'B11.4': { question: "Quelles certifications ou normes votre entreprise détient-elle actuellement (ISO 9001, 14001, 26000...) ?", exemple: "ISO 9001:2015 — certifié depuis 2021" },
  'B11.5': { question: "Avez-vous nommé un responsable ESG ou créé un comité dédié à la durabilité ?", exemple: "Oui — Référent RSE : Marie Dupont (DRH), depuis janv. 2024" },
  'B11.6': { question: "Combien d'heures de formation à l'éthique et à la conformité ont été dispensées cette année ?", exemple: '48 h/an' },
  // ── C1 — Stratégie & Modèle d'affaires ───────────────────────────────────────
  'C1.1': { question: "Décrivez votre modèle d'affaires et votre chaîne de valeur principale", exemple: "Éditeur de logiciels SaaS — conception en France, distribution Europe" },
  'C1.2': { question: "Quels sont vos principaux impacts, risques et opportunités ESG identifiés ?", exemple: "Impact : consommation serveurs. Risque : hausse coûts énergie. Opportunité : offre verte" },
  'C1.3': { question: "Avez-vous réalisé une analyse de double matérialité (impacts et risques financiers) ?", exemple: "En cours — résultats attendus T2 2025 avec cabinet conseil" },
  'C1.4': { question: "Quels engagements avez-vous pris envers vos parties prenantes (clients, salariés, investisseurs...) ?", exemple: "Rapport ESG annuel publié, dialogue salarié mensuel en CSST" },
  // ── C2 — Politique et plans climatiques ──────────────────────────────────────
  'C2.1': { question: "Décrivez votre politique de transition vers un modèle bas-carbone", exemple: "Plan de mobilité durable adopté en 2024 — vélos élec, covoiturage" },
  'C2.2': { question: "Quel est votre plan d'action de réduction des GES à horizon 2030 ou 2050 ?", exemple: "Réduction 40 % Scope 1+2 d'ici 2030 via électrification flotte + EnR" },
  'C2.3': { question: "Quel montant avez-vous investi dans la transition climatique cette année ?", exemple: '45 000 €' },
  'C2.4': { question: "Estimation de vos émissions Scope 3 (achats fournisseurs, transport, déplacements pro...) ?", exemple: '320 tCO₂e' },
  // ── C3 — Pollution ────────────────────────────────────────────────────────────
  'C3.1': { question: "Émissions de polluants atmosphériques (NOₓ, SOₓ, particules fines...) en tonnes ?", exemple: '0,5 tonnes' },
  'C3.2': { question: "Utilisez-vous ou rejetez-vous des substances chimiques préoccupantes dans votre activité ?", exemple: "Solvants utilisés en peinture — plan de substitution 2025" },
  'C3.3': { question: "Avez-vous un plan de réduction de vos émissions polluantes ?", exemple: "Passage aux peintures à base d'eau d'ici fin 2025" },
  // ── C4 — Politique eau ────────────────────────────────────────────────────────
  'C4.1': { question: "Décrivez votre politique de gestion et de réduction de la consommation d'eau", exemple: "Détecteurs de fuites installés + robinets temporisés dans les sanitaires" },
  'C4.2': { question: "Avez-vous des mesures spécifiques pour réduire votre impact sur les ressources en eau ?", exemple: "Recyclage de l'eau de process en boucle fermée depuis 2023" },
  // ── C5 — Biodiversité politique ───────────────────────────────────────────────
  'C5.1': { question: "Avez-vous une politique formelle de protection de la biodiversité ?", exemple: "Non — bilan biodiversité à réaliser en 2025 avec prestataire" },
  'C5.2': { question: "Avez-vous réalisé un inventaire de vos impacts sur les écosystèmes ?", exemple: "En cours avec cabinet spécialisé — résultats T3 2025" },
  // ── C6 — Économie circulaire ──────────────────────────────────────────────────
  'C6.1': { question: "Avez-vous une politique de réduction des déchets ou d'économie circulaire ?", exemple: "Objectif zéro plastique à usage unique atteint en 2024" },
  'C6.2': { question: "Utilisez-vous des matériaux recyclés dans votre production ou vos emballages ?", exemple: "30 % des emballages en matière recyclée certifiée" },
  // ── C7 — Conditions de travail avancées ───────────────────────────────────────
  'C7.1': { question: "Décrivez votre politique de conditions de travail (horaires, télétravail, flexibilité...)", exemple: "Accord télétravail 3 jours/sem — locaux rénovés et climatisés en 2024" },
  'C7.2': { question: "Avez-vous un programme de bien-être au travail (sport, soutien psy, conciergerie...) ?", exemple: "Accès salle sport, soutien psychologique 24h/24, sport d'équipe mensuel" },
  'C7.3': { question: "Décrivez votre politique de développement des compétences et de formation", exemple: "Budget formation 3 % de la masse salariale — parcours certifiants OPCO" },
  'C7.4': { question: "Avez-vous une politique de rémunération équitable formalisée ?", exemple: "Index égalité professionnelle 88/100 — audit salarial annuel avec le CSE" },
  // ── C8 — Communautés locales ──────────────────────────────────────────────────
  'C8.1': { question: "Quelles actions menez-vous envers les communautés locales (emploi local, mécénat, partenariats...) ?", exemple: "Partenariat lycée local — 2 apprentis/an + dons associations sportives" },
  'C8.2': { question: "Avez-vous des programmes de soutien aux populations ou communautés vulnérables ?", exemple: "0,5 % du CA reversé à 3 associations locales d'insertion" },
  // ── C9 — Gouvernance avancée ──────────────────────────────────────────────────
  'C9.1': { question: "Décrivez la structure de gouvernance de votre entreprise (CA, directoire, comités...)", exemple: "Conseil de surveillance + directoire — 2 administrateurs indépendants" },
  'C9.2': { question: "Comment les risques ESG sont-ils intégrés dans votre stratégie et votre gouvernance ?", exemple: "Cartographie des risques annuelle — point trimestriel en COMEX" },
  'C9.3': { question: "Avez-vous un mécanisme d'alerte éthique permettant aux employés de signaler des abus ?", exemple: "Portail de signalement confidentiel opérationnel depuis janvier 2023" },
};

// ─── Fonction helper : appliquer un style de cellule ──────────────────────────
function styleCell(
  cell: ExcelJS.Cell,
  opts: {
    bold?: boolean;
    size?: number;
    fontColor?: string;
    bgColor?: string;
    italic?: boolean;
    alignH?: ExcelJS.Alignment['horizontal'];
    wrap?: boolean;
  }
) {
  cell.font = {
    name: 'Calibri',
    size: opts.size ?? 10,
    bold: opts.bold,
    italic: opts.italic,
    color: opts.fontColor ? { argb: 'FF' + opts.fontColor } : undefined,
  };
  if (opts.bgColor) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + opts.bgColor } };
  }
  cell.alignment = {
    vertical: 'middle',
    horizontal: opts.alignH,
    wrapText: opts.wrap,
  };
}

// ─── Génération et téléchargement (async avec ExcelJS) ────────────────────────
export async function downloadExcelTemplate(config: TemplateConfig): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Solvid.IA';
  wb.created = new Date();

  // ══════════════════════════════════════════════════════════════════════════════
  // FEUILLE 1 : Données VSME (DOIT être en premier pour l'import auto)
  // ══════════════════════════════════════════════════════════════════════════════
  const ws = wb.addWorksheet('Données VSME', {
    views: [{ state: 'frozen', ySplit: 7 }],
    properties: { tabColor: { argb: 'FF' + C.darkGreen } },
  });

  // ─── Colonnes : disposition pratique ─────────────────────────────────────────
  // A: Code  |  B: Question + exemple intégré  |  C: ✏️ VOTRE RÉPONSE (jaune)  |  D: Unité  |  E: Commentaire
  // La réponse est EN FACE de la question pour un remplissage naturel
  ws.columns = [
    { width: 13 },   // A — Code VSME
    { width: 54 },   // B — Question (+ exemple intégré en dessous)
    { width: 36 },   // C — Valeur à saisir (JAUNE) — juste à droite de la question
    { width: 13 },   // D — Unité
    { width: 42 },   // E — Commentaire (optionnel)
  ];

  const NB_COLS = 5;
  const mergeRange = (r: number) => `A${r}:E${r}`;

  // ── Ligne 1 : Bannière principale ────────────────────────────────────────────
  {
    const row = ws.addRow(['SOLVID.IA  ·  Modèle de collecte VSME', '', '', '', '']);
    row.height = 46;
    ws.mergeCells(mergeRange(1));
    const cell = row.getCell(1);
    cell.value = 'SOLVID.IA  ·  Modèle de collecte VSME';
    styleCell(cell, { bold: true, size: 18, fontColor: C.white, bgColor: C.darkGreen, alignH: 'center' });
  }

  // ── Ligne 2 : Nom du modèle ─────────────────────────────────────────────────
  {
    const row = ws.addRow(['', '', '', '', '']);
    row.height = 28;
    ws.mergeCells(mergeRange(2));
    const cell = ws.getCell('A2');
    cell.value = config.templateName;
    styleCell(cell, { bold: true, size: 13, fontColor: C.accentGreen, bgColor: 'FAFAFA', alignH: 'center' });
  }

  // ── Ligne 3 : Catégorie + date ───────────────────────────────────────────────
  {
    const catEmoji = config.category === 'E' ? '🌿' : config.category === 'S' ? '👥' : '⚖️';
    const catLabel = config.category === 'E' ? 'Environnement' : config.category === 'S' ? 'Social' : 'Gouvernance';
    const row = ws.addRow(['', '', '', '', '']);
    row.height = 18;
    ws.mergeCells('A3:B3');
    ws.mergeCells('C3:E3');
    const cellL = ws.getCell('A3');
    cellL.value = `${catEmoji} ${catLabel}   |   Référentiel VSME (EFRAG)`;
    styleCell(cellL, { size: 9, fontColor: C.muted, bgColor: 'FAFAFA' });
    const cellR = ws.getCell('C3');
    cellR.value = `Généré le ${new Date().toLocaleDateString('fr-FR')}   —   Réf. : ${new Date().getFullYear() - 1}`;
    styleCell(cellR, { size: 9, fontColor: C.muted, bgColor: 'FAFAFA', alignH: 'right' });
  }

  // ── Ligne 4 : Espacement ─────────────────────────────────────────────────────
  {
    const row = ws.addRow(['', '', '', '', '']);
    row.height = 6;
    ws.mergeCells(mergeRange(4));
    ws.getCell('A4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFAFA' } };
  }

  // ── Ligne 5 : Bloc instructions ───────────────────────────────────────────────
  {
    const row = ws.addRow(['', '', '', '', '']);
    row.height = 46;
    ws.mergeCells(mergeRange(5));
    const cell = ws.getCell('A5');
    cell.value = `📋  ${config.instructions}`;
    styleCell(cell, { size: 10, italic: true, fontColor: C.instrText, bgColor: C.instrBg, wrap: true });
    cell.border = {
      left:   { style: 'medium', color: { argb: 'FF' + C.instrBorder } },
      right:  { style: 'thin',   color: { argb: 'FF' + C.instrBorder } },
      top:    { style: 'thin',   color: { argb: 'FF' + C.instrBorder } },
      bottom: { style: 'thin',   color: { argb: 'FF' + C.instrBorder } },
    };
  }

  // ── Ligne 6 : Espacement avant headers ────────────────────────────────────────
  {
    const row = ws.addRow(['', '', '', '', '']);
    row.height = 8;
    ws.mergeCells(mergeRange(6));
  }

  // ── Ligne 7 : En-têtes de colonnes ───────────────────────────────────────────
  {
    const headerLabels = [
      'Code VSME',       // A — détecté par le parser à l'import
      'Question',        // B
      'Valeur à saisir', // C — détecté par le parser à l'import (JAUNE)
      'Unité',           // D
      'Commentaire',     // E
    ];
    const row = ws.addRow(headerLabels);
    row.height = 30;
    headerLabels.forEach((_, i) => {
      const cell = row.getCell(i + 1);
      const isAnswerCol = i === 2; // col C
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF' + C.white } };
      cell.fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: isAnswerCol ? ('FF' + C.answerHeader) : ('FF' + C.headerBg) },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FF' + C.darkGreen } },
        right:  { style: 'thin',   color: { argb: 'FF475569' } },
      };
    });
  }

  // ── Lignes de données ─────────────────────────────────────────────────────────
  for (const section of config.vsmeSections) {
    const dps = section.datapoints.filter(dp => {
      if (dp.computed) return false;
      if (config.dpCodes) return config.dpCodes.includes(dp.code);
      return true;
    });
    if (dps.length === 0) continue;

    for (const dp of dps) {
      const label = FRIENDLY_LABELS[dp.code];
      const isOblig = dp.obligatoire;

      // Couleur de fond selon le pilier
      const rowBg =
        dp.pilier === 'E' ? C.rowE :
        dp.pilier === 'S' ? C.rowS :
        dp.pilier === 'G' ? C.rowG :
        C.rowGeneral;

      const row = ws.addRow(['', '', '', '', '']);
      // Hauteur auto selon longueur du texte
      const questionLen = (label?.question ?? dp.intitule).length;
      row.height = questionLen > 80 ? 52 : questionLen > 50 ? 44 : 38;

      // Col A — Code VSME (★ = obligatoire)
      const cellA = row.getCell(1);
      cellA.value = isOblig ? `★ ${dp.code}` : dp.code;
      styleCell(cellA, {
        bold: true, size: 10,
        fontColor: isOblig ? C.mandatory : C.darkGreen,
        bgColor: rowBg,
        alignH: 'center',
      });
      cellA.border = {
        bottom: { style: 'thin', color: { argb: 'FF' + C.border } },
        right:  { style: 'thin', color: { argb: 'FF' + C.border } },
      };

      // Col B — Question en français + exemple intégré (richText 2 lignes)
      const cellB = row.getCell(2);
      if (label?.exemple) {
        cellB.value = {
          richText: [
            {
              text: label.question + '\n',
              font: { name: 'Calibri', size: 10, color: { argb: 'FF' + C.dark } },
            },
            {
              text: `  ➜ ex : ${label.exemple}`,
              font: { name: 'Calibri', size: 8, italic: true, color: { argb: 'FF9CA3AF' } },
            },
          ],
        };
      } else {
        cellB.value = label?.question ?? dp.intitule;
        styleCell(cellB, { size: 10, fontColor: C.dark, bgColor: rowBg, wrap: true });
      }
      cellB.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + rowBg } };
      cellB.alignment = { vertical: 'middle', wrapText: true };
      cellB.border = {
        bottom: { style: 'thin',   color: { argb: 'FF' + C.border } },
        right:  { style: 'medium', color: { argb: 'FF' + C.answerBorder } },
      };

      // Col C — Valeur à saisir (JAUNE — juste en face de la question)
      const cellC = row.getCell(3);
      cellC.value = '';
      cellC.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.answerBg } };
      cellC.alignment = { vertical: 'middle', wrapText: true };
      cellC.border = {
        top:    { style: 'thin',   color: { argb: 'FF' + C.answerBorder } },
        bottom: { style: 'thin',   color: { argb: 'FF' + C.answerBorder } },
        left:   { style: 'medium', color: { argb: 'FF' + C.answerBorder } },
        right:  { style: 'medium', color: { argb: 'FF' + C.answerBorder } },
      };

      // Col D — Unité (référence)
      const cellD = row.getCell(4);
      cellD.value = dp.unite ?? '—';
      styleCell(cellD, { size: 9, italic: true, fontColor: C.muted, bgColor: rowBg, alignH: 'center' });
      cellD.border = {
        bottom: { style: 'thin', color: { argb: 'FF' + C.border } },
        right:  { style: 'thin', color: { argb: 'FF' + C.border } },
      };

      // Col E — Commentaire (optionnel)
      const cellE = row.getCell(NB_COLS);
      cellE.value = '';
      cellE.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      cellE.alignment = { vertical: 'middle', wrapText: true };
      cellE.border = {
        bottom: { style: 'thin', color: { argb: 'FF' + C.border } },
      };
    }
  }

  // ── Ligne pied de page ────────────────────────────────────────────────────────
  {
    ws.addRow(['', '', '', '', '']).height = 10;
    const lastRowNum = ws.rowCount + 1;
    ws.addRow(['', '', '', '', '']).height = 18;
    ws.mergeCells(mergeRange(lastRowNum));
    const cell = ws.getCell(`A${lastRowNum}`);
    cell.value = '★ Champs obligatoires   ·   Remplissez la colonne JAUNE "Valeur à saisir" (col C)   ·   Ne modifiez pas les autres colonnes   ·   Importez via Solvid.IA → Import Center';
    styleCell(cell, { size: 8, italic: true, fontColor: C.muted, bgColor: 'F9FAFB', alignH: 'center' });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // FEUILLE 2 : Instructions
  // ══════════════════════════════════════════════════════════════════════════════
  const ws2 = wb.addWorksheet('Instructions', {
    properties: { tabColor: { argb: 'FF059669' } },
  });
  ws2.columns = [{ width: 5 }, { width: 68 }];

  // Header Instructions
  {
    const row = ws2.addRow(['', 'SOLVID.IA — Guide de saisie VSME']);
    row.height = 40;
    ws2.mergeCells('A1:B1');
    const cell = ws2.getCell('A1');
    cell.value = 'SOLVID.IA  ·  Guide de saisie VSME';
    styleCell(cell, { bold: true, size: 16, fontColor: C.white, bgColor: C.darkGreen, alignH: 'center' });
  }

  const catLabel2 = config.category === 'E' ? 'Environnement' : config.category === 'S' ? 'Social' : 'Gouvernance';
  const addInstr = (num: string, text: string, bold = false) => {
    const row = ws2.addRow([num, text]);
    row.height = bold ? 24 : 20;
    const cell = row.getCell(2);
    styleCell(cell, { size: 11, bold, fontColor: bold ? C.dark : '374151', wrap: true });
    if (bold) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
    }
  };

  ws2.addRow([]);
  addInstr('', `Modèle : ${config.templateName}`, true);
  addInstr('', `Catégorie : ${catLabel2}   |   Référentiel : VSME (EFRAG — PME non cotées)`);
  addInstr('', `Généré le : ${new Date().toLocaleDateString('fr-FR')}`);
  ws2.addRow([]);
  addInstr('', '━━━  ÉTAPES POUR REMPLIR CE FICHIER  ━━━', true);
  ws2.addRow([]);
  addInstr('1.', 'Allez sur l\'onglet "Données VSME" (premier onglet à gauche)');
  addInstr('2.', 'La colonne C (jaune) intitulée "Valeur à saisir" est la SEULE colonne à remplir');
  addInstr('3.', 'Elle est placée juste à droite de la question pour un remplissage naturel et rapide');
  addInstr('4.', 'Chaque question affiche en dessous un exemple de réponse (➜ ex : ...) pour vous guider');
  addInstr('5.', 'Pour les champs chiffrés : entrez uniquement le nombre (ex : 450, pas "450 MWh")');
  addInstr('6.', 'Pour les champs descriptifs : rédigez une réponse en texte libre, aussi précise que possible');
  addInstr('7.', 'Les lignes avec ★ sont OBLIGATOIRES selon le référentiel VSME — commencez par celles-là');
  addInstr('8.', 'Laissez la cellule jaune vide si la donnée n\'est pas disponible pour cette année');
  addInstr('9.', 'Utilisez la colonne E "Commentaire" pour noter vos sources, hypothèses ou précisions');
  addInstr('10.', 'Ne modifiez PAS les colonnes A, B, D — cela perturberait la lecture des données à l\'import');
  addInstr('11.', 'Sauvegardez le fichier en conservant le format .xlsx (ne pas exporter en CSV)');
  addInstr('12.', 'Dans Solvid.IA → Import Center → Cliquez "Importer" → Sélectionnez ce fichier → Validez');
  ws2.addRow([]);
  addInstr('', '━━━  SOURCES CONSEILLÉES PAR INDICATEUR  ━━━', true);
  ws2.addRow([]);
  addInstr('⚡', 'Énergie (B3) : factures EDF/ENGIE, relevés compteurs, attestation contrat énergie verte');
  addInstr('💧', 'Eau (B4) : factures eau municipale, compteurs de process');
  addInstr('🗑️', 'Déchets (B5) : bordereaux de suivi déchets (BSD), prestataires collecte');
  addInstr('🏭', 'GES (B7) : bilan carbone, facteurs ADEME, factures carburant et électricité');
  addInstr('👥', 'Social (B8) : SIRH, bilan social, DADS, registre AT CPAM');
  addInstr('⚖️', 'Gouvernance (B10-11) : index égalité pro., code éthique, DPIA RGPD');
  ws2.addRow([]);
  addInstr('', '━━━  BESOIN D\'AIDE ?  ━━━', true);
  addInstr('', 'Contactez votre consultant Solvid.IA ou consultez le guide officiel VSME sur efrag.org');
  ws2.addRow([]);
  addInstr('', 'Solvid.IA — Plateforme ESG pour les PME   |   www.solvid.ia');

  // ── Téléchargement ────────────────────────────────────────────────────────────
  const safeName = config.templateName.replace(/[\s'"/\\:*?<>|]/g, '_');
  const filename = `Solvid_Template_VSME_${safeName}_${new Date().getFullYear()}.xlsx`;

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── Sections VSME (raccourcis) ───────────────────────────────────────────────
const B1  = MODULE_B.find(s => s.id === 'B1')!;
const B2  = MODULE_B.find(s => s.id === 'B2')!;
const B3  = MODULE_B.find(s => s.id === 'B3')!;
const B4  = MODULE_B.find(s => s.id === 'B4')!;
const B5  = MODULE_B.find(s => s.id === 'B5')!;
const B6  = MODULE_B.find(s => s.id === 'B6')!;
const B7  = MODULE_B.find(s => s.id === 'B7')!;
const B8  = MODULE_B.find(s => s.id === 'B8')!;
const B9  = MODULE_B.find(s => s.id === 'B9')!;
const B10 = MODULE_B.find(s => s.id === 'B10')!;
const B11 = MODULE_B.find(s => s.id === 'B11')!;
const C2  = MODULE_C.find(s => s.id === 'C2')!;
const C7  = MODULE_C.find(s => s.id === 'C7')!;

// ─── Templates prédéfinis ─────────────────────────────────────────────────────

const TMPL_GES_SCOPE1: TemplateConfig = {
  templateName: 'Émissions GES Scope 1',
  category: 'E',
  instructions: 'Renseignez vos émissions directes de CO₂ (Scope 1) : combustion de vos véhicules de flotte et équipements fixes (chaudières, groupes électrogènes). Source recommandée : Bilan GES ou factures carburant avec facteurs ADEME.',
  vsmeSections: [B7],
  dpCodes: ['B7.1'],
};

const TMPL_GES_SCOPE2: TemplateConfig = {
  templateName: 'Émissions GES Scope 2',
  category: 'E',
  instructions: 'Renseignez vos émissions indirectes liées à l\'achat d\'électricité et de chaleur (Scope 2). Deux méthodes : market-based (B7.2 — si vous avez un contrat énergie verte) et location-based (B7.3 — mix réseau national). Source : factures électricité.',
  vsmeSections: [B7],
  dpCodes: ['B7.2', 'B7.3'],
};

const TMPL_GES_SCOPE3: TemplateConfig = {
  templateName: 'Émissions GES Scope 3',
  category: 'E',
  instructions: 'Renseignez vos émissions indirectes de la chaîne de valeur (Scope 3 — C2.4) : achats fournisseurs, transport de marchandises, déplacements professionnels, déchets. Utilisez les catégories GHG Protocol les plus significatives pour votre secteur.',
  vsmeSections: [C2],
  dpCodes: ['C2.4'],
};

const TMPL_GES_ALL: TemplateConfig = {
  templateName: 'Émissions GES',
  category: 'E',
  instructions: 'Modèle GES complet : Scope 1 (combustion directe), Scope 2 market-based et location-based (électricité). Les champs Total (B7.4) et Intensité (B7.5) sont calculés automatiquement lors de l\'import — ne les remplissez pas.',
  vsmeSections: [B7],
};

const TMPL_ENERGIE: TemplateConfig = {
  templateName: 'Consommation d\'Énergie',
  category: 'E',
  instructions: 'Renseignez votre consommation totale d\'énergie en MWh (B3.1 = électricité + gaz + fioul + autre) et la part renouvelable (B3.2 = solaire, énergie verte contractualisée). La part non renouvelable (B3.3) est calculée automatiquement. Source : factures énergétiques.',
  vsmeSections: [B3],
};

const TMPL_EAU: TemplateConfig = {
  templateName: 'Consommation d\'Eau',
  category: 'E',
  instructions: 'Renseignez votre volume total d\'eau prélevée en m³ (B4.1 = eau du réseau + puits + récupération) et la part en zone de stress hydrique (B4.2). Si vous opérez uniquement en France métropolitaine hors Sud-Est, B4.2 = 0. Source : factures eau ou relevés compteurs.',
  vsmeSections: [B4],
};

const TMPL_DECHETS: TemplateConfig = {
  templateName: 'Production de Déchets',
  category: 'E',
  instructions: 'Renseignez vos quantités de déchets en tonnes : total généré (B5.1), dont dangereux (B5.2 — DEEE, chimiques, piles), dont valorisés recyclage ou réutilisation (B5.3). Le taux de valorisation (B5.4) est calculé automatiquement. Source : bordereaux de suivi déchets (BSD).',
  vsmeSections: [B5],
};

const TMPL_BIODIVERSITE: TemplateConfig = {
  templateName: 'Impact biodiversité',
  category: 'E',
  instructions: 'Renseignez vos données d\'impact sur les écosystèmes (B6) : vos locaux ou activités sont-ils proches de zones Natura 2000, parcs naturels ou autres espaces protégés ? Quelles mesures concrètes avez-vous mises en place pour protéger la biodiversité locale ?',
  vsmeSections: [B6],
};

const TMPL_EFFECTIFS: TemplateConfig = {
  templateName: 'Effectifs et Données RH',
  category: 'S',
  instructions: 'Modèle complet Main d\'œuvre VSME (B8) : effectif ETP, répartition par genre, écart salarial F/H, jours de formation, accidents du travail, convention collective. Source : SIRH, bilan social annuel, déclarations CPAM et OPCO.',
  vsmeSections: [B8],
};

const TMPL_FORMATION: TemplateConfig = {
  templateName: 'Formation et Développement',
  category: 'S',
  instructions: 'Renseignez le nombre de jours de formation par employé (B8.5) et votre politique de développement des compétences (C7.3 — texte libre). Source : plan de formation, déclarations OPCO, tableau de bord RH.',
  vsmeSections: [B8, C7],
  dpCodes: ['B8.5', 'C7.3'],
};

const TMPL_SANTE: TemplateConfig = {
  templateName: 'Santé et sécurité au travail',
  category: 'S',
  instructions: 'Renseignez le taux de fréquence des accidents avec arrêt (B8.6 = nb AT × 1 000 000 / heures travaillées) et le taux de gravité (B8.7 = jours perdus × 1 000 / heures travaillées). Source : registre des accidents du travail, déclarations CPAM.',
  vsmeSections: [B8],
  dpCodes: ['B8.6', 'B8.7'],
};

const TMPL_REMUNERATION: TemplateConfig = {
  templateName: 'Rémunération et équité salariale',
  category: 'S',
  instructions: 'Renseignez l\'effectif ETP (B8.1), la proportion de femmes (B8.2), l\'écart de rémunération F/H en % (B8.3 — valeur négative si femmes moins payées) et la couverture convention collective (B8.8). Source : Index égalité professionnelle, DADS, bilan social.',
  vsmeSections: [B8],
  dpCodes: ['B8.1', 'B8.2', 'B8.3', 'B8.8'],
};

const TMPL_DIALOGUE: TemplateConfig = {
  templateName: 'Dialogue social',
  category: 'S',
  instructions: 'Renseignez la couverture convention collective (B8.8) et les indicateurs de votre chaîne d\'approvisionnement (B9) : politique droits humains fournisseurs, processus d\'évaluation ESG, incidents signalés et taux de couverture. Source : contrats fournisseurs, questionnaires ESG.',
  vsmeSections: [B8, B9],
  dpCodes: ['B8.8', 'B9.1', 'B9.2', 'B9.3', 'B9.4'],
};

const TMPL_GOUVERNANCE: TemplateConfig = {
  templateName: 'Gouvernance et Conformité',
  category: 'G',
  instructions: 'Renseignez les indicateurs de diversité en direction (B10 — % femmes aux postes clés, politique D&I) et de gouvernance d\'entreprise (B11 — anti-corruption, RGPD, certifications ISO, responsable ESG). Source : statuts, code éthique, DPO, registre traitements RGPD.',
  vsmeSections: [B10, B11],
};

const TMPL_PLAN_ACTIONS: TemplateConfig = {
  templateName: 'Plan d\'Actions ESG',
  category: 'G',
  instructions: 'Renseignez vos engagements de réduction des GES (B2.1-B2.2), le responsable ESG nommé (B11.5) et les heures de formation éthique (B11.6). Ce modèle couvre la gouvernance ESG et les objectifs stratégiques de votre plan d\'actions développement durable.',
  vsmeSections: [B2, B11],
  dpCodes: ['B2.1', 'B2.2', 'B11.5', 'B11.6'],
};

const TMPL_GENERAL: TemplateConfig = {
  templateName: 'Informations générales',
  category: 'E',
  instructions: 'Renseignez les informations de base de votre entreprise (B1) : effectif en ETP, chiffre d\'affaires net, total bilan et secteurs d\'activité NACE. Ces données servent de base de calcul pour les intensités (GES, énergie) dans les autres indicateurs VSME.',
  vsmeSections: [B1],
};

const TMPL_MODULE_B: TemplateConfig = {
  templateName: 'Module B Complet VSME',
  category: 'E',
  instructions: 'Modèle complet Module B VSME — tous les indicateurs de base (B1 à B11). Idéal pour une première collecte globale ou un audit ESG complet de votre entreprise. Commencez par les champs obligatoires (★), puis complétez les optionnels.',
  vsmeSections: MODULE_B,
};

// ─── Lookup map (tous les noms utilisés dans les composants UI) ────────────────
const TEMPLATE_MAP: Record<string, TemplateConfig> = {
  // GES — Scope 1
  'Émissions GES Scope 1':                       TMPL_GES_SCOPE1,
  'Émissions GES Scope 1 - Combustibles':        TMPL_GES_SCOPE1,
  // GES — Scope 2
  'Émissions GES Scope 2':                       TMPL_GES_SCOPE2,
  'Émissions GES Scope 2 - Électricité':         TMPL_GES_SCOPE2,
  // GES — Scope 3
  'Émissions GES Scope 3':                       TMPL_GES_SCOPE3,
  'Émissions GES Scope 3 - Achats':              TMPL_GES_SCOPE3,
  // GES — Complet
  'Émissions GES':                               TMPL_GES_ALL,
  // Énergie
  'Consommation d\'Énergie':                     TMPL_ENERGIE,
  'Consommations Énergétiques':                  TMPL_ENERGIE,
  // Eau
  'Consommation d\'Eau':                         TMPL_EAU,
  'Consommation et rejets d\'eau':               TMPL_EAU,
  // Déchets
  'Production de Déchets':                       TMPL_DECHETS,
  'Gestion des déchets':                         TMPL_DECHETS,
  // Biodiversité
  'Impact biodiversité':                         TMPL_BIODIVERSITE,
  'Biodiversité':                                TMPL_BIODIVERSITE,
  // Effectifs
  'Effectifs et Données RH':                     TMPL_EFFECTIFS,
  'Effectifs et caractéristiques':               TMPL_EFFECTIFS,
  // Formation
  'Formation et Développement':                  TMPL_FORMATION,
  'Formation et développement':                  TMPL_FORMATION,
  // Santé
  'Santé et sécurité au travail':                TMPL_SANTE,
  // Rémunération
  'Rémunération et équité salariale':            TMPL_REMUNERATION,
  // Dialogue social
  'Dialogue social':                             TMPL_DIALOGUE,
  'Chaîne de valeur et fournisseurs':            TMPL_DIALOGUE,
  // Gouvernance
  'Gouvernance et Conformité':                   TMPL_GOUVERNANCE,
  'Structure de gouvernance':                    TMPL_GOUVERNANCE,
  'Éthique et conformité':                       TMPL_GOUVERNANCE,
  'Cartographie risques ESG':                    TMPL_GOUVERNANCE,
  'Engagement parties prenantes':                TMPL_GOUVERNANCE,
  // Plan actions
  'Plan d\'Actions ESG':                         TMPL_PLAN_ACTIONS,
  'Stratégie et objectifs ESG':                  TMPL_PLAN_ACTIONS,
  // Général
  'Informations générales':                      TMPL_GENERAL,
  // Module B complet
  'Module B Complet VSME':                       TMPL_MODULE_B,
};

// ─── Fonctions publiques ───────────────────────────────────────────────────────

export function getTemplateByName(name: string): TemplateConfig | undefined {
  return TEMPLATE_MAP[name];
}

export function getAllTemplates(): TemplateConfig[] {
  return [
    TMPL_GENERAL,
    TMPL_GES_SCOPE1,
    TMPL_GES_SCOPE2,
    TMPL_GES_SCOPE3,
    TMPL_GES_ALL,
    TMPL_ENERGIE,
    TMPL_EAU,
    TMPL_DECHETS,
    TMPL_BIODIVERSITE,
    TMPL_EFFECTIFS,
    TMPL_FORMATION,
    TMPL_SANTE,
    TMPL_REMUNERATION,
    TMPL_DIALOGUE,
    TMPL_GOUVERNANCE,
    TMPL_PLAN_ACTIONS,
    TMPL_MODULE_B,
  ];
}

export function getTemplateByCategory(category: 'E' | 'S' | 'G', subCategory?: string): TemplateConfig {
  if (category === 'E') {
    if (subCategory?.toLowerCase().includes('énergie')) return TMPL_ENERGIE;
    if (subCategory?.toLowerCase().includes('ges') || subCategory?.toLowerCase().includes('émission')) return TMPL_GES_ALL;
    if (subCategory?.toLowerCase().includes('eau')) return TMPL_EAU;
    if (subCategory?.toLowerCase().includes('déchet')) return TMPL_DECHETS;
    if (subCategory?.toLowerCase().includes('biodiv')) return TMPL_BIODIVERSITE;
    return TMPL_ENERGIE;
  }
  if (category === 'S') {
    if (subCategory?.toLowerCase().includes('formation')) return TMPL_FORMATION;
    if (subCategory?.toLowerCase().includes('santé') || subCategory?.toLowerCase().includes('sécurité')) return TMPL_SANTE;
    if (subCategory?.toLowerCase().includes('rémun')) return TMPL_REMUNERATION;
    if (subCategory?.toLowerCase().includes('dialogue') || subCategory?.toLowerCase().includes('social')) return TMPL_DIALOGUE;
    return TMPL_EFFECTIFS;
  }
  if (subCategory?.toLowerCase().includes('plan') || subCategory?.toLowerCase().includes('stratégie')) return TMPL_PLAN_ACTIONS;
  return TMPL_GOUVERNANCE;
}
