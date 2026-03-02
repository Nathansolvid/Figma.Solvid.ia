import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { useEffect } from "react"; // 🆕 Import useEffect
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
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { AnalyticsAdvanced } from "@/app/components/views/AnalyticsAdvanced";

type PostureType = "conseil" | "pre-audit" | "audit-externe";

interface DashboardUniversalProps {
  posture?: PostureType; // Rendu optionnel avec valeur par défaut
  parcours?: "csrd-obligatoire" | "esg-structure";
  dossierId?: string;
}

// 🆕 Mock data kept as fallback
const mockStats = {
  total: 142,
  missing: 12,
  inProgress: 38,
  provided: 65,
  needsReview: 15,
  accepted: 12,
  rejected: 0,
};

const evolutionData = [
  { month: "Sep", completion: 35 },
  { month: "Oct", completion: 48 },
  { month: "Nov", completion: 62 },
  { month: "Déc", completion: 71 },
  { month: "Jan", completion: 78 },
];

export function DashboardUniversal({ posture, parcours, dossierId }: DashboardUniversalProps) {
  // 🆕 Load real stats from IndexedDB
  const { stats, categoryStats, reload } = useDashboardStats();

  // 🆕 Reload stats when component mounts (user navigates to Dashboard)
  useEffect(() => {
    console.log('🔄 Dashboard component mounted - reloading stats...');
    reload();
  }, []); // Empty deps = run on every mount

  // 🆕 Listen for pack deletion events
  useEffect(() => {
    const handlePackDeleted = () => {
      console.log('🗑️ Pack deleted event received - reloading dashboard...');
      reload();
    };

    const handlePackCreated = () => {
      console.log('📦 Pack created event received - reloading dashboard...');
      reload();
    };

    const handleChecklistUpdated = () => {
      console.log('✅ Checklist updated event received - reloading dashboard...');
      reload();
    };

    window.addEventListener('pack-deleted', handlePackDeleted);
    window.addEventListener('pack-created', handlePackCreated);
    window.addEventListener('checklist-updated', handleChecklistUpdated);
    
    return () => {
      window.removeEventListener('pack-deleted', handlePackDeleted);
      window.removeEventListener('pack-created', handlePackCreated);
      window.removeEventListener('checklist-updated', handleChecklistUpdated);
    };
  }, [reload]);

  // 🆕 Check if we have NO data (no packs)
  const hasNoData = stats.total === 0 && !stats.loading;

  // 🆕 Use real stats if available, fallback to mock if no data
  const displayStats = stats.total > 0 ? stats : mockStats;
  const completionByCategory = categoryStats.length > 0 && categoryStats[0].total > 0 
    ? categoryStats 
    : [
        { category: "E" as const, name: "Environnement", completed: 45, total: 60, percentage: 75 },
        { category: "S" as const, name: "Social", completed: 38, total: 50, percentage: 76 },
        { category: "G" as const, name: "Gouvernance", completed: 25, total: 32, percentage: 78 },
      ];

  // 🆕 Calculate status distribution from real data
  const statusDistribution = [
    { name: "Manquant", value: displayStats.missing, color: "#ef4444" },
    { name: "En cours", value: displayStats.inProgress, color: "#f59e0b" },
    { name: "Fourni", value: displayStats.provided, color: "#059669" },
    { name: "À réviser", value: displayStats.needsReview, color: "#3b82f6" },
    { name: "Validé", value: displayStats.accepted, color: "#10b981" },
  ];

  // Configuration selon posture
  const config = {
    conseil: {
      title: "Tableau de bord — Mode Conseil",
      subtitle: "Construction & préparation du dossier ESG",
      primaryColor: "#059669",
      badgeLabel: "Préparation",
      badgeIcon: Users,
      showAIHelp: true,
      focusMetrics: ["completion", "quality", "suggestions"],
      actions: [
        { label: "Mes tâches", icon: Clock },
        { label: "Continuer la collecte", primary: true },
      ],
    },
    "pre-audit": {
      title: "Tableau de bord — Mode Pré-Audit",
      subtitle: "Vérification & complétude avant audit externe",
      primaryColor: "#0F4C3A",
      badgeLabel: "Vérification",
      badgeIcon: Activity,
      showAIHelp: false,
      focusMetrics: ["completeness", "consistency", "warnings"],
      actions: [
        { label: "Points d'attention", icon: AlertCircle },
        { label: "Lancer vérification", primary: true },
      ],
    },
    "audit-externe": {
      title: "Tableau de bord — Mode Audit Externe",
      subtitle: "Validation & certification des données",
      primaryColor: "#dc2626",
      badgeLabel: "Audit externe",
      badgeIcon: Eye,
      showAIHelp: false,
      focusMetrics: ["validated", "rejected", "evidences"],
      actions: [
        { label: "Observations", icon: AlertCircle },
        { label: "Rapport d'audit", primary: true },
      ],
    },
  };

  const currentConfig = config[posture || "conseil"];
  const completionRate = Math.round(
    ((displayStats.provided + displayStats.accepted) / displayStats.total) * 100
  );

  // KPIs selon posture
  const getKPIs = () => {
    if (posture === "conseil") {
      return [
        {
          label: "Avancement global",
          value: `${completionRate}%`,
          subtitle: "Données collectées",
          icon: TrendingUp,
          trend: { value: "+8% vs mois dernier", isPositive: true },
          color: "text-green-600",
        },
        {
          label: "À collecter",
          value: displayStats.missing,
          subtitle: "Indicateurs manquants",
          icon: AlertCircle,
          color: "text-red-600",
        },
        {
          label: "En cours",
          value: displayStats.inProgress,
          subtitle: "Collecte en cours",
          icon: Clock,
          color: "text-yellow-600",
        },
        {
          label: "Complétés",
          value: displayStats.provided + displayStats.accepted,
          subtitle: "Prêts pour validation",
          icon: CheckCircle2,
          color: "text-green-600",
        },
      ];
    } else if (posture === "pre-audit") {
      return [
        {
          label: "Complétude",
          value: `${completionRate}%`,
          subtitle: "Indicateurs fournis",
          icon: BarChart3,
          trend: { value: "Objectif: 95%", isPositive: completionRate >= 95 },
          color: "text-[#0F4C3A]",
        },
        {
          label: "Manquants",
          value: displayStats.missing,
          subtitle: "Données à compléter",
          icon: AlertCircle,
          color: "text-red-600",
        },
        {
          label: "À réviser",
          value: displayStats.needsReview,
          subtitle: "Points d'attention",
          icon: Eye,
          color: "text-blue-600",
        },
        {
          label: "Conformes",
          value: displayStats.accepted,
          subtitle: "Validés",
          icon: CheckCircle2,
          color: "text-green-600",
        },
      ];
    } else {
      // audit-externe
      return [
        {
          label: "À auditer",
          value: displayStats.provided + displayStats.needsReview,
          subtitle: "En attente validation",
          icon: Clock,
          color: "text-yellow-600",
        },
        {
          label: "Validés",
          value: displayStats.accepted,
          subtitle: "Conformes",
          icon: CheckCircle2,
          color: "text-green-600",
        },
        {
          label: "Rejetés",
          value: displayStats.rejected,
          subtitle: "Non conformes",
          icon: XCircle,
          color: "text-red-600",
        },
        {
          label: "Preuves",
          value: 127,
          subtitle: "Documents associés",
          icon: FileCheck,
          color: "text-blue-600",
        },
      ];
    }
  };

  const kpis = getKPIs();

  // 🆕 Empty state when no packs exist
  if (hasNoData) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-[#E8F3F0] rounded-full flex items-center justify-center mx-auto">
              <BarChart3 className="h-8 w-8 text-[#059669]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#0A3B2E]">
                Aucun pack en cours
              </h2>
              <p className="text-muted-foreground">
                Créez votre premier pack de collecte ESG pour commencer à suivre vos indicateurs
              </p>
            </div>
            <div className="space-y-3 pt-4">
              <Button 
                className="w-full bg-[#059669] hover:bg-[#047857]"
                onClick={() => {
                  // Navigate to pack creation
                  window.location.hash = '#packs';
                }}
              >
                <FileCheck className="h-4 w-4 mr-2" />
                Créer mon premier pack
              </Button>
              <p className="text-sm text-muted-foreground">
                Un pack regroupe vos indicateurs E/S/G avec leurs preuves et méthodologies
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0A3B2E]">{currentConfig.title}</h1>
          <p className="text-muted-foreground mt-1">{currentConfig.subtitle}</p>
          <div className="flex items-center gap-3 mt-3">
            <Badge
              className="flex items-center gap-1"
              style={{ backgroundColor: currentConfig.primaryColor, color: "white" }}
            >
              <currentConfig.badgeIcon className="h-3 w-3" />
              {currentConfig.badgeLabel}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {currentConfig.actions.map((action, idx) => (
            <Button
              key={idx}
              variant={action.primary ? "default" : "outline"}
              className={action.primary ? `bg-[${currentConfig.primaryColor}] hover:bg-opacity-90` : ""}
            >
              {action.icon && <action.icon className="h-4 w-4 mr-2" />}
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 🆕 Tabs for Dashboard views */}
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

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPIs principaux */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {kpis.map((kpi, idx) => (
              <Card key={idx}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">{kpi.label}</p>
                    <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                  <p className="text-3xl font-bold text-[#0A3B2E]">{kpi.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{kpi.subtitle}</p>
                  {kpi.trend && (
                    <div className="flex items-center gap-1 mt-2">
                      {kpi.trend.isPositive ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      <span
                        className={`text-xs ${
                          kpi.trend.isPositive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {kpi.trend.value}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Alertes selon posture */}
          {posture === "conseil" && displayStats.missing > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-900">
                  <AlertCircle className="h-5 w-5" />
                  Points à finaliser
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-yellow-900">
                  <AlertCircle className="h-4 w-4" />
                  <span>{displayStats.missing} indicateurs à collecter</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-yellow-900">
                  <AlertCircle className="h-4 w-4" />
                  <span>15 preuves documentaires manquantes</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-yellow-900">
                  <AlertCircle className="h-4 w-4" />
                  <span>8 méthodologies de calcul à préciser</span>
                </div>
              </CardContent>
            </Card>
          )}

          {posture === "pre-audit" && displayStats.needsReview > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Eye className="h-5 w-5" />
                  Points d'attention
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-blue-900">
                  <AlertCircle className="h-4 w-4" />
                  <span>{displayStats.needsReview} indicateurs nécessitent une révision</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-900">
                  <AlertCircle className="h-4 w-4" />
                  <span>5 incohérences détectées entre périodes</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-900">
                  <AlertCircle className="h-4 w-4" />
                  <span>12 preuves à valider</span>
                </div>
              </CardContent>
            </Card>
          )}

          {posture === "audit-externe" && displayStats.rejected > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <XCircle className="h-5 w-5" />
                  Observations d'audit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-red-900">
                  <XCircle className="h-4 w-4" />
                  <span>{displayStats.rejected} indicateurs rejetés</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Complétude par catégorie E/S/G */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#059669]" />
                  Complétude par catégorie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={completionByCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" fill="#059669" name="Complétés" />
                    <Bar dataKey="total" fill="#e5e7eb" name="Total" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {completionByCategory.map((cat) => (
                    <div key={cat.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`${
                            cat.category === "E"
                              ? "bg-green-600"
                              : cat.category === "S"
                              ? "bg-blue-600"
                              : "bg-purple-600"
                          } text-white`}
                        >
                          {cat.category}
                        </Badge>
                        <span className="text-sm">{cat.name}</span>
                      </div>
                      <span className="text-sm font-medium">{cat.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Distribution par statut */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-[#059669]" />
                  Distribution par statut
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {statusDistribution.map((status) => (
                    <div key={status.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="text-sm">
                        {status.name}: {status.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Évolution temporelle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#059669]" />
                Évolution de la complétude
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="completion"
                    stroke="#059669"
                    strokeWidth={2}
                    name="Complétude (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Prochaines étapes (mode Conseil uniquement) */}
          {posture === "conseil" && (
            <Card className="border-[#059669]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#059669]" />
                  Prochaines étapes recommandées
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    title: "Finaliser la collecte Scope 3",
                    subtitle: "12 catégories d'émissions à compléter",
                  },
                  {
                    title: "Compléter les données sociales",
                    subtitle: "8 indicateurs S1 manquants",
                  },
                  {
                    title: "Ajouter les preuves documentaires",
                    subtitle: "15 indicateurs sans preuve",
                  },
                ].map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-[#059669] transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#059669] text-white flex items-center justify-center font-semibold text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium">{step.title}</p>
                        <p className="text-sm text-muted-foreground">{step.subtitle}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Top indicateurs manquants (mode Pré-Audit) */}
          {posture === "pre-audit" && displayStats.missing > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Top indicateurs manquants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { code: "E1-6", name: "Émissions GES Scope 3 - Catégorie 1", priority: "critical" },
                    { code: "S1-12", name: "Taux d'accidents du travail", priority: "high" },
                    { code: "E5-3", name: "Taux de recyclage déchets", priority: "medium" },
                  ].map((indicator) => (
                    <div
                      key={indicator.code}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            indicator.priority === "critical"
                              ? "destructive"
                              : indicator.priority === "high"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {indicator.priority === "critical"
                            ? "Critique"
                            : indicator.priority === "high"
                            ? "Prioritaire"
                            : "Important"}
                        </Badge>
                        <div>
                          <p className="font-mono text-sm font-semibold">{indicator.code}</p>
                          <p className="text-sm text-muted-foreground">{indicator.name}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Ajouter
                      </Button>
                    </div>
                  ))}
                </div>
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