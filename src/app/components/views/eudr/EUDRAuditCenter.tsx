import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Eye,
  FileCheck,
  Clock,
  Filter,
  ChevronRight,
  Shield
} from "lucide-react";
import { LotStatus, ChecklistItemStatus, COMMODITY_LABELS, STATUS_LABELS } from "@/types/eudr";

type PostureType = "conseil" | "pre-audit" | "audit-externe";
type ParcoursType = "csrd-obligatoire" | "esg-structure";

interface EUDRAuditCenterProps {
  onOpenLot: (lotId: string) => void;
  posture: PostureType;
  parcours: ParcoursType;
}

export function EUDRAuditCenter({ onOpenLot, posture, parcours }: EUDRAuditCenterProps) {
  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [filter, setFilter] = useState<"all" | "ready" | "changes_requested">("ready");

  // Adaptations selon posture
  const isPreAudit = posture === "pre-audit";
  const isAuditExterne = posture === "audit-externe";
  const isCsrdObligatoire = parcours === "csrd-obligatoire";

  // Vocabulaire adapté
  const labels = {
    title: isAuditExterne 
      ? "Centre d'audit EUDR — Validation externe"
      : isPreAudit 
      ? "Revue pré-audit EUDR"
      : "Centre de revue EUDR",
    subtitle: isAuditExterne
      ? "Validation de conformité pour audit officiel EUDR"
      : isPreAudit
      ? "Préparation et vérification avant audit"
      : "Revue et validation des lots en attente",
    approveButton: isAuditExterne ? "Valider conformité EUDR" : "Approuver",
    rejectButton: isAuditExterne ? "Non-conformité EUDR" : "Rejeter",
    requestButton: isAuditExterne ? "Demander clarifications" : "Demander modifications",
    badgeLabel: isAuditExterne ? "Mode Audit externe" : isPreAudit ? "Mode Pré-audit" : "Mode Revue"
  };

  // Mock data
  const lotsForReview = [
    {
      id: "LOT-002",
      commodity: "cocoa" as const,
      supplier: "Ivory Coast Traders",
      country: "Côte d'Ivoire",
      submittedDate: "2026-01-18",
      assignedTo: "Jean Dupont",
      status: "Ready for Review" as LotStatus,
      checklist: {
        total: 9,
        accepted: 7,
        provided: 1,
        missing: 1
      },
      evidences: 3,
      lastUpdate: "2026-01-18 16:45"
    },
    {
      id: "LOT-005",
      commodity: "soy" as const,
      supplier: "Brazilian Agro",
      country: "Brazil",
      submittedDate: "2026-01-19",
      assignedTo: "Jean Dupont",
      status: "Ready for Review" as LotStatus,
      checklist: {
        total: 9,
        accepted: 8,
        provided: 1,
        missing: 0
      },
      evidences: 4,
      lastUpdate: "2026-01-19 10:22"
    },
    {
      id: "LOT-003",
      commodity: "palm_oil" as const,
      supplier: "Sustainable Palm Co.",
      country: "Indonesia",
      submittedDate: "2026-01-17",
      assignedTo: "Jean Dupont",
      status: "Changes Requested" as LotStatus,
      checklist: {
        total: 9,
        accepted: 5,
        provided: 1,
        missing: 3
      },
      evidences: 2,
      lastUpdate: "2026-01-20 09:15"
    }
  ];

  const filteredLots = lotsForReview.filter(lot => {
    if (filter === "ready") return lot.status === "Ready for Review";
    if (filter === "changes_requested") return lot.status === "Changes Requested";
    return true;
  });

  const stats = {
    readyForReview: lotsForReview.filter(l => l.status === "Ready for Review").length,
    changesRequested: lotsForReview.filter(l => l.status === "Changes Requested").length,
    avgReviewTime: "2.3 jours"
  };

  const handleApprove = (lotId: string) => {
    console.log(`Approving lot ${lotId}`);
    // Simulation
    alert(`✓ Lot ${lotId} approuvé avec succès`);
  };

  const handleReject = (lotId: string) => {
    if (!actionMessage) {
      alert("Veuillez ajouter un message pour expliquer le rejet");
      return;
    }
    console.log(`Rejecting lot ${lotId} with message: ${actionMessage}`);
    alert(`✗ Lot ${lotId} rejeté`);
    setActionMessage("");
  };

  const handleRequestChanges = (lotId: string) => {
    if (!actionMessage) {
      alert("Veuillez ajouter un message expliquant les modifications demandées");
      return;
    }
    console.log(`Requesting changes for lot ${lotId} with message: ${actionMessage}`);
    alert(`⚠ Modifications demandées pour lot ${lotId}`);
    setActionMessage("");
  };

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
        <Badge className="bg-blue-100 text-blue-800">
          <Eye className="h-3 w-3 mr-1" />
          {labels.badgeLabel}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente de revue</p>
                <p className="text-3xl font-semibold text-blue-600">{stats.readyForReview}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Modifications demandées</p>
                <p className="text-3xl font-semibold text-amber-600">{stats.changesRequested}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Délai moyen revue</p>
                <p className="text-3xl font-semibold">{stats.avgReviewTime}</p>
              </div>
              <FileCheck className="h-8 w-8 text-[#0F4C3A]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button 
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          className={filter === "all" ? "bg-[#0F4C3A]" : ""}
        >
          <Filter className="h-4 w-4 mr-2" />
          Tous ({lotsForReview.length})
        </Button>
        <Button 
          variant={filter === "ready" ? "default" : "outline"}
          onClick={() => setFilter("ready")}
          className={filter === "ready" ? "bg-blue-600" : ""}
        >
          Prêt pour revue ({stats.readyForReview})
        </Button>
        <Button 
          variant={filter === "changes_requested" ? "default" : "outline"}
          onClick={() => setFilter("changes_requested")}
          className={filter === "changes_requested" ? "bg-amber-600" : ""}
        >
          Modifications demandées ({stats.changesRequested})
        </Button>
      </div>

      {/* Lots List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredLots.map((lot) => (
          <Card key={lot.id} className={selectedLot === lot.id ? "border-[#0F4C3A] border-2" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono font-semibold text-lg">{lot.id}</span>
                    <Badge className="bg-purple-100 text-purple-800">
                      {COMMODITY_LABELS[lot.commodity]}
                    </Badge>
                    <Badge className={
                      lot.status === "Ready for Review" 
                        ? "bg-blue-100 text-blue-800" 
                        : "bg-amber-100 text-amber-800"
                    }>
                      {STATUS_LABELS[lot.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Fournisseur: {lot.supplier}</span>
                    <span>•</span>
                    <span>Origine: {lot.country}</span>
                    <span>•</span>
                    <span>Soumis: {new Date(lot.submittedDate).toLocaleDateString('fr-FR')}</span>
                    <span>•</span>
                    <span>MAJ: {lot.lastUpdate}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedLot(selectedLot === lot.id ? null : lot.id)}
                  >
                    {selectedLot === lot.id ? "Masquer détails" : "Afficher détails"}
                    <ChevronRight className={`h-4 w-4 ml-2 transition-transform ${selectedLot === lot.id ? 'rotate-90' : ''}`} />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onOpenLot(lot.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ouvrir
                  </Button>
                </div>
              </div>
            </CardHeader>

            {selectedLot === lot.id && (
              <CardContent className="space-y-4 border-t">
                {/* Checklist Summary */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <FileCheck className="h-4 w-4" />
                    État de la checklist ({lot.checklist.total} items)
                  </h4>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-700">Acceptés</span>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-2xl font-semibold text-green-700 mt-1">{lot.checklist.accepted}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-700">Fournis</span>
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="text-2xl font-semibold text-blue-700 mt-1">{lot.checklist.provided}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Manquants</span>
                        <XCircle className="h-4 w-4 text-gray-600" />
                      </div>
                      <p className="text-2xl font-semibold text-gray-700 mt-1">{lot.checklist.missing}</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-purple-700">Preuves</span>
                        <FileCheck className="h-4 w-4 text-purple-600" />
                      </div>
                      <p className="text-2xl font-semibold text-purple-700 mt-1">{lot.evidences}</p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Complétude globale</span>
                    <span className="text-sm font-semibold">
                      {Math.round(((lot.checklist.accepted + lot.checklist.provided) / lot.checklist.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div 
                      className="h-full bg-[#059669] rounded-full"
                      style={{ width: `${((lot.checklist.accepted + lot.checklist.provided) / lot.checklist.total) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Action Zone */}
                <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                  <Label className="text-sm font-semibold">Action d'audit</Label>
                  <Textarea 
                    placeholder="Message pour le consultant/client (obligatoire pour rejet ou demande de modifications)..."
                    value={actionMessage}
                    onChange={(e) => setActionMessage(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline"
                      className="border-amber-500 text-amber-700 hover:bg-amber-50"
                      onClick={() => handleRequestChanges(lot.id)}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {labels.requestButton}
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-red-500 text-red-700 hover:bg-red-50"
                      onClick={() => handleReject(lot.id)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {labels.rejectButton}
                    </Button>
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(lot.id)}
                      disabled={lot.checklist.missing > 0}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {labels.approveButton}
                    </Button>
                  </div>
                  {lot.checklist.missing > 0 && (
                    <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
                      ⚠ Impossible d'approuver : {lot.checklist.missing} élément(s) manquant(s) dans la checklist
                    </p>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {filteredLots.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileCheck className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium mb-2">Aucun lot en attente</p>
            <p className="text-sm text-muted-foreground">
              Tous les lots ont été traités ou il n'y a pas de lots avec ce statut
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}