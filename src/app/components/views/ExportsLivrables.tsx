// ============================================================================
// EXPORTS & LIVRABLES - Phase 9 COMPLETE
// ============================================================================
// Vue d'export des données ESG avec génération PDF/Excel/JSON/ZIP
// Support historique des exports dans IndexedDB
// Architecture NO-DEAD-CLICK avec fallbacks locaux

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Download,
  FileText,
  Archive,
  Clock,
  CheckCircle2,
  FileCheck,
  Shield,
  Eye,
  Trash2,
  AlertCircle,
  Package,
  BarChart3,
  FileSpreadsheet,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import { useAllIndicators } from "@/hooks/useAllIndicators";
import { idbGetValuesByDossier } from "@/services/idbService";
import { dataProvider } from "@/services/dataProvider";
import { formatFileSize } from "@/utils/fileUtils";
import { MODULE_B } from "@/data/vsme-data";
import type { Indicator as ExportIndicator } from "@/services/exportService";
import { ProfessionalReportsView } from "@/app/components/views/ProfessionalReportsView";
import { 
  generateExport,
  type ExportFormat,
  type ExportScope,
} from '@/services/exportService';
import {
  getAllExports,
  deleteExport,
  downloadExport,
  type ExportHistoryEntry,
  type ExportOptions,
} from '@/services/exportHistoryService';

interface ExportsLivrablesProps {
  posture?: string;
  parcours?: string;
  packId?: string;
}

export function ExportsLivrables({ posture, parcours, packId }: ExportsLivrablesProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>("all");
  const [exportScope, setExportScope] = useState<ExportScope>("complete");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Options d'export
  const [includeTransparency, setIncludeTransparency] = useState(true);
  const [includeAuditTrail, setIncludeAuditTrail] = useState(true);
  const [includeEvidences, setIncludeEvidences] = useState(true);
  const [includeCalculations, setIncludeCalculations] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Charger les indicateurs génériques (store "indicators")
  const { indicators: allIndicators = [], loading } = useAllIndicators();

  // Bridge VSME → Indicator[] quand un dossierId (packId) est fourni
  const [vsmeIndicators, setVsmeIndicators] = useState<ExportIndicator[]>([]);
  const [loadingVsme, setLoadingVsme] = useState(false);

  // Stats réelles depuis IDB (evidence + audit_logs)
  const [evidenceCount, setEvidenceCount] = useState(0);
  const [evidenceTotalSize, setEvidenceTotalSize] = useState(0);
  const [auditCount, setAuditCount] = useState(0);

  useEffect(() => {
    if (!packId) return;
    setLoadingVsme(true);
    // Construire la map de métadonnées depuis MODULE_B
    const meta: Record<string, { name: string; pillar: 'E' | 'S' | 'G'; unit?: string }> = {};
    for (const section of MODULE_B) {
      for (const dp of section.datapoints) {
        meta[dp.code] = {
          name: dp.intitule,
          pillar: (dp.pilier === 'Général' ? 'G' : dp.pilier) as 'E' | 'S' | 'G',
          unit: dp.unite,
        };
      }
    }
    idbGetValuesByDossier(packId).then(values => {
      const indicators: ExportIndicator[] = values
        .filter(v => v.rawValue && v.rawValue.trim() !== '' && v.statut === 'filled')
        .map(v => ({
          id: v.id,
          code: v.code,
          name: meta[v.code]?.name ?? v.code,
          pillar: meta[v.code]?.pillar ?? 'G',
          value: isNaN(parseFloat(v.rawValue)) ? undefined : parseFloat(v.rawValue),
          unit: meta[v.code]?.unit,
          status: v.statut,
        }));
      setVsmeIndicators(indicators);
    }).finally(() => setLoadingVsme(false));
  }, [packId]);

  // Charger les stats réelles (evidence count + size, audit events) depuis IDB
  useEffect(() => {
    if (!packId) {
      setEvidenceCount(0);
      setEvidenceTotalSize(0);
      setAuditCount(0);
      return;
    }
    Promise.all([
      dataProvider.store.listByIndex('evidence', 'packId', packId),
      dataProvider.store.listByIndex('audit_logs', 'entityId', packId),
    ]).then(([evidences, auditLogs]) => {
      setEvidenceCount(evidences.length);
      setEvidenceTotalSize(
        evidences.reduce((sum: number, ev: Record<string, unknown>) => sum + ((ev.fileSize as number) || 0), 0)
      );
      setAuditCount(auditLogs.length);
    }).catch(err => {
      console.error('Failed to load export stats:', err);
    });
  }, [packId]);

  // Source effective : données VSME si disponibles, sinon indicateurs génériques
  // Cast nécessaire : vsmeIndicators est ExportIndicator[], allIndicators est dataProvider.Indicator[]
  // Les deux sont structurellement compatibles avec le paramètre attendu par generateExport
  const effectiveIndicators: ExportIndicator[] = (
    packId && vsmeIndicators.length > 0 ? vsmeIndicators : allIndicators
  ) as ExportIndicator[];

  // 🆕 Charger l'historique des exports au montage
  const [history, setHistory] = useState<ExportHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    loadExportHistory();
  }, []);
  
  async function loadExportHistory() {
    try {
      const exports = await getAllExports();
      setHistory(exports);
    } catch (error) {
      console.error('Failed to load export history:', error);
      toast.error('Erreur lors du chargement de l\'historique');
    } finally {
      setLoadingHistory(false);
    }
  }

  // Empty state si aucune donnée ET pas de dossier VSME sélectionné
  // Si un packId est présent, on laisse l'accès aux rapports professionnels
  // car ils construisent leurs propres données depuis le dossier VSME
  const hasNoData = !loading && !loadingVsme && effectiveIndicators.length === 0;
  if (hasNoData && !packId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Exports & Livrables</h1>
          <p className="text-muted-foreground">
            Générez des exports complets de vos données ESG pour audit, reporting ou archivage
          </p>
        </div>

        <Card>
          <CardContent className="py-16">
            <div className="text-center max-w-md mx-auto">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Download className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Aucune donnée à exporter</h3>
              <p className="text-muted-foreground mb-6">
                Commencez par créer un pack et renseigner des indicateurs ESG.
                Vous pourrez ensuite générer des exports PDF, Excel et JSON pour vos audits,
                investisseurs ou partenaires.
              </p>
              <div className="mt-8 pt-8 border-t">
                <p className="text-sm text-muted-foreground mb-4">
                  <strong>Formats d'export disponibles :</strong>
                </p>
                <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-8 w-8 text-red-500" />
                    <span className="font-medium">PDF</span>
                    <span className="text-xs">Rapport lisible pour audit</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    <span className="font-medium">Excel / CSV</span>
                    <span className="text-xs">Données pour analyse</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <FileCheck className="h-8 w-8 text-blue-500" />
                    <span className="font-medium">JSON</span>
                    <span className="text-xs">Données structurées API</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Statistiques — données réelles depuis IDB
  const stats = {
    totalIndicators: effectiveIndicators.length,
    auditEvents: auditCount,
    evidences: evidenceCount,
    dataSize: formatFileSize(evidenceTotalSize),
  };

  // 🆕 Handler avec nouveau service d'export
  const handleExport = async () => {
    setIsGenerating(true);
    
    const toastId = toast.loading("Génération de l'export...");

    try {
      const options: ExportOptions = {
        includeTransparency,
        includeAuditTrail,
        includeEvidences,
        includeCalculations,
        categoryFilter: categoryFilter !== 'all' ? categoryFilter : undefined,
      };
      
      // 🆕 Utiliser le nouveau service d'export
      const exportEntry = await generateExport(
        exportFormat,
        exportScope,
        effectiveIndicators,
        options,
        undefined, // pack (à implémenter si nécessaire)
        (progress, message) => {
          toast.loading(message, { id: toastId });
        }
      );
      
      toast.dismiss(toastId);
      toast.success("Export généré avec succès !");
      
      // Recharger l'historique
      await loadExportHistory();
      
      // 🆕 Télécharger automatiquement selon le format
      if (exportFormat === 'pdf' && exportEntry.pdfBlob) {
        const url = URL.createObjectURL(exportEntry.pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportEntry.name}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (exportFormat === 'json' && exportEntry.jsonBlob) {
        const url = URL.createObjectURL(exportEntry.jsonBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportEntry.name}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (exportFormat === 'excel' && exportEntry.excelBlob) {
        const url = URL.createObjectURL(exportEntry.excelBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportEntry.name}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (exportFormat === 'all' && exportEntry.zipBlob) {
        const url = URL.createObjectURL(exportEntry.zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportEntry.name}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      }
      
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error(`Erreur lors de la génération: ${error.message}`);
      console.error("Export error:", error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // 🆕 Handler pour télécharger un export existant
  const handleDownloadExport = async (id: string, format: 'pdf' | 'json' | 'excel' | 'zip') => {
    try {
      await downloadExport(id, format);
      toast.success('Téléchargement démarré');
    } catch (error: any) {
      toast.error(`Erreur lors du téléchargement: ${error.message}`);
    }
  };
  
  // 🆕 Handler pour supprimer un export
  const handleDeleteExport = async (id: string) => {
    try {
      await deleteExport(id);
      toast.success('Export supprimé');
      await loadExportHistory();
    } catch (error: any) {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Exports & Livrables</h1>
        <p className="text-muted-foreground">
          Générez des exports complets de vos données ESG pour audit, reporting ou archivage
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Indicateurs</p>
                <p className="text-2xl font-bold">{stats.totalIndicators}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Événements Audit</p>
                <p className="text-2xl font-bold">{stats.auditEvents}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Justificatifs</p>
                <p className="text-2xl font-bold">{stats.evidences}</p>
              </div>
              <FileCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taille Totale</p>
                <p className="text-2xl font-bold">{stats.dataSize}</p>
              </div>
              <Archive className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 🆕 Tabs for Standard Exports vs Professional Reports */}
      <Tabs defaultValue="standardExports">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="standardExports">
            <Archive className="h-4 w-4 mr-2" />
            Exports Standards
          </TabsTrigger>
          <TabsTrigger value="professionalReports">
            <FileText className="h-4 w-4 mr-2" />
            Rapports Professionnels
          </TabsTrigger>
        </TabsList>

        {/* Standard Exports Tab */}
        <TabsContent value="standardExports" className="space-y-6">
          {/* Configuration de l'export */}
          <Card>
            <CardHeader>
              <CardTitle>Nouvel Export</CardTitle>
              <CardDescription>Configurez les paramètres de votre export</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Format */}
              <div className="space-y-2">
                <Label>Format d'export</Label>
                <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        PDF (Rapport lisible)
                      </div>
                    </SelectItem>
                    <SelectItem value="json">
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4" />
                        JSON (Données structurées)
                      </div>
                    </SelectItem>
                    <SelectItem value="excel">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        Excel / CSV (Tableur)
                      </div>
                    </SelectItem>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Archive className="h-4 w-4" />
                        Tous les formats (ZIP)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Scope */}
              <div className="space-y-2">
                <Label>Périmètre</Label>
                <Select value={exportScope} onValueChange={(v) => setExportScope(v as ExportScope)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indicators">Indicateurs uniquement</SelectItem>
                    <SelectItem value="audit">Audit Trail uniquement</SelectItem>
                    <SelectItem value="evidences">Justificatifs uniquement</SelectItem>
                    <SelectItem value="complete">Export complet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtres catégorie */}
              {(exportScope === "indicators" || exportScope === "complete") && (
                <div className="space-y-2">
                  <Label>Filtre par catégorie</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les catégories (E, S, G)</SelectItem>
                      <SelectItem value="E">Environnement (E) uniquement</SelectItem>
                      <SelectItem value="S">Social (S) uniquement</SelectItem>
                      <SelectItem value="G">Gouvernance (G) uniquement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Options avancées */}
              <div className="space-y-3">
                <Label>Options avancées</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="transparency"
                      checked={includeTransparency}
                      onCheckedChange={(checked) => setIncludeTransparency(checked as boolean)}
                    />
                    <Label htmlFor="transparency" className="cursor-pointer">
                      Inclure la transparence des calculs
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="audit"
                      checked={includeAuditTrail}
                      onCheckedChange={(checked) => setIncludeAuditTrail(checked as boolean)}
                    />
                    <Label htmlFor="audit" className="cursor-pointer">
                      Inclure l'audit trail
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="evidences"
                      checked={includeEvidences}
                      onCheckedChange={(checked) => setIncludeEvidences(checked as boolean)}
                    />
                    <Label htmlFor="evidences" className="cursor-pointer">
                      Inclure les justificatifs et métadonnées
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="calculations"
                      checked={includeCalculations}
                      onCheckedChange={(checked) => setIncludeCalculations(checked as boolean)}
                    />
                    <Label htmlFor="calculations" className="cursor-pointer">
                      Inclure les détails de calcul
                    </Label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button onClick={handleExport} disabled={isGenerating} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  {isGenerating ? "Génération en cours..." : "Générer l'export"}
                </Button>
                <Button variant="outline" onClick={() => toast.info('Fonctionnalité en développement')}>
                  <Shield className="h-4 w-4 mr-2" />
                  Planifier
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Historique */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Historique des Exports</CardTitle>
                  <CardDescription>
                    {loadingHistory ? 'Chargement...' : `${history.length} exports disponibles`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement de l'historique...
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun export pour le moment. Générez votre premier export ci-dessus.
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <ExportHistoryCard 
                      key={item.id} 
                      item={item} 
                      onDownload={handleDownloadExport}
                      onDelete={handleDeleteExport}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Professional Reports Tab */}
        <TabsContent value="professionalReports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rapports Professionnels</CardTitle>
              <CardDescription>Générez des rapports prêts pour vérification pour vos investisseurs</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfessionalReportsView dossierId={packId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// EXPORT HISTORY CARD
// ============================================================================

interface ExportHistoryCardProps {
  item: ExportHistoryEntry;
  onDownload: (id: string, format: 'pdf' | 'json' | 'excel' | 'zip') => void;
  onDelete: (id: string) => void;
}

function ExportHistoryCard({ item, onDownload, onDelete }: ExportHistoryCardProps) {
  const statusConfig = {
    completed: { icon: CheckCircle2, color: "text-emerald-500", label: "Terminé" },
    generating: { icon: Clock, color: "text-orange-500", label: "En cours" },
    error: { icon: AlertCircle, color: "text-red-500", label: "Erreur" },
  };

  const config = statusConfig[item.status];
  const StatusIcon = config.icon;
  
  // 🆕 Déterminer le format principal pour le téléchargement
  const primaryFormat = item.format === 'all' ? 'zip' : item.format as 'pdf' | 'json' | 'excel' | 'zip';

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
        <FileText className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold">{item.name}</h4>
          <Badge variant="outline" className="text-xs">
            {typeof item.format === 'string' ? item.format : item.format}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{item.scope}</span>
          <span>{item.sizeFormatted}</span>
          <span>{formatRelativeTime(new Date(item.createdAt))}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <StatusIcon className={`h-5 w-5 ${config.color}`} />
        <span className="text-sm text-muted-foreground">{config.label}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => toast.info('Aperçu en développement')}
          title="Aperçu"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onDownload(item.id, primaryFormat)}
          title="Télécharger"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            if (confirm('Êtes-vous sûr de vouloir supprimer cet export ?')) {
              onDelete(item.id);
            }
          }}
          title="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// UTILITIES
// ============================================================================

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `Il y a ${days}j`;
  if (hours > 0) return `Il y a ${hours}h`;
  if (minutes > 0) return `Il y a ${minutes}min`;
  return "À l'instant";
}
