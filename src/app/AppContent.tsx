import {
  LayoutDashboard,
  FolderOpen,
  Upload,
  Calculator,
  Database,
  CheckSquare,
  Search,
  Shield,
  History,
  Settings,
  Menu,
  LogOut,
  X,
  Activity,
  BarChart3,
  Clock,
  FileText,
  Workflow,
} from "lucide-react";
import { useState } from "react";
import { Role } from "@/permissions";
import { useUser } from "@/contexts/UserContext";
import { getRoleLabel } from "@/permissions";
import { isFeatureEnabled } from "@/featureFlags";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { DashboardUniversal } from "@/app/components/views/DashboardUniversal";
import { ListeDossiers } from "@/app/components/views/ListeDossiers";
import { CreationDossier } from "@/app/components/views/CreationDossier";
import { DetailDossier } from "@/app/components/views/DetailDossier";
import { ImportCenter } from "@/app/components/views/ImportCenter";
import { DonneesQuantitatives } from "@/app/components/views/DonneesQuantitatives";
import { EvidenceVault } from "@/app/components/views/EvidenceVault";
import { ChecklistWorkflow } from "@/app/components/views/ChecklistWorkflow";
import { ExportsLivrables } from "@/app/components/views/ExportsLivrables";
import { AuditCenter } from "@/app/components/views/AuditCenter";
import { Historique } from "@/app/components/views/Historique";
import { Parametres } from "@/app/components/views/Parametres";
import { AuthPageLocal } from "@/app/components/AuthPageLocal";
import { NotificationBell } from "@/app/components/NotificationBell";
import { QuickStart } from "@/app/components/views/QuickStart";
import { BibliothequeWorkflows } from "@/app/components/views/BibliothequeWorkflows";
import { BibliothequeTemplates } from "@/app/components/views/BibliothequeTemplates";

type ViewType = 
  | "quick-start"  // 🆕 Quick Start page
  | "dashboard" 
  | "dossiers"
  | "creation-dossier"
  | "detail-dossier"
  | "import"
  | "kpis"
  | "evidence-vault"
  | "checklist-workflow"
  | "exports-livrables"
  | "bibliotheque-workflows" // 🆕 Bibliothèque Workflows
  | "bibliotheque-templates" // 🆕 Bibliothèque Templates
  | "audit-center"
  | "audit-trail"
  // 🗑️ Removed: cache-analytics, analytics-advanced, activity-feed, professional-reports (merged into existing views)
  | "parametres";

interface NavItem {
  id: ViewType;
  label: string;
  icon: any;
  tooltip?: string;
  requiresRole?: Role[];
  requiresFeature?: string;
}

// Navigation unique "ESG Audit-Ready" (plus de parcours CSRD/ESG)
const getNavigation = (userRole: Role): NavItem[] => {
  const mainNav: NavItem[] = [
    { 
      id: "dashboard", 
      label: "Dashboard", 
      icon: LayoutDashboard,
      tooltip: "Vue d'ensemble" 
    },
    { 
      id: "dossiers", 
      label: "Dossiers", 
      icon: FolderOpen,
      tooltip: "Gestion des dossiers clients" 
    },
    { 
      id: "import", 
      label: "Import données", 
      icon: Upload,
      tooltip: "Import Excel/CSV avec mapping réutilisable",
      requiresRole: [Role.CLIENT_OWNER, Role.CLIENT_CONTRIBUTOR, Role.CONSULTANT, Role.ADMIN]
    },
    { 
      id: "bibliotheque-workflows", 
      label: "Workflows", 
      icon: Activity,
      tooltip: "Bibliothèque des workflows ESG consultables",
      requiresRole: [Role.CLIENT_OWNER, Role.CLIENT_CONTRIBUTOR, Role.CONSULTANT, Role.ADMIN]
    },
    { 
      id: "bibliotheque-templates", 
      label: "Templates", 
      icon: FileText,
      tooltip: "Bibliothèque des templates Excel téléchargeables",
      requiresRole: [Role.CLIENT_OWNER, Role.CLIENT_CONTRIBUTOR, Role.CONSULTANT, Role.ADMIN]
    },
    { 
      id: "evidence-vault", 
      label: "Preuves & Documents", 
      icon: Database,
      tooltip: "Evidence Vault (fichiers auditables)" 
    },
    { 
      id: "checklist-workflow", 
      label: "Checklist & Suivi", 
      icon: CheckSquare,
      tooltip: "Suivi des tâches et validation" 
    },
    { 
      id: "exports-livrables", 
      label: "Exports & Livrables", 
      icon: Shield,
      tooltip: "Documents audit-ready (PDF, ZIP, Rapports)"
    },
    { 
      id: "audit-center", 
      label: "Audit Center", 
      icon: Search,
      tooltip: "Centre de révision et validation",
      requiresRole: [Role.AUDITOR, Role.ADMIN]
    },
    { 
      id: "audit-trail", 
      label: "Historique", 
      icon: History,
      tooltip: "Traçabilité & flux d'activités"
    },
    { 
      id: "parametres", 
      label: "Paramètres", 
      icon: Settings,
      tooltip: "Configuration et préférences",
      requiresRole: [Role.CLIENT_OWNER, Role.CONSULTANT, Role.ADMIN]
    },
  ];

  // Filtrer selon rôle et feature flags
  return mainNav.filter(item => {
    // Vérifier feature flag
    if (item.requiresFeature && !isFeatureEnabled(item.requiresFeature)) {
      return false;
    }
    
    // Vérifier rôle requis
    if (item.requiresRole && !item.requiresRole.includes(userRole)) {
      return false;
    }
    
    return true;
  });
};

export function AppContent() {
  const { currentUser, setCurrentUser, logout, loading, initError } = useUser();
  
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentDossierId, setCurrentDossierId] = useState<string | null>(null);
  // 🆕 Add navigation counter to force Dashboard remount
  const [navigationCounter, setNavigationCounter] = useState(0);

  // 🆕 Increment counter whenever currentView changes to "dashboard"
  const navigateToView = (view: ViewType) => {
    setCurrentView(view);
    if (view === "dashboard") {
      setNavigationCounter(prev => prev + 1);
    }
  };

  // Afficher loader pendant vérification session
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#059669] mx-auto"></div>
          <p className="text-sm text-slate-600">Chargement de Solvid.IA...</p>
          <p className="text-xs text-slate-400">Initialisation des services...</p>
        </div>
      </div>
    );
  }

  // Afficher erreur d'initialisation si présente
  if (initError) {
    return (
      <div className="flex h-screen items-center justify-center bg-red-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            ⚠️ Erreur d'initialisation
          </h1>
          <p className="text-gray-700 mb-4">{initError}</p>
          <p className="text-sm text-gray-500 mb-4">
            Veuillez vérifier la console pour plus de détails.
          </p>
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

  // Si pas de user, afficher page d'authentification
  if (!currentUser) {
    return (
      <AuthPageLocal 
        onLogin={(user) => {
          console.log('✅ Local login successful:', user);
          setCurrentUser(user);
        }} 
      />
    );
  }

  const handleCreateDossier = () => {
    navigateToView("creation-dossier");
  };

  const handleDossierCreated = (dossierId: string) => { // 🔧 Now receives dossierId
    setCurrentDossierId(dossierId); // 🆕 Set the newly created dossier as current
    navigateToView("dossiers"); // 🔧 Navigate back to list to see the new dossier
  };

  const handleOpenDossier = (dossierId: string) => {
    setCurrentDossierId(dossierId);
    navigateToView("detail-dossier");
  };

  const handleBackToDossiers = () => {
    setCurrentDossierId(null);
    navigateToView("dossiers");
  };

  const renderView = () => {
    // 🆕 Map user role to dashboard posture
    const getPostureFromRole = (): "conseil" | "pre-audit" | "audit-externe" => {
      switch (currentUser.role) {
        case Role.CONSULTANT:
        case Role.CLIENT_OWNER:
        case Role.CLIENT_CONTRIBUTOR:
          return "conseil"; // Collecte et préparation
        case Role.AUDITOR:
          return "audit-externe"; // Validation externe
        case Role.ADMIN:
          return "pre-audit"; // Vérification avant audit
        default:
          return "conseil";
      }
    };

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
        // 🆕 Add key to force component remount when navigating to dashboard
        // This ensures stats reload every time user clicks on Dashboard
        return <DashboardUniversal key={`dashboard-${navigationCounter}`} posture={getPostureFromRole()} />;
      case "dossiers":
        return <ListeDossiers onCreateDossier={handleCreateDossier} onOpenDossier={handleOpenDossier} />;
      case "creation-dossier":
        return <CreationDossier onCancel={handleBackToDossiers} onComplete={handleDossierCreated} />;
      case "detail-dossier":
        return currentDossierId ? (
          <DetailDossier dossierId={currentDossierId} onBack={handleBackToDossiers} />
        ) : (
          <ListeDossiers onCreateDossier={handleCreateDossier} onOpenDossier={handleOpenDossier} />
        );
      case "import":
        return <ImportCenter dossierId={currentDossierId || "default-dossier"} />;
      case "kpis":
        return <DonneesQuantitatives />;
      case "evidence-vault":
        return <EvidenceVault />; // 🆕 Simplified
      case "checklist-workflow":
        return <ChecklistWorkflow />; // 🆕 Simplified
      case "exports-livrables":
        return <ExportsLivrables />;
      case "audit-center":
        return (
          <AuditCenter 
            currentAuditorId={currentUser.id}
            currentAuditorName={currentUser.name}
          />
        );
      case "audit-trail":
        return <Historique />; // 🆕 Now includes Activity Feed in tabs
      case "bibliotheque-workflows":
        return <BibliothequeWorkflows onNavigate={navigateToView} />;
      case "bibliotheque-templates":
        return <BibliothequeTemplates onNavigate={navigateToView} />;
      case "parametres":
        return <Parametres />;
      default:
        return <DashboardUniversal posture={getPostureFromRole()} />;
    }
  };

  const navigation = getNavigation(currentUser.role);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`
          bg-[#0A3B2E] text-white transition-all duration-300 flex flex-col
          ${sidebarOpen ? 'w-64' : 'w-0 md:w-20'}
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#0F4C3A]">
          {sidebarOpen ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div 
                  className="cursor-pointer"
                  onClick={() => navigateToView("quick-start")}
                  title="Retour au Quick Start"
                >
                  <h1 className="text-2xl font-bold text-white">
                    Solvid<span className="text-[#10B981]">.IA</span>
                  </h1>
                  <p className="text-xs text-[#E8F3F0] mt-1">ESG Audit-Ready Data Room</p>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="md:hidden p-1 hover:bg-[#0F4C3A] rounded transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* User info */}
              <div className="mt-3 p-3 bg-[#0F4C3A] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#059669] rounded-full flex items-center justify-center text-lg">
                    {currentUser.avatar || currentUser.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{currentUser.name}</p>
                    <Badge className="bg-[#059669] text-white text-xs mt-1">
                      {getRoleLabel(currentUser.role)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex justify-center">
              <div className="w-10 h-10 bg-[#059669] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => navigateToView(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all
                    ${isActive 
                      ? 'bg-[#059669] text-white shadow-lg' 
                      : 'text-[#E8F3F0] hover:bg-[#0F4C3A]'
                    }
                    ${!sidebarOpen && 'md:justify-center'}
                  `}
                  title={item.tooltip}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#0F4C3A]">
          {sidebarOpen ? (
            <Button
              variant="ghost"
              className="w-full justify-start text-[#E8F3F0] hover:bg-[#0F4C3A] hover:text-white gap-2"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              <span>Déconnexion</span>
            </Button>
          ) : (
            <button
              onClick={logout}
              className="hidden md:flex w-full justify-center p-2 hover:bg-[#0F4C3A] rounded transition-colors"
              title="Déconnexion"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {navigation.find(n => n.id === currentView)?.label || "Dashboard"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {currentUser.organizationName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Notification Bell - Phase 7 */}
            <NotificationBell 
              currentUserId={currentUser.id}
              onNavigate={(target) => {
                // 🆕 P1-1: Navigation complète depuis notifications
                console.log('🧭 NotificationBell navigation:', target);
                
                if (target.dossierId) {
                  setCurrentDossierId(target.dossierId);
                }
                
                navigateToView(target.view as ViewType);
              }}
              onNotificationClick={(notification) => {
                // Navigation legacy support (pour notifications sans target défini)
                console.log('📬 Notification clicked:', notification);
              }}
            />
            
            <Badge variant="outline" className="text-xs">
              {currentUser.email}
            </Badge>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-auto bg-background p-6">
          {renderView()}
        </div>
      </main>
    </div>
  );
}

// Helper to map role strings from API to Role enum
function mapRoleStringToEnum(roleString: string): Role {
  // Trim and normalize the role string
  const normalizedRole = roleString?.trim();
  
  console.log('🔍 DEBUG mapRoleStringToEnum - Input:', JSON.stringify(roleString));
  console.log('🔍 DEBUG mapRoleStringToEnum - Normalized:', JSON.stringify(normalizedRole));
  console.log('🔍 DEBUG mapRoleStringToEnum - Length:', roleString?.length);
  
  // Use switch case instead of object mapping for reliability
  let result: Role;
  
  switch (normalizedRole) {
    case 'Directeur ESG':
      result = Role.CLIENT_OWNER;
      break;
    case 'Consultant ESG':
      result = Role.CONSULTANT;
      break;
    case 'Auditeur externe':
      result = Role.AUDITOR;
      break;
    case 'Analyste données':
      result = Role.CLIENT_CONTRIBUTOR;
      break;
    case 'Contrôleur interne':
      result = Role.CLIENT_CONTRIBUTOR;
      break;
    case 'Admin':
      result = Role.ADMIN;
      break;
    default:
      console.warn('⚠️ Unknown role, defaulting to VIEWER:', normalizedRole);
      result = Role.VIEWER;
      break;
  }
  
  console.log('🔍 DEBUG mapRoleStringToEnum - Final result:', result);
  
  return result;
}