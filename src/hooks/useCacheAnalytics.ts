/**
 * CACHE ANALYTICS HOOK - Monitorer les performances du cache React Query
 * 
 * Fonctionnalités :
 * - Cache hit rate
 * - Query performance tracking
 * - Analytics dashboard data
 */

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export interface CacheStats {
  totalQueries: number;
  cachedQueries: number;
  staleQueries: number;
  fetchingQueries: number;
  cacheHitRate: number;
  queriesByStatus: {
    success: number;
    error: number;
    pending: number;
  };
}

export function useCacheAnalytics() {
  const queryClient = useQueryClient();
  const [stats, setStats] = useState<CacheStats>({
    totalQueries: 0,
    cachedQueries: 0,
    staleQueries: 0,
    fetchingQueries: 0,
    cacheHitRate: 0,
    queriesByStatus: {
      success: 0,
      error: 0,
      pending: 0,
    },
  });

  useEffect(() => {
    const updateStats = () => {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();

      const totalQueries = queries.length;
      const cachedQueries = queries.filter(q => q.state.data !== undefined).length;
      const staleQueries = queries.filter(q => q.isStale()).length;
      const fetchingQueries = queries.filter(q => q.state.fetchStatus === 'fetching').length;

      const queriesByStatus = {
        success: queries.filter(q => q.state.status === 'success').length,
        error: queries.filter(q => q.state.status === 'error').length,
        pending: queries.filter(q => q.state.status === 'pending').length,
      };

      const cacheHitRate = totalQueries > 0 
        ? Math.round((cachedQueries / totalQueries) * 100)
        : 0;

      setStats({
        totalQueries,
        cachedQueries,
        staleQueries,
        fetchingQueries,
        cacheHitRate,
        queriesByStatus,
      });
    };

    // Update stats immediately
    updateStats();

    // Update stats every 3 seconds
    const interval = setInterval(updateStats, 3000);

    return () => clearInterval(interval);
  }, [queryClient]);

  // Function to clear all cache
  const clearCache = () => {
    queryClient.clear();
  };

  // Function to invalidate all queries
  const invalidateAll = () => {
    queryClient.invalidateQueries();
  };

  // Get detailed query info
  const getQueryDetails = () => {
    const cache = queryClient.getQueryCache();
    return cache.getAll().map(query => ({
      queryKey: query.queryKey,
      status: query.state.status,
      dataUpdatedAt: query.state.dataUpdatedAt,
      errorUpdatedAt: query.state.errorUpdatedAt,
      isFetching: query.state.fetchStatus === 'fetching',
      isStale: query.isStale(),
    }));
  };

  return {
    stats,
    clearCache,
    invalidateAll,
    getQueryDetails,
  };
}
