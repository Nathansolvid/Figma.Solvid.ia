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
} from "lucide-react";
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
import { WelcomeModal } from "@/app/components/WelcomeModal";
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
  "referentiels": "Standards VSME",
  "vsme-detail": "Standard",
  "saisie-dossier": "Saisie des données",
  "dossiers": "Mes Dossiers",
  "creation-dossier": "Nouveau dossier",
  "detail-dossier": "Dossier",
  "rapport-ia": "Rapport IA",
  "import": "Import données",
  "kpis": "Chiffres clés",
  "evidence-vault": "Justificatifs & Documents",
  "checklist-workflow": "Checklist suivi",
  "exports-livrables": "Exports",
  "bibliotheque-workflows": "Parcours ESG",
  "bibliotheque-templates": "Modèles Excel",
  "audit-center": "Centre de vérification",
  "audit-trail": "Historique",
  "preuves-workflow": "Justificatifs requis",
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

  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentDossierId, setCurrentDossierId] = useState<string | null>(null);
  const [navigationCounter, setNavigationCounter] = useState(0);
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem("solvid-onboarding-done"));

  // (legacy sidebar expand states — kept to avoid unused-variable errors)
  const [_referentielsExpanded] = useState(true);
  const [_dossiersExpanded] = useState(false);

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

          {/* Dashboard */}
          {renderNavItem("dashboard", "Tableau de bord", <LayoutDashboard className="h-4 w-4 flex-shrink-0" />)}

          {/* ── Séparateur ── */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '6px 10px' }} />

          {/* ══ Section : Contexte client ══ */}
          {sidebarOpen && (
            <div className="flex items-center justify-between px-2.5 pt-1 pb-1.5">
              <p className="text-[9px] font-semibold uppercase" style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '1.5px' }}>
                Contexte client
              </p>
              {activeDossier && (
                <button
                  className="text-[9px] transition-all"
                  style={{ color: 'rgba(82,183,136,0.6)' }}
                  onClick={() => navigateToView("dossiers")}
                  onMouseEnter={e => { e.currentTarget.style.color = '#52B788'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(82,183,136,0.6)'; }}
                >
                  Changer →
                </button>
              )}
            </div>
          )}

          {activeDossier ? (
            /* ── Dossier actif ── */
            <div
              className="mx-1 rounded-[10px] px-3 py-2.5 cursor-pointer transition-all"
              style={{ background: 'rgba(45,122,85,0.15)', border: '1px solid rgba(82,183,136,0.22)' }}
              onClick={() => navigateToView("detail-dossier")}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(45,122,85,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(45,122,85,0.15)'; }}
            >
              {sidebarOpen ? (
                <div className="flex items-start gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, rgba(82,183,136,0.4), rgba(45,122,85,0.5))' }}
                  >
                    {(activeDossier.providerOrg || activeDossier.name)?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-white leading-tight truncate">
                      {activeDossier.providerOrg || activeDossier.name}
                    </p>
                    <p className="text-[10px] leading-tight" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {activeDossier.fiscalYear}{activeDossier.missionType ? ` · ${activeDossier.missionType}` : ''}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: 'rgba(82,183,136,0.3)' }}
                  >
                    {(activeDossier.providerOrg || activeDossier.name)?.[0]?.toUpperCase() ?? '?'}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── Aucun dossier sélectionné ── */
            <div
              className="mx-1 rounded-[10px] px-3 py-2.5"
              style={{ border: '1px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}
            >
              {sidebarOpen ? (
                <>
                  <p className="text-[11px] text-center mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Aucun client sélectionné
                  </p>
                  <button
                    className="w-full text-center text-[11px] py-1.5 rounded-lg font-medium mb-1.5 transition-all"
                    style={{ background: 'rgba(82,183,136,0.15)', color: '#52B788', border: '1px solid rgba(82,183,136,0.25)' }}
                    onClick={() => navigateToView("dossiers")}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(82,183,136,0.25)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(82,183,136,0.15)'; }}
                  >
                    Sélectionner
                  </button>
                  <button
                    className="w-full text-center text-[11px] py-1.5 rounded-lg transition-all"
                    style={{ background: 'transparent', color: 'rgba(255,255,255,0.35)', border: '1px dashed rgba(255,255,255,0.1)' }}
                    onClick={() => navigateToView("creation-dossier")}
                    onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                  >
                    + Créer un dossier
                  </button>
                </>
              ) : (
                <div className="flex items-center justify-center py-0.5">
                  <FolderOpen className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
                </div>
              )}
            </div>
          )}

          {/* ── Séparateur ── */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '6px 10px' }} />

          {/* ══ Section : Mes référentiels ══ */}
          {sidebarOpen && (
            <div className="flex items-center justify-between px-2.5 pt-1 pb-1.5">
              <p className="text-[9px] font-semibold uppercase" style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '1.5px' }}>
                Mes standards
              </p>
            </div>
          )}

          {activeDossier ? (
            <>
              {/* ── Tous les référentiels du dossier (boucle unifiée) ── */}
              {activeWorkflowDefs.map(workflow => {
                const isVSME = workflow.id === 'vsme';
                const wBadge = WORKFLOW_BADGE[workflow.id] ?? { abbr: workflow.name.slice(0, 2).toUpperCase(), color: '#64748b' };
                const isOpen = openRefBlocks.has(workflow.id);

                // Stats de complétion pour TOUT workflow (pas seulement VSME)
                const wfStats = getWorkflowStats(workflow);
                const statsCount = wfStats.total > 0 ? `${wfStats.filled}/${wfStats.total}` : null;
                const statsDone  = wfStats.filled > 0;
                const templatesCount = isVSME ? '8 modèles' : null;

                const subMenuItems = [
                  { label: 'Importer des données',   count: null,           view: 'import' as ViewType,                 done: false,    disabled: false },
                  { label: 'Saisie des données',      count: statsCount,    view: 'saisie-dossier' as ViewType,         done: statsDone, disabled: !currentDossierId },
                  { label: 'Modèles Excel',           count: templatesCount, view: 'bibliotheque-templates' as ViewType, done: false,    disabled: false },
                  { label: 'Checklist & Suivi',       count: null,           view: 'checklist-workflow' as ViewType,     done: false,    disabled: false },
                ];

                const badgeBg = isVSME
                  ? 'linear-gradient(135deg, #2D9D5F, #1A7A45)'
                  : wBadge.color + 'CC';
                const ringColor = isVSME ? '#52B788' : wBadge.color;
                const ringPct   = wfStats.pct;

                return (
                  <div
                    key={workflow.id}
                    className="rounded-[10px] overflow-hidden transition-all mx-1"
                    style={{ border: isOpen ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent' }}
                  >
                    {/* Header */}
                    <div style={{ borderRadius: isOpen ? '9px 9px 0 0' : '8px' }}>
                      <button
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 transition-all"
                        style={{
                          background: isOpen ? 'rgba(255,255,255,0.07)' : 'transparent',
                        }}
                        onClick={() => toggleRefBlock(workflow.id)}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-white"
                          style={{ background: badgeBg, fontSize: wBadge.abbr.length > 2 ? '8px' : '10px' }}
                        >
                          {wBadge.abbr}
                        </div>
                        {sidebarOpen && (
                          <>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-[12px] font-semibold text-white leading-tight truncate">{workflow.name}</p>
                              <p className="text-[10px] leading-tight" style={{ color: 'rgba(255,255,255,0.38)' }}>
                                {isVSME ? `EFRAG 2024 · ${wfStats.total} données` : `${workflow.category} · ${wfStats.total} données`}
                              </p>
                            </div>
                            <ProgressRing pct={ringPct} color={ringColor} />
                            <svg width="10" height="10" viewBox="0 0 10 10" className="flex-shrink-0 ml-0.5 transition-transform duration-200"
                              style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', color: 'rgba(255,255,255,0.3)' }}
                            >
                              <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Sous-menu */}
                    {isOpen && sidebarOpen && (
                      <div className="pb-1.5" style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '0 0 9px 9px' }}>
                        {subMenuItems.map(item => {
                          const isItemActive = currentView === item.view && activeWorkflowId === workflow.id;
                          return (
                            <button
                              key={item.label}
                              className="w-full flex items-center gap-2 px-3 py-[5px] text-left relative transition-all"
                              style={{
                                color: item.disabled ? 'rgba(255,255,255,0.2)' : isItemActive ? 'rgba(184,228,199,0.95)' : 'rgba(255,255,255,0.45)',
                                fontSize: '11.5px',
                                fontWeight: isItemActive ? 500 : 400,
                                cursor: item.disabled ? 'not-allowed' : 'pointer',
                              }}
                              onClick={() => {
                                if (item.disabled) return;
                                navigateToWorkflowView(workflow.id, item.view);
                              }}
                            >
                              <span className="absolute left-[14px] top-0 bottom-0 w-px"
                                style={{ background: isItemActive ? ringColor : 'rgba(255,255,255,0.08)' }}
                              />
                              <span className="w-[5px] h-[5px] rounded-full flex-shrink-0 ml-3"
                                style={{ background: isItemActive ? ringColor : 'rgba(255,255,255,0.2)', boxShadow: isItemActive ? `0 0 5px ${ringColor}80` : undefined }}
                              />
                              <span className="flex-1">{item.label}</span>
                              {item.count && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                                  style={{ background: item.done ? 'rgba(82,183,136,0.2)' : 'rgba(255,255,255,0.08)', color: item.done ? 'rgba(184,228,199,0.8)' : 'rgba(255,255,255,0.35)' }}
                                >
                                  {item.count}
                                </span>
                              )}
                            </button>
                          );
                        })}

                        {/* ── Séparateur + Retirer ── */}
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 12px' }} />
                        <button
                          className="w-full flex items-center gap-2 px-3 py-[5px] text-left transition-all group"
                          style={{ fontSize: '11.5px', color: 'rgba(239,68,68,0.5)' }}
                          onClick={() => removeWorkflow(workflow.id)}
                          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(239,68,68,0.9)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(239,68,68,0.5)'; }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 ml-3">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
                          </svg>
                          <span>Retirer du dossier</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ── + Ajouter un référentiel (drop zone) ── */}
              {sidebarOpen && (
                <button
                  className="mx-1 flex items-center gap-2 px-3 rounded-lg text-left w-[calc(100%-8px)] transition-all"
                  style={{
                    fontSize: '12px', fontWeight: 500,
                    minHeight: isDragOverAdd ? '52px' : '34px',
                    padding: isDragOverAdd ? '10px 12px' : '7px 12px',
                    color: isDragOverAdd ? '#52B788' : 'rgba(255,255,255,0.3)',
                    border: isDragOverAdd ? '1.5px dashed #52B788' : '1px dashed rgba(255,255,255,0.12)',
                    background: isDragOverAdd ? 'rgba(82,183,136,0.1)' : 'transparent',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => navigateToView("bibliotheque-workflows")}
                  onMouseEnter={e => {
                    if (!isDragOverAdd) {
                      e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isDragOverAdd) {
                      e.currentTarget.style.color = 'rgba(255,255,255,0.3)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setIsDragOverAdd(true); }}
                  onDragLeave={() => setIsDragOverAdd(false)}
                  onDrop={handleDropAdd}
                >
                  <Plus className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{isDragOverAdd ? 'Déposer ici pour ajouter' : 'Ajouter un standard'}</span>
                </button>
              )}
            </>
          ) : (
            /* Pas de dossier actif — message d'invite */
            sidebarOpen && (
              <div className="mx-1 px-3 py-2 rounded-lg text-center" style={{ color: 'rgba(255,255,255,0.22)', fontSize: '11px', fontStyle: 'italic' }}>
                Sélectionnez d'abord un client
              </div>
            )
          )}

          {/* ── Séparateur ── */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '6px 10px' }} />

          {/* ── Outils ── */}
          {sidebarOpen && (
            <p className="text-[9px] font-semibold uppercase px-2.5 pt-1 pb-1.5" style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '1.5px' }}>
              Outils
            </p>
          )}
          {renderNavItem("import", "Import données", <Upload className="h-4 w-4 flex-shrink-0" />)}
          {renderNavItem("erp-connector", "Connecteurs ERP", <Plug className="h-4 w-4 flex-shrink-0" />)}
          {renderNavItem("preuves-workflow", "Justificatifs requis", <ClipboardCheck className="h-4 w-4 flex-shrink-0" />)}
          {renderNavItem("rapport-ia", "Rapport IA", <Sparkles className="h-4 w-4 flex-shrink-0" />)}
          {renderNavItem("exports-livrables", "Exports", <FileText className="h-4 w-4 flex-shrink-0" />)}
          {isAuditorOrAdmin && renderNavItem("audit-center", "Centre de vérification", <Search className="h-4 w-4 flex-shrink-0" />)}

          {/* ── Paramètres ── */}
          {sidebarOpen && (
            <p className="text-[9px] font-semibold uppercase px-2.5 pt-4 pb-1.5" style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '1.5px' }}>
              Paramètres
            </p>
          )}
          {renderNavItem("bibliotheque-workflows", "Parcours ESG", <Activity className="h-4 w-4 flex-shrink-0" />)}
          {renderNavItem("bibliotheque-templates", "Modèles Excel", <FileText className="h-4 w-4 flex-shrink-0" />)}
          {renderNavItem("checklist-workflow", "Checklist suivi", <CheckSquare className="h-4 w-4 flex-shrink-0" />)}
          {renderNavItem("audit-trail", "Historique", <History className="h-4 w-4 flex-shrink-0" />)}
          {canAccessParams && renderNavItem("parametres", "Réglages", <Settings className="h-4 w-4 flex-shrink-0" />)}

          {/* ── Aide ── */}
          {sidebarOpen && (
            <p className="text-[9px] font-semibold uppercase px-2.5 pt-4 pb-1.5" style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '1.5px' }}>
              Aide
            </p>
          )}
          {renderNavItem("guide-aide", "Guide & Aide", <BookOpen className="h-4 w-4 flex-shrink-0" />)}
          {renderNavItem("glossaire", "Glossaire ESG", <HelpCircle className="h-4 w-4 flex-shrink-0" />)}
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

      {/* First-launch welcome modal */}
      {showWelcome && (
        <WelcomeModal
          onClose={() => setShowWelcome(false)}
          onNavigateGuide={() => {
            setCurrentView("guide-aide");
            setShowWelcome(false);
          }}
        />
      )}

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
