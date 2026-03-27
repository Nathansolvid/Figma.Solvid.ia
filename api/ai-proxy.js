/**
 * Vercel Serverless Function — ai-proxy
 * Proxy sécurisé vers l'API Anthropic.
 * La clé Anthropic n'est jamais exposée au client :
 * elle est lue depuis la table org_secrets en Supabase.
 *
 * Required env vars (Vercel) :
 *   VITE_SUPABASE_URL          — URL du projet Supabase
 *   SUPABASE_SERVICE_ROLE_KEY  — clé service role (bypass RLS pour lire org_secrets)
 *
 * POST body : { model, messages, system?, max_tokens, organization_id }
 * Header    : Authorization: Bearer <supabase_jwt>
 */

import { createClient } from '@supabase/supabase-js';

// ─── Rate limiting en mémoire (par organization_id) ──────────────────────────
// Fenêtre glissante de 60 secondes, max 20 requêtes par org.
// Note : en multi-instance Vercel, chaque instance a son propre compteur.
// Pour un rate limiting distribué, utiliser Vercel KV ou Upstash Redis.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX       = 20;
const rateLimitMap = new Map(); // orgId → { count, windowStart }

function checkRateLimit(orgId) {
  const now  = Date.now();
  const entry = rateLimitMap.get(orgId);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(orgId, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - entry.windowStart)) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

// ─── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://claude-solvid-ia.vercel.app',
  'http://localhost:5173',
];

function getAllowedOrigin(req) {
  const origin = req.headers['origin'] || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

// ─── Handler principal ────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', getAllowedOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // ── 1. Vérification du JWT Supabase ────────────────────────────────────────
  const authHeader = req.headers['authorization'] || '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!jwt) {
    return res.status(401).json({ error: 'Token d\'authentification manquant' });
  }

  const supabaseUrl      = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[ai-proxy] Missing env vars');
    return res.status(500).json({ error: 'Configuration serveur manquante' });
  }

  // Client anon pour valider le JWT de l'utilisateur
  const supabaseAnon = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY || '', {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }

  // ── 2. Lecture et validation du body ───────────────────────────────────────
  const { model, messages, system, max_tokens, organization_id } = req.body || {};

  if (!model || !messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Paramètres manquants : model, messages requis' });
  }

  if (!organization_id) {
    return res.status(400).json({ error: 'organization_id requis' });
  }

  // Sécurité : vérifier que l'org demandée correspond au JWT
  const jwtOrgId = user.user_metadata?.organizationId;
  const isAdmin  = user.user_metadata?.role === 'ADMIN';

  if (!isAdmin && jwtOrgId !== organization_id) {
    return res.status(403).json({ error: 'Accès refusé : organization_id non autorisé' });
  }

  // ── 3. Rate limiting ───────────────────────────────────────────────────────
  const rateCheck = checkRateLimit(organization_id);
  if (!rateCheck.allowed) {
    res.setHeader('Retry-After', rateCheck.retryAfter);
    return res.status(429).json({
      error: `Limite atteinte. Réessayez dans ${rateCheck.retryAfter}s.`,
    });
  }

  // ── 4. Lecture de la clé chiffrée depuis org_secrets ──────────────────────
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: secret, error: secretError } = await supabaseAdmin
    .from('org_secrets')
    .select('anthropic_key_encrypted')
    .eq('organization_id', organization_id)
    .single();

  if (secretError || !secret?.anthropic_key_encrypted) {
    return res.status(404).json({
      error: 'Clé Anthropic non configurée pour cette organisation. Rendez-vous dans Réglages → IA.',
    });
  }

  const anthropicKey = secret.anthropic_key_encrypted;

  // Validation basique du format de clé
  if (!anthropicKey.startsWith('sk-ant-')) {
    console.error('[ai-proxy] Clé stockée au format inattendu pour org:', organization_id);
    return res.status(500).json({ error: 'Clé API mal configurée. Contactez l\'administrateur.' });
  }

  // ── 5. Appel API Anthropic ─────────────────────────────────────────────────
  const anthropicBody = {
    model,
    messages,
    max_tokens: Math.min(max_tokens || 1024, 8192), // plafond de sécurité
  };
  if (system) anthropicBody.system = system;

  let anthropicResponse;
  try {
    anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(anthropicBody),
    });
  } catch (networkErr) {
    console.error('[ai-proxy] Network error calling Anthropic:', networkErr);
    return res.status(502).json({ error: 'Impossible de joindre l\'API Anthropic' });
  }

  // ── 6. Transmission de la réponse (sans jamais exposer la clé) ─────────────
  const responseData = await anthropicResponse.json();

  if (!anthropicResponse.ok) {
    // Retransmettre l'erreur Anthropic sans la clé
    const errMsg = responseData?.error?.message || `Erreur Anthropic HTTP ${anthropicResponse.status}`;
    console.error('[ai-proxy] Anthropic error:', anthropicResponse.status, errMsg);

    if (anthropicResponse.status === 401) {
      return res.status(502).json({ error: 'Clé API Anthropic invalide. Mettez-la à jour dans Réglages → IA.' });
    }
    if (anthropicResponse.status === 429) {
      return res.status(429).json({ error: 'Quota Anthropic atteint. Vérifiez votre abonnement Anthropic.' });
    }
    return res.status(502).json({ error: errMsg });
  }

  return res.status(200).json(responseData);
}
