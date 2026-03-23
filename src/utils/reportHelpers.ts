/**
 * REPORT HELPERS — Utilitaires PDF communs pour tous les rapports
 *
 * Fonctions extraites et partagées entre professionalReports.ts,
 * pdfExport.ts et exportService.ts.
 */

import jsPDF from 'jspdf';
import type { ReportTheme } from './reportTheme';
import { hexToRgb } from './reportTheme';

// ==================== PAGE MANAGEMENT ====================

/**
 * Vérifie si un saut de page est nécessaire. Ajoute une page si besoin.
 * @returns La nouvelle position Y (20 si nouvelle page, inchangée sinon)
 */
export function checkPageBreak(
  doc: jsPDF,
  yPosition: number,
  requiredSpace: number,
  topMargin: number = 20,
): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (yPosition + requiredSpace > pageHeight - 20) {
    doc.addPage();
    return topMargin;
  }
  return yPosition;
}

/**
 * Retourne les dimensions utiles de la page
 */
export function getPageDimensions(doc: jsPDF, theme: ReportTheme) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = theme.margin;
  const contentWidth = pageWidth - 2 * margin;
  return { pageWidth, pageHeight, margin, contentWidth };
}

// ==================== COVER PAGE ====================

/**
 * Dessine l'en-tête de couverture avec bande sombre + logo + titre
 * @returns La position Y après l'en-tête
 */
export function addCoverHeader(
  doc: jsPDF,
  theme: ReportTheme,
  title: string,
  subtitle: string,
): number {
  const { pageWidth, margin } = getPageDimensions(doc, theme);
  const headerHeight = theme.headerHeight;

  // Bande sombre pleine largeur
  const [sr, sg, sb] = hexToRgb(theme.secondaryColor);
  doc.setFillColor(sr, sg, sb);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  let yPos = 25;

  // Logo (si disponible)
  if (theme.logoBase64) {
    try {
      doc.addImage(theme.logoBase64, 'PNG', margin, 12, 30, 15);
      yPos = 35;
    } catch {
      // Logo invalide — on continue sans
    }
  }

  // Nom de l'organisation
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont(theme.fontFamily, 'normal');
  doc.text(theme.organizationName, theme.logoBase64 ? margin + 35 : margin, yPos);

  // Titre principal
  doc.setFontSize(24);
  doc.setFont(theme.fontFamily, 'bold');
  doc.text(title, margin, yPos + 18);

  // Sous-titre
  doc.setFontSize(14);
  doc.setFont(theme.fontFamily, 'normal');
  doc.text(subtitle, margin, yPos + 32);

  return headerHeight + 15;
}

/**
 * Dessine une couverture pleine page élégante (pour rapport exécutif)
 * @returns La position Y après la couverture (début page suivante)
 */
export function addFullPageCover(
  doc: jsPDF,
  theme: ReportTheme,
  title: string,
  subtitle: string,
  metadata: string[],
): void {
  const { pageWidth, pageHeight, margin } = getPageDimensions(doc, theme);

  // Fond sombre sur toute la page
  const [sr, sg, sb] = hexToRgb(theme.secondaryColor);
  doc.setFillColor(sr, sg, sb);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Rectangle décoratif plus clair en bas
  const [pr, pg, pb] = hexToRgb(theme.primaryColor);
  doc.setFillColor(pr, pg, pb);
  doc.setGState(doc.GState({ opacity: 0.15 }));
  doc.rect(0, pageHeight * 0.65, pageWidth, pageHeight * 0.35, 'F');
  doc.setGState(doc.GState({ opacity: 1 }));

  // Logo centré (si disponible)
  let centerY = pageHeight * 0.25;
  if (theme.logoBase64) {
    try {
      const logoW = 50;
      const logoH = 25;
      doc.addImage(theme.logoBase64, 'PNG', (pageWidth - logoW) / 2, centerY, logoW, logoH);
      centerY += 35;
    } catch {
      // Logo invalide
    }
  }

  // Nom de l'organisation
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont(theme.fontFamily, 'normal');
  const orgWidth = doc.getTextWidth(theme.organizationName);
  doc.text(theme.organizationName, (pageWidth - orgWidth) / 2, centerY);
  centerY += 20;

  // Titre principal
  doc.setFontSize(28);
  doc.setFont(theme.fontFamily, 'bold');
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, centerY);
  centerY += 12;

  // Sous-titre
  doc.setFontSize(16);
  doc.setFont(theme.fontFamily, 'normal');
  const subWidth = doc.getTextWidth(subtitle);
  doc.text(subtitle, (pageWidth - subWidth) / 2, centerY);
  centerY += 10;

  // Ligne décorative
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.line(pageWidth * 0.3, centerY, pageWidth * 0.7, centerY);
  centerY += 15;

  // Métadonnées
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  for (const line of metadata) {
    const lw = doc.getTextWidth(line);
    doc.text(line, (pageWidth - lw) / 2, centerY);
    centerY += 6;
  }
}

// ==================== SECTION TITLES ====================

/**
 * Dessine une barre de titre de section colorée
 * @returns La nouvelle position Y après le titre
 */
export function addSectionTitle(
  doc: jsPDF,
  title: string,
  yPosition: number,
  theme: ReportTheme,
  options?: {
    backgroundColor?: string;
    textColor?: string;
    icon?: string;
  },
): number {
  const { margin, contentWidth } = getPageDimensions(doc, theme);
  const y = checkPageBreak(doc, yPosition, 25);

  const bgColor = options?.backgroundColor || theme.primaryColor;
  const textCol = options?.textColor || '#FFFFFF';

  const [br, bg, bb] = hexToRgb(bgColor);
  doc.setFillColor(br, bg, bb);
  doc.rect(margin, y, contentWidth, 10, 'F');

  const [tr, tg, tb] = hexToRgb(textCol);
  doc.setTextColor(tr, tg, tb);
  doc.setFontSize(13);
  doc.setFont(theme.fontFamily, 'bold');

  const displayTitle = options?.icon ? `${options.icon}  ${title}` : title;
  doc.text(displayTitle, margin + 4, y + 7);

  return y + 18;
}

/**
 * Dessine un sous-titre de catégorie (E/S/G) avec pastille colorée
 * @returns La nouvelle position Y
 */
export function addCategoryHeader(
  doc: jsPDF,
  category: 'E' | 'S' | 'G',
  categoryName: string,
  yPosition: number,
  theme: ReportTheme,
): number {
  const { margin } = getPageDimensions(doc, theme);
  const y = checkPageBreak(doc, yPosition, 20);

  // Pastille colorée
  const color = theme.esgColors[category];
  const [cr, cg, cb] = hexToRgb(color);
  doc.setFillColor(cr, cg, cb);
  doc.circle(margin + 3, y + 3, 3, 'F');

  // Texte
  const [tr, tg, tb] = hexToRgb(theme.textColor);
  doc.setTextColor(tr, tg, tb);
  doc.setFontSize(12);
  doc.setFont(theme.fontFamily, 'bold');
  doc.text(`${category} — ${categoryName}`, margin + 10, y + 5);

  return y + 12;
}

// ==================== FOOTERS ====================

/**
 * Ajoute un footer branded sur toutes les pages du document
 */
export function addFootersToAllPages(
  doc: jsPDF,
  theme: ReportTheme,
  reportTitle: string,
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = theme.margin;
  const totalPages = doc.getNumberOfPages();

  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Ligne séparatrice
    const [gr, gg, gb] = hexToRgb(theme.mutedTextColor);
    doc.setDrawColor(gr, gg, gb);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

    // Texte footer
    doc.setFontSize(7);
    doc.setTextColor(gr, gg, gb);
    doc.setFont(theme.fontFamily, 'normal');

    // Gauche : org + type rapport
    doc.text(`${theme.organizationName} — ${reportTitle}`, margin, pageHeight - 9);

    // Centre : date/heure
    const centerText = `${dateStr} ${timeStr}`;
    const centerWidth = doc.getTextWidth(centerText);
    doc.text(centerText, (pageWidth - centerWidth) / 2, pageHeight - 9);

    // Droite : pagination
    const pageText = `Page ${i} / ${totalPages}`;
    const rightWidth = doc.getTextWidth(pageText);
    doc.text(pageText, pageWidth - margin - rightWidth, pageHeight - 9);
  }
}

// ==================== METADATA SECTION ====================

/**
 * Dessine une section de métadonnées (clé: valeur) en deux colonnes
 * @returns La nouvelle position Y
 */
export function addMetadataBlock(
  doc: jsPDF,
  metadata: Array<[string, string]>,
  yPosition: number,
  theme: ReportTheme,
): number {
  const { margin } = getPageDimensions(doc, theme);
  let y = yPosition;

  const [mr, mg, mb] = hexToRgb(theme.mutedTextColor);
  const [tr, tg, tb] = hexToRgb(theme.textColor);

  doc.setFontSize(10);
  for (const [label, value] of metadata) {
    doc.setFont(theme.fontFamily, 'bold');
    doc.setTextColor(mr, mg, mb);
    doc.text(label, margin, y);

    doc.setFont(theme.fontFamily, 'normal');
    doc.setTextColor(tr, tg, tb);
    doc.text(value, margin + 55, y);
    y += 6;
  }

  return y;
}

// ==================== FORMATTING HELPERS ====================

/**
 * Nettoie un nom de fichier (supprime caractères spéciaux)
 */
export function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-z0-9àâäéèêëïîôùûüçœæ]/gi, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
}

/**
 * Formate une taille de fichier en unité lisible
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Formate une date ISO en format fr-FR
 */
export function formatDateFR(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Formate une date ISO en format long fr-FR
 */
export function formatDateLongFR(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

// ==================== TABLE OF CONTENTS ====================

export interface TOCEntry {
  title: string;
  pageNumber: number;
  level: number;  // 0 = main, 1 = sub
  color?: string;
}

/**
 * Dessine une table des matières professionnelle sur la page courante.
 * @returns La nouvelle position Y
 */
export function drawTableOfContents(
  doc: jsPDF,
  entries: TOCEntry[],
  yStart: number,
  theme: ReportTheme,
): number {
  const { margin, contentWidth } = getPageDimensions(doc, theme);
  let y = yStart;

  // Titre TOC
  doc.setFontSize(20);
  doc.setFont(theme.fontFamily, 'bold');
  const [tr, tg, tb] = hexToRgb(theme.textColor);
  doc.setTextColor(tr, tg, tb);
  doc.text('Table des matières', margin, y);
  y += 5;

  // Ligne décorative sous le titre
  const [pr, pg, pb] = hexToRgb(theme.primaryColor);
  doc.setDrawColor(pr, pg, pb);
  doc.setLineWidth(0.8);
  doc.line(margin, y, margin + 60, y);
  y += 12;

  const [mr, mg, mb] = hexToRgb(theme.mutedTextColor);

  for (const entry of entries) {
    y = checkPageBreak(doc, y, 10);

    const indent = entry.level === 0 ? 0 : 10;
    const fontSize = entry.level === 0 ? 11 : 9;
    const fontStyle = entry.level === 0 ? 'bold' : 'normal';

    // Couleur de la pastille si pilier
    if (entry.color) {
      const [cr, cg, cb] = hexToRgb(entry.color);
      doc.setFillColor(cr, cg, cb);
      doc.circle(margin + indent + 2, y - 1.5, 1.5, 'F');
    }

    const textX = margin + indent + (entry.color ? 6 : 0);

    // Titre
    doc.setFontSize(fontSize);
    doc.setFont(theme.fontFamily, fontStyle);
    doc.setTextColor(tr, tg, tb);
    const titleText = entry.title.length > 70 ? entry.title.substring(0, 69) + '...' : entry.title;
    doc.text(titleText, textX, y);

    // Pointillés
    const titleWidth = doc.getTextWidth(titleText);
    const dotsX = textX + titleWidth + 2;
    const pageX = margin + contentWidth - 10;
    doc.setFontSize(7);
    doc.setTextColor(mr, mg, mb);
    const dotStep = 2;
    for (let dx = dotsX; dx < pageX - 2; dx += dotStep) {
      doc.text('.', dx, y);
    }

    // Numéro de page
    doc.setFontSize(fontSize);
    doc.setFont(theme.fontFamily, fontStyle);
    doc.setTextColor(tr, tg, tb);
    const pageStr = entry.pageNumber.toString();
    const pageW = doc.getTextWidth(pageStr);
    doc.text(pageStr, margin + contentWidth - pageW, y);

    y += entry.level === 0 ? 8 : 6;
  }

  return y;
}

// ==================== NARRATIVE TEXT BLOCKS ====================

/**
 * Dessine un paragraphe de texte narratif avec wrapping automatique.
 * @returns La nouvelle position Y
 */
export function addNarrativeParagraph(
  doc: jsPDF,
  text: string,
  yPosition: number,
  theme: ReportTheme,
  options?: {
    fontSize?: number;
    fontStyle?: 'normal' | 'bold' | 'italic';
    textColor?: string;
    lineHeight?: number;
    indent?: number;
    maxWidth?: number;
  },
): number {
  const { margin, contentWidth } = getPageDimensions(doc, theme);
  const fontSize = options?.fontSize || 9;
  const fontStyle = options?.fontStyle || 'normal';
  const color = options?.textColor || theme.textColor;
  const lineHeight = options?.lineHeight || 4.5;
  const indent = options?.indent || 0;
  const maxW = options?.maxWidth || (contentWidth - indent);

  const [r, g, b] = hexToRgb(color);
  doc.setFontSize(fontSize);
  doc.setFont(theme.fontFamily, fontStyle);
  doc.setTextColor(r, g, b);

  const lines = doc.splitTextToSize(text, maxW);
  let y = yPosition;

  for (const line of lines) {
    y = checkPageBreak(doc, y, lineHeight + 2);
    doc.text(line, margin + indent, y);
    y += lineHeight;
  }

  return y + 2;
}

/**
 * Dessine un titre de chapitre (grande taille, avec ligne décorative).
 * Ajoute une nouvelle page si nécessaire.
 * @returns La nouvelle position Y
 */
export function addChapterTitle(
  doc: jsPDF,
  chapterNumber: string,
  title: string,
  yPosition: number,
  theme: ReportTheme,
  options?: {
    color?: string;
    addPageBefore?: boolean;
  },
): number {
  if (options?.addPageBefore) {
    doc.addPage();
  }

  const { margin, contentWidth } = getPageDimensions(doc, theme);
  let y = options?.addPageBefore ? 25 : checkPageBreak(doc, yPosition, 40);

  const color = options?.color || theme.primaryColor;
  const [cr, cg, cb] = hexToRgb(color);

  // Numéro de chapitre
  doc.setFontSize(14);
  doc.setFont(theme.fontFamily, 'bold');
  doc.setTextColor(cr, cg, cb);
  doc.text(chapterNumber, margin, y);
  y += 8;

  // Titre du chapitre
  doc.setFontSize(18);
  doc.setFont(theme.fontFamily, 'bold');
  const [tr, tg, tb] = hexToRgb(theme.textColor);
  doc.setTextColor(tr, tg, tb);
  const titleLines = doc.splitTextToSize(title, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 7 + 2;

  // Ligne décorative
  doc.setDrawColor(cr, cg, cb);
  doc.setLineWidth(1);
  doc.line(margin, y, margin + 50, y);
  y += 10;

  return y;
}

/**
 * Dessine une boîte d'information (fond léger, texte avec label)
 * @returns La nouvelle position Y
 */
export function addInfoBox(
  doc: jsPDF,
  label: string,
  text: string,
  yPosition: number,
  theme: ReportTheme,
  options?: {
    accentColor?: string;
    icon?: string;
  },
): number {
  const { margin, contentWidth } = getPageDimensions(doc, theme);
  const accentColor = options?.accentColor || theme.primaryColor;

  // Calculer la hauteur nécessaire
  doc.setFontSize(8);
  const textLines = doc.splitTextToSize(text, contentWidth - 12);
  const boxHeight = Math.max(20, 14 + textLines.length * 4);

  let y = checkPageBreak(doc, yPosition, boxHeight + 5);

  // Fond léger
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'F');

  // Barre d'accent à gauche
  const [ar, ag, ab] = hexToRgb(accentColor);
  doc.setFillColor(ar, ag, ab);
  doc.rect(margin, y, 2.5, boxHeight, 'F');

  // Label
  doc.setFontSize(8);
  doc.setFont(theme.fontFamily, 'bold');
  doc.setTextColor(ar, ag, ab);
  doc.text(label.toUpperCase(), margin + 6, y + 6);

  // Texte
  const [tr, tg, tb] = hexToRgb(theme.textColor);
  doc.setFontSize(8);
  doc.setFont(theme.fontFamily, 'normal');
  doc.setTextColor(tr, tg, tb);
  doc.text(textLines, margin + 6, y + 12);

  return y + boxHeight + 5;
}

/**
 * Dessine un badge ESRS (petit rectangle coloré avec référence)
 * @returns La nouvelle position Y
 */
export function addESRSBadge(
  doc: jsPDF,
  esrsRef: string,
  yPosition: number,
  theme: ReportTheme,
): number {
  const { margin } = getPageDimensions(doc, theme);
  const y = checkPageBreak(doc, yPosition, 10);

  // Badge fond
  const badgeText = `Ref. ESRS : ${esrsRef}`;
  doc.setFontSize(7);
  const textW = doc.getTextWidth(badgeText) + 6;
  const [pr, pg, pb] = hexToRgb(theme.primaryColor);
  doc.setFillColor(pr, pg, pb);
  doc.setGState(doc.GState({ opacity: 0.12 }));
  doc.roundedRect(margin, y, textW, 6, 1, 1, 'F');
  doc.setGState(doc.GState({ opacity: 1 }));

  // Badge texte
  doc.setTextColor(pr, pg, pb);
  doc.setFont(theme.fontFamily, 'bold');
  doc.text(badgeText, margin + 3, y + 4.2);

  return y + 10;
}

/**
 * Dessine un séparateur horizontal subtil
 */
export function addSeparator(
  doc: jsPDF,
  yPosition: number,
  theme: ReportTheme,
): number {
  const { margin, contentWidth } = getPageDimensions(doc, theme);
  const y = checkPageBreak(doc, yPosition, 5);

  const [mr, mg, mb] = hexToRgb(theme.mutedTextColor);
  doc.setDrawColor(mr, mg, mb);
  doc.setLineWidth(0.15);
  doc.line(margin, y, margin + contentWidth, y);

  return y + 5;
}

/**
 * Dessine un "key message" — phrase clé en gras dans un encadré subtil
 * @returns La nouvelle position Y
 */
export function addKeyMessage(
  doc: jsPDF,
  message: string,
  yPosition: number,
  theme: ReportTheme,
  color?: string,
): number {
  const { margin, contentWidth } = getPageDimensions(doc, theme);
  const accentColor = color || theme.primaryColor;
  const [ar, ag, ab] = hexToRgb(accentColor);

  doc.setFontSize(10);
  doc.setFont(theme.fontFamily, 'normal');
  const lines = doc.splitTextToSize(message, contentWidth - 15);
  const boxH = 8 + lines.length * 5;

  let y = checkPageBreak(doc, yPosition, boxH + 3);

  // Barre d'accent
  doc.setFillColor(ar, ag, ab);
  doc.rect(margin, y, 1.5, boxH, 'F');

  // Texte en italique
  doc.setFontSize(10);
  doc.setFont(theme.fontFamily, 'italic');
  doc.setTextColor(ar, ag, ab);
  doc.text(lines, margin + 6, y + 6);

  return y + boxH + 5;
}
