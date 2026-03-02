// ============================================================================
// PHASE 7 - NOTIFICATIONS ROUTES
// ============================================================================
// Routes pour gérer les notifications utilisateur

import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const notifications = new Hono();

// ============================================================================
// TYPES
// ============================================================================

export interface Notification {
  id: string;
  userId: string;
  type: "PACK_READY_FOR_REVIEW" | "PACK_CHANGES_REQUESTED" | "PACK_APPROVED" | "PACK_REJECTED" | "TASK_ASSIGNED";
  title: string;
  message: string;
  packId?: string;
  packName?: string;
  dossierId?: string;
  taskId?: string;
  read: boolean;
  createdAt: string;
  createdBy?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// GET /make-server-aa780fc8/notifications - Liste des notifications
// ============================================================================

notifications.get("/notifications", async (c) => {
  try {
    const userId = c.req.header("X-User-Id");
    
    console.log('📬 GET /notifications called for userId:', userId);
    
    if (!userId) {
      console.error('❌ Missing X-User-Id header');
      return c.json({ error: "Missing X-User-Id header" }, 401);
    }

    // Récupérer toutes les clés de notifications de l'utilisateur
    const notificationKeys = await kv.getByPrefix(`user:${userId}:notification:`);
    console.log(`📬 Found ${notificationKeys.length} notification keys for user ${userId}`);
    
    // Récupérer les valeurs pour chaque clé
    const notificationsPromises = notificationKeys.map(async (key: string) => {
      const notificationId = key.split(':').pop();
      const notificationData = await kv.get(`notification:${notificationId}`);
      if (notificationData) {
        try {
          return JSON.parse(notificationData);
        } catch (e) {
          console.error('Failed to parse notification:', notificationId, e);
          return null;
        }
      }
      return null;
    });
    
    const allNotifications = (await Promise.all(notificationsPromises)).filter(Boolean);
    console.log(`📬 Loaded ${allNotifications.length} notifications`);
    
    // Trier par date décroissante
    const sortedNotifications = allNotifications.sort((a: any, b: any) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Stats
    const unreadCount = sortedNotifications.filter((n: any) => !n.isRead).length;

    return c.json({
      notifications: sortedNotifications,
      unreadCount,
      total: sortedNotifications.length,
    });
  } catch (error) {
    console.error("❌ Error fetching notifications:", error);
    return c.json({ 
      error: "Failed to fetch notifications",
      details: error.message 
    }, 500);
  }
});

// ============================================================================
// POST /make-server-aa780fc8/notifications - Créer une notification
// ============================================================================

notifications.post("/notifications", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, type, title, message, packId, packName, dossierId, taskId, createdBy, metadata } = body;

    if (!userId || !type || !title || !message) {
      return c.json({ error: "Missing required fields: userId, type, title, message" }, 400);
    }

    // Créer la notification
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      title,
      message,
      packId,
      packName,
      dossierId,
      taskId,
      read: false,
      createdAt: new Date().toISOString(),
      createdBy,
      metadata,
    };

    // Stocker avec clé préfixée par userId pour récupération facile
    const key = `notification:user:${userId}:${notification.id}`;
    await kv.set(key, notification);

    console.log(`✅ Notification created: ${notification.id} for user ${userId}`);

    return c.json({ notification }, 201);
  } catch (error) {
    console.error("❌ Error creating notification:", error);
    return c.json({ error: "Failed to create notification" }, 500);
  }
});

// ============================================================================
// PATCH /make-server-aa780fc8/notifications/:id/read - Marquer comme lu
// ============================================================================

notifications.patch("/notifications/:id/read", async (c) => {
  try {
    const notificationId = c.req.param("id");
    const userId = c.req.header("X-User-Id");

    console.log('📬 PATCH /notifications/:id/read called for:', notificationId, 'userId:', userId);

    if (!userId) {
      return c.json({ error: "Missing X-User-Id header" }, 401);
    }

    // Récupérer la notification
    const notificationData = await kv.get(`notification:${notificationId}`);

    if (!notificationData) {
      console.error('❌ Notification not found:', notificationId);
      return c.json({ error: "Notification not found" }, 404);
    }

    const notification = JSON.parse(notificationData);

    // Vérifier que l'utilisateur est bien le propriétaire
    if (notification.userId !== userId) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    // Marquer comme lu
    notification.isRead = true;
    await kv.set(`notification:${notificationId}`, JSON.stringify(notification));

    console.log(`✅ Notification marked as read: ${notificationId}`);

    return c.json({ notification });
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    return c.json({ error: "Failed to mark notification as read" }, 500);
  }
});

// ============================================================================
// PATCH /make-server-aa780fc8/notifications/read-all - Marquer tout comme lu
// ============================================================================

notifications.patch("/notifications/read-all", async (c) => {
  try {
    const userId = c.req.header("X-User-Id");

    console.log('📬 PATCH /notifications/read-all called for userId:', userId);

    if (!userId) {
      return c.json({ error: "Missing X-User-Id header" }, 401);
    }

    // Récupérer toutes les clés de notifications de l'utilisateur
    const notificationKeys = await kv.getByPrefix(`user:${userId}:notification:`);
    console.log(`📬 Found ${notificationKeys.length} notification keys to mark as read`);
    
    let markedCount = 0;
    
    // Marquer toutes comme lues
    for (const key of notificationKeys) {
      const notificationId = key.split(':').pop();
      const notificationData = await kv.get(`notification:${notificationId}`);
      
      if (notificationData) {
        const notification = JSON.parse(notificationData);
        if (!notification.isRead) {
          notification.isRead = true;
          await kv.set(`notification:${notificationId}`, JSON.stringify(notification));
          markedCount++;
        }
      }
    }

    console.log(`✅ ${markedCount} notifications marked as read for user ${userId}`);

    return c.json({
      message: `${markedCount} notifications marked as read`,
      count: markedCount,
    });
  } catch (error) {
    console.error("❌ Error marking all notifications as read:", error);
    return c.json({ error: "Failed to mark all notifications as read" }, 500);
  }
});

// ============================================================================
// DELETE /make-server-aa780fc8/notifications/:id - Supprimer une notification
// ============================================================================

notifications.delete("/notifications/:id", async (c) => {
  try {
    const notificationId = c.req.param("id");
    const userId = c.req.header("X-User-Id");

    console.log('📬 DELETE /notifications/:id called for:', notificationId, 'userId:', userId);

    if (!userId) {
      return c.json({ error: "Missing X-User-Id header" }, 401);
    }

    // Récupérer la notification pour vérifier ownership
    const notificationData = await kv.get(`notification:${notificationId}`);

    if (!notificationData) {
      return c.json({ error: "Notification not found" }, 404);
    }

    const notification = JSON.parse(notificationData);

    // Vérifier que l'utilisateur est bien le propriétaire
    if (notification.userId !== userId) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    // Supprimer les deux clés
    await kv.del(`notification:${notificationId}`);
    await kv.del(`user:${userId}:notification:${notificationId}`);

    console.log(`✅ Notification deleted: ${notificationId}`);

    return c.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("❌ Error deleting notification:", error);
    return c.json({ error: "Failed to delete notification" }, 500);
  }
});

// ============================================================================
// HELPER : Créer une notification pour un événement de pack
// ============================================================================

export async function createPackNotification(params: {
  eventType: "READY_FOR_REVIEW" | "CHANGES_REQUESTED" | "APPROVED" | "REJECTED";
  packId: string;
  packName: string;
  dossierId: string;
  targetUserId: string;
  createdBy: string;
  metadata?: Record<string, any>;
}): Promise<Notification> {
  const { eventType, packId, packName, dossierId, targetUserId, createdBy, metadata } = params;

  let type: Notification["type"];
  let title: string;
  let message: string;

  switch (eventType) {
    case "READY_FOR_REVIEW":
      type = "PACK_READY_FOR_REVIEW";
      title = "Pack prêt pour audit";
      message = `Le pack "${packName}" est prêt pour votre revue.`;
      break;
    case "CHANGES_REQUESTED":
      type = "PACK_CHANGES_REQUESTED";
      title = "Modifications demandées";
      message = `Des modifications ont été demandées sur le pack "${packName}".`;
      break;
    case "APPROVED":
      type = "PACK_APPROVED";
      title = "Pack approuvé";
      message = `Le pack "${packName}" a été approuvé par l'auditeur.`;
      break;
    case "REJECTED":
      type = "PACK_REJECTED";
      title = "Pack rejeté";
      message = `Le pack "${packName}" a été rejeté par l'auditeur.`;
      break;
  }

  const notification: Notification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: targetUserId,
    type,
    title,
    message,
    packId,
    packName,
    dossierId,
    read: false,
    createdAt: new Date().toISOString(),
    createdBy,
    metadata,
  };

  const key = `notification:user:${targetUserId}:${notification.id}`;
  await kv.set(key, notification);

  console.log(`✅ Pack notification created: ${notification.id} for user ${targetUserId} (${eventType})`);

  return notification;
}

export default notifications;