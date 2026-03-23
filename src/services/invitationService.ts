/**
 * INVITATION SERVICE - Gestion des invitations et abonnements
 *
 * Système d'accès sur invitation uniquement :
 * - Un admin/owner invite des utilisateurs par email via Supabase
 * - Chaque invitation a une date d'expiration liée à l'abonnement
 * - À la connexion, on vérifie que l'accès est encore valide
 *
 * Les invitations sont stockées localement (IndexedDB) + métadonnées Supabase.
 */

import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { syncEngine } from '@/services/syncEngine';

// ==================== TYPES ====================

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export type SubscriptionPlan = 'trial' | 'starter' | 'professional' | 'enterprise';

export interface Invitation {
  id: string;
  email: string;
  role: string;
  organizationId: string;
  organizationName: string;
  invitedBy: string;         // userId of inviter
  invitedByName: string;     // Name of inviter
  status: InvitationStatus;
  subscriptionPlan: SubscriptionPlan;
  expiresAt: string;         // ISO date — when access expires
  createdAt: string;
  acceptedAt?: string;
  acceptedUserId?: string;   // Supabase userId once accepted
}

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  expiresAt: string;
  isActive: boolean;
  daysRemaining: number;
}

// ==================== PLAN DURATIONS ====================

/** Default subscription durations (in days) per plan */
export const PLAN_DURATIONS: Record<SubscriptionPlan, number> = {
  trial: 14,           // 14 jours d'essai
  starter: 365,        // 1 an
  professional: 365,   // 1 an
  enterprise: 730,     // 2 ans
};

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  trial: 'Essai gratuit (14 jours)',
  starter: 'Starter (1 an)',
  professional: 'Professionnel (1 an)',
  enterprise: 'Entreprise (2 ans)',
};

// ==================== LOCAL STORAGE KEYS ====================

const INVITATIONS_KEY = 'solvid_invitations';
const SUBSCRIPTIONS_KEY = 'solvid_subscriptions';

// ==================== INVITATION SERVICE ====================

class InvitationService {
  private static instance: InvitationService;

  private constructor() {}

  static getInstance(): InvitationService {
    if (!InvitationService.instance) {
      InvitationService.instance = new InvitationService();
    }
    return InvitationService.instance;
  }

  // ---- Storage helpers ----

  private getInvitations(): Invitation[] {
    try {
      const data = localStorage.getItem(INVITATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveInvitations(invitations: Invitation[]): void {
    localStorage.setItem(INVITATIONS_KEY, JSON.stringify(invitations));
    // Sync each invitation to Supabase (fire-and-forget)
    for (const inv of invitations) {
      syncEngine.syncToCloud('invitations', 'UPDATE', {
        id: inv.id,
        email: inv.email,
        role: inv.role,
        organization_id: inv.organizationId,
        organization_name: inv.organizationName,
        invited_by: inv.invitedBy,
        invited_by_name: inv.invitedByName,
        status: inv.status,
        subscription_plan: inv.subscriptionPlan,
        expires_at: inv.expiresAt,
        created_at: inv.createdAt,
        accepted_at: inv.acceptedAt || null,
        accepted_user_id: inv.acceptedUserId || null,
      }).catch(() => {});
    }
  }

  private getSubscriptions(): Record<string, SubscriptionInfo> {
    try {
      const data = localStorage.getItem(SUBSCRIPTIONS_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private saveSubscriptions(subs: Record<string, SubscriptionInfo>): void {
    localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(subs));
  }

  // ---- Invitation Management ----

  /**
   * Create a new invitation and send it via Supabase
   */
  async inviteUser(params: {
    email: string;
    role: string;
    organizationId: string;
    organizationName: string;
    invitedBy: string;
    invitedByName: string;
    plan: SubscriptionPlan;
  }): Promise<Invitation> {

    // Check if already invited
    const existing = this.getInvitations().find(
      (i) => i.email.toLowerCase() === params.email.toLowerCase() && i.status === 'pending'
    );
    if (existing) {
      throw new Error('Cet utilisateur a déjà une invitation en attente.');
    }

    // Calculate expiration based on plan
    const now = new Date();
    const durationDays = PLAN_DURATIONS[params.plan];
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // Create local invitation record
    const invitation: Invitation = {
      id: uuidv4(),
      email: params.email.toLowerCase(),
      role: params.role,
      organizationId: params.organizationId,
      organizationName: params.organizationName,
      invitedBy: params.invitedBy,
      invitedByName: params.invitedByName,
      status: 'pending',
      subscriptionPlan: params.plan,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
    };

    // Try to invite via Supabase Auth (magic link / invite)
    try {
      const { error } = await supabase.auth.admin.inviteUserByEmail(params.email, {
        data: {
          name: '',
          role: params.role,
          organization_name: params.organizationName,
          organization_id: params.organizationId,
          invitation_id: invitation.id,
          subscription_plan: params.plan,
          subscription_expires_at: expiresAt.toISOString(),
        },
      });

      if (error) {
        // Admin API may not be available with anon key
        // Fallback: use signUp with a generated password (user will reset)
        console.warn('⚠️ Admin invite not available, using signUp fallback:', error.message);

        const tempPassword = `Temp_${uuidv4().slice(0, 8)}!`;
        const { error: signupError } = await supabase.auth.signUp({
          email: params.email,
          password: tempPassword,
          options: {
            data: {
              name: '',
              role: params.role,
              organization_name: params.organizationName,
              organization_id: params.organizationId,
              invitation_id: invitation.id,
              subscription_plan: params.plan,
              subscription_expires_at: expiresAt.toISOString(),
            },
          },
        });

        if (signupError) {
          console.error('❌ Signup fallback error:', signupError.message);
          // Still save locally for admin tracking
        }

        // Send password reset so the invited user sets their own password
        try {
          await supabase.auth.resetPasswordForEmail(params.email, {
            redirectTo: window.location.origin,
          });
        } catch (resetErr) {
          console.warn('⚠️ Could not send reset email:', resetErr);
        }
      } else {
      }
    } catch (err) {
      console.warn('⚠️ Supabase invite error (continuing with local):', err);
    }

    // Save locally
    const invitations = this.getInvitations();
    invitations.push(invitation);
    this.saveInvitations(invitations);

    return invitation;
  }

  /**
   * List all invitations for an organization
   */
  listInvitations(organizationId?: string): Invitation[] {
    let invitations = this.getInvitations();

    if (organizationId) {
      invitations = invitations.filter((i) => i.organizationId === organizationId);
    }

    // Auto-expire old invitations
    const now = new Date();
    let changed = false;
    invitations = invitations.map((inv) => {
      if (inv.status === 'pending' && new Date(inv.expiresAt) < now) {
        changed = true;
        return { ...inv, status: 'expired' as InvitationStatus };
      }
      return inv;
    });

    if (changed) {
      this.saveInvitations(invitations);
    }

    return invitations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Revoke an invitation
   */
  revokeInvitation(invitationId: string): void {
    const invitations = this.getInvitations();
    const idx = invitations.findIndex((i) => i.id === invitationId);
    if (idx >= 0) {
      invitations[idx].status = 'revoked';
      this.saveInvitations(invitations);
    }
  }

  /**
   * Mark invitation as accepted when user first logs in
   */
  markAccepted(email: string, userId: string): void {
    const invitations = this.getInvitations();
    const idx = invitations.findIndex(
      (i) => i.email.toLowerCase() === email.toLowerCase() && i.status === 'pending'
    );
    if (idx >= 0) {
      invitations[idx].status = 'accepted';
      invitations[idx].acceptedAt = new Date().toISOString();
      invitations[idx].acceptedUserId = userId;
      this.saveInvitations(invitations);

      // Create subscription record
      this.activateSubscription(userId, {
        plan: invitations[idx].subscriptionPlan,
        expiresAt: invitations[idx].expiresAt,
      });

    }
  }

  // ---- Subscription Management ----

  /**
   * Activate a subscription for a user
   */
  activateSubscription(userId: string, params: { plan: SubscriptionPlan; expiresAt: string }): void {
    const subs = this.getSubscriptions();
    const expires = new Date(params.expiresAt);
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((expires.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

    subs[userId] = {
      plan: params.plan,
      expiresAt: params.expiresAt,
      isActive: daysRemaining > 0,
      daysRemaining,
    };

    this.saveSubscriptions(subs);
  }

  /**
   * Check if a user's subscription is still valid
   */
  checkSubscription(userId: string): { valid: boolean; info: SubscriptionInfo | null; reason?: string } {
    const subs = this.getSubscriptions();
    const sub = subs[userId];

    if (!sub) {
      // Check by looking at invitation records
      const invitations = this.getInvitations();
      const accepted = invitations.find((i) => i.acceptedUserId === userId && i.status === 'accepted');

      if (accepted) {
        // Reconstruct subscription
        this.activateSubscription(userId, {
          plan: accepted.subscriptionPlan,
          expiresAt: accepted.expiresAt,
        });
        return this.checkSubscription(userId);
      }

      // No subscription found — could be the first admin or a directly created user
      // Allow access with a default "enterprise" subscription (admin self-access)
      return { valid: true, info: null };
    }

    const now = new Date();
    const expires = new Date(sub.expiresAt);
    const daysRemaining = Math.max(0, Math.ceil((expires.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
    const isActive = expires > now;

    // Update stored info
    sub.isActive = isActive;
    sub.daysRemaining = daysRemaining;
    subs[userId] = sub;
    this.saveSubscriptions(subs);

    if (!isActive) {
      return {
        valid: false,
        info: sub,
        reason: `Votre abonnement ${PLAN_LABELS[sub.plan]} a expiré le ${expires.toLocaleDateString('fr-FR')}.`,
      };
    }

    return { valid: true, info: sub };
  }

  /**
   * Get subscription info for a user (for display in UI)
   */
  getSubscriptionInfo(userId: string): SubscriptionInfo | null {
    const result = this.checkSubscription(userId);
    return result.info;
  }

  /**
   * Extend/renew a user's subscription
   */
  renewSubscription(userId: string, plan: SubscriptionPlan): void {
    const now = new Date();
    const durationDays = PLAN_DURATIONS[plan];
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    this.activateSubscription(userId, {
      plan,
      expiresAt: expiresAt.toISOString(),
    });

  }

  /**
   * Get invitation by email (for checking if user was invited)
   */
  getInvitationByEmail(email: string): Invitation | null {
    const invitations = this.getInvitations();
    return invitations.find(
      (i) => i.email.toLowerCase() === email.toLowerCase() &&
        (i.status === 'pending' || i.status === 'accepted')
    ) || null;
  }
}

// ==================== EXPORT SINGLETON ====================

export const invitationService = InvitationService.getInstance();
