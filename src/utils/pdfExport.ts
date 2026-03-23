/**
 * PDF EXPORT — Export simplifié d'un pack vers PDF
 *
 * Wrapper léger qui utilise le moteur de rapport standard
 * pour générer un PDF et le télécharger directement.
 */

import { generateStandardReport } from './professionalReports';
import { sanitizeFileName } from './reportHelpers';
import type { ReportPackData, ReportOptions, ReportChecklistItem, ReportKPIRequirement, ReportEvidence } from './reportTypes';

// ==================== TYPES (backward compat) ====================

interface Pack {
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

// ==================== MAIN EXPORT ====================

/**
 * Export pack to PDF — télécharge directement le fichier
 */
export async function exportPackToPDF(pack: Pack, organizationName?: string): Promise<void> {
  // Convertir les données au format ReportPackData
  const data: ReportPackData = {
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

  const options: ReportOptions = {
    reportType: 'standard',
    includeExecutiveSummary: true,
    includeEvidence: true,
    includeAuditTrail: false,
    brandConfig: organizationName ? {
      organizationName,
      logoBase64: null,
      primaryColor: '#059669',
      secondaryColor: '#0A3B2E',
    } : undefined,
  };

  const blob = await generateStandardReport(data, options);

  // Télécharger
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFileName(pack.name)}_${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
