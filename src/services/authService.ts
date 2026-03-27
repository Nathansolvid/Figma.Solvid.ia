/**
 * AUTH SERVICE - Authentification locale sécurisée
 *
 * - PBKDF2 (SHA-256, 100k itérations) pour le hachage des mots de passe
 * - Sessions avec tokens crypto-random et expiration 24h
 * - Seed automatique d'un compte admin au premier lancement
 */

import { dataProvider, User, Organization, Session } from './dataProvider';
import { invitationService } from './invitationService';
import { v4 as uuidv4 } from 'uuid';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  name: string;
  password: string;
  organizationName?: string;
  role?: string;
  consentCGU?: string | null;
  consentAI?: string | null;
}

export interface AuthResult {
  user: User;
  organization: Organization;
  session: Session;
}

interface StoredCredential {
  passwordHash: string;
  userId: string;
  version?: number;
}

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24h

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

  // ========== CRYPTOGRAPHIC UTILITIES ==========

  /** Generate a random hex salt (16 bytes) */
  private generateSalt(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }

  /** Generate a random session token (32 bytes) */
  private generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }

  /** PBKDF2 hash: returns "salt:derivedKeyHex" */
  private async hashPassword(password: string, salt?: string): Promise<string> {
    const actualSalt = salt || this.generateSalt();
    const encoder = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: encoder.encode(actualSalt),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );

    const hashHex = Array.from(new Uint8Array(derivedBits), b => b.toString(16).padStart(2, '0')).join('');
    return `${actualSalt}:${hashHex}`;
  }

  /** Verify a password against a stored "salt:hash" or legacy "local_*" hash */
  private async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    // Legacy hash migration support
    if (storedHash.startsWith('local_')) {
      return this.legacySimpleHash(password) === storedHash;
    }

    const [salt] = storedHash.split(':');
    if (!salt) return false;
    const computed = await this.hashPassword(password, salt);
    return computed === storedHash;
  }

  /** Legacy hash — kept only for verifying old credentials before migration */
  private legacySimpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return 'local_' + Math.abs(hash).toString(36);
  }

  // ========== SESSION MANAGEMENT ==========

  private loadSessionFromStorage(): void {
    try {
      const sessionStr = localStorage.getItem('solvid_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr) as Session;
        // Validate expiration
        if (session.expiresAt && new Date(session.expiresAt) > new Date()) {
          this.currentSession = session;
        } else {
          this.clearSessionFromStorage();
        }
      }
    } catch {
      this.clearSessionFromStorage();
    }
  }

  private saveSessionToStorage(session: Session): void {
    localStorage.setItem('solvid_session', JSON.stringify(session));
    this.currentSession = session;
  }

  private clearSessionFromStorage(): void {
    localStorage.removeItem('solvid_session');
    this.currentSession = null;
  }

  private createSession(userId: string, role: string, organizationId: string, email: string): Session {
    return {
      userId,
      role,
      organizationId,
      email,
      token: this.generateToken(),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
    };
  }

  getSession(): Session | null {
    // Re-validate expiration on access
    if (this.currentSession?.expiresAt && new Date(this.currentSession.expiresAt) <= new Date()) {
      this.clearSessionFromStorage();
      return null;
    }
    return this.currentSession;
  }

  // ========== LOCAL CREDENTIALS ==========

  private getLocalCredentials(): Record<string, StoredCredential> {
    try {
      const data = localStorage.getItem('solvid_local_credentials');
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private saveLocalCredentials(creds: Record<string, StoredCredential>): void {
    localStorage.setItem('solvid_local_credentials', JSON.stringify(creds));
  }

  // ========== ADMIN SEED ==========

  /**
   * Triggers server-side admin seeding via /api/seed-admin.
   * Credentials are never exposed to the client — they live in
   * SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD server env vars only.
   */
  async seedAdminIfNeeded(): Promise<void> {
    const internalSecret = import.meta.env.VITE_INTERNAL_SECRET;
    if (!internalSecret) return;

    try {
      await fetch('/api/seed-admin', {
        method: 'POST',
        headers: { 'x-internal-secret': internalSecret },
      });
    } catch {
      // Best-effort — no-op if server unavailable (local dev without vercel dev)
    }
  }

  // ========== PUBLIC API ==========

  async signup(data: SignupData): Promise<AuthResult> {
    const creds = this.getLocalCredentials();
    if (creds[data.email.toLowerCase()]) {
      throw new Error('Un compte existe déjà avec cet email.');
    }

    const userId = uuidv4();
    const passwordHash = await this.hashPassword(data.password);

    creds[data.email.toLowerCase()] = { passwordHash, userId, version: 2 };
    this.saveLocalCredentials(creds);

    const organization: Organization = {
      id: uuidv4(),
      name: data.organizationName || 'Ma Société',
      createdAt: new Date().toISOString(),
    };
    try { await dataProvider.store.create('organizations', organization); } catch { /* exists */ }

    const user: User = {
      id: userId,
      email: data.email,
      name: data.name,
      role: data.role || 'CLIENT_OWNER',
      organizationId: organization.id,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    try { await dataProvider.store.create('users', user); } catch { /* exists */ }

    // Pas de session ni de subscription — en attente de validation admin
    throw new Error('PENDING_APPROVAL');
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const creds = this.getLocalCredentials();
    const stored = creds[credentials.email.toLowerCase()];

    if (!stored) {
      throw new Error('Email ou mot de passe incorrect');
    }

    const passwordValid = await this.verifyPassword(credentials.password, stored.passwordHash);
    if (!passwordValid) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Migrate legacy hash to PBKDF2 on successful login
    if (!stored.version || stored.version < 2) {
      const newHash = await this.hashPassword(credentials.password);
      creds[credentials.email.toLowerCase()] = { passwordHash: newHash, userId: stored.userId, version: 2 };
      this.saveLocalCredentials(creds);
    }

    let user: User;
    try {
      const u = await dataProvider.store.read('users', stored.userId);
      if (!u) throw new Error('not found');
      user = u;
    } catch {
      throw new Error('Compte introuvable. Veuillez vous réinscrire.');
    }

    // Vérifier le statut d'approbation
    if (user.status === 'pending') {
      throw new Error('Votre compte est en attente de validation par un administrateur.');
    }
    if (user.status === 'rejected') {
      throw new Error('Votre demande d\'accès a été refusée. Contactez l\'administrateur.');
    }

    let organization: Organization;
    try {
      const o = await dataProvider.store.read('organizations', user.organizationId);
      if (!o) throw new Error('not found');
      organization = o;
    } catch {
      organization = {
        id: user.organizationId,
        name: 'Ma Société',
        createdAt: new Date().toISOString(),
      };
    }

    const session = this.createSession(user.id, user.role, organization.id, user.email);
    this.saveSessionToStorage(session);

    return { user, organization, session };
  }

  async logout(): Promise<void> {
    this.clearSessionFromStorage();
  }

  /**
   * Reset a user's password by email.
   * Returns true if the email was found and password was reset.
   */
  async resetPassword(email: string, newPassword: string): Promise<boolean> {
    const creds = this.getLocalCredentials();
    const normalizedEmail = email.toLowerCase().trim();

    if (!creds[normalizedEmail]) {
      return false; // No account with this email
    }

    // Hash the new password
    const passwordHash = await this.hashPassword(newPassword);
    creds[normalizedEmail] = {
      ...creds[normalizedEmail],
      passwordHash,
      version: 2,
    };
    this.saveLocalCredentials(creds);
    return true;
  }

  async getCurrentUser(): Promise<User | null> {
    const session = this.getSession();
    if (!session) return null;
    try {
      return await dataProvider.store.read('users', session.userId);
    } catch {
      return null;
    }
  }

  async getCurrentOrganization(): Promise<Organization | null> {
    const session = this.getSession();
    if (!session) return null;
    try {
      return await dataProvider.store.read('organizations', session.organizationId);
    } catch {
      return null;
    }
  }

  async checkSubscriptionValid(userId: string): Promise<{ valid: boolean; reason?: string }> {
    const result = invitationService.checkSubscription(userId);
    return { valid: result.valid, reason: result.reason };
  }
}

// ==================== EXPORT SINGLETON ====================

export const authService = AuthService.getInstance();
