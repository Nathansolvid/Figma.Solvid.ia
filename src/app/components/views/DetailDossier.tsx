import { useState, useEffect, useMemo } from "react";
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
  TrendingDown,
  CheckCircle2,
  Activity,
  Upload,
  FileSpreadsheet,
  PenLine,
  Sparkles,
  Download,
  ChevronRight,
  Leaf,
  Heart,
  Shield,
  Trash2,
  ShieldCheck,
  ClipboardCheck,
  AlertTriangle,
  FileDown,
  Minus,
  BookOpen,
  Plus,
  X,
  BarChart2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog";
import { WORKFLOW_LIBRARY } from "@/utils/workflowLibrary";
import { DoubleMaterialiteNew } from "@/app/components/views/DoubleMaterialiteNew";
import { StructureIndicateurs } from "@/app/components/views/StructureIndicateurs";
import { DonneesQuantitatives } from "@/app/components/views/DonneesQuantitatives";
import { DonneesQualitativesNew } from "@/app/components/views/DonneesQualitativesNew";
import { Collaboration } from "@/app/components/views/Collaboration";
import { ExportsAudit } from "@/app/components/views/ExportsAudit";
import { ProuvesRequises } from "@/app/components/views/ProuvesRequises";
import { WorkflowEvidenceChecklist } from "@/app/components/views/WorkflowEvidenceChecklist";
import { GlossaryTooltip } from "@/app/components/ui/GlossaryTooltip";
import { useDossiers } from "@/contexts/DossierContext";
import { useUser } from "@/contexts/UserContext";
import { useVSMEData } from "@/contexts/VSMEDataContext";
import { useEvidence } from "@/hooks/useEvidence";
import { Role } from "@/permissions";
import { getWorkflowById, getWorkflowEvidenceCount } from "@/utils/workflowLibrary";
import { getPeriodsForDossier, getPreviousPeriod, getPreviousPeriodInList, DEFAULT_PERIOD } from "@/services/idbService";
import { MODULE_B } from "@/data/vsme-data";

/** Seuil d'alerte configurable pour la revue de cohérence (%) */
const COHERENCE_THRESHOLD = 30;

interface DetailDossierProps {
  dossierId: string;
  onBack: () => void;
  onNavigate?: (view: string) => void; // 🆕 Navigation vers saisie / rapport IA / templates
}

// Mapping des IDs template vers des labels lisibles
const TEMPLATE_LABELS: Record<string, string> = {
  "emissions-scope1": "Émissions Scope 1",
  "emissions-scope2": "Émissions Scope 2",
  "emissions-scope3": "Émissions Scope 3",
  "consommation-energie": "Consommation Énergie",
  "dechets": "Gestion Déchets",
  "consommation-eau": "Consommation Eau",
  "effectifs": "Effectifs & RH",
  "formation": "Formation",
  "sante-securite": "Santé & Sécurité",
  "remuneration": "Rémunération",
  "structure-gouvernance": "Structure Gouvernance",
  "ethique-conformite": "Éthique & Conformité",
  "risques-esg": "Risques ESG",
  "chaine-valeur": "Chaîne de valeur",
  "strategie-esg": "Stratégie ESG",
};

const PILIER_COLOR = { E: "#2d7a55", S: "#1a5f8a", G: "#6c3483" } as const;

const CATEGORY_COLOR: Record<string, string> = {
  Environnement: "#2d7a55",
  Social: "#1a5f8a",
  Gouvernance: "#6c3483",
  Transverse: "#64748b",
  Réglementaire: "#b45309",
};

const DIFFICULTY_COLOR: Record<string, string> = {
  Débutant: "#2d7a55",
  Intermédiaire: "#f59e0b",
  Avancé: "#dc2626",
};

export function DetailDossier({ dossierId, onBack, onNavigate }: DetailDossierProps) {
  const { getDossier, updateDossier } = useDossiers();
  const { currentUser } = useUser();
  const { getStats, getStatsByPilier, loadDossier, clearDossier, getActivePeriod, getValueComparison, getValues } = useVSMEData();
  const [activeTab, setActiveTab] = useState("overview");
  const [confirmReset, setConfirmReset] = useState(false);
  const [showAddReferentiel, setShowAddReferentiel] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  // 🆕 Charger les données VSME de ce dossier au montage
  useEffect(() => {
    loadDossier(dossierId);
  }, [dossierId]); // eslint-disable-line react-hooks/exhaustive-deps

  const dossier = getDossier(dossierId);

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

  // 🆕 Stats VSME réelles (période active)
  const activePeriod = getActivePeriod(dossierId);
  const vsmeStats = getStats(dossierId, "B", activePeriod);
  const pilierStats = getStatsByPilier(dossierId, activePeriod);
  const isNewDossier = vsmeStats.filled === 0;

  // 🆕 Preuves pour calcul de la timeline
  const { evidence } = useEvidence(dossierId);

  // 🆕 Timeline de progression : 5 étapes dynamiques
  const timelineSteps = (() => {
    const wfIds = dossier?.selectedWorkflows || [];
    const hasWorkflows = wfIds.length > 0;
    const hasData = vsmeStats.filled > 0;
    const dataComplete = vsmeStats.pct >= 80;
    const hasProofs = evidence.length > 0;
    const proofsSufficient = evidence.length >= 3; // au moins 3 preuves déposées
    const reportReady = dataComplete && proofsSufficient;

    type StepStatus = "completed" | "active" | "future";
    const steps: { label: string; desc: string; status: StepStatus }[] = [
      {
        label: "Création",
        desc: "Dossier créé",
        status: "completed" as StepStatus, // toujours complété (on est sur le detail)
      },
      {
        label: "Référentiels",
        desc: hasWorkflows ? `${wfIds.length} parcours sélectionné${wfIds.length > 1 ? "s" : ""}` : "Choisir les parcours ESG",
        status: hasWorkflows ? "completed" : "active",
      },
      {
        label: "Saisie données",
        desc: hasData ? `${vsmeStats.pct}% complété (${vsmeStats.filled}/${vsmeStats.total})` : "Remplir les indicateurs",
        status: dataComplete ? "completed" : hasWorkflows && hasData ? "active" : hasWorkflows ? "active" : "future",
      },
      {
        label: "Preuves",
        desc: hasProofs ? `${evidence.length} justificatif${evidence.length > 1 ? "s" : ""} déposé${evidence.length > 1 ? "s" : ""}` : "Déposer les justificatifs",
        status: proofsSufficient ? "completed" : hasData ? "active" : "future",
      },
      {
        label: "Rapport",
        desc: reportReady ? "Prêt à générer" : "Rapport IA",
        status: reportReady ? "active" : "future",
      },
    ];
    // If step 2 is completed but step 3 is still future, make step 3 active
    // Find the first non-completed step and make it active
    let foundActive = false;
    return steps.map((s) => {
      if (s.status === "completed") return s;
      if (!foundActive) {
        foundActive = true;
        return { ...s, status: "active" as StepStatus };
      }
      return { ...s, status: "future" as StepStatus };
    });
  })();

  // 🆕 Phase 12b : label période enrichi + mode
  const periodMode = dossier.periodMode ?? 'annuel';
  const periods = getPeriodsForDossier(dossier.fiscalYear, periodMode, dossier.customPeriods);
  const currentPeriodDef = periods.find(p => p.id === activePeriod);
  const periodLabel = currentPeriodDef?.label
    ?? (activePeriod.includes('-T')
      ? `T${activePeriod.split('-T')[1]} ${activePeriod.split('-')[0]}`
      : activePeriod.includes('-M')
        ? activePeriod
        : `Exercice ${activePeriod}`);
  const periodModeLabels: Record<string, string> = {
    annuel: 'Annuel',
    trimestriel: 'Trimestriel',
    mensuel: 'Mensuel',
    personnalise: 'Personnalisé',
  };

  // 🆕 Revue de cohérence : calcul des anomalies inter-périodes
  const previousPeriod = useMemo(() => {
    if (periodMode === 'personnalise') {
      return getPreviousPeriodInList(activePeriod, periods);
    }
    return getPreviousPeriod(activePeriod);
  }, [activePeriod, periodMode, periods]);

  // Charger la période précédente pour les comparaisons
  useEffect(() => {
    if (previousPeriod) {
      loadDossier(dossierId, previousPeriod);
    }
  }, [dossierId, previousPeriod, loadDossier]);

  // Justifications d'anomalies (stocké localement pour la maquette)
  const [anomalyJustifications, setAnomalyJustifications] = useState<Record<string, string>>({});

  type AnomalyItem = {
    code: string;
    intitule: string;
    pilier: string;
    section: string;
    unite: string;
    valueN1: string;
    valueN: string;
    delta: number;
    deltaPct: number;
  };

  const anomalies = useMemo<AnomalyItem[]>(() => {
    if (!previousPeriod) return [];
    const result: AnomalyItem[] = [];
    for (const section of MODULE_B) {
      for (const dp of section.datapoints) {
        if (dp.type === "Narratif" || dp.type === "Qualitatif") continue;
        const comparison = getValueComparison(dossierId, dp.code, previousPeriod, activePeriod);
        if (comparison.deltaPct !== null && Math.abs(comparison.deltaPct) > COHERENCE_THRESHOLD) {
          result.push({
            code: dp.code,
            intitule: dp.intitule,
            pilier: dp.pilier,
            section: section.section_id,
            unite: dp.unite ?? "",
            valueN1: comparison.value1,
            valueN: comparison.value2,
            delta: comparison.delta!,
            deltaPct: comparison.deltaPct,
          });
        }
      }
    }
    return result;
  }, [dossierId, previousPeriod, activePeriod, getValueComparison]);

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

  const parcours =
    dossier.pathwayType === "CSRD_Mandatory"
      ? ("csrd-obligatoire" as const)
      : ("esg-structure" as const);

  // 🆕 Résoudre les workflows depuis la bibliothèque
  const workflowIds = dossier.selectedWorkflows || [];
  const workflows = workflowIds
    .map((id) => getWorkflowById(id))
    .filter(Boolean) as ReturnType<typeof getWorkflowById>[];

  return (
    <div className="space-y-6">
      {/* ── En-tête ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold text-foreground">{dossier.name}</h1>
              <Badge
                className={
                  dossier.missionType === "Conseil"
                    ? "bg-[#059669] text-white"
                    : "bg-orange-500 text-white"
                }
              >
                Mission {dossier.missionType}
              </Badge>
              <Badge variant="outline">{dossier.fiscalYear}</Badge>
              <Badge className="bg-emerald-100 text-emerald-800">
                {periodLabel}
              </Badge>
              {periodMode !== 'annuel' && (
                <Badge className="bg-violet-100 text-violet-800">
                  {periodModeLabels[periodMode] ?? periodMode} · {periods.length} périodes
                </Badge>
              )}
              <Badge className="bg-blue-100 text-blue-800">
                {dossier.status === "active"
                  ? "En cours"
                  : dossier.status === "draft"
                  ? "Brouillon"
                  : "Complété"}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <FolderOpen className="h-4 w-4" />
                <span>{dossier.providerOrg}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{dossier.leadConsultant}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  Créé le {new Date(dossier.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 🆕 Actions principales dans l'en-tête */}
        <div className="flex gap-2 items-center">
          {/* Reset données */}
          {!confirmReset ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-600 hover:bg-red-50"
              onClick={() => setConfirmReset(true)}
              title="Réinitialiser les données saisies"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-xs text-red-600 font-medium">Vider les données ?</span>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-xs px-2"
                onClick={async () => { await clearDossier(dossierId); await loadDossier(dossierId); setConfirmReset(false); }}
              >
                Oui
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs px-2"
                onClick={() => setConfirmReset(false)}
              >
                Non
              </Button>
            </div>
          )}

          {workflowIds.length === 0 ? (
            <Button
              className="bg-[#0F4C3A] hover:bg-[#0A3B2E]"
              onClick={() => onNavigate?.("bibliotheque-workflows")}
            >
              <Activity className="h-4 w-4 mr-2" />
              Choisir les référentiels
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => onNavigate?.("saisie-dossier")}
            >
              <PenLine className="h-4 w-4 mr-2" />
              Saisir les données
            </Button>
          )}
          <Button
            className="bg-[#0F4C3A] hover:bg-[#0A3B2E]"
            onClick={() => onNavigate?.("rapport-ia")}
            disabled={vsmeStats.filled === 0}
            title={vsmeStats.filled === 0 ? "Remplissez d'abord des données" : undefined}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Rapport IA
          </Button>
        </div>
      </div>

      {/* ── Progress bar ── */}
      {(() => {
        const dossierValues = getValues(dossierId, activePeriod);
        const allDatapoints = MODULE_B.flatMap(s => s.datapoints).filter(dp => !dp.computed);
        const filledCount = allDatapoints.filter(dp => dossierValues.statuts[dp.code] === 'filled').length;
        const totalCount = allDatapoints.length;
        const pct = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;
        return (
          <div className="bg-white rounded-lg border p-3 mb-4">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="font-medium text-gray-700">Progression</span>
              <span className="font-bold" style={{ color: pct >= 80 ? '#059669' : pct >= 40 ? '#d97706' : '#6b7280' }}>
                {filledCount}/{totalCount} indicateurs — {pct}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: pct >= 80 ? '#059669' : pct >= 40 ? '#d97706' : '#94a3b8' }}
              />
            </div>
          </div>
        );
      })()}

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="referentiels" className="flex items-center gap-1">
            Référentiels
            {workflowIds.length > 0 && (
              <span className="ml-1 text-[10px] font-bold bg-[#059669] text-white rounded-full w-4 h-4 flex items-center justify-center">
                {workflowIds.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="dma">Double Matérialité</TabsTrigger>
          <TabsTrigger value="mapping">Structure données</TabsTrigger>
          <TabsTrigger value="quantitatives">Données Quanti</TabsTrigger>
          <TabsTrigger value="qualitatives">Données Quali</TabsTrigger>
          <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
          <TabsTrigger value="preuves">Preuves</TabsTrigger>
          <TabsTrigger value="audit">Exports & Audit</TabsTrigger>
        </TabsList>

        {/* ══════════════════════════════════════════════
            ONGLET VUE D'ENSEMBLE
        ══════════════════════════════════════════════ */}
        <TabsContent value="overview" className="space-y-6">

          {/* Banner nouveau dossier (0 indicateur rempli) */}
          {isNewDossier && (
            <Card className="border-2 border-[#059669] bg-[#E8F3F0]">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="bg-[#059669] p-2.5 rounded-lg flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Dossier créé avec succès !</h3>
                    <p className="text-sm text-muted-foreground">
                      <strong>{dossier.name}</strong> est prêt. Commencez par choisir vos référentiels ESG dans la bibliothèque.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">Mission {dossier.missionType}</Badge>
                      <Badge variant="outline">{dossier.fiscalYear}</Badge>
                      <Badge
                        className={
                          dossier.pathwayType === "CSRD_Mandatory"
                            ? "bg-[#0F4C3A] text-white"
                            : "bg-[#059669] text-white"
                        }
                      >
                        {dossier.pathwayType === "CSRD_Mandatory"
                          ? "CSRD Obligatoire"
                          : "ESG Volontaire"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats ESG réelles (4 cartes) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Progression globale */}
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  Progression globale
                </p>
                <p
                  className="text-3xl font-bold mb-2"
                  style={{
                    color:
                      vsmeStats.pct >= 80
                        ? "#2d7a55"
                        : vsmeStats.pct >= 40
                        ? "#f59e0b"
                        : "#9ca3af",
                  }}
                >
                  {vsmeStats.pct}%
                </p>
                <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${vsmeStats.pct}%`,
                      background:
                        vsmeStats.pct >= 80
                          ? "#2d7a55"
                          : vsmeStats.pct >= 40
                          ? "#f59e0b"
                          : "#9ca3af",
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {vsmeStats.filled} / {vsmeStats.total} <GlossaryTooltip term="Indicateur" showIcon={false}>données</GlossaryTooltip>
                </p>
              </CardContent>
            </Card>

            {/* Piliers E / S / G */}
            {(["E", "S", "G"] as const).map((pilier) => {
              const stats = pilierStats[pilier];
              const LABELS = { E: "Environnement", S: "Social", G: "Gouvernance" };
              const ICONS = {
                E: <Leaf className="h-4 w-4" />,
                S: <Heart className="h-4 w-4" />,
                G: <Shield className="h-4 w-4" />,
              };
              return (
                <Card key={pilier}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        <GlossaryTooltip term="Pilier ESG" showIcon={false}>{LABELS[pilier]}</GlossaryTooltip>
                      </p>
                      <span style={{ color: PILIER_COLOR[pilier] }}>
                        {ICONS[pilier]}
                      </span>
                    </div>
                    <p
                      className="text-3xl font-bold mb-2"
                      style={{ color: PILIER_COLOR[pilier] }}
                    >
                      {stats.pct}%
                    </p>
                    <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${stats.pct}%`,
                          background: PILIER_COLOR[pilier],
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {stats.filled} / {stats.total} <GlossaryTooltip term="Indicateur" showIcon={false}>données</GlossaryTooltip>
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Légende statuts */}
          <div className="flex items-center gap-5 text-[11px] mt-2" style={{ color: "#9ca3af" }}>
            <span>Légende :</span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#2d7a55" }} /> {"\u2265"} 80% Complet
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#f59e0b" }} /> 40-79% En cours
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#d1d5db" }} /> &lt; 40% À démarrer
            </span>
          </div>

          {/* 🆕 Timeline de progression du dossier (5 étapes) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-[#059669]" />
                Progression du dossier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between relative">
                {/* Ligne de connexion horizontale */}
                <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-gray-200 z-0" />
                <div
                  className="absolute top-5 left-[10%] h-0.5 bg-[#059669] z-0 transition-all duration-500"
                  style={{
                    width: `${
                      (timelineSteps.filter((s) => s.status === "completed").length /
                        (timelineSteps.length - 1)) *
                      80
                    }%`,
                  }}
                />

                {timelineSteps.map((step, idx) => {
                  const isCompleted = step.status === "completed";
                  const isActive = step.status === "active";

                  return (
                    <div key={idx} className="flex flex-col items-center z-10 flex-1">
                      {/* Cercle indicateur */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isCompleted
                            ? "bg-[#059669] text-white shadow-md"
                            : isActive
                            ? "bg-white border-[3px] border-[#059669] text-[#059669] shadow-lg"
                            : "bg-gray-100 text-gray-400 border-2 border-gray-200"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : isActive ? (
                          <div className="relative flex items-center justify-center">
                            <span className="absolute w-7 h-7 rounded-full bg-[#059669]/20 animate-ping" />
                            <span className="font-bold text-sm">{idx + 1}</span>
                          </div>
                        ) : (
                          <span className="font-semibold text-sm">{idx + 1}</span>
                        )}
                      </div>

                      {/* Label */}
                      <span
                        className={`text-xs font-medium mt-2 text-center ${
                          isCompleted
                            ? "text-[#059669]"
                            : isActive
                            ? "text-foreground font-semibold"
                            : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </span>

                      {/* Description */}
                      <span className="text-[10px] text-muted-foreground mt-0.5 text-center max-w-[100px]">
                        {step.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 🆕 CTA principales (2 cartes cliquables) */}
          <div className="grid grid-cols-2 gap-4">
            {workflowIds.length === 0 ? (
              <Card
                className="border-2 border-dashed border-[#0F4C3A] hover:bg-[#E8F3F0] transition-colors cursor-pointer"
                onClick={() => onNavigate?.("bibliotheque-workflows")}
              >
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="bg-[#0F4C3A] p-3 rounded-lg flex-shrink-0">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-0.5">Choisir vos référentiels</h4>
                    <p className="text-sm text-muted-foreground">
                      Sélectionnez les référentiels ESG à remplir pour ce dossier
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ) : (
              <Card
                className="border-2 border-dashed border-[#0F4C3A] hover:bg-[#E8F3F0] transition-colors cursor-pointer"
                onClick={() => onNavigate?.("saisie-dossier")}
              >
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="bg-[#0F4C3A] p-3 rounded-lg flex-shrink-0">
                    <PenLine className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-0.5">Saisir les données</h4>
                    <p className="text-sm text-muted-foreground">
                      Remplir les données E / S / G du dossier
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            )}

            <Card
              className={`border-2 border-dashed transition-colors ${
                vsmeStats.filled > 0
                  ? "border-[#6c3483] hover:bg-purple-50 cursor-pointer"
                  : "border-gray-200 opacity-60 cursor-not-allowed"
              }`}
              onClick={() => vsmeStats.filled > 0 && onNavigate?.("rapport-ia")}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div
                  className="p-3 rounded-lg flex-shrink-0"
                  style={{ background: vsmeStats.filled > 0 ? "#6c3483" : "#9ca3af" }}
                >
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-0.5">Générer un rapport IA</h4>
                  <p className="text-sm text-muted-foreground">
                    {vsmeStats.filled > 0
                      ? "Analyse ESG complète par Claude Sonnet"
                      : "Saisissez d'abord des données"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </div>

          {/* 🆕 Workflows réels du dossier */}
          {workflows.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#0F4C3A]" />
                  <GlossaryTooltip term="Workflow">Parcours</GlossaryTooltip> du dossier
                  <Badge variant="outline" className="ml-1">
                    {workflows.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {workflows.map((workflow) => {
                  if (!workflow) return null;
                  return (
                    <div
                      key={workflow.id}
                      className="border border-border rounded-lg p-4"
                    >
                      {/* En-tête workflow */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl leading-none">{workflow.icon}</span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold">{workflow.name}</h4>
                              <span
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                style={{
                                  background:
                                    CATEGORY_COLOR[workflow.category] + "18",
                                  color: CATEGORY_COLOR[workflow.category],
                                }}
                              >
                                {workflow.category}
                              </span>
                              <span
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                style={{
                                  background:
                                    DIFFICULTY_COLOR[workflow.difficulty] + "15",
                                  color: DIFFICULTY_COLOR[workflow.difficulty],
                                }}
                              >
                                {workflow.difficulty}
                              </span>
                              {workflow.regulatory && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                                  Réglementaire
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {workflow.description} · ⏱ {workflow.estimatedDuration}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const evCounts = getWorkflowEvidenceCount(workflow);
                            if (evCounts.mandatory > 0) {
                              return (
                                <span
                                  className="text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1"
                                  style={{ background: "#f0fdf4", color: "#2d7a55", border: "1px solid #bbf7d0" }}
                                >
                                  <ShieldCheck className="w-3 h-3" />
                                  {evCounts.mandatory} preuve{evCounts.mandatory > 1 ? "s" : ""} requise{evCounts.mandatory > 1 ? "s" : ""}
                                </span>
                              );
                            }
                            return null;
                          })()}
                          <Button
                            size="sm"
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={() => onNavigate?.(`workflow:${workflow.id}:saisie` as any)}
                          >
                            Remplir les indicateurs →
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onNavigate?.("bibliotheque-templates")}
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                            Templates
                          </Button>
                        </div>
                      </div>

                      {/* Templates requis */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Templates à compléter
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {workflow.templatesRequired.map((t) => (
                            <div
                              key={t}
                              className="flex items-center gap-1.5 bg-[#E8F3F0] rounded-md px-2.5 py-1 text-xs cursor-pointer hover:bg-[#d4eae0] transition-colors"
                              onClick={() => onNavigate?.("bibliotheque-templates")}
                            >
                              <Download className="h-3 w-3 text-[#0F4C3A]" />
                              <span className="font-medium text-[#0F4C3A]">
                                {TEMPLATE_LABELS[t] ?? t}
                              </span>
                            </div>
                          ))}
                          {workflow.templatesOptional.map((t) => (
                            <div
                              key={t}
                              className="flex items-center gap-1.5 bg-gray-50 border border-dashed border-gray-200 rounded-md px-2.5 py-1 text-xs cursor-pointer hover:bg-gray-100 transition-colors"
                              onClick={() => onNavigate?.("bibliotheque-templates")}
                            >
                              <Download className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-500">
                                {TEMPLATE_LABELS[t] ?? t}
                                <span className="italic ml-1">(optionnel)</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Activity className="h-10 w-10 mx-auto mb-3 opacity-25" />
                <p className="font-medium mb-1">Aucun parcours sélectionné</p>
                <p className="text-sm">
                  Les parcours définissent les modèles Excel à télécharger
                  et les données à remplir.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Accès rapide : templates + import */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-accent transition-colors">
              <div className="text-2xl leading-none flex-shrink-0">📥</div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1 text-sm">
                  Bibliothèque de templates Excel
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Téléchargez les fichiers pré-formatés pour collecter vos données ESG auprès de vos équipes.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate?.("bibliotheque-templates")}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                  Accéder aux templates
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-accent transition-colors">
              <div className="text-2xl leading-none flex-shrink-0">📤</div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1 text-sm">
                  Importer des données Excel
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Importez vos fichiers complétés avec mapping automatique vers
                  les données ESG du dossier.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate?.("import")}
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Importer des données
                </Button>
              </div>
            </div>
          </div>

          {/* 🆕 Revue de cohérence — Anomalies inter-périodes */}
          {previousPeriod && anomalies.length > 0 && (
            <Card className="border-amber-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Revue de cohérence
                    <Badge className="bg-amber-100 text-amber-800 ml-1">
                      {anomalies.length} anomalie{anomalies.length > 1 ? "s" : ""}
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      Seuil : ±{COHERENCE_THRESHOLD}% · {previousPeriod} → {activePeriod}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        // Export CSV
                        const headers = ["Code", "Indicateur", "Pilier", "Valeur N-1", "Valeur N", "Unité", "Écart %", "Justification"];
                        const rows = anomalies.map(a => [
                          a.code,
                          `"${a.intitule}"`,
                          a.pilier,
                          a.valueN1,
                          a.valueN,
                          a.unite,
                          `${a.deltaPct}%`,
                          `"${anomalyJustifications[a.code] ?? ""}"`,
                        ].join(";"));
                        const csv = [headers.join(";"), ...rows].join("\n");
                        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `revue-coherence-${dossierId}-${activePeriod}.csv`;
                        link.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <FileDown className="h-3 w-3 mr-1" />
                      Exporter CSV
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Indicateurs présentant un écart supérieur à ±{COHERENCE_THRESHOLD}% entre les deux dernières périodes.
                  Ajoutez une justification pour documenter chaque écart.
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b">
                        <th className="py-2.5 px-3 text-left text-xs font-semibold text-muted-foreground">Code</th>
                        <th className="py-2.5 px-3 text-left text-xs font-semibold text-muted-foreground">Indicateur</th>
                        <th className="py-2.5 px-3 text-center text-xs font-semibold text-muted-foreground">Pilier</th>
                        <th className="py-2.5 px-3 text-right text-xs font-semibold text-muted-foreground">N-1</th>
                        <th className="py-2.5 px-3 text-right text-xs font-semibold text-muted-foreground">N</th>
                        <th className="py-2.5 px-3 text-center text-xs font-semibold text-muted-foreground">Écart</th>
                        <th className="py-2.5 px-3 text-left text-xs font-semibold text-muted-foreground min-w-[200px]">Justification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {anomalies.map((anomaly) => {
                        const pilierColors: Record<string, string> = { E: "#2d7a55", S: "#1a5f8a", G: "#6c3483" };
                        const pilierLabels: Record<string, string> = { E: "Env", S: "Soc", G: "Gouv" };
                        const pColor = pilierColors[anomaly.pilier] ?? "#64748b";
                        return (
                          <tr key={anomaly.code} className="border-b last:border-b-0 hover:bg-amber-50/30 transition-colors">
                            <td className="py-2.5 px-3">
                              <span className="font-mono text-xs font-semibold text-muted-foreground">{anomaly.code}</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="text-sm">{anomaly.intitule}</span>
                              {anomaly.unite && (
                                <span className="ml-1 text-[10px] text-muted-foreground">({anomaly.unite})</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                style={{ background: pColor + "15", color: pColor }}
                              >
                                {pilierLabels[anomaly.pilier] ?? anomaly.pilier}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums text-sm">
                              {anomaly.valueN1 || "—"}
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums text-sm font-medium">
                              {anomaly.valueN || "—"}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className="inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{
                                  background: "#fef2f2",
                                  color: "#dc2626",
                                }}
                              >
                                <AlertTriangle className="w-3 h-3" />
                                {anomaly.deltaPct > 0 ? "+" : ""}{anomaly.deltaPct}%
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                className="w-full h-7 rounded px-2 text-xs transition-all outline-none"
                                style={{
                                  background: anomalyJustifications[anomaly.code] ? "#f0fdf4" : "#fefce8",
                                  border: `1.5px solid ${anomalyJustifications[anomaly.code] ? "#2d7a55" : "#fbbf24"}`,
                                  color: "#1a2e24",
                                }}
                                placeholder="Justifier cet écart…"
                                value={anomalyJustifications[anomaly.code] ?? ""}
                                onChange={(e) =>
                                  setAnomalyJustifications(prev => ({
                                    ...prev,
                                    [anomaly.code]: e.target.value,
                                  }))
                                }
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Résumé */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{anomalies.length} anomalie{anomalies.length > 1 ? "s" : ""} détectée{anomalies.length > 1 ? "s" : ""}</span>
                    <span>·</span>
                    <span>
                      {Object.values(anomalyJustifications).filter(v => v.trim()).length} justifiée{Object.values(anomalyJustifications).filter(v => v.trim()).length > 1 ? "s" : ""}
                    </span>
                    {anomalies.length > Object.values(anomalyJustifications).filter(v => v.trim()).length && (
                      <>
                        <span>·</span>
                        <span className="text-amber-600 font-medium">
                          {anomalies.length - Object.values(anomalyJustifications).filter(v => v.trim()).length} non justifiée{(anomalies.length - Object.values(anomalyJustifications).filter(v => v.trim()).length) > 1 ? "s" : ""}
                        </span>
                      </>
                    )}
                  </div>
                  <Badge
                    className={
                      Object.values(anomalyJustifications).filter(v => v.trim()).length >= anomalies.length
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }
                  >
                    {Object.values(anomalyJustifications).filter(v => v.trim()).length >= anomalies.length
                      ? "✅ Toutes justifiées"
                      : "⚠️ Justifications requises"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pas d'anomalies mais données présentes avec période précédente */}
          {previousPeriod && anomalies.length === 0 && vsmeStats.filled > 0 && (
            <Card className="border-green-200">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-green-800">Cohérence validée</h4>
                    <p className="text-xs text-muted-foreground">
                      Aucun écart supérieur à ±{COHERENCE_THRESHOLD}% entre {previousPeriod} et {activePeriod}.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions recommandées si données partielles */}
          {vsmeStats.filled > 0 && vsmeStats.pct < 100 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                  Actions recommandées
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(["E", "S", "G"] as const)
                  .filter((p) => pilierStats[p].pct < 100 && pilierStats[p].total > 0)
                  .map((pilier) => {
                    const labels = {
                      E: "Données Environnement",
                      S: "Données Sociales",
                      G: "Données Gouvernance",
                    };
                    const missing =
                      pilierStats[pilier].total - pilierStats[pilier].filled;
                    return (
                      <div
                        key={pilier}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                            style={{ background: PILIER_COLOR[pilier] }}
                          />
                          <div>
                            <p className="font-medium text-sm">
                              {labels[pilier]}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {missing} donnée{missing > 1 ? "s" : ""} manquante
                              {missing > 1 ? "s" : ""} ({pilierStats[pilier].pct}%)
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onNavigate?.("saisie-dossier")}
                        >
                          <FileText className="h-3.5 w-3.5 mr-1.5" />
                          Compléter
                        </Button>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════════════
            ONGLET RÉFÉRENTIELS
        ══════════════════════════════════════════════ */}
        <TabsContent value="referentiels" className="space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-[#0F4C3A]" />
              <h3 className="font-semibold text-lg">Référentiels actifs</h3>
              <Badge variant="outline">{workflowIds.length} sélectionné{workflowIds.length !== 1 ? "s" : ""}</Badge>
            </div>
            <Button
              className="bg-[#0F4C3A] hover:bg-[#0A3B2E]"
              onClick={() => setShowAddReferentiel(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un référentiel
            </Button>
          </div>

          {/* Liste des référentiels actifs */}
          {workflows.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-200">
              <CardContent className="p-10 text-center">
                <BookOpen className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-gray-600 mb-1">Aucun référentiel sélectionné</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Les référentiels définissent les indicateurs ESG à renseigner pour ce dossier.
                </p>
                <Button
                  className="bg-[#0F4C3A] hover:bg-[#0A3B2E]"
                  onClick={() => setShowAddReferentiel(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un référentiel
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {workflows.map((workflow) => {
                if (!workflow) return null;
                const wfSections = workflow.indicators || [];
                const isRemoving = confirmRemoveId === workflow.id;

                return (
                  <Card key={workflow.id} className="overflow-hidden">
                    {/* En-tête */}
                    <div className="flex items-start justify-between p-5 pb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-2xl leading-none flex-shrink-0">{workflow.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-semibold">{workflow.name}</h4>
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                              style={{ background: CATEGORY_COLOR[workflow.category] + "18", color: CATEGORY_COLOR[workflow.category] }}
                            >
                              {workflow.category}
                            </span>
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                              style={{ background: DIFFICULTY_COLOR[workflow.difficulty] + "15", color: DIFFICULTY_COLOR[workflow.difficulty] }}
                            >
                              {workflow.difficulty}
                            </span>
                            {workflow.regulatory && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                                Réglementaire
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {workflow.description} · ⏱ {workflow.estimatedDuration}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => onNavigate?.("saisie-dossier")}
                        >
                          <PenLine className="h-3.5 w-3.5 mr-1.5" />
                          Saisir
                        </Button>
                        {isRemoving ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-red-600 font-medium whitespace-nowrap">Retirer ?</span>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-xs px-2"
                              onClick={() => {
                                const updated = workflowIds.filter(id => id !== workflow.id);
                                updateDossier(dossierId, { selectedWorkflows: updated });
                                setConfirmRemoveId(null);
                              }}
                            >
                              Oui
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs px-2"
                              onClick={() => setConfirmRemoveId(null)}
                            >
                              Non
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setConfirmRemoveId(workflow.id)}
                            title="Retirer ce référentiel"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Sections VSME couvertes */}
                    {wfSections.length > 0 && (
                      <div className="px-5 pb-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Sections couvertes
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {wfSections.map(sectionId => (
                            <span
                              key={sectionId}
                              className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#E8F3F0] text-[#0F4C3A]"
                            >
                              {sectionId}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stats par période (si multi-périodes) */}
                    {periodMode !== 'annuel' && periods.length > 1 && (
                      <div className="px-5 pb-4 pt-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                          <BarChart2 className="h-3 w-3" />
                          Progression par période
                        </p>
                        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(periods.length, 4)}, minmax(0, 1fr))` }}>
                          {periods.map(period => {
                            const stats = getStats(dossierId, "B", period.id);
                            const pct = stats.pct;
                            const isActive = period.id === activePeriod;
                            return (
                              <div
                                key={period.id}
                                className={`rounded-lg p-2.5 border text-center transition-colors ${
                                  isActive ? "border-[#059669] bg-[#f0fdf4]" : "border-gray-100 bg-gray-50"
                                }`}
                              >
                                <p className="text-[11px] font-semibold text-muted-foreground mb-1 truncate">{period.label}</p>
                                <p
                                  className="text-lg font-bold"
                                  style={{ color: pct >= 80 ? "#2d7a55" : pct >= 40 ? "#f59e0b" : "#9ca3af" }}
                                >
                                  {pct}%
                                </p>
                                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden mt-1">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${pct}%`,
                                      background: pct >= 80 ? "#2d7a55" : pct >= 40 ? "#f59e0b" : "#9ca3af",
                                    }}
                                  />
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">{stats.filled}/{stats.total}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Preuves requises */}
                    {(workflow.requiredEvidence?.length ?? 0) > 0 && (
                      <div className="px-5 pb-4 border-t border-gray-100 pt-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Preuves requises ({workflow.requiredEvidence.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {workflow.requiredEvidence.slice(0, 4).map(ev => (
                            <span
                              key={ev.id}
                              className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100"
                            >
                              {ev.label}
                            </span>
                          ))}
                          {workflow.requiredEvidence.length > 4 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                              +{workflow.requiredEvidence.length - 4} autres
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {/* Accès rapide */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => onNavigate?.("bibliotheque-workflows")}>
              <Activity className="h-3.5 w-3.5 mr-1.5" />
              Bibliothèque complète
            </Button>
            <Button variant="outline" size="sm" onClick={() => onNavigate?.("bibliotheque-templates")}>
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
              Templates Excel
            </Button>
          </div>

          {/* Dialog ajout référentiel */}
          <Dialog open={showAddReferentiel} onOpenChange={setShowAddReferentiel}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#0F4C3A]" />
                  Ajouter un référentiel
                </DialogTitle>
                <DialogDescription>
                  Sélectionnez les référentiels ESG à activer pour ce dossier. Ils s'ajoutent aux référentiels déjà actifs.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                {WORKFLOW_LIBRARY.map(wf => {
                  const isActive = workflowIds.includes(wf.id);
                  return (
                    <div
                      key={wf.id}
                      className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                        isActive
                          ? "border-[#059669] bg-[#f0fdf4] opacity-60"
                          : "border-gray-200 hover:border-[#059669] hover:bg-[#f0fdf4] cursor-pointer"
                      }`}
                      onClick={() => {
                        if (isActive) return;
                        updateDossier(dossierId, { selectedWorkflows: [...workflowIds, wf.id] });
                        setShowAddReferentiel(false);
                      }}
                    >
                      <span className="text-2xl leading-none flex-shrink-0">{wf.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="font-semibold text-sm">{wf.name}</p>
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ background: CATEGORY_COLOR[wf.category] + "18", color: CATEGORY_COLOR[wf.category] }}
                          >
                            {wf.category}
                          </span>
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ background: DIFFICULTY_COLOR[wf.difficulty] + "15", color: DIFFICULTY_COLOR[wf.difficulty] }}
                          >
                            {wf.difficulty}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{wf.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">⏱ {wf.estimatedDuration} · {wf.indicators.length} sections</p>
                      </div>
                      <div className="flex-shrink-0">
                        {isActive ? (
                          <span className="text-xs font-semibold text-[#059669] bg-[#d1fae5] px-2 py-1 rounded-full">
                            Actif
                          </span>
                        ) : (
                          <Button size="sm" className="bg-[#0F4C3A] hover:bg-[#0A3B2E] h-8">
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Ajouter
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ── Autres onglets ── */}
        <TabsContent value="dma">
          <DoubleMaterialiteNew
            posture={getPostureFromRole()}
            parcours={parcours}
            dossierId={dossierId}
          />
        </TabsContent>

        <TabsContent value="mapping">
          <StructureIndicateurs />
        </TabsContent>

        <TabsContent value="quantitatives">
          <DonneesQuantitatives />
        </TabsContent>

        <TabsContent value="qualitatives">
          <DonneesQualitativesNew
            posture={getPostureFromRole()}
            dossierId={dossierId}
          />
        </TabsContent>

        <TabsContent value="collaboration">
          <Collaboration posture={getPostureFromRole()} parcours="esg-structure" dossierId={dossierId} />
        </TabsContent>

        <TabsContent value="preuves" className="space-y-6">
          {/* Preuves par workflow sélectionné */}
          {workflows.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardCheck className="h-5 w-5 text-[#0F4C3A]" />
                <h3 className="font-semibold text-lg">Preuves par parcours</h3>
                <Badge variant="outline">{workflows.length} parcours</Badge>
              </div>
              {workflows.map((workflow) => {
                if (!workflow || (workflow.requiredEvidence?.length ?? 0) === 0) return null;
                return (
                  <WorkflowEvidenceChecklist
                    key={workflow.id}
                    workflowId={workflow.id}
                    dossierId={dossierId}
                  />
                );
              })}
            </div>
          )}
          {/* Preuves VSME (indicateurs) */}
          <ProuvesRequises dossierId={dossierId} />
        </TabsContent>

        <TabsContent value="audit">
          <ExportsAudit posture={getPostureFromRole()} dossierId={dossierId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
