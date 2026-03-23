import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { useEffect, useMemo } from "react";
import { useDossiers } from "@/contexts/DossierContext";
import { useVSMEData } from "@/contexts/VSMEDataContext";
import { MODULE_B } from "@/data/vsme-data";
import { useERPDashboardData } from "@/hooks/useERPDashboardData";
import {
  TrendingUp,
  TrendingDown,
  FileCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Eye,
  ArrowRight,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Sparkles,
  Leaf,
  Droplets,
  Trash2,
  Wind,
  Factory,
  UserCheck,
  Shield,
  Zap,
  Link2,
  RefreshCw,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { AnalyticsAdvanced } from "@/app/components/views/AnalyticsAdvanced";

type PostureType = "conseil" | "pre-audit" | "audit-externe";

interface DashboardUniversalProps {
  posture?: PostureType;
  parcours?: "csrd-obligatoire" | "esg-structure";
  dossierId?: string;
  onNavigate?: (view: string) => void;
}

// ─── Couleurs par pilier ──────────────────────────────────────────────────
const PILIER_COLORS: Record<string, { bg: string; text: string; badge: string; light: string }> = {
  "Général": { bg: "#f3f4f6", text: "#374151", badge: "#6b7280", light: "#f9fafb" },
  "E":       { bg: "#ecfdf5", text: "#065f46", badge: "#059669", light: "#f0fdf4" },
  "S":       { bg: "#eff6ff", text: "#1e40af", badge: "#2563eb", light: "#f0f9ff" },
  "G":       { bg: "#faf5ff", text: "#6b21a8", badge: "#7c3aed", light: "#fdf4ff" },
};

// ─── Couleurs et labels de confiance ──────────────────────────────────────
const CONFIDENCE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  direct_measurement:  { color: "#059669", bg: "#ecfdf5", label: "Mesuré" },
  supplier_classified: { color: "#2563eb", bg: "#eff6ff", label: "Classifié" },
  account_estimated:   { color: "#f59e0b", bg: "#fffbeb", label: "Estimé" },
  monetary_proxy:      { color: "#ef4444", bg: "#fef2f2", label: "Proxy" },
};

// ─── Labels catégories fournisseurs ───────────────────────────────────────
const SUPPLIER_CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  energy_electricity: { label: "Électricité", color: "#f59e0b" },
  energy_gas:         { label: "Gaz", color: "#ef4444" },
  energy_fuel:        { label: "Carburant", color: "#dc2626" },
  energy_other:       { label: "Énergie autre", color: "#f97316" },
  water:              { label: "Eau", color: "#0ea5e9" },
  waste_collection:   { label: "Déchets", color: "#84cc16" },
  waste_recycling:    { label: "Recyclage", color: "#22c55e" },
  transport_freight:  { label: "Transport", color: "#8b5cf6" },
  transport_business_travel: { label: "Déplacements", color: "#a855f7" },
  audit_legal:        { label: "Audit/Juridique", color: "#6366f1" },
  training:           { label: "Formation", color: "#ec4899" },
  insurance:          { label: "Assurance", color: "#64748b" },
  telecom:            { label: "Télécom", color: "#06b6d4" },
  it_services:        { label: "IT", color: "#14b8a6" },
  office_supplies:    { label: "Fournitures", color: "#78716c" },
  uncategorized:      { label: "Autres", color: "#d1d5db" },
};

// ─── Helper : formater une valeur numérique ────────────────────────────────
function fmtVal(raw: string | undefined, unit?: string): string {
  if (!raw || raw.trim() === "") return "—";
  const num = parseFloat(raw);
  if (isNaN(num)) return raw;
  const formatted = num >= 10000
    ? num.toLocaleString("fr-FR", { maximumFractionDigits: 0 })
    : num.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
  if (unit) return `${formatted} ${unit}`;
  return formatted;
}

function fmtNum(val: number, decimals = 1): string {
  if (val >= 10000) return val.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
  return val.toLocaleString("fr-FR", { maximumFractionDigits: decimals });
}

export function DashboardUniversal({ posture, parcours, dossierId, onNavigate }: DashboardUniversalProps) {
  // Load real stats from IndexedDB
  const { stats, categoryStats, reload } = useDashboardStats();
  const { dossiers } = useDossiers();
  const { getStats, getStatsByPilier, getValues, loadDossier } = useVSMEData();
  const erp = useERPDashboardData();

  // Reload stats on mount
  useEffect(() => { reload(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Charger données VSME uniquement pour le dossier sélectionné
  useEffect(() => {
    if (dossierId) {
      loadDossier(dossierId);
    }
  }, [dossierId]); // eslint-disable-line react-hooks/exhaustive-deps

  // E/S/G pour le dossier sélectionné uniquement
  const vsmeEsgStats = useMemo(() => {
    if (!dossierId) return null;
    const ps = getStatsByPilier(dossierId);
    return [
      { category: 'E' as const, name: 'Environnement', completed: ps.E.filled, total: ps.E.total, percentage: ps.E.total > 0 ? Math.round((ps.E.filled / ps.E.total) * 100) : 0 },
      { category: 'S' as const, name: 'Social',         completed: ps.S.filled, total: ps.S.total, percentage: ps.S.total > 0 ? Math.round((ps.S.filled / ps.S.total) * 100) : 0 },
      { category: 'G' as const, name: 'Gouvernance',    completed: ps.G.filled, total: ps.G.total, percentage: ps.G.total > 0 ? Math.round((ps.G.filled / ps.G.total) * 100) : 0 },
    ];
  }, [dossierId, getStatsByPilier]);

  // Écoute événements (packs + saisie de données)
  useEffect(() => {
    const h = () => reload();
    const hVsme = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.dossierId) {
        loadDossier(detail.dossierId);
      }
      reload();
    };
    window.addEventListener('pack-deleted', h);
    window.addEventListener('pack-created', h);
    window.addEventListener('checklist-updated', h);
    window.addEventListener('vsme-value-changed', hVsme);
    return () => {
      window.removeEventListener('pack-deleted', h);
      window.removeEventListener('pack-created', h);
      window.removeEventListener('checklist-updated', h);
      window.removeEventListener('vsme-value-changed', hVsme);
    };
  }, [reload, loadDossier]);

  const hasNoData = !dossierId || (dossiers.length === 0 && stats.total === 0 && !stats.loading);

  // ─── Données du dossier sélectionné (pour les métriques clés) ──────────
  const activeDossier = dossierId ? dossiers.find(d => d.id === dossierId) || null : null;
  const dossierValues = useMemo(() => {
    if (!activeDossier) return { values: {} as Record<string, string>, statuts: {} as Record<string, string> };
    return getValues(activeDossier.id);
  }, [activeDossier, getValues]);
  const v = dossierValues.values;

  // ─── Stats VSME réelles pour le dossier sélectionné ───────────────────
  const vsmeStats = useMemo(() => {
    if (!activeDossier) return { filled: 0, total: 41, pct: 0 };
    return getStats(activeDossier.id, 'B');
  }, [activeDossier, getStats]);

  // ─── Distribution par statut VSME (vraies données) ─────────────────────
  const vsmeStatusDistribution = useMemo(() => {
    if (!activeDossier) return [
      { name: "Rempli", value: 0, color: "#059669" },
      { name: "Vide", value: 41, color: "#e5e7eb" },
    ];
    const allDps = MODULE_B.flatMap(s => s.datapoints).filter(dp => !dp.computed);
    let filled = 0;
    for (const dp of allDps) {
      if (dossierValues.statuts[dp.code] === 'filled') filled++;
    }
    return [
      { name: "Rempli", value: filled, color: "#059669" },
      { name: "Vide", value: allDps.length - filled, color: "#e5e7eb" },
    ];
  }, [activeDossier, dossierValues]);

  // ─── Progression par section B1→B11 (vraies données) ──────────────────
  const sectionProgress = useMemo(() => {
    if (!activeDossier) return [];
    return MODULE_B.map(section => {
      const nonComputed = section.datapoints.filter(dp => !dp.computed);
      const total = nonComputed.length;
      const filled = nonComputed.filter(dp => dossierValues.statuts[dp.code] === 'filled').length;
      const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
      return { id: section.id, label: section.label, pilier: section.pilier, filled, total, pct };
    });
  }, [activeDossier, dossierValues]);

  // ─── Données manquantes obligatoires ───────────────────────────────────
  const missingObligatoires = useMemo(() => {
    if (!activeDossier) return [];
    return MODULE_B
      .flatMap(s => s.datapoints.map(dp => ({ ...dp, section: s.label })))
      .filter(dp => !dp.computed && dp.obligatoire && dossierValues.statuts[dp.code] !== 'filled')
      .slice(0, 8);
  }, [activeDossier, dossierValues]);

  const completionByCategory =
    (vsmeEsgStats && vsmeEsgStats[0].total > 0) ? vsmeEsgStats
    : [
        { category: "E" as const, name: "Environnement", completed: 0, total: 0, percentage: 0 },
        { category: "S" as const, name: "Social", completed: 0, total: 0, percentage: 0 },
        { category: "G" as const, name: "Gouvernance", completed: 0, total: 0, percentage: 0 },
      ];

  // ─── ERP : données Scope 1/2/3 pour le graphique carbone ──────────────
  const carbonChartData = useMemo(() => {
    if (!erp.hasData) return [];
    return [
      { name: "Scope 1", value: Math.round(erp.scope1 * 100) / 100, color: "#ef4444" },
      { name: "Scope 2", value: Math.round(erp.scope2 * 100) / 100, color: "#f59e0b" },
      { name: "Scope 3", value: Math.round(erp.scope3 * 100) / 100, color: "#8b5cf6" },
    ];
  }, [erp]);

  // ─── ERP : données fournisseurs pour le pie chart ─────────────────────
  const supplierPieData = useMemo(() => {
    if (!erp.supplierSummary.length) return [];
    return erp.supplierSummary
      .filter(s => s.totalAmount > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 8)
      .map(s => ({
        name: SUPPLIER_CATEGORY_LABELS[s.category]?.label ?? s.category,
        value: Math.round(s.totalAmount),
        color: SUPPLIER_CATEGORY_LABELS[s.category]?.color ?? "#d1d5db",
        supplierCount: s.supplierCount,
      }));
  }, [erp.supplierSummary]);

  // ─── Conformité VSME : obligatoires remplis ────────────────────────────
  const conformityData = useMemo(() => {
    if (!activeDossier) return { mandatory: 0, mandatoryFilled: 0, recommended: 0, recommendedFilled: 0 };
    const allDps = MODULE_B.flatMap(s => s.datapoints).filter(dp => !dp.computed);
    const mandatory = allDps.filter(dp => dp.obligatoire);
    const recommended = allDps.filter(dp => !dp.obligatoire);
    return {
      mandatory: mandatory.length,
      mandatoryFilled: mandatory.filter(dp => dossierValues.statuts[dp.code] === 'filled').length,
      recommended: recommended.length,
      recommendedFilled: recommended.filter(dp => dossierValues.statuts[dp.code] === 'filled').length,
    };
  }, [activeDossier, dossierValues]);

  // Configuration selon posture
  const config = {
    conseil: {
      title: "Tableau de bord",
      subtitle: "Vue d'ensemble de votre reporting ESG",
      primaryColor: "#059669",
      badgeLabel: "Conseil",
      badgeIcon: Users,
    },
    "pre-audit": {
      title: "Tableau de bord — Pré-Audit",
      subtitle: "Vérification & progression avant audit externe",
      primaryColor: "#0F4C3A",
      badgeLabel: "Vérification",
      badgeIcon: Activity,
    },
    "audit-externe": {
      title: "Tableau de bord — Audit Externe",
      subtitle: "Validation & certification des données",
      primaryColor: "#dc2626",
      badgeLabel: "Audit externe",
      badgeIcon: Eye,
    },
  };

  const currentConfig = config[posture || "conseil"];

  // ─── Empty state: aucun dossier sélectionné ou aucune donnée ────────────
  if (hasNoData) {
    // Cas 1: des dossiers existent mais aucun n'est sélectionné
    if (dossiers.length > 0 && !dossierId) {
      return (
        <div className="space-y-8 max-w-3xl mx-auto py-4">
          <div className="rounded-2xl p-8" style={{ background: 'linear-gradient(135deg, #0f3d28 0%, #1a5f3f 100%)' }}>
            <h2 className="text-2xl font-bold text-white mb-1">Sélectionnez un dossier</h2>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Ouvrez un dossier ESG pour afficher ses indicateurs et sa progression.
            </p>
          </div>
          <Button className="w-full text-white font-semibold py-6 text-[15px] rounded-xl shadow-md" style={{ background: '#1a5f3f' }} onClick={() => onNavigate?.("dossiers")}>
            <FileCheck className="h-5 w-5 mr-2" />
            Voir mes dossiers →
          </Button>
        </div>
      );
    }

    // Cas 2: aucun dossier n'existe → onboarding
    const steps = [
      { num: "①", title: "Choisissez un standard ESG", desc: "VSME, ESRS, Bilan Carbone, Social Baseline…", action: "Voir les standards", view: "referentiels", color: "#2d7a55" },
      { num: "②", title: "Téléchargez le modèle Excel", desc: "Modèle pré-rempli avec toutes les données requises.", action: "Accéder aux modèles", view: "bibliotheque-templates", color: "#1a5f8a" },
      { num: "③", title: "Importez vos données", desc: "Glissez votre fichier Excel rempli pour peupler vos données.", action: "Importer des données", view: "import", color: "#6c3483" },
    ];

    return (
      <div className="space-y-8 max-w-3xl mx-auto py-4">
        <div className="rounded-2xl p-8" style={{ background: 'linear-gradient(135deg, #0f3d28 0%, #1a5f3f 100%)' }}>
          <h2 className="text-2xl font-bold text-white mb-1">Bienvenue sur Solvid.IA</h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Démarrez en 3 étapes pour structurer votre reporting ESG
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {steps.map((step) => (
              <button key={step.view} onClick={() => onNavigate?.(step.view)} className="text-left rounded-xl p-4 transition-all hover:scale-[1.02]" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl" style={{ color: '#52B788' }}>{step.num}</span>
                  <span className="text-sm font-semibold text-white">{step.title}</span>
                </div>
                <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>{step.desc}</p>
                <span className="text-xs font-medium" style={{ color: '#52B788' }}>{step.action} →</span>
              </button>
            ))}
          </div>
        </div>
        <Button className="w-full text-white font-semibold py-6 text-[15px] rounded-xl shadow-md" style={{ background: '#1a5f3f' }} onClick={() => onNavigate?.("creation-dossier")}>
          <FileCheck className="h-5 w-5 mr-2" />
          Créer mon premier dossier ESG →
        </Button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN RENDER — avec données
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A3B2E]">{currentConfig.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{currentConfig.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {erp.hasData && erp.syncMeta && (
            <Badge variant="outline" className="text-xs gap-1" style={{ borderColor: "#059669", color: "#059669" }}>
              <Link2 className="h-3 w-3" />
              {erp.syncMeta.connectionName}
            </Badge>
          )}
          <Badge style={{ backgroundColor: currentConfig.primaryColor, color: "white" }}>
            <currentConfig.badgeIcon className="h-3 w-3 mr-1" />
            {currentConfig.badgeLabel}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <Sparkles className="h-4 w-4 mr-2" />
            Analytics Avancés
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">

          {/* ━━━ ROW 1 : Score global + E/S/G + Conformité ━━━ */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Score global avec conformité */}
            <Card className="lg:col-span-1">
              <CardContent className="p-6 flex flex-col items-center justify-center">
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="42" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                    <circle cx="50" cy="50" r="42" stroke="#059669" strokeWidth="8" fill="none"
                      strokeDasharray={`${(vsmeStats.pct / 100) * 264} 264`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-[#0A3B2E]">{vsmeStats.pct}%</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-[#0A3B2E] mt-3">Score global</p>
                <p className="text-xs text-muted-foreground">{vsmeStats.filled}/{vsmeStats.total} données</p>
                {conformityData.mandatory > 0 && (
                  <div className="mt-3 w-full space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">Obligatoires</span>
                      <span className="font-semibold" style={{ color: conformityData.mandatoryFilled === conformityData.mandatory ? "#059669" : "#f59e0b" }}>
                        {conformityData.mandatoryFilled}/{conformityData.mandatory}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${(conformityData.mandatoryFilled / conformityData.mandatory) * 100}%`,
                        background: conformityData.mandatoryFilled === conformityData.mandatory ? "#059669" : "#f59e0b",
                      }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">Recommandés</span>
                      <span className="font-semibold text-blue-500">
                        {conformityData.recommendedFilled}/{conformityData.recommended}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-blue-400 transition-all" style={{
                        width: `${conformityData.recommended > 0 ? (conformityData.recommendedFilled / conformityData.recommended) * 100 : 0}%`,
                      }} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* E / S / G cards */}
            {completionByCategory.map((cat) => {
              const colors = PILIER_COLORS[cat.category] || PILIER_COLORS["E"];
              return (
                <Card key={cat.category} style={{ borderColor: colors.badge + "30" }}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Badge style={{ background: colors.badge, color: "#fff" }}>{cat.category}</Badge>
                      <span className="text-lg font-bold" style={{ color: colors.badge }}>{cat.percentage}%</span>
                    </div>
                    <p className="text-sm font-medium" style={{ color: colors.text }}>{cat.name}</p>
                    <p className="text-xs text-muted-foreground mb-2">{cat.completed}/{cat.total} données</p>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: colors.bg }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${cat.percentage}%`, background: colors.badge }} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ━━━ ROW 1.5 : Empreinte Carbone (si données ERP) ━━━ */}
          {erp.hasData && erp.totalEmissions > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Bilan carbone bar chart */}
              <Card className="lg:col-span-3" style={{ borderTop: "3px solid #0F4C3A" }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Factory className="h-5 w-5 text-[#0F4C3A]" />
                    Empreinte carbone
                    <Badge variant="outline" className="ml-auto text-[10px]" style={{ borderColor: "#059669", color: "#059669" }}>
                      ERP
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-6 mb-4">
                    <div>
                      <p className="text-3xl font-bold text-[#0A3B2E] tabular-nums">{fmtNum(erp.totalEmissions)}</p>
                      <p className="text-xs text-muted-foreground">tCO₂e total</p>
                    </div>
                    {carbonChartData.map(d => (
                      <div key={d.name} className="text-center">
                        <p className="text-sm font-semibold tabular-nums" style={{ color: d.color }}>{fmtNum(d.value)}</p>
                        <p className="text-[10px] text-muted-foreground">{d.name}</p>
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={carbonChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v} t`} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={60} />
                      <Tooltip
                        formatter={(val: number) => [`${fmtNum(val)} tCO₂e`, ""]}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                        {carbonChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* KPI carbone rapides */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wind className="h-5 w-5 text-[#0F4C3A]" />
                    Indicateurs clés
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {erp.esgPoints.map(point => {
                    const conf = CONFIDENCE_CONFIG[point.confidence] ?? CONFIDENCE_CONFIG.monetary_proxy;
                    return (
                      <div key={point.vsmeCode} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Badge className="text-[9px] px-1.5 py-0 font-mono shrink-0" style={{ background: conf.bg, color: conf.color, border: `1px solid ${conf.color}30` }}>
                            {point.vsmeCode}
                          </Badge>
                          <span className="text-xs text-muted-foreground truncate">{point.vsmeName.replace(/^(Émissions GES |Consommation totale d'|Volume total d'|Production totale de |Nombre d'|Frais d'|Répartition par |Jours de |Salaires et |Chiffre d'affaires )/, '')}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-semibold tabular-nums text-[#0A3B2E]">{fmtNum(point.value)}</span>
                          <span className="text-[10px] text-muted-foreground">{point.unit.replace('/an', '')}</span>
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: conf.color }} title={conf.label} />
                        </div>
                      </div>
                    );
                  })}
                  {/* Légende confiance */}
                  <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
                    {Object.entries(CONFIDENCE_CONFIG).map(([key, conf]) => (
                      <div key={key} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ background: conf.color }} />
                        <span className="text-[10px] text-muted-foreground">{conf.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ━━━ ROW 2 : Métriques clés ESG ━━━ */}
          {activeDossier && vsmeStats.filled > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Environnement */}
              <Card style={{ borderTop: "3px solid #059669" }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2" style={{ color: "#065f46" }}>
                    <Leaf className="h-4 w-4" />
                    Environnement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <MetricRowWithConfidence icon={<Zap className="h-3.5 w-3.5 text-amber-500" />} label="Énergie totale" value={fmtVal(v["B3.1"], "MWh")} erpPoint={erp.getPoint("B3.1")} />
                  <MetricRow icon={<Leaf className="h-3.5 w-3.5 text-green-500" />} label="% renouvelable"
                    value={v["B3.1"] && v["B3.2"] ? `${Math.round((parseFloat(v["B3.2"]) / parseFloat(v["B3.1"])) * 100)}%` : "—"} />
                  <MetricRowWithConfidence icon={<Factory className="h-3.5 w-3.5 text-gray-500" />} label="GES Scope 1" value={fmtVal(v["B7.1"], "tCO₂e")} erpPoint={erp.getPoint("B7.1")} />
                  <MetricRowWithConfidence icon={<Wind className="h-3.5 w-3.5 text-blue-400" />} label="GES Scope 2" value={fmtVal(v["B7.2"], "tCO₂e")} erpPoint={erp.getPoint("B7.2")} />
                  <MetricRowWithConfidence icon={<Droplets className="h-3.5 w-3.5 text-sky-500" />} label="Eau prélevée" value={fmtVal(v["B4.1"], "m³")} erpPoint={erp.getPoint("B4.1")} />
                  <MetricRowWithConfidence icon={<Trash2 className="h-3.5 w-3.5 text-orange-500" />} label="Déchets totaux" value={fmtVal(v["B5.1"], "t")} erpPoint={erp.getPoint("B5.1")} />
                </CardContent>
              </Card>

              {/* Social */}
              <Card style={{ borderTop: "3px solid #2563eb" }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2" style={{ color: "#1e40af" }}>
                    <Users className="h-4 w-4" />
                    Social
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <MetricRowWithConfidence icon={<Users className="h-3.5 w-3.5 text-blue-500" />} label="Effectif" value={fmtVal(v["B1.1"], "ETP")} erpPoint={erp.getPoint("B1.1")} />
                  <MetricRowWithConfidence icon={<UserCheck className="h-3.5 w-3.5 text-pink-500" />} label="% femmes" value={fmtVal(v["B8.2"], "%")} erpPoint={erp.getPoint("B8.2")} />
                  <MetricRow icon={<TrendingDown className="h-3.5 w-3.5 text-red-400" />} label="Écart rém. F/H" value={fmtVal(v["B8.3"], "%")} />
                  <MetricRow icon={<AlertCircle className="h-3.5 w-3.5 text-orange-500" />} label="Taux accidents (TF)" value={fmtVal(v["B8.6"])} />
                  <MetricRowWithConfidence icon={<Activity className="h-3.5 w-3.5 text-purple-500" />} label="Formation/employé" value={fmtVal(v["B8.5"], "j")} erpPoint={erp.getPoint("B8.5")} />
                  <MetricRowWithConfidence icon={<Shield className="h-3.5 w-3.5 text-indigo-500" />} label="Salaires" value={fmtVal(v["B8.1"], "€")} erpPoint={erp.getPoint("B8.1")} />
                </CardContent>
              </Card>

              {/* Gouvernance */}
              <Card style={{ borderTop: "3px solid #7c3aed" }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2" style={{ color: "#6b21a8" }}>
                    <Shield className="h-4 w-4" />
                    Gouvernance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <MetricRow icon={<UserCheck className="h-3.5 w-3.5 text-purple-500" />} label="Femmes en direction" value={fmtVal(v["B10.1"], "%")} />
                  <MetricRowWithConfidence icon={<FileCheck className="h-3.5 w-3.5 text-green-500" />} label="Frais audit" value={fmtVal(v["B11.1"], "€")} erpPoint={erp.getPoint("B11.1")} />
                  <MetricRow icon={<XCircle className="h-3.5 w-3.5 text-red-400" />} label="Incidents corruption" value={fmtVal(v["B11.2"])} />
                  <MetricRow icon={<Clock className="h-3.5 w-3.5 text-blue-500" />} label="Formation éthique" value={fmtVal(v["B11.6"], "h")} />
                  <MetricRowWithConfidence icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-500" />} label="Chiffre d'affaires" value={fmtVal(v["B1.2"], "€")} erpPoint={erp.getPoint("B1.2")} />
                </CardContent>
              </Card>
            </div>
          )}

          {/* ━━━ ROW 2.5 : Fournisseurs (si données ERP) ━━━ */}
          {supplierPieData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <PieChartIcon className="h-5 w-5 text-[#059669]" />
                    Fournisseurs ESG
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={supplierPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {supplierPieData.map((entry, index) => (
                          <Cell key={`sup-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: number, name: string) => [`${val.toLocaleString("fr-FR")} €`, name]}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    {supplierPieData.map((s) => (
                      <div key={s.name} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
                        <span className="text-[10px] truncate">{s.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Détail fournisseurs */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="h-5 w-5 text-[#059669]" />
                    Détail achats par catégorie ESG
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {erp.supplierSummary
                    .filter(s => s.totalAmount > 0)
                    .sort((a, b) => b.totalAmount - a.totalAmount)
                    .slice(0, 6)
                    .map(s => {
                      const catConf = SUPPLIER_CATEGORY_LABELS[s.category] ?? { label: s.category, color: "#d1d5db" };
                      const maxAmount = erp.supplierSummary.reduce((max, x) => Math.max(max, x.totalAmount), 0);
                      return (
                        <div key={s.category} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: catConf.color }} />
                              <span className="text-xs font-medium">{catConf.label}</span>
                              <span className="text-[10px] text-muted-foreground">{s.supplierCount} fournisseur{s.supplierCount > 1 ? 's' : ''}</span>
                            </div>
                            <span className="text-xs font-semibold tabular-nums text-[#0A3B2E]">
                              {s.totalAmount.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{
                              width: `${(s.totalAmount / maxAmount) * 100}%`,
                              background: catConf.color,
                            }} />
                          </div>
                          {s.suppliers.length > 0 && (
                            <div className="flex flex-wrap gap-1 pl-4">
                              {s.suppliers.slice(0, 3).map(sup => (
                                <span key={sup.name} className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-50 text-muted-foreground">
                                  {sup.name}
                                </span>
                              ))}
                              {s.suppliers.length > 3 && (
                                <span className="text-[10px] text-muted-foreground">+{s.suppliers.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  <Button variant="outline" size="sm" className="w-full mt-2 text-[#0F4C3A] border-[#0F4C3A]/30 hover:bg-[#E8F3F0]"
                    onClick={() => onNavigate?.("erp-connector")}>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Voir le connecteur ERP →
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ━━━ ROW 3 : Progression par section B1→B11 + PieChart ━━━ */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Progression par section */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-5 w-5 text-[#059669]" />
                  Progression par section
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {sectionProgress.map((s) => {
                  const colors = PILIER_COLORS[s.pilier] || PILIER_COLORS["Général"];
                  const barColor = s.pct >= 80 ? "#059669" : s.pct >= 40 ? "#f59e0b" : "#d1d5db";
                  return (
                    <div key={s.id} className="group cursor-pointer rounded-lg px-3 py-2 transition-all hover:bg-slate-50"
                      onClick={() => onNavigate?.("saisie-dossier")}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge className="text-[10px] px-1.5 py-0" style={{ background: colors.badge, color: "#fff" }}>
                            {s.pilier}
                          </Badge>
                          <span className="text-sm font-medium text-[#0A3B2E]">{s.id}. {s.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{s.filled}/{s.total}</span>
                          <span className="text-xs font-bold tabular-nums" style={{ color: barColor, minWidth: 32, textAlign: "right" }}>{s.pct}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.pct}%`, background: barColor }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Distribution rempli/vide */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <PieChartIcon className="h-5 w-5 text-[#059669]" />
                  Complétion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={vsmeStatusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {vsmeStatusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number, name: string) => [`${val} données`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-2">
                  {vsmeStatusDistribution.map((s) => (
                    <div key={s.name} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                      <span className="text-xs">{s.name} : <strong>{s.value}</strong></span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ━━━ ROW 4 : Avancement dossiers + Données manquantes ━━━ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Avancement par dossier */}
            {dossiers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-[#2d7a55]" />
                      Mes dossiers
                    </div>
                    <Badge className="font-normal" style={{ background: "#edf7f1", color: "#2d7a55", border: "none" }}>
                      {dossiers.length} dossier{dossiers.length > 1 ? "s" : ""}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dossiers.map(dossier => {
                    const dStats = getStats(dossier.id, 'B');
                    const pStats = getStatsByPilier(dossier.id);
                    const pct = dStats.pct;
                    const color = pct >= 80 ? "#2d7a55" : pct >= 40 ? "#f59e0b" : "#9ca3af";
                    return (
                      <div key={dossier.id} className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate" style={{ color: "#0A3B2E" }}>{dossier.name}</p>
                            <p className="text-xs" style={{ color: "#9ca3af" }}>{dossier.clientOrg} · {dossier.fiscalYear}</p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="hidden sm:flex items-center gap-2">
                              {(["E", "S", "G"] as const).map(p => (
                                <div key={p} className="flex items-center gap-0.5">
                                  <span className="text-[10px] font-bold" style={{ color: p === "E" ? "#2d7a55" : p === "S" ? "#1a5f8a" : "#6c3483" }}>{p}</span>
                                  <span className="text-[10px]" style={{ color: "#9ca3af" }}>{pStats[p].pct}%</span>
                                </div>
                              ))}
                            </div>
                            <span className="text-sm font-bold tabular-nums" style={{ color }}>{pct}%</span>
                          </div>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                  <Button variant="outline" size="sm" className="w-full mt-2 text-[#0F4C3A] border-[#0F4C3A] hover:bg-[#E8F3F0]"
                    onClick={() => onNavigate?.("dossiers")}>
                    Gérer mes dossiers →
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Données manquantes obligatoires */}
            {missingObligatoires.length > 0 && (
              <Card className="border-amber-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base text-amber-900">
                    <AlertCircle className="h-5 w-5" />
                    Données obligatoires manquantes
                    <Badge variant="secondary" className="ml-auto">{missingObligatoires.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {missingObligatoires.map(dp => {
                    const colors = PILIER_COLORS[dp.pilier] || PILIER_COLORS["Général"];
                    return (
                      <div key={dp.code} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-amber-200 transition-colors cursor-pointer"
                        onClick={() => onNavigate?.("saisie-dossier")}>
                        <div className="flex items-center gap-2.5">
                          <Badge className="text-[10px] px-1.5 py-0 font-mono" style={{ background: colors.badge, color: "#fff" }}>
                            {dp.code}
                          </Badge>
                          <div>
                            <p className="text-sm font-medium text-[#0A3B2E]">{dp.intitule}</p>
                            <p className="text-[10px] text-muted-foreground">{dp.section}</p>
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    );
                  })}
                  <Button variant="outline" size="sm" className="w-full mt-1 text-amber-700 border-amber-300 hover:bg-amber-50"
                    onClick={() => onNavigate?.("saisie-dossier")}>
                    Compléter les données →
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ━━━ CTA : Connecter ERP (si pas encore de données) ━━━ */}
          {!erp.hasData && (
            <Card className="border-dashed border-2 border-slate-200">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#ecfdf5] flex items-center justify-center">
                    <Link2 className="h-5 w-5 text-[#059669]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0A3B2E]">Connectez votre ERP</p>
                    <p className="text-xs text-muted-foreground">Remplissez automatiquement vos indicateurs ESG depuis Pennylane, Odoo ou un fichier FEC</p>
                  </div>
                </div>
                <Button size="sm" className="bg-[#0F4C3A] hover:bg-[#0A3B2E] text-white" onClick={() => onNavigate?.("erp-connector")}>
                  Connecter →
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsAdvanced />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Sous-composant : ligne de métrique ──────────────────────────────────
function MetricRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const isEmpty = value === "—";
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className={`text-sm font-semibold tabular-nums ${isEmpty ? "text-gray-300" : "text-[#0A3B2E]"}`}>
        {value}
      </span>
    </div>
  );
}

// ─── Sous-composant : ligne de métrique avec badge de confiance ERP ──────
function MetricRowWithConfidence({ icon, label, value, erpPoint }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  erpPoint?: { confidence: string; confidenceScore: number };
}) {
  const isEmpty = value === "—";
  const conf = erpPoint ? CONFIDENCE_CONFIG[erpPoint.confidence] ?? null : null;
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`text-sm font-semibold tabular-nums ${isEmpty ? "text-gray-300" : "text-[#0A3B2E]"}`}>
          {value}
        </span>
        {conf && (
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: conf.color }} title={`${conf.label} (${Math.round(erpPoint!.confidenceScore * 100)}%)`} />
        )}
      </div>
    </div>
  );
}
