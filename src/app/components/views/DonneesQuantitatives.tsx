// ============================================================================
// INDICATEURS CLÉS - Refonte Phase 6
// ============================================================================
// Vue des indicateurs ESG avec ouverture du TransparencyModal
// Repositionné : terminologie E/S/G standard, intégration Phase 6

import { useState, useMemo } from "react";
import { TrendingUp, Search, Filter, Plus, Info, Eye, Calculator, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { TransparencyModal } from "@/app/components/TransparencyModal";
import { useAllIndicators } from "@/hooks/useAllIndicators";
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Type pour la vue indicateur
interface ViewIndicator {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: "E" | "S" | "G";
  value: number;
  unit: string;
  period: string;
  source: string;
  status: "validated" | "partial" | "missing";
}

interface DonneesQuantitativesProps {
  posture?: string;
  parcours?: string;
}

export function DonneesQuantitatives({ posture, parcours }: DonneesQuantitativesProps = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIndicator, setSelectedIndicator] = useState<ViewIndicator | null>(null);

  // 🆕 Charger les vraies données depuis le backend
  const { indicators: backendIndicators = [], loading: isLoading, error } = useAllIndicators();

  // Mapper les indicateurs backend vers le format ViewIndicator
  const mappedBackendIndicators: ViewIndicator[] = backendIndicators.map(ind => ({
    id: ind.id,
    code: ind.code,
    name: ind.name,
    description: ind.name, // Pas de description dans le backend Indicator
    category: ind.category,
    value: ind.value ?? 0,
    unit: ind.unit ?? '',
    period: '2025',
    source: ind.source ?? 'Non renseigné',
    status: ind.status as "validated" | "partial" | "missing",
  }));

  // 🆕 Utiliser UNIQUEMENT les vraies données du backend, PAS de fallback mocké
  const indicators = mappedBackendIndicators;

  // Filtrage des indicateurs
  const filteredIndicators = indicators.filter((indicator) => {
    // Filtre de recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        indicator.name.toLowerCase().includes(query) ||
        indicator.code.toLowerCase().includes(query);
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

  // Statistiques depuis le backend ou calculées localement
  const stats = {
    total: indicators.length,
    validated: indicators.filter((i) => i.status === "validated").length,
    partial: indicators.filter((i) => i.status === "partial").length,
    missing: indicators.filter((i) => i.status === "missing").length,
    rejected: indicators.filter((i) => i.status === "rejected").length,
    completionRate: 0,
    byCategory: { E: 0, S: 0, G: 0 },
  };

  const completionRate = stats.completionRate;

  // Afficher un loader pendant le chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#059669] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des indicateurs...</p>
        </div>
      </div>
    );
  }

  // Afficher un message si aucun pack n'existe
  if (!isLoading && indicators.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Indicateurs clés</h1>
          <p className="text-muted-foreground">
            KPIs ESG quantifiés et documentés
          </p>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
          <h1 className="text-3xl font-bold mb-2">Indicateurs clés</h1>
          <p className="text-muted-foreground">
            KPIs ESG quantifiés et documentés
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un indicateur
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total data points</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Calculator className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Validés</p>
                <p className="text-2xl font-bold">{stats.validated}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Manquants</p>
                <p className="text-2xl font-bold">{stats.missing}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-2xl">⚠</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progression</p>
                <p className="text-2xl font-bold">{completionRate}%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
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
                <SelectItem value="validated">Validé</SelectItem>
                <SelectItem value="partial">Partiel</SelectItem>
                <SelectItem value="missing">Manquant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des indicateurs */}
      <Card>
        <CardHeader>
          <CardTitle>Indicateurs ESG</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredIndicators.length === 0 ? (
            <div className="text-center py-12">
              <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun indicateur trouvé</h3>
              <p className="text-muted-foreground text-center">
                Essayez de modifier vos critères de recherche
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Indicateur</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-right">Valeur</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIndicators.map((indicator) => (
                  <IndicatorRow
                    key={indicator.id}
                    indicator={indicator}
                    onViewDetails={() => setSelectedIndicator(indicator)}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Transparency Modal */}
      {selectedIndicator && (
        <TransparencyModal
          isOpen={!!selectedIndicator}
          onClose={() => setSelectedIndicator(null)}
          indicatorId={selectedIndicator.id}
          indicatorName={selectedIndicator.name}
        />
      )}
    </div>
  );
}

// ============================================================================
// INDICATOR ROW COMPONENT
// ============================================================================

interface IndicatorRowProps {
  indicator: ViewIndicator;
  onViewDetails: () => void;
}

function IndicatorRow({ indicator, onViewDetails }: IndicatorRowProps) {
  const [isValidating, setIsValidating] = useState(false);
  const queryClient = useQueryClient();
  
  const categoryColors: Record<string, string> = {
    E: "bg-green-100 text-green-700",
    S: "bg-blue-100 text-blue-700",
    G: "bg-purple-100 text-purple-700",
  };

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    validated: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Validé" },
    partial: { bg: "bg-orange-100", text: "text-orange-700", label: "Partiel" },
    missing: { bg: "bg-red-100", text: "text-red-700", label: "Manquant" },
    rejected: { bg: "bg-gray-100", text: "text-gray-700", label: "Rejeté" },
  };

  const status = statusConfig[indicator.status] || statusConfig.missing;

  // Fonction pour valider un indicateur
  const handleValidate = async () => {
    setIsValidating(true);

    try {
      const { kpiService } = await import('@/services/kpiService');

      await kpiService.validateKPI(
        indicator.id,
        'current-user-id',
        'Current User',
        'CLIENT_OWNER'
      );

      toast.success('Indicateur validé', {
        description: `${indicator.name} a été validé avec succès`,
      });

      // Invalidate queries to refresh list
      queryClient.invalidateQueries({ queryKey: ['all-indicators'] });
    } catch (error: any) {
      console.error('Validation error:', error);
      toast.error('Erreur lors de la validation', {
        description: error.message,
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge className={categoryColors[indicator.category]}>{indicator.category}</Badge>
          <span className="text-xs text-muted-foreground">{indicator.code}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium">{indicator.name}</div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col items-end">
          <span className="font-bold">
            {indicator.value !== null && indicator.value !== undefined ? (
              <>
                {indicator.value.toLocaleString("fr-FR")} {indicator.unit}
              </>
            ) : (
              "-"
            )}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">{indicator.source}</span>
      </TableCell>
      <TableCell>
        <Badge className={`${status.bg} ${status.text}`}>{status.label}</Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button onClick={onViewDetails} variant="ghost" size="sm">
          <Eye className="h-4 w-4 mr-1" />
          Voir
        </Button>
        {indicator.status !== 'validated' && (
          <Button
            onClick={handleValidate}
            variant="ghost"
            size="sm"
            disabled={isValidating}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Valider
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}