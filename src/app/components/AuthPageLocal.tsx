/**
 * AUTH PAGE LOCAL - Authentification 100% locale (NO BLOCAGE)
 * 
 * Principe :
 * - Mode Test : Accès direct sans formulaire
 * - Créer compte : Créé localement, jamais d'échec
 * - Se connecter : Retrouve user local ou crée automatiquement (no-friction)
 */

import React, { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Shield, Loader2, Rocket, User, Building2, Mail, Lock } from 'lucide-react';
import { authService } from '@/services/authService';
import { User as UserType } from '@/contexts/UserContext';
import { Role } from '@/permissions';
import { toast } from 'sonner';

interface AuthPageLocalProps {
  onLogin: (user: UserType) => void;
}

export function AuthPageLocal({ onLogin }: AuthPageLocalProps) {
  const [loading, setLoading] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('test@solvid.ia');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form
  const [signupEmail, setSignupEmail] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupOrgName, setSignupOrgName] = useState('');
  const [signupRole, setSignupRole] = useState<string>('CLIENT_OWNER');

  /**
   * Mode Test - Accès direct sans formulaire
   */
  const handleTestMode = async () => {
    setLoading(true);
    
    try {
      console.log('🧪 Mode Test - Accès direct');
      
      // Auto-login as test user
      const result = await authService.login({ email: 'test@solvid.ia' });
      
      const mappedUser: UserType = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: mapRole(result.user.role),
        organizationId: result.user.organizationId,
        organizationName: result.organization.name,
      };

      onLogin(mappedUser);
      toast.success('Mode Test activé !', {
        description: 'Bienvenue dans Solvid.IA',
      });
    } catch (error: any) {
      console.error('❌ Test mode error:', error);
      toast.error('Erreur', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔐 Login attempt:', loginEmail);
      
      const result = await authService.login({ 
        email: loginEmail, 
        password: loginPassword 
      });

      console.log('✅ Login result:', result);

      const mappedUser: UserType = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: mapRole(result.user.role),
        organizationId: result.user.organizationId,
        organizationName: result.organization.name,
      };

      console.log('✅ Mapped user:', mappedUser);
      console.log('🔄 Calling onLogin with user...');
      
      onLogin(mappedUser);
      
      console.log('✅ onLogin called successfully');
      
      toast.success('Connexion réussie !', {
        description: `Bienvenue ${result.user.name}`,
      });
    } catch (error: any) {
      console.error('❌ Login error:', error);
      console.error('❌ Error stack:', error?.stack);
      toast.error('Erreur de connexion', { 
        description: error?.message || 'Une erreur est survenue'
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
    setLoading(true);

    try {
      console.log('✍️ Signup:', signupEmail);

      const result = await authService.signup({
        email: signupEmail,
        name: signupName,
        organizationName: signupOrgName,
        role: signupRole,
      });

      const mappedUser: UserType = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: mapRole(result.user.role),
        organizationId: result.user.organizationId,
        organizationName: result.organization.name,
      };

      onLogin(mappedUser);
      toast.success('Compte créé avec succès !', {
        description: `Bienvenue ${result.user.name}`,
      });
    } catch (error: any) {
      console.error('❌ Signup error:', error);
      toast.error('Erreur lors de la création du compte', { 
        description: error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Helper to map role string to Role enum
   */
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F3F0] to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#059669] rounded-2xl mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#0A3B2E]">
            Solvid<span className="text-[#059669]">.IA</span>
          </h1>
          <p className="text-sm text-gray-600">
            ESG Audit-Ready Data Room
          </p>
        </div>

        {/* Mode Test Card */}
        <Card className="border-2 border-[#059669] bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#0A3B2E]">
              <Rocket className="h-5 w-5 text-[#059669]" />
              Mode Test - Accès Direct
            </CardTitle>
            <CardDescription>
              Accédez immédiatement à l'application pour explorer toutes les fonctionnalités
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleTestMode}
              disabled={loading}
              className="w-full bg-[#059669] hover:bg-[#048558] text-white h-12 text-base"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-5 w-5" />
                  Lancer l'application
                </>
              )}
            </Button>
          </CardContent>
          <CardFooter className="text-xs text-gray-500 text-center">
            Mode développement - Toutes les données sont stockées localement
          </CardFooter>
        </Card>

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
                      <Mail className="h-4 w-4" />
                      Email
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
                      <Lock className="h-4 w-4" />
                      Mot de passe (optionnel en mode local)
                    </Label>
                    <Input
                      id="loginPassword"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </div>

                  <p className="text-xs text-gray-500">
                    💡 Si le compte n'existe pas, il sera créé automatiquement (mode no-friction)
                  </p>
                </CardContent>

                <CardFooter>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connexion...
                      </>
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
                      <Mail className="h-4 w-4" />
                      Email
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
                      <User className="h-4 w-4" />
                      Nom complet
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
                    <Label htmlFor="signupOrgName" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Organisation
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
                </CardContent>

                <CardFooter>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Création...
                      </>
                    ) : (
                      'Créer mon compte'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Info Footer */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4 text-sm text-blue-900">
            <p className="font-semibold mb-2">Mode Local Actif</p>
            <ul className="space-y-1 text-xs">
              <li>✅ Toutes les données stockées localement (IndexedDB)</li>
              <li>✅ Aucune connexion serveur requise</li>
              <li>✅ Fonctionne 100% offline</li>
              <li>✅ Persistance complète (refresh = pas de perte)</li>
            </ul>
            
            {/* 🆕 Reset Database Button */}
            <div className="mt-4 pt-3 border-t border-blue-300">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (confirm('⚠️ Êtes-vous sûr de vouloir réinitialiser la base de données ? Toutes les données locales seront supprimées.')) {
                    try {
                      // Clear IndexedDB
                      const dbName = 'SolvidIA_Local';
                      await indexedDB.deleteDatabase(dbName);
                      
                      // Clear localStorage
                      localStorage.clear();
                      
                      toast.success('Base de données réinitialisée', {
                        description: 'Rechargement de la page...'
                      });
                      
                      // Reload page
                      setTimeout(() => window.location.reload(), 1000);
                    } catch (error: any) {
                      console.error('❌ Reset error:', error);
                      toast.error('Erreur', { description: error.message });
                    }
                  }
                }}
                className="w-full text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                🔄 Réinitialiser la base de données
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}