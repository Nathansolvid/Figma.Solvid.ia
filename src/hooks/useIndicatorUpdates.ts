import { useState, useCallback, useRef, useEffect } from 'react';
import { dataProvider } from '@/services/dataProvider'; // 🆕 Use dataProvider instead of apiClient
import { toast } from 'sonner';

interface UseIndicatorUpdatesProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  debounceMs?: number;
}

interface UpdateIndicatorPayload {
  status?: string;
  comment?: string;
  value?: number;
  [key: string]: any;
}

export function useIndicatorUpdates({
  onSuccess,
  onError,
  debounceMs = 1000,
}: UseIndicatorUpdatesProps = {}) {
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      debounceTimers.current.forEach((timer) => clearTimeout(timer));
      debounceTimers.current.clear();
    };
  }, []);

  /**
   * Update indicator immediately (no debounce)
   * Use for status changes, important updates
   */
  const updateIndicatorImmediate = useCallback(
    async (indicatorId: string, updates: UpdateIndicatorPayload) => {
      // Clear any pending debounced update for this indicator
      const existingTimer = debounceTimers.current.get(indicatorId);
      if (existingTimer) {
        clearTimeout(existingTimer);
        debounceTimers.current.delete(indicatorId);
      }

      setUpdatingIds((prev) => new Set(prev).add(indicatorId));

      try {
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

        // 🆕 Also update the corresponding checklist_item if it exists
        if (updates.status) {
          try {
            console.log('🔍 Looking for checklist_item to sync:', { code: indicator.code, packId: indicator.packId, status: updates.status });
            
            // Find the checklist item with the same code and packId
            const allChecklistItems = await dataProvider.store.list('checklist_items');
            console.log('📋 Total checklist_items in DB:', allChecklistItems.length);
            
            const checklistItem = allChecklistItems.find((item: any) => 
              item.packId === indicator.packId && item.code === indicator.code
            );
            
            if (checklistItem) {
              console.log('✅ Found matching checklist_item:', checklistItem.id);
              const updatedChecklistItem = {
                ...checklistItem,
                status: updates.status.toUpperCase(), // Convert to uppercase for checklist_items
                updatedAt: new Date().toISOString(),
              };
              await dataProvider.store.update('checklist_items', updatedChecklistItem);
              console.log('✅ Checklist item also updated:', { checklistItemId: checklistItem.id, status: updates.status });
            } else {
              // No matching checklist_item - this is normal for calculated KPIs or indicators without checklist items
              console.log('ℹ️ No checklist_item for indicator code:', indicator.code, '(normal for calculated KPIs)');
            }
          } catch (error) {
            console.error('❌ Error updating checklist_item:', error);
          }
        }

        if (onSuccess) {
          onSuccess();
        }

        // 🆕 Emit event to trigger dashboard reload
        console.log('✅ Indicator updated - emitting checklist-updated event', { indicatorId, packId: indicator.packId });
        window.dispatchEvent(new CustomEvent('checklist-updated', { 
          detail: { itemId: indicatorId, packId: indicator.packId } 
        }));

        return { success: true };
      } catch (error: any) {
        console.error('Update indicator error:', error);

        if (onError) {
          onError(error);
        } else {
          toast.error('Erreur lors de la mise à jour', {
            description: error.message || 'Une erreur est survenue',
          });
        }

        return { success: false, error };
      } finally {
        setUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(indicatorId);
          return next;
        });
      }
    },
    [onSuccess, onError]
  );

  /**
   * Update indicator with debounce
   * Use for comment changes, text input
   */
  const updateIndicatorDebounced = useCallback(
    (indicatorId: string, updates: UpdateIndicatorPayload) => {
      // Clear existing timer for this indicator
      const existingTimer = debounceTimers.current.get(indicatorId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set indicator as "updating" immediately for UI feedback
      setUpdatingIds((prev) => new Set(prev).add(indicatorId));

      // Create new debounced timer
      const timer = setTimeout(async () => {
        try {
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

          if (onSuccess) {
            onSuccess();
          }
        } catch (error: any) {
          console.error('Update indicator error:', error);

          if (onError) {
            onError(error);
          } else {
            toast.error('Erreur lors de la mise à jour', {
              description: error.message || 'Une erreur est survenue',
            });
          }
        } finally {
          setUpdatingIds((prev) => {
            const next = new Set(prev);
            next.delete(indicatorId);
            return next;
          });
          debounceTimers.current.delete(indicatorId);
        }
      }, debounceMs);

      debounceTimers.current.set(indicatorId, timer);
    },
    [debounceMs, onSuccess, onError]
  );

  /**
   * Mark indicator as PROVIDED
   */
  const markAsProvided = useCallback(
    async (indicatorId: string) => {
      // 🆕 Use lowercase status to match IndexedDB schema
      const result = await updateIndicatorImmediate(indicatorId, { status: 'provided' });
      if (result.success) {
        toast.success('Item marqué comme fourni');
      }
      return result;
    },
    [updateIndicatorImmediate]
  );

  /**
   * Mark indicator as MISSING
   */
  const markAsMissing = useCallback(
    async (indicatorId: string) => {
      // 🆕 Use lowercase status to match IndexedDB schema
      const result = await updateIndicatorImmediate(indicatorId, { status: 'missing' });
      if (result.success) {
        toast.success('Item marqué comme manquant');
      }
      return result;
    },
    [updateIndicatorImmediate]
  );

  /**
   * Mark indicator as NEEDS_REVIEW
   */
  const markAsNeedsReview = useCallback(
    async (indicatorId: string) => {
      const result = await updateIndicatorImmediate(indicatorId, { status: 'NEEDS_REVIEW' });
      if (result.success) {
        toast.success('Item marqué à réviser');
      }
      return result;
    },
    [updateIndicatorImmediate]
  );

  /**
   * Update indicator comment (debounced)
   */
  const updateComment = useCallback(
    (indicatorId: string, comment: string) => {
      updateIndicatorDebounced(indicatorId, { comment });
    },
    [updateIndicatorDebounced]
  );

  /**
   * Update indicator comment immediately (e.g., on blur)
   */
  const updateCommentImmediate = useCallback(
    async (indicatorId: string, comment: string) => {
      const result = await updateIndicatorImmediate(indicatorId, { comment });
      if (result.success) {
        toast.success('Commentaire enregistré');
      }
      return result;
    },
    [updateIndicatorImmediate]
  );

  /**
   * Update indicator value
   */
  const updateValue = useCallback(
    async (indicatorId: string, value: number) => {
      const result = await updateIndicatorImmediate(indicatorId, { value });
      if (result.success) {
        toast.success('Valeur mise à jour');
      }
      return result;
    },
    [updateIndicatorImmediate]
  );

  /**
   * Check if indicator is currently being updated
   */
  const isUpdating = useCallback(
    (indicatorId: string) => {
      return updatingIds.has(indicatorId);
    },
    [updatingIds]
  );

  /**
   * Flush all pending debounced updates immediately
   */
  const flushPendingUpdates = useCallback(() => {
    debounceTimers.current.forEach((timer) => {
      clearTimeout(timer);
    });
    debounceTimers.current.clear();
  }, []);

  return {
    // Status updates (immediate)
    markAsProvided,
    markAsMissing,
    markAsNeedsReview,

    // Comment updates
    updateComment, // debounced
    updateCommentImmediate, // immediate

    // Value updates
    updateValue,

    // Generic updates
    updateIndicatorImmediate,
    updateIndicatorDebounced,

    // State
    isUpdating,
    updatingIds,

    // Utils
    flushPendingUpdates,
  };
}