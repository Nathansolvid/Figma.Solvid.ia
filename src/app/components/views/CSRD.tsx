import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { CalculationTransparency } from "@/app/components/CalculationTransparency";
import { StatusBadge } from "@/app/components/StatusBadge";
import { 
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  Download,
  Calendar,
  Search,
  Info
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Progress } from "@/app/components/ui/progress";

type PostureType = "conseil" | "pre-audit" | "audit-externe";
type ParcoursType = "csrd-obligatoire" | "esg-structure";

interface CSRDProps {
  posture: PostureType;
  parcours: ParcoursType;
}

const esrsStandards = [
  {
    code: "ESRS E1",
    name: "Changement climatique",
    status: "partial",
    completion: 82,
    required: 45,
    complete: 37,
    missing: 8,
    criticality: "high",
  },
  {
    code: "ESRS E2",
    name: "Pollution",
    status: "complete",
    completion: 100,
    required: 18,
    complete: 18,
    missing: 0,
    criticality: "medium",
  },
  {
    code: "ESRS E3",
    name: "Ressources aquatiques et marines",
    status: "partial",
    completion: 71,
    required: 14,
    complete: 10,
    missing: 4,
    criticality: "medium",
  },
  {
    code: "ESRS E4",
    name: "Biodiversité et écosystèmes",
    status: "partial",
    completion: 45,
    required: 22,
    complete: 10,
    missing: 12,
    criticality: "low",
  },
  {
    code: "ESRS E5",
    name: "Utilisation des ressources et économie circulaire",
    status: "complete",
    completion: 94,
    required: 16,
    complete: 15,
    missing: 1,
    criticality: "medium",
  },
  {
    code: "ESRS S1",
    name: "Personnel de l'entreprise",
    status: "partial",
    completion: 76,
    required: 38,
    complete: 29,
    missing: 9,
    criticality: "high",
  },
  {
    code: "ESRS S2",
    name: "Travailleurs de la chaîne de valeur",
    status: "partial",
    completion: 58,
    required: 12,
    complete: 7,
    missing: 5,
    criticality: "medium",
  },
  {
    code: "ESRS S3",
    name: "Communautés affectées",
    status: "partial",
    completion: 50,
    required: 8,
    complete: 4,
    missing: 4,
    criticality: "low",
  },
  {
    code: "ESRS S4",
    name: "Consommateurs et utilisateurs finaux",
    status: "missing",
    completion: 0,
    required: 10,
    complete: 0,
    missing: 10,
    criticality: "low",
  },
  {
    code: "ESRS G1",
    name: "Conduite des affaires",
    status: "complete",
    completion: 91,
    required: 23,
    complete: 21,
    missing: 2,
    criticality: "high",
  },
];

const requirementsE1 = [
  { id: 1, requirement: "Objectifs de réduction GES", dataPoints: "Validé", status: "validated" },
  { id: 2, requirement: "Émissions Scope 1, 2, 3", dataPoints: "Partiel (Scope 3.8 manquant)", status: "partial" },
  { id: 3, requirement: "Analyse de matérialité climatique", dataPoints: "Complet", status: "complete" },
  { id: 4, requirement: "Plan de transition bas-carbone", dataPoints: "En cours de finalisation", status: "partial" },
  { id: 5, requirement: "Gouvernance climat", dataPoints: "Validé", status: "validated" },
  { id: 6, requirement: "Risques physiques et de transition", dataPoints: "Manquant", status: "missing" },
  { id: 7, requirement: "Opportunités liées au climat", dataPoints: "Complet", status: "complete" },
];

export function CSRD({ posture, parcours }: CSRDProps) {
  const totalRequired = esrsStandards.reduce((acc, std) => acc + std.required, 0);
  const totalComplete = esrsStandards.reduce((acc, std) => acc + std.complete, 0);
  const overallCompletion = Math.round((totalComplete / totalRequired) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Conformité CSRD / ESRS</h1>
          <p className="text-muted-foreground">
            Pilotage de votre conformité à la directive européenne CSRD
          </p>
        </div>
        <Button className="bg-[#0F4C3A] hover:bg-[#0A3B2E]">
          <FileText className="h-4 w-4 mr-2" />
          Rapport de conformité
        </Button>
      </div>

      {/* Vue d'ensemble */}
      <Card className="border-[#059669]">
        <CardHeader>
          <CardTitle>Vue d'ensemble de la conformité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 text-center p-6 bg-[#E8F3F0] rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Conformité globale</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-5xl font-semibold text-[#0F4C3A] mb-1">{overallCompletion}%</p>
                <CalculationTransparency 
                  indicatorCode="CSRD_COMPLIANCE_RATE"
                  displayedValue={overallCompletion}
                  posture="conseil"
                  size="md"
                />
              </div>
              <Progress value={overallCompletion} className="h-2 mt-3" />
              <p className="text-xs text-muted-foreground mt-2">
                {totalComplete} / {totalRequired} exigences
              </p>
            </div>
            <div className="md:col-span-3 grid grid-cols-3 gap-4">
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-[#059669]" />
                  <span className="text-sm font-medium">Conformes</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-semibold">{totalComplete}</p>
                  <CalculationTransparency 
                    indicatorCode="CSRD_COMPLIANT_COUNT"
                    displayedValue={totalComplete}
                    posture="conseil"
                    size="sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Exigences validées</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-[#F59E0B]" />
                  <span className="text-sm font-medium">Partiels</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-semibold">
                    {esrsStandards.filter(s => s.status === 'partial').length}
                  </p>
                  <CalculationTransparency 
                    indicatorCode="CSRD_PARTIAL_COUNT"
                    displayedValue={esrsStandards.filter(s => s.status === 'partial').length}
                    posture="conseil"
                    size="sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Standards en cours</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-[#DC2626]" />
                  <span className="text-sm font-medium">Critiques</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-semibold">
                    {esrsStandards.filter(s => s.criticality === 'high' && s.status !== 'complete').length}
                  </p>
                  <CalculationTransparency 
                    indicatorCode="CSRD_CRITICAL_COUNT"
                    displayedValue={esrsStandards.filter(s => s.criticality === 'high' && s.status !== 'complete').length}
                    posture="conseil"
                    size="sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">À traiter en priorité</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Standards ESRS */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Standards ESRS</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher un standard..." 
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">Tous ({esrsStandards.length})</TabsTrigger>
              <TabsTrigger value="environmental">Environnement (5)</TabsTrigger>
              <TabsTrigger value="social">Social (4)</TabsTrigger>
              <TabsTrigger value="governance">Gouvernance (1)</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Standard</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Progression</TableHead>
                    <TableHead>Exigences</TableHead>
                    <TableHead>Criticité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {esrsStandards.map((standard) => (
                    <TableRow key={standard.code} className={standard.criticality === 'high' ? 'bg-amber-50/30' : ''}>
                      <TableCell>
                        <span className="font-mono font-semibold text-[#0F4C3A]">{standard.code}</span>
                      </TableCell>
                      <TableCell className="font-medium max-w-xs">{standard.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="space-y-1 min-w-[120px]">
                            <div className="flex justify-between text-xs">
                              <span>{standard.completion}%</span>
                            </div>
                            <Progress value={standard.completion} className="h-1.5" />
                          </div>
                          <CalculationTransparency 
                            indicatorCode={`ESRS_${standard.code.replace(/\s+/g, '_')}_COMPLETION`}
                            displayedValue={standard.completion}
                            posture={posture}
                            size="sm"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="text-[#059669] font-medium">{standard.complete}</span>
                          <span className="text-muted-foreground"> / {standard.required}</span>
                          {standard.missing > 0 && (
                            <span className="text-[#DC2626] ml-2">({standard.missing} manquants)</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded ${
                          standard.criticality === 'high' 
                            ? 'bg-red-100 text-red-800'
                            : standard.criticality === 'medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {standard.criticality === 'high' ? 'Élevée' : standard.criticality === 'medium' ? 'Moyenne' : 'Faible'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge 
                          status={standard.status === 'complete' ? 'complete' : standard.status === 'partial' ? 'partial' : 'missing'} 
                        />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="environmental">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Standard</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Progression</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {esrsStandards.filter(s => s.code.startsWith('ESRS E')).map((standard) => (
                    <TableRow key={standard.code}>
                      <TableCell>
                        <span className="font-mono font-semibold text-[#0F4C3A]">{standard.code}</span>
                      </TableCell>
                      <TableCell className="font-medium">{standard.name}</TableCell>
                      <TableCell>
                        <Progress value={standard.completion} className="h-1.5 w-32" />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={standard.status as any} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="social">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Standard</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Progression</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {esrsStandards.filter(s => s.code.startsWith('ESRS S')).map((standard) => (
                    <TableRow key={standard.code}>
                      <TableCell>
                        <span className="font-mono font-semibold text-[#0F4C3A]">{standard.code}</span>
                      </TableCell>
                      <TableCell className="font-medium">{standard.name}</TableCell>
                      <TableCell>
                        <Progress value={standard.completion} className="h-1.5 w-32" />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={standard.status as any} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="governance">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Standard</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Progression</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {esrsStandards.filter(s => s.code.startsWith('ESRS G')).map((standard) => (
                    <TableRow key={standard.code}>
                      <TableCell>
                        <span className="font-mono font-semibold text-[#0F4C3A]">{standard.code}</span>
                      </TableCell>
                      <TableCell className="font-medium">{standard.name}</TableCell>
                      <TableCell>
                        <Progress value={standard.completion} className="h-1.5 w-32" />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={standard.status as any} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Exemple de détail : ESRS E1 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="font-mono text-[#0F4C3A]">ESRS E1</span>
            <span>—</span>
            <span>Changement climatique</span>
            <StatusBadge status="partial" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">Standard critique</p>
              <p className="text-sm text-muted-foreground">
                Ce standard est obligatoire pour toutes les entreprises soumises à la CSRD. 
                Complétion requise avant le 30/06/2026.
              </p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exigence</TableHead>
                <TableHead>Points de données</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requirementsE1.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.requirement}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{req.dataPoints}</TableCell>
                  <TableCell>
                    <StatusBadge status={req.status as any} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}