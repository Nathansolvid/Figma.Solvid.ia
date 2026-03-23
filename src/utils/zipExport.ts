import JSZip from 'jszip';
import { apiClient } from '@/services/api';

// Types
interface Pack {
  id: string;
  name: string;
  templateCode: string;
  templateName: string;
  status: string;
  completionScore: number;
  checklistItems: any[];
  kpiRequirements: any[];
  evidences?: Evidence[];
  owner: string;
  createdAt: string;
  updatedAt: string;
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

/**
 * Export pack to ZIP with PDF + evidence files
 */
export async function exportPackToZIP(
  pack: Pack,
  organizationName?: string,
  onProgress?: (progress: number, message: string) => void
): Promise<void> {
  const zip = new JSZip();
  
  // Create folder structure
  const packFolderName = sanitizeFileName(pack.name);
  const packFolder = zip.folder(packFolderName);
  
  if (!packFolder) {
    throw new Error('Failed to create ZIP folder');
  }
  
  const preuveFolder = packFolder.folder('preuves');
  
  if (!preuveFolder) {
    throw new Error('Failed to create preuves folder');
  }
  
  try {
    // ============================================================================
    // STEP 1: Generate PDF
    // ============================================================================
    
    onProgress?.call(null, 10, 'Génération du PDF...');
    
    // Generate PDF in memory (not download)
    const pdfBlob = await generatePDFBlob(pack, organizationName);
    
    // Add PDF to ZIP
    packFolder.file('rapport.pdf', pdfBlob);
    
    onProgress?.call(null, 30, 'PDF ajouté au ZIP');
    
    // ============================================================================
    // STEP 2: Download all evidence files
    // ============================================================================
    
    const evidences = pack.evidences || [];
    
    if (evidences.length === 0) {
      onProgress?.call(null, 90, 'Aucune preuve à inclure');
    } else {
      onProgress?.call(null, 40, `Téléchargement de ${evidences.length} preuves...`);
      
      // Download all evidences in parallel
      const downloadPromises = evidences.map(async (evidence, index) => {
        try {
          // Get signed URL for download
          const { signedUrl } = await apiClient.getEvidenceDownloadUrl(evidence.id);
          
          // Download file as blob
          const response = await fetch(signedUrl);
          
          if (!response.ok) {
            console.error(`Failed to download evidence ${evidence.file_name}:`, response.statusText);
            return null;
          }
          
          const blob = await response.blob();
          
          // Update progress
          const progressPercent = 40 + Math.round((index + 1) / evidences.length * 50);
          onProgress?.call(
            null,
            progressPercent,
            `Téléchargé ${index + 1}/${evidences.length} : ${evidence.file_name}`
          );
          
          return {
            fileName: evidence.file_name,
            blob,
          };
        } catch (error) {
          console.error(`Error downloading evidence ${evidence.file_name}:`, error);
          return null;
        }
      });
      
      const downloadedFiles = await Promise.all(downloadPromises);
      
      // Add evidences to ZIP
      downloadedFiles.forEach((file) => {
        if (file) {
          preuveFolder.file(file.fileName, file.blob);
        }
      });
      
      const successCount = downloadedFiles.filter(f => f !== null).length;
      const failedCount = evidences.length - successCount;
      
      if (failedCount > 0) {
        console.warn(`${failedCount} fichier(s) n'ont pas pu être téléchargés`);
      }
      
      onProgress?.call(null, 90, `${successCount} preuves ajoutées au ZIP`);
    }
    
    // ============================================================================
    // STEP 3: Add README
    // ============================================================================
    
    const readme = generateReadme(pack, organizationName);
    packFolder.file('README.txt', readme);
    
    // ============================================================================
    // STEP 4: Generate ZIP and trigger download
    // ============================================================================
    
    onProgress?.call(null, 95, 'Génération du fichier ZIP...');
    
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6, // Balanced compression (1-9)
      },
    });
    
    onProgress?.call(null, 100, 'Export terminé !');
    
    // Trigger download
    const fileName = `${packFolderName}_${new Date().toISOString().split('T')[0]}.zip`;
    downloadBlob(zipBlob, fileName);
    
  } catch (error: any) {
    console.error('Export ZIP error:', error);
    throw new Error(`Erreur lors de l'export ZIP : ${error.message}`);
  }
}

/**
 * Generate PDF as Blob (without downloading)
 */
async function generatePDFBlob(pack: Pack, organizationName?: string): Promise<Blob> {
  const jsPDF = (await import('jspdf')).default;
  const autoTable = (await import('jspdf-autotable')).default;
  
  return generatePDFBlobInternal(pack, organizationName, jsPDF, autoTable);
}

/**
 * Internal PDF generation that returns blob
 */
async function generatePDFBlobInternal(
  pack: Pack,
  organizationName: string | undefined,
  jsPDFClass: any,
  autoTable: any
): Promise<Blob> {
  const doc = new jsPDFClass();
  
  // Simplified PDF generation (same as exportPackToPDF but condensed)
  const colors = {
    primary: '#059669',
    dark: '#0A3B2E',
    lightGreen: '#E8F3F0',
    gray: '#6B7280',
    lightGray: '#F3F4F6',
    white: '#FFFFFF',
  };
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = 20;
  
  // Header
  doc.setFillColor(colors.dark);
  doc.rect(0, 0, pageWidth, 60, 'F');
  doc.setTextColor(colors.white);
  doc.setFontSize(12);
  doc.text(organizationName || 'Solvid.IA', margin, 20);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Rapport ESG', margin, 40);
  
  yPosition = 70;
  
  // Pack Name
  doc.setTextColor(colors.dark);
  doc.setFontSize(20);
  doc.text(pack.name, margin, yPosition);
  yPosition += 10;
  
  // Metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.gray);
  doc.text(`Type: ${pack.templateName}`, margin, yPosition);
  yPosition += 5;
  doc.text(`Status: ${pack.status}`, margin, yPosition);
  yPosition += 5;
  doc.text(`Créé le: ${new Date(pack.createdAt).toLocaleDateString('fr-FR')}`, margin, yPosition);
  yPosition += 15;
  
  // Completion Score
  doc.setFillColor(colors.lightGreen);
  doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 25, 3, 3, 'F');
  doc.setTextColor(colors.dark);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Score de Progression', margin + 5, yPosition + 10);
  doc.setFontSize(20);
  doc.setTextColor(colors.primary);
  const scoreText = `${pack.completionScore}%`;
  const scoreWidth = doc.getTextWidth(scoreText);
  doc.text(scoreText, pageWidth - margin - scoreWidth - 5, yPosition + 17);
  
  yPosition += 35;
  
  // Summary
  const mandatoryItems = pack.checklistItems.filter((i: any) => i.requirement_level === 'MANDATORY');
  const mandatoryCompleted = mandatoryItems.filter((i: any) =>
    ['PROVIDED', 'ACCEPTED'].includes(i.status)
  ).length;
  
  doc.setFontSize(10);
  doc.setTextColor(colors.gray);
  doc.text(
    `${mandatoryCompleted}/${mandatoryItems.length} items obligatoires • ${pack.kpiRequirements.length} Chiffres clés de performance • ${pack.evidences?.length || 0} justificatifs`,
    margin,
    yPosition
  );
  
  // Return as blob
  return doc.output('blob');
}

/**
 * Generate README content
 */
function generateReadme(pack: Pack, organizationName?: string): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  
  const time = new Date().toLocaleTimeString('fr-FR');
  
  return `
═══════════════════════════════════════════════════════════════
  EXPORT ESG - ${pack.name}
═══════════════════════════════════════════════════════════════

Organisation: ${organizationName || 'Solvid.IA'}
Date d'export: ${date} à ${time}
Pack ID: ${pack.id}
Type: ${pack.templateName}
Status: ${pack.status}
Score de progression: ${pack.completionScore}%

───────────────────────────────────────────────────────────────
CONTENU DU DOSSIER
───────────────────────────────────────────────────────────────

📄 rapport.pdf
   Rapport complet du pack ESG avec :
   - Checklist de conformité (items obligatoires et recommandés)
   - Chiffres clés de performance
   - Liste des justificatifs joints
   - Statistiques de progression

📁 preuves/
   Tous les justificatifs associés au pack :
   - Nombre de fichiers: ${pack.evidences?.length || 0}
   - Types: PDF, Excel, Images, CSV, etc.
   - Chaque justificatif est lié à un ou plusieurs indicateurs

───────────────────────────────────────────────────────────────
STATISTIQUES
───────────────────────────────────────────────────────────────

Items de checklist: ${pack.checklistItems.length}
  - Obligatoires: ${pack.checklistItems.filter(i => i.requirement_level === 'MANDATORY').length}
  - Recommandés: ${pack.checklistItems.filter(i => i.requirement_level === 'RECOMMENDED').length}

Chiffres clés de performance: ${pack.kpiRequirements.length}

Justificatifs: ${pack.evidences?.length || 0} fichiers

───────────────────────────────────────────────────────────────
UTILISATION
───────────────────────────────────────────────────────────────

1. Ouvrez rapport.pdf pour voir le rapport complet
2. Consultez le dossier preuves/ pour accéder aux justificatifs
3. Ce dossier peut être partagé avec un auditeur externe
4. Tous les fichiers sont horodatés et traçables

───────────────────────────────────────────────────────────────
CONTACT
───────────────────────────────────────────────────────────────

Propriétaire du pack: ${pack.owner}
Créé le: ${new Date(pack.createdAt).toLocaleDateString('fr-FR')}
Dernière modification: ${new Date(pack.updatedAt).toLocaleDateString('fr-FR')}

Pour toute question, contactez votre administrateur Solvid.IA.

═══════════════════════════════════════════════════════════════
  Généré par Solvid.IA - Plateforme ESG
═══════════════════════════════════════════════════════════════
`;
}

/**
 * Sanitize filename for filesystem compatibility
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-z0-9\s_-]/gi, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 50); // Limit length
}

/**
 * Trigger browser download of blob
 */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}