/**
 * ERP CONNECTOR VIEW
 *
 * Hub de connexion ERP universel. Permet à toute entreprise de :
 * 1. Parcourir le catalogue de connecteurs ERP disponibles
 * 2. Configurer une connexion (API key / OAuth / FEC)
 * 3. Mapper les données ERP vers les indicateurs ESG (VSME)
 * 4. Lancer une synchronisation et prévisualiser les résultats
 * 5. Suivre l'historique des synchronisations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/components/ui/dialog';
import { Progress } from '@/app/components/ui/progress';
import { Switch } from '@/app/components/ui/switch';
import { toast } from 'sonner';
import {
  Plug, Plus, CheckCircle2, XCircle, Clock, RefreshCw, ArrowRight,
  Settings2, Trash2, Zap, Database, Link2, ChevronRight, Search,
  FileSpreadsheet, BarChart3, AlertTriangle, Loader2, Shield,
  ArrowLeftRight, Globe, Building2, CircleDot, Eye, Download,
  Send, FolderOpen, ExternalLink,
} from 'lucide-react';
import { useDossiers } from '@/contexts/DossierContext';
import { erpConnectorService, ERP_CATALOG } from '@/services/erpConnectorService';
import { ESG_CATEGORY_LABELS, type SupplierCategorySummary } from '@/services/erpCategorizationEngine';
import type {
  ERPProvider, ERPConnectorDefinition, ERPConnection,
  ERPMapping, MappingRule, SyncJob, SyncDataPreview,
  EnrichedSyncDataPreview, ESGDataPoint, DataConfidenceLevel,
} from '@/types/erp';

// ─── Sub-views ──────────────────────────────────────────────────────

type SubView = 'catalog' | 'connections' | 'setup' | 'mapping' | 'sync-detail';

export function ERPConnectorView() {
  const [subView, setSubView] = useState<SubView>('catalog');
  const [connections, setConnections] = useState<ERPConnection[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ERPConnectorDefinition | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<ERPConnection | null>(null);
  const [selectedSyncJob, setSelectedSyncJob] = useState<SyncJob | null>(null);
  const [enrichedPreviews, setEnrichedPreviews] = useState<EnrichedSyncDataPreview[]>([]);
  const [esgPoints, setEsgPoints] = useState<ESGDataPoint[]>([]);
  const [supplierSummary, setSupplierSummary] = useState<SupplierCategorySummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Refresh connections
  const refreshConnections = () => {
    setConnections(erpConnectorService.getConnections());
  };

  useEffect(() => {
    refreshConnections();
  }, []);

  const activeConnections = connections.filter(c => c.status === 'connected');
  const stats = erpConnectorService.getStats('org-solvid-001');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A3B2E] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#059669] to-[#10B981] flex items-center justify-center">
              <Plug className="h-5 w-5 text-white" />
            </div>
            Connecteurs ERP
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Connectez votre ERP pour alimenter automatiquement vos référentiels ESG
          </p>
        </div>
        {connections.length > 0 && subView !== 'catalog' && (
          <Button variant="outline" onClick={() => setSubView('catalog')}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau connecteur
          </Button>
        )}
      </div>

      {/* Stats bar */}
      {connections.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <StatMini icon={<Plug className="h-4 w-4" />} label="Connexions" value={String(stats.totalConnections)} color="blue" />
          <StatMini icon={<CheckCircle2 className="h-4 w-4" />} label="Actives" value={String(stats.activeConnections)} color="green" />
          <StatMini icon={<RefreshCw className="h-4 w-4" />} label="Synchronisations" value={String(stats.totalSyncs)} color="purple" />
          <StatMini icon={<BarChart3 className="h-4 w-4" />} label="Indicateurs remplis" value={String(stats.indicatorsAutoFilled)} color="amber" />
        </div>
      )}

      {/* Navigation tabs */}
      {connections.length > 0 && subView !== 'setup' && subView !== 'mapping' && subView !== 'sync-detail' && (
        <Tabs value={subView} onValueChange={(v) => setSubView(v as SubView)}>
          <TabsList>
            <TabsTrigger value="catalog">Catalogue</TabsTrigger>
            <TabsTrigger value="connections">
              Mes connexions
              {activeConnections.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-700">
                  {activeConnections.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Sub-view content */}
      {subView === 'catalog' && (
        <CatalogView
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectProvider={(def) => {
            setSelectedProvider(def);
            setSubView('setup');
          }}
          connections={connections}
        />
      )}

      {subView === 'connections' && (
        <ConnectionsView
          connections={connections}
          onRefresh={refreshConnections}
          onSync={(conn) => {
            setSelectedConnection(conn);
            // Trigger enriched sync
            handleEnrichedSync(conn, refreshConnections, (result) => {
              setSelectedSyncJob(result.job);
              setEnrichedPreviews(result.enrichedPreviews);
              setEsgPoints(result.esgPoints);
              setSupplierSummary(result.supplierSummary);
              setSubView('sync-detail');
            });
          }}
          onMapping={(conn) => {
            setSelectedConnection(conn);
            setSubView('mapping');
          }}
          onDelete={(conn) => {
            erpConnectorService.deleteConnection(conn.id);
            refreshConnections();
            toast.success('Connexion supprimée');
          }}
        />
      )}

      {subView === 'setup' && selectedProvider && (
        <SetupView
          provider={selectedProvider}
          onBack={() => setSubView('catalog')}
          onComplete={(conn) => {
            setSelectedConnection(conn);
            refreshConnections();
            setSubView('connections');
          }}
        />
      )}

      {subView === 'mapping' && selectedConnection && (
        <MappingView
          connection={selectedConnection}
          onBack={() => setSubView('connections')}
        />
      )}

      {subView === 'sync-detail' && selectedSyncJob && (
        <SyncDetailView
          job={selectedSyncJob}
          connection={connections.find(c => c.id === selectedSyncJob.connectionId)}
          enrichedPreviews={enrichedPreviews}
          esgPoints={esgPoints}
          supplierSummary={supplierSummary}
          onBack={() => setSubView('connections')}
        />
      )}
    </div>
  );
}

// ─── Catalogue ──────────────────────────────────────────────────────

function CatalogView({ searchQuery, onSearchChange, onSelectProvider, connections }: {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectProvider: (def: ERPConnectorDefinition) => void;
  connections: ERPConnection[];
}) {
  const filtered = ERP_CATALOG.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const available = filtered.filter(c => c.status === 'available');
  const comingSoon = filtered.filter(c => c.status === 'coming_soon');

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher un ERP..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Available */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-emerald-600" />
          Disponibles maintenant
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {available.map(connector => {
            const isConnected = connections.some(
              c => c.provider === connector.id && c.status === 'connected'
            );
            return (
              <ConnectorCard
                key={connector.id}
                connector={connector}
                isConnected={isConnected}
                onSelect={() => onSelectProvider(connector)}
              />
            );
          })}
        </div>
      </div>

      {/* Coming soon */}
      {comingSoon.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Bientôt disponibles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {comingSoon.map(connector => (
              <ConnectorCard
                key={connector.id}
                connector={connector}
                isConnected={false}
                onSelect={() => toast.info(`${connector.name} sera bientôt disponible !`)}
                disabled
              />
            ))}
          </div>
        </div>
      )}

      {/* Info banner */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-800">
                Vos données restent sécurisées
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                Les connexions ERP utilisent des clés API en lecture seule.
                Aucune donnée n'est modifiée dans votre ERP.
                Les credentials sont stockées localement sur votre machine.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Connector Card ─────────────────────────────────────────────────

function ConnectorCard({ connector, isConnected, onSelect, disabled }: {
  connector: ERPConnectorDefinition;
  isConnected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  const categoryLabels: Record<string, string> = {
    comptabilite: 'Comptabilité',
    rh: 'RH',
    achats: 'Achats',
    energie: 'Énergie',
    dechets: 'Déchets',
    transport: 'Transport',
  };

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md hover:border-emerald-300 ${
        disabled ? 'opacity-60 hover:shadow-none hover:border-gray-200' : ''
      } ${isConnected ? 'border-emerald-400 bg-emerald-50/50' : ''}`}
      onClick={onSelect}
    >
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{connector.logo}</span>
            <div>
              <h4 className="font-semibold text-gray-900">{connector.name}</h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                {connector.region.map(r => (
                  <span key={r} className="text-[10px] text-gray-400 uppercase">{r}</span>
                ))}
              </div>
            </div>
          </div>
          {isConnected && (
            <Badge className="bg-emerald-100 text-emerald-700 border-0">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Connecté
            </Badge>
          )}
          {connector.status === 'coming_soon' && (
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              Bientôt
            </Badge>
          )}
          {connector.status === 'beta' && (
            <Badge variant="outline" className="text-blue-600 border-blue-300">
              Bêta
            </Badge>
          )}
        </div>

        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
          {connector.description}
        </p>

        <div className="flex flex-wrap gap-1">
          {connector.categories.map(cat => (
            <Badge key={cat} variant="secondary" className="text-[10px] px-1.5 py-0">
              {categoryLabels[cat] || cat}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Setup Wizard ───────────────────────────────────────────────────

function SetupView({ provider, onBack, onComplete }: {
  provider: ERPConnectorDefinition;
  onBack: () => void;
  onComplete: (conn: ERPConnection) => void;
}) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(`${provider.name} — Mon entreprise`);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const totalSteps = 3;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    const tempConnection = erpConnectorService.createConnection({
      organizationId: 'org-solvid-001',
      provider: provider.id,
      name,
      credentials,
    });

    const result = await erpConnectorService.testConnection(tempConnection);
    setTestResult(result);
    setTesting(false);

    if (result.success) {
      // Create default mapping
      erpConnectorService.createDefaultMapping(tempConnection.id);

      toast.success('Connexion établie !', {
        description: `${provider.name} est maintenant connecté. Un mapping par défaut a été créé.`,
      });

      setTimeout(() => onComplete(tempConnection), 1000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <Button variant="ghost" onClick={onBack} className="text-gray-500">
        ← Retour au catalogue
      </Button>

      {/* Header */}
      <div className="flex items-center gap-4">
        <span className="text-4xl">{provider.logo}</span>
        <div>
          <h2 className="text-xl font-bold text-[#0A3B2E]">
            Connecter {provider.name}
          </h2>
          <p className="text-sm text-gray-500">{provider.description}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        {[1, 2, 3].map(s => (
          <React.Fragment key={s}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              s <= step
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-400'
            }`}>
              {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
            </div>
            {s < totalSteps && (
              <div className={`flex-1 h-0.5 ${s < step ? 'bg-emerald-600' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Nom</span>
        <span>Credentials</span>
        <span>Test</span>
      </div>

      {/* Step 1: Name */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nommer votre connexion</CardTitle>
            <CardDescription>Donnez un nom pour identifier cette connexion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="connName">Nom de la connexion</Label>
              <Input
                id="connName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Pennylane — Solvid"
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={() => setStep(2)} disabled={!name.trim()} className="bg-emerald-600 hover:bg-emerald-700">
              Suivant <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: Credentials */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuration de l'accès</CardTitle>
            <CardDescription>Entrez les informations de connexion à {provider.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {provider.fields.map(field => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key} className="flex items-center gap-2">
                  {field.label}
                  {field.required && <span className="text-red-500 text-xs">*</span>}
                </Label>
                <Input
                  id={field.key}
                  type={field.type === 'password' ? 'password' : 'text'}
                  placeholder={field.placeholder}
                  value={credentials[field.key] || ''}
                  onChange={(e) => setCredentials(prev => ({ ...prev, [field.key]: e.target.value }))}
                />
                {field.helpText && (
                  <p className="text-xs text-gray-400">{field.helpText}</p>
                )}
              </div>
            ))}
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>← Retour</Button>
            <Button
              onClick={() => setStep(3)}
              disabled={provider.fields.some(f => f.required && !credentials[f.key])}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Suivant <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 3: Test & Connect */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tester la connexion</CardTitle>
            <CardDescription>
              Vérification de l'accès à {provider.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Connexion</span>
                <span className="font-medium">{name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">ERP</span>
                <span className="font-medium">{provider.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Données</span>
                <span className="font-medium">{provider.categories.length} catégories</span>
              </div>
            </div>

            {/* Test result */}
            {testResult && (
              <div className={`rounded-lg p-4 flex items-start gap-3 ${
                testResult.success
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div>
                  <p className={`text-sm font-medium ${testResult.success ? 'text-emerald-800' : 'text-red-800'}`}>
                    {testResult.success ? 'Connexion réussie !' : 'Erreur de connexion'}
                  </p>
                  <p className={`text-xs mt-1 ${testResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {testResult.message}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>← Retour</Button>
            <Button
              onClick={handleTest}
              disabled={testing}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {testing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Test en cours...</>
              ) : (
                <><Zap className="h-4 w-4 mr-2" /> Tester et connecter</>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

// ─── Connections List ───────────────────────────────────────────────

function ConnectionsView({ connections, onRefresh, onSync, onMapping, onDelete }: {
  connections: ERPConnection[];
  onRefresh: () => void;
  onSync: (conn: ERPConnection) => void;
  onMapping: (conn: ERPConnection) => void;
  onDelete: (conn: ERPConnection) => void;
}) {
  const [syncing, setSyncing] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  if (connections.length === 0) {
    return (
      <Card className="border-dashed border-2 border-gray-300">
        <CardContent className="py-12 text-center">
          <Plug className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Aucune connexion ERP</h3>
          <p className="text-sm text-gray-400 mb-4">
            Connectez votre premier ERP pour automatiser la collecte de données ESG
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {connections.map(conn => {
        const def = erpConnectorService.getConnectorDef(conn.provider);
        const lastSync = erpConnectorService.getLastSync(conn.id);
        const mappings = erpConnectorService.getMappingsByConnection(conn.id);

        return (
          <Card key={conn.id} className={`transition-all ${
            conn.status === 'connected' ? 'border-emerald-200' : 'border-gray-200'
          }`}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{def?.logo || '🔌'}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{conn.name}</h4>
                      <StatusBadge status={conn.status} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {def?.name} · Créé le {new Date(conn.createdAt).toLocaleDateString('fr-FR')}
                      {lastSync && (
                        <> · Dernière sync : {new Date(lastSync.startedAt).toLocaleDateString('fr-FR')}</>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onMapping(conn)}
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5 mr-1" />
                    Mapping
                    {mappings.length > 0 && (
                      <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">
                        {mappings[0]?.rules.filter(r => r.isActive).length || 0}
                      </Badge>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    disabled={conn.status !== 'connected' || syncing === conn.id}
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      setSyncing(conn.id);
                      onSync(conn);
                    }}
                  >
                    {syncing === conn.id ? (
                      <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Sync...</>
                    ) : (
                      <><RefreshCw className="h-3.5 w-3.5 mr-1" /> Synchroniser</>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setDeleteConfirm(conn.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Sync history mini */}
              {lastSync && lastSync.status === 'success' && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-6 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      {lastSync.stats.totalRecords} enregistrements
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" />
                      {lastSync.stats.indicatorsUpdated} indicateurs mis à jour
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {lastSync.stats.duration ? `${(lastSync.stats.duration / 1000).toFixed(1)}s` : '—'}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Delete confirmation dialog */}
            <Dialog open={deleteConfirm === conn.id} onOpenChange={() => setDeleteConfirm(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Supprimer la connexion ?</DialogTitle>
                  <DialogDescription>
                    La connexion "{conn.name}" et tous ses mappings seront supprimés.
                    Les données déjà importées ne seront pas affectées.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
                  <Button variant="destructive" onClick={() => { onDelete(conn); setDeleteConfirm(null); }}>
                    Supprimer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Mapping Editor ─────────────────────────────────────────────────

function MappingView({ connection, onBack }: {
  connection: ERPConnection;
  onBack: () => void;
}) {
  const [mappings, setMappings] = useState<ERPMapping[]>([]);

  useEffect(() => {
    const m = erpConnectorService.getMappingsByConnection(connection.id);
    setMappings(m);
  }, [connection.id]);

  const currentMapping = mappings[0];

  const toggleRule = (ruleId: string) => {
    if (!currentMapping) return;
    const updated = {
      ...currentMapping,
      rules: currentMapping.rules.map(r =>
        r.id === ruleId ? { ...r, isActive: !r.isActive } : r
      ),
    };
    erpConnectorService.saveMapping(updated);
    setMappings([updated, ...mappings.slice(1)]);
  };

  const categoryColors: Record<string, string> = {
    E: 'bg-emerald-100 text-emerald-700',
    S: 'bg-blue-100 text-blue-700',
    G: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="text-gray-500">
        ← Retour aux connexions
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0A3B2E]">
            Mapping : {connection.name}
          </h2>
          <p className="text-sm text-gray-500">
            Configurez la correspondance entre vos données ERP et les indicateurs ESG
          </p>
        </div>
      </div>

      {/* Legend */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-3">
          <div className="flex items-start gap-2 text-xs text-blue-700">
            <ArrowLeftRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Chaque règle mappe un <strong>compte comptable</strong> (ex: 6061*) vers un <strong>indicateur VSME</strong> (ex: B3.1).
              La transformation convertit les montants en unités ESG (€ → MWh, tCO2e, etc.).
            </span>
          </div>
        </CardContent>
      </Card>

      {currentMapping ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              {currentMapping.name}
              <span className="font-normal text-gray-400 ml-2">
                ({currentMapping.rules.filter(r => r.isActive).length}/{currentMapping.rules.length} règles actives)
              </span>
            </h3>
          </div>

          {/* Rules table */}
          <div className="rounded-lg border overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto_1fr_auto_auto] gap-0 text-xs font-medium text-gray-500 bg-gray-50 px-4 py-2 border-b">
              <span className="w-12">Actif</span>
              <span>Compte ERP</span>
              <span className="w-8 text-center">→</span>
              <span>Indicateur VSME</span>
              <span className="w-20 text-center">Pilier</span>
              <span className="w-24 text-center">Transform.</span>
            </div>

            {currentMapping.rules.map(rule => (
              <div
                key={rule.id}
                className={`grid grid-cols-[auto_1fr_auto_1fr_auto_auto] gap-0 items-center px-4 py-3 border-b last:border-0 ${
                  rule.isActive ? 'bg-white' : 'bg-gray-50 opacity-60'
                }`}
              >
                <div className="w-12">
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={() => toggleRule(rule.id)}
                  />
                </div>
                <div>
                  <span className="font-mono text-sm font-medium text-gray-800">{rule.erpField}</span>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {erpConnectorService.getAccountMappingTemplates()
                      .flatMap(t => t.rules)
                      .find(r => r.accountPattern === rule.erpField)?.accountLabel || '—'}
                  </p>
                </div>
                <div className="w-8 text-center text-gray-300">
                  <ArrowRight className="h-4 w-4 mx-auto" />
                </div>
                <div>
                  <span className="font-mono text-sm font-medium text-emerald-700">{rule.targetCode}</span>
                  <p className="text-[10px] text-gray-500 mt-0.5">{rule.targetName}</p>
                </div>
                <div className="w-20 text-center">
                  <Badge className={`${categoryColors[rule.category] || 'bg-gray-100 text-gray-600'} border-0 text-[10px]`}>
                    {rule.category}
                  </Badge>
                </div>
                <div className="w-24 text-center">
                  <Badge variant="outline" className="text-[10px]">
                    {rule.transformation === 'factor' ? `×${rule.transformParams?.factor}` : rule.transformation}
                  </Badge>
                  <p className="text-[9px] text-gray-400 mt-0.5">{rule.unit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Card className="border-dashed border-2">
          <CardContent className="py-8 text-center">
            <ArrowLeftRight className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Aucun mapping configuré</p>
            <Button
              className="mt-3 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                erpConnectorService.createDefaultMapping(connection.id);
                setMappings(erpConnectorService.getMappingsByConnection(connection.id));
                toast.success('Mapping par défaut créé');
              }}
            >
              Créer un mapping par défaut
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Sync Detail ────────────────────────────────────────────────────

function SyncDetailView({ job, connection, enrichedPreviews, esgPoints, supplierSummary, onBack }: {
  job: SyncJob;
  connection?: ERPConnection;
  enrichedPreviews: EnrichedSyncDataPreview[];
  esgPoints: ESGDataPoint[];
  supplierSummary: SupplierCategorySummary[];
  onBack: () => void;
}) {
  const { dossiers } = useDossiers();
  const [selectedDossierId, setSelectedDossierId] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().getFullYear().toString());
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyResult, setApplyResult] = useState<{ applied: number; skipped: number } | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showSuppliers, setShowSuppliers] = useState(false);

  const activeDossiers = dossiers.filter(d => d.status === 'active' || d.status === 'draft');
  const hasEnriched = enrichedPreviews.length > 0;
  const canApply = job.status === 'success' && (hasEnriched || (job.dataPreview && job.dataPreview.length > 0));

  const handleApplyToVSME = async () => {
    if (!selectedDossierId) return;
    setApplying(true);
    try {
      const result = hasEnriched
        ? await erpConnectorService.applyEnrichedToVSME(selectedDossierId, selectedPeriod, esgPoints)
        : await erpConnectorService.applyToVSME(selectedDossierId, selectedPeriod, job.dataPreview || []);
      setApplyResult(result);
      setApplied(true);
      const dossierName = dossiers.find(d => d.id === selectedDossierId)?.name || 'Dossier';
      toast.success(`${result.applied} indicateurs VSME remplis`, {
        description: `Données appliquées au dossier "${dossierName}" (période ${selectedPeriod})${result.skipped > 0 ? ` · ${result.skipped} ignorés` : ''}`,
      });
    } catch (err) {
      toast.error('Erreur lors de l\'application', {
        description: err instanceof Error ? err.message : 'Erreur inconnue',
      });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="text-gray-500">
        ← Retour aux connexions
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0A3B2E]">
            Résultat de synchronisation
          </h2>
          <p className="text-sm text-gray-500">
            {connection?.name} · {new Date(job.startedAt).toLocaleString('fr-FR')}
          </p>
        </div>
        <SyncStatusBadge status={job.status} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatMini icon={<Database className="h-4 w-4" />} label="Enregistrements" value={String(job.stats.totalRecords)} color="blue" />
        <StatMini icon={<ArrowLeftRight className="h-4 w-4" />} label="Indicateurs" value={String(hasEnriched ? enrichedPreviews.length : job.stats.mappedRecords)} color="purple" />
        <StatMini icon={<BarChart3 className="h-4 w-4" />} label="Fournisseurs" value={String(supplierSummary.length)} color="green" />
        <StatMini icon={<Shield className="h-4 w-4" />} label="Confiance moy." value={hasEnriched ? `${Math.round(enrichedPreviews.reduce((s, p) => s + (p.confidenceScore || 0), 0) / Math.max(enrichedPreviews.length, 1) * 100)}%` : '—'} color="amber" />
      </div>

      {/* Enriched Data preview with confidence badges */}
      {hasEnriched ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Indicateurs ESG extraits
            </CardTitle>
            <CardDescription>
              Données analysées avec niveau de confiance et traçabilité des sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-0 text-xs font-medium text-gray-500 bg-gray-50 px-4 py-2 border-b">
                <span className="w-16">Code</span>
                <span>Indicateur</span>
                <span className="w-28 text-right">Valeur</span>
                <span className="w-36 text-center">Confiance</span>
                <span className="w-24 text-center">Sources</span>
              </div>

              {enrichedPreviews.map((row, i) => {
                const point = esgPoints.find(p => p.vsmeCode === row.targetCode);
                const isExpanded = expandedRow === row.targetCode;
                return (
                  <React.Fragment key={i}>
                    <div
                      className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-0 items-center px-4 py-2.5 border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setExpandedRow(isExpanded ? null : row.targetCode)}
                    >
                      <span className="w-16 font-mono text-xs font-medium text-emerald-700">{row.targetCode}</span>
                      <span className="text-xs text-gray-700">{row.targetName}</span>
                      <span className="w-28 text-right text-xs font-bold text-[#0A3B2E]">
                        {typeof row.transformedValue === 'number' ? row.transformedValue.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) : row.transformedValue}
                        <span className="text-[10px] text-gray-400 ml-1">{row.unit}</span>
                      </span>
                      <div className="w-36 flex justify-center">
                        <ConfidenceBadge level={row.confidence} score={row.confidenceScore} />
                      </div>
                      <div className="w-24 text-center text-[10px] text-gray-500">
                        {row.sourceCount} sources
                        <ChevronRight className={`h-3 w-3 inline ml-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                    {/* Expanded detail */}
                    {isExpanded && point && (
                      <div className="bg-gray-50 px-6 py-3 border-b">
                        <div className="text-[11px] text-gray-600 mb-2">
                          <strong>Méthode :</strong> {point.method}
                        </div>
                        {point.sources && point.sources.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Sources détaillées</div>
                            {point.sources.map((src, j) => (
                              <div key={j} className="text-[11px] text-gray-600 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                                <span className="font-medium">{src.type === 'invoice' ? 'Facture' : src.type === 'account_balance' ? 'Compte' : src.type === 'hr_record' ? 'RH' : src.type}</span>
                                {src.supplierName && <span>— {src.supplierName}</span>}
                                {src.description && <span className="text-gray-400 truncate max-w-[200px]">({src.description})</span>}
                                <span className="ml-auto font-mono whitespace-nowrap">
                                  {src.physicalQuantity
                                    ? `${src.physicalQuantity.toLocaleString('fr-FR')} ${src.physicalUnit || ''}`
                                    : `${src.amount.toLocaleString('fr-FR')} €`
                                  }
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : job.dataPreview && job.dataPreview.length > 0 && (
        /* Fallback: old-style preview */
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Données extraites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              {job.dataPreview.map((row, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b last:border-0 hover:bg-gray-50 text-xs">
                  <span className="font-mono text-gray-600">{row.erpField}</span>
                  <span><ArrowRight className="h-3 w-3 text-gray-300 inline mx-2" /></span>
                  <span className="font-mono text-emerald-700">{row.targetCode}</span>
                  <span className="font-bold text-emerald-700 ml-auto">
                    {typeof row.transformedValue === 'number' ? row.transformedValue.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) : row.transformedValue} {row.unit}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supplier panel */}
      {supplierSummary.length > 0 && (
        <Card>
          <CardHeader className="pb-3 cursor-pointer" onClick={() => setShowSuppliers(!showSuppliers)}>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Fournisseurs classifiés ({supplierSummary.reduce((s, c) => s + c.supplierCount, 0)} fournisseurs · {supplierSummary.length} catégories)
              <ChevronRight className={`h-4 w-4 ml-auto transition-transform ${showSuppliers ? 'rotate-90' : ''}`} />
            </CardTitle>
            <CardDescription>
              Classification automatique des fournisseurs par catégorie ESG
            </CardDescription>
          </CardHeader>
          {showSuppliers && (
            <CardContent>
              <div className="space-y-3">
                {supplierSummary
                  .filter(cat => cat.category !== 'uncategorized')
                  .map((cat, i) => (
                  <div key={i} className="rounded-lg border overflow-hidden">
                    <div className="flex items-center justify-between bg-gray-50 px-4 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Badge className="text-[10px] border-0 bg-emerald-100 text-emerald-700">
                          {ESG_CATEGORY_LABELS[cat.category] || cat.category}
                        </Badge>
                        <span className="text-gray-500">{cat.invoiceCount} factures · {cat.totalAmount.toLocaleString('fr-FR')} €</span>
                      </div>
                      {cat.vsmeTargets.length > 0 && (
                        <span className="text-[10px] text-gray-400">→ {cat.vsmeTargets.join(', ')}</span>
                      )}
                    </div>
                    {cat.suppliers.map((sup, j) => (
                      <div key={j} className="flex items-center justify-between px-4 py-2 border-t hover:bg-gray-50 text-xs">
                        <span className="font-medium text-gray-800">{sup.name}</span>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            sup.confidence >= 0.9 ? 'bg-emerald-100 text-emerald-700' :
                            sup.confidence >= 0.7 ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {Math.round(sup.confidence * 100)}%
                          </span>
                          <span className="text-gray-600 font-medium">{sup.amount.toLocaleString('fr-FR')} €</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Confidence legend */}
      {hasEnriched && (
        <div className="flex items-center gap-4 text-[10px] text-gray-500 px-2">
          <span className="font-medium">Légende confiance :</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Mesure directe</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Fournisseur classifié</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Estimation comptable</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> Proxy monétaire</span>
        </div>
      )}

      {/* Errors */}
      {job.errors.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              Avertissements ({job.errors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {job.errors.map((err, i) => (
                <li key={i} className="text-xs text-amber-700 flex items-start gap-2">
                  <CircleDot className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span><strong>{err.field}</strong> : {err.message}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Apply to dossier */}
      {canApply && (
        <Card className={applied ? 'border-emerald-200 bg-emerald-50' : 'border-blue-200 bg-blue-50'}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {applied ? (
                <><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Données appliquées</>
              ) : (
                <><Send className="h-4 w-4 text-blue-600" /> Appliquer au dossier VSME</>
              )}
            </CardTitle>
            <CardDescription>
              {applied
                ? `${applyResult?.applied} indicateurs remplis dans le référentiel VSME`
                : `Écrire les ${hasEnriched ? enrichedPreviews.length : (job.dataPreview?.filter(p => p.status === 'mapped').length || 0)} indicateurs dans un dossier pour remplir automatiquement le référentiel`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!applied ? (
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                    <FolderOpen className="h-3 w-3 inline mr-1" />
                    Dossier cible
                  </Label>
                  <select
                    value={selectedDossierId}
                    onChange={(e) => setSelectedDossierId(e.target.value)}
                    className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Sélectionner un dossier…</option>
                    {activeDossiers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} — {d.clientOrg} ({d.fiscalYear})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Période</Label>
                  <Input
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    placeholder="2025"
                    className="h-9"
                  />
                </div>
                <Button
                  onClick={handleApplyToVSME}
                  disabled={!selectedDossierId || applying}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-9"
                >
                  {applying ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Application…</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" /> Appliquer</>
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="text-sm text-emerald-700">
                  <strong>{applyResult?.applied}</strong> indicateurs remplis
                  {applyResult?.skipped ? <> · <span className="text-gray-500">{applyResult.skipped} ignorés</span></> : null}
                  <span className="text-gray-500"> · Période {selectedPeriod}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setApplied(false);
                    setApplyResult(null);
                  }}
                  className="text-emerald-700 border-emerald-300"
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Réappliquer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Confidence Badge ────────────────────────────────────────────────

function ConfidenceBadge({ level, score }: { level?: DataConfidenceLevel; score: number }) {
  const configs: Record<string, { label: string; color: string; dot: string }> = {
    direct_measurement: { label: 'Mesure directe', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
    supplier_classified: { label: 'Fournisseur classifié', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
    account_estimated: { label: 'Estimation comptable', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
    monetary_proxy: { label: 'Proxy monétaire', color: 'bg-red-100 text-red-600', dot: 'bg-red-400' },
  };
  const config = configs[level || 'account_estimated'] || configs.account_estimated;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
      <span className="opacity-60 ml-0.5">{Math.round(score * 100)}%</span>
    </span>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; className: string }> = {
    connected: { label: 'Connecté', className: 'bg-emerald-100 text-emerald-700' },
    disconnected: { label: 'Déconnecté', className: 'bg-gray-100 text-gray-600' },
    connecting: { label: 'Connexion...', className: 'bg-blue-100 text-blue-700' },
    error: { label: 'Erreur', className: 'bg-red-100 text-red-700' },
    expired: { label: 'Expiré', className: 'bg-amber-100 text-amber-700' },
  };
  const config = configs[status] || configs.disconnected;
  return <Badge className={`${config.className} border-0 text-[10px]`}>{config.label}</Badge>;
}

function SyncStatusBadge({ status }: { status: SyncStatus }) {
  const configs: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    idle: { label: 'En attente', className: 'bg-gray-100 text-gray-600', icon: <Clock className="h-3 w-3" /> },
    syncing: { label: 'En cours', className: 'bg-blue-100 text-blue-700', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    success: { label: 'Succès', className: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="h-3 w-3" /> },
    partial: { label: 'Partiel', className: 'bg-amber-100 text-amber-700', icon: <AlertTriangle className="h-3 w-3" /> },
    error: { label: 'Erreur', className: 'bg-red-100 text-red-700', icon: <XCircle className="h-3 w-3" /> },
  };
  const config = configs[status] || configs.idle;
  return (
    <Badge className={`${config.className} border-0 flex items-center gap-1`}>
      {config.icon} {config.label}
    </Badge>
  );
}

function StatMini({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    purple: 'bg-purple-50 text-purple-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className={`rounded-lg p-3 ${colorMap[color] || colorMap.blue}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <span className="text-xl font-bold">{value}</span>
    </div>
  );
}

// ─── Sync handler ───────────────────────────────────────────────────

async function handleEnrichedSync(
  connection: ERPConnection,
  refreshConnections: () => void,
  onComplete: (result: {
    job: SyncJob;
    enrichedPreviews: EnrichedSyncDataPreview[];
    esgPoints: ESGDataPoint[];
    supplierSummary: SupplierCategorySummary[];
  }) => void,
) {
  try {
    const result = await erpConnectorService.runEnrichedSync(connection.id);
    refreshConnections();

    if (result.job.status === 'success') {
      const directCount = result.esgPoints.filter(p => p.confidence?.level === 'direct_measurement').length;
      toast.success('Synchronisation enrichie terminée !', {
        description: `${result.esgPoints.length} indicateurs · ${result.supplierSummary.length} fournisseurs classifiés · ${directCount} mesures directes`,
      });
    }

    onComplete(result);
  } catch (error: any) {
    toast.error('Erreur de synchronisation', {
      description: error?.message || 'Une erreur est survenue',
    });
  }
}
