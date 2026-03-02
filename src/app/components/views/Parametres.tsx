import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { Separator } from "@/app/components/ui/separator";
import { CreateNotificationDialog } from "@/app/components/CreateNotificationDialog";
import { useUser } from "@/contexts/UserContext";
import { Role } from "@/permissions";
import { 
  Building2,
  Users,
  Bell,
  Shield,
  Database,
  HelpCircle
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Badge } from "@/app/components/ui/badge";
import { toast } from "sonner"; // 🔧 Add toast for user feedback

const users = [
  { id: 1, name: "Sophie Martin", email: "s.martin@entreprise.fr", role: "Administrateur", status: "active" },
  { id: 2, name: "Thomas Dubois", email: "t.dubois@entreprise.fr", role: "Éditeur", status: "active" },
  { id: 3, name: "Marie Laurent", email: "m.laurent@entreprise.fr", role: "Contributeur", status: "active" },
  { id: 4, name: "Pierre Durand", email: "p.durand@entreprise.fr", role: "Lecteur", status: "active" },
  { id: 5, name: "Julie Moreau", email: "j.moreau@entreprise.fr", role: "Contributeur", status: "inactive" },
];

export function Parametres() {
  const user = useUser();

  // 🔧 Add handler functions for all buttons
  const handleSaveCompanyInfo = () => {
    toast.success("Modifications enregistrées", {
      description: "Les informations de l'entreprise ont été mises à jour"
    });
  };

  const handleInviteUser = () => {
    toast.info("Invitation utilisateur", {
      description: "Le formulaire d'invitation sera bientôt disponible"
    });
  };

  const handleManageUser = (userName: string) => {
    toast.info(`Gestion de ${userName}`, {
      description: "Options de gestion de l'utilisateur"
    });
  };

  const handleExportAllData = () => {
    toast.success("Export démarré", {
      description: "Vos données sont en cours d'export au format Excel"
    });
  };

  const handleBackupDatabase = () => {
    toast.success("Sauvegarde en cours", {
      description: "Création d'une sauvegarde complète de votre espace de travail"
    });
  };

  const handleDeleteAllData = () => {
    toast.error("Action critique", {
      description: "Veuillez confirmer la suppression de toutes les données. Cette action est irréversible."
    });
  };

  const handleOpenDocumentation = () => {
    toast.info("Documentation", {
      description: "Ouverture de la documentation..."
    });
  };

  const handleContactSupport = () => {
    toast.info("Support", {
      description: "Ouverture du formulaire de contact..."
    });
  };

  const handleScheduleDemo = () => {
    toast.info("Planification", {
      description: "Accès au calendrier de réservation de démo..."
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Paramètres</h1>
        <p className="text-muted-foreground">
          Configuration de votre espace de travail et préférences
        </p>
      </div>

      {/* Informations entreprise */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informations de l'entreprise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Raison sociale</Label>
              <Input id="company-name" defaultValue="Entreprise Exemple SAS" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siret">SIRET</Label>
              <Input id="siret" defaultValue="123 456 789 00012" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" defaultValue="123 Avenue des Champs-Élysées" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input id="city" defaultValue="75008 Paris" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector">Secteur d'activité</Label>
              <Input id="sector" defaultValue="Services aux entreprises" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employees">Nombre d'employés</Label>
              <Input id="employees" defaultValue="247" type="number" />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button 
              className="bg-[#0F4C3A] hover:bg-[#0A3B2E]"
              onClick={handleSaveCompanyInfo} // 🔧 Added onClick
            >
              Enregistrer les modifications
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gestion des utilisateurs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Utilisateurs
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleInviteUser} // 🔧 Added onClick
            >
              Inviter un utilisateur
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={user.status === 'active' ? 'bg-[#059669] text-white' : 'bg-gray-400 text-white'}>
                      {user.status === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleManageUser(user.name)} // 🔧 Added onClick
                    >
                      Gérer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            {user.currentUser && (user.currentUser.role === Role.ADMIN || user.currentUser.role === Role.CONSULTANT) && (
              <CreateNotificationDialog currentUserId={user.currentUser.id} />
            )}
          </div>
          <CardDescription>
            Gérer vos préférences de notifications et créer des alertes personnalisées
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertes données manquantes</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir une alerte lorsque des données critiques sont manquantes
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Rappels conformité ESG</Label>
              <p className="text-sm text-muted-foreground">
                Notifications sur les échéances réglementaires importantes
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Résumé hebdomadaire</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir un email récapitulatif chaque lundi
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Recommandations IA</Label>
              <p className="text-sm text-muted-foreground">
                Notifications lorsque l'IA détecte des opportunités d'amélioration
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Sécurité & confidentialité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sécurité & Confidentialité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Authentification à deux facteurs</Label>
              <p className="text-sm text-muted-foreground">
                Ajouter une couche de sécurité supplémentaire à votre compte
              </p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Journal d'activité</Label>
              <p className="text-sm text-muted-foreground">
                Conserver l'historique complet des actions pour audit
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Politique de rétention des données</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Les données sont conservées pendant 5 ans conformément aux exigences CSRD
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Données et exports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Données et exports
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <p className="font-medium mb-1">Exporter toutes les données</p>
              <p className="text-sm text-muted-foreground">
                Télécharger l'ensemble de vos données au format Excel
              </p>
            </div>
            <Button variant="outline" onClick={handleExportAllData}> {/* 🔧 Added onClick */}
              Exporter
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <p className="font-medium mb-1">Sauvegarder la base de données</p>
              <p className="text-sm text-muted-foreground">
                Créer une sauvegarde complète de votre espace de travail
              </p>
            </div>
            <Button variant="outline" onClick={handleBackupDatabase}> {/* 🔧 Added onClick */}
              Sauvegarder
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium mb-1 text-red-900">Supprimer toutes les données</p>
              <p className="text-sm text-red-700">
                Action irréversible - toutes vos données seront définitivement supprimées
              </p>
            </div>
            <Button variant="destructive" onClick={handleDeleteAllData}> {/* 🔧 Added onClick */}
              Supprimer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Support et assistance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-[#059669] transition-colors cursor-pointer">
            <div>
              <p className="font-medium mb-1">Documentation</p>
              <p className="text-sm text-muted-foreground">
                Guides d'utilisation et tutoriels
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleOpenDocumentation} // 🔧 Added onClick
            >
              Consulter
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-[#059669] transition-colors cursor-pointer">
            <div>
              <p className="font-medium mb-1">Contacter le support</p>
              <p className="text-sm text-muted-foreground">
                Équipe disponible du lundi au vendredi, 9h-18h
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleContactSupport} // 🔧 Added onClick
            >
              Contacter
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-[#059669] transition-colors cursor-pointer">
            <div>
              <p className="font-medium mb-1">Demander une démo</p>
              <p className="text-sm text-muted-foreground">
                Session personnalisée avec un expert CSRD
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleScheduleDemo} // 🔧 Added onClick
            >
              Planifier
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}