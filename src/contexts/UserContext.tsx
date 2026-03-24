// Auth via Supabase — server-side credentials, no localStorage passwords
import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { Role } from '@/permissions';
import { dataProvider } from '@/services/dataProvider';
import { packService } from '@/services/packService';
import { collaborationService } from '@/services/collaborationService';
import type { SubscriptionInfo } from '@/services/invitationService';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId: string;
  organizationName?: string;
  avatar?: string;
  consentCGU?: string;   // ISO timestamp of CGU consent
  consentAI?: string;    // ISO timestamp of AI consent
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

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);

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

    // Listen for Supabase auth state changes (login/logout from any tab)
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          const user = mapSupabaseUser(session.user);
          setCurrentUserState(user);
          collaborationService.initialize(user.id, user.name, user.organizationId);
        } else {
          setCurrentUserState(null);
        }
      }
    );

    return () => authSubscription.unsubscribe();
  }, []);

  const setCurrentUser = useCallback((user: User | null) => {
    setCurrentUserState(user);
    setSubscriptionExpired(false);

    if (user) {
      (window as any).__solvid_current_user_name = user.name;
      collaborationService.initialize(user.id, user.name);
      const subCheck = invitationService.checkSubscription(user.id);
      if (subCheck.info) {
        setSubscription(subCheck.info);
      }
    } else {
      setSubscription(null);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      collaborationService.disconnect();
      setCurrentUser(null);
      setSubscription(null);
      setSubscriptionExpired(false);
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

// Map a Supabase Auth user to our internal User type
function mapSupabaseUser(supabaseUser: SupabaseUser): User {
  const meta = supabaseUser.user_metadata || {};
  const roleStr: string = meta.role || 'CLIENT_OWNER';
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
    role: roleMap[roleStr] ?? Role.CLIENT_OWNER,
    organizationId: meta.organizationId || supabaseUser.id,
    organizationName: meta.organizationName || 'Mon Organisation',
    consentCGU: meta.consentCGU,
    consentAI: meta.consentAI,
  };
}
