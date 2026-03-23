// ============================================================================
// PROFESSIONAL REPORTS VIEW — Rapports PDF professionnels ESG
// ============================================================================
// Charge les dossiers depuis solvid-ia-db (idbService) et les données VSME
// pour générer des rapports Standard, Exécutif ou Audit via jsPDF natif.

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
  Shield,
  TrendingUp,
  CheckCircle,
  FolderOpen,
  Calendar,
  User,
  Settings,
  Sparkles,
} from 'lucide-react';
import { dataProvider, type Organization } from '@/services/dataProvider';
import { idbGetDossiers, idbGetValuesByDossier, type VSMEValue } from '@/services/idbService';
import { MODULE_B } from '@/data/vsme-data';
import type { Dossier } from '@/contexts/DossierContext';
import {
  generateStandardReport,
  generateExecutiveReport,
  generateAuditReport,
} from '@/utils/professionalReports';
import type { ReportPackData, ReportOptions, ReportChecklistItem, ReportKPIRequirement, BrandConfig, VSMESectionData } from '@/utils/reportTypes';
import type { ESGCategory } from '@/utils/reportTypes';
import { sanitizeFileName } from '@/utils/reportHelpers';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Build metadata map from MODULE_B referential */
function buildVSMEMetaMap(): Record<string, { name: string; pillar: ESGCategory; unit?: string; obligatoire: boolean; section: string }> {
  const meta: Record<string, { name: string; pillar: ESGCategory; unit?: string; obligatoire: boolean; section: string }> = {};
  for (const section of MODULE_B) {
    for (const dp of section.datapoints) {
      const pillar: ESGCategory = dp.pilier === 'Général' ? 'G' : dp.pilier as ESGCategory;
      meta[dp.code] = {
        name: dp.intitule,
        pillar,
        unit: dp.unite,
        obligatoire: dp.obligatoire,
        section: section.titre,
      };
    }
  }
  return meta;
}

/** Compute completion score from VSME values */
function computeCompletionScore(values: VSMEValue[], totalDatapoints: number): number {
  if (totalDatapoints === 0) return 0;
  const filled = values.filter(v => v.rawValue && v.rawValue.trim() !== '' && v.statut === 'filled').length;
  return Math.round((filled / totalDatapoints) * 100);
}

// ─── Component ──────────────────────────────────────────────────────────────

interface ProfessionalReportsViewProps {
  dossierId?: string; // passed from ExportsLivrables
}

export function ProfessionalReportsView({ dossierId }: ProfessionalReportsViewProps) {
  const user = useUser();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [selectedDossierId, setSelectedDossierId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Report options
  const [reportType, setReportType] = useState<'standard' | 'audit' | 'executive'>('standard');
  const [organizationName, setOrganizationName] = useState('Solvid.IA');
  const [includeExecutiveSummary, setIncludeExecutiveSummary] = useState(true);
  const [includeEvidence, setIncludeEvidence] = useState(true);
  const [includeAuditTrail, setIncludeAuditTrail] = useState(false);

  // Brand config loaded from Organization
  const [brandConfig, setBrandConfig] = useState<BrandConfig | undefined>(undefined);

  // VSME metadata (built once)
  const [vsmeMeta] = useState(() => buildVSMEMetaMap());
  const totalDatapoints = MODULE_B.reduce((n, s) => n + s.datapoints.length, 0);

  useEffect(() => {
    loadDossiers();
    loadBranding();
  }, []);

  // If dossierId prop is provided, auto-select it
  useEffect(() => {
    if (dossierId && dossiers.length > 0) {
      setSelectedDossierId(dossierId);
    }
  }, [dossierId, dossiers]);

  async function loadDossiers() {
    setLoading(true);
    try {
      const allDossiers = await idbGetDossiers();
      setDossiers(allDossiers);

      // Auto-select: prefer prop dossierId, else first dossier
      if (dossierId && allDossiers.some(d => d.id === dossierId)) {
        setSelectedDossierId(dossierId);
      } else if (allDossiers.length > 0 && !selectedDossierId) {
        setSelectedDossierId(allDossiers[0].id);
      }
    } catch (error) {
      console.error('Failed to load dossiers:', error);
      toast.error('Erreur lors du chargement des dossiers');
    } finally {
      setLoading(false);
    }
  }

  async function loadBranding() {
    try {
      const orgId = user.currentUser?.organizationId;
      if (!orgId) return;
      const org = await dataProvider.store.read<Organization>('organizations', orgId);
      if (org) {
        const orgName = org.name || user.currentUser?.organizationName || 'Solvid.IA';
        setOrganizationName(orgName);
        setBrandConfig({
          organizationName: orgName,
          logoBase64: org.brandLogoBase64 || null,
          primaryColor: org.brandPrimaryColor || '#059669',
          secondaryColor: org.brandSecondaryColor || '#0A3B2E',
        });
      }
    } catch {
      // Brand fields are optional — use defaults
    }
  }

  async function handleGenerateReport() {
    if (!selectedDossierId) {
      toast.error('Veuillez sélectionner un dossier');
      return;
    }

    setGenerating(true);
    try {
      const dossier = dossiers.find(d => d.id === selectedDossierId);
      if (!dossier) throw new Error('Dossier introuvable');

      // Load VSME values for selected dossier
      const vsmeValues = await idbGetValuesByDossier(selectedDossierId);
      const filledValues = vsmeValues.filter(v => v.rawValue && v.rawValue.trim() !== '' && v.statut === 'filled');
      const completionScore = computeCompletionScore(vsmeValues, totalDatapoints);

      // Build ReportPackData from dossier + VSME values
      const reportData: ReportPackData = {
        pack: {
          id: dossier.id,
          name: dossier.name,
          templateCode: dossier.referentielId || 'VSME',
          templateName: dossier.referentielId === 'bilan-carbone' ? 'Bilan Carbone®' : 'VSME PME',
          status: dossier.status === 'completed' ? 'READY_FOR_REVIEW' : 'IN_PROGRESS',
          completionScore,
          owner: dossier.leadConsultant || 'N/A',
          createdAt: dossier.createdAt,
          updatedAt: new Date().toISOString(),
          fiscalYear: dossier.fiscalYear || new Date().getFullYear().toString(),
          clientOrg: dossier.clientOrg || '',
        },
        // Map ALL MODULE_B datapoints as checklist items (to show what's filled vs missing)
        checklistItems: MODULE_B.flatMap(section =>
          section.datapoints.map((dp): ReportChecklistItem => {
            const val = vsmeValues.find(v => v.code === dp.code);
            const isFilled = val && val.rawValue && val.rawValue.trim() !== '' && val.statut === 'filled';
            const pillar: ESGCategory = dp.pilier === 'Général' ? 'G' : dp.pilier as ESGCategory;
            return {
              id: dp.code,
              code: dp.code,
              label: dp.intitule,
              category: pillar,
              requirementLevel: dp.obligatoire ? 'MANDATORY' : 'RECOMMENDED',
              status: isFilled ? 'PROVIDED' : 'MISSING',
              description: `Section: ${section.titre}`,
              comment: isFilled ? `Valeur: ${val!.rawValue}${dp.unite ? ' ' + dp.unite : ''}` : undefined,
            };
          })
        ),
        // Map filled VSME values as KPI requirements
        kpiRequirements: filledValues.map((v): ReportKPIRequirement => {
          const m = vsmeMeta[v.code];
          return {
            id: v.id,
            code: v.code,
            name: m?.name ?? v.code,
            unit: m?.unit ?? '',
            category: m?.pillar ?? 'G',
            status: 'provided',
            value: isNaN(parseFloat(v.rawValue)) ? undefined : parseFloat(v.rawValue),
            period: v.period || '2025',
            hasEvidence: false,
            evidenceCount: 0,
          };
        }),
        evidences: [], // No evidence in solvid-ia-db (separate future feature)
        // Structured VSME section data for detailed narrative reports
        vsmeSections: MODULE_B.map((section): VSMESectionData => {
          const pillar: ESGCategory = section.pilier === 'Général' ? 'G' : section.pilier as ESGCategory;
          return {
            sectionId: section.id,
            sectionTitle: section.titre,
            pillar,
            datapoints: section.datapoints.map(dp => {
              const val = vsmeValues.find(v => v.code === dp.code);
              const isFilled = val && val.rawValue && val.rawValue.trim() !== '' && val.statut === 'filled';
              return {
                code: dp.code,
                label: dp.intitule,
                type: dp.type,
                unit: dp.unite,
                obligatoire: dp.obligatoire,
                esrsEquivalent: dp.esrs_equivalent,
                value: isFilled ? val!.rawValue : undefined,
                status: isFilled ? 'filled' as const : 'missing' as const,
              };
            }),
          };
        }),
      };

      // Build BrandConfig
      const currentBrandConfig: BrandConfig = brandConfig || {
        organizationName,
        logoBase64: null,
        primaryColor: '#059669',
        secondaryColor: '#0A3B2E',
      };
      currentBrandConfig.organizationName = organizationName;

      const options: ReportOptions = {
        reportType,
        includeExecutiveSummary,
        includeEvidence,
        includeAuditTrail,
        brandConfig: currentBrandConfig,
      };

      // Generate the report
      let blob: Blob;
      if (reportType === 'audit') {
        blob = await generateAuditReport(reportData, options);
      } else if (reportType === 'executive') {
        blob = await generateExecutiveReport(reportData, options);
      } else {
        blob = await generateStandardReport(reportData, options);
      }

      // Download the PDF
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitizeFileName(dossier.name)}_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

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

  const selectedDossier = dossiers.find(d => d.id === selectedDossierId);

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
            Sélectionnez le dossier et personnalisez les options du rapport
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dossier selection */}
          <div className="space-y-2">
            <Label htmlFor="dossier-select">Dossier à exporter</Label>
            <Select value={selectedDossierId} onValueChange={setSelectedDossierId}>
              <SelectTrigger id="dossier-select">
                <SelectValue placeholder={loading ? "Chargement..." : "Sélectionner un dossier"} />
              </SelectTrigger>
              <SelectContent>
                {dossiers.map(dossier => (
                  <SelectItem key={dossier.id} value={dossier.id}>
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      <span>{dossier.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {dossier.status === 'completed' ? '✓' : dossier.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedDossier && (
              <div className="mt-3 p-3 bg-muted rounded-md text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Consultant:</span>
                  <span className="font-medium">{selectedDossier.leadConsultant || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Exercice:</span>
                  <span className="font-medium">{selectedDossier.fiscalYear}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Client:</span>
                  <span className="font-medium">{selectedDossier.clientOrg}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Parcours:</span>
                  <span className="font-medium">
                    {selectedDossier.pathwayType === 'CSRD_Mandatory' ? 'CSRD Obligatoire' : 'ESG Volontaire'}
                  </span>
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
              disabled={!selectedDossierId || generating || loading}
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
                Rapports prêts pour vérification
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
