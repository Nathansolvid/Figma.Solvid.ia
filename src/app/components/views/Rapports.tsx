import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { 
  FileText, 
  Download, 
  Eye, 
  Plus,
  Calendar,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { StatusBadge } from "@/app/components/StatusBadge";
import { toast } from "sonner"; // 🔧 Add toast for user feedback

type PostureType = "conseil" | "pre-audit" | "audit-externe";
type ParcoursType = "csrd-obligatoire" | "esg-structure";

interface RapportsProps {
  posture: PostureType;
  parcours: ParcoursType;
}

const reports = [
  {
    id: 1,
    name: "Déclaration de performance extra-financière 2025",
    type: "CSRD",
    status: "in-progress",
    version: "v2.3",
    date: "20 Jan 2026",
    author: "Sophie Martin",
    pages: 48,
    auditStatus: "reserve" as const,
  },
  {
    id: 2,
    name: "Bilan carbone réglementaire 2025",
    type: "GHG Protocol",
    status: "validated",
    version: "v1.0",
    date: "15 Jan 2026",
    author: "Thomas Dubois",
    pages: 24,
    auditStatus: "valide" as const,
  },
  {
    id: 3,
    name: "Rapport ESG Q4 2025",
    type: "ESG",
    status: "validated",
    version: "v1.2",
    date: "10 Jan 2026",
    author: "Sophie Martin",
    pages: 18,
    auditStatus: "valide" as const,
  },
  {
    id: 4,
    name: "Package audit CSRD 2025",
    type: "Audit",
    status: "complete",
    version: "v3.1",
    date: "18 Jan 2026",
    author: "Marie Laurent",
    pages: 156,
    auditStatus: "valide" as const,
  },
];

export function Rapports({ posture, parcours }: RapportsProps) {
  const isConseil = posture === "conseil";
  const isPreAudit = posture === "pre-audit";
  const isAuditExterne = posture === "audit-externe";

  // 🔧 Add handler functions for all buttons
  const handleCreateReport = () => {
    toast.info("Fonctionnalité en développement", {
      description: "La création de nouveaux rapports sera bientôt disponible"
    });
  };

  const handlePreviewReport = (reportId: number, reportName: string) => {
    toast.info("Prévisualisation du rapport", {
      description: `Ouverture de "${reportName}"...`
    });
  };

  const handleDownloadReport = (reportId: number, reportName: string) => {
    toast.success("Téléchargement démarré", {
      description: `"${reportName}" est en cours de téléchargement`
    });
  };

  const handleSelectTemplate = (templateName: string) => {
    toast.info("Modèle sélectionné", {
      description: `Préparation du modèle "${templateName}"...`
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Rapports</h1>
          <p className="text-muted-foreground">
            {isAuditExterne 
              ? "Consultation des rapports et livrables de l'entité auditée"
              : "Génération et gestion de vos livrables réglementaires"
            }
          </p>
        </div>
        {isAuditExterne && (
          <Badge className="bg-orange-600 text-white">
            <Eye className="h-3 w-3 mr-1" />
            Mode Lecture seule
          </Badge>
        )}
        {isConseil && (
          <Button className="bg-[#0F4C3A] hover:bg-[#0A3B2E]" onClick={handleCreateReport}> {/* 🔧 Added onClick */}
            <Plus className="h-4 w-4 mr-2" />
            Nouveau rapport
          </Button>
        )}
      </div>

      {/* Alertes Pré-audit */}
      {isPreAudit && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="h-5 w-5" />
              1 rapport nécessite une validation avant audit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-900">
              "Déclaration de performance extra-financière 2025" doit être validée avant la phase d'audit externe.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Liste des rapports */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isAuditExterne ? "Rapports disponibles" : "Rapports générés"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom du rapport</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Auteur</TableHead>
                {isAuditExterne && <TableHead>Statut audit</TableHead>}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{report.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {report.pages} pages
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      report.type === 'CSRD' 
                        ? 'border-[#0F4C3A] text-[#0F4C3A]' 
                        : 'border-[#059669] text-[#059669]'
                    }>
                      {report.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={report.status as any} />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-mono">{report.version}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {report.date}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {report.author}
                  </TableCell>
                  {isAuditExterne && (
                    <TableCell>
                      {report.auditStatus === "valide" && (
                        <Badge className="bg-[#059669] text-white text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Validé
                        </Badge>
                      )}
                      {report.auditStatus === "reserve" && (
                        <Badge className="bg-amber-500 text-white text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Avec réserve
                        </Badge>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="Prévisualiser"
                        onClick={() => handlePreviewReport(report.id, report.name)} // 🔧 Added onClick
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="Télécharger"
                        onClick={() => handleDownloadReport(report.id, report.name)} // 🔧 Added onClick
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Prévisualisation simplifiée */}
      {!isAuditExterne && (
        <Card>
          <CardHeader>
            <CardTitle>Modèles de rapports disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card 
                className="border-2 border-dashed hover:border-[#059669] cursor-pointer transition-colors"
                onClick={() => handleSelectTemplate("Déclaration CSRD")} // 🔧 Added onClick
              >
                <CardContent className="p-6 text-center">
                  <FileText className="h-8 w-8 text-[#0F4C3A] mx-auto mb-3" />
                  <p className="font-medium mb-1">Déclaration CSRD</p>
                  <p className="text-xs text-muted-foreground">Rapport ESRS complet</p>
                </CardContent>
              </Card>
              <Card 
                className="border-2 border-dashed hover:border-[#059669] cursor-pointer transition-colors"
                onClick={() => handleSelectTemplate("Bilan carbone")} // 🔧 Added onClick
              >
                <CardContent className="p-6 text-center">
                  <FileText className="h-8 w-8 text-[#0F4C3A] mx-auto mb-3" />
                  <p className="font-medium mb-1">Bilan carbone</p>
                  <p className="text-xs text-muted-foreground">GHG Protocol Scope 1-3</p>
                </CardContent>
              </Card>
              <Card 
                className="border-2 border-dashed hover:border-[#059669] cursor-pointer transition-colors"
                onClick={() => handleSelectTemplate("Rapport ESG")} // 🔧 Added onClick
              >
                <CardContent className="p-6 text-center">
                  <FileText className="h-8 w-8 text-[#0F4C3A] mx-auto mb-3" />
                  <p className="font-medium mb-1">Rapport ESG</p>
                  <p className="text-xs text-muted-foreground">Synthèse indicateurs</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}