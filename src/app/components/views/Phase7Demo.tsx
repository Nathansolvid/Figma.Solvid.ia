// ============================================================================
// PHASE 7 DEMO - NOTIFICATIONS TESTING
// ============================================================================
// Page de test pour créer et tester les notifications

import { useState, useEffect } from "react";
import { Bell, Send, Trash2, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { useUser } from "@/contexts/UserContext";
import { usePacks } from "@/hooks/usePack";

export default function Phase7Demo() {
  const { currentUser, loading: userLoading } = useUser();
  const { data: packs = [], isLoading: packsLoading } = usePacks();
  
  const [userId, setUserId] = useState("");
  const [type, setType] = useState<string>("PACK_READY_FOR_REVIEW");
  const [title, setTitle] = useState("Test Notification");
  const [message, setMessage] = useState("Ceci est une notification de test");
  const [selectedPackId, setSelectedPackId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Initialiser avec l'utilisateur connecté
  useEffect(() => {
    if (currentUser?.id) {
      setUserId(currentUser.id);
      // Charger les notifications au montage
      loadNotifications();
    }
  }, [currentUser]);

  // Charger automatiquement quand userId change
  useEffect(() => {
    if (userId) {
      loadNotifications();
    }
  }, [userId]);
  
  // Sélectionner le premier pack automatiquement
  useEffect(() => {
    if (packs && packs.length > 0 && !selectedPackId) {
      setSelectedPackId(packs[0].id);
    }
  }, [packs]);
  
  // Afficher un loader pendant le chargement de l'utilisateur
  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }
  
  // Afficher un message si pas d'utilisateur connecté
  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <AlertCircle className="h-12 w-12 text-orange-500" />
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Authentification requise</h2>
          <p className="text-muted-foreground">Veuillez vous connecter pour accéder à cette page</p>
        </div>
      </div>
    );
  }

  // Créer une notification de test
  const createTestNotification = async () => {
    try {
      setLoading(true);
      setResult(null);
      
      // Vérifier qu'un pack est sélectionné
      if (!selectedPackId) {
        setResult({ success: false, error: "Veuillez sélectionner un pack" });
        setLoading(false);
        return;
      }
      
      // Trouver le pack sélectionné
      const selectedPack = packs.find(p => p.id === selectedPackId);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-aa780fc8/notifications`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            type,
            title,
            message,
            packId: selectedPackId,
            packName: selectedPack?.name || "Pack Test",
            dossierId: "dossier-test",
            createdBy: currentUser?.name || "demo-user",
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, data });
        // Recharger les notifications
        await loadNotifications();
      } else {
        setResult({ success: false, error: data });
      }
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Charger les notifications
  const loadNotifications = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-aa780fc8/notifications`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
            "X-User-Id": userId,
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  // Marquer comme lu
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-aa780fc8/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
            "X-User-Id": userId,
          },
        }
      );
      await loadNotifications();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  // Supprimer une notification
  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-aa780fc8/notifications/${notificationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
            "X-User-Id": userId,
          },
        }
      );
      await loadNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-2">Phase 7 Demo - Notifications</h1>
        <p className="text-muted-foreground">
          Testez le système de notifications en créant des notifications de test
        </p>
      </div>

      {/* Créer une notification */}
      <Card>
        <CardHeader>
          <CardTitle>Créer une notification de test</CardTitle>
          <CardDescription>
            Testez la création et la réception de notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>User ID (destinataire)</Label>
              <Input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="user-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Utilisez user-1, user-2, etc.
              </p>
            </div>

            <div>
              <Label>Type de notification</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PACK_READY_FOR_REVIEW">Pack prêt pour revue</SelectItem>
                  <SelectItem value="PACK_CHANGES_REQUESTED">Modifications demandées</SelectItem>
                  <SelectItem value="PACK_APPROVED">Pack approuvé</SelectItem>
                  <SelectItem value="PACK_REJECTED">Pack rejeté</SelectItem>
                  <SelectItem value="TASK_ASSIGNED">Tâche assignée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Titre</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre de la notification"
              />
            </div>

            <div>
              <Label>Pack</Label>
              <Select value={selectedPackId} onValueChange={setSelectedPackId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un pack" />
                </SelectTrigger>
                <SelectContent>
                  {packsLoading ? (
                    <SelectItem value="">Chargement...</SelectItem>
                  ) : (
                    packs.map((pack) => (
                      <SelectItem key={pack.id} value={pack.id}>
                        {pack.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label>Message</Label>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Contenu de la notification"
              />
            </div>
          </div>

          <Button onClick={createTestNotification} disabled={loading} className="w-full">
            <Send className="h-4 w-4 mr-2" />
            {loading ? "Envoi..." : "Envoyer la notification"}
          </Button>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              <AlertDescription>
                {result.success ? (
                  <div>
                    <strong>✅ Notification créée avec succès!</strong>
                    <pre className="text-xs mt-2 overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div>
                    <strong>❌ Erreur:</strong>
                    <pre className="text-xs mt-2">
                      {JSON.stringify(result.error, null, 2)}
                    </pre>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Liste des notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Notifications de {userId}</CardTitle>
              <CardDescription>
                {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadNotifications}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Recharger
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Aucune notification</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Créez une notification ci-dessus pour la voir apparaître ici
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg ${
                    !notification.read ? "bg-blue-50 border-blue-200" : "bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{notification.title}</h4>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Type: {notification.type}</span>
                        <span>Pack: {notification.packName}</span>
                        <span>
                          {new Date(notification.createdAt).toLocaleString("fr-FR")}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions de test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-semibold mb-2">1. Tester la création</h4>
            <p className="text-sm text-muted-foreground">
              Remplissez le formulaire ci-dessus et cliquez sur "Envoyer la notification"
            </p>
            <ul className="text-xs text-muted-foreground mt-1 ml-4 space-y-1">
              <li>✅ La notification doit être créée avec succès</li>
              <li>✅ Le message de confirmation s'affiche</li>
              <li>✅ La liste ci-dessous se recharge automatiquement</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">2. Vérifier dans la cloche</h4>
            <p className="text-sm text-muted-foreground">
              Regardez l'icône cloche en haut à droite de la page
            </p>
            <ul className="text-xs text-muted-foreground mt-1 ml-4 space-y-1">
              <li>✅ Le badge rouge doit afficher le nombre de notifications non lues</li>
              <li>✅ Si vous êtes connecté avec un autre user, le badge affichera "0"</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">3. Ouvrir le dropdown de notifications</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Cliquez sur l'icône cloche pour ouvrir le panneau de notifications
            </p>
            <ul className="text-xs text-muted-foreground mt-1 ml-4 space-y-1">
              <li>✅ Le dropdown s'ouvre avec la liste des notifications</li>
              <li>✅ Les notifications non lues ont un fond bleu clair</li>
              <li>✅ Vous pouvez voir le titre, message, type et date</li>
              <li>✅ Un bouton "Marquer tout comme lu" est disponible en haut</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">4. Marquer comme lu</h4>
            <p className="text-sm text-muted-foreground">
              Testez l'action de marquer comme lu
            </p>
            <ul className="text-xs text-muted-foreground mt-1 ml-4 space-y-1">
              <li>✅ Cliquez sur une notification dans le dropdown → elle est marquée lue</li>
              <li>✅ Le badge de la cloche se met à jour automatiquement</li>
              <li>✅ Le fond bleu disparaît de la notification</li>
              <li>✅ Ou utilisez "Marquer tout comme lu" pour toutes les marquer d'un coup</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">5. Supprimer une notification</h4>
            <p className="text-sm text-muted-foreground">
              Testez la suppression depuis cette page (liste ci-dessus)
            </p>
            <ul className="text-xs text-muted-foreground mt-1 ml-4 space-y-1">
              <li>✅ Cliquez sur l'icône poubelle à droite d'une notification</li>
              <li>✅ La notification disparaît de la liste</li>
              <li>✅ Le badge de la cloche se met à jour si nécessaire</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">6. Tester avec différents users</h4>
            <p className="text-sm text-muted-foreground">
              Vérifiez que les notifications sont bien isolées par utilisateur
            </p>
            <ul className="text-xs text-muted-foreground mt-1 ml-4 space-y-1">
              <li>✅ Changez le User ID (ex: user-1, user-2, user-3)</li>
              <li>✅ Créez des notifications pour différents utilisateurs</li>
              <li>✅ Rechargez la liste pour voir les notifications de cet utilisateur uniquement</li>
              <li>✅ Le badge de la cloche ne change que si vous êtes connecté avec le même user</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}