import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { 
  FileCheck,
  TrendingUp,
  Users,
  Shield,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Info
} from "lucide-react";

type ParcoursType = "csrd-obligatoire" | "esg-structure" | null;
type PostureType = "conseil" | "pre-audit" | "audit-externe" | null;

interface OnboardingPostureProps {
  onComplete: (parcours: ParcoursType, posture: PostureType) => void;
}

export function OnboardingPosture({ onComplete }: OnboardingPostureProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [parcours, setParcours] = useState<ParcoursType>(null);
  const [posture, setPosture] = useState<PostureType>(null);

  const handleContinue = () => {
    if (step === 1 && parcours) {
      setStep(2);
    } else if (step === 2 && posture) {
      onComplete(parcours, posture);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F3F0] to-white flex items-center justify-center p-8">
      <div className="max-w-5xl w-full space-y-6">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#0F4C3A] mb-3">
            Solvid<span className="text-[#059669]">.IA</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Configuration de votre espace de travail ESG & CSRD
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#059669]' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-[#059669] text-white' : 'bg-gray-200'
            }`}>
              {step > 1 ? <CheckCircle2 className="h-5 w-5" /> : <span className="font-semibold">1</span>}
            </div>
            <span className="font-medium">Parcours réglementaire</span>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#059669]' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-[#059669] text-white' : 'bg-gray-200'
            }`}>
              {step > 2 ? <CheckCircle2 className="h-5 w-5" /> : <span className="font-semibold">2</span>}
            </div>
            <span className="font-medium">Posture d'utilisation</span>
          </div>
        </div>

        {/* Étape 1 : Choix du parcours */}
        {step === 1 && (
          <div className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Quel est votre contexte réglementaire ?</CardTitle>
                <p className="text-muted-foreground mt-2">
                  Ce choix détermine le niveau d'exigence, les livrables et l'auditabilité attendue
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* CSRD Obligatoire */}
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    parcours === 'csrd-obligatoire' 
                      ? 'border-[#0F4C3A] border-2 bg-[#E8F3F0]' 
                      : 'border-border hover:border-[#0F4C3A]'
                  }`}
                  onClick={() => setParcours('csrd-obligatoire')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-[#0F4C3A] p-3 rounded-lg">
                        <FileCheck className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-semibold">CSRD Obligatoire</h3>
                          <Badge className="bg-[#0F4C3A] text-white">Conformité stricte</Badge>
                        </div>
                        <p className="text-muted-foreground mb-4">
                          Vous êtes soumis à la directive CSRD et devez produire une déclaration de durabilité conforme aux normes ESRS.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-[#0F4C3A]">Niveau d'exigence</p>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-[#059669]" />
                                <span>Double matérialité obligatoire</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-[#059669]" />
                                <span>Mapping normatif strict ESRS</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-[#059669]" />
                                <span>Exhaustivité des data points</span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-[#0F4C3A]">Traçabilité</p>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-[#059669]" />
                                <span>Sources obligatoires</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-[#059669]" />
                                <span>Méthodologies documentées</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-[#059669]" />
                                <span>Audit-ready complet</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white border border-[#0F4C3A] rounded-lg p-3">
                          <p className="text-sm font-medium text-[#0F4C3A]">
                            📋 Livrable : Déclaration de durabilité CSRD complète + Dossier d'audit
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ESG Structuré / Préparation */}
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    parcours === 'esg-structure' 
                      ? 'border-[#059669] border-2 bg-[#E8F3F0]' 
                      : 'border-border hover:border-[#059669]'
                  }`}
                  onClick={() => setParcours('esg-structure')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-[#059669] p-3 rounded-lg">
                        <TrendingUp className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-semibold">ESG Structuré / Préparation CSRD</h3>
                          <Badge className="bg-[#059669] text-white">Reporting volontaire</Badge>
                        </div>
                        <p className="text-muted-foreground mb-4">
                          Vous souhaitez produire un reporting ESG structuré pour vos investisseurs, banques ou préparer la future conformité CSRD.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-[#059669]">Niveau d'exigence</p>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-[#059669]" />
                                <span>Matérialité simplifiée</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-[#059669]" />
                                <span>Sélection guidée des enjeux</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-[#059669]" />
                                <span>Données clés uniquement</span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-[#059669]">Traçabilité</p>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-[#059669]" />
                                <span>Sources recommandées</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-[#059669]" />
                                <span>Méthodologies allégées</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-[#059669]" />
                                <span>Fiable et crédible</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white border border-[#059669] rounded-lg p-3">
                          <p className="text-sm font-medium text-[#059669]">
                            📊 Livrable : Rapport ESG investisseurs + Préparation CSRD
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button 
                className="bg-[#0F4C3A] hover:bg-[#0A3B2E] px-8"
                size="lg"
                disabled={!parcours}
                onClick={handleContinue}
              >
                Continuer
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Étape 2 : Choix de la posture */}
        {step === 2 && (
          <div className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Quelle est votre posture d'utilisation ?</CardTitle>
                <p className="text-muted-foreground mt-2">
                  Ce choix détermine les fonctionnalités actives, le niveau de détail et les contrôles affichés
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mode Conseil */}
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    posture === 'conseil' 
                      ? 'border-[#059669] border-2 bg-[#E8F3F0]' 
                      : 'border-border hover:border-[#059669]'
                  }`}
                  onClick={() => setPosture('conseil')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-[#059669] p-3 rounded-lg">
                        <Users className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">Mode Conseil / Préparation</h3>
                          <Badge className="bg-[#059669] text-white">Construction</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Vous construisez le dossier, collectez les données, rédigez et consolidez les informations.
                        </p>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="font-medium mb-1">Fonctionnalités</p>
                            <p className="text-muted-foreground">Édition complète, imports, workflows</p>
                          </div>
                          <div>
                            <p className="font-medium mb-1">Vue prioritaire</p>
                            <p className="text-muted-foreground">Avancement, tâches, alertes</p>
                          </div>
                          <div>
                            <p className="font-medium mb-1">Contrôles</p>
                            <p className="text-muted-foreground">Validation interne</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Mode Pré-audit */}
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    posture === 'pre-audit' 
                      ? 'border-[#F59E0B] border-2 bg-amber-50' 
                      : 'border-border hover:border-[#F59E0B]'
                  }`}
                  onClick={() => setPosture('pre-audit')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-[#F59E0B] p-3 rounded-lg">
                        <AlertCircle className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">Mode Pré-audit (Auditabilité interne)</h3>
                          <Badge className="bg-[#F59E0B] text-white">Vérification</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Vous vérifiez la qualité et l'auditabilité de votre dossier avant audit externe.
                        </p>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="font-medium mb-1">Fonctionnalités</p>
                            <p className="text-muted-foreground">Édition + contrôles qualité</p>
                          </div>
                          <div>
                            <p className="font-medium mb-1">Vue prioritaire</p>
                            <p className="text-muted-foreground">Score auditabilité, gaps</p>
                          </div>
                          <div>
                            <p className="font-medium mb-1">Contrôles</p>
                            <p className="text-muted-foreground">Sources, méthodologies</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Mode Audit externe */}
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    posture === 'audit-externe' 
                      ? 'border-orange-600 border-2 bg-orange-50' 
                      : 'border-border hover:border-orange-600'
                  }`}
                  onClick={() => setPosture('audit-externe')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-orange-600 p-3 rounded-lg">
                        <Shield className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">Mode Audit externe (Commissaire aux comptes)</h3>
                          <Badge className="bg-orange-600 text-white">Certification</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Vous auditez un dossier client avec accès lecture, drill-down et outils de vérification guidée.
                        </p>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="font-medium mb-1">Fonctionnalités</p>
                            <p className="text-muted-foreground">Lecture seule + commentaires</p>
                          </div>
                          <div>
                            <p className="font-medium mb-1">Vue prioritaire</p>
                            <p className="text-muted-foreground">Tests, échantillons, preuves</p>
                          </div>
                          <div>
                            <p className="font-medium mb-1">Contrôles</p>
                            <p className="text-muted-foreground">Validation/rejet audit</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Info box */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-900">
                        <strong>Bon à savoir :</strong> Vous pourrez changer de posture à tout moment selon votre besoin. 
                        Les données restent identiques, seule l'interface et les fonctionnalités s'adaptent.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button 
                variant="outline"
                size="lg"
                onClick={() => setStep(1)}
              >
                Retour
              </Button>
              <Button 
                className="bg-[#059669] hover:bg-[#047857] px-8"
                size="lg"
                disabled={!posture}
                onClick={handleContinue}
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Créer mon espace de travail
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
