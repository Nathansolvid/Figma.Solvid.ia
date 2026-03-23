/**
 * RGPD SERVICE - Conformite RGPD (GDPR) pour Solvid.IA
 *
 * Art. 15 - Droit d'acces (inventaire des donnees personnelles)
 * Art. 17 - Droit a l'effacement (suppression du compte)
 * Art. 20 - Droit a la portabilite (export des donnees)
 * + Gestion du consentement et nettoyage des donnees expirees
 */

import { dataProvider } from './dataProvider';
import {
  idbGetValuesByDossier,
  idbDeleteValuesByDossier,
} from './idbService';

// ==================== TYPES ====================

interface DataInventoryItem {
  category: string;
  dataType: string;
  purpose: string;
  retention: string;
  count: number;
}

// ==================== RGPD SERVICE ====================

export const rgpdService = {
  /**
   * Art. 20 - Droit a la portabilite : export de toutes les donnees utilisateur au format JSON
   */
  async exportUserData(userId: string, organizationId: string): Promise<object> {
    try {
      // --- Donnees personnelles ---
      const user = await dataProvider.store.read('users', userId);
      const organization = await dataProvider.store.read('organizations', organizationId);

      // --- Dossiers ---
      const dossiers = await dataProvider.store.listByIndex('dossiers', 'organizationId', organizationId);

      // --- Pack instances ---
      const packInstances = await dataProvider.store.listByIndex('pack_instances', 'organizationId', organizationId);
      const packIds = packInstances.map(p => p.id);

      // --- Indicateurs, checklist, KPI par pack ---
      const allIndicators: any[] = [];
      const allChecklistItems: any[] = [];
      const allKpiRequirements: any[] = [];
      const allEvidence: any[] = [];
      const allEvidenceLinks: any[] = [];
      const allDataImports: any[] = [];
      const allDataRows: any[] = [];
      const allExportHistory: any[] = [];

      for (const packId of packIds) {
        try {
          const indicators = await dataProvider.store.listByIndex('indicators', 'packId', packId);
          allIndicators.push(...indicators);
        } catch { /* continue */ }

        try {
          const checklist = await dataProvider.store.listByIndex('checklist_items', 'packId', packId);
          allChecklistItems.push(...checklist);
        } catch { /* continue */ }

        try {
          const kpis = await dataProvider.store.listByIndex('kpi_requirements', 'packId', packId);
          allKpiRequirements.push(...kpis);
        } catch { /* continue */ }

        try {
          const evidence = await dataProvider.store.listByIndex('evidence', 'packId', packId);
          // Strip base64 blobs for lighter export
          allEvidence.push(...evidence.map(e => ({ ...e, fileBlobBase64: undefined })));
        } catch { /* continue */ }

        try {
          const evidenceLinks = await dataProvider.store.listByIndex('evidence_links', 'evidenceId', packId);
          allEvidenceLinks.push(...evidenceLinks);
        } catch { /* continue */ }

        try {
          const imports = await dataProvider.store.listByIndex('data_imports', 'packId', packId);
          allDataImports.push(...imports);
        } catch { /* continue */ }

        try {
          const rows = await dataProvider.store.listByIndex('data_rows', 'packId', packId);
          allDataRows.push(...rows);
        } catch { /* continue */ }

        try {
          const exports = await dataProvider.store.listByIndex('export_history', 'packId', packId);
          // Strip base64 blobs for lighter export
          allExportHistory.push(...exports.map(e => ({ ...e, blobBase64: undefined })));
        } catch { /* continue */ }
      }

      // --- Evidence links (by kpiId too) ---
      for (const kpi of allKpiRequirements) {
        try {
          const links = await dataProvider.store.listByIndex('evidence_links', 'kpiId', kpi.id);
          for (const link of links) {
            if (!allEvidenceLinks.find(el => el.id === link.id)) {
              allEvidenceLinks.push(link);
            }
          }
        } catch { /* continue */ }
      }

      // --- VSME values par dossier (idbService) ---
      const allVsmeValues: any[] = [];
      for (const dossier of dossiers) {
        try {
          const values = await idbGetValuesByDossier(dossier.id);
          allVsmeValues.push(...values);
        } catch { /* continue */ }
      }

      // --- Audit logs pour l'utilisateur ---
      const allAuditLogs = await dataProvider.store.list('audit_logs');
      const userAuditLogs = allAuditLogs.filter(
        log => log.userId === userId || log.entityId === userId || log.entityId === organizationId
      );

      // --- Tasks ---
      const allTasks = await dataProvider.store.list('tasks');
      const userTasks = allTasks.filter(t => t.assignedTo === userId || t.createdBy === userId);

      // --- Notifications ---
      const userNotifications = await dataProvider.store.listByIndex('notifications', 'userId', userId);

      // --- Sessions ---
      const session = await dataProvider.store.read('sessions', userId);

      // --- Build export ---
      return {
        exportDate: new Date().toISOString(),
        exportVersion: '1.0',
        userId,
        personalData: {
          name: user?.name ?? null,
          email: user?.email ?? null,
          role: user?.role ?? null,
          avatar: user?.avatar ?? null,
          createdAt: user?.createdAt ?? null,
          organization: organization ? {
            id: organization.id,
            name: organization.name,
            sector: organization.sector ?? null,
            size: organization.size ?? null,
            createdAt: organization.createdAt,
          } : null,
        },
        dossiers: dossiers.map(d => ({
          id: d.id,
          name: d.name,
          description: d.description,
          status: d.status,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        })),
        packInstances: packInstances.map(p => ({
          id: p.id,
          name: p.name,
          templateCode: p.templateCode,
          templateName: p.templateName,
          status: p.status,
          completionScore: p.completionScore,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
        indicators: allIndicators,
        checklistItems: allChecklistItems,
        kpiRequirements: allKpiRequirements,
        evidence: allEvidence,
        evidenceLinks: allEvidenceLinks,
        dataImports: allDataImports,
        dataRows: allDataRows,
        vsmeValues: allVsmeValues,
        exportHistory: allExportHistory,
        tasks: userTasks,
        notifications: userNotifications,
        auditLogs: userAuditLogs,
        sessions: session ? [session] : [],
      };
    } catch (error) {
      console.error('[RGPD] exportUserData error:', error);
      throw new Error(`Erreur lors de l'export des donnees: ${String(error)}`);
    }
  },

  /**
   * Art. 17 - Droit a l'effacement : suppression de toutes les donnees utilisateur
   */
  async deleteUserAccount(userId: string, organizationId: string): Promise<{ deletedCounts: Record<string, number> }> {
    const counts: Record<string, number> = {};

    try {
      // --- Collect pack IDs for the organization ---
      const packInstances = await dataProvider.store.listByIndex('pack_instances', 'organizationId', organizationId);
      const packIds = packInstances.map(p => p.id);

      // 1. Evidence & evidence_links for org's packs
      counts['evidence'] = 0;
      counts['evidence_links'] = 0;
      for (const packId of packIds) {
        try {
          const evidence = await dataProvider.store.listByIndex('evidence', 'packId', packId);
          for (const e of evidence) {
            // Delete associated evidence_links
            try {
              const links = await dataProvider.store.listByIndex('evidence_links', 'evidenceId', e.id);
              for (const link of links) {
                await dataProvider.store.delete('evidence_links', link.id);
                counts['evidence_links']++;
              }
            } catch { /* continue */ }
            await dataProvider.store.delete('evidence', e.id);
            counts['evidence']++;
          }
        } catch { /* continue */ }
      }

      // 2. Indicators, checklist_items, kpi_requirements for org's packs
      counts['indicators'] = 0;
      counts['checklist_items'] = 0;
      counts['kpi_requirements'] = 0;
      for (const packId of packIds) {
        try {
          const indicators = await dataProvider.store.listByIndex('indicators', 'packId', packId);
          for (const ind of indicators) {
            await dataProvider.store.delete('indicators', ind.id);
            counts['indicators']++;
          }
        } catch { /* continue */ }

        try {
          const checklist = await dataProvider.store.listByIndex('checklist_items', 'packId', packId);
          for (const item of checklist) {
            await dataProvider.store.delete('checklist_items', item.id);
            counts['checklist_items']++;
          }
        } catch { /* continue */ }

        try {
          const kpis = await dataProvider.store.listByIndex('kpi_requirements', 'packId', packId);
          for (const kpi of kpis) {
            await dataProvider.store.delete('kpi_requirements', kpi.id);
            counts['kpi_requirements']++;
          }
        } catch { /* continue */ }
      }

      // 3. Data rows & data imports for org's packs
      counts['data_rows'] = 0;
      counts['data_imports'] = 0;
      for (const packId of packIds) {
        try {
          const rows = await dataProvider.store.listByIndex('data_rows', 'packId', packId);
          for (const row of rows) {
            await dataProvider.store.delete('data_rows', row.id);
            counts['data_rows']++;
          }
        } catch { /* continue */ }

        try {
          const imports = await dataProvider.store.listByIndex('data_imports', 'packId', packId);
          for (const imp of imports) {
            await dataProvider.store.delete('data_imports', imp.id);
            counts['data_imports']++;
          }
        } catch { /* continue */ }
      }

      // 4. Pack instances for org
      counts['pack_instances'] = 0;
      for (const pack of packInstances) {
        await dataProvider.store.delete('pack_instances', pack.id);
        counts['pack_instances']++;
      }

      // 5. Tasks & notifications for user
      counts['tasks'] = 0;
      const allTasks = await dataProvider.store.list('tasks');
      for (const task of allTasks) {
        if (task.assignedTo === userId || task.createdBy === userId) {
          await dataProvider.store.delete('tasks', task.id);
          counts['tasks']++;
        }
      }

      counts['notifications'] = 0;
      const userNotifications = await dataProvider.store.listByIndex('notifications', 'userId', userId);
      for (const notif of userNotifications) {
        await dataProvider.store.delete('notifications', notif.id);
        counts['notifications']++;
      }

      // 6. Audit logs for user/org entities
      counts['audit_logs'] = 0;
      const allAuditLogs = await dataProvider.store.list('audit_logs');
      for (const log of allAuditLogs) {
        if (log.userId === userId || log.entityId === userId || log.entityId === organizationId) {
          await dataProvider.store.delete('audit_logs', log.id);
          counts['audit_logs']++;
        }
      }

      // 7. Export history for org's packs
      counts['export_history'] = 0;
      for (const packId of packIds) {
        try {
          const exports = await dataProvider.store.listByIndex('export_history', 'packId', packId);
          for (const exp of exports) {
            await dataProvider.store.delete('export_history', exp.id);
            counts['export_history']++;
          }
        } catch { /* continue */ }
      }

      // 8. VSME values for org's dossiers (via idbService)
      counts['vsme_values'] = 0;
      const dossiers = await dataProvider.store.listByIndex('dossiers', 'organizationId', organizationId);
      for (const dossier of dossiers) {
        try {
          const values = await idbGetValuesByDossier(dossier.id);
          counts['vsme_values'] += values.length;
          await idbDeleteValuesByDossier(dossier.id);
        } catch { /* continue */ }
      }

      // 9. Dossiers for org
      counts['dossiers'] = 0;
      for (const dossier of dossiers) {
        await dataProvider.store.delete('dossiers', dossier.id);
        counts['dossiers']++;
      }

      // 10. Sessions for user
      counts['sessions'] = 0;
      try {
        await dataProvider.store.delete('sessions', userId);
        counts['sessions']++;
      } catch { /* may not exist */ }

      // 11. Read user email BEFORE deleting user record (for localStorage cleanup)
      let userEmail: string | null = null;
      try {
        const userRecord = await dataProvider.store.read('users', userId);
        userEmail = userRecord?.email?.toLowerCase() ?? null;
      } catch { /* ignore */ }

      // 12. User record
      counts['users'] = 0;
      try {
        await dataProvider.store.delete('users', userId);
        counts['users']++;
      } catch { /* may not exist */ }

      // 13. Organization record (if user was the only member)
      counts['organizations'] = 0;
      const allUsers = await dataProvider.store.list('users');
      const orgMembers = allUsers.filter(u => u.organizationId === organizationId);
      if (orgMembers.length === 0) {
        try {
          await dataProvider.store.delete('organizations', organizationId);
          counts['organizations']++;
        } catch { /* may not exist */ }
      }

      // 14. Clean localStorage keys
      try {
        localStorage.removeItem('solvid_session');
        // Remove credential for this user's email
        if (userEmail) {
          const creds = JSON.parse(localStorage.getItem('solvid_local_credentials') || '{}');
          delete creds[userEmail];
          localStorage.setItem('solvid_local_credentials', JSON.stringify(creds));
        }
        // Remove ERP-related keys
        const keysToClean = Object.keys(localStorage).filter(
          k => k.startsWith('solvid_erp_') || k === 'solvid_sync_queue'
        );
        for (const key of keysToClean) {
          localStorage.removeItem(key);
        }
      } catch { /* localStorage cleanup is best-effort */ }

      return { deletedCounts: counts };
    } catch (error) {
      console.error('[RGPD] deleteUserAccount error:', error);
      throw new Error(`Erreur lors de la suppression du compte: ${String(error)}`);
    }
  },

  /**
   * Art. 15 - Droit d'acces : inventaire des donnees personnelles
   */
  async getDataInventory(userId: string, organizationId: string): Promise<DataInventoryItem[]> {
    try {
      // Count actual records for each category
      let sessionCount = 0;
      try {
        const session = await dataProvider.store.read('sessions', userId);
        if (session) sessionCount = 1;
      } catch { /* ignore */ }

      const dossiers = await dataProvider.store.listByIndex('dossiers', 'organizationId', organizationId);
      const packInstances = await dataProvider.store.listByIndex('pack_instances', 'organizationId', organizationId);
      const packIds = packInstances.map(p => p.id);

      let indicatorCount = 0;
      let evidenceCount = 0;
      let vsmeCount = 0;

      for (const packId of packIds) {
        try {
          const indicators = await dataProvider.store.listByIndex('indicators', 'packId', packId);
          indicatorCount += indicators.length;
        } catch { /* continue */ }

        try {
          const evidence = await dataProvider.store.listByIndex('evidence', 'packId', packId);
          evidenceCount += evidence.length;
        } catch { /* continue */ }
      }

      for (const dossier of dossiers) {
        try {
          const values = await idbGetValuesByDossier(dossier.id);
          vsmeCount += values.length;
        } catch { /* continue */ }
      }

      const allAuditLogs = await dataProvider.store.list('audit_logs');
      const userAuditLogs = allAuditLogs.filter(
        log => log.userId === userId || log.entityId === userId || log.entityId === organizationId
      );

      return [
        {
          category: 'Identite',
          dataType: 'Nom, email, role, avatar',
          purpose: 'Gestion du compte utilisateur',
          retention: 'Duree du compte + 2 ans',
          count: 1,
        },
        {
          category: 'Authentification',
          dataType: 'Hash mot de passe, sessions actives',
          purpose: "Securite d'acces",
          retention: 'Sessions: 24h, Hash: duree du compte',
          count: 1 + sessionCount,
        },
        {
          category: 'Organisation',
          dataType: 'Nom, secteur, logo, couleurs de marque',
          purpose: "Personnalisation de l'espace de travail",
          retention: 'Duree du contrat',
          count: 1,
        },
        {
          category: 'Donnees ESG',
          dataType: 'Dossiers, indicateurs VSME, packs conformite',
          purpose: 'Service de reporting ESG',
          retention: 'Duree du contrat',
          count: dossiers.length + packInstances.length + indicatorCount + vsmeCount,
        },
        {
          category: 'Preuves',
          dataType: 'Fichiers evidence, documents justificatifs',
          purpose: 'Audit trail ESG',
          retention: 'Duree du contrat + 2 ans',
          count: evidenceCount,
        },
        {
          category: 'Journaux',
          dataType: "Audit logs, historique d'actions",
          purpose: 'Securite et tracabilite',
          retention: '2 ans',
          count: userAuditLogs.length,
        },
        {
          category: 'IA',
          dataType: 'Prompts et reponses IA (Claude)',
          purpose: 'Generation de rapports ESG',
          retention: 'Non conserve (traitement temps reel)',
          count: 0,
        },
      ];
    } catch (error) {
      console.error('[RGPD] getDataInventory error:', error);
      throw new Error(`Erreur lors de l'inventaire des donnees: ${String(error)}`);
    }
  },

  /**
   * Gestion du consentement
   */
  async updateConsent(userId: string, consentType: 'cgu' | 'ai' | 'cookies', value: boolean): Promise<void> {
    try {
      const user = await dataProvider.store.read('users', userId);
      if (!user) throw new Error('Utilisateur introuvable');

      const now = new Date().toISOString();
      const updatedUser = { ...user } as any;

      switch (consentType) {
        case 'cgu':
          updatedUser.consentCGU = value ? now : null;
          break;
        case 'ai':
          updatedUser.consentAI = value ? now : null;
          break;
        case 'cookies':
          // Cookies consent stored in localStorage (not user record)
          if (value) {
            localStorage.setItem('solvid_consent_cookies', now);
          } else {
            localStorage.removeItem('solvid_consent_cookies');
          }
          return; // No need to update user record
      }

      await dataProvider.store.update('users', updatedUser);
    } catch (error) {
      console.error('[RGPD] updateConsent error:', error);
      throw new Error(`Erreur lors de la mise a jour du consentement: ${String(error)}`);
    }
  },

  /**
   * Nettoyage des donnees expirees - a appeler au demarrage de l'application
   */
  async cleanupExpiredData(): Promise<{ cleaned: Record<string, number> }> {
    const cleaned: Record<string, number> = {};
    const now = new Date();

    try {
      // --- Sessions expirees (plus de 24h) ---
      cleaned['sessions'] = 0;
      const allSessions = await dataProvider.store.list('sessions');
      for (const session of allSessions) {
        if (session.expiresAt && new Date(session.expiresAt) < now) {
          try {
            await dataProvider.store.delete('sessions', session.userId);
            cleaned['sessions']++;
          } catch { /* continue */ }
        }
      }

      // --- Audit logs de plus de 2 ans ---
      cleaned['audit_logs'] = 0;
      const twoYearsAgo = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
      const allAuditLogs = await dataProvider.store.list('audit_logs');
      for (const log of allAuditLogs) {
        if (new Date(log.timestamp) < twoYearsAgo) {
          try {
            await dataProvider.store.delete('audit_logs', log.id);
            cleaned['audit_logs']++;
          } catch { /* continue */ }
        }
      }

      // --- Notifications lues de plus de 6 mois ---
      cleaned['notifications'] = 0;
      const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
      const allNotifications = await dataProvider.store.list('notifications');
      for (const notif of allNotifications) {
        if (notif.read && new Date(notif.createdAt) < sixMonthsAgo) {
          try {
            await dataProvider.store.delete('notifications', notif.id);
            cleaned['notifications']++;
          } catch { /* continue */ }
        }
      }

      // --- Export history de plus d'un an ---
      cleaned['export_history'] = 0;
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      const allExports = await dataProvider.store.list('export_history');
      for (const exp of allExports) {
        if (new Date(exp.generatedAt) < oneYearAgo) {
          try {
            await dataProvider.store.delete('export_history', exp.id);
            cleaned['export_history']++;
          } catch { /* continue */ }
        }
      }

      return { cleaned };
    } catch (error) {
      console.error('[RGPD] cleanupExpiredData error:', error);
      return { cleaned };
    }
  },
};
