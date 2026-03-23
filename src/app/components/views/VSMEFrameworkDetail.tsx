import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { cn } from "@/app/components/ui/utils";
import { ChevronRight, Download, Upload, Filter, Play } from "lucide-react";
import { useState, useMemo } from "react";
import {
  MODULE_B,
  MODULE_C,
  MODULE_B_TOTAL,
  MODULE_C_TOTAL,
  PILIER_COLOR,
  PILIER_BG,
  PILIER_LABEL,
  nextStatut,
  type Pilier,
  type StatutSaisie,
} from "@/data/vsme-data";

interface VSMEFrameworkDetailProps {
  frameworkId: string;
  onBack: () => void;
  onNavigate: (view: string) => void;
  onSaisie?: () => void;
}

// Metadata par référentiel
const FRAMEWORK_META: Record<string, { title: string; subtitle: string; showModuleC: boolean }> = {
  "vsme-complet":    { title: "VSME Complet (B + C)", subtitle: "Standard EFRAG volontaire pour PME non cotées — 79 datapoints", showModuleC: true },
  "vsme-base":       { title: "VSME Base (Module B)", subtitle: "Module B uniquement — 47 données essentielles", showModuleC: false },
  "bilan-carbone":   { title: "Bilan Carbone® ADEME", subtitle: "Méthode ADEME — Scope 1, 2 et 3 (sections B3 & B7)", showModuleC: false },
  "social-baseline": { title: "Social Baseline", subtitle: "Données sociales clés (sections B8 & B9)", showModuleC: false },
  "gouvernance":     { title: "Gouvernance", subtitle: "Données de gouvernance (sections B10 & B11)", showModuleC: false },
};

// Filtrage par référentiel pour Bilan Carbone, Social Baseline, Gouvernance
const FRAMEWORK_SECTIONS: Record<string, string[] | null> = {
  "vsme-complet":    null, // tous
  "vsme-base":       null, // tous
  "bilan-carbone":   ["B3", "B7"],
  "social-baseline": ["B8", "B9"],
  "gouvernance":     ["B10", "B11"],
};

// ── Checkbox 3 états ──────────────────────────────────────────────────────────
function StatusCheckbox({
  status,
  onClick,
  computed,
}: {
  status: StatutSaisie;
  onClick: () => void;
  computed?: boolean;
}) {
  if (computed) {
    return (
      <span
        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
        style={{ background: "#ebf5fb", border: "1.5px solid #1a5f8a" }}
        title="Valeur calculée automatiquement"
      >
        <span style={{ fontSize: 9, color: "#1a5f8a", fontWeight: 700, fontFamily: "DM Mono, monospace" }}>
          ƒ
        </span>
      </span>
    );
  }

  if (status === "filled") {
    return (
      <button
        onClick={onClick}
        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all hover:opacity-80"
        style={{ background: "#2d7a55" }}
        title="Rempli — cliquer pour réinitialiser"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    );
  }

  if (status === "partial") {
    return (
      <button
        onClick={onClick}
        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all hover:opacity-80"
        style={{ background: "#fef3c7", border: "1.5px solid #f59e0b" }}
        title="Partiel — cliquer pour marquer rempli"
      >
        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#f59e0b" }} />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-5 h-5 rounded flex-shrink-0 transition-all hover:border-[#2d7a55]"
      style={{ border: "1.5px solid #d1d5db", background: "white" }}
      title="Vide — cliquer pour marquer partiel"
    />
  );
}

// ── Badge type indicateur ─────────────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    Quantitatif: "bg-blue-50 text-blue-700",
    Calculé:     "bg-purple-50 text-purple-700",
    Qualitatif:  "bg-amber-50 text-amber-700",
    Narratif:    "bg-orange-50 text-orange-700",
  };
  return (
    <Badge variant="secondary" className={cn("text-xs font-normal px-2 py-0.5", styles[type] ?? "bg-slate-50 text-slate-600")}>
      {type}
    </Badge>
  );
}

export function VSMEFrameworkDetail({ frameworkId, onBack, onNavigate, onSaisie }: VSMEFrameworkDetailProps) {
  const [activeTab, setActiveTab] = useState<string>("module-b");
  const [filterPilier, setFilterPilier] = useState<Pilier | "Tous">("Tous");

  // État de saisie : Record<code, StatutSaisie>
  const [statuts, setStatuts] = useState<Record<string, StatutSaisie>>({});

  const meta = FRAMEWORK_META[frameworkId] ?? FRAMEWORK_META["vsme-complet"];
  const allowedSections = FRAMEWORK_SECTIONS[frameworkId] ?? null;

  // Sections filtrées selon référentiel
  const sectionsB = useMemo(
    () => (allowedSections ? MODULE_B.filter(s => allowedSections.includes(s.id)) : MODULE_B),
    [allowedSections]
  );
  const sectionsC = MODULE_C;

  // Sections affichées selon filtre pilier
  const visibleSectionsB = useMemo(
    () => filterPilier === "Tous" ? sectionsB : sectionsB.filter(s => s.pilier === filterPilier || s.pilier === "Général"),
    [sectionsB, filterPilier]
  );
  const visibleSectionsC = useMemo(
    () => filterPilier === "Tous" ? sectionsC : sectionsC.filter(s => s.pilier === filterPilier || s.pilier === "Général"),
    [sectionsC, filterPilier]
  );

  const updateStatut = (code: string) => {
    setStatuts(prev => ({ ...prev, [code]: nextStatut(prev[code] ?? "empty") }));
  };

  // Stats de complétion
  const computeStats = (sections: typeof MODULE_B) => {
    const allDps = sections.flatMap(s => s.datapoints);
    const total = allDps.length;
    const filled = allDps.filter(dp => (statuts[dp.code] ?? "empty") === "filled").length;
    const partial = allDps.filter(dp => (statuts[dp.code] ?? "empty") === "partial").length;
    const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
    return { total, filled, partial, pct };
  };

  const statsB = computeStats(sectionsB);

  // Stats par pilier (module B)
  const statsByPilier = useMemo(() => {
    const result: Record<string, { filled: number; total: number; pct: number }> = {};
    for (const pilier of ["E", "S", "G"] as Pilier[]) {
      const dps = sectionsB.flatMap(s => s.datapoints).filter(dp => dp.pilier === pilier);
      const total = dps.length;
      const filled = dps.filter(dp => (statuts[dp.code] ?? "empty") === "filled").length;
      result[pilier] = { total, filled, pct: total > 0 ? Math.round((filled / total) * 100) : 0 };
    }
    return result;
  }, [sectionsB, statuts]);

  const totalDpCount = allowedSections
    ? sectionsB.reduce((n, s) => n + s.datapoints.length, 0)
    : MODULE_B_TOTAL;

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm" style={{ color: "#9ca3af" }}>
        <span className="cursor-pointer hover:underline transition-colors" style={{ color: "#6b7280" }} onClick={onBack}>
          Standards
        </span>
        <ChevronRight className="w-3.5 h-3.5 mx-1.5" />
        <span className="font-medium" style={{ color: "#1a2e24" }}>{meta.title}</span>
        <ChevronRight className="w-3.5 h-3.5 mx-1.5" />
        <span style={{ color: "#1a5f3f" }}>Module B — Base</span>
      </div>

      {/* Header card ── complétion globale */}
      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#E2EDE7" }}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Titre + sous-titre */}
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#0A3B2E" }}>{meta.title}</h1>
            <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>{meta.subtitle}</p>
            <div className="flex items-center gap-2 mt-2">
              {(["E", "S", "G"] as Pilier[]).map(p => (
                <span
                  key={p}
                  className="w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                  style={{ background: PILIER_COLOR[p] }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Score global */}
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold" style={{ color: "#1a5f3f" }}>{statsB.pct}%</p>
              <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>Complétion globale</p>
            </div>

            {/* Mini-barres E/S/G */}
            <div className="space-y-2 w-52">
              {(["E", "S", "G"] as Pilier[]).map(p => (
                <div key={p} className="flex items-center gap-2">
                  <span className="text-xs font-semibold w-4 text-right" style={{ color: PILIER_COLOR[p] }}>{p}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: PILIER_BG[p] }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${statsByPilier[p]?.pct ?? 0}%`, background: PILIER_COLOR[p] }}
                    />
                  </div>
                  <span className="text-xs tabular-nums" style={{ color: "#9ca3af" }}>
                    {statsByPilier[p]?.pct ?? 0}%
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-xs pt-1" style={{ color: "#9ca3af" }}>
                <span>{statsB.filled} complétés · {statsB.partial} partiels</span>
                <span>/ {statsB.total}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                className="gap-2 text-sm text-white"
                style={{ background: "#0A3B2E" }}
                onClick={() => onSaisie ? onSaisie() : onNavigate("saisie-dossier")}
              >
                <Play className="w-4 h-4" />
                Saisir les données
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-sm"
                style={{ borderColor: "#1a5f3f", color: "#1a5f3f" }}
                onClick={() => onNavigate("import")}
              >
                <Upload className="w-4 h-4" />
                Importer Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-sm"
                style={{ borderColor: "#6b7280", color: "#6b7280" }}
                onClick={() => onNavigate("exports-livrables")}
              >
                <Download className="w-4 h-4" />
                Exporter PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Tab bar + filtre pilier */}
        <div className="flex items-center justify-between border-b" style={{ borderColor: "#E2EDE7" }}>
          <TabsList className="bg-transparent h-auto p-0 gap-1">
            {[
              { value: "module-b", label: `📊 Module B — Base (${totalDpCount})` },
              ...(meta.showModuleC ? [{ value: "module-c", label: `📝 Module C — Narratif (${MODULE_C_TOTAL})` }] : []),
              { value: "preuves", label: "📎 Justificatifs" },
              { value: "export", label: "📤 Export" },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#1a5f3f] data-[state=active]:text-[#1a5f3f] data-[state=active]:bg-transparent px-4 py-3 text-sm"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Filtre pilier — visible en module-b/c */}
          {(activeTab === "module-b" || activeTab === "module-c") && (
            <div className="flex items-center gap-1 pr-1">
              <Filter className="w-3.5 h-3.5 mr-1" style={{ color: "#9ca3af" }} />
              {(["Tous", "E", "S", "G"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setFilterPilier(p)}
                  className="text-xs px-2.5 py-1 rounded-full transition-all font-medium"
                  style={
                    filterPilier === p
                      ? { background: p === "Tous" ? "#1a5f3f" : PILIER_COLOR[p as Pilier], color: "white" }
                      : { background: "#f1f5f9", color: "#64748b" }
                  }
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Module B ─────────────────────────────────────────────────── */}
        <TabsContent value="module-b" className="space-y-3 mt-4">
          {visibleSectionsB.map((section) => {
            const sectionStatuts = section.datapoints.map(dp => statuts[dp.code] ?? "empty");
            const filledCount = sectionStatuts.filter(s => s === "filled").length;
            const headerColor = section.pilier === "Général" ? PILIER_COLOR.Général : PILIER_COLOR[section.pilier as Pilier];

            return (
              <div key={section.id} className="border rounded-xl overflow-hidden bg-white shadow-sm" style={{ borderColor: "#E2EDE7" }}>
                {/* Section header */}
                <div
                  className="px-5 py-3 flex items-center justify-between"
                  style={{ background: headerColor }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="font-mono font-bold px-2 py-0.5 rounded text-sm"
                      style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
                    >
                      {section.id}
                    </span>
                    <span className="font-semibold text-white text-sm">{section.titre}</span>
                    {section.pilier !== "Général" && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase"
                        style={{ background: "rgba(255,255,255,0.15)", color: "white", letterSpacing: "0.5px" }}
                      >
                        {PILIER_LABEL[section.pilier as Pilier]}
                      </span>
                    )}
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded"
                    style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
                  >
                    {filledCount}/{section.datapoints.length}
                  </span>
                </div>

                {/* Datapoints */}
                <div>
                  {section.datapoints.map((dp, idx) => {
                    const status = statuts[dp.code] ?? "empty";
                    const isFilled = status === "filled";
                    return (
                      <div
                        key={dp.code}
                        className={cn(
                          "px-5 py-3 flex items-center gap-4 transition-colors",
                          idx < section.datapoints.length - 1 && "border-b",
                          isFilled && "bg-[#f8fdf9]",
                          !isFilled && "hover:bg-slate-50/70"
                        )}
                        style={{ borderColor: "#f1f5f1" }}
                      >
                        {/* Checkbox 3 états */}
                        <StatusCheckbox
                          status={status}
                          onClick={() => !dp.computed && updateStatut(dp.code)}
                          computed={dp.computed}
                        />

                        {/* Code + intitulé */}
                        <div className="flex items-baseline gap-3 flex-1 min-w-0">
                          <span
                            className="text-xs font-mono font-semibold flex-shrink-0 w-10"
                            style={{ color: "#9ca3af" }}
                          >
                            {dp.code}
                          </span>
                          <span
                            className={cn("text-sm truncate", isFilled && "line-through opacity-60")}
                            style={
                              dp.computed
                                ? { color: "#1a5f8a", fontStyle: "italic" }
                                : { color: "#1a2e24" }
                            }
                          >
                            {dp.intitule}
                            {dp.computed && <span className="ml-1.5 text-[10px] opacity-50 not-italic">(auto)</span>}
                          </span>
                        </div>

                        {/* Méta */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {dp.unite && (
                            <span className="text-xs tabular-nums" style={{ color: "#9ca3af" }}>
                              {dp.unite}
                            </span>
                          )}
                          <TypeBadge type={dp.type} />
                          {dp.obligatoire && (
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                              style={{ background: "#fef2f2", color: "#dc2626" }}
                            >
                              Obligatoire
                            </span>
                          )}
                          {dp.esrs_equivalent && (
                            <span className="text-[10px] tabular-nums" style={{ color: "#c7d2db" }}>
                              {dp.esrs_equivalent}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {visibleSectionsB.length === 0 && (
            <div className="bg-white rounded-xl border p-10 text-center" style={{ borderColor: "#E2EDE7" }}>
              <p className="text-sm" style={{ color: "#9ca3af" }}>Aucune section pour ce filtre.</p>
            </div>
          )}
        </TabsContent>

        {/* ── Module C ─────────────────────────────────────────────────── */}
        <TabsContent value="module-c" className="space-y-3 mt-4">
          {visibleSectionsC.map((section) => {
            const sectionStatuts = section.datapoints.map(dp => statuts[dp.code] ?? "empty");
            const filledCount = sectionStatuts.filter(s => s === "filled").length;
            const headerColor = section.pilier === "Général" ? PILIER_COLOR.Général : PILIER_COLOR[section.pilier as Pilier];

            return (
              <div key={section.id} className="border rounded-xl overflow-hidden bg-white shadow-sm" style={{ borderColor: "#E2EDE7" }}>
                <div className="px-5 py-3 flex items-center justify-between" style={{ background: headerColor }}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold px-2 py-0.5 rounded text-sm" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
                      {section.id}
                    </span>
                    <span className="font-semibold text-white text-sm">{section.titre}</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
                    {filledCount}/{section.datapoints.length}
                  </span>
                </div>

                <div>
                  {section.datapoints.map((dp, idx) => {
                    const status = statuts[dp.code] ?? "empty";
                    return (
                      <div
                        key={dp.code}
                        className={cn(
                          "px-5 py-3 flex items-center gap-4 transition-colors",
                          idx < section.datapoints.length - 1 && "border-b",
                          status === "filled" && "bg-[#f8fdf9]",
                          status !== "filled" && "hover:bg-slate-50/70"
                        )}
                        style={{ borderColor: "#f1f5f1" }}
                      >
                        <StatusCheckbox status={status} onClick={() => updateStatut(dp.code)} />
                        <div className="flex items-baseline gap-3 flex-1 min-w-0">
                          <span className="text-xs font-mono font-semibold flex-shrink-0 w-10" style={{ color: "#9ca3af" }}>
                            {dp.code}
                          </span>
                          <span className={cn("text-sm truncate", status === "filled" && "line-through opacity-60")} style={{ color: "#1a2e24" }}>
                            {dp.intitule}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <TypeBadge type={dp.type} />
                          {dp.obligatoire && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "#fef2f2", color: "#dc2626" }}>
                              Obligatoire
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </TabsContent>

        {/* ── Preuves ──────────────────────────────────────────────────── */}
        <TabsContent value="preuves">
          <div className="bg-white rounded-2xl border p-12 text-center mt-4" style={{ borderColor: "#E2EDE7" }}>
            <p className="text-sm mb-4" style={{ color: "#6b7280" }}>Gérez les justificatifs et pièces associées à ce standard</p>
            <Button
              variant="outline"
              style={{ borderColor: "#1a5f3f", color: "#1a5f3f" }}
              onClick={() => onNavigate("evidence-vault")}
            >
              Ouvrir l'Evidence Vault
            </Button>
          </div>
        </TabsContent>

        {/* ── Export ───────────────────────────────────────────────────── */}
        <TabsContent value="export">
          <div className="bg-white rounded-2xl border p-12 text-center mt-4" style={{ borderColor: "#E2EDE7" }}>
            <p className="text-sm mb-4" style={{ color: "#6b7280" }}>Exportez votre rapport VSME au format PDF ou Excel</p>
            <Button
              className="text-white"
              style={{ background: "#1a5f3f" }}
              onClick={() => onNavigate("exports-livrables")}
            >
              <Download className="w-4 h-4 mr-2" />
              Générer l'export
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
