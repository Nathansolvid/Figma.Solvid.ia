import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Slider } from "@/app/components/ui/slider";
import {
  Upload,
  Download,
  Plus,
  CheckCircle2,
  Sparkles,
  Grid3x3,
  Eye,
  AlertTriangle,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  Target,
  TrendingUp,
  Shield,
  Users,
  Leaf,
  Building2
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { toast } from "sonner";
import { useDossierData, MaterialityIssue } from "@/contexts/DossierDataContext";

type PostureType = "conseil" | "pre-audit" | "audit-externe";
type ParcoursType = "csrd-obligatoire" | "esg-structure";

interface DoubleMaterialiteNewProps {
  posture: PostureType;
  parcours: ParcoursType;
  dossierId: string;
}

// ── ESRS reference data ──────────────────────────────────────────────────
const ESRS_STANDARDS = [
  { code: "E1", label: "Changement climatique", pilier: "E", color: "#059669" },
  { code: "E2", label: "Pollution", pilier: "E", color: "#059669" },
  { code: "E3", label: "Eau et ressources marines", pilier: "E", color: "#0891B2" },
  { code: "E4", label: "Biodiversité et écosystèmes", pilier: "E", color: "#16A34A" },
  { code: "E5", label: "Utilisation des ressources / économie circulaire", pilier: "E", color: "#65A30D" },
  { code: "S1", label: "Effectifs de l'entreprise", pilier: "S", color: "#7C3AED" },
  { code: "S2", label: "Travailleurs de la chaîne de valeur", pilier: "S", color: "#9333EA" },
  { code: "S3", label: "Communautés affectées", pilier: "S", color: "#A855F7" },
  { code: "S4", label: "Consommateurs et utilisateurs finals", pilier: "S", color: "#C084FC" },
  { code: "G1", label: "Conduite des affaires", pilier: "G", color: "#D97706" },
];

const SAMPLE_ISSUES: MaterialityIssue[] = [
  {
    id: "dma-1",
    name: "Émissions de GES",
    description: "Réduction des émissions directes (Scope 1–2) et indirectes (Scope 3) de l'entreprise",
    impactScore: 4.5,
    financialScore: 4.2,
    stakeholders: ["Actionnaires", "Régulateurs", "Clients", "Assureurs"],
    esrsMapping: ["E1"],
    mappingValidated: true,
    justification: "Enjeu stratégique lié aux objectifs climat et à la taxonomie UE",
    auditStatus: "valide",
  },
  {
    id: "dma-2",
    name: "Diversité et inclusion",
    description: "Promotion de l'égalité, de la diversité et de l'inclusion au sein des effectifs",
    impactScore: 3.8,
    financialScore: 2.9,
    stakeholders: ["Employés", "Syndicats", "Société civile"],
    esrsMapping: ["S1"],
    mappingValidated: true,
    justification: "Politique RH prioritaire et obligation légale index égalité",
    auditStatus: "valide",
  },
  {
    id: "dma-3",
    name: "Consommation d'eau",
    description: "Gestion de la consommation d'eau et des rejets dans les milieux aquatiques",
    impactScore: 3.5,
    financialScore: 2.1,
    stakeholders: ["Collectivités locales", "Régulateurs"],
    esrsMapping: ["E3"],
    mappingValidated: false,
  },
  {
    id: "dma-4",
    name: "Éthique des affaires",
    description: "Prévention de la corruption, lobbying responsable et culture d'éthique",
    impactScore: 4.1,
    financialScore: 3.8,
    stakeholders: ["Actionnaires", "Clients", "Régulateurs", "Fournisseurs"],
    esrsMapping: ["G1"],
    mappingValidated: true,
    justification: "Exigence réglementaire Sapin II et risque réputationnel",
    auditStatus: "valide",
  },
  {
    id: "dma-5",
    name: "Conditions de travail dans la chaîne de valeur",
    description: "Devoir de vigilance sur les droits humains chez les fournisseurs et sous-traitants",
    impactScore: 3.9,
    financialScore: 2.5,
    stakeholders: ["Fournisseurs", "ONG", "Régulateurs"],
    esrsMapping: ["S2"],
    mappingValidated: false,
  },
  {
    id: "dma-6",
    name: "Déchets et économie circulaire",
    description: "Réduction des déchets, recyclage et transition vers l'économie circulaire",
    impactScore: 3.2,
    financialScore: 2.8,
    stakeholders: ["Collectivités", "Clients", "Régulateurs"],
    esrsMapping: ["E5"],
    mappingValidated: true,
    justification: "Obligation tri 5 flux et loi AGEC",
    auditStatus: "reserve",
  },
  {
    id: "dma-7",
    name: "Pollution de l'air, de l'eau et des sols",
    description: "Prévention et contrôle des rejets polluants dans l'environnement",
    impactScore: 2.8,
    financialScore: 3.1,
    stakeholders: ["Collectivités", "Régulateurs", "Riverains"],
    esrsMapping: ["E2"],
    mappingValidated: false,
  },
  {
    id: "dma-8",
    name: "Énergie et efficacité énergétique",
    description: "Réduction de la consommation énergétique et transition vers les ENR",
    impactScore: 4.3,
    financialScore: 3.9,
    stakeholders: ["Actionnaires", "Régulateurs", "Fournisseurs énergie"],
    esrsMapping: ["E1"],
    mappingValidated: true,
    justification: "Plan de transition énergétique en cours, décret tertiaire",
    auditStatus: "valide",
  },
];

// ── Materiality Matrix Canvas Component ──────────────────────────────────
function MaterialityMatrix({
  issues,
  onSelect,
  selectedId
}: {
  issues: MaterialityIssue[];
  onSelect: (id: string | null) => void;
  selectedId: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; issue: MaterialityIssue } | null>(null);

  const PADDING = { top: 50, right: 40, bottom: 60, left: 70 };
  const THRESHOLD = 3.0;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const plotW = W - PADDING.left - PADDING.right;
    const plotH = H - PADDING.top - PADDING.bottom;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "#FAFBFC";
    ctx.fillRect(0, 0, W, H);

    // Quadrant backgrounds
    const threshX = PADDING.left + ((THRESHOLD - 1) / 4) * plotW;
    const threshY = PADDING.top + plotH - ((THRESHOLD - 1) / 4) * plotH;

    // Top-right = double materiality (green)
    ctx.fillStyle = "rgba(5, 150, 105, 0.06)";
    ctx.fillRect(threshX, PADDING.top, W - PADDING.right - threshX, threshY - PADDING.top);

    // Top-left = impact only (blue)
    ctx.fillStyle = "rgba(59, 130, 246, 0.04)";
    ctx.fillRect(PADDING.left, PADDING.top, threshX - PADDING.left, threshY - PADDING.top);

    // Bottom-right = financial only (amber)
    ctx.fillStyle = "rgba(245, 158, 11, 0.04)";
    ctx.fillRect(threshX, threshY, W - PADDING.right - threshX, PADDING.top + plotH - threshY);

    // Grid lines
    ctx.strokeStyle = "#E5E7EB";
    ctx.lineWidth = 0.5;
    for (let i = 1; i <= 5; i++) {
      const x = PADDING.left + ((i - 1) / 4) * plotW;
      const y = PADDING.top + plotH - ((i - 1) / 4) * plotH;
      ctx.beginPath();
      ctx.moveTo(x, PADDING.top);
      ctx.lineTo(x, PADDING.top + plotH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(PADDING.left + plotW, y);
      ctx.stroke();
    }

    // Threshold lines
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 1.5;
    // Vertical threshold
    ctx.beginPath();
    ctx.moveTo(threshX, PADDING.top);
    ctx.lineTo(threshX, PADDING.top + plotH);
    ctx.stroke();
    // Horizontal threshold
    ctx.beginPath();
    ctx.moveTo(PADDING.left, threshY);
    ctx.lineTo(PADDING.left + plotW, threshY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Quadrant labels
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#9CA3AF";
    ctx.textAlign = "center";

    const qCenterTopRight = { x: (threshX + W - PADDING.right) / 2, y: PADDING.top + 18 };
    const qCenterTopLeft = { x: (PADDING.left + threshX) / 2, y: PADDING.top + 18 };
    const qCenterBotRight = { x: (threshX + W - PADDING.right) / 2, y: PADDING.top + plotH - 8 };

    ctx.fillStyle = "#059669";
    ctx.font = "bold 11px Inter, system-ui, sans-serif";
    ctx.fillText("DOUBLE MATÉRIALITÉ", qCenterTopRight.x, qCenterTopRight.y);

    ctx.fillStyle = "#3B82F6";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText("Impact seul", qCenterTopLeft.x, qCenterTopLeft.y);

    ctx.fillStyle = "#F59E0B";
    ctx.fillText("Financier seul", qCenterBotRight.x, qCenterBotRight.y);

    // Axes
    ctx.strokeStyle = "#6B7280";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(PADDING.left, PADDING.top + plotH);
    ctx.lineTo(PADDING.left + plotW, PADDING.top + plotH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(PADDING.left, PADDING.top);
    ctx.lineTo(PADDING.left, PADDING.top + plotH);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = "#374151";
    ctx.font = "bold 12px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Impact financier →", PADDING.left + plotW / 2, H - 10);

    ctx.save();
    ctx.translate(16, PADDING.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Impact environnemental / social →", 0, 0);
    ctx.restore();

    // Tick labels
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#6B7280";
    ctx.textAlign = "center";
    for (let i = 1; i <= 5; i++) {
      const x = PADDING.left + ((i - 1) / 4) * plotW;
      ctx.fillText(String(i), x, PADDING.top + plotH + 20);
    }
    ctx.textAlign = "right";
    for (let i = 1; i <= 5; i++) {
      const y = PADDING.top + plotH - ((i - 1) / 4) * plotH;
      ctx.fillText(String(i), PADDING.left - 10, y + 4);
    }

    // Plot issues
    issues.forEach((issue, idx) => {
      const x = PADDING.left + ((issue.financialScore - 1) / 4) * plotW;
      const y = PADDING.top + plotH - ((issue.impactScore - 1) / 4) * plotH;
      const isHovered = hoveredId === issue.id;
      const isSelected = selectedId === issue.id;
      const r = isHovered || isSelected ? 22 : 16;

      // Shadow
      ctx.shadowColor = "rgba(0,0,0,0.15)";
      ctx.shadowBlur = isHovered ? 12 : 6;
      ctx.shadowOffsetY = 2;

      // Circle
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);

      const esrs = ESRS_STANDARDS.find(s => issue.esrsMapping.includes(s.code));
      const baseColor = esrs?.color || "#6B7280";

      if (issue.mappingValidated) {
        ctx.fillStyle = baseColor;
      } else {
        ctx.fillStyle = baseColor + "88";
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Selection ring
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(x, y, r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = "#0F4C3A";
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // Label number
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 12px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(idx + 1), x, y);
    });
  }, [issues, hoveredId, selectedId]);

  useEffect(() => { draw(); }, [draw]);

  const getIssueAtPos = (mx: number, my: number): MaterialityIssue | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const plotW = canvas.width - PADDING.left - PADDING.right;
    const plotH = canvas.height - PADDING.top - PADDING.bottom;

    for (const issue of issues) {
      const x = PADDING.left + ((issue.financialScore - 1) / 4) * plotW;
      const y = PADDING.top + plotH - ((issue.impactScore - 1) / 4) * plotH;
      const dist = Math.sqrt((mx - x) ** 2 + (my - y) ** 2);
      if (dist < 20) return issue;
    }
    return null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const issue = getIssueAtPos(mx, my);
    setHoveredId(issue?.id || null);
    canvasRef.current!.style.cursor = issue ? "pointer" : "default";
    if (issue) {
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, issue });
    } else {
      setTooltip(null);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const issue = getIssueAtPos(mx, my);
    onSelect(issue?.id || null);
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={700}
        height={500}
        className="w-full rounded-lg border"
        style={{ maxHeight: 500 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setHoveredId(null); setTooltip(null); }}
        onClick={handleClick}
      />
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50"
          style={{ left: tooltip.x + 16, top: tooltip.y - 10, maxWidth: 260 }}
        >
          <p className="font-semibold text-sm">{tooltip.issue.name}</p>
          <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
            <span>Impact: <strong className="text-foreground">{tooltip.issue.impactScore.toFixed(1)}</strong>/5</span>
            <span>Financier: <strong className="text-foreground">{tooltip.issue.financialScore.toFixed(1)}</strong>/5</span>
          </div>
          <div className="flex gap-1 mt-2">
            {tooltip.issue.esrsMapping.map(e => (
              <Badge key={e} className="bg-[#0F4C3A] text-white text-[10px] px-1.5 py-0">{e}</Badge>
            ))}
          </div>
          {tooltip.issue.mappingValidated && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-green-600">
              <CheckCircle2 className="h-3 w-3" /> Validé
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Legend Component ──────────────────────────────────────────────────────
function MatrixLegend({ issues }: { issues: MaterialityIssue[] }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Légende</p>
      <div className="space-y-1.5">
        {issues.map((issue, idx) => {
          const esrs = ESRS_STANDARDS.find(s => issue.esrsMapping.includes(s.code));
          return (
            <div key={issue.id} className="flex items-center gap-2 text-sm">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                style={{ backgroundColor: esrs?.color || "#6B7280", opacity: issue.mappingValidated ? 1 : 0.55 }}
              >
                {idx + 1}
              </div>
              <span className="truncate">{issue.name}</span>
              {!issue.mappingValidated && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0">
                  À valider
                </Badge>
              )}
            </div>
          );
        })}
      </div>
      <div className="border-t pt-2 mt-3 space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#059669]" /> Mapping validé
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#059669] opacity-50 border border-dashed border-[#059669]" /> À valider
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0 border-t-2 border-dashed border-amber-400" /> Seuil matérialité
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────
export function DoubleMaterialiteNew({ posture, parcours, dossierId }: DoubleMaterialiteNewProps) {
  const { getDossierData, addMaterialityIssue, updateMaterialityIssues } = useDossierData();
  const dossierData = getDossierData(dossierId);
  const materialityIssues = dossierData?.materialityIssues || [];

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<MaterialityIssue | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MaterialityIssue | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("matrice");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    impactScore: 3,
    financialScore: 3,
    stakeholders: "",
    esrsMapping: "",
    justification: "",
  });

  const isConseil = posture === "conseil";
  const isPreAudit = posture === "pre-audit";
  const isAuditExterne = posture === "audit-externe";
  const isCsrdObligatoire = parcours === "csrd-obligatoire";

  const labels = {
    title: isCsrdObligatoire ? "Double Matérialité (DMA)" : "Enjeux prioritaires",
    subtitle: isCsrdObligatoire
      ? "Analyse de matérialité et mapping automatique vers les ESRS applicables"
      : "Identification et priorisation des enjeux ESG matériels",
    mappingLabel: isCsrdObligatoire ? "ESRS proposés" : "Thématiques",
  };

  // ── Handlers ─────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormData({ name: "", description: "", impactScore: 3, financialScore: 3, stakeholders: "", esrsMapping: "", justification: "" });
    setEditingIssue(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleOpenEdit = (issue: MaterialityIssue) => {
    setFormData({
      name: issue.name,
      description: issue.description || "",
      impactScore: issue.impactScore,
      financialScore: issue.financialScore,
      stakeholders: issue.stakeholders.join(", "),
      esrsMapping: issue.esrsMapping.join(", "),
      justification: issue.justification || "",
    });
    setEditingIssue(issue);
    setIsAddDialogOpen(true);
  };

  const handleSaveIssue = () => {
    if (!formData.name.trim()) {
      toast.error("Le nom de l'enjeu est requis");
      return;
    }

    const issueData: MaterialityIssue = {
      id: editingIssue?.id || `issue-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      impactScore: formData.impactScore,
      financialScore: formData.financialScore,
      stakeholders: formData.stakeholders.split(",").map(s => s.trim()).filter(Boolean),
      esrsMapping: formData.esrsMapping.split(",").map(s => s.trim().toUpperCase()).filter(Boolean),
      mappingValidated: editingIssue?.mappingValidated || false,
      justification: formData.justification || undefined,
      auditStatus: editingIssue?.auditStatus,
    };

    if (editingIssue) {
      const updated = materialityIssues.map(i => i.id === editingIssue.id ? issueData : i);
      updateMaterialityIssues(dossierId, updated);
      toast.success(`"${issueData.name}" mis à jour`);
    } else {
      addMaterialityIssue(dossierId, issueData);
      toast.success(`"${issueData.name}" ajouté`);
    }

    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleDelete = (issue: MaterialityIssue) => {
    setDeleteTarget(issue);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const updated = materialityIssues.filter(i => i.id !== deleteTarget.id);
    updateMaterialityIssues(dossierId, updated);
    toast.success(`"${deleteTarget.name}" supprimé`);
    setDeleteTarget(null);
    if (selectedIssueId === deleteTarget.id) setSelectedIssueId(null);
  };

  const handleToggleValidation = (issue: MaterialityIssue) => {
    const updated = materialityIssues.map(i =>
      i.id === issue.id ? { ...i, mappingValidated: !i.mappingValidated } : i
    );
    updateMaterialityIssues(dossierId, updated);
    toast.success(issue.mappingValidated ? "Mapping dévalidé" : "Mapping validé");
  };

  const handleGenerateSample = () => {
    updateMaterialityIssues(dossierId, SAMPLE_ISSUES);
    toast.success(`${SAMPLE_ISSUES.length} enjeux de démonstration créés`);
  };

  const handleExport = () => {
    // Build CSV
    const headers = ["Enjeu", "Description", "Impact (1-5)", "Financier (1-5)", "Matérialité", "Parties prenantes", "ESRS", "Validé", "Justification"];
    const rows = materialityIssues.map(i => [
      i.name,
      i.description || "",
      i.impactScore.toFixed(1),
      i.financialScore.toFixed(1),
      ((i.impactScore + i.financialScore) / 2).toFixed(1),
      i.stakeholders.join("; "),
      i.esrsMapping.join("; "),
      i.mappingValidated ? "Oui" : "Non",
      i.justification || "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DMA_${dossierId}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  };

  const getMaterialityClass = (impact: number, financial: number) => {
    const avg = (impact + financial) / 2;
    if (avg >= 4) return "bg-red-100 text-red-800 border-red-300";
    if (avg >= 3) return "bg-amber-100 text-amber-800 border-amber-300";
    return "bg-green-100 text-green-800 border-green-300";
  };

  const getMaterialityLabel = (impact: number, financial: number) => {
    const avg = (impact + financial) / 2;
    if (avg >= 4) return "Critique";
    if (avg >= 3) return "Matériel";
    return "Faible";
  };

  // Stats
  const totalIssues = materialityIssues.length;
  const materialIssues = materialityIssues.filter(i => (i.impactScore + i.financialScore) / 2 >= 3).length;
  const validatedMappings = materialityIssues.filter(i => i.mappingValidated).length;
  const uniqueEsrs = new Set(materialityIssues.flatMap(i => i.esrsMapping)).size;
  const pilierE = materialityIssues.filter(i => i.esrsMapping.some(e => e.startsWith("E"))).length;
  const pilierS = materialityIssues.filter(i => i.esrsMapping.some(e => e.startsWith("S"))).length;
  const pilierG = materialityIssues.filter(i => i.esrsMapping.some(e => e.startsWith("G"))).length;

  // ── Empty state ──────────────────────────────────────────────────────
  if (materialityIssues.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground mb-2">{labels.title}</h1>
            <p className="text-muted-foreground">{labels.subtitle}</p>
          </div>
        </div>

        <Card className="border-2 border-dashed border-[#059669]">
          <CardContent className="p-12">
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-[#E8F3F0] rounded-full flex items-center justify-center">
                <Grid3x3 className="h-8 w-8 text-[#059669]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Aucune analyse de matérialité</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Commencez par identifier et évaluer vos enjeux ESG matériels.
                </p>
              </div>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button className="bg-[#059669] hover:bg-[#047857]" onClick={handleOpenAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un enjeu
                </Button>
                <Button variant="outline" onClick={handleGenerateSample}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Générer un exemple (8 enjeux)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Dialog */}
        {renderIssueDialog()}
      </div>
    );
  }

  // ── Issue Dialog (shared) ────────────────────────────────────────────
  function renderIssueDialog() {
    return (
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsAddDialogOpen(open); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingIssue ? "Modifier l'enjeu" : "Ajouter un enjeu matériel"}</DialogTitle>
            <DialogDescription>
              Définissez un enjeu ESG et évaluez sa matérialité (impact et financier)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom de l'enjeu *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Émissions GES, Diversité..." />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Décrivez l'enjeu..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Score d'impact env./social: <strong>{formData.impactScore.toFixed(1)}</strong></Label>
                <Slider min={1} max={5} step={0.1} value={[formData.impactScore]} onValueChange={([v]) => setFormData({ ...formData, impactScore: v })} className="py-2" />
                <div className="flex justify-between text-xs text-muted-foreground"><span>1 - Faible</span><span>5 - Critique</span></div>
              </div>
              <div className="space-y-2">
                <Label>Score financier: <strong>{formData.financialScore.toFixed(1)}</strong></Label>
                <Slider min={1} max={5} step={0.1} value={[formData.financialScore]} onValueChange={([v]) => setFormData({ ...formData, financialScore: v })} className="py-2" />
                <div className="flex justify-between text-xs text-muted-foreground"><span>1 - Faible</span><span>5 - Critique</span></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Parties prenantes (virgules)</Label>
                <Input value={formData.stakeholders} onChange={(e) => setFormData({ ...formData, stakeholders: e.target.value })} placeholder="Actionnaires, Clients..." />
              </div>
              <div>
                <Label>Normes ESRS (virgules)</Label>
                <Input value={formData.esrsMapping} onChange={(e) => setFormData({ ...formData, esrsMapping: e.target.value })} placeholder="E1, S1, G1..." />
                <div className="flex flex-wrap gap-1 mt-1">
                  {ESRS_STANDARDS.map(s => (
                    <button
                      key={s.code}
                      type="button"
                      className="px-1.5 py-0.5 text-[10px] rounded border hover:bg-gray-50 transition-colors"
                      style={{ borderColor: s.color, color: s.color }}
                      onClick={() => {
                        const current = formData.esrsMapping.split(",").map(x => x.trim()).filter(Boolean);
                        if (!current.includes(s.code)) {
                          setFormData({ ...formData, esrsMapping: [...current, s.code].join(", ") });
                        }
                      }}
                    >
                      {s.code}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <Label>Justification (audit trail)</Label>
              <Textarea value={formData.justification} onChange={(e) => setFormData({ ...formData, justification: e.target.value })} placeholder="Raison de la classification..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>Annuler</Button>
            <Button onClick={handleSaveIssue} className="bg-[#059669] hover:bg-[#047857]">
              {editingIssue ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Full state ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">{labels.title}</h1>
          <p className="text-muted-foreground">{labels.subtitle}</p>
        </div>
        <div className="flex gap-2">
          {isConseil && (
            <>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </Button>
              <Button size="sm" className="bg-[#059669] hover:bg-[#047857]" onClick={handleOpenAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </>
          )}
          {isAuditExterne && (
            <Badge className="bg-orange-500 text-white"><Eye className="h-3 w-3 mr-1" /> Lecture seule</Badge>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{totalIssues}</p>
          <p className="text-xs text-muted-foreground">Enjeux</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{materialIssues}</p>
          <p className="text-xs text-muted-foreground">Matériels</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{validatedMappings}/{totalIssues}</p>
          <p className="text-xs text-muted-foreground">Validés</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{uniqueEsrs}</p>
          <p className="text-xs text-muted-foreground">ESRS</p>
        </CardContent></Card>
        <Card className="border-green-200"><CardContent className="p-4 text-center">
          <Leaf className="h-4 w-4 mx-auto text-green-600 mb-1" />
          <p className="text-lg font-bold text-green-600">{pilierE}</p>
          <p className="text-xs text-muted-foreground">Environnement</p>
        </CardContent></Card>
        <Card className="border-purple-200"><CardContent className="p-4 text-center">
          <Users className="h-4 w-4 mx-auto text-purple-600 mb-1" />
          <p className="text-lg font-bold text-purple-600">{pilierS}</p>
          <p className="text-xs text-muted-foreground">Social</p>
        </CardContent></Card>
        <Card className="border-amber-200"><CardContent className="p-4 text-center">
          <Building2 className="h-4 w-4 mx-auto text-amber-600 mb-1" />
          <p className="text-lg font-bold text-amber-600">{pilierG}</p>
          <p className="text-xs text-muted-foreground">Gouvernance</p>
        </CardContent></Card>
      </div>

      {/* Tabs: Matrice / Tableau */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="matrice">
            <Target className="h-4 w-4 mr-2" />
            Matrice de matérialité
          </TabsTrigger>
          <TabsTrigger value="tableau">
            <Grid3x3 className="h-4 w-4 mr-2" />
            Tableau des enjeux
          </TabsTrigger>
        </TabsList>

        {/* Matrix Tab */}
        <TabsContent value="matrice">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6">
                <MaterialityMatrix
                  issues={materialityIssues}
                  onSelect={setSelectedIssueId}
                  selectedId={selectedIssueId}
                />
                <MatrixLegend issues={materialityIssues} />
              </div>

              {/* Selected issue detail */}
              {selectedIssueId && (() => {
                const sel = materialityIssues.find(i => i.id === selectedIssueId);
                if (!sel) return null;
                return (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{sel.name}</h4>
                        {sel.description && <p className="text-sm text-muted-foreground mt-1">{sel.description}</p>}
                      </div>
                      {isConseil && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(sel)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleToggleValidation(sel)}>
                            {sel.mappingValidated ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4" />}
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Impact:</span>{" "}
                        <strong>{sel.impactScore.toFixed(1)}</strong>/5
                      </div>
                      <div>
                        <span className="text-muted-foreground">Financier:</span>{" "}
                        <strong>{sel.financialScore.toFixed(1)}</strong>/5
                      </div>
                      <div>
                        <span className="text-muted-foreground">Matérialité:</span>{" "}
                        <Badge className={getMaterialityClass(sel.impactScore, sel.financialScore)}>
                          {getMaterialityLabel(sel.impactScore, sel.financialScore)}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">ESRS:</span>{" "}
                        {sel.esrsMapping.map(e => <Badge key={e} className="bg-[#0F4C3A] text-white text-xs ml-1">{e}</Badge>)}
                      </div>
                    </div>
                    {sel.justification && (
                      <p className="mt-2 text-sm italic text-muted-foreground border-l-2 border-green-300 pl-3">
                        {sel.justification}
                      </p>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Table Tab */}
        <TabsContent value="tableau">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Enjeu</TableHead>
                    <TableHead className="text-center">Impact</TableHead>
                    <TableHead className="text-center">Financier</TableHead>
                    <TableHead className="text-center">Matérialité</TableHead>
                    <TableHead>Parties prenantes</TableHead>
                    <TableHead>{labels.mappingLabel}</TableHead>
                    <TableHead className="text-center">Validé</TableHead>
                    {isPreAudit && <TableHead>Audit</TableHead>}
                    {isConseil && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialityIssues.map((issue, idx) => {
                    const avg = (issue.impactScore + issue.financialScore) / 2;
                    return (
                      <TableRow
                        key={issue.id}
                        className={selectedIssueId === issue.id ? "bg-green-50" : "hover:bg-gray-50 cursor-pointer"}
                        onClick={() => setSelectedIssueId(issue.id)}
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell>
                          <p className="font-medium">{issue.name}</p>
                          {issue.description && <p className="text-xs text-muted-foreground line-clamp-1">{issue.description}</p>}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center gap-1.5 justify-center">
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(issue.impactScore / 5) * 100}%` }} />
                            </div>
                            <span className="text-xs font-medium">{issue.impactScore.toFixed(1)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center gap-1.5 justify-center">
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(issue.financialScore / 5) * 100}%` }} />
                            </div>
                            <span className="text-xs font-medium">{issue.financialScore.toFixed(1)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={getMaterialityClass(issue.impactScore, issue.financialScore)}>
                            {getMaterialityLabel(issue.impactScore, issue.financialScore)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {issue.stakeholders.slice(0, 2).map((sh, i) => (
                              <Badge key={i} variant="outline" className="text-[10px]">{sh}</Badge>
                            ))}
                            {issue.stakeholders.length > 2 && (
                              <Badge variant="outline" className="text-[10px]">+{issue.stakeholders.length - 2}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {issue.esrsMapping.map((esrs, i) => {
                              const std = ESRS_STANDARDS.find(s => s.code === esrs);
                              return (
                                <Badge key={i} className="text-white text-[10px]" style={{ backgroundColor: std?.color || "#6B7280" }}>
                                  {esrs}
                                </Badge>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {issue.mappingValidated ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-500 mx-auto" />
                          )}
                        </TableCell>
                        {isPreAudit && (
                          <TableCell>
                            {issue.auditStatus === "valide" && <Badge className="bg-green-100 text-green-800">Validé</Badge>}
                            {issue.auditStatus === "reserve" && <Badge className="bg-amber-100 text-amber-800">Réserve</Badge>}
                            {issue.auditStatus === "invalide" && <Badge className="bg-red-100 text-red-800">Invalide</Badge>}
                            {!issue.auditStatus && <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                        )}
                        {isConseil && (
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-0.5 justify-end">
                              <Button variant="ghost" size="sm" onClick={() => handleToggleValidation(issue)} title="Valider/Dévalider">
                                {issue.mappingValidated ? <ToggleRight className="h-3.5 w-3.5 text-green-600" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(issue)} title="Modifier">
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(issue)} title="Supprimer">
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pre-audit alerts */}
      {isPreAudit && (() => {
        const noJustification = materialityIssues.filter(i => !i.justification).length;
        const notValidated = materialityIssues.filter(i => !i.mappingValidated).length;
        if (noJustification === 0 && notValidated === 0) return null;
        return (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-amber-800">Points bloquants pré-audit</h4>
                  {noJustification > 0 && (
                    <p className="text-sm text-amber-700">{noJustification} enjeu(x) sans justification documentée</p>
                  )}
                  {notValidated > 0 && (
                    <p className="text-sm text-amber-700">{notValidated} mapping(s) ESRS non validé(s)</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Dialogs */}
      {renderIssueDialog()}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet enjeu ?</AlertDialogTitle>
            <AlertDialogDescription>
              L'enjeu "{deleteTarget?.name}" sera définitivement supprimé de l'analyse de matérialité.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
