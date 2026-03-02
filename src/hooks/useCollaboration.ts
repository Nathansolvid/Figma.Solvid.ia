// ============================================================================
// USE COLLABORATION HOOK - Phase 8
// ============================================================================
// Hook pour gérer la collaboration temps réel sur un pack/entité

import { useState, useEffect } from "react";

interface ActiveUser {
  id: string;
  name: string;
  avatar?: string;
  lastActivity: string;
}

interface CollaborationEvent {
  id: string;
  type: "comment" | "indicator_update" | "status_change";
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

export function useCollaboration(entityId?: string | null) {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [recentEvents, setRecentEvents] = useState<CollaborationEvent[]>([]);

  useEffect(() => {
    if (!entityId) return;

    // TODO: Implement real-time presence detection
    // For now, return empty arrays as mock data
    setActiveUsers([]);
    setRecentEvents([]);
  }, [entityId]);

  const notifyIndicatorUpdate = (indicatorId: string, action: string) => {
    // TODO: Send real-time notification to other users
    console.log(`Indicator ${indicatorId} updated: ${action}`);
  };

  const notifyCommentUpdate = (commentId: string) => {
    // TODO: Send real-time notification to other users
    console.log(`Comment ${commentId} added`);
  };

  return {
    activeUsers,
    recentEvents,
    notifyIndicatorUpdate,
    notifyCommentUpdate,
  };
}
