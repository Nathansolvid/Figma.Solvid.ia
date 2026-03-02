import { apiClient } from '@/services/api';

/**
 * Seed data for Phase 6: Transparency & Audit Trail
 * Creates test data for calculation profiles, inputs, and audit entries
 */
export async function seedPhase6Data() {
  console.log('🌱 Starting Phase 6 data seeding...');
  console.log('⚠️  Note: This works without authentication for demo purposes');

  try {
    // Seed Calculation Profiles for 3 indicators
    const indicators = [
      { id: 'ind-001', name: 'Émissions GES Scope 1', code: 'E1-1' },
      { id: 'ind-002', name: 'Consommation électrique', code: 'E1-2' },
      { id: 'ind-003', name: 'Turnover employés', code: 'S1-1' },
    ];

    for (const indicator of indicators) {
      console.log(`📊 Seeding data for ${indicator.name}...`);

      // Create calculation profile
      const profile = {
        id: `prof-${indicator.id}`,
        indicatorId: indicator.id,
        formula: indicator.id === 'ind-001' 
          ? 'consommation_gaz * facteur_emission_gaz + consommation_fioul * facteur_emission_fioul'
          : indicator.id === 'ind-002'
          ? 'consommation_total_kwh * facteur_emission_electricite'
          : 'nb_departs / effectif_moyen * 100',
        methodology: indicator.id === 'ind-001'
          ? 'GHG Protocol - Scope 1 - Combustion fixe'
          : indicator.id === 'ind-002'
          ? 'Protocole Bilan Carbone® ADEME'
          : 'Indicateur social - Taux de rotation',
        status: indicator.id === 'ind-001' ? 'validated' : 'draft',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      };

      // We can't directly call the API to create profiles since they're created on-the-fly
      // So we'll create them indirectly through inputs

      // Create calculation inputs
      if (indicator.id === 'ind-001') {
        // GES Scope 1 inputs
        await apiClient.addCalculationInput({
          profileId: profile.id,
          name: 'Consommation gaz naturel',
          source: 'Facture Engie Q4 2025',
          type: 'excel',
          value: 125000,
          unit: 'kWh',
          date: '2025-12-31',
          evidenceId: 'ev-001',
        });

        await apiClient.addCalculationInput({
          profileId: profile.id,
          name: 'Consommation fioul domestique',
          source: 'Relevé citerne Janvier 2026',
          type: 'manual',
          value: 3500,
          unit: 'litres',
          date: '2026-01-15',
          evidenceId: 'ev-002',
        });

        await apiClient.addCalculationInput({
          profileId: profile.id,
          name: 'Facteur émission gaz (référence)',
          source: 'Base Carbone ADEME 2024',
          type: 'api',
          value: 0.227,
          unit: 'kgCO2e/kWh',
        });
      } else if (indicator.id === 'ind-002') {
        // Électricité inputs
        await apiClient.addCalculationInput({
          profileId: profile.id,
          name: 'Consommation électrique totale',
          source: 'Factures EDF 2025',
          type: 'excel',
          value: 523000,
          unit: 'kWh',
          date: '2025-12-31',
          evidenceId: 'ev-003',
        });

        await apiClient.addCalculationInput({
          profileId: profile.id,
          name: 'Facteur émission électricité France',
          source: 'RTE 2024',
          type: 'api',
          value: 0.053,
          unit: 'kgCO2e/kWh',
        });
      } else if (indicator.id === 'ind-003') {
        // Turnover inputs
        await apiClient.addCalculationInput({
          profileId: profile.id,
          name: 'Nombre de départs',
          source: 'SIRH - Export 2025',
          type: 'excel',
          value: 25,
          unit: 'personnes',
          date: '2025-12-31',
          evidenceId: 'ev-004',
        });

        await apiClient.addCalculationInput({
          profileId: profile.id,
          name: 'Effectif moyen',
          source: 'SIRH - Moyenne annuelle',
          type: 'excel',
          value: 200,
          unit: 'personnes',
          date: '2025-12-31',
        });
      }

      console.log(`  ✅ Created ${indicator.name} calculation data`);

      // Create calculation logs
      const logs = [
        {
          id: `log-${indicator.id}-1`,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
          step: '1. Chargement des données',
          operation: 'load_inputs',
          input: { source: 'Excel', count: 2 },
          output: { status: 'success', loaded: 2 },
          status: 'success',
        },
        {
          id: `log-${indicator.id}-2`,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5000).toISOString(),
          step: '2. Validation des données',
          operation: 'validate_inputs',
          input: { rules: ['not_null', 'positive_value'] },
          output: { warnings: 0, errors: 0 },
          status: 'success',
        },
        {
          id: `log-${indicator.id}-3`,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 10000).toISOString(),
          step: '3. Application de la formule',
          operation: 'apply_formula',
          input: { formula: profile.formula },
          output: { result: indicator.id === 'ind-001' ? 2837.5 : indicator.id === 'ind-002' ? 27719 : 12.5 },
          status: 'success',
        },
        {
          id: `log-${indicator.id}-4`,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 15000).toISOString(),
          step: '4. Vérification de cohérence',
          operation: 'check_consistency',
          input: { thresholds: { min: 0, max: 100000 } },
          output: { status: 'pass' },
          status: 'success',
        },
        {
          id: `log-${indicator.id}-5`,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 20000).toISOString(),
          step: '5. Calcul terminé',
          operation: 'finalize',
          input: {},
          output: { confidence: 'high', unit: indicator.id === 'ind-003' ? '%' : 'kgCO2e' },
          status: 'success',
        },
      ];

      // Note: Logs would be stored via backend when calculations run
      console.log(`  ✅ Prepared ${logs.length} calculation logs`);
    }

    console.log('');
    console.log('📝 Seeding audit trail entries...');

    // Create audit trail entries
    const auditEntries = [
      {
        user: 'Alice Dubois',
        userId: 'user-001',
        role: 'consultant',
        action: 'create',
        entityType: 'indicator',
        entityId: 'ind-001',
        entityName: 'Émissions GES Scope 1',
        comment: 'Création de l\'indicateur E1-1',
      },
      {
        user: 'Alice Dubois',
        userId: 'user-001',
        role: 'consultant',
        action: 'evidence_added',
        entityType: 'indicator',
        entityId: 'ind-001',
        entityName: 'Émissions GES Scope 1',
        field: 'preuves',
        comment: 'Ajout facture Engie Q4 2025',
      },
      {
        user: 'Alice Dubois',
        userId: 'user-001',
        role: 'consultant',
        action: 'update',
        entityType: 'indicator',
        entityId: 'ind-001',
        entityName: 'Émissions GES Scope 1',
        field: 'value',
        oldValue: '0',
        newValue: '2837.5',
        comment: 'Calcul initial avec données Q4',
      },
      {
        user: 'Bob Martin',
        userId: 'user-002',
        role: 'client',
        action: 'update',
        entityType: 'indicator',
        entityId: 'ind-001',
        entityName: 'Émissions GES Scope 1',
        field: 'consommation_fioul',
        oldValue: '3000',
        newValue: '3500',
        comment: 'Correction après vérification citerne',
      },
      {
        user: 'Alice Dubois',
        userId: 'user-001',
        role: 'consultant',
        action: 'update',
        entityType: 'indicator',
        entityId: 'ind-001',
        entityName: 'Émissions GES Scope 1',
        field: 'value',
        oldValue: '2712.5',
        newValue: '2837.5',
        comment: 'Recalcul après correction fioul',
      },
      {
        user: 'Clara Auditeur',
        userId: 'user-003',
        role: 'auditeur',
        action: 'validate',
        entityType: 'indicator',
        entityId: 'ind-001',
        entityName: 'Émissions GES Scope 1',
        comment: 'Validation après vérification méthodologie GHG Protocol',
      },
      {
        user: 'Alice Dubois',
        userId: 'user-001',
        role: 'consultant',
        action: 'create',
        entityType: 'indicator',
        entityId: 'ind-002',
        entityName: 'Consommation électrique',
        comment: 'Création indicateur E1-2',
      },
      {
        user: 'Alice Dubois',
        userId: 'user-001',
        role: 'consultant',
        action: 'evidence_added',
        entityType: 'indicator',
        entityId: 'ind-002',
        entityName: 'Consommation électrique',
        comment: 'Ajout factures EDF 2025',
      },
      {
        user: 'Alice Dubois',
        userId: 'user-001',
        role: 'consultant',
        action: 'create',
        entityType: 'indicator',
        entityId: 'ind-003',
        entityName: 'Turnover employés',
        comment: 'Création indicateur S1-1',
      },
      {
        user: 'Bob Martin',
        userId: 'user-002',
        role: 'client',
        action: 'update',
        entityType: 'indicator',
        entityId: 'ind-003',
        entityName: 'Turnover employés',
        field: 'nb_departs',
        oldValue: '23',
        newValue: '25',
        comment: 'Ajout 2 départs fin décembre',
      },
      {
        user: 'Alice Dubois',
        userId: 'user-001',
        role: 'consultant',
        action: 'create',
        entityType: 'pack',
        entityId: 'pack-001',
        entityName: 'Pack Donneur d\'Ordre Q1 2026',
        comment: 'Création pack pour reporting client',
      },
      {
        user: 'Bob Martin',
        userId: 'user-002',
        role: 'client',
        action: 'update',
        entityType: 'pack',
        entityId: 'pack-001',
        entityName: 'Pack Donneur d\'Ordre Q1 2026',
        field: 'status',
        oldValue: 'draft',
        newValue: 'submitted',
        comment: 'Soumission pour revue',
      },
      {
        user: 'Clara Auditeur',
        userId: 'user-003',
        role: 'auditeur',
        action: 'validate',
        entityType: 'pack',
        entityId: 'pack-001',
        entityName: 'Pack Donneur d\'Ordre Q1 2026',
        comment: 'Pack validé - conforme aux exigences',
      },
    ];

    let createdCount = 0;
    for (const entry of auditEntries) {
      try {
        await apiClient.createAuditEntry(entry);
        createdCount++;
      } catch (error) {
        console.warn(`  ⚠️ Could not create audit entry:`, error.message);
      }
    }

    console.log(`  ✅ Created ${createdCount}/${auditEntries.length} audit entries`);

    console.log('');
    console.log('🎉 Phase 6 data seeding completed!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`  - ${indicators.length} calculation profiles created`);
    console.log(`  - ~${indicators.length * 2} calculation inputs created`);
    console.log(`  - ${createdCount} audit trail entries created`);
    console.log('');
    console.log('💡 You can now test Phase 6 components:');
    console.log('  1. Go to "Phase 6 Demo" in the sidebar');
    console.log('  2. Click on any indicator to see TransparencyModal');
    console.log('  3. Explore AuditTrail for timeline view');
    console.log('  4. Check AuditCenter for organization-wide audit');

    return {
      success: true,
      indicators: indicators.length,
      auditEntries: createdCount,
    };

  } catch (error) {
    console.error('❌ Error seeding Phase 6 data:', error);
    throw error;
  }
}

// Make it globally available for console use
if (typeof window !== 'undefined') {
  (window as any).seedPhase6Data = seedPhase6Data;
}