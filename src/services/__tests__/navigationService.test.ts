/**
 * NAVIGATION SERVICE - Tests unitaires
 */

import { describe, it, expect } from 'vitest';
import { resolveNotificationTarget } from '../navigationService';
import { Notification } from '../dataProvider';

describe('NavigationService', () => {
  describe('resolveNotificationTarget', () => {
    it('should navigate to pack-view when packId is present', () => {
      const notification: Notification = {
        id: 'notif-1',
        userId: 'user-1',
        type: 'pack_submitted',
        title: 'Pack soumis',
        description: 'Test',
        packId: 'pack-123',
        read: false,
        createdAt: new Date().toISOString(),
      };

      const target = resolveNotificationTarget(notification);

      expect(target).toEqual({
        view: 'pack-view',
        packId: 'pack-123',
        message: 'Pack soumis pour revue',
      });
    });

    it('should navigate to audit-center for pack_approved without packId', () => {
      const notification: Notification = {
        id: 'notif-2',
        userId: 'user-1',
        type: 'pack_approved',
        title: 'Pack approuvé',
        description: 'Test',
        read: false,
        createdAt: new Date().toISOString(),
      };

      const target = resolveNotificationTarget(notification);

      expect(target).toEqual({
        view: 'audit-center',
        message: 'Consultez les packs en attente de revue',
      });
    });

    it('should navigate to exports-livrables for export_generated', () => {
      const notification: Notification = {
        id: 'notif-3',
        userId: 'user-1',
        type: 'export_generated',
        title: 'Export généré',
        description: 'Test',
        read: false,
        createdAt: new Date().toISOString(),
      };

      const target = resolveNotificationTarget(notification);

      expect(target).toEqual({
        view: 'exports-livrables',
        message: 'Votre export est disponible dans l\'historique',
      });
    });

    it('should navigate to kpis for import_completed', () => {
      const notification: Notification = {
        id: 'notif-4',
        userId: 'user-1',
        type: 'import_completed',
        title: 'Import complété',
        description: 'Test',
        read: false,
        createdAt: new Date().toISOString(),
      };

      const target = resolveNotificationTarget(notification);

      expect(target).toEqual({
        view: 'kpis',
        message: 'Consultez les indicateurs mis à jour',
      });
    });

    it('should navigate to checklist-workflow for task_assigned', () => {
      const notification: Notification = {
        id: 'notif-5',
        userId: 'user-1',
        type: 'task_assigned',
        title: 'Tâche assignée',
        description: 'Test',
        read: false,
        createdAt: new Date().toISOString(),
      };

      const target = resolveNotificationTarget(notification);

      expect(target).toEqual({
        view: 'checklist-workflow',
        message: 'Nouvelle tâche assignée',
      });
    });

    it('should navigate to evidence-vault for evidence_uploaded', () => {
      const notification: Notification = {
        id: 'notif-6',
        userId: 'user-1',
        type: 'evidence_uploaded',
        title: 'Preuve uploadée',
        description: 'Test',
        read: false,
        createdAt: new Date().toISOString(),
      };

      const target = resolveNotificationTarget(notification);

      expect(target).toEqual({
        view: 'evidence-vault',
        message: 'Nouvelle preuve uploadée',
      });
    });

    it('should navigate to pack-view for comment_added with packId', () => {
      const notification: Notification = {
        id: 'notif-7',
        userId: 'user-1',
        type: 'comment_added',
        title: 'Nouveau commentaire',
        description: 'Test',
        packId: 'pack-456',
        read: false,
        createdAt: new Date().toISOString(),
      };

      const target = resolveNotificationTarget(notification);

      expect(target).toEqual({
        view: 'pack-view',
        packId: 'pack-456',
      });
    });

    it('should navigate to dashboard for comment_added without packId', () => {
      const notification: Notification = {
        id: 'notif-8',
        userId: 'user-1',
        type: 'comment_added',
        title: 'Nouveau commentaire',
        description: 'Test',
        read: false,
        createdAt: new Date().toISOString(),
      };

      const target = resolveNotificationTarget(notification);

      expect(target).toEqual({
        view: 'dashboard',
        message: 'Consultez vos notifications récentes',
      });
    });

    it('should return null for mention without packId', () => {
      const notification: Notification = {
        id: 'notif-9',
        userId: 'user-1',
        type: 'mention',
        title: 'Vous avez été mentionné',
        description: 'Test',
        read: false,
        createdAt: new Date().toISOString(),
      };

      const target = resolveNotificationTarget(notification);

      expect(target).toEqual({
        view: 'dashboard',
        message: 'Consultez vos notifications récentes',
      });
    });
  });
});
