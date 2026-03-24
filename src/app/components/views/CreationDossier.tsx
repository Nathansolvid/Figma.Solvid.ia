import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { 
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  TrendingUp,
  Shield,
  Users,
  Activity,
  Leaf,
  Scale,
  Zap,
} from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { useDossiers, type PeriodMode, type CustomPeriod } from "@/contexts/DossierContext";
import { toast } from "sonner";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { WORKFLOW_LIBRARY, WorkflowDefinition } from "@/utils/workflowLibrary";
import { GlossaryTooltip } from "@/app/components/ui/GlossaryTooltip";

type Step = 1 | 2 | 3 | 4 | 5;

/** Secteurs d'activité pour le questionnaire d'onboarding */
const SECTEURS = [
  "Agriculture / Agroalimentaire",
  "Industrie manufacturière",
  "Construction / BTP",
  "Commerce / Distribution",
  "Transport / Logistique",
  "Hébergement / Restauration",
  "Information / Communication / Tech",
  "Activités financières / Assurance",
  "Activités immobilières",
  "Services aux entreprises",
  "Enseignement / Formation",
  "Santé / Action sociale",
  "Énergie / Utilities",
  "Autre",
];

interface OnboardingAnswers {
  nbCollaborateurs: string;
  secteurActivite: string;
  soumisCsrd: "oui" | "non" | "ne_sais_pas" | "";
  experienceEsg: "jamais" | "partiellement" | "regulierement" | "";
  objectifPrincipal: "audit" | "reporting_volontaire" | "questionnaire_client" | "";
}

/** Recommande les workflows selon les réponses du questionnaire */
function getRecommendedWorkflows(answers: OnboardingAnswers): string[] {
  const recommended: string[] = [];
  const nbEmployees = parseInt(answers.nbCollaborateurs) || 0;

  // CSRD obligatoire → workflows réglementaires
  if (answers.soumisCsrd === "oui") {
    recommended.push("bilan-carbone", "conformite-csrd", "reporting-social");
  }

  // PME ou ne sait pas → VSME de base
  if (answers.soumisCsrd === "non" || answers.soumisCsrd === "ne_sais_pas" || nbEmployees < 250) {
    recommended.push("bilan-carbone", "diagnostic-esg");
  }

  // Expérience existante → ajouter des workflows avancés
  if (answers.experienceEsg === "regulierement") {
    if (!recommended.includes("conformite-csrd")) recommended.push("conformite-csrd");
    recommended.push("reporting-social");
  }

  // Objectif questionnaire client (EcoVadis)
  if (answers.objectifPrincipal === "questionnaire_client") {
    recommended.push("ecovadis-prep");
    if (!recommended.includes("diagnostic-esg")) recommended.push("diagnostic-esg");
  }

  // Objectif audit
  if (answers.objectifPrincipal === "audit") {
    if (!recommended.includes("conformite-csrd")) recommended.push("conformite-csrd");
  }

  // Toujours au moins le bilan carbone
  if (recommended.length === 0) {
    recommended.push("bilan-carbone", "diagnostic-esg");
  }

  return [...new Set(recommended)];
}

interface CreationDossierProps {
  onCancel: () => void;
  onComplete: (dossierId: string) => void;
}

export function CreationDossier({ onCancel, onComplete }: CreationDossierProps) {
  const { createDossier } = useDossiers();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    // Étape 1 - DISTINCTION PRIMAIRE : Type de mission (Conseil/Audit)
    name: "",
    clientOrg: "",
    fiscalYear: "2025",
    missionType: "Conseil" as "Conseil" | "Audit",

    // Étape 2 - Configuration mission
    providerOrg: "",
    leadConsultant: "",
    startDate: "",
    endDate: "",

    // Contexte réglementaire (automatique basé sur clientOrg, ou ESG par défaut)
    pathwayType: "ESG_Voluntary" as "CSRD_Mandatory" | "ESG_Voluntary",

    // Étape 4 - Workflows (remplace packType)
    selectedWorkflows: [] as string[], // IDs des workflows sélectionnés

    // Phase 12b - Fréquence de saisie
    periodMode: "annuel" as PeriodMode,
    customPeriods: [] as CustomPeriod[],
  });

  // 🆕 Questionnaire d'onboarding (étape 3)
  const [onboarding, setOnboarding] = useState<OnboardingAnswers>({
    nbCollaborateurs: "",
    secteurActivite: "",
    soumisCsrd: "",
    experienceEsg: "",
    objectifPrincipal: "",
  });

  const [conflictError, setConflictError] = useState(false);

  const handleNext = () => {
    // Validation étape 2 : vérifier conflit d'intérêts
    if (currentStep === 2) {
      const hasConflict = formData.providerOrg === "Cabinet ABC" && formData.missionType === "Audit";
      if (hasConflict) {
        setConflictError(true);
        return;
      }
    }

    // 🆕 Après le questionnaire (étape 3), pré-sélectionner les workflows recommandés
    if (currentStep === 3) {
      const recommended = getRecommendedWorkflows(onboarding);
      // Pré-sélectionner uniquement si l'utilisateur n'a pas encore choisi
      if (formData.selectedWorkflows.length === 0) {
        setFormData(prev => ({ ...prev, selectedWorkflows: recommended }));
      }
      // Si soumis CSRD → mettre le pathway en obligatoire
      if (onboarding.soumisCsrd === "oui") {
        setFormData(prev => ({ ...prev, pathwayType: "CSRD_Mandatory" }));
      }
    }

    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
      setConflictError(false);
    }
  };

  const handleCreate = () => {
    // 🆕 Create dossier with all form data
    const newDossierId = createDossier({
      name: formData.name,
      clientOrg: formData.clientOrg,
      fiscalYear: formData.fiscalYear,
      missionType: formData.missionType,
      pathwayType: formData.pathwayType,
      providerOrg: formData.providerOrg,
      leadConsultant: formData.leadConsultant,
      startDate: formData.startDate,
      endDate: formData.endDate,
      selectedWorkflows: formData.selectedWorkflows, // 🆕 Pass workflows instead of packType
      periodMode: formData.periodMode,
      customPeriods: formData.periodMode === 'personnalise' ? formData.customPeriods : undefined,
    });
    
    // 🔧 Improved toast message with clear action confirmation
    toast.success("✅ Dossier créé avec succès !", {
      description: `Le dossier "${formData.name}" est maintenant disponible dans votre liste.`
    });
    
    onComplete(newDossierId); // 🔧 Pass new dossier ID
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Créer un nouveau dossier</h1>
          <p className="text-muted-foreground">
            Initialisez votre dossier avec une mission Conseil ou Audit
          </p>
        </div>
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
      </div>

      {/* Stepper amélioré avec indicateurs visuels (5 étapes) */}
      <div className="flex items-center justify-center gap-0">
        {[1, 2, 3, 4, 5].map((step) => {
          const isCompleted = currentStep > step;
          const isActive = currentStep === step;
          const stepLabels = ["Informations", "Mission", "Profil ESG", "Parcours ESG", "Confirmation"];

          return (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? 'bg-[#059669] text-white shadow-md'
                    : isActive
                    ? 'bg-white border-[3px] border-[#059669] text-[#059669] shadow-lg'
                    : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isActive ? (
                    <div className="relative flex items-center justify-center">
                      <span className="absolute w-6 h-6 rounded-full bg-[#059669]/20 animate-ping" />
                      <span className="font-bold text-xs">{step}</span>
                    </div>
                  ) : (
                    <span className="font-semibold text-xs">{step}</span>
                  )}
                </div>
                <span className={`text-[11px] font-medium whitespace-nowrap ${
                  isCompleted
                    ? 'text-[#059669]'
                    : isActive
                    ? 'text-foreground font-semibold'
                    : 'text-muted-foreground'
                }`}>
                  {stepLabels[step - 1]}
                </span>
              </div>
              {step < 5 && (
                <div className={`w-12 h-0.5 mx-1.5 mt-[-18px] transition-colors duration-300 ${
                  currentStep > step ? 'bg-[#059669]' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Étape 1: Informations générales */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Informations générales du dossier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du dossier *</Label>
              <Input
                id="name"
                placeholder="Ex: Entreprise Example SAS - CSRD 2025"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientOrg">Organisation cliente *</Label>
              <Select 
                value={formData.clientOrg}
                onValueChange={(value) => setFormData({ ...formData, clientOrg: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une organisation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Entreprise Example SAS">Entreprise Example SAS</SelectItem>
                  <SelectItem value="Tech Innovate SARL">Tech Innovate SARL</SelectItem>
                  <SelectItem value="Green Energy Corp">Green Energy Corp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fiscalYear">Année de reporting *</Label>
              <Select 
                value={formData.fiscalYear}
                onValueChange={(value) => setFormData({ ...formData, fiscalYear: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-1">
                <GlossaryTooltip term="Mission">Type de mission</GlossaryTooltip> *
              </Label>
              <RadioGroup 
                value={formData.missionType}
                onValueChange={(value: "Conseil" | "Audit") => {
                  setFormData({ ...formData, missionType: value });
                  setConflictError(false);
                }}
              >
                <Card className={`cursor-pointer transition-all ${
                  formData.missionType === 'Conseil' 
                    ? 'border-[#059669] border-2' 
                    : 'border-border'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="Conseil" id="conseil" />
                      <div className="flex-1">
                        <Label htmlFor="conseil" className="cursor-pointer">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-5 w-5 text-[#059669]" />
                            <span className="font-semibold">Mission Conseil</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Construction du dossier, collecte de données, rédaction, consolidation 
                            et recommandations. Édition complète du contenu.
                          </p>
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`cursor-pointer transition-all ${
                  formData.missionType === 'Audit' 
                    ? 'border-orange-500 border-2' 
                    : 'border-border'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="Audit" id="audit" />
                      <div className="flex-1">
                        <Label htmlFor="audit" className="cursor-pointer">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="h-5 w-5 text-orange-600" />
                            <span className="font-semibold">Mission Audit</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Vérification de la conformité et de l'auditabilité. Lecture seule, 
                            tests, demandes de preuves, validation/rejet.
                          </p>
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </RadioGroup>
            </div>

            {/* 🆕 Phase 12b : Fréquence de saisie */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#059669]" />
                <GlossaryTooltip term="Fréquence de saisie" showIcon={false}>Fréquence de saisie</GlossaryTooltip> *
              </Label>
              <p className="text-xs text-muted-foreground -mt-1">
                À quelle fréquence souhaitez-vous collecter les données ESG ?
              </p>
              <RadioGroup
                value={formData.periodMode}
                onValueChange={(value: PeriodMode) =>
                  setFormData({ ...formData, periodMode: value, customPeriods: value === 'personnalise' ? formData.customPeriods : [] })
                }
              >
                {([
                  { value: 'annuel' as const, label: 'Annuel', desc: 'Saisie unique par exercice fiscal', icon: '📅' },
                  { value: 'trimestriel' as const, label: 'Trimestriel', desc: '4 trimestres — T1, T2, T3, T4', icon: '📊' },
                  { value: 'mensuel' as const, label: 'Mensuel', desc: '12 mois — Janvier à Décembre', icon: '📈' },
                  { value: 'personnalise' as const, label: 'Personnalisé', desc: 'Définir vos propres périodes', icon: '⚙️' },
                ]).map((opt) => (
                  <Card
                    key={opt.value}
                    className={`cursor-pointer transition-all ${
                      formData.periodMode === opt.value
                        ? 'border-[#059669] border-2'
                        : 'border-border'
                    }`}
                    onClick={() => setFormData({ ...formData, periodMode: opt.value, customPeriods: opt.value === 'personnalise' ? formData.customPeriods : [] })}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={opt.value} id={`period-${opt.value}`} />
                        <span className="text-base">{opt.icon}</span>
                        <div className="flex-1 min-w-0">
                          <Label htmlFor={`period-${opt.value}`} className="cursor-pointer font-semibold text-sm">
                            {opt.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">{opt.desc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </RadioGroup>

              {/* Éditeur de périodes personnalisées */}
              {formData.periodMode === 'personnalise' && (
                <Card className="border-dashed border-[#059669]/40">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm font-medium">Définir les périodes</p>
                    {formData.customPeriods.map((cp, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          className="w-24"
                          placeholder="ID (ex: S1)"
                          value={cp.id}
                          onChange={(e) => {
                            const updated = [...formData.customPeriods];
                            updated[idx] = { ...cp, id: e.target.value.replace(/::/g, '') };
                            setFormData({ ...formData, customPeriods: updated });
                          }}
                        />
                        <Input
                          className="flex-1"
                          placeholder="Label (ex: Semestre 1)"
                          value={cp.label}
                          onChange={(e) => {
                            const updated = [...formData.customPeriods];
                            updated[idx] = { ...cp, label: e.target.value };
                            setFormData({ ...formData, customPeriods: updated });
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                          onClick={() => {
                            const updated = formData.customPeriods.filter((_, i) => i !== idx);
                            setFormData({ ...formData, customPeriods: updated });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          customPeriods: [
                            ...formData.customPeriods,
                            { id: `P${formData.customPeriods.length + 1}`, label: '' },
                          ],
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter une période
                    </Button>
                    {formData.customPeriods.length === 0 && (
                      <p className="text-xs text-orange-600">Au moins une période est requise</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 2: Mission */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration de la mission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {conflictError && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-900">Conflit d'intérêts détecté</p>
                      <p className="text-sm text-red-700 mt-1">
                        Impossible de créer cette mission. L'organisation "Cabinet ABC" a déjà une 
                        mission Conseil active sur ce dossier. Une même organisation ne peut pas être 
                        à la fois conseil et audit sur le même dossier (règle CSRD).
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label htmlFor="providerOrg">Organisation prestataire *</Label>
              <Select 
                value={formData.providerOrg}
                onValueChange={(value) => {
                  setFormData({ ...formData, providerOrg: value });
                  setConflictError(false);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une organisation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Interne">Interne</SelectItem>
                  <SelectItem value="Cabinet ABC">Cabinet ABC (Conseil)</SelectItem>
                  <SelectItem value="Audit Partners">Audit Partners (Audit)</SelectItem>
                  <SelectItem value="ESG Consulting">ESG Consulting (Conseil)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leadConsultant">Responsable de mission *</Label>
              <Select 
                value={formData.leadConsultant}
                onValueChange={(value) => setFormData({ ...formData, leadConsultant: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un responsable" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sophie">Sophie Martin (Consultant)</SelectItem>
                  <SelectItem value="thomas">Thomas Dubois (Consultant)</SelectItem>
                  <SelectItem value="marie">Marie Laurent (Auditeur)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin prévue</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 3: Questionnaire d'onboarding */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Profil ESG de votre entreprise</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Répondez à ces questions pour que nous puissions vous recommander les référentiels les plus adaptés.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Q1: Nombre de collaborateurs */}
            <div className="space-y-2">
              <Label htmlFor="nbCollaborateurs" className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#059669]" />
                1. Nombre de collaborateurs (ETP)
              </Label>
              <Input
                id="nbCollaborateurs"
                type="number"
                placeholder="Ex: 50"
                value={onboarding.nbCollaborateurs}
                onChange={(e) => setOnboarding({ ...onboarding, nbCollaborateurs: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                {parseInt(onboarding.nbCollaborateurs) >= 250
                  ? "→ Grande entreprise : référentiels CSRD/ESRS probablement applicables"
                  : parseInt(onboarding.nbCollaborateurs) > 0
                  ? "→ PME : le standard VSME simplifié est recommandé"
                  : ""}
              </p>
            </div>

            {/* Q2: Secteur d'activité */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#059669]" />
                2. Secteur d'activité
              </Label>
              <Select
                value={onboarding.secteurActivite}
                onValueChange={(value) => setOnboarding({ ...onboarding, secteurActivite: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner votre secteur" />
                </SelectTrigger>
                <SelectContent>
                  {SECTEURS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Q3: Soumis à la CSRD ? */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#059669]" />
                3. Êtes-vous soumis à la CSRD ?
              </Label>
              <RadioGroup
                value={onboarding.soumisCsrd}
                onValueChange={(v) => setOnboarding({ ...onboarding, soumisCsrd: v as OnboardingAnswers["soumisCsrd"] })}
                className="flex flex-wrap gap-3"
              >
                {[
                  { value: "oui", label: "Oui" },
                  { value: "non", label: "Non" },
                  { value: "ne_sais_pas", label: "Je ne sais pas" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 border rounded-lg px-4 py-2.5 cursor-pointer transition-all ${
                      onboarding.soumisCsrd === opt.value
                        ? "border-[#059669] bg-[#E8F3F0] border-2"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <RadioGroupItem value={opt.value} />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* Q4: Expérience ESG */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#059669]" />
                4. Avez-vous déjà fait du reporting ESG ?
              </Label>
              <RadioGroup
                value={onboarding.experienceEsg}
                onValueChange={(v) => setOnboarding({ ...onboarding, experienceEsg: v as OnboardingAnswers["experienceEsg"] })}
                className="flex flex-wrap gap-3"
              >
                {[
                  { value: "jamais", label: "Jamais" },
                  { value: "partiellement", label: "Partiellement" },
                  { value: "regulierement", label: "Oui, régulièrement" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 border rounded-lg px-4 py-2.5 cursor-pointer transition-all ${
                      onboarding.experienceEsg === opt.value
                        ? "border-[#059669] bg-[#E8F3F0] border-2"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <RadioGroupItem value={opt.value} />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* Q5: Objectif principal */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#059669]" />
                5. Quel est votre objectif principal ?
              </Label>
              <RadioGroup
                value={onboarding.objectifPrincipal}
                onValueChange={(v) => setOnboarding({ ...onboarding, objectifPrincipal: v as OnboardingAnswers["objectifPrincipal"] })}
                className="space-y-2"
              >
                {[
                  { value: "audit", label: "Audit & conformité réglementaire", desc: "CSRD, ESRS, vérification par un tiers" },
                  { value: "reporting_volontaire", label: "Reporting ESG volontaire", desc: "Bilan carbone, rapport RSE, communication" },
                  { value: "questionnaire_client", label: "Réponse à un questionnaire client", desc: "EcoVadis, CDP, demande investisseur" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-all ${
                      onboarding.objectifPrincipal === opt.value
                        ? "border-[#059669] bg-[#E8F3F0] border-2"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <RadioGroupItem value={opt.value} className="mt-0.5" />
                    <div>
                      <span className="text-sm font-medium">{opt.label}</span>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 4: Workflows */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1">
              Sélection des <GlossaryTooltip term="Workflow">parcours ESG</GlossaryTooltip>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Choisissez un ou plusieurs parcours ESG adaptés à vos besoins. Chaque parcours comprend des modèles Excel pré-configurés.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 🆕 Recommandation basée sur le questionnaire */}
            {formData.selectedWorkflows.length > 0 && onboarding.objectifPrincipal && (
              <Card className="border-[#059669] bg-[#E8F3F0]">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-[#059669] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-[#0A3B2E]">
                        Parcours recommandés selon votre profil
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Nous avons pré-sélectionné {formData.selectedWorkflows.length} parcours basés sur vos réponses.
                        Vous pouvez les modifier librement.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {WORKFLOW_LIBRARY.map((workflow: WorkflowDefinition) => {
                  const isSelected = formData.selectedWorkflows.includes(workflow.id);
                  const getCategoryColor = () => {
                    switch (workflow.category) {
                      case 'Environnement': return 'bg-green-500';
                      case 'Social': return 'bg-blue-500';
                      case 'Gouvernance': return 'bg-purple-500';
                      case 'Transverse': return 'bg-orange-500';
                      case 'Réglementaire': return 'bg-red-500';
                      default: return 'bg-gray-500';
                    }
                  };

                  return (
                    <Card 
                      key={workflow.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isSelected ? 'border-2 border-[#059669] bg-[#E8F3F0]' : 'border-2 border-transparent'
                      }`}
                      onClick={() => {
                        setFormData({
                          ...formData,
                          selectedWorkflows: isSelected
                            ? formData.selectedWorkflows.filter(id => id !== workflow.id)
                            : [...formData.selectedWorkflows, workflow.id]
                        });
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'bg-[#059669] text-white' : 'bg-gray-100 text-gray-400'
                          }`}>
                            {isSelected ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <span className="text-2xl">{workflow.icon}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-sm">{workflow.name}</p>
                              <Badge className={`${getCategoryColor()} text-white text-xs`}>
                                {workflow.category}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {workflow.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {workflow.templatesRequired.length} modèles
                              </Badge>
                              {workflow.regulatory && (
                                <Badge className="bg-red-500 text-white text-xs">
                                  Réglementaire
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {formData.selectedWorkflows.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-blue-900">
                      {formData.selectedWorkflows.length} parcours ESG sélectionné{formData.selectedWorkflows.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Vous pourrez toujours ajouter ou retirer des parcours ESG plus tard dans votre dossier.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 5: Confirmation */}
      {currentStep === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Récapitulatif</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nom du dossier</p>
                <p className="font-semibold">{formData.name || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Organisation cliente</p>
                <p className="font-semibold">{formData.clientOrg || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Année de reporting</p>
                <p className="font-semibold">{formData.fiscalYear}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Type de mission</p>
                <Badge variant="outline">
                  Mission {formData.missionType}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Organisation prestataire</p>
                <p className="font-semibold">{formData.providerOrg || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Responsable</p>
                <p className="font-semibold">{formData.leadConsultant || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Fréquence de saisie</p>
                <Badge variant="outline" className="capitalize">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formData.periodMode === 'personnalise'
                    ? `Personnalisé (${formData.customPeriods.length} période${formData.customPeriods.length > 1 ? 's' : ''})`
                    : formData.periodMode}
                </Badge>
                {formData.periodMode === 'personnalise' && formData.customPeriods.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.customPeriods.map(cp => (
                      <Badge key={cp.id} variant="secondary" className="text-xs">{cp.label || cp.id}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Parcours ESG sélectionnés</p>
                {formData.selectedWorkflows.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.selectedWorkflows.map((workflowId) => {
                      const workflow = WORKFLOW_LIBRARY.find(w => w.id === workflowId);
                      return workflow ? (
                        <Badge key={workflowId} className="bg-[#059669] text-white">
                          <Activity className="h-3 w-3 mr-1" />
                          {workflow.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>

            <Card className="bg-[#E8F3F0] border-[#059669]">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#059669] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Prêt à créer</p>
                    <p className="text-sm text-muted-foreground">
                      Le dossier sera créé avec les informations ci-dessus. Vous pourrez ensuite 
                      lancer la campagne d'<GlossaryTooltip term="Double matérialité" showIcon={false}>analyse d'impact croisée</GlossaryTooltip> et commencer la collecte de données.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {currentStep === 1 && (!formData.name || !formData.clientOrg) && (
          <p className="text-sm text-amber-600 flex items-center gap-1.5 justify-end">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            Renseignez le nom du dossier et l'organisation cliente pour continuer.
          </p>
        )}
        {currentStep === 2 && (!formData.providerOrg || !formData.leadConsultant || !formData.startDate) && (
          <p className="text-sm text-amber-600 flex items-center gap-1.5 justify-end">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            Renseignez le cabinet, le consultant et la date de début pour continuer.
          </p>
        )}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Précédent
        </Button>

        {currentStep < 5 ? (
          <Button
            className="bg-[#0F4C3A] hover:bg-[#0A3B2E]"
            onClick={handleNext}
            disabled={
              (currentStep === 1 && (!formData.name || !formData.clientOrg)) ||
              (currentStep === 2 && (!formData.providerOrg || !formData.leadConsultant || !formData.startDate))
            }
          >
            Suivant
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button 
            className="bg-[#059669] hover:bg-[#047857]"
            onClick={handleCreate}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Créer le dossier
          </Button>
        )}
      </div>
      </div>
    </div>
  );
}