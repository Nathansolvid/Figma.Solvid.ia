import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
  Clock,
  Filter,
  Download,
  RefreshCw,
  Search,
  User,
  FileText,
  Package,
  Shield,
  TrendingUp,
  Upload,
  Edit,
  CheckCircle,
  XCircle,
  Trash2,
  Calendar,
  Activity,
  Eye,
} from 'lucide-react';
import { dataProvider } from '@/services/dataProvider';
import { toast } from 'sonner';
import { formatAuditTimestamp, getActionLabel, getActionColor } from '@/hooks/useAuditTrail';

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  userId: string;
  role: 'client' | 'consultant' | 'auditeur';
  action: 'create' | 'update' | 'validate' | 'reject' | 'delete' | 'evidence_added' | 'evidence_removed';
  entityType: 'indicator' | 'pack' | 'evidence' | 'folder';
  entityId: string;
  entityName?: string;
  field?: string;
  oldValue?: string | number;
  newValue?: string | number;
  comment?: string;
  metadata?: Record<string, any>;
}

interface ActivityStats {
  totalActions: number;
  todayActions: number;
  weekActions: number;
  topUsers: Array<{ name: string; count: number }>;
  actionsByType: Array<{ action: string; count: number }>;
}

export function ActivityFeedView() {
  const [activities, setActivities] = useState<AuditEntry[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterEntityType, setFilterEntityType] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('all');
  const [stats, setStats] = useState<ActivityStats>({
    totalActions: 0,
    todayActions: 0,
    weekActions: 0,
    topUsers: [],
    actionsByType: [],
  });

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [activities, searchQuery, filterAction, filterEntityType, filterDateRange]);

  async function loadActivities() {
    setLoading(true);
    try {
      const auditLogs = await dataProvider.store.list('audit_logs');
      
      // Sort by timestamp descending (most recent first)
      const sorted = auditLogs.sort((a: any, b: any) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(sorted);
      calculateStats(sorted);
      
      console.log(`✅ Loaded ${sorted.length} activity entries`);
    } catch (error) {
      console.error('Failed to load activities:', error);
      toast.error('Erreur lors du chargement des activités');
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(logs: AuditEntry[]) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const todayLogs = logs.filter(log => new Date(log.timestamp) >= today);
    const weekLogs = logs.filter(log => new Date(log.timestamp) >= weekAgo);

    // Count actions by user
    const userCounts = logs.reduce((acc: any, log) => {
      acc[log.user] = (acc[log.user] || 0) + 1;
      return acc;
    }, {});

    const topUsers = Object.entries(userCounts)
      .map(([name, count]) => ({ name, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Count actions by type
    const actionCounts = logs.reduce((acc: any, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {});

    const actionsByType = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count: count as number }))
      .sort((a, b) => b.count - a.count);

    setStats({
      totalActions: logs.length,
      todayActions: todayLogs.length,
      weekActions: weekLogs.length,
      topUsers,
      actionsByType,
    });
  }

  function applyFilters() {
    let filtered = [...activities];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.user.toLowerCase().includes(query) ||
        log.entityName?.toLowerCase().includes(query) ||
        log.comment?.toLowerCase().includes(query)
      );
    }

    // Action filter
    if (filterAction !== 'all') {
      filtered = filtered.filter(log => log.action === filterAction);
    }

    // Entity type filter
    if (filterEntityType !== 'all') {
      filtered = filtered.filter(log => log.entityType === filterEntityType);
    }

    // Date range filter
    if (filterDateRange !== 'all') {
      const now = new Date();
      let cutoffDate: Date;

      switch (filterDateRange) {
        case 'today':
          cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(0);
      }

      filtered = filtered.filter(log => new Date(log.timestamp) >= cutoffDate);
    }

    setFilteredActivities(filtered);
  }

  function handleExport() {
    const csv = convertToCSV(filteredActivities);
    downloadCSV(csv, `audit-trail-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Export CSV téléchargé');
  }

  function convertToCSV(data: AuditEntry[]): string {
    const headers = ['Date', 'Heure', 'Utilisateur', 'Action', 'Type', 'Entité', 'Commentaire'];
    const rows = data.map(log => [
      new Date(log.timestamp).toLocaleDateString('fr-FR'),
      new Date(log.timestamp).toLocaleTimeString('fr-FR'),
      log.user,
      getActionLabel(log.action),
      getEntityTypeLabel(log.entityType),
      log.entityName || log.entityId,
      log.comment || '',
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }

  function downloadCSV(csv: string, filename: string) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  function getEntityTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      indicator: 'Indicateur',
      pack: 'Pack',
      evidence: 'Preuve',
      folder: 'Dossier',
    };
    return labels[type] || type;
  }

  function getActionIcon(action: string) {
    const icons: Record<string, any> = {
      create: Upload,
      update: Edit,
      validate: CheckCircle,
      reject: XCircle,
      delete: Trash2,
      evidence_added: FileText,
      evidence_removed: Trash2,
    };
    return icons[action] || Activity;
  }

  function getRoleColor(role: string): string {
    const colors: Record<string, string> = {
      client: 'bg-blue-100 text-blue-800',
      consultant: 'bg-purple-100 text-purple-800',
      auditeur: 'bg-green-100 text-green-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activité & Audit Trail</h1>
          <p className="text-muted-foreground mt-1">
            Historique complet de toutes les actions (traçabilité complète)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadActivities}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions Totales</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActions}</div>
            <p className="text-xs text-muted-foreground">Toutes périodes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aujourd'hui</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayActions}</div>
            <p className="text-xs text-muted-foreground">Actions du jour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cette Semaine</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weekActions}</div>
            <p className="text-xs text-muted-foreground">7 derniers jours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Actifs</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.topUsers.length}</div>
            <p className="text-xs text-muted-foreground">Contributeurs</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Recherche</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les actions</SelectItem>
                  <SelectItem value="create">Créé</SelectItem>
                  <SelectItem value="update">Modifié</SelectItem>
                  <SelectItem value="validate">Validé</SelectItem>
                  <SelectItem value="reject">Rejeté</SelectItem>
                  <SelectItem value="delete">Supprimé</SelectItem>
                  <SelectItem value="evidence_added">Preuve ajoutée</SelectItem>
                  <SelectItem value="evidence_removed">Preuve supprimée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type d'entité</label>
              <Select value={filterEntityType} onValueChange={setFilterEntityType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="indicator">Indicateur</SelectItem>
                  <SelectItem value="pack">Pack</SelectItem>
                  <SelectItem value="evidence">Preuve</SelectItem>
                  <SelectItem value="folder">Dossier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Période</label>
              <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les périodes</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">7 derniers jours</SelectItem>
                  <SelectItem value="month">30 derniers jours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Timeline d'activité</CardTitle>
              <CardDescription>
                {filteredActivities.length} {filteredActivities.length > 1 ? 'entrées' : 'entrée'} trouvée(s)
              </CardDescription>
            </div>
            {filteredActivities.length !== activities.length && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSearchQuery('');
                  setFilterAction('all');
                  setFilterEntityType('all');
                  setFilterDateRange('all');
                }}
              >
                Réinitialiser filtres
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Chargement des activités...
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune activité trouvée avec ces filtres</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((log, index) => {
                const Icon = getActionIcon(log.action);
                const showDateHeader = index === 0 || 
                  new Date(log.timestamp).toDateString() !== 
                  new Date(filteredActivities[index - 1].timestamp).toDateString();

                return (
                  <div key={log.id}>
                    {showDateHeader && (
                      <div className="flex items-center gap-2 mb-4 mt-6">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-semibold text-muted-foreground">
                          {new Date(log.timestamp).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                    )}

                    <div className="flex gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getActionColor(log.action)}`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{log.user}</span>
                            <Badge variant="secondary" className={`text-xs ${getRoleColor(log.role)}`}>
                              {log.role}
                            </Badge>
                            <span className="text-muted-foreground">·</span>
                            <Badge variant="outline" className="text-xs">
                              {getActionLabel(log.action)}
                            </Badge>
                            {log.entityType && (
                              <>
                                <span className="text-muted-foreground">·</span>
                                <Badge variant="outline" className="text-xs">
                                  {getEntityTypeLabel(log.entityType)}
                                </Badge>
                              </>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatAuditTimestamp(log.timestamp)}
                          </span>
                        </div>

                        {log.entityName && (
                          <div className="text-sm font-medium mb-1">
                            {log.entityName}
                          </div>
                        )}

                        {log.field && (
                          <div className="text-sm text-muted-foreground mb-1">
                            <span className="font-medium">{log.field}:</span>{' '}
                            {log.oldValue !== undefined && (
                              <>
                                <span className="line-through opacity-60">{log.oldValue}</span>
                                {' → '}
                              </>
                            )}
                            <span className="text-foreground font-medium">{log.newValue}</span>
                          </div>
                        )}

                        {log.comment && (
                          <div className="text-sm text-muted-foreground mt-2 italic">
                            "{log.comment}"
                          </div>
                        )}

                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="text-xs text-muted-foreground mt-2 space-y-1">
                            {Object.entries(log.metadata).map(([key, value]) => (
                              <div key={key}>
                                <span className="font-medium">{key}:</span> {String(value)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Contributors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top Contributeurs</CardTitle>
            <CardDescription>Utilisateurs les plus actifs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topUsers.map((user, index) => (
                <div key={user.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold">#{index + 1}</span>
                    </div>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.count} actions</div>
                    </div>
                  </div>
                  <Badge variant="secondary">{user.count}</Badge>
                </div>
              ))}
              {stats.topUsers.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  Aucune activité enregistrée
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions par Type</CardTitle>
            <CardDescription>Répartition des actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.actionsByType.map(item => (
                <div key={item.action} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{getActionLabel(item.action as any)}</span>
                    <span className="text-muted-foreground">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ 
                        width: `${(item.count / stats.totalActions) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
              {stats.actionsByType.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  Aucune action enregistrée
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
