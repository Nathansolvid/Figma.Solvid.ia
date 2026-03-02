import { useState, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/app/components/ui/sheet';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { Separator } from '@/app/components/ui/separator';
import {
  Info,
  Download,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  FileText,
  Calendar,
  User,
  Shield,
  TrendingUp,
  Calculator,
  Database,
  History,
  AlertCircle,
} from 'lucide-react';
import type { CalculationSummary, CalculationWarning } from '@/types/transparency';
import {
  indicators,
  calculationProfiles,
  calculationInputs,
  calculationFactors,
  calculationLogs,
} from '@/data/transparencyData';

interface CalculationTransparencyProps {
  indicatorCode: string;
  displayedValue?: number | string;
  posture?: 'conseil' | 'pre-audit' | 'audit-externe';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
}

export function CalculationTransparency({
  indicatorCode,
  displayedValue,
  posture = 'conseil',
  size = 'sm',
  variant = 'icon',
}: CalculationTransparencyProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Charger les données de l'indicateur
  const calculationSummary = useMemo<CalculationSummary | null>(() => {
    const indicator = indicators.find((i) => i.code === indicatorCode);
    if (!indicator) return null;

    const profile = calculationProfiles.find((p) => p.id === indicator.transparency_profile_id);
    if (!profile) return null;

    const inputs = calculationInputs.filter((i) => i.calculation_profile_id === profile.id);
    const factors = calculationFactors.filter((f) => f.calculation_profile_id === profile.id);
    const logs = calculationLogs.filter((l) => l.calculation_profile_id === profile.id);

    // Générer les warnings
    const warnings: CalculationWarning[] = [];

    // Check missing evidence
    const inputsWithoutEvidence = inputs.filter((i) => !i.evidence_link);
    if (inputsWithoutEvidence.length > 0) {
      warnings.push({
        type: 'missing_evidence',
        severity: 'warning',
        message: `${inputsWithoutEvidence.length} donnée(s) source sans preuve jointe`,
        recommendation: 'Ajoutez les documents justificatifs pour renforcer l\'auditabilité',
      });
    }

    // Check expired factors
    const expiredFactors = factors.filter((f) => f.is_expired);
    if (expiredFactors.length > 0) {
      warnings.push({
        type: 'expired_factor',
        severity: 'critical',
        message: `${expiredFactors.length} facteur(s) expiré(s)`,
        recommendation: 'Mettez à jour les facteurs avec les dernières références officielles',
      });
    }

    // Check low confidence
    const lowConfidenceInputs = inputs.filter((i) => i.confidence_level === 'low');
    if (lowConfidenceInputs.length > 0) {
      warnings.push({
        type: 'low_confidence',
        severity: 'warning',
        message: `${lowConfidenceInputs.length} donnée(s) avec niveau de confiance faible`,
        recommendation: 'Privilégiez des sources mesurées plutôt qu\'estimées',
      });
    }

    // Check estimations
    const estimatedInputs = inputs.filter((i) => i.is_estimated);
    if (estimatedInputs.length > 0 && profile.quality_level === 'estimated') {
      warnings.push({
        type: 'estimation',
        severity: 'info',
        message: `Indicateur basé sur ${estimatedInputs.length} estimation(s)`,
        recommendation: 'Documentez les méthodes d\'estimation utilisées',
      });
    }

    return {
      indicator,
      profile,
      inputs,
      factors,
      logs,
      warnings,
      computed_value: displayedValue,
      last_updated: profile.updated_at,
    };
  }, [indicatorCode, displayedValue]);

  if (!calculationSummary) {
    return null; // Pas de profil de transparence pour cet indicateur
  }

  const { indicator, profile, inputs, factors, logs, warnings } = calculationSummary;

  const isAuditExterne = posture === 'audit-externe';
  const isReadOnly = isAuditExterne;

  // Fonction d'export PDF (simulation)
  const handleExport = () => {
    alert(`Export PDF en cours pour l'indicateur ${indicator.code}...\n\nFonctionnalité à implémenter avec jsPDF ou équivalent.`);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {variant === 'icon' ? (
        <SheetTrigger asChild>
          <button
            className="inline-flex items-center justify-center rounded-full bg-[#E8F3F0] hover:bg-[#D1E9E3] transition-all ml-2 border border-[#0F4C3A]/20 hover:border-[#0F4C3A]/40"
            style={{
              width: size === 'sm' ? '20px' : size === 'md' ? '24px' : '28px',
              height: size === 'sm' ? '20px' : size === 'md' ? '24px' : '28px',
            }}
            title="Voir le détail du calcul"
          >
            <Info
              className="text-[#0F4C3A] hover:text-[#059669]"
              style={{
                width: size === 'sm' ? '12px' : size === 'md' ? '14px' : '16px',
                height: size === 'sm' ? '12px' : size === 'md' ? '14px' : '16px',
              }}
            />
          </button>
        </SheetTrigger>
      ) : (
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Info className="w-4 h-4" />
            <span>Détail calcul</span>
          </Button>
        </SheetTrigger>
      )}

      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="text-2xl font-bold text-[#0F4C3A]">
                {indicator.name}
              </SheetTitle>
              <SheetDescription className="mt-2">
                Transparence du calcul — {indicator.norm_reference}
              </SheetDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Valeur affichée */}
          <Card className="border-l-4 border-l-[#0F4C3A]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Valeur calculée</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-3">
                <div className="text-4xl font-bold text-[#0F4C3A]">
                  {displayedValue !== undefined ? displayedValue : '—'}
                </div>
                <div className="text-xl text-gray-500">{indicator.unit}</div>
                <Badge
                  className={
                    profile.quality_level === 'measured'
                      ? 'bg-green-100 text-green-800'
                      : profile.quality_level === 'estimated'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-blue-100 text-blue-800'
                  }
                >
                  {profile.quality_level === 'measured' && '📊 Mesuré'}
                  {profile.quality_level === 'estimated' && '📐 Estimé'}
                  {profile.quality_level === 'mixed' && '📊📐 Mixte'}
                  {profile.quality_level === 'calculated' && '🧮 Calculé'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Alertes */}
          {warnings.length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <CardTitle className="text-lg text-orange-900">
                    {warnings.length} point{warnings.length > 1 ? 's' : ''} d'attention
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {warnings.map((warning, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertCircle
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          warning.severity === 'critical'
                            ? 'text-red-600'
                            : warning.severity === 'warning'
                            ? 'text-orange-600'
                            : 'text-blue-600'
                        }`}
                      />
                      <div>
                        <div className="text-sm font-medium text-orange-900">{warning.message}</div>
                        {warning.recommendation && (
                          <div className="text-xs text-orange-700 mt-1">
                            💡 {warning.recommendation}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Onglets de contenu */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="method">Méthode</TabsTrigger>
              <TabsTrigger value="data">Données</TabsTrigger>
              <TabsTrigger value="factors">Facteurs</TabsTrigger>
              <TabsTrigger value="audit">Audit</TabsTrigger>
            </TabsList>

            {/* TAB 1: Vue d'ensemble */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-[#0F4C3A]" />
                    À quoi correspond cet indicateur ?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Description</div>
                    <div className="text-sm text-gray-900">{indicator.description}</div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Code indicateur</div>
                      <Badge variant="outline" className="font-mono">
                        {indicator.code}
                      </Badge>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Norme CSRD</div>
                      <Badge className="bg-[#0F4C3A] text-white">
                        {indicator.norm_reference || 'Non applicable'}
                      </Badge>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Unité</div>
                      <div className="text-sm font-semibold">{indicator.unit}</div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Type d'agrégation</div>
                      <div className="text-sm font-semibold capitalize">
                        {indicator.aggregation_type.replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Pilier ESG</div>
                    <Badge
                      className={
                        indicator.pillar === 'E'
                          ? 'bg-green-100 text-green-800'
                          : indicator.pillar === 'S'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-orange-100 text-orange-800'
                      }
                    >
                      {indicator.pillar === 'E' && '🌍 Environnemental'}
                      {indicator.pillar === 'S' && '👥 Social'}
                      {indicator.pillar === 'G' && '⚖️ Gouvernance'}
                    </Badge>
                    {indicator.is_mandatory && (
                      <Badge className="ml-2 bg-red-100 text-red-800">Obligatoire</Badge>
                    )}
                    {indicator.is_material && (
                      <Badge className="ml-2 bg-purple-100 text-purple-800">Matériel</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: Méthode de calcul */}
            <TabsContent value="method" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Comment est-il calculé ?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Méthode</div>
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {profile.calculation_method_text}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Formule</div>
                    <div className="text-sm font-mono bg-blue-50 p-3 rounded border border-blue-200 text-blue-900">
                      {profile.formula_text}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Étapes du calcul</div>
                    <ol className="space-y-2">
                      {profile.steps.map((step, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Hypothèses retenues</div>
                    <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded border border-yellow-200">
                      {profile.assumptions}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Limites de la méthode</div>
                    <div className="text-sm text-gray-600 bg-orange-50 p-3 rounded border border-orange-200">
                      {profile.limitations}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Référence méthodologique
                    </div>
                    <Badge variant="outline">{profile.methodology_reference}</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: Données sources */}
            <TabsContent value="data" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-[#0F4C3A]" />
                    Données utilisées ({inputs.length})
                  </CardTitle>
                  <CardDescription>
                    Sources de données et preuves pour ce calcul
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Donnée</TableHead>
                        <TableHead>Valeur</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Confiance</TableHead>
                        <TableHead>Preuve</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inputs.map((input) => (
                        <TableRow key={input.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">{input.input_name}</div>
                              {input.is_estimated && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  Estimé
                                </Badge>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="font-semibold">
                              {typeof input.value === 'number'
                                ? input.value.toLocaleString('fr-FR')
                                : input.value}
                            </div>
                            <div className="text-xs text-gray-500">{input.unit}</div>
                          </TableCell>

                          <TableCell className="max-w-xs">
                            <div className="text-sm">
                              <Badge
                                variant="outline"
                                className="mb-1 text-xs whitespace-nowrap"
                              >
                                {input.source_type === 'invoice' && '📄 Facture'}
                                {input.source_type === 'erp' && '💻 ERP'}
                                {input.source_type === 'estimation' && '📐 Estimation'}
                                {input.source_type === 'provider' && '🏢 Fournisseur'}
                                {input.source_type === 'other' && '📋 Autre'}
                              </Badge>
                              <div className="text-xs text-gray-600 mt-1">
                                {input.source_reference}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge
                              className={
                                input.confidence_level === 'high'
                                  ? 'bg-green-100 text-green-800'
                                  : input.confidence_level === 'medium'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-red-100 text-red-800'
                              }
                            >
                              {input.confidence_level === 'high' && '✓ Élevée'}
                              {input.confidence_level === 'medium' && '~ Moyenne'}
                              {input.confidence_level === 'low' && '⚠ Faible'}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            {input.evidence_link ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="text-[#0F4C3A] hover:text-[#059669]"
                              >
                                <a href={input.evidence_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                  <FileText className="w-4 h-4" />
                                  <span>Voir</span>
                                </a>
                              </Button>
                            ) : (
                              <span className="text-xs text-gray-400">Aucune</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: Facteurs & hypothèses */}
            <TabsContent value="factors" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#0F4C3A]" />
                    Facteurs & hypothèses ({factors.length})
                  </CardTitle>
                  <CardDescription>
                    Facteurs d'émission, de conversion et coefficients utilisés
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Facteur</TableHead>
                        <TableHead>Valeur</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Validité</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {factors.map((factor) => (
                        <TableRow key={factor.id}>
                          <TableCell>
                            <div className="font-medium text-sm">{factor.factor_name}</div>
                            {factor.factor_code && (
                              <div className="text-xs text-gray-500 font-mono mt-1">
                                {factor.factor_code}
                              </div>
                            )}
                          </TableCell>

                          <TableCell>
                            <div className="font-semibold">
                              {factor.factor_value.toLocaleString('fr-FR')}
                            </div>
                            <div className="text-xs text-gray-500">{factor.factor_unit}</div>
                            {factor.uncertainty_range && (
                              <div className="text-xs text-orange-600 mt-1">
                                {factor.uncertainty_range}
                              </div>
                            )}
                          </TableCell>

                          <TableCell className="max-w-xs">
                            <Badge
                              variant="outline"
                              className="mb-1 text-xs whitespace-nowrap"
                            >
                              {factor.factor_source === 'ademe' && '🇫🇷 ADEME'}
                              {factor.factor_source === 'ghg_protocol' && '🌍 GHG Protocol'}
                              {factor.factor_source === 'provider' && '🏢 Fournisseur'}
                              {factor.factor_source === 'custom' && '🔧 Personnalisé'}
                            </Badge>
                            <div className="text-xs text-gray-600 mt-1">
                              {factor.source_reference}
                            </div>
                            {factor.source_url && (
                              <Button
                                variant="link"
                                size="sm"
                                asChild
                                className="h-auto p-0 text-xs text-[#0F4C3A]"
                              >
                                <a href={factor.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Source</span>
                                </a>
                              </Button>
                            )}
                          </TableCell>

                          <TableCell>
                            {factor.is_expired ? (
                              <Badge className="bg-red-100 text-red-800">❌ Expiré</Badge>
                            ) : factor.valid_to ? (
                              <div className="text-xs">
                                <div className="text-green-600 font-medium">✓ Valide</div>
                                <div className="text-gray-500">
                                  jusqu'au {factor.valid_to.toLocaleDateString('fr-FR')}
                                </div>
                              </div>
                            ) : (
                              <Badge className="bg-green-100 text-green-800">✓ Valide</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {factors.length === 0 && (
                    <div className="text-center text-sm text-gray-500 py-8">
                      Aucun facteur spécifique pour ce calcul
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 5: Fiabilité & Audit */}
            <TabsContent value="audit" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#0F4C3A]" />
                    Fiabilité & Audit
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">
                        Niveau de qualité
                      </div>
                      <Badge
                        className={
                          profile.quality_level === 'measured'
                            ? 'bg-green-100 text-green-800'
                            : profile.quality_level === 'estimated'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                        }
                      >
                        {profile.quality_level === 'measured' && '📊 Données mesurées'}
                        {profile.quality_level === 'estimated' && '📐 Données estimées'}
                        {profile.quality_level === 'mixed' && '📊📐 Mixte'}
                        {profile.quality_level === 'calculated' && '🧮 Calculées'}
                      </Badge>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">
                        Dernière mise à jour
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {profile.updated_at.toLocaleDateString('fr-FR')}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Version</div>
                      <Badge variant="outline">{profile.version}</Badge>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Statut</div>
                      <Badge
                        className={
                          profile.validation_status === 'validated'
                            ? 'bg-green-100 text-green-800'
                            : profile.validation_status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {profile.validation_status === 'validated' && '✓ Validé'}
                        {profile.validation_status === 'rejected' && '✗ Rejeté'}
                        {profile.validation_status === 'pending_review' && '⏳ En attente'}
                        {profile.validation_status === 'draft' && '📝 Brouillon'}
                      </Badge>
                    </div>
                  </div>

                  {profile.validation_status === 'validated' && profile.validated_by && (
                    <>
                      <Separator />
                      <div className="bg-green-50 p-4 rounded border border-green-200">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-green-900 mb-1">
                              Validé par {profile.validated_by}
                            </div>
                            <div className="text-xs text-green-700">
                              le {profile.validated_at?.toLocaleDateString('fr-FR')}
                            </div>
                            {profile.validation_comment && (
                              <div className="text-sm text-green-800 mt-2 italic">
                                "{profile.validation_comment}"
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <History className="w-4 h-4" />
                      Historique des modifications ({logs.length} actions)
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {logs
                        .sort((a, b) => b.performed_at.getTime() - a.performed_at.getTime())
                        .slice(0, 10)
                        .map((log) => (
                          <div
                            key={log.id}
                            className="text-xs bg-gray-50 p-2 rounded border border-gray-200"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <Badge
                                variant="outline"
                                className="text-xs"
                              >
                                {log.action === 'created' && '➕ Création'}
                                {log.action === 'updated' && '✏️ Modification'}
                                {log.action === 'input_changed' && '📊 Donnée modifiée'}
                                {log.action === 'factor_changed' && '🔢 Facteur modifié'}
                                {log.action === 'validated' && '✅ Validation'}
                                {log.action === 'rejected' && '❌ Rejet'}
                              </Badge>
                              <span className="text-gray-500">
                                {log.performed_at.toLocaleString('fr-FR')}
                              </span>
                            </div>
                            <div className="text-gray-700">
                              {log.action_detail || log.comment}
                            </div>
                            <div className="text-gray-500 mt-1 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {log.performed_by}
                              {log.performed_by_role && ` (${log.performed_by_role})`}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}