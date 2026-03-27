/**
 * RapportIA — Génération d'un rapport ESG complet avec interprétation Claude
 * Flux : voir les données collectées → générer le rapport → copier/exporter
 */
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  ChevronLeft,
  Sparkles,
  Loader2,
  Wand2,
  Copy,
  Check,
  FileText,
  TrendingUp,
  Users,
  Scale,
  Leaf,
  AlertCircle,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { useDossiers } from "@/contexts/DossierContext";
import { useVSMEData } from "@/contexts/VSMEDataContext";
import { MODULE_B, PILIER_COLOR } from "@/data/vsme-data";
import { getPeriodsForDossier } from "@/services/idbService";
import { toast } from "sonner";
import {
  getStoredReportModel,
  AVAILABLE_REPORT_MODELS,
  generateFullReport,
  type FilledDataPoint,
} from "@/services/aiQualitativeService";

// ─── Props ────────────────────────────────────────────────────────────────────
interface RapportIAProps {
  dossierId: string;
  onBack: () => void;
}

// ─── Icône par pilier ─────────────────────────────────────────────────────────
function PilierIcon({ pilier }: { pilier: string }) {
  if (pilier === "E") return <Leaf className="w-4 h-4" style={{ color: PILIER_COLOR.E }} />;
  if (pilier === "S") return <Users className="w-4 h-4" style={{ color: PILIER_COLOR.S }} />;
  if (pilier === "G") return <Scale className="w-4 h-4" style={{ color: PILIER_COLOR.G }} />;
  return <FileText className="w-4 h-4 text-gray-400" />;
}

// ─── Rendu Markdown simplifié ──────────────────────────────────────────────────
function MarkdownReport({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith("# ")) {
          return (
            <h1 key={i} className="text-2xl font-bold mt-4 mb-2" style={{ color: "#0A3B2E" }}>
              {line.slice(2)}
            </h1>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2
              key={i}
              className="text-lg font-semibold mt-6 mb-2 pb-1"
              style={{ color: "#1a5f3f", borderBottom: "2px solid #E2EDE7" }}
            >
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <h3 key={i} className="text-base font-semibold mt-4 mb-1" style={{ color: "#2d7a55" }}>
              {line.slice(4)}
            </h3>
          );
        }
        if (line.startsWith("---")) {
          return <hr key={i} className="my-4" style={{ borderColor: "#E2EDE7" }} />;
        }
        if (line.startsWith("- ") || line.match(/^\d+\. /)) {
          // Parse bold inside list items
          const text = line.replace(/^- /, "").replace(/^\d+\. /, (m) => m);
          const prefix = line.startsWith("- ") ? "•" : line.match(/^(\d+)\. /)?.[1] + ".";
          return (
            <div key={i} className="flex gap-2 ml-2">
              <span className="font-semibold text-sm flex-shrink-0" style={{ color: "#2d7a55" }}>
                {prefix}
              </span>
              <p
                className="text-sm"
                style={{ color: "#374151" }}
                dangerouslySetInnerHTML={{
                  __html: text
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/_\((.+?)\)_/g, '<em style="color:#9ca3af">($1)</em>'),
                }}
              />
            </div>
          );
        }
        if (line.trim() === "") return <div key={i} className="h-2" />;
        return (
          <p
            key={i}
            className="text-sm leading-relaxed"
            style={{ color: "#374151" }}
            dangerouslySetInnerHTML={{
              __html: line
                .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#1a2e24">$1</strong>')
                .replace(/_\((.+?)\)_/g, '<em style="color:#9ca3af">($1)</em>'),
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Composant principal ───────────────────────────────────────────────────────
export function RapportIA({ dossierId, onBack }: RapportIAProps) {
  const { getDossier } = useDossiers();
  const { getValues, loadDossier, getStats, getStatsByPilier, getActivePeriod } = useVSMEData();

  const [activeTab, setActiveTab]     = useState<"data" | "rapport">("data");
  const [userContext, setUserContext] = useState("");
  const [report, setReport]           = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [copied, setCopied]           = useState(false);

  // IA configuration (centralisée dans Réglages)
  const modelId     = getStoredReportModel();
  const modelLabel  = AVAILABLE_REPORT_MODELS.find(m => m.id === modelId)?.label ?? modelId;

  const dossier = getDossier(dossierId);

  useEffect(() => {
    loadDossier(dossierId);
  }, [dossierId, loadDossier]);

  const activePeriod  = getActivePeriod(dossierId);
  const dossierValues = getValues(dossierId, activePeriod);
  const stats         = getStats(dossierId, "B", activePeriod);
  const pilierStats   = getStatsByPilier(dossierId, activePeriod);

  // 🆕 Phase 12b : label de la période enrichi avec le mode du dossier
  const periodMode = dossier?.periodMode ?? 'annuel';
  const periods = getPeriodsForDossier(dossier?.fiscalYear ?? '2025', periodMode, dossier?.customPeriods);
  const currentPeriodDef = periods.find(p => p.id === activePeriod);
  const periodLabel = currentPeriodDef?.label
    ?? (activePeriod.includes('-T')
      ? `T${activePeriod.split('-T')[1]} ${activePeriod.split('-')[0]}`
      : activePeriod.includes('-M')
        ? activePeriod
        : `Exercice ${activePeriod}`);

  // Collect all filled datapoints
  const filledDps = useMemo((): FilledDataPoint[] => {
    const result: FilledDataPoint[] = [];
    for (const section of MODULE_B) {
      for (const dp of section.datapoints) {
        if (dp.computed) continue;
        const value = dossierValues.values[dp.code];
        if (value?.trim()) {
          result.push({
            code: dp.code,
            intitule: dp.intitule,
            value,
            unite: dp.unite,
            pilier: dp.pilier,
            type: dp.type,
            sectionId: section.id,
            sectionTitre: section.titre,
          });
        }
      }
    }
    return result;
  }, [dossierValues]);

  // Group by pilier
  const byPilier = useMemo(() => {
    const groups: Record<string, FilledDataPoint[]> = { Général: [], E: [], S: [], G: [] };
    for (const dp of filledDps) {
      const k = dp.pilier in groups ? dp.pilier : "Général";
      groups[k].push(dp);
    }
    return groups;
  }, [filledDps]);

  const handleGenerate = async () => {
    if (filledDps.length === 0) {
      setError("Aucune donnée saisie. Renseignez d'abord les indicateurs VSME.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const text = await generateFullReport(
        filledDps,
        dossier?.name ?? dossierId,
        dossier?.clientOrg ?? "",
        dossier?.fiscalYear ?? "2024",
        dossier?.missionType ?? "Conseil",
        userContext,
        ""
      );
      setReport(text);
      setActiveTab("rapport");
      toast.success("✅ Rapport généré avec succès !", {
        description: `${filledDps.length} indicateurs analysés par ${modelLabel}`,
      });
    } catch (e) {
      setError((e as Error).message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!report) return;
    await navigator.clipboard.writeText(report);
    setCopied(true);
    toast.success("Rapport copié dans le presse-papiers");
    setTimeout(() => setCopied(false), 2500);
  };

  if (!dossier) {
    return (
      <div className="flex items-center justify-center h-64 text-sm" style={{ color: "#6b7280" }}>
        Dossier introuvable.
      </div>
    );
  }

  const completenessColor =
    stats.pct >= 80 ? "#2d7a55" : stats.pct >= 40 ? "#f59e0b" : "#9ca3af";

  return (
    <div className="space-y-5">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E2EDE7" }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-xs mb-3 hover:underline"
              style={{ color: "#9ca3af" }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Retour au dossier
            </button>
            <div className="flex items-center gap-3 flex-wrap">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                style={{ background: "#1a5f3f" }}
              >
                {dossier.clientOrg?.[0]?.toUpperCase() ?? "D"}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold" style={{ color: "#0A3B2E" }}>
                    Rapport ESG — {dossier.name}
                  </h1>
                  <Badge
                    className="gap-1 text-[11px]"
                    style={{ background: "#0A3B2E", color: "white" }}
                  >
                    <Sparkles className="w-3 h-3" />
                    Généré par IA
                  </Badge>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
                  {dossier.clientOrg} · {periodLabel}
                </p>
              </div>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums" style={{ color: completenessColor }}>
                {stats.pct}%
              </p>
              <p className="text-[10px]" style={{ color: "#9ca3af" }}>Progression</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums" style={{ color: "#1a5f3f" }}>
                {filledDps.length}
              </p>
              <p className="text-[10px]" style={{ color: "#9ca3af" }}>Indicateurs</p>
            </div>
          </div>
        </div>

        {/* Barres E/S/G */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          {(["E", "S", "G"] as const).map((p) => {
            const ps = pilierStats[p];
            const labels = { E: "Environnement", S: "Social", G: "Gouvernance" };
            return (
              <div key={p} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <PilierIcon pilier={p} />
                    <span className="text-xs font-medium" style={{ color: PILIER_COLOR[p] }}>
                      {labels[p]}
                    </span>
                  </div>
                  <span className="text-xs tabular-nums font-semibold" style={{ color: PILIER_COLOR[p] }}>
                    {ps.pct}%
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${ps.pct}%`, background: PILIER_COLOR[p] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "data" | "rapport")}>
        <TabsList className="bg-white border rounded-xl p-1 gap-1 h-auto" style={{ borderColor: "#E2EDE7" }}>
          <TabsTrigger
            value="data"
            className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-[#1a5f3f] data-[state=active]:text-white flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Données collectées ({filledDps.length})
          </TabsTrigger>
          <TabsTrigger
            value="rapport"
            className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-[#1a5f3f] data-[state=active]:text-white flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Rapport IA{report ? " ✓" : ""}
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1 : Données collectées ────────────────────────────── */}
        <TabsContent value="data" className="space-y-4 mt-4">
          {filledDps.length === 0 ? (
            <div
              className="rounded-xl p-8 text-center space-y-3"
              style={{ background: "#fffbeb", border: "1.5px dashed #fbbf24" }}
            >
              <AlertCircle className="w-10 h-10 mx-auto" style={{ color: "#f59e0b" }} />
              <p className="font-semibold" style={{ color: "#92400e" }}>
                Aucune donnée saisie
              </p>
              <p className="text-sm" style={{ color: "#b45309" }}>
                Renseignez d'abord les indicateurs VSME dans la saisie du dossier
                pour pouvoir générer un rapport.
              </p>
            </div>
          ) : (
            <>
              {/* Cards par pilier */}
              {(["Général", "E", "S", "G"] as const).map((pilier) => {
                const dps = byPilier[pilier];
                if (!dps || dps.length === 0) return null;
                const pilierLabel = { Général: "Informations générales", E: "Environnement", S: "Social", G: "Gouvernance" }[pilier];
                const color = pilier === "E" ? PILIER_COLOR.E : pilier === "S" ? PILIER_COLOR.S : pilier === "G" ? PILIER_COLOR.G : "#6b7280";

                // Group by section
                const bySec: Record<string, FilledDataPoint[]> = {};
                for (const dp of dps) {
                  if (!bySec[dp.sectionId]) bySec[dp.sectionId] = [];
                  bySec[dp.sectionId].push(dp);
                }

                return (
                  <Card key={pilier} className="overflow-hidden">
                    <div
                      className="px-5 py-3 flex items-center gap-3"
                      style={{ background: color }}
                    >
                      <PilierIcon pilier={pilier} />
                      <span className="font-semibold text-white text-sm">{pilierLabel}</span>
                      <span
                        className="ml-auto text-xs font-semibold px-2 py-0.5 rounded"
                        style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
                      >
                        {dps.length} indicateur{dps.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <CardContent className="p-0">
                      {Object.entries(bySec).map(([secId, secDps]) => (
                        <div key={secId}>
                          <div
                            className="px-5 py-2 text-xs font-semibold uppercase"
                            style={{ background: "#f8fafc", color: "#9ca3af", letterSpacing: "0.5px" }}
                          >
                            {secId} — {secDps[0].sectionTitre}
                          </div>
                          <table className="w-full">
                            <tbody>
                              {secDps.map((dp) => (
                                <tr
                                  key={dp.code}
                                  className="border-b last:border-0"
                                  style={{ borderColor: "#f1f5f1" }}
                                >
                                  <td className="px-5 py-2.5 w-16">
                                    <span
                                      className="font-mono text-[11px] font-semibold"
                                      style={{ color: "#9ca3af" }}
                                    >
                                      {dp.code}
                                    </span>
                                  </td>
                                  <td className="py-2.5 pr-4 text-sm" style={{ color: "#374151" }}>
                                    {dp.intitule}
                                  </td>
                                  <td className="py-2.5 pr-5 text-right">
                                    <span
                                      className={
                                        dp.type === "Narratif" || dp.type === "Qualitatif"
                                          ? "text-xs italic max-w-[200px] block text-right"
                                          : "text-sm font-semibold tabular-nums"
                                      }
                                      style={{
                                        color: color,
                                        maxWidth: dp.type === "Narratif" ? "240px" : undefined,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: dp.type === "Narratif" ? "nowrap" : "normal",
                                      }}
                                    >
                                      {dp.value.length > 60 ? dp.value.slice(0, 60) + "…" : dp.value}
                                      {dp.unite && (
                                        <span className="ml-1 text-[11px] font-normal" style={{ color: "#9ca3af" }}>
                                          {dp.unite}
                                        </span>
                                      )}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}

          {/* Panel de génération */}
          <Card style={{ borderColor: "#0A3B2E", borderWidth: "1.5px" }}>
            <div
              className="px-5 py-4 flex items-center gap-3"
              style={{ background: "linear-gradient(135deg, #0A3B2E 0%, #1a5f3f 100%)" }}
            >
              <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: "#52B788" }} />
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">Générer le rapport complet avec Claude IA</p>
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Claude analysera vos {filledDps.length} indicateurs et rédigera un rapport ESG professionnel
                </p>
              </div>
              <span
                className="text-[10px] font-bold px-2 py-1 rounded-full uppercase flex-shrink-0"
                style={{ background: "rgba(82,183,136,0.2)", color: "#52B788", letterSpacing: "0.5px" }}
              >
                {modelLabel}
              </span>
            </div>
            <CardContent className="p-5 space-y-4">
              {/* Statut IA */}
              <div
                className="flex items-center gap-3 rounded-lg px-4 py-3"
                style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#2d7a55" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color: "#2d7a55" }}>
                    IA prête
                  </p>
                  <p className="text-[11px]" style={{ color: "#6b7280" }}>
                    Modèle : {modelLabel}
                  </p>
                </div>
                <button
                  className="text-[11px] underline flex-shrink-0"
                  style={{ color: "#9ca3af" }}
                  onClick={() => {
                    toast.info("Ouvrez Réglages → Intelligence Artificielle pour modifier la configuration IA");
                  }}
                >
                  Modifier
                </button>
              </div>

              {/* Contexte supplémentaire */}
              <div className="space-y-2">
                <label className="text-xs font-semibold" style={{ color: "#4a6b57" }}>
                  Contexte supplémentaire{" "}
                  <span className="font-normal" style={{ color: "#9ca3af" }}>(optionnel)</span>
                </label>
                <textarea
                  placeholder="Ex: secteur d'activité, certifications en cours, projets RSE, objectifs spécifiques…"
                  value={userContext}
                  onChange={(e) => setUserContext(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                  style={{ border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#1a2e24" }}
                  onFocus={(e) => { e.target.style.borderColor = "#1a5f3f"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; }}
                />
              </div>

              {error && (
                <div
                  className="rounded-xl p-3 text-sm"
                  style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}
                >
                  ⚠️ {error}
                </div>
              )}

              <Button
                className="w-full gap-2 font-semibold text-base py-5"
                style={{ background: "#1a5f3f", color: "white" }}
                onClick={handleGenerate}
                disabled={loading || filledDps.length === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyse en cours… (30-60 sec)
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    ✨ Générer le rapport ESG complet
                  </>
                )}
              </Button>
              {filledDps.length > 0 && (
                <p className="text-center text-[11px]" style={{ color: "#9ca3af" }}>
                  {filledDps.length} indicateurs · Rapport ~4 pages · Temps estimé : 30-60 sec
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2 : Rapport IA ─────────────────────────────────────── */}
        <TabsContent value="rapport" className="mt-4">
          {!report ? (
            <div
              className="rounded-xl p-12 text-center space-y-4"
              style={{ background: "#f8fafc", border: "1.5px dashed #e2e8f0" }}
            >
              <Sparkles className="w-12 h-12 mx-auto" style={{ color: "#d1d5db" }} />
              <p className="font-medium" style={{ color: "#6b7280" }}>
                Le rapport n'a pas encore été généré
              </p>
              <p className="text-sm" style={{ color: "#9ca3af" }}>
                Allez dans l'onglet "Données collectées" et cliquez sur "Générer le rapport"
              </p>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setActiveTab("data")}
              >
                <TrendingUp className="w-4 h-4" />
                Voir les données et générer
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Toolbar */}
              <div
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: "#edf7f1", border: "1px solid #c3e6d1" }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" style={{ color: "#2d7a55" }} />
                  <span className="text-sm font-semibold" style={{ color: "#1a5f3f" }}>
                    Rapport généré par Claude IA
                  </span>
                  <span className="text-xs" style={{ color: "#6b7280" }}>
                    · {dossier.clientOrg} · {dossier.fiscalYear}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    onClick={handleCopy}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copié !" : "Copier"}
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs"
                    style={{ background: "#1a5f3f", color: "white" }}
                    onClick={handleGenerate}
                    disabled={loading}
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    Regénérer
                  </Button>
                </div>
              </div>

              {/* Report content */}
              <Card>
                <CardContent className="p-8">
                  <MarkdownReport content={report} />
                </CardContent>
              </Card>

              {/* Footer note */}
              <p className="text-center text-xs" style={{ color: "#9ca3af" }}>
                Ce rapport a été généré automatiquement par l'IA à partir des données VSME saisies.
                Veuillez le vérifier avant diffusion.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
