/**
 * COLLABORATION SERVICE - Simulation de WebSocket pour collaboration temps réel
 * 
 * Fonctionnalités :
 * - Broadcast des modifications
 * - Détection des conflits
 * - Indicateur d'activité utilisateur
 * - Synchronisation automatique
 * 
 * Note: En mode local, utilise BroadcastChannel pour simuler WebSocket
 */

import { v4 as uuidv4 } from 'uuid';

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
}

class CollaborationService {
  private static instance: CollaborationService;
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, Set<(event: CollaborationEvent) => void>> = new Map();
  private activeUsers: Map<string, ActiveUser> = new Map();
  private currentUserId: string = '';
  private currentUserName: string = '';

  private constructor() {
    // Check if BroadcastChannel is supported
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('solvid-collaboration');
      this.setupMessageHandler();
    } else {
      console.warn('⚠️ BroadcastChannel not supported, collaboration disabled');
    }
  }

  static getInstance(): CollaborationService {
    if (!CollaborationService.instance) {
      CollaborationService.instance = new CollaborationService();
    }
    return CollaborationService.instance;
  }

  /**
   * Initialize collaboration for a user
   */
  initialize(userId: string, userName: string) {
    this.currentUserId = userId;
    this.currentUserName = userName;

    // Broadcast user joined
    this.broadcast({
      type: 'user_joined',
      userId,
      userName,
      timestamp: new Date().toISOString(),
    });

  }

  /**
   * Setup message handler for incoming events
   */
  private setupMessageHandler() {
    if (!this.channel) return;

    this.channel.onmessage = (event) => {
      const collabEvent = event.data as CollaborationEvent;
      

      // Update active users
      if (collabEvent.type === 'user_joined') {
        this.activeUsers.set(collabEvent.userId, {
          userId: collabEvent.userId,
          userName: collabEvent.userName,
          lastSeen: collabEvent.timestamp,
        });
      } else if (collabEvent.type === 'user_left') {
        this.activeUsers.delete(collabEvent.userId);
      } else if ('userId' in collabEvent) {
        // Update lastSeen for any user activity
        const user = this.activeUsers.get(collabEvent.userId);
        if (user) {
          user.lastSeen = collabEvent.timestamp;
          if ('packId' in collabEvent) {
            user.currentPack = collabEvent.packId;
          }
        }
      }

      // Notify listeners
      const eventTypeListeners = this.listeners.get(collabEvent.type);
      if (eventTypeListeners) {
        eventTypeListeners.forEach(listener => listener(collabEvent));
      }

      // Notify 'all' listeners
      const allListeners = this.listeners.get('all');
      if (allListeners) {
        allListeners.forEach(listener => listener(collabEvent));
      }
    };
  }

  /**
   * Broadcast an event to all connected users
   */
  broadcast(event: CollaborationEvent) {
    if (!this.channel) {
      return;
    }

    this.channel.postMessage(event);
  }

  /**
   * Subscribe to specific event types
   */
  subscribe(
    eventType: CollaborationEvent['type'] | 'all',
    callback: (event: CollaborationEvent) => void
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  /**
   * Notify about indicator update
   */
  notifyIndicatorUpdate(packId: string, indicatorId: string) {
    this.broadcast({
      type: 'indicator_updated',
      packId,
      indicatorId,
      userId: this.currentUserId,
      userName: this.currentUserName,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notify about comment update
   */
  notifyCommentUpdate(packId: string, indicatorId: string, comment: string) {
    this.broadcast({
      type: 'comment_updated',
      packId,
      indicatorId,
      userId: this.currentUserId,
      userName: this.currentUserName,
      comment,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notify about evidence upload
   */
  notifyEvidenceUpload(packId: string, indicatorId: string) {
    this.broadcast({
      type: 'evidence_uploaded',
      packId,
      indicatorId,
      userId: this.currentUserId,
      userName: this.currentUserName,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notify about pack update
   */
  notifyPackUpdate(packId: string) {
    this.broadcast({
      type: 'pack_updated',
      packId,
      userId: this.currentUserId,
      userName: this.currentUserName,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get list of active users
   */
  getActiveUsers(): ActiveUser[] {
    // Remove users not seen in last 5 minutes
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    Array.from(this.activeUsers.entries()).forEach(([userId, user]) => {
      if (new Date(user.lastSeen) < fiveMinutesAgo) {
        this.activeUsers.delete(userId);
      }
    });

    return Array.from(this.activeUsers.values()).filter(
      user => user.userId !== this.currentUserId
    );
  }

  /**
   * Get active users for a specific pack
   */
  getActiveUsersForPack(packId: string): ActiveUser[] {
    return this.getActiveUsers().filter(user => user.currentPack === packId);
  }

  /**
   * Cleanup on disconnect
   */
  disconnect() {
    if (this.currentUserId) {
      this.broadcast({
        type: 'user_left',
        userId: this.currentUserId,
        timestamp: new Date().toISOString(),
      });
    }

    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }

    this.listeners.clear();
    this.activeUsers.clear();
  }
}

export const collaborationService = CollaborationService.getInstance();