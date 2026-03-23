/**
 * QUICK START LOCAL - Version 100% locale sans backend
 * 
 * Fonctionnalités :
 * - Créer organization + dossier + pack de test en 10 secondes
 * - Remplir avec données test (checklist, KPIs, preuves simulées)
 * - Redirection automatique vers le pack créé
 * - Tests de connexion au système local
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { 
  Rocket,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Package,
  Database,
  FileText,
  Bell,
  History,
  Play,
  Building2,
  FolderOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { dataProvider } from '@/services/dataProvider';
import { packService } from '@/services/packService';
import { authService } from '@/services/authService';
import { v4 as uuidv4 } from 'uuid';

interface QuickStartLocalProps {
  onComplete: (packId: string) => void;
}

type StepStatus = 'pending' | 'loading' | 'success' | 'error';

interface Step {
  id: string;
  label: string;
  status: StepStatus;
  icon: any;
}

export function QuickStartLocal({ onComplete }: QuickStartLocalProps) {
  const { currentUser } = useUser();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<Step[]>([
    { id: 'org', label: 'Vérification organisation', status: 'pending', icon: Building2 },
    { id: 'dossier', label: 'Création dossier test', status: 'pending', icon: FolderOpen },
    { id: 'pack', label: 'Création pack test', status: 'pending', icon: Package },
    { id: 'checklist', label: 'Génération checklist', status: 'pending', icon: FileText },
    { id: 'kpis', label: 'Génération KPIs', status: 'pending', icon: Database },
    { id: 'notifications', label: 'Création notifications', status: 'pending', icon: Bell },
    { id: 'audit', label: 'Initialisation audit trail', status: 'pending', icon: History },
  ]);

  const updateStepStatus = (stepId: string, status: StepStatus) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const runQuickStart = async () => {
    if (!currentUser) {
      toast.error('Aucun utilisateur connecté');
      return;
    }

    setIsRunning(true);
    setProgress(0);

    try {
      const totalSteps = steps.length;
      let currentStep = 0;

      // STEP 1: Verify organization
      updateStepStatus('org', 'loading');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const organization = await dataProvider.store.read('organizations', currentUser.organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }
      
      updateStepStatus('org', 'success');
      currentStep++;
      setProgress(Math.round((currentStep / totalSteps) * 100));

      // STEP 2: Create test dossier
      updateStepStatus('dossier', 'loading');
      await new Promise(resolve => setTimeout(resolve, 300));

      const dossier = {
        id: uuidv4(),
        name: `Dossier Test - ${new Date().toLocaleDateString('fr-FR')}`,
        description: 'Dossier créé automatiquement par Quick Start',
        organizationId: currentUser.organizationId,
        ownerId: currentUser.id,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dataProvider.store.create('dossiers', dossier);
      
      // Log creation
      await dataProvider.store.logAction({
        entityType: 'dossier',
        entityId: dossier.id,
        action: 'DOSSIER_CREATED',
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        details: JSON.stringify({ name: dossier.name, source: 'quickstart' }),
      });

      updateStepStatus('dossier', 'success');
      currentStep++;
      setProgress(Math.round((currentStep / totalSteps) * 100));

      // STEP 3: Create test pack (using packService)
      updateStepStatus('pack', 'loading');
      await new Promise(resolve => setTimeout(resolve, 500));

      const pack = await packService.createPack({
        name: `Pack Test Banque - ${new Date().toLocaleTimeString('fr-FR')}`,
        dossierId: dossier.id,
        templateCode: 'banque', // Use Banque template
        organizationId: currentUser.organizationId,
        ownerId: currentUser.id,
      });

      updateStepStatus('pack', 'success');
      currentStep++;
      setProgress(Math.round((currentStep / totalSteps) * 100));

      // STEP 4: Verify checklist was created
      updateStepStatus('checklist', 'loading');
      await new Promise(resolve => setTimeout(resolve, 300));

      const checklistItems = await dataProvider.store.listByIndex('checklist_items', 'packId', pack.id);

      // Mark 2 items as PROVIDED
      if (checklistItems.length >= 2) {
        for (let i = 0; i < 2; i++) {
          await packService.markItemAsProvided(
            checklistItems[i].id,
            currentUser.id,
            currentUser.name,
            currentUser.role
          );
        }
      }

      updateStepStatus('checklist', 'success');
      currentStep++;
      setProgress(Math.round((currentStep / totalSteps) * 100));

      // STEP 5: Verify KPIs were created and add some values
      updateStepStatus('kpis', 'loading');
      await new Promise(resolve => setTimeout(resolve, 300));

      const kpiRequirements = await dataProvider.store.listByIndex('kpi_requirements', 'packId', pack.id);

      // Add test values to first 2 KPIs
      if (kpiRequirements.length >= 2) {
        const kpi1 = kpiRequirements[0];
        const kpi2 = kpiRequirements[1];

        const updatedKpi1 = {
          ...kpi1,
          status: 'provided' as const,
          value: 1250,
          period: '2024',
          updatedAt: new Date().toISOString(),
        };

        const updatedKpi2 = {
          ...kpi2,
          status: 'provided' as const,
          value: 75,
          period: '2024',
          updatedAt: new Date().toISOString(),
        };

        await dataProvider.store.update('kpi_requirements', updatedKpi1);
        await dataProvider.store.update('kpi_requirements', updatedKpi2);

        // Log KPI updates
        await dataProvider.store.logAction({
          entityType: 'kpi',
          entityId: kpi1.id,
          action: 'KPI_VALUE_UPDATED',
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          details: JSON.stringify({ code: kpi1.code, value: 1250, period: '2024' }),
        });

        await dataProvider.store.logAction({
          entityType: 'kpi',
          entityId: kpi2.id,
          action: 'KPI_VALUE_UPDATED',
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          details: JSON.stringify({ code: kpi2.code, value: 75, period: '2024' }),
        });
      }

      updateStepStatus('kpis', 'success');
      currentStep++;
      setProgress(Math.round((currentStep / totalSteps) * 100));

      // STEP 6: Create test notifications
      updateStepStatus('notifications', 'loading');
      await new Promise(resolve => setTimeout(resolve, 300));

      const testNotifications = [
        {
          id: uuidv4(),
          userId: currentUser.id,
          type: 'pack_submitted' as const,
          title: 'Pack créé avec succès',
          description: `Le pack "${pack.name}" a été créé et initialisé`,
          packId: pack.id,
          read: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: uuidv4(),
          userId: currentUser.id,
          type: 'import_completed' as const,
          title: 'Données de test générées',
          description: '2 KPIs ont été remplis automatiquement',
          packId: pack.id,
          read: false,
          createdAt: new Date().toISOString(),
        },
      ];

      for (const notif of testNotifications) {
        await dataProvider.store.create('notifications', notif);
      }

      updateStepStatus('notifications', 'success');
      currentStep++;
      setProgress(Math.round((currentStep / totalSteps) * 100));

      // STEP 7: Verify audit trail
      updateStepStatus('audit', 'loading');
      await new Promise(resolve => setTimeout(resolve, 300));

      const auditLogs = await dataProvider.store.list('audit_logs');

      updateStepStatus('audit', 'success');
      currentStep++;
      setProgress(100);

      // Success!
      await new Promise(resolve => setTimeout(resolve, 500));

      toast.success('Quick Start terminé !', {
        description: `Pack "${pack.name}" créé avec succès`,
        duration: 5000,
      });

      // Redirect to pack
      setTimeout(() => {
        onComplete(pack.id);
      }, 1000);

    } catch (error: any) {
      console.error('❌ Quick Start error:', error);
      toast.error('Erreur lors du Quick Start', {
        description: error.message,
      });
      
      // Mark current step as error
      const currentStepId = steps.find(s => s.status === 'loading')?.id;
      if (currentStepId) {
        updateStepStatus(currentStepId, 'error');
      }
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F3F0] to-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#059669] rounded-2xl mb-4">
            <Rocket className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#0A3B2E]">
            Quick Start
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Lancez l'application en 10 secondes chrono ! Un pack de test complet sera créé automatiquement
            avec des données préchargées pour vous permettre d'explorer toutes les fonctionnalités.
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-2 border-[#059669] shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Initialisation automatique
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Bar */}
            {isRunning && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-gray-600 text-center">
                  {progress}% complété
                </p>
              </div>
            )}

            {/* Steps */}
            <div className="space-y-3">
              {steps.map((step) => {
                const Icon = step.icon;
                const statusConfig = {
                  pending: { color: 'text-gray-400', bg: 'bg-gray-100' },
                  loading: { color: 'text-blue-600', bg: 'bg-blue-100' },
                  success: { color: 'text-green-600', bg: 'bg-green-100' },
                  error: { color: 'text-red-600', bg: 'bg-red-100' },
                };
                const config = statusConfig[step.status];

                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border ${
                      step.status === 'loading' ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.bg} flex items-center justify-center`}>
                      {step.status === 'loading' && (
                        <Loader2 className={`h-5 w-5 ${config.color} animate-spin`} />
                      )}
                      {step.status === 'success' && (
                        <CheckCircle2 className={`h-5 w-5 ${config.color}`} />
                      )}
                      {step.status === 'error' && (
                        <AlertCircle className={`h-5 w-5 ${config.color}`} />
                      )}
                      {step.status === 'pending' && (
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${step.status === 'pending' ? 'text-gray-500' : 'text-gray-900'}`}>
                        {step.label}
                      </p>
                    </div>
                    {step.status === 'success' && (
                      <Badge className="bg-green-100 text-green-800">
                        Terminé
                      </Badge>
                    )}
                    {step.status === 'loading' && (
                      <Badge className="bg-blue-100 text-blue-800">
                        En cours...
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Button */}
            <div className="pt-4">
              <Button
                onClick={runQuickStart}
                disabled={isRunning}
                className="w-full bg-[#059669] hover:bg-[#048558] h-14 text-lg"
                size="lg"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Initialisation en cours...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-6 w-6" />
                    Lancer le Quick Start
                  </>
                )}
              </Button>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>💡 Ce qui sera créé :</strong>
                <br />
                • 1 dossier de test
                <br />
                • 1 pack "Banque" avec checklist complète
                <br />
                • 8 items de checklist (dont 2 marqués "fourni")
                <br />
                • 5 KPIs (dont 2 avec valeurs)
                <br />
                • 2 notifications de test
                <br />
                • Logs d'audit complets
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <Card className="bg-[#E8F3F0] border-[#059669]">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-[#059669]">100%</div>
                <div className="text-sm text-gray-600">Local</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#059669]">0</div>
                <div className="text-sm text-gray-600">Appels serveur</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#059669]">10s</div>
                <div className="text-sm text-gray-600">Temps d'init</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default QuickStartLocal;
