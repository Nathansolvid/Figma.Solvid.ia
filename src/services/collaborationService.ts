/**
 * COLLABORATION SERVICE - Real-time collaboration via Supabase Realtime + BroadcastChannel fallback
 *
 * Multi-user: Supabase Realtime (Presence + Broadcast channels)
 * Same-browser: BroadcastChannel fallback when Supabase unavailable
 */

import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type CollaborationEvent =
  | { type: 'user_joined'; userId: string; userName: string; timestamp: string }
  | { type: 'user_left'; userId: string; timestamp: string }
  | { type: 'indicator_updated'; packId: string; indicatorId: string; userId: string; userName: string; timestamp: string }
  | { type: 'comment_updated'; packId: string; indicatorId: string; userId: string; userName: string; comment: string; timestamp: string }
  | { type: 'evidence_uploaded'; packId: string; indicatorId: string; userId: string; userName: string; timestamp: string }
  | { type: 'pack_updated'; packId: string; userId: string; userName: string; timestamp: string }
  | { type: 'user_cursor'; packId: string; userId: string; userName: string; x: number; y: number; timestamp: string };

export interface ActiveUser {
  userId: string;
  userName: string;
  lastSeen: string;
  currentPack?: string;
  isEditing?: boolean;
  isOnline?: boolean;
}

class CollaborationService {
  private static instance: CollaborationService;

  // Channels
  private localChannel: BroadcastChannel | null = null;
  private supabaseChannel: RealtimeChannel | null = null;
  private useSupabase = false;

  // State
  private listeners: Map<string, Set<(event: CollaborationEvent) => void>> = new Map();
  private activeUsers: Map<string, ActiveUser> = new Map();
  private currentUserId = '';
  private currentUserName = '';
  private orgId = '';

  private constructor() {
    // BroadcastChannel as local fallback
    if (typeof BroadcastChannel !== 'undefined') {
      this.localChannel = new BroadcastChannel('solvid-collaboration');
      this.setupLocalHandler();
    }
  }

  static getInstance(): CollaborationService {
    if (!CollaborationService.instance) {
      CollaborationService.instance = new CollaborationService();
    }
    return CollaborationService.instance;
  }

  // ─── Initialize ───────────────────────────────────────────────────────────

  initialize(userId: string, userName: string, organizationId?: string) {
    this.currentUserId = userId;
    this.currentUserName = userName;
    this.orgId = organizationId || '';

    // Try Supabase Realtime for multi-user collaboration
    this.initSupabaseRealtime();

    // Broadcast user joined
    this.broadcast({
      type: 'user_joined',
      userId,
      userName,
      timestamp: new Date().toISOString(),
    });
  }

  // ─── Supabase Realtime ────────────────────────────────────────────────────

  private initSupabaseRealtime() {
    try {
      const channelName = this.orgId ? `collab:${this.orgId}` : 'collab:global';

      this.supabaseChannel = supabase.channel(channelName, {
        config: { presence: { key: this.currentUserId } },
      });

      // Presence: track who's online
      this.supabaseChannel
        .on('presence', { event: 'sync' }, () => {
          const state = this.supabaseChannel?.presenceState() || {};
          // Update active users from presence
          const onlineIds = new Set<string>();
          for (const [, presences] of Object.entries(state)) {
            for (const p of presences as Array<{ userId: string; userName: string }>) {
              if (p.userId && p.userId !== this.currentUserId) {
                onlineIds.add(p.userId);
                this.activeUsers.set(p.userId, {
                  userId: p.userId,
                  userName: p.userName || 'Utilisateur',
                  lastSeen: new Date().toISOString(),
                  isOnline: true,
                });
              }
            }
          }
          // Mark users not in presence as offline
          for (const [uid, user] of this.activeUsers) {
            if (!onlineIds.has(uid)) user.isOnline = false;
          }
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          for (const p of newPresences as Array<{ userId: string; userName: string }>) {
            if (p.userId && p.userId !== this.currentUserId) {
              this.activeUsers.set(p.userId, {
                userId: p.userId,
                userName: p.userName || 'Utilisateur',
                lastSeen: new Date().toISOString(),
                isOnline: true,
              });
              this.notifyListeners({
                type: 'user_joined',
                userId: p.userId,
                userName: p.userName || 'Utilisateur',
                timestamp: new Date().toISOString(),
              });
            }
          }
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          for (const p of leftPresences as Array<{ userId: string }>) {
            if (p.userId) {
              const user = this.activeUsers.get(p.userId);
              if (user) user.isOnline = false;
              this.notifyListeners({
                type: 'user_left',
                userId: p.userId,
                timestamp: new Date().toISOString(),
              });
            }
          }
        });

      // Broadcast: receive collaboration events from other users
      this.supabaseChannel.on('broadcast', { event: 'collab_event' }, ({ payload }) => {
        const collabEvent = payload as CollaborationEvent;
        if ('userId' in collabEvent && collabEvent.userId === this.currentUserId) return; // Ignore own
        this.handleIncomingEvent(collabEvent);
      });

      // Subscribe and track presence
      this.supabaseChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          this.useSupabase = true;
          await this.supabaseChannel?.track({
            userId: this.currentUserId,
            userName: this.currentUserName,
            online_at: new Date().toISOString(),
          });
          console.log('[Collab] Supabase Realtime connected');
        }
      });
    } catch (err) {
      console.warn('[Collab] Supabase Realtime unavailable, using local only:', err);
      this.useSupabase = false;
    }
  }

  // ─── Local BroadcastChannel ───────────────────────────────────────────────

  private setupLocalHandler() {
    if (!this.localChannel) return;
    this.localChannel.onmessage = (event) => {
      const collabEvent = event.data as CollaborationEvent;
      this.handleIncomingEvent(collabEvent);
    };
  }

  // ─── Event handling ───────────────────────────────────────────────────────

  private handleIncomingEvent(event: CollaborationEvent) {
    // Update active users
    if (event.type === 'user_joined') {
      this.activeUsers.set(event.userId, {
        userId: event.userId,
        userName: event.userName,
        lastSeen: event.timestamp,
        isOnline: true,
      });
    } else if (event.type === 'user_left') {
      const user = this.activeUsers.get(event.userId);
      if (user) user.isOnline = false;
    } else if ('userId' in event) {
      const user = this.activeUsers.get(event.userId);
      if (user) {
        user.lastSeen = event.timestamp;
        if ('packId' in event) user.currentPack = event.packId;
      }
    }

    this.notifyListeners(event);
  }

  private notifyListeners(event: CollaborationEvent) {
    this.listeners.get(event.type)?.forEach(cb => cb(event));
    this.listeners.get('all')?.forEach(cb => cb(event));
  }

  // ─── Broadcast ────────────────────────────────────────────────────────────

  broadcast(event: CollaborationEvent) {
    // Send via Supabase Realtime (multi-user)
    if (this.useSupabase && this.supabaseChannel) {
      this.supabaseChannel.send({
        type: 'broadcast',
        event: 'collab_event',
        payload: event,
      });
    }

    // Also send via local BroadcastChannel (same-browser tabs)
    if (this.localChannel) {
      try {
        this.localChannel.postMessage(event);
      } catch { /* channel may be closed */ }
    }
  }

  // ─── Subscribe ────────────────────────────────────────────────────────────

  subscribe(
    eventType: CollaborationEvent['type'] | 'all',
    callback: (event: CollaborationEvent) => void,
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
    return () => { this.listeners.get(eventType)?.delete(callback); };
  }

  // ─── Notify helpers ───────────────────────────────────────────────────────

  notifyIndicatorUpdate(packId: string, indicatorId: string) {
    this.broadcast({
      type: 'indicator_updated', packId, indicatorId,
      userId: this.currentUserId, userName: this.currentUserName,
      timestamp: new Date().toISOString(),
    });
  }

  notifyCommentUpdate(packId: string, indicatorId: string, comment: string) {
    this.broadcast({
      type: 'comment_updated', packId, indicatorId, comment,
      userId: this.currentUserId, userName: this.currentUserName,
      timestamp: new Date().toISOString(),
    });
  }

  notifyEvidenceUpload(packId: string, indicatorId: string) {
    this.broadcast({
      type: 'evidence_uploaded', packId, indicatorId,
      userId: this.currentUserId, userName: this.currentUserName,
      timestamp: new Date().toISOString(),
    });
  }

  notifyPackUpdate(packId: string) {
    this.broadcast({
      type: 'pack_updated', packId,
      userId: this.currentUserId, userName: this.currentUserName,
      timestamp: new Date().toISOString(),
    });
  }

  // ─── Active Users ─────────────────────────────────────────────────────────

  getActiveUsers(): ActiveUser[] {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Clean stale users (only for non-Supabase tracked)
    for (const [userId, user] of this.activeUsers) {
      if (!user.isOnline && new Date(user.lastSeen) < fiveMinutesAgo) {
        this.activeUsers.delete(userId);
      }
    }

    return Array.from(this.activeUsers.values()).filter(
      user => user.userId !== this.currentUserId,
    );
  }

  getActiveUsersForPack(packId: string): ActiveUser[] {
    return this.getActiveUsers().filter(u => u.currentPack === packId);
  }

  /** Whether real-time multi-user is active (Supabase) */
  get isMultiUser(): boolean {
    return this.useSupabase;
  }

  // ─── Disconnect ───────────────────────────────────────────────────────────

  disconnect() {
    if (this.currentUserId) {
      this.broadcast({
        type: 'user_left',
        userId: this.currentUserId,
        timestamp: new Date().toISOString(),
      });
    }

    // Unsubscribe Supabase
    if (this.supabaseChannel) {
      supabase.removeChannel(this.supabaseChannel);
      this.supabaseChannel = null;
      this.useSupabase = false;
    }

    // Close local channel
    if (this.localChannel) {
      this.localChannel.close();
      this.localChannel = null;
    }

    this.listeners.clear();
    this.activeUsers.clear();
  }
}

export const collaborationService = CollaborationService.getInstance();
