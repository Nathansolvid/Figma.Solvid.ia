// ============================================================================
// DEBUG UTILITIES - PHASE 9 : EXPORTS & LIVRABLES
// ============================================================================
// Fonctions utilitaires pour déboguer les exports en console navigateur

import { 
  getAllExports, 
  getExportStats, 
  clearAllExports,
  getExportById,
  deleteExport,
} from '@/services/exportHistoryService';

// ============================================================================
// EXPORTS DEBUGGING
// ============================================================================

export const debugPhase9 = {
  /**
   * Afficher l'aide
   */
  help() {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║  🔧 DEBUG PHASE 9 : EXPORTS & LIVRABLES                       ║
╚════════════════════════════════════════════════════════════════╝

📊 STATISTIQUES
  debugPhase9.stats()              Statistiques des exports
  debugPhase9.list()               Liste tous les exports
  debugPhase9.listDetailed()       Liste détaillée avec métadonnées

🔍 INSPECTION
  debugPhase9.inspect(id)          Inspecter un export par ID
  debugPhase9.latest()             Dernier export généré

🗑️ NETTOYAGE
  debugPhase9.delete(id)           Supprimer un export
  debugPhase9.clear()              Supprimer TOUS les exports
  debugPhase9.clearOld(days)       Supprimer exports > N jours

📈 ANALYSE
  debugPhase9.sizeByFormat()       Taille totale par format
  debugPhase9.countByStatus()      Nombre par statut
  debugPhase9.averageSize()        Taille moyenne des exports

💾 INDEXEDDB
  debugPhase9.openDB()             Ouvrir IndexedDB dans DevTools
  debugPhase9.checkHealth()        Vérifier santé de la DB

❓ AIDE
  debugPhase9.help()               Afficher cette aide

🌱 SEED DATA
  debugPhase9.seedMockExports(n)   Créer N exports de test
    `);
  },

  /**
   * Statistiques globales
   */
  async stats() {
    try {
      const stats = await getExportStats();
      console.log('📊 Statistiques des exports:');
      console.table(stats);
      return stats;
    } catch (error) {
      console.error('❌ Erreur stats:', error);
    }
  },

  /**
   * Liste tous les exports (simple)
   */
  async list() {
    try {
      const exports = await getAllExports();
      console.log(`📋 ${exports.length} exports trouvés:`);
      
      exports.forEach((exp, idx) => {
        console.log(
          `${idx + 1}. [${exp.status}] ${exp.name} (${exp.format}) - ${exp.sizeFormatted} - ${new Date(exp.createdAt).toLocaleString('fr-FR')}`
        );
      });
      
      return exports;
    } catch (error) {
      console.error('❌ Erreur list:', error);
    }
  },

  /**
   * Liste détaillée avec métadonnées
   */
  async listDetailed() {
    try {
      const exports = await getAllExports();
      console.log(`📋 ${exports.length} exports détaillés:`);
      console.table(
        exports.map(exp => ({
          ID: exp.id.substring(0, 15) + '...',
          Nom: exp.name,
          Format: exp.format,
          Scope: exp.scope,
          Taille: exp.sizeFormatted,
          Status: exp.status,
          Date: new Date(exp.createdAt).toLocaleString('fr-FR'),
        }))
      );
      return exports;
    } catch (error) {
      console.error('❌ Erreur listDetailed:', error);
    }
  },

  /**
   * Inspecter un export
   */
  async inspect(id: string) {
    try {
      const exp = await getExportById(id);
      if (!exp) {
        console.warn(`⚠️ Export ${id} introuvable`);
        return null;
      }

      console.log('🔍 Inspection de l\'export:');
      console.log({
        ...exp,
        pdfBlob: exp.pdfBlob ? `Blob(${exp.pdfBlob.size} bytes, ${exp.pdfBlob.type})` : undefined,
        jsonBlob: exp.jsonBlob ? `Blob(${exp.jsonBlob.size} bytes, ${exp.jsonBlob.type})` : undefined,
        excelBlob: exp.excelBlob ? `Blob(${exp.excelBlob.size} bytes, ${exp.excelBlob.type})` : undefined,
        zipBlob: exp.zipBlob ? `Blob(${exp.zipBlob.size} bytes, ${exp.zipBlob.type})` : undefined,
      });
      
      return exp;
    } catch (error) {
      console.error('❌ Erreur inspect:', error);
    }
  },

  /**
   * Dernier export
   */
  async latest() {
    try {
      const exports = await getAllExports();
      if (exports.length === 0) {
        console.warn('⚠️ Aucun export trouvé');
        return null;
      }

      const latest = exports[0]; // Déjà triés par date desc
      console.log('📅 Dernier export:');
      console.log(latest);
      return latest;
    } catch (error) {
      console.error('❌ Erreur latest:', error);
    }
  },

  /**
   * Supprimer un export
   */
  async delete(id: string) {
    try {
      await deleteExport(id);
      console.log(`🗑️ Export ${id} supprimé`);
      return true;
    } catch (error) {
      console.error('❌ Erreur delete:', error);
      return false;
    }
  },

  /**
   * Supprimer tous les exports
   */
  async clear() {
    const confirm = window.confirm('⚠️ Supprimer TOUS les exports ? (irréversible)');
    if (!confirm) {
      console.log('❌ Annulé');
      return false;
    }

    try {
      await clearAllExports();
      console.log('🗑️ Tous les exports supprimés');
      return true;
    } catch (error) {
      console.error('❌ Erreur clear:', error);
      return false;
    }
  },

  /**
   * Supprimer exports de plus de N jours
   */
  async clearOld(days: number = 30) {
    try {
      const exports = await getAllExports();
      const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;
      
      const oldExports = exports.filter(exp => new Date(exp.createdAt).getTime() < cutoffDate);
      
      if (oldExports.length === 0) {
        console.log(`✅ Aucun export de plus de ${days} jours`);
        return 0;
      }

      const confirm = window.confirm(`⚠️ Supprimer ${oldExports.length} exports de plus de ${days} jours ?`);
      if (!confirm) {
        console.log('❌ Annulé');
        return 0;
      }

      for (const exp of oldExports) {
        await deleteExport(exp.id);
      }

      console.log(`🗑️ ${oldExports.length} exports supprimés`);
      return oldExports.length;
    } catch (error) {
      console.error('❌ Erreur clearOld:', error);
      return 0;
    }
  },

  /**
   * Taille totale par format
   */
  async sizeByFormat() {
    try {
      const exports = await getAllExports();
      const byFormat: Record<string, { count: number; totalSize: number }> = {};

      exports.forEach(exp => {
        const format = typeof exp.format === 'string' ? exp.format : String(exp.format);
        if (!byFormat[format]) {
          byFormat[format] = { count: 0, totalSize: 0 };
        }
        byFormat[format].count++;
        byFormat[format].totalSize += exp.size;
      });

      console.log('📊 Taille par format:');
      console.table(
        Object.entries(byFormat).map(([format, stats]) => ({
          Format: format,
          Nombre: stats.count,
          TailleTotale: formatFileSize(stats.totalSize),
          TailleMoyenne: formatFileSize(stats.totalSize / stats.count),
        }))
      );

      return byFormat;
    } catch (error) {
      console.error('❌ Erreur sizeByFormat:', error);
    }
  },

  /**
   * Nombre par statut
   */
  async countByStatus() {
    try {
      const exports = await getAllExports();
      const byStatus: Record<string, number> = {};

      exports.forEach(exp => {
        byStatus[exp.status] = (byStatus[exp.status] || 0) + 1;
      });

      console.log('📊 Nombre par statut:');
      console.table(byStatus);
      return byStatus;
    } catch (error) {
      console.error('❌ Erreur countByStatus:', error);
    }
  },

  /**
   * Taille moyenne
   */
  async averageSize() {
    try {
      const exports = await getAllExports();
      if (exports.length === 0) {
        console.log('⚠️ Aucun export');
        return 0;
      }

      const totalSize = exports.reduce((sum, exp) => sum + exp.size, 0);
      const avg = totalSize / exports.length;

      console.log(`📊 Taille moyenne: ${formatFileSize(avg)}`);
      console.log(`   Total: ${formatFileSize(totalSize)} sur ${exports.length} exports`);

      return avg;
    } catch (error) {
      console.error('❌ Erreur averageSize:', error);
    }
  },

  /**
   * Ouvrir IndexedDB dans DevTools
   */
  openDB() {
    console.log(`
📂 Pour inspecter IndexedDB:
1. Ouvrir DevTools (F12)
2. Onglet "Application" (ou "Storage")
3. IndexedDB → solvid-export-history → exports

Ou utiliser: chrome://indexeddb-internals/
    `);
  },

  /**
   * Vérifier santé de la DB
   */
  async checkHealth() {
    try {
      console.log('🔍 Vérification santé IndexedDB...');

      const exports = await getAllExports();
      const stats = await getExportStats();

      const health = {
        totalExports: exports.length,
        totalSize: formatFileSize(stats.totalSize),
        completed: stats.completed,
        failed: stats.failed,
        generating: stats.generating,
        hasBlobs: exports.filter(exp => exp.pdfBlob || exp.jsonBlob || exp.excelBlob || exp.zipBlob).length,
        missingBlobs: exports.filter(exp => !exp.pdfBlob && !exp.jsonBlob && !exp.excelBlob && !exp.zipBlob).length,
      };

      console.log('✅ Santé IndexedDB:');
      console.table(health);

      if (health.missingBlobs > 0) {
        console.warn(`⚠️ ${health.missingBlobs} exports sans blobs (corrompus ?)`);
      }

      return health;
    } catch (error) {
      console.error('❌ Erreur checkHealth:', error);
    }
  },

  /**
   * Seed mock exports
   */
  async seedMockExports(count: number = 5) {
    console.log(`🌱 Création de ${count} exports de test...`);
    
    const { addExportToHistory, generateExportId, formatFileSize } = await import('@/services/exportHistoryService');
    
    const formats: ('pdf' | 'json' | 'excel' | 'all')[] = ['pdf', 'json', 'excel', 'all'];
    const scopes = ['Indicateurs uniquement', 'Audit Trail uniquement', 'Complet'];
    const statuses: ('completed' | 'generating' | 'error')[] = ['completed', 'completed', 'completed', 'error'];

    for (let i = 0; i < count; i++) {
      const format = formats[Math.floor(Math.random() * formats.length)];
      const scope = scopes[Math.floor(Math.random() * scopes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const size = Math.floor(Math.random() * 20 * 1024 * 1024); // 0-20 MB

      const mockExport = {
        id: generateExportId(),
        name: `Export_Test_${i + 1}`,
        format,
        scope,
        size,
        sizeFormatted: formatFileSize(size),
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        status,
        options: {
          includeTransparency: true,
          includeAuditTrail: true,
          includeEvidences: Math.random() > 0.5,
          includeCalculations: Math.random() > 0.5,
        },
      };

      await addExportToHistory(mockExport as any);
    }

    console.log(`✅ ${count} exports de test créés`);
    return count;
  },
};

// ============================================================================
// UTILITIES
// ============================================================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ============================================================================
// EXPORT GLOBAL (pour console)
// ============================================================================

if (typeof window !== 'undefined') {
  (window as any).debugPhase9 = debugPhase9;
}
