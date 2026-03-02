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

  console.log('🔍 useAllIndicators - Hook called', {
    packsCount: packsList.length,
    packsLoading,
    packsError,
    enabled: !packsLoading && packsList.length > 0,
  });

  return useQuery({
    queryKey: ['all-indicators', packsList.map(p => p.id).sort().join(',')],
    queryFn: async () => {
      console.log('📊 useAllIndicators - Loading full packs data...');
      console.log(`📦 Found ${packsList.length} packs to load`);
      
      const allIndicators: Indicator[] = [];
      
      // Charger chaque pack avec ses détails complets (folders + indicators)
      for (const pack of packsList) {
        try {
          console.log(`📦 Loading full data for pack: ${pack.id}`);
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
      
      console.log(`✅ useAllIndicators - Found ${allIndicators.length} total indicators`);
      console.log('📊 Indicators by status:', {
        missing: allIndicators.filter(i => i.status === 'missing').length,
        partial: allIndicators.filter(i => i.status === 'partial').length,
        validated: allIndicators.filter(i => i.status === 'validated').length,
        rejected: allIndicators.filter(i => i.status === 'rejected').length,
      });
      
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
      console.log('📊 useIndicatorsStatistics - Calculating statistics...');
      
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
      
      console.log('✅ useIndicatorsStatistics - Statistics calculated:', stats);
      
      return stats;
    },
    enabled: !isLoading && indicators.length > 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}