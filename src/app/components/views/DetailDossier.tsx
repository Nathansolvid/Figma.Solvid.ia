import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { 
  FolderOpen,
  Calendar,
  Users,
  ArrowLeft,
  FileText,
  TrendingUp,
  CheckCircle2,
  Activity,
  Upload,
  PlayCircle,
  ListChecks,
  FileSpreadsheet,
} from "lucide-react";
import { DoubleMaterialite } from "@/app/components/views/DoubleMaterialite";
import { DoubleMaterialiteNew } from "@/app/components/views/DoubleMaterialiteNew";
import { StructureIndicateurs } from "@/app/components/views/StructureIndicateurs";
import { DonneesQuantitatives } from "@/app/components/views/DonneesQuantitatives";
import { DonneesQualitatives } from "@/app/components/views/DonneesQualitatives";
import { DonneesQualitativesNew } from "@/app/components/views/DonneesQualitativesNew";
import { Collaboration } from "@/app/components/views/Collaboration";
import { ReportingAudit } from "@/app/components/views/ReportingAudit";
import { ExportsAudit } from "@/app/components/views/ExportsAudit";
import { useDossiers } from "@/contexts/DossierContext"; // 🆕 Import useDossiers
import { useUser } from "@/contexts/UserContext"; // 🆕 Import useUser
import { Role } from "@/permissions"; // 🆕 Import Role

interface DetailDossierProps {
  dossierId: string;
  onBack: () => void;
}

export function DetailDossier({ dossierId, onBack }: DetailDossierProps) {
  // 🔧 Debug: Log before accessing context
  console.log('🔍 DetailDossier rendering for dossier:', dossierId);
  
  const { getDossier } = useDossiers(); // 🆕 Get getDossier from context
  const { currentUser } = useUser(); // 🆕 Get current user
  const [activeTab, setActiveTab] = useState("overview");

  // 🆕 Get dossier from context instead of mock data
  const dossier = getDossier(dossierId);
  
  console.log('📂 Dossier data:', dossier); // 🔧 Debug log

  // 🆕 If dossier not found, show error
  if (!dossier) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Dossier non trouvé (ID: {dossierId})
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 🆕 Check if dossier is new (created recently, no data yet)
  const isNewDossier = () => {
    const createdDate = new Date(dossier.createdAt);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
    // Consider "new" if created within last 24 hours
    return hoursSinceCreation < 24;
  };

  const dossierIsNew = isNewDossier();

  // 🆕 Map user role to posture for DoubleMaterialite
  const getPostureFromRole = (): "conseil" | "pre-audit" | "audit-externe" => {
    if (!currentUser) return "conseil";
    
    switch (currentUser.role) {
      case Role.CONSULTANT:
      case Role.CLIENT_OWNER:
      case Role.CLIENT_CONTRIBUTOR:
        return "conseil";
      case Role.AUDITOR:
        return "audit-externe";
      case Role.ADMIN:
        return "pre-audit";
      default:
        return "conseil";
    }
  };

  // 🆕 Map pathwayType to parcours for DoubleMaterialite
  const parcours = dossier.pathwayType === "CSRD_Mandatory" 
    ? "csrd-obligatoire" as const
    : "esg-structure" as const;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold text-foreground">{dossier.name}</h1>
              <Badge className={
                dossier.missionType === 'Conseil'
                  ? "bg-[#059669] text-white" 
                  : "bg-orange-500 text-white"
              }>
                Mission {dossier.missionType}
              </Badge>
              <Badge variant="outline">
                {dossier.fiscalYear}
              </Badge>
              <Badge className="bg-blue-100 text-blue-800">
                {dossier.status === 'active' ? 'En cours' : dossier.status === 'draft' ? 'Brouillon' : 'Complété'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <FolderOpen className="h-4 w-4" />
                <span>{dossier.providerOrg}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{dossier.leadConsultant}</span> {/* 🔧 Use leadConsultant instead of responsable */}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Créé le {new Date(dossier.createdAt).toLocaleDateString('fr-FR')}</span> {/* 🔧 Format date properly */}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            Paramètres
          </Button>
          <Button className="bg-[#0F4C3A] hover:bg-[#0A3B2E]">
            Générer un rapport
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="dma">Double Matérialité</TabsTrigger>
          <TabsTrigger value="mapping">Structure indicateurs</TabsTrigger>
          <TabsTrigger value="quantitatives">Données Quanti</TabsTrigger>
          <TabsTrigger value="qualitatives">Données Quali</TabsTrigger>
          <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
          <TabsTrigger value="audit">Exports & Audit</TabsTrigger>
        </TabsList>

        {/* Onglet Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          {dossierIsNew ? (
            /* 🆕 Empty state pour nouveau dossier */
            <div className="space-y-6">
              {/* Message de bienvenue */}
              <Card className="border-2 border-[#059669] bg-[#E8F3F0]">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-[#059669] p-3 rounded-lg">
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">Dossier créé avec succès !</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Votre dossier <strong>{dossier.name}</strong> est maintenant prêt. 
                        Suivez les étapes ci-dessous pour commencer à structurer vos données ESG.
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">Mission {dossier.missionType}</Badge>
                        <Badge variant="outline">{dossier.fiscalYear}</Badge>
                        <Badge className={dossier.pathwayType === 'CSRD_Mandatory' ? "bg-[#0F4C3A] text-white" : "bg-[#059669] text-white"}>
                          {dossier.pathwayType === 'CSRD_Mandatory' ? 'CSRD Obligatoire' : 'ESG Volontaire'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Étapes recommandées */}
              <Card>
                <CardHeader>
                  <CardTitle>Prochaines étapes recommandées</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Workflows sélectionnés */}
                  {dossier.selectedWorkflows && dossier.selectedWorkflows.length > 0 && (
                    <div className="p-4 border-2 border-[#059669] bg-[#E8F3F0] rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="h-5 w-5 text-[#059669]" />
                        <h4 className="font-semibold">Workflows sélectionnés</h4>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {dossier.selectedWorkflows.map((workflowId) => (
                          <Badge key={workflowId} className="bg-[#059669] text-white">
                            {workflowId}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Ces workflows définissent les templates Excel à télécharger et compléter.
                      </p>
                    </div>
                  )}

                  {/* Étape 1: Télécharger les templates */}
                  <div className="flex items-start gap-4 p-4 border-2 border-dashed border-[#059669] rounded-lg hover:bg-[#E8F3F0] transition-colors">
                    <div className="bg-[#059669] text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold flex-shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileSpreadsheet className="h-5 w-5 text-[#059669]" />
                        <h4 className="font-semibold">Télécharger les templates Excel</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Accédez à la bibliothèque de templates et téléchargez ceux correspondant à vos workflows sélectionnés.
                        Complétez-les avec vos données.</p>
                      <Button 
                        className="bg-[#059669] hover:bg-[#047857]"
                        onClick={() => {
                          // TODO: Navigation vers bibliothèque templates
                          console.log('Navigate to templates library');
                        }}
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Accéder aux templates
                      </Button>
                    </div>
                  </div>

                  {/* Étape 2: Double Matérialité */}
                  <div className="flex items-start gap-4 p-4 border border-border rounded-lg">
                    <div className="bg-gray-300 text-gray-600 rounded-full w-8 h-8 flex items-center justify-center font-semibold flex-shrink-0">
                      2
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-gray-600" />
                        <h4 className="font-semibold text-gray-700">Lancer la Double Matérialité</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Identifiez et priorisez vos enjeux ESG matériels selon les attentes des parties prenantes 
                        et les impacts financiers.
                      </p>
                      <Button 
                        variant="outline"
                        onClick={() => setActiveTab("dma")}
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Accéder à la DMA
                      </Button>
                    </div>
                  </div>

                  {/* Étape 3: Import données */}
                  <div className="flex items-start gap-4 p-4 border border-border rounded-lg">
                    <div className="bg-gray-300 text-gray-600 rounded-full w-8 h-8 flex items-center justify-center font-semibold flex-shrink-0">
                      3
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Upload className="h-5 w-5 text-gray-600" />
                        <h4 className="font-semibold text-gray-700">Importer vos données Excel</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Importez vos données existantes depuis Excel/CSV avec mapping automatique vers les indicateurs ESG.
                      </p>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          // TODO: Navigation vers import
                          console.log('Navigate to import');
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Importer des données
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ressources utiles */}
              <Card>
                <CardHeader>
                  <CardTitle>Ressources utiles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-[#0F4C3A]" />
                      <div>
                        <p className="font-medium text-sm">Guide de démarrage</p>
                        <p className="text-xs text-muted-foreground">Comment structurer votre reporting ESG</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-[#0F4C3A]" />
                      <div>
                        <p className="font-medium text-sm">Template Excel de collecte</p>
                        <p className="text-xs text-muted-foreground">Modèle pré-formaté pour vos équipes</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Vue d'ensemble normale avec données */
            <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Conformité {dossier.pathwayType === 'CSRD_Mandatory' ? 'CSRD' : 'ESG'}</p>
                    <p className="text-3xl font-semibold">78%</p> {/* 🔧 Use hardcoded value for now */}
                  </div>
                  <div className="bg-[#E8F3F0] p-3 rounded-lg">
                    <FileText className="h-5 w-5 text-[#0F4C3A]" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div>
                  <p className="text-sm text-muted-foreground">Normes applicables</p>
                  <p className="text-3xl font-semibold">8</p>
                  <p className="text-xs text-muted-foreground mt-1">ESRS E1-E5, S1, G1</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div>
                  <p className="text-sm text-muted-foreground">Data points</p>
                  <p className="text-3xl font-semibold">142/180</p>
                  <p className="text-xs text-muted-foreground mt-1">79% complétés</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div>
                  <p className="text-sm text-muted-foreground">Preuves uploadées</p>
                  <p className="text-3xl font-semibold">87</p>
                  <p className="text-xs text-muted-foreground mt-1">Documents justificatifs</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Avancement par norme */}
          <Card>
            <CardHeader>
              <CardTitle>Avancement par norme ESRS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { code: "ESRS E1", name: "Changement climatique", progress: 92, status: "good" },
                { code: "ESRS E3", name: "Ressources en eau", progress: 78, status: "good" },
                { code: "ESRS E5", name: "Économie circulaire", progress: 65, status: "warning" },
                { code: "ESRS S1", name: "Personnel", progress: 88, status: "good" },
                { code: "ESRS S2", name: "Travailleurs chaîne de valeur", progress: 45, status: "danger" },
                { code: "ESRS G1", name: "Gouvernance", progress: 82, status: "good" },
              ].map((norm) => (
                <div key={norm.code} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-[#0F4C3A]">{norm.code}</span>
                      <span className="text-sm">{norm.name}</span>
                    </div>
                    <span className="text-sm font-medium">{norm.progress}%</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full ${
                        norm.status === 'good' ? 'bg-[#059669]' :
                        norm.status === 'warning' ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${norm.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Timeline workflow */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline du projet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { date: "10 Jan 2026", event: "Création du dossier", status: "completed" },
                  { date: "12 Jan 2026", event: "Campagne DMA lancée", status: "completed" },
                  { date: "18 Jan 2026", event: "DMA validée - 18 enjeux matériels", status: "completed" },
                  { date: "19 Jan 2026", event: "Début collecte données", status: "completed" },
                  { date: "En cours", event: "Collecte et consolidation", status: "in-progress" },
                  { date: "Prévu 10 Fév", event: "Prêt pour audit", status: "upcoming" },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className={`w-3 h-3 rounded-full mt-1 ${
                      item.status === 'completed' ? 'bg-[#059669]' :
                      item.status === 'in-progress' ? 'bg-blue-500' :
                      'bg-gray-300'
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium">{item.event}</p>
                      <p className="text-sm text-muted-foreground">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle>Actions recommandées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-amber-50">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Compléter les données Scope 3</p>
                    <p className="text-sm text-muted-foreground">12 postes d'émissions manquants</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setActiveTab("quantitatives")}>
                  Compléter
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-[#0F4C3A] mt-0.5" />
                  <div>
                    <p className="font-medium">Finaliser sections qualitatives S2</p>
                    <p className="text-sm text-muted-foreground">3 data points à rédiger</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setActiveTab("qualitatives")}>
                  Rédiger
                </Button>
              </div>
            </CardContent>
          </Card>
            </>
          )}
        </TabsContent>

        {/* Autres onglets */}
        <TabsContent value="dma">
          <DoubleMaterialiteNew posture={getPostureFromRole()} parcours={parcours} dossierId={dossierId} />
        </TabsContent>

        <TabsContent value="mapping">
          <StructureIndicateurs />
        </TabsContent>

        <TabsContent value="quantitatives">
          <DonneesQuantitatives />
        </TabsContent>

        <TabsContent value="qualitatives">
          <DonneesQualitativesNew posture={getPostureFromRole()} dossierId={dossierId} />
        </TabsContent>

        <TabsContent value="collaboration">
          <Collaboration posture={getPostureFromRole()} parcours="esg-structure" />
        </TabsContent>

        <TabsContent value="audit">
          <ExportsAudit posture={getPostureFromRole()} dossierId={dossierId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}