/**
 * Vercel Serverless Function — create-user
 * Creates a Supabase user server-side with email already confirmed.
 * Uses SUPABASE_SERVICE_ROLE_KEY (never exposed to client).
 *
 * Required env vars (Vercel):
 *   SUPABASE_SERVICE_ROLE_KEY  — service role key from Supabase Settings → API
 *   VITE_SUPABASE_URL          — already set
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password, name, role, organizationId, organizationName, consentCGU, consentAI, roleLabel } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[create-user] Missing SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_URL');
    return res.status(500).json({ error: 'Configuration serveur manquante' });
  }

  // Admin client — service role bypasses RLS and email confirmation
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // <-- no confirmation email needed
      user_metadata: {
        name: name || email.split('@')[0],
        role: role || 'CLIENT_OWNER',
        roleLabel: roleLabel || undefined,
        organizationId: organizationId || crypto.randomUUID(),
        organizationName: organizationName || 'Mon Organisation',
        consentCGU: consentCGU || new Date().toISOString(),
        consentAI: consentAI || null,
      },
    });

    if (error) {
      // Friendly French errors
      const msg = error.message || '';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already been registered')) {
        return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' });
      }
      if (msg.toLowerCase().includes('invalid') && msg.toLowerCase().includes('email')) {
        return res.status(400).json({ error: 'Adresse email invalide.' });
      }
      if (msg.toLowerCase().includes('password')) {
        return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });
      }
      console.error('[create-user] Supabase error:', error);
      return res.status(400).json({ error: msg });
    }

    return res.status(200).json({ ok: true, userId: data.user?.id });
  } catch (err) {
    console.error('[create-user] Unexpected error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
