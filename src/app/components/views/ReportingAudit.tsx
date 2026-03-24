import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Shield, FileCheck, AlertTriangle, CheckCircle2, Eye, Download } from "lucide-react";

type PostureType = "conseil" | "pre-audit" | "audit-externe";
type ParcoursType = "csrd-obligatoire" | "esg-structure";

interface ReportingAuditProps {
  posture: PostureType;
  parcours: ParcoursType;
}

export function ReportingAudit({ posture, parcours }: ReportingAuditProps) {
  const isConseil = posture === "conseil";
  const isPreAudit = posture === "pre-audit";
  const isAuditExterne = posture === "audit-externe";
  const isCsrdObligatoire = parcours === "csrd-obligatoire";

  const labels = {
    title: isCsrdObligatoire ? "Reporting & Audit" : "Exports & Livrables",
    subtitle: isCsrdObligatoire
      ? "Génération de rapports auditables et vue dédiée aux auditeurs externes"
      : "Exports ESG et documents de livrables",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">{labels.title}</h1>
          <p className="text-muted-foreground">{labels.subtitle}</p>
        </div>
        {isAuditExterne && (
          <Badge className="bg-orange-600 text-white">
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
            Statut d'auditabilité globale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">Score d'auditabilité</p>
              <p className="text-4xl font-semibold text-green-600">87%</p>
              <p className="text-xs text-muted-foreground mt-2">Bon niveau</p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium">Données sourcées</span>
              </div>
              <p className="text-2xl font-semibold">142/157</p>
              <p className="text-xs text-muted-foreground mt-1">90% des data points</p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium">Méthodologies</span>
              </div>
              <p className="text-2xl font-semibold">45/52</p>
              <p className="text-xs text-muted-foreground mt-1">87% documentées</p>
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
              8 points bloquants pour audit externe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-900">
              Ces problèmes doivent être résolus avant la phase d'audit externe pour éviter les réserves.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Bouton génération rapports */}
      <Card>
        <CardHeader>
          <CardTitle>Générer des rapports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 border-dashed hover:border-[#059669] cursor-pointer transition-colors">
              <CardContent className="p-6 text-center">
                <FileCheck className="h-8 w-8 text-[#0F4C3A] mx-auto mb-3" />
                <p className="font-medium mb-1">CSRD complet</p>
                <p className="text-xs text-muted-foreground">Déclaration conforme ESRS</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-dashed hover:border-[#059669] cursor-pointer transition-colors">
              <CardContent className="p-6 text-center">
                <FileCheck className="h-8 w-8 text-[#0F4C3A] mx-auto mb-3" />
                <p className="font-medium mb-1">Bilan carbone</p>
                <p className="text-xs text-muted-foreground">Rapport GHG Protocol</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-dashed hover:border-[#059669] cursor-pointer transition-colors">
              <CardContent className="p-6 text-center">
                <Shield className="h-8 w-8 text-[#0F4C3A] mx-auto mb-3" />
                <p className="font-medium mb-1">Package audit</p>
                <p className="text-xs text-muted-foreground">Rapport + preuves</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
