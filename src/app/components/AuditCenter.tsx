import { useState, useMemo } from 'react';
import {
  Shield,
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  User,
  Activity,
  TrendingUp,
  FileText,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Skeleton } from '@/app/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  useOrganizationAuditTrail,
  useAuditStatistics,
  useExportAuditTrail,
  formatAuditTimestamp,
  getActionLabel,
  getActionColor,
  getEntityTypeLabel,
  getEntityTypeColor,
  type AuditFilters,
  type AuditEntry,
} from '@/hooks/useAuditTrail';

export function AuditCenter() {
  // Filters state
  const [filters, setFilters] = useState<AuditFilters>({
    limit: 50,
    offset: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');

  // React Query hooks
  const {
    data: auditData,
    isLoading: auditLoading,
    isError: auditError,
    error: auditErrorData,
    refetch: refetchAudit,
  } = useOrganizationAuditTrail(filters);

  const {
    data: statistics,
    isLoading: statsLoading,
  } = useAuditStatistics({
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  const exportMutation = useExportAuditTrail();

  // Extract data
  const entries = auditData?.entries || [];
  const total = auditData?.total || 0;
  const hasMore = auditData?.hasMore || false;

  // Apply client-side search filter
  const filteredEntries = useMemo(() => {
    if (!searchTerm) return entries;
    
    const term = searchTerm.toLowerCase();
    return entries.filter((entry) => {
      return (
        entry.user.toLowerCase().includes(term) ||
        entry.entityName?.toLowerCase().includes(term) ||
        entry.comment?.toLowerCase().includes(term) ||
        getActionLabel(entry.action).toLowerCase().includes(term)
      );
    });
  }, [entries, searchTerm]);

  // Date range handler
  const handleDateRangeChange = (range: 'today' | 'week' | 'month' | 'all') => {
    setDateRange(range);
    const now = new Date();
    let startDate: string | undefined;
    let endDate: string | undefined = now.toISOString();

    switch (range) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
        break;
      case 'all':
        startDate = undefined;
        endDate = undefined;
        break;
    }

    setFilters({ ...filters, startDate, endDate, offset: 0 });
  };

  // Action filter handler
  const handleActionFilter = (action: AuditEntry['action'] | 'all') => {
    setFilters({
      ...filters,
      action: action === 'all' ? undefined : action,
      offset: 0,
    });
  };

  // Entity type filter handler
  const handleEntityTypeFilter = (entityType: AuditEntry['entityType'] | 'all') => {
    setFilters({
      ...filters,
      entityType: entityType === 'all' ? undefined : entityType,
      offset: 0,
    });
  };

  // Export handler
  const handleExport = (format: 'csv' | 'pdf' | 'json') => {
    exportMutation.mutate({ filters, format });
  };

  // Load more handler
  const handleLoadMore = () => {
    setFilters({
      ...filters,
      offset: (filters.offset || 0) + (filters.limit || 50),
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#E8F3F0] rounded-lg">
            <Shield className="h-6 w-6 text-[#059669]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#0A3B2E]">Centre d'audit</h1>
            <p className="text-muted-foreground">
              Supervision complète de l'activité de l'organisation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchAudit()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Select onValueChange={(value) => handleExport(value as 'csv' | 'pdf' | 'json')}>
            <SelectTrigger className="w-[140px]">
              <div className="flex items-center gap-2">
                {exportMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>Exporter</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : statistics ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total d'entrées</p>
                  <p className="text-3xl font-bold text-[#0A3B2E]">{statistics.totalEntries}</p>
                </div>
                <Activity className="h-8 w-8 text-[#059669]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Validations</p>
                  <p className="text-3xl font-bold text-green-600">
                    {statistics.entriesByAction.validate || 0}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Modifications</p>
                  <p className="text-3xl font-bold text-amber-600">
                    {statistics.entriesByAction.update || 0}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {statistics.entriesByUser.length}
                  </p>
                </div>
                <User className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Filters & Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par utilisateur, entité, commentaire..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Date Range Filter */}
            <Select value={dateRange} onValueChange={(v) => handleDateRangeChange(v as any)}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">7 derniers jours</SelectItem>
                <SelectItem value="month">30 derniers jours</SelectItem>
                <SelectItem value="all">Tout</SelectItem>
              </SelectContent>
            </Select>

            {/* Action Filter */}
            <Select
              value={filters.action as string || 'all'}
              onValueChange={(v) => handleActionFilter(v as any)}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type d'action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                <SelectItem value="create">Créations</SelectItem>
                <SelectItem value="update">Modifications</SelectItem>
                <SelectItem value="validate">Validations</SelectItem>
                <SelectItem value="reject">Rejets</SelectItem>
                <SelectItem value="delete">Suppressions</SelectItem>
                <SelectItem value="evidence_added">Preuves ajoutées</SelectItem>
                <SelectItem value="evidence_removed">Preuves supprimées</SelectItem>
              </SelectContent>
            </Select>

            {/* Entity Type Filter */}
            <Select
              value={filters.entityType as string || 'all'}
              onValueChange={(v) => handleEntityTypeFilter(v as any)}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type d'entité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les entités</SelectItem>
                <SelectItem value="indicator">Indicateurs</SelectItem>
                <SelectItem value="pack">Packs</SelectItem>
                <SelectItem value="evidence">Preuves</SelectItem>
                <SelectItem value="folder">Dossiers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          {(filters.action || filters.entityType || searchTerm) && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <span className="text-sm text-muted-foreground">Filtres actifs :</span>
              {filters.action && (
                <Badge variant="outline" className="gap-1">
                  Action: {getActionLabel(filters.action as AuditEntry['action'])}
                  <button
                    onClick={() => handleActionFilter('all')}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.entityType && (
                <Badge variant="outline" className="gap-1">
                  Type: {getEntityTypeLabel(filters.entityType as AuditEntry['entityType'])}
                  <button
                    onClick={() => handleEntityTypeFilter('all')}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {searchTerm && (
                <Badge variant="outline" className="gap-1">
                  Recherche: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">
            <Activity className="h-4 w-4 mr-2" />
            Timeline ({filteredEntries.length})
          </TabsTrigger>
          <TabsTrigger value="statistics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Statistiques
          </TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Historique d'activité</span>
                <Badge variant="outline">
                  {filteredEntries.length} / {total} entrées
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : auditError ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    {auditErrorData?.message || 'Erreur lors du chargement de l\'historique'}
                  </AlertDescription>
                </Alert>
              ) : filteredEntries.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Aucune activité trouvée
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Essayez de modifier vos filtres
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={getActionColor(entry.action)}>
                            {getActionLabel(entry.action)}
                          </Badge>
                          <Badge className={getEntityTypeColor(entry.entityType)}>
                            {getEntityTypeLabel(entry.entityType)}
                          </Badge>
                          <span className="text-sm font-medium">{entry.user}</span>
                          {entry.role && (
                            <Badge variant="outline" className="text-xs">
                              {entry.role === 'client'
                                ? 'Client'
                                : entry.role === 'consultant'
                                ? 'Consultant'
                                : 'Auditeur'}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground ml-auto">
                            {formatAuditTimestamp(entry.timestamp)}
                          </span>
                        </div>

                        {entry.entityName && (
                          <p className="text-sm">
                            <span className="text-muted-foreground">Entité : </span>
                            <span className="font-medium">{entry.entityName}</span>
                          </p>
                        )}

                        {entry.field && (
                          <p className="text-sm">
                            <span className="text-muted-foreground">Champ : </span>
                            <span className="font-medium">{entry.field}</span>
                          </p>
                        )}

                        {(entry.oldValue !== undefined || entry.newValue !== undefined) && (
                          <div className="text-sm bg-muted/50 p-3 rounded-lg space-y-1">
                            {entry.oldValue !== undefined && (
                              <div>
                                <span className="text-muted-foreground">Avant : </span>
                                <span className="line-through text-red-600">
                                  {String(entry.oldValue)}
                                </span>
                              </div>
                            )}
                            {entry.newValue !== undefined && (
                              <div>
                                <span className="text-muted-foreground">Après : </span>
                                <span className="font-medium text-green-600">
                                  {String(entry.newValue)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {entry.comment && (
                          <p className="text-sm italic text-muted-foreground">"{entry.comment}"</p>
                        )}

                        {entry.affectedFields && entry.affectedFields.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Champs modifiés : {entry.affectedFields.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Load More */}
                  {hasMore && (
                    <div className="flex justify-center pt-4">
                      <Button variant="outline" onClick={handleLoadMore}>
                        Charger plus
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-4">
          {statsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : statistics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Actions by Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions par type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(statistics.entriesByAction).map(([action, count]) => (
                      <div key={action} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getActionColor(action as AuditEntry['action'])}>
                            {getActionLabel(action as AuditEntry['action'])}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{count}</span>
                          <span className="text-sm text-muted-foreground">
                            ({Math.round((count / statistics.totalEntries) * 100)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Entities by Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Activité par type d'entité</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(statistics.entriesByEntityType).map(([entityType, count]) => (
                      <div key={entityType} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={getEntityTypeColor(
                              entityType as AuditEntry['entityType']
                            )}
                          >
                            {getEntityTypeLabel(entityType as AuditEntry['entityType'])}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{count}</span>
                          <span className="text-sm text-muted-foreground">
                            ({Math.round((count / statistics.totalEntries) * 100)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Most Active Users */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Utilisateurs les plus actifs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {statistics.entriesByUser.slice(0, 5).map((user, index) => (
                      <div key={user.userId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#E8F3F0] text-[#059669] text-sm font-bold">
                            {index + 1}
                          </div>
                          <span className="font-medium">{user.userName}</span>
                        </div>
                        <span className="text-2xl font-bold">{user.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Most Active Entities */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Entités les plus modifiées</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {statistics.mostActiveEntities.slice(0, 5).map((entity, index) => (
                      <div key={entity.entityId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#E8F3F0] text-[#059669] text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{entity.entityName}</p>
                            <p className="text-xs text-muted-foreground">
                              {getEntityTypeLabel(entity.entityType as AuditEntry['entityType'])}
                            </p>
                          </div>
                        </div>
                        <span className="text-2xl font-bold">{entity.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}