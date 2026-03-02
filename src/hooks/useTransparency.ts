import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { toast } from 'sonner';
import type { 
  CalculationProfile, 
  CalculationInput, 
  CalculationFactor,
  CalculationLog,
  CalculationSummary,
  CalculationWarning
} from '@/types/transparency';
import {
  indicators,
  calculationProfiles,
  calculationInputs,
  calculationFactors,
  calculationLogs,
} from '@/data/transparencyData';

// Query Keys
export const transparencyKeys = {
  all: ['transparency'] as const,
  calculations: () => [...transparencyKeys.all, 'calculations'] as const,
  calculation: (id: string) => [...transparencyKeys.calculations(), id] as const,
  profile: (indicatorId: string) => [...transparencyKeys.all, 'profile', indicatorId] as const,
  inputs: (profileId: string) => [...transparencyKeys.all, 'inputs', profileId] as const,
  factors: (profileId: string) => [...transparencyKeys.all, 'factors', profileId] as const,
  logs: (profileId: string) => [...transparencyKeys.all, 'logs', profileId] as const,
  summary: (indicatorId: string) => [...transparencyKeys.all, 'summary', indicatorId] as const,
  warnings: (indicatorId: string) => [...transparencyKeys.all, 'warnings', indicatorId] as const,
};

// Hook: Get calculation profile for indicator
export function useCalculationProfile(indicatorId: string | null) {
  return useQuery({
    queryKey: transparencyKeys.profile(indicatorId || ''),
    queryFn: async () => {
      if (!indicatorId) throw new Error('Indicator ID is required');
      
      const response = await apiClient.getCalculationProfile(indicatorId);
      return response.profile as CalculationProfile;
    },
    enabled: !!indicatorId,
    staleTime: 5 * 60 * 1000, // 5 minutes - calculation profiles sont relativement stables
    gcTime: 10 * 60 * 1000,
  });
}

// Hook: Get calculation inputs
export function useCalculationInputs(profileId: string | null) {
  return useQuery({
    queryKey: transparencyKeys.inputs(profileId || ''),
    queryFn: async () => {
      if (!profileId) throw new Error('Profile ID is required');
      
      const response = await apiClient.getCalculationInputs(profileId);
      return response.inputs as CalculationInput[];
    },
    enabled: !!profileId,
    staleTime: 3 * 60 * 1000, // 3 minutes - inputs peuvent changer
    gcTime: 10 * 60 * 1000,
  });
}

// Hook: Get calculation factors
export function useCalculationFactors(profileId: string | null) {
  return useQuery({
    queryKey: transparencyKeys.factors(profileId || ''),
    queryFn: async () => {
      if (!profileId) throw new Error('Profile ID is required');
      
      const response = await apiClient.getCalculationFactors(profileId);
      return response.factors as CalculationFactor[];
    },
    enabled: !!profileId,
    staleTime: 10 * 60 * 1000, // 10 minutes - factors sont stables
    gcTime: 30 * 60 * 1000,
  });
}

// Hook: Get calculation logs (audit trail spécifique au calcul)
export function useCalculationLogs(profileId: string | null) {
  return useQuery({
    queryKey: transparencyKeys.logs(profileId || ''),
    queryFn: async () => {
      if (!profileId) throw new Error('Profile ID is required');
      
      const response = await apiClient.getCalculationLogs(profileId);
      return response.logs as CalculationLog[];
    },
    enabled: !!profileId,
    staleTime: 2 * 60 * 1000, // 2 minutes - logs changent fréquemment
    gcTime: 5 * 60 * 1000,
  });
}

// Hook: Get full calculation summary (all transparency data)
export function useCalculationSummary(indicatorId: string | null) {
  return useQuery({
    queryKey: transparencyKeys.summary(indicatorId || ''),
    queryFn: async () => {
      if (!indicatorId) throw new Error('Indicator ID is required');
      
      // Try to get real indicator data from the API/database
      console.log(`📊 Loading calculation summary for: ${indicatorId}`);
      
      // DEMO MODE: Always use static data
      console.log(`⚠️ Using DEMO MODE for: ${indicatorId}`);
      
      // FALLBACK: Use static demo data
      let indicator = indicators.find(i => i.id === indicatorId);
      
      if (!indicator) {
        console.log(`⚠️ Indicator not found in static data, creating placeholder...`);
        
        // Create a minimal placeholder indicator
        // This allows transparency modal to open with empty state
        const placeholderIndicator: any = {
          id: indicatorId,
          name: 'Indicateur sans profil de transparence',
          code: 'PLACEHOLDER',
          description: 'Cet indicateur n\'a pas encore de profil de calcul configuré.',
          norm_reference: 'N/A',
          unit: '-',
          aggregation_type: 'sum',
          display_format: 'number',
          transparency_profile_id: null,
          category: 'environmental',
          pillar: 'E',
          is_mandatory: false,
          is_material: false,
          display_order: 999,
        };
        
        const placeholderProfile: CalculationProfile = {
          id: `placeholder-${indicatorId}`,
          indicator_id: indicatorId,
          formula_text: 'Non configuré',
          calculation_method_text: 'Aucune méthodologie de calcul n\'a été définie pour cet indicateur. Configurez le profil de transparence pour ajouter la formule, les données sources et les facteurs de calcul.',
          quality_level: 'estimated',
          status: 'draft',
          steps: [],
          created_at: new Date(),
          updated_at: new Date(),
        };
        
        const summary: CalculationSummary = {
          indicator: placeholderIndicator,
          profile: placeholderProfile,
          inputs: [],
          factors: [],
          logs: [],
          warnings: [{
            type: 'missing_evidence',
            severity: 'warning',
            message: 'Profil de transparence non configuré',
            recommendation: 'Configurez le profil de calcul pour cet indicateur afin d\'ajouter les données sources, facteurs et méthodologie.',
          }],
          computed_value: undefined,
          last_updated: new Date().toISOString(),
        };
        
        console.log(`✅ Created placeholder summary for unconfigured indicator`);
        return summary;
      }
      
      console.log(`✅ Found indicator: ${indicator.code} - ${indicator.name}`);
      
      // Find profile
      const profile = calculationProfiles.find(p => p.id === indicator.transparency_profile_id);
      if (!profile) {
        console.log(`⚠️ Profile not found, creating placeholder profile...`);
        
        const placeholderProfile: CalculationProfile = {
          id: `placeholder-${indicatorId}`,
          indicator_id: indicatorId,
          formula_text: 'Non configuré',
          calculation_method_text: 'Aucune méthodologie de calcul n\'a été définie pour cet indicateur.',
          quality_level: 'estimated',
          status: 'draft',
          steps: [],
          created_at: new Date(),
          updated_at: new Date(),
        };
        
        return {
          indicator,
          profile: placeholderProfile,
          inputs: [],
          factors: [],
          logs: [],
          warnings: [{
            type: 'missing_evidence',
            severity: 'warning',
            message: 'Profil de transparence non configuré',
            recommendation: 'Configurez le profil de calcul pour cet indicateur.',
          }],
          computed_value: undefined,
          last_updated: new Date().toISOString(),
        };
      }
      
      // Get inputs, factors, and logs
      const inputs = calculationInputs.filter(i => i.calculation_profile_id === profile.id);
      const factors = calculationFactors.filter(f => f.calculation_profile_id === profile.id);
      const logs = calculationLogs.filter(l => l.calculation_profile_id === profile.id);
      
      // Build summary
      const summary: CalculationSummary = {
        indicator,
        profile,
        inputs,
        factors,
        logs,
        warnings: [],
        computed_value: undefined,
        last_updated: profile.updated_at?.toISOString() || new Date().toISOString(),
      };
      
      console.log(`✅ [DEMO MODE] Found summary with ${inputs.length} inputs, ${factors.length} factors`);
      
      return summary;
    },
    enabled: !!indicatorId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000,
    retry: false, // Don't retry on error, show placeholder instead
  });
}

// Hook: Get calculation warnings
export function useCalculationWarnings(indicatorId: string | null) {
  return useQuery({
    queryKey: transparencyKeys.warnings(indicatorId || ''),
    queryFn: async () => {
      if (!indicatorId) throw new Error('Indicator ID is required');
      
      // DEMO MODE: Generate warnings from mock data
      const indicator = indicators.find(i => i.id === indicatorId);
      
      // If indicator not found in static data, return empty warnings
      if (!indicator) {
        console.log(`⚠️ No warnings available for indicator ${indicatorId} (not in static data)`);
        return [];
      }
      
      const profile = calculationProfiles.find(p => p.id === indicator.transparency_profile_id);
      if (!profile) return [];
      
      const inputs = calculationInputs.filter(i => i.calculation_profile_id === profile.id);
      const factors = calculationFactors.filter(f => f.calculation_profile_id === profile.id);
      
      const warnings: CalculationWarning[] = [];
      
      // Check missing evidence
      const inputsWithoutEvidence = inputs.filter((i) => !i.evidence_link);
      if (inputsWithoutEvidence.length > 0) {
        warnings.push({
          type: 'missing_evidence',
          severity: 'warning',
          message: `${inputsWithoutEvidence.length} donnée(s) source sans preuve jointe`,
          recommendation: 'Ajoutez les documents justificatifs pour renforcer l\'auditabilité',
        });
      }
      
      // Check expired factors
      const expiredFactors = factors.filter((f) => f.is_expired);
      if (expiredFactors.length > 0) {
        warnings.push({
          type: 'expired_factor',
          severity: 'critical',
          message: `${expiredFactors.length} facteur(s) expiré(s)`,
          recommendation: 'Mettez à jour les facteurs avec les dernières références officielles',
        });
      }
      
      // Check low confidence
      const lowConfidenceInputs = inputs.filter((i) => i.confidence_level === 'low');
      if (lowConfidenceInputs.length > 0) {
        warnings.push({
          type: 'low_confidence',
          severity: 'warning',
          message: `${lowConfidenceInputs.length} donnée(s) avec niveau de confiance faible`,
          recommendation: 'Privilégiez des sources mesurées plutôt qu\'estimées',
        });
      }
      
      return warnings;
    },
    enabled: !!indicatorId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

// Hook: Update calculation profile
export function useUpdateCalculationProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      profileId, 
      updates 
    }: { 
      profileId: string; 
      updates: Partial<CalculationProfile> 
    }) => {
      const response = await apiClient.updateCalculationProfile(profileId, updates);
      return response.profile as CalculationProfile;
    },
    onMutate: async ({ profileId, updates }) => {
      // Cancel outgoing refetches
      const indicatorId = updates.indicator_id;
      if (indicatorId) {
        await queryClient.cancelQueries({ queryKey: transparencyKeys.profile(indicatorId) });
      }

      // Snapshot previous value
      const previous = indicatorId 
        ? queryClient.getQueryData(transparencyKeys.profile(indicatorId))
        : null;

      // Optimistically update
      if (indicatorId) {
        queryClient.setQueryData(
          transparencyKeys.profile(indicatorId),
          (old: any) => old ? { ...old, ...updates, updated_at: new Date() } : old
        );
      }

      return { previous, indicatorId };
    },
    onError: (error: any, variables, context) => {
      // Rollback
      if (context?.previous && context?.indicatorId) {
        queryClient.setQueryData(
          transparencyKeys.profile(context.indicatorId),
          context.previous
        );
      }

      toast.error('Erreur de mise à jour', {
        description: error.message || 'Impossible de mettre à jour le profil',
      });
    },
    onSuccess: (data, variables, context) => {
      // Invalidate related queries
      if (context?.indicatorId) {
        queryClient.invalidateQueries({ queryKey: transparencyKeys.profile(context.indicatorId) });
        queryClient.invalidateQueries({ queryKey: transparencyKeys.summary(context.indicatorId) });
      }

      toast.success('Profil mis à jour');
    },
  });
}

// Hook: Add calculation input
export function useAddCalculationInput() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<CalculationInput, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await apiClient.addCalculationInput(input);
      return response.input as CalculationInput;
    },
    onSuccess: (newInput) => {
      // Invalidate inputs list
      queryClient.invalidateQueries({ 
        queryKey: transparencyKeys.inputs(newInput.calculation_profile_id) 
      });

      toast.success('Donnée source ajoutée');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de l\'ajout', {
        description: error.message || 'Une erreur est survenue',
      });
    },
  });
}

// Hook: Update calculation input
export function useUpdateCalculationInput() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      inputId, 
      updates 
    }: { 
      inputId: string; 
      updates: Partial<CalculationInput> 
    }) => {
      const response = await apiClient.updateCalculationInput(inputId, updates);
      return response.input as CalculationInput;
    },
    onSuccess: (updatedInput) => {
      // Invalidate inputs list
      queryClient.invalidateQueries({ 
        queryKey: transparencyKeys.inputs(updatedInput.calculation_profile_id) 
      });

      toast.success('Donnée source mise à jour');
    },
    onError: (error: any) => {
      toast.error('Erreur de mise à jour', {
        description: error.message || 'Une erreur est survenue',
      });
    },
  });
}

// Hook: Delete calculation input
export function useDeleteCalculationInput() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      inputId, 
      profileId 
    }: { 
      inputId: string; 
      profileId: string 
    }) => {
      await apiClient.deleteCalculationInput(inputId);
      return { inputId, profileId };
    },
    onMutate: async ({ inputId, profileId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: transparencyKeys.inputs(profileId) });

      // Snapshot previous value
      const previous = queryClient.getQueryData(transparencyKeys.inputs(profileId));

      // Optimistically remove input
      queryClient.setQueryData(
        transparencyKeys.inputs(profileId),
        (old: CalculationInput[] | undefined) => 
          old ? old.filter(input => input.id !== inputId) : old
      );

      return { previous, profileId };
    },
    onError: (error: any, variables, context) => {
      // Rollback
      if (context?.previous) {
        queryClient.setQueryData(
          transparencyKeys.inputs(context.profileId),
          context.previous
        );
      }

      toast.error('Erreur de suppression', {
        description: error.message || 'Une erreur est survenue',
      });
    },
    onSuccess: (data) => {
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ 
        queryKey: transparencyKeys.inputs(data.profileId) 
      });

      toast.success('Donnée source supprimée');
    },
  });
}

// Hook: Validate calculation
export function useValidateCalculation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      profileId, 
      comment 
    }: { 
      profileId: string; 
      comment?: string 
    }) => {
      const response = await apiClient.validateCalculation(profileId, comment);
      return response.profile as CalculationProfile;
    },
    onSuccess: (updatedProfile) => {
      // Invalidate profile and summary
      queryClient.invalidateQueries({ 
        queryKey: transparencyKeys.profile(updatedProfile.indicator_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: transparencyKeys.summary(updatedProfile.indicator_id) 
      });

      toast.success('Calcul validé', {
        description: 'Le calcul a été approuvé',
      });
    },
    onError: (error: any) => {
      toast.error('Erreur de validation', {
        description: error.message || 'Une erreur est survenue',
      });
    },
  });
}

// Hook: Export transparency data
export function useExportTransparency() {
  return useMutation({
    mutationFn: async ({ 
      indicatorId, 
      format 
    }: { 
      indicatorId: string; 
      format: 'pdf' | 'json' | 'excel' 
    }) => {
      // DEMO MODE: Generate export client-side
      console.log(`📥 [DEMO MODE] Exporting ${format.toUpperCase()} for ${indicatorId}`);
      
      // Find indicator data
      const indicator = indicators.find(i => i.id === indicatorId);
      if (!indicator) throw new Error('Indicator not found');
      
      const profile = calculationProfiles.find(p => p.id === indicator.transparency_profile_id);
      const inputs = calculationInputs.filter(i => i.calculation_profile_id === profile?.id);
      const factors = calculationFactors.filter(f => f.calculation_profile_id === profile?.id);
      const logs = calculationLogs.filter(l => l.calculation_profile_id === profile?.id);
      
      // Build export data
      const exportData = {
        indicator: {
          id: indicator.id,
          name: indicator.name,
          code: indicator.code,
          description: indicator.description,
          unit: indicator.unit,
          norm_reference: indicator.norm_reference,
        },
        calculation: {
          formula: profile?.formula_text,
          methodology: profile?.calculation_method_text,
          quality_level: profile?.quality_level,
          status: profile?.status,
          steps: profile?.steps,
        },
        sources: inputs.map(input => ({
          name: input.input_name,
          value: input.input_value,
          unit: input.unit,
          source: input.source,
          confidence: input.confidence_level,
          evidence: input.evidence_link,
        })),
        factors: factors.map(factor => ({
          name: factor.factor_name,
          value: factor.factor_value,
          unit: factor.unit,
          source: factor.source,
          validity: factor.validity_end_date,
        })),
        audit_logs: logs.slice(0, 10).map(log => ({
          action: log.action,
          user: log.user_email,
          timestamp: log.timestamp,
          details: log.details,
        })),
        export_metadata: {
          exported_at: new Date().toISOString(),
          exported_by: 'demo-user',
          format,
        },
      };
      
      // Generate file based on format
      let blob: Blob;
      let filename: string;
      
      switch (format) {
        case 'json':
          blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          filename = `transparency_${indicator.code}_${Date.now()}.json`;
          break;
          
        case 'excel':
          // Generate CSV (simplified version of Excel)
          const csvLines = [
            'Type,Nom,Valeur,Unité,Source,Confiance',
            ...inputs.map(i => `Source,${i.input_name},${i.input_value},${i.unit},${i.source},${i.confidence_level}`),
            '',
            'Type,Nom,Valeur,Unité,Source,Validité',
            ...factors.map(f => `Facteur,${f.factor_name},${f.factor_value},${f.unit},${f.source},${f.validity_end_date || 'N/A'}`),
          ];
          blob = new Blob([csvLines.join('\n')], { type: 'text/csv' });
          filename = `transparency_${indicator.code}_${Date.now()}.csv`;
          break;
          
        case 'pdf':
        default:
          // Generate HTML for PDF (in production, this would be server-side PDF generation)
          const html = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <title>Transparence ${indicator.name}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                h1 { color: #0A3B2E; border-bottom: 3px solid #059669; padding-bottom: 10px; }
                h2 { color: #059669; margin-top: 30px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: #E8F3F0; color: #0A3B2E; font-weight: bold; }
                .metadata { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .formula { background: #fff4e6; padding: 15px; border-left: 4px solid #f59e0b; margin: 15px 0; }
              </style>
            </head>
            <body>
              <h1>📊 Rapport de Transparence</h1>
              <div class="metadata">
                <strong>Indicateur:</strong> ${indicator.name} (${indicator.code})<br>
                <strong>Référence normative:</strong> ${indicator.norm_reference}<br>
                <strong>Unité:</strong> ${indicator.unit}<br>
                <strong>Exporté le:</strong> ${new Date().toLocaleString('fr-FR')}
              </div>
              
              <h2>🧮 Méthodologie de calcul</h2>
              <div class="formula">
                <strong>Formule:</strong><br>
                ${profile?.formula_text || 'N/A'}
              </div>
              <p>${profile?.calculation_method_text || 'N/A'}</p>
              
              <h2>📥 Données sources (${inputs.length})</h2>
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Valeur</th>
                    <th>Unité</th>
                    <th>Source</th>
                    <th>Confiance</th>
                  </tr>
                </thead>
                <tbody>
                  ${inputs.map(i => `
                    <tr>
                      <td>${i.input_name}</td>
                      <td>${i.input_value}</td>
                      <td>${i.unit}</td>
                      <td>${i.source}</td>
                      <td>${i.confidence_level}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <h2>⚙️ Facteurs de calcul (${factors.length})</h2>
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Valeur</th>
                    <th>Unité</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  ${factors.map(f => `
                    <tr>
                      <td>${f.factor_name}</td>
                      <td>${f.factor_value}</td>
                      <td>${f.unit}</td>
                      <td>${f.source}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666;">
                <small>Généré par Solvid.IA - ESG Audit-Ready Data Room</small>
              </div>
            </body>
            </html>
          `;
          blob = new Blob([html], { type: 'text/html' });
          filename = `transparency_${indicator.code}_${Date.now()}.html`;
          break;
      }
      
      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return { success: true, filename };
    },
    onSuccess: (data, variables) => {
      toast.success('Export réussi', {
        description: `Fichier ${data.filename} téléchargé`,
      });
    },
    onError: (error: any) => {
      toast.error('Erreur lors de l\'export', {
        description: error.message || 'Une erreur est survenue',
      });
    },
  });
}

// Utility: Get quality level label
export function getQualityLevelLabel(level: CalculationProfile['quality_level']): string {
  const labels: Record<CalculationProfile['quality_level'], string> = {
    measured: 'Mesuré',
    estimated: 'Estimé',
    mixed: 'Mixte',
    calculated: 'Calculé',
  };
  return labels[level] || level;
}

// Utility: Get quality level color
export function getQualityLevelColor(level: CalculationProfile['quality_level']): string {
  const colors: Record<CalculationProfile['quality_level'], string> = {
    measured: 'bg-green-100 text-green-800',
    estimated: 'bg-orange-100 text-orange-800',
    mixed: 'bg-yellow-100 text-yellow-800',
    calculated: 'bg-blue-100 text-blue-800',
  };
  return colors[level] || 'bg-gray-100 text-gray-800';
}

// Utility: Get confidence level icon
export function getConfidenceLevelIcon(level: CalculationInput['confidence_level']): string {
  const icons: Record<CalculationInput['confidence_level'], string> = {
    high: '🟢',
    medium: '🟡',
    low: '🔴',
  };
  return icons[level] || '⚪';
}