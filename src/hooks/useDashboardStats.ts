/**
 * Hook for loading real dashboard statistics from IndexedDB
 * Replaces mock data with real pack/indicator data
 * 🆕 Auto-refreshes when component mounts OR when refreshKey changes
 */

import { useState, useEffect } from 'react';
import { dataProvider } from '@/services/dataProvider';

export interface DashboardStats {
  total: number;
  missing: number;
  inProgress: number;
  provided: number;
  needsReview: number;
  accepted: number;
  rejected: number;
  loading: boolean;
}

export interface CategoryCompletion {
  category: 'E' | 'S' | 'G';
  name: string;
  completed: number;
  total: number;
  percentage: number;
}

// 🆕 Add optional refreshKey parameter to force reloads
export function useDashboardStats(refreshKey?: any) {
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    missing: 0,
    inProgress: 0,
    provided: 0,
    needsReview: 0,
    accepted: 0,
    rejected: 0,
    loading: true,
  });

  const [categoryStats, setCategoryStats] = useState<CategoryCompletion[]>([
    { category: 'E', name: 'Environnement', completed: 0, total: 0, percentage: 0 },
    { category: 'S', name: 'Social', completed: 0, total: 0, percentage: 0 },
    { category: 'G', name: 'Gouvernance', completed: 0, total: 0, percentage: 0 },
  ]);

  // 🆕 Reload whenever refreshKey changes
  useEffect(() => {
    console.log('🔄 Dashboard stats hook triggered (refreshKey changed)');
    loadStats();
  }, [refreshKey]); // 🆕 Reload when refreshKey changes

  async function loadStats() {
    try {
      console.log('📊 Loading dashboard stats from IndexedDB...');

      // 🆕 Get ALL packs (not just the first one)
      const packs = await dataProvider.store.list('pack_instances'); // ✅ Fixed: use underscore
      
      if (packs.length === 0) {
        console.log('📭 No packs found - resetting to empty state');
        setStats({
          total: 0,
          missing: 0,
          inProgress: 0,
          provided: 0,
          needsReview: 0,
          accepted: 0,
          rejected: 0,
          loading: false,
        });
        setCategoryStats([
          { category: 'E', name: 'Environnement', completed: 0, total: 0, percentage: 0 },
          { category: 'S', name: 'Social', completed: 0, total: 0, percentage: 0 },
          { category: 'G', name: 'Gouvernance', completed: 0, total: 0, percentage: 0 },
        ]);
        return;
      }

      console.log(`📦 Found ${packs.length} pack(s) - aggregating all indicators`);

      // 🆕 Load checklist items instead of indicators for accurate stats
      const checklistItems = await dataProvider.store.list('checklist_items');
      
      if (checklistItems.length === 0) {
        console.log('📭 No checklist items found - resetting to empty state');
        setStats({
          total: 0,
          missing: 0,
          inProgress: 0,
          provided: 0,
          needsReview: 0,
          accepted: 0,
          rejected: 0,
          loading: false,
        });
        setCategoryStats([
          { category: 'E', name: 'Environnement', completed: 0, total: 0, percentage: 0 },
          { category: 'S', name: 'Social', completed: 0, total: 0, percentage: 0 },
          { category: 'G', name: 'Gouvernance', completed: 0, total: 0, percentage: 0 },
        ]);
        return;
      }

      console.log(`📊 Found ${checklistItems.length} checklist items across ${packs.length} pack(s)`);

      // 🔍 DEBUG: Log all checklist items with their status
      console.log('🔍 DEBUG: All checklist items by status:');
      checklistItems.forEach(item => {
        console.log(`  - ${item.code} (${item.category}): ${item.status}`);
      });

      // Count by status (mapping from uppercase statuses to lowercase)
      const statusCounts = {
        total: checklistItems.length,
        missing: checklistItems.filter(i => i.status === 'MISSING').length,
        inProgress: checklistItems.filter(i => i.status === 'IN_PROGRESS').length,
        provided: checklistItems.filter(i => i.status === 'PROVIDED').length,
        needsReview: checklistItems.filter(i => i.status === 'NEEDS_REVIEW').length,
        accepted: checklistItems.filter(i => i.status === 'ACCEPTED').length,
        rejected: checklistItems.filter(i => i.status === 'REJECTED').length,
        loading: false,
      };

      setStats(statusCounts);

      // Calculate category stats using checklist items
      const categories: Array<'E' | 'S' | 'G'> = ['E', 'S', 'G'];
      const categoryNames = {
        E: 'Environnement',
        S: 'Social',
        G: 'Gouvernance',
      };

      const categoryData = categories.map(category => {
        const categoryItems = checklistItems.filter(i => i.category === category);
        const completed = categoryItems.filter(i => 
          i.status === 'PROVIDED' || i.status === 'ACCEPTED'
        ).length;
        const total = categoryItems.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          category,
          name: categoryNames[category],
          completed,
          total,
          percentage,
        };
      });

      setCategoryStats(categoryData);

      console.log('✅ Dashboard stats loaded:', {
        totalPacks: packs.length,
        totalChecklistItems: checklistItems.length,
        statusCounts,
        categoryData,
      });
    } catch (error) {
      console.error('❌ Failed to load dashboard stats:', error);
      // Reset to empty state on error
      setStats({
        total: 0,
        missing: 0,
        inProgress: 0,
        provided: 0,
        needsReview: 0,
        accepted: 0,
        rejected: 0,
        loading: false,
      });
      setCategoryStats([
        { category: 'E', name: 'Environnement', completed: 0, total: 0, percentage: 0 },
        { category: 'S', name: 'Social', completed: 0, total: 0, percentage: 0 },
        { category: 'G', name: 'Gouvernance', completed: 0, total: 0, percentage: 0 },
      ]);
    }
  }

  return {
    stats,
    categoryStats,
    reload: loadStats,
  };
}