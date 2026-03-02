// ============================================================================
// QUICK START / ONBOARDING - Phase 7
// ============================================================================
// Vue d'accueil pour nouveaux utilisateurs avec guidance interactive

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  Rocket,
  CheckCircle2,
  ArrowRight,
  Play,
  Book,
  FileSpreadsheet,
  FolderOpen,
  Upload,
  BarChart3,
  Shield,
  Lightbulb,
  Target,
  Zap,
  Clock,
  Users,
  ListChecks,
  FileDown,
  FileUp,
  Package,
} from "lucide-react";

interface QuickStartProps {
  onNavigate: (view: string) => void;
  userName?: string;
  organizationName?: string;
}

export function QuickStart({ onNavigate, userName = "Utilisateur", organizationName }: QuickStartProps) {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const markStepComplete = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const isStepComplete = (stepId: string) => completedSteps.includes(stepId);

  // Parcours guidé en 5 étapes
  const onboardingSteps = [
    {
      id: "create-dossier",
      title: "Créer votre dossier ESG",
      description: "Un dossier regroupe toutes vos données ESG pour une période donnée (ex : exercice 2024)",
      icon: FolderOpen,
      action: () => {
        markStepComplete("create-dossier");
        onNavigate("dossiers");
      },
      buttonLabel: "Créer un dossier →",
      duration: "2 min",
    },
    {
      id: "select-workflows",
      title: "Sélectionner vos workflows",
      description: "Choisissez les thématiques à traiter : Bilan Carbone, Social RH, Gouvernance...",
      icon: ListChecks,
      action: () => {
        markStepComplete("select-workflows");
        onNavigate("bibliotheque-workflows");
      },
      buttonLabel: "Choisir mes workflows →",
      duration: "3 min",
    },
    {
      id: "download-templates",
      title: "Télécharger, compléter et déposer vos templates",
      description: "Téléchargez nos templates Excel, complétez-les avec vos données, puis déposez-les directement dans la plateforme. À terme, vos données seront lues et intégrées automatiquement.",
      icon: FileSpreadsheet,
      action: () => {
        markStepComplete("download-templates");
        onNavigate("bibliotheque-templates");
      },
      buttonLabel: "Accéder aux templates →",
      duration: "5 min",
    },
    {
      id: "add-evidence",
      title: "Ajouter vos preuves documentaires",
      description: "Déposez vos factures, calculs et justificatifs pour une traçabilité complète et audit-ready",
      icon: Shield,
      action: () => {
        markStepComplete("add-evidence");
        onNavigate("evidence-vault");
      },
      buttonLabel: "Déposer mes preuves →",
      duration: "4 min",
    },
    {
      id: "view-dashboard",
      title: "Consulter votre Dashboard",
      description: "Visualisez vos indicateurs ESG remplis et suivez votre progression en temps réel",
      icon: BarChart3,
      action: () => {
        markStepComplete("view-dashboard");
        onNavigate("dashboard");
      },
      buttonLabel: "Voir mon Dashboard →",
      duration: "2 min",
    },
  ];

  const progressPercentage = Math.round((completedSteps.length / onboardingSteps.length) * 100);

  // Cas d'usage par rôle
  const useCases = [
    {
      role: "Directeur ESG",
      icon: Target,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Pilotez votre stratégie ESG avec des données auditables",
      features: [
        "Vue d'ensemble consolidée de vos indicateurs E/S/G",
        "Exports professionnels pour les parties prenantes",
        "Suivi de la progression vs objectifs",
      ],
    },
    {
      role: "Consultant RSE",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "Accompagnez vos clients dans leur reporting ESG",
      features: [
        "Gestion multi-dossiers pour plusieurs clients",
        "Workflows de validation structurés",
        "Bibliothèque de méthodologies de calcul",
      ],
    },
    {
      role: "Auditeur",
      icon: Shield,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "Vérifiez la conformité et la traçabilité des données",
      features: [
        "Piste d'audit complète et immuable",
        "Accès direct aux preuves documentaires",
        "Rapports d'audit générés automatiquement",
      ],
    },
  ];

  // Ressources utiles
  const resources = [
    {
      title: "Guide de démarrage rapide",
      description: "Tout ce qu'il faut savoir pour commencer en 10 minutes",
      icon: Book,
      link: "#",
      duration: "10 min de lecture",
    },
    {
      title: "Templates Excel ESG",
      description: "Modèles pré-formatés pour faciliter vos imports",
      icon: FileSpreadsheet,
      link: "#",
      duration: "Téléchargement immédiat",
    },
    {
      title: "Vidéos de formation",
      description: "Tutoriels vidéo pour maîtriser toutes les fonctionnalités",
      icon: Play,
      link: "#",
      duration: "5 vidéos × 3 min",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#059669] to-[#047857] rounded-2xl mb-4">
          <Rocket className="h-10 w-10 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-[#0A3B2E]">
            Bienvenue sur Solvid.IA, {userName} ! 👋
          </h1>
          {organizationName && (
            <p className="text-lg text-muted-foreground mt-2">
              {organizationName}
            </p>
          )}
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          La plateforme qui rend vos données ESG <strong>auditables, traçables et faciles à consolider</strong> — en partant d'Excel.
        </p>
      </div>

      {/* Progress Bar */}
      {completedSteps.length > 0 && (
        <Card className="border-[#059669]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-[#0A3B2E]">Votre progression</p>
                <p className="text-sm text-muted-foreground">
                  {completedSteps.length} sur {onboardingSteps.length} étapes complétées
                </p>
              </div>
              <div className="text-3xl font-bold text-[#059669]">
                {progressPercentage}%
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-[#059669] to-[#047857] h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="getting-started" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="getting-started">
            <Rocket className="h-4 w-4 mr-2" />
            Démarrage
          </TabsTrigger>
          <TabsTrigger value="use-cases">
            <Lightbulb className="h-4 w-4 mr-2" />
            Cas d'usage
          </TabsTrigger>
          <TabsTrigger value="resources">
            <Book className="h-4 w-4 mr-2" />
            Ressources
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Getting Started */}
        <TabsContent value="getting-started" className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[#0A3B2E] mb-2">
              Lancez-vous en 5 étapes simples
            </h2>
            <p className="text-muted-foreground">
              Suivez ce parcours guidé pour configurer votre environnement ESG en moins de 20 minutes
            </p>
          </div>

          <div className="grid gap-4">
            {onboardingSteps.map((step, index) => {
              const isComplete = isStepComplete(step.id);
              return (
                <Card
                  key={step.id}
                  className={`relative overflow-hidden transition-all border-2 ${
                    isComplete ? "border-green-500 bg-green-50/50" : "border-gray-200 hover:shadow-md hover:border-[#059669]"
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Step Number & Icon */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-xl bg-white border-2 border-gray-200 flex items-center justify-center relative">
                          {isComplete ? (
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                          ) : (
                            <step.icon className="h-8 w-8 text-[#0A3B2E]" />
                          )}
                          <div className="absolute -top-2 -left-2 w-8 h-8 bg-[#0A3B2E] text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-[#0A3B2E] mb-1">
                              {step.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {step.description}
                            </p>
                          </div>
                          <Badge variant="outline" className="ml-4 flex-shrink-0">
                            <Clock className="h-3 w-3 mr-1" />
                            {step.duration}
                          </Badge>
                        </div>

                        <Button
                          onClick={step.action}
                          variant={isComplete ? "outline" : "default"}
                          className={
                            isComplete
                              ? "mt-3"
                              : "bg-[#10B981] hover:bg-[#059669] mt-3"
                          }
                        >
                          {isComplete ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Terminé
                            </>
                          ) : (
                            <>
                              {step.buttonLabel}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions */}
          <Card className="bg-gradient-to-br from-[#E8F3F0] to-white border-[#059669]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#059669]" />
                Actions rapides
              </CardTitle>
              <CardDescription>
                Accédez directement aux fonctionnalités principales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  variant="outline"
                  className="h-auto flex-col gap-2 p-4"
                  onClick={() => onNavigate("dashboard")}
                >
                  <BarChart3 className="h-6 w-6 text-[#059669]" />
                  <span className="text-xs">Dashboard</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col gap-2 p-4"
                  onClick={() => onNavigate("packs")}
                >
                  <Package className="h-6 w-6 text-[#059669]" />
                  <span className="text-xs">Packs</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col gap-2 p-4"
                  onClick={() => onNavigate("import")}
                >
                  <Upload className="h-6 w-6 text-[#059669]" />
                  <span className="text-xs">Import</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col gap-2 p-4"
                  onClick={() => onNavigate("evidence-vault")}
                >
                  <Shield className="h-6 w-6 text-[#059669]" />
                  <span className="text-xs">Preuves</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Use Cases */}
        <TabsContent value="use-cases" className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[#0A3B2E] mb-2">
              Solvid.IA s'adapte à votre rôle
            </h2>
            <p className="text-muted-foreground">
              Découvrez comment la plateforme répond à vos besoins spécifiques
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {useCases.map((useCase) => (
              <Card key={useCase.role} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${useCase.bgColor} flex items-center justify-center mb-3`}>
                    <useCase.icon className={`h-6 w-6 ${useCase.color}`} />
                  </div>
                  <CardTitle className="text-lg">{useCase.role}</CardTitle>
                  <CardDescription>{useCase.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {useCase.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 3: Resources */}
        <TabsContent value="resources" className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[#0A3B2E] mb-2">
              Ressources pour réussir
            </h2>
            <p className="text-muted-foreground">
              Documentations, templates et formations pour maîtriser Solvid.IA
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <Card key={resource.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-[#E8F3F0] flex items-center justify-center mb-3">
                    <resource.icon className="h-6 w-6 text-[#059669]" />
                  </div>
                  <CardTitle className="text-lg">{resource.title}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="mb-4">
                    <Clock className="h-3 w-3 mr-1" />
                    {resource.duration}
                  </Badge>
                  <Button variant="outline" className="w-full">
                    Accéder
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Support Card */}
          <Card className="bg-gradient-to-br from-[#0A3B2E] to-[#0F4C3A] text-white">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-2">Besoin d'aide ?</h3>
              <p className="text-white/80 mb-6">
                Notre équipe est là pour vous accompagner dans votre mise en route
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="secondary">
                  Contacter le support
                </Button>
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  Voir la FAQ
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CTA Final */}
      {completedSteps.length === onboardingSteps.length && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-[#0A3B2E] mb-2">
              Félicitations ! 🎉
            </h3>
            <p className="text-muted-foreground mb-6">
              Vous avez terminé le parcours d'onboarding. Vous êtes prêt à exploiter tout le potentiel de Solvid.IA !
            </p>
            <Button
              onClick={() => onNavigate("dashboard")}
              className="bg-[#059669] hover:bg-[#047857]"
              size="lg"
            >
              Accéder au Dashboard
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}