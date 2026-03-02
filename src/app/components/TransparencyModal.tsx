import React from 'react';
import { 
  X, FileSpreadsheet, Calculator, FileCheck, Clock, AlertTriangle, 
  CheckCircle2, Download, Loader2, RefreshCw, MessageSquare
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Skeleton } from '@/app/components/ui/skeleton';
import {
  useCalculationSummary,
  useCalculationWarnings,
  useDeleteCalculationInput,
  useValidateCalculation,
  useExportTransparency,
  getQualityLevelLabel,
  getQualityLevelColor,
  getConfidenceLevelIcon,
} from '@/hooks/useTransparency';
import { useIndicatorAuditTrail, formatAuditTimestamp, getActionLabel, getActionColor } from '@/hooks/useAuditTrail';
import { formatIndicatorValue } from '@/utils/calculationEngine';
import { CommentThread } from '@/app/components/collaboration/CommentThread';
import { useUser } from '@/contexts/UserContext';

interface TransparencyModalProps {
  indicatorId: string;
  indicatorName?: string; // Optional prop for title
  isOpen: boolean; // Changed from 'open' to 'isOpen' for consistency
  onClose: () => void;
}

export function TransparencyModal({ 
  indicatorId, 
  indicatorName, // Added this parameter
  isOpen, // Changed from 'open' to 'isOpen'
  onClose 
}: TransparencyModalProps) {
  const { currentUser } = useUser(); // 🆕 Phase 8 - Get current user for comments
  
  // React Query hooks
  const { 
    data: summary, 
    isLoading: summaryLoading, 
    isError: summaryError,
    error: summaryErrorData,
    refetch: refetchSummary 
  } = useCalculationSummary(isOpen ? indicatorId : null);

  const { 
    data: warnings = [], 
  } = useCalculationWarnings(isOpen ? indicatorId : null);

  const { 
    data: auditTrail = [], 
    isLoading: auditLoading 
  } = useIndicatorAuditTrail(isOpen ? indicatorId : null);

  // Mutations
  const deleteInputMutation = useDeleteCalculationInput();
  const validateMutation = useValidateCalculation();
  const exportMutation = useExportTransparency();

  // Extract data from summary
  const indicator = summary?.indicator;
  const profile = summary?.profile;
  const inputs = summary?.inputs || [];
  const factors = summary?.factors || [];
  
  // Check if this is a placeholder profile (not yet configured)
  const isPlaceholder = profile?.id?.startsWith('placeholder-');

  const getCategoryColor = (category: 'environmental' | 'social' | 'governance' | 'cross_cutting') => {
    const colors = {
      environmental: 'bg-green-600',
      social: 'bg-blue-600',
      governance: 'bg-purple-600',
      cross_cutting: 'bg-gray-600',
    };
    return colors[category] || 'bg-gray-600';
  };

  const handleValidateCalculation = () => {
    if (!profile) return;

    validateMutation.mutate(
      { 
        profileId: profile.id, 
        comment: 'Calcul validé via interface de transparence' 
      },
      {
        onSuccess: () => {
          refetchSummary();
        },
      }
    );
  };

  const handleExport = (format: 'pdf' | 'json' | 'excel') => {
    exportMutation.mutate({ indicatorId, format });
  };

  // Loading state
  if (summaryLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chargement...</DialogTitle>
            <DialogDescription className="sr-only">
              Chargement des données de transparence et d'audit de l'indicateur
            </DialogDescription>
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-64" />
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Error state
  if (summaryError) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Erreur de chargement</DialogTitle>
            <DialogDescription>
              Une erreur s'est produite lors du chargement des données de transparence
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {summaryErrorData?.message || 'Impossible de charger les données de transparence'}
            </AlertDescription>
          </Alert>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={onClose}>Fermer</Button>
            <Button onClick={() => refetchSummary()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // No data state
  if (!indicator || !profile) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Données non disponibles</DialogTitle>
            <DialogDescription>
              Les données de transparence pour cet indicateur n'ont pas pu être trouvées
            </DialogDescription>
          </DialogHeader>
          <p className="text-muted-foreground">
            Aucune donnée de transparence trouvée pour cet indicateur.
          </p>
          <Button onClick={onClose}>Fermer</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded text-sm font-bold text-white ${getCategoryColor(indicator.category)}`}>
                  {indicator.pillar || indicator.category}
                </span>
                <DialogTitle className="text-2xl">{indicatorName || indicator.name}</DialogTitle>
              </div>
              <DialogDescription className="sr-only">
                Détails complets de transparence et d'audit pour l'indicateur {indicator.code}
              </DialogDescription>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Code: <span className="font-mono font-semibold">{indicator.code}</span></span>
                {profile.validation_status && (
                  <Badge 
                    className={
                      profile.validation_status === 'validated' 
                        ? 'bg-green-100 text-green-800'
                        : profile.validation_status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {profile.validation_status === 'validated' ? 'Validé' : 
                     profile.validation_status === 'rejected' ? 'Rejeté' :
                     profile.validation_status === 'pending_review' ? 'En attente' : 'Brouillon'}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetchSummary()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Warnings */}
        {warnings.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-2">{warnings.length} alerte(s) détectée(s)</div>
              <ul className="text-sm space-y-1">
                {warnings.slice(0, 3).map((warning, idx) => (
                  <li key={idx}>• {warning.message}</li>
                ))}
                {warnings.length > 3 && (
                  <li className="text-muted-foreground">... et {warnings.length - 3} autre(s)</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Computed Value Card */}
        <Card className="bg-gradient-to-r from-[#E8F3F0] to-white border-[#059669]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Valeur calculée</p>
                <p className="text-4xl font-bold text-[#0A3B2E]">
                  {summary.computed_value !== undefined 
                    ? formatIndicatorValue(summary.computed_value, indicator.unit)
                    : 'N/A'
                  }
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getQualityLevelColor(profile.quality_level)}>
                    {getQualityLevelLabel(profile.quality_level)}
                  </Badge>
                  {profile.methodology_reference && (
                    <span className="text-xs text-muted-foreground">
                      Méthode: {profile.methodology_reference}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Dernière mise à jour</p>
                <p className="font-medium">
                  {summary.last_updated 
                    ? new Date(summary.last_updated).toLocaleDateString('fr-FR')
                    : 'N/A'
                  }
                </p>
                {profile.validated_by && (
                  <p className="text-sm text-muted-foreground">Validé par {profile.validated_by}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="calculation" className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="calculation">
              <Calculator className="h-4 w-4 mr-2" />
              Calcul
            </TabsTrigger>
            <TabsTrigger value="sources">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Sources ({inputs.length})
            </TabsTrigger>
            <TabsTrigger value="factors">
              <FileCheck className="h-4 w-4 mr-2" />
              Facteurs ({factors.length})
            </TabsTrigger>
            <TabsTrigger value="discussion">
              <MessageSquare className="h-4 w-4 mr-2" />
              Discussion
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="h-4 w-4 mr-2" />
              Historique ({auditTrail.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab Calcul */}
          <TabsContent value="calculation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Méthode de calcul</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.calculation_method_text && (
                  <p className="text-sm">{profile.calculation_method_text}</p>
                )}

                {profile.formula_text && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium mb-1">Formule</p>
                    <code className="text-sm font-mono">{profile.formula_text}</code>
                  </div>
                )}

                {profile.steps && profile.steps.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Étapes de calcul</p>
                    <ol className="list-decimal list-inside space-y-1">
                      {profile.steps.map((step, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground">{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {profile.assumptions && (
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium mb-2">Hypothèses</p>
                    <p className="text-sm text-muted-foreground">{profile.assumptions}</p>
                  </div>
                )}

                {profile.limitations && (
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium mb-2">Limites</p>
                    <p className="text-sm text-muted-foreground">{profile.limitations}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-2">
              {profile.validation_status !== 'validated' && !isPlaceholder && (
                <Button 
                  onClick={handleValidateCalculation}
                  disabled={validateMutation.isPending || isPlaceholder}
                  className="bg-[#059669] hover:bg-[#047857]"
                >
                  {validateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Valider le calcul
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => handleExport('pdf')}
                disabled={isPlaceholder}
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter PDF
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleExport('excel')}
                disabled={isPlaceholder}
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter Excel
              </Button>
            </div>
          </TabsContent>

          {/* Tab Sources */}
          <TabsContent value="sources">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Données sources</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {inputs.length} donnée(s) source utilisée(s) pour le calcul
                </p>
              </CardHeader>
              <CardContent>
                {inputs.length === 0 ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Aucune donnée source. Cet indicateur nécessite un import de données.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Valeur</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Confiance</TableHead>
                          <TableHead>Période</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inputs.map((input) => (
                          <TableRow key={input.id}>
                            <TableCell className="font-medium">{input.input_name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{input.input_type}</Badge>
                            </TableCell>
                            <TableCell className="font-mono">
                              {input.value} {input.unit}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {input.source_reference}
                            </TableCell>
                            <TableCell>
                              <span title={input.confidence_level}>
                                {getConfidenceLevelIcon(input.confidence_level)}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm">
                              {input.period_start && input.period_end
                                ? `${new Date(input.period_start).toLocaleDateString('fr-FR')} - ${new Date(input.period_end).toLocaleDateString('fr-FR')}`
                                : 'N/A'
                              }
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Supprimer "${input.input_name}" ?`)) {
                                    deleteInputMutation.mutate({
                                      inputId: input.id,
                                      profileId: profile.id,
                                    });
                                  }
                                }}
                                disabled={deleteInputMutation.isPending}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Facteurs */}
          <TabsContent value="factors">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Facteurs de calcul</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {factors.length} facteur(s) utilisé(s) (émissions, conversions, coefficients)
                </p>
              </CardHeader>
              <CardContent>
                {factors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun facteur spécifique utilisé</p>
                ) : (
                  <div className="space-y-3">
                    {factors.map((factor) => (
                      <Card key={factor.id} className="border-l-4 border-l-[#059669]">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{factor.factor_name}</h4>
                              <p className="text-sm text-muted-foreground">{factor.factor_type}</p>
                              <div className="mt-2 text-lg font-bold text-[#059669]">
                                {factor.factor_value} {factor.factor_unit}
                                {factor.uncertainty_range && (
                                  <span className="text-sm text-muted-foreground ml-2">
                                    {factor.uncertainty_range}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right text-sm">
                              <Badge variant="outline">{factor.factor_source}</Badge>
                              {factor.is_expired && (
                                <Badge variant="destructive" className="mt-2">Expiré</Badge>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-muted-foreground">
                            <p>Source: {factor.source_reference}</p>
                            {factor.valid_from && factor.valid_to && (
                              <p>
                                Validité: {new Date(factor.valid_from).toLocaleDateString('fr-FR')} - {new Date(factor.valid_to).toLocaleDateString('fr-FR')}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Discussion - Phase 8 */}
          <TabsContent value="discussion">
            {currentUser ? (
              <CommentThread
                entityType="indicator"
                entityId={indicatorId}
                currentUserId={currentUser.id}
                currentUserName={currentUser.name}
                currentUserAvatar={currentUser.avatar}
                onCommentAdded={() => {
                  refetchSummary();
                }}
              />
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Connectez-vous pour participer aux discussions
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Historique */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Audit trail complet</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Toutes les modifications apportées à cet indicateur
                </p>
              </CardHeader>
              <CardContent>
                {auditLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-[#059669]" />
                  </div>
                ) : auditTrail.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun historique disponible</p>
                ) : (
                  <div className="space-y-4">
                    {auditTrail.map((entry) => (
                      <div key={entry.id} className="flex gap-4 border-l-2 border-[#059669] pl-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getActionColor(entry.action)}>
                              {getActionLabel(entry.action)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatAuditTimestamp(entry.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{entry.user}</p>
                          {entry.comment && (
                            <p className="text-sm text-muted-foreground mt-1">{entry.comment}</p>
                          )}
                          {entry.oldValue !== undefined && entry.newValue !== undefined && (
                            <div className="text-sm mt-2">
                              <span className="text-red-600 line-through">{String(entry.oldValue)}</span>
                              {' → '}
                              <span className="text-green-600 font-semibold">{String(entry.newValue)}</span>
                            </div>
                          )}
                          {entry.affectedFields && entry.affectedFields.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Champs modifiés: {entry.affectedFields.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}