// ============================================================================
// RBAC - Role-Based Access Control
// ============================================================================
// Système de contrôle d'accès basé sur les rôles pour Solvid.IA

export enum Role {
  CLIENT = 'CLIENT',           // Client: lecture seule, peut commenter
  CONSULTANT = 'CONSULTANT',   // Consultant: édition complète des données
  AUDITOR = 'AUDITOR',         // Auditeur: validation et rejet
  ADMIN = 'ADMIN'              // Admin: tous les droits
}

export enum Action {
  // Pack actions
  VIEW_PACK = 'VIEW_PACK',
  CREATE_PACK = 'CREATE_PACK',
  EDIT_PACK = 'EDIT_PACK',
  DELETE_PACK = 'DELETE_PACK',
  MARK_READY_FOR_REVIEW = 'MARK_READY_FOR_REVIEW',
  
  // Indicator actions
  VIEW_INDICATOR = 'VIEW_INDICATOR',
  EDIT_INDICATOR = 'EDIT_INDICATOR',
  DELETE_INDICATOR = 'DELETE_INDICATOR',
  VALIDATE_INDICATOR = 'VALIDATE_INDICATOR',
  REJECT_INDICATOR = 'REJECT_INDICATOR',
  
  // Evidence actions
  VIEW_EVIDENCE = 'VIEW_EVIDENCE',
  UPLOAD_EVIDENCE = 'UPLOAD_EVIDENCE',
  DELETE_EVIDENCE = 'DELETE_EVIDENCE',
  
  // Comment actions
  VIEW_COMMENTS = 'VIEW_COMMENTS',
  ADD_COMMENT = 'ADD_COMMENT',
  DELETE_COMMENT = 'DELETE_COMMENT',
  
  // Export actions
  EXPORT_PDF = 'EXPORT_PDF',
  EXPORT_ZIP = 'EXPORT_ZIP',
  
  // Admin actions
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_TEMPLATES = 'MANAGE_TEMPLATES',
}

// Permission matrix: définit les actions autorisées par rôle
const permissions: Record<Role, Action[]> = {
  [Role.CLIENT]: [
    Action.VIEW_PACK,
    Action.VIEW_INDICATOR,
    Action.VIEW_EVIDENCE,
    Action.VIEW_COMMENTS,
    Action.ADD_COMMENT,
    Action.EXPORT_PDF,
  ],
  [Role.CONSULTANT]: [
    Action.VIEW_PACK,
    Action.CREATE_PACK,
    Action.EDIT_PACK,
    Action.DELETE_PACK,
    Action.MARK_READY_FOR_REVIEW,
    Action.VIEW_INDICATOR,
    Action.EDIT_INDICATOR,
    Action.DELETE_INDICATOR,
    Action.VIEW_EVIDENCE,
    Action.UPLOAD_EVIDENCE,
    Action.DELETE_EVIDENCE,
    Action.VIEW_COMMENTS,
    Action.ADD_COMMENT,
    Action.DELETE_COMMENT,
    Action.EXPORT_PDF,
    Action.EXPORT_ZIP,
  ],
  [Role.AUDITOR]: [
    Action.VIEW_PACK,
    Action.VIEW_INDICATOR,
    Action.VALIDATE_INDICATOR,
    Action.REJECT_INDICATOR,
    Action.VIEW_EVIDENCE,
    Action.VIEW_COMMENTS,
    Action.ADD_COMMENT,
    Action.EXPORT_PDF,
    Action.EXPORT_ZIP,
  ],
  [Role.ADMIN]: [
    // Admin has all permissions
    ...Object.values(Action),
  ],
};

/**
 * Vérifie si un rôle a la permission d'effectuer une action
 */
export function can(role: Role, action: Action): boolean {
  return permissions[role]?.includes(action) || false;
}

/**
 * Vérifie si un rôle a au moins une des actions demandées
 */
export function canAny(role: Role, actions: Action[]): boolean {
  return actions.some(action => can(role, action));
}

/**
 * Vérifie si un rôle a toutes les actions demandées
 */
export function canAll(role: Role, actions: Action[]): boolean {
  return actions.every(action => can(role, action));
}

/**
 * Récupère toutes les permissions d'un rôle
 */
export function getPermissions(role: Role): Action[] {
  return permissions[role] || [];
}

/**
 * Vérifie si un utilisateur peut éditer une ressource en fonction de son ownership
 */
export function canEditOwned(role: Role, resourceOwnerId: string, currentUserId: string): boolean {
  // Admin peut tout éditer
  if (role === Role.ADMIN) return true;
  
  // Consultant peut éditer ses propres ressources
  if (role === Role.CONSULTANT && resourceOwnerId === currentUserId) return true;
  
  return false;
}

/**
 * Vérifie si un utilisateur peut supprimer une ressource en fonction de son ownership
 */
export function canDeleteOwned(role: Role, resourceOwnerId: string, currentUserId: string): boolean {
  // Admin peut tout supprimer
  if (role === Role.ADMIN) return true;
  
  // Consultant peut supprimer ses propres ressources
  if (role === Role.CONSULTANT && resourceOwnerId === currentUserId) return true;
  
  return false;
}

/**
 * Récupère le label d'un rôle en français
 */
export function getRoleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    [Role.CLIENT]: 'Client',
    [Role.CONSULTANT]: 'Consultant',
    [Role.AUDITOR]: 'Auditeur',
    [Role.ADMIN]: 'Administrateur',
  };
  return labels[role] || role;
}

/**
 * Récupère la couleur associée à un rôle (pour UI)
 */
export function getRoleColor(role: Role): string {
  const colors: Record<Role, string> = {
    [Role.CLIENT]: 'bg-blue-100 text-blue-800',
    [Role.CONSULTANT]: 'bg-green-100 text-green-800',
    [Role.AUDITOR]: 'bg-purple-100 text-purple-800',
    [Role.ADMIN]: 'bg-red-100 text-red-800',
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
}
