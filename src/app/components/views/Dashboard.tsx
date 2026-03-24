import { StatCard } from "@/app/components/StatCard";
import { DataProgressBar } from "@/app/components/DataProgressBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { 
  Leaf, 
  TrendingUp, 
  FileCheck, 
  AlertCircle,
  ArrowRight,
  Cloud,
  Shield,
  Users,
  CheckCircle2
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
  Legend
} from "recharts";

const emissionsData = [
  { name: "Scope 1", value: 1240, color: "#0F4C3A" },
  { name: "Scope 2", value: 830, color: "#059669" },
  { name: "Scope 3", value: 4560, color: "#10B981" },
];

const topEmissionsData = [
  { category: "Transport", value: 2340 },
  { category: "Énergie", value: 1890 },
  { category: "Achats", value: 1420 },
  { category: "Déchets", value: 680 },
  { category: "Déplacements", value: 300 },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de votre conformité ESG et CSRD
        </p>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Empreinte carbone totale"
          value="6 630"
          icon={Cloud}
          subtitle="tCO₂e (2025)"
          trend={{ value: "12% vs 2024", isPositive: false }}
          indicatorCode="CARBON_FOOTPRINT_TOTAL"
          posture="conseil"
        />
        <StatCard
          title="Conformité CSRD"
          value="78%"
          icon={FileCheck}
          subtitle="En progression"
          trend={{ value: "8% ce mois", isPositive: true }}
          indicatorCode="CSRD_COMPLIANCE_RATE"
          posture="conseil"
        />
        <StatCard
          title="Données complètes"
          value="142/180"
          icon={TrendingUp}
          subtitle="Indicateurs ESG"
          indicatorCode="DATA_COMPLETE_COUNT"
          posture="conseil"
        />
        <StatCard
          title="Points critiques"
          value="7"
          icon={AlertCircle}
          subtitle="À traiter"
          indicatorCode="CRITICAL_POINTS_COUNT"
          posture="conseil"
        />
      </div>

      {/* Statut des données */}
      <Card>
        <CardHeader>
          <CardTitle>Statut des données ESG</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <DataProgressBar
            label="Données environnementales"
            complete={34}
            validated={28}
            missing={8}
          />
          <DataProgressBar
            label="Données sociales"
            complete={22}
            validated={18}
            missing={12}
          />
          <DataProgressBar
            label="Données de gouvernance"
            complete={18}
            validated={16}
            missing={4}
          />
        </CardContent>
      </Card>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition par scope */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des émissions par scope</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={emissionsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {emissionsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} tCO₂e`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {emissionsData.map((item) => (
                <div key={item.name} className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value.toLocaleString()} tCO₂e</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top postes d'émissions */}
        <Card>
          <CardHeader>
            <CardTitle>Principaux postes d'émissions</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topEmissionsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" />
                <YAxis dataKey="category" type="category" width={100} />
                <Tooltip formatter={(value) => `${value} tCO₂e`} />
                <Bar dataKey="value" fill="#0F4C3A" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions recommandées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-[#FFF7ED]">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-[#F59E0B] mt-0.5" />
              <div>
                <p className="font-medium">Compléter les données Scope 3</p>
                <p className="text-sm text-muted-foreground">12 postes d'émissions manquants</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Compléter
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-[#FEF2F2]">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-[#DC2626] mt-0.5" />
              <div>
                <p className="font-medium">Exigences ESRS E1 incomplètes</p>
                <p className="text-sm text-muted-foreground">7 indicateurs climatiques requis</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Voir les détails
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-start gap-3">
              <Leaf className="h-5 w-5 text-[#059669] mt-0.5" />
              <div>
                <p className="font-medium">Rapport CSRD prêt pour revue</p>
                <p className="text-sm text-muted-foreground">142 indicateurs validés</p>
              </div>
            </div>
            <Button size="sm" className="bg-[#0F4C3A] hover:bg-[#0A3B2E]">
              Générer le rapport
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}