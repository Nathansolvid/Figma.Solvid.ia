// ============================================================================
// AUDIT TRAIL VIEW - Phase 6 + Activity Feed
// ============================================================================
// Vue complète de l'historique d'audit + flux d'activités récents
// Combine AuditCenter et ActivityFeed avec système d'onglets

import React, { useState, useMemo } from 'react'; // 🆕 Import useMemo
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'; // 🆕 Import Tabs
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { 
  Clock, 
  Filter, 
  Download, 
  Search,
  Activity,
  Users,
  CheckCircle2,
  TrendingUp,
  Calendar,
  FileText,
  AlertTriangle,
  History, // 🆕 Icon for Audit Trail tab
} from 'lucide-react';
import { 
  useOrganizationAuditTrail, 
  useAuditStatistics,
  formatAuditTimestamp,
  getActionLabel,
  getActionColor,
  getEntityTypeLabel,
  type AuditEntry 
} from '@/hooks/useAuditTrail';
import { ActivityFeedView } from '@/app/components/views/ActivityFeedView'; // 🆕 Import ActivityFeed component
import { toast } from 'sonner'; // 🆕 Import toast for notifications

interface HistoriqueProps {
  posture?: string;
}

export function Historique({ posture }: HistoriqueProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('30d');

  // Charger les vraies données depuis le backend
  const { data: auditData, isLoading, error } = useOrganizationAuditTrail();
  const { data: statisticsData } = useAuditStatistics();
  
  // Extraire les entries du résultat (le hook retourne { entries, total, hasMore })
  const auditEntries = auditData?.entries || [];
  const statistics = statisticsData?.statistics;

  // Filtrage - DOIT être appelé avant tout early return
  const filteredEntries = useMemo(() => {
    // S'assurer que auditEntries est un tableau valide
    if (!Array.isArray(auditEntries)) {
      return [];
    }

    let filtered = [...auditEntries];

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.user?.toLowerCase().includes(query) ||
        entry.entityName?.toLowerCase().includes(query) ||
        entry.comment?.toLowerCase().includes(query)
      );
    }

    // Filtre par action
    if (actionFilter !== 'all') {
      filtered = filtered.filter(entry => entry.action === actionFilter);
    }

    // Filtre par type d'entité
    if (entityFilter !== 'all') {
      filtered = filtered.filter(entry => entry.entityType === entityFilter);
    }

    // Filtre par période
    if (periodFilter !== 'all') {
      const now = Date.now();
      const periods: Record<string, number> = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000,
      };
      
      const maxAge = periods[periodFilter];
      if (maxAge) {
        filtered = filtered.filter(entry => 
          now - new Date(entry.timestamp).getTime() < maxAge
        );
      }
    }

    return filtered;
  }, [auditEntries, searchQuery, actionFilter, entityFilter, periodFilter]);

  // Statistiques - DOIT être appelé avant tout early return
  const stats = useMemo(() => {
    // S'assurer que auditEntries est un tableau valide
    if (!Array.isArray(auditEntries)) {
      return {
        total: 0,
        today: 0,
        uniqueUsers: 0,
        validationRate: 0,
      };
    }

    const now = Date.now();
    const today = auditEntries.filter(e => 
      now - new Date(e.timestamp).getTime() < 24 * 60 * 60 * 1000
    ).length;

    const uniqueUsers = new Set(auditEntries.map(e => e.userId)).size;
    
    const validations = auditEntries.filter(e => e.action === 'validate').length;
    const validationRate = auditEntries.length > 0 
      ? Math.round((validations / auditEntries.length) * 100) 
      : 0;

    return {
      total: auditEntries.length,
      today,
      uniqueUsers,
      validationRate,
    };
  }, [auditEntries]);

  // Afficher un loader pendant le chargement - APRÈS tous les hooks
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#059669] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  // Afficher une erreur si nécessaire - APRÈS tous les hooks
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="size-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-semibold">Erreur de chargement</p>
          <p className="text-muted-foreground">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  // 🆕 Export function for CSV download
  const handleExportCSV = () => {
    try {
      if (filteredEntries.length === 0) {
        toast.error('Aucune donnée à exporter');
        return;
      }

      // Create CSV content
      const headers = ['Date', 'Utilisateur', 'Action', 'Type', 'Entité', 'Commentaire', 'Ancien', 'Nouveau'];
      const rows = filteredEntries.map(entry => [
        formatAuditTimestamp(entry.timestamp),
        entry.user || '',
        getActionLabel(entry.action),
        getEntityTypeLabel(entry.entityType),
        entry.entityName || '',
        entry.comment || '',
        entry.oldValue !== undefined ? String(entry.oldValue) : '',
        entry.newValue !== undefined ? String(entry.newValue) : '',
      ]);

      // Build CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `audit-trail-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Export CSV réussi - ${filteredEntries.length} événements`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Erreur lors de l\'export CSV');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Piste d'Audit</h1>
        <p className="text-muted-foreground">
          Historique complet de toutes les modifications et actions sur les données ESG
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Événements</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aujourd'hui</p>
                <p className="text-2xl font-bold">{stats.today}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utilisateurs Actifs</p>
                <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux Validation</p>
                <p className="text-2xl font-bold">{stats.validationRate}%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="auditTrail">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="auditTrail">
            <History className="h-4 w-4 mr-2" />
            Piste d'Audit
          </TabsTrigger>
          <TabsTrigger value="activityFeed">
            <Activity className="h-4 w-4 mr-2" />
            Flux d'Activités
          </TabsTrigger>
        </TabsList>

        {/* Audit Trail Tab */}
        <TabsContent value="auditTrail">
          {/* Filtres */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Recherche */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Filtre Action */}
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type d'action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les actions</SelectItem>
                    <SelectItem value="create">Création</SelectItem>
                    <SelectItem value="update">Modification</SelectItem>
                    <SelectItem value="validate">Validation</SelectItem>
                    <SelectItem value="reject">Rejet</SelectItem>
                    <SelectItem value="delete">Suppression</SelectItem>
                    <SelectItem value="evidence_added">Preuve ajoutée</SelectItem>
                    <SelectItem value="evidence_removed">Preuve supprimée</SelectItem>
                  </SelectContent>
                </Select>

                {/* Filtre Entité */}
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type d'entité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les entités</SelectItem>
                    <SelectItem value="indicator">Indicateur</SelectItem>
                    <SelectItem value="pack">Pack</SelectItem>
                    <SelectItem value="evidence">Preuve</SelectItem>
                    <SelectItem value="folder">Dossier</SelectItem>
                  </SelectContent>
                </Select>

                {/* Filtre Période */}
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toute période</SelectItem>
                    <SelectItem value="24h">Dernières 24h</SelectItem>
                    <SelectItem value="7d">7 derniers jours</SelectItem>
                    <SelectItem value="30d">30 derniers jours</SelectItem>
                    <SelectItem value="90d">90 derniers jours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Historique des Modifications</CardTitle>
                  <CardDescription>
                    {filteredEntries.length} événement{filteredEntries.length > 1 ? 's' : ''} trouvé{filteredEntries.length > 1 ? 's' : ''}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredEntries.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun événement trouvé</h3>
                    <p className="text-muted-foreground">
                      Essayez de modifier vos filtres pour voir plus de résultats
                    </p>
                  </div>
                ) : (
                  filteredEntries.map((entry) => (
                    <AuditEntryCard key={entry.id} entry={entry} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Feed Tab */}
        <TabsContent value="activityFeed">
          <ActivityFeedView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// AUDIT ENTRY CARD COMPONENT
// ============================================================================

interface AuditEntryCardProps {
  entry: AuditEntry;
}

function AuditEntryCard({ entry }: AuditEntryCardProps) {
  const actionColor = getActionColor(entry.action);
  const actionLabel = getActionLabel(entry.action);
  const entityLabel = getEntityTypeLabel(entry.entityType);

  return (
    <div className="flex gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      {/* Timeline dot */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${actionColor} ring-4 ring-background`} />
        <div className="w-px h-full bg-border mt-2" />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={actionColor}>
                {actionLabel}
              </Badge>
              <Badge variant="secondary">
                {entityLabel}
              </Badge>
              {entry.entityName && (
                <span className="font-medium text-sm">{entry.entityName}</span>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {entry.user}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatAuditTimestamp(entry.timestamp)}
              </span>
            </div>
          </div>
        </div>

        {/* Details */}
        {entry.comment && (
          <p className="text-sm">{entry.comment}</p>
        )}

        {/* Field changes */}
        {entry.field && (entry.oldValue !== undefined || entry.newValue !== undefined) && (
          <div className="text-sm bg-muted/50 p-3 rounded-md">
            <span className="font-medium">{entry.field}</span>
            {': '}
            {entry.oldValue !== undefined && (
              <>
                <span className="text-red-600 line-through">{String(entry.oldValue)}</span>
                {' → '}
              </>
            )}
            {entry.newValue !== undefined && (
              <span className="text-green-600 font-medium">{String(entry.newValue)}</span>
            )}
          </div>
        )}

        {/* Metadata */}
        {entry.metadata && Object.keys(entry.metadata).length > 0 && (
          <div className="text-xs text-muted-foreground space-y-1">
            {entry.metadata.evidenceType && (
              <div>Type: {entry.metadata.evidenceType}</div>
            )}
            {entry.metadata.fileName && (
              <div>Fichier: {entry.metadata.fileName}</div>
            )}
            {entry.metadata.fileSize && (
              <div>Taille: {entry.metadata.fileSize}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}