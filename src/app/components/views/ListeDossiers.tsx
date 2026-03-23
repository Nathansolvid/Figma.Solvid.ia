import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import {
  Search,
  Plus,
  FolderOpen,
  Filter,
  ArrowUpDown,
  Building2,
  FileText,
  Landmark,
  Shield,
  PenLine,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { GuardedAction } from "@/app/components/GuardedAction"; // 🆕 P1-2 RBAC
import { Action } from "@/permissions"; // 🆕 P1-2 RBAC
import { EmptyState } from "@/app/components/EmptyState"; // 🆕 P1-3 Empty States
import { useDossiers } from "@/contexts/DossierContext"; // 🆕 Import useDossiers
import { useVSMEData } from "@/contexts/VSMEDataContext"; // 🆕 Real completeness

interface Dossier {
  id: string;
  name: string;
  clientOrg: string;
  fiscalYear: number;
  posture: "conseil" | "pre-audit" | "audit-externe";
  dominantPackType: "donneur-ordre" | "questionnaire" | "banque" | "pre-audit" | "mixed";
  status: "Draft" | "In_Progress" | "Ready_Audit" | "Under_Audit" | "Validated" | "Closed";
  completeness: number;
  createdAt: string;
}

const statusConfig = {
  Draft: { label: "Brouillon", color: "bg-gray-100 text-gray-800" },
  In_Progress: { label: "En cours", color: "bg-blue-100 text-blue-800" },
  Ready_Audit: { label: "Prêt audit", color: "bg-purple-100 text-purple-800" },
  Under_Audit: { label: "En audit", color: "bg-orange-100 text-orange-800" },
  Validated: { label: "Validé", color: "bg-green-100 text-green-800" },
  Closed: { label: "Clôturé", color: "bg-gray-100 text-gray-800" },
};

const postureConfig = {
  "conseil": { label: "Conseil", color: "bg-blue-100 text-blue-700", icon: "💡" },
  "pre-audit": { label: "Pré-Audit", color: "bg-purple-100 text-purple-700", icon: "🔍" },
  "audit-externe": { label: "Audit Externe", color: "bg-emerald-100 text-emerald-700", icon: "✓" },
};

const packTypeConfig = {
  "donneur-ordre": { label: "Client principal", icon: Building2, color: "text-blue-600" },
  "questionnaire": { label: "Questionnaire", icon: FileText, color: "text-purple-600" },
  "banque": { label: "Banque", icon: Landmark, color: "text-amber-600" },
  "pre-audit": { label: "Pré-Audit", icon: Shield, color: "text-emerald-600" },
  "mixed": { label: "Mixte", icon: FolderOpen, color: "text-gray-600" },
};

interface ListeDossiersProps {
  onCreateDossier: () => void;
  onOpenDossier: (dossierId: string) => void;
  onSaisirDossier?: (dossierId: string) => void; // 🆕 Naviguer vers saisie-dossier
}

export function ListeDossiers({ onCreateDossier, onOpenDossier, onSaisirDossier }: ListeDossiersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { dossiers: rawDossiers } = useDossiers();
  const { getStats, loadDossier } = useVSMEData(); // 🆕 Real completeness

  // 🆕 Charger les données VSME pour tous les dossiers au montage
  useEffect(() => {
    rawDossiers.forEach(d => loadDossier(d.id));
  }, [rawDossiers.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // 🔧 Map raw dossiers to display format (add missing fields for UI)
  const dossiers = rawDossiers.map(d => {
    // Map context status to UI status
    let uiStatus: "Draft" | "In_Progress" | "Ready_Audit" | "Under_Audit" | "Validated" | "Closed";
    switch (d.status) {
      case "draft":
        uiStatus = "Draft";
        break;
      case "active":
        uiStatus = "In_Progress";
        break;
      case "completed":
        uiStatus = "Validated";
        break;
      default:
        uiStatus = "In_Progress";
    }

    // 🆕 Vraie complétude depuis VSMEDataContext
    const vsmeStats = getStats(d.id, 'B');

    return {
      ...d,
      posture: (d.missionType === "Conseil" ? "conseil" : "audit-externe") as "conseil" | "pre-audit" | "audit-externe",
      dominantPackType: "donneur-ordre" as const,
      status: uiStatus,
      completeness: vsmeStats.pct, // 🆕 Real value (0 if not yet loaded / no data)
      createdAt: new Date(d.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
      fiscalYear: parseInt(d.fiscalYear)
    };
  });

  // Calcul des statistiques
  const stats = {
    active: dossiers.filter(d => d.status === "In_Progress" || d.status === "Ready_Audit").length,
    donneurOrdre: dossiers.filter(d => d.dominantPackType === "donneur-ordre").length,
    questionnaire: dossiers.filter(d => d.dominantPackType === "questionnaire").length,
    banque: dossiers.filter(d => d.dominantPackType === "banque").length,
    preAudit: dossiers.filter(d => d.dominantPackType === "pre-audit").length,
    avgCompleteness: dossiers.length > 0
      ? Math.round(dossiers.reduce((acc, d) => acc + d.completeness, 0) / dossiers.length)
      : 0,
  };

  const filteredDossiers = dossiers.filter(dossier =>
    dossier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dossier.clientOrg.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Dossiers clients</h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos dossiers ESG prêts pour vérification organisés par programmes
          </p>
        </div>
        <GuardedAction action={Action.CREATE_DOSSIER}>
          <Button
            className="bg-[#0F4C3A] hover:bg-[#0A3B2E]"
            onClick={onCreateDossier}
          >
            <Plus className="h-4 w-4 mr-2" />
            Créer un dossier
          </Button>
        </GuardedAction>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dossiers actifs</p>
                <p className="text-2xl font-semibold">{stats.active}</p>
              </div>
              <div className="bg-[#E8F3F0] p-3 rounded-lg">
                <FolderOpen className="h-5 w-5 text-[#0F4C3A]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Client principal</p>
                <p className="text-2xl font-semibold">{stats.donneurOrdre}</p>
              </div>
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Questionnaire</p>
                <p className="text-2xl font-semibold">{stats.questionnaire}</p>
              </div>
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Banque</p>
                <p className="text-2xl font-semibold">{stats.banque}</p>
              </div>
              <Landmark className="h-5 w-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progression moy.</p>
                <p className="text-2xl font-semibold">{stats.avgCompleteness}%</p>
              </div>
              <Shield className="h-5 w-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un dossier..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
            <Button variant="outline">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Trier
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table des dossiers */}
      <Card>
        <CardHeader>
          <CardTitle>Tous les dossiers ({filteredDossiers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDossiers.length === 0 ? (
            searchTerm ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="mb-4">Aucun résultat pour "{searchTerm}"</p>
                <Button variant="outline" onClick={() => setSearchTerm('')}>
                  Réinitialiser la recherche
                </Button>
              </div>
            ) : (
              <EmptyState
                icon={<FolderOpen className="h-16 w-16" />}
                title="Aucun dossier"
                description="Créez votre premier dossier pour commencer à structurer vos données ESG."
                primaryAction={{
                  label: "Créer un dossier",
                  onClick: onCreateDossier,
                  guardAction: Action.CREATE_DOSSIER,
                }}
                tips={[
                  "Un dossier regroupe plusieurs packs thématiques",
                  "Vous pouvez créer un dossier par client ou par année fiscale",
                  "Les données sont stockées localement dans votre navigateur",
                ]}
              />
            )
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom du dossier</TableHead>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Année fiscale</TableHead>
                  <TableHead>Type de pack</TableHead>
                  <TableHead>Posture</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Progression</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDossiers.map((dossier) => {
                  const PackIcon = packTypeConfig[dossier.dominantPackType].icon;
                  const completenessColor =
                    dossier.completeness >= 80 ? "#2d7a55" :
                    dossier.completeness >= 40 ? "#f59e0b" :
                    "#9ca3af";
                  return (
                    <TableRow key={dossier.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onOpenDossier(dossier.id)}>
                      <TableCell className="font-medium">{dossier.name}</TableCell>
                      <TableCell>{dossier.clientOrg}</TableCell>
                      <TableCell>{dossier.fiscalYear}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PackIcon className={`h-4 w-4 ${packTypeConfig[dossier.dominantPackType].color}`} />
                          <span className="text-sm">{packTypeConfig[dossier.dominantPackType].label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={postureConfig[dossier.posture].color}>
                          {postureConfig[dossier.posture].icon} {postureConfig[dossier.posture].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig[dossier.status].color}>
                          {statusConfig[dossier.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {/* 🆕 Vraie complétude depuis VSMEDataContext */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-border rounded-full h-2 overflow-hidden max-w-[80px]">
                            <div
                              className="h-full transition-all duration-500"
                              style={{
                                width: `${dossier.completeness}%`,
                                background: completenessColor,
                              }}
                            />
                          </div>
                          <span
                            className="text-sm font-semibold tabular-nums"
                            style={{ color: completenessColor }}
                          >
                            {dossier.completeness}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {dossier.createdAt}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          {/* Saisie directe — row click opens dossier */}
                          {onSaisirDossier && (
                            <Button
                              size="sm"
                              className="text-[#0F4C3A] border-[#0F4C3A] hover:bg-[#E8F3F0] gap-1"
                              variant="outline"
                              onClick={() => onSaisirDossier(dossier.id)}
                            >
                              <PenLine className="h-3.5 w-3.5" />
                              Saisir
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
