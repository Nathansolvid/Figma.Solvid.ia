/**
 * AUTH PAGE — Connexion & Inscription Solvid.IA
 * Design moderne style app (split-screen branding + form)
 */

import React, { useState, useRef } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';
import {
  Loader2, Mail, Lock, User, Building2,
  ArrowRight, ArrowLeft, CheckCircle2, Eye, EyeOff,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { User as UserType } from '@/contexts/UserContext';
import { Role } from '@/permissions';
import { toast } from 'sonner';

interface AuthPageLocalProps {
  onLogin: (user: UserType) => void;
  onNavigate?: (view: string) => void;
}

type AuthView = 'login' | 'signup' | 'signup-confirm' | 'reset' | 'reset-sent';

export function AuthPageLocal({ onLogin, onNavigate }: AuthPageLocalProps) {
  const [view, setView] = useState<AuthView>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup — step 1
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  // Signup — step 2
  const [signupName, setSignupName] = useState('');
  const [signupOrgName, setSignupOrgName] = useState('');
  const [signupRole, setSignupRole] = useState('CLIENT_OWNER');
  const [signupRoleCustom, setSignupRoleCustom] = useState('');
  const [acceptCGU, setAcceptCGU] = useState(false);
  const [acceptAI, setAcceptAI] = useState(false);
  const [signupStep, setSignupStep] = useState<1 | 2>(1);

  // Reset
  const [resetEmail, setResetEmail] = useState('');

  // Anti double-submit lock
  const submittingRef = useRef(false);

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) { toast.error('Remplis tous les champs'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
      if (!data.user) throw new Error('Utilisateur introuvable');

      const meta = data.user.user_metadata || {};
      const roleMap: Record<string, Role> = {
        ADMIN: Role.ADMIN, CONSULTANT: Role.CONSULTANT, CLIENT_OWNER: Role.CLIENT_OWNER,
        CLIENT_CONTRIBUTOR: Role.CLIENT_CONTRIBUTOR, AUDITOR: Role.AUDITOR, VIEWER: Role.VIEWER,
      };
      onLogin({
        id: data.user.id,
        name: meta.name || data.user.email?.split('@')[0] || 'Utilisateur',
        email: data.user.email || '',
        role: roleMap[meta.role] ?? Role.CLIENT_OWNER,
        organizationId: meta.organizationId || data.user.id,
        organizationName: meta.organizationName || 'Mon Organisation',
        consentCGU: meta.consentCGU,
        consentAI: meta.consentAI,
      });
    } catch (err: any) {
      toast.error(
        err?.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect'
          : err?.message || 'Erreur de connexion'
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Signup step 1 → step 2 ─────────────────────────────────────────────────
  const handleSignupStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail || !signupPassword || !signupConfirmPassword) { toast.error('Remplis tous les champs'); return; }
    if (signupPassword.length < 8) { toast.error('Mot de passe : 8 caractères minimum'); return; }
    if (signupPassword !== signupConfirmPassword) { toast.error('Les mots de passe ne correspondent pas'); return; }
    setSignupStep(2);
  };

  // ── Signup submit ──────────────────────────────────────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return; // prevent double-click
    if (!signupName) { toast.error('Ton nom est requis'); return; }
    if (signupRole === 'OTHER' && !signupRoleCustom.trim()) { toast.error('Précise ton rôle'); return; }
    if (!acceptCGU) { toast.error('Accepte les CGU pour continuer'); return; }
    submittingRef.current = true;
    setLoading(true);
    try {
      // [DIAG] Trace signup
      console.log('[DIAG][signup] Starting signUp for:', signupEmail);
      // Standard Supabase signup — Supabase sends the confirmation email natively
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            name: signupName,
            role: signupRole === 'OTHER' ? 'VIEWER' : signupRole,
            roleLabel: signupRole === 'OTHER' ? signupRoleCustom.trim() : undefined,
            organizationId: crypto.randomUUID(),
            organizationName: signupOrgName || 'Mon Organisation',
            consentCGU: new Date().toISOString(),
            consentAI: acceptAI ? new Date().toISOString() : null,
          },
        },
      });

      console.log('[DIAG][signup] Supabase signUp result — error:', error, '| user:', data.user?.id);
      if (error) throw error;
      if (!data.user) throw new Error('Erreur lors de la création du compte');

      // Notify admin (fire-and-forget)
      fetch('/api/notify-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': import.meta.env.VITE_INTERNAL_SECRET || '',
        },
        body: JSON.stringify({ name: signupName, email: signupEmail, org: signupOrgName, role: signupRole === 'OTHER' ? `Autre — ${signupRoleCustom}` : signupRole }),
      }).catch(() => {});

      setView('signup-confirm');
    } catch (err: any) {
      console.error('[DIAG][signup] CAUGHT ERROR — raw message:', err?.message, '| full err:', err);
      const msg = err?.message || '';
      const friendlyError =
        msg.includes('User already registered') || msg.includes('already been registered')
          ? 'Un compte existe déjà avec cet email. Connecte-toi ou réinitialise ton mot de passe.'
          : msg.includes('Email rate limit') || msg.includes('over_email_send_rate_limit')
            ? 'Trop de tentatives. Attends quelques minutes avant de réessayer.'
            : msg.includes('invalid') && msg.toLowerCase().includes('email')
              ? 'Adresse email invalide.'
              : msg.includes('Password should be')
                ? 'Le mot de passe doit contenir au moins 8 caractères.'
                : msg || 'Erreur lors de la création du compte';
      toast.error(friendlyError);
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  // ── Password reset ─────────────────────────────────────────────────────────
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setView('reset-sent');
    } catch (err: any) {
      toast.error(err?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  // ── Layout shell ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">
      {/* LEFT — Branding panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10 text-white"
        style={{ background: 'linear-gradient(145deg, #0A3B2E 0%, #0F5C44 60%, #059669 100%)' }}
      >
        <div>
          <div className="flex items-center gap-3 mb-12">
            <span className="text-2xl font-bold tracking-tight">Solvid<span className="text-emerald-300">.IA</span></span>
          </div>
          <h2 className="text-3xl font-bold leading-tight mb-4">
            La plateforme ESG<br />Audit-Ready pour les PME
          </h2>
          <p className="text-white/70 text-sm leading-relaxed">
            Collecte structurée, rapports VSME & CSRD, preuves traçables — tout en un.
          </p>
        </div>

        <div className="space-y-4">
          {[
            { icon: '📊', text: '47 indicateurs VSME pré-configurés' },
            { icon: '🔒', text: 'Données sécurisées & auditables' },
            { icon: '🤖', text: 'Rapports générés par IA' },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-3 text-sm text-white/80">
              <span className="text-lg">{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>

        <p className="text-xs text-white/40">© 2026 Solvid. Tous droits réservés.</p>
      </div>

      {/* RIGHT — Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white">
        <div className="w-full max-w-[400px] space-y-6">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-2">
            <span className="text-xl font-bold text-[#0A3B2E]">Solvid<span className="text-[#059669]">.IA</span></span>
          </div>

          {/* ── LOGIN ── */}
          {view === 'login' && (
            <>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Content de te revoir</h1>
                <p className="text-sm text-gray-500 mt-1">Connecte-toi à ton espace Solvid</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="loginEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="loginEmail" type="email" placeholder="ton@email.com" className="pl-9"
                      value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="loginPassword">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="loginPassword" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                      className="pl-9 pr-9" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button type="button" onClick={() => { setResetEmail(loginEmail); setView('reset'); }}
                    className="text-xs text-[#059669] hover:underline">
                    Mot de passe oublié ?
                  </button>
                </div>

                <Button type="submit" disabled={loading} className="w-full bg-[#059669] hover:bg-[#048558] h-11">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Se connecter</span><ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>
              </form>

              <p className="text-sm text-center text-gray-500">
                Pas encore de compte ?{' '}
                <button onClick={() => { setView('signup'); setSignupStep(1); }} className="text-[#059669] font-medium hover:underline">
                  S'inscrire
                </button>
              </p>
            </>
          )}

          {/* ── SIGNUP STEP 1 ── */}
          {view === 'signup' && signupStep === 1 && (
            <>
              <div>
                <button onClick={() => setView('login')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
                  <ArrowLeft className="w-4 h-4" /> Retour
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Créer un compte</h1>
                <p className="text-sm text-gray-500 mt-1">Étape 1 sur 2 — Tes identifiants</p>
                <div className="flex gap-1 mt-3">
                  <div className="h-1 flex-1 rounded-full bg-[#059669]" />
                  <div className="h-1 flex-1 rounded-full bg-gray-200" />
                </div>
              </div>

              <form onSubmit={handleSignupStep1} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="sEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="sEmail" type="email" placeholder="ton@email.com" className="pl-9"
                      value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sPassword">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="sPassword" type={showPassword ? 'text' : 'password'} placeholder="8 caractères minimum"
                      className="pl-9 pr-9" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required minLength={8} />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {signupPassword.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {[4, 6, 8, 10].map(n => (
                        <div key={n} className={`h-1 flex-1 rounded-full transition-all ${signupPassword.length >= n ? 'bg-[#059669]' : 'bg-gray-200'}`} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sConfirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="sConfirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••"
                      className={`pl-9 pr-9 ${signupConfirmPassword.length > 0 && signupPassword !== signupConfirmPassword ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                      value={signupConfirmPassword} onChange={e => setSignupConfirmPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {signupConfirmPassword.length > 0 && signupPassword !== signupConfirmPassword && (
                    <p className="text-xs text-red-500">Les mots de passe ne correspondent pas</p>
                  )}
                  {signupConfirmPassword.length > 0 && signupPassword === signupConfirmPassword && (
                    <p className="text-xs text-[#059669]">Mots de passe identiques ✓</p>
                  )}
                </div>

                <Button type="submit" className="w-full bg-[#059669] hover:bg-[#048558] h-11">
                  Continuer <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>

              <p className="text-sm text-center text-gray-500">
                Déjà un compte ?{' '}
                <button onClick={() => setView('login')} className="text-[#059669] font-medium hover:underline">Se connecter</button>
              </p>
            </>
          )}

          {/* ── SIGNUP STEP 2 ── */}
          {view === 'signup' && signupStep === 2 && (
            <>
              <div>
                <button onClick={() => setSignupStep(1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
                  <ArrowLeft className="w-4 h-4" /> Retour
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Ton profil</h1>
                <p className="text-sm text-gray-500 mt-1">Étape 2 sur 2 — Tes informations</p>
                <div className="flex gap-1 mt-3">
                  <div className="h-1 flex-1 rounded-full bg-[#059669]" />
                  <div className="h-1 flex-1 rounded-full bg-[#059669]" />
                </div>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="sName">Nom complet <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="sName" type="text" placeholder="Jean Dupont" className="pl-9"
                      value={signupName} onChange={e => setSignupName(e.target.value)} required />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sOrg">Organisation</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="sOrg" type="text" placeholder="Ma Société SAS" className="pl-9"
                      value={signupOrgName} onChange={e => setSignupOrgName(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Ton rôle</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'CLIENT_OWNER', label: 'Directeur ESG' },
                      { value: 'CONSULTANT', label: 'Consultant ESG' },
                      { value: 'CLIENT_CONTRIBUTOR', label: 'Analyste données' },
                      { value: 'AUDITOR', label: 'Auditeur' },
                      { value: 'OTHER', label: 'Autre' },
                    ].map(r => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setSignupRole(r.value)}
                        className={`text-xs px-3 py-2 rounded-lg border-2 text-left transition-all ${
                          signupRole === r.value
                            ? 'border-[#059669] bg-emerald-50 text-[#059669] font-medium'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  {signupRole === 'OTHER' && (
                    <Input
                      type="text"
                      placeholder="Précise ton rôle..."
                      value={signupRoleCustom}
                      onChange={e => setSignupRoleCustom(e.target.value)}
                      className="mt-2"
                      autoFocus
                    />
                  )}
                </div>

                <div className="space-y-3 pt-1 border-t border-gray-100">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox id="cgu" checked={acceptCGU} onCheckedChange={v => setAcceptCGU(v === true)} className="mt-0.5" />
                    <span className="text-xs text-gray-600 leading-relaxed">
                      J'accepte les{' '}
                      <button type="button" className="text-[#059669] underline" onClick={() => onNavigate?.('cgu')}>CGU</button>
                      {' '}et la{' '}
                      <button type="button" className="text-[#059669] underline" onClick={() => onNavigate?.('politique-confidentialite')}>Politique de confidentialité</button>
                      <span className="text-red-500 ml-1">*</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox id="ai" checked={acceptAI} onCheckedChange={v => setAcceptAI(v === true)} className="mt-0.5" />
                    <span className="text-xs text-gray-500 leading-relaxed">
                      J'accepte le traitement par IA (Anthropic Claude) pour générer des rapports <span className="text-gray-400">(optionnel)</span>
                    </span>
                  </label>
                </div>

                <Button type="submit" disabled={loading || !acceptCGU} className="w-full bg-[#059669] hover:bg-[#048558] h-11">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Créer mon compte</span><ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>
              </form>
            </>
          )}

          {/* ── SIGNUP CONFIRMATION ── */}
          {view === 'signup-confirm' && (
            <div className="text-center space-y-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
                <Mail className="w-10 h-10 text-[#059669]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Vérifie ton email !</h1>
                <p className="text-sm text-gray-500 mt-2">
                  Un email de confirmation a été envoyé à<br />
                  <strong className="text-gray-700">{signupEmail}</strong>
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-left space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Prochaines étapes :</p>
                {[
                  'Ouvre l\'email de Solvid.IA',
                  'Clique sur le lien de confirmation',
                  'Reviens ici pour te connecter',
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#059669] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-sm text-gray-700">{step}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full" onClick={() => {
                setLoginEmail(signupEmail);
                setView('login');
              }}>
                Retour à la connexion
              </Button>
              <p className="text-xs text-gray-400">
                Email non reçu ?{' '}
                <button
                  className="text-[#059669] font-medium hover:underline"
                  onClick={async () => {
                    const { error } = await supabase.auth.resend({ type: 'signup', email: signupEmail });
                    if (error) {
                      toast.error('Erreur : ' + error.message);
                    } else {
                      toast.success(`Email renvoyé à ${signupEmail}`);
                    }
                  }}
                >
                  Renvoyer
                </button>
              </p>
            </div>
          )}

          {/* ── RESET PASSWORD ── */}
          {view === 'reset' && (
            <>
              <div>
                <button onClick={() => setView('login')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
                  <ArrowLeft className="w-4 h-4" /> Retour
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Mot de passe oublié</h1>
                <p className="text-sm text-gray-500 mt-1">On t'envoie un lien de réinitialisation</p>
              </div>

              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="resetEmail">Email du compte</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="resetEmail" type="email" placeholder="ton@email.com" className="pl-9"
                      value={resetEmail} onChange={e => setResetEmail(e.target.value)} required autoFocus />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-[#059669] hover:bg-[#048558] h-11">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Envoyer le lien'}
                </Button>
              </form>
            </>
          )}

          {/* ── RESET SENT ── */}
          {view === 'reset-sent' && (
            <div className="text-center space-y-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
                <Mail className="w-10 h-10 text-[#059669]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Email envoyé !</h1>
                <p className="text-sm text-gray-500 mt-2">
                  Un lien de réinitialisation a été envoyé à<br />
                  <strong className="text-gray-700">{resetEmail}</strong>
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setView('login')}>
                Retour à la connexion
              </Button>
            </div>
          )}

          {/* Legal footer */}
          {(view === 'login' || view === 'signup') && (
            <p className="text-xs text-center text-gray-400">
              <button className="hover:underline text-gray-400" onClick={() => onNavigate?.('cgu')}>CGU</button>
              {' · '}
              <button className="hover:underline text-gray-400" onClick={() => onNavigate?.('politique-confidentialite')}>Confidentialité</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
