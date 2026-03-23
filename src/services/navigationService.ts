/**
 * NAVIGATION SERVICE - Résolution navigation depuis notifications
 * 
 * Gère la navigation vers les entités liées aux notifications :
 * - Pack (pack-view)
 * - Dossier (detail-dossier)
 * - Export (exports historique)
 * - Task (checklist)
 * - KPI (indicateurs + highlight)
 * 
 * Mode local-first : fallback vers dashboard si cible introuvable
 */

import { Notification } from './dataProvider';

export type ViewType = 
  | "dashboard" 
  | "dossiers"
  | "creation-dossier"
  | "detail-dossier"
  | "import"
  | "kpis"
  | "evidence-vault"
  | "checklist-workflow"
  | "exports-livrables"
  | "packs"
  | "pack-selector"
  | "pack-view"
  | "audit-center"
  | "audit-trail"
  | "parametres";

export interface NavigationTarget {
  view: ViewType;
  packId?: string;
  dossierId?: string;
  highlightId?: string; // Pour highlight KPI/task/export
  scrollTo?: string; // Scroll vers section
  message?: string; // Message à afficher après navigation
}

/**
 * Résout la cible de navigation depuis une notification
 * 
 * @param notification - Notification cliquée
 * @returns NavigationTarget ou null si pas de cible
 */
export function resolveNotificationTarget(notification: Notification): NavigationTarget | null {

  // Règle 1 : Pack ID présent -> Pack View
  if (notification.packId) {
    return {
      view: 'pack-view',
      packId: notification.packId,
      message: getNavigationMessage(notification.type),
    };
  }

  // Règle 2 : Type-based routing
  switch (notification.type) {
    case 'pack_submitted':
    case 'pack_approved':
    case 'pack_rejected':
    case 'changes_requested':
      // Devrait avoir packId, mais fallback vers audit-center si AUDITOR
      return {
        view: 'audit-center',
        message: 'Consultez les packs en attente de revue',
      };

    case 'export_generated':
      return {
        view: 'exports-livrables',
        message: 'Votre export est disponible dans l\'historique',
      };

    case 'import_completed':
      return {
        view: 'kpis',
        message: 'Consultez les indicateurs mis à jour',
      };

    case 'task_assigned':
      return {
        view: 'checklist-workflow',
        message: 'Nouvelle tâche assignée',
      };

    case 'evidence_uploaded':
      return {
        view: 'evidence-vault',
        message: 'Nouvelle preuve uploadée',
      };

    case 'comment_added':
    case 'mention':
      // Si packId présent, va au pack, sinon dashboard
      if (notification.packId) {
        return {
          view: 'pack-view',
          packId: notification.packId,
        };
      }
      return {
        view: 'dashboard',
        message: 'Consultez vos notifications récentes',
      };

    default:
      console.warn('⚠️ Unknown notification type:', notification.type);
      return null;
  }
}

/**
 * Génère un message contextuel selon le type de notification
 */
function getNavigationMessage(type: Notification['type']): string {
  const messages: Record<Notification['type'], string> = {
    pack_submitted: 'Pack soumis pour revue',
    pack_approved: 'Pack approuvé',
    pack_rejected: 'Pack rejeté',
    changes_requested: 'Changements demandés sur le pack',
    comment_added: 'Nouveau commentaire',
    evidence_uploaded: 'Nouvelle preuve ajoutée',
    import_completed: 'Import complété',
    export_generated: 'Export généré',
    task_assigned: 'Tâche assignée',
    mention: 'Vous avez été mentionné',
  };

  return messages[type] || 'Notification';
}

/**
 * Vérifie si une entité existe (optionnel, pour éviter navigation vers 404)
 * En mode local, on fait confiance aux notifications créées
 */
export async function validateNavigationTarget(target: NavigationTarget): Promise<boolean> {
  // TODO (P2) : Vérifier existence packId/dossierId dans IndexedDB
  // Pour P1, on fait confiance (notifications créées par le système)
  return true;
}
