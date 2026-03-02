import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { StatusBadge } from "@/app/components/StatusBadge";
import { Badge } from "@/app/components/ui/badge";
import { CalculationTransparency } from "@/app/components/CalculationTransparency";
import { 
  Upload, 
  Plus, 
  Info,
  ChevronRight,
  FileSpreadsheet,
  CheckCircle2,
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
import { Progress } from "@/app/components/ui/progress";

type PostureType = "conseil" | "pre-audit" | "audit-externe";

interface EvaluationCarboneProps {
  posture: PostureType;
}

const scope1Data = [
  { id: 1, poste: "Combustion de gaz naturel", value: "640", unit: "tCO₂e", status: "validated", source: "Factures 2025", facteurEmission: "ADEME v23.0", methodo: "Consommation × FE gaz naturel", auditStatus: "valide" },
  { id: 2, poste: "Véhicules de l'entreprise", value: "420", unit: "tCO₂e", status: "validated", source: "Carnet de bord", facteurEmission: "ADEME v23.0", methodo: "km × FE véhicule diesel", auditStatus: "valide" },
  { id: 3, poste: "Fuites de réfrigérants", value: "180", unit: "tCO₂e", status: "complete", source: "Registre maintenance", facteurEmission: "ADEME v23.0", methodo: "Quantité × PRG réfrigérant", auditStatus: "reserve" },
  { id: 4, poste: "Groupes électrogènes", value: "-", unit: "tCO₂e", status: "missing", source: "-", facteurEmission: "-", methodo: "-", auditStatus: "invalide" },
];

const scope2Data = [
  { id: 1, poste: "Électricité (location)", value: "590", unit: "tCO₂e", status: "validated", source: "Factures EDF", facteurEmission: "ADEME v23.0", methodo: "kWh × FE mix FR", auditStatus: "valide" },
  { id: 2, poste: "Chauffage urbain", value: "240", unit: "tCO₂e", status: "complete", source: "Factures Dalkia", facteurEmission: "ADEME v23.0", methodo: "kWh × FE réseau chaleur", auditStatus: "valide" },
];

const scope3Data = [
  { id: 1, poste: "Achats de biens", value: "1240", unit: "tCO₂e", status: "complete", source: "Base fournisseurs", facteurEmission: "ADEME v23.0", methodo: "€ × FE sectoriel", auditStatus: "reserve" },
  { id: 2, poste: "Achats de services", value: "680", unit: "tCO₂e", status: "complete", source: "Comptabilité", facteurEmission: "ADEME v23.0", methodo: "€ × FE sectoriel", auditStatus: "reserve" },
  { id: 3, poste: "Immobilisations", value: "320", unit: "tCO₂e", status: "partial", source: "Bilan actif", facteurEmission: "Estimation", methodo: "Non documentée", auditStatus: "invalide" },
  { id: 4, poste: "Transport amont", value: "890", unit: "tCO₂e", status: "complete", source: "Données logistique", facteurEmission: "ADEME v23.0", methodo: "t.km × FE transport", auditStatus: "valide" },
  { id: 5, poste: "Déchets", value: "180", unit: "tCO₂e", status: "validated", source: "Contrats déchets", facteurEmission: "ADEME v23.0", methodo: "Tonnes × FE traitement", auditStatus: "valide" },
  { id: 6, poste: "Déplacements professionnels", value: "450", unit: "tCO₂e", status: "complete", source: "Notes de frais", facteurEmission: "ADEME v23.0", methodo: "km × FE modes transport", auditStatus: "valide" },
  { id: 7, poste: "Trajets domicile-travail", value: "320", unit: "tCO₂e", status: "partial", source: "Enquête mobilité", facteurEmission: "ADEME v23.0", methodo: "Enquête × extrapolation", auditStatus: "reserve" },
  { id: 8, poste: "Transport aval", value: "280", unit: "tCO₂e", status: "missing", source: "-", facteurEmission: "-", methodo: "-", auditStatus: "invalide" },
  { id: 9, poste: "Utilisation des produits", value: "-", unit: "tCO₂e", status: "missing", source: "Non applicable", facteurEmission: "-", methodo: "-", auditStatus: "non-applicable" },
  { id: 10, poste: "Fin de vie des produits", value: "200", unit: "tCO₂e", status: "partial", source: "Estimation", facteurEmission: "Estimation", methodo: "Non documentée", auditStatus: "invalide" },
];

export function EvaluationCarbone({ posture }: EvaluationCarboneProps) {
  const isConseil = posture === "conseil";
  const isPreAudit = posture === "pre-audit";
  const isAuditExterne = posture === "audit-externe";

  const totalScope1 = 1240;
  const totalScope2 = 830;
  const totalScope3 = 4560;
  const total = totalScope1 + totalScope2 + totalScope3;

  // Compter les alertes en mode pré-audit
  const alertesPreAudit = isPreAudit ? [
    { type: "Facteurs d'émission", count: 8, description: "FE sans source (ADEME, fournisseur...)" },
    { type: "Méthodologies absentes", count: 7, description: "Calculs sans justification" },
    { type: "Données Scope 3 sans source", count: 12, description: "Postes d'émissions non documentés" },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Évaluation carbone</h1>
          <p className="text-muted-foreground">
            Calcul et pilotage de votre empreinte carbone selon le GHG Protocol
          </p>
        </div>
        {isConseil && (
          <Button className="bg-[#0F4C3A] hover:bg-[#0A3B2E]">
            <Upload className="h-4 w-4 mr-2" />
            Importer des données
          </Button>
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
                  {alerte.count} postes
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Vue globale */}
      <Card>
        <CardHeader>
          <CardTitle>Empreinte carbone globale - Exercice 2025</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 space-y-4">
              <div className="text-center p-6 bg-[#E8F3F0] rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Total</p>
                <p className="text-4xl font-semibold text-[#0F4C3A]">{total.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-1">tCO₂e</p>
              </div>
              <div className="text-sm text-muted-foreground bg-amber-50 p-3 rounded border border-amber-200">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p>Méthodologie : GHG Protocol Corporate Standard</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-3 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-[#0F4C3A]" />
                    <span className="font-medium">Scope 1 - Émissions directes</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{totalScope1.toLocaleString()} tCO₂e</p>
                    <p className="text-sm text-muted-foreground">{((totalScope1/total)*100).toFixed(0)}%</p>
                  </div>
                </div>
                <Progress value={(totalScope1/total)*100} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-[#059669]" />
                    <span className="font-medium">Scope 2 - Émissions indirectes énergétiques</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{totalScope2.toLocaleString()} tCO₂e</p>
                    <p className="text-sm text-muted-foreground">{((totalScope2/total)*100).toFixed(0)}%</p>
                  </div>
                </div>
                <Progress value={(totalScope2/total)*100} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-[#10B981]" />
                    <span className="font-medium">Scope 3 - Autres émissions indirectes</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{totalScope3.toLocaleString()} tCO₂e</p>
                    <p className="text-sm text-muted-foreground">{((totalScope3/total)*100).toFixed(0)}%</p>
                  </div>
                </div>
                <Progress value={(totalScope3/total)*100} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Détails par scope */}
      <Card>
        <CardHeader>
          <CardTitle>Détails par scope</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="scope1" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="scope1">Scope 1</TabsTrigger>
              <TabsTrigger value="scope2">Scope 2</TabsTrigger>
              <TabsTrigger value="scope3">Scope 3</TabsTrigger>
            </TabsList>

            <TabsContent value="scope1" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Émissions directes de GES issues de sources détenues ou contrôlées
                </p>
                {isConseil && (
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un poste
                  </Button>
                )}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Poste d'émission</TableHead>
                    <TableHead>Valeur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Source</TableHead>
                    {isPreAudit && <TableHead>FE</TableHead>}
                    {isPreAudit && <TableHead>Méthodologie</TableHead>}
                    {isAuditExterne && <TableHead>Statut audit</TableHead>}
                    {isAuditExterne && <TableHead>Action</TableHead>}
                    {!isAuditExterne && <TableHead></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scope1Data.map((item) => (
                    <TableRow key={item.id} className={isPreAudit && (item.facteurEmission === "-" || item.methodo === "-" || item.methodo === "Non documentée") ? "bg-amber-50" : ""}>
                      <TableCell className="font-medium">{item.poste}</TableCell>
                      <TableCell>{item.value} {item.unit}</TableCell>
                      <TableCell>
                        <StatusBadge status={item.status as any} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.source}</TableCell>
                      {isPreAudit && (
                        <TableCell className="text-xs">
                          {item.facteurEmission === "-" || item.facteurEmission === "Estimation" ? (
                            <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300 text-xs">
                              Manquant
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">{item.facteurEmission}</span>
                          )}
                        </TableCell>
                      )}
                      {isPreAudit && (
                        <TableCell className="text-xs">
                          {item.methodo === "-" || item.methodo === "Non documentée" ? (
                            <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300 text-xs">
                              À documenter
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">{item.methodo}</span>
                          )}
                        </TableCell>
                      )}
                      {isAuditExterne && (
                        <TableCell>
                          {item.auditStatus === "valide" && (
                            <Badge className="bg-[#059669] text-white text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Validé
                            </Badge>
                          )}
                          {item.auditStatus === "reserve" && (
                            <Badge className="bg-amber-500 text-white text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Avec réserve
                            </Badge>
                          )}
                          {item.auditStatus === "invalide" && (
                            <Badge className="bg-red-600 text-white text-xs">
                              Invalide
                            </Badge>
                          )}
                        </TableCell>
                      )}
                      {isAuditExterne && (
                        <TableCell>
                          <Button variant="outline" size="sm" className="text-xs">
                            <FileCheck className="h-3 w-3 mr-1" />
                            Demander preuve
                          </Button>
                        </TableCell>
                      )}
                      {!isAuditExterne && (
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="scope2" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Émissions indirectes liées à la consommation d'énergie
                </p>
                {isConseil && (
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un poste
                  </Button>
                )}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Poste d'émission</TableHead>
                    <TableHead>Valeur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Source</TableHead>
                    {isPreAudit && <TableHead>FE</TableHead>}
                    {isPreAudit && <TableHead>Méthodologie</TableHead>}
                    {isAuditExterne && <TableHead>Statut audit</TableHead>}
                    {isAuditExterne && <TableHead>Action</TableHead>}
                    {!isAuditExterne && <TableHead></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scope2Data.map((item) => (
                    <TableRow key={item.id} className={isPreAudit && (item.facteurEmission === "-" || item.methodo === "-" || item.methodo === "Non documentée") ? "bg-amber-50" : ""}>
                      <TableCell className="font-medium">{item.poste}</TableCell>
                      <TableCell>{item.value} {item.unit}</TableCell>
                      <TableCell>
                        <StatusBadge status={item.status as any} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.source}</TableCell>
                      {isPreAudit && (
                        <TableCell className="text-xs">
                          {item.facteurEmission === "-" || item.facteurEmission === "Estimation" ? (
                            <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300 text-xs">
                              Manquant
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">{item.facteurEmission}</span>
                          )}
                        </TableCell>
                      )}
                      {isPreAudit && (
                        <TableCell className="text-xs">
                          {item.methodo === "-" || item.methodo === "Non documentée" ? (
                            <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300 text-xs">
                              À documenter
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">{item.methodo}</span>
                          )}
                        </TableCell>
                      )}
                      {isAuditExterne && (
                        <TableCell>
                          {item.auditStatus === "valide" && (
                            <Badge className="bg-[#059669] text-white text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Validé
                            </Badge>
                          )}
                          {item.auditStatus === "reserve" && (
                            <Badge className="bg-amber-500 text-white text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Avec réserve
                            </Badge>
                          )}
                          {item.auditStatus === "invalide" && (
                            <Badge className="bg-red-600 text-white text-xs">
                              Invalide
                            </Badge>
                          )}
                        </TableCell>
                      )}
                      {isAuditExterne && (
                        <TableCell>
                          <Button variant="outline" size="sm" className="text-xs">
                            <FileCheck className="h-3 w-3 mr-1" />
                            Demander preuve
                          </Button>
                        </TableCell>
                      )}
                      {!isAuditExterne && (
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="scope3" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Autres émissions indirectes de la chaîne de valeur
                </p>
                {isConseil && (
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un poste
                  </Button>
                )}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Poste d'émission</TableHead>
                    <TableHead>Valeur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Source</TableHead>
                    {isPreAudit && <TableHead>FE</TableHead>}
                    {isPreAudit && <TableHead>Méthodologie</TableHead>}
                    {isAuditExterne && <TableHead>Statut audit</TableHead>}
                    {isAuditExterne && <TableHead>Action</TableHead>}
                    {!isAuditExterne && <TableHead></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scope3Data.map((item) => (
                    <TableRow key={item.id} className={isPreAudit && (item.facteurEmission === "-" || item.methodo === "-" || item.methodo === "Non documentée") ? "bg-amber-50" : ""}>
                      <TableCell className="font-medium">{item.poste}</TableCell>
                      <TableCell>{item.value} {item.unit}</TableCell>
                      <TableCell>
                        <StatusBadge status={item.status as any} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.source}</TableCell>
                      {isPreAudit && (
                        <TableCell className="text-xs">
                          {item.facteurEmission === "-" || item.facteurEmission === "Estimation" ? (
                            <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300 text-xs">
                              Manquant
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">{item.facteurEmission}</span>
                          )}
                        </TableCell>
                      )}
                      {isPreAudit && (
                        <TableCell className="text-xs">
                          {item.methodo === "-" || item.methodo === "Non documentée" ? (
                            <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300 text-xs">
                              À documenter
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">{item.methodo}</span>
                          )}
                        </TableCell>
                      )}
                      {isAuditExterne && (
                        <TableCell>
                          {item.auditStatus === "valide" && (
                            <Badge className="bg-[#059669] text-white text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Validé
                            </Badge>
                          )}
                          {item.auditStatus === "reserve" && (
                            <Badge className="bg-amber-500 text-white text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Avec réserve
                            </Badge>
                          )}
                          {item.auditStatus === "invalide" && (
                            <Badge className="bg-red-600 text-white text-xs">
                              Invalide
                            </Badge>
                          )}
                          {item.auditStatus === "non-applicable" && (
                            <Badge variant="outline" className="text-xs">
                              N/A
                            </Badge>
                          )}
                        </TableCell>
                      )}
                      {isAuditExterne && (
                        <TableCell>
                          {item.auditStatus !== "non-applicable" && (
                            <Button variant="outline" size="sm" className="text-xs">
                              <FileCheck className="h-3 w-3 mr-1" />
                              Demander preuve
                            </Button>
                          )}
                        </TableCell>
                      )}
                      {!isAuditExterne && (
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Hypothèses et méthodologie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Hypothèses et méthodologie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#059669] mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Facteurs d'émission</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Base Carbone ADEME v23.0 (décembre 2024)
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#059669] mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Périmètre organisationnel</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Contrôle opérationnel - 100% des émissions des sites contrôlés
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#059669] mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Période de référence</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Année fiscale 2025 (01/01/2025 - 31/12/2025)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transparence des calculs */}
      <Card className="border-2 border-[#0F4C3A]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-[#0F4C3A]" />
            Synthèse avec transparence des calculs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Scope 1 */}
            <div className="border rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm text-gray-600">Total Scope 1</div>
                <CalculationTransparency 
                  indicatorCode="E1_CO2_SCOPE1" 
                  displayedValue={totalScope1}
                  posture={posture}
                  size="md"
                />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#0F4C3A]">{totalScope1.toLocaleString()}</span>
                <span className="text-lg text-gray-500">tCO2e</span>
              </div>
              <div className="mt-2">
                <Badge className="bg-green-100 text-green-800 text-xs">
                  📊 Données mesurées
                </Badge>
              </div>
            </div>

            {/* Total */}
            <div className="border rounded-lg p-4 bg-[#E8F3F0]">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm text-gray-600">Empreinte totale</div>
                <CalculationTransparency 
                  indicatorCode="E1_CO2_TOTAL" 
                  displayedValue={total}
                  posture={posture}
                  size="md"
                />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#0F4C3A]">{total.toLocaleString()}</span>
                <span className="text-lg text-gray-500">tCO2e</span>
              </div>
              <div className="mt-2">
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  📊📐 Données mixtes
                </Badge>
              </div>
            </div>

            {/* Intensité */}
            <div className="border rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm text-gray-600">Intensité carbone</div>
                <CalculationTransparency 
                  indicatorCode="E1_INTENSITY" 
                  displayedValue={42.7}
                  posture={posture}
                  size="md"
                />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#0F4C3A]">42.7</span>
                <span className="text-lg text-gray-500">tCO2e/M€</span>
              </div>
              <div className="mt-2">
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  🧮 Calculé
                </Badge>
              </div>
            </div>

          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
            <div className="text-sm font-medium text-blue-900 mb-1">
              💡 Nouvelle fonctionnalité : Transparence des calculs
            </div>
            <div className="text-xs text-blue-800">
              Cliquez sur l'icône "i" à côté de chaque indicateur pour voir le détail complet du calcul, les données sources, les facteurs d'émission ADEME utilisés et l'historique des modifications.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}