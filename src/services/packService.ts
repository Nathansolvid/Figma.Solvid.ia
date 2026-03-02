/**
 * PACK SERVICE - Gestion complète des packs en mode local
 * 
 * Fonctionnalités :
 * - Seed templates au démarrage
 * - Création de pack instances
 * - Calcul automatique du completion score
 * - Mise à jour des statuts
 * - Workflow (submit, approve, reject)
 */

import { dataProvider, PackTemplate, PackInstance, ChecklistItem, KPIRequirement, Folder, Indicator } from './dataProvider';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import PACK_TEMPLATES_DATA from '@/data/PACK_TEMPLATES.json';

// ==================== TYPES ====================

export interface CreatePackOptions {
  name: string;
  dossierId: string;
  templateCode: string;
  organizationId: string;
  ownerId: string;
}

export interface PackWithDetails extends PackInstance {
  checklistItems: ChecklistItem[];
  kpiRequirements: KPIRequirement[];
  completionScore: number;
  mandatoryItemsTotal: number;
  mandatoryItemsProvided: number;
  recommendedItemsTotal: number;
  recommendedItemsProvided: number;
}

// ==================== PACK SERVICE ====================

class PackService {
  private static instance: PackService;
  private templatesSeeded = false;

  private constructor() {}

  static getInstance(): PackService {
    if (!PackService.instance) {
      PackService.instance = new PackService();
    }
    return PackService.instance;
  }

  /**
   * Seed templates from JSON (run once on app init)
   */
  async seedTemplates(): Promise<void> {
    if (this.templatesSeeded) {
      console.log('✅ Templates already seeded, skipping');
      return;
    }

    try {
      console.log('🌱 Seeding pack templates...');

      const existingTemplates = await dataProvider.store.list('pack_templates');
      
      if (existingTemplates.length > 0) {
        console.log(`✅ Found ${existingTemplates.length} existing templates, skipping seed`);
        this.templatesSeeded = true;
        return;
      }

      // Seed templates from JSON
      const templates = PACK_TEMPLATES_DATA.templates as PackTemplate[];
      
      for (const template of templates) {
        await dataProvider.store.create('pack_templates', template);
        console.log(`✅ Template seeded: ${template.name}`);
      }

      this.templatesSeeded = true;
      console.log(`✅ ${templates.length} templates seeded successfully`);
    } catch (error) {
      console.error('❌ Failed to seed templates:', error);
      // Don't throw - app should still work
    }
  }

  /**
   * Get all templates
   */
  async getTemplates(): Promise<PackTemplate[]> {
    await this.seedTemplates(); // Ensure templates are seeded
    return await dataProvider.store.list('pack_templates');
  }

  /**
   * Get template by code
   */
  async getTemplateByCode(code: string): Promise<PackTemplate | null> {
    const templates = await this.getTemplates();
    return templates.find(t => t.code === code) || null;
  }

  /**
   * Create a pack instance from template
   */
  async createPack(options: CreatePackOptions): Promise<PackInstance> {
    try {
      console.log('📦 Creating pack:', options);

      // Get template
      const template = await this.getTemplateByCode(options.templateCode);
      
      if (!template) {
        throw new Error(`Template not found: ${options.templateCode}`);
      }

      // Create pack instance
      const pack: PackInstance = {
        id: uuidv4(),
        name: options.name,
        dossierId: options.dossierId,
        templateCode: template.code,
        templateName: template.name,
        organizationId: options.organizationId,
        ownerId: options.ownerId,
        status: 'DRAFT',
        completionScore: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dataProvider.store.create('pack_instances', pack);

      // 🆕 Create folders E/S/G for the pack
      const categories: Array<'E' | 'S' | 'G'> = ['E', 'S', 'G'];
      const categoryNames = {
        E: 'Environnement',
        S: 'Social',
        G: 'Gouvernance',
      };

      const folderIds: Record<'E' | 'S' | 'G', string> = {
        E: '',
        S: '',
        G: '',
      };

      for (const category of categories) {
        const folder: Folder = {
          id: uuidv4(),
          packId: pack.id,
          name: categoryNames[category],
          category,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await dataProvider.store.create('folders', folder);
        folderIds[category] = folder.id;
        console.log(`✅ Created folder ${category}:`, folder.id);
      }

      // Clone checklist items from template
      for (const templateItem of template.checklistTemplateItems) {
        const checklistItem: ChecklistItem = {
          id: uuidv4(),
          packId: pack.id,
          code: templateItem.code,
          label: templateItem.label,
          requirementLevel: templateItem.requirementLevel,
          category: templateItem.category,
          status: 'MISSING',
          description: templateItem.description,
          updatedAt: new Date().toISOString(),
        };

        await dataProvider.store.create('checklist_items', checklistItem);
        
        // 🆕 ALSO create an indicator for each checklist item so it can be updated in PackView
        const folderId = folderIds[templateItem.category];
        const indicator: Indicator = {
          id: uuidv4(),
          folderId,
          packId: pack.id,
          code: templateItem.code,
          name: templateItem.label,
          unit: '', // Will be set later if it's a KPI
          category: templateItem.category,
          status: 'missing',
          requirementLevel: templateItem.requirementLevel,
          hasEvidence: false,
          evidenceCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        await dataProvider.store.create('indicators', indicator);
        console.log(`✅ Created indicator ${templateItem.code} in folder ${templateItem.category}`);
      }

      // Clone KPI requirements from template
      for (const templateKPI of template.defaultKPIs) {
        const kpiReq: KPIRequirement = {
          id: uuidv4(),
          packId: pack.id,
          code: templateKPI.code,
          name: templateKPI.name,
          unit: templateKPI.unit,
          category: templateKPI.category,
          status: 'missing',
          calculationType: templateKPI.calculationType,
          formula: templateKPI.formula,
          hasEvidence: false,
          evidenceCount: 0,
          updatedAt: new Date().toISOString(),
        };

        await dataProvider.store.create('kpi_requirements', kpiReq);

        // 🆕 Update the existing indicator with KPI details (unit, etc.) if it exists
        // Don't create a duplicate - the indicator was already created from checklistTemplateItems
        const allIndicators = await dataProvider.store.list('indicators');
        const existingIndicator = allIndicators.find((ind: any) => 
          ind.packId === pack.id && ind.code === templateKPI.code
        );
        
        if (existingIndicator) {
          // Update existing indicator with KPI details
          const updatedIndicator = {
            ...existingIndicator,
            unit: templateKPI.unit,
            name: templateKPI.name, // Use KPI name if more specific
          };
          await dataProvider.store.update('indicators', updatedIndicator);
          console.log(`✅ Updated indicator ${templateKPI.code} with KPI details`);
        } else {
          // KPI doesn't have a corresponding checklist item - create new indicator
          const folderId = folderIds[templateKPI.category];
          const indicator: Indicator = {
            id: uuidv4(),
            folderId,
            packId: pack.id,
            code: templateKPI.code,
            name: templateKPI.name,
            unit: templateKPI.unit,
            category: templateKPI.category,
            status: 'missing',
            requirementLevel: 'MANDATORY', // Default to mandatory
            hasEvidence: false,
            evidenceCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await dataProvider.store.create('indicators', indicator);
          console.log(`✅ Created KPI indicator ${templateKPI.code} in folder ${templateKPI.category}`);
        }
      }

      // Log action
      await dataProvider.logAndNotify(
        {
          entityType: 'pack',
          entityId: pack.id,
          action: 'PACK_CREATED',
          userId: options.ownerId,
          userName: 'User', // TODO: Get from user context
          userRole: 'CLIENT_OWNER',
          details: JSON.stringify({
            packName: pack.name,
            templateCode: template.code,
            templateName: template.name,
          }),
        },
        {
          userId: options.ownerId,
          type: 'pack_submitted', // Reuse type
          title: 'Pack créé',
          description: `Le pack "${pack.name}" a été créé avec succès`,
          packId: pack.id,
        }
      );

      console.log('✅ Pack created successfully:', pack);
      toast.success('Pack créé avec succès', {
        description: `${pack.name} (${template.name})`,
      });

      // 🆕 Emit event to trigger dashboard reload
      window.dispatchEvent(new CustomEvent('pack-created', { detail: { packId: pack.id } }));

      return pack;
    } catch (error: any) {
      console.error('❌ Pack creation error:', error);
      toast.error('Erreur lors de la création du pack', {
        description: error.message,
      });
      throw error;
    }
  }

  /**
   * Get pack with all details (checklist, KPIs, score)
   */
  async getPackWithDetails(packId: string): Promise<PackWithDetails | null> {
    try {
      const pack = await dataProvider.store.read('pack_instances', packId);
      
      if (!pack) {
        console.error('Pack not found:', packId);
        return null;
      }

      const checklistItems = await dataProvider.store.listByIndex('checklist_items', 'packId', packId);
      const kpiRequirements = await dataProvider.store.listByIndex('kpi_requirements', 'packId', packId);

      // Calculate completion score
      const mandatoryItems = checklistItems.filter(item => item.requirementLevel === 'MANDATORY');
      const mandatoryProvided = mandatoryItems.filter(item => 
        item.status === 'PROVIDED' || item.status === 'ACCEPTED'
      );

      const recommendedItems = checklistItems.filter(item => item.requirementLevel === 'RECOMMENDED');
      const recommendedProvided = recommendedItems.filter(item => 
        item.status === 'PROVIDED' || item.status === 'ACCEPTED'
      );

      const completionScore = mandatoryItems.length > 0
        ? Math.round((mandatoryProvided.length / mandatoryItems.length) * 100)
        : 0;

      const packWithDetails: PackWithDetails = {
        ...pack,
        checklistItems,
        kpiRequirements,
        completionScore,
        mandatoryItemsTotal: mandatoryItems.length,
        mandatoryItemsProvided: mandatoryProvided.length,
        recommendedItemsTotal: recommendedItems.length,
        recommendedItemsProvided: recommendedProvided.length,
      };

      return packWithDetails;
    } catch (error) {
      console.error('❌ Get pack with details error:', error);
      return null;
    }
  }

  /**
   * List all packs for an organization
   */
  async listPacks(organizationId: string): Promise<PackInstance[]> {
    try {
      const allPacks = await dataProvider.store.listByIndex('pack_instances', 'organizationId', organizationId);
      return allPacks;
    } catch (error) {
      console.error('❌ List packs error:', error);
      return [];
    }
  }

  /**
   * Update pack status
   */
  async updatePackStatus(
    packId: string,
    newStatus: PackInstance['status'],
    userId: string,
    userName: string,
    userRole: string
  ): Promise<void> {
    try {
      const pack = await dataProvider.store.read('pack_instances', packId);
      
      if (!pack) {
        throw new Error('Pack not found');
      }

      const oldStatus = pack.status;

      const updatedPack: PackInstance = {
        ...pack,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        ...(newStatus === 'READY_FOR_REVIEW' && { submittedAt: new Date().toISOString() }),
        ...(newStatus === 'APPROVED' && { reviewedAt: new Date().toISOString() }),
      };

      await dataProvider.store.update('pack_instances', updatedPack);

      // Log action
      await dataProvider.logAndNotify(
        {
          entityType: 'pack',
          entityId: packId,
          action: 'PACK_STATUS_CHANGED',
          userId,
          userName,
          userRole,
          before: JSON.stringify({ status: oldStatus }),
          after: JSON.stringify({ status: newStatus }),
        },
        {
          userId: pack.ownerId, // Notify owner
          type: this.getNotificationTypeForStatus(newStatus),
          title: this.getNotificationTitleForStatus(newStatus),
          description: `Le pack "${pack.name}" est maintenant : ${this.getStatusLabel(newStatus)}`,
          packId,
        }
      );

      toast.success('Statut mis à jour', {
        description: `Le pack est maintenant : ${this.getStatusLabel(newStatus)}`,
      });
    } catch (error: any) {
      console.error('❌ Update pack status error:', error);
      toast.error('Erreur lors de la mise à jour du statut', {
        description: error.message,
      });
      throw error;
    }
  }

  /**
   * Mark checklist item as provided
   */
  async markItemAsProvided(itemId: string, userId: string, userName: string, userRole: string): Promise<void> {
    try {
      const item = await dataProvider.store.read('checklist_items', itemId);
      
      if (!item) {
        throw new Error('Item not found');
      }

      const updatedItem: ChecklistItem = {
        ...item,
        status: 'PROVIDED',
        updatedAt: new Date().toISOString(),
      };

      await dataProvider.store.update('checklist_items', updatedItem);

      // Log action
      await dataProvider.store.logAction({
        entityType: 'checklist',
        entityId: itemId,
        action: 'ITEM_MARKED_PROVIDED',
        userId,
        userName,
        userRole,
        details: JSON.stringify({ code: item.code, label: item.label }),
      });

      // Recalculate pack completion score
      await this.recalculatePackScore(item.packId);

      toast.success('Item marqué comme fourni', {
        description: item.label,
      });
      
      // 🆕 Emit event to trigger dashboard reload
      window.dispatchEvent(new CustomEvent('checklist-updated', { detail: { itemId, packId: item.packId } }));
    } catch (error: any) {
      console.error('❌ Mark item as provided error:', error);
      toast.error('Erreur', { description: error.message });
      throw error;
    }
  }

  /**
   * Mark checklist item as missing
   */
  async markItemAsMissing(itemId: string, userId: string, userName: string, userRole: string): Promise<void> {
    try {
      const item = await dataProvider.store.read('checklist_items', itemId);
      
      if (!item) {
        throw new Error('Item not found');
      }

      const updatedItem: ChecklistItem = {
        ...item,
        status: 'MISSING',
        updatedAt: new Date().toISOString(),
      };

      await dataProvider.store.update('checklist_items', updatedItem);

      // Log action
      await dataProvider.store.logAction({
        entityType: 'checklist',
        entityId: itemId,
        action: 'ITEM_MARKED_MISSING',
        userId,
        userName,
        userRole,
        details: JSON.stringify({ code: item.code, label: item.label }),
      });

      // Recalculate pack completion score
      await this.recalculatePackScore(item.packId);

      toast.success('Item marqué comme manquant');
      
      // 🆕 Emit event to trigger dashboard reload
      window.dispatchEvent(new CustomEvent('checklist-updated', { detail: { itemId, packId: item.packId } }));
    } catch (error: any) {
      console.error('❌ Mark item as missing error:', error);
      toast.error('Erreur', { description: error.message });
      throw error;
    }
  }

  /**
   * Update checklist item comment
   */
  async updateItemComment(
    itemId: string,
    comment: string,
    userId: string,
    userName: string,
    userRole: string
  ): Promise<void> {
    try {
      const item = await dataProvider.store.read('checklist_items', itemId);
      
      if (!item) {
        throw new Error('Item not found');
      }

      const updatedItem: ChecklistItem = {
        ...item,
        comment,
        updatedAt: new Date().toISOString(),
      };

      await dataProvider.store.update('checklist_items', updatedItem);

      // Log action
      await dataProvider.store.logAction({
        entityType: 'checklist',
        entityId: itemId,
        action: 'ITEM_COMMENT_UPDATED',
        userId,
        userName,
        userRole,
        details: JSON.stringify({ code: item.code, label: item.label, comment }),
      });

      toast.success('Commentaire enregistré');
    } catch (error: any) {
      console.error('❌ Update item comment error:', error);
      toast.error('Erreur', { description: error.message });
      throw error;
    }
  }

  /**
   * Recalculate pack completion score
   */
  private async recalculatePackScore(packId: string): Promise<void> {
    try {
      const pack = await dataProvider.store.read('pack_instances', packId);
      
      if (!pack) {
        return;
      }

      const checklistItems = await dataProvider.store.listByIndex('checklist_items', 'packId', packId);
      const mandatoryItems = checklistItems.filter(item => item.requirementLevel === 'MANDATORY');
      const mandatoryProvided = mandatoryItems.filter(item => 
        item.status === 'PROVIDED' || item.status === 'ACCEPTED'
      );

      const completionScore = mandatoryItems.length > 0
        ? Math.round((mandatoryProvided.length / mandatoryItems.length) * 100)
        : 0;

      const updatedPack: PackInstance = {
        ...pack,
        completionScore,
        updatedAt: new Date().toISOString(),
      };

      await dataProvider.store.update('pack_instances', updatedPack);

      console.log(`✅ Pack score recalculated: ${completionScore}%`);
    } catch (error) {
      console.error('❌ Recalculate pack score error:', error);
    }
  }

  /**
   * Submit pack for review
   */
  async submitForReview(
    packId: string,
    userId: string,
    userName: string,
    userRole: string
  ): Promise<{ success: boolean; missingItems?: string[] }> {
    try {
      const packWithDetails = await this.getPackWithDetails(packId);
      
      if (!packWithDetails) {
        throw new Error('Pack not found');
      }

      // Check if all mandatory items are provided
      const missingMandatory = packWithDetails.checklistItems.filter(
        item => item.requirementLevel === 'MANDATORY' && item.status === 'MISSING'
      );

      if (missingMandatory.length > 0) {
        const missingLabels = missingMandatory.map(item => item.label);
        
        toast.error('Impossible de soumettre', {
          description: `${missingMandatory.length} item(s) obligatoire(s) manquant(s)`,
        });

        return { success: false, missingItems: missingLabels };
      }

      // Update pack status
      await this.updatePackStatus(packId, 'READY_FOR_REVIEW', userId, userName, userRole);

      return { success: true };
    } catch (error: any) {
      console.error('❌ Submit for review error:', error);
      toast.error('Erreur lors de la soumission', { description: error.message });
      throw error;
    }
  }

  /**
   * Delete pack (soft delete by marking as archived or hard delete)
   */
  async deletePackDirect(packId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting pack:', packId);

      // Get pack
      const pack = await dataProvider.store.read('pack_instances', packId);
      if (!pack) {
        throw new Error('Pack not found');
      }

      // Delete checklist items
      const checklistItems = await dataProvider.store.listByIndex('checklist_items', 'packId', packId);
      for (const item of checklistItems) {
        await dataProvider.store.delete('checklist_items', item.id);
      }

      // Delete KPI requirements
      const kpiRequirements = await dataProvider.store.listByIndex('kpi_requirements', 'packId', packId);
      for (const kpi of kpiRequirements) {
        await dataProvider.store.delete('kpi_requirements', kpi.id);
      }

      // 🆕 Delete indicators
      const indicators = await dataProvider.store.listByIndex('indicators', 'packId', packId);
      for (const indicator of indicators) {
        await dataProvider.store.delete('indicators', indicator.id);
      }

      // 🆕 Delete folders
      const folders = await dataProvider.store.listByIndex('folders', 'packId', packId);
      for (const folder of folders) {
        await dataProvider.store.delete('folders', folder.id);
      }

      // Delete evidence
      const evidenceList = await dataProvider.store.listByIndex('evidence', 'packId', packId);
      for (const evidence of evidenceList) {
        await dataProvider.store.delete('evidence', evidence.id);
      }

      // Delete pack instance
      await dataProvider.store.delete('pack_instances', packId);

      console.log('✅ Pack deleted successfully');
      toast.success('Pack supprimé avec succès');
      
      // 🆕 Emit event to trigger dashboard reload
      window.dispatchEvent(new CustomEvent('pack-deleted', { detail: { packId } }));
    } catch (error: any) {
      console.error('❌ Delete pack error:', error);
      toast.error('Erreur lors de la suppression', { description: error.message });
      throw error;
    }
  }

  /**
   * Helper: Get notification type for status
   */
  private getNotificationTypeForStatus(status: PackInstance['status']): any {
    const mapping: Record<PackInstance['status'], any> = {
      DRAFT: 'pack_submitted',
      IN_PROGRESS: 'pack_submitted',
      READY_FOR_REVIEW: 'pack_submitted',
      CHANGES_REQUESTED: 'changes_requested',
      APPROVED: 'pack_approved',
      REJECTED: 'pack_rejected',
    };
    return mapping[status] || 'pack_submitted';
  }

  /**
   * Helper: Get notification title for status
   */
  private getNotificationTitleForStatus(status: PackInstance['status']): string {
    const mapping: Record<PackInstance['status'], string> = {
      DRAFT: 'Pack en brouillon',
      IN_PROGRESS: 'Pack en cours',
      READY_FOR_REVIEW: 'Pack soumis pour revue',
      CHANGES_REQUESTED: 'Modifications demandées',
      APPROVED: 'Pack approuvé',
      REJECTED: 'Pack rejeté',
    };
    return mapping[status] || 'Mise à jour du pack';
  }

  /**
   * Helper: Get status label
   */
  private getStatusLabel(status: PackInstance['status']): string {
    const mapping: Record<PackInstance['status'], string> = {
      DRAFT: 'Brouillon',
      IN_PROGRESS: 'En cours',
      READY_FOR_REVIEW: 'Prêt pour revue',
      CHANGES_REQUESTED: 'Modifications demandées',
      APPROVED: 'Approuvé',
      REJECTED: 'Rejeté',
    };
    return mapping[status] || status;
  }

  /**
   * 🆕 Get pack with full details (folders + indicators + evidence)
   * Used by usePackFull() hook
   * 🔧 Returns null if pack doesn't exist instead of throwing
   */
  async getPack(packId: string): Promise<any | null> {
    try {
      console.log('📦 packService.getPack called for:', packId);
      
      // Get pack instance
      const pack = await dataProvider.store.read('pack_instances', packId);
      
      if (!pack) {
        console.warn('⚠️ Pack not found:', packId, '- returning null');
        return null; // 🆕 Return null instead of throwing
      }

      // Get folders
      const folders = await dataProvider.store.listByIndex('folders', 'packId', packId);
      console.log('📁 Folders found:', folders.length);

      // Get indicators for each folder
      const foldersWithIndicators = await Promise.all(
        folders.map(async (folder) => {
          const indicators = await dataProvider.store.listByIndex('indicators', 'folderId', folder.id);
          
          // Get evidence for each indicator
          const indicatorsWithEvidence = await Promise.all(
            indicators.map(async (indicator) => {
              const evidence = await dataProvider.store.listByIndex('evidence', 'indicatorId', indicator.id);
              return {
                ...indicator,
                evidence: evidence || [],
                evidences: evidence || [], // Alias for compatibility
              };
            })
          );
          
          return {
            ...folder,
            indicators: indicatorsWithEvidence,
          };
        })
      );

      const result = {
        ...pack,
        folders: foldersWithIndicators,
      };

      console.log('✅ Pack loaded successfully:', {
        id: pack.id,
        name: pack.name,
        foldersCount: foldersWithIndicators.length,
        indicatorsCount: foldersWithIndicators.reduce((acc, f) => acc + f.indicators.length, 0),
      });

      return result;
    } catch (error) {
      console.error('❌ packService.getPack error:', error);
      throw error;
    }
  }

  /**
   * 🆕 List all packs (without filters)
   * Used by listPacksDirect()
   */
  async listPacksLocal(): Promise<{ packs: PackInstance[] }> {
    try {
      const allPacks = await dataProvider.store.list('pack_instances');
      return { packs: allPacks };
    } catch (error) {
      console.error('❌ listPacksLocal error:', error);
      return { packs: [] };
    }
  }

  /**
   * 🆕 Update pack (generic update)
   * Used by useUpdatePack() hook
   */
  async updatePack(packId: string, data: Partial<PackInstance>): Promise<{ pack: PackInstance }> {
    try {
      const pack = await dataProvider.store.read('pack_instances', packId);
      
      if (!pack) {
        throw new Error('Pack not found');
      }

      const updatedPack: PackInstance = {
        ...pack,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      await dataProvider.store.update('pack_instances', updatedPack);

      return { pack: updatedPack };
    } catch (error: any) {
      console.error('❌ updatePack error:', error);
      throw error;
    }
  }
}

// ==================== EXPORT SINGLETON ====================

export const packService = PackService.getInstance();

// Export initialize function
export async function initPackService(): Promise<void> {
  await packService.seedTemplates();
}