import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { CalculationTransparency } from "@/app/components/CalculationTransparency";
import { 
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Eye,
  FileCheck,
  Leaf,
  Users as UsersIcon,
  Shield
} from "lucide-react";

type PostureType = "conseil" | "pre-audit" | "audit-externe";
type ParcoursType = "csrd-obligatoire" | "esg-structure";

interface MappingESRSProps {
  posture: PostureType;
  parcours: ParcoursType;
}

const esrsStandards = [
  {
    code: "E1",
    name: "Changement climatique",
    category: "environmental" as const,
    applicable: true,
    requirements: 18,
    completed: 15,
    validated: 12,
    auditStatus: "valide" as const,
  },
  {
    code: "E2",
    name: "Pollution",
    category: "environmental" as const,
    applicable: true,
    requirements: 12,
    completed: 12,
    validated: 12,
    auditStatus: "valide" as const,
  },
  {
    code: "E3",
    name: "Ressources en eau et marines",
    category: "environmental" as const,
    applicable: false,
    requirements: 10,
    completed: 0,
    validated: 0,
    auditStatus: "non-applicable" as const,
  },
  {
    code: "S1",
    name: "Personnel de l'entreprise",
    category: "social" as const,
    applicable: true,
    requirements: 22,
    completed: 18,
    validated: 14,
    auditStatus: "reserve" as const,
  },
  {
    code: "S2",
    name: "Travailleurs de la chaîne de valeur",
    category: "social" as const,
    applicable: true,
    requirements: 14,
    completed: 8,
    validated: 5,
    auditStatus: "invalide" as const,
  },
  {
    code: "G1",
    name: "Conduite des affaires",
    category: "governance" as const,
    applicable: true,
    requirements: 15,
    completed: 15,
    validated: 15,
    auditStatus: "valide" as const,
  },
];

const esgThemes = [
  {
    code: "ENV",
    name: "Environnement",
    category: "environmental" as const,
    applicable: true,
    indicators: 24,
    completed: 20,
    validated: 18,
    auditStatus: "valide" as const,
  },
  {
    code: "SOC",
    name: "Social & RH",
    category: "social" as const,
    applicable: true,
    indicators: 18,
    completed: 15,
    validated: 12,
    auditStatus: "reserve" as const,
  },
  {
    code: "GOV",
    name: "Gouvernance",
    category: "governance" as const,
    applicable: true,
    indicators: 12,
    completed: 12,
    validated: 12,
    auditStatus: "valide" as const,
  },
];

export function MappingESRS({ posture, parcours }: MappingESRSProps) {
  const [expandedStandard, setExpandedStandard] = useState<string | null>(null);
  
  const isConseil = posture === "conseil";
  const isPreAudit = posture === "pre-audit";
  const isAuditExterne = posture === "audit-externe";
  const isCsrdObligatoire = parcours === "csrd-obligatoire";

  const labels = {
    title: isCsrdObligatoire ? "Mapping ESRS" : "Thématiques ESG",
    subtitle: isCsrdObligatoire 
      ? "Vue d'ensemble des normes ESRS E1-E5, S1-S4, G1 et exigences applicables"
      : "Organisation des indicateurs par piliers Environnement, Social, Gouvernance",
    standardLabel: isCsrdObligatoire ? "Norme ESRS" : "Thématique",
    requirementLabel: isCsrdObligatoire ? "Exigences" : "Indicateurs",
  };

  const data = isCsrdObligatoire ? esrsStandards : esgThemes;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "environmental":
        return Leaf;
      case "social":
        return UsersIcon;
      case "governance":
        return Shield;
      default:
        return FileCheck;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "environmental":
        return "bg-[#059669] text-white";
      case "social":
        return "bg-blue-600 text-white";
      case "governance":
        return "bg-purple-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const getCompletionPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const alertesPreAudit = isPreAudit ? [
    { type: "Exigences incomplètes", count: 12, description: "Data points non renseignés" },
    { type: "Sources manquantes", count: 8, description: "Références non documentées" },
  ] : [];

  const totalRequirements = data.reduce((acc, std) => acc + (std.requirements || std.indicators || 0), 0);
  const totalCompleted = data.reduce((acc, std) => acc + std.completed, 0);
  const totalValidated = data.reduce((acc, std) => acc + std.validated, 0);
  const applicableStandards = data.filter(std => std.applicable).length;

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
              Points bloquants pour audit ({alertesPreAudit.reduce((acc, a) => acc + a.count, 0)})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alertesPreAudit.map((alerte, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white rounded border border-amber-200">
                <div>
                  <p className="font-medium text-sm">{alerte.type}</p>
                  <p className="text-xs text-muted-foreground">{alerte.description}</p>
                </div>
                <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300">
                  {alerte.count}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {isCsrdObligatoire ? "Normes applicables" : "Thématiques"}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-semibold">{applicableStandards}</p>
                  <CalculationTransparency 
                    indicatorCode="MAPPING_NORMS_COUNT"
                    displayedValue={applicableStandards}
                    posture={posture}
                    size="sm"
                  />
                </div>
              </div>
              <div className="bg-[#E8F3F0] p-3 rounded-lg">
                <FileCheck className="h-5 w-5 text-[#0F4C3A]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{labels.requirementLabel} totales</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-semibold">{totalRequirements}</p>
                  <CalculationTransparency 
                    indicatorCode="MAPPING_REQUIREMENTS_TOTAL"
                    displayedValue={totalRequirements}
                    posture={posture}
                    size="sm"
                  />
                </div>
              </div>
              <div className="bg-[#E8F3F0] p-3 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-[#0F4C3A]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Complétées</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-semibold">{totalCompleted}</p>
                  <CalculationTransparency 
                    indicatorCode="MAPPING_COMPLETED"
                    displayedValue={totalCompleted}
                    posture={posture}
                    size="sm"
                  />
                </div>
              </div>
              <div className="bg-[#E8F3F0] p-3 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-[#0F4C3A]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Progression</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-semibold">
                    {getCompletionPercentage(totalCompleted, totalRequirements)}%
                  </p>
                  <CalculationTransparency 
                    indicatorCode="MAPPING_COMPLETION_PCT"
                    displayedValue={getCompletionPercentage(totalCompleted, totalRequirements)}
                    posture={posture}
                    size="sm"
                  />
                </div>
              </div>
              <div className="bg-[#E8F3F0] p-3 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-[#0F4C3A]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des normes / thématiques */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isCsrdObligatoire ? "Normes ESRS par catégorie" : "Piliers ESG"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.map((standard) => {
            const Icon = getCategoryIcon(standard.category);
            const isExpanded = expandedStandard === standard.code;
            const completionPercentage = getCompletionPercentage(
              standard.completed,
              standard.requirements || standard.indicators || 0
            );

            return (
              <div key={standard.code} className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedStandard(isExpanded ? null : standard.code)}
                  className="w-full p-4 bg-background hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-2 rounded-lg ${getCategoryColor(standard.category)}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-[#0F4C3A] text-white font-mono">
                            {isCsrdObligatoire ? `ESRS ${standard.code}` : standard.code}
                          </Badge>
                          <span className="font-medium">{standard.name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            {standard.completed}/{standard.requirements || standard.indicators}{" "}
                            {labels.requirementLabel.toLowerCase()} complétées
                          </span>
                          {isPreAudit && standard.validated < standard.completed && (
                            <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300 text-xs">
                              {standard.completed - standard.validated} à valider
                            </Badge>
                          )}
                          {isAuditExterne && (
                            <>
                              {standard.auditStatus === "valide" && (
                                <Badge className="bg-[#059669] text-white text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Validé
                                </Badge>
                              )}
                              {standard.auditStatus === "reserve" && (
                                <Badge className="bg-amber-500 text-white text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Avec réserve
                                </Badge>
                              )}
                              {standard.auditStatus === "invalide" && (
                                <Badge className="bg-red-600 text-white text-xs">
                                  Invalide
                                </Badge>
                              )}
                              {standard.auditStatus === "non-applicable" && (
                                <Badge variant="outline" className="text-xs">
                                  Non applicable
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-border rounded-full h-2">
                            <div
                              className="bg-[#059669] h-2 rounded-full transition-all"
                              style={{ width: `${completionPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 bg-muted/30 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-3">
                      {isCsrdObligatoire 
                        ? `Cette norme ESRS contient ${standard.requirements || standard.indicators} exigences de divulgation. ${standard.validated} sont validées, ${standard.completed - standard.validated} en cours de validation.`
                        : `Ce pilier comprend ${standard.indicators} indicateurs ESG. ${standard.validated} sont validés, ${standard.completed - standard.validated} en cours.`
                      }
                    </p>
                    {isConseil && (
                      <Button variant="outline" size="sm">
                        Voir les détails
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}