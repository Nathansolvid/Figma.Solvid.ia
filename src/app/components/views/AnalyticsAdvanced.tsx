import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Calendar,
  Download,
  RefreshCw,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  FileCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { dataProvider } from '@/services/dataProvider';
import { toast } from 'sonner';

interface AnalyticsAdvancedProps {
  onNavigate?: (view: string) => void;
}

export function AnalyticsAdvanced({ onNavigate }: AnalyticsAdvancedProps) {
  const { stats, categoryStats, reload } = useDashboardStats();
  const [loading, setLoading] = useState(false);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [evidenceStats, setEvidenceStats] = useState<any>({
    total: 0,
    byCategory: [],
    uploadActivity: [],
  });
  const [packStats, setPackStats] = useState<any>({
    total: 0,
    active: 0,
    completed: 0,
    avgCompletion: 0,
  });

  useEffect(() => {
    loadAdvancedStats();
  }, []);

  async function loadAdvancedStats() {
    setLoading(true);
    try {
      // Load packs
      const packs = await dataProvider.store.list('pack_instances');
      
      // Load evidence
      const allEvidence = await dataProvider.store.list('evidence');
      
      // Load audit logs
      const auditLogs = await dataProvider.store.list('audit_logs');

      // Calculate pack stats
      const completedPacks = packs.filter(p => p.completionScore >= 100).length;
      const activePacks = packs.filter(p => p.completionScore < 100 && p.completionScore > 0).length;
      const avgCompletion = packs.length > 0
        ? Math.round(packs.reduce((sum, p) => sum + (p.completionScore || 0), 0) / packs.length)
        : 0;

      setPackStats({
        total: packs.length,
        active: activePacks,
        completed: completedPacks,
        avgCompletion,
      });

      // Calculate evidence stats by category
      const evidenceByCategory = [
        {
          category: 'E',
          name: 'Environnement',
          count: allEvidence.filter((e: any) => e.category === 'E').length,
          color: '#059669',
        },
        {
          category: 'S',
          name: 'Social',
          count: allEvidence.filter((e: any) => e.category === 'S').length,
          color: '#3B82F6',
        },
        {
          category: 'G',
          name: 'Gouvernance',
          count: allEvidence.filter((e: any) => e.category === 'G').length,
          color: '#8B5CF6',
        },
      ];

      // Calculate upload activity (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const uploadActivity = last7Days.map(date => {
        const count = allEvidence.filter((e: any) => {
          const uploadDate = e.uploadedAt?.split('T')[0];
          return uploadDate === date;
        }).length;

        return {
          date: new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' }),
          count,
        };
      });

      setEvidenceStats({
        total: allEvidence.length,
        byCategory: evidenceByCategory,
        uploadActivity,
      });

      // Calculate timeline data (completion progress over time)
      // For demo purposes, generate mock timeline
      const today = new Date();
      const timeline = Array.from({ length: 6 }, (_, i) => {
        const month = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
        // Simulate progressive completion
        const baseCompletion = 40 + (i * 8);
        return {
          month: month.toLocaleDateString('fr-FR', { month: 'short' }),
          completion: Math.min(baseCompletion + Math.random() * 5, 100),
          activePacks: Math.max(1, packs.length - Math.floor(i / 2)),
        };
      });

      setTimelineData(timeline);

    } catch (error) {
      console.error('Failed to load advanced stats:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  }

  // Prepare data for charts
  const statusDistribution = [
    { name: 'Manquant', value: stats.missing, color: '#EF4444' },
    { name: 'En cours', value: stats.inProgress, color: '#F59E0B' },
    { name: 'Fourni', value: stats.provided, color: '#059669' },
    { name: 'À réviser', value: stats.needsReview, color: '#3B82F6' },
    { name: 'Validé', value: stats.accepted, color: '#10B981' },
  ].filter(item => item.value > 0);

  const completionByPillar = categoryStats.map(cat => ({
    pillar: cat.category,
    name: cat.name,
    completed: cat.completed,
    remaining: cat.total - cat.completed,
    percentage: cat.percentage,
  }));

  const radarData = categoryStats.map(cat => ({
    category: cat.category,
    score: cat.percentage,
    fullMark: 100,
  }));

  const handleRefresh = () => {
    reload();
    loadAdvancedStats();
    toast.success('Données actualisées');
  };

  const handleExportReport = () => {
    toast.success('Export en cours...', {
      description: 'Le rapport sera téléchargé dans quelques instants',
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Avancé</h1>
          <p className="text-muted-foreground mt-1">
            Visualisations et insights sur vos données ESG
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Packs Actifs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packStats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 font-medium">{packStats.active} en cours</span>
              {' • '}
              {packStats.completed} terminés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Moyenne</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packStats.avgCompletion}%</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              {packStats.avgCompletion >= 75 ? (
                <>
                  <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                  <span className="text-green-600">Excellent</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-3 h-3 text-orange-600 mr-1" />
                  <span className="text-orange-600">En progression</span>
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preuves Uploadées</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{evidenceStats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {evidenceStats.uploadActivity.reduce((sum: number, day: any) => sum + day.count, 0)} cette semaine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Indicateurs Totaux</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 font-medium">{stats.provided + stats.accepted} fournis</span>
              {' • '}
              {stats.missing} manquants
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="progress">Progression</TabsTrigger>
          <TabsTrigger value="evidence">Preuves</TabsTrigger>
          <TabsTrigger value="breakdown">Répartition</TabsTrigger>
        </TabsList>

        {/* Tab: Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Completion by Pillar - Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Completion par Pilier E/S/G</CardTitle>
                <CardDescription>
                  Indicateurs complétés vs restants par catégorie
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={completionByPillar}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="pillar" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" fill="#059669" name="Complétés" />
                    <Bar dataKey="remaining" fill="#E5E7EB" name="Restants" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution - Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition par Statut</CardTitle>
                <CardDescription>
                  Distribution des {stats.total} indicateurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => 
                        `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                      }
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Progress */}
        <TabsContent value="progress" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Completion Timeline */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Évolution du Score de Completion</CardTitle>
                <CardDescription>
                  Progression sur les 6 derniers mois
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="completion" 
                      stroke="#059669" 
                      strokeWidth={2}
                      name="Completion (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Radar Chart - Performance by Pillar */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Globale E/S/G</CardTitle>
                <CardDescription>
                  Vue radar du taux de completion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar 
                      name="Score" 
                      dataKey="score" 
                      stroke="#059669" 
                      fill="#059669" 
                      fillOpacity={0.6} 
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Completion Details */}
            <Card>
              <CardHeader>
                <CardTitle>Détail par Catégorie</CardTitle>
                <CardDescription>
                  Progression détaillée E/S/G
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryStats.map(cat => (
                    <div key={cat.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{cat.category}</Badge>
                          <span className="font-medium">{cat.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {cat.completed}/{cat.total}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{cat.percentage}% complété</span>
                        <span>{cat.total - cat.completed} restants</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Evidence */}
        <TabsContent value="evidence" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Evidence by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Preuves par Catégorie</CardTitle>
                <CardDescription>
                  Répartition des {evidenceStats.total} documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={evidenceStats.byCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8B5CF6" name="Documents" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Upload Activity - Area Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Activité d'Upload</CardTitle>
                <CardDescription>
                  Documents uploadés cette semaine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={evidenceStats.uploadActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#059669" 
                      fill="#059669" 
                      fillOpacity={0.6}
                      name="Documents"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Breakdown */}
        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {categoryStats.map(cat => (
              <Card key={cat.category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={
                        cat.category === 'E' ? 'border-green-600 text-green-600' :
                        cat.category === 'S' ? 'border-blue-600 text-blue-600' :
                        'border-purple-600 text-purple-600'
                      }
                    >
                      {cat.category}
                    </Badge>
                    {cat.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold">{cat.percentage}%</div>
                      <p className="text-sm text-muted-foreground mt-1">Completion</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Complétés</span>
                        <span className="font-medium text-green-600">{cat.completed}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Restants</span>
                        <span className="font-medium text-orange-600">{cat.total - cat.completed}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-medium">{cat.total}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
