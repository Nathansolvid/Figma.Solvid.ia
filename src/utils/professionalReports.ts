/**
 * PROFESSIONAL REPORTS — Génération de rapports ESG professionnels
 *
 * 3 templates :
 *   1. Standard  — Déclaration de durabilité détaillée (style DPEF/sustainability statement)
 *                  ~20-30 pages avec sections narratives, charts et tableaux par thématique VSME
 *   2. Executive — Dashboard visuel synthétique pour la direction
 *   3. Audit     — Préparation d'audit avec analyse des écarts
 *
 * Toutes les fonctions retournent un Blob PDF pour stockage/téléchargement.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import type {
  ReportPackData,
  ReportOptions,
  ReportChecklistItem,
  ESGCategory,
  VSMESectionData,
} from './reportTypes';
import {
  ESG_CATEGORIES,
  ESG_CATEGORY_NAMES,
  getStatusLabel,
  REQUIREMENT_LABELS,
  getFileTypeLabel,
} from './reportTypes';
import { buildTheme, getScoreColor, getESGColor, hexToRgb } from './reportTheme';
import type { ReportTheme } from './reportTheme';
import {
  checkPageBreak,
  getPageDimensions,
  addCoverHeader,
  addFullPageCover,
  addSectionTitle,
  addCategoryHeader,
  addFootersToAllPages,
  addMetadataBlock,
  sanitizeFileName,
  formatFileSize,
  formatDateFR,
  formatDateLongFR,
  drawTableOfContents,
  addNarrativeParagraph,
  addChapterTitle,
  addInfoBox,
  addESRSBadge,
  addSeparator,
  addKeyMessage,
} from './reportHelpers';
import type { TOCEntry } from './reportHelpers';
import {
  drawPieChart,
  drawProgressBar,
  drawGauge,
  drawBarChart,
  drawHorizontalBars,
  drawMetricCard,
  drawLegend,
  drawStackedBar,
} from './pdfCharts';
import type { PieSegment, BarData, HorizontalBarItem } from './pdfCharts';
import {
  SECTION_NARRATIVES,
  REPORT_INTRO_TEXT,
  METHODOLOGY_INTRO,
  SCOPE_TEXT,
  LIMITATIONS_TEXT,
  PILLAR_DESCRIPTIONS,
  ESG_GLOSSARY,
} from './vsmeNarratives';

// ==================== HELPERS INTERNES ====================

function countByStatus(items: ReportChecklistItem[], status: string): number {
  return items.filter(i => i.status === status).length;
}

function countByCategory(items: ReportChecklistItem[], cat: ESGCategory): number {
  return items.filter(i => i.category === cat).length;
}

function completedCount(items: ReportChecklistItem[]): number {
  return items.filter(i => i.status === 'PROVIDED' || i.status === 'ACCEPTED').length;
}

function categoryCompletion(items: ReportChecklistItem[], cat: ESGCategory): number {
  const catItems = items.filter(i => i.category === cat);
  if (catItems.length === 0) return 0;
  return Math.round((completedCount(catItems) / catItems.length) * 100);
}

function pillarForSection(sectionId: string): ESGCategory {
  // B1 = Général → G, B2-B7 = E, B8-B9 = S, B10-B11 = G
  const n = parseInt(sectionId.replace('B', '').replace('C', ''));
  if (sectionId.startsWith('B')) {
    if (n === 1) return 'G';
    if (n <= 7) return 'E';
    if (n <= 9) return 'S';
    return 'G';
  }
  return 'E';
}

/** Get pillar color for a VSME section */
function getSectionColor(sectionId: string, theme: ReportTheme): string {
  return getESGColor(pillarForSection(sectionId), theme);
}

// ==================== 1. STANDARD REPORT (SUSTAINABILITY STATEMENT) ====================

export async function generateStandardReport(
  data: ReportPackData,
  options: ReportOptions,
): Promise<Blob> {
  const theme = buildTheme(options.brandConfig);
  const doc = new jsPDF();
  const { pack, checklistItems, kpiRequirements, evidences, vsmeSections } = data;
  const dims = getPageDimensions(doc, theme);

  // TOC entries — we'll fill these as we create pages, then go back and render TOC
  const tocEntries: TOCEntry[] = [];
  let currentPage = 1;

  // Helper to track pages for TOC
  function trackPage(title: string, level: number = 0, color?: string) {
    tocEntries.push({ title, pageNumber: doc.getNumberOfPages(), level, color });
  }

  // ═══════════════════════════════════════════════════════════════════
  // PAGE 1 : COUVERTURE
  // ═══════════════════════════════════════════════════════════════════
  addFullPageCover(doc, theme, 'Déclaration de Durabilité', pack.name, [
    `Référentiel : ${pack.templateName}`,
    `Exercice : ${pack.fiscalYear || new Date().getFullYear()}`,
    pack.clientOrg ? `Organisation : ${pack.clientOrg}` : '',
    `Généré le ${formatDateLongFR(new Date().toISOString())}`,
    '',
    `Score de complétude : ${pack.completionScore}%`,
  ].filter(Boolean));

  // ═══════════════════════════════════════════════════════════════════
  // PAGE 2 : TABLE DES MATIÈRES (placeholder — rendered at end)
  // ═══════════════════════════════════════════════════════════════════
  doc.addPage();
  const tocPageNum = doc.getNumberOfPages();
  // We'll render TOC content at the end by going back to this page

  // ═══════════════════════════════════════════════════════════════════
  // CHAPITRE 1 : INTRODUCTION & MÉTHODOLOGIE
  // ═══════════════════════════════════════════════════════════════════
  doc.addPage();
  let y = addChapterTitle(doc, 'Chapitre 1', 'Introduction et Méthodologie', 25, theme);
  trackPage('Introduction et Méthodologie', 0);

  // Introduction narrative
  y = addNarrativeParagraph(doc, REPORT_INTRO_TEXT, y, theme, { fontSize: 9.5, lineHeight: 4.8 });
  y += 5;

  // Scope
  y = addSectionTitle(doc, 'Périmètre du rapport', y, theme);
  y = addNarrativeParagraph(doc, SCOPE_TEXT, y, theme);
  y += 3;

  // Metadata table
  y = checkPageBreak(doc, y, 50);
  autoTable(doc, {
    startY: y,
    head: [['Information', 'Detail']],
    body: [
      ['Référentiel', pack.templateName],
      ['Module', 'Module B — 47 datapoints de base'],
      ['Exercice fiscal', pack.fiscalYear || new Date().getFullYear().toString()],
      ['Organisation', pack.clientOrg || theme.organizationName],
      ['Responsable', pack.owner || 'N/A'],
      ['Date de génération', formatDateLongFR(new Date().toISOString())],
      ['Score de complétude', `${pack.completionScore}%`],
      ['Items obligatoires', `${checklistItems.filter(i => i.requirementLevel === 'MANDATORY').length}`],
      ['Indicateurs renseignés', `${kpiRequirements.filter(k => k.value !== undefined).length} / ${kpiRequirements.length}`],
    ],
    theme: 'striped',
    headStyles: { fillColor: theme.primaryColor, textColor: '#FFFFFF', fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
    margin: { left: dims.margin, right: dims.margin },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Methodology
  y = checkPageBreak(doc, y, 40);
  y = addSectionTitle(doc, 'Méthodologie de collecte', y, theme);
  y = addNarrativeParagraph(doc, METHODOLOGY_INTRO, y, theme);
  y += 3;

  // Limitations
  y = checkPageBreak(doc, y, 30);
  y = addInfoBox(doc, 'Note méthodologique', LIMITATIONS_TEXT, y, theme, {
    accentColor: theme.statusColors.warning,
  });

  // ═══════════════════════════════════════════════════════════════════
  // CHAPITRE 2 : RÉSUMÉ EXÉCUTIF
  // ═══════════════════════════════════════════════════════════════════
  if (options.includeExecutiveSummary) {
    y = addChapterTitle(doc, 'Chapitre 2', 'Résumé Exécutif', 0, theme, { addPageBefore: true });
    trackPage('Résumé Exécutif', 0);

    // Grande jauge de score
    const scoreColor = getScoreColor(pack.completionScore, theme);
    drawGauge(doc, dims.pageWidth / 2, y + 25, 30, pack.completionScore, scoreColor, {
      label: 'Score de Complétude Global',
      valueFontSize: 20,
      labelFontSize: 8,
    });
    y += 55;

    // Score interpretation
    let scoreText = '';
    if (pack.completionScore >= 90) {
      scoreText = `Avec un score de ${pack.completionScore}%, la déclaration de durabilité est quasi-complète. L'organisation est en bonne position pour une vérification externe.`;
    } else if (pack.completionScore >= 70) {
      scoreText = `Avec un score de ${pack.completionScore}%, des progrès significatifs ont été réalisés dans la collecte des données ESG. Certains indicateurs restent à compléter pour atteindre la pleine conformité.`;
    } else if (pack.completionScore >= 50) {
      scoreText = `Avec un score de ${pack.completionScore}%, la collecte est en bonne voie mais des efforts significatifs sont encore nécessaires, notamment sur les indicateurs obligatoires.`;
    } else {
      scoreText = `Avec un score de ${pack.completionScore}%, des actions prioritaires sont requises pour atteindre un niveau de conformité acceptable.`;
    }
    y = addKeyMessage(doc, scoreText, y, theme, scoreColor);
    y += 3;

    // 3 Metric Cards
    const mandatoryItems = checklistItems.filter(i => i.requirementLevel === 'MANDATORY');
    const mandatoryOk = completedCount(mandatoryItems);
    const cardW = (dims.contentWidth - 10) / 3;
    drawMetricCard(doc, dims.margin, y, cardW, 28, {
      label: 'Items Checklist',
      value: `${completedCount(checklistItems)}/${checklistItems.length}`,
      subtext: `${mandatoryOk} obligatoires OK`,
      color: theme.primaryColor,
    });
    drawMetricCard(doc, dims.margin + cardW + 5, y, cardW, 28, {
      label: 'Indicateurs KPI',
      value: `${kpiRequirements.filter(k => k.value !== undefined && k.value !== null).length}/${kpiRequirements.length}`,
      subtext: `${kpiRequirements.filter(k => k.hasEvidence).length} avec preuves`,
      color: theme.esgColors.S,
    });
    drawMetricCard(doc, dims.margin + 2 * (cardW + 5), y, cardW, 28, {
      label: 'Preuves',
      value: `${evidences.length}`,
      subtext: evidences.length > 0
        ? `${formatFileSize(evidences.reduce((s, e) => s + e.fileSize, 0))} total`
        : 'Aucune preuve',
      color: theme.esgColors.G,
    });
    y += 38;

    // Pie chart E/S/G + progress bars
    y = checkPageBreak(doc, y, 65);
    y = addSectionTitle(doc, 'Répartition par pilier E/S/G', y, theme);

    const pieSegments: PieSegment[] = ESG_CATEGORIES.map(cat => ({
      value: countByCategory(checklistItems, cat),
      color: getESGColor(cat, theme),
      label: ESG_CATEGORY_NAMES[cat],
    }));
    drawPieChart(doc, dims.margin + 35, y + 25, 20, pieSegments, {
      showLabels: true,
      showPercentages: true,
    });

    // Progress bars by pillar
    const barX = dims.margin + 85;
    let barY = y + 5;
    for (const cat of ESG_CATEGORIES) {
      const pct = categoryCompletion(checklistItems, cat);
      const color = getESGColor(cat, theme);
      const [tr, tg, tb] = hexToRgb(theme.textColor);
      doc.setFontSize(9);
      doc.setFont(theme.fontFamily, 'bold');
      doc.setTextColor(tr, tg, tb);
      doc.text(`${cat} — ${ESG_CATEGORY_NAMES[cat]} (${pct}%)`, barX, barY);
      barY += 5;
      drawProgressBar(doc, barX, barY, dims.contentWidth - 85, 6, pct, color, { fontSize: 7 });
      barY += 13;
    }
    y = Math.max(y + 60, barY + 5);

    // Summary table
    y = checkPageBreak(doc, y, 50);
    autoTable(doc, {
      startY: y,
      head: [['Pilier', 'Total', 'Renseignes', 'Manquants', 'Obligatoires OK', 'Completion']],
      body: ESG_CATEGORIES.map(cat => {
        const catItems = checklistItems.filter(i => i.category === cat);
        const catMandatory = catItems.filter(i => i.requirementLevel === 'MANDATORY');
        return [
          `${cat} — ${ESG_CATEGORY_NAMES[cat]}`,
          catItems.length,
          completedCount(catItems),
          countByStatus(catItems, 'MISSING'),
          `${completedCount(catMandatory)}/${catMandatory.length}`,
          `${categoryCompletion(checklistItems, cat)}%`,
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: theme.secondaryColor, textColor: '#FFFFFF', fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      margin: { left: dims.margin, right: dims.margin },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ═══════════════════════════════════════════════════════════════════
  // CHAPITRES 3-5 : PILIERS E / S / G (avec narratifs)
  // ═══════════════════════════════════════════════════════════════════
  const pillarChapterStart = options.includeExecutiveSummary ? 3 : 2;
  const pillarNames = { E: 'Environnement', S: 'Social', G: 'Gouvernance' };

  for (let pIdx = 0; pIdx < ESG_CATEGORIES.length; pIdx++) {
    const cat = ESG_CATEGORIES[pIdx];
    const pillarDesc = PILLAR_DESCRIPTIONS[cat];
    const chapterNum = pillarChapterStart + pIdx;
    const pillarColor = getESGColor(cat, theme);
    const catItems = checklistItems.filter(i => i.category === cat);

    // Chapter title page
    y = addChapterTitle(doc, `Chapitre ${chapterNum}`, pillarDesc.title, 0, theme, {
      addPageBefore: true,
      color: pillarColor,
    });
    trackPage(pillarDesc.title, 0, pillarColor);

    // Pillar description
    y = addNarrativeParagraph(doc, pillarDesc.description, y, theme, { fontSize: 9.5, lineHeight: 4.8 });
    y += 3;

    // Pillar scope
    y = addInfoBox(doc, 'Périmètre', pillarDesc.scope, y, theme, { accentColor: pillarColor });

    // Pillar completion overview
    y = checkPageBreak(doc, y, 30);
    const pct = categoryCompletion(checklistItems, cat);
    doc.setFontSize(10);
    doc.setFont(theme.fontFamily, 'bold');
    const [tr, tg, tb] = hexToRgb(theme.textColor);
    doc.setTextColor(tr, tg, tb);
    doc.text(`Completude du pilier ${pillarNames[cat]}`, dims.margin, y);
    y += 6;
    drawProgressBar(doc, dims.margin, y, dims.contentWidth, 8, pct, pillarColor);
    y += 16;

    // Stacked bar showing status distribution
    const accepted = countByStatus(catItems, 'ACCEPTED');
    const provided = countByStatus(catItems, 'PROVIDED');
    const missing = countByStatus(catItems, 'MISSING');
    const needsReview = countByStatus(catItems, 'NEEDS_REVIEW');
    const rejected = countByStatus(catItems, 'REJECTED');

    drawStackedBar(doc, dims.margin, y, dims.contentWidth, 7, [
      { value: accepted, color: theme.statusColors.success, label: 'Valide' },
      { value: provided, color: theme.primaryColor, label: 'Fourni' },
      { value: needsReview, color: theme.statusColors.warning, label: 'A reviser' },
      { value: missing, color: '#D1D5DB', label: 'Manquant' },
      { value: rejected, color: theme.statusColors.danger, label: 'Rejete' },
    ]);
    y += 10;
    drawLegend(doc, dims.margin, y, [
      { label: `Valide: ${accepted}`, color: theme.statusColors.success },
      { label: `Fourni: ${provided}`, color: theme.primaryColor },
      { label: `Manquant: ${missing}`, color: '#D1D5DB' },
      { label: `Rejete: ${rejected}`, color: theme.statusColors.danger },
    ], { fontSize: 6, swatchSize: 2 });
    y += 10;

    // ─── DETAILED SECTIONS within this pillar ───
    const pillarSections = (vsmeSections || []).filter(s => {
      const sPillar = s.pillar;
      return sPillar === cat;
    });

    for (const section of pillarSections) {
      const narrative = SECTION_NARRATIVES[section.sectionId];
      if (!narrative) continue;

      // Section header
      y = checkPageBreak(doc, y, 60);
      y = addSeparator(doc, y, theme);

      // Section title
      doc.setFontSize(13);
      doc.setFont(theme.fontFamily, 'bold');
      doc.setTextColor(tr, tg, tb);
      doc.text(`${section.sectionId} — ${section.sectionTitle}`, dims.margin, y + 5);
      y += 12;

      trackPage(`${section.sectionId} — ${section.sectionTitle}`, 1, pillarColor);

      // ESRS badge
      if (narrative.esrsRef) {
        y = addESRSBadge(doc, narrative.esrsRef, y, theme);
      }

      // Key message
      y = addKeyMessage(doc, narrative.keyMessage, y, theme, pillarColor);

      // Introduction narrative
      y = addNarrativeParagraph(doc, narrative.intro, y, theme, { fontSize: 9 });
      y += 2;

      // Datapoints table for this section
      const sectionDatapoints = section.datapoints;
      const filledCount = sectionDatapoints.filter(d => d.status === 'filled').length;
      const totalCount = sectionDatapoints.length;
      const sectionPct = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;

      y = checkPageBreak(doc, y, 20);
      doc.setFontSize(9);
      doc.setFont(theme.fontFamily, 'bold');
      doc.setTextColor(tr, tg, tb);
      doc.text(`Indicateurs (${filledCount}/${totalCount} renseignés — ${sectionPct}%)`, dims.margin, y);
      y += 5;
      drawProgressBar(doc, dims.margin, y, dims.contentWidth * 0.5, 4, sectionPct, pillarColor, { fontSize: 6 });
      y += 8;

      // Data table
      y = checkPageBreak(doc, y, 30);
      const tableBody = sectionDatapoints.map(dp => [
        dp.code,
        dp.label.length > 50 ? dp.label.substring(0, 49) + '...' : dp.label,
        dp.type,
        dp.obligatoire ? 'Obligatoire' : 'Recommande',
        dp.value ? `${dp.value}${dp.unit ? ' ' + dp.unit : ''}` : '-',
        dp.status === 'filled' ? 'Renseigne' : 'Manquant',
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Code', 'Indicateur', 'Type', 'Niveau', 'Valeur', 'Statut']],
        body: tableBody,
        theme: 'striped',
        headStyles: {
          fillColor: pillarColor,
          textColor: '#FFFFFF',
          fontSize: 7.5,
          fontStyle: 'bold',
        },
        bodyStyles: { fontSize: 7.5, textColor: theme.textColor },
        alternateRowStyles: { fillColor: '#F9FAFB' },
        didParseCell: function (data: any) {
          if (data.section === 'body' && data.column.index === 5) {
            const val = data.cell.raw;
            if (val === 'Manquant') {
              data.cell.styles.textColor = [220, 38, 38];
              data.cell.styles.fontStyle = 'bold';
            } else if (val === 'Renseigne') {
              data.cell.styles.textColor = [16, 185, 129];
            }
          }
        },
        columnStyles: {
          0: { cellWidth: 16 },
          1: { cellWidth: 52 },
          2: { cellWidth: 22 },
          3: { cellWidth: 22 },
          4: { cellWidth: 30 },
          5: { cellWidth: 20 },
        },
        margin: { left: dims.margin, right: dims.margin },
      });
      y = (doc as any).lastAutoTable.finalY + 5;

      // Methodology note for this section
      y = checkPageBreak(doc, y, 20);
      y = addInfoBox(doc, 'Méthodologie', narrative.methodology, y, theme, {
        accentColor: pillarColor,
      });

      // Context note
      y = checkPageBreak(doc, y, 20);
      y = addNarrativeParagraph(doc, narrative.context, y, theme, {
        fontSize: 8,
        textColor: theme.mutedTextColor,
        indent: 2,
      });
      y += 5;
    }

    // Pillar summary table
    y = checkPageBreak(doc, y, 40);
    y = addSectionTitle(doc, `Synthese ${pillarNames[cat]}`, y, theme, { backgroundColor: pillarColor });

    const catMandatory = catItems.filter(i => i.requirementLevel === 'MANDATORY');
    const catRecommended = catItems.filter(i => i.requirementLevel === 'RECOMMENDED');

    autoTable(doc, {
      startY: y,
      head: [['Categorie', 'Total', 'Renseignes', 'Manquants', 'Completion']],
      body: [
        ['Obligatoires', catMandatory.length, completedCount(catMandatory), countByStatus(catMandatory, 'MISSING'), `${catMandatory.length > 0 ? Math.round((completedCount(catMandatory) / catMandatory.length) * 100) : 0}%`],
        ['Recommandes', catRecommended.length, completedCount(catRecommended), countByStatus(catRecommended, 'MISSING'), `${catRecommended.length > 0 ? Math.round((completedCount(catRecommended) / catRecommended.length) * 100) : 0}%`],
        ['Total pilier', catItems.length, completedCount(catItems), countByStatus(catItems, 'MISSING'), `${pct}%`],
      ],
      theme: 'grid',
      headStyles: { fillColor: pillarColor, textColor: '#FFFFFF', fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      margin: { left: dims.margin, right: dims.margin },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ═══════════════════════════════════════════════════════════════════
  // CHAPITRE KPIs
  // ═══════════════════════════════════════════════════════════════════
  let nextChapter = pillarChapterStart + 3;
  if (kpiRequirements.length > 0) {
    y = addChapterTitle(doc, `Chapitre ${nextChapter}`, 'Indicateurs Clés de Performance', 0, theme, { addPageBefore: true });
    trackPage('Indicateurs Clés de Performance', 0);
    nextChapter++;

    y = addNarrativeParagraph(doc, `Cette section présente l'ensemble des indicateurs quantitatifs collectés dans le cadre du référentiel VSME. Les indicateurs sont classés par pilier E/S/G et présentés avec leur valeur, unité de mesure et statut de collecte. Un total de ${kpiRequirements.length} indicateurs ont été identifiés, dont ${kpiRequirements.filter(k => k.value !== undefined && k.value !== null).length} sont renseignés.`, y, theme);
    y += 5;

    // Bar chart top KPIs
    const topKpis = [...kpiRequirements]
      .filter(k => k.value !== undefined && k.value !== null)
      .sort((a, b) => (b.value || 0) - (a.value || 0))
      .slice(0, 12);

    if (topKpis.length > 0) {
      y = checkPageBreak(doc, y, 65);
      y = addSectionTitle(doc, 'Top indicateurs (par valeur)', y, theme);
      const bars: BarData[] = topKpis.map(k => ({
        label: k.code,
        value: k.value || 0,
        color: getESGColor(k.category, theme),
      }));
      drawBarChart(doc, dims.margin, y, dims.contentWidth, 50, bars, {
        labelFontSize: 6,
        valueFontSize: 6,
      });
      y += 60;
    }

    // KPI by pillar
    for (const cat of ESG_CATEGORIES) {
      const catKpis = kpiRequirements.filter(k => k.category === cat);
      if (catKpis.length === 0) continue;

      y = checkPageBreak(doc, y, 40);
      y = addCategoryHeader(doc, cat, ESG_CATEGORY_NAMES[cat], y, theme);

      autoTable(doc, {
        startY: y,
        head: [['Code', 'Indicateur', 'Valeur', 'Unite', 'Periode', 'Statut']],
        body: catKpis.map(kpi => [
          kpi.code,
          kpi.name.length > 42 ? kpi.name.substring(0, 41) + '...' : kpi.name,
          kpi.value !== undefined && kpi.value !== null ? kpi.value.toLocaleString('fr-FR') : '-',
          kpi.unit || '-',
          kpi.period || '-',
          getStatusLabel(kpi.status),
        ]),
        theme: 'striped',
        headStyles: { fillColor: getESGColor(cat, theme), textColor: '#FFFFFF', fontSize: 7.5, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7.5, textColor: theme.textColor },
        alternateRowStyles: { fillColor: '#F9FAFB' },
        columnStyles: {
          0: { cellWidth: 16 },
          1: { cellWidth: 52 },
          2: { cellWidth: 25, halign: 'right' },
          3: { cellWidth: 22 },
          4: { cellWidth: 18 },
          5: { cellWidth: 20 },
        },
        margin: { left: dims.margin, right: dims.margin },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // CHAPITRE PREUVES (optionnel)
  // ═══════════════════════════════════════════════════════════════════
  if (options.includeEvidence && evidences.length > 0) {
    y = addChapterTitle(doc, `Chapitre ${nextChapter}`, `Documents & Preuves (${evidences.length})`, 0, theme, { addPageBefore: true });
    nextChapter++;
    trackPage('Documents & Preuves', 0);

    // File type distribution
    const typeGroups: Record<string, number> = {};
    for (const ev of evidences) {
      const typeLabel = getFileTypeLabel(ev.fileType);
      typeGroups[typeLabel] = (typeGroups[typeLabel] || 0) + 1;
    }
    const typeColors: Record<string, string> = {
      PDF: theme.statusColors.danger,
      Excel: theme.statusColors.success,
      Image: theme.esgColors.S,
      CSV: theme.statusColors.warning,
      Word: theme.esgColors.G,
      Fichier: '#9CA3AF',
    };

    const hBars: HorizontalBarItem[] = Object.entries(typeGroups).map(([type, count]) => ({
      label: type,
      value: count,
      maxValue: evidences.length,
      color: typeColors[type] || '#6B7280',
    }));
    y = drawHorizontalBars(doc, dims.margin, y, dims.contentWidth, hBars, {
      barHeight: 6,
      barSpacing: 4,
      labelWidth: 25,
    });
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [['Fichier', 'Type', 'Taille', 'Periode', 'Liens', 'Date']],
      body: evidences.map(ev => [
        ev.fileName.length > 35 ? ev.fileName.substring(0, 34) + '...' : ev.fileName,
        getFileTypeLabel(ev.fileType),
        formatFileSize(ev.fileSize),
        ev.period || '-',
        ev.linkedIndicators?.length || 0,
        formatDateFR(ev.uploadedAt),
      ]),
      theme: 'striped',
      headStyles: { fillColor: theme.esgColors.S, textColor: '#FFFFFF', fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 18 },
        2: { cellWidth: 20 },
        3: { cellWidth: 18 },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 25 },
      },
      margin: { left: dims.margin, right: dims.margin },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ═══════════════════════════════════════════════════════════════════
  // RECOMMANDATIONS & CONCLUSION
  // ═══════════════════════════════════════════════════════════════════
  y = addChapterTitle(doc, `Chapitre ${nextChapter}`, 'Recommandations et Prochaines Étapes', 0, theme, { addPageBefore: true });
  trackPage('Recommandations et Prochaines Étapes', 0);

  y = addNarrativeParagraph(doc, `Sur la base de l'analyse des ${checklistItems.length} indicateurs du référentiel VSME et du score de complétude de ${pack.completionScore}%, les recommandations suivantes sont formulées pour renforcer la déclaration de durabilité :`, y, theme, { fontSize: 9.5 });
  y += 5;

  // Dynamic recommendations
  const recs: string[] = [];
  const mandatoryItems = checklistItems.filter(i => i.requirementLevel === 'MANDATORY');
  const mandatoryMissing = mandatoryItems.filter(i => i.status === 'MISSING').length;

  if (mandatoryMissing > 0) {
    recs.push(`Priorité haute : Compléter les ${mandatoryMissing} indicateur${mandatoryMissing > 1 ? 's' : ''} obligatoire${mandatoryMissing > 1 ? 's' : ''} manquant${mandatoryMissing > 1 ? 's' : ''}. Ces indicateurs sont requis par le référentiel VSME et constituent le socle minimal de la déclaration.`);
  }

  for (const cat of ESG_CATEGORIES) {
    const pct = categoryCompletion(checklistItems, cat);
    if (pct < 70) {
      recs.push(`Renforcer la collecte des données ${ESG_CATEGORY_NAMES[cat]} (${pct}% de complétude actuelle). Identifier les sources de données manquantes et les responsables de la collecte.`);
    }
  }

  if (evidences.length === 0) {
    recs.push('Attacher des preuves documentaires (factures, rapports, attestations) à chaque indicateur déclaré pour renforcer la crédibilité du reporting et faciliter un éventuel audit.');
  }

  if (pack.completionScore >= 80) {
    recs.push('Envisager une vérification par un tiers indépendant (commissaire aux comptes, auditeur spécialisé) pour renforcer la crédibilité de la déclaration.');
    recs.push('Préparer un plan de communication de la déclaration de durabilité auprès des parties prenantes (investisseurs, clients, salariés).');
  }

  recs.push('Mettre en place un processus de collecte continue pour faciliter la mise à jour annuelle de la déclaration.');
  recs.push('Former les équipes internes aux enjeux ESG et au référentiel VSME pour pérenniser la démarche de reporting.');

  const [txr, txg, txb] = hexToRgb(theme.textColor);
  for (let i = 0; i < recs.length; i++) {
    y = checkPageBreak(doc, y, 18);
    const recNum = `${i + 1}.`;
    doc.setFontSize(9);
    doc.setFont(theme.fontFamily, 'bold');
    doc.setTextColor(txr, txg, txb);
    doc.text(recNum, dims.margin, y);

    y = addNarrativeParagraph(doc, recs[i], y, theme, {
      fontSize: 9,
      indent: 8,
      maxWidth: dims.contentWidth - 8,
    });
    y += 2;
  }

  // Signature block
  y = checkPageBreak(doc, y, 40);
  y += 15;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(dims.margin, y, dims.margin + 70, y);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Signature du responsable ESG', dims.margin, y + 5);

  doc.line(dims.pageWidth - dims.margin - 70, y, dims.pageWidth - dims.margin, y);
  doc.text('Date et lieu', dims.pageWidth - dims.margin - 70, y + 5);

  // ═══════════════════════════════════════════════════════════════════
  // GLOSSAIRE
  // ═══════════════════════════════════════════════════════════════════
  doc.addPage();
  y = 25;
  trackPage('Glossaire', 0);

  doc.setFontSize(18);
  doc.setFont(theme.fontFamily, 'bold');
  doc.setTextColor(txr, txg, txb);
  doc.text('Glossaire', dims.margin, y);
  y += 4;
  const [gpr, gpg, gpb] = hexToRgb(theme.primaryColor);
  doc.setDrawColor(gpr, gpg, gpb);
  doc.setLineWidth(0.8);
  doc.line(dims.margin, y, dims.margin + 40, y);
  y += 10;

  for (const entry of ESG_GLOSSARY) {
    y = checkPageBreak(doc, y, 14);

    doc.setFontSize(8.5);
    doc.setFont(theme.fontFamily, 'bold');
    doc.setTextColor(txr, txg, txb);
    doc.text(entry.term, dims.margin, y);

    doc.setFont(theme.fontFamily, 'normal');
    doc.setFontSize(8);
    const [mr, mg, mb] = hexToRgb(theme.mutedTextColor);
    doc.setTextColor(mr, mg, mb);
    const defLines = doc.splitTextToSize(entry.definition, dims.contentWidth - 5);
    doc.text(defLines, dims.margin + 2, y + 4.5);
    y += 5 + defLines.length * 3.8;
  }

  // ═══════════════════════════════════════════════════════════════════
  // RENDER TABLE OF CONTENTS (go back to page 2)
  // ═══════════════════════════════════════════════════════════════════
  doc.setPage(tocPageNum);
  drawTableOfContents(doc, tocEntries, 25, theme);

  // ═══════════════════════════════════════════════════════════════════
  // FOOTERS on all pages
  // ═══════════════════════════════════════════════════════════════════
  addFootersToAllPages(doc, theme, 'Déclaration de Durabilité VSME');

  return doc.output('blob');
}

// ==================== 2. EXECUTIVE REPORT ====================

export async function generateExecutiveReport(
  data: ReportPackData,
  options: ReportOptions,
): Promise<Blob> {
  const theme = buildTheme(options.brandConfig);
  const doc = new jsPDF();
  const { pack, checklistItems, kpiRequirements, evidences, vsmeSections } = data;
  const dims = getPageDimensions(doc, theme);

  // ─── PAGE 1 : COUVERTURE PLEINE PAGE ─────────────────────
  addFullPageCover(doc, theme, 'Rapport Executif ESG', pack.name, [
    `Referentiel : ${pack.templateName}`,
    `Exercice : ${pack.fiscalYear || new Date().getFullYear()}`,
    `Date : ${formatDateLongFR(new Date().toISOString())}`,
    `Score : ${pack.completionScore}%`,
  ]);

  // ─── PAGE 2 : DASHBOARD ──────────────────────────────────
  doc.addPage();
  let y = 20;
  y = addSectionTitle(doc, 'Tableau de Bord ESG', y, theme);

  // Grande jauge centrée
  const scoreColor = getScoreColor(pack.completionScore, theme);
  drawGauge(doc, dims.pageWidth / 2, y + 28, 32, pack.completionScore, scoreColor, {
    label: 'Score de Conformite Global',
    valueFontSize: 22,
    labelFontSize: 8,
  });
  y += 58;

  // Score interpretation
  let interpretText = '';
  if (pack.completionScore >= 90) interpretText = `Excellent niveau de complétude (${pack.completionScore}%). L'organisation est prete pour un audit externe.`;
  else if (pack.completionScore >= 70) interpretText = `Bon niveau de complétude (${pack.completionScore}%). Finaliser les indicateurs restants pour atteindre la pleine conformite.`;
  else if (pack.completionScore >= 50) interpretText = `Completude en progression (${pack.completionScore}%). Prioriser les indicateurs obligatoires manquants.`;
  else interpretText = `Actions prioritaires requises (${pack.completionScore}%). Concentrer les efforts sur le socle obligatoire.`;

  y = addKeyMessage(doc, interpretText, y, theme, scoreColor);
  y += 3;

  // 4 Metric Cards
  const cardW = (dims.contentWidth - 15) / 4;
  const mandatoryItems = checklistItems.filter(i => i.requirementLevel === 'MANDATORY');
  const kpisProvided = kpiRequirements.filter(k => k.value !== undefined && k.value !== null);

  const metrics = [
    { label: 'Total Items', value: `${checklistItems.length}`, subtext: `${mandatoryItems.length} obligatoires`, color: theme.primaryColor },
    { label: 'Items Valides', value: `${completedCount(checklistItems)}`, subtext: `${completedCount(mandatoryItems)} obligatoires`, color: theme.statusColors.success },
    { label: 'KPIs Renseignes', value: `${kpisProvided.length}/${kpiRequirements.length}`, subtext: `${Math.round((kpisProvided.length / Math.max(kpiRequirements.length, 1)) * 100)}% couverts`, color: theme.esgColors.S },
    { label: 'Preuves', value: `${evidences.length}`, subtext: evidences.length > 0 ? formatFileSize(evidences.reduce((s, e) => s + e.fileSize, 0)) : '-', color: theme.esgColors.G },
  ];

  for (let i = 0; i < metrics.length; i++) {
    drawMetricCard(doc, dims.margin + i * (cardW + 5), y, cardW, 30, metrics[i]);
  }
  y += 40;

  // Pie chart + bars
  const pieSegments: PieSegment[] = ESG_CATEGORIES.map(cat => ({
    value: countByCategory(checklistItems, cat),
    color: getESGColor(cat, theme),
    label: ESG_CATEGORY_NAMES[cat],
  }));
  drawPieChart(doc, dims.margin + 35, y + 25, 20, pieSegments, { showPercentages: true });

  let barY = y + 5;
  const barX = dims.margin + 85;
  for (const cat of ESG_CATEGORIES) {
    const pct = categoryCompletion(checklistItems, cat);
    const [txr, txg, txb] = hexToRgb(theme.textColor);
    doc.setFontSize(8);
    doc.setFont(theme.fontFamily, 'bold');
    doc.setTextColor(txr, txg, txb);
    doc.text(`${cat} — ${ESG_CATEGORY_NAMES[cat]}`, barX, barY);
    barY += 4;
    drawProgressBar(doc, barX, barY, dims.contentWidth - 85, 5, pct, getESGColor(cat, theme), { fontSize: 6 });
    barY += 12;
  }

  // ─── PAGE 3 : KPIs CLÉS ──────────────────────────────────
  if (kpiRequirements.length > 0) {
    doc.addPage();
    y = 20;
    y = addSectionTitle(doc, 'Indicateurs Cles de Performance', y, theme);

    const topKpis = [...kpiRequirements]
      .filter(k => k.value !== undefined && k.value !== null)
      .sort((a, b) => (b.value || 0) - (a.value || 0))
      .slice(0, 10);

    if (topKpis.length > 0) {
      const bars: BarData[] = topKpis.map(k => ({
        label: k.code,
        value: k.value || 0,
        color: getESGColor(k.category, theme),
      }));
      drawBarChart(doc, dims.margin, y, dims.contentWidth, 55, bars, { valueFontSize: 6, labelFontSize: 6 });
      y += 65;
    }

    const kpiSimple = topKpis.map(k => [
      k.code,
      k.name.length > 50 ? k.name.substring(0, 49) + '...' : k.name,
      `${(k.value || 0).toLocaleString('fr-FR')} ${k.unit}`,
    ]);
    autoTable(doc, {
      startY: y,
      head: [['Code', 'Indicateur', 'Valeur']],
      body: kpiSimple,
      theme: 'grid',
      headStyles: { fillColor: theme.primaryColor, textColor: '#FFFFFF', fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      margin: { left: dims.margin, right: dims.margin },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ─── PAGE 4 : CONFORMITÉ par section ──────────────────────
  doc.addPage();
  y = 20;
  y = addSectionTitle(doc, 'Etat de Conformite par Section', y, theme);

  // Section completion overview (if vsmeSections available)
  if (vsmeSections && vsmeSections.length > 0) {
    const sectionBars: HorizontalBarItem[] = vsmeSections.map(s => {
      const filled = s.datapoints.filter(d => d.status === 'filled').length;
      const total = s.datapoints.length;
      return {
        label: s.sectionId,
        value: filled,
        maxValue: total,
        color: getESGColor(s.pillar, theme),
      };
    });

    y = drawHorizontalBars(doc, dims.margin, y, dims.contentWidth, sectionBars, {
      barHeight: 6,
      barSpacing: 4,
      labelWidth: 18,
      fontSize: 7,
    });
    y += 8;
  }

  // Points d'attention
  const missingMandatory = checklistItems
    .filter(i => i.requirementLevel === 'MANDATORY' && (i.status === 'MISSING' || i.status === 'REJECTED'))
    .slice(0, 8);

  if (missingMandatory.length > 0) {
    y = checkPageBreak(doc, y, 60);
    y = addSectionTitle(doc, 'Points d\'attention — Items obligatoires manquants', y, theme, {
      backgroundColor: theme.statusColors.danger,
    });

    autoTable(doc, {
      startY: y,
      head: [['Code', 'Element', 'Pilier', 'Statut']],
      body: missingMandatory.map(i => [
        i.code,
        i.label.length > 55 ? i.label.substring(0, 54) + '...' : i.label,
        `${i.category} — ${ESG_CATEGORY_NAMES[i.category]}`,
        getStatusLabel(i.status),
      ]),
      theme: 'grid',
      headStyles: { fillColor: theme.statusColors.danger, textColor: '#FFFFFF', fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      margin: { left: dims.margin, right: dims.margin },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ─── PAGE 5 : CONCLUSION ─────────────────────────────────
  doc.addPage();
  y = 20;
  y = addSectionTitle(doc, 'Synthese et Recommandations', y, theme);

  // Recommendations
  const recs: string[] = [];
  const mandatoryMissing = mandatoryItems.filter(i => i.status === 'MISSING').length;
  if (mandatoryMissing > 0) recs.push(`Completer les ${mandatoryMissing} items obligatoires manquants en priorite.`);
  if (evidences.length < kpiRequirements.length) recs.push('Attacher des preuves documentaires pour chaque KPI declare.');
  for (const cat of ESG_CATEGORIES) {
    const pct = categoryCompletion(checklistItems, cat);
    if (pct < 70) recs.push(`Renforcer la collecte de donnees ${ESG_CATEGORY_NAMES[cat]} (${pct}% de completion).`);
  }
  if (recs.length === 0) recs.push('Maintenir le niveau de completion et preparer la documentation pour l\'audit.');

  const [txr, txg, txb] = hexToRgb(theme.textColor);
  doc.setFont(theme.fontFamily, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(txr, txg, txb);
  for (let i = 0; i < recs.length; i++) {
    const recLines = doc.splitTextToSize(`${i + 1}. ${recs[i]}`, dims.contentWidth - 5);
    doc.text(recLines, dims.margin + 3, y);
    y += recLines.length * 5 + 3;
  }

  // Signature
  y += 20;
  y = checkPageBreak(doc, y, 30);
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(dims.margin, y, dims.margin + 70, y);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Signature du responsable', dims.margin, y + 5);
  doc.line(dims.pageWidth - dims.margin - 70, y, dims.pageWidth - dims.margin, y);
  doc.text('Date', dims.pageWidth - dims.margin - 70, y + 5);

  addFootersToAllPages(doc, theme, 'Rapport Executif ESG');
  return doc.output('blob');
}

// ==================== 3. AUDIT REPORT ====================

export async function generateAuditReport(
  data: ReportPackData,
  options: ReportOptions,
): Promise<Blob> {
  const theme = buildTheme(options.brandConfig);
  const doc = new jsPDF();
  const { pack, checklistItems, kpiRequirements, evidences, vsmeSections } = data;
  const dims = getPageDimensions(doc, theme);

  // ─── PAGE 1 : COUVERTURE AUDIT ────────────────────────────
  let y = addCoverHeader(doc, theme, 'Rapport de Preparation Audit', pack.name);

  y = addMetadataBlock(doc, [
    ['Périmètre :', pack.templateName],
    ['Exercice :', pack.fiscalYear || new Date(pack.createdAt).getFullYear().toString()],
    ['Organisation :', pack.clientOrg || theme.organizationName],
    ['Date de preparation :', formatDateLongFR(new Date().toISOString())],
  ], y + 5, theme);

  // Badge de préparation
  y += 10;
  const readinessColor = getScoreColor(pack.completionScore, theme);
  const [rc, gc, bc] = hexToRgb(readinessColor);
  doc.setFillColor(rc, gc, bc);
  doc.roundedRect(dims.margin, y, 65, 14, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont(theme.fontFamily, 'bold');
  doc.text(`Preparation: ${pack.completionScore}%`, dims.margin + 5, y + 9);

  // ─── PAGE 2 : SCORE DE PRÉPARATION ────────────────────────
  doc.addPage();
  y = 20;
  y = addSectionTitle(doc, 'Score de Preparation Audit', y, theme);

  drawGauge(doc, dims.pageWidth / 2, y + 35, 38, pack.completionScore, readinessColor, {
    label: 'Preparation Audit',
    valueFontSize: 24,
    labelFontSize: 9,
  });
  y += 70;

  // Interpretation
  const [ttr, ttg, ttb] = hexToRgb(theme.textColor);
  let interpretation = '';
  if (pack.completionScore >= 90) interpretation = 'Le dossier est pret pour un audit externe. Verifier les derniers details et preparer les documents de preuve.';
  else if (pack.completionScore >= 70) interpretation = 'Bon niveau de preparation. Quelques elements restent a finaliser avant l\'audit. Concentrer les efforts sur les indicateurs obligatoires manquants.';
  else if (pack.completionScore >= 50) interpretation = 'Preparation en cours. Des efforts significatifs sont encore necessaires, notamment sur les indicateurs obligatoires et les preuves documentaires.';
  else interpretation = 'Preparation insuffisante. Un travail important est requis avant l\'audit. Prioriser les indicateurs obligatoires.';

  y = addKeyMessage(doc, interpretation, y, theme, readinessColor);
  y += 5;

  // Checklist de conformité
  const mandatoryItems = checklistItems.filter(i => i.requirementLevel === 'MANDATORY');
  const auditChecks = [
    { label: 'Documentation complete (100%)', ok: pack.completionScore >= 100, critical: true },
    { label: 'Preuves documentaires attachees', ok: evidences.length > 0, critical: true },
    { label: 'Indicateurs KPI renseignés', ok: kpiRequirements.every(k => k.value !== undefined && k.value !== null), critical: true },
    { label: 'Items obligatoires valides', ok: mandatoryItems.every(i => i.status === 'ACCEPTED' || i.status === 'PROVIDED'), critical: true },
    { label: 'Commentaires de justification', ok: checklistItems.some(i => i.comment && i.comment.length > 0), critical: false },
    { label: 'Revue par consultant', ok: checklistItems.some(i => i.status === 'ACCEPTED'), critical: false },
  ];

  for (const check of auditChecks) {
    y = checkPageBreak(doc, y, 10);
    const icon = check.ok ? '\u2713' : '\u2717';
    const iconColor = check.ok ? theme.statusColors.success : theme.statusColors.danger;
    const [ir, ig, ib] = hexToRgb(iconColor);
    doc.setFontSize(11);
    doc.setFont(theme.fontFamily, 'bold');
    doc.setTextColor(ir, ig, ib);
    doc.text(icon, dims.margin, y);
    doc.setTextColor(ttr, ttg, ttb);
    doc.setFont(theme.fontFamily, 'normal');
    doc.setFontSize(9);
    doc.text(check.label, dims.margin + 8, y);
    if (check.critical && !check.ok) {
      const [dr, dg, db] = hexToRgb(theme.statusColors.danger);
      doc.setTextColor(dr, dg, db);
      doc.setFontSize(7);
      doc.text('CRITIQUE', dims.pageWidth - dims.margin - 20, y);
    }
    y += 8;
  }

  // ─── PAGE 3 : ANALYSE DES ÉCARTS PAR SECTION ─────────────
  doc.addPage();
  y = 20;
  y = addSectionTitle(doc, 'Analyse des Ecarts par Section', y, theme);

  // Section-level gap analysis (much more detailed)
  if (vsmeSections && vsmeSections.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Section', 'Titre', 'Total', 'Rens.', 'Manq.', 'Oblig.', 'Completion']],
      body: vsmeSections.map(s => {
        const filled = s.datapoints.filter(d => d.status === 'filled').length;
        const total = s.datapoints.length;
        const mandatory = s.datapoints.filter(d => d.obligatoire).length;
        const mandatoryFilled = s.datapoints.filter(d => d.obligatoire && d.status === 'filled').length;
        const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
        return [
          s.sectionId,
          s.sectionTitle.length > 30 ? s.sectionTitle.substring(0, 29) + '...' : s.sectionTitle,
          total,
          filled,
          total - filled,
          `${mandatoryFilled}/${mandatory}`,
          `${pct}%`,
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: theme.secondaryColor, textColor: '#FFFFFF', fontSize: 7.5, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5 },
      didParseCell: function (data: any) {
        if (data.section === 'body' && data.column.index === 4) {
          if (data.cell.raw > 0) {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          }
        }
        if (data.section === 'body' && data.column.index === 6) {
          const pct = parseInt(data.cell.raw);
          if (pct < 50) data.cell.styles.textColor = [220, 38, 38];
          else if (pct < 80) data.cell.styles.textColor = [245, 158, 11];
          else data.cell.styles.textColor = [16, 185, 129];
        }
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 48 },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 22, halign: 'center' },
      },
      margin: { left: dims.margin, right: dims.margin },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Pillar gap analysis
  y = checkPageBreak(doc, y, 50);
  for (const cat of ESG_CATEGORIES) {
    const catItems = checklistItems.filter(i => i.category === cat);
    if (catItems.length === 0) continue;

    y = addCategoryHeader(doc, cat, ESG_CATEGORY_NAMES[cat], y, theme);

    const items: HorizontalBarItem[] = [
      { label: 'Valide', value: countByStatus(catItems, 'ACCEPTED'), maxValue: catItems.length, color: theme.statusColors.success },
      { label: 'Fourni', value: countByStatus(catItems, 'PROVIDED'), maxValue: catItems.length, color: theme.primaryColor },
      { label: 'Manquant', value: countByStatus(catItems, 'MISSING'), maxValue: catItems.length, color: '#D1D5DB' },
      { label: 'Rejete', value: countByStatus(catItems, 'REJECTED'), maxValue: catItems.length, color: theme.statusColors.danger },
    ].filter(i => i.value > 0);

    y = drawHorizontalBars(doc, dims.margin, y, dims.contentWidth, items, {
      barHeight: 5,
      barSpacing: 3,
      labelWidth: 25,
      fontSize: 7,
    });
    y += 8;
  }

  // ─── PAGES 4+ : CHECKLIST DÉTAILLÉE par pilier ────────────
  for (const cat of ESG_CATEGORIES) {
    const catItems = checklistItems
      .filter(i => i.category === cat)
      .sort((a, b) => {
        if (a.requirementLevel === 'MANDATORY' && b.requirementLevel !== 'MANDATORY') return -1;
        if (a.requirementLevel !== 'MANDATORY' && b.requirementLevel === 'MANDATORY') return 1;
        return 0;
      });
    if (catItems.length === 0) continue;

    doc.addPage();
    y = 20;
    y = addSectionTitle(doc, `Checklist ${cat} — ${ESG_CATEGORY_NAMES[cat]}`, y, theme, {
      backgroundColor: getESGColor(cat, theme),
    });

    autoTable(doc, {
      startY: y,
      head: [['Code', 'Element', 'Statut', 'Niveau', 'Note Audit']],
      body: catItems.map(i => [
        i.code,
        i.label.length > 50 ? i.label.substring(0, 49) + '...' : i.label,
        getStatusLabel(i.status),
        REQUIREMENT_LABELS[i.requirementLevel] || i.requirementLevel,
        i.comment?.substring(0, 35) || '-',
      ]),
      theme: 'striped',
      headStyles: { fillColor: getESGColor(cat, theme), textColor: '#FFFFFF', fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: '#F9FAFB' },
      didParseCell: function (data: any) {
        if (data.section === 'body' && data.column.index === 2) {
          const status = catItems[data.row.index]?.status;
          if (status === 'MISSING' || status === 'REJECTED') {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 60 },
        2: { cellWidth: 22 },
        3: { cellWidth: 25 },
        4: { cellWidth: 35 },
      },
      margin: { left: dims.margin, right: dims.margin },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ─── ITEMS MANQUANTS ──────────────────────────────────────
  const missingItems = checklistItems.filter(
    i => (i.status === 'MISSING' || i.status === 'REJECTED') && i.requirementLevel === 'MANDATORY'
  );

  if (missingItems.length > 0) {
    doc.addPage();
    y = 20;
    y = addSectionTitle(doc, 'Items Manquants — Actions Requises', y, theme, {
      backgroundColor: theme.statusColors.danger,
    });

    const [dr, dg, db] = hexToRgb(theme.statusColors.danger);
    doc.setFontSize(10);
    doc.setFont(theme.fontFamily, 'bold');
    doc.setTextColor(dr, dg, db);
    doc.text(
      `${missingItems.length} item${missingItems.length > 1 ? 's' : ''} critique${missingItems.length > 1 ? 's' : ''} manquant${missingItems.length > 1 ? 's' : ''} sur ${mandatoryItems.length} obligatoires`,
      dims.margin, y,
    );
    y += 10;

    autoTable(doc, {
      startY: y,
      head: [['Code', 'Element', 'Pilier', 'Statut']],
      body: missingItems.map(i => [
        i.code,
        i.label.length > 55 ? i.label.substring(0, 54) + '...' : i.label,
        `${i.category} — ${ESG_CATEGORY_NAMES[i.category]}`,
        getStatusLabel(i.status),
      ]),
      theme: 'grid',
      headStyles: { fillColor: theme.statusColors.danger, textColor: '#FFFFFF', fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: theme.textColor },
      margin: { left: dims.margin, right: dims.margin },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ─── RECOMMANDATIONS ──────────────────────────────────────
  doc.addPage();
  y = 20;
  y = addSectionTitle(doc, 'Recommandations pour l\'Audit', y, theme);

  doc.setFontSize(9);
  doc.setFont(theme.fontFamily, 'normal');
  doc.setTextColor(ttr, ttg, ttb);

  const staticRecs = [
    'Verifier que tous les documents de preuve sont dates et signes.',
    'S\'assurer que les méthodologies de calcul sont documentées.',
    'Preparer les fichiers sources Excel pour consultation.',
    'Identifier les points de discussion pour l\'auditeur.',
    'Completer les items obligatoires manquants avant la date d\'audit.',
    'Ajouter des commentaires de justification a tous les items fournis.',
  ];

  const dynamicRecs: string[] = [];
  for (const cat of ESG_CATEGORIES) {
    const pct = categoryCompletion(checklistItems, cat);
    if (pct < 80) {
      dynamicRecs.push(`Prioriser la collecte de donnees ${ESG_CATEGORY_NAMES[cat]} (${pct}% de completion).`);
    }
  }
  if (evidences.length < kpiRequirements.length) {
    dynamicRecs.push('Attacher des preuves pour tous les KPIs declares.');
  }

  const allRecs = [...staticRecs, ...dynamicRecs];
  for (let i = 0; i < allRecs.length; i++) {
    y = checkPageBreak(doc, y, 10);
    const recLines = doc.splitTextToSize(`${i + 1}. ${allRecs[i]}`, dims.contentWidth - 5);
    doc.text(recLines, dims.margin + 3, y);
    y += recLines.length * 5 + 3;
  }

  addFootersToAllPages(doc, theme, 'Preparation Audit');
  return doc.output('blob');
}

// ==================== BACKWARD COMPATIBILITY ====================

/**
 * @deprecated Utiliser generateStandardReport ou generateExecutiveReport
 */
export async function generateProfessionalReport(
  pack: any,
  options: any = {},
): Promise<void> {
  const reportType = options.reportType || 'standard';
  const data: ReportPackData = {
    pack: {
      id: pack.id,
      name: pack.name,
      templateCode: pack.templateCode || '',
      templateName: pack.templateName || '',
      status: pack.status || 'DRAFT',
      completionScore: pack.completionScore || 0,
      owner: pack.owner || '',
      createdAt: pack.createdAt || new Date().toISOString(),
      updatedAt: pack.updatedAt || new Date().toISOString(),
    },
    checklistItems: (pack.checklistItems || []).map((i: any) => ({
      ...i,
      requirementLevel: i.requirementLevel || i.requirement_level || 'MANDATORY',
      category: i.category || 'E',
    })),
    kpiRequirements: (pack.kpiRequirements || []).map((k: any) => ({
      id: k.id,
      code: k.indicator_code || k.code || '',
      name: k.indicator_name || k.name || '',
      unit: k.unit || '',
      category: k.category || 'E',
      status: k.status || 'missing',
      value: k.value,
      period: k.period,
      hasEvidence: k.has_evidence || k.hasEvidence || false,
      evidenceCount: k.evidence_count || k.evidenceCount || 0,
    })),
    evidences: (pack.evidences || []).map((e: any) => ({
      id: e.id,
      fileName: e.file_name || e.fileName || '',
      fileType: e.file_type || e.fileType || '',
      fileSize: e.file_size || e.fileSize || 0,
      period: e.period,
      uploadedAt: e.created_at || e.uploadedAt || new Date().toISOString(),
      linkedIndicators: e.linked_indicators || e.linkedIndicators || [],
    })),
  };

  const reportOptions: ReportOptions = {
    reportType,
    includeExecutiveSummary: options.includeExecutiveSummary ?? true,
    includeEvidence: options.includeEvidence ?? true,
    includeAuditTrail: options.includeAuditTrail ?? false,
    brandConfig: options.organizationName ? {
      organizationName: options.organizationName,
      logoBase64: options.organizationLogo || null,
      primaryColor: '#059669',
      secondaryColor: '#0A3B2E',
    } : undefined,
  };

  let blob: Blob;
  if (reportType === 'executive') {
    blob = await generateExecutiveReport(data, reportOptions);
  } else if (reportType === 'audit') {
    blob = await generateAuditReport(data, reportOptions);
  } else {
    blob = await generateStandardReport(data, reportOptions);
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFileName(pack.name)}_rapport_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * @deprecated Utiliser generateAuditReport
 */
export async function generateAuditPreparationReport(
  pack: any,
  organizationName: string = 'Solvid.IA',
): Promise<void> {
  await generateProfessionalReport(pack, {
    organizationName,
    reportType: 'audit',
  });
}
