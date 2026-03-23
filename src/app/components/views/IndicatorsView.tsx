// ============================================================================
// INDICATORS VIEW - Phase 6
// ============================================================================
// Vue des indicateurs ESG avec ouverture du TransparencyModal

import { useState, useMemo, useEffect } from "react";
import { TrendingUp, Search, Filter, Plus, Info, Eye, FolderOpen, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { TransparencyModal } from "@/app/components/TransparencyModal";
import { dataProvider } from "@/services/dataProvider";
import { Link } from "react-router-dom";

// Type pour les indicateurs chargés depuis IndexedDB
interface ViewIndicator {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: "E" | "S" | "G";
  value?: number;
  unit: string;
  status: "missing" | "provided" | "in_progress" | "needs_review" | "accepted" | "rejected";
  packId: string;
  packName?: string;
  folderId: string;
  hasEvidence: boolean;
  evidenceCount: number;
  requirementLevel: "MANDATORY" | "RECOMMENDED";
}

interface IndicatorsViewProps {
  dossierId?: string;
  packId?: string;
}

export default function IndicatorsView({ dossierId, packId }: IndicatorsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIndicator, setSelectedIndicator] = useState<ViewIndicator | null>(null);
  const [indicators, setIndicators] = useState<ViewIndicator[]>([]);
  const [packs, setPacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🆕 Charger les packs et indicateurs depuis IndexedDB
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Charger tous les packs
        const allPacks = await dataProvider.store.list('pack_instances');
        setPacks(allPacks);

        if (allPacks.length === 0) {
          // Aucun pack trouvé - afficher empty state
          setIndicators([]);
          setLoading(false);
          return;
        }

        // Charger tous les indicateurs
        const allIndicators = await dataProvider.store.list('indicators');

        // Enrichir les indicateurs avec le nom du pack
        const enrichedIndicators: ViewIndicator[] = allIndicators.map((ind: any) => {
          const pack = allPacks.find((p: any) => p.id === ind.packId);
          
          return {
            id: ind.id,
            code: ind.code,
            name: ind.name,
            description: ind.description,
            category: ind.category,
            value: ind.value,
            unit: ind.unit || '',
            status: ind.status || 'missing',
            packId: ind.packId,
            packName: pack?.name || 'Pack inconnu',
            folderId: ind.folderId,
            hasEvidence: ind.hasEvidence || false,
            evidenceCount: ind.evidenceCount || 0,
            requirementLevel: ind.requirementLevel || 'MANDATORY',
          };
        });

        setIndicators(enrichedIndicators);
      } catch (error) {
        console.error('❌ Error loading indicators:', error);
        setIndicators([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filtrage des indicateurs
  const filteredIndicators = useMemo(() => {
    return indicators.filter((indicator) => {
      // Filtre de recherche
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          indicator.name.toLowerCase().includes(query) ||
          indicator.code.toLowerCase().includes(query) ||
          indicator.description?.toLowerCase().includes(query) ||
          indicator.packName?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Filtre de catégorie
      if (categoryFilter !== "all" && indicator.category !== categoryFilter) {
        return false;
      }

      // Filtre de statut
      if (statusFilter !== "all" && indicator.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [indicators, searchQuery, categoryFilter, statusFilter]);

  // Statistiques
  const stats = useMemo(() => {
    return {
      total: indicators.length,
      environmental: indicators.filter((i) => i.category === "E").length,
      social: indicators.filter((i) => i.category === "S").length,
      governance: indicators.filter((i) => i.category === "G").length,
      provided: indicators.filter((i) => i.status === "provided").length,
      inProgress: indicators.filter((i) => i.status === "in_progress").length,
      missing: indicators.filter((i) => i.status === "missing").length,
    };
  }, [indicators]);

  // 🆕 Empty state si aucun pack créé
  if (!loading && packs.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Indicateurs ESG</h1>
            <p className="text-muted-foreground">
              Suivez et gérez vos indicateurs ESG avec traçabilité complète
            </p>
          </div>
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <FolderOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Aucun indicateur pour le moment</h3>
            <p className="text-muted-foreground text-center max-w-md mb-8">
              Créez votre premier pack pour commencer à suivre vos indicateurs ESG et bénéficier d'une traçabilité complète
            </p>
            <div className="flex gap-4">
              <Link to="/dashboard">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour au Dashboard
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un pack
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-16">
          <div className="animate-pulse text-muted-foreground">Chargement des indicateurs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Indicateurs ESG</h1>
          <p className="text-muted-foreground">
            {indicators.length} indicateur{indicators.length > 1 ? 's' : ''} disponible{indicators.length > 1 ? 's' : ''} - Données audit-ready avec traçabilité complète
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Environnement</p>
                <p className="text-2xl font-bold">{stats.environmental}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600">E</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Social</p>
                <p className="text-2xl font-bold">{stats.social}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">S</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gouvernance</p>
                <p className="text-2xl font-bold">{stats.governance}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-purple-600">G</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fournis</p>
                <p className="text-2xl font-bold">{stats.provided}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un indicateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filtre Catégorie */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="E">Environnement (E)</SelectItem>
                <SelectItem value="S">Social (S)</SelectItem>
                <SelectItem value="G">Gouvernance (G)</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtre Statut */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="missing">Manquant</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="provided">Fourni</SelectItem>
                <SelectItem value="accepted">Accepté</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des indicateurs */}
      <div className="grid grid-cols-1 gap-4">
        {filteredIndicators.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Info className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun indicateur trouvé</h3>
              <p className="text-muted-foreground text-center">
                Essayez de modifier vos critères de recherche
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredIndicators.map((indicator) => (
            <IndicatorCard
              key={indicator.id}
              indicator={indicator}
              onViewDetails={() => setSelectedIndicator(indicator)}
            />
          ))
        )}
      </div>

      {/* Transparency Modal */}
      {selectedIndicator && (
        <TransparencyModal
          open={!!selectedIndicator}
          onOpenChange={(open) => !open && setSelectedIndicator(null)}
          indicatorId={selectedIndicator.id}
          indicatorName={selectedIndicator.name}
          indicatorValue={selectedIndicator.value || 0}
          indicatorUnit={selectedIndicator.unit}
        />
      )}
    </div>
  );
}

// Named export for compatibility
export { IndicatorsView };

// ============================================================================
// INDICATOR CARD COMPONENT
// ============================================================================

interface IndicatorCardProps {
  indicator: ViewIndicator;
  onViewDetails: () => void;
}

function IndicatorCard({ indicator, onViewDetails }: IndicatorCardProps) {
  const statusConfig = {
    missing: { label: "Manquant", color: "bg-gray-100 text-gray-700" },
    in_progress: { label: "En cours", color: "bg-blue-100 text-blue-700" },
    provided: { label: "Fourni", color: "bg-green-100 text-green-700" },
    needs_review: { label: "À réviser", color: "bg-orange-100 text-orange-700" },
    accepted: { label: "Accepté", color: "bg-emerald-100 text-emerald-700" },
    rejected: { label: "Rejeté", color: "bg-red-100 text-red-700" },
  };

  const categoryConfig = {
    E: { label: "Environnement", color: "bg-green-100 text-green-700" },
    S: { label: "Social", color: "bg-blue-100 text-blue-700" },
    G: { label: "Gouvernance", color: "bg-purple-100 text-purple-700" },
  };

  const status = statusConfig[indicator.status] || statusConfig.missing;
  const category = categoryConfig[indicator.category];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={category.color}>{indicator.category}</Badge>
              <Badge variant="outline" className="font-mono text-xs">
                {indicator.code}
              </Badge>
              {indicator.requirementLevel === 'MANDATORY' && (
                <Badge variant="outline" className="text-red-600 border-red-200">
                  Obligatoire
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold mb-1">{indicator.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Pack : {indicator.packName}
            </p>
            {indicator.description && (
              <p className="text-sm text-muted-foreground mb-3">
                {indicator.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge className={status.color}>{status.label}</Badge>
              </div>
              {indicator.value !== undefined && (
                <div className="text-muted-foreground">
                  Valeur : <span className="font-semibold text-foreground">{indicator.value} {indicator.unit}</span>
                </div>
              )}
              {indicator.hasEvidence && (
                <div className="text-muted-foreground">
                  {indicator.evidenceCount} preuve{indicator.evidenceCount > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onViewDetails}>
            <Eye className="h-4 w-4 mr-2" />
            Détails
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
