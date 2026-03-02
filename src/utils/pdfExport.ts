import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Types
interface Pack {
  id: string;
  name: string;
  templateCode: string;
  templateName: string;
  status: string;
  completionScore: number;
  checklistItems: ChecklistItem[];
  kpiRequirements: KPIRequirement[];
  evidences?: Evidence[];
  owner: string;
  createdAt: string;
  updatedAt: string;
}

interface ChecklistItem {
  id: string;
  code: string;
  label: string;
  requirement_level: 'MANDATORY' | 'RECOMMENDED';
  status: 'MISSING' | 'PROVIDED' | 'NEEDS_REVIEW' | 'ACCEPTED' | 'REJECTED';
  description?: string;
  comment?: string;
}

interface KPIRequirement {
  id: string;
  indicator_code: string;
  indicator_name?: string;
  period: string;
  status: string;
  value?: number;
  unit?: string;
  has_evidence: boolean;
  evidence_count?: number;
}

interface Evidence {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  linked_indicators: string[];
  period: string;
  uploaded_by: string;
  created_at: string;
}

// 🆕 Types pour exports complets
interface ExportOptions {
  includeTransparency?: boolean;
  includeAuditTrail?: boolean;
  includeEvidences?: boolean;
  includeCalculations?: boolean;
  includeExecutiveSummary?: boolean;
  includeMethodology?: boolean;
}

interface AuditTrailEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value?: any;
  new_value?: any;
  comment?: string;
}

// Color palette
const colors = {
  primary: '#059669', // Green
  dark: '#0A3B2E',
  lightGreen: '#E8F3F0',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  white: '#FFFFFF',
  red: '#DC2626',
  orange: '#F59E0B',
  blue: '#3B82F6',
};

/**
 * Export pack to PDF
 */
export async function exportPackToPDF(pack: Pack, organizationName?: string): Promise<void> {
  const doc = new jsPDF();
  
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  // Helper: Check if we need a new page
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // ============================================================================
  // HEADER / COVER PAGE
  // ============================================================================
  
  // Logo / Title Area (dark background)
  doc.setFillColor(colors.dark);
  doc.rect(0, 0, pageWidth, 60, 'F');
  
  // Company Name
  doc.setTextColor(colors.white);
  doc.setFontSize(12);
  doc.text(organizationName || 'Solvid.IA', margin, 20);
  
  // Main Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Rapport ESG Audit-Ready', margin, 40);
  
  yPosition = 70;
  
  // Pack Name
  doc.setTextColor(colors.dark);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(pack.name, margin, yPosition);
  yPosition += 10;
  
  // Pack Metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.gray);
  doc.text(`Type: ${pack.templateName}`, margin, yPosition);
  yPosition += 5;
  doc.text(`Status: ${getStatusLabel(pack.status)}`, margin, yPosition);
  yPosition += 5;
  doc.text(`Créé le: ${formatDate(pack.createdAt)}`, margin, yPosition);
  yPosition += 5;
  doc.text(`Propriétaire: ${pack.owner}`, margin, yPosition);
  yPosition += 15;
  
  // Completion Score Box
  doc.setFillColor(colors.lightGreen);
  doc.roundedRect(margin, yPosition, contentWidth, 25, 3, 3, 'F');
  
  doc.setTextColor(colors.dark);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Score de Complétude', margin + 5, yPosition + 10);
  
  doc.setFontSize(20);
  doc.setTextColor(colors.primary);
  const scoreText = `${pack.completionScore}%`;
  const scoreWidth = doc.getTextWidth(scoreText);
  doc.text(scoreText, pageWidth - margin - scoreWidth - 5, yPosition + 17);
  
  yPosition += 35;
  
  // Stats
  const mandatoryItems = pack.checklistItems.filter(i => i.requirement_level === 'MANDATORY');
  const mandatoryCompleted = mandatoryItems.filter(i => 
    ['PROVIDED', 'ACCEPTED'].includes(i.status)
  ).length;
  
  doc.setFontSize(10);
  doc.setTextColor(colors.gray);
  doc.text(
    `${mandatoryCompleted}/${mandatoryItems.length} items obligatoires complétés • ${pack.kpiRequirements.length} KPIs • ${pack.evidences?.length || 0} preuves`,
    margin,
    yPosition
  );
  
  yPosition += 20;
  
  // ============================================================================
  // SECTION 1: CHECKLIST ITEMS
  // ============================================================================
  
  checkPageBreak(40);
  
  // Section Header
  doc.setFillColor(colors.primary);
  doc.rect(margin, yPosition, contentWidth, 8, 'F');
  doc.setTextColor(colors.white);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Checklist de Conformité', margin + 3, yPosition + 6);
  yPosition += 15;
  
  // Mandatory Items Table
  doc.setTextColor(colors.dark);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Items Obligatoires (${mandatoryCompleted}/${mandatoryItems.length})`, margin, yPosition);
  yPosition += 5;
  
  const mandatoryTableData = mandatoryItems.map(item => [
    item.code,
    item.label.substring(0, 60) + (item.label.length > 60 ? '...' : ''),
    getStatusLabel(item.status),
    item.comment?.substring(0, 40) || '-'
  ]);
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Code', 'Élément', 'Status', 'Commentaire']],
    body: mandatoryTableData,
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
      0: { cellWidth: 30 },
      1: { cellWidth: 70 },
      2: { cellWidth: 30 },
      3: { cellWidth: 50 },
    },
    margin: { left: margin, right: margin },
  });
  
  yPosition = (doc as any).lastAutoTable.finalY + 10;
  
  // Recommended Items
  const recommendedItems = pack.checklistItems.filter(i => i.requirement_level === 'RECOMMENDED');
  if (recommendedItems.length > 0) {
    checkPageBreak(40);
    
    const recommendedCompleted = recommendedItems.filter(i => 
      ['PROVIDED', 'ACCEPTED'].includes(i.status)
    ).length;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Items Recommandés (${recommendedCompleted}/${recommendedItems.length})`, margin, yPosition);
    yPosition += 5;
    
    const recommendedTableData = recommendedItems.map(item => [
      item.code,
      item.label.substring(0, 60) + (item.label.length > 60 ? '...' : ''),
      getStatusLabel(item.status),
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Code', 'Élément', 'Status']],
      body: recommendedTableData,
      theme: 'striped',
      headStyles: {
        fillColor: colors.blue,
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
        0: { cellWidth: 30 },
        1: { cellWidth: 100 },
        2: { cellWidth: 50 },
      },
      margin: { left: margin, right: margin },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // ============================================================================
  // SECTION 2: KPI REQUIREMENTS
  // ============================================================================
  
  checkPageBreak(40);
  
  // Section Header
  doc.setFillColor(colors.primary);
  doc.rect(margin, yPosition, contentWidth, 8, 'F');
  doc.setTextColor(colors.white);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Indicateurs de Performance (KPIs)', margin + 3, yPosition + 6);
  yPosition += 15;
  
  const kpiTableData = pack.kpiRequirements.map(kpi => [
    kpi.indicator_code,
    kpi.indicator_name || kpi.indicator_code,
    kpi.value !== null && kpi.value !== undefined 
      ? `${kpi.value.toLocaleString('fr-FR')} ${kpi.unit || ''}`
      : '-',
    kpi.period,
    getStatusLabel(kpi.status),
    kpi.has_evidence ? `✓ (${kpi.evidence_count})` : '✗',
  ]);
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Code', 'Indicateur', 'Valeur', 'Période', 'Status', 'Preuves']],
    body: kpiTableData,
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
      1: { cellWidth: 60 },
      2: { cellWidth: 30 },
      3: { cellWidth: 20 },
      4: { cellWidth: 25 },
      5: { cellWidth: 20 },
    },
    margin: { left: margin, right: margin },
  });
  
  yPosition = (doc as any).lastAutoTable.finalY + 15;
  
  // ============================================================================
  // SECTION 3: EVIDENCES
  // ============================================================================
  
  if (pack.evidences && pack.evidences.length > 0) {
    checkPageBreak(40);
    
    // Section Header
    doc.setFillColor(colors.primary);
    doc.rect(margin, yPosition, contentWidth, 8, 'F');
    doc.setTextColor(colors.white);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`3. Preuves Jointes (${pack.evidences.length})`, margin + 3, yPosition + 6);
    yPosition += 15;
    
    const evidenceTableData = pack.evidences.map(ev => [
      ev.file_name.substring(0, 40) + (ev.file_name.length > 40 ? '...' : ''),
      getFileTypeLabel(ev.file_type),
      formatFileSize(ev.file_size),
      ev.period,
      formatDate(ev.created_at),
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Nom du fichier', 'Type', 'Taille', 'Période', 'Date d\'upload']],
      body: evidenceTableData,
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
        0: { cellWidth: 70 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 35 },
      },
      margin: { left: margin, right: margin },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // ============================================================================
  // FOOTER
  // ============================================================================
  
  const totalPages = (doc as any).internal.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(colors.gray);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(colors.gray);
    doc.setFont('helvetica', 'normal');
    
    const footerLeft = `Solvid.IA - ESG Audit-Ready Data Room`;
    const footerCenter = `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`;
    const footerRight = `Page ${i}/${totalPages}`;
    
    doc.text(footerLeft, margin, pageHeight - 10);
    
    const centerWidth = doc.getTextWidth(footerCenter);
    doc.text(footerCenter, (pageWidth - centerWidth) / 2, pageHeight - 10);
    
    const rightWidth = doc.getTextWidth(footerRight);
    doc.text(footerRight, pageWidth - margin - rightWidth, pageHeight - 10);
  }
  
  // ============================================================================
  // SAVE PDF
  // ============================================================================
  
  const fileName = `${pack.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    MISSING: 'Manquant',
    PROVIDED: 'Fourni',
    COMPUTED: 'Calculé',
    NEEDS_REVIEW: 'À réviser',
    ACCEPTED: 'Accepté',
    APPROVED: 'Approuvé',
    REJECTED: 'Rejeté',
    DRAFT: 'Brouillon',
    IN_PROGRESS: 'En cours',
    READY_FOR_REVIEW: 'Prêt pour revue',
    CHANGES_REQUESTED: 'Modifications demandées',
  };
  return labels[status] || status;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileTypeLabel(fileType: string): string {
  if (fileType.includes('pdf')) return 'PDF';
  if (fileType.includes('image')) return 'Image';
  if (fileType.includes('sheet') || fileType.includes('excel')) return 'Excel';
  if (fileType.includes('csv')) return 'CSV';
  return 'Fichier';
}