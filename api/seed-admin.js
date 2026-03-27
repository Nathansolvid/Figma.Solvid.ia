/**
 * Vercel Serverless Function — seed-admin
 * Creates the initial SOLVID_ADMIN account on first deployment.
 * Idempotent: does nothing if an admin already exists.
 *
 * Required env vars (Vercel — server-side only, never VITE_*):
 *   INTERNAL_SECRET       — shared secret, must match x-internal-secret header
 *   SEED_ADMIN_EMAIL      — admin account email
 *   SEED_ADMIN_PASSWORD   — admin account password
 *   VITE_SUPABASE_URL     — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — service role key (bypasses RLS)
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // ── Shared secret validation ──────────────────────────────────────────────
  const internalSecret = process.env.INTERNAL_SECRET;
  const providedSecret = req.headers['x-internal-secret'];

  if (!internalSecret || providedSecret !== internalSecret) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  // ── Env vars ──────────────────────────────────────────────────────────────
  const supabaseUrl    = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmail     = process.env.SEED_ADMIN_EMAIL;
  const adminPassword  = process.env.SEED_ADMIN_PASSWORD;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[seed-admin] Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return res.status(500).json({ error: 'Configuration serveur manquante' });
  }

  if (!adminEmail || !adminPassword) {
    console.error('[seed-admin] Missing SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD');
    return res.status(500).json({ error: 'SEED_ADMIN_EMAIL ou SEED_ADMIN_PASSWORD non configurés' });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── Check if an admin already exists ─────────────────────────────────────
  // List up to 1000 users; for large user bases this would need pagination,
  // but admin seeding happens once so this is acceptable.
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  });

  if (listError) {
    console.error('[seed-admin] listUsers error:', listError);
    return res.status(500).json({ error: 'Erreur lors de la vérification des comptes existants' });
  }

  const adminExists = listData?.users?.some(
    u => u.user_metadata?.role === 'SOLVID_ADMIN'
  );

  if (adminExists) {
    return res.status(200).json({ ok: true, skipped: 'admin already exists' });
  }

  // ── Create the admin account ──────────────────────────────────────────────
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: {
      name: 'Administrateur',
      role: 'SOLVID_ADMIN',
      organizationId: 'solvid-org-001',
      organizationName: 'Solvid',
    },
  });

  if (error) {
    // Treat duplicate email as success (admin created by another means)
    if (error.message?.toLowerCase().includes('already')) {
      return res.status(200).json({ ok: true, skipped: 'email already registered' });
    }
    console.error('[seed-admin] createUser error:', error);
    return res.status(400).json({ error: error.message });
  }

  console.log('[seed-admin] Admin created:', data.user?.id);
  return res.status(200).json({ ok: true, userId: data.user?.id });
}
