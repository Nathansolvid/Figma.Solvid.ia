import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { toast } from 'sonner';

// Query Keys
export const packKeys = {
  all: ['packs'] as const,
  lists: () => [...packKeys.all, 'list'] as const,
  list: (filters?: any) => [...packKeys.lists(), filters] as const,
  details: () => [...packKeys.all, 'detail'] as const,
  detail: (id: string) => [...packKeys.details(), id] as const,
  full: (id: string) => [...packKeys.all, 'full', id] as const,
};

// Hook: Get all packs
export function usePacks() {
  const result = useQuery({
    queryKey: packKeys.lists(),
    queryFn: async () => {
      console.log('📦 usePacks - Fetching packs list...');
      const response = await apiClient.listPacksDirect();
      console.log('📦 usePacks - Response:', {
        packsCount: response?.packs?.length || 0,
        packs: response?.packs || [],
      });
      return response.packs;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - packs list changes frequently
    retry: false, // Disable retry to see errors faster
  });

  console.log('📦 usePacks - Hook result:', {
    dataLength: result.data?.length || 0,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    error: result.error,
    status: result.status,
  });

  return result;
}

// Hook: Get single pack (full data with folders, indicators, evidence)
export function usePackFull(packId: string | null) {
  return useQuery({
    queryKey: packKeys.full(packId || ''),
    queryFn: async () => {
      if (!packId) throw new Error('Pack ID is required');
      try {
        const response = await apiClient.getPackFullDirect(packId);
        return response.pack;
      } catch (error: any) {
        // Si c'est une 404 (pack not found), on retourne null au lieu de throw
        if (error.message?.includes('Pack not found') || error.message?.includes('404')) {
          console.warn(`⚠️ Pack ${packId} not found, returning null`);
          return null;
        }
        // Pour les autres erreurs, on les propage
        throw error;
      }
    },
    enabled: !!packId, // Only run query if packId exists
    retry: false, // Ne pas réessayer si le pack n'existe pas
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

// Hook: Create pack
export function useCreatePack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      type: string;
      description?: string;
      status?: string;
    }) => apiClient.createPack(data),
    onSuccess: (data) => {
      // Invalidate packs list to refetch
      queryClient.invalidateQueries({ queryKey: packKeys.lists() });
      
      // Optionally add the new pack to cache immediately
      queryClient.setQueryData(packKeys.full(data.pack.id), data.pack);
      
      toast.success('Pack créé avec succès', {
        description: data.pack.name,
      });
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la création', {
        description: error.message || 'Une erreur est survenue',
      });
    },
  });
}

// Hook: Update pack
export function useUpdatePack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.updatePack(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: packKeys.full(id) });

      // Snapshot previous value
      const previousPack = queryClient.getQueryData(packKeys.full(id));

      // Optimistically update pack
      queryClient.setQueryData(packKeys.full(id), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          ...data,
          updatedAt: new Date().toISOString(),
        };
      });

      // Return context with previous value
      return { previousPack, id };
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousPack) {
        queryClient.setQueryData(packKeys.full(context.id), context.previousPack);
      }
      
      toast.error('Erreur lors de la mise à jour', {
        description: error.message || 'Une erreur est survenue',
      });
    },
    onSuccess: (data, variables) => {
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: packKeys.full(variables.id) });
      queryClient.invalidateQueries({ queryKey: packKeys.lists() });
      
      toast.success('Pack mis à jour');
    },
  });
}

// Hook: Delete pack
export function useDeletePack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deletePack(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: packKeys.full(deletedId) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: packKeys.lists() });
      
      toast.success('Pack supprimé');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression', {
        description: error.message || 'Une erreur est survenue',
      });
    },
  });
}