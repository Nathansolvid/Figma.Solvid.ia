import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dataProvider } from '@/services/dataProvider'; // 🆕 Use dataProvider instead of apiClient
import { toast } from 'sonner';
import { packKeys } from './usePack';

interface UpdateIndicatorPayload {
  status?: string;
  comment?: string;
  value?: number;
  [key: string]: any;
}

interface MutationContext {
  previousPack: any;
  packId: string;
}

/**
 * Hook for updating indicators with optimistic updates
 * Provides instant UI feedback while backend processes the request
 */
export function useUpdateIndicator(packId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ indicatorId, updates }: { indicatorId: string; updates: UpdateIndicatorPayload }) => {
      // 🆕 Use dataProvider.store.update instead of deprecated apiClient
      const indicator = await dataProvider.store.read('indicators', indicatorId);
      if (!indicator) {
        throw new Error(`Indicator ${indicatorId} not found`);
      }

      const updatedIndicator = {
        ...indicator,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await dataProvider.store.update('indicators', updatedIndicator);
      return updatedIndicator;
    },

    // Optimistic update - runs immediately before API call
    onMutate: async ({ indicatorId, updates }) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: packKeys.full(packId) });

      // Snapshot the previous value for rollback
      const previousPack = queryClient.getQueryData(packKeys.full(packId));

      // Optimistically update the cache
      queryClient.setQueryData(packKeys.full(packId), (old: any) => {
        if (!old) return old;

        // Deep clone to avoid mutations
        const updatedPack = JSON.parse(JSON.stringify(old));

        // Find and update the indicator in the nested structure
        let indicatorFound = false;

        if (updatedPack.folders) {
          for (const folder of updatedPack.folders) {
            if (folder.indicators) {
              const indicatorIndex = folder.indicators.findIndex(
                (ind: any) => ind.id === indicatorId
              );
              if (indicatorIndex !== -1) {
                folder.indicators[indicatorIndex] = {
                  ...folder.indicators[indicatorIndex],
                  ...updates,
                  updatedAt: new Date().toISOString(),
                };
                indicatorFound = true;
                break;
              }
            }
          }
        }

        // Also update in checklistItems if present
        if (updatedPack.checklistItems) {
          const checklistIndex = updatedPack.checklistItems.findIndex(
            (item: any) => item.id === indicatorId
          );
          if (checklistIndex !== -1) {
            updatedPack.checklistItems[checklistIndex] = {
              ...updatedPack.checklistItems[checklistIndex],
              ...updates,
              updatedAt: new Date().toISOString(),
            };
          }
        }

        // Also update in kpiRequirements if present
        if (updatedPack.kpiRequirements) {
          const kpiIndex = updatedPack.kpiRequirements.findIndex(
            (item: any) => item.id === indicatorId
          );
          if (kpiIndex !== -1) {
            updatedPack.kpiRequirements[kpiIndex] = {
              ...updatedPack.kpiRequirements[kpiIndex],
              ...updates,
              updatedAt: new Date().toISOString(),
            };
          }
        }

        if (!indicatorFound) {
          console.warn(`Indicator ${indicatorId} not found in pack structure for optimistic update`);
        }

        return updatedPack;
      });

      // Return context for rollback
      return { previousPack, packId } as MutationContext;
    },

    // Rollback on error
    onError: (error: any, variables, context) => {
      if (context?.previousPack) {
        queryClient.setQueryData(packKeys.full(context.packId), context.previousPack);
      }

      console.error('Update indicator error:', error);
      toast.error('Erreur lors de la mise à jour', {
        description: error.message || 'Une erreur est survenue',
      });
    },

    // Refetch to ensure consistency with backend
    onSuccess: (data, variables, context) => {
      // Invalidate to fetch fresh data from backend
      queryClient.invalidateQueries({ queryKey: packKeys.full(packId) });
    },
  });
}

/**
 * Convenience hook for marking indicator as PROVIDED
 */
export function useMarkAsProvided(packId: string) {
  const updateMutation = useUpdateIndicator(packId);

  return {
    mutate: (indicatorId: string) => {
      updateMutation.mutate({
        indicatorId,
        updates: { status: 'PROVIDED' },
      });
    },
    isLoading: updateMutation.isPending,
    error: updateMutation.error,
  };
}

/**
 * Convenience hook for marking indicator as MISSING
 */
export function useMarkAsMissing(packId: string) {
  const updateMutation = useUpdateIndicator(packId);

  return {
    mutate: (indicatorId: string) => {
      updateMutation.mutate({
        indicatorId,
        updates: { status: 'MISSING' },
      });
    },
    isLoading: updateMutation.isPending,
    error: updateMutation.error,
  };
}

/**
 * Hook for updating indicator comment with debouncing
 */
export function useUpdateComment(packId: string) {
  const updateMutation = useUpdateIndicator(packId);

  return {
    mutate: (indicatorId: string, comment: string) => {
      updateMutation.mutate({
        indicatorId,
        updates: { comment },
      });
    },
    isLoading: updateMutation.isPending,
    error: updateMutation.error,
  };
}