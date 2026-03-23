/**
 * SaisieDossier — Écran de saisie des indicateurs VSME pour un dossier
 * Layout : header dossier + onglets thématiques + tableau input par section
 * ✨ IA : bouton IA sur les champs Qualitatif/Narratif pour rédaction assistée
 */
import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/app/components/ui/select";
import {
  ChevronLeft,
  ChevronDown,
  CheckCircle2,
  Clock,
  Circle,
  Sparkles,
  X,
  Loader2,
  Wand2,
  Copy,
  Check,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  FileSpreadsheet,
  AlertTriangle,
} from "lucide-react";
import { useDossiers } from "@/contexts/DossierContext";
import { useVSMEData } from "@/contexts/VSMEDataContext";
import { MODULE_B, PILIER_COLOR, PILIER_BG, DATAPOINT_TYPES, DROPDOWN_OPTIONS, type StatutSaisie, type DataType } from "@/data/vsme-data";
import { cn } from "@/app/components/ui/utils";
import { toast } from "sonner";
import {
  getStoredApiKey,
  setStoredApiKey,
  generateQualitativeText,
} from "@/services/aiQualitativeService";
import { getWorkflowById, getSectionsForWorkflow } from "@/utils/workflowLibrary";
import { getPeriodsForDossier, getPreviousPeriod, getPreviousPeriodInList, DEFAULT_PERIOD, type PeriodDefinition } from "@/services/idbService";
import { type PeriodMode, type CustomPeriod } from "@/contexts/DossierContext";
import { EvolutionChart } from "@/app/components/views/EvolutionChart";
import { GlossaryTooltip } from "@/app/components/ui/GlossaryTooltip";
import { findGlossaryTermInText } from "@/data/glossary";
import { parseFile } from "@/utils/fileParser";
import { VSME_COL } from "@/utils/excelTemplates";

// ─── Types ────────────────────────────────────────────────────────────────────
type DataPoint = typeof MODULE_B[0]["datapoints"][0];

interface AIPanel {
  code: string;
  intitule: string;
  type: string;
  onInsert: (text: string) => void;
}

// Onglets thématiques → sections Module B
const ONGLETS = [
  { id: "general",     label: "🏢 Général",         desc: "Infos entreprise & gouvernance de base", sections: ["B1", "B2"] },
  { id: "energie",     label: "🌿 Énergie & GES",    desc: "Consommation, émissions carbone",       sections: ["B3", "B7"] },
  { id: "eau-dechets", label: "🌊 Eau & Déchets",    desc: "Ressources hydriques, déchets, pollution", sections: ["B4", "B5", "B6"] },
  { id: "social",      label: "👥 Social",            desc: "Effectifs, formation, santé & sécurité", sections: ["B8", "B9"] },
  { id: "gouvernance", label: "🏛️ Gouvernance",       desc: "Éthique, conformité, anti-corruption",  sections: ["B10", "B11"] },
];

// ── Statut icon ───────────────────────────────────────────────────────────────
function StatutIcon({ statut }: { statut: StatutSaisie }) {
  if (statut === "filled")  return <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#2d7a55" }} />;
  if (statut === "partial") return <Clock        className="w-4 h-4 flex-shrink-0" style={{ color: "#f59e0b" }} />;
  return <Circle className="w-4 h-4 flex-shrink-0" style={{ color: "#d1d5db" }} />;
}

// ── Panneau IA ─────────────────────────────────────────────────────────────────
function AIAssistPanel({
  panel,
  dossierOrg,
  fiscalYear,
  onClose,
}: {
  panel: AIPanel;
  dossierOrg?: string;
  fiscalYear?: string;
  onClose: () => void;
}) {
  const [apiKey, setApiKey]       = useState(getStoredApiKey() ?? "");
  const [showKey, setShowKey]     = useState(!getStoredApiKey());
  const [userContext, setUserContext] = useState("");
  const [result, setResult]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [copied, setCopied]       = useState(false);

  const handleGenerate = async () => {
    const key = apiKey.trim();
    if (!key) { setShowKey(true); setError("Veuillez entrer une clé API Anthropic."); return; }
    setLoading(true);
    setError("");
    setResult("");
    try {
      const text = await generateQualitativeText(
        {
          indicatorCode: panel.code,
          indicatorLabel: panel.intitule,
          indicatorType: panel.type,
          dossierOrg,
          fiscalYear,
          userContext: userContext || undefined,
        },
        key
      );
      setStoredApiKey(key);
      setResult(text);
    } catch (e) {
      setError((e as Error).message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = () => {
    if (!result) return;
    panel.onInsert(result);
    toast.success("✅ Texte inséré", { description: `Indicateur ${panel.code} mis à jour` });
    onClose();
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ background: "rgba(0,0,0,0.35)" }}
    >
      {/* Panel droit */}
      <div
        className="w-full max-w-md flex flex-col shadow-2xl overflow-y-auto"
        style={{ background: "#fff", borderLeft: "1px solid #E2EDE7" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ background: "#0A3B2E", borderBottom: "1px solid rgba(255,255,255,0.1)" }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#52B788]" />
            <span className="font-semibold text-white text-sm">Assistant IA</span>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase"
              style={{ background: "rgba(82,183,136,0.25)", color: "#52B788", letterSpacing: "0.5px" }}
            >
              Claude
            </span>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 p-5 space-y-4 overflow-y-auto">
          {/* Indicateur cible */}
          <div
            className="rounded-xl p-4 space-y-1"
            style={{ background: "#edf7f1", border: "1px solid #c3e6d1" }}
          >
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-xs font-bold px-2 py-0.5 rounded"
                style={{ background: "#2d7a55", color: "white" }}
              >
                {panel.code}
              </span>
              <Badge
                className="text-[10px]"
                style={{
                  background:
                    panel.type === "Narratif" ? "#fff7ed" : "#fefce8",
                  color:
                    panel.type === "Narratif" ? "#ea580c" : "#d97706",
                  border: "none",
                }}
              >
                {panel.type}
              </Badge>
            </div>
            <p className="text-sm font-medium" style={{ color: "#1a2e24" }}>
              {panel.intitule}
            </p>
          </div>

          {/* Clé API */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold" style={{ color: "#4a6b57" }}>
                Clé API Anthropic
              </label>
              <button
                className="text-[11px] underline"
                style={{ color: "#9ca3af" }}
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? "Masquer" : "Modifier"}
              </button>
            </div>
            {showKey ? (
              <>
                {!getStoredApiKey() && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                    <p className="text-xs font-semibold text-amber-800 mb-1">🔑 Configuration requise</p>
                    <p className="text-xs text-amber-700">
                      Pour utiliser l'assistant IA, vous avez besoin d'une clé API Anthropic.
                      C'est gratuit pour commencer !
                    </p>
                  </div>
                )}
                <input
                  type="password"
                  placeholder="sk-ant-api03-..."
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{
                    border: "1.5px solid #e2e8f0",
                    background: "#f8fafc",
                    color: "#1a2e24",
                  }}
                  onFocus={e => { e.target.style.borderColor = "#1a5f3f"; }}
                  onBlur={e => { e.target.style.borderColor = "#e2e8f0"; }}
                />
              </>
            ) : (
              <div
                className="text-xs py-2 px-3 rounded-lg"
                style={{ background: "#f0fdf4", color: "#2d7a55", border: "1px solid #bbf7d0" }}
              >
                ✓ Clé configurée
              </div>
            )}
            <p className="text-[11px] mb-2" style={{ color: "#9ca3af" }}>
              La clé est stockée localement dans votre navigateur.
            </p>
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: "#E8F3F0", color: "#1a5f3f" }}
            >
              🔗 Obtenir une clé gratuite sur console.anthropic.com →
            </a>
          </div>

          {/* Contexte optionnel */}
          <div className="space-y-2">
            <label className="text-xs font-semibold" style={{ color: "#4a6b57" }}>
              Contexte de l'entreprise{" "}
              <span className="font-normal" style={{ color: "#9ca3af" }}>(optionnel)</span>
            </label>
            <textarea
              placeholder="Ex: PME industrielle de 45 salariés, secteur métallurgie, certifiée ISO 14001 depuis 2022…"
              value={userContext}
              onChange={e => setUserContext(e.target.value)}
              rows={3}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
              style={{
                border: "1.5px solid #e2e8f0",
                background: "#f8fafc",
                color: "#1a2e24",
              }}
              onFocus={e => { e.target.style.borderColor = "#1a5f3f"; }}
              onBlur={e => { e.target.style.borderColor = "#e2e8f0"; }}
            />
          </div>

          {/* Bouton générer */}
          <Button
            className="w-full gap-2 font-semibold"
            style={{ background: "#1a5f3f", color: "white" }}
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Génération en cours…
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                ✨ Générer avec Claude IA
              </>
            )}
          </Button>

          {/* Erreur */}
          {error && (
            <div
              className="rounded-xl p-3 text-sm"
              style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Résultat */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold" style={{ color: "#4a6b57" }}>
                  Texte généré
                </p>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] transition-colors"
                  style={{ color: copied ? "#2d7a55" : "#9ca3af" }}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copié !" : "Copier"}
                </button>
              </div>
              <div
                className="rounded-xl p-4 text-sm leading-relaxed"
                style={{
                  background: "#f0fdf4",
                  border: "1.5px solid #86efac",
                  color: "#1a2e24",
                  whiteSpace: "pre-wrap",
                }}
              >
                {result}
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 gap-2 font-semibold"
                  style={{ background: "#2d7a55", color: "white" }}
                  onClick={handleInsert}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Insérer dans le champ
                </Button>
                <Button
                  variant="outline"
                  className="gap-1"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Regénérer
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Row de saisie ─────────────────────────────────────────────────────────────
// ── Delta badge (comparaison entre périodes) ─────────────────────────────────
/** Seuil d'alerte configurable pour la revue de cohérence (%) */
const COHERENCE_THRESHOLD = 30;

function DeltaBadge({ delta, deltaPct }: { delta: number | null; deltaPct: number | null }) {
  if (delta === null || deltaPct === null) {
    return (
      <span className="text-[11px] flex items-center gap-1" style={{ color: "#d1d5db" }}>
        <Minus className="w-3 h-3" />
        —
      </span>
    );
  }
  const isPositive = delta > 0;
  const isZero = delta === 0;
  const isAnomaly = Math.abs(deltaPct) > COHERENCE_THRESHOLD;

  if (isZero) {
    return (
      <span className="text-[11px] flex items-center gap-1" style={{ color: "#9ca3af" }}>
        <Minus className="w-3 h-3" />
        0%
      </span>
    );
  }

  return (
    <span
      className={cn(
        "text-[11px] font-semibold flex items-center gap-0.5",
        isAnomaly && "relative"
      )}
      style={{ color: isAnomaly ? "#dc2626" : isPositive ? "#dc2626" : "#2d7a55" }}
      title={isAnomaly ? `⚠️ Écart significatif (>${COHERENCE_THRESHOLD}%) — Justification recommandée` : undefined}
    >
      {isAnomaly ? (
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse flex-shrink-0" />
      ) : isPositive ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      {isPositive ? "+" : ""}{deltaPct}%
      {isAnomaly && (
        <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
      )}
    </span>
  );
}

function IndicatorRow({
  dp,
  rawValue,
  statut,
  onValueChange,
  onAIAssist,
  showDelta,
  delta,
  deltaPct,
}: {
  dp: DataPoint;
  rawValue: string;
  statut: StatutSaisie;
  onValueChange: (code: string, value: string, statut: StatutSaisie) => void;
  onAIAssist?: () => void;
  showDelta?: boolean;
  delta?: number | null;
  deltaPct?: number | null;
}) {
  const isFilled     = statut === "filled";
  const isComputed   = dp.computed === true;
  const isQualitative = dp.type === "Narratif" || dp.type === "Qualitatif";
  const dataType: DataType = DATAPOINT_TYPES[dp.code] || (isQualitative ? "Narratif" : "Numérique");
  const isDropdown = dataType === "Liste déroulante";
  const isYesNo = dataType === "Oui/Non";
  const dropdownOptions = DROPDOWN_OPTIONS[dp.code];

  const handleChange = (val: string) => {
    const newStatut: StatutSaisie = val.trim() === "" ? "empty" : "filled";
    onValueChange(dp.code, val, newStatut);
  };

  return (
    <tr
      className={cn(
        "border-b transition-colors group",
        isFilled && !isComputed && "bg-[#f8fdf9]",
        !isFilled && "hover:bg-slate-50/60"
      )}
      style={{ borderColor: "#f1f5f1" }}
    >
      {/* Statut */}
      <td className="w-10 pl-4 py-3 text-center">
        <StatutIcon statut={statut} />
      </td>

      {/* Code */}
      <td className="w-16 pr-2 py-3">
        <span className="font-mono text-xs font-semibold" style={{ color: "#9ca3af" }}>
          {dp.code}
        </span>
      </td>

      {/* Intitulé + tooltip glossaire */}
      <td className="py-3 pr-4 min-w-[200px]">
        <span
          className="text-sm inline-flex items-center gap-1"
          style={isComputed ? { color: "#1a5f8a", fontStyle: "italic" } : { color: "#1a2e24" }}
        >
          {dp.intitule}
          {isComputed && (
            <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 h-4 border-blue-300 text-blue-600 bg-blue-50">
              ⚡ Calculé
            </Badge>
          )}
          {/* Icône (?) glossaire contextuelle */}
          {(() => {
            const glossaryMatch = findGlossaryTermInText(dp.intitule);
            if (glossaryMatch) {
              return <GlossaryTooltip term={glossaryMatch.term} variant="icon" />;
            }
            return null;
          })()}
        </span>
        {dp.obligatoire && (
          <span className="ml-2 text-[10px] font-semibold" style={{ color: "#dc2626" }}>*</span>
        )}
      </td>

      {/* Valeur */}
      <td className="w-52 py-3 pr-3">
        {isComputed ? (
          <div
            className="h-8 px-3 rounded flex items-center text-sm tabular-nums"
            title="Valeur calculée automatiquement — non modifiable"
            style={{
              background: rawValue ? PILIER_BG["E"] : "#f8fafc",
              border: `1.5px solid ${rawValue ? "#1a5f8a" : "#e2e8f0"}`,
              color: "#1a5f8a",
              fontStyle: "italic",
            }}
          >
            {rawValue || "—"}
          </div>
        ) : isDropdown && dropdownOptions ? (
          /* Liste déroulante avec options prédéfinies */
          <select
            className="w-full h-8 rounded px-2 text-sm transition-all outline-none cursor-pointer"
            style={{
              background: isFilled ? "#edf7f1" : "white",
              border: `1.5px solid ${isFilled ? "#2d7a55" : "#e2e8f0"}`,
              color: "#1a2e24",
            }}
            value={rawValue}
            onChange={e => handleChange(e.target.value)}
          >
            <option value="">— Sélectionner —</option>
            {dropdownOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : isYesNo ? (
          /* Oui / Non */
          <select
            className="w-full h-8 rounded px-2 text-sm transition-all outline-none cursor-pointer"
            style={{
              background: isFilled ? "#edf7f1" : "white",
              border: `1.5px solid ${isFilled ? "#2d7a55" : "#e2e8f0"}`,
              color: "#1a2e24",
            }}
            value={rawValue}
            onChange={e => handleChange(e.target.value)}
          >
            <option value="">— Sélectionner —</option>
            <option value="Oui">Oui</option>
            <option value="Non">Non</option>
          </select>
        ) : isQualitative ? (
          <div className="relative">
            <textarea
              className="w-full rounded px-2.5 py-1.5 text-sm resize-none transition-all outline-none pr-8"
              style={{
                background: isFilled ? "#edf7f1" : "white",
                border: `1.5px solid ${isFilled ? "#2d7a55" : "#e2e8f0"}`,
                color: "#1a2e24",
                minHeight: "60px",
              }}
              value={rawValue}
              onChange={e => handleChange(e.target.value)}
              placeholder="Saisir…"
              rows={2}
              onFocus={e => { e.target.style.borderColor = "#1a5f3f"; }}
              onBlur={e => { e.target.style.borderColor = isFilled ? "#2d7a55" : "#e2e8f0"; }}
            />
            {/* Bouton IA */}
            {onAIAssist && (
              <button
                onClick={onAIAssist}
                title="Rédiger avec l'IA"
                className="absolute top-1.5 right-1.5 p-1 rounded transition-all opacity-0 group-hover:opacity-100 hover:opacity-100"
                style={{ background: "#0A3B2E", color: "#52B788" }}
              >
                <Sparkles className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <input
            type="number"
            className="w-full h-8 rounded px-2.5 text-sm tabular-nums transition-all outline-none"
            style={{
              background: isFilled ? "#edf7f1" : "white",
              border: `1.5px solid ${isFilled ? "#2d7a55" : "#e2e8f0"}`,
              color: "#1a2e24",
            }}
            value={rawValue}
            onChange={e => handleChange(e.target.value)}
            placeholder="0"
            onFocus={e => { e.target.style.borderColor = "#1a5f3f"; e.target.style.boxShadow = "0 0 0 2px rgba(26,95,63,0.1)"; }}
            onBlur={e => { e.target.style.borderColor = isFilled ? "#2d7a55" : "#e2e8f0"; e.target.style.boxShadow = "none"; }}
          />
        )}
      </td>

      {/* Unité */}
      <td className="w-24 py-3 pr-3">
        <span className="text-xs tabular-nums" style={{ color: "#9ca3af" }}>
          {dp.unite ?? "—"}
        </span>
      </td>

      {/* Type de donnée (fin) */}
      <td className="w-28 py-3">
        {(() => {
          const dataType: DataType = DATAPOINT_TYPES[dp.code] || (
            dp.type === "Quantitatif" || dp.type === "Calculé" ? "Numérique" : "Narratif"
          );
          const typeStyles: Record<DataType, { bg: string; color: string }> = {
            "Numérique":        { bg: "#eff6ff", color: "#3b82f6" },
            "Narratif":         { bg: "#fff7ed", color: "#ea580c" },
            "URL":              { bg: "#f0fdf4", color: "#16a34a" },
            "Liste déroulante": { bg: "#fefce8", color: "#d97706" },
            "Tableau":          { bg: "#f5f3ff", color: "#7c3aed" },
            "Oui/Non":          { bg: "#fce4ec", color: "#e91e63" },
            "Choix multiple":   { bg: "#e8eaf6", color: "#3f51b5" },
          };
          const s = typeStyles[dataType];
          return (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap"
              style={{ background: s.bg, color: s.color }}
            >
              {dataType}
            </span>
          );
        })()}
      </td>

      {/* Delta (visible uniquement en mode trimestriel) */}
      {showDelta && (
        <td className="w-20 py-3 text-center">
          <DeltaBadge delta={delta ?? null} deltaPct={deltaPct ?? null} />
        </td>
      )}
    </tr>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
interface SaisieDossierProps {
  dossierId: string;
  workflowId?: string | null; // 🆕 Phase 11 : filtrer par workflow actif
  onBack: () => void;
  onNavigate: (view: string) => void;
}

export function SaisieDossier({ dossierId, workflowId, onBack, onNavigate: _onNavigate }: SaisieDossierProps) {
  // 🆕 Phase 11 : résoudre le workflow actif et filtrer les onglets
  const activeWorkflow = workflowId ? getWorkflowById(workflowId) : null;
  const workflowSections = workflowId ? getSectionsForWorkflow(workflowId) : null;
  const visibleOnglets = workflowSections
    ? ONGLETS.filter(tab => tab.sections.some(s => workflowSections.includes(s)))
    : ONGLETS;
  const { getDossier } = useDossiers();
  const {
    getValues,
    setValue,
    loadDossier,
    getStats,
    getActivePeriod,
    setActivePeriod,
    getAvailablePeriods,
    loadAvailablePeriods,
    getValueComparison,
  } = useVSMEData();

  const defaultTab = visibleOnglets[0]?.id ?? "energie";
  const [activeTab, setActiveTab]       = useState(defaultTab);
  const [saveIndicator, setSaveIndicator] = useState(false);
  const [aiPanel, setAiPanel]           = useState<AIPanel | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [importing, setImporting] = useState(false);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  // 🆕 Phase 12b : Mode de période LU DEPUIS LE DOSSIER (pas un filtre local)
  const dossier = getDossier(dossierId);
  const fiscalYear = dossier?.fiscalYear ?? DEFAULT_PERIOD;
  const periodMode: PeriodMode = dossier?.periodMode ?? 'annuel';

  // Générer les périodes selon le mode du dossier
  const periods = useMemo(
    () => getPeriodsForDossier(fiscalYear, periodMode, dossier?.customPeriods),
    [fiscalYear, periodMode, dossier?.customPeriods],
  );

  // Période active pour ce dossier
  const activePeriod = getActivePeriod(dossierId);

  // Période précédente (pour calcul delta)
  const previousPeriod = useMemo(() => {
    if (periodMode === 'personnalise') {
      return getPreviousPeriodInList(activePeriod, periods);
    }
    return getPreviousPeriod(activePeriod);
  }, [activePeriod, periodMode, periods]);

  // Charger les données dès l'ouverture
  useEffect(() => {
    // Si pas encore initialisé → mettre la 1ère période
    if (!activePeriod || activePeriod === DEFAULT_PERIOD) {
      const firstPeriod = periods[0]?.id ?? fiscalYear;
      setActivePeriod(dossierId, firstPeriod);
    }
    loadDossier(dossierId);
    loadAvailablePeriods(dossierId);
  }, [dossierId, loadDossier, loadAvailablePeriods, activePeriod, periods, fiscalYear, setActivePeriod]);

  // Charger la période précédente pour les deltas (multi-périodes)
  useEffect(() => {
    if (periods.length > 1 && previousPeriod) {
      loadDossier(dossierId, previousPeriod);
    }
  }, [dossierId, periods.length, previousPeriod, loadDossier]);

  // Changer de période
  const handlePeriodChange = (newPeriod: string) => {
    setActivePeriod(dossierId, newPeriod);
    loadDossier(dossierId, newPeriod);
  };

  // Changer le mode de période du dossier (persisté)
  const { updateDossier } = useDossiers();
  const handlePeriodModeChange = (newMode: PeriodMode) => {
    updateDossier(dossierId, { periodMode: newMode });
    const newPeriods = getPeriodsForDossier(fiscalYear, newMode, dossier?.customPeriods);
    setActivePeriod(dossierId, newPeriods[0]?.id ?? fiscalYear);
    toast.info(`Fréquence de saisie changée : ${newMode}`);
  };

  const dossierValues = getValues(dossierId, activePeriod);
  const stats = getStats(dossierId, "B", activePeriod);

  // Stats par pilier (utilise la période active)
  const statsByPilier = useMemo(() => {
    const result: Record<string, { filled: number; total: number; pct: number }> = {};
    for (const pilier of ["E", "S", "G"]) {
      const dps = MODULE_B
        .flatMap(s => s.datapoints)
        .filter(dp => dp.pilier === pilier && !dp.computed);
      const total = dps.length;
      const filled = dps.filter(dp => dossierValues.statuts[dp.code] === "filled").length;
      result[pilier] = { total, filled, pct: total > 0 ? Math.round((filled / total) * 100) : 0 };
    }
    return result;
  }, [dossierValues]);


  const handleValueChange = (code: string, value: string, statut: StatutSaisie) => {
    setValue(dossierId, code, value, statut, activePeriod);
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 1200);
  };

  // ── Import Excel/CSV : remplit uniquement les champs vides ──────────────────
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      // Utiliser le parser unifié (ExcelJS pour .xlsx, PapaParse pour .csv)
      const result = await parseFile(file);

      if (result.rows.length === 0) {
        toast.error("Fichier vide ou invalide");
        return;
      }

      // Détecter les colonnes code et valeur
      // Priorité 1 : format VSME Solvid.IA ("Code VSME" + "Valeur à saisir")
      const vsmeCodeCol = result.headers.includes(VSME_COL.CODE) ? VSME_COL.CODE : null;
      const vsmeValCol = result.headers.includes(VSME_COL.VALEUR) ? VSME_COL.VALEUR : null;

      // Priorité 2 : colonnes génériques (code/indicateur + valeur/value)
      const codeHeader = vsmeCodeCol ?? result.headers.find(h => {
        const l = h.toLowerCase();
        return l.includes('code') || l.includes('indicateur');
      });
      const valueHeader = vsmeValCol ?? result.headers.find(h => {
        const l = h.toLowerCase();
        return l.includes('valeur') || l.includes('value');
      });

      if (!codeHeader || !valueHeader) {
        toast.error("Colonnes manquantes", {
          description: "Le fichier doit contenir des colonnes 'Code' et 'Valeur'",
        });
        return;
      }

      // Parser les lignes et remplir uniquement les trous
      let imported = 0;
      let skipped = 0;

      for (const row of result.rows) {
        const code = String(row.data[codeHeader] ?? '').trim();
        const value = String(row.data[valueHeader] ?? '').trim();

        if (!code || !value) continue;

        // Vérifier que le code existe dans MODULE_B
        const dpExists = MODULE_B.some(s => s.datapoints.some(dp => dp.code === code));
        if (!dpExists) continue;

        // Ne remplir que les champs vides (pas de remplacement)
        const currentStatut = dossierValues.statuts[code];
        if (currentStatut === "filled") {
          skipped++;
          continue;
        }

        // Remplir le trou
        setValue(dossierId, code, value, "filled", activePeriod);
        imported++;
      }

      setSaveIndicator(true);
      setTimeout(() => setSaveIndicator(false), 2000);

      if (imported > 0) {
        toast.success(`Import terminé`, {
          description: `${imported} donnée(s) importée(s)${skipped > 0 ? ` · ${skipped} déjà remplie(s) (non écrasées)` : ''}`,
        });
      } else {
        toast.info("Aucune donnée importée", {
          description: skipped > 0
            ? `${skipped} donnée(s) déjà remplies — aucun trou à combler`
            : "Aucun code correspondant trouvé dans le fichier",
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur de lecture du fichier";
      toast.error(msg);
    } finally {
      setImporting(false);
      if (excelInputRef.current) excelInputRef.current.value = '';
    }
  };

  if (!dossier) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm" style={{ color: "#6b7280" }}>Dossier introuvable.</p>
      </div>
    );
  }

  const badgeColor = stats.pct >= 80 ? "#2d7a55" : stats.pct >= 40 ? "#f59e0b" : "#6b7280";
  const badgeLabel = stats.pct >= 80 ? "Avancé" : stats.pct >= 40 ? "En cours" : "Démarré";

  return (
    <>
      {/* 🆕 Panneau IA (overlay) */}
      {aiPanel && (
        <AIAssistPanel
          panel={aiPanel}
          dossierOrg={dossier.clientOrg}
          fiscalYear={dossier.fiscalYear}
          onClose={() => setAiPanel(null)}
        />
      )}

      <div className="space-y-5">
        {/* ── Header dossier ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E2EDE7" }}>
          <div className="flex items-start justify-between gap-6">
            {/* Left: breadcrumb + titre */}
            <div className="flex-1 min-w-0">
              <button
                onClick={onBack}
                className="flex items-center gap-1 text-xs mb-3 hover:underline transition-colors"
                style={{ color: "#9ca3af" }}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Mes Dossiers
              </button>

              <div className="flex items-center gap-3 flex-wrap">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                  style={{ background: "#1a5f3f" }}
                >
                  {dossier.clientOrg?.[0]?.toUpperCase() ?? "D"}
                </div>

                <div>
                  <h1 className="text-xl font-bold" style={{ color: "#0A3B2E" }}>
                    {dossier.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs" style={{ color: "#6b7280" }}>
                      {dossier.clientOrg}
                    </span>
                    <span style={{ color: "#d1d5db" }}>·</span>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: "#edf7f1", color: "#2d7a55" }}
                    >
                      {dossier.referentielId ?? "ESG"}
                    </span>
                    <span style={{ color: "#d1d5db" }}>·</span>
                    <span className="text-xs" style={{ color: "#6b7280" }}>
                      Année {dossier.fiscalYear}
                    </span>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                      style={{ background: `${badgeColor}15`, color: badgeColor }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: badgeColor }}
                      />
                      {badgeLabel} · {stats.pct}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: barre progression + indicateur sauvegarde */}
            <div className="flex items-center gap-6 flex-shrink-0">
              {/* Mini progress E/S/G */}
              <div className="space-y-1.5 w-44 hidden md:block">
                {(["E", "S", "G"] as const).map(p => (
                  <div key={p} className="flex items-center gap-2">
                    <GlossaryTooltip term="Pilier ESG" showIcon={false}>
                      <span className="text-xs font-semibold w-4 text-right" style={{ color: PILIER_COLOR[p] }}>{p}</span>
                    </GlossaryTooltip>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${statsByPilier[p]?.pct ?? 0}%`, background: PILIER_COLOR[p] }}
                      />
                    </div>
                    <span className="text-[11px] tabular-nums" style={{ color: "#9ca3af" }}>
                      {statsByPilier[p]?.pct ?? 0}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Score global */}
              <div className="text-center">
                <p className="text-3xl font-bold" style={{ color: "#1a5f3f" }}>{stats.pct}%</p>
                <p className="text-[11px]" style={{ color: "#9ca3af" }}>
                  {stats.filled}/{stats.total} données
                </p>
              </div>

              {/* 🆕 Bouton Importer par Excel */}
              <div className="flex flex-col items-center gap-1">
                <input
                  ref={excelInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleExcelImport}
                />
                <button
                  onClick={() => excelInputRef.current?.click()}
                  disabled={importing}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all border cursor-pointer"
                  style={{
                    background: importing ? "#f3f4f6" : "#f0fdf4",
                    borderColor: importing ? "#d1d5db" : "#bbf7d0",
                    color: importing ? "#9ca3af" : "#1a5f3f",
                  }}
                  onMouseEnter={(e) => { if (!importing) { e.currentTarget.style.background = "#dcfce7"; } }}
                  onMouseLeave={(e) => { if (!importing) { e.currentTarget.style.background = "#f0fdf4"; } }}
                  title="Importer un fichier CSV/Excel pour compléter automatiquement les données manquantes"
                >
                  {importing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4" />
                  )}
                  {importing ? "Import..." : "Importer Excel"}
                </button>
                <p className="text-[10px]" style={{ color: "#9ca3af" }}>
                  Complète les trous
                </p>
              </div>

              {/* Indicateur de sauvegarde auto */}
              <div
                className="flex items-center gap-1.5 text-xs transition-opacity duration-300"
                style={{ opacity: saveIndicator ? 1 : 0, color: "#2d7a55" }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Sauvegardé
              </div>
            </div>
          </div>
        </div>

        {/* 🆕 Phase 11 : Bannière workflow actif */}
        {activeWorkflow && (
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-3 border-2 border-blue-200"
            style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)' }}
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white text-sm flex-shrink-0">
              {activeWorkflow.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900">
                Saisie pour : {activeWorkflow.name}
              </p>
              <p className="text-xs text-blue-600">
                Sections affichées : {workflowSections?.join(', ')} — {visibleOnglets.length} onglet(s) sur {ONGLETS.length}
              </p>
            </div>
          </div>
        )}

        {/* 🆕 Phase 12 : Sélecteur de période */}
        <div
          className="bg-white rounded-xl border p-4 space-y-3"
          style={{ borderColor: "#E2EDE7" }}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Left: mode badge + sélecteur de période */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" style={{ color: "#1a5f3f" }} />
                <span className="text-sm font-semibold" style={{ color: "#0A3B2E" }}>
                  Période
                </span>
                <Badge
                  className="capitalize text-[10px] px-2"
                  style={{ background: "#E2EDE7", color: "#1a5f3f", border: "none" }}
                >
                  {periodMode}
                </Badge>
              </div>

              {/* Sélecteur de période — visible uniquement si > 1 période */}
              {periods.length > 1 && (
                <Select value={activePeriod} onValueChange={handlePeriodChange}>
                  <SelectTrigger
                    className="w-[220px] h-9 text-sm rounded-lg"
                    style={{ borderColor: "#E2EDE7", color: "#0A3B2E" }}
                  >
                    <SelectValue placeholder="Sélectionner une période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel className="text-xs" style={{ color: "#9ca3af" }}>
                        {periodMode === 'trimestriel' ? `Trimestres ${fiscalYear}`
                          : periodMode === 'mensuel' ? `Mois ${fiscalYear}`
                          : `Périodes ${fiscalYear}`}
                      </SelectLabel>
                      {periods.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    {/* Option cumul annuel si multi-périodes */}
                    {periodMode !== 'annuel' && (
                      <SelectGroup>
                        <SelectLabel className="text-xs" style={{ color: "#9ca3af" }}>
                          Cumul annuel
                        </SelectLabel>
                        <SelectItem value={fiscalYear}>
                          Cumul {fiscalYear} (annuel)
                        </SelectItem>
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              )}

              {/* Bouton modifier le mode — discret */}
              <Select
                value={periodMode}
                onValueChange={(v: string) => handlePeriodModeChange(v as PeriodMode)}
              >
                <SelectTrigger
                  className="w-8 h-8 p-0 rounded-lg border-dashed"
                  style={{ borderColor: "#d1d5db" }}
                  title="Modifier la fréquence de saisie"
                >
                  <span className="text-xs">⚙️</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annuel">📅 Annuel</SelectItem>
                  <SelectItem value="trimestriel">📊 Trimestriel</SelectItem>
                  <SelectItem value="mensuel">📈 Mensuel</SelectItem>
                  <SelectItem value="personnalise">⚙️ Personnalisé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Right: info delta */}
            {periods.length > 1 && previousPeriod && (
              <div
                className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg"
                style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#2d7a55" }}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                Comparaison avec{" "}
                <span className="font-semibold">
                  {periods.find(p => p.id === previousPeriod)?.shortLabel ?? previousPeriod}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 🆕 Bandeau IA */}
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: "linear-gradient(135deg, #0A3B2E 0%, #1a5f3f 100%)" }}
        >
          <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: "#52B788" }} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Assistant IA disponible</p>
            {getStoredApiKey() ? (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                Cliquez sur le bouton ✨ qui apparaît sur les champs qualitatifs pour rédiger automatiquement avec Claude
              </p>
            ) : (
              <p className="text-xs" style={{ color: "#f59e0b" }}>
                ⚠️ Clé API non configurée — cliquez sur ✨ sur un champ qualitatif pour la configurer
              </p>
            )}
          </div>
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-full uppercase flex-shrink-0"
            style={{ background: "rgba(82,183,136,0.2)", color: "#52B788", letterSpacing: "0.5px" }}
          >
            Claude 3
          </span>
        </div>

        {/* ── Légende des statuts ───────────────────────────────────────── */}
        <div className="flex items-center gap-5 px-1 py-1">
          <span className="text-[11px] font-medium" style={{ color: "#9ca3af" }}>Légende :</span>
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "#6b7280" }}>
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#2d7a55" }} /> Rempli
          </span>
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "#6b7280" }}>
            <Clock className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} /> Partiel
          </span>
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "#6b7280" }}>
            <Circle className="w-3.5 h-3.5" style={{ color: "#d1d5db" }} /> Vide
          </span>
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "#6b7280" }}>
            <Sparkles className="w-3.5 h-3.5" style={{ color: "#52B788" }} /> IA disponible
          </span>
        </div>

        {/* ── Onglets thématiques ───────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border rounded-xl p-1 gap-1 h-auto w-full justify-start overflow-x-auto" style={{ borderColor: "#E2EDE7" }}>
            {visibleOnglets.map(tab => {
              const tabDps = MODULE_B
                .filter(s => tab.sections.includes(s.id))
                .filter(s => !workflowSections || workflowSections.includes(s.id))
                .flatMap(s => s.datapoints)
                .filter(dp => !dp.computed);
              const tabFilled = tabDps.filter(dp => dossierValues.statuts[dp.code] === "filled").length;
              const tabPct = tabDps.length > 0 ? Math.round((tabFilled / tabDps.length) * 100) : 0;

              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  title={tab.desc}
                  className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-[#1a5f3f] data-[state=active]:text-white data-[state=active]:shadow-none flex items-center gap-2 whitespace-nowrap"
                >
                  {tab.label}
                  {tabPct > 0 && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: tabPct === 100 ? "rgba(45,122,85,0.2)" : "rgba(0,0,0,0.08)",
                        color: tabPct === 100 ? "#2d7a55" : "inherit",
                      }}
                    >
                      {tabPct}%
                    </span>
                  )}
                </TabsTrigger>
              );
            })}

            {/* 🆕 Phase 12b : Onglet Évolution (visible si multi-périodes) */}
            {periods.length > 1 && (
              <TabsTrigger
                value="evolution"
                className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-[#1a5f3f] data-[state=active]:text-white data-[state=active]:shadow-none flex items-center gap-2 whitespace-nowrap"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Évolution
              </TabsTrigger>
            )}
          </TabsList>

          {/* 🆕 Phase 12b : Contenu onglet Évolution */}
          {periods.length > 1 && (
            <TabsContent value="evolution" className="mt-4">
              <EvolutionChart
                dossierId={dossierId}
                fiscalYear={fiscalYear}
                periodMode={periodMode}
                customPeriods={dossier?.customPeriods}
              />
            </TabsContent>
          )}

          {/* ── Contenu par onglet ────────────────────────────────────── */}
          {visibleOnglets.map(tab => {
            const sections = MODULE_B
              .filter(s => tab.sections.includes(s.id))
              .filter(s => !workflowSections || workflowSections.includes(s.id));

            return (
              <TabsContent key={tab.id} value={tab.id} className="space-y-4 mt-4">
                {/* Barre de recherche indicateurs */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#9ca3af" }} />
                  <input
                    type="text"
                    placeholder="Rechercher une donnée (code ou intitulé)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2"
                    style={{ borderColor: "#E2EDE7" }}
                    onFocus={e => { e.target.style.borderColor = "#1a5f3f"; }}
                    onBlur={e => { e.target.style.borderColor = "#E2EDE7"; }}
                  />
                </div>

                {sections.map(section => {
                  // Filtrer les datapoints en fonction de la recherche
                  const filteredDatapoints = searchQuery.trim()
                    ? section.datapoints.filter(dp =>
                        dp.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        dp.intitule.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                    : section.datapoints;

                  // Masquer la section si aucun datapoint ne correspond
                  if (searchQuery.trim() && filteredDatapoints.length === 0) return null;

                  const sectionFilled = section.datapoints
                    .filter(dp => !dp.computed)
                    .filter(dp => dossierValues.statuts[dp.code] === "filled").length;
                  const sectionTotal = section.datapoints.filter(dp => !dp.computed).length;
                  const headerColor = section.pilier === "Général"
                    ? PILIER_COLOR.Général
                    : PILIER_COLOR[section.pilier as keyof typeof PILIER_COLOR];
                  const isCollapsed = collapsedSections.has(section.id);

                  return (
                    <div
                      key={section.id}
                      className="bg-white rounded-xl overflow-hidden border shadow-sm"
                      style={{ borderColor: "#E2EDE7" }}
                    >
                      {/* En-tête coloré (cliquable pour replier/déplier) */}
                      <div
                        className="px-5 py-3 flex items-center justify-between cursor-pointer select-none"
                        style={{ background: headerColor }}
                        onClick={() => toggleSection(section.id)}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="font-mono font-bold px-2 py-0.5 rounded text-sm"
                            style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
                          >
                            {section.id}
                          </span>
                          <GlossaryTooltip term="Section" showIcon={false}>
                            <span className="font-semibold text-white text-sm">{section.titre}</span>
                          </GlossaryTooltip>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs font-semibold px-2 py-1 rounded"
                            style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
                          >
                            {sectionFilled}/{sectionTotal}
                          </span>
                          <ChevronDown
                            className="w-4 h-4 text-white transition-transform duration-200"
                            style={{ transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
                          />
                        </div>
                      </div>

                      {/* Tableau de saisie (repliable) */}
                      {!isCollapsed && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr style={{ borderBottom: "1px solid #f1f5f1" }}>
                                <th className="w-10" />
                                <th className="w-16 py-2 text-xs font-semibold" style={{ color: "#9ca3af" }}>Code</th>
                                <th className="py-2 text-xs font-semibold" style={{ color: "#9ca3af" }}>
                                  <GlossaryTooltip term="Indicateur">Indicateur</GlossaryTooltip>
                                </th>
                                <th className="w-52 py-2 text-xs font-semibold" style={{ color: "#9ca3af" }}>
                                  Valeur{" "}
                                  <span
                                    className="ml-1 font-normal"
                                    style={{ color: "#52B788", fontSize: "10px" }}
                                  >
                                    ✨ = IA disponible
                                  </span>
                                </th>
                                <th className="w-24 py-2 text-xs font-semibold" style={{ color: "#9ca3af" }}>Unité</th>
                                <th className="w-28 py-2 text-xs font-semibold" style={{ color: "#9ca3af" }}>Type de donnée</th>
                                {periods.length > 1 && previousPeriod && (
                                  <th className="w-20 py-2 text-xs font-semibold text-center" style={{ color: "#9ca3af" }}>
                                    <span title={`Variation par rapport à ${previousPeriod}`}>
                                      \u0394
                                    </span>
                                  </th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {filteredDatapoints.map(dp => {
                                const isQualitative = dp.type === "Narratif" || dp.type === "Qualitatif";
                                const showDelta = periods.length > 1 && !!previousPeriod;
                                const comparison = showDelta
                                  ? getValueComparison(dossierId, dp.code, previousPeriod!, activePeriod)
                                  : null;
                                return (
                                  <IndicatorRow
                                    key={dp.code}
                                    dp={dp as DataPoint}
                                    rawValue={dossierValues.values[dp.code] ?? ""}
                                    statut={dossierValues.statuts[dp.code] ?? "empty"}
                                    onValueChange={handleValueChange}
                                    showDelta={showDelta}
                                    delta={comparison?.delta}
                                    deltaPct={comparison?.deltaPct}
                                    // 🆕 IA uniquement sur les champs qualitatifs/narratifs
                                    onAIAssist={
                                      isQualitative
                                        ? () =>
                                            setAiPanel({
                                              code: dp.code,
                                              intitule: dp.intitule,
                                              type: dp.type,
                                              onInsert: (text) =>
                                                handleValueChange(dp.code, text, text ? "filled" : "empty"),
                                            })
                                        : undefined
                                    }
                                  />
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </>
  );
}
