/**
 * CACHE ANALYTICS PANEL - Dashboard pour monitorer les performances React Query
 * 
 * Fonctionnalités :
 * - Statistiques cache en temps réel
 * - Cache hit rate
 * - Liste des queries actives
 * - Actions de maintenance (clear, invalidate)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { useCacheAnalytics } from '@/hooks/useCacheAnalytics';
import {
  Activity,
  Database,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { Progress } from '@/app/components/ui/progress';
import { toast } from 'sonner';

export function CacheAnalyticsPanel() {
  const { stats, clearCache, invalidateAll, getQueryDetails } = useCacheAnalytics();

  const handleClearCache = () => {
    if (confirm('⚠️ Êtes-vous sûr de vouloir vider tout le cache ?')) {
      clearCache();
      toast.success('Cache vidé avec succès');
    }
  };

  const handleInvalidateAll = () => {
    invalidateAll();
    toast.success('Toutes les queries ont été invalidées');
  };

  const queryDetails = getQueryDetails();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#0A3B2E]">Cache Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Monitoring des performances React Query
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Queries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQueries}</div>
            <p className="text-xs text-muted-foreground">
              Queries dans le cache
            </p>
          </CardContent>
        </Card>

        {/* Cache Hit Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cacheHitRate}%</div>
            <Progress value={stats.cacheHitRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.cachedQueries} / {stats.totalQueries} en cache
            </p>
          </CardContent>
        </Card>

        {/* Stale Queries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queries périmées</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.staleQueries}</div>
            <p className="text-xs text-muted-foreground">
              Nécessitent un refresh
            </p>
          </CardContent>
        </Card>

        {/* Fetching */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.fetchingQueries}</div>
            <p className="text-xs text-muted-foreground">
              Chargement actif
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par statut</CardTitle>
          <CardDescription>
            Distribution des queries par état
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Success</span>
              </div>
              <Badge variant="outline" className="bg-green-50">
                {stats.queriesByStatus.success}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Error</span>
              </div>
              <Badge variant="outline" className="bg-red-50">
                {stats.queriesByStatus.error}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Pending</span>
              </div>
              <Badge variant="outline" className="bg-blue-50">
                {stats.queriesByStatus.pending}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions de maintenance</CardTitle>
          <CardDescription>
            Gestion du cache React Query
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handleInvalidateAll}
            variant="outline"
            className="w-full justify-start"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Invalider toutes les queries
          </Button>

          <Button
            onClick={handleClearCache}
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Vider tout le cache
          </Button>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3 inline mr-1" />
              Invalider rechargera les données. Vider supprimera tout le cache.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Query Details */}
      <Card>
        <CardHeader>
          <CardTitle>Détails des queries ({queryDetails.length})</CardTitle>
          <CardDescription>
            Liste de toutes les queries en mémoire
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {queryDetails.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune query en cache
              </p>
            ) : (
              queryDetails.map((query, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono truncate">
                      {JSON.stringify(query.queryKey)}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge
                        variant="outline"
                        className={
                          query.status === 'success'
                            ? 'bg-green-50'
                            : query.status === 'error'
                            ? 'bg-red-50'
                            : 'bg-blue-50'
                        }
                      >
                        {query.status}
                      </Badge>
                      {query.isFetching && (
                        <Badge variant="outline" className="bg-purple-50">
                          fetching
                        </Badge>
                      )}
                      {query.isStale && (
                        <Badge variant="outline" className="bg-orange-50">
                          stale
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground ml-4">
                    {query.dataUpdatedAt
                      ? new Date(query.dataUpdatedAt).toLocaleTimeString()
                      : '-'}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
