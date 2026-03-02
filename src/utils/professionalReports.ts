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
  checklistItems?: ChecklistItem[];
  kpiRequirements?: KPIRequirement[];
  evidences?: Evidence[];
  owner: string;
  createdAt: string;
  updatedAt: string;
}

interface ChecklistItem {
  id: string;
  code: string;
  label: string;
  category: 'E' | 'S' | 'G';
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

interface ReportOptions {
  organizationName?: string;
  organizationLogo?: string;
  includeExecutiveSummary?: boolean;
  includeEvidence?: boolean;
  includeAuditTrail?: boolean;
  reportType?: 'standard' | 'audit' | 'executive';
}

// Color palette
const colors = {
  primary: '#059669',
  dark: '#0A3B2E',
  lightGreen: '#E8F3F0',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  white: '#FFFFFF',
  red: '#DC2626',
  orange: '#F59E0B',
  blue: '#3B82F6',
  green: '#10B981',
};

/**
 * Generate professional ESG report with executive summary
 */
export async function generateProfessionalReport(
  pack: Pack,
  options: ReportOptions = {}
): Promise<void> {
  const {
    organizationName = 'Solvid.IA',
    includeExecutiveSummary = true,
    includeEvidence = true,
    includeAuditTrail = false,
    reportType = 'standard',
  } = options;

  const doc = new jsPDF();
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  // Helper: Check if we need a new page
  const checkPageBreak = (requiredSpace: number = 40) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // Helper: Add section title
  const addSectionTitle = (title: string, icon?: string) => {
    checkPageBreak(30);
    doc.setFillColor(colors.lightGreen);
    doc.rect(margin, yPosition, contentWidth, 12, 'F');
    doc.setTextColor(colors.dark);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 5, yPosition + 8);
    yPosition += 20;
  };

  // ============================================================================
  // COVER PAGE
  // ============================================================================
  
  // Header with dark background
  doc.setFillColor(colors.dark);
  doc.rect(0, 0, pageWidth, 80, 'F');
  
  // Organization name
  doc.setTextColor(colors.white);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(organizationName, margin, 25);
  
  // Report title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Rapport ESG Audit-Ready', margin, 50);
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(pack.name, margin, 65);
  
  yPosition = 100;
  
  // Report metadata
  doc.setTextColor(colors.gray);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  const metadata = [
    ['Type de rapport:', reportType === 'executive' ? 'Rapport Exécutif' : reportType === 'audit' ? 'Rapport d\'Audit' : 'Rapport Standard'],
    ['Template:', pack.templateName],
    ['Date de génération:', new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })],
    ['Période:', new Date(pack.createdAt).getFullYear().toString()],
    ['Responsable:', pack.owner],
    ['Score de completion:', `${pack.completionScore}%`],
  ];
  
  metadata.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 55, yPosition);
    yPosition += 7;
  });
  
  // Completion status box
  yPosition += 10;
  const statusColor = pack.completionScore >= 90 ? colors.green : 
                      pack.completionScore >= 70 ? colors.orange : colors.red;
  
  doc.setFillColor(statusColor);
  doc.rect(margin, yPosition, 60, 15, 'F');
  doc.setTextColor(colors.white);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${pack.completionScore}% complété`, margin + 8, yPosition + 10);
  
  yPosition += 25;
  
  // ============================================================================
  // EXECUTIVE SUMMARY (if requested)
  // ============================================================================
  
  if (includeExecutiveSummary) {
    doc.addPage();
    yPosition = 20;
    
    addSectionTitle('📊 Résumé Exécutif');
    
    doc.setTextColor(colors.dark);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const summary = [
      `Ce rapport présente l'état d'avancement du pack "${pack.name}" pour l'année ${new Date(pack.createdAt).getFullYear()}.`,
      '',
      `Le pack contient ${pack.checklistItems?.length || 0} items de checklist et ${pack.kpiRequirements?.length || 0} indicateurs KPI.`,
      `Le score de completion global est de ${pack.completionScore}%, avec ${pack.evidences?.length || 0} preuves documentaires associées.`,
    ];
    
    summary.forEach(line => {
      if (line === '') {
        yPosition += 5;
      } else {
        const splitText = doc.splitTextToSize(line, contentWidth);
        doc.text(splitText, margin, yPosition);
        yPosition += splitText.length * 6;
      }
    });
    
    yPosition += 10;
    
    // Key metrics cards
    checkPageBreak(50);
    
    const checklistProvided = pack.checklistItems?.filter(i => 
      i.status === 'PROVIDED' || i.status === 'ACCEPTED'
    ).length || 0;
    
    const kpiProvided = pack.kpiRequirements?.filter(k => 
      k.status === 'PROVIDED' || k.status === 'ACCEPTED'
    ).length || 0;
    
    const metrics = [
      {
        label: 'Items Checklist',
        value: `${checklistProvided}/${pack.checklistItems?.length || 0}`,
        percentage: pack.checklistItems?.length 
          ? Math.round((checklistProvided / pack.checklistItems.length) * 100)
          : 0,
      },
      {
        label: 'Indicateurs KPI',
        value: `${kpiProvided}/${pack.kpiRequirements?.length || 0}`,
        percentage: pack.kpiRequirements?.length
          ? Math.round((kpiProvided / pack.kpiRequirements.length) * 100)
          : 0,
      },
      {
        label: 'Documents Preuves',
        value: pack.evidences?.length || 0,
        percentage: 100,
      },
    ];
    
    const cardWidth = (contentWidth - 10) / 3;
    let xOffset = margin;
    
    metrics.forEach((metric, index) => {
      // Card background
      doc.setFillColor(colors.lightGray);
      doc.rect(xOffset, yPosition, cardWidth, 30, 'F');
      
      // Label
      doc.setFontSize(9);
      doc.setTextColor(colors.gray);
      doc.text(metric.label, xOffset + 5, yPosition + 8);
      
      // Value
      doc.setFontSize(16);
      doc.setTextColor(colors.dark);
      doc.setFont('helvetica', 'bold');
      doc.text(String(metric.value), xOffset + 5, yPosition + 20);
      
      // Percentage bar
      if (typeof metric.percentage === 'number') {
        const barWidth = cardWidth - 10;
        const fillWidth = (barWidth * metric.percentage) / 100;
        
        doc.setFillColor(230, 230, 230);
        doc.rect(xOffset + 5, yPosition + 24, barWidth, 3, 'F');
        
        doc.setFillColor(colors.primary);
        doc.rect(xOffset + 5, yPosition + 24, fillWidth, 3, 'F');
      }
      
      xOffset += cardWidth + 5;
      doc.setFont('helvetica', 'normal');
    });
    
    yPosition += 40;
  }
  
  // ============================================================================
  // CHECKLIST ITEMS BY CATEGORY
  // ============================================================================
  
  if (pack.checklistItems && pack.checklistItems.length > 0) {
    doc.addPage();
    yPosition = 20;
    
    addSectionTitle('✅ Items de Checklist');
    
    const categories: Array<'E' | 'S' | 'G'> = ['E', 'S', 'G'];
    const categoryNames = {
      E: 'Environnement',
      S: 'Social',
      G: 'Gouvernance',
    };
    
    categories.forEach(category => {
      const items = pack.checklistItems!.filter(i => i.category === category);
      
      if (items.length === 0) return;
      
      checkPageBreak(60);
      
      // Category header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.dark);
      doc.text(`${category} - ${categoryNames[category]}`, margin, yPosition);
      yPosition += 10;
      
      // Items table
      const tableData = items.map(item => [
        item.code,
        item.label,
        getStatusLabel(item.status),
        item.requirement_level === 'MANDATORY' ? 'Obligatoire' : 'Recommandé',
      ]);
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Code', 'Libellé', 'Statut', 'Niveau']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: colors.dark,
          textColor: colors.white,
          fontSize: 9,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 9,
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 80 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 },
        },
        margin: { left: margin, right: margin },
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 15;
    });
  }
  
  // ============================================================================
  // KPI INDICATORS
  // ============================================================================
  
  if (pack.kpiRequirements && pack.kpiRequirements.length > 0) {
    checkPageBreak(80);
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 20;
    }
    
    addSectionTitle('📈 Indicateurs KPI');
    
    const kpiTableData = pack.kpiRequirements.map(kpi => [
      kpi.indicator_code,
      kpi.indicator_name || '-',
      kpi.value !== undefined ? `${kpi.value} ${kpi.unit || ''}` : '-',
      kpi.period,
      getStatusLabel(kpi.status),
      kpi.evidence_count || 0,
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Code', 'Indicateur', 'Valeur', 'Période', 'Statut', 'Preuves']],
      body: kpiTableData,
      theme: 'grid',
      headStyles: {
        fillColor: colors.primary,
        textColor: colors.white,
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 60 },
        2: { cellWidth: 30 },
        3: { cellWidth: 20 },
        4: { cellWidth: 25 },
        5: { cellWidth: 15, halign: 'center' },
      },
      margin: { left: margin, right: margin },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // ============================================================================
  // EVIDENCE DOCUMENTS
  // ============================================================================
  
  if (includeEvidence && pack.evidences && pack.evidences.length > 0) {
    checkPageBreak(80);
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 20;
    }
    
    addSectionTitle('📎 Documents & Preuves');
    
    const evidenceTableData = pack.evidences.map(ev => [
      ev.file_name,
      ev.file_type.toUpperCase(),
      formatFileSize(ev.file_size),
      ev.period,
      ev.linked_indicators.length,
      new Date(ev.created_at).toLocaleDateString('fr-FR'),
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Fichier', 'Type', 'Taille', 'Période', 'Indicateurs', 'Date']],
      body: evidenceTableData,
      theme: 'striped',
      headStyles: {
        fillColor: colors.blue,
        textColor: colors.white,
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 65 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 25 },
      },
      margin: { left: margin, right: margin },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // ============================================================================
  // FOOTER ON EACH PAGE
  // ============================================================================
  
  const totalPages = doc.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(colors.gray);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(colors.gray);
    doc.setFont('helvetica', 'normal');
    
    doc.text(
      `${organizationName} - Rapport ESG Audit-Ready`,
      margin,
      pageHeight - 10
    );
    
    doc.text(
      `Page ${i} / ${totalPages}`,
      pageWidth - margin - 20,
      pageHeight - 10
    );
  }
  
  // ============================================================================
  // SAVE PDF
  // ============================================================================
  
  const fileName = `${sanitizeFileName(pack.name)}_rapport_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

/**
 * Generate audit preparation report with compliance checklist
 */
export async function generateAuditPreparationReport(
  pack: Pack,
  organizationName: string = 'Solvid.IA'
): Promise<void> {
  const doc = new jsPDF();
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  const checkPageBreak = (requiredSpace: number = 40) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // Cover page
  doc.setFillColor(colors.dark);
  doc.rect(0, 0, pageWidth, 80, 'F');
  
  doc.setTextColor(colors.white);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Rapport de Préparation Audit', margin, 40);
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(pack.name, margin, 60);
  
  yPosition = 100;
  
  // Audit readiness score
  doc.setFontSize(14);
  doc.setTextColor(colors.dark);
  doc.setFont('helvetica', 'bold');
  doc.text('Score de Préparation Audit', margin, yPosition);
  yPosition += 15;
  
  const auditReadiness = pack.completionScore;
  const readinessColor = auditReadiness >= 90 ? colors.green : 
                         auditReadiness >= 70 ? colors.orange : colors.red;
  
  // Progress bar
  doc.setFillColor(230, 230, 230);
  doc.rect(margin, yPosition, contentWidth, 20, 'F');
  
  doc.setFillColor(readinessColor);
  doc.rect(margin, yPosition, (contentWidth * auditReadiness) / 100, 20, 'F');
  
  doc.setFontSize(16);
  doc.setTextColor(colors.white);
  doc.setFont('helvetica', 'bold');
  doc.text(`${auditReadiness}%`, margin + 5, yPosition + 14);
  
  yPosition += 35;
  
  // Compliance checklist
  doc.addPage();
  yPosition = 20;
  
  doc.setFontSize(14);
  doc.setTextColor(colors.dark);
  doc.setFont('helvetica', 'bold');
  doc.text('Checklist de Conformité', margin, yPosition);
  yPosition += 15;
  
  const checklistCategories = [
    { label: 'Documentation complète', status: pack.completionScore >= 100, critical: true },
    { label: 'Preuves documentaires attachées', status: (pack.evidences?.length || 0) > 0, critical: true },
    { label: 'Indicateurs KPI renseignés', status: pack.kpiRequirements?.every(k => k.value !== undefined) || false, critical: true },
    { label: 'Items obligatoires validés', status: pack.checklistItems?.filter(i => i.requirement_level === 'MANDATORY').every(i => i.status === 'ACCEPTED') || false, critical: true },
    { label: 'Commentaires de justification', status: pack.checklistItems?.some(i => i.comment) || false, critical: false },
    { label: 'Revue par consultant', status: pack.checklistItems?.some(i => i.status === 'ACCEPTED') || false, critical: false },
  ];
  
  checklistCategories.forEach(item => {
    checkPageBreak(15);
    
    const icon = item.status ? '✓' : '✗';
    const iconColor = item.status ? colors.green : colors.red;
    
    doc.setFontSize(11);
    doc.setTextColor(iconColor);
    doc.setFont('helvetica', 'bold');
    doc.text(icon, margin, yPosition);
    
    doc.setTextColor(colors.dark);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, margin + 10, yPosition);
    
    if (item.critical) {
      doc.setTextColor(colors.red);
      doc.setFontSize(9);
      doc.text('(Critique)', pageWidth - margin - 25, yPosition);
    }
    
    yPosition += 10;
  });
  
  yPosition += 15;
  
  // Recommendations
  checkPageBreak(60);
  doc.setFontSize(14);
  doc.setTextColor(colors.dark);
  doc.setFont('helvetica', 'bold');
  doc.text('Recommandations pour l\'Audit', margin, yPosition);
  yPosition += 15;
  
  const recommendations = [
    'Vérifier que tous les documents de preuve sont datés et signés',
    'S\'assurer que les méthodologies de calcul sont documentées',
    'Préparer les fichiers sources Excel pour consultation',
    'Identifier les points d\'attention pour discussion avec l\'auditeur',
  ];
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.dark);
  
  recommendations.forEach((rec, index) => {
    checkPageBreak(15);
    doc.text(`${index + 1}. ${rec}`, margin, yPosition);
    yPosition += 10;
  });
  
  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(colors.gray);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    doc.setFontSize(8);
    doc.setTextColor(colors.gray);
    doc.text(`${organizationName} - Préparation Audit`, margin, pageHeight - 10);
    doc.text(`Page ${i} / ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
  }
  
  const fileName = `${sanitizeFileName(pack.name)}_preparation_audit_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    MISSING: 'Manquant',
    PROVIDED: 'Fourni',
    NEEDS_REVIEW: 'À réviser',
    ACCEPTED: 'Validé',
    REJECTED: 'Rejeté',
    IN_PROGRESS: 'En cours',
  };
  return labels[status] || status;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
}
