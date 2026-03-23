import React from "react";
import {
  LayoutDashboard,
  FolderOpen,
  Upload,
  CheckSquare,
  Search,
  History,
  Settings,
  Menu,
  LogOut,
  Activity,
  FileText,
  Shield,
  Plus,
  Sparkles,
  ClipboardCheck,
  BookOpen,
  Plug,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Database,
  BarChart3,
  Wrench,
  CircleHelp,
  FileSpreadsheet,
} from "lucide-react";
// Note: Some icons above are kept for future use (sidebar sub-views may re-use them)
import { useState, useRef, useEffect } from "react";
import { useDossiers } from "@/contexts/DossierContext";
import { useVSMEData } from "@/contexts/VSMEDataContext";
import { getWorkflowById, type WorkflowDefinition } from "@/utils/workflowLibrary";
import { MODULE_B, MODULE_C } from "@/data/vsme-data";
import { Role } from "@/permissions";
import { useUser } from "@/contexts/UserContext";
import { getRoleLabel } from "@/permissions";
import { Badge } from "@/app/components/ui/badge";
import { DashboardUniversal } from "@/app/components/views/DashboardUniversal";
import { ListeDossiers } from "@/app/components/views/ListeDossiers";
import { CreationDossier } from "@/app/components/views/CreationDossier";
import { DetailDossier } from "@/app/components/views/DetailDossier";
import { ImportCenter } from "@/app/components/views/ImportCenter";
import { DonneesQuantitatives } from "@/app/components/views/DonneesQuantitatives";
import { DonneesESG } from "@/app/components/views/DonneesESG";
import { EvidenceVault } from "@/app/components/views/EvidenceVault";
import { ChecklistWorkflow } from "@/app/components/views/ChecklistWorkflow";
import { ExportsLivrables } from "@/app/components/views/ExportsLivrables";
import { AuditCenter } from "@/app/components/views/AuditCenter";
import { Historique } from "@/app/components/views/Historique";
import { Parametres } from "@/app/components/views/Parametres";
import { AuthPageLocal } from "@/app/components/AuthPageLocal";
import { NotificationBell } from "@/app/components/NotificationBell";
import { SyncStatusBanner } from "@/app/components/features/SyncStatusBanner";
import { QuickStart } from "@/app/components/views/QuickStart";
import { BibliothequeWorkflows } from "@/app/components/views/BibliothequeWorkflows";
import { BibliothequeTemplates } from "@/app/components/views/BibliothequeTemplates";
import { VSMEFrameworks } from "@/app/components/views/VSMEFrameworks";
import { VSMEFrameworkDetail } from "@/app/components/views/VSMEFrameworkDetail";
import { SaisieDossier } from "@/app/components/views/SaisieDossier";
import { RapportIA } from "@/app/components/views/RapportIA";
import { PreuvesWorkflowView } from "@/app/components/views/PreuvesWorkflowView";
import { GuideAide } from "@/app/components/views/GuideAide";
import { ERPConnectorView } from "@/app/components/views/ERPConnectorView";
import { AIChatbot } from "@/app/components/AIChatbot";
import CGU from "@/app/components/views/CGU";
import PolitiqueConfidentialite from "@/app/components/views/PolitiqueConfidentialite";
import CookieConsent from "@/app/components/CookieConsent";

type ViewType =
  | "quick-start"
  | "dashboard"
  | "referentiels"
  | "vsme-detail"
  | "saisie-dossier"
  | "dossiers"
  | "creation-dossier"
  | "detail-dossier"
  | "rapport-ia"
  | "import"
  | "kpis"
  | "evidence-vault"
  | "checklist-workflow"
  | "exports-livrables"
  | "bibliotheque-workflows"
  | "bibliotheque-templates"
  | "audit-center"
  | "audit-trail"
  | "preuves-workflow"
  | "parametres"
  | "erp-connector"
  | "guide-aide"
  | "glossaire"
  | "cgu"
  | "politique-confidentialite";

const VIEW_LABELS: Record<ViewType, string> = {
  "quick-start": "Démarrage",
  "dashboard": "Tableau de bord",
  "referentiels": "Référentiels & Standards",
  "vsme-detail": "Standard",
  "saisie-dossier": "Saisie indicateurs",
  "dossiers": "Dossier actif",
  "creation-dossier": "Nouveau dossier",
  "detail-dossier": "Dossier",
  "rapport-ia": "Rapport IA",
  "import": "Import données",
  "kpis": "Chiffres clés",
  "evidence-vault": "Justificatifs",
  "checklist-workflow": "Suivi d'avancement",
  "exports-livrables": "Exports & Livrables",
  "bibliotheque-workflows": "Référentiels & Standards",
  "bibliotheque-templates": "Templates de collecte",
  "audit-center": "Contrôle qualité",
  "audit-trail": "Historique",
  "preuves-workflow": "Justificatifs",
  "parametres": "Réglages",
  "erp-connector": "Connecteurs ERP",
  "guide-aide": "Guide & Aide",
  "glossaire": "Glossaire ESG",
  "cgu": "Conditions Générales d'Utilisation",
  "politique-confidentialite": "Politique de Confidentialité",
};

// ── Circular progress ring (SVG) ────────────────────────────────────────────
function ProgressRing({ pct, color }: { pct: number; color: string }) {
  const r = 9;
  const circ = 2 * Math.PI * r; // ~56.55
  const offset = circ * (1 - Math.max(0, Math.min(100, pct || 0)) / 100);
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className="flex-shrink-0">
      <circle cx="12" cy="12" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
      <circle
        cx="12" cy="12" r={r}
        fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.4s ease' }}
      />
    </svg>
  );
}

// ── Badge config for workflow referentials ───────────────────────────────────
const WORKFLOW_BADGE: Record<string, { abbr: string; color: string }> = {
  'vsme':                   { abbr: 'V',   color: '#2D9D5F' },
  'bilan-carbone-complet':  { abbr: 'BC',  color: '#E07B39' },
  'diagnostic-energie':     { abbr: 'DE',  color: '#2980B9' },
  'gestion-dechets':        { abbr: 'GD',  color: '#6c3483' },
  'diagnostic-social':      { abbr: 'DS',  color: '#1a5f8a' },
  'sante-securite-travail': { abbr: 'SS',  color: '#f59e0b' },
  'diagnostic-gouvernance': { abbr: 'DG',  color: '#7c3aed' },
  'diagnostic-esg-pme':     { abbr: 'ESG', color: '#2d7a55' },
  'csrd-e1-climat':         { abbr: 'E1',  color: '#dc2626' },
  'csrd-s1-personnel':      { abbr: 'S1',  color: '#dc2626' },
  'questionnaire-banque':   { abbr: 'QB',  color: '#b45309' },
};

export function AppContent() {
  const { currentUser, setCurrentUser, logout, loading, initError } = useUser();

  const [currentView, setCurrentView] = useState<ViewType>(() => {
    (window as any).__solvid_current_page = "dashboard";
    return "dashboard";
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentDossierId, setCurrentDossierId] = useState<string | null>(null);
  const [navigationCounter, setNavigationCounter] = useState(0);
  // WelcomeModal removed — onboarding is now the auto-redirect to creation wizard

  // (legacy sidebar expand states — kept to avoid unused-variable errors)
  const [_referentielsExpanded] = useState(true);
  const [_dossiersExpanded] = useState(false);

  // Collapsible sidebar groups
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Current referentiel for detail view
  const [referentielId, setReferentielId] = useState<string>("vsme-complet");
  const [saisieDossierId, setSaisieDossierId] = useState<string | null>(null);
  const [rapportDossierId, setRapportDossierId] = useState<string | null>(null);

  // 🆕 Phase 11 : Workflow actif — chaque vue sait quel workflow est sélectionné
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);

  // 🆕 Référentiels sidebar — état open/closed
  const [openRefBlocks, setOpenRefBlocks] = useState<Set<string>>(new Set(['vsme']));
  const toggleRefBlock = (id: string) => {
    setOpenRefBlocks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const removeWorkflow = (workflowId: string) => {
    if (!activeDossier || !currentDossierId) return;
    const updated = (activeDossier.selectedWorkflows || []).filter(id => id !== workflowId);
    updateDossier(currentDossierId, { selectedWorkflows: updated });
  };

  // 🆕 Drop zone sidebar — ajouter un référentiel par drag-and-drop
  const [isDragOverAdd, setIsDragOverAdd] = useState(false);
  const handleDropAdd = (e: React.DragEvent) => {
    e.preventDefault();
    const refId = e.dataTransfer.getData('referentiel-id');
    if (refId && currentDossierId && activeDossier) {
      const current = activeDossier.selectedWorkflows || [];
      if (!current.includes(refId)) {
        updateDossier(currentDossierId, { selectedWorkflows: [...current, refId] });
      }
    }
    setIsDragOverAdd(false);
  };

  // Reset sidebar UI state when dossier changes
  useEffect(() => {
    setOpenRefBlocks(new Set(['vsme']));
    setActiveWorkflowId(null);
  }, [currentDossierId]);

  // 🆕 Données dossier actif pour la sidebar
  const { getDossier, updateDossier, dossiers } = useDossiers();

  // Auto-redirect to creation wizard if user has 0 dossiers
  useEffect(() => {
    if (!loading && dossiers.length === 0 && currentView === 'dashboard') {
      setCurrentView('creation-dossier');
    }
  }, [loading, dossiers.length, currentView]);
  const { getValues, getActivePeriod } = useVSMEData();
  const activeDossier = currentDossierId ? getDossier(currentDossierId) : null;
  const activeWorkflowDefs = (activeDossier?.selectedWorkflows || [])
    .map(id => getWorkflowById(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof getWorkflowById>>[];

  // Calcul des stats de complétion pour CHAQUE workflow (pas seulement VSME)
  const allSections = [...MODULE_B, ...MODULE_C];
  const getWorkflowStats = (wf: WorkflowDefinition) => {
    if (!currentDossierId) return { filled: 0, total: 0, pct: 0 };
    const activePeriod = getActivePeriod(currentDossierId);
    const dv = getValues(currentDossierId, activePeriod);
    // Filtrer les datapoints pour les sections de ce workflow
    const dps = allSections
      .filter(s => wf.indicators.includes(s.id))
      .flatMap(s => s.datapoints)
      .filter(dp => !dp.computed);
    const total = dps.length;
    const filled = dps.filter(dp => dv.statuts[dp.code] === 'filled').length;
    const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
    return { filled, total, pct };
  };

  const navigateToView = (view: ViewType) => {
    setCurrentView(view);
    // Expose current page for contextual AI suggestions
    (window as any).__solvid_current_page = view;
    // Store last visited view for "resume" feature
    if (view !== "dashboard" && view !== "quick-start" && currentDossierId) {
      const dossier = getDossier(currentDossierId);
      localStorage.setItem('solvid_last_view', JSON.stringify({
        view,
        dossierId: currentDossierId,
        dossierName: dossier?.providerOrg || dossier?.name || 'Dossier',
        timestamp: Date.now(),
      }));
    }
    if (view === "dashboard") {
      setNavigationCounter(prev => prev + 1);
    }
  };

  // 🆕 Phase 11 : Navigation avec contexte workflow
  const navigateToWorkflowView = (workflowId: string, view: ViewType) => {
    setActiveWorkflowId(workflowId);
    if (view === 'saisie-dossier') setSaisieDossierId(currentDossierId!);
    if (view === 'rapport-ia') setRapportDossierId(currentDossierId!);
    setCurrentView(view);
  };

  const navigateToReferentiel = (id: string) => {
    setReferentielId(id);
    navigateToView("vsme-detail");
  };

  const navigateToSaisie = (dossierId?: string) => {
    if (dossierId) setSaisieDossierId(dossierId);
    navigateToView("saisie-dossier");
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D7A55] mx-auto"></div>
          <p className="text-sm text-slate-600">Chargement de Solvid.IA...</p>
          <p className="text-xs text-slate-400">Initialisation des services...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="flex h-screen items-center justify-center bg-red-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur d'initialisation</h1>
          <p className="text-gray-700 mb-4">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Recharger la page
          </button>
        </div>
      </div>
    );
  }

  // En mode production, afficher la page d'authentification si pas connecté
  if (!currentUser) {
    // Allow viewing legal pages (CGU, Privacy) before authentication
    if (currentView === "cgu") {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#E8F3F0] to-white p-6">
          <button
            className="mb-4 text-sm text-[#059669] hover:underline"
            onClick={() => setCurrentView("dashboard")}
          >
            &larr; Retour à la connexion
          </button>
          <CGU onNavigate={(view) => setCurrentView(view as ViewType)} />
        </div>
      );
    }
    if (currentView === "politique-confidentialite") {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#E8F3F0] to-white p-6">
          <button
            className="mb-4 text-sm text-[#059669] hover:underline"
            onClick={() => setCurrentView("dashboard")}
          >
            &larr; Retour à la connexion
          </button>
          <PolitiqueConfidentialite onNavigate={(view) => setCurrentView(view as ViewType)} />
        </div>
      );
    }
    return (
      <AuthPageLocal
        onLogin={setCurrentUser}
        onNavigate={(view) => setCurrentView(view as ViewType)}
      />
    );
  }

  const handleCreateDossier = () => navigateToView("creation-dossier");

  const handleDossierCreated = (dossierId: string) => {
    setCurrentDossierId(dossierId);
    navigateToView("detail-dossier");
  };

  const handleOpenDossier = (dossierId: string) => {
    setCurrentDossierId(dossierId);
    navigateToView("detail-dossier");
  };

  const handleBackToDossiers = () => {
    setCurrentDossierId(null);
    navigateToView("dossiers");
  };

  const getPostureFromRole = (): "conseil" | "pre-audit" | "audit-externe" => {
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

  const isAuditorOrAdmin = [Role.AUDITOR, Role.ADMIN].includes(currentUser.role);
  const canAccessParams = [Role.CLIENT_OWNER, Role.CONSULTANT, Role.ADMIN].includes(currentUser.role);

  const renderView = () => {
    switch (currentView) {
      case "quick-start":
        return (
          <QuickStart
            onNavigate={navigateToView}
            userName={currentUser.name}
            organizationName={currentUser.organizationName}
          />
        );
      case "dashboard":
        // State 1: 0 dossiers — welcome + value props
        if (dossiers.length === 0) {
          return (
            <div className="max-w-3xl mx-auto p-6 space-y-8">
              {/* Hero banner */}
              <div className="rounded-2xl p-8 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0A3B2E 0%, #2D7A55 100%)' }}>
                <div className="relative z-10">
                  <h1 className="text-2xl font-bold mb-2">
                    Bienvenue, {currentUser.name}.
                  </h1>
                  <p className="text-white/80 text-sm mb-6 max-w-md">
                    Créez votre premier dossier ESG pour démarrer.
                  </p>
                  <button
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:shadow-lg"
                    style={{ background: 'white', color: '#0A3B2E' }}
                    onClick={() => navigateToView('creation-dossier')}
                  >
                    <Plus className="h-5 w-5" />
                    Créer un dossier
                  </button>
                </div>
                <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10 text-[120px] font-bold">ESG</div>
              </div>

              {/* 3 value prop cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: '#E8F5E9' }}>
                    <Upload className="h-5 w-5" style={{ color: '#2D7A55' }} />
                  </div>
                  <h3 className="font-semibold text-sm mb-1" style={{ color: '#0A3B2E' }}>Collecte structurée</h3>
                  <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>
                    47 indicateurs VSME pré-configurés, import Excel et connecteurs ERP
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: '#EFF6FF' }}>
                    <Shield className="h-5 w-5" style={{ color: '#3B82F6' }} />
                  </div>
                  <h3 className="font-semibold text-sm mb-1" style={{ color: '#0A3B2E' }}>Preuves traçables</h3>
                  <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>
                    Rattachez vos justificatifs à chaque indicateur avec audit trail
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: '#F5F3FF' }}>
                    <Sparkles className="h-5 w-5" style={{ color: '#7C3AED' }} />
                  </div>
                  <h3 className="font-semibold text-sm mb-1" style={{ color: '#0A3B2E' }}>Rapports audit-ready</h3>
                  <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>
                    Générez des rapports conformes CSRD assistés par IA
                  </p>
                </div>
              </div>
            </div>
          );
        }

        // State 3: 1+ dossiers but no dossier selected — show dossier list overview
        if (!currentDossierId) {
          // "Reprendre" card: read last view from localStorage
          const lastViewRaw = typeof window !== 'undefined' ? localStorage.getItem('solvid_last_view') : null;
          const lastView = lastViewRaw ? (() => { try { return JSON.parse(lastViewRaw); } catch { return null; } })() : null;
          const sevenDays = 7 * 24 * 60 * 60 * 1000;
          const showResume = lastView && (Date.now() - lastView.timestamp) < sevenDays && lastView.dossierId && lastView.view;
          const resumeViewLabel = showResume ? (VIEW_LABELS[lastView.view as ViewType] || lastView.view) : '';

          return (
            <div className="max-w-4xl mx-auto p-6 space-y-6">
              {/* Resume card */}
              {showResume && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-0 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-900">Reprendre votre travail</p>
                    <p className="text-xs text-emerald-700">Vous étiez sur {lastView.dossierName} — {resumeViewLabel}</p>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentDossierId(lastView.dossierId);
                      if (lastView.view === 'saisie-dossier') setSaisieDossierId(lastView.dossierId);
                      if (lastView.view === 'rapport-ia') setRapportDossierId(lastView.dossierId);
                      navigateToView(lastView.view as ViewType);
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Reprendre →
                  </button>
                </div>
              )}

              {/* KPI row */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#E8F5E9' }}>
                  <FolderOpen className="h-5 w-5" style={{ color: '#2D7A55' }} />
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: '#0A3B2E' }}>{dossiers.length}</div>
                  <div className="text-xs" style={{ color: '#6b7280' }}>dossier{dossiers.length > 1 ? 's' : ''} actif{dossiers.length > 1 ? 's' : ''}</div>
                </div>
              </div>

              {/* Dossier cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dossiers.map(d => (
                  <button
                    key={d.id}
                    onClick={() => handleOpenDossier(d.id)}
                    className="bg-white rounded-xl border border-gray-100 p-5 text-left hover:border-emerald-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #2D7A55, #1A5F3E)' }}>
                        {(d.providerOrg || d.name)?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: '#0A3B2E' }}>{d.providerOrg || d.name}</p>
                        <p className="text-xs" style={{ color: '#6b7280' }}>{d.fiscalYear}{d.missionType ? ` · ${d.missionType}` : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: '#E8F5E9', color: '#2D7A55' }}>
                        {d.status === 'completed' ? 'Terminé' : d.status === 'in-progress' ? 'En cours' : 'Brouillon'}
                      </span>
                      {d.updatedAt && (
                        <span className="text-[10px]" style={{ color: '#9ca3af' }}>
                          Modifié {new Date(d.updatedAt).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Create new button */}
              <button
                onClick={() => navigateToView('creation-dossier')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:shadow-lg"
                style={{ background: '#0A3B2E' }}
              >
                <Plus className="h-4 w-4" />
                Créer un nouveau dossier
              </button>
            </div>
          );
        }

        // State 2: 1+ dossiers with current dossier selected — show DashboardUniversal
        return (
          <DashboardUniversal
            key={`dashboard-${navigationCounter}`}
            posture={getPostureFromRole()}
            dossierId={currentDossierId ?? undefined}
            onNavigate={navigateToView}
          />
        );
      case "referentiels":
        return (
          <VSMEFrameworks
            onNavigate={navigateToView}
            onOpenReferentiel={navigateToReferentiel}
          />
        );
      case "vsme-detail":
        return (
          <VSMEFrameworkDetail
            frameworkId={referentielId}
            onBack={() => navigateToView("referentiels")}
            onNavigate={navigateToView}
            onSaisie={() => navigateToSaisie(saisieDossierId ?? undefined)}
          />
        );
      case "saisie-dossier":
        return saisieDossierId ? (
          <SaisieDossier
            dossierId={saisieDossierId}
            workflowId={activeWorkflowId}
            onBack={() => {
              if (saisieDossierId === currentDossierId) {
                navigateToView("detail-dossier");
              } else {
                navigateToView("dossiers");
              }
            }}
            onNavigate={navigateToView}
          />
        ) : (
          <ListeDossiers
            onCreateDossier={handleCreateDossier}
            onOpenDossier={(id) => {
              setSaisieDossierId(id);
              navigateToView("saisie-dossier");
            }}
          />
        );
      case "dossiers":
        return (
          <ListeDossiers
            onCreateDossier={handleCreateDossier}
            onOpenDossier={handleOpenDossier}
            onSaisirDossier={(id) => { setSaisieDossierId(id); navigateToView("saisie-dossier"); }}
          />
        );
      case "creation-dossier":
        return <CreationDossier onCancel={handleBackToDossiers} onComplete={handleDossierCreated} />;
      case "detail-dossier":
        return currentDossierId ? (
          <DetailDossier
            dossierId={currentDossierId}
            onBack={handleBackToDossiers}
            onNavigate={(view) => {
              if (view === "saisie-dossier") {
                setSaisieDossierId(currentDossierId);
              } else if (view === "rapport-ia") {
                setRapportDossierId(currentDossierId);
              }
              navigateToView(view as ViewType);
            }}
          />
        ) : (
          <ListeDossiers onCreateDossier={handleCreateDossier} onOpenDossier={handleOpenDossier} />
        );
      case "rapport-ia": {
        const rDossierId = rapportDossierId || currentDossierId;
        if (!rDossierId) {
          return (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#0A3B2E' }}>Rapport IA</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Générez un rapport ESG complet avec l'IA
                </p>
              </div>
              <div className="rounded-xl border-2 border-dashed p-8 text-center" style={{ borderColor: '#e2e8f0' }}>
                <FolderOpen className="w-12 h-12 mx-auto mb-3" style={{ color: '#d1d5db' }} />
                <p className="font-medium" style={{ color: '#6b7280' }}>Aucun dossier sélectionné</p>
                <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
                  Sélectionnez un dossier client pour générer un rapport IA
                </p>
                <button
                  className="mt-4 px-4 py-2 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: '#0A3B2E' }}
                  onClick={() => navigateToView("dossiers")}
                >
                  Sélectionner un dossier
                </button>
              </div>
            </div>
          );
        }
        return (
          <RapportIA
            dossierId={rDossierId}
            onBack={() => {
              setCurrentDossierId(rDossierId);
              navigateToView("detail-dossier");
            }}
          />
        );
      }
      case "preuves-workflow": {
        const pDossierId = currentDossierId;
        if (!pDossierId) {
          return (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#0A3B2E' }}>Justificatifs requis</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Checklist des documents à fournir pour valider vos parcours ESG
                </p>
              </div>
              <div className="rounded-xl border-2 border-dashed p-8 text-center" style={{ borderColor: '#e2e8f0' }}>
                <FolderOpen className="w-12 h-12 mx-auto mb-3" style={{ color: '#d1d5db' }} />
                <p className="font-medium" style={{ color: '#6b7280' }}>Aucun dossier sélectionné</p>
                <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
                  Sélectionnez un dossier client pour voir les justificatifs requis
                </p>
                <button
                  className="mt-4 px-4 py-2 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: '#0A3B2E' }}
                  onClick={() => navigateToView("dossiers")}
                >
                  Sélectionner un dossier
                </button>
              </div>
            </div>
          );
        }
        const pDossierObj = getDossier(pDossierId);
        return (
          <PreuvesWorkflowView
            dossierId={pDossierId}
            dossierName={pDossierObj?.name ?? ''}
            selectedWorkflows={pDossierObj?.selectedWorkflows || []}
            onSelectDossier={() => navigateToView("dossiers")}
          />
        );
      }
      case "import":
        return <ImportCenter dossierId={currentDossierId || "default-dossier"} workflowId={activeWorkflowId} onNavigateToSaisie={() => navigateToSaisie(currentDossierId || undefined)} />;
      case "kpis":
        return <DonneesESG dossierId={currentDossierId || undefined} posture={getPostureFromRole()} />;
      case "evidence-vault":
        return <EvidenceVault packId={currentDossierId || "default-dossier"} />;
      case "checklist-workflow":
        return <ChecklistWorkflow packId={currentDossierId || "default-dossier"} posture={getPostureFromRole()} workflowId={activeWorkflowId} />;
      case "exports-livrables":
        return <ExportsLivrables packId={currentDossierId || "default-dossier"} posture={getPostureFromRole()} />;
      case "audit-center":
        return (
          <AuditCenter
            currentAuditorId={currentUser.id}
            currentAuditorName={currentUser.name}
          />
        );
      case "audit-trail":
        return <Historique />;
      case "bibliotheque-workflows":
        return <BibliothequeWorkflows onNavigate={navigateToView} />;
      case "bibliotheque-templates":
        return <BibliothequeTemplates onNavigate={navigateToView} workflowId={activeWorkflowId} />;
      case "parametres":
        return <Parametres />;
      case "erp-connector":
        return <ERPConnectorView />;
      case "guide-aide":
        return <GuideAide onNavigate={navigateToView} />;
      case "glossaire":
        return <GuideAide onNavigate={navigateToView} defaultTab="glossaire" />;
      case "cgu":
        return <CGU onNavigate={navigateToView} />;
      case "politique-confidentialite":
        return <PolitiqueConfidentialite onNavigate={navigateToView} />;
      default:
        return <DashboardUniversal posture={getPostureFromRole()} onNavigate={navigateToView} />;
    }
  };

  // Toggle a collapsible group
  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group); else next.add(group);
      return next;
    });
  };

  // Helper: standard nav item
  const renderNavItem = (
    id: ViewType,
    label: string,
    icon: React.ReactNode,
    forceActive?: boolean
  ) => {
    const isActive = forceActive !== undefined ? forceActive : currentView === id;
    return (
      <button
        key={id}
        onClick={() => navigateToView(id)}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left"
        style={{
          borderLeft: isActive ? '2.5px solid #52B788' : '2.5px solid transparent',
          background: isActive ? 'rgba(45,122,85,0.25)' : 'transparent',
          color: isActive ? '#ffffff' : 'rgba(255,255,255,0.65)',
          fontWeight: isActive ? 500 : 400,
          fontSize: '13px',
        }}
        title={!sidebarOpen ? label : undefined}
      >
        {icon}
        {sidebarOpen && <span>{label}</span>}
      </button>
    );
  };

  // Helper: collapsible section header with chevron
  const renderSectionHeader = (
    groupId: string,
    defaultView: ViewType,
    label: string,
    icon: React.ReactNode,
    childViews: string[],
  ) => {
    const isChildActive = childViews.includes(currentView as string) || currentView === defaultView;
    const isCollapsed = collapsedGroups.has(groupId);
    return (
      <button
        key={groupId}
        onClick={() => {
          toggleGroup(groupId);
          // Also navigate to the default view if not already on a child
          if (!childViews.includes(currentView as string) && currentView !== defaultView) {
            navigateToView(defaultView);
          }
        }}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left"
        style={{
          borderLeft: isChildActive ? '2.5px solid #52B788' : '2.5px solid transparent',
          background: isChildActive ? 'rgba(45,122,85,0.25)' : 'transparent',
          color: isChildActive ? '#ffffff' : 'rgba(255,255,255,0.65)',
          fontWeight: isChildActive ? 500 : 400,
          fontSize: '13px',
        }}
      >
        {icon}
        {sidebarOpen && (
          <>
            <span className="flex-1">{label}</span>
            {isCollapsed
              ? <ChevronRight className="h-3 w-3 opacity-40" />
              : <ChevronDown className="h-3 w-3 opacity-40" />
            }
          </>
        )}
      </button>
    );
  };

  // Helpers for expandable chevron
  const Chevron = ({ expanded }: { expanded: boolean }) => (
    <svg
      width="12" height="12" viewBox="0 0 12 12"
      className="flex-shrink-0 transition-transform duration-200 ml-1"
      style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', color: 'rgba(255,255,255,0.4)' }}
    >
      <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  // Helper: render a collapsible group header (legacy — kept for backward compat)
  const renderGroupHeader = (groupKey: string, label: string, icon: React.ReactNode) => {
    const isCollapsed = collapsedGroups.has(groupKey);
    return (
      <button
        className="w-full flex items-center gap-2 px-2.5 pt-3 pb-1.5 transition-all"
        style={{ color: 'rgba(255,255,255,0.25)' }}
        onClick={() => toggleGroup(groupKey)}
        onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; }}
      >
        {icon}
        <span className="text-[9px] font-semibold uppercase flex-1 text-left" style={{ letterSpacing: '1.5px' }}>
          {label}
        </span>
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-3 w-3 flex-shrink-0" />
        )}
      </button>
    );
  };

  const _isDossiersActive = currentView === "dossiers" || currentView === "creation-dossier" || currentView === "detail-dossier";

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ══════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════ */}
      <aside
        className="flex flex-col flex-shrink-0 transition-all duration-300 overflow-hidden"
        style={{
          background: '#0f3d28',
          width: sidebarOpen ? '260px' : '64px',
          minWidth: sidebarOpen ? '260px' : '64px',
        }}
      >
        {/* ── Brand ── */}
        <div
          className="px-[18px] pt-5 pb-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="cursor-pointer mb-3" onClick={() => navigateToView("dashboard")}>
            <h1 className="font-bold" style={{ fontSize: '22px', letterSpacing: '-0.5px', color: '#fff' }}>
              {sidebarOpen ? <>Solvid<span style={{ color: '#52B788' }}>.IA</span></> : <span style={{ color: '#52B788' }}>S</span>}
            </h1>
            {sidebarOpen && (
              <p className="mt-0.5 uppercase" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.8px' }}>
                Plateforme ESG
              </p>
            )}
          </div>

          {/* User card */}
          {sidebarOpen && (
            <div
              className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-[10px]"
              style={{ background: 'rgba(0,0,0,0.2)' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0"
                style={{ background: '#2D7A55', color: '#fff' }}
              >
                {currentUser.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-white truncate">{currentUser.name}</p>
                <span
                  className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5 uppercase"
                  style={{ background: 'rgba(45,122,85,0.35)', color: '#52B788', letterSpacing: '0.5px' }}
                >
                  {getRoleLabel(currentUser.role)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5" style={{ scrollbarWidth: 'none' }}>

          {/* 1. Tableau de bord */}
          {renderNavItem("dashboard", "Tableau de bord", <LayoutDashboard className="h-4 w-4 flex-shrink-0" />)}

          {/* 2. Mes dossiers — with active dossier badge */}
          {renderNavItem("dossiers", "Mes dossiers", <FolderOpen className="h-4 w-4 flex-shrink-0" />, currentView === "dossiers" || currentView === "creation-dossier" || currentView === "detail-dossier")}
          {activeDossier && sidebarOpen && (
            <div className="ml-7 mr-2 mb-1 space-y-1">
              {/* Dossier badge */}
              <div
                className="px-2.5 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-2"
                style={{ background: 'rgba(45,122,85,0.18)', border: '1px solid rgba(82,183,136,0.22)' }}
                onClick={() => navigateToView("detail-dossier")}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(45,122,85,0.28)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(45,122,85,0.18)'; }}
              >
                <div
                  className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-white"
                  style={{ background: 'rgba(82,183,136,0.4)' }}
                >
                  {(activeDossier.providerOrg || activeDossier.name)?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-white leading-tight truncate">
                    {activeDossier.providerOrg || activeDossier.name}
                  </p>
                  <p className="text-[9px] leading-tight" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {activeDossier.fiscalYear} · {activeDossier.missionType}
                  </p>
                </div>
              </div>
              {/* Workflows/parcours du dossier */}
              {(activeDossier.selectedWorkflows ?? []).length > 0 && (
                <div className="space-y-0.5 pl-1">
                  {(activeDossier.selectedWorkflows ?? []).map(wfId => {
                    const wf = getWorkflowById(wfId);
                    if (!wf) return null;
                    return (
                      <button
                        key={wfId}
                        onClick={() => navigateToWorkflowView(wfId, "saisie-dossier")}
                        className="w-full flex items-center gap-2 px-2 py-1 rounded text-left transition-all"
                        style={{
                          background: activeWorkflowId === wfId ? 'rgba(82,183,136,0.2)' : 'transparent',
                          color: activeWorkflowId === wfId ? '#52B788' : 'rgba(255,255,255,0.45)',
                          fontSize: '10px',
                        }}
                        onMouseEnter={e => { if (activeWorkflowId !== wfId) e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                        onMouseLeave={e => { if (activeWorkflowId !== wfId) e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: activeWorkflowId === wfId ? '#52B788' : 'rgba(255,255,255,0.25)' }} />
                        <span className="truncate">{wf.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {/* Saisie directe */}
              <button
                onClick={() => navigateToSaisie(currentDossierId!)}
                className="w-full flex items-center gap-2 px-2 py-1 rounded text-left transition-all"
                style={{
                  color: currentView === 'saisie-dossier' ? '#52B788' : 'rgba(255,255,255,0.45)',
                  fontSize: '10px',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                onMouseLeave={e => { if (currentView !== 'saisie-dossier') e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: currentView === 'saisie-dossier' ? '#52B788' : 'rgba(255,255,255,0.25)' }} />
                <span>Saisie indicateurs</span>
              </button>
            </div>
          )}

          {/* 3. Collecte — collapsible */}
          {renderSectionHeader("collecte", "import", "Collecte", <Upload className="h-4 w-4 flex-shrink-0" />, ["import", "erp-connector", "saisie-dossier", "bibliotheque-templates"])}
          {sidebarOpen && !collapsedGroups.has("collecte") && (
            <div className="ml-7 space-y-0.5 mb-1">
              {renderNavItem("erp-connector", "Connecteurs ERP", <Plug className="h-3.5 w-3.5 flex-shrink-0" />)}
              {renderNavItem("bibliotheque-templates", "Templates Excel", <Database className="h-3.5 w-3.5 flex-shrink-0" />)}
            </div>
          )}

          {/* 4. Rapports — collapsible */}
          {renderSectionHeader("rapports", "exports-livrables", "Rapports", <FileText className="h-4 w-4 flex-shrink-0" />, ["exports-livrables", "rapport-ia", "audit-center", "preuves-requises"])}
          {sidebarOpen && !collapsedGroups.has("rapports") && (
            <div className="ml-7 space-y-0.5 mb-1">
              {renderNavItem("rapport-ia", "Rapport IA", <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />)}
              {renderNavItem("audit-center", "Contrôle qualité", <Shield className="h-3.5 w-3.5 flex-shrink-0" />)}
              {renderNavItem("preuves-requises", "Justificatifs", <CheckSquare className="h-3.5 w-3.5 flex-shrink-0" />)}
            </div>
          )}

          {/* 5. Réglages — collapsible */}
          {renderSectionHeader("reglages", "parametres", "Réglages", <Settings className="h-4 w-4 flex-shrink-0" />, ["parametres", "guide-aide", "glossaire", "historique", "referentiels"])}
          {sidebarOpen && !collapsedGroups.has("reglages") && (
            <div className="ml-7 space-y-0.5 mb-1">
              {renderNavItem("guide-aide", "Guide & Aide", <HelpCircle className="h-3.5 w-3.5 flex-shrink-0" />)}
              {renderNavItem("glossaire", "Glossaire ESG", <BookOpen className="h-3.5 w-3.5 flex-shrink-0" />)}
              {renderNavItem("referentiels", "Référentiels", <Activity className="h-3.5 w-3.5 flex-shrink-0" />)}
              {renderNavItem("historique", "Historique", <History className="h-3.5 w-3.5 flex-shrink-0" />)}
            </div>
          )}

        </nav>

        {/* ── Footer: Déconnexion ── */}
        <div
          className="px-2.5 py-3 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all"
            style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
            }}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col overflow-hidden" style={{ background: '#F0F4F1' }}>

        {/* Topbar */}
        <header
          className="bg-white flex-shrink-0 flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #E2EDE7' }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: '#4a6b57' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#EDF7F1'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-[17px] font-semibold" style={{ color: '#1a2e24' }}>
                {VIEW_LABELS[currentView]}
              </h2>
              <p className="text-[12px]" style={{ color: '#8aab98' }}>
                {currentUser.organizationName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <SyncStatusBanner />
            <NotificationBell
              currentUserId={currentUser.id}
              onNavigate={(target) => {
                if (target.dossierId) setCurrentDossierId(target.dossierId);
                navigateToView(target.view as ViewType);
              }}
              onNotificationClick={(notification) => {
              }}
            />
            <Badge variant="outline" className="text-xs">
              {currentUser.email}
            </Badge>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {renderView()}
        </div>
      </main>

      {/* 🆕 Assistant IA ESG — flottant en bas à droite, accessible depuis toutes les vues */}
      <AIChatbot
        context={{
          currentView: VIEW_LABELS[currentView] ?? currentView,
          dossierName: activeDossier?.name,
          dossierOrg: activeDossier?.providerOrg,
          fiscalYear: activeDossier?.fiscalYear,
        }}
      />

      {/* RGPD Cookie Consent Banner */}
      <CookieConsent onNavigatePrivacy={() => navigateToView("politique-confidentialite")} />
    </div>
  );
}

// Helper to map role strings from API to Role enum
function mapRoleStringToEnum(roleString: string): Role {
  const normalizedRole = roleString?.trim();
  switch (normalizedRole) {
    case 'Directeur ESG':   return Role.CLIENT_OWNER;
    case 'Consultant ESG':  return Role.CONSULTANT;
    case 'Auditeur externe': return Role.AUDITOR;
    case 'Analyste données':  return Role.CLIENT_CONTRIBUTOR;
    case 'Contrôleur interne': return Role.CLIENT_CONTRIBUTOR;
    case 'Admin':           return Role.ADMIN;
    default:
      console.warn('⚠️ Unknown role, defaulting to VIEWER:', normalizedRole);
      return Role.VIEWER;
  }
}
