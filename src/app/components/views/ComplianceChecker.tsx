import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Progress } from '@/app/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';
import { 
  ShieldCheck, 
  Play, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Eye,
  FileText,
  AlertCircle
} from 'lucide-react';
import { auditChecks } from '@/data/complianceData';
import type { AuditRun, AuditCheckResult } from '@/types/compliance';

interface ComplianceCheckerProps {
  posture: 'conseil' | 'pre-audit' | 'audit-externe';
  parcours: 'csrd-obligatoire' | 'esg-structure';
  dossierId?: string;
}

// Simulation de données d'audit run
const generateMockAuditRun = (): AuditRun => {
  return {
    id: 'run-' + Date.now(),
    dossier_id: 'dossier-demo',
    audit_type: 'auto_check',
    audit_scope: 'full',
    triggered_by: 'system',
    trigger_reason: 'Scheduled daily check',
    started_at: new Date(Date.now() - 120000),
    completed_at: new Date(),
    duration_seconds: 120,
    status: 'completed',
    total_checks: auditChecks.length,
    passed_checks: 4,
    failed_checks: 2,
    warning_checks: 1,
    overall_score: 72.5,
    compliance_status: 'substantially_compliant',
    audit_ready: false,
    critical_issues_count: 1,
    blocking_issues: ['STR-002'],
    report_generated: false,
  };
};

// Simulation de résultats de checks
const generateMockCheckResults = (): AuditCheckResult[] => {
  return [
    {
      id: 'result-1',
      dossier_id: 'dossier-demo',
      audit_run_id: 'run-latest',
      audit_check_id: 'check-str-001',
      check_status: 'passed',
      score_obtained: 10,
      score_max: 10,
      checked_at: new Date(),
      checked_by: 'system',
      is_resolved: true,
    },
    {
      id: 'result-2',
      dossier_id: 'dossier-demo',
      audit_run_id: 'run-latest',
      audit_check_id: 'check-str-002',
      check_status: 'failed',
      score_obtained: 0,
      score_max: 10,
      failure_details: {
        assessed_topics: 7,
        required: 10,
        incomplete_topics: ['Climate change', 'Water resources', 'Biodiversity']
      },
      recommendation: 'Réalisez une analyse de double matérialité avec au moins 10 enjeux évalués',
      priority: 'immediate',
      estimated_effort: 'extensive',
      checked_at: new Date(),
      checked_by: 'system',
      is_resolved: false,
    },
    {
      id: 'result-3',
      dossier_id: 'dossier-demo',
      audit_run_id: 'run-latest',
      audit_check_id: 'check-data-e1-6-scope1',
      check_status: 'passed',
      score_obtained: 10,
      score_max: 10,
      checked_at: new Date(),
      checked_by: 'system',
      is_resolved: true,
    },
    {
      id: 'result-4',
      dossier_id: 'dossier-demo',
      audit_run_id: 'run-latest',
      audit_check_id: 'check-evid-001',
      check_status: 'warning',
      score_obtained: 6,
      score_max: 10,
      failure_details: {
        datapoint: 'E1-6-SCOPE3',
        missing_evidence: 'Calculation spreadsheet not uploaded',
        has_source: true,
        has_method: true
      },
      recommendation: 'Uploadez les calculs détaillés des émissions Scope 3',
      priority: 'high',
      estimated_effort: 'moderate',
      checked_at: new Date(),
      checked_by: 'system',
      is_resolved: false,
    },
    {
      id: 'result-5',
      dossier_id: 'dossier-demo',
      audit_run_id: 'run-latest',
      audit_check_id: 'check-coh-001',
      check_status: 'passed',
      score_obtained: 10,
      score_max: 10,
      checked_at: new Date(),
      checked_by: 'system',
      is_resolved: true,
    },
    {
      id: 'result-6',
      dossier_id: 'dossier-demo',
      audit_run_id: 'run-latest',
      audit_check_id: 'check-mat-001',
      check_status: 'failed',
      score_obtained: 3,
      score_max: 10,
      failure_details: {
        material_topic: 'Water resources',
        missing_esrs: 'ESRS E3',
        coverage: 0
      },
      recommendation: 'Documentez les données pour ESRS E3 (enjeu matériel identifié)',
      priority: 'immediate',
      estimated_effort: 'extensive',
      checked_at: new Date(),
      checked_by: 'system',
      is_resolved: false,
    },
    {
      id: 'result-7',
      dossier_id: 'dossier-demo',
      audit_run_id: 'run-latest',
      audit_check_id: 'check-fmt-001',
      check_status: 'passed',
      score_obtained: 10,
      score_max: 10,
      checked_at: new Date(),
      checked_by: 'system',
      is_resolved: true,
    },
  ];
};

export function ComplianceChecker({ posture, parcours }: ComplianceCheckerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [latestRun, setLatestRun] = useState<AuditRun>(generateMockAuditRun());
  const [checkResults, setCheckResults] = useState<AuditCheckResult[]>(generateMockCheckResults());
  
  const isCsrd = parcours === 'csrd-obligatoire';
  const isAuditExterne = posture === 'audit-externe';
  
  // Calculer les métriques
  const metrics = useMemo(() => {
    const passedCount = checkResults.filter(r => r.check_status === 'passed').length;
    const failedCount = checkResults.filter(r => r.check_status === 'failed').length;
    const warningCount = checkResults.filter(r => r.check_status === 'warning').length;
    
    const criticalIssues = checkResults.filter(r => {
      const check = auditChecks.find(c => c.id === r.audit_check_id);
      return check?.severity === 'critical' && r.check_status === 'failed';
    });
    
    const blockingIssues = checkResults.filter(r => {
      const check = auditChecks.find(c => c.id === r.audit_check_id);
      return check?.blocking && r.check_status === 'failed';
    });
    
    return {
      passedCount,
      failedCount,
      warningCount,
      criticalCount: criticalIssues.length,
      blockingCount: blockingIssues.length,
      passRate: (passedCount / checkResults.length) * 100,
    };
  }, [checkResults]);
  
  const runAuditCheck = async () => {
    setIsRunning(true);
    
    // Simulation d'exécution
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newRun = generateMockAuditRun();
    const newResults = generateMockCheckResults();
    
    setLatestRun(newRun);
    setCheckResults(newResults);
    setIsRunning(false);
  };
  
  // Grouper les résultats par catégorie
  const resultsByCategory = useMemo(() => {
    const grouped: Record<string, AuditCheckResult[]> = {};
    
    checkResults.forEach(result => {
      const check = auditChecks.find(c => c.id === result.audit_check_id);
      if (check) {
        const category = check.check_category;
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(result);
      }
    });
    
    return grouped;
  }, [checkResults]);
  
  return (
    <div className="flex-1 overflow-auto bg-[#E8F3F0] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-8 h-8 text-[#0F4C3A]" />
              <h1 className="text-2xl font-semibold text-foreground">
                {isCsrd 
                  ? 'Moteur de Vérification CSRD/ESRS' 
                  : 'Vérification Conformité ESG'}
              </h1>
            </div>
            <p className="text-gray-600">
              {isAuditExterne
                ? 'Revue automatique de conformité réglementaire — Vue auditeur externe'
                : 'Audit automatique de conformité réglementaire — Identification des écarts et recommandations'
              }
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={runAuditCheck} 
              disabled={isRunning}
              className="bg-[#0F4C3A] hover:bg-[#0F4C3A]/90"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Vérification en cours...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Lancer vérification
                </>
              )}
            </Button>
            
            {latestRun.report_generated && (
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exporter rapport
              </Button>
            )}
          </div>
        </div>
        
        {/* Dernière exécution */}
        {latestRun && (
          <Card className="border-l-4 border-l-[#0F4C3A]">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">Dernière vérification</CardTitle>
                  <CardDescription>
                    Exécutée le {latestRun.completed_at?.toLocaleString('fr-FR')} 
                    • Durée : {latestRun.duration_seconds}s
                    • Déclenchée par : {latestRun.triggered_by === 'system' ? 'Système automatique' : 'Utilisateur'}
                  </CardDescription>
                </div>
                
                <Badge 
                  className={
                    latestRun.compliance_status === 'fully_compliant'
                      ? 'bg-green-100 text-green-800'
                      : latestRun.compliance_status === 'substantially_compliant'
                      ? 'bg-blue-100 text-blue-800'
                      : latestRun.compliance_status === 'partial'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-red-100 text-red-800'
                  }
                >
                  {latestRun.compliance_status === 'fully_compliant' && 'Entièrement conforme'}
                  {latestRun.compliance_status === 'substantially_compliant' && 'Substantiellement conforme'}
                  {latestRun.compliance_status === 'partial' && 'Partiellement conforme'}
                  {latestRun.compliance_status === 'non_compliant' && 'Non conforme'}
                </Badge>
              </div>
            </CardHeader>
          </Card>
        )}
        
        {/* Métriques globales */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Score global
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-[#0F4C3A] mb-2">
                {latestRun.overall_score.toFixed(1)}%
              </div>
              <Progress value={latestRun.overall_score} className="h-2" />
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                {latestRun.overall_score >= 80 ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="text-green-600">Bon niveau</span>
                  </>
                ) : latestRun.overall_score >= 50 ? (
                  <>
                    <Minus className="w-3 h-3 text-orange-600" />
                    <span className="text-orange-600">À améliorer</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 text-red-600" />
                    <span className="text-red-600">Insuffisant</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Vérifications réussies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">
                {metrics.passedCount}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                sur {latestRun.total_checks} checks
              </div>
              <div className="text-xs text-green-600 mt-1">
                {metrics.passRate.toFixed(0)}% de réussite
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Échecs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-600">
                {metrics.failedCount}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                dont {metrics.criticalCount} critique{metrics.criticalCount > 1 ? 's' : ''}
              </div>
              {metrics.blockingCount > 0 && (
                <div className="text-xs text-red-600 mt-1 font-medium">
                  ⚠️ {metrics.blockingCount} bloquant{metrics.blockingCount > 1 ? 's' : ''}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Avertissements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-orange-600">
                {metrics.warningCount}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Points d'amélioration
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Statut audit
              </CardTitle>
            </CardHeader>
            <CardContent>
              {latestRun.audit_ready ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-8 h-8" />
                  <div>
                    <div className="font-bold">PRÊT</div>
                    <div className="text-xs">Audit possible</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="w-8 h-8" />
                  <div>
                    <div className="font-bold">NON PRÊT</div>
                    <div className="text-xs">Corrections requises</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Alertes bloquantes */}
        {metrics.blockingCount > 0 && (
          <Card className="border-red-300 bg-red-50">
            <CardHeader>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <CardTitle className="text-red-900">
                    {metrics.blockingCount} vérification{metrics.blockingCount > 1 ? 's' : ''} bloquante{metrics.blockingCount > 1 ? 's' : ''} échouée{metrics.blockingCount > 1 ? 's' : ''}
                  </CardTitle>
                  <CardDescription className="text-red-700">
                    Ces problèmes doivent être résolus avant de passer en audit externe
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {checkResults
                  .filter(r => {
                    const check = auditChecks.find(c => c.id === r.audit_check_id);
                    return check?.blocking && r.check_status === 'failed';
                  })
                  .map((result) => {
                    const check = auditChecks.find(c => c.id === result.audit_check_id);
                    return (
                      <li key={result.id} className="flex items-start gap-2 text-sm text-red-900">
                        <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
                        <div>
                          <span className="font-medium">{check?.check_code}</span> — {check?.check_name}
                          {result.recommendation && (
                            <div className="text-xs text-red-700 mt-1">💡 {result.recommendation}</div>
                          )}
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </CardContent>
          </Card>
        )}
        
        {/* Résultats détaillés */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="bg-white">
            <TabsTrigger value="all">
              Tous ({checkResults.length})
            </TabsTrigger>
            <TabsTrigger value="failed" className="text-red-600">
              Échecs ({metrics.failedCount})
            </TabsTrigger>
            <TabsTrigger value="warning" className="text-orange-600">
              Avertissements ({metrics.warningCount})
            </TabsTrigger>
            <TabsTrigger value="passed" className="text-green-600">
              Réussis ({metrics.passedCount})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Résultats détaillés par catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="space-y-2">
                  {Object.entries(resultsByCategory).map(([category, results]) => {
                    const categoryPassRate = (results.filter(r => r.check_status === 'passed').length / results.length) * 100;
                    
                    return (
                      <AccordionItem key={category} value={category} className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="font-mono">
                                {category === 'structure' && '🏗️ Structure'}
                                {category === 'datapoint' && '📊 Datapoints'}
                                {category === 'materiality' && '🎯 Matérialité'}
                                {category === 'evidence' && '📎 Preuves'}
                                {category === 'format' && '📄 Format'}
                                {category === 'coherence' && '🔗 Cohérence'}
                              </Badge>
                              <span className="text-sm text-gray-600">
                                {results.length} vérification{results.length > 1 ? 's' : ''}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="w-24">
                                <Progress value={categoryPassRate} className="h-2" />
                              </div>
                              <span className="text-sm font-medium w-12 text-right">
                                {categoryPassRate.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </AccordionTrigger>
                        
                        <AccordionContent className="pt-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-32">Code</TableHead>
                                <TableHead>Vérification</TableHead>
                                <TableHead className="w-24">Statut</TableHead>
                                <TableHead className="w-24">Score</TableHead>
                                <TableHead>Recommandation</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {results.map((result) => {
                                const check = auditChecks.find(c => c.id === result.audit_check_id);
                                if (!check) return null;
                                
                                return (
                                  <TableRow key={result.id}>
                                    <TableCell className="font-mono text-xs">
                                      {check.check_code}
                                    </TableCell>
                                    
                                    <TableCell>
                                      <div>
                                        <div className="font-medium text-sm">{check.check_name}</div>
                                        {check.check_description && (
                                          <div className="text-xs text-gray-500 mt-1">
                                            {check.check_description}
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                    
                                    <TableCell>
                                      {result.check_status === 'passed' && (
                                        <Badge className="bg-green-100 text-green-800">
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          OK
                                        </Badge>
                                      )}
                                      {result.check_status === 'failed' && (
                                        <Badge className="bg-red-100 text-red-800">
                                          <XCircle className="w-3 h-3 mr-1" />
                                          Échec
                                        </Badge>
                                      )}
                                      {result.check_status === 'warning' && (
                                        <Badge className="bg-orange-100 text-orange-800">
                                          <AlertTriangle className="w-3 h-3 mr-1" />
                                          Alerte
                                        </Badge>
                                      )}
                                    </TableCell>
                                    
                                    <TableCell>
                                      <div className="text-sm">
                                        <span className="font-medium">{result.score_obtained}</span>
                                        <span className="text-gray-400"> / {result.score_max}</span>
                                      </div>
                                    </TableCell>
                                    
                                    <TableCell>
                                      {result.recommendation && (
                                        <div className="text-xs text-gray-700">
                                          {result.recommendation}
                                          {result.priority && (
                                            <Badge 
                                              variant="outline" 
                                              className="ml-2"
                                            >
                                              {result.priority === 'immediate' && '🔴 Immédiat'}
                                              {result.priority === 'high' && '🟠 Élevé'}
                                              {result.priority === 'medium' && '🟡 Moyen'}
                                              {result.priority === 'low' && '🟢 Faible'}
                                            </Badge>
                                          )}
                                        </div>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="failed">
            {/* Contenu similaire filtré sur échecs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-red-900">Vérifications échouées</CardTitle>
                <CardDescription>Actions correctives requises</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {checkResults
                    .filter(r => r.check_status === 'failed')
                    .map(result => {
                      const check = auditChecks.find(c => c.id === result.audit_check_id);
                      if (!check) return null;
                      
                      return (
                        <div key={result.id} className="border rounded-lg p-4 bg-red-50 border-red-200">
                          <div className="flex items-start gap-3">
                            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-sm font-bold text-red-900">
                                  {check.check_code}
                                </span>
                                {check.blocking && (
                                  <Badge className="bg-red-600 text-white text-xs">BLOQUANT</Badge>
                                )}
                              </div>
                              <div className="font-medium text-red-900">{check.check_name}</div>
                              {result.recommendation && (
                                <div className="mt-2 text-sm text-red-800 bg-white/50 p-2 rounded">
                                  💡 {result.recommendation}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="warning">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-orange-900">Avertissements</CardTitle>
                <CardDescription>Points d'amélioration recommandés</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {checkResults
                    .filter(r => r.check_status === 'warning')
                    .map(result => {
                      const check = auditChecks.find(c => c.id === result.audit_check_id);
                      if (!check) return null;
                      
                      return (
                        <div key={result.id} className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                            <div className="flex-1">
                              <div className="font-mono text-sm font-bold text-orange-900 mb-1">
                                {check.check_code}
                              </div>
                              <div className="font-medium text-orange-900">{check.check_name}</div>
                              {result.recommendation && (
                                <div className="mt-2 text-sm text-orange-800 bg-white/50 p-2 rounded">
                                  💡 {result.recommendation}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="passed">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-green-900">Vérifications réussies</CardTitle>
                <CardDescription>Exigences conformes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {checkResults
                    .filter(r => r.check_status === 'passed')
                    .map(result => {
                      const check = auditChecks.find(c => c.id === result.audit_check_id);
                      if (!check) return null;
                      
                      return (
                        <div key={result.id} className="border rounded-lg p-3 bg-green-50 border-green-200">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                            <div className="flex-1">
                              <div className="font-mono text-xs font-bold text-green-900">
                                {check.check_code}
                              </div>
                              <div className="text-sm text-green-800">{check.check_name}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
        </Tabs>
        
      </div>
    </div>
  );
}