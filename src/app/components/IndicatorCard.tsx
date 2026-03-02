import { useState } from "react";
import { Info, TrendingUp, AlertTriangle, CheckCircle2, FileCheck, Clock, XCircle } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { TransparencyModal } from "@/app/components/TransparencyModal";
import { Indicator } from "@/types/indicators";
import { formatIndicatorValue, needsRecalculation } from "@/utils/calculationEngine";
import { ChecklistItemStatus } from "@/types/packs";

interface IndicatorCardProps {
  indicator: Indicator;
  onRecalculate?: (indicatorId: string) => void;
  onStatusChange?: (indicatorId: string, newStatus: ChecklistItemStatus) => void;
  showAuditActions?: boolean; // 🆕 Afficher boutons Accept/Reject (AUDITOR)
  canEdit?: boolean; // 🆕 Utilisateur peut modifier le statut
}

export function IndicatorCard({ indicator, onRecalculate, onStatusChange, showAuditActions, canEdit }: IndicatorCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const needsUpdate = needsRecalculation(indicator);

  const getCategoryColor = (category: "E" | "S" | "G") => {
    const colors = {
      E: "bg-green-600",
      S: "bg-blue-600",
      G: "bg-purple-600",
    };
    return colors[category];
  };

  const getStatusConfig = (status: ChecklistItemStatus) => {
    const configs: Record<ChecklistItemStatus, { label: string; color: string; icon: any }> = {
      missing: { label: "Manquant", color: "bg-red-100 text-red-800 border-red-300", icon: AlertTriangle },
      "in-progress": { label: "En cours", color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock },
      provided: { label: "Fourni", color: "bg-green-100 text-green-800 border-green-300", icon: FileCheck },
      "needs-review": { label: "À réviser", color: "bg-blue-100 text-blue-800 border-blue-300", icon: Info },
      accepted: { label: "Validé", color: "bg-emerald-100 text-emerald-800 border-emerald-300", icon: CheckCircle2 },
      rejected: { label: "Rejeté", color: "bg-red-100 text-red-800 border-red-300", icon: AlertTriangle },
    };
    return configs[status];
  };

  const statusConfig = getStatusConfig(indicator.status);
  const StatusIcon = statusConfig.icon;

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          {/* Header avec catégorie et bouton i */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getCategoryColor(indicator.category)}`}>
                {indicator.category}
              </span>
              {indicator.isMandatory && (
                <Badge variant="destructive" className="text-xs">
                  Obligatoire
                </Badge>
              )}
            </div>

            {/* Bouton "i" transparence */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-[#E8F3F0] hover:bg-[#059669] hover:text-white transition-colors"
                    onClick={() => setModalOpen(true)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Voir détails de calcul et sources</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Nom indicateur */}
          <h3 className="font-semibold text-[#0A3B2E] mb-1">{indicator.name}</h3>
          <p className="text-xs text-muted-foreground font-mono mb-3">{indicator.code}</p>

          {/* Valeur */}
          <div className="mb-3">
            <p className="text-3xl font-bold text-[#0A3B2E]">
              {indicator.currentValue !== null
                ? formatIndicatorValue(indicator.currentValue, indicator.unit)
                : "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              Période: {indicator.period}
              {indicator.entity && ` • ${indicator.entity}`}
            </p>
          </div>

          {/* Statut */}
          <div className="flex items-center gap-2 mb-3">
            <Badge className={`${statusConfig.color} border flex items-center gap-1`}>
              <StatusIcon className="h-3 w-3" />
              {statusConfig.label}
            </Badge>

            {/* Indicateur recalcul nécessaire */}
            {needsUpdate && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className="bg-orange-100 text-orange-800 border-orange-300 cursor-pointer">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Recalcul disponible
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>De nouvelles données sources sont disponibles</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Métadonnées */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
            <div className="flex items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="flex items-center gap-1">
                      <FileCheck className="h-3 w-3" />
                      {indicator.evidences.length} preuve(s)
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Documents justificatifs</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      {indicator.sourceDataLines.length} ligne(s)
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Lignes de données sources</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <span>{indicator.lastUpdated.toLocaleDateString("fr-FR")}</span>
          </div>

          {/* Actions */}
          {needsUpdate && onRecalculate && (
            <div className="mt-3 pt-3 border-t">
              <Button
                size="sm"
                variant="outline"
                className="w-full border-[#059669] text-[#059669] hover:bg-[#E8F3F0]"
                onClick={() => onRecalculate(indicator.id)}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Recalculer avec nouvelles données
              </Button>
            </div>
          )}

          {/* Actions d'audit */}
          {showAuditActions && canEdit && (
            <div className="mt-3 pt-3 border-t">
              <Button
                size="sm"
                variant="outline"
                className="w-full border-[#059669] text-[#059669] hover:bg-[#E8F3F0]"
                onClick={() => onStatusChange?.(indicator.id, "accepted")}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Accepter
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full border-[#DC2626] text-[#DC2626] hover:bg-[#FEE2E2]"
                onClick={() => onStatusChange?.(indicator.id, "rejected")}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal transparence */}
      <TransparencyModal indicatorId={indicator.id} isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}