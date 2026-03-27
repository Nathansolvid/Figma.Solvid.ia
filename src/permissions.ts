/**
 * PERMISSIONS & RBAC - ESG Audit-Ready Data Room
 * 
 * Système de permissions Role-Based Access Control (RBAC)
 * pour garantir sécurité et conformité réglementaire
 */

// ==================== TYPES ====================

export enum Role {
  ADMIN = 'ADMIN',
  CLIENT_OWNER = 'CLIENT_OWNER',
  CLIENT_CONTRIBUTOR = 'CLIENT_CONTRIBUTOR',
  CONSULTANT = 'CONSULTANT',
  AUDITOR = 'AUDITOR',
  VIEWER = 'VIEWER'
}

export enum Action {
  // Dossiers
  CREATE_DOSSIER = 'CREATE_DOSSIER',
  VIEW_DOSSIER = 'VIEW_DOSSIER',
  EDIT_DOSSIER = 'EDIT_DOSSIER',
  DELETE_DOSSIER = 'DELETE_DOSSIER',
  
  // Packs
  CREATE_PACK = 'CREATE_PACK',
  EDIT_PACK = 'EDIT_PACK',
  MARK_READY_FOR_REVIEW = 'MARK_READY_FOR_REVIEW',
  APPROVE_PACK = 'APPROVE_PACK',
  REJECT_PACK = 'REJECT_PACK',
  
  // Imports
  IMPORT_DATA = 'IMPORT_DATA',
  DELETE_IMPORT = 'DELETE_IMPORT',
  
  // KPIs
  VIEW_KPI_TRANSPARENCY = 'VIEW_KPI_TRANSPARENCY',
  RECALCULATE_KPI = 'RECALCULATE_KPI',
  ACCEPT_KPI = 'ACCEPT_KPI',
  REJECT_KPI = 'REJECT_KPI',
  
  // Preuves
  UPLOAD_EVIDENCE = 'UPLOAD_EVIDENCE',
  DELETE_EVIDENCE = 'DELETE_EVIDENCE',
  VERIFY_EVIDENCE = 'VERIFY_EVIDENCE',
  
  // Audit
  VIEW_AUDIT_CENTER = 'VIEW_AUDIT_CENTER',
  REQUEST_CHANGES = 'REQUEST_CHANGES',
  
  // Exports
  GENERATE_EXPORT = 'GENERATE_EXPORT',
  SHARE_EXPORT = 'SHARE_EXPORT',
  
  // IA
  USE_AI_ASSISTANT = 'USE_AI_ASSISTANT',
}

export type Resource = {
  type: 'DOSSIER' | 'PACK' | 'KPI' | 'EVIDENCE' | 'EXPORT';
  organizationId?: string;
  ownerId?: string;
  status?: string;
};

export type PermissionContext = {
  userId: string;
  posture?: 'Conseil' | 'Pré-audit' | 'Audit externe';
  featureFlags?: Record<string, boolean>;
};

// ==================== FONCTION PRINCIPALE ====================

/**
 * Vérifie si un rôle a la permission d'effectuer une action sur une ressource
 * 
 * @param role - Rôle de l'utilisateur
 * @param action - Action demandée
 * @param resource - Ressource concernée (optionnel)
 * @param context - Contexte additionnel (userId, posture, feature flags)
 * @returns true si autorisé, false sinon
 * 
 * @example
 * ```typescript
 * if (can(user.role, Action.APPROVE_PACK, { type: 'PACK' }, { userId: user.id })) {
 *   // Autoriser l'approbation
 * }
 * ```
 */
export function can(
  role: Role,
  action: Action,
  resource?: Resource,
  context?: PermissionContext
): boolean {
  // ADMIN peut tout faire par défaut
  if (role === Role.ADMIN) {
    return true;
  }
  
  switch (action) {
    // ==================== DOSSIERS ====================
    case Action.CREATE_DOSSIER:
      return [Role.ADMIN, Role.CLIENT_OWNER, Role.CONSULTANT, Role.CLIENT_CONTRIBUTOR, Role.AUDITOR, Role.VIEWER].includes(role);
      
    case Action.VIEW_DOSSIER:
      return [Role.ADMIN, Role.CLIENT_OWNER, Role.CLIENT_CONTRIBUTOR, Role.CONSULTANT, Role.AUDITOR].includes(role);
      
    case Action.EDIT_DOSSIER:
      return [Role.ADMIN, Role.CLIENT_OWNER, Role.CONSULTANT].includes(role) ||
             (role === Role.CLIENT_CONTRIBUTOR && resource?.ownerId === context?.userId);
      
    case Action.DELETE_DOSSIER:
      return role === Role.ADMIN;
      
    // ==================== PACKS ====================
    case Action.CREATE_PACK:
      return [Role.ADMIN, Role.CLIENT_OWNER, Role.CLIENT_CONTRIBUTOR, Role.CONSULTANT].includes(role);
      
    case Action.EDIT_PACK:
      return [Role.ADMIN, Role.CLIENT_OWNER, Role.CONSULTANT].includes(role) ||
             (role === Role.CLIENT_CONTRIBUTOR && resource?.ownerId === context?.userId);
      
    case Action.MARK_READY_FOR_REVIEW:
      // Seul le consultant peut marquer Ready for Review
      return role === Role.CONSULTANT;
      
    case Action.APPROVE_PACK:
    case Action.REJECT_PACK:
      // Seul l'auditeur peut approuver/rejeter
      return role === Role.AUDITOR;
      
    // ==================== IMPORTS ====================
    case Action.IMPORT_DATA:
      return [Role.ADMIN, Role.CLIENT_OWNER, Role.CLIENT_CONTRIBUTOR, Role.CONSULTANT].includes(role);
      
    case Action.DELETE_IMPORT:
      return role === Role.ADMIN ||
             (role === Role.CONSULTANT && resource?.ownerId === context?.userId);
      
    // ==================== KPIs ====================
    case Action.VIEW_KPI_TRANSPARENCY:
      // Tout le monde sauf VIEWER peut voir la transparence des calculs
      return [Role.ADMIN, Role.CLIENT_OWNER, Role.CLIENT_CONTRIBUTOR, Role.CONSULTANT, Role.AUDITOR].includes(role);
      
    case Action.RECALCULATE_KPI:
      return [Role.ADMIN, Role.CLIENT_OWNER, Role.CONSULTANT].includes(role);
      
    case Action.ACCEPT_KPI:
    case Action.REJECT_KPI:
      // Seul l'auditeur peut accepter/rejeter un KPI
      return role === Role.AUDITOR;
      
    // ==================== PREUVES ====================
    case Action.UPLOAD_EVIDENCE:
      return [Role.ADMIN, Role.CLIENT_OWNER, Role.CLIENT_CONTRIBUTOR, Role.CONSULTANT].includes(role);
      
    case Action.DELETE_EVIDENCE:
      // Seul l'admin peut supprimer (soft delete)
      return role === Role.ADMIN;
      
    case Action.VERIFY_EVIDENCE:
      // Seul l'auditeur peut vérifier/valider une preuve
      return role === Role.AUDITOR;
      
    // ==================== AUDIT ====================
    case Action.VIEW_AUDIT_CENTER:
      // Seuls admin et auditeurs peuvent accéder à l'Audit Center
      return [Role.ADMIN, Role.AUDITOR].includes(role);
      
    case Action.REQUEST_CHANGES:
      // Seul l'auditeur peut demander des modifications
      return role === Role.AUDITOR;
      
    // ==================== EXPORTS ====================
    case Action.GENERATE_EXPORT:
      // Tout le monde sauf VIEWER peut générer des exports
      return [Role.ADMIN, Role.CLIENT_OWNER, Role.CLIENT_CONTRIBUTOR, Role.CONSULTANT, Role.AUDITOR].includes(role);
      
    case Action.SHARE_EXPORT:
      // Seuls consultant et auditeur peuvent partager avec des VIEWERS externes
      return [Role.ADMIN, Role.CONSULTANT, Role.AUDITOR].includes(role);
      
    // ==================== IA ====================
    case Action.USE_AI_ASSISTANT:
      // IA activée si feature flag + rôle autorisé
      // ADMIN a toujours accès, CONSULTANT en mode Conseil
      return context?.featureFlags?.aiAssistant === true &&
             (role === Role.ADMIN ||
              role === Role.CONSULTANT ||
              (role === Role.CLIENT_OWNER && context?.posture === 'Conseil'));
      
    default:
      // Par défaut, refuser
      return false;
  }
}

// ==================== HELPERS ====================

/**
 * Vérifie si un utilisateur appartient à la même organisation qu'une ressource
 * 
 * @param userOrgId - ID organisation de l'utilisateur
 * @param resourceOrgId - ID organisation de la ressource
 * @returns true si même organisation
 */
export function isSameOrganization(userOrgId: string, resourceOrgId: string): boolean {
  return userOrgId === resourceOrgId;
}

/**
 * Vérifie si un utilisateur est propriétaire d'une ressource
 * 
 * @param userId - ID de l'utilisateur
 * @param resourceOwnerId - ID du propriétaire de la ressource
 * @returns true si propriétaire
 */
export function isOwner(userId: string, resourceOwnerId: string): boolean {
  return userId === resourceOwnerId;
}

/**
 * Retourne le label lisible d'un rôle
 * 
 * @param role - Rôle
 * @returns Label en français
 */
export function getRoleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    [Role.ADMIN]: 'Administrateur',
    [Role.CLIENT_OWNER]: 'Directeur ESG',
    [Role.CLIENT_CONTRIBUTOR]: 'Contributeur Client',
    [Role.CONSULTANT]: 'Consultant ESG',
    [Role.AUDITOR]: 'Auditeur Externe',
    [Role.VIEWER]: 'Observateur'
  };
  
  return labels[role];
}

/**
 * Retourne la couleur badge d'un rôle (Tailwind)
 * 
 * @param role - Rôle
 * @returns Classe Tailwind
 */
export function getRoleBadgeColor(role: Role): string {
  const colors: Record<Role, string> = {
    [Role.ADMIN]: 'bg-purple-100 text-purple-800',
    [Role.CLIENT_OWNER]: 'bg-red-100 text-red-800',
    [Role.CLIENT_CONTRIBUTOR]: 'bg-blue-100 text-blue-800',
    [Role.CONSULTANT]: 'bg-green-100 text-green-800',
    [Role.AUDITOR]: 'bg-orange-100 text-orange-800',
    [Role.VIEWER]: 'bg-gray-100 text-gray-800'
  };
  
  return colors[role];
}

/**
 * Retourne la description d'un rôle
 * 
 * @param role - Rôle
 * @returns Description
 */
export function getRoleDescription(role: Role): string {
  const descriptions: Record<Role, string> = {
    [Role.ADMIN]: 'Accès complet à l\'organisation. Gestion utilisateurs et configuration.',
    [Role.CLIENT_OWNER]: 'Propriétaire client. Import données, upload preuves, édition checklist.',
    [Role.CLIENT_CONTRIBUTOR]: 'Contributeur client. Import données, upload preuves, édition checklist.',
    [Role.CONSULTANT]: 'Consultant ESG. Préparation dossiers, pré-contrôles, soumission pour revue.',
    [Role.AUDITOR]: 'Auditeur externe. Lecture seule données, approbation/rejet, demandes de preuves.',
    [Role.VIEWER]: 'Observateur externe. Accès limité aux exports partagés uniquement.'
  };
  
  return descriptions[role];
}

/**
 * Vérifie si une feature est activée
 * 
 * @param featureName - Nom de la feature
 * @returns true si activée
 */
export function isFeatureEnabled(featureName: string): boolean {
  // Feature flags par défaut
  const defaultFeatures: Record<string, boolean> = {
    'packs': true, // Packs activés par défaut
    'aiAssistant': false, // IA désactivée par défaut
    'advancedExports': true,
    'auditCenter': true,
    'cacheAnalytics': true
  };
  
  return defaultFeatures[featureName] ?? false;
}

// ==================== MATRICE DE PERMISSIONS (RÉFÉRENCE) ====================

/**
 * Matrice complète des permissions pour référence
 * Format: { action: { role: boolean } }
 */
export const PERMISSION_MATRIX = {
  [Action.CREATE_DOSSIER]: {
    [Role.ADMIN]: true,
    [Role.CLIENT_CONTRIBUTOR]: false,
    [Role.CONSULTANT]: true,
    [Role.AUDITOR]: false,
    [Role.VIEWER]: false
  },
  [Action.MARK_READY_FOR_REVIEW]: {
    [Role.ADMIN]: false,
    [Role.CLIENT_CONTRIBUTOR]: false,
    [Role.CONSULTANT]: true,
    [Role.AUDITOR]: false,
    [Role.VIEWER]: false
  },
  [Action.APPROVE_PACK]: {
    [Role.ADMIN]: true,
    [Role.CLIENT_CONTRIBUTOR]: false,
    [Role.CONSULTANT]: false,
    [Role.AUDITOR]: true,
    [Role.VIEWER]: false
  },
  [Action.USE_AI_ASSISTANT]: {
    [Role.ADMIN]: false,
    [Role.CLIENT_CONTRIBUTOR]: false,
    [Role.CONSULTANT]: true, // Uniquement si feature flag + posture Conseil
    [Role.AUDITOR]: false,
    [Role.VIEWER]: false
  },
  // ... (autres actions - voir PERMISSIONS.md pour la matrice complète)
} as const;

// ==================== GUARDS UI ====================

/**
 * Guard React pour afficher conditionnellement un élément selon les permissions
 * 
 * @example
 * ```tsx
 * <PermissionGuard role={user.role} action={Action.APPROVE_PACK}>
 *   <Button>Approuver</Button>
 * </PermissionGuard>
 * ```
 */
export function shouldShowElement(
  role: Role,
  action: Action,
  resource?: Resource,
  context?: PermissionContext
): boolean {
  return can(role, action, resource, context);
}

// ==================== AUDIT ====================

/**
 * Log une tentative d'accès refusé (pour sécurité)
 * 
 * @param userId - ID utilisateur
 * @param role - Rôle
 * @param action - Action tentée
 * @param resource - Ressource concernée
 */
export function logAccessDenied(
  userId: string,
  role: Role,
  action: Action,
  resource?: Resource
): void {
  console.warn('[PERMISSIONS] Access denied:', {
    userId,
    role,
    action,
    resource,
    timestamp: new Date().toISOString()
  });
  
  // TODO: Envoyer à un service de logging (Sentry, Datadog, etc.)
}

// ==================== EXPORTS ====================

export default {
  can,
  isSameOrganization,
  isOwner,
  getRoleLabel,
  getRoleBadgeColor,
  getRoleDescription,
  shouldShowElement,
  logAccessDenied,
  PERMISSION_MATRIX
};