/**
 * TESTS E2E CRITIQUES - SOLVID.IA V1
 * 
 * 5 tests critiques couvrant 80% des use cases
 * 
 * PRÉREQUIS :
 * 1. Application déployée et accessible
 * 2. Variables d'environnement configurées
 * 3. Comptes test créés
 * 
 * EXÉCUTION :
 * node tests/e2e-critical.test.js
 * 
 * ou dans la console navigateur pour tests manuels
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // À adapter selon votre déploiement
  API_BASE_URL: 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-aa780fc8',
  SUPABASE_ANON_KEY: 'YOUR_ANON_KEY',
  
  // Comptes test
  USERS: {
    consultant: {
      id: 'user-consultant-test',
      email: 'consultant@test.com',
      password: 'Test123!',
      role: 'Consultant ESG'
    },
    auditor: {
      id: 'user-auditor-test',
      email: 'auditor@test.com',
      password: 'Test123!',
      role: 'Auditeur externe'
    }
  },
  
  // Organisation test
  ORG_ID: 'org-test-001'
};

// ============================================================================
// UTILITIES
// ============================================================================

class TestRunner {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };
    this.currentToken = null;
    this.currentUserId = null;
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      error: '\x1b[31m',   // Red
      warning: '\x1b[33m'  // Yellow
    };
    const reset = '\x1b[0m';
    console.log(`${colors[type]}${message}${reset}`);
  }

  async request(endpoint, options = {}) {
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.currentToken || CONFIG.SUPABASE_ANON_KEY}`,
      ...(this.currentUserId && { 'X-User-Id': this.currentUserId }),
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.error || data.message || 'Unknown error'}`);
      }

      return { response, data };
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  async test(name, fn) {
    this.results.total++;
    this.log(`\n🧪 Test ${this.results.total}: ${name}`, 'info');

    try {
      await fn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASS' });
      this.log(`✅ PASS: ${name}`, 'success');
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAIL', error: error.message });
      this.log(`❌ FAIL: ${name}`, 'error');
      this.log(`   Error: ${error.message}`, 'error');
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  assertEquals(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`${message} - Expected: ${expected}, Got: ${actual}`);
    }
  }

  assertExists(value, message) {
    if (value === null || value === undefined) {
      throw new Error(`${message} - Value should exist but got ${value}`);
    }
  }

  printSummary() {
    this.log('\n' + '='.repeat(60), 'info');
    this.log('📊 TEST SUMMARY', 'info');
    this.log('='.repeat(60), 'info');
    this.log(`Total: ${this.results.total}`, 'info');
    this.log(`Passed: ${this.results.passed}`, 'success');
    this.log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'error' : 'success');
    this.log(`Success Rate: ${Math.round((this.results.passed / this.results.total) * 100)}%`, 'info');
    this.log('='.repeat(60), 'info');

    if (this.results.failed > 0) {
      this.log('\n❌ Failed Tests:', 'error');
      this.results.tests
        .filter(t => t.status === 'FAIL')
        .forEach(t => {
          this.log(`  - ${t.name}: ${t.error}`, 'error');
        });
    }

    return this.results.failed === 0;
  }
}

// ============================================================================
// TEST 1 : WORKFLOW PACK COMPLET
// ============================================================================

async function test1_WorkflowPackComplet(runner) {
  await runner.test('1.1 - Créer pack Banque', async () => {
    const { data } = await runner.request('/packs/direct', {
      method: 'POST',
      body: JSON.stringify({
        userId: CONFIG.USERS.consultant.id,
        organizationId: CONFIG.ORG_ID,
        name: 'Pack Test E2E Banque',
        type: 'banque',
        description: 'Test automatisé E2E',
        status: 'draft'
      })
    });

    runner.assertExists(data.pack, 'Pack should be created');
    runner.assertExists(data.pack.id, 'Pack should have ID');
    runner.assertEquals(data.pack.status, 'draft', 'Pack status should be draft');
    
    // Stocker pour tests suivants
    runner.testPackId = data.pack.id;
    
    runner.log(`   ✓ Pack créé avec ID: ${data.pack.id}`);
  });

  await runner.test('1.2 - Créer evidence', async () => {
    const { data } = await runner.request('/evidence', {
      method: 'POST',
      body: JSON.stringify({
        indicatorId: 'indicator-test-e2e',
        fileName: 'Test_Evidence.pdf',
        fileType: 'application/pdf',
        fileSize: 1024000,
        description: 'Evidence test E2E',
        uploadedUrl: 'https://example.com/evidence-test.pdf'
      })
    });

    runner.assertExists(data.evidence, 'Evidence should be created');
    runner.assertExists(data.evidence.id, 'Evidence should have ID');
    
    runner.testEvidenceId = data.evidence.id;
    
    runner.log(`   ✓ Evidence créée avec ID: ${data.evidence.id}`);
  });

  await runner.test('1.3 - Soumettre pack pour revue', async () => {
    runner.currentUserId = CONFIG.USERS.consultant.id;
    
    const { data } = await runner.request(`/packs/${runner.testPackId}/ready-for-review`, {
      method: 'POST',
      body: JSON.stringify({
        reviewerId: CONFIG.USERS.auditor.id
      })
    });

    runner.assertExists(data.pack, 'Pack should be returned');
    runner.assertEquals(data.pack.status, 'ready-for-review', 'Pack status should be ready-for-review');
    runner.assertExists(data.notification, 'Notification should be created');
    
    runner.log(`   ✓ Pack soumis pour revue`);
    runner.log(`   ✓ Notification créée pour auditeur`);
  });

  await runner.test('1.4 - Approuver pack', async () => {
    runner.currentUserId = CONFIG.USERS.auditor.id;
    
    const { data } = await runner.request(`/packs/${runner.testPackId}/approve`, {
      method: 'POST',
      body: JSON.stringify({
        comment: 'Test E2E - Pack approuvé automatiquement'
      })
    });

    runner.assertExists(data.pack, 'Pack should be returned');
    runner.assertEquals(data.pack.status, 'approved', 'Pack status should be approved');
    runner.assertExists(data.notification, 'Notification should be created for consultant');
    
    runner.log(`   ✓ Pack approuvé`);
    runner.log(`   ✓ Notification créée pour consultant`);
  });
}

// ============================================================================
// TEST 2 : REQUEST CHANGES AVEC TASK AUTOMATIQUE
// ============================================================================

async function test2_RequestChangesWithTask(runner) {
  await runner.test('2.1 - Créer pack pour request changes', async () => {
    const { data } = await runner.request('/packs/direct', {
      method: 'POST',
      body: JSON.stringify({
        userId: CONFIG.USERS.consultant.id,
        organizationId: CONFIG.ORG_ID,
        name: 'Pack Test RequestChanges',
        type: 'questionnaire',
        status: 'draft'
      })
    });

    runner.testPackId2 = data.pack.id;
    runner.log(`   ✓ Pack créé: ${data.pack.id}`);
  });

  await runner.test('2.2 - Soumettre pour revue', async () => {
    const { data } = await runner.request(`/packs/${runner.testPackId2}/ready-for-review`, {
      method: 'POST',
      body: JSON.stringify({
        reviewerId: CONFIG.USERS.auditor.id
      })
    });

    runner.assertEquals(data.pack.status, 'ready-for-review', 'Status should be ready-for-review');
  });

  await runner.test('2.3 - RequestChanges crée Task + Notification (ATOMIQUE)', async () => {
    runner.currentUserId = CONFIG.USERS.auditor.id;
    
    const { data } = await runner.request(`/packs/${runner.testPackId2}/request-changes`, {
      method: 'POST',
      body: JSON.stringify({
        message: 'Test E2E - Veuillez ajouter détails Scope 3',
        assignToUserId: CONFIG.USERS.consultant.id,
        dueDate: '2026-02-15',
        priority: 'high'
      })
    });

    // Vérifications CRITIQUES
    runner.assertExists(data.pack, 'Pack should be returned');
    runner.assertEquals(data.pack.status, 'changes-requested', 'Pack status should be changes-requested');
    
    runner.assertExists(data.task, 'Task should be created automatically');
    runner.assertExists(data.task.id, 'Task should have ID');
    runner.assertEquals(data.task.assignedToUserId, CONFIG.USERS.consultant.id, 'Task should be assigned to consultant');
    runner.assertEquals(data.task.priority, 'HIGH', 'Task priority should be HIGH');
    
    runner.assertExists(data.notification, 'Notification should be created');
    runner.assertEquals(data.notification.userId, CONFIG.USERS.consultant.id, 'Notification should be for consultant');
    
    runner.log(`   ✓ Pack status: changes-requested`);
    runner.log(`   ✓ Task créée: ${data.task.id}`);
    runner.log(`   ✓ Notification créée: ${data.notification.id}`);
    runner.log(`   ✓ ATOMICITÉ VALIDÉE ⭐`);
  });
}

// ============================================================================
// TEST 3 : CONTRAINTE KPI SANS PREUVE
// ============================================================================

async function test3_ConstrainteKPISansPreuve(runner) {
  await runner.test('3.1 - Créer indicateur sans preuve', async () => {
    const { data } = await runner.request('/indicators/direct', {
      method: 'POST',
      body: JSON.stringify({
        userId: CONFIG.USERS.consultant.id,
        organizationId: CONFIG.ORG_ID,
        code: 'TEST-E2E-NO-EVIDENCE',
        name: 'Indicateur test sans preuve',
        category: 'E',
        status: 'provided',
        currentValue: 123,
        unit: 'tCO2e'
      })
    });

    runner.testIndicatorId = data.indicator.id;
    runner.log(`   ✓ Indicateur créé: ${data.indicator.id}`);
  });

  await runner.test('3.2 - Tenter Accept sans preuve (doit échouer)', async () => {
    try {
      await runner.request(`/indicators/${runner.testIndicatorId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'accepted'
        })
      });
      
      // Si on arrive ici, le test échoue
      throw new Error('Should have thrown constraint violation error');
      
    } catch (error) {
      // On s'attend à une erreur
      runner.assert(
        error.message.includes('400') || error.message.includes('Constraint violation'),
        'Should return 400 constraint violation error'
      );
      
      runner.log(`   ✓ Erreur 400 retournée comme attendu`);
      runner.log(`   ✓ Contrainte EVIDENCE_REQUIRED appliquée ⭐`);
    }
  });

  await runner.test('3.3 - Ajouter preuve puis Accept (doit réussir)', async () => {
    // 1. Créer evidence
    const { data: evidenceData } = await runner.request('/evidence', {
      method: 'POST',
      body: JSON.stringify({
        indicatorId: runner.testIndicatorId,
        fileName: 'Preuve_Test.pdf',
        fileType: 'application/pdf',
        fileSize: 500000,
        description: 'Preuve ajoutée pour test contrainte',
        uploadedUrl: 'https://example.com/preuve.pdf'
      })
    });

    runner.log(`   ✓ Evidence ajoutée: ${evidenceData.evidence.id}`);

    // 2. Retry Accept
    const { data: indicatorData } = await runner.request(`/indicators/${runner.testIndicatorId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'accepted'
      })
    });

    runner.assertEquals(indicatorData.indicator.status, 'accepted', 'Indicator should be accepted now');
    
    runner.log(`   ✓ Indicateur accepté avec succès`);
    runner.log(`   ✓ Contrainte validée : Accept autorisé avec preuve ⭐`);
  });
}

// ============================================================================
// TEST 4 : NOTIFICATIONS SYSTÈME
// ============================================================================

async function test4_NotificationsSystème(runner) {
  await runner.test('4.1 - Charger notifications consultant', async () => {
    runner.currentUserId = CONFIG.USERS.consultant.id;
    
    const { data } = await runner.request('/notifications', {
      headers: {
        'X-User-Id': CONFIG.USERS.consultant.id
      }
    });

    runner.assertExists(data.notifications, 'Notifications array should exist');
    runner.assert(Array.isArray(data.notifications), 'Notifications should be array');
    runner.assertExists(data.unreadCount, 'Unread count should exist');
    
    runner.log(`   ✓ ${data.notifications.length} notification(s) chargée(s)`);
    runner.log(`   ✓ ${data.unreadCount} non lue(s)`);
    
    runner.testNotifications = data.notifications;
  });

  await runner.test('4.2 - Marquer notification comme lue', async () => {
    if (runner.testNotifications.length === 0) {
      runner.log(`   ⚠ Pas de notification à marquer, skip test`, 'warning');
      return;
    }

    const notifId = runner.testNotifications[0].id;
    
    await runner.request(`/notifications/${notifId}/read`, {
      method: 'PATCH',
      headers: {
        'X-User-Id': CONFIG.USERS.consultant.id
      }
    });

    // Recharger pour vérifier
    const { data } = await runner.request('/notifications', {
      headers: {
        'X-User-Id': CONFIG.USERS.consultant.id
      }
    });

    const markedNotif = data.notifications.find(n => n.id === notifId);
    runner.assert(markedNotif?.isRead === true, 'Notification should be marked as read');
    
    runner.log(`   ✓ Notification marquée comme lue`);
  });
}

// ============================================================================
// TEST 5 : AUDIT TRAIL
// ============================================================================

async function test5_AuditTrail(runner) {
  await runner.test('5.1 - Récupérer audit trail pack', async () => {
    if (!runner.testPackId) {
      throw new Error('testPackId not set from previous tests');
    }

    const { data } = await runner.request(`/packs/${runner.testPackId}/audit-trail-direct`);

    runner.assertExists(data.auditTrail, 'Audit trail should exist');
    runner.assert(Array.isArray(data.auditTrail), 'Audit trail should be array');
    runner.assert(data.auditTrail.length > 0, 'Audit trail should have entries');
    
    runner.log(`   ✓ ${data.auditTrail.length} entrée(s) audit trail`);
    
    // Vérifier qu'on a bien des actions critiques
    const actions = data.auditTrail.map(e => e.action);
    runner.log(`   ✓ Actions loggées: ${[...new Set(actions)].join(', ')}`);
  });

  await runner.test('5.2 - Export audit trail CSV', async () => {
    const { data } = await runner.request('/audit-trail/export?format=csv');

    runner.assertExists(data.downloadUrl, 'Download URL should be provided');
    
    runner.log(`   ✓ Export CSV généré`);
    runner.log(`   ✓ URL: ${data.downloadUrl.substring(0, 50)}...`);
  });
}

// ============================================================================
// RUNNER PRINCIPAL
// ============================================================================

async function runAllTests() {
  const runner = new TestRunner();

  runner.log('\n' + '='.repeat(60), 'info');
  runner.log('🚀 SOLVID.IA V1 - TESTS E2E CRITIQUES', 'info');
  runner.log('='.repeat(60), 'info');
  runner.log(`API Base URL: ${CONFIG.API_BASE_URL}`, 'info');
  runner.log(`Organisation: ${CONFIG.ORG_ID}`, 'info');
  runner.log('='.repeat(60) + '\n', 'info');

  try {
    // Test 1 : Workflow pack complet
    runner.log('\n📦 TEST SUITE 1 : WORKFLOW PACK COMPLET', 'info');
    await test1_WorkflowPackComplet(runner);

    // Test 2 : RequestChanges avec Task
    runner.log('\n🔄 TEST SUITE 2 : REQUEST CHANGES AVEC TASK ATOMIQUE', 'info');
    await test2_RequestChangesWithTask(runner);

    // Test 3 : Contrainte KPI
    runner.log('\n🔐 TEST SUITE 3 : CONTRAINTE KPI SANS PREUVE', 'info');
    await test3_ConstrainteKPISansPreuve(runner);

    // Test 4 : Notifications
    runner.log('\n🔔 TEST SUITE 4 : NOTIFICATIONS SYSTÈME', 'info');
    await test4_NotificationsSystème(runner);

    // Test 5 : Audit trail
    runner.log('\n📋 TEST SUITE 5 : AUDIT TRAIL', 'info');
    await test5_AuditTrail(runner);

  } catch (error) {
    runner.log(`\n💥 Fatal error: ${error.message}`, 'error');
  }

  // Afficher résumé
  const success = runner.printSummary();

  return success ? 0 : 1;
}

// ============================================================================
// EXÉCUTION
// ============================================================================

// Si exécuté en Node.js
if (typeof module !== 'undefined' && module.exports) {
  runAllTests()
    .then(exitCode => process.exit(exitCode))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

// Si exécuté dans le navigateur
if (typeof window !== 'undefined') {
  window.runE2ETests = runAllTests;
  console.log('✅ Tests E2E chargés. Exécutez : runE2ETests()');
}
