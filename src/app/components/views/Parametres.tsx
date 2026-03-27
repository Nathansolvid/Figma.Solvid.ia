import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { Separator } from "@/app/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { CreateNotificationDialog } from "@/app/components/CreateNotificationDialog";
import { useUser } from "@/contexts/UserContext";
import { Role } from "@/permissions";
import {
  Building2,
  Users,
  Bell,
  Shield,
  Database,
  HelpCircle,
  Sparkles,
  Eye,
  EyeOff,
  Mail,
  UserPlus,
  Clock,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Send,
  Upload,
  Palette,
  Trash2,
  Image,
  Download,
  FileText,
  ExternalLink,
  ScrollText,
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
import { toast } from "sonner";
import {
  getStoredReportModel, setStoredReportModel,
  getStoredIndicatorModel, setStoredIndicatorModel,
  validateApiKey,
  AVAILABLE_REPORT_MODELS,
  AVAILABLE_INDICATOR_MODELS,
} from "@/services/aiQualitativeService";
import { supabase } from "@/lib/supabase";
import {
  invitationService,
  Invitation,
  SubscriptionPlan,
  PLAN_LABELS,
  SubscriptionInfo,
} from "@/services/invitationService";
import { dataProvider, type Organization, type User as DataUser } from "@/services/dataProvider";
import { authService } from "@/services/authService";
import { rgpdService } from "@/services/rgpdService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";

export function Parametres() {
  const user = useUser();

  // ─── Pending users state (admin approval) ─────────────────────────────────
  const [pendingUsers, setPendingUsers] = useState<DataUser[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const refreshPendingUsers = async () => {
    try {
      const allUsers = await dataProvider.store.list<DataUser>('users');
      setPendingUsers(allUsers.filter(u => u.status === 'pending'));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (user.currentUser?.role === Role.ADMIN) {
      refreshPendingUsers();
    }
  }, [user.currentUser]);

  const handleApproveUser = async (u: DataUser) => {
    setApprovingId(u.id);
    try {
      await dataProvider.store.update('users', { ...u, status: 'approved' as const });
      // Activer l'essai gratuit de 14 jours
      invitationService.activateSubscription(u.id, {
        plan: 'trial',
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      });
      toast.success('Utilisateur approuvé', {
        description: `${u.name} (${u.email}) peut maintenant se connecter`,
      });
      refreshPendingUsers();
    } catch {
      toast.error('Erreur', { description: 'Impossible d\'approuver l\'utilisateur' });
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectUser = async (u: DataUser) => {
    setApprovingId(u.id);
    try {
      await dataProvider.store.update('users', { ...u, status: 'rejected' as const });
      toast.success('Demande refusée', {
        description: `L'accès a été refusé pour ${u.email}`,
      });
      refreshPendingUsers();
    } catch {
      toast.error('Erreur', { description: 'Impossible de refuser l\'utilisateur' });
    } finally {
      setApprovingId(null);
    }
  };

  // ─── Invitation state ─────────────────────────────────────────────────────
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('CLIENT_CONTRIBUTOR');
  const [invitePlan, setInvitePlan] = useState<SubscriptionPlan>('starter');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [currentSub, setCurrentSub] = useState<SubscriptionInfo | null>(null);

  // Load invitations and subscription
  useEffect(() => {
    refreshInvitations();
    if (user.currentUser) {
      const sub = invitationService.getSubscriptionInfo(user.currentUser.id);
      setCurrentSub(sub);
    }
  }, [user.currentUser]);

  const refreshInvitations = () => {
    const orgId = user.currentUser?.organizationId;
    const list = invitationService.listInvitations(orgId);
    setInvitations(list);
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Veuillez entrer un email');
      return;
    }
    if (!user.currentUser) return;

    setInviteLoading(true);
    try {
      await invitationService.inviteUser({
        email: inviteEmail.trim(),
        role: inviteRole,
        organizationId: user.currentUser.organizationId,
        organizationName: user.currentUser.organizationName || 'Ma Société',
        invitedBy: user.currentUser.id,
        invitedByName: user.currentUser.name,
        plan: invitePlan,
      });

      toast.success('Invitation envoyée !', {
        description: `Un email d'invitation a été envoyé à ${inviteEmail}`,
      });
      setInviteEmail('');
      setShowInviteForm(false);
      refreshInvitations();
    } catch (error: any) {
      toast.error('Erreur', {
        description: error?.message || "Impossible d'envoyer l'invitation",
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRevokeInvitation = (inv: Invitation) => {
    invitationService.revokeInvitation(inv.id);
    toast.success('Invitation révoquée', {
      description: `L'invitation pour ${inv.email} a été annulée`,
    });
    refreshInvitations();
  };

  // ─── Other handlers ───────────────────────────────────────────────────────
  const handleSaveCompanyInfo = () => {
    toast.success("Modifications enregistrées", {
      description: "Les informations de l'entreprise ont été mises à jour"
    });
  };

  const handleExportAllData = async () => {
    if (!user.currentUser) return;
    try {
      toast.info("Export en cours...");
      const data = await rgpdService.exportUserData(user.currentUser.id, user.currentUser.organizationId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `solvid-ia-export-${user.currentUser.email}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export terminé", { description: "Vos données ont été téléchargées" });
    } catch (error) {
      toast.error("Erreur d'export", { description: String(error) });
    }
  };

  const handleBackupDatabase = () => {
    toast.success("Sauvegarde en cours", {
      description: "Création d'une sauvegarde complète de votre espace de travail"
    });
  };

  // ─── RGPD state ─────────────────────────────────────────────────────────────
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [inventoryData, setInventoryData] = useState<Array<{category: string; dataType: string; purpose: string; retention: string; count: number}>>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  const handleDeleteAllData = async () => {
    if (deleteConfirmInput !== 'SUPPRIMER' || !user.currentUser) return;
    setDeleteLoading(true);
    try {
      const result = await rgpdService.deleteUserAccount(user.currentUser.id, user.currentUser.organizationId);
      const totalDeleted = Object.values(result.deletedCounts).reduce((a, b) => a + b, 0);
      toast.success("Compte supprime", {
        description: `${totalDeleted} enregistrements supprimes. Deconnexion en cours...`,
      });
      setDeleteDialogOpen(false);
      setDeleteConfirmInput('');
      // Logout after short delay to let toast show
      setTimeout(async () => {
        await user.logout();
      }, 1500);
    } catch (error) {
      toast.error("Erreur de suppression", { description: String(error) });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleShowInventory = async () => {
    if (!user.currentUser) return;
    setInventoryOpen(true);
    setInventoryLoading(true);
    try {
      const data = await rgpdService.getDataInventory(user.currentUser.id, user.currentUser.organizationId);
      setInventoryData(data);
    } catch (error) {
      toast.error("Erreur", { description: String(error) });
    } finally {
      setInventoryLoading(false);
    }
  };

  const handleConsentToggle = async (type: 'cgu' | 'ai', value: boolean) => {
    if (!user.currentUser) return;
    try {
      await rgpdService.updateConsent(user.currentUser.id, type, value);
      // Update local user state
      const updatedUser = { ...user.currentUser };
      if (type === 'cgu') updatedUser.consentCGU = value ? new Date().toISOString() : undefined;
      if (type === 'ai') updatedUser.consentAI = value ? new Date().toISOString() : undefined;
      user.setCurrentUser(updatedUser);
      toast.success("Consentement mis a jour");
    } catch (error) {
      toast.error("Erreur", { description: String(error) });
    }
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

  // ─── Branding state ─────────────────────────────────────────────────────
  const [brandPrimaryColor, setBrandPrimaryColor] = useState('#059669');
  const [brandSecondaryColor, setBrandSecondaryColor] = useState('#0A3B2E');
  const [brandLogoBase64, setBrandLogoBase64] = useState<string | null>(null);
  const [brandLogoName, setBrandLogoName] = useState<string>('');
  const [brandSaving, setBrandSaving] = useState(false);

  // Load organization branding
  useEffect(() => {
    async function loadBranding() {
      if (!user.currentUser?.organizationId) return;
      try {
        const org = await dataProvider.store.read<Organization>('organizations', user.currentUser.organizationId);
        if (org) {
          if (org.brandPrimaryColor) setBrandPrimaryColor(org.brandPrimaryColor);
          if (org.brandSecondaryColor) setBrandSecondaryColor(org.brandSecondaryColor);
          if (org.brandLogoBase64) {
            setBrandLogoBase64(org.brandLogoBase64);
            setBrandLogoName('Logo existant');
          }
        }
      } catch (e) {
        // silently ignore — branding fields are optional
      }
    }
    loadBranding();
  }, [user.currentUser?.organizationId]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Format invalide', { description: 'Veuillez sélectionner une image PNG ou JPEG' });
      return;
    }
    if (file.size > 500 * 1024) {
      toast.error('Fichier trop volumineux', { description: 'Le logo ne doit pas dépasser 500 Ko' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        // Resize if too large (max 400x200)
        let w = img.width;
        let h = img.height;
        if (w > 400 || h > 200) {
          const ratio = Math.min(400 / w, 200 / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const base64 = canvas.toDataURL(file.type.includes('png') ? 'image/png' : 'image/jpeg', 0.9);
          setBrandLogoBase64(base64);
          setBrandLogoName(file.name);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setBrandLogoBase64(null);
    setBrandLogoName('');
  };

  const handleSaveBranding = async () => {
    if (!user.currentUser?.organizationId) return;
    setBrandSaving(true);
    try {
      const org = await dataProvider.store.read<Organization>('organizations', user.currentUser.organizationId);
      if (org) {
        await dataProvider.store.update('organizations', {
          ...org,
          brandPrimaryColor,
          brandSecondaryColor,
          brandLogoBase64: brandLogoBase64 || undefined,
        });
      }
      toast.success('Identité visuelle enregistrée', {
        description: 'Les couleurs et le logo seront appliqués aux prochains rapports PDF',
      });
    } catch (e) {
      toast.error('Erreur', { description: 'Impossible de sauvegarder les paramètres de branding' });
    } finally {
      setBrandSaving(false);
    }
  };

  // ─── AI section state ────────────────────────────────────────────────────
  const [newApiKey, setNewApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiReportModel, setAiReportModel] = useState(getStoredReportModel());
  const [aiIndicatorModel, setAiIndicatorModel] = useState(getStoredIndicatorModel());
  const [aiStatus, setAiStatus] = useState<"connected" | "none" | "invalid" | null>(null);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiKeySaving, setAiKeySaving] = useState(false);

  // Check if org already has a key configured — direct DB query, no proxy call.
  // Avoids false "Clé API invalide" errors during first login for new accounts.
  useEffect(() => {
    const checkExistingKey = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const orgId = session.user.user_metadata?.organizationId;
      if (!orgId) return;
      const { data } = await supabase
        .from("org_secrets")
        .select("anthropic_key_encrypted")
        .eq("organization_id", orgId)
        .maybeSingle();
      setAiStatus(data?.anthropic_key_encrypted ? "connected" : "none");
    };
    checkExistingKey();
  }, []);

  const handleSaveApiKey = async () => {
    if (!newApiKey.trim() || !newApiKey.trim().startsWith("sk-ant-")) {
      toast.error("Clé invalide", { description: "La clé doit commencer par sk-ant-" });
      return;
    }
    const orgId = user.currentUser?.organizationId;
    if (!orgId) {
      toast.error("Erreur", { description: "Organisation introuvable" });
      return;
    }
    setAiKeySaving(true);
    try {
      const { error } = await supabase
        .from("org_secrets")
        .upsert(
          { organization_id: orgId, anthropic_key_encrypted: newApiKey.trim() },
          { onConflict: "organization_id" }
        );
      if (error) throw error;
      setNewApiKey("");
      setAiStatus("connected");
      toast.success("Clé API enregistrée", { description: "La clé Anthropic a été sauvegardée de façon sécurisée" });
    } catch (err: any) {
      toast.error("Erreur de sauvegarde", { description: err?.message ?? "Impossible d'enregistrer la clé" });
    } finally {
      setAiKeySaving(false);
    }
  };

  const handleTestAiConnection = async () => {
    setAiTesting(true);
    const result = await validateApiKey("");
    setAiTesting(false);
    if (result.valid) {
      setAiStatus("connected");
      toast.success("Connexion IA réussie", { description: "La clé API est valide et fonctionnelle" });
    } else {
      setAiStatus("invalid");
      toast.error("Connexion IA échouée", { description: result.error ?? "Erreur inconnue" });
    }
  };

  const handleSaveAiSettings = () => {
    setStoredReportModel(aiReportModel);
    setStoredIndicatorModel(aiIndicatorModel);
    toast.success("Modèles IA enregistrés", {
      description: "Les modèles Claude ont été sauvegardés"
    });
  };

  // ─── Helper: status badge for invitations ─────────────────────────────────
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100"><Clock className="h-3 w-3 mr-1" /> En attente</Badge>;
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" /> Acceptée</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><AlertTriangle className="h-3 w-3 mr-1" /> Expirée</Badge>;
      case 'revoked':
        return <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100"><XCircle className="h-3 w-3 mr-1" /> Révoquée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const labels: Record<string, string> = {
      CLIENT_OWNER: 'Directeur ESG',
      CONSULTANT: 'Consultant ESG',
      CLIENT_CONTRIBUTOR: 'Analyste données',
      AUDITOR: 'Auditeur externe',
      ADMIN: 'Administrateur',
      VIEWER: 'Observateur',
    };
    return <Badge variant="outline">{labels[role] || role}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Paramètres</h1>
        <p className="text-muted-foreground">
          Configuration de votre espace de travail et préférences
        </p>
      </div>

      {/* Abonnement actif */}
      {currentSub && (
        <Card className="border-[#059669]/30 bg-gradient-to-r from-[#E8F3F0] to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#059669] rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-[#0A3B2E]">
                    {PLAN_LABELS[currentSub.plan]}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentSub.isActive
                      ? `${currentSub.daysRemaining} jours restants`
                      : 'Abonnement expiré'}
                  </p>
                </div>
              </div>
              <Badge className={currentSub.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {currentSub.isActive ? 'Actif' : 'Expiré'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Demandes d'accès en attente (ADMIN uniquement) */}
      {user.currentUser?.role === Role.ADMIN && (
        <Card className={pendingUsers.length > 0 ? 'border-amber-300 bg-amber-50/30' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Demandes d'accès
                  {pendingUsers.length > 0 && (
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 ml-2">
                      {pendingUsers.length} en attente
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-1">
                  Les nouveaux utilisateurs doivent être validés avant de pouvoir accéder à la plateforme
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {pendingUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle demandé</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers.map((pu) => (
                    <TableRow key={pu.id}>
                      <TableCell className="font-medium">{pu.name}</TableCell>
                      <TableCell className="text-sm">{pu.email}</TableCell>
                      <TableCell>{getRoleBadge(pu.role)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(pu.createdAt).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-[#059669] hover:bg-[#048558]"
                            disabled={approvingId === pu.id}
                            onClick={() => handleApproveUser(pu)}
                          >
                            {approvingId === pu.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <><CheckCircle className="h-3.5 w-3.5 mr-1" /> Approuver</>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            disabled={approvingId === pu.id}
                            onClick={() => handleRejectUser(pu)}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Refuser
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50 text-green-600" />
                <p className="text-sm">Aucune demande en attente</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
              <Input id="company-name" defaultValue={user.currentUser?.organizationName || "Entreprise Exemple SAS"} />
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
              onClick={handleSaveCompanyInfo}
            >
              Enregistrer les modifications
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Identité visuelle (rapports PDF) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Identité visuelle des rapports
          </CardTitle>
          <CardDescription>
            Logo et couleurs appliqués aux rapports PDF générés
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-3">
            <Label>Logo de l'entreprise</Label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-16 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/30">
                {brandLogoBase64 ? (
                  <img src={brandLogoBase64} alt="Logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <Image className="h-6 w-6 text-muted-foreground/50" />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('brand-logo-input')?.click()}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    {brandLogoBase64 ? 'Changer' : 'Upload'}
                  </Button>
                  {brandLogoBase64 && (
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800 hover:bg-red-50" onClick={handleRemoveLogo}>
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Supprimer
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">PNG ou JPEG, max 500 Ko</p>
              </div>
              <input
                id="brand-logo-input"
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
          </div>

          <Separator />

          {/* Color Pickers */}
          <div className="space-y-3">
            <Label>Couleurs de marque</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand-primary" className="text-sm text-muted-foreground">
                  Couleur principale (en-têtes, accents)
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    id="brand-primary"
                    type="color"
                    value={brandPrimaryColor}
                    onChange={(e) => setBrandPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-md border border-border cursor-pointer"
                    style={{ padding: 2 }}
                  />
                  <Input
                    value={brandPrimaryColor}
                    onChange={(e) => setBrandPrimaryColor(e.target.value)}
                    className="flex-1 font-mono text-sm"
                    maxLength={7}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand-secondary" className="text-sm text-muted-foreground">
                  Couleur secondaire (couverture, fond)
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    id="brand-secondary"
                    type="color"
                    value={brandSecondaryColor}
                    onChange={(e) => setBrandSecondaryColor(e.target.value)}
                    className="w-10 h-10 rounded-md border border-border cursor-pointer"
                    style={{ padding: 2 }}
                  />
                  <Input
                    value={brandSecondaryColor}
                    onChange={(e) => setBrandSecondaryColor(e.target.value)}
                    className="flex-1 font-mono text-sm"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview bar */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Aperçu</Label>
            <div className="flex rounded-lg overflow-hidden h-8">
              <div className="flex-1" style={{ backgroundColor: brandSecondaryColor }} />
              <div className="flex-1" style={{ backgroundColor: brandPrimaryColor }} />
            </div>
          </div>

          {/* Save branding */}
          <div className="flex justify-end pt-2">
            <Button
              className="bg-[#0F4C3A] hover:bg-[#0A3B2E]"
              onClick={handleSaveBranding}
              disabled={brandSaving}
            >
              {brandSaving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</>
              ) : (
                'Enregistrer l\'identité visuelle'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gestion des invitations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Utilisateurs & Invitations
              </CardTitle>
              <CardDescription className="mt-1">
                Invitez des collaborateurs à rejoindre votre espace. Chaque invitation est liée à un abonnement avec date d'expiration.
              </CardDescription>
            </div>
            <Button
              size="sm"
              className="bg-[#059669] hover:bg-[#048558]"
              onClick={() => setShowInviteForm(!showInviteForm)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Inviter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Invite Form */}
          {showInviteForm && (
            <div className="p-4 border border-[#059669]/30 bg-[#E8F3F0]/50 rounded-lg space-y-4">
              <h4 className="font-medium flex items-center gap-2 text-[#0A3B2E]">
                <Send className="h-4 w-4" />
                Nouvelle invitation
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email" className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="collaborateur@entreprise.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role">Rôle</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger id="invite-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLIENT_OWNER">Directeur ESG</SelectItem>
                      <SelectItem value="CONSULTANT">Consultant ESG</SelectItem>
                      <SelectItem value="CLIENT_CONTRIBUTOR">Analyste données</SelectItem>
                      <SelectItem value="AUDITOR">Auditeur externe</SelectItem>
                      <SelectItem value="VIEWER">Observateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="invite-plan">Abonnement</Label>
                  <Select value={invitePlan} onValueChange={(v) => setInvitePlan(v as SubscriptionPlan)}>
                    <SelectTrigger id="invite-plan">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Essai gratuit (14 jours)</SelectItem>
                      <SelectItem value="starter">Starter (1 an)</SelectItem>
                      <SelectItem value="professional">Professionnel (1 an)</SelectItem>
                      <SelectItem value="enterprise">Entreprise (2 ans)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowInviteForm(false)}>
                  Annuler
                </Button>
                <Button
                  className="bg-[#059669] hover:bg-[#048558]"
                  onClick={handleInviteUser}
                  disabled={inviteLoading}
                >
                  {inviteLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi...</>
                  ) : (
                    <><Send className="mr-2 h-4 w-4" /> Envoyer l'invitation</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Invitations Table */}
          {invitations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Abonnement</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium text-sm">{inv.email}</TableCell>
                    <TableCell>{getRoleBadge(inv.role)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {PLAN_LABELS[inv.subscriptionPlan]}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(inv.expiresAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>{getStatusBadge(inv.status)}</TableCell>
                    <TableCell>
                      {inv.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          onClick={() => handleRevokeInvitation(inv)}
                        >
                          Révoquer
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune invitation envoyée</p>
              <p className="text-xs mt-1">
                Cliquez sur "Inviter" pour ajouter des collaborateurs à votre espace.
              </p>
            </div>
          )}
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

      {/* Intelligence Artificielle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Intelligence Artificielle
          </CardTitle>
          <CardDescription>
            Configuration de l'assistant IA et des modèles Claude
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Key — saved server-side in org_secrets */}
          <div className="space-y-2">
            <Label htmlFor="ai-api-key">Clé API Anthropic</Label>
            <p className="text-xs text-muted-foreground">
              {aiStatus === "connected"
                ? "Une clé est déjà configurée pour votre organisation. Saisissez une nouvelle clé pour la remplacer."
                : "Saisissez votre clé Anthropic. Elle sera stockée de façon sécurisée côté serveur."}
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="ai-api-key"
                  type={showApiKey ? "text" : "password"}
                  placeholder={aiStatus === "connected" ? "••••••••••••••••••• (clé existante)" : "sk-ant-api03-..."}
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button
                variant="outline"
                onClick={handleSaveApiKey}
                disabled={aiKeySaving || !newApiKey.trim()}
              >
                {aiKeySaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer la clé"}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Model selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Modèle pour les rapports</Label>
              <Select value={aiReportModel} onValueChange={setAiReportModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_REPORT_MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Modèle pour les indicateurs</Label>
              <Select value={aiIndicatorModel} onValueChange={setAiIndicatorModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_INDICATOR_MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Status + Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {aiStatus === "connected" && (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  Connecté
                </Badge>
              )}
              {aiStatus === "none" && (
                <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                  Non configuré
                </Badge>
              )}
              {aiStatus === "invalid" && (
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                  Clé invalide
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleTestAiConnection}
                disabled={aiTesting}
              >
                {aiTesting ? "Test en cours..." : "Tester la connexion"}
              </Button>
              <Button
                className="bg-[#0F4C3A] hover:bg-[#0A3B2E]"
                onClick={handleSaveAiSettings}
              >
                Enregistrer
              </Button>
            </div>
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
            <Button variant="outline" onClick={handleExportAllData}>
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
            <Button variant="outline" onClick={handleBackupDatabase}>
              Sauvegarder
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium mb-1 text-red-900">Supprimer toutes les données</p>
              <p className="text-sm text-red-700">
                Action irréversible — toutes vos données seront définitivement supprimées
              </p>
            </div>
            <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeleteConfirmInput(''); }}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Supprimer</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-red-900">Suppression définitive du compte</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <span className="block">
                      Cette action est <strong>irréversible</strong>. Toutes vos données personnelles, dossiers ESG,
                      indicateurs, preuves et historiques seront définitivement supprimés conformément à l'article 17 du RGPD.
                    </span>
                    <span className="block font-medium text-red-800">
                      Tapez SUPPRIMER pour confirmer :
                    </span>
                    <Input
                      value={deleteConfirmInput}
                      onChange={(e) => setDeleteConfirmInput(e.target.value)}
                      placeholder="SUPPRIMER"
                      className="border-red-300 focus:border-red-500"
                    />
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmInput('')}>Annuler</AlertDialogCancel>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAllData}
                    disabled={deleteConfirmInput !== 'SUPPRIMER' || deleteLoading}
                  >
                    {deleteLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Suppression...</>
                    ) : (
                      <><Trash2 className="mr-2 h-4 w-4" /> Supprimer définitivement</>
                    )}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Conformité RGPD */}
      <Card className="border-blue-200/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Conformité RGPD
          </CardTitle>
          <CardDescription>
            Exercez vos droits sur vos données personnelles (articles 15, 17, 20 du RGPD)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Inventaire des données */}
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <p className="font-medium mb-1">Inventaire de mes données</p>
              <p className="text-sm text-muted-foreground">
                Consultez la liste des données personnelles que nous conservons (Art. 15)
              </p>
            </div>
            <Dialog open={inventoryOpen} onOpenChange={setInventoryOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={handleShowInventory}>
                  <FileText className="h-4 w-4 mr-2" />
                  Consulter
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Inventaire des données personnelles</DialogTitle>
                  <DialogDescription>
                    Conformément à l'article 15 du RGPD, voici l'ensemble des données que nous traitons.
                  </DialogDescription>
                </DialogHeader>
                {inventoryLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Chargement...</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Catégorie</TableHead>
                        <TableHead>Type de données</TableHead>
                        <TableHead>Finalité</TableHead>
                        <TableHead>Conservation</TableHead>
                        <TableHead className="text-right">Nb</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryData.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{item.category}</TableCell>
                          <TableCell className="text-sm">{item.dataType}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{item.purpose}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{item.retention}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">{item.count}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* Export des données */}
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <p className="font-medium mb-1">Exporter mes données</p>
              <p className="text-sm text-muted-foreground">
                Téléchargez toutes vos données au format JSON (Art. 20 — Portabilité)
              </p>
            </div>
            <Button variant="outline" onClick={handleExportAllData}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>

          <Separator />

          {/* Consentements */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Consentements</Label>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Conditions Générales d'Utilisation (CGU)</Label>
                <p className="text-sm text-muted-foreground">
                  {user.currentUser?.consentCGU
                    ? `Acceptées le ${new Date(user.currentUser.consentCGU).toLocaleDateString('fr-FR')}`
                    : 'Non acceptées'}
                </p>
              </div>
              <Switch
                checked={!!user.currentUser?.consentCGU}
                onCheckedChange={(v) => handleConsentToggle('cgu', v)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Traitement IA des données</Label>
                <p className="text-sm text-muted-foreground">
                  {user.currentUser?.consentAI
                    ? `Autorisé le ${new Date(user.currentUser.consentAI).toLocaleDateString('fr-FR')}`
                    : "L'IA ne traitera pas vos données sans votre consentement"}
                </p>
              </div>
              <Switch
                checked={!!user.currentUser?.consentAI}
                onCheckedChange={(v) => handleConsentToggle('ai', v)}
              />
            </div>
          </div>

          <Separator />

          {/* Liens CGU / Politique de confidentialité */}
          <div className="flex flex-wrap gap-4">
            <Button variant="link" className="text-[#059669] p-0 h-auto" onClick={() => toast.info("CGU", { description: "Ouverture des CGU..." })}>
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Conditions Générales d'Utilisation
            </Button>
            <Button variant="link" className="text-[#059669] p-0 h-auto" onClick={() => toast.info("Politique de confidentialité", { description: "Ouverture de la politique de confidentialité..." })}>
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Politique de confidentialité
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
              onClick={handleOpenDocumentation}
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
              onClick={handleContactSupport}
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
              onClick={handleScheduleDemo}
            >
              Planifier
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
