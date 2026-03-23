/**
 * NOTIFICATION BELL - Version 100% locale
 * 
 * Fonctionnalités :
 * - Affichage des notifications depuis IndexedDB
 * - Badge avec compteur non-lus
 * - Marquer comme lu
 * - Supprimer notifications
 * - Rechargement automatique
 */

import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { Card } from '@/app/components/ui/card';
import { useUser } from '@/contexts/UserContext';
import { dataProvider, Notification } from '@/services/dataProvider';
import { toast } from 'sonner';
import { resolveNotificationTarget } from '@/services/navigationService'; // 🆕 Navigation resolver

interface NotificationBellProps {
  currentUserId: string;
  onNotificationClick?: (notification: Notification) => void;
  onNavigate?: (target: { view: string; packId?: string; dossierId?: string }) => void; // 🆕 Navigation callback
}

export function NotificationBell({ currentUserId, onNotificationClick, onNavigate }: NotificationBellProps) {
  const { currentUser } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Load notifications from IndexedDB
  const loadNotifications = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // Get all notifications for current user
      const allNotifications = await dataProvider.store.listByIndex(
        'notifications',
        'userId',
        currentUser.id
      );

      // Sort by date (newest first)
      const sorted = allNotifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setNotifications(sorted);
      
      // Count unread
      const unread = sorted.filter(n => !n.read).length;
      setUnreadCount(unread);

    } catch (error) {
      console.error('❌ Load notifications error:', error);
      toast.error('Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  // Load on mount and when user changes
  useEffect(() => {
    loadNotifications();
  }, [currentUser]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentUser && !loading) {
        loadNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [currentUser, loading]);

  // Mark as read
  const markAsRead = async (notificationId: string) => {
    try {
      const notification = await dataProvider.store.read('notifications', notificationId);
      if (!notification) return;

      const updated = {
        ...notification,
        read: true,
      };

      await dataProvider.store.update('notifications', updated);
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? updated : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

    } catch (error) {
      console.error('❌ Mark as read error:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!currentUser) return;

    try {
      const unreadNotifications = notifications.filter(n => !n.read);

      for (const notification of unreadNotifications) {
        const updated = {
          ...notification,
          read: true,
        };
        await dataProvider.store.update('notifications', updated);
      }

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);

      toast.success('Toutes les notifications ont été marquées comme lues');
    } catch (error) {
      console.error('❌ Mark all as read error:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const notification = await dataProvider.store.read('notifications', notificationId);
      if (!notification) return;

      await dataProvider.store.delete('notifications', notificationId);

      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (!notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      toast.success('Notification supprimée');
    } catch (error) {
      console.error('❌ Delete notification error:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // 🆕 Navigate to related entity (pack, dossier, etc.)
    const target = resolveNotificationTarget(notification);
    
    if (target && onNavigate) {
      // Use parent navigation callback
      onNavigate({
        view: target.view,
        packId: target.packId,
        dossierId: target.dossierId,
      });
      
      // Show navigation message if provided
      if (target.message) {
        toast.info(target.message);
      }
      
    } else if (!target) {
      // Fallback: no navigation target found
      toast.info('Notification consultée');
      console.warn('⚠️ No navigation target for notification:', notification);
    }

    // Close the dropdown
    setIsOpen(false);

    // Call the provided callback if any (legacy support)
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  if (!currentUser) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-gray-600" />
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Badge className="bg-red-100 text-red-800 text-xs">
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Tout marquer lu
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Chargement...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`m-2 p-3 cursor-pointer hover:bg-gray-50 transition-colors border ${
                  notification.read
                    ? 'bg-white border-gray-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {notification.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="flex-shrink-0 h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-500" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-2 border-t bg-gray-50">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => setIsOpen(false)}
            >
              Fermer
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Helper to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}