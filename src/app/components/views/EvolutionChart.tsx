/**
 * EvolutionChart — Graphiques d'évolution temporelle des indicateurs ESG
 * Affiche les courbes d'évolution par indicateur entre les périodes du dossier
 * Utilise recharts (déjà installé)
 *
 * 🆕 Phase 12  : Nouveau composant
 * 🆕 Phase 12b : Support de tous les modes de période (annuel, trimestriel, mensuel, personnalisé)
 */
import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { useVSMEData } from "@/contexts/VSMEDataContext";
import { MODULE_B, PILIER_COLOR } from "@/data/vsme-data";
import { getPeriodsForDossier } from "@/services/idbService";
import type { PeriodMode, CustomPeriod } from "@/contexts/DossierContext";

// ─── Props ────────────────────────────────────────────────────────────────────
interface EvolutionChartProps {
  dossierId: string;
  fiscalYear: string;
  /** 🆕 Phase 12b : mode de période du dossier */
  periodMode: PeriodMode;
  /** 🆕 Phase 12b : périodes personnalisées (si mode = 'personnalise') */
  customPeriods?: CustomPeriod[];
  /** Codes des indicateurs à afficher (ex: ["B3.1", "B7.1"]) */
  indicatorCodes?: string[];
  /** Si true, affiche seulement les indicateurs remplis dans au moins 2 périodes */
  onlyWithData?: boolean;
}

// ─── Couleurs par défaut ─────────────────────────────────────────────────────
const CHART_COLORS = ["#2d7a55", "#1a5f8a", "#6c3483", "#f59e0b", "#dc2626", "#059669"];

// ─── Lookup datapoints ───────────────────────────────────────────────────────
const ALL_DPS = MODULE_B.flatMap(s => s.datapoints);
const DPS_BY_CODE = new Map(ALL_DPS.map(dp => [dp.code, dp]));

export function EvolutionChart({
  dossierId,
  fiscalYear,
  periodMode,
  customPeriods,
  indicatorCodes,
  onlyWithData = true,
}: EvolutionChartProps) {
  const { getValues } = useVSMEData();

  // 🆕 Phase 12b : périodes dynamiques basées sur le mode du dossier
  const periods = useMemo(
    () => getPeriodsForDossier(fiscalYear, periodMode, customPeriods),
    [fiscalYear, periodMode, customPeriods],
  );

  // Récupérer les données de chaque période
  const periodValues = useMemo(() => {
    return periods.map(p => ({
      periodId: p.id,
      label: p.shortLabel,
      data: getValues(dossierId, p.id),
    }));
  }, [periods, dossierId, getValues]);

  // Déterminer les indicateurs à afficher
  const targetCodes = useMemo(() => {
    if (indicatorCodes && indicatorCodes.length > 0) return indicatorCodes;

    // Sélectionner les indicateurs quantitatifs non-calculés
    const quantDps = ALL_DPS.filter(
      dp => dp.type === "Quantitatif" && !dp.computed
    );

    if (onlyWithData) {
      // Garder seulement ceux remplis dans au moins 2 périodes
      return quantDps
        .filter(dp => {
          const filledCount = periodValues.filter(
            pv => pv.data.values[dp.code]?.trim()
          ).length;
          return filledCount >= 2;
        })
        .map(dp => dp.code);
    }

    return quantDps.map(dp => dp.code);
  }, [indicatorCodes, onlyWithData, periodValues]);

  // Construire les données pour recharts
  const chartData = useMemo(() => {
    return periods.map((p, i) => {
      const entry: Record<string, string | number> = {
        period: p.shortLabel,
      };
      for (const code of targetCodes) {
        const raw = periodValues[i]?.data.values[code];
        const num = parseFloat(raw ?? "");
        entry[code] = isNaN(num) ? 0 : num;
      }
      return entry;
    });
  }, [periods, periodValues, targetCodes]);

  // Grouper par pilier pour organiser l'affichage
  const byPilier = useMemo(() => {
    const groups: Record<string, string[]> = { E: [], S: [], G: [] };
    for (const code of targetCodes) {
      const dp = DPS_BY_CODE.get(code);
      if (dp && dp.pilier in groups) {
        groups[dp.pilier as keyof typeof groups].push(code);
      }
    }
    return groups;
  }, [targetCodes]);

  if (targetCodes.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-25" style={{ color: "#6b7280" }} />
          <p className="font-medium text-sm" style={{ color: "#6b7280" }}>
            Pas encore de données multi-périodes
          </p>
          <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
            Saisissez des valeurs dans au moins 2 périodes pour voir l'évolution
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Un graphique par pilier ayant des données */}
      {(["E", "S", "G"] as const).map(pilier => {
        const codes = byPilier[pilier];
        if (!codes || codes.length === 0) return null;

        const pilierLabels = { E: "Environnement", S: "Social", G: "Gouvernance" };
        const color = PILIER_COLOR[pilier];

        return (
          <Card key={pilier} className="overflow-hidden">
            <div
              className="px-5 py-3 flex items-center gap-3"
              style={{ background: color }}
            >
              <TrendingUp className="w-4 h-4 text-white" />
              <span className="font-semibold text-white text-sm">
                Évolution {pilierLabels[pilier]} — {fiscalYear}
              </span>
              <Badge
                className="ml-auto text-xs"
                style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "none" }}
              >
                {codes.length} indicateur{codes.length > 1 ? "s" : ""}
              </Badge>
            </div>
            <CardContent className="p-4">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f1" />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #E2EDE7",
                      fontSize: "12px",
                    }}
                    formatter={(value: number, name: string) => {
                      const dp = DPS_BY_CODE.get(name);
                      return [
                        `${value} ${dp?.unite ?? ""}`,
                        dp?.intitule ?? name,
                      ];
                    }}
                  />
                  <Legend
                    formatter={(value: string) => {
                      const dp = DPS_BY_CODE.get(value);
                      const label = dp?.intitule ?? value;
                      return label.length > 40 ? label.slice(0, 40) + "…" : label;
                    }}
                    wrapperStyle={{ fontSize: "11px" }}
                  />
                  {codes.map((code, i) => (
                    <Line
                      key={code}
                      type="monotone"
                      dataKey={code}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>

              {/* Mini tableau delta première→dernière période */}
              <div className="mt-4 space-y-2">
                {codes.map(code => {
                  const dp = DPS_BY_CODE.get(code);
                  const firstIdx = 0;
                  const lastIdx = periodValues.length - 1;
                  const firstLabel = periodValues[firstIdx]?.label ?? "";
                  const lastLabel  = periodValues[lastIdx]?.label ?? "";
                  const firstVal = parseFloat(periodValues[firstIdx]?.data.values[code] ?? "");
                  const lastVal  = parseFloat(periodValues[lastIdx]?.data.values[code] ?? "");
                  const hasFirst = !isNaN(firstVal);
                  const hasLast  = !isNaN(lastVal);

                  let delta: number | null = null;
                  let deltaPct: number | null = null;
                  if (hasFirst && hasLast) {
                    delta = lastVal - firstVal;
                    if (firstVal !== 0) {
                      deltaPct = Math.round(((lastVal - firstVal) / Math.abs(firstVal)) * 100);
                    }
                  }

                  return (
                    <div
                      key={code}
                      className="flex items-center justify-between px-3 py-2 rounded-lg"
                      style={{ background: "#f8fafc" }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="font-mono text-[11px] font-semibold flex-shrink-0"
                          style={{ color: "#9ca3af" }}
                        >
                          {code}
                        </span>
                        <span className="text-xs truncate" style={{ color: "#374151" }}>
                          {dp?.intitule ?? code}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {hasFirst && (
                          <span className="text-xs tabular-nums" style={{ color: "#9ca3af" }}>
                            {firstLabel}: {firstVal} {dp?.unite ?? ""}
                          </span>
                        )}
                        {hasLast && lastIdx !== firstIdx && (
                          <span className="text-xs tabular-nums" style={{ color: "#9ca3af" }}>
                            {lastLabel}: {lastVal} {dp?.unite ?? ""}
                          </span>
                        )}
                        {deltaPct !== null ? (
                          <span
                            className="text-xs font-semibold flex items-center gap-0.5"
                            style={{ color: delta! > 0 ? "#dc2626" : "#2d7a55" }}
                          >
                            {delta! > 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {delta! > 0 ? "+" : ""}{deltaPct}%
                          </span>
                        ) : (
                          <span className="text-xs flex items-center gap-1" style={{ color: "#d1d5db" }}>
                            <Minus className="w-3 h-3" />
                            —
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
