import JSZip from 'jszip';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { dataProvider } from '@/services/dataProvider';
import {
  addExportToHistory,
  generateExportId,
  calculateTotalSize,
  formatFileSize,
  type ExportHistoryEntry,
  type ExportOptions
} from './exportHistoryService';
import { generateStandardReport } from '@/utils/professionalReports';
import type { ReportPackData, ReportChecklistItem, ReportKPIRequirement, ReportEvidence, BrandConfig } from '@/utils/reportTypes';
import { buildTheme, hexToRgb } from '@/utils/reportTheme';
import { addCoverHeader, addSectionTitle, addFootersToAllPages, checkPageBreak, getPageDimensions } from '@/utils/reportHelpers';

// ============================================================================
// EXPORT SERVICE - Phase 9 (refactored)
// ============================================================================
// Service centralisé pour générer tous types d'exports (PDF, JSON, CSV, ZIP).
// La génération PDF est déléguée au moteur professionalReports.

// Types (backward compat)
export interface Pack {
  id: string;
  name: string;
  templateCode: string;
  templateName: string;
  status: string;
  completionScore: number;
  checklistItems: any[];
  kpiRequirements: any[];
  evidences?: any[];
  owner: string;
  createdAt: string;
  updatedAt: string;
}

export interface Indicator {
  id: string;
  code: string;
  name: string;
  pillar: 'E' | 'S' | 'G';
  value?: number;
  unit?: string;
  period?: string;
  status?: string;
}

export type ExportFormat = 'pdf' | 'json' | 'excel' | 'all';
export type ExportScope = 'indicators' | 'audit' | 'evidences' | 'complete';

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

/**
 * Generate comprehensive export with multiple formats
 */
export async function generateExport(
  format: ExportFormat,
  scope: ExportScope,
  indicators: Indicator[],
  options: ExportOptions,
  pack?: Pack,
  onProgress?: (progress: number, message: string) => void,
  brandConfig?: BrandConfig,
): Promise<ExportHistoryEntry> {

  const exportId = generateExportId();
  const timestamp = new Date().toISOString();

  onProgress?.(10, 'Préparation des données...');

  // Prepare data based on scope
  const data = await prepareExportData(scope, indicators, options, pack);

  // Generate files based on format
  let pdfBlob: Blob | undefined;
  let jsonBlob: Blob | undefined;
  let excelBlob: Blob | undefined;
  let zipBlob: Blob | undefined;

  if (format === 'pdf' || format === 'all') {
    onProgress?.(30, 'Génération du PDF...');
    pdfBlob = await generatePDFFromPack(data, pack, brandConfig);
  }

  if (format === 'json' || format === 'all') {
    onProgress?.(50, 'Génération du JSON...');
    jsonBlob = generateJSONBlob(data);
  }

  if (format === 'excel' || format === 'all') {
    onProgress?.(60, 'Génération du CSV...');
    excelBlob = generateCSVBlob(data);
  }

  if (format === 'all') {
    onProgress?.(80, 'Création du ZIP...');
    zipBlob = await generateZIPBlob(pdfBlob, jsonBlob, excelBlob, data, pack, brandConfig);
  }

  // Calculate total size
  const totalSize = calculateTotalSize([pdfBlob, jsonBlob, excelBlob, zipBlob]);

  // Create history entry
  const entry: ExportHistoryEntry = {
    id: exportId,
    name: pack ? `${pack.name}_Export` : `ESG_Export_${new Date().toLocaleDateString('fr-FR')}`,
    format,
    scope: getScopeLabel(scope),
    size: totalSize,
    sizeFormatted: formatFileSize(totalSize),
    createdAt: timestamp,
    status: 'completed',
    packId: pack?.id,
    packName: pack?.name,
    options,
    pdfBlob,
    jsonBlob,
    excelBlob,
    zipBlob,
  };

  // Save to IndexedDB
  await addExportToHistory(entry);

  onProgress?.(100, 'Export terminé !');

  return entry;
}

// ============================================================================
// DATA PREPARATION
// ============================================================================

async function prepareExportData(
  scope: ExportScope,
  indicators: Indicator[],
  options: ExportOptions,
  pack?: Pack
) {
  const data: any = {
    exportDate: new Date().toISOString(),
    scope,
    options,
  };

  // Indicators
  if (scope === 'indicators' || scope === 'complete') {
    let filteredIndicators = indicators;

    // Apply category filter
    if (options.categoryFilter && options.categoryFilter !== 'all') {
      filteredIndicators = indicators.filter(i => i.pillar === options.categoryFilter);
    }

    data.indicators = filteredIndicators.map(ind => ({
      code: ind.code,
      name: ind.name,
      category: ind.pillar,
      value: ind.value || null,
      unit: ind.unit || '',
      period: ind.period || new Date().getFullYear().toString(),
      status: ind.status || 'DRAFT',
    }));
  }

  // Audit Trail
  if ((scope === 'audit' || scope === 'complete') && options.includeAuditTrail) {
    const auditLogs = await dataProvider.store.list('audit_logs');
    data.auditTrail = auditLogs.sort((a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Evidences (si pack fourni)
  if ((scope === 'evidences' || scope === 'complete') && options.includeEvidences && pack?.evidences) {
    data.evidences = pack.evidences.map((ev: any) => ({
      fileName: ev.file_name,
      fileType: ev.file_type,
      fileSize: formatFileSize(ev.file_size),
      rawFileSize: ev.file_size,
      linkedIndicators: ev.linked_indicators || [],
      period: ev.period,
      uploadedBy: ev.uploaded_by,
      createdAt: ev.created_at,
    }));
  }

  // Pack metadata (si fourni)
  if (pack) {
    data.pack = {
      id: pack.id,
      name: pack.name,
      templateCode: pack.templateCode,
      templateName: pack.templateName,
      status: pack.status,
      completionScore: pack.completionScore,
      owner: pack.owner,
      createdAt: pack.createdAt,
      updatedAt: pack.updatedAt,
      checklistItemsCount: pack.checklistItems?.length || 0,
      kpiRequirementsCount: pack.kpiRequirements?.length || 0,
      evidencesCount: pack.evidences?.length || 0,
    };
  }

  return data;
}

// ============================================================================
// PDF GENERATION (déléguée à professionalReports)
// ============================================================================

/**
 * Génère un PDF via le moteur de rapport standard.
 * Convertit les données d'export en ReportPackData si un pack est disponible,
 * sinon génère un rapport simplifié avec les indicateurs bruts.
 */
async function generatePDFFromPack(
  data: any,
  pack?: Pack,
  brandConfig?: BrandConfig,
): Promise<Blob> {
  // Si on a un pack complet, utiliser le moteur de rapport professionnel
  if (pack) {
    const reportData: ReportPackData = {
      pack: {
        id: pack.id,
        name: pack.name,
        templateCode: pack.templateCode,
        templateName: pack.templateName,
        status: pack.status,
        completionScore: pack.completionScore,
        owner: pack.owner,
        createdAt: pack.createdAt,
        updatedAt: pack.updatedAt,
      },
      checklistItems: (pack.checklistItems || []).map((i: any): ReportChecklistItem => ({
        id: i.id || '',
        code: i.code || '',
        label: i.label || '',
        category: i.category || 'E',
        requirementLevel: i.requirementLevel || i.requirement_level || 'MANDATORY',
        status: i.status || 'MISSING',
        description: i.description,
        comment: i.comment,
      })),
      kpiRequirements: (pack.kpiRequirements || []).map((k: any): ReportKPIRequirement => ({
        id: k.id || '',
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
      evidences: (pack.evidences || []).map((e: any): ReportEvidence => ({
        id: e.id || '',
        fileName: e.file_name || e.fileName || '',
        fileType: e.file_type || e.fileType || '',
        fileSize: e.file_size || e.fileSize || 0,
        period: e.period,
        uploadedAt: e.created_at || e.uploadedAt || new Date().toISOString(),
        linkedIndicators: e.linked_indicators || e.linkedIndicators || [],
      })),
    };

    return generateStandardReport(reportData, {
      reportType: 'standard',
      includeExecutiveSummary: true,
      includeEvidence: true,
      includeAuditTrail: false,
      brandConfig,
    });
  }

  // Sinon — export sans pack (indicateurs seuls) : rapport simplifié
  return generateSimpleIndicatorsPDF(data, brandConfig);
}

/**
 * Rapport PDF simplifié quand aucun pack n'est disponible
 * (export d'indicateurs bruts seulement)
 */
async function generateSimpleIndicatorsPDF(
  data: any,
  brandConfig?: BrandConfig,
): Promise<Blob> {
  const theme = buildTheme(brandConfig);
  const doc = new jsPDF();
  const { margin, contentWidth } = getPageDimensions(doc, theme);

  // ========== COUVERTURE ==========
  let y = addCoverHeader(doc, theme, 'Export ESG', `Données exportées le ${new Date().toLocaleDateString('fr-FR')}`);

  // Métadonnées
  const [tr, tg, tb] = hexToRgb(theme.textColor);
  const [mr, mg, mb] = hexToRgb(theme.mutedTextColor);
  doc.setTextColor(mr, mg, mb);
  doc.setFontSize(10);
  doc.setFont(theme.fontFamily, 'normal');
  doc.text(`Périmètre : ${data.scope}`, margin, y);
  y += 6;
  doc.text(`Date : ${new Date(data.exportDate).toLocaleString('fr-FR')}`, margin, y);
  y += 15;

  // ========== RÉSUMÉ ==========
  if (data.indicators) {
    y = addSectionTitle(doc, 'Résumé', y, theme);
    doc.setTextColor(tr, tg, tb);
    doc.setFontSize(10);
    doc.setFont(theme.fontFamily, 'normal');

    const byCategory = {
      E: data.indicators.filter((i: any) => i.category === 'E').length,
      S: data.indicators.filter((i: any) => i.category === 'S').length,
      G: data.indicators.filter((i: any) => i.category === 'G').length,
    };
    doc.text(`Nombre total de données : ${data.indicators.length}`, margin, y); y += 6;
    doc.text(`  Environnement (E) : ${byCategory.E}`, margin, y); y += 5;
    doc.text(`  Social (S) : ${byCategory.S}`, margin, y); y += 5;
    doc.text(`  Gouvernance (G) : ${byCategory.G}`, margin, y); y += 10;

    if (data.auditTrail) {
      doc.text(`Événements d'audit : ${data.auditTrail.length}`, margin, y); y += 6;
    }
    if (data.evidences) {
      doc.text(`Justificatifs : ${data.evidences.length}`, margin, y); y += 6;
    }
    y += 5;
  }

  // ========== TABLEAU INDICATEURS ==========
  if (data.indicators && data.indicators.length > 0) {
    y = checkPageBreak(doc, y, 40);
    y = addSectionTitle(doc, 'Données ESG', y, theme);

    const [pr, pg, pb] = hexToRgb(theme.primaryColor);

    const tableData = data.indicators.map((ind: any) => [
      ind.code,
      ind.name.substring(0, 50) + (ind.name.length > 50 ? '...' : ''),
      ind.category,
      ind.value !== null && ind.value !== undefined ? `${ind.value} ${ind.unit}` : '-',
      ind.status || '-',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Code', 'Indicateur', 'Cat.', 'Valeur', 'Statut']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [pr, pg, pb],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: { fontSize: 8, textColor: [tr, tg, tb] },
      alternateRowStyles: { fillColor: [243, 244, 246] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 70 },
        2: { cellWidth: 15 },
        3: { cellWidth: 35 },
        4: { cellWidth: 25 },
      },
      margin: { left: margin, right: margin },
    });

    y = (doc as any).lastAutoTable.finalY + 15;
  }

  // ========== AUDIT TRAIL ==========
  if (data.auditTrail && data.auditTrail.length > 0) {
    y = checkPageBreak(doc, y, 40);
    y = addSectionTitle(doc, 'Audit Trail', y, theme);

    const [pr, pg, pb] = hexToRgb(theme.primaryColor);
    const recentEntries = data.auditTrail.slice(0, 50);

    const auditTableData = recentEntries.map((entry: any) => [
      new Date(entry.timestamp).toLocaleString('fr-FR'),
      entry.user || '-',
      entry.action || '-',
      entry.entity_type || '-',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Date', 'Utilisateur', 'Action', 'Type']],
      body: auditTableData,
      theme: 'striped',
      headStyles: {
        fillColor: [pr, pg, pb],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: { fontSize: 7, textColor: [tr, tg, tb] },
      alternateRowStyles: { fillColor: [243, 244, 246] },
      margin: { left: margin, right: margin },
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    if (data.auditTrail.length > 50) {
      doc.setFontSize(8);
      doc.setTextColor(mr, mg, mb);
      doc.text(
        `Note : Affichage des 50 événements les plus récents. Total : ${data.auditTrail.length} événements.`,
        margin,
        y,
      );
    }
  }

  // ========== FOOTER ==========
  addFootersToAllPages(doc, theme, 'Export ESG');

  return doc.output('blob') as unknown as Blob;
}

// ============================================================================
// JSON GENERATION
// ============================================================================

function generateJSONBlob(data: any): Blob {
  const jsonString = JSON.stringify(data, null, 2);
  return new Blob([jsonString], { type: 'application/json' });
}

// ============================================================================
// CSV GENERATION
// ============================================================================

function generateCSVBlob(data: any): Blob {
  let csvContent = '';

  // ===== INDICATORS CSV =====
  if (data.indicators && data.indicators.length > 0) {
    csvContent += 'DONNÉES ESG\n';
    csvContent += 'Code,Nom,Catégorie,Valeur,Unité,Période,Statut\n';

    data.indicators.forEach((ind: any) => {
      const row = [
        ind.code || '',
        `"${ind.name?.replace(/"/g, '""') || ''}"`,
        ind.category || '',
        ind.value !== null && ind.value !== undefined ? ind.value : '',
        ind.unit || '',
        ind.period || '',
        ind.status || '',
      ];
      csvContent += row.join(',') + '\n';
    });

    csvContent += '\n\n';
  }

  // ===== AUDIT TRAIL CSV =====
  if (data.auditTrail && data.auditTrail.length > 0) {
    csvContent += 'AUDIT TRAIL\n';
    csvContent += 'Timestamp,Utilisateur,Action,Type Entité,ID Entité,Ancienne Valeur,Nouvelle Valeur,Commentaire\n';

    data.auditTrail.forEach((entry: any) => {
      const row = [
        entry.timestamp || '',
        `"${entry.user?.replace(/"/g, '""') || ''}"`,
        `"${entry.action?.replace(/"/g, '""') || ''}"`,
        entry.entity_type || '',
        entry.entity_id || '',
        `"${JSON.stringify(entry.old_value || '').replace(/"/g, '""')}"`,
        `"${JSON.stringify(entry.new_value || '').replace(/"/g, '""')}"`,
        `"${entry.comment?.replace(/"/g, '""') || ''}"`,
      ];
      csvContent += row.join(',') + '\n';
    });
  }

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

// ============================================================================
// ZIP GENERATION
// ============================================================================

async function generateZIPBlob(
  pdfBlob: Blob | undefined,
  jsonBlob: Blob | undefined,
  excelBlob: Blob | undefined,
  data: any,
  pack?: Pack,
  brandConfig?: BrandConfig,
): Promise<Blob> {
  const zip = new JSZip();

  const folderName = pack ? pack.name.replace(/[^a-z0-9]/gi, '_') : 'ESG_Export';
  const folder = zip.folder(folderName);

  if (!folder) {
    throw new Error('Failed to create ZIP folder');
  }

  if (pdfBlob) folder.file('rapport.pdf', pdfBlob);
  if (jsonBlob) folder.file('donnees.json', jsonBlob);
  if (excelBlob) folder.file('export.csv', excelBlob);

  // README avec le nom d'organisation du branding
  const orgName = brandConfig?.organizationName || 'Solvid.IA';
  const readme = generateReadme(data, pack, orgName);
  folder.file('README.txt', readme);

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

// ============================================================================
// README GENERATION
// ============================================================================

function generateReadme(data: any, pack?: Pack, orgName: string = 'Solvid.IA'): string {
  const date = new Date().toLocaleDateString('fr-FR');
  const time = new Date().toLocaleTimeString('fr-FR');

  return `
${'='.repeat(63)}
  EXPORT ESG
${'='.repeat(63)}

Organisation: ${orgName}
Date d'export: ${date} a ${time}
${pack ? `Pack: ${pack.name} (${pack.templateName})` : ''}
Perimetre: ${data.scope}

${'-'.repeat(63)}
CONTENU DU DOSSIER
${'-'.repeat(63)}

  rapport.pdf
   Rapport complet ESG avec :
   - Resume executif avec diagrammes
   - Donnees par categorie E/S/G
   - Audit trail
   - Statistiques de progression

  export.csv
   Donnees brutes au format CSV :
   - Donnees ESG avec valeurs
   - Audit trail complet
   - Compatible Excel, Google Sheets, etc.

  donnees.json
   Donnees structurees au format JSON :
   - Donnees avec metadonnees
   - Audit trail
   - Justificatifs (metadonnees)
   - Format API-ready

${'-'.repeat(63)}
STATISTIQUES
${'-'.repeat(63)}

${data.indicators ? `Donnees: ${data.indicators.length}` : ''}
${data.auditTrail ? `Evenements d'audit: ${data.auditTrail.length}` : ''}
${data.evidences ? `Justificatifs: ${data.evidences.length}` : ''}

${'-'.repeat(63)}
UTILISATION
${'-'.repeat(63)}

1. Ouvrez rapport.pdf pour la vue d'ensemble
2. Importez export.csv dans Excel pour analyse
3. Utilisez donnees.json pour integrations API
4. Ce dossier est pret pour verification et tracable

${'-'.repeat(63)}
CONTACT
${'-'.repeat(63)}

${pack ? `Proprietaire: ${pack.owner}` : ''}
${pack ? `Cree le: ${new Date(pack.createdAt).toLocaleDateString('fr-FR')}` : ''}

Pour toute question, contactez votre administrateur ${orgName}.

${'='.repeat(63)}
  Genere par ${orgName} - Plateforme ESG
${'='.repeat(63)}
`;
}

// ============================================================================
// UTILITIES
// ============================================================================

function getScopeLabel(scope: ExportScope): string {
  const labels: Record<ExportScope, string> = {
    indicators: 'Données uniquement',
    audit: 'Audit Trail uniquement',
    evidences: 'Justificatifs uniquement',
    complete: 'Export complet',
  };
  return labels[scope] || scope;
}
