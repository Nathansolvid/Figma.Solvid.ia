import { useQuery } from '@tanstack/react-query';
import { usePacks } from '@/hooks/usePack';
import { apiClient } from '@/services/api';

export interface Indicator {
  id: string;
  folderId: string;
  packId: string;
  packName?: string;
  code: string;
  name: string;
  category: 'E' | 'S' | 'G';
  subcategory: string;
  status: 'missing' | 'partial' | 'validated' | 'rejected';
  value: number | null;
  unit: string | null;
  source: string | null;
  methodology: string | null;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  evidence?: any[];
}

// Hook: Get all indicators from all packs
export function useAllIndicators() {
  const { data: packsList = [], isLoading: packsLoading, error: packsError } = usePacks();

  return useQuery({
    queryKey: ['all-indicators', packsList.map(p => p.id).sort().join(',')],
    queryFn: async () => {
      
      const allIndicators: Indicator[] = [];
      
      // Charger chaque pack avec ses détails complets (folders + indicators)
      for (const pack of packsList) {
        try {
          const fullPack = await apiClient.getPackFullDirect(pack.id);
          
          if (fullPack?.pack?.folders && Array.isArray(fullPack.pack.folders)) {
            for (const folder of fullPack.pack.folders) {
              if (folder.indicators && Array.isArray(folder.indicators)) {
                for (const indicator of folder.indicators) {
                  allIndicators.push({
                    ...indicator,
                    packName: fullPack.pack.name,
                  });
                }
              }
            }
          }
        } catch (error) {
          console.error(`❌ Error loading pack ${pack.id}:`, error);
        }
      }
      
      return allIndicators;
    },
    enabled: !packsLoading && packsList.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });
}

// Hook: Get indicators statistics
export function useIndicatorsStatistics() {
  const { data: indicators = [], isLoading } = useAllIndicators();

  return useQuery({
    queryKey: ['indicators-statistics', indicators.length],
    queryFn: async () => {
      
      const stats = {
        total: indicators.length,
        validated: indicators.filter(i => i.status === 'validated').length,
        partial: indicators.filter(i => i.status === 'partial').length,
        missing: indicators.filter(i => i.status === 'missing').length,
        rejected: indicators.filter(i => i.status === 'rejected').length,
        byCategory: {
          E: indicators.filter(i => i.category === 'E').length,
          S: indicators.filter(i => i.category === 'S').length,
          G: indicators.filter(i => i.category === 'G').length,
        },
        completionRate: indicators.length > 0 
          ? Math.round((indicators.filter(i => i.status === 'validated').length / indicators.length) * 100)
          : 0,
      };
      
      
      return stats;
    },
    enabled: !isLoading && indicators.length > 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}