# Plan de migration Dev / Prod — Solvid.IA

> Statut : EN ATTENTE — aucune modification effectuée
> Audit réalisé le : 2026-03-27

---

## 1. Variables à dupliquer dans les deux environnements

### Client-side (préfixe `VITE_`) — dans `.env.development` / `.env.production`

| Variable | Dev | Prod | Notes |
|---|---|---|---|
| `VITE_SUPABASE_URL` | projet dev | projet prod | Point d'entrée unique du client |
| `VITE_SUPABASE_ANON_KEY` | clé anon dev | clé anon prod | Clé publique, ok dans le bundle |
| `VITE_SENTRY_DSN` | optionnel / vide | DSN prod | Monitoring erreurs |
| `VITE_DEMO_MODE` | `true` (optionnel) | `false` ou absent | Bypass auth en dev uniquement |
| `VITE_ADMIN_EMAIL` | email admin dev | email admin prod | Seed initial seulement |
| `VITE_ADMIN_NAME` | nom admin dev | nom admin prod | Seed initial seulement |

### Server-side (Vercel env vars) — à configurer dans le dashboard Vercel par environnement

| Variable | Dev | Prod | Notes |
|---|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | clé service dev | clé service prod | Jamais côté client |
| `SUPABASE_URL` | URL dev | URL prod | Utilisé dans les Edge Functions Deno |
| `SUPABASE_ANON_KEY` | clé anon dev | clé anon prod | Utilisé dans les Edge Functions Deno |
| `RESEND_API_KEY` | clé Resend dev | clé Resend prod | Notifications email admin |
| `ADMIN_NOTIFY_EMAIL` | email dev | email prod | Destinataire des notifications signup |

---

## 2. Variables à migrer en urgence (sécurité)

### 🔴 CRITIQUE — `VITE_ANTHROPIC_API_KEY` (actuellement côté client)

**Problème :** préfixe `VITE_` → la clé est embarquée dans le bundle JS, visible par n'importe qui.

**Action requise :**
1. Créer une Edge Function Vercel `api/ai-proxy.js` qui proxifie les appels Anthropic
2. Remplacer `import.meta.env.VITE_ANTHROPIC_API_KEY` dans `aiQualitativeService.ts` par un appel à `/api/ai-proxy`
3. Déplacer la clé en tant que variable serveur : `ANTHROPIC_API_KEY` (sans préfixe `VITE_`)
4. Supprimer `VITE_ANTHROPIC_API_KEY` de tous les `.env`

**Fichiers concernés :**
- `src/services/aiQualitativeService.ts:37`

### 🟠 IMPORTANT — `VITE_ADMIN_PASSWORD` (côté client)

**Problème :** mot de passe visible dans le bundle JS.

**Action requise :**
1. Exécuter le seed admin une seule fois sur le projet cible
2. Supprimer `VITE_ADMIN_PASSWORD` de tous les `.env` après seed
3. Si besoin de re-seeder : créer l'utilisateur directement dans Supabase Dashboard

**Fichiers concernés :**
- `src/services/authService.ts:205`

### 🟡 MINEUR — Project IDs hardcodés dans le code

**Problème :** deux IDs de projet Supabase écrits en dur dans le code source.

| Fichier | ID hardcodé | Usage |
|---|---|---|
| `api/notify-signup.js:125` | `juoeblhhbarzsqcyqrkq` | Lien HTML dans l'email admin |
| `supabase/functions/server/kv_store.tsx:10` | `onmxhxfntzjnxexpqfjs` | Commentaire (autre projet) |

**Action requise :** remplacer le lien dans `notify-signup.js` par une variable d'env `SUPABASE_PROJECT_ID`.

---

## 3. Fichiers à modifier par phase

### Phase 1 — Structure (FAIT)
- [x] `MIGRATION_PLAN.md` — ce fichier
- [x] `.env.development` — template vide créé
- [x] `.env.production` — template vide créé
- [x] `.gitignore` — patterns `.env.*` + `!.env.example` ajoutés

### Phase 2 — Création projet Supabase dev (manuel)
- [ ] Créer un nouveau projet Supabase "Solvid.IA — Dev" dans le dashboard
- [ ] Appliquer les migrations SQL : `supabase/migrations/20260325_rls_policies.sql`
- [ ] Remplir `.env.development` avec les credentials du projet dev
- [ ] Configurer les variables serveur Vercel pour l'environnement "Preview"

### Phase 3 — Remplissage `.env.production`
- [ ] Vérifier que les credentials prod (`juoeblhhbarzsqcyqrkq`) sont corrects
- [ ] Remplir `.env.production` avec les valeurs du projet prod existant
- [ ] Configurer les variables serveur Vercel pour l'environnement "Production"

### Phase 4 — Sécurité (prioritaire)
- [ ] Migrer `VITE_ANTHROPIC_API_KEY` → Edge Function `api/ai-proxy.js`
- [ ] Modifier `src/services/aiQualitativeService.ts` pour appeler `/api/ai-proxy`
- [ ] Supprimer `VITE_ADMIN_PASSWORD` post-seed
- [ ] Remplacer l'ID hardcodé dans `api/notify-signup.js` par `process.env.SUPABASE_PROJECT_ID`

### Phase 5 — Tests de validation
- [ ] Vérifier login/signup sur l'environnement dev (projet Supabase dev)
- [ ] Vérifier que les emails arrivent (Resend dev)
- [ ] Vérifier que les dossiers persistent après déconnexion/reconnexion
- [ ] Vérifier que l'env prod est intact et non impacté

---

## 4. Architecture cible

```
impactly-ia/
├── .env.example          # Template (commité, sans valeurs)
├── .env.development      # Credentials projet dev (ignoré par git)
├── .env.production       # Credentials projet prod (ignoré par git)
├── .gitignore            # .env.* protégé
└── api/
    ├── create-user.js    # Utilise SUPABASE_SERVICE_ROLE_KEY (serveur)
    ├── notify-signup.js  # Utilise RESEND_API_KEY (serveur)
    └── ai-proxy.js       # À créer — proxy Anthropic (Phase 4)
```

**Vercel — configuration des environnements :**
```
Production  → VITE_SUPABASE_URL=<url prod>  + SUPABASE_SERVICE_ROLE_KEY=<prod>
Preview/Dev → VITE_SUPABASE_URL=<url dev>   + SUPABASE_SERVICE_ROLE_KEY=<dev>
```
