import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { Role } from '@/permissions';
import { authService } from '@/services/authService';
import { dataProvider } from '@/services/dataProvider';
import { packService } from '@/services/packService';
import { collaborationService } from '@/services/collaborationService';
import { invitationService, SubscriptionInfo } from '@/services/invitationService';

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
        await authService.seedAdminIfNeeded();

        // ── DEMO MODE ONLY ──────────────────────────────────────────────
        if (import.meta.env.VITE_DEMO_MODE === 'true') {
          // DEMO MODE ONLY — hardcoded dev user for local testing
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

        // ── Real auth session check ─────────────────────────────────────
        const session = authService.getSession();
        if (session) {
          try {
            const user = await dataProvider.store.read('users', session.userId);
            if (user) {
              const org = await dataProvider.store.read('organizations', user.organizationId);
              const authenticatedUser: User = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: mapRoleStringToEnum(user.role),
                organizationId: user.organizationId,
                organizationName: org?.name,
                avatar: user.avatar,
                consentCGU: user.consentCGU,
                consentAI: user.consentAI,
              };
              setCurrentUserState(authenticatedUser);
              collaborationService.initialize(authenticatedUser.id, authenticatedUser.name, authenticatedUser.organizationId);
              return;
            }
          } catch (e) {
            console.warn('[UserContext] Failed to load session user:', e);
          }
        }

        // No valid session → will show login page
        setCurrentUserState(null);
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
      await authService.logout();
      collaborationService.disconnect();
      setCurrentUser(null);
      setSubscription(null);
      setSubscriptionExpired(false);
    } catch {
      collaborationService.disconnect();
      setCurrentUser(null);
      setSubscription(null);
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

// Helper to map role strings from API to Role enum
function mapRoleStringToEnum(roleString: string): Role {
  const mapping: Record<string, Role> = {
    'Directeur ESG': Role.CLIENT_OWNER,
    'Consultant ESG': Role.CONSULTANT,
    'Auditeur externe': Role.AUDITOR,
    'Analyste données': Role.CLIENT_CONTRIBUTOR,
    'Contrôleur interne': Role.CLIENT_CONTRIBUTOR,
    'Admin': Role.ADMIN,
    'CLIENT_OWNER': Role.CLIENT_OWNER,
    'CONSULTANT': Role.CONSULTANT,
    'AUDITOR': Role.AUDITOR,
    'CLIENT_CONTRIBUTOR': Role.CLIENT_CONTRIBUTOR,
    'ADMIN': Role.ADMIN,
    'VIEWER': Role.VIEWER,
  };
  return mapping[roleString] || Role.VIEWER;
}
