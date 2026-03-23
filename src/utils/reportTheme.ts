/**
 * REPORT THEME — Système de thème pour les rapports PDF
 *
 * Définit les couleurs, polices et branding appliqués à tous les rapports.
 * Le thème par défaut reflète l'identité Solvid.IA / Impactly.ia.
 * Les organisations peuvent personnaliser via BrandConfig.
 */

import type { BrandConfig } from './reportTypes';

// ==================== THEME INTERFACE ====================

export interface ReportTheme {
  // Couleurs principales
  primaryColor: string;         // Headers, accents, barres de section
  secondaryColor: string;       // Fond de couverture, footer
  lightBgColor: string;         // Fond clair pour sections et cartes

  // Couleurs texte
  textColor: string;            // Texte principal
  mutedTextColor: string;       // Texte secondaire (métadonnées, légendes)

  // Couleurs ESG (constantes, pas personnalisables)
  esgColors: {
    E: string;
    S: string;
    G: string;
  };

  // Couleurs de statut
  statusColors: {
    success: string;
    warning: string;
    danger: string;
  };

  // Branding
  organizationName: string;
  logoBase64: string | null;

  // Layout
  margin: number;               // marge en mm
  headerHeight: number;         // hauteur header couverture en mm

  // Typographie
  fontFamily: string;           // 'helvetica' (natif jsPDF)
}

// ==================== THEME PAR DÉFAUT ====================

export const DEFAULT_THEME: ReportTheme = {
  primaryColor: '#059669',
  secondaryColor: '#0A3B2E',
  lightBgColor: '#E8F3F0',

  textColor: '#1A2E24',
  mutedTextColor: '#6B7280',

  esgColors: {
    E: '#2D9D5F',
    S: '#2980B9',
    G: '#8E44AD',
  },

  statusColors: {
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#DC2626',
  },

  organizationName: 'Solvid.IA',
  logoBase64: null,

  margin: 20,
  headerHeight: 80,

  fontFamily: 'helvetica',
};

// ==================== THEME BUILDER ====================

/**
 * Construit un thème à partir d'une BrandConfig (fusion avec les defaults)
 */
export function buildTheme(brandConfig?: BrandConfig): ReportTheme {
  if (!brandConfig) return { ...DEFAULT_THEME };

  const primaryColor = brandConfig.primaryColor || DEFAULT_THEME.primaryColor;

  return {
    ...DEFAULT_THEME,
    primaryColor,
    secondaryColor: brandConfig.secondaryColor || DEFAULT_THEME.secondaryColor,
    lightBgColor: lightenHexColor(primaryColor, 0.85),
    organizationName: brandConfig.organizationName || DEFAULT_THEME.organizationName,
    logoBase64: brandConfig.logoBase64 || null,
  };
}

// ==================== COULEUR HELPERS ====================

/**
 * Parse un hex (#RRGGBB) en tuple [R, G, B]
 */
export function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return [r, g, b];
}

/**
 * Éclaircir une couleur hex vers le blanc
 * @param factor 0 = couleur originale, 1 = blanc
 */
export function lightenHexColor(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  const lr = Math.round(r + (255 - r) * factor);
  const lg = Math.round(g + (255 - g) * factor);
  const lb = Math.round(b + (255 - b) * factor);
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
}

/**
 * Assombrir une couleur hex
 * @param factor 0 = couleur originale, 1 = noir
 */
export function darkenHexColor(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  const dr = Math.round(r * (1 - factor));
  const dg = Math.round(g * (1 - factor));
  const db = Math.round(b * (1 - factor));
  return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
}

/**
 * Retourne la couleur du statut de score (vert/orange/rouge)
 */
export function getScoreColor(score: number, theme: ReportTheme): string {
  if (score >= 80) return theme.statusColors.success;
  if (score >= 50) return theme.statusColors.warning;
  return theme.statusColors.danger;
}

/**
 * Retourne la couleur ESG pour une catégorie
 */
export function getESGColor(category: 'E' | 'S' | 'G', theme: ReportTheme): string {
  return theme.esgColors[category];
}
