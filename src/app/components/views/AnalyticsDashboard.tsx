import React from 'react';
import { usePacks } from '@/hooks/usePack';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  FileCheck, 
  AlertCircle,
  Database,
  Clock,
  CheckCircle2,
  Eye,
  ArrowRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  description?: string;
}

function MetricCard({ title, value, change, trend, icon, description }: MetricCardProps) {
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-[#059669]">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={`text-xs ${trendColor} flex items-center gap-1 mt-1`}>
            {TrendIcon && <TrendIcon className="size-3" />}
            {change}
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsDashboard() {
  const { data: packs, isLoading, error } = usePacks();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#059669] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="size-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-semibold">Erreur de chargement</p>
          <p className="text-muted-foreground">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const totalPacks = packs?.length || 0;
  
  // Status distribution
  const statusCounts = {
    DRAFT: 0,
    IN_PROGRESS: 0,
    READY_FOR_REVIEW: 0,
    APPROVED: 0,
    CHANGES_REQUESTED: 0,
    REJECTED: 0,
  };
  
  let totalCompletion = 0;
  let totalEvidences = 0;

  packs?.forEach((pack: any) => {
    const status = pack.status || 'DRAFT';
    if (status in statusCounts) {
      statusCounts[status as keyof typeof statusCounts]++;
    }
    totalCompletion += pack.completionScore || 0;
    totalEvidences += pack.evidences?.length || 0;
  });

  const avgCompletion = totalPacks > 0 ? Math.round(totalCompletion / totalPacks) : 0;

  // Pack status data for pie chart
  const statusData = [
    { name: 'Brouillon', value: statusCounts.DRAFT, color: '#94A3B8' },
    { name: 'En cours', value: statusCounts.IN_PROGRESS, color: '#3B82F6' },
    { name: 'Prêt pour revue', value: statusCounts.READY_FOR_REVIEW, color: '#F59E0B' },
    { name: 'Approuvé', value: statusCounts.APPROVED, color: '#059669' },
    { name: 'Modif. demandées', value: statusCounts.CHANGES_REQUESTED, color: '#EF4444' },
    { name: 'Rejeté', value: statusCounts.REJECTED, color: '#DC2626' },
  ].filter(item => item.value > 0);

  // Completion distribution for bar chart
  const completionBuckets = [
    { range: '0-25%', count: 0 },
    { range: '26-50%', count: 0 },
    { range: '51-75%', count: 0 },
    { range: '76-100%', count: 0 },
  ];

  packs?.forEach((pack: any) => {
    const score = pack.completionScore || 0;
    if (score <= 25) completionBuckets[0].count++;
    else if (score <= 50) completionBuckets[1].count++;
    else if (score <= 75) completionBuckets[2].count++;
    else completionBuckets[3].count++;
  });

  // Mock trend data (in real app, this would come from historical data)
  const trendData = [
    { week: 'S-4', packs: Math.max(0, totalPacks - 6), completion: Math.max(0, avgCompletion - 20) },
    { week: 'S-3', packs: Math.max(0, totalPacks - 4), completion: Math.max(0, avgCompletion - 15) },
    { week: 'S-2', packs: Math.max(0, totalPacks - 2), completion: Math.max(0, avgCompletion - 10) },
    { week: 'S-1', packs: Math.max(0, totalPacks - 1), completion: Math.max(0, avgCompletion - 5) },
    { week: 'Actuel', packs: totalPacks, completion: avgCompletion },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#0A3B2E]">Dashboard Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Vue d'ensemble de vos activités ESG
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Packs Actifs"
          value={totalPacks}
          change={totalPacks > 0 ? `${statusCounts.IN_PROGRESS} en cours` : undefined}
          trend={totalPacks > 0 ? 'up' : 'neutral'}
          icon={<Package className="size-4" />}
          description="Total de packs créés"
        />
        <MetricCard
          title="Completion Moyenne"
          value={`${avgCompletion}%`}
          change={avgCompletion >= 50 ? 'Bon progrès' : 'À compléter'}
          trend={avgCompletion >= 50 ? 'up' : 'neutral'}
          icon={<CheckCircle2 className="size-4" />}
          description="Moyenne tous packs"
        />
        <MetricCard
          title="Preuves Uploadées"
          value={totalEvidences}
          change={totalEvidences > 0 ? `Réparties sur ${totalPacks} packs` : undefined}
          trend={totalEvidences > 0 ? 'up' : 'neutral'}
          icon={<Database className="size-4" />}
          description="Documents justificatifs"
        />
        <MetricCard
          title="Packs Validés"
          value={statusCounts.APPROVED}
          change={statusCounts.APPROVED > 0 ? `${Math.round((statusCounts.APPROVED / totalPacks) * 100)}% du total` : undefined}
          trend={statusCounts.APPROVED > 0 ? 'up' : 'neutral'}
          icon={<FileCheck className="size-4" />}
          description="Prêts pour audit"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par Status</CardTitle>
            <CardDescription>
              Distribution des packs selon leur avancement
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name} (${entry.value})`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completion Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution Completion</CardTitle>
            <CardDescription>
              Nombre de packs par tranche de completion
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completionBuckets}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#059669" name="Nombre de packs" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution sur 5 semaines</CardTitle>
          <CardDescription>
            Tendance du nombre de packs et completion moyenne
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="packs"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Nombre de packs"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="completion"
                stroke="#059669"
                strokeWidth={2}
                name="Completion moyenne (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Packs Récents</CardTitle>
          <CardDescription>
            Derniers packs créés ou modifiés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {packs && packs.length > 0 ? (
              packs.slice(0, 5).map((pack: any) => (
                <div
                  key={pack.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Package className="size-5 text-[#059669]" />
                    <div>
                      <p className="font-medium">{pack.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {pack.templateName || pack.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{pack.completionScore || 0}%</p>
                      <p className="text-xs text-muted-foreground">
                        {pack.status === 'DRAFT' && 'Brouillon'}
                        {pack.status === 'IN_PROGRESS' && 'En cours'}
                        {pack.status === 'READY_FOR_REVIEW' && 'Prêt pour revue'}
                        {pack.status === 'APPROVED' && 'Approuvé'}
                        {pack.status === 'CHANGES_REQUESTED' && 'Modif. demandées'}
                        {pack.status === 'REJECTED' && 'Rejeté'}
                      </p>
                    </div>
                    <Clock className="size-4 text-muted-foreground" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="size-12 mx-auto mb-2 opacity-20" />
                <p>Aucun pack pour le moment</p>
                <p className="text-sm">Créez votre premier pack pour commencer</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}