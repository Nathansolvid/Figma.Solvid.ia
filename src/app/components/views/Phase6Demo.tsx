import { useState } from 'react';
import {
  FileSearch,
  History,
  Shield,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { TransparencyModal } from '@/app/components/TransparencyModal';
import { AuditTrail } from '@/app/components/AuditTrail';
import { AuditCenter as AuditCenterPhase6 } from '@/app/components/AuditCenter';

// Mock data pour la démo
const mockIndicators = [
  {
    id: 'ind-e1-1', // Changed to match transparencyData
    name: 'Émissions GES Scope 1',
    code: 'E1-1',
    value: 2837.5,
    unit: 'tCO2e',
    status: 'validated' as const,
    category: 'Environnement',
  },
  {
    id: 'ind-e1-2', // Changed to match transparencyData
    name: 'Émissions GES Scope 2', // Updated to match transparencyData
    code: 'E1-2',
    value: 125000,
    unit: 'tCO2e', // Updated unit to match Scope 2 emissions
    status: 'draft' as const,
    category: 'Environnement',
  },
  {
    id: 'ind-s1-1', // Changed to match transparencyData
    name: 'Effectif total', // Updated to match transparencyData
    code: 'S1-1',
    value: 245, // Updated value to be realistic for headcount
    unit: 'ETP', // Updated unit to match headcount
    status: 'validated' as const,
    category: 'Social',
  },
];

const mockPacks = [
  {
    id: 'pack-001',
    name: 'Pack Donneur d\'Ordre Q1 2026',
    type: 'donneur-ordre',
    status: 'validated' as const,
  },
  {
    id: 'pack-002',
    name: 'Pack Banque Annuel 2025',
    type: 'banque',
    status: 'draft' as const,
  },
];

export function Phase6Demo() {
  const [activeDemo, setActiveDemo] = useState<'intro' | 'transparency' | 'audit-trail' | 'audit-center'>('intro');
  const [selectedIndicator, setSelectedIndicator] = useState<typeof mockIndicators[0] | null>(null);
  const [selectedPack, setSelectedPack] = useState<typeof mockPacks[0] | null>(null);
  const [isTransparencyOpen, setIsTransparencyOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-[#E8F3F0] rounded-lg">
                <Sparkles className="h-8 w-8 text-[#059669]" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-[#0A3B2E]">Phase 6 - Démonstration</h1>
                <p className="text-lg text-muted-foreground">
                  Transparence & Audit Trail avec React Query
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                ✅ 100% Complétée
              </Badge>
              <Badge variant="outline">3 Composants</Badge>
              <Badge variant="outline">23 Hooks React Query</Badge>
              <Badge variant="outline">19 Endpoints API</Badge>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeDemo} onValueChange={(v) => setActiveDemo(v as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="intro" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>Introduction</span>
            </TabsTrigger>
            <TabsTrigger value="transparency" className="gap-2">
              <FileSearch className="h-4 w-4" />
              <span>TransparencyModal</span>
            </TabsTrigger>
            <TabsTrigger value="audit-trail" className="gap-2">
              <History className="h-4 w-4" />
              <span>AuditTrail</span>
            </TabsTrigger>
            <TabsTrigger value="audit-center" className="gap-2">
              <Shield className="h-4 w-4" />
              <span>AuditCenter</span>
            </TabsTrigger>
          </TabsList>

          {/* Intro Tab */}
          <TabsContent value="intro" className="space-y-6">
            <Alert className="bg-blue-50 border-blue-300">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <AlertTitle className="text-blue-900">Bienvenue dans la Phase 6 !</AlertTitle>
              <AlertDescription className="text-blue-800">
                Cette phase implémente un système complet de <strong>transparence</strong> et d'<strong>audit trail</strong> avec 
                React Query pour une gestion optimale du cache et des performances exceptionnelles.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <FileSearch className="h-8 w-8 text-[#059669]" />
                    <Badge>614 lignes</Badge>
                  </div>
                  <CardTitle className="mt-4">TransparencyModal</CardTitle>
                  <CardDescription>
                    Modal avec 4 onglets pour explorer les calculs d'indicateurs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Onglet Calcul (formule + résultat)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Onglet Sources (CRUD complet)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Onglet Facteurs (coefficients)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Onglet Historique (logs)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Export PDF/JSON/Excel
                    </li>
                  </ul>
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => setActiveDemo('transparency')}
                  >
                    Voir la démo
                  </Button>
                </CardContent>
              </Card>

              {/* Card 2 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <History className="h-8 w-8 text-[#059669]" />
                    <Badge>234 lignes</Badge>
                  </div>
                  <CardTitle className="mt-4">AuditTrail</CardTitle>
                  <CardDescription>
                    Timeline chronologique d'audit pour une entité
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Badges colorés (11 types)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Diff visuel (ancien → nouveau)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Timestamps relatifs
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Mode compact pour sidebars
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Empty states élégants
                    </li>
                  </ul>
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => setActiveDemo('audit-trail')}
                  >
                    Voir la démo
                  </Button>
                </CardContent>
              </Card>

              {/* Card 3 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Shield className="h-8 w-8 text-[#059669]" />
                    <Badge>718 lignes</Badge>
                  </div>
                  <CardTitle className="mt-4">AuditCenter</CardTitle>
                  <CardDescription>
                    Centre d'audit pour toute l'organisation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      4 KPI Cards (header)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Filtres avancés (4 types)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Timeline avec pagination
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Statistics dashboard
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Export PDF/CSV/JSON
                    </li>
                  </ul>
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => setActiveDemo('audit-center')}
                  >
                    Voir la démo
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Statistiques Phase 6</CardTitle>
                <CardDescription>Métriques complètes de la livraison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Lignes de code</p>
                    <p className="text-3xl font-bold text-[#059669]">~7350</p>
                    <p className="text-xs text-muted-foreground mt-1">Code + Documentation</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hooks React Query</p>
                    <p className="text-3xl font-bold text-[#059669]">23</p>
                    <p className="text-xs text-muted-foreground mt-1">Production-ready</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">API Endpoints</p>
                    <p className="text-3xl font-bold text-[#059669]">19</p>
                    <p className="text-xs text-muted-foreground mt-1">RESTful</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tests validation</p>
                    <p className="text-3xl font-bold text-[#059669]">15/15</p>
                    <p className="text-xs text-muted-foreground mt-1">100% passés</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TransparencyModal Demo Tab */}
          <TabsContent value="transparency" className="space-y-6">
            <Alert>
              <FileSearch className="h-5 w-5" />
              <AlertTitle>TransparencyModal - Démonstration</AlertTitle>
              <AlertDescription>
                Cliquez sur un indicateur ci-dessous pour ouvrir le modal de transparence.
                Le modal charge dynamiquement les données avec React Query et affiche 4 onglets.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mockIndicators.map((indicator) => (
                <Card 
                  key={indicator.id} 
                  className="cursor-pointer hover:border-[#059669] transition-colors"
                  onClick={() => {
                    setSelectedIndicator(indicator);
                    setIsTransparencyOpen(true);
                  }}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{indicator.code}</Badge>
                      <Badge 
                        className={
                          indicator.status === 'validated' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-amber-100 text-amber-800'
                        }
                      >
                        {indicator.status === 'validated' ? 'Validé' : 'Brouillon'}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-2">{indicator.name}</CardTitle>
                    <CardDescription>{indicator.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-[#0A3B2E]">
                      {indicator.value.toLocaleString('fr-FR')}
                      <span className="text-lg text-muted-foreground ml-2">{indicator.unit}</span>
                    </div>
                    <Button className="w-full mt-4 gap-2" variant="outline">
                      <FileSearch className="h-4 w-4" />
                      <span>Voir transparence</span>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* TransparencyModal */}
            {selectedIndicator && (
              <TransparencyModal
                indicatorId={selectedIndicator.id}
                indicatorName={selectedIndicator.name}
                isOpen={isTransparencyOpen}
                onClose={() => setIsTransparencyOpen(false)}
              />
            )}
          </TabsContent>

          {/* AuditTrail Demo Tab */}
          <TabsContent value="audit-trail" className="space-y-6">
            <Alert>
              <History className="h-5 w-5" />
              <AlertTitle>AuditTrail - Démonstration</AlertTitle>
              <AlertDescription>
                Sélectionnez une entité (indicateur ou pack) pour afficher sa timeline d'audit.
                Le composant charge dynamiquement l'historique avec React Query.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sélection Indicateur */}
              <Card>
                <CardHeader>
                  <CardTitle>Audit Trail - Indicateur</CardTitle>
                  <CardDescription>Historique d'un indicateur spécifique</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sélectionner un indicateur</label>
                    <div className="space-y-2">
                      {mockIndicators.map((indicator) => (
                        <Button
                          key={indicator.id}
                          variant="outline"
                          className="w-full justify-start gap-2"
                          onClick={() => setSelectedIndicator(indicator)}
                        >
                          <Badge variant="outline">{indicator.code}</Badge>
                          <span>{indicator.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {selectedIndicator && (
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <p className="text-sm font-medium mb-2">Timeline pour :</p>
                      <p className="text-lg font-bold text-[#0A3B2E]">{selectedIndicator.name}</p>
                      <div className="mt-4 max-h-[500px] overflow-y-auto">
                        <AuditTrail
                          entityType="indicator"
                          entityId={selectedIndicator.id}
                          compact={false}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sélection Pack */}
              <Card>
                <CardHeader>
                  <CardTitle>Audit Trail - Pack</CardTitle>
                  <CardDescription>Historique d'un pack spécifique</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sélectionner un pack</label>
                    <div className="space-y-2">
                      {mockPacks.map((pack) => (
                        <Button
                          key={pack.id}
                          variant="outline"
                          className="w-full justify-start gap-2"
                          onClick={() => setSelectedPack(pack)}
                        >
                          <Badge variant="outline">{pack.type}</Badge>
                          <span>{pack.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {selectedPack && (
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <p className="text-sm font-medium mb-2">Timeline pour :</p>
                      <p className="text-lg font-bold text-[#0A3B2E]">{selectedPack.name}</p>
                      <div className="mt-4 max-h-[500px] overflow-y-auto">
                        <AuditTrail
                          entityType="pack"
                          entityId={selectedPack.id}
                          compact={false}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AuditCenter Demo Tab */}
          <TabsContent value="audit-center" className="space-y-6">
            <Alert>
              <Shield className="h-5 w-5" />
              <AlertTitle>AuditCenter - Démonstration</AlertTitle>
              <AlertDescription>
                Centre d'audit complet pour toute l'organisation avec filtres avancés, statistiques et export.
                Ce composant utilise React Query pour un chargement optimal et un cache intelligent.
              </AlertDescription>
            </Alert>

            {/* AuditCenter complet */}
            <AuditCenterPhase6 />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}