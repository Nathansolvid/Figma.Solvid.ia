/**
 * USE GUARDED CLICK - Hook RBAC pour handlers onClick
 * 
 * Vérifie automatiquement les permissions avant d'exécuter une action.
 * Affiche un toast si non autorisé.
 * 
 * Usage :
 * const guardedDelete = useGuardedClick(
 *   Action.DELETE_DOSSIER, 
 *   { type: 'DOSSIER', ownerId },
 *   () => deleteDossier(id)
 * );
 * 
 * <Button onClick={guardedDelete}>Supprimer</Button>
 */

import { useCallback } from 'react';
import { can, Action, Role, Resource } from '@/permissions';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';

interface UseGuardedClickOptions {
  /** Message toast personnalisé si non autorisé */
  deniedMessage?: string;
  
  /** Callback si action refusée */
  onDenied?: () => void;
  
  /** Afficher toast si refusé (défaut: true) */
  showToast?: boolean;
}

/**
 * Hook pour protéger une action onClick avec RBAC
 * 
 * @param action - Action à vérifier
 * @param resource - Ressource concernée (optionnel)
 * @param callback - Fonction à exécuter si autorisé
 * @param options - Options supplémentaires
 * @returns Handler onClick protégé
 */
export function useGuardedClick(
  action: Action,
  callback: () => void | Promise<void>,
  resource?: Resource,
  options?: UseGuardedClickOptions
): () => void {
  const { currentUser } = useUser();

  const {
    deniedMessage = 'Action non autorisée pour votre rôle',
    onDenied,
    showToast = true,
  } = options || {};

  return useCallback(() => {
    // Vérifier permission
    const allowed = currentUser ? can(currentUser.role, action, resource) : false;

    if (!allowed) {
      console.warn('🚫 Guarded click denied:', action, 'for role:', currentUser?.role);
      
      if (showToast) {
        toast.error(deniedMessage);
      }
      
      if (onDenied) {
        onDenied();
      }
      
      return;
    }

    // Exécuter callback si autorisé
    callback();
  }, [action, resource, callback, currentUser, deniedMessage, onDenied, showToast]);
}

/**
 * Hook variant qui retourne l'état autorisé + handler
 * 
 * @param action - Action à vérifier
 * @param resource - Ressource concernée (optionnel)
 * @returns { allowed: boolean, guard: (callback) => guarded handler }
 */
export function useGuarded(
  action: Action,
  resource?: Resource
): {
  allowed: boolean;
  guard: (callback: () => void | Promise<void>, options?: UseGuardedClickOptions) => () => void;
} {
  const { currentUser } = useUser();

  const allowed = currentUser ? can(currentUser.role, action, resource) : false;

  const guard = useCallback(
    (callback: () => void | Promise<void>, options?: UseGuardedClickOptions) => {
      return () => {
        if (!allowed) {
          const deniedMessage = options?.deniedMessage || 'Action non autorisée pour votre rôle';
          console.warn('🚫 Guarded action denied:', action, 'for role:', currentUser?.role);
          
          if (options?.showToast !== false) {
            toast.error(deniedMessage);
          }
          
          if (options?.onDenied) {
            options.onDenied();
          }
          
          return;
        }

        callback();
      };
    },
    [allowed, action, currentUser]
  );

  return { allowed, guard };
}
