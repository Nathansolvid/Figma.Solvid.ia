import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { 
  FileSpreadsheet, 
  Download, 
  Eye, 
  Shield, 
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Package,
  FileText,
  Clock,
  Database
} from "lucide-react";
import { toast } from "sonner";
import { exportsApi, downloadJSON, excelToCSV, downloadCSV } from "@/services/esg-api";
import { ServerStatusBanner } from "@/app/components/features/ServerStatusBanner";

type PostureType = "conseil" | "pre-audit" | "audit-externe";

interface ExportsAuditProps {
  posture?: PostureType;
  dossierId?: string;
}

export function ExportsAudit({ posture = "conseil", dossierId }: ExportsAuditProps) {
  const isConseil = posture === "conseil";
  const isPreAudit = posture === "pre-audit";
  const isAuditExterne = posture === "audit-externe";

  const [isExporting, setIsExporting] = useState(false);
  const [auditPackage, setAuditPackage] = useState<any>(null);
  const [loadingPackage, setLoadingPackage] = useState(false);

  // Don't auto-load on mount - only load when user explicitly requests it
  // This avoids errors when dossier has no data yet
  useEffect(() => {
    // Removed auto-load to avoid errors on empty dossiers
  }, [dossierId]);

  const loadAuditPackage = async () => {
    if (!dossierId) return;
    
    try {
      setLoadingPackage(true);
      const result = await exportsApi.generateAuditPackage(dossierId);
      setAuditPackage(result.package);
      return result.package;
    } catch (error) {
      console.error("Failed to load audit package:", error);
      // Don't show error toast here - will be handled by individual export functions
      return null;
    } finally {
      setLoadingPackage(false);
    }
  };

  const handleExportExcel = async () => {
    if (!dossierId) {
      toast.error("Erreur", { description: "ID de dossier manquant" });
      return;
    }

    try {
      setIsExporting(true);
      const result = await exportsApi.exportQuantitativeExcel(dossierId);
      
      // Convert to CSV and download
      const csv = excelToCSV(result.data);
      const timestamp = new Date().toISOString().split('T')[0];
      downloadCSV(csv, `donnees-quantitatives-${timestamp}.csv`);
      
      toast.success("Export Excel généré", {
        description: `${result.totalRows} lignes exportées avec traçabilité complète`
      });
    } catch (error) {
      console.error("Export Excel error:", error);
      toast.error("Erreur d'export", {
        description: "Impossible d'exporter les données Excel"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAudit = async () => {
    if (!dossierId) {
      toast.error("Erreur", { description: "ID de dossier manquant" });
      return;
    }

    try {
      setIsExporting(true);
      const result = await exportsApi.generateAuditPackage(dossierId);
      
      // Download as JSON
      const timestamp = new Date().toISOString().split('T')[0];
      downloadJSON(result.package, `package-audit-${timestamp}.json`);
      
      toast.success("Package audit généré", {
        description: `${result.package.statistics.totalIndicators} indicateurs + ${result.package.statistics.totalFiles} fichiers de preuve`
      });
    } catch (error) {
      console.error("Export audit error:", error);
      toast.error("Erreur d'export", {
        description: "Impossible de générer le package d'audit"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportGRI = async () => {
    if (!dossierId) {
      toast.error("Erreur", { description: "ID de dossier manquant" });
      return;
    }

    try {
      setIsExporting(true);
      const result = await exportsApi.exportGRI(dossierId);
      
      // Download as JSON
      const timestamp = new Date().toISOString().split('T')[0];
      downloadJSON(result.report, `rapport-gri-${timestamp}.json`);
      
      toast.success("Export GRI Standards généré", {
        description: "Rapport formaté selon les normes GRI"
      });
    } catch (error) {
      console.error("Export GRI error:", error);
      toast.error("Export en cours de déploiement", {
        description: "Le serveur est en cours de redémarrage. Réessayez dans 30 secondes."
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCarbon = async () => {
    if (!dossierId) {
      toast.error("Erreur", { description: "ID de dossier manquant" });
      return;
    }

    try {
      setIsExporting(true);
      const result = await exportsApi.exportCarbon(dossierId);
      
      // Download as JSON
      const timestamp = new Date().toISOString().split('T')[0];
      downloadJSON(result.report, `bilan-carbone-${timestamp}.json`);
      
      toast.success("Bilan Carbone généré", {
        description: `Total: ${result.report.totalEmissions.toFixed(2)} tCO2e (Scopes 1+2+3)`
      });
    } catch (error) {
      console.error("Export carbon error:", error);
      toast.error("Erreur d'export", {
        description: "Impossible de générer le bilan carbone"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportWord = async () => {
    if (!dossierId) {
      toast.error("Erreur", { description: "ID de dossier manquant" });
      return;
    }

    try {
      setIsExporting(true);
      const result = await exportsApi.exportQualitativeWord(dossierId);
      
      // Download as JSON
      const timestamp = new Date().toISOString().split('T')[0];
      downloadJSON(result.data, `donnees-qualitatives-${timestamp}.json`);
      
      toast.success("Export Word généré", {
        description: `${result.totalSections} sections exportées`
      });
    } catch (error) {
      console.error("Export Word error:", error);
      toast.error("Erreur d'export", {
        description: "Impossible d'exporter les données Word"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            Exports & Audit
          </h1>
          <p className="text-muted-foreground">
            Exports structurés et packages audit-ready avec traçabilité complète
          </p>
        </div>
        {isAuditExterne && (
          <Badge className="bg-orange-500 text-white">
            <Eye className="h-3 w-3 mr-1" />
            Mode Lecture seule
          </Badge>
        )}
      </div>

      {/* Statut auditabilité */}
      <Card className="border-[#059669]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Score d'auditabilité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">Score global</p>
              <p className="text-4xl font-semibold text-green-600">87%</p>
              <p className="text-xs text-muted-foreground mt-2">Bon niveau</p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium">Données sourcées</span>
              </div>
              <p className="text-2xl font-semibold">142/157</p>
              <p className="text-xs text-muted-foreground mt-1">Sources traçables</p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileCheck className="h-5 w-5 text-green-600" />
                <span className="font-medium">Preuves</span>
              </div>
              <p className="text-2xl font-semibold">87</p>
              <p className="text-xs text-muted-foreground mt-1">Documents joints</p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <span className="font-medium">Points d'attention</span>
              </div>
              <p className="text-2xl font-semibold">8</p>
              <p className="text-xs text-muted-foreground mt-1">À résoudre</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertes pré-audit */}
      {isPreAudit && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="h-5 w-5" />
              8 points à résoudre avant audit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2 text-sm text-amber-900">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>5 indicateurs sans source documentée</p>
            </div>
            <div className="flex items-start gap-2 text-sm text-amber-900">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>3 calculs sans méthodologie explicite</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exports Excel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Exports Excel</CardTitle>
            <FileSpreadsheet className="h-5 w-5 text-[#0F4C3A]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2 border-dashed hover:border-[#059669] cursor-pointer transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-[#E8F3F0] p-3 rounded-lg">
                    <FileSpreadsheet className="h-6 w-6 text-[#0F4C3A]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium mb-1">Export complet Excel</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Toutes les données quantitatives et qualitatives avec sources et preuves
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleExportExcel}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed hover:border-[#059669] cursor-pointer transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-[#E8F3F0] p-3 rounded-lg">
                    <Database className="h-6 w-6 text-[#0F4C3A]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium mb-1">Export avec traçabilité</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Données + historique des modifications + liens vers preuves
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleExportExcel}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed hover:border-[#059669] cursor-pointer transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-[#E8F3F0] p-3 rounded-lg">
                    <FileSpreadsheet className="h-6 w-6 text-[#0F4C3A]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium mb-1">Template de collecte vide</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Structure Excel pré-formatée pour nouvelle collecte
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleExportExcel}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed hover:border-[#059669] cursor-pointer transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-[#E8F3F0] p-3 rounded-lg">
                    <Clock className="h-6 w-6 text-[#0F4C3A]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium mb-1">Export historique</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Évolution des valeurs sur plusieurs périodes
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleExportExcel}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Rapports standards */}
      <Card>
        <CardHeader>
          <CardTitle>Rapports standards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 border-dashed hover:border-[#059669] cursor-pointer transition-colors">
              <CardContent className="p-6 text-center">
                <FileCheck className="h-8 w-8 text-[#0F4C3A] mx-auto mb-3" />
                <p className="font-medium mb-1">Rapport GRI Standards</p>
                <p className="text-xs text-muted-foreground mb-3">Format conforme GRI</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportGRI}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Générer
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed hover:border-[#059669] cursor-pointer transition-colors">
              <CardContent className="p-6 text-center">
                <FileCheck className="h-8 w-8 text-[#0F4C3A] mx-auto mb-3" />
                <p className="font-medium mb-1">Bilan Carbone</p>
                <p className="text-xs text-muted-foreground mb-3">Conforme GHG Protocol</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportCarbon}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Générer
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed hover:border-[#059669] cursor-pointer transition-colors">
              <CardContent className="p-6 text-center">
                <FileText className="h-8 w-8 text-[#0F4C3A] mx-auto mb-3" />
                <p className="font-medium mb-1">Rapport ESG Synthèse</p>
                <p className="text-xs text-muted-foreground mb-3">Vue d'ensemble E/S/G</p>
                <Button 
                  variant="outline" 
                  size="sm"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Générer
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Package audit */}
      <Card className="border-[#059669] bg-gradient-to-r from-[#E8F3F0] to-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Package audit complet
            </CardTitle>
            <Badge className="bg-[#059669] text-white">Audit-ready</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Le package audit contient tout ce dont un auditeur a besoin pour vérifier vos données :
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Toutes les données quantitatives avec sources Excel</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Toutes les sections qualitatives rédigées</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>87 preuves documentaires jointes</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Méthodologies de calcul explicitées</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Historique des modifications</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Piste d'audit complète</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                className="bg-[#0F4C3A] hover:bg-[#0A3B2E]"
                onClick={handleExportAudit}
              >
                <Package className="h-4 w-4 mr-2" />
                Générer le package audit
              </Button>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Prévisualiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Traçabilité */}
      <Card>
        <CardHeader>
          <CardTitle>Traçabilité des exports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: "28 Jan 2026 14:30", type: "Export Excel complet", user: "Sophie Martin", size: "2.4 MB" },
              { date: "25 Jan 2026 09:15", type: "Package audit", user: "Sophie Martin", size: "18.7 MB" },
              { date: "20 Jan 2026 16:45", type: "Rapport GRI Standards", user: "Thomas Dubois", size: "1.2 MB" },
            ].map((export_, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-[#E8F3F0] p-2 rounded-lg">
                    <FileSpreadsheet className="h-4 w-4 text-[#0F4C3A]" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{export_.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {export_.date} • {export_.user} • {export_.size}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}