# 🚀 Guide de Mise en Place - Solvid.IA Architecture

Ce guide explique **comment mettre en place** l'architecture complète de Solvid.IA depuis zéro.

---

## 📋 Prérequis

- Compte Supabase (gratuit: https://supabase.com)
- Node.js 18+ installé
- Connaissance basique de React, TypeScript, PostgreSQL

---

## Étape 1 : Créer le Projet Supabase

### 1.1 Créer un nouveau projet
```bash
1. Aller sur https://supabase.com/dashboard
2. Cliquer "New Project"
3. Remplir:
   - Name: solvid-ia-demo
   - Database Password: [générer un mot de passe fort]
   - Region: Europe (West) - eu-west-1
4. Cliquer "Create new project"
5. Attendre ~2 minutes que le projet se provisione
```

### 1.2 Récupérer les credentials
```bash
1. Dans le dashboard Supabase, aller à Settings > API
2. Copier:
   - Project URL: https://[PROJECT_ID].supabase.co
   - anon/public key: eyJhbGci...
   - service_role key: eyJhbGci... (cliquer "Reveal" pour voir)
```

### 1.3 Mettre à jour le frontend
```typescript
// Créer/éditer: /utils/supabase/info.tsx
export const projectId = "[PROJECT_ID]"  // Exemple: "onmxhxfntzjnxexpqfjs"
export const publicAnonKey = "eyJhbGci..."
```

---

## Étape 2 : Créer la Table KV Store

### 2.1 Créer la table via SQL Editor
```sql
-- Dans Supabase Dashboard > SQL Editor > New Query

-- Créer la table KV Store
CREATE TABLE IF NOT EXISTS public.kv_store_aa780fc8 (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer un index pour les requêtes par préfixe
CREATE INDEX IF NOT EXISTS kv_store_key_prefix_idx 
ON public.kv_store_aa780fc8 
USING btree (key text_pattern_ops);

-- Activer Row Level Security (RLS) - optionnel pour MVP
ALTER TABLE public.kv_store_aa780fc8 ENABLE ROW LEVEL SECURITY;

-- Politique: Permettre tout pour service_role (backend)
CREATE POLICY "Allow all for service role" 
ON public.kv_store_aa780fc8 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Exécuter la requête (bouton "Run" ou Ctrl+Enter)
```

### 2.2 Vérifier la création
```sql
-- Tester avec une insertion
INSERT INTO public.kv_store_aa780fc8 (key, value) 
VALUES ('test:hello', '{"message": "Hello KV Store!"}');

-- Vérifier
SELECT * FROM public.kv_store_aa780fc8 WHERE key = 'test:hello';

-- Nettoyer
DELETE FROM public.kv_store_aa780fc8 WHERE key = 'test:hello';
```

---

## Étape 3 : Créer la Supabase Edge Function

### 3.1 Installer Supabase CLI
```bash
# macOS
brew install supabase/tap/supabase

# Windows (via Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
brew install supabase/tap/supabase
# OU télécharger binary: https://github.com/supabase/cli/releases
```

### 3.2 Login to Supabase
```bash
supabase login
# Ouvre navigateur pour authentification
```

### 3.3 Initialiser le projet localement
```bash
cd /chemin/vers/votre/projet
supabase init

# Créer structure:
# /supabase
#   ├── config.toml
#   └── functions/
```

### 3.4 Créer la fonction server
```bash
mkdir -p supabase/functions/server
```

Créer le fichier: `/supabase/functions/server/index.tsx`
```typescript
// Copier le contenu du fichier existant dans votre projet
// OU créer une version minimale pour tester:

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";

const app = new Hono();

app.use('*', logger(console.log));
app.use("/*", cors({ origin: "*", allowMethods: ["GET", "POST", "OPTIONS"] }));

app.get("/make-server-aa780fc8/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

Deno.serve(app.fetch);
```

### 3.5 Créer kv_store.tsx
Créer le fichier: `/supabase/functions/server/kv_store.tsx`
```typescript
// Copier le contenu existant de votre projet
// Ce fichier est PROTÉGÉ - ne pas modifier
```

---

## Étape 4 : Déployer la Edge Function

### 4.1 Link au projet Supabase
```bash
supabase link --project-ref [PROJECT_ID]
# Exemple: supabase link --project-ref onmxhxfntzjnxexpqfjs

# Enter database password (celui créé à l'étape 1.1)
```

### 4.2 Déployer la fonction
```bash
supabase functions deploy server --no-verify-jwt

# Flags:
# --no-verify-jwt : On gère le JWT manuellement dans le code
```

### 4.3 Vérifier le déploiement
```bash
# Test local d'abord (optionnel)
supabase start
supabase functions serve server

# Tester avec curl
curl http://localhost:54321/functions/v1/make-server-aa780fc8/health

# Test production
curl https://[PROJECT_ID].supabase.co/functions/v1/make-server-aa780fc8/health
```

### 4.4 Configurer les secrets (si besoin d'API keys externes)
```bash
# Exemple: si vous utilisez OpenAI
supabase secrets set OPENAI_API_KEY=sk-...

# Les secrets SUPABASE_* sont auto-injectés, pas besoin de les configurer
```

---

## Étape 5 : Configurer le Frontend

### 5.1 Structure des fichiers (déjà en place)
```
/src
├── /services
│   └── api.ts                 ← API Client
├── /contexts
│   └── UserContext.tsx        ← Auth Context
├── /app
│   ├── App.tsx
│   ├── AppContent.tsx
│   └── /components
│       └── AuthPage.tsx       ← Login/Signup
└── /utils/supabase
    └── info.tsx               ← Credentials (mis à jour à l'étape 1.3)
```

### 5.2 Vérifier la configuration API
```typescript
// /src/services/api.ts
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-aa780fc8`;

// ✅ Vérifier que projectId est bien votre PROJECT_ID
```

### 5.3 Installer les dépendances (si nécessaire)
```bash
npm install
# OU
pnpm install
```

---

## Étape 6 : Tester l'Architecture

### 6.1 Test Backend Health Check
```bash
# Test avec curl
curl https://[PROJECT_ID].supabase.co/functions/v1/make-server-aa780fc8/health

# Réponse attendue:
# {"status":"ok","timestamp":"2025-01-30T12:34:56.789Z"}
```

### 6.2 Test Frontend → Backend
```typescript
// Ouvrir la console du navigateur sur votre app
const { apiClient } = await import('/src/services/api.ts');

// Test health check
const health = await apiClient.healthCheck();
console.log(health); // {status: "ok", timestamp: "..."}
```

### 6.3 Créer un compte de test
```
1. Ouvrir l'application
2. Cliquer sur "Inscription"
3. Remplir:
   - Nom: Sophie Martin
   - Email: sophie@test.com
   - Mot de passe: password123
   - Organisation: Acme Corp
   - Rôle: Directeur ESG
4. Cliquer "S'inscrire"

✅ Si succès: Vous êtes connecté automatiquement
❌ Si erreur: Vérifier les logs backend
```

### 6.4 Vérifier dans Supabase Dashboard

#### Auth Users
```
1. Aller à Authentication > Users
2. Vous devriez voir: sophie@test.com
```

#### KV Store Data
```sql
-- Dans SQL Editor
SELECT * FROM public.kv_store_aa780fc8 
WHERE key LIKE 'user:%' OR key LIKE 'org:%'
ORDER BY created_at DESC;

-- Résultat attendu:
-- key              | value
-- -----------------+---------------------------
-- user:abc-123     | {"id":"abc-123","email":"sophie@test.com",...}
-- org:xyz-789      | {"id":"xyz-789","name":"Acme Corp",...}
-- org:xyz-789:user:abc-123 | "true"
```

---

## Étape 7 : Seed des Données de Test

### 7.1 Créer la fonction seedTestData
```typescript
// Déjà présente dans votre projet
// Accessible via console navigateur après connexion
```

### 7.2 Exécuter le seed
```javascript
// Dans la console du navigateur (après login)
await seedTestData()

// Logs attendus:
// ✅ Created 3 packs
// ✅ Created 15 folders
// ✅ Created 120 indicators
// ✅ Created 240 evidence
// ✅ Created audit trail
```

### 7.3 Vérifier les données
```sql
-- Compter les entités dans KV Store
SELECT 
  COUNT(*) FILTER (WHERE key LIKE 'pack:%') AS packs,
  COUNT(*) FILTER (WHERE key LIKE 'folder:%') AS folders,
  COUNT(*) FILTER (WHERE key LIKE 'indicator:%') AS indicators,
  COUNT(*) FILTER (WHERE key LIKE 'evidence:%') AS evidence,
  COUNT(*) FILTER (WHERE key LIKE 'audit:%') AS audits
FROM public.kv_store_aa780fc8;
```

---

## Étape 8 : Tester les Flows d'Authentification

### 8.1 Test Login
```javascript
// Console navigateur
const { apiClient } = await import('/src/services/api.ts');

const response = await apiClient.login('sophie@test.com', 'password123');
console.log(response);
// {
//   accessToken: "eyJhbGci...",
//   user: { id: "...", email: "sophie@test.com", name: "Sophie Martin", ... }
// }
```

### 8.2 Test Session Check
```javascript
const session = await apiClient.getSession();
console.log(session);
// { user: { id: "...", email: "...", ... } }
```

### 8.3 Test Logout
```javascript
await apiClient.logout();
// Token cleared from localStorage
// User redirected to AuthPage
```

### 8.4 Test Token Expiration
```javascript
// Forcer un token invalide
localStorage.setItem('accessToken', 'invalid-token-xyz');

// Refresh la page
location.reload();

// ✅ Devrait afficher AuthPage (token invalidé silencieusement)
```

---

## Étape 9 : Tester les Routes Protégées

### 9.1 Test Create Pack
```javascript
const { apiClient } = await import('/src/services/api.ts');

const { pack } = await apiClient.createPack({
  name: 'Mon Premier Pack',
  type: 'PACK_DONNEUR_ORDRE',
  description: 'Pack de test',
  status: 'draft'
});

console.log(pack);
```

### 9.2 Test List Packs
```javascript
const { packs } = await apiClient.listPacks();
console.log(packs); // Array de tous les packs de votre organisation
```

### 9.3 Test Multi-Tenant Isolation
```javascript
// Créer 2 comptes dans 2 organisations différentes
// User 1: sophie@acme.com (Acme Corp)
// User 2: jean@beta.com (Beta Inc)

// Login User 1
const user1 = await apiClient.login('sophie@acme.com', 'password123');
const pack1 = await apiClient.createPack({ name: 'Pack Acme', type: 'PACK_DONNEUR_ORDRE' });
const packId = pack1.pack.id;

// Login User 2 (remplace le token)
const user2 = await apiClient.login('jean@beta.com', 'password123');

// Tenter d'accéder au pack de User 1
try {
  await apiClient.getPack(packId);
  console.error('❌ SECURITY ISSUE: User 2 can access User 1 pack!');
} catch (error) {
  console.log('✅ Multi-tenant isolation working:', error.message);
  // Erreur attendue: "Forbidden: Cannot access packs from other organizations"
}
```

### 9.4 Test RBAC Permissions
```javascript
// Login en tant que Viewer (read-only)
const viewer = await apiClient.login('viewer@test.com', 'password123');

// Tenter de créer un pack (devrait échouer)
try {
  await apiClient.createPack({ name: 'Test', type: 'PACK_DONNEUR_ORDRE' });
  console.error('❌ RBAC ISSUE: Viewer can create pack!');
} catch (error) {
  console.log('✅ RBAC working:', error.message);
  // Erreur attendue: "Forbidden: Insufficient permissions to create packs"
}
```

---

## Étape 10 : Monitoring & Debugging

### 10.1 Voir les logs Edge Function
```bash
# Méthode 1: Supabase Dashboard
1. Aller à Edge Functions > server
2. Cliquer "Logs"
3. Voir en temps réel

# Méthode 2: CLI
supabase functions logs server --follow
```

### 10.2 Voir les logs Frontend
```javascript
// Console navigateur (automatique)
// Tous les appels API sont loggés par apiClient.request()

// Activer debug mode (optionnel)
localStorage.setItem('debug', 'true');
```

### 10.3 Inspecter KV Store
```sql
-- Voir toutes les clés
SELECT key, LEFT(value, 100) as value_preview 
FROM public.kv_store_aa780fc8 
ORDER BY created_at DESC 
LIMIT 20;

-- Rechercher par pattern
SELECT * FROM public.kv_store_aa780fc8 
WHERE key LIKE 'pack:%';

-- Voir l'audit trail
SELECT value::json->'action' as action,
       value::json->'timestamp' as timestamp,
       value::json->'details' as details
FROM public.kv_store_aa780fc8 
WHERE key LIKE 'audit:%'
ORDER BY created_at DESC;
```

### 10.4 Debugger JWT Token
```javascript
// Copier le token
const token = localStorage.getItem('accessToken');
console.log(token);

// Aller sur https://jwt.io/
// Coller le token dans le décodeur
// Vérifier:
// - "sub": userId
// - "exp": expiration timestamp
// - "iss": "https://[PROJECT_ID].supabase.co/auth/v1"
```

---

## Étape 11 : Troubleshooting Commun

### Erreur: "Invalid JWT"
```
Cause: Token expiré ou invalide
Solution:
1. Vérifier dans console: localStorage.getItem('accessToken')
2. Si présent mais expiré: localStorage.removeItem('accessToken')
3. Refresh page → AuthPage apparaît
4. Login à nouveau
```

### Erreur: "User data not found in database"
```
Cause: User existe dans Supabase Auth mais pas dans KV Store
Solution:
1. Vérifier: SELECT * FROM kv_store_aa780fc8 WHERE key = 'user:USER_ID'
2. Si absent, recréer le user via signup (ou SQL manual insert)
```

### Erreur: "Forbidden: Cannot access packs from other organizations"
```
Cause: Multi-tenant isolation fonctionne correctement
Solution: C'est normal ! User ne peut voir que ses propres données
```

### Erreur: "fetch failed" / "Failed to fetch"
```
Cause: Edge Function pas déployée ou URL incorrecte
Solution:
1. Vérifier projectId dans /utils/supabase/info.tsx
2. Test health check: curl https://[PROJECT_ID].supabase.co/functions/v1/make-server-aa780fc8/health
3. Re-deploy: supabase functions deploy server
```

### Erreur: "TypeError: X is not a function"
```
Cause: Import incorrect
Solution:
1. Vérifier import: import { apiClient } from '@/services/api'
2. Pas: import apiClient from '@/services/api' (default export)
```

---

## Étape 12 : Next Steps

### Phase 4a: Connecter les vues aux vraies APIs
```typescript
// Exemple: PackView.tsx
const [pack, setPack] = useState<Pack | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadPack = async () => {
    try {
      const { pack } = await apiClient.getPack(packId);
      setPack(pack);
    } catch (error) {
      console.error('Failed to load pack:', error);
    } finally {
      setLoading(false);
    }
  };
  loadPack();
}, [packId]);
```

### Phase 4b: Evidence Upload avec Supabase Storage
```typescript
// Backend: Créer bucket
const { data: buckets } = await supabase.storage.listBuckets();
const bucketExists = buckets?.some(bucket => bucket.name === 'make-aa780fc8-evidence');
if (!bucketExists) {
  await supabase.storage.createBucket('make-aa780fc8-evidence', { public: false });
}

// Frontend: Upload file
const file = event.target.files[0];
const { data, error } = await supabase.storage
  .from('make-aa780fc8-evidence')
  .upload(`${userId}/${Date.now()}-${file.name}`, file);

// Backend: Generate signed URL
const { data: { signedUrl } } = await supabase.storage
  .from('make-aa780fc8-evidence')
  .createSignedUrl(filePath, 3600); // 1 hour
```

### Phase 4c: Export PDF/ZIP
```typescript
// Backend route
app.get("/make-server-aa780fc8/packs/:id/export", requireAuth, async (c) => {
  const packId = c.req.param('id');
  
  // Charger pack + folders + indicators + evidence
  const pack = await loadFullPack(packId);
  
  // Générer PDF (utiliser jsPDF ou puppeteer)
  const pdfBuffer = await generatePackPDF(pack);
  
  // Retourner
  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="pack-${packId}.pdf"`
    }
  });
});
```

---

## 📚 Ressources Utiles

### Documentation
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Hono Framework](https://hono.dev/)
- [Deno Manual](https://deno.land/manual)

### Outils
- [JWT Decoder](https://jwt.io/)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Postman](https://www.postman.com/) - Tester les APIs

### Support
- [Supabase Discord](https://discord.supabase.com/)
- [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)

---

## ✅ Checklist de Validation Finale

### Backend
- [ ] Supabase projet créé
- [ ] Table kv_store_aa780fc8 créée
- [ ] Edge Function déployée
- [ ] Health check répond 200 OK
- [ ] Signup crée user dans Auth + KV
- [ ] Login retourne JWT token
- [ ] Routes protégées vérifient token
- [ ] Multi-tenant isolation fonctionne
- [ ] RBAC bloque actions non autorisées
- [ ] Audit trail créé automatiquement

### Frontend
- [ ] projectId configuré dans info.tsx
- [ ] AuthPage permet signup/login
- [ ] Token stocké en localStorage
- [ ] UserContext charge session au démarrage
- [ ] Logout clear le token
- [ ] Token expiré redirige vers login
- [ ] API calls incluent Authorization header
- [ ] Erreurs API affichées à l'utilisateur

### Testing
- [ ] Peut créer un compte
- [ ] Peut login/logout
- [ ] Peut créer un pack
- [ ] Peut lister ses packs
- [ ] Ne peut pas voir packs d'autres orgs
- [ ] Viewer ne peut pas créer de pack
- [ ] Audit trail visible dans DB
- [ ] seedTestData() fonctionne

### Production Ready
- [ ] Logs backend configurés
- [ ] Erreurs loggées avec contexte
- [ ] Validation des inputs backend
- [ ] Gestion d'erreurs frontend
- [ ] Loading states dans UI
- [ ] Messages d'erreur user-friendly
- [ ] Pas de secrets dans le frontend
- [ ] CORS configuré correctement

---

**🎉 Félicitations ! Votre architecture Solvid.IA est opérationnelle !**
