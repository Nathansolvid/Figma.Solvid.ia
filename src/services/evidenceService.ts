/**
 * EVIDENCE SERVICE - Gestion des preuves en mode local
 * 
 * Fonctionnalités :
 * - Upload de fichiers (simulé avec base64)
 * - Liaison KPI <-> Evidence
 * - Liste des preuves
 * - Suppression de preuves
 */

import { dataProvider, Evidence } from './dataProvider';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

class EvidenceService {
  private static instance: EvidenceService;

  private constructor() {}

  static getInstance(): EvidenceService {
    if (!EvidenceService.instance) {
      EvidenceService.instance = new EvidenceService();
    }
    return EvidenceService.instance;
  }

  /**
   * Upload evidence file (simulated with base64 for local mode)
   */
  async uploadEvidence(
    file: File,
    entityType: 'kpi' | 'checklist' | 'pack',
    entityId: string,
    packId: string,
    userId: string,
    userName: string,
    userRole: string
  ): Promise<Evidence> {
    try {
      // Convert file to base64 for local storage
      const base64Data = await this.fileToBase64(file);

      const evidence: Evidence = {
        id: uuidv4(),
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploadedBy: userId,
        uploadedByName: userName,
        uploadedAt: new Date().toISOString(),
        entityType,
        entityId,
        packId,
        storageUrl: `local://${file.name}`, // Simulated URL
        base64Data, // Store base64 for local mode
      };

      await dataProvider.store.create('evidence', evidence);

      // Update entity to mark it has evidence
      if (entityType === 'kpi') {
        const kpi = await dataProvider.store.read('kpi_requirements', entityId);
        if (kpi) {
          const updatedKPI = {
            ...kpi,
            hasEvidence: true,
            evidenceCount: (kpi.evidenceCount || 0) + 1,
            updatedAt: new Date().toISOString(),
          };
          await dataProvider.store.update('kpi_requirements', updatedKPI);
        }
      } else if (entityType === 'checklist') {
        const item = await dataProvider.store.read('checklist_items', entityId);
        if (item) {
          const updatedItem = {
            ...item,
            hasEvidence: true,
            evidenceCount: (item.evidenceCount || 0) + 1,
            updatedAt: new Date().toISOString(),
          };
          await dataProvider.store.update('checklist_items', updatedItem);
        }
      }

      // Log action
      await dataProvider.store.logAction({
        entityType: 'evidence',
        entityId: evidence.id,
        action: 'EVIDENCE_UPLOADED',
        userId,
        userName,
        userRole,
        details: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          linkedTo: entityType,
          linkedId: entityId,
        }),
      });

      // Create notification
      await dataProvider.store.create('notifications', {
        id: uuidv4(),
        userId,
        type: 'import_completed',
        title: 'Preuve ajoutée',
        description: `Le fichier "${file.name}" a été téléversé avec succès`,
        packId,
        read: false,
        createdAt: new Date().toISOString(),
      });

      toast.success('Preuve ajoutée', {
        description: file.name,
      });

      return evidence;
    } catch (error: any) {
      console.error('❌ Upload evidence error:', error);
      toast.error('Erreur lors du téléversement', { description: error.message });
      throw error;
    }
  }

  /**
   * Get evidence by ID
   */
  async getEvidence(evidenceId: string): Promise<Evidence | null> {
    try {
      return await dataProvider.store.read('evidence', evidenceId);
    } catch (error) {
      console.error('❌ Get evidence error:', error);
      return null;
    }
  }

  /**
   * List evidence by entity
   */
  async listEvidenceByEntity(entityType: string, entityId: string): Promise<Evidence[]> {
    try {
      const allEvidence = await dataProvider.store.list('evidence');
      return allEvidence.filter(e => e.entityType === entityType && e.entityId === entityId);
    } catch (error) {
      console.error('❌ List evidence error:', error);
      return [];
    }
  }

  /**
   * List evidence by pack
   */
  async listEvidenceByPack(packId: string): Promise<Evidence[]> {
    try {
      return await dataProvider.store.listByIndex('evidence', 'packId', packId);
    } catch (error) {
      console.error('❌ List evidence by pack error:', error);
      return [];
    }
  }

  /**
   * List all evidence
   */
  async listAllEvidence(): Promise<Evidence[]> {
    try {
      return await dataProvider.store.list('evidence');
    } catch (error) {
      console.error('❌ List all evidence error:', error);
      return [];
    }
  }

  /**
   * Delete evidence
   */
  async deleteEvidence(
    evidenceId: string,
    userId: string,
    userName: string,
    userRole: string
  ): Promise<void> {
    try {
      const evidence = await dataProvider.store.read('evidence', evidenceId);
      
      if (!evidence) {
        throw new Error('Evidence not found');
      }

      // Update entity counts
      if (evidence.entityType === 'kpi') {
        const kpi = await dataProvider.store.read('kpi_requirements', evidence.entityId);
        if (kpi && kpi.evidenceCount > 0) {
          const updatedKPI = {
            ...kpi,
            evidenceCount: kpi.evidenceCount - 1,
            hasEvidence: kpi.evidenceCount - 1 > 0,
            updatedAt: new Date().toISOString(),
          };
          await dataProvider.store.update('kpi_requirements', updatedKPI);
        }
      } else if (evidence.entityType === 'checklist') {
        const item = await dataProvider.store.read('checklist_items', evidence.entityId);
        if (item && item.evidenceCount && item.evidenceCount > 0) {
          const updatedItem = {
            ...item,
            evidenceCount: item.evidenceCount - 1,
            hasEvidence: item.evidenceCount - 1 > 0,
            updatedAt: new Date().toISOString(),
          };
          await dataProvider.store.update('checklist_items', updatedItem);
        }
      }

      await dataProvider.store.delete('evidence', evidenceId);

      // Log action
      await dataProvider.store.logAction({
        entityType: 'evidence',
        entityId: evidenceId,
        action: 'EVIDENCE_DELETED',
        userId,
        userName,
        userRole,
        details: JSON.stringify({
          fileName: evidence.fileName,
          linkedTo: evidence.entityType,
          linkedId: evidence.entityId,
        }),
      });

      toast.success('Preuve supprimée', {
        description: evidence.fileName,
      });
    } catch (error: any) {
      console.error('❌ Delete evidence error:', error);
      toast.error('Erreur lors de la suppression', { description: error.message });
      throw error;
    }
  }

  /**
   * Convert file to base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Download evidence (from base64)
   */
  async downloadEvidence(evidenceId: string): Promise<void> {
    try {
      const evidence = await dataProvider.store.read('evidence', evidenceId);
      
      if (!evidence) {
        throw new Error('Evidence not found');
      }

      if (!evidence.base64Data) {
        throw new Error('No file data available (local mode)');
      }

      // Create download link
      const link = document.createElement('a');
      link.href = evidence.base64Data;
      link.download = evidence.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Téléchargement lancé', {
        description: evidence.fileName,
      });
    } catch (error: any) {
      console.error('❌ Download evidence error:', error);
      toast.error('Erreur lors du téléchargement', { description: error.message });
      throw error;
    }
  }
}

export const evidenceService = EvidenceService.getInstance();
