/**
 * GUARDED ACTION - Wrapper RBAC pour actions sensibles
 * 
 * Applique automatiquement les permissions avec feedback UI :
 * - disabled + tooltip si non autorisé
 * - hide si mode 'hide'
 * - toast si tentative non autorisée
 * 
 * Usage :
 * <GuardedAction action={Action.DELETE_DOSSIER} resource={{ type: 'DOSSIER', ownerId }}>
 *   {({ disabled, onClick }) => (
 *     <Button disabled={disabled} onClick={onClick}>Supprimer</Button>
 *   )}
 * </GuardedAction>
 */

import React, { ReactNode, cloneElement, isValidElement } from 'react';
import { can, Action, Role, Resource } from '@/permissions';
import { useUser } from '@/contexts/UserContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';
import { toast } from 'sonner';

interface GuardedActionProps {
  /** Action à vérifier (ex: Action.DELETE_DOSSIER) */
  action: Action;
  
  /** Ressource concernée (optionnel) */
  resource?: Resource;
  
  /** Mode d'affichage si non autorisé : 'disable' (défaut) ou 'hide' */
  mode?: 'disable' | 'hide';
  
  /** Message tooltip personnalisé (défaut: "Action non autorisée pour votre rôle") */
  tooltip?: string;
  
  /** Callback si action cliquée alors que non autorisée (protection supplémentaire) */
  onDenied?: () => void;
  
  /** Children : function render prop ou élément React */
  children: ReactNode | ((props: { disabled: boolean; onClick: () => void }) => ReactNode);
}

export function GuardedAction({
  action,
  resource,
  mode = 'disable',
  tooltip = 'Action non autorisée pour votre rôle',
  onDenied,
  children,
}: GuardedActionProps) {
  const { currentUser } = useUser();

  // Vérifier permission
  const allowed = currentUser ? can(currentUser.role, action, resource) : false;

  // Handler qui protège contre l'exécution si non autorisé
  const handleClick = () => {
    if (!allowed) {
      console.warn('🚫 Action denied:', action, 'for role:', currentUser?.role);
      toast.error(tooltip);
      
      if (onDenied) {
        onDenied();
      }
      
      return;
    }
    
    // Si autorisé, ne rien faire ici (le onClick original du child sera appelé)
  };

  // Mode 'hide' : ne pas render du tout si non autorisé
  if (mode === 'hide' && !allowed) {
    return null;
  }

  // Mode 'disable' : render avec disabled + tooltip
  if (!allowed) {
    // Si children est une function render prop
    if (typeof children === 'function') {
      const childElement = children({ 
        disabled: true, 
        onClick: handleClick 
      });
      
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {childElement}
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // Si children est un élément React, le cloner avec disabled
    if (isValidElement(children)) {
      const child = children as React.ReactElement<any>;
      
      // Clone element avec disabled=true
      const clonedChild = cloneElement(child, {
        disabled: true,
        onClick: (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          handleClick();
        },
      });
      
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {clonedChild}
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // Fallback : render children tel quel
    return <>{children}</>;
  }

  // Autorisé : render normalement
  if (typeof children === 'function') {
    return <>{children({ disabled: false, onClick: handleClick })}</>;
  }

  return <>{children}</>;
}
