/**
 * PDF CHARTS — Module de diagrammes natifs jsPDF
 *
 * Toutes les fonctions dessinent directement sur un document jsPDF
 * sans aucune dépendance externe. Les arcs (camembert, jauges)
 * sont approximés par des séries de petits polygones remplis.
 *
 * Unités : mm (système par défaut de jsPDF)
 */

import jsPDF from 'jspdf';
import { hexToRgb } from './reportTheme';

// ==================== TYPES ====================

export interface PieSegment {
  value: number;
  color: string;   // hex
  label: string;
}

export interface PieChartOptions {
  showLabels?: boolean;
  showPercentages?: boolean;
  labelFontSize?: number;
  startAngle?: number;        // radians, default -PI/2 (12 o'clock)
}

export interface BarData {
  label: string;
  value: number;
  color: string;
}

export interface BarChartOptions {
  maxValue?: number;
  showValues?: boolean;
  barSpacing?: number;         // mm
  labelFontSize?: number;
  valueFontSize?: number;
}

export interface ProgressBarOptions {
  backgroundColor?: string;
  showPercentageText?: boolean;
  borderRadius?: number;
  textColor?: string;
  fontSize?: number;
}

export interface GaugeOptions {
  arcWidth?: number;           // épaisseur du trait (mm)
  backgroundColor?: string;
  showValueText?: boolean;
  label?: string;
  valueFontSize?: number;
  labelFontSize?: number;
}

export interface HorizontalBarItem {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  suffix?: string;
}

export interface HorizontalBarOptions {
  barHeight?: number;
  barSpacing?: number;
  labelWidth?: number;
  showValues?: boolean;
  fontSize?: number;
}

export interface LegendItem {
  label: string;
  color: string;
}

export interface LegendOptions {
  direction?: 'horizontal' | 'vertical';
  swatchSize?: number;
  fontSize?: number;
  spacing?: number;
}

export interface MetricCardData {
  label: string;
  value: string;
  subtext?: string;
  color: string;
}

export interface MetricCardOptions {
  backgroundColor?: string;
  showColorBar?: boolean;
}

// ==================== COLOR HELPERS ====================

function setFill(doc: jsPDF, hex: string): void {
  const [r, g, b] = hexToRgb(hex);
  doc.setFillColor(r, g, b);
}

function setDraw(doc: jsPDF, hex: string): void {
  const [r, g, b] = hexToRgb(hex);
  doc.setDrawColor(r, g, b);
}

function setText(doc: jsPDF, hex: string): void {
  const [r, g, b] = hexToRgb(hex);
  doc.setTextColor(r, g, b);
}

// ==================== PIE CHART ====================

/**
 * Dessine un camembert (pie chart) avec segments colorés
 *
 * Technique : Chaque segment est dessiné comme une série de petits
 * triangles du centre vers la périphérie, par pas de 2 degrés.
 */
export function drawPieChart(
  doc: jsPDF,
  centerX: number,
  centerY: number,
  radius: number,
  segments: PieSegment[],
  options: PieChartOptions = {},
): void {
  const {
    showLabels = true,
    showPercentages = true,
    labelFontSize = 8,
    startAngle = -Math.PI / 2,
  } = options;

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return;

  const STEP = (2 * Math.PI) / 180; // 2 degrés

  let currentAngle = startAngle;

  for (const segment of segments) {
    if (segment.value <= 0) continue;

    const segmentAngle = (segment.value / total) * 2 * Math.PI;
    const endAngle = currentAngle + segmentAngle;

    setFill(doc, segment.color);
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.3);

    // Dessiner le segment par petits triangles
    let angle = currentAngle;
    while (angle < endAngle) {
      const nextAngle = Math.min(angle + STEP, endAngle);

      const x1 = centerX + radius * Math.cos(angle);
      const y1 = centerY + radius * Math.sin(angle);
      const x2 = centerX + radius * Math.cos(nextAngle);
      const y2 = centerY + radius * Math.sin(nextAngle);

      // Triangle : centre → point1 → point2
      doc.triangle(centerX, centerY, x1, y1, x2, y2, 'F');

      angle = nextAngle;
    }

    // Label au milieu du segment
    if (showLabels || showPercentages) {
      const midAngle = currentAngle + segmentAngle / 2;
      const labelRadius = radius * 0.65;
      const lx = centerX + labelRadius * Math.cos(midAngle);
      const ly = centerY + labelRadius * Math.sin(midAngle);

      const percentage = Math.round((segment.value / total) * 100);

      // Ne pas afficher le label si le segment est trop petit
      if (percentage >= 5) {
        doc.setFontSize(labelFontSize);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);

        if (showPercentages) {
          const text = `${percentage}%`;
          const tw = doc.getTextWidth(text);
          doc.text(text, lx - tw / 2, ly + 1);
        }
      }
    }

    currentAngle = endAngle;
  }

  // Labels externes (à droite du camembert)
  if (showLabels) {
    let labelY = centerY - (segments.length * 6) / 2;
    const labelX = centerX + radius + 8;

    doc.setFontSize(labelFontSize);
    for (const segment of segments) {
      if (segment.value <= 0) continue;
      const percentage = Math.round((segment.value / total) * 100);

      // Pastille colorée
      setFill(doc, segment.color);
      doc.rect(labelX, labelY - 2.5, 3, 3, 'F');

      // Texte
      doc.setTextColor(50, 50, 50);
      doc.setFont('helvetica', 'normal');
      doc.text(`${segment.label} (${percentage}%)`, labelX + 5, labelY);

      labelY += 6;
    }
  }
}

// ==================== PROGRESS BAR ====================

/**
 * Dessine une barre de progression horizontale
 */
export function drawProgressBar(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  percentage: number,
  fillColor: string,
  options: ProgressBarOptions = {},
): void {
  const {
    backgroundColor = '#E5E7EB',
    showPercentageText = true,
    borderRadius = 1.5,
    textColor = '#FFFFFF',
    fontSize = 8,
  } = options;

  const clampedPct = Math.max(0, Math.min(100, percentage));
  const fillWidth = (width * clampedPct) / 100;

  // Fond
  setFill(doc, backgroundColor);
  doc.roundedRect(x, y, width, height, borderRadius, borderRadius, 'F');

  // Remplissage
  if (fillWidth > 0) {
    setFill(doc, fillColor);
    doc.roundedRect(x, y, Math.max(fillWidth, borderRadius * 2), height, borderRadius, borderRadius, 'F');
  }

  // Texte du pourcentage
  if (showPercentageText && height >= 5) {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    const pctText = `${Math.round(clampedPct)}%`;
    const tw = doc.getTextWidth(pctText);

    if (fillWidth > tw + 4) {
      // Texte dans la barre
      setText(doc, textColor);
      doc.text(pctText, x + fillWidth - tw - 2, y + height / 2 + fontSize / 4);
    } else {
      // Texte après la barre
      doc.setTextColor(80, 80, 80);
      doc.text(pctText, x + fillWidth + 2, y + height / 2 + fontSize / 4);
    }
  }
}

// ==================== GAUGE (SEMI-CIRCLE) ====================

/**
 * Dessine une jauge semi-circulaire (0-100%)
 *
 * L'arc va de 180° (gauche) à 0° (droite), le remplissage
 * est proportionnel au pourcentage.
 */
export function drawGauge(
  doc: jsPDF,
  centerX: number,
  centerY: number,
  radius: number,
  percentage: number,
  color: string,
  options: GaugeOptions = {},
): void {
  const {
    arcWidth = radius * 0.22,
    backgroundColor = '#E5E7EB',
    showValueText = true,
    label,
    valueFontSize = 20,
    labelFontSize = 9,
  } = options;

  const innerRadius = radius - arcWidth;
  const clampedPct = Math.max(0, Math.min(100, percentage));
  const STEP = (Math.PI) / 90; // 2 degrés

  // Arc de fond (180° → 0°)
  drawArcBand(doc, centerX, centerY, innerRadius, radius, Math.PI, 0, backgroundColor, STEP);

  // Arc rempli
  const fillEndAngle = Math.PI - (clampedPct / 100) * Math.PI;
  if (clampedPct > 0) {
    drawArcBand(doc, centerX, centerY, innerRadius, radius, Math.PI, fillEndAngle, color, STEP);
  }

  // Valeur au centre
  if (showValueText) {
    doc.setFontSize(valueFontSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    const valText = `${Math.round(clampedPct)}%`;
    const tw = doc.getTextWidth(valText);
    doc.text(valText, centerX - tw / 2, centerY - 2);
  }

  // Label sous la jauge
  if (label) {
    doc.setFontSize(labelFontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    const lw = doc.getTextWidth(label);
    doc.text(label, centerX - lw / 2, centerY + 6);
  }
}

/**
 * Dessine une bande d'arc (annulus sector) entre deux rayons
 */
function drawArcBand(
  doc: jsPDF,
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
  color: string,
  step: number,
): void {
  setFill(doc, color);

  // S'assurer que startAngle > endAngle (on va dans le sens horaire)
  const from = Math.max(startAngle, endAngle);
  const to = Math.min(startAngle, endAngle);

  let angle = from;
  while (angle > to) {
    const nextAngle = Math.max(angle - step, to);

    // 4 points : outer1, outer2, inner2, inner1
    const ox1 = cx + outerR * Math.cos(angle);
    const oy1 = cy - outerR * Math.sin(angle);
    const ox2 = cx + outerR * Math.cos(nextAngle);
    const oy2 = cy - outerR * Math.sin(nextAngle);
    const ix2 = cx + innerR * Math.cos(nextAngle);
    const iy2 = cy - innerR * Math.sin(nextAngle);
    const ix1 = cx + innerR * Math.cos(angle);
    const iy1 = cy - innerR * Math.sin(angle);

    // Quadrilatère (2 triangles)
    doc.triangle(ox1, oy1, ox2, oy2, ix1, iy1, 'F');
    doc.triangle(ox2, oy2, ix2, iy2, ix1, iy1, 'F');

    angle = nextAngle;
  }
}

// ==================== BAR CHART (VERTICAL) ====================

/**
 * Dessine un graphique à barres verticales
 */
export function drawBarChart(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  bars: BarData[],
  options: BarChartOptions = {},
): void {
  const {
    maxValue: userMaxValue,
    showValues = true,
    barSpacing = 4,
    labelFontSize = 7,
    valueFontSize = 7,
  } = options;

  if (bars.length === 0) return;

  const maxValue = userMaxValue || Math.max(...bars.map(b => b.value), 1);
  const totalSpacing = barSpacing * (bars.length - 1);
  const barWidth = (width - totalSpacing) / bars.length;
  const chartBottom = y + height;

  // Ligne de base
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(x, chartBottom, x + width, chartBottom);

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    const barX = x + i * (barWidth + barSpacing);
    const barH = (bar.value / maxValue) * (height - 10); // -10 pour espace labels
    const barY = chartBottom - barH;

    // Barre
    setFill(doc, bar.color);
    doc.rect(barX, barY, barWidth, barH, 'F');

    // Valeur au-dessus
    if (showValues) {
      doc.setFontSize(valueFontSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      const valStr = bar.value.toLocaleString('fr-FR');
      const tw = doc.getTextWidth(valStr);
      doc.text(valStr, barX + barWidth / 2 - tw / 2, barY - 2);
    }

    // Label en dessous
    doc.setFontSize(labelFontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const labelStr = bar.label.length > 12 ? bar.label.substring(0, 11) + '.' : bar.label;
    const lw = doc.getTextWidth(labelStr);
    doc.text(labelStr, barX + barWidth / 2 - lw / 2, chartBottom + 5);
  }
}

// ==================== HORIZONTAL BARS ====================

/**
 * Dessine des barres horizontales (classement/completion)
 * @returns La position Y finale après le dernier élément
 */
export function drawHorizontalBars(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  items: HorizontalBarItem[],
  options: HorizontalBarOptions = {},
): number {
  const {
    barHeight = 7,
    barSpacing = 5,
    labelWidth = 50,
    showValues = true,
    fontSize = 8,
  } = options;

  let currentY = y;
  const barAreaWidth = width - labelWidth - (showValues ? 20 : 0);

  for (const item of items) {
    // Label à gauche
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    const truncLabel = item.label.length > 28 ? item.label.substring(0, 27) + '...' : item.label;
    doc.text(truncLabel, x, currentY + barHeight / 2 + 1);

    // Fond de barre
    const barX = x + labelWidth;
    setFill(doc, '#E5E7EB');
    doc.roundedRect(barX, currentY, barAreaWidth, barHeight, 1, 1, 'F');

    // Remplissage
    const fillRatio = item.maxValue > 0 ? item.value / item.maxValue : 0;
    const fillW = barAreaWidth * Math.min(fillRatio, 1);
    if (fillW > 0) {
      setFill(doc, item.color);
      doc.roundedRect(barX, currentY, Math.max(fillW, 2), barHeight, 1, 1, 'F');
    }

    // Valeur à droite
    if (showValues) {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      const valStr = `${item.value}${item.suffix || ''}`;
      doc.text(valStr, barX + barAreaWidth + 3, currentY + barHeight / 2 + 1);
    }

    currentY += barHeight + barSpacing;
  }

  return currentY;
}

// ==================== METRIC CARD ====================

/**
 * Dessine une carte métrique (KPI card)
 */
export function drawMetricCard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  metric: MetricCardData,
  options: MetricCardOptions = {},
): void {
  const {
    backgroundColor = '#F3F4F6',
    showColorBar = true,
  } = options;

  // Fond de la carte
  setFill(doc, backgroundColor);
  doc.roundedRect(x, y, width, height, 2, 2, 'F');

  // Barre colorée en haut
  if (showColorBar) {
    setFill(doc, metric.color);
    doc.rect(x, y, width, 2.5, 'F');
  }

  // Label
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(metric.label, x + 4, y + 10);

  // Valeur principale
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  setText(doc, metric.color);
  doc.text(metric.value, x + 4, y + 21);

  // Sous-texte
  if (metric.subtext) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(140, 140, 140);
    doc.text(metric.subtext, x + 4, y + 27);
  }
}

// ==================== LEGEND ====================

/**
 * Dessine une légende avec pastilles colorées
 */
export function drawLegend(
  doc: jsPDF,
  x: number,
  y: number,
  items: LegendItem[],
  options: LegendOptions = {},
): void {
  const {
    direction = 'horizontal',
    swatchSize = 3,
    fontSize = 7,
    spacing = 4,
  } = options;

  doc.setFontSize(fontSize);
  doc.setFont('helvetica', 'normal');

  if (direction === 'horizontal') {
    let currentX = x;
    for (const item of items) {
      // Pastille
      setFill(doc, item.color);
      doc.rect(currentX, y - swatchSize / 2, swatchSize, swatchSize, 'F');

      // Texte
      doc.setTextColor(80, 80, 80);
      doc.text(item.label, currentX + swatchSize + 1.5, y + 1);

      currentX += swatchSize + doc.getTextWidth(item.label) + spacing + 1.5;
    }
  } else {
    let currentY = y;
    for (const item of items) {
      setFill(doc, item.color);
      doc.rect(x, currentY - swatchSize / 2, swatchSize, swatchSize, 'F');

      doc.setTextColor(80, 80, 80);
      doc.text(item.label, x + swatchSize + 2, currentY + 1);

      currentY += swatchSize + spacing;
    }
  }
}

// ==================== STATUS DISTRIBUTION BAR ====================

/**
 * Dessine une barre de distribution empilée (stacked bar)
 * Utile pour montrer la répartition des statuts
 */
export function drawStackedBar(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  segments: Array<{ value: number; color: string; label: string }>,
): void {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return;

  let currentX = x;
  for (const segment of segments) {
    if (segment.value <= 0) continue;
    const segWidth = (segment.value / total) * width;

    setFill(doc, segment.color);
    doc.rect(currentX, y, segWidth, height, 'F');

    // Texte dans le segment si assez large
    if (segWidth > 12) {
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      const text = `${segment.value}`;
      const tw = doc.getTextWidth(text);
      doc.text(text, currentX + segWidth / 2 - tw / 2, y + height / 2 + 1.5);
    }

    currentX += segWidth;
  }
}
