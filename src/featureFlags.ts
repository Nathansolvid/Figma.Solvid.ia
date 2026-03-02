/**
 * FEATURE FLAGS - ESG Audit-Ready Data Room
 * 
 * Configuration des fonctionnalités activées/désactivées
 * selon le repositionnement "audit-ready" vs "CSRD + IA"
 */

export interface FeatureFlags {
  // ==================== CORE (V1) ====================
  /** Architecture en Packs (livrables) - CORE V1 */
  packs: boolean;
  
  // ==================== HIDDEN/EXPERIMENTAL ====================
  /** Assistant IA (uniquement mode Conseil) - OFF par défaut */
  aiAssistant: boolean;
  
  /** CSRD Full Coverage (ESRS exhaustif) - Supprimé */
  csrdFull: boolean;
  
  /** Dashboards ESG avancés / scoring complexe - Caché */
  advancedDash: boolean;
  
  /** Connecteurs ERP/SIRH - V2 */
  connectors: boolean;
  
  /** Module EUDR deep-tech - V2+ */
  eudrAdvanced: boolean;
  
  /** Vue multi-normes (GRI/CSRD/SFDR) - V2 */
  multiNormesView: boolean;
  
  /** Benchmarking sectoriel - V2+ */
  benchmarkingSectoriel: boolean;
  
  // ==================== V1.1 ====================
  /** Import en masse (multi-lots) - V1.1 */
  bulkImport: boolean;
  
  /** Échantillonnage simple en audit - V1.1 */
  auditSampling: boolean;
  
  /** Score de complétude 0-100 - V1.1 */
  completenessScore: boolean;
  
  // ==================== EXPERIMENTAL ====================
  /** Notifications temps réel (WebSocket) - Expérimental */
  realTimeNotifications: boolean;
  
  /** Templates de rapports personnalisables - Expérimental */
  customReportTemplates: boolean;
  
  /** Auto-mapping colonnes (ML) - Expérimental */
  autoMapping: boolean;
}

/**
 * Configuration par défaut des feature flags
 * Selon le repositionnement "ESG Audit-Ready Data Room"
 */
export const defaultFeatureFlags: FeatureFlags = {
  // CORE V1 - Activé
  packs: true,
  
  // HIDDEN/EXPERIMENTAL - Désactivé par défaut
  aiAssistant: false,           // IA OFF par défaut (voir CUT_LIST.md)
  csrdFull: false,              // CSRD exhaustif supprimé
  advancedDash: false,          // Dashboards avancés cachés
  connectors: false,            // Connecteurs ERP/SIRH V2
  eudrAdvanced: false,          // EUDR deep-tech V2+
  multiNormesView: false,       // Multi-normes V2
  benchmarkingSectoriel: false, // Benchmarking V2+
  
  // V1.1 - Pas encore implémenté
  bulkImport: false,
  auditSampling: false,
  completenessScore: true,      // Activé dès V1
  
  // EXPERIMENTAL - Désactivé
  realTimeNotifications: false,
  customReportTemplates: false,
  autoMapping: false
};

/**
 * Récupère les feature flags actuels
 * (en production, ces flags viendraient d'un service de config distant)
 * 
 * @returns Feature flags actifs
 */
export function getFeatureFlags(): FeatureFlags {
  // En production, récupérer depuis:
  // - Variable d'environnement
  // - API de configuration
  // - Service de feature flags (LaunchDarkly, Split.io, etc.)
  
  // Pour le MVP, utiliser la config par défaut
  return defaultFeatureFlags;
}

/**
 * Vérifie si une feature est activée
 * 
 * @param featureName - Nom de la feature
 * @returns true si activée
 * 
 * @example
 * ```typescript
 * if (isFeatureEnabled('aiAssistant')) {
 *   // Afficher l'assistant IA
 * }
 * ```
 */
export function isFeatureEnabled(featureName: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[featureName] === true;
}

/**
 * Vérifie si une feature est activée ET que le contexte est valide
 * (ex: IA uniquement en mode Conseil)
 * 
 * @param featureName - Nom de la feature
 * @param context - Contexte additionnel (posture, rôle, etc.)
 * @returns true si activée et contexte valide
 * 
 * @example
 * ```typescript
 * if (isFeatureEnabledWithContext('aiAssistant', { posture: 'Conseil' })) {
 *   // Afficher l'assistant IA
 * }
 * ```
 */
export function isFeatureEnabledWithContext(
  featureName: keyof FeatureFlags,
  context: { posture?: string; role?: string }
): boolean {
  const isEnabled = isFeatureEnabled(featureName);
  
  if (!isEnabled) {
    return false;
  }
  
  // Règles contextuelles spécifiques
  switch (featureName) {
    case 'aiAssistant':
      // IA uniquement en mode Conseil
      return context.posture === 'Conseil';
      
    case 'auditSampling':
      // Échantillonnage uniquement pour rôle Auditeur
      return context.role === 'AUDITOR';
      
    default:
      return true;
  }
}

/**
 * Retourne le label d'une feature
 * 
 * @param featureName - Nom de la feature
 * @returns Label en français
 */
export function getFeatureLabel(featureName: keyof FeatureFlags): string {
  const labels: Record<keyof FeatureFlags, string> = {
    packs: 'Architecture en Packs',
    aiAssistant: 'Assistant IA',
    csrdFull: 'CSRD Full Coverage',
    advancedDash: 'Dashboards Avancés',
    connectors: 'Connecteurs ERP/SIRH',
    eudrAdvanced: 'Module EUDR Avancé',
    multiNormesView: 'Vue Multi-Normes',
    benchmarkingSectoriel: 'Benchmarking Sectoriel',
    bulkImport: 'Import en Masse',
    auditSampling: 'Échantillonnage Audit',
    completenessScore: 'Score de Complétude',
    realTimeNotifications: 'Notifications Temps Réel',
    customReportTemplates: 'Templates Personnalisables',
    autoMapping: 'Auto-Mapping Colonnes'
  };
  
  return labels[featureName];
}

/**
 * Retourne la description d'une feature
 * 
 * @param featureName - Nom de la feature
 * @returns Description
 */
export function getFeatureDescription(featureName: keyof FeatureFlags): string {
  const descriptions: Record<keyof FeatureFlags, string> = {
    packs: 'Architecture modulaire orientée livrables (Donneur d\'Ordre, Banque, Pré-Audit)',
    aiAssistant: 'Assistant IA pour suggestions et synthèse (uniquement mode Conseil)',
    csrdFull: 'Couverture complète ESRS (supprimé du repositionnement)',
    advancedDash: 'Dashboards ESG avancés avec scoring sophistiqué',
    connectors: 'Connecteurs vers ERP/SIRH pour import automatique',
    eudrAdvanced: 'Module EUDR avancé (cartographie supply chain, géolocalisation)',
    multiNormesView: 'Basculer entre GRI, CSRD, SFDR dans la même interface',
    benchmarkingSectoriel: 'Comparer les performances ESG avec le secteur',
    bulkImport: 'Importer plusieurs fichiers simultanément',
    auditSampling: 'Échantillonnage statistique pour l\'audit',
    completenessScore: 'Calcul automatique du score de complétude 0-100',
    realTimeNotifications: 'Notifications instantanées via WebSocket',
    customReportTemplates: 'Créer des templates de rapports personnalisés',
    autoMapping: 'Détection automatique des colonnes Excel via ML'
  };
  
  return descriptions[featureName];
}

/**
 * Retourne le statut d'une feature (V1, V1.1, V2, Supprimé, Expérimental)
 * 
 * @param featureName - Nom de la feature
 * @returns Statut
 */
export function getFeatureStatus(featureName: keyof FeatureFlags): string {
  const statuses: Record<keyof FeatureFlags, string> = {
    packs: 'V1',
    aiAssistant: 'V1 (caché)',
    csrdFull: 'Supprimé',
    advancedDash: 'V2',
    connectors: 'V2',
    eudrAdvanced: 'V2+',
    multiNormesView: 'V2',
    benchmarkingSectoriel: 'V2+',
    bulkImport: 'V1.1',
    auditSampling: 'V1.1',
    completenessScore: 'V1',
    realTimeNotifications: 'Expérimental',
    customReportTemplates: 'Expérimental',
    autoMapping: 'Expérimental'
  };
  
  return statuses[featureName];
}

/**
 * Liste toutes les features avec leur statut
 * 
 * @returns Liste des features
 */
export function getAllFeatures(): Array<{
  name: keyof FeatureFlags;
  label: string;
  description: string;
  status: string;
  enabled: boolean;
}> {
  const flags = getFeatureFlags();
  const featureNames = Object.keys(flags) as Array<keyof FeatureFlags>;
  
  return featureNames.map(name => ({
    name,
    label: getFeatureLabel(name),
    description: getFeatureDescription(name),
    status: getFeatureStatus(name),
    enabled: flags[name]
  }));
}

// ==================== GUARDS UI ====================

/**
 * Détermine si un élément UI doit être affiché selon les feature flags
 * 
 * @param featureName - Nom de la feature
 * @param context - Contexte (posture, rôle)
 * @returns true si élément doit être affiché
 */
export function shouldShowFeature(
  featureName: keyof FeatureFlags,
  context?: { posture?: string; role?: string }
): boolean {
  if (!context) {
    return isFeatureEnabled(featureName);
  }
  
  return isFeatureEnabledWithContext(featureName, context);
}

// ==================== EXPORTS ====================

export default {
  getFeatureFlags,
  isFeatureEnabled,
  isFeatureEnabledWithContext,
  getFeatureLabel,
  getFeatureDescription,
  getFeatureStatus,
  getAllFeatures,
  shouldShowFeature
};
