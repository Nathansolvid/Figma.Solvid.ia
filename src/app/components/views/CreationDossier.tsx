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
import { useDossiers } from "@/contexts/DossierContext";
import { toast } from "sonner";
import { WORKFLOW_LIBRARY, WorkflowDefinition } from "@/utils/workflowLibrary";

type Step = 1 | 2 | 3 | 4;

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
    
    // Étape 3 - Workflows (remplace packType)
    selectedWorkflows: [] as string[], // IDs des workflows sélectionnés
  });

  const [conflictError, setConflictError] = useState(false);

  const handleNext = () => {
    // Validation étape 2 : vérifier conflit d'intérêts
    if (currentStep === 2) {
      // Simulation de vérification
      const hasConflict = formData.providerOrg === "Cabinet ABC" && formData.missionType === "Audit";
      if (hasConflict) {
        setConflictError(true);
        return;
      }
    }
    
    if (currentStep < 4) {
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
      selectedWorkflows: formData.selectedWorkflows // 🆕 Pass workflows instead of packType
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

      {/* Stepper */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= step 
                  ? 'bg-[#059669] text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > step ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <span className="font-semibold">{step}</span>
                )}
              </div>
              <span className={`font-medium ${
                currentStep >= step ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {step === 1 && "Informations"}
                {step === 2 && "Mission"}
                {step === 3 && "Workflows"}
                {step === 4 && "Confirmation"}
              </span>
            </div>
            {step < 4 && (
              <ChevronRight className="h-5 w-5 text-muted-foreground mx-4" />
            )}
          </div>
        ))}
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
                  <SelectItem value="example-sas">Entreprise Example SAS</SelectItem>
                  <SelectItem value="tech-innovate">Tech Innovate SARL</SelectItem>
                  <SelectItem value="green-energy">Green Energy Corp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fiscalYear">Année fiscale *</Label>
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
              <Label>Type de mission *</Label>
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

      {/* Étape 3: Workflows */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Sélection des workflows</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Choisissez un ou plusieurs workflows ESG adaptés à vos besoins. Chaque workflow comprend des templates Excel pré-configurés.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
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
                                {workflow.templatesRequired.length} templates
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
                      {formData.selectedWorkflows.length} workflow{formData.selectedWorkflows.length > 1 ? 's' : ''} sélectionné{formData.selectedWorkflows.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Vous pourrez toujours ajouter ou retirer des workflows plus tard dans votre dossier.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 4: Confirmation */}
      {currentStep === 4 && (
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
                <p className="text-sm text-muted-foreground mb-1">Année fiscale</p>
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
                <p className="text-sm text-muted-foreground mb-1">Workflows sélectionnés</p>
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
                      lancer la campagne de double matérialité et commencer la collecte de données.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button 
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Précédent
        </Button>
        
        {currentStep < 4 ? (
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
  );
}