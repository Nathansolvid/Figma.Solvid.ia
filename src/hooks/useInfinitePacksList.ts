/**
 * INFINITE SCROLL HOOK - Pagination optimisée pour les longues listes
 * 
 * Fonctionnalités :
 * - useInfiniteQuery pour lazy loading
 * - Virtual scrolling support
 * - Optimized performance
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

const PACKS_PER_PAGE = 20;

export function useInfinitePacksList() {
  return useInfiniteQuery({
    queryKey: ['packs', 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      console.log('📜 useInfinitePacksList - Fetching page:', pageParam);
      
      // Get all packs
      const response = await apiClient.listPacksDirect();
      const allPacks = response.packs || [];
      
      // Simulate pagination
      const start = pageParam * PACKS_PER_PAGE;
      const end = start + PACKS_PER_PAGE;
      const packs = allPacks.slice(start, end);
      
      console.log(`📜 Page ${pageParam}: ${packs.length} packs (${start}-${end} of ${allPacks.length})`);
      
      return {
        packs,
        nextCursor: end < allPacks.length ? pageParam + 1 : undefined,
        totalCount: allPacks.length,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
