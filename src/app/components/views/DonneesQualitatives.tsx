import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Textarea } from "@/app/components/ui/textarea";
import { 
  FileEdit,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Eye,
  AlertTriangle
} from "lucide-react";
import { Separator } from "@/app/components/ui/separator";

type PostureType = "conseil" | "pre-audit" | "audit-externe";
type ParcoursType = "csrd-obligatoire" | "esg-structure";

interface DonneesQualitativesProps {
  posture: PostureType;
  parcours: ParcoursType;
}

export function DonneesQualitatives({ posture, parcours }: DonneesQualitativesProps) {
  const isConseil = posture === "conseil";
  const isPreAudit = posture === "pre-audit";
  const isAuditExterne = posture === "audit-externe";
  const isCsrdObligatoire = parcours === "csrd-obligatoire";

  const labels = {
    title: isCsrdObligatoire ? "Données Qualitatives" : "Informations qualitatives",
    subtitle: isCsrdObligatoire
      ? "Édition structurée des sections qualitatives avec assistance IA"
      : "Rédaction des politiques, engagements et démarches ESG",
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

      {/* Alertes Pré-audit */}
      {isPreAudit && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="h-5 w-5" />
              5 sections incomplètes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-900">
              Sections sans contenu ou ne respectant pas les exigences minimales ESRS
            </p>
          </CardContent>
        </Card>
      )}

      {/* Vue d'exemple : Section G1-1 */}
      <Card className="border-[#059669]">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-[#0F4C3A] text-white font-mono">
                  {isCsrdObligatoire ? "G1-1" : "GOV-01"}
                </Badge>
                <Badge className="bg-amber-500 text-white">Obligatoire</Badge>
                <Badge className="bg-blue-500 text-white">
                  <FileEdit className="h-3 w-3 mr-1" />
                  En cours
                </Badge>
              </div>
              <CardTitle>
                {isCsrdObligatoire ? "Politique de conduite des affaires" : "Politique de gouvernance"}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {isCsrdObligatoire ? "ESRS G1 - Gouvernance" : "Pilier Gouvernance"} • Section qualitative
              </p>
            </div>
            {isConseil && (
              <Button className="bg-[#0F4C3A] hover:bg-[#0A3B2E]">
                Valider
              </Button>
            )}
            {isAuditExterne && (
              <Badge className="bg-[#059669] text-white text-sm">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Validé
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Attendus réglementaires */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 mb-1">Attendus réglementaires</p>
                <p className="text-sm text-blue-800">
                  Description de la politique anti-corruption, respect de l'éthique et conformité réglementaire
                </p>
              </div>
            </div>
          </div>

          {/* Assistant IA - Mode Conseil uniquement */}
          {isConseil && (
            <Card className="border-[#059669] bg-gradient-to-r from-[#E8F3F0] to-white">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-[#059669] p-2 rounded-lg">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1">Assistant rédactionnel IA</h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      Générez un premier jet basé sur vos données existantes
                    </p>
                    <Button size="sm" variant="outline">Générer un brouillon</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contenu de la section */}
          <div>
            <label className="text-sm font-medium mb-2 block">Contenu de la section</label>
            {!isAuditExterne ? (
              <Textarea 
                className="min-h-[200px]" 
                placeholder="Décrivez votre politique anti-corruption..."
                defaultValue={isConseil || isPreAudit ? "Notre entreprise s'engage à respecter les principes d'éthique et de conformité les plus stricts. La politique anti-corruption s'applique à l'ensemble des collaborateurs..." : ""}
                disabled={isPreAudit || isAuditExterne}
              />
            ) : (
              <div className="p-4 border border-border rounded-lg bg-muted/30 min-h-[200px]">
                <p className="text-sm">
                  Notre entreprise s'engage à respecter les principes d'éthique et de conformité les plus stricts. 
                  La politique anti-corruption s'applique à l'ensemble des collaborateurs...
                </p>
              </div>
            )}
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                {isPreAudit && "⚠️ Section en lecture seule pour vérification"}
                {isConseil && "420 / 2000 mots"}
              </p>
            </div>
          </div>

          {isPreAudit && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <p className="text-xs text-amber-900">
                    <strong>Point de vérification :</strong> La section doit mentionner explicitement les processus de diligence raisonnable
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}