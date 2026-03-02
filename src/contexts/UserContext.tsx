import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Role } from '@/permissions';
import { authService } from '@/services/authService';
import { dataProvider } from '@/services/dataProvider';
import { packService } from '@/services/packService';
import { collaborationService } from '@/services/collaborationService'; // 🆕 Collaboration service

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId: string;
  organizationName?: string;
  avatar?: string;
}

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  loading: boolean;
  initError: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Check session on mount (local session from authService)
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('🔍 UserContext - checkSession starting (LOCAL MODE)...');
        
        // Initialize dataProvider
        console.log('🔍 UserContext - Initializing dataProvider...');
        await dataProvider.init();
        console.log('✅ DataProvider initialized');
        
        // Initialize packService (seed templates)
        console.log('🔍 UserContext - Seeding pack templates...');
        await packService.seedTemplates();
        console.log('✅ Pack templates initialized');
        
        // Check for local session
        console.log('🔍 UserContext - Checking local session...');
        const session = authService.getSession();
        console.log('🔍 UserContext - Session:', session);
        
        if (session) {
          const user = await authService.getCurrentUser();
          const org = await authService.getCurrentOrganization();
          
          if (user && org) {
            const mappedUser: User = {
              id: user.id,
              name: user.name,
              email: user.email,
              role: mapRoleStringToEnum(user.role),
              organizationId: user.organizationId,
              organizationName: org.name,
              avatar: user.avatar,
            };
            
            setCurrentUserState(mappedUser);
            
            // 🆕 Initialize collaboration for logged-in user
            collaborationService.initialize(mappedUser.id, mappedUser.name);
            console.log('👥 Collaboration initialized for user:', mappedUser.name);
            
            console.log('✅ UserContext - User restored from local session:', mappedUser);
          } else {
            console.log('⚠️ UserContext - Session exists but user/org not found');
            setCurrentUserState(null);
          }
        } else {
          console.log('🔍 UserContext - No local session found, showing login page');
          setCurrentUserState(null);
        }
      } catch (error) {
        console.error('❌ Check session error:', error);
        console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        const errorMessage = error instanceof Error ? error.message : String(error);
        setInitError(`Erreur d'initialisation: ${errorMessage}`);
        setCurrentUserState(null);
      } finally {
        console.log('✅ UserContext - Initialization complete, setting loading=false');
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const setCurrentUser = (user: User | null) => {
    console.log('🔍 UserContext.setCurrentUser called with:', user);
    setCurrentUserState(user);
    
    // 🆕 Initialize collaboration when user logs in
    if (user) {
      collaborationService.initialize(user.id, user.name);
      console.log('👥 Collaboration initialized for new user:', user.name);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      
      // 🆕 Disconnect collaboration on logout
      collaborationService.disconnect();
      console.log('👥 Collaboration disconnected');
      
      setCurrentUser(null);
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Always clear user state locally even if logout fails
      collaborationService.disconnect();
      setCurrentUser(null);
    }
  };

  const value = {
    currentUser,
    setCurrentUser,
    isAuthenticated: !!currentUser,
    logout,
    loading,
    initError,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    // During hot reload, the context might temporarily be undefined
    // Only warn in development, and only if we're not in a hot reload scenario
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ useUser called outside UserProvider - returning default values');
      console.warn('This is often caused by React Hot Module Reload and can be safely ignored.');
    }
    return {
      currentUser: null,
      setCurrentUser: () => {},
      isAuthenticated: false,
      logout: async () => {},
      loading: false,
      initError: null,
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
    // Support for direct enum values from local storage
    'CLIENT_OWNER': Role.CLIENT_OWNER,
    'CONSULTANT': Role.CONSULTANT,
    'AUDITOR': Role.AUDITOR,
    'CLIENT_CONTRIBUTOR': Role.CLIENT_CONTRIBUTOR,
    'ADMIN': Role.ADMIN,
    'VIEWER': Role.VIEWER,
  };
  return mapping[roleString] || Role.VIEWER;
}

// Mock users pour développement
export const MOCK_USERS: User[] = [
  {
    id: 'admin-001',
    name: 'Sophie Martin',
    email: 'sophie.martin@solvid.fr',
    role: Role.ADMIN,
    organizationId: 'org-001',
    organizationName: 'Solvid Demo Org',
    avatar: '👩‍💼',
  },
  {
    id: 'client-001',
    name: 'Jean Dupont',
    email: 'jean.dupont@client.com',
    role: Role.CLIENT_CONTRIBUTOR,
    organizationId: 'org-001',
    organizationName: 'Solvid Demo Org',
    avatar: '👤',
  },
  {
    id: 'consultant-001',
    name: 'Marie Leroy',
    email: 'marie.leroy@consultant.com',
    role: Role.CONSULTANT,
    organizationId: 'org-001',
    organizationName: 'Solvid Demo Org',
    avatar: '👩‍🔬',
  },
  {
    id: 'auditor-001',
    name: 'Pierre Durand',
    email: 'pierre.durand@audit.com',
    role: Role.AUDITOR,
    organizationId: 'org-001',
    organizationName: 'Solvid Demo Org',
    avatar: '🔍',
  },
  {
    id: 'viewer-001',
    name: 'Claire Moreau',
    email: 'claire.moreau@viewer.com',
    role: Role.VIEWER,
    organizationId: 'org-001',
    organizationName: 'Solvid Demo Org',
    avatar: '👁️',
  },
];