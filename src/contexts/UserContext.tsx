// Auth via Supabase — server-side credentials, no localStorage passwords
import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { Role } from '@/permissions';

import { dataProvider } from '@/services/dataProvider';
import { packService } from '@/services/packService';
import { collaborationService } from '@/services/collaborationService';
import type { SubscriptionInfo } from '@/services/invitationService';
import { supabase } from '@/lib/supabase';
import { syncEngine } from '@/services/syncEngine';
import { supabaseProvider } from '@/services/supabaseProvider';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId: string;
  organizationName?: string;
  avatar?: string;
  consentCGU?: string;
  consentAI?: string;
}

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  loading: boolean;
  initError: string | null;
  subscription: SubscriptionInfo | null;
  subscriptionExpired: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// ── Pull dossiers from Supabase into IDB (initial sync) ───────────────────────
async function pullFromCloud(userId: string, orgId: string, isAdmin = false): Promise<void> {
  try {
    // Admin pulls all dossiers; others pull only their org
    const remoteDossiers = isAdmin
      ? await supabaseProvider.listAllDossiers()
      : await supabaseProvider.listDossiers(orgId);
    for (const d of remoteDossiers) {
      const mapped = {
        id: d.id,
        name: (d as any).nom || (d as any).name || d.id,
        clientOrg: (d as any).client_org || '',
        providerOrg: (d as any).provider_org || '',
        missionType: (d as any).mission_type || 'Conseil',
        selectedWorkflows: (d as any).selected_workflows || [],
        fiscalYear: (d as any).fiscal_year || '2025',
        pathwayType: (d as any).pathway_type || 'ESG_Voluntary',
        leadConsultant: (d as any).lead_consultant || '',
        startDate: (d as any).start_date || d.created_at || new Date().toISOString(),
        createdAt: d.created_at || new Date().toISOString(),
        status: (d as any).status || 'active',
        organizationId: orgId,
        ownerId: userId,
      };
      await dataProvider.store.update('dossiers' as any, mapped).catch(async () => {
        await dataProvider.store.create('dossiers' as any, mapped).catch(() => {});
      });
    }
    // Signal DossierContext to refresh
    if (remoteDossiers.length > 0) {
      window.dispatchEvent(new CustomEvent('solvid:cloud-pull-complete'));
    }
  } catch (err) {
    console.warn('[Sync] Cloud pull failed (offline?):', err);
  }
}

// ── Activate sync engine for a logged-in user ─────────────────────────────────
function activateSync(user: User): void {
  const isAdmin = user.role === Role.ADMIN;
  syncEngine.enableSync(user.id, user.organizationId).then(() => {
    // Admin pulls all dossiers; others pull only their org
    pullFromCloud(user.id, user.organizationId, isAdmin).then(() => {
      syncEngine.flushQueue().catch(() => {});
    });
  }).catch(() => {});
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [subscription] = useState<SubscriptionInfo | null>(null);
  const [subscriptionExpired] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        await dataProvider.init();
        await packService.seedTemplates();

        // ── DEMO MODE ONLY ──────────────────────────────────────────────
        if (import.meta.env.VITE_DEMO_MODE === 'true') {
          const devUser: User = {
            id: 'dev-admin-001',
            name: 'Nathan Glatt',
            email: 'nathan.glatt@icloud.com',
            role: Role.ADMIN,
            organizationId: 'dev-org-001',
            organizationName: 'Solvid',
          };
          setCurrentUserState(devUser);
          collaborationService.initialize(devUser.id, devUser.name, devUser.organizationId);
          return;
        }

        // ── Supabase session check ──────────────────────────────────────
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const user = mapSupabaseUser(session.user);
          activateSync(user); // enable write-through + pull from cloud
          setCurrentUserState(user);
          collaborationService.initialize(user.id, user.name, user.organizationId);
        } else {
          setCurrentUserState(null);
        }
      } catch (error) {
        console.error('Initialization error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setInitError(`Erreur d'initialisation: ${errorMessage}`);
        setCurrentUserState(null);
      } finally {
        setLoading(false);
      }
    };

    initApp();

    // Listen for auth state changes (login/logout from any tab)
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Strip any auth tokens from the URL immediately — prevents sharing session via URL
        if (window.location.hash.includes('access_token') || window.location.hash.includes('refresh_token')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          const user = mapSupabaseUser(session.user);
          activateSync(user);
          setCurrentUserState(user);
          collaborationService.initialize(user.id, user.name, user.organizationId);
        } else if (event === 'SIGNED_OUT') {
          syncEngine.disableSync();
          setCurrentUserState(null);
        }
      }
    );

    return () => authSub.unsubscribe();
  }, []);

  const setCurrentUser = useCallback((user: User | null) => {
    setCurrentUserState(user);
    if (user) {
      (window as any).__solvid_current_user_name = user.name;
      collaborationService.initialize(user.id, user.name);
      activateSync(user);
    } else {
      syncEngine.disableSync();
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      syncEngine.disableSync();
      collaborationService.disconnect();
      setCurrentUser(null);
    }
  }, [setCurrentUser]);

  const value = useMemo(() => ({
    currentUser,
    setCurrentUser,
    isAuthenticated: !!currentUser,
    logout,
    loading,
    initError,
    subscription,
    subscriptionExpired,
  }), [currentUser, setCurrentUser, logout, loading, initError, subscription, subscriptionExpired]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    return {
      currentUser: null,
      setCurrentUser: () => {},
      isAuthenticated: false,
      logout: async () => {},
      loading: false,
      initError: null,
      subscription: null,
      subscriptionExpired: false,
    };
  }
  return context;
}

// Map Supabase Auth user → internal User type
function mapSupabaseUser(supabaseUser: SupabaseUser): User {
  const meta = supabaseUser.user_metadata || {};
  const roleMap: Record<string, Role> = {
    ADMIN: Role.ADMIN,
    CONSULTANT: Role.CONSULTANT,
    CLIENT_OWNER: Role.CLIENT_OWNER,
    CLIENT_CONTRIBUTOR: Role.CLIENT_CONTRIBUTOR,
    AUDITOR: Role.AUDITOR,
    VIEWER: Role.VIEWER,
  };
  return {
    id: supabaseUser.id,
    name: meta.name || supabaseUser.email?.split('@')[0] || 'Utilisateur',
    email: supabaseUser.email || '',
    role: roleMap[meta.role as string] ?? Role.CLIENT_OWNER,
    organizationId: meta.organizationId || supabaseUser.id,
    organizationName: meta.organizationName || 'Mon Organisation',
    consentCGU: meta.consentCGU,
    consentAI: meta.consentAI,
  };
}
