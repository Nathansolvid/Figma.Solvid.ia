// ============================================================================
// DONNÉES ESG - Refonte Phase 6
// ============================================================================
// Vue de gestion des indicateurs ESG par piliers E/S/G
// Repositionné : terminologie standard, onglets E/S/G, intégration Phase 6

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  Search,
  Filter,
  Upload,
  Plus,
  Leaf,
  Users,
  Building2,
  Eye,
  ChevronRight,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { TransparencyModal } from "@/app/components/TransparencyModal";
import { indicators as rawIndicators, type Indicator as RawIndicator } from "@/data/transparencyData";
import { useAllIndicators } from "@/hooks/useAllIndicators"; // 🆕 Import real indicators hook

// Type étendu pour la vue avec valeurs mockées
interface ViewIndicator {
  id: string;
  code: string;
  name: string;
  category: "E" | "S" | "G";
  value: number | string;
  unit: string;
  source: string;
  csrdRef: string;
  status: "validated" | "complete" | "required" | "missing";
  required: boolean;
}

// Convertir les indicateurs de transparencyData en indicateurs de vue
function enrichIndicatorForESGView(indicator: RawIndicator, index: number): ViewIndicator {
  const mockValues: Record<string, number | string> = {
    'ind-e1-co2-total': 14540,
    'ind-e1-co2-scope1': 1240,
    'ind-e1-co2-scope2': 830,
    'ind-e1-co2-scope3': 4560,
    'ind-e1-energy-total': 3570,
    'ind-e2-pollution-water': 2400,
    'ind-e3-water-consumption': "12 450",
    'ind-e4-biodiversity-impact': "-",
    'ind-e5-waste-total': "3.2",
    'ind-e5-waste-recycling': "68%",
    'ind-s1-workforce-total': 187,
    'ind-s1-workforce-women': "45%",
    'ind-s1-turnover': "78%",
    'ind-s2-supply-chain-audits': 18,
    'ind-s3-community-investment': 125000,
    'ind-s4-consumer-satisfaction': "-",
    'ind-g1-board-women': "42%",
    'ind-g1-board-meetings': 12,
    'ind-g2-business-ethics-trainings': 24,
  };

  const sources: string[] = [
    "Factures eau",
    "Contrats énergie",
    "Registre déchets",
    "Prestataire déchets",
    "Estimation",
    "BDES 2025",
    "RH",
    "Registre légal",
  ];

  const csrdRefs: string[] = ["ESRS E3", "ESRS E1", "ESRS E5", "ESRS E4", "ESRS S1", "ESRS S2", "ESRS G1"];

  const statuses: Array<"validated" | "complete" | "required" | "missing"> = [
    "validated",
    "validated",
    "complete",
    "complete",
    "missing",
    "required",
  ];

  return {
    id: indicator.id,
    code: indicator.code,
    name: indicator.name,
    category: indicator.pillar as "E" | "S" | "G",
    value: mockValues[indicator.id] || Math.round(Math.random() * 1000 + 100),
    unit: indicator.unit,
    source: sources[index % sources.length],
    csrdRef: csrdRefs[index % csrdRefs.length],
    status: statuses[index % statuses.length],
    required: index % 3 !== 0,
  };
}

interface DonneesESGProps {
  posture?: string;
  parcours?: string;
}

export function DonneesESG({ posture, parcours }: DonneesESGProps = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndicator, setSelectedIndicator] = useState<ViewIndicator | null>(null);

  // 🆕 Charger les vraies données depuis IndexedDB
  const { indicators: backendIndicators = [], loading, error } = useAllIndicators();

  // Mapper les indicateurs backend vers le format ViewIndicator
  const allIndicators = useMemo(() => {
    return backendIndicators.map((ind: any) => ({
      id: ind.id,
      code: ind.code,
      name: ind.name,
      category: ind.category as "E" | "S" | "G",
      value: ind.value ?? "-",
      unit: ind.unit ?? "",
      source: ind.source ?? "Non renseigné",
      csrdRef: ind.csrdRef ?? "-",
      status: (ind.status === "provided" ? "validated" : 
               ind.status === "missing" ? "missing" : "required") as "validated" | "complete" | "required" | "missing",
      required: ind.requirementLevel === "MANDATORY",
    }));
  }, [backendIndicators]);

  // Séparer par catégorie
  const environmentalData = allIndicators.filter((i) => i.category === "E");
  const socialData = allIndicators.filter((i) => i.category === "S");
  const governanceData = allIndicators.filter((i) => i.category === "G");

  // Statistiques
  const stats = {
    environmental: {
      total: environmentalData.length,
      completed: environmentalData.filter((i) => i.status === "validated" || i.status === "complete")
        .length,
    },
    social: {
      total: socialData.length,
      completed: socialData.filter((i) => i.status === "validated" || i.status === "complete").length,
    },
    governance: {
      total: governanceData.length,
      completed: governanceData.filter((i) => i.status === "validated" || i.status === "complete")
        .length,
    },
  };

  const filterIndicators = (indicators: ViewIndicator[]) => {
    if (!searchQuery) return indicators;
    const query = searchQuery.toLowerCase();
    return indicators.filter(
      (ind) =>
        ind.name.toLowerCase().includes(query) ||
        ind.code.toLowerCase().includes(query) ||
        ind.source.toLowerCase().includes(query)
    );
  };

  // 🆕 Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#059669] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des indicateurs...</p>
        </div>
      </div>
    );
  }

  // 🆕 Empty state si aucun indicateur
  if (!loading && allIndicators.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Données ESG</h1>
          <p className="text-muted-foreground">
            Gestion de vos indicateurs ESG par piliers Environnement, Social, Gouvernance
          </p>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Leaf className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun indicateur disponible</h3>
              <p className="text-muted-foreground mb-4">
                Créez votre premier pack pour commencer à suivre vos indicateurs ESG
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Données ESG</h1>
          <p className="text-muted-foreground">
            Gestion de vos indicateurs ESG par piliers Environnement, Social, Gouvernance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un indicateur
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Environnement</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.environmental.completed}/{stats.environmental.total}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Leaf className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Indicateurs complétés</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Social</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.social.completed}/{stats.social.total}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Indicateurs complétés</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gouvernance</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.governance.completed}/{stats.governance.total}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Indicateurs complétés</p>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un indicateur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Onglets par pilier */}
      <Tabs defaultValue="environmental" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="environmental" className="flex items-center gap-2">
            <Leaf className="h-4 w-4" />
            Environnement
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Social
          </TabsTrigger>
          <TabsTrigger value="governance" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Gouvernance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="environmental">
          <IndicatorTable
            indicators={filterIndicators(environmentalData)}
            onViewDetails={setSelectedIndicator}
          />
        </TabsContent>

        <TabsContent value="social">
          <IndicatorTable
            indicators={filterIndicators(socialData)}
            onViewDetails={setSelectedIndicator}
          />
        </TabsContent>

        <TabsContent value="governance">
          <IndicatorTable
            indicators={filterIndicators(governanceData)}
            onViewDetails={setSelectedIndicator}
          />
        </TabsContent>
      </Tabs>

      {/* Transparency Modal */}
      {selectedIndicator && (
        <TransparencyModal
          open={!!selectedIndicator}
          onOpenChange={(open) => !open && setSelectedIndicator(null)}
          indicatorId={selectedIndicator.id}
          indicatorName={selectedIndicator.name}
          indicatorValue={
            typeof selectedIndicator.value === "number" ? selectedIndicator.value : undefined
          }
          indicatorUnit={selectedIndicator.unit}
        />
      )}
    </div>
  );
}

// ============================================================================
// INDICATOR TABLE COMPONENT
// ============================================================================

interface IndicatorTableProps {
  indicators: ViewIndicator[];
  onViewDetails: (indicator: ViewIndicator) => void;
}

function IndicatorTable({ indicators, onViewDetails }: IndicatorTableProps) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    validated: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Validé" },
    complete: { bg: "bg-green-100", text: "text-green-700", label: "Complet" },
    required: { bg: "bg-orange-100", text: "text-orange-700", label: "Requis" },
    missing: { bg: "bg-red-100", text: "text-red-700", label: "Manquant" },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Indicateurs par pilier</CardTitle>
      </CardHeader>
      <CardContent>
        {indicators.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun indicateur trouvé</h3>
            <p className="text-muted-foreground">Essayez une autre recherche</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Indicateur</TableHead>
                <TableHead className="text-right">Valeur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Référence CSRD</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {indicators.map((indicator) => {
                const status = statusConfig[indicator.status];
                return (
                  <TableRow key={indicator.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{indicator.name}</div>
                        {indicator.required && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            Requis
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-semibold">
                        {indicator.value !== "-" ? (
                          <>
                            {typeof indicator.value === "number"
                              ? indicator.value.toLocaleString("fr-FR")
                              : indicator.value}{" "}
                            {indicator.unit !== "dimensionless" ? indicator.unit : ""}
                          </>
                        ) : (
                          "-"
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${status.bg} ${status.text}`}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{indicator.source}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{indicator.csrdRef}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => onViewDetails(indicator)}
                        variant="ghost"
                        size="sm"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}