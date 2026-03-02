/**
 * AUTH SERVICE - Authentification locale simulée (NO BLOCAGE)
 * 
 * Principe :
 * - Créer compte = crée user local + session
 * - Se connecter = retrouve user ou crée automatiquement
 * - Pas d'échec bloquant, mode no-friction
 * - Session persistée dans localStorage + IndexedDB
 */

import { dataProvider, User, Organization, Session } from './dataProvider';
import { v4 as uuidv4 } from 'uuid';

export interface LoginCredentials {
  email: string;
  password?: string; // Optionnel en mode local
}

export interface SignupData {
  email: string;
  name: string;
  password?: string; // Optionnel en mode local
  organizationName?: string;
  role?: string;
}

export interface AuthResult {
  user: User;
  organization: Organization;
  session: Session;
}

// ==================== AUTH SERVICE ====================

class AuthService {
  private static instance: AuthService;
  private currentSession: Session | null = null;

  private constructor() {
    this.loadSessionFromStorage();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Load session from localStorage on app init
   */
  private loadSessionFromStorage(): void {
    try {
      const sessionStr = localStorage.getItem('solvid_session');
      if (sessionStr) {
        this.currentSession = JSON.parse(sessionStr);
        console.log('✅ Session restored:', this.currentSession);
      }
    } catch (error) {
      console.error('❌ Failed to restore session:', error);
    }
  }

  /**
   * Save session to localStorage
   */
  private saveSessionToStorage(session: Session): void {
    localStorage.setItem('solvid_session', JSON.stringify(session));
    this.currentSession = session;
    console.log('✅ Session saved:', session);
  }

  /**
   * Clear session
   */
  private clearSessionFromStorage(): void {
    localStorage.removeItem('solvid_session');
    this.currentSession = null;
    console.log('✅ Session cleared');
  }

  /**
   * Get current session
   */
  getSession(): Session | null {
    return this.currentSession;
  }

  /**
   * Sign up (create new user + organization)
   * NO BLOCAGE : Toujours réussit
   */
  async signup(data: SignupData): Promise<AuthResult> {
    console.log('🔐 Signup:', data);

    try {
      // 1. Create organization (if not provided)
      let organization: Organization;
      const existingOrgs = await dataProvider.store.list('organizations');
      
      if (existingOrgs.length > 0 && !data.organizationName) {
        // Use first existing org
        organization = existingOrgs[0];
      } else {
        organization = {
          id: uuidv4(),
          name: data.organizationName || 'Ma Société',
          createdAt: new Date().toISOString(),
        };
        await dataProvider.store.create('organizations', organization);
      }

      // 2. Check if user already exists
      const existingUsers = await dataProvider.store.list('users');
      let user = existingUsers.find((u) => u.email === data.email);

      if (user) {
        console.log('⚠️ User already exists, logging in instead');
      } else {
        // 3. Create user
        user = {
          id: uuidv4(),
          email: data.email,
          name: data.name,
          role: data.role || 'CLIENT_OWNER',
          organizationId: organization.id,
          createdAt: new Date().toISOString(),
        };
        await dataProvider.store.create('users', user);

        // 4. Log action
        await dataProvider.store.logAction({
          entityType: 'user',
          entityId: user.id,
          action: 'USER_CREATED',
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          details: JSON.stringify({ email: user.email }),
        });
      }

      // 5. Create session
      const session: Session = {
        userId: user.id,
        role: user.role,
        organizationId: organization.id,
        email: user.email,
        tokenFake: `fake_token_${uuidv4()}`,
        createdAt: new Date().toISOString(),
      };

      await dataProvider.store.create('sessions', session);
      this.saveSessionToStorage(session);

      console.log('✅ Signup successful:', { user, organization, session });

      return { user, organization, session };
    } catch (error) {
      console.error('❌ Signup error:', error);
      
      // FALLBACK : Create minimal account anyway (NO BLOCAGE)
      const fallbackOrg: Organization = {
        id: uuidv4(),
        name: data.organizationName || 'Ma Société',
        createdAt: new Date().toISOString(),
      };

      const fallbackUser: User = {
        id: uuidv4(),
        email: data.email,
        name: data.name,
        role: data.role || 'CLIENT_OWNER',
        organizationId: fallbackOrg.id,
        createdAt: new Date().toISOString(),
      };

      const fallbackSession: Session = {
        userId: fallbackUser.id,
        role: fallbackUser.role,
        organizationId: fallbackOrg.id,
        email: fallbackUser.email,
        tokenFake: `fake_token_${uuidv4()}`,
        createdAt: new Date().toISOString(),
      };

      this.saveSessionToStorage(fallbackSession);

      return { 
        user: fallbackUser, 
        organization: fallbackOrg, 
        session: fallbackSession 
      };
    }
  }

  /**
   * Login
   * NO BLOCAGE : Si user n'existe pas, on le crée automatiquement (mode no-friction)
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    console.log('🔐 Login:', credentials);

    try {
      // 1. Find user by email
      const users = await dataProvider.store.list('users');
      let user = users.find((u) => u.email === credentials.email);

      if (!user) {
        console.log('⚠️ User not found, creating automatically (no-friction mode)');
        
        // Auto-create user (NO BLOCAGE)
        return await this.signup({
          email: credentials.email,
          name: credentials.email.split('@')[0],
          password: credentials.password,
        });
      }

      // 2. Get organization
      const organization = await dataProvider.store.read('organizations', user.organizationId);
      
      if (!organization) {
        throw new Error('Organization not found');
      }

      // 3. Create session
      const session: Session = {
        userId: user.id,
        role: user.role,
        organizationId: user.organizationId,
        email: user.email,
        tokenFake: `fake_token_${uuidv4()}`,
        createdAt: new Date().toISOString(),
      };

      await dataProvider.store.update('sessions', session);
      this.saveSessionToStorage(session);

      // 4. Log action
      await dataProvider.store.logAction({
        entityType: 'user',
        entityId: user.id,
        action: 'USER_LOGGED_IN',
        userId: user.id,
        userName: user.name,
        userRole: user.role,
      });

      console.log('✅ Login successful:', { user, organization, session });

      return { user, organization, session };
    } catch (error) {
      console.error('❌ Login error:', error);
      
      // FALLBACK : Si tout échoue, créer compte quand même
      return await this.signup({
        email: credentials.email,
        name: credentials.email.split('@')[0],
        password: credentials.password,
      });
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    console.log('🔐 Logout');

    const session = this.getSession();
    
    if (session) {
      // Log action
      const user = await dataProvider.store.read('users', session.userId);
      
      if (user) {
        await dataProvider.store.logAction({
          entityType: 'user',
          entityId: user.id,
          action: 'USER_LOGGED_OUT',
          userId: user.id,
          userName: user.name,
          userRole: user.role,
        });
      }

      // Delete session
      await dataProvider.store.delete('sessions', session.userId);
    }

    this.clearSessionFromStorage();
    console.log('✅ Logout successful');
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    const session = this.getSession();
    if (!session) return null;

    return await dataProvider.store.read('users', session.userId);
  }

  /**
   * Get current organization
   */
  async getCurrentOrganization(): Promise<Organization | null> {
    const session = this.getSession();
    if (!session) return null;

    return await dataProvider.store.read('organizations', session.organizationId);
  }

  /**
   * Switch user (for testing different roles)
   */
  async switchUser(userId: string): Promise<AuthResult | null> {
    console.log('🔄 Switch user:', userId);

    try {
      const user = await dataProvider.store.read('users', userId);
      if (!user) {
        console.error('❌ User not found:', userId);
        return null;
      }

      const organization = await dataProvider.store.read('organizations', user.organizationId);
      if (!organization) {
        console.error('❌ Organization not found:', user.organizationId);
        return null;
      }

      const session: Session = {
        userId: user.id,
        role: user.role,
        organizationId: user.organizationId,
        email: user.email,
        tokenFake: `fake_token_${uuidv4()}`,
        createdAt: new Date().toISOString(),
      };

      await dataProvider.store.update('sessions', session);
      this.saveSessionToStorage(session);

      // Log action
      await dataProvider.store.logAction({
        entityType: 'user',
        entityId: user.id,
        action: 'USER_SWITCHED',
        userId: user.id,
        userName: user.name,
        userRole: user.role,
      });

      console.log('✅ User switched:', { user, organization, session });

      return { user, organization, session };
    } catch (error) {
      console.error('❌ Switch user error:', error);
      return null;
    }
  }

  /**
   * Create test users for different roles
   */
  async createTestUsers(organizationId: string): Promise<User[]> {
    console.log('🧪 Creating test users for organization:', organizationId);

    const testUsers: Omit<User, 'id' | 'createdAt'>[] = [
      {
        email: 'owner@solvid.test',
        name: 'Alice Directrice',
        role: 'CLIENT_OWNER',
        organizationId,
      },
      {
        email: 'contributor@solvid.test',
        name: 'Bob Analyste',
        role: 'CLIENT_CONTRIBUTOR',
        organizationId,
      },
      {
        email: 'consultant@solvid.test',
        name: 'Charlie Consultant',
        role: 'CONSULTANT',
        organizationId,
      },
      {
        email: 'auditor@solvid.test',
        name: 'David Auditeur',
        role: 'AUDITOR',
        organizationId,
      },
      {
        email: 'viewer@solvid.test',
        name: 'Eve Observatrice',
        role: 'VIEWER',
        organizationId,
      },
    ];

    const created: User[] = [];

    for (const userData of testUsers) {
      try {
        const existingUsers = await dataProvider.store.list('users');
        const existing = existingUsers.find((u) => u.email === userData.email);

        if (existing) {
          console.log('⚠️ Test user already exists:', userData.email);
          created.push(existing);
        } else {
          const user: User = {
            ...userData,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
          };

          await dataProvider.store.create('users', user);
          created.push(user);
          console.log('✅ Test user created:', user.email);
        }
      } catch (error) {
        console.error('❌ Failed to create test user:', userData.email, error);
      }
    }

    return created;
  }
}

// ==================== EXPORT SINGLETON ====================

export const authService = AuthService.getInstance();
