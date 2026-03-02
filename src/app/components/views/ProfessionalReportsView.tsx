import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Checkbox } from '@/app/components/ui/checkbox';
import {
  FileText,
  Download,
  FileCheck,
  Shield,
  TrendingUp,
  CheckCircle,
  Package,
  Calendar,
  User,
  Settings,
  Sparkles,
} from 'lucide-react';
import { dataProvider } from '@/services/dataProvider';
import { generateProfessionalReport, generateAuditPreparationReport } from '@/utils/professionalReports';
import { toast } from 'sonner';

interface Pack {
  id: string;
  name: string;
  templateCode: string;
  templateName: string;
  completionScore: number;
  owner: string;
  createdAt: string;
}

export function ProfessionalReportsView() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [selectedPackId, setSelectedPackId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Report options
  const [reportType, setReportType] = useState<'standard' | 'audit' | 'executive'>('standard');
  const [organizationName, setOrganizationName] = useState('Solvid.IA');
  const [includeExecutiveSummary, setIncludeExecutiveSummary] = useState(true);
  const [includeEvidence, setIncludeEvidence] = useState(true);
  const [includeAuditTrail, setIncludeAuditTrail] = useState(false);

  useEffect(() => {
    loadPacks();
  }, []);

  async function loadPacks() {
    setLoading(true);
    try {
      const packInstances = await dataProvider.store.list('pack_instances');
      setPacks(packInstances);
      
      if (packInstances.length > 0 && !selectedPackId) {
        setSelectedPackId(packInstances[0].id);
      }
    } catch (error) {
      console.error('Failed to load packs:', error);
      toast.error('Erreur lors du chargement des packs');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateReport() {
    if (!selectedPackId) {
      toast.error('Veuillez sélectionner un pack');
      return;
    }

    setGenerating(true);
    try {
      // Load pack data
      const pack = await dataProvider.store.read('pack_instances', selectedPackId); // 🔧 Fixed: use read instead of get
      
      if (!pack) {
        throw new Error('Pack not found');
      }

      // Load checklist items
      const checklistItems = await dataProvider.store.listByIndex(
        'checklist_items',
        'packId',
        selectedPackId
      );

      // Load KPI requirements (if available)
      let kpiRequirements: any[] = [];
      try {
        kpiRequirements = await dataProvider.store.listByIndex(
          'kpi_requirements',
          'packId',
          selectedPackId
        );
      } catch (error) {
        console.warn('No KPI requirements found for pack:', selectedPackId);
      }

      // Load evidence
      const evidence = await dataProvider.store.listByIndex(
        'evidence',
        'packId',
        selectedPackId
      );

      // Prepare pack data with all details
      const fullPack = {
        ...pack,
        checklistItems,
        kpiRequirements,
        evidences: evidence,
        owner: pack.ownerId || 'N/A',
      };

      // Generate report based on type
      if (reportType === 'audit') {
        await generateAuditPreparationReport(fullPack, organizationName);
      } else {
        await generateProfessionalReport(fullPack, {
          organizationName,
          includeExecutiveSummary,
          includeEvidence,
          includeAuditTrail,
          reportType,
        });
      }

      toast.success('Rapport généré avec succès', {
        description: 'Le fichier PDF a été téléchargé',
      });
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error('Erreur lors de la génération du rapport', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setGenerating(false);
    }
  }

  const selectedPack = packs.find(p => p.id === selectedPackId);

  const reportTemplates = [
    {
      type: 'standard' as const,
      icon: FileText,
      title: 'Rapport Standard',
      description: 'Rapport complet avec tous les détails ESG',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      features: ['Résumé exécutif', 'Items checklist', 'Indicateurs KPI', 'Documents preuves'],
    },
    {
      type: 'executive' as const,
      icon: TrendingUp,
      title: 'Rapport Exécutif',
      description: 'Vue synthétique pour la direction',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      features: ['KPIs clés', 'Graphiques', 'Recommandations', 'Vue d\'ensemble'],
    },
    {
      type: 'audit' as const,
      icon: Shield,
      title: 'Préparation Audit',
      description: 'Checklist de conformité pour audit externe',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      features: ['Conformité', 'Points d\'attention', 'Documents requis', 'Recommandations'],
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rapports Professionnels</h1>
        <p className="text-muted-foreground mt-1">
          Générez des rapports ESG audit-ready au format PDF
        </p>
      </div>

      {/* Report templates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportTemplates.map(template => {
          const Icon = template.icon;
          const isSelected = reportType === template.type;
          
          return (
            <Card
              key={template.type}
              className={`cursor-pointer transition-all ${
                isSelected 
                  ? 'ring-2 ring-primary shadow-lg' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => setReportType(template.type)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-lg ${template.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${template.color}`} />
                  </div>
                  {isSelected && (
                    <Badge variant="default">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Sélectionné
                    </Badge>
                  )}
                </div>
                <CardTitle className="mt-4">{template.title}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {template.features.map(feature => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuration du Rapport
          </CardTitle>
          <CardDescription>
            Sélectionnez le pack et personnalisez les options du rapport
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pack selection */}
          <div className="space-y-2">
            <Label htmlFor="pack-select">Pack à exporter</Label>
            <Select value={selectedPackId} onValueChange={setSelectedPackId}>
              <SelectTrigger id="pack-select">
                <SelectValue placeholder="Sélectionner un pack" />
              </SelectTrigger>
              <SelectContent>
                {packs.map(pack => (
                  <SelectItem key={pack.id} value={pack.id}>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      <span>{pack.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {pack.completionScore}%
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedPack && (
              <div className="mt-3 p-3 bg-muted rounded-md text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Responsable:</span>
                  <span className="font-medium">{selectedPack.owner}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Créé le:</span>
                  <span className="font-medium">
                    {new Date(selectedPack.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Template:</span>
                  <span className="font-medium">{selectedPack.templateName}</span>
                </div>
              </div>
            )}
          </div>

          {/* Organization name */}
          <div className="space-y-2">
            <Label htmlFor="org-name">Nom de l'organisation</Label>
            <Input
              id="org-name"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="Solvid.IA"
            />
          </div>

          {/* Report options */}
          {reportType !== 'audit' && (
            <div className="space-y-3">
              <Label>Options du rapport</Label>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="executive-summary"
                    checked={includeExecutiveSummary}
                    onCheckedChange={(checked) => setIncludeExecutiveSummary(checked as boolean)}
                  />
                  <label
                    htmlFor="executive-summary"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Inclure le résumé exécutif
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="evidence"
                    checked={includeEvidence}
                    onCheckedChange={(checked) => setIncludeEvidence(checked as boolean)}
                  />
                  <label
                    htmlFor="evidence"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Inclure la liste des preuves
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="audit-trail"
                    checked={includeAuditTrail}
                    onCheckedChange={(checked) => setIncludeAuditTrail(checked as boolean)}
                  />
                  <label
                    htmlFor="audit-trail"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Inclure l'audit trail
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Pro
                    </Badge>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Generate button */}
          <div className="pt-4">
            <Button
              onClick={handleGenerateReport}
              disabled={!selectedPackId || generating || loading}
              className="w-full"
              size="lg"
            >
              {generating ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Génération en cours...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Générer le Rapport PDF
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-blue-900">
                Rapports Audit-Ready
              </p>
              <p className="text-sm text-blue-700">
                Nos rapports sont formatés selon les standards d'audit et incluent toutes les 
                informations nécessaires pour la traçabilité et la conformité. Parfait pour 
                les auditeurs externes, investisseurs, et revues de conformité ESG.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}