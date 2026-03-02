import { useState } from "react";
import {
  FileText,
  Download,
  ExternalLink,
  Trash2,
  Eye,
  Link as LinkIcon,
  Calendar,
  Building2,
  Tag,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Evidence } from "@/types/indicators";
import { EvidenceFileType } from "@/types/evidence";
import { formatFileSize, downloadFile, openInNewTab } from "@/utils/fileUtils";
import { FILE_TYPE_ICONS, FILE_TYPE_COLORS } from "@/types/evidence";

interface EvidenceCardProps {
  evidence: Evidence & { status?: "pending" | "approved" | "rejected" };
  onPreview?: (evidence: Evidence) => void;
  onDelete?: (evidenceId: string) => void;
  onApprove?: (evidenceId: string) => void;
  onReject?: (evidenceId: string) => void;
}

export function EvidenceCard({
  evidence,
  onPreview,
  onDelete,
  onApprove,
  onReject,
}: EvidenceCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const fileType = (evidence.fileType as EvidenceFileType) || "other";
  const icon = FILE_TYPE_ICONS[fileType];
  const colorClass = FILE_TYPE_COLORS[fileType];

  const getStatusBadge = () => {
    if (!evidence.status) return null;

    const configs = {
      pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800", Icon: Clock },
      approved: { label: "Approuvé", color: "bg-green-100 text-green-800", Icon: CheckCircle2 },
      rejected: { label: "Rejeté", color: "bg-red-100 text-red-800", Icon: XCircle },
    };

    const config = configs[evidence.status];
    const Icon = config.Icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleDownload = () => {
    if (evidence.type === "file" && evidence.url) {
      downloadFile(evidence.url, evidence.name);
    } else if (evidence.type === "link" && evidence.url) {
      openInNewTab(evidence.url);
    }
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(evidence);
    }
  };

  return (
    <Card
      className="hover:shadow-lg transition-all cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4">
        {/* Header avec icône et menu */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Icône type fichier */}
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${colorClass}`}>
              {evidence.type === "link" ? <LinkIcon className="h-6 w-6" /> : icon}
            </div>

            {/* Nom et métadonnées */}
            <div className="flex-1">
              <h3 className="font-semibold text-sm line-clamp-1">{evidence.name}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                {evidence.fileType && (
                  <Badge variant="outline" className="text-xs">
                    {evidence.fileType.toUpperCase()}
                  </Badge>
                )}
                {evidence.fileSize && <span>{formatFileSize(evidence.fileSize)}</span>}
              </div>
            </div>
          </div>

          {/* Menu actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {evidence.type === "file" && (
                <DropdownMenuItem onClick={handlePreview}>
                  <Eye className="h-4 w-4 mr-2" />
                  Prévisualiser
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleDownload}>
                {evidence.type === "link" ? (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir le lien
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </>
                )}
              </DropdownMenuItem>
              {onApprove && evidence.status !== "approved" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onApprove(evidence.id)}>
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                    Approuver
                  </DropdownMenuItem>
                </>
              )}
              {onReject && evidence.status !== "rejected" && (
                <DropdownMenuItem onClick={() => onReject(evidence.id)}>
                  <XCircle className="h-4 w-4 mr-2 text-red-600" />
                  Rejeter
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(evidence.id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {evidence.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{evidence.description}</p>
        )}

        {/* Métadonnées */}
        <div className="space-y-2 text-xs text-muted-foreground">
          {/* Période */}
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>Période: {evidence.period}</span>
          </div>

          {/* Entité (optionnel) */}
          {evidence.entity && (
            <div className="flex items-center gap-2">
              <Building2 className="h-3 w-3" />
              <span>{evidence.entity}</span>
            </div>
          )}

          {/* Uploadé par */}
          <div className="flex items-center gap-2">
            <FileText className="h-3 w-3" />
            <span>
              Par {evidence.uploadedBy} • {evidence.uploadedAt.toLocaleDateString("fr-FR")}
            </span>
          </div>
        </div>

        {/* Tags */}
        {evidence.tags && evidence.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t">
            <Tag className="h-3 w-3 text-muted-foreground" />
            {evidence.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {evidence.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{evidence.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Statut */}
        {evidence.status && <div className="mt-3 pt-3 border-t">{getStatusBadge()}</div>}

        {/* Actions rapides (apparaissent au hover) */}
        {isHovered && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            {evidence.type === "file" && (
              <Button variant="outline" size="sm" className="flex-1" onClick={handlePreview}>
                <Eye className="h-3 w-3 mr-1" />
                Voir
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleDownload}
            >
              {evidence.type === "link" ? (
                <>
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Ouvrir
                </>
              ) : (
                <>
                  <Download className="h-3 w-3 mr-1" />
                  Télécharger
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
