import JSZip from 'jszip';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getAllAuditEntries } from '@/data/auditData';
import { 
  addExportToHistory, 
  generateExportId, 
  calculateTotalSize, 
  formatFileSize,
  type ExportHistoryEntry,
  type ExportOptions 
} from './exportHistoryService';

// ============================================================================
// EXPORT SERVICE - Phase 9
// ============================================================================
// Service centralisé pour générer tous types d'exports (PDF, Excel, JSON, ZIP)

// Types
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
  onProgress?: (progress: number, message: string) => void
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
    pdfBlob = await generatePDFBlob(data, pack);
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
    zipBlob = await generateZIPBlob(pdfBlob, jsonBlob, excelBlob, data, pack);
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
    data.auditTrail = getAllAuditEntries();
  }
  
  // Evidences (si pack fourni)
  if ((scope === 'evidences' || scope === 'complete') && options.includeEvidences && pack?.evidences) {
    data.evidences = pack.evidences.map(ev => ({
      fileName: ev.file_name,
      fileType: ev.file_type,
      fileSize: formatFileSize(ev.file_size),
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
// PDF GENERATION
// ============================================================================

async function generatePDFBlob(data: any, pack?: Pack): Promise<Blob> {
  const doc = new jsPDF();
  
  const colors = {
    primary: '#059669',
    dark: '#0A3B2E',
    lightGreen: '#E8F3F0',
    gray: '#6B7280',
    lightGray: '#F3F4F6',
    white: '#FFFFFF',
  };
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = 20;
  
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };
  
  // ========== COVER PAGE ==========
  doc.setFillColor(colors.dark);
  doc.rect(0, 0, pageWidth, 60, 'F');
  
  doc.setTextColor(colors.white);
  doc.setFontSize(12);
  doc.text('Solvid.IA', margin, 20);
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Rapport ESG Audit-Ready', margin, 40);
  
  yPosition = 70;
  
  // Title
  doc.setTextColor(colors.dark);
  doc.setFontSize(18);
  doc.text(pack ? pack.name : 'Export ESG Complet', margin, yPosition);
  yPosition += 10;
  
  // Metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.gray);
  doc.text(`Date d'export: ${new Date(data.exportDate).toLocaleString('fr-FR')}`, margin, yPosition);
  yPosition += 5;
  doc.text(`Périmètre: ${data.scope}`, margin, yPosition);
  yPosition += 15;
  
  // ========== EXECUTIVE SUMMARY ==========
  checkPageBreak(40);
  
  doc.setFillColor(colors.primary);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(colors.white);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Résumé Exécutif', margin + 3, yPosition + 6);
  yPosition += 15;
  
  doc.setTextColor(colors.dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  if (data.indicators) {
    doc.text(`Nombre total d'indicateurs: ${data.indicators.length}`, margin, yPosition);
    yPosition += 5;
    
    const byCategory = {
      E: data.indicators.filter((i: any) => i.category === 'E').length,
      S: data.indicators.filter((i: any) => i.category === 'S').length,
      G: data.indicators.filter((i: any) => i.category === 'G').length,
    };
    
    doc.text(`  - Environnement (E): ${byCategory.E}`, margin, yPosition);
    yPosition += 5;
    doc.text(`  - Social (S): ${byCategory.S}`, margin, yPosition);
    yPosition += 5;
    doc.text(`  - Gouvernance (G): ${byCategory.G}`, margin, yPosition);
    yPosition += 10;
  }
  
  if (data.auditTrail) {
    doc.text(`Événements d'audit: ${data.auditTrail.length}`, margin, yPosition);
    yPosition += 10;
  }
  
  if (data.evidences) {
    doc.text(`Preuves jointes: ${data.evidences.length}`, margin, yPosition);
    yPosition += 10;
  }
  
  // ========== INDICATORS TABLE ==========
  if (data.indicators && data.indicators.length > 0) {
    checkPageBreak(40);
    
    doc.setFillColor(colors.primary);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
    doc.setTextColor(colors.white);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Indicateurs ESG', margin + 3, yPosition + 6);
    yPosition += 15;
    
    const tableData = data.indicators.map((ind: any) => [
      ind.code,
      ind.name.substring(0, 50) + (ind.name.length > 50 ? '...' : ''),
      ind.category,
      ind.value !== null ? `${ind.value} ${ind.unit}` : '-',
      ind.status || '-',
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Code', 'Indicateur', 'Cat.', 'Valeur', 'Statut']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: colors.primary,
        textColor: colors.white,
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: colors.dark,
      },
      alternateRowStyles: {
        fillColor: colors.lightGray,
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 70 },
        2: { cellWidth: 15 },
        3: { cellWidth: 35 },
        4: { cellWidth: 25 },
      },
      margin: { left: margin, right: margin },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // ========== AUDIT TRAIL TABLE ==========
  if (data.auditTrail && data.auditTrail.length > 0) {
    checkPageBreak(40);
    
    doc.setFillColor(colors.primary);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
    doc.setTextColor(colors.white);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Audit Trail', margin + 3, yPosition + 6);
    yPosition += 15;
    
    // Show only last 50 entries to avoid huge PDF
    const recentEntries = data.auditTrail.slice(0, 50);
    
    const auditTableData = recentEntries.map((entry: any) => [
      new Date(entry.timestamp).toLocaleString('fr-FR'),
      entry.user || '-',
      entry.action || '-',
      entry.entity_type || '-',
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Utilisateur', 'Action', 'Type']],
      body: auditTableData,
      theme: 'striped',
      headStyles: {
        fillColor: colors.primary,
        textColor: colors.white,
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7,
        textColor: colors.dark,
      },
      alternateRowStyles: {
        fillColor: colors.lightGray,
      },
      margin: { left: margin, right: margin },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
    
    if (data.auditTrail.length > 50) {
      doc.setFontSize(8);
      doc.setTextColor(colors.gray);
      doc.text(
        `Note: Affichage des 50 événements les plus récents. Total: ${data.auditTrail.length} événements.`,
        margin,
        yPosition
      );
    }
  }
  
  // ========== FOOTER ON ALL PAGES ==========
  const totalPages = (doc as any).internal.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    doc.setDrawColor(colors.gray);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    doc.setFontSize(8);
    doc.setTextColor(colors.gray);
    doc.setFont('helvetica', 'normal');
    
    const footerLeft = 'Solvid.IA - ESG Audit-Ready Data Room';
    const footerCenter = `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`;
    const footerRight = `Page ${i}/${totalPages}`;
    
    doc.text(footerLeft, margin, pageHeight - 10);
    
    const centerWidth = doc.getTextWidth(footerCenter);
    doc.text(footerCenter, (pageWidth - centerWidth) / 2, pageHeight - 10);
    
    const rightWidth = doc.getTextWidth(footerRight);
    doc.text(footerRight, pageWidth - margin - rightWidth, pageHeight - 10);
  }
  
  return doc.output('blob');
}

// ============================================================================
// JSON GENERATION
// ============================================================================

function generateJSONBlob(data: any): Blob {
  const jsonString = JSON.stringify(data, null, 2);
  return new Blob([jsonString], { type: 'application/json' });
}

// ============================================================================
// CSV/EXCEL GENERATION
// ============================================================================

function generateCSVBlob(data: any): Blob {
  let csvContent = '';
  
  // ===== INDICATORS CSV =====
  if (data.indicators && data.indicators.length > 0) {
    csvContent += 'INDICATEURS ESG\n';
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
  pack?: Pack
): Promise<Blob> {
  const zip = new JSZip();
  
  const folderName = pack ? pack.name.replace(/[^a-z0-9]/gi, '_') : 'ESG_Export';
  const folder = zip.folder(folderName);
  
  if (!folder) {
    throw new Error('Failed to create ZIP folder');
  }
  
  // Add PDF
  if (pdfBlob) {
    folder.file('rapport.pdf', pdfBlob);
  }
  
  // Add JSON
  if (jsonBlob) {
    folder.file('donnees.json', jsonBlob);
  }
  
  // Add CSV
  if (excelBlob) {
    folder.file('export.csv', excelBlob);
  }
  
  // Add README
  const readme = generateReadme(data, pack);
  folder.file('README.txt', readme);
  
  // Generate ZIP
  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6,
    },
  });
}

// ============================================================================
// README GENERATION
// ============================================================================

function generateReadme(data: any, pack?: Pack): string {
  const date = new Date().toLocaleDateString('fr-FR');
  const time = new Date().toLocaleTimeString('fr-FR');
  
  return `
═══════════════════════════════════════════════════════════════
  EXPORT ESG AUDIT-READY
═══════════════════════════════════════════════════════════════

Organisation: Solvid.IA
Date d'export: ${date} à ${time}
${pack ? `Pack: ${pack.name} (${pack.templateName})` : ''}
Périmètre: ${data.scope}

───────────────────────────────────────────────────────────────
CONTENU DU DOSSIER
───────────────────────────────────────────────────────────────

📄 rapport.pdf
   Rapport complet ESG avec :
   - Résumé exécutif
   - Indicateurs par catégorie E/S/G
   - Audit trail
   - Statistiques de complétude

📊 export.csv
   Données brutes au format CSV :
   - Indicateurs ESG avec valeurs
   - Audit trail complet
   - Compatible Excel, Google Sheets, etc.

📁 donnees.json
   Données structurées au format JSON :
   - Indicateurs avec métadonnées
   - Audit trail
   - Preuves (métadonnées)
   - Format API-ready

───────────────────────────────────────────────────────────────
STATISTIQUES
───────────────────────────────────────────────────────────────

${data.indicators ? `Indicateurs: ${data.indicators.length}` : ''}
${data.auditTrail ? `Événements d'audit: ${data.auditTrail.length}` : ''}
${data.evidences ? `Preuves: ${data.evidences.length}` : ''}

───────────────────────────────────────────────────────────────
UTILISATION
───────────────────────────────────────────────────────────────

1. Ouvrez rapport.pdf pour la vue d'ensemble
2. Importez export.csv dans Excel pour analyse
3. Utilisez donnees.json pour intégrations API
4. Ce dossier est audit-ready et traçable

───────────────────────────────────────────────────────────────
CONTACT
───────────────────────────────────────────────────────────────

${pack ? `Propriétaire: ${pack.owner}` : ''}
${pack ? `Créé le: ${new Date(pack.createdAt).toLocaleDateString('fr-FR')}` : ''}

Pour toute question, contactez votre administrateur Solvid.IA.

═══════════════════════════════════════════════════════════════
  Généré par Solvid.IA - ESG Audit-Ready Data Room
═══════════════════════════════════════════════════════════════
`;
}

// ============================================================================
// UTILITIES
// ============================================================================

function getScopeLabel(scope: ExportScope): string {
  const labels: Record<ExportScope, string> = {
    indicators: 'Indicateurs uniquement',
    audit: 'Audit Trail uniquement',
    evidences: 'Preuves uniquement',
    complete: 'Export complet',
  };
  return labels[scope] || scope;
}
