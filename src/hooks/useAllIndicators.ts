/**
 * Hook for loading all indicators from all packs
 * Used by the "Indicateurs clés" view
 */

import { useState, useEffect } from 'react';
import { dataProvider, Indicator } from '@/services/dataProvider';

export function useAllIndicators() {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadIndicators();
  }, []);

  async function loadIndicators() {
    try {
      console.log('📊 Loading all indicators from IndexedDB...');
      setLoading(true);
      setError(null);

      const allIndicators = await dataProvider.store.list('indicators');
      
      console.log(`✅ Loaded ${allIndicators.length} indicators`);
      setIndicators(allIndicators);
    } catch (err) {
      console.error('❌ Failed to load indicators:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  return {
    indicators,
    loading,
    error,
    reload: loadIndicators,
  };
}
