# 🔧 Debug Auth - Guide de Test

> Guide pour débugger les problèmes d'authentification

**Date** : 31 janvier 2025

---

## 🐛 Problème Actuel

**Erreur** : `Unauthorized: Invalid access token - invalid claim: missing sub claim`

**Cause Root** : Le JWT token n'a pas le claim `sub` (subject/userId)

---

## ✅ Solution Appliquée

### Changement 1 : Utiliser Service Client dans requireAuth

**Avant** :
```typescript
const requireAuth = async (c: any, next: any) => {
  // ...
  const supabase = getAnonClient(); // ❌ Anon client peut ne pas voir tous les users
  const { data, error } = await supabase.auth.getUser(accessToken);
  // ...
};
```

**Après** :
```typescript
const requireAuth = async (c: any, next: any) => {
  // ...
  const supabase = getServiceClient(); // ✅ Service client avec admin privileges
  const { data, error } = await supabase.auth.getUser(accessToken);
  
  if (error || !data.user) {
    console.error('Auth verification failed:', error?.message, 'Token:', accessToken?.substring(0, 20) + '...');
    return c.json({ error: `Unauthorized: Invalid access token - ${error?.message}` }, 401);
  }
  // ...
};
```

**Pourquoi ça marche** :
- `getServiceClient()` utilise `SUPABASE_SERVICE_ROLE_KEY`
- Ce client a les privilèges admin
- Peut vérifier n'importe quel JWT token
- `getAnonClient()` était trop restrictif

---

## 🧪 Tests à Effectuer

### Test 1 : Créer un Nouveau Compte

**Important** : Les anciens tokens ne fonctionneront pas. Il faut créer un nouveau compte.

1. **Ouvrir l'app** → AuthPage s'affiche
2. **Cliquer "Inscription"**
3. **Remplir le formulaire** :
   ```
   Nom : Test User
   Email : test@solvid.com
   Password : test123456
   Organisation : Test Org
   Rôle : Directeur ESG
   ```
4. **Cliquer "S'inscrire"**
5. **Résultat attendu** :
   - ✅ Backend crée user dans Supabase Auth
   - ✅ Backend crée user dans KV
   - ✅ Auto-login avec JWT valide
   - ✅ Redirect vers Dashboard
   - ✅ Pas d'erreur console

---

### Test 2 : Vérifier le Token JWT

Une fois connecté, ouvrez la console et tapez :

```javascript
// Récupérer le token
const token = localStorage.getItem('solvid_access_token');
console.log('Token:', token);

// Décoder le JWT (pas besoin de librairie, juste pour debug)
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));
console.log('JWT Payload:', payload);

// Vérifier que "sub" existe
if (payload.sub) {
  console.log('✅ Token a le claim sub:', payload.sub);
} else {
  console.log('❌ Token n\'a PAS le claim sub');
}
```

**Résultat attendu** :
```json
{
  "aud": "authenticated",
  "exp": 1234567890,
  "iat": 1234567890,
  "iss": "https://xxx.supabase.co/auth/v1",
  "sub": "abc123-uuid-here",  // ✅ DOIT EXISTER
  "email": "test@solvid.com",
  "role": "authenticated",
  ...
}
```

---

### Test 3 : Créer un Pack

1. **Naviguer vers "Packs"**
2. **Cliquer "Nouveau Pack"**
3. **Sélectionner "Donneur d'Ordre"**
4. **Entrer nom** : "Mon Pack Test"
5. **Cliquer "Créer"**
6. **Résultat attendu** :
   - ✅ Pack créé dans backend
   - ✅ Navigation vers PackView
   - ✅ URL : `/packs/pack-1234567890/full` (pas `[object Object]`)
   - ✅ PackView charge les données
   - ✅ Pas d'erreur "Unauthorized"

---

### Test 4 : Vérifier les Logs Backend

Ouvrez la console Supabase (ou logs Deno si local) et cherchez :

```
✅ Succès :
- "POST /make-server-aa780fc8/auth/signup" 201
- "POST /make-server-aa780fc8/auth/login" 200
- "GET /make-server-aa780fc8/auth/session" 200
- "GET /make-server-aa780fc8/packs/pack-123/full" 200

❌ Erreur (ne devrait pas apparaître) :
- "Auth verification failed: invalid claim: missing sub claim"
- 401 Unauthorized
```

---

## 🔍 Debugging Avancé

### Si l'erreur persiste après nouveau compte

1. **Vérifier les env vars Supabase** :
   ```javascript
   // Dans la console frontend
   import { projectId, publicAnonKey } from '/utils/supabase/info';
   console.log('Project ID:', projectId);
   console.log('Anon Key:', publicAnonKey.substring(0, 20) + '...');
   ```

2. **Vérifier les env vars Backend** :
   ```bash
   # Dans Supabase Dashboard → Settings → Edge Functions → Environment Variables
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   SUPABASE_DB_URL=postgresql://...
   ```

3. **Tester auth directement** :
   ```javascript
   // Dans console frontend
   const { apiClient } = await import('/src/services/api.js');
   
   // Test signup
   const signup = await apiClient.signup({
     email: 'debug@test.com',
     password: 'debug123',
     name: 'Debug User',
     organizationName: 'Debug Org'
   });
   console.log('Signup result:', signup);
   
   // Test login
   const login = await apiClient.login('debug@test.com', 'debug123');
   console.log('Login result:', login);
   console.log('Access Token:', login.accessToken.substring(0, 30) + '...');
   
   // Décoder token
   const parts = login.accessToken.split('.');
   const payload = JSON.parse(atob(parts[1]));
   console.log('JWT Payload:', payload);
   console.log('Has sub claim:', !!payload.sub);
   ```

---

## 📝 Checklist de Validation

### Backend ✅

- [x] `requireAuth` utilise `getServiceClient()` au lieu de `getAnonClient()`
- [x] Logging ajouté pour debug auth
- [x] `signInWithPassword` retourne `data.session.access_token`
- [x] `admin.createUser` crée user avec `email_confirm: true`

### Frontend ✅

- [x] `handleOpenPack` accepte objet ou string
- [x] `UserContext` nettoie tokens invalides automatiquement
- [x] `AuthPage` a message d'aide pour inscription
- [x] Login auto après signup

### À Tester ✅

- [ ] Créer nouveau compte
- [ ] Vérifier JWT a claim `sub`
- [ ] Créer un pack
- [ ] PackView charge sans erreur
- [ ] Pas d'erreur 401 Unauthorized

---

## 🚨 Si Ça Ne Marche Toujours Pas

### Option 1 : Reset Complet

```javascript
// Dans console frontend
localStorage.clear();
location.reload();
```

Puis créer un nouveau compte from scratch.

---

### Option 2 : Vérifier Supabase Auth Settings

1. Ouvrir Supabase Dashboard
2. Aller dans **Authentication → Settings**
3. Vérifier :
   - ✅ Email provider activé
   - ✅ Auto-confirm OFF (on utilise `email_confirm: true` dans code)
   - ✅ JWT expiry : 3600s (1h)

---

### Option 3 : Logs Backend Détaillés

Ajouter plus de logs temporaires dans `requireAuth` :

```typescript
const requireAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  console.log('1. Auth header:', authHeader?.substring(0, 50) + '...');
  
  const accessToken = authHeader?.split(' ')[1];
  console.log('2. Access token:', accessToken?.substring(0, 30) + '...');
  
  if (!accessToken) {
    console.log('3. ❌ No access token');
    return c.json({ error: 'Unauthorized: No access token provided' }, 401);
  }

  const supabase = getServiceClient();
  console.log('4. Created service client');
  
  const { data, error } = await supabase.auth.getUser(accessToken);
  console.log('5. getUser result:', { 
    hasData: !!data, 
    hasUser: !!data?.user,
    userId: data?.user?.id,
    hasError: !!error,
    errorMsg: error?.message 
  });
  
  if (error || !data.user) {
    console.log('6. ❌ Auth failed:', error?.message);
    return c.json({ error: `Unauthorized: Invalid access token - ${error?.message}` }, 401);
  }

  console.log('7. ✅ Auth success for user:', data.user.id);
  c.set('userId', data.user.id);
  c.set('userEmail', data.user.email);
  await next();
};
```

---

## ✅ Résultat Attendu Final

Après avoir créé un nouveau compte :

1. ✅ Login réussit
2. ✅ JWT token a claim `sub`
3. ✅ Toutes les routes API fonctionnent
4. ✅ PackView charge sans erreur
5. ✅ Export PDF/ZIP fonctionne
6. ✅ Upload preuves fonctionne

---

**Prochaine étape** : Créer un nouveau compte et tester !

---

**Date** : 31 janvier 2025  
**Status** : Solution appliquée, en attente de test
