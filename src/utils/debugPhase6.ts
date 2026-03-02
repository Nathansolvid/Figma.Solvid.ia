import { apiClient } from '@/services/api';

/**
 * Debug utilities for Phase 6
 * Available globally via window.debugPhase6
 */

export const debugPhase6 = {
  /**
   * Test all Phase 6 API endpoints
   */
  async testAllEndpoints() {
    console.log('🧪 Testing all Phase 6 API endpoints...\n');
    
    const results: any = {
      transparency: {},
      auditTrail: {},
    };

    // Test Transparency endpoints
    console.log('📊 Testing Transparency endpoints...');
    
    try {
      const profile = await apiClient.getCalculationProfile('ind-001');
      results.transparency.getProfile = profile ? '✅ OK' : '❌ Failed';
      console.log('  getCalculationProfile:', results.transparency.getProfile);
    } catch (e: any) {
      results.transparency.getProfile = `❌ Error: ${e.message}`;
      console.log('  getCalculationProfile:', results.transparency.getProfile);
    }

    try {
      const summary = await apiClient.getCalculationSummary('ind-001');
      results.transparency.getSummary = summary ? '✅ OK' : '❌ Failed';
      console.log('  getCalculationSummary:', results.transparency.getSummary);
    } catch (e: any) {
      results.transparency.getSummary = `❌ Error: ${e.message}`;
      console.log('  getCalculationSummary:', results.transparency.getSummary);
    }

    try {
      const warnings = await apiClient.getCalculationWarnings('ind-001');
      results.transparency.getWarnings = warnings ? '✅ OK' : '❌ Failed';
      console.log('  getCalculationWarnings:', results.transparency.getWarnings);
    } catch (e: any) {
      results.transparency.getWarnings = `❌ Error: ${e.message}`;
      console.log('  getCalculationWarnings:', results.transparency.getWarnings);
    }

    // Test Audit Trail endpoints
    console.log('\n📝 Testing Audit Trail endpoints...');
    
    try {
      const indicatorTrail = await apiClient.getIndicatorAuditTrail('ind-001');
      results.auditTrail.getIndicatorTrail = indicatorTrail ? '✅ OK' : '❌ Failed';
      console.log('  getIndicatorAuditTrail:', results.auditTrail.getIndicatorTrail);
    } catch (e: any) {
      results.auditTrail.getIndicatorTrail = `❌ Error: ${e.message}`;
      console.log('  getIndicatorAuditTrail:', results.auditTrail.getIndicatorTrail);
    }

    try {
      const orgTrail = await apiClient.getOrganizationAuditTrail({ limit: 10 });
      results.auditTrail.getOrgTrail = orgTrail ? '✅ OK' : '❌ Failed';
      console.log('  getOrganizationAuditTrail:', results.auditTrail.getOrgTrail);
    } catch (e: any) {
      results.auditTrail.getOrgTrail = `❌ Error: ${e.message}`;
      console.log('  getOrganizationAuditTrail:', results.auditTrail.getOrgTrail);
    }

    try {
      const stats = await apiClient.getAuditStatistics();
      results.auditTrail.getStats = stats ? '✅ OK' : '❌ Failed';
      console.log('  getAuditStatistics:', results.auditTrail.getStats);
    } catch (e: any) {
      results.auditTrail.getStats = `❌ Error: ${e.message}`;
      console.log('  getAuditStatistics:', results.auditTrail.getStats);
    }

    console.log('\n📊 Test Results Summary:');
    console.table(results);

    const allPassed = Object.values(results.transparency).every(r => r === '✅ OK') &&
                      Object.values(results.auditTrail).every(r => r === '✅ OK');

    if (allPassed) {
      console.log('\n✅ All endpoints working correctly!');
    } else {
      console.log('\n⚠️ Some endpoints failed. Check errors above.');
    }

    return results;
  },

  /**
   * Check if Phase 6 data exists
   */
  async checkDataExists() {
    console.log('🔍 Checking if Phase 6 data exists...\n');

    try {
      const profile = await apiClient.getCalculationProfile('ind-001');
      const auditTrail = await apiClient.getIndicatorAuditTrail('ind-001');
      
      console.log('📊 Calculation Profile:', profile.profile ? '✅ Exists' : '❌ Not found');
      console.log('📝 Audit Trail entries:', auditTrail.entries?.length || 0);

      if (!profile.profile || !auditTrail.entries?.length) {
        console.log('\n💡 Tip: Run seedPhase6Data() to create test data');
        return false;
      }

      console.log('\n✅ Phase 6 data exists and is ready!');
      return true;
    } catch (error: any) {
      console.error('❌ Error checking data:', error.message);
      console.log('\n💡 Tip: Make sure you are logged in and backend is running');
      return false;
    }
  },

  /**
   * Get detailed info about an indicator's calculation
   */
  async inspectIndicator(indicatorId: string) {
    console.log(`🔬 Inspecting indicator: ${indicatorId}\n`);

    try {
      const profile = await apiClient.getCalculationProfile(indicatorId);
      const summary = await apiClient.getCalculationSummary(indicatorId);
      const warnings = await apiClient.getCalculationWarnings(indicatorId);
      const auditTrail = await apiClient.getIndicatorAuditTrail(indicatorId);

      console.log('📊 Profile:');
      console.log('  Formula:', profile.profile?.formula || 'N/A');
      console.log('  Methodology:', profile.profile?.methodology || 'N/A');
      console.log('  Status:', profile.profile?.status || 'N/A');

      console.log('\n📈 Summary:');
      console.log('  Total inputs:', summary.summary?.totalInputs || 0);
      console.log('  Total factors:', summary.summary?.totalFactors || 0);
      console.log('  Result:', summary.summary?.result || 0, summary.summary?.unit || '');
      console.log('  Confidence:', summary.summary?.confidence || 'N/A');

      console.log('\n⚠️ Warnings:', warnings.warnings?.length || 0);
      if (warnings.warnings?.length) {
        warnings.warnings.forEach((w: any) => {
          console.log(`  - [${w.severity}] ${w.message}`);
        });
      }

      console.log('\n📝 Audit Trail:', auditTrail.entries?.length || 0, 'entries');
      if (auditTrail.entries?.length) {
        console.log('  Recent actions:');
        auditTrail.entries.slice(0, 5).forEach((e: any) => {
          console.log(`  - ${e.action} by ${e.user} (${e.timestamp})`);
        });
      }

      return {
        profile: profile.profile,
        summary: summary.summary,
        warnings: warnings.warnings,
        auditTrail: auditTrail.entries,
      };
    } catch (error: any) {
      console.error('❌ Error inspecting indicator:', error.message);
      return null;
    }
  },

  /**
   * Get organization audit statistics
   */
  async getOrgStats() {
    console.log('📊 Getting organization audit statistics...\n');

    try {
      const stats = await apiClient.getAuditStatistics();
      
      console.log('📈 Total entries:', stats.statistics?.totalEntries || 0);
      
      console.log('\n📝 By Action:');
      Object.entries(stats.statistics?.entriesByAction || {}).forEach(([action, count]) => {
        console.log(`  ${action}: ${count}`);
      });

      console.log('\n📦 By Entity Type:');
      Object.entries(stats.statistics?.entriesByEntityType || {}).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });

      console.log('\n👥 Top Users:');
      (stats.statistics?.entriesByUser || []).slice(0, 5).forEach((user: any, i: number) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
        console.log(`  ${medal} ${user.userName}: ${user.count}`);
      });

      console.log('\n🔥 Most Active Entities:');
      (stats.statistics?.mostActiveEntities || []).slice(0, 5).forEach((entity: any) => {
        console.log(`  ${entity.entityName} (${entity.entityType}): ${entity.count}`);
      });

      return stats.statistics;
    } catch (error: any) {
      console.error('❌ Error getting statistics:', error.message);
      return null;
    }
  },

  /**
   * Test creating an audit entry
   */
  async testCreateAuditEntry() {
    console.log('🧪 Testing audit entry creation...\n');

    try {
      const entry = {
        user: 'Test User',
        userId: 'test-user-123',
        role: 'consultant',
        action: 'update',
        entityType: 'indicator',
        entityId: 'ind-001',
        entityName: 'Test Indicator',
        field: 'value',
        oldValue: '100',
        newValue: '200',
        comment: 'Test entry created by debugPhase6',
      };

      const result = await apiClient.createAuditEntry(entry);
      
      console.log('✅ Audit entry created successfully!');
      console.log('Entry ID:', result.entry?.id);
      console.log('Timestamp:', result.entry?.timestamp);

      return result.entry;
    } catch (error: any) {
      console.error('❌ Error creating audit entry:', error.message);
      return null;
    }
  },

  /**
   * Clear all Phase 6 data (use with caution!)
   */
  async clearAllData() {
    const confirmed = confirm(
      '⚠️ WARNING: This will delete ALL Phase 6 data!\n\n' +
      'This includes:\n' +
      '- All calculation profiles\n' +
      '- All calculation inputs\n' +
      '- All audit trail entries\n\n' +
      'Are you sure you want to continue?'
    );

    if (!confirmed) {
      console.log('❌ Operation cancelled');
      return;
    }

    console.log('🗑️ Clearing all Phase 6 data...');
    console.log('⚠️ This feature is not implemented yet (KV store limitations)');
    console.log('💡 Tip: Just re-seed with seedPhase6Data() to reset data');
  },

  /**
   * Print all available debug commands
   */
  help() {
    console.log(`
📚 Phase 6 Debug Commands
═════════════════════════

🧪 Testing:
  debugPhase6.testAllEndpoints()     - Test all 19 API endpoints
  debugPhase6.checkDataExists()      - Check if Phase 6 data exists
  debugPhase6.testCreateAuditEntry() - Test creating audit entry

🔍 Inspection:
  debugPhase6.inspectIndicator('ind-001')  - Get detailed info about indicator
  debugPhase6.getOrgStats()                - Get organization statistics
  debugPhase6.diagnosePackKeys()           - 🆕 Diagnose why packs aren't loading
  debugPhase6.reassignPacks()              - 🔧 Fix organization mismatch

🌱 Data:
  seedPhase6Data()                   - Create Phase 6 test data
  debugPhase6.clearAllData()         - Clear all Phase 6 data (caution!)

📖 Help:
  debugPhase6.help()                 - Show this help message

Example usage:
  await debugPhase6.testAllEndpoints()
  await debugPhase6.inspectIndicator('ind-001')
  await debugPhase6.getOrgStats()
  await debugPhase6.diagnosePackKeys()  // 🆕 NEW
  await debugPhase6.reassignPacks()     // 🔧 FIX
    `);
  },

  /**
   * 🆕 Diagnose why packs aren't loading
   */
  async diagnosePackKeys() {
    console.log('🔍 Diagnosing pack keys issue...\n');
    
    try {
      const response = await apiClient.request('/debug/pack-keys');
      
      console.log('📊 Debug Results:', response.debug);
      console.log('\n🔍 Analysis:');
      console.log(`  - Users in database: ${response.debug.userCount}`);
      console.log(`  - Current user org: ${response.debug.firstUser?.organizationId}`);
      console.log(`  - Organizations with packs: ${response.debug.organizationsWithPacks.join(', ') || 'NONE'}`);
      console.log(`  - Total org keys: ${response.debug.allOrgKeysCount}`);
      console.log(`  - Pack-related org keys: ${response.debug.packRelatedOrgKeysCount}`);
      console.log(`  - Total pack: keys: ${response.debug.allPackKeysCount}`);
      
      if (response.debug.organizationsWithPacks.length === 0) {
        console.log('\n❌ PROBLEM: No packs found in ANY organization!');
      } else if (!response.debug.organizationsWithPacks.includes(response.debug.firstUser?.organizationId)) {
        console.log('\n❌ PROBLEM: Packs exist but for DIFFERENT organization!');
        console.log(`  Current user org: ${response.debug.firstUser?.organizationId}`);
        console.log(`  Orgs with packs: ${response.debug.organizationsWithPacks.join(', ')}`);
      } else {
        console.log('\n✅ Organization IDs match - investigating further...');
      }
      
      return response;
    } catch (error: any) {
      console.error('❌ Error diagnosing pack keys:', error.message);
      throw error;
    }
  },

  /**
   * 🔧 Reassign packs to the current user's organization
   */
  async reassignPacks() {
    console.log('🔧 Reassigning packs to the current user\'s organization...\n');
    
    try {
      const response = await apiClient.request('/debug/reassign-packs', {
        method: 'POST'
      });
      
      console.log('✅ Reassignment complete!');
      console.log(`  - ${response.message}`);
      console.log(`  - Target organization: ${response.targetOrganization?.name} (${response.targetOrganization?.id})`);
      console.log(`  - Packs: ${response.summary?.packs || 0}`);
      console.log(`  - Folders: ${response.summary?.folders || 0}`);
      console.log(`  - Indicators: ${response.summary?.indicators || 0}`);
      
      console.log('\n💡 Tip: Reload the page to see the updated data!');
      
      return response;
    } catch (error: any) {
      console.error('❌ Error reassigning packs:', error.message);
      throw error;
    }
  },

  /**
   * 🔍 Check if a specific indicator exists
   */
  async checkIndicator(indicatorId: string) {
    console.log(`🔍 Checking indicator: ${indicatorId}\n`);
    
    try {
      const response = await apiClient.request(`/debug/check-indicator/${indicatorId}`, {
        method: 'GET'
      });
      
      console.log('Indicator check result:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Error checking indicator:', error.message);
      throw error;
    }
  },

  /**
   * 📋 List all indicators in database
   */
  async listAllIndicators() {
    console.log('📋 Listing all indicators in database...\n');
    
    try {
      const response = await apiClient.request('/debug/list-all-indicators', {
        method: 'GET'
      });
      
      console.log(`📊 Total indicators: ${response.total}`);
      console.log('\n📦 By Organization:');
      response.byOrganization.forEach((org: any) => {
        console.log(`\n🏢 Organization: ${org.organizationId}`);
        console.log(`   Count: ${org.count} indicators`);
        console.log(`   First 5 indicators:`);
        org.indicators.slice(0, 5).forEach((ind: any) => {
          console.log(`     - ${ind.code}: ${ind.name} (${ind.id})`);
        });
      });
      
      return response;
    } catch (error: any) {
      console.error('❌ Error listing indicators:', error.message);
      throw error;
    }
  },
};

// Make it globally available
if (typeof window !== 'undefined') {
  (window as any).debugPhase6 = debugPhase6;
  console.log('🔧 debugPhase6 tools loaded. Type debugPhase6.help() for commands.');
}