/**
 * CREATE NOTIFICATION DIALOG - Version 100% locale
 * 
 * Fonctionnalités :
 * - Création manuelle de notifications
 * - Sélection utilisateur destinataire
 * - Types de notifications
 * - Sauvegarde dans IndexedDB
 */

import React, { useState, useEffect } from 'react';
import { Plus, Bell, Users, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { dataProvider } from '@/services/dataProvider';
import { v4 as uuidv4 } from 'uuid';

interface CreateNotificationDialogProps {
  onSuccess?: () => void;
}

export function CreateNotificationDialog({ onSuccess }: CreateNotificationDialogProps) {
  const { currentUser } = useUser();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [userId, setUserId] = useState('');
  const [type, setType] = useState<string>('info');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [packId, setPackId] = useState('');

  // Users list for selection
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);

  // Load users on mount
  useEffect(() => {
    if (open && currentUser) {
      loadUsers();
    }
  }, [open, currentUser]);

  const loadUsers = async () => {
    try {
      if (!currentUser) return;

      // Load all users from the same organization
      const allUsers = await dataProvider.store.list('users');
      const orgUsers = allUsers.filter(u => u.organizationId === currentUser.organizationId);
      
      setUsers(orgUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
      })));

      // Auto-select current user
      if (orgUsers.length > 0) {
        setUserId(currentUser.id);
      }
    } catch (error) {
      console.error('❌ Load users error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId || !title || !description) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);

    try {

      // Create notification
      const notification = {
        id: uuidv4(),
        userId,
        type: type as any,
        title,
        description,
        packId: packId || undefined,
        read: false,
        createdAt: new Date().toISOString(),
      };

      await dataProvider.store.create('notifications', notification);


      toast.success('Notification créée', {
        description: `Notification envoyée à ${users.find(u => u.id === userId)?.name}`,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setPackId('');
      setType('info');

      // Close dialog
      setOpen(false);

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('❌ Create notification error:', error);
      toast.error('Erreur lors de la création', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Créer notification
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#059669]" />
            Créer une notification
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Selection */}
          <div className="space-y-2">
            <Label htmlFor="user">
              Destinataire <span className="text-red-500">*</span>
            </Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger id="user">
                <SelectValue placeholder="Sélectionner un utilisateur" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{user.name}</span>
                      <span className="text-xs text-gray-500">({user.email})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="type">
              Type <span className="text-red-500">*</span>
            </Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="pack_submitted">Pack soumis</SelectItem>
                <SelectItem value="pack_validated">Pack validé</SelectItem>
                <SelectItem value="pack_rejected">Pack rejeté</SelectItem>
                <SelectItem value="import_completed">Import terminé</SelectItem>
                <SelectItem value="evidence_added">Preuve ajoutée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Titre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Nouvelle preuve ajoutée"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Une nouvelle preuve a été ajoutée au KPI GHG-1"
              rows={3}
              required
            />
          </div>

          {/* Pack ID (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="packId">
              Pack ID (optionnel)
            </Label>
            <Input
              id="packId"
              value={packId}
              onChange={(e) => setPackId(e.target.value)}
              placeholder="Ex: pack-123"
            />
            <p className="text-xs text-gray-500">
              ID du pack associé (si applicable)
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#059669] hover:bg-[#048558]"
            >
              {loading ? 'Création...' : 'Créer notification'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
