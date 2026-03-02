/**
 * Utility pour peupler le backend avec des données de test
 * À appeler une fois après avoir créé un utilisateur
 */

import { apiClient } from '@/services/api';

export async function seedTestData() {
  try {
    console.log('🌱 Début du seed des données de test...');

    // Créer des packs de test pour chaque segment
    const packs = [
      {
        name: 'Pack Donneur d\'Ordre Q1 2024',
        type: 'donneur-ordre',
        description: 'Collecte données fournisseurs - Transport & Logistique',
        status: 'en-cours',
      },
      {
        name: 'Pack Questionnaire PME - Scope 3',
        type: 'questionnaire',
        description: 'Questionnaire simplifié pour PME industrielle',
        status: 'draft',
      },
      {
        name: 'Pack Banque Crédit ESG 2024',
        type: 'banque',
        description: 'Due diligence ESG pour financement vert',
        status: 'en-cours',
      },
      {
        name: 'Pack Pré-Audit CSRD 2025',
        type: 'pre-audit',
        description: 'Préparation audit externe double matérialité',
        status: 'draft',
      },
    ];

    const createdPacks = [];

    for (const packData of packs) {
      const { pack } = await apiClient.createPack(packData);
      createdPacks.push(pack);
      console.log(`✅ Pack créé: ${pack.name}`);

      // Créer des dossiers pour chaque pack
      const folders = [
        { category: 'Environnement', name: 'Émissions GES' },
        { category: 'Environnement', name: 'Consommation énergétique' },
        { category: 'Social', name: 'Effectifs & diversité' },
        { category: 'Gouvernance', name: 'Éthique & conformité' },
      ];

      for (const folderData of folders) {
        const { folder } = await apiClient.createFolder({
          packId: pack.id,
          ...folderData,
        });
        console.log(`  📁 Dossier créé: ${folder.name}`);

        // Créer des indicateurs pour chaque dossier
        const indicators = getIndicatorsForCategory(folder.category);
        
        for (const indicatorData of indicators) {
          await apiClient.createIndicator({
            folderId: folder.id,
            ...indicatorData,
          });
          console.log(`    📊 Indicateur créé: ${indicatorData.code}`);
        }
      }
    }

    console.log('✅ Seed terminé avec succès!');
    return { success: true, packsCount: createdPacks.length };

  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    return { success: false, error };
  }
}

function getIndicatorsForCategory(category: string) {
  const indicatorsByCategory: Record<string, any[]> = {
    Environnement: [
      {
        code: 'ENV-E-001',
        name: 'Émissions Scope 1',
        unit: 'tCO2e',
        value: 1250.5,
        status: 'validated',
        source: 'Facturation gaz naturel 2024',
        methodology: 'Base Carbone ADEME v12',
      },
      {
        code: 'ENV-E-002',
        name: 'Émissions Scope 2',
        unit: 'tCO2e',
        value: 890.2,
        status: 'pending-review',
        source: 'Factures électricité 2024',
        methodology: 'Location-based method (GHG Protocol)',
      },
      {
        code: 'ENV-E-003',
        name: 'Consommation électricité',
        unit: 'MWh',
        value: 12450,
        status: 'validated',
        source: 'EDF - Contrat entreprise',
        methodology: 'Relevés mensuels smart meter',
      },
    ],
    Social: [
      {
        code: 'SOC-S-001',
        name: 'Effectif total (ETP)',
        unit: 'ETP',
        value: 287,
        status: 'validated',
        source: 'SIRH - Export décembre 2024',
        methodology: 'Calcul prorata temporis',
      },
      {
        code: 'SOC-S-002',
        name: 'Taux de féminisation',
        unit: '%',
        value: 42.5,
        status: 'validated',
        source: 'Bilan Social 2024',
        methodology: 'Femmes / Total effectif',
      },
      {
        code: 'SOC-S-003',
        name: 'Heures de formation',
        unit: 'heures',
        value: 5680,
        status: 'pending-review',
        source: 'Plateforme LMS interne',
        methodology: 'Cumul sessions validées',
      },
    ],
    Gouvernance: [
      {
        code: 'GOV-G-001',
        name: 'Réunions Conseil Admin',
        unit: 'nombre',
        value: 6,
        status: 'validated',
        source: 'PV Conseils 2024',
        methodology: 'Comptage réunions ordinaires',
      },
      {
        code: 'GOV-G-002',
        name: 'Taux indépendance CA',
        unit: '%',
        value: 50,
        status: 'validated',
        source: 'Statuts & registre',
        methodology: 'Administrateurs indépendants / Total',
      },
    ],
  };

  return indicatorsByCategory[category] || [];
}

// Export pour utilisation dans la console
if (typeof window !== 'undefined') {
  (window as any).seedTestData = seedTestData;
}
