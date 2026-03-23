import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { 
  FileSpreadsheet,
  Download,
  Upload,
  Plus,
  CheckCircle2,
  AlertCircle,
  Eye,
  Calculator,
  TrendingUp,
  Package,
  Filter,
  Search
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { toast } from "sonner";

type PostureType = "conseil" | "pre-audit" | "audit-externe";

interface StructureIndicateursProps {
  posture?: PostureType;
  dossierId?: string;
}

// Structure des indicateurs par catégorie E/S/G
const indicatorStructure = [
  {
    category: "E",
    name: "Environnement",
    icon: "🌱",
    themes: [
      {
        code: "E-CLIMAT",
        name: "Climat et Énergie",
        indicators: 24,
        completed: 18,
        sources: ["Factures énergie", "Bilan GES"],
      },
      {
        code: "E-EAU",
        name: "Eau et Pollution",
        indicators: 12,
        completed: 10,
        sources: ["Factures eau", "Analyses"],
      },
      {
        code: "E-DECHETS",
        name: "Déchets et Économie circulaire",
        indicators: 15,
        completed: 12,
        sources: ["BSD", "Factures prestataires"],
      },
    ],
  },
  {
    category: "S",
    name: "Social",
    icon: "👥",
    themes: [
      {
        code: "S-EMPLOI",
        name: "Emploi et Conditions de travail",
        indicators: 28,
        completed: 24,
        sources: ["BDES", "RH", "DSN"],
      },
      {
        code: "S-SANTE",
        name: "Santé et Sécurité",
        indicators: 16,
        completed: 14,
        sources: ["Registre SST", "DUERP"],
      },
      {
        code: "S-DIVERSITE",
        name: "Diversité et Égalité",
        indicators: 12,
        completed: 10,
        sources: ["Index égalité", "Bilan social"],
      },
    ],
  },
  {
    category: "G",
    name: "Gouvernance",
    icon: "🏛️",
    themes: [
      {
        code: "G-ETHIQUE",
        name: "Éthique et Conformité",
        indicators: 10,
        completed: 10,
        sources: ["Registre légal", "Codes de conduite"],
      },
      {
        code: "G-CONSEIL",
        name: "Conseil d'administration",
        indicators: 8,
        completed: 8,
        sources: ["PV CA", "Statuts"],
      },
    ],
  },
];

export function StructureIndicateurs({ posture = "conseil", dossierId }: StructureIndicateursProps) {
  const [activeCategory, setActiveCategory] = useState<"E" | "S" | "G">("E");
  const [searchTerm, setSearchTerm] = useState("");

  const isConseil = posture === "conseil";
  const isAuditExterne = posture === "audit-externe";

  const handleImportExcel = () => {
    toast.info("Import Excel", {
      description: "Sélectionnez votre fichier Excel pour mapper automatiquement les données"
    });
  };

  const handleExportTemplate = () => {
    toast.success("Template téléchargé", {
      description: "Template Excel avec la structure complète des données"
    });
  };

  const handleAddCustomIndicator = () => {
    toast.info("Donnée personnalisée", {
      description: "Ajout d'une donnée spécifique à votre activité"
    });
  };

  // État vide
  const hasNoData = indicatorStructure.every(cat => 
    cat.themes.every(theme => theme.completed === 0)
  );

  if (hasNoData) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground mb-2">
              Structure des données
            </h1>
            <p className="text-muted-foreground">
              Organisez vos données ESG par catégories et thématiques métier
            </p>
          </div>
        </div>

        {/* État vide */}
        <Card className="border-2 border-dashed border-[#059669]">
          <CardContent className="p-12">
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-[#E8F3F0] rounded-full flex items-center justify-center">
                <FileSpreadsheet className="h-8 w-8 text-[#059669]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Aucune structure de données définie
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Importez votre structure depuis Excel ou sélectionnez un programme thématique pour définir
                  les données à collecter.
                </p>
              </div>

              {isConseil && (
                <div className="flex gap-3 justify-center flex-wrap">
                  <Button 
                    className="bg-[#059669] hover:bg-[#047857]"
                    onClick={handleImportExcel}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Importer ma structure Excel
                  </Button>
                  <Button variant="outline" onClick={handleExportTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger un template
                  </Button>
                  <Button variant="outline">
                    <Package className="h-4 w-4 mr-2" />
                    Choisir un programme
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info sur les packs */}
        <Card className="border-[#059669] bg-gradient-to-r from-[#E8F3F0] to-white">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-[#059669] p-3 rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Utilisez les programmes thématiques</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Les programmes contiennent des structures de données pré-configurées selon votre secteur
                  (Client principal, Banque, Questionnaire, etc.).
                </p>
                <Button variant="outline" size="sm">
                  <Package className="h-4 w-4 mr-2" />
                  Explorer les programmes disponibles
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // État avec données
  const currentCategory = indicatorStructure.find(c => c.category === activeCategory);
  const totalIndicators = indicatorStructure.reduce(
    (acc, cat) => acc + cat.themes.reduce((a, t) => a + t.indicators, 0), 
    0
  );
  const totalCompleted = indicatorStructure.reduce(
    (acc, cat) => acc + cat.themes.reduce((a, t) => a + t.completed, 0), 
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            Structure des données
          </h1>
          <p className="text-muted-foreground">
            Organisez vos données ESG par catégories et thématiques métier
          </p>
        </div>
        {isConseil && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button 
              className="bg-[#059669] hover:bg-[#047857]"
              onClick={handleAddCustomIndicator}
            >
              <Plus className="h-4 w-4 mr-2" />
              Donnée personnalisée
            </Button>
          </div>
        )}
        {isAuditExterne && (
          <Badge className="bg-orange-500 text-white">
            <Eye className="h-3 w-3 mr-1" />
            Mode Lecture seule
          </Badge>
        )}
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Données totales</p>
                <p className="text-3xl font-semibold">{totalIndicators}</p>
              </div>
              <div className="bg-[#E8F3F0] p-3 rounded-lg">
                <Calculator className="h-5 w-5 text-[#0F4C3A]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground">Collectés</p>
              <p className="text-3xl font-semibold">{totalCompleted}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((totalCompleted / totalIndicators) * 100)}% complétés
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground">Sources Excel</p>
              <p className="text-3xl font-semibold">8</p>
              <p className="text-xs text-muted-foreground mt-1">Fichiers importés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground">Preuves</p>
              <p className="text-3xl font-semibold">42</p>
              <p className="text-xs text-muted-foreground mt-1">Documents joints</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une donnée..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Onglets par catégorie E/S/G */}
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as "E" | "S" | "G")}>
        <TabsList className="grid w-full grid-cols-3">
          {indicatorStructure.map((cat) => {
            const catTotal = cat.themes.reduce((a, t) => a + t.indicators, 0);
            const catCompleted = cat.themes.reduce((a, t) => a + t.completed, 0);
            const percentage = Math.round((catCompleted / catTotal) * 100);

            return (
              <TabsTrigger key={cat.category} value={cat.category} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat.icon}</span>
                  <span>{cat.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {catCompleted}/{catTotal} ({percentage}%)
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {indicatorStructure.map((cat) => (
          <TabsContent key={cat.category} value={cat.category} className="space-y-4">
            {cat.themes.map((theme) => {
              const percentage = Math.round((theme.completed / theme.indicators) * 100);
              
              return (
                <Card key={theme.code}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="font-mono">
                            {theme.code}
                          </Badge>
                          <Badge 
                            className={
                              percentage === 100 
                                ? "bg-green-100 text-green-800"
                                : percentage >= 50
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {percentage}% complété
                          </Badge>
                        </div>
                        <CardTitle>{theme.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {theme.indicators} données • Sources: {theme.sources.join(", ")}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Voir les données
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progression</span>
                        <span className="font-medium">
                          {theme.completed}/{theme.indicators}
                        </span>
                      </div>
                      <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full ${
                            percentage === 100 
                              ? "bg-[#059669]"
                              : percentage >= 50
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        ))}
      </Tabs>

      {/* Action rapide : Import Excel */}
      <Card className="border-[#059669] bg-gradient-to-r from-[#E8F3F0] to-white">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="bg-[#059669] p-3 rounded-lg">
              <FileSpreadsheet className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Import Excel automatique</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Importez vos données depuis Excel avec mapping automatique vers les données. 
                Le système reconnaît les structures standard (BDES, GRI, bilan GES, etc.).
              </p>
              <Button 
                className="bg-[#059669] hover:bg-[#047857]"
                onClick={handleImportExcel}
              >
                <Upload className="h-4 w-4 mr-2" />
                Importer mes données Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
