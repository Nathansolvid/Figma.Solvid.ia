/**
 * EMPTY STATE - Composant universel pour vues vides
 * 
 * Design pattern consistent pour toutes les vues :
 * - Icône grande et claire
 * - Titre + description
 * - CTA primaire (optionnel avec GuardedAction)
 * - CTA secondaire (optionnel)
 * - Tips (3 max)
 * 
 * Usage :
 * <EmptyState
 *   icon={<FolderOpen className="h-16 w-16" />}
 *   title="Aucun dossier"
 *   description="Créez votre premier dossier pour commencer."
 *   primaryAction={{ label: "Créer un dossier", onClick: handleCreate, guardAction: Action.CREATE_DOSSIER }}
 *   tips={["Un dossier regroupe plusieurs packs", "Commencez par définir l'organisation"]}
 * />
 */

import React from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { GuardedAction } from '@/app/components/GuardedAction';
import { Action } from '@/permissions';
import { Info } from 'lucide-react';

interface ActionConfig {
  label: string;
  onClick: () => void;
  guardAction?: Action; // Si fourni, wrap avec GuardedAction
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
}

interface EmptyStateProps {
  /** Icône personnalisée (ex: <FolderOpen className="h-16 w-16" />) */
  icon: React.ReactNode;
  
  /** Titre principal */
  title: string;
  
  /** Description explicative */
  description: string;
  
  /** Action primaire (optionnel, avec RBAC si guardAction fourni) */
  primaryAction?: ActionConfig;
  
  /** Action secondaire (optionnel) */
  secondaryAction?: ActionConfig;
  
  /** Tips/conseils (3 max) */
  tips?: string[];
  
  /** Style compact (moins d'espace vertical) */
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  tips,
  compact = false,
}: EmptyStateProps) {
  const renderActionButton = (action: ActionConfig, isPrimary: boolean) => {
    const buttonElement = (
      <Button
        variant={action.variant || (isPrimary ? 'default' : 'outline')}
        className={isPrimary ? 'bg-[#059669] hover:bg-[#047857]' : ''}
        onClick={action.onClick}
      >
        {action.label}
      </Button>
    );

    // Si guardAction fourni, wrap avec GuardedAction
    if (action.guardAction) {
      return (
        <GuardedAction action={action.guardAction}>
          {buttonElement}
        </GuardedAction>
      );
    }

    return buttonElement;
  };

  return (
    <Card className="border-2 border-dashed">
      <CardContent className={compact ? 'p-8' : 'p-12'}>
        <div className="flex flex-col items-center text-center space-y-4 max-w-md mx-auto">
          {/* Icon */}
          <div className="text-muted-foreground/40">
            {icon}
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-foreground">
            {title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground">
            {description}
          </p>

          {/* Actions */}
          {(primaryAction || secondaryAction) && (
            <div className="flex gap-3 mt-4">
              {primaryAction && renderActionButton(primaryAction, true)}
              {secondaryAction && renderActionButton(secondaryAction, false)}
            </div>
          )}

          {/* Tips */}
          {tips && tips.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border w-full">
              <div className="flex items-start gap-2 text-left">
                <Info className="h-4 w-4 text-[#059669] mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">Conseils :</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {tips.slice(0, 3).map((tip, index) => (
                      <li key={index}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Empty state spécialisé pour filtres sans résultats
 */
export function EmptyFilterState({
  onResetFilters,
}: {
  onResetFilters: () => void;
}) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <p className="mb-4">Aucun résultat pour ces filtres</p>
      <Button variant="outline" onClick={onResetFilters}>
        Réinitialiser les filtres
      </Button>
    </div>
  );
}
