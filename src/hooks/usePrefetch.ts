/**
 * PREFETCH HOOK - Prefetching intelligent pour améliorer l'UX
 * 
 * Fonctionnalités :
 * - Prefetch on hover
 * - Prefetch on route change intent
 * - Prefetch next pages
 */

import { useQueryClient } from '@tanstack/react-query';
import { packKeys } from '@/hooks/usePack';
import { apiClient } from '@/services/api';
import { useCallback } from 'react';

export function usePrefetch() {
  const queryClient = useQueryClient();

  // Prefetch a single pack on hover
  const prefetchPack = useCallback(
    async (packId: string) => {
      console.log('🔮 Prefetching pack:', packId);
      
      await queryClient.prefetchQuery({
        queryKey: packKeys.full(packId),
        queryFn: async () => {
          const response = await apiClient.getPackFullDirect(packId);
          return response.pack;
        },
        staleTime: 3 * 60 * 1000, // 3 minutes
      });
    },
    [queryClient]
  );

  // Prefetch packs list (useful before navigation to dashboard)
  const prefetchPacksList = useCallback(async () => {
    console.log('🔮 Prefetching packs list...');
    
    await queryClient.prefetchQuery({
      queryKey: packKeys.lists(),
      queryFn: async () => {
        const response = await apiClient.listPacksDirect();
        return response.packs;
      },
      staleTime: 2 * 60 * 1000,
    });
  }, [queryClient]);

  // Prefetch multiple packs (useful for list views)
  const prefetchMultiplePacks = useCallback(
    async (packIds: string[]) => {
      console.log('🔮 Prefetching multiple packs:', packIds.length);
      
      await Promise.all(
        packIds.map(id => prefetchPack(id))
      );
    },
    [prefetchPack]
  );

  return {
    prefetchPack,
    prefetchPacksList,
    prefetchMultiplePacks,
  };
}
