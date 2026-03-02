// ============================================================================
// AUDIT DATA - Mock Data for Phase 6 Demo
// ============================================================================
// Données d'audit mockées pour 3 indicateurs et 2 packs

import type { AuditEntry } from '@/hooks/useAuditTrail';

// ============================================================================
// MOCK AUDIT ENTRIES
// ============================================================================

export const mockAuditEntries: AuditEntry[] = [
  // ========== INDICATEUR ind-e1-1 (Émissions GES Scope 1) ==========
  {
    id: 'audit-001',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // Il y a 2 heures
    user: 'Sophie Durand',
    userId: 'user-001',
    role: 'consultant',
    action: 'validate',
    entityType: 'indicator',
    entityId: 'ind-e1-1',
    entityName: 'Émissions GES Scope 1',
    comment: 'Validation du calcul après vérification des sources',
  },
  {
    id: 'audit-002',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // Il y a 5 heures
    user: 'Marc Lefebvre',
    userId: 'user-002',
    role: 'client',
    action: 'evidence_added',
    entityType: 'indicator',
    entityId: 'ind-e1-1',
    entityName: 'Émissions GES Scope 1',
    comment: 'Ajout des factures gaz naturel Q4 2025',
    metadata: {
      evidenceType: 'pdf',
      fileName: 'factures_gaz_Q4_2025.pdf',
      fileSize: '2.4 MB',
    },
  },
  {
    id: 'audit-003',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Il y a 1 jour
    user: 'Sophie Durand',
    userId: 'user-001',
    role: 'consultant',
    action: 'update',
    entityType: 'indicator',
    entityId: 'ind-e1-1',
    entityName: 'Émissions GES Scope 1',
    field: 'value',
    oldValue: 2750.0,
    newValue: 2837.5,
    comment: 'Mise à jour après intégration des données de décembre',
  },
  {
    id: 'audit-004',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 2 jours
    user: 'Marc Lefebvre',
    userId: 'user-002',
    role: 'client',
    action: 'update',
    entityType: 'indicator',
    entityId: 'ind-e1-1',
    entityName: 'Émissions GES Scope 1',
    field: 'methodology',
    oldValue: 'Calcul basé sur consommation estimée',
    newValue: 'Calcul basé sur factures réelles',
    comment: 'Amélioration de la qualité des données',
  },
  {
    id: 'audit-005',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 3 jours
    user: 'Julie Martin',
    userId: 'user-003',
    role: 'auditeur',
    action: 'evidence_added',
    entityType: 'indicator',
    entityId: 'ind-e1-1',
    entityName: 'Émissions GES Scope 1',
    comment: 'Ajout du certificat de vérification ADEME',
    metadata: {
      evidenceType: 'pdf',
      fileName: 'certificat_ADEME_2025.pdf',
      fileSize: '850 KB',
    },
  },
  {
    id: 'audit-006',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 5 jours
    user: 'Sophie Durand',
    userId: 'user-001',
    role: 'consultant',
    action: 'update',
    entityType: 'indicator',
    entityId: 'ind-e1-1',
    entityName: 'Émissions GES Scope 1',
    field: 'formula',
    oldValue: 'Consommation × Facteur_générique',
    newValue: 'Consommation_gaz × FE_gaz + Consommation_fioul × FE_fioul',
    comment: 'Raffinement de la formule pour distinction des combustibles',
  },
  {
    id: 'audit-007',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 7 jours
    user: 'Marc Lefebvre',
    userId: 'user-002',
    role: 'client',
    action: 'create',
    entityType: 'indicator',
    entityId: 'ind-e1-1',
    entityName: 'Émissions GES Scope 1',
    comment: 'Création de l\'indicateur pour reporting CSRD 2026',
  },
  {
    id: 'audit-008',
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 10 jours
    user: 'Julie Martin',
    userId: 'user-003',
    role: 'auditeur',
    action: 'evidence_added',
    entityType: 'indicator',
    entityId: 'ind-e1-1',
    entityName: 'Émissions GES Scope 1',
    comment: 'Import des données de consommation depuis ERP',
    metadata: {
      evidenceType: 'excel',
      fileName: 'export_ERP_conso_2025.xlsx',
      fileSize: '1.2 MB',
    },
  },

  // ========== INDICATEUR ind-e1-2 (Émissions GES Scope 2) ==========
  {
    id: 'audit-101',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // Il y a 1 heure
    user: 'Sophie Durand',
    userId: 'user-001',
    role: 'consultant',
    action: 'update',
    entityType: 'indicator',
    entityId: 'ind-e1-2',
    entityName: 'Émissions GES Scope 2',
    field: 'value',
    oldValue: 120000,
    newValue: 125000,
    comment: 'Correction après intégration des données électricité',
  },
  {
    id: 'audit-102',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // Il y a 6 heures
    user: 'Marc Lefebvre',
    userId: 'user-002',
    role: 'client',
    action: 'evidence_added',
    entityType: 'indicator',
    entityId: 'ind-e1-2',
    entityName: 'Émissions GES Scope 2',
    comment: 'Ajout des factures électricité 2025',
    metadata: {
      evidenceType: 'pdf',
      fileName: 'factures_elec_2025.pdf',
      fileSize: '3.8 MB',
    },
  },
  {
    id: 'audit-103',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 2 jours
    user: 'Sophie Durand',
    userId: 'user-001',
    role: 'consultant',
    action: 'update',
    entityType: 'indicator',
    entityId: 'ind-e1-2',
    entityName: 'Émissions GES Scope 2',
    field: 'methodology',
    oldValue: 'Location-based method',
    newValue: 'Market-based method avec garanties d\'origine',
    comment: 'Changement de méthodologie conformément à la norme GHG Protocol',
  },
  {
    id: 'audit-104',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 4 jours
    user: 'Marc Lefebvre',
    userId: 'user-002',
    role: 'client',
    action: 'create',
    entityType: 'indicator',
    entityId: 'ind-e1-2',
    entityName: 'Émissions GES Scope 2',
    comment: 'Création de l\'indicateur Scope 2',
  },
  {
    id: 'audit-105',
    timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 6 jours
    user: 'Julie Martin',
    userId: 'user-003',
    role: 'auditeur',
    action: 'evidence_added',
    entityType: 'indicator',
    entityId: 'ind-e1-2',
    entityName: 'Émissions GES Scope 2',
    comment: 'Ajout du mix énergétique France 2025',
    metadata: {
      evidenceType: 'pdf',
      fileName: 'mix_energetique_RTE_2025.pdf',
      fileSize: '650 KB',
    },
  },

  // ========== INDICATEUR ind-s1-1 (Effectif total) ==========
  {
    id: 'audit-201',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // Il y a 30 minutes
    user: 'Sophie Durand',
    userId: 'user-001',
    role: 'consultant',
    action: 'validate',
    entityType: 'indicator',
    entityId: 'ind-s1-1',
    entityName: 'Effectif total',
    comment: 'Validation après contrôle des données RH',
  },
  {
    id: 'audit-202',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // Il y a 3 heures
    user: 'Marc Lefebvre',
    userId: 'user-002',
    role: 'client',
    action: 'evidence_added',
    entityType: 'indicator',
    entityId: 'ind-s1-1',
    entityName: 'Effectif total',
    comment: 'Ajout de l\'export SIRH au 31/12/2025',
    metadata: {
      evidenceType: 'excel',
      fileName: 'export_SIRH_31dec2025.xlsx',
      fileSize: '450 KB',
    },
  },
  {
    id: 'audit-203',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 1 jour
    user: 'Sophie Durand',
    userId: 'user-001',
    role: 'consultant',
    action: 'update',
    entityType: 'indicator',
    entityId: 'ind-s1-1',
    entityName: 'Effectif total',
    field: 'value',
    oldValue: 238,
    newValue: 245,
    comment: 'Mise à jour suite à 7 nouvelles embauches en décembre',
  },
  {
    id: 'audit-204',
    timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 8 jours
    user: 'Marc Lefebvre',
    userId: 'user-002',
    role: 'client',
    action: 'create',
    entityType: 'indicator',
    entityId: 'ind-s1-1',
    entityName: 'Effectif total',
    comment: 'Création de l\'indicateur effectif pour pilier Social',
  },

  // ========== PACK pack-001 (Pack Donneur d'Ordre Q1 2026) ==========
  {
    id: 'audit-301',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // Il y a 4 heures
    user: 'Sophie Durand',
    userId: 'user-001',
    role: 'consultant',
    action: 'validate',
    entityType: 'pack',
    entityId: 'pack-001',
    entityName: 'Pack Donneur d\'Ordre Q1 2026',
    comment: 'Validation complète du pack avant soumission',
  },
  {
    id: 'audit-302',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // Il y a 12 heures
    user: 'Marc Lefebvre',
    userId: 'user-002',
    role: 'client',
    action: 'evidence_added',
    entityType: 'pack',
    entityId: 'pack-001',
    entityName: 'Pack Donneur d\'Ordre Q1 2026',
    comment: 'Ajout du rapport trimestriel Q1',
    metadata: {
      evidenceType: 'pdf',
      fileName: 'rapport_Q1_2026.pdf',
      fileSize: '5.2 MB',
    },
  },
  {
    id: 'audit-303',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 3 jours
    user: 'Sophie Durand',
    userId: 'user-001',
    role: 'consultant',
    action: 'update',
    entityType: 'pack',
    entityId: 'pack-001',
    entityName: 'Pack Donneur d\'Ordre Q1 2026',
    field: 'status',
    oldValue: 'draft',
    newValue: 'in_review',
    comment: 'Passage en revue après complétion de tous les indicateurs',
  },
  {
    id: 'audit-304',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 7 jours
    user: 'Marc Lefebvre',
    userId: 'user-002',
    role: 'client',
    action: 'create',
    entityType: 'pack',
    entityId: 'pack-001',
    entityName: 'Pack Donneur d\'Ordre Q1 2026',
    comment: 'Création du pack pour le nouveau donneur d\'ordre',
  },
  {
    id: 'audit-305',
    timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 9 jours
    user: 'Julie Martin',
    userId: 'user-003',
    role: 'auditeur',
    action: 'evidence_added',
    entityType: 'pack',
    entityId: 'pack-001',
    entityName: 'Pack Donneur d\'Ordre Q1 2026',
    comment: 'Ajout du questionnaire complété',
    metadata: {
      evidenceType: 'excel',
      fileName: 'questionnaire_DO_Q1_2026.xlsx',
      fileSize: '280 KB',
    },
  },

  // ========== PACK pack-002 (Pack Banque Annuel 2025) ==========
  {
    id: 'audit-401',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // Il y a 2 heures
    user: 'Marc Lefebvre',
    userId: 'user-002',
    role: 'client',
    action: 'evidence_added',
    entityType: 'pack',
    entityId: 'pack-002',
    entityName: 'Pack Banque Annuel 2025',
    comment: 'Ajout des états financiers audités 2025',
    metadata: {
      evidenceType: 'pdf',
      fileName: 'etats_financiers_2025.pdf',
      fileSize: '8.7 MB',
    },
  },
  {
    id: 'audit-402',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 1 jour
    user: 'Sophie Durand',
    userId: 'user-001',
    role: 'consultant',
    action: 'update',
    entityType: 'pack',
    entityId: 'pack-002',
    entityName: 'Pack Banque Annuel 2025',
    field: 'completion',
    oldValue: 75,
    newValue: 85,
    comment: 'Progression : 12 indicateurs sur 15 complétés',
  },
  {
    id: 'audit-403',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 5 jours
    user: 'Marc Lefebvre',
    userId: 'user-002',
    role: 'client',
    action: 'create',
    entityType: 'pack',
    entityId: 'pack-002',
    entityName: 'Pack Banque Annuel 2025',
    comment: 'Création du pack pour le reporting bancaire annuel',
  },
  {
    id: 'audit-404',
    timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 8 jours
    user: 'Julie Martin',
    userId: 'user-003',
    role: 'auditeur',
    action: 'evidence_added',
    entityType: 'pack',
    entityId: 'pack-002',
    entityName: 'Pack Banque Annuel 2025',
    comment: 'Ajout de l\'attestation de conformité',
    metadata: {
      evidenceType: 'pdf',
      fileName: 'attestation_conformite_2025.pdf',
      fileSize: '1.1 MB',
    },
  },
];

// Helper: Get audit entries by indicator ID
export function getAuditEntriesByIndicator(indicatorId: string): AuditEntry[] {
  return mockAuditEntries
    .filter(entry => entry.entityId === indicatorId && entry.entityType === 'indicator')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Helper: Get audit entries by pack ID
export function getAuditEntriesByPack(packId: string): AuditEntry[] {
  return mockAuditEntries
    .filter(entry => entry.entityId === packId && entry.entityType === 'pack')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Helper: Get all audit entries for organization
export function getAllAuditEntries(): AuditEntry[] {
  return mockAuditEntries
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
