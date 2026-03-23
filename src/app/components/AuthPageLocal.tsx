/**
 * AUTH PAGE - Authentification locale (email + mot de passe)
 *
 * Inscription publique + connexion.
 * Les inscriptions sont validées par un admin avant accès.
 */

import React, { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/components/ui/select';
import { Card, CardContent, CardFooter } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Shield, Loader2, User, Building2, Mail, Lock } from 'lucide-react';
import { authService } from '@/services/authService';
import { User as UserType } from '@/contexts/UserContext';
import { Role } from '@/permissions';
import { toast } from 'sonner';

interface AuthPageLocalProps {
  onLogin: (user: UserType) => void;
  onNavigate?: (view: string) => void;
}

export function AuthPageLocal({ onLogin, onNavigate }: AuthPageLocalProps) {
  const [loading, setLoading] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form
  const [signupEmail, setSignupEmail] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupOrgName, setSignupOrgName] = useState('');
  const [signupRole, setSignupRole] = useState<string>('CLIENT_OWNER');

  // RGPD consent
  const [acceptCGU, setAcceptCGU] = useState(false);
  const [acceptAI, setAcceptAI] = useState(false);

  // Password reset
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetTempPassword, setResetTempPassword] = useState('');

  /**
   * Password Reset — generates a temporary password
   */
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    try {
      // Generate a temporary password
      const tempPwd = `Temp_${Math.random().toString(36).slice(2, 10)}!`;
      // Update the credential in localStorage
      const result = await authService.resetPassword(resetEmail.toLowerCase().trim(), tempPwd);
      if (result) {
        setResetTempPassword(tempPwd);
        setResetSuccess(true);
        toast.success("Mot de passe réinitialisé");
      } else {
        toast.error("Aucun compte trouvé avec cet email");
      }
    } catch (err) {
      toast.error("Erreur lors de la réinitialisation");
    } finally {
      setResetLoading(false);
    }
  };

  /**
   * Login
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginEmail || !loginPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.login({
        email: loginEmail,
        password: loginPassword,
      });

      // Check subscription validity
      const subCheck = await authService.checkSubscriptionValid(result.user.id);
      if (!subCheck.valid) {
        await authService.logout();
        toast.error('Accès expiré', {
          description: subCheck.reason || 'Votre abonnement a expiré. Contactez votre administrateur.',
          duration: 6000,
        });
        setLoading(false);
        return;
      }

      const mappedUser: UserType = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: mapRole(result.user.role),
        organizationId: result.user.organizationId,
        organizationName: result.organization.name,
      };

      onLogin(mappedUser);
      toast.success('Connexion réussie !', {
        description: `Bienvenue ${result.user.name}`,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Erreur de connexion', {
        description: error?.message || 'Vérifiez vos identifiants',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Signup
   */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signupEmail || !signupName || !signupPassword) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (signupPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);

    try {
      await authService.signup({
        email: signupEmail,
        name: signupName,
        password: signupPassword,
        organizationName: signupOrgName,
        role: signupRole,
        consentCGU: new Date().toISOString(),
        consentAI: acceptAI ? new Date().toISOString() : null,
      });
    } catch (error: any) {
      // Compte créé mais en attente de validation admin
      if (error?.message === 'PENDING_APPROVAL') {
        toast.success('Demande envoyée !', {
          description: 'Votre compte a été créé. Un administrateur doit valider votre accès avant que vous puissiez vous connecter.',
          duration: 8000,
        });
        // Reset form
        setSignupEmail('');
        setSignupName('');
        setSignupPassword('');
        setSignupOrgName('');
        setSignupRole('CLIENT_OWNER');
        setAcceptCGU(false);
        setAcceptAI(false);
        return;
      }
      console.error('Signup error:', error);
      toast.error('Erreur lors de la création du compte', {
        description: error?.message || 'Une erreur est survenue',
      });
    } finally {
      setLoading(false);
    }
  };

  const mapRole = (role: string): Role => {
    const mapping: Record<string, Role> = {
      CLIENT_OWNER: Role.CLIENT_OWNER,
      CONSULTANT: Role.CONSULTANT,
      AUDITOR: Role.AUDITOR,
      CLIENT_CONTRIBUTOR: Role.CLIENT_CONTRIBUTOR,
      ADMIN: Role.ADMIN,
      VIEWER: Role.VIEWER,
    };
    return mapping[role] || Role.VIEWER;
  };

  // ---- Main Auth View ----
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F3F0] to-white flex items-center justify-center p-4">

      {/* Password Reset Modal */}
      {showResetForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowResetForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                <Mail className="h-6 w-6 text-emerald-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Réinitialiser le mot de passe</h3>
              <p className="text-sm text-gray-500 mt-1">Entrez l'email de votre compte</p>
            </div>

            {!resetSuccess ? (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <Label>Email du compte</Label>
                  <Input
                    type="email"
                    placeholder="votre@email.com"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowResetForm(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={resetLoading} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    {resetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Réinitialiser"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-emerald-800 font-medium mb-2">Nouveau mot de passe temporaire :</p>
                  <code className="bg-white px-4 py-2 rounded-lg text-lg font-mono font-bold text-emerald-900 border block">
                    {resetTempPassword}
                  </code>
                  <p className="text-xs text-emerald-600 mt-2">
                    Copiez ce mot de passe et connectez-vous. Changez-le ensuite dans les Réglages.
                  </p>
                </div>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => { setShowResetForm(false); setLoginEmail(resetEmail); setLoginPassword(''); }}
                >
                  Retour à la connexion
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#059669] rounded-2xl mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#0A3B2E]">
            Solvid<span className="text-[#059669]">.IA</span>
          </h1>
          <p className="text-sm text-gray-600">Plateforme ESG Audit-Ready</p>
        </div>

        {/* Login/Signup Tabs */}
        <Card className="shadow-lg">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>

            {/* LOGIN TAB */}
            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="loginEmail" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" /> Email
                    </Label>
                    <Input
                      id="loginEmail"
                      type="email"
                      placeholder="votre@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loginPassword" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" /> Mot de passe
                    </Label>
                    <Input
                      id="loginPassword"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => { setShowResetForm(true); setResetSuccess(false); setResetTempPassword(''); }}
                      className="text-xs text-emerald-700 hover:underline mt-1"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#059669] hover:bg-[#048558]"
                  >
                    {loading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connexion...</>
                    ) : (
                      'Se connecter'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            {/* SIGNUP TAB */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup}>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signupEmail" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" /> Email
                    </Label>
                    <Input
                      id="signupEmail"
                      type="email"
                      placeholder="votre@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signupName" className="flex items-center gap-2">
                      <User className="h-4 w-4" /> Nom complet
                    </Label>
                    <Input
                      id="signupName"
                      type="text"
                      placeholder="Jean Dupont"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signupPassword" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" /> Mot de passe
                    </Label>
                    <Input
                      id="signupPassword"
                      type="password"
                      placeholder="Minimum 8 caractères"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signupOrgName" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> Organisation
                    </Label>
                    <Input
                      id="signupOrgName"
                      type="text"
                      placeholder="Ma Société"
                      value={signupOrgName}
                      onChange={(e) => setSignupOrgName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signupRole">Rôle</Label>
                    <Select value={signupRole} onValueChange={setSignupRole}>
                      <SelectTrigger id="signupRole">
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

                  {/* RGPD Consent checkboxes */}
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="acceptCGU"
                        checked={acceptCGU}
                        onCheckedChange={(checked) => setAcceptCGU(checked === true)}
                        className="mt-0.5"
                      />
                      <label htmlFor="acceptCGU" className="text-xs text-gray-600 leading-relaxed cursor-pointer">
                        J'accepte les{' '}
                        <button
                          type="button"
                          className="text-[#059669] underline hover:text-[#048558] font-medium"
                          onClick={() => onNavigate?.('cgu')}
                        >
                          Conditions Générales d'Utilisation
                        </button>{' '}
                        et la{' '}
                        <button
                          type="button"
                          className="text-[#059669] underline hover:text-[#048558] font-medium"
                          onClick={() => onNavigate?.('politique-confidentialite')}
                        >
                          Politique de Confidentialité
                        </button>
                        {' '}<span className="text-red-500">*</span>
                      </label>
                    </div>
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="acceptAI"
                        checked={acceptAI}
                        onCheckedChange={(checked) => setAcceptAI(checked === true)}
                        className="mt-0.5"
                      />
                      <label htmlFor="acceptAI" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                        J'accepte que mes données ESG soient traitées par l'intelligence artificielle
                        (Anthropic Claude) pour générer des rapports <span className="text-gray-400">(optionnel)</span>
                      </label>
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    type="submit"
                    disabled={loading || !acceptCGU}
                    className="w-full bg-[#059669] hover:bg-[#048558]"
                  >
                    {loading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Création...</>
                    ) : (
                      'Créer mon compte'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Footer with legal links */}
        <div className="text-center space-y-1">
          <p className="text-xs text-gray-400">
            Solvid.IA — Plateforme ESG sécurisée
          </p>
          <p className="text-xs text-gray-400">
            <button
              className="text-[#059669] hover:underline"
              onClick={() => onNavigate?.('cgu')}
            >
              CGU
            </button>
            {' · '}
            <button
              className="text-[#059669] hover:underline"
              onClick={() => onNavigate?.('politique-confidentialite')}
            >
              Politique de Confidentialité
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
