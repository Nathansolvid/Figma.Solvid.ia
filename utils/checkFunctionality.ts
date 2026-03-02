/**
 * DIAGNOSTIC DE FONCTIONNALITÉ
 * Script pour tester toutes les fonctionnalités de l'application
 */

import { apiClient } from '@/services/api';

export async function checkAllFunctionality() {
  console.log('🔍 DIAGNOSTIC COMPLET DE FONCTIONNALITÉ\n');
  
  const results = {
    auth: false,
    packs: false,
    indicators: false,
    evidence: false,
    notifications: false,
    auditTrail: false,
    workflow: false
  };

  try {
    // 1. Test Auth
    console.log('1️⃣ Test Auth & Session...');
    const token = localStorage.getItem('accessToken');
    if (token) {
      console.log('✅ Token trouvé');
      results.auth = true;
    } else {
      console.log('⚠️ Pas de token - utilisateur non connecté');
    }

    // 2. Test Packs
    console.log('\n2️⃣ Test Packs...');
    try {
      const packs = await apiClient.getPacks();
      console.log(`✅ ${packs.length} pack(s) trouvé(s)`);
      results.packs = true;
    } catch (error) {
      console.log('❌ Erreur getPacks:', error);
    }

    // 3. Test Indicators
    console.log('\n3️⃣ Test Indicators...');
    try {
      const indicators = await apiClient.getIndicators();
      console.log(`✅ ${indicators.length} indicateur(s) trouvé(s)`);
      results.indicators = true;
    } catch (error) {
      console.log('❌ Erreur getIndicators:', error);
    }

    // 4. Test Evidence
    console.log('\n4️⃣ Test Evidence...');
    try {
      const evidence = await apiClient.getEvidence();
      console.log(`✅ ${evidence.length} preuve(s) trouvée(s)`);
      results.evidence = true;
    } catch (error) {
      console.log('❌ Erreur getEvidence:', error);
    }

    // 5. Test Notifications
    console.log('\n5️⃣ Test Notifications...');
    try {
      const userId = localStorage.getItem('userId') || 'test-user';
      const notifications = await apiClient.getNotifications(userId);
      console.log(`✅ ${notifications.notifications?.length || 0} notification(s)`);
      results.notifications = true;
    } catch (error) {
      console.log('❌ Erreur getNotifications:', error);
    }

    // 6. Test Audit Trail
    console.log('\n6️⃣ Test Audit Trail...');
    try {
      const auditTrail = await apiClient.getAuditTrail();
      console.log(`✅ ${auditTrail.length} entrée(s) audit trail`);
      results.auditTrail = true;
    } catch (error) {
      console.log('❌ Erreur getAuditTrail:', error);
    }

  } catch (error) {
    console.error('💥 Erreur globale:', error);
  }

  // Résumé
  console.log('\n📊 RÉSUMÉ:');
  console.log('='.repeat(50));
  Object.entries(results).forEach(([key, value]) => {
    console.log(`${value ? '✅' : '❌'} ${key}`);
  });
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(v => v).length;
  const percentage = Math.round((passedTests / totalTests) * 100);
  
  console.log('='.repeat(50));
  console.log(`Score: ${passedTests}/${totalTests} (${percentage}%)`);
  
  return results;
}

// Exposer globalement
if (typeof window !== 'undefined') {
  (window as any).checkFunctionality = checkAllFunctionality;
  console.log('💡 Fonction checkFunctionality() disponible dans la console');
}
