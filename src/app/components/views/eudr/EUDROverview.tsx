import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Plus,
  FileDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  FileEdit,
  Filter,
  Search,
  Shield,
  Eye,
  Users
} from "lucide-react";
import { LotStatus, COMMODITY_LABELS, STATUS_LABELS } from "@/types/eudr";

type PostureType = "conseil" | "pre-audit" | "audit-externe";
type ParcoursType = "csrd-obligatoire" | "esg-structure";

interface EUDROverviewProps {
  onCreateLot: () => void;
  onRunAssessment: () => void;
  onOpenLot: (lotId: string) => void;
  onExport: () => void;
  posture: PostureType;
  parcours: ParcoursType;
}

export function EUDROverview({ 
  onCreateLot, 
  onRunAssessment, 
  onOpenLot, 
  onExport,
  posture,
  parcours 
}: EUDROverviewProps) {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCommodity, setFilterCommodity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Adaptations selon posture et parcours
  const isConseil = posture === "conseil";
  const isPreAudit = posture === "pre-audit";
  const isAuditExterne = posture === "audit-externe";
  const isCsrdObligatoire = parcours === "csrd-obligatoire";

  // Vocabulaire adapté
  const labels = {
    title: isCsrdObligatoire 
      ? "EUDR Compliance Pack — Conformité réglementaire" 
      : "EUDR Compliance — Gestion déforestation",
    subtitle: isCsrdObligatoire
      ? "Règlement UE Déforestation (EUDR) — Obligation de diligence raisonnée"
      : "Suivi volontaire de la conformité EUDR pour matières premières à risque",
    createButton: isAuditExterne ? "Consulter lots" : isPreAudit ? "Créer lot (validation requise)" : "Créer un lot",
    assessmentButton: isAuditExterne ? "Voir assessment" : isPreAudit ? "Mettre à jour l'assessment" : "Lancer l'assessment",
    exportButton: isAuditExterne ? "Exporter dossier audit" : isPreAudit ? "Exporter pour revue" : "Exporter dossier",
    lotsTableTitle: isAuditExterne ? "Lots à auditer" : isPreAudit ? "Lots en préparation" : "Gestion des lots / Expéditions",
    statsTitle: isAuditExterne ? "Vue d'ensemble audit" : isPreAudit ? "État de préparation" : "Statistiques de conformité"
  };

  // Permissions selon posture
  const canCreate = !isAuditExterne;
  const canEdit = !isAuditExterne;

  // Mock data
  const stats = {
    total: 24,
    approved: 15,
    inReview: 6,
    changesRequested: 2,
    draft: 1,
    completionRate: 62.5
  };

  const lots = [
    {
      id: "LOT-001",
      commodity: "coffee" as const,
      supplier: "Green Valley Farms",
      country: "Brazil",
      shipmentDate: "2026-01-15",
      quantity: 5000,
      unit: "kg",
      status: "Approved" as LotStatus,
      missingItems: 0
    },
    {
      id: "LOT-002",
      commodity: "cocoa" as const,
      supplier: "Ivory Coast Traders",
      country: "Côte d'Ivoire",
      shipmentDate: "2026-01-18",
      quantity: 3200,
      unit: "kg",
      status: "Ready for Review" as LotStatus,
      missingItems: 1
    },
    {
      id: "LOT-003",
      commodity: "palm_oil" as const,
      supplier: "Sustainable Palm Co.",
      country: "Indonesia",
      shipmentDate: "2026-01-20",
      quantity: 8000,
      unit: "L",
      status: "Changes Requested" as LotStatus,
      missingItems: 3
    },
    {
      id: "LOT-004",
      commodity: "wood" as const,
      supplier: "Nordic Timber AB",
      country: "Sweden",
      shipmentDate: "2026-01-22",
      quantity: 150,
      unit: "m³",
      status: "In Progress" as LotStatus,
      missingItems: 5
    }
  ];

  const getStatusColor = (status: LotStatus) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Ready for Review":
        return "bg-blue-100 text-blue-800";
      case "Changes Requested":
        return "bg-amber-100 text-amber-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "In Progress":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: LotStatus) => {
    switch (status) {
      case "Approved":
        return <CheckCircle2 className="h-4 w-4" />;
      case "Ready for Review":
        return <Clock className="h-4 w-4" />;
      case "Changes Requested":
        return <AlertCircle className="h-4 w-4" />;
      case "Rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileEdit className="h-4 w-4" />;
    }
  };

  const filteredLots = lots.filter(lot => {
    if (filterStatus !== "all" && lot.status !== filterStatus) return false;
    if (filterCommodity !== "all" && lot.commodity !== filterCommodity) return false;
    if (searchQuery && !lot.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !lot.supplier.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">{labels.title}</h1>
          <p className="text-muted-foreground">
            {labels.subtitle}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRunAssessment}>
            <FileEdit className="h-4 w-4 mr-2" />
            {labels.assessmentButton}
          </Button>
          <Button variant="outline" onClick={onExport}>
            <FileDown className="h-4 w-4 mr-2" />
            {labels.exportButton}
          </Button>
          {canCreate && (
            <Button className="bg-[#0F4C3A] hover:bg-[#0A3B2E]" onClick={onCreateLot}>
              <Plus className="h-4 w-4 mr-2" />
              {labels.createButton}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Lots</p>
                <p className="text-3xl font-semibold">{stats.total}</p>
              </div>
              <div className="bg-[#E8F3F0] p-3 rounded-lg">
                <FileEdit className="h-5 w-5 text-[#0F4C3A]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approuvés</p>
                <p className="text-3xl font-semibold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En revue</p>
                <p className="text-3xl font-semibold text-blue-600">{stats.inReview}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">À corriger</p>
                <p className="text-3xl font-semibold text-amber-600">{stats.changesRequested}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground">Taux de conformité</p>
              <p className="text-3xl font-semibold">{stats.completionRate}%</p>
              <div className="w-full bg-border rounded-full h-2 mt-2">
                <div 
                  className="h-full bg-[#059669] rounded-full"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{labels.lotsTableTitle}</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtres</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par ID ou fournisseur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="Draft">Brouillon</SelectItem>
                <SelectItem value="In Progress">En cours</SelectItem>
                <SelectItem value="Ready for Review">Prêt pour revue</SelectItem>
                <SelectItem value="Changes Requested">À corriger</SelectItem>
                <SelectItem value="Approved">Approuvé</SelectItem>
                <SelectItem value="Rejected">Rejeté</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCommodity} onValueChange={setFilterCommodity}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Commodity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les commodités</SelectItem>
                {Object.entries(COMMODITY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lots Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">ID Lot</th>
                  <th className="text-left p-3 text-sm font-medium">Commodity</th>
                  <th className="text-left p-3 text-sm font-medium">Fournisseur</th>
                  <th className="text-left p-3 text-sm font-medium">Origine</th>
                  <th className="text-left p-3 text-sm font-medium">Date</th>
                  <th className="text-left p-3 text-sm font-medium">Quantité</th>
                  <th className="text-left p-3 text-sm font-medium">Statut</th>
                  <th className="text-left p-3 text-sm font-medium">Éléments manquants</th>
                  <th className="text-left p-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLots.map((lot) => (
                  <tr key={lot.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-3">
                      <span className="font-mono text-sm font-medium">{lot.id}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">{COMMODITY_LABELS[lot.commodity]}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">{lot.supplier}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">{lot.country}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">{new Date(lot.shipmentDate).toLocaleDateString('fr-FR')}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">{lot.quantity} {lot.unit}</span>
                    </td>
                    <td className="p-3">
                      <Badge className={getStatusColor(lot.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(lot.status)}
                          <span className="text-xs">{STATUS_LABELS[lot.status]}</span>
                        </div>
                      </Badge>
                    </td>
                    <td className="p-3">
                      {lot.missingItems > 0 ? (
                        <Badge variant="outline" className="border-amber-500 text-amber-700">
                          {lot.missingItems} manquant{lot.missingItems > 1 ? 's' : ''}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-green-500 text-green-700">
                          Complet
                        </Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onOpenLot(lot.id)}
                      >
                        Ouvrir
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLots.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileEdit className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun lot trouvé avec ces filtres</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}