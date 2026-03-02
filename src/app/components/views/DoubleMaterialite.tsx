import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { CalculationTransparency } from "@/app/components/CalculationTransparency";
import { 
  Upload,
  Download,
  Grid3x3,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FileSpreadsheet,
  ArrowRight,
  AlertTriangle,
  Eye,
  FileCheck
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { toast } from "sonner"; // 🔧 Add toast for user feedback

type PostureType = "conseil" | "pre-audit" | "audit-externe";
type ParcoursType = "csrd-obligatoire" | "esg-structure";

interface DoubleMaterialiteProps {
  posture: PostureType;
  parcours: ParcoursType;
}

interface MaterialityIssue {
  id: number;
  name: string;
  description: string;
  impactScore: number;
  financialScore: number;
  stakeholders: string[];
  esrsMapping: string[];
  mappingValidated: boolean;
  justification?: string;
  auditStatus?: "valide" | "reserve" | "invalide";
}

const materialityIssues: MaterialityIssue[] = [
  {
    id: 1,
    name: "Émissions GES",
    description: "Réduction des émissions de gaz à effet de serre",
    impactScore: 4.5,
    financialScore: 4.2,
    stakeholders: ["Actionnaires", "Régulateurs", "Clients"],
    esrsMapping: ["E1"],
    mappingValidated: true,
    justification: "Enjeu stratégique lié aux objectifs climat",
    auditStatus: "valide",
  },
  {
    id: 2,
    name: "Diversité et inclusion",
    description: "Promotion de la diversité au sein de l'entreprise",
    impactScore: 3.8,
    financialScore: 2.9,
    stakeholders: ["Employés", "Syndicats", "Société civile"],
    esrsMapping: ["S1"],
    mappingValidated: true,
    justification: "Politique RH prioritaire",
    auditStatus: "valide",
  },
  {
    id: 3,
    name: "Consommation d'eau",
    description: "Gestion durable des ressources en eau",
    impactScore: 3.5,
    financialScore: 2.1,
    stakeholders: ["Communautés locales", "ONG"],
    esrsMapping: ["E3"],
    mappingValidated: false,
    justification: "",
    auditStatus: "invalide",
  },
  {
    id: 4,
    name: "Éthique des affaires",
    description: "Prévention de la corruption et respect de l'éthique",
    impactScore: 4.1,
    financialScore: 3.8,
    stakeholders: ["Actionnaires", "Clients", "Régulateurs"],
    esrsMapping: ["G1"],
    mappingValidated: true,
    justification: "Exigence réglementaire et risque réputationnel",
    auditStatus: "valide",
  },
  {
    id: 5,
    name: "Conditions de travail fournisseurs",
    description: "Respect des droits humains dans la chaîne de valeur",
    impactScore: 3.9,
    financialScore: 2.5,
    stakeholders: ["Fournisseurs", "ONG", "Clients"],
    esrsMapping: ["S2"],
    mappingValidated: false,
    justification: "",
    auditStatus: "reserve",
  },
  {
    id: 6,
    name: "Déchets et économie circulaire",
    description: "Réduction et valorisation des déchets",
    impactScore: 3.2,
    financialScore: 2.8,
    stakeholders: ["Communautés", "Régulateurs"],
    esrsMapping: ["E5"],
    mappingValidated: true,
    justification: "Impact environnemental significatif",
    auditStatus: "valide",
  },
];

export function DoubleMaterialite({ posture, parcours }: DoubleMaterialiteProps) {
  const isConseil = posture === "conseil";
  const isPreAudit = posture === "pre-audit";
  const isAuditExterne = posture === "audit-externe";
  const isCsrdObligatoire = parcours === "csrd-obligatoire";

  // 🔧 Add handler functions for all buttons
  const handleExportMateriality = () => {
    toast.success("Export démarré", {
      description: "Analyse de matérialité en cours d'export..."
    });
  };

  const handleAnalyzeIssues = () => {
    toast.info("Analyse en cours", {
      description: "Identification des enjeux matériels..."
    });
  };

  const handleGenerateESRS = () => {
    if (isCsrdObligatoire) {
      toast.info("Génération ESRS", {
        description: "Création de la liste des normes ESRS applicables..."
      });
    } else {
      toast.info("Suggestions", {
        description: "Proposition de thématiques ESG pertinentes..."
      });
    }
  };

  const handleRequestEvidence = (issueName: string) => {
    toast.info("Demande de preuve", {
      description: `Demande envoyée pour "${issueName}"`
    });
  };

  const handleViewIssueDetail = (issueName: string) => {
    toast.info("Détails de l'enjeu", {
      description: `Ouverture des détails pour "${issueName}"`
    });
  };

  const labels = {
    title: isCsrdObligatoire ? "Double Matérialité (DMA)" : "Enjeux prioritaires",
    subtitle: isCsrdObligatoire 
      ? "Analyse de matérialité et mapping automatique vers les ESRS applicables"
      : "Identification et priorisation des enjeux ESG matériels",
    mappingLabel: isCsrdObligatoire ? "ESRS proposés" : "Thématiques",
    impactLabel: isCsrdObligatoire ? "Impact env./social" : "Impact ESG",
  };

  // Alertes pré-audit
  const alertesPreAudit = isPreAudit ? [
    { type: "Enjeux sans justification", count: 2, description: "Scoring sans documentation des hypothèses" },
    { type: "Mappings non validés", count: 2, description: "Correspondances ESRS à valider" },
    { type: "Parties prenantes", count: 3, description: "Consultations non documentées" },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">{labels.title}</h1>
          <p className="text-muted-foreground">
            {labels.subtitle}
          </p>
        </div>
        {isConseil && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportMateriality}> {/* 🔧 Added onClick */}
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button className="bg-[#0F4C3A] hover:bg-[#0A3B2E]">
              <Upload className="h-4 w-4 mr-2" />
              Importer les résultats
            </Button>
          </div>
        )}
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
                  {alerte.count} enjeux
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Assistant IA - Mode Conseil uniquement */}
      {isConseil && (
        <Card className="border-[#059669] bg-gradient-to-r from-[#E8F3F0] to-white">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-[#059669] p-3 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">
                  {isCsrdObligatoire ? "Mapping ESRS intelligent" : "Assistance à la priorisation"}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {isCsrdObligatoire 
                    ? "L'IA analyse vos enjeux de matérialité et propose automatiquement les normes ESRS applicables. Chaque mapping doit être validé manuellement par votre équipe."
                    : "L'IA vous aide à identifier et prioriser vos enjeux ESG selon les attentes des parties prenantes et les impacts financiers."
                  }
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleAnalyzeIssues}> {/* 🔧 Added onClick */}
                    Analyser les enjeux
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleGenerateESRS}> {/* 🔧 Added onClick */}
                    {isCsrdObligatoire ? "Générer la liste ESRS" : "Suggérer des thématiques"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Enjeux identifiés</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-semibold">18</p>
                  <CalculationTransparency 
                    indicatorCode="DMA_ISSUES_IDENTIFIED"
                    displayedValue={18}
                    posture={posture}
                    size="sm"
                  />
                </div>
              </div>
              <div className="bg-[#E8F3F0] p-3 rounded-lg">
                <Grid3x3 className="h-5 w-5 text-[#0F4C3A]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mappings validés</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-semibold">12</p>
                  <CalculationTransparency 
                    indicatorCode="DMA_MAPPINGS_VALIDATED"
                    displayedValue={12}
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
              <div>
                <p className="text-sm text-muted-foreground">À valider</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-semibold">6</p>
                  <CalculationTransparency 
                    indicatorCode="DMA_TO_VALIDATE"
                    displayedValue={6}
                    posture={posture}
                    size="sm"
                  />
                </div>
              </div>
              <div className="bg-[#E8F3F0] p-3 rounded-lg">
                <AlertCircle className="h-5 w-5 text-[#0F4C3A]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isCsrdObligatoire ? "ESRS applicables" : "Thématiques"}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-semibold">8</p>
                  <CalculationTransparency 
                    indicatorCode="DMA_ESRS_APPLICABLE"
                    displayedValue={8}
                    posture={posture}
                    size="sm"
                  />
                </div>
              </div>
              <div className="bg-[#E8F3F0] p-3 rounded-lg">
                <FileSpreadsheet className="h-5 w-5 text-[#0F4C3A]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matrice de matérialité */}
      <Card>
        <CardHeader>
          <CardTitle>Matrice de double matérialité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full h-[500px] bg-gradient-to-tr from-green-50 via-white to-amber-50 border border-border rounded-lg p-8">
            {/* Axes */}
            <div className="absolute bottom-8 left-8 right-8 h-0.5 bg-border" />
            <div className="absolute bottom-8 left-8 top-8 w-0.5 bg-border" />
            
            {/* Labels */}
            <div className="absolute bottom-2 right-8 text-sm font-medium text-muted-foreground">
              Impact financier →
            </div>
            <div 
              className="absolute left-2 top-8 text-sm font-medium text-muted-foreground"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              {labels.impactLabel} →
            </div>
            
            {/* Seuil de matérialité */}
            <div className="absolute top-1/2 left-8 right-8 h-0.5 border-t-2 border-dashed border-[#F59E0B]" />
            <div className="absolute top-1/2 left-1/2 bottom-8 w-0.5 border-l-2 border-dashed border-[#F59E0B]" />
            
            {/* Points */}
            {materialityIssues.map((issue) => {
              const x = 8 + ((issue.financialScore / 5) * (100 - 16));
              const y = 100 - 8 - ((issue.impactScore / 5) * (100 - 16));
              
              return (
                <div
                  key={issue.id}
                  className="absolute cursor-pointer group"
                  style={{ 
                    left: `${x}%`, 
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    issue.mappingValidated 
                      ? 'bg-[#059669] text-white' 
                      : 'bg-amber-500 text-white'
                  } shadow-lg group-hover:scale-110 transition-transform`}>
                    <span className="text-xs font-bold">{issue.id}</span>
                  </div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <div className="bg-foreground text-background px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-xl">
                      <p className="font-semibold mb-1">{issue.name}</p>
                      <p>Impact: {issue.impactScore}/5 | Financier: {issue.financialScore}/5</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#059669]" />
              <span>Mapping validé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-amber-500" />
              <span>À valider</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des enjeux */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isCsrdObligatoire ? "Enjeux de matérialité et mapping ESRS" : "Enjeux ESG prioritaires"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enjeu</TableHead>
                <TableHead>{labels.impactLabel}</TableHead>
                <TableHead>Impact financier</TableHead>
                <TableHead>Parties prenantes</TableHead>
                <TableHead>{labels.mappingLabel}</TableHead>
                {isPreAudit && <TableHead>Justification</TableHead>}
                {isAuditExterne && <TableHead>Statut audit</TableHead>}
                {isAuditExterne && <TableHead>Action</TableHead>}
                {!isAuditExterne && <TableHead>Statut mapping</TableHead>}
                {!isAuditExterne && <TableHead></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {materialityIssues.map((issue) => (
                <TableRow 
                  key={issue.id}
                  className={isPreAudit && !issue.justification ? "bg-amber-50" : ""}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{issue.name}</p>
                      <p className="text-xs text-muted-foreground">{issue.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <div className="flex-1 bg-border rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-[#0F4C3A] h-full"
                          style={{ width: `${(issue.impactScore / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{issue.impactScore}/5</span>
                      <CalculationTransparency 
                        indicatorCode={`MAT_IMPACT_${issue.name.toUpperCase().replace(/\s+/g, '_')}`}
                        displayedValue={issue.impactScore}
                        posture={posture}
                        size="sm"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <div className="flex-1 bg-border rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-[#059669] h-full"
                          style={{ width: `${(issue.financialScore / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{issue.financialScore}/5</span>
                      <CalculationTransparency 
                        indicatorCode={`MAT_FINANCIAL_${issue.name.toUpperCase().replace(/\s+/g, '_')}`}
                        displayedValue={issue.financialScore}
                        posture={posture}
                        size="sm"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {issue.stakeholders.map((stakeholder, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {stakeholder}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {issue.esrsMapping.map((esrs, idx) => (
                        <Badge key={idx} className="bg-[#0F4C3A] text-white font-mono">
                          {esrs}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  {isPreAudit && (
                    <TableCell className="text-xs">
                      {issue.justification ? (
                        <span className="text-muted-foreground">{issue.justification}</span>
                      ) : (
                        <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300 text-xs">
                          À documenter
                        </Badge>
                      )}
                    </TableCell>
                  )}
                  {isAuditExterne && (
                    <TableCell>
                      {issue.auditStatus === "valide" && (
                        <Badge className="bg-[#059669] text-white text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Validé
                        </Badge>
                      )}
                      {issue.auditStatus === "reserve" && (
                        <Badge className="bg-amber-500 text-white text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Avec réserve
                        </Badge>
                      )}
                      {issue.auditStatus === "invalide" && (
                        <Badge className="bg-red-600 text-white text-xs">
                          Invalide
                        </Badge>
                      )}
                    </TableCell>
                  )}
                  {isAuditExterne && (
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => handleRequestEvidence(issue.name)} // 🔧 Added onClick
                      >
                        <FileCheck className="h-3 w-3 mr-1" />
                        Demander preuve
                      </Button>
                    </TableCell>
                  )}
                  {!isAuditExterne && (
                    <TableCell>
                      {issue.mappingValidated ? (
                        <Badge className="bg-[#059669] text-white">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Validé
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500 text-white">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          À valider
                        </Badge>
                      )}
                    </TableCell>
                  )}
                  {!isAuditExterne && (
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewIssueDetail(issue.name)} // 🔧 Added onClick
                        title="Voir les détails"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}