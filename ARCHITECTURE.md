# 📊 Architecture Technique Solvid.IA

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Tailwind)                  │
│                                                                   │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  AuthPage   │───▶│ UserContext  │───▶│  AppContent  │       │
│  │             │    │              │    │              │       │
│  │ Login/      │    │ currentUser  │    │ Dashboard/   │       │
│  │ Signup      │    │ isAuth       │    │ PackView/    │       │
│  │             │    │ logout()     │    │ IndicatorView│       │
│  └─────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                    │               │
│         └───────────────────┴────────────────────┘               │
│                             │                                     │
│                    ┌────────▼─────────┐                          │
│                    │   API Client     │                          │
│                    │  (api.ts)        │                          │
│                    │                  │                          │
│                    │ • login()        │                          │
│                    │ • signup()       │                          │
│                    │ • getSession()   │                          │
│                    │ • createPack()   │                          │
│                    │ • getPack()      │                          │
│                    │ • etc.           │                          │
│                    └────────┬─────────┘                          │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                    HTTP + JWT (Authorization: Bearer {token})
                              │
┌─────────────────────────────▼────────────────────────────────────┐
│              SUPABASE EDGE FUNCTION (Deno + Hono)                │
│                  /supabase/functions/server/index.tsx             │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │                     MIDDLEWARE                                ││
│  │  • CORS (open)                                                ││
│  │  • Logger                                                     ││
│  │  • requireAuth (JWT validation)                              ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │                       ROUTES                                  ││
│  │                                                               ││
│  │  AUTH ROUTES (public):                                       ││
│  │  • POST /auth/signup                                         ││
│  │  • POST /auth/login                                          ││
│  │  • POST /auth/logout                                         ││
│  │                                                               ││
│  │  PROTECTED ROUTES (requireAuth):                             ││
│  │  • GET  /auth/session                                        ││
│  │  • GET  /packs                                               ││
│  │  • POST /packs                                               ││
│  │  • GET  /packs/:id                                           ││
│  │  • PUT  /packs/:id                                           ││
│  │  • DELETE /packs/:id                                         ││
│  │  • GET  /folders/:folderId/indicators                        ││
│  │  • POST /indicators                                          ││
│  │  • PUT  /indicators/:id                                      ││
│  │  • GET  /audit-trail                                         ││
│  │  • etc.                                                      ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │                  SUPABASE AUTH CLIENT                         ││
│  │  • getAnonClient() → token validation                        ││
│  │  • getServiceClient() → admin operations                     ││
│  └──────────────────────────────────────────────────────────────┘│
│                             │                                     │
└─────────────────────────────┼─────────────────────────────────────┘
                              │
                        KV Store API
                              │
┌─────────────────────────────▼─────────────────────────────────────┐
│                  SUPABASE DATABASE (PostgreSQL)                   │
│                     Table: kv_store_aa780fc8                      │
│                                                                    │
│  ┌────────────────────┬─────────────────────────────────────────┐ │
│  │  Key Pattern       │  Value (JSON)                           │ │
│  ├────────────────────┼─────────────────────────────────────────┤ │
│  │ user:{userId}      │ { id, email, name, role, orgId, ... }   │ │
│  │ org:{orgId}        │ { id, name, settings, ... }             │ │
│  │ org:{orgId}:user:{userId} │ 'true' (membership)              │ │
│  │ pack:{packId}      │ { id, name, type, status, ... }         │ │
│  │ org:{orgId}:pack:{packId} │ 'true' (ownership)               │ │
│  │ folder:{folderId}  │ { id, packId, name, category, ... }     │ │
│  │ indicator:{indId}  │ { id, folderId, code, value, ... }      │ │
│  │ evidence:{evId}    │ { id, indicatorId, fileName, ... }      │ │
│  │ audit:{auditId}    │ { id, userId, action, timestamp, ... }  │ │
│  └────────────────────┴─────────────────────────────────────────┘ │
│                                                                    │
│  Utilise: /supabase/functions/server/kv_store.tsx                 │
│  • get(key)                                                        │
│  • set(key, value)                                                 │
│  • del(key)                                                        │
│  • mget([keys])                                                    │
│  • mset([{key, value}])                                            │
│  • getByPrefix(prefix)                                             │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Flux d'Authentification Détaillé

### 1. **SIGNUP (Inscription)**

#### Frontend → Backend
```typescript
// Fichier: /src/app/components/AuthPage.tsx (ligne 46-71)

const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // 1. Appel API signup
  await apiClient.signup({
    email: signupEmail,
    password: signupPassword,
    name: signupName,
    organizationName: signupOrgName,
    role: signupRole,
  });

  // 2. Auto-login après signup
  const response = await apiClient.login(signupEmail, signupPassword);
  onLogin(response.accessToken, response.user);
};
```

#### API Client
```typescript
// Fichier: /src/services/api.ts (ligne 54-67)

async signup(data: {
  email: string;
  password: string;
  name: string;
  organizationName?: string;
  role?: string;
}) {
  return this.request<{ message: string; userId: string; organizationId: string }>(
    '/auth/signup',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}
```

#### Backend Processing
```typescript
// Fichier: /supabase/functions/server/index.tsx (ligne 77-141)

app.post("/make-server-aa780fc8/auth/signup", async (c) => {
  const { email, password, name, organizationName, role = 'Directeur ESG' } = await c.req.json();

  // ÉTAPE 1: Créer utilisateur dans Supabase Auth
  const supabase = getServiceClient(); // Utilise SUPABASE_SERVICE_ROLE_KEY
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm (pas de serveur email)
    user_metadata: { name }
  });
  
  const userId = authData.user.id; // UUID généré par Supabase

  // ÉTAPE 2: Créer organisation dans KV Store
  const organizationId = generateId(); // crypto.randomUUID()
  const organization = {
    id: organizationId,
    name: organizationName,
    createdAt: new Date().toISOString(),
    settings: {}
  };
  await kv.set(`org:${organizationId}`, JSON.stringify(organization));

  // ÉTAPE 3: Créer user record dans KV Store
  const user = {
    id: userId,
    email,
    name,
    role,
    organizationId,
    createdAt: new Date().toISOString()
  };
  await kv.set(`user:${userId}`, JSON.stringify(user));

  // ÉTAPE 4: Lier user à organization
  await kv.set(`org:${organizationId}:user:${userId}`, 'true');

  return c.json({ message: 'User created successfully', userId, organizationId }, 201);
});
```

**Résultat dans la base de données :**
```
KV Store:
┌─────────────────────────────┬──────────────────────────────────────┐
│ Key                         │ Value                                │
├─────────────────────────────┼──────────────────────────────────────┤
│ org:abc-123                 │ {"id":"abc-123","name":"Acme Corp"...}│
│ user:xyz-789                │ {"id":"xyz-789","email":"jean@..."...}│
│ org:abc-123:user:xyz-789    │ "true"                               │
└─────────────────────────────┴──────────────────────────────────────┘

Supabase Auth:
┌──────────┬───────────────┬──────────┐
│ id       │ email         │ metadata │
├──────────┼───────────────┼──────────┤
│ xyz-789  │ jean@acme.com │ {name:..}│
└──────────┴───────────────┴──────────┘
```

---

### 2. **LOGIN (Connexion)**

#### Frontend → Backend
```typescript
// Fichier: /src/app/components/AuthPage.tsx (ligne 29-44)

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const response = await apiClient.login(loginEmail, loginPassword);
  onLogin(response.accessToken, response.user);
};
```

#### API Client
```typescript
// Fichier: /src/services/api.ts (ligne 70-87)

async login(email: string, password: string) {
  const response = await this.request<{
    accessToken: string;
    user: { id, email, name, role, organizationId };
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  // Stocke le token dans localStorage et en mémoire
  this.setAccessToken(response.accessToken);
  
  return response;
}
```

#### Backend Processing
```typescript
// Fichier: /supabase/functions/server/index.tsx (ligne 144-179)

app.post("/make-server-aa780fc8/auth/login", async (c) => {
  const { email, password } = await c.req.json();

  // ÉTAPE 1: Valider credentials avec Supabase Auth
  const supabase = getAnonClient(); // Utilise SUPABASE_ANON_KEY
  const { data, error } = await supabase.auth.signInWithPassword({ 
    email, 
    password 
  });

  if (error) {
    return c.json({ error: `Login error: ${error.message}` }, 401);
  }

  // ÉTAPE 2: Récupérer user data depuis KV Store
  const user = await getUserFromKV(data.user.id);
  // getUserFromKV fait: kv.get(`user:${userId}`)
  
  if (!user) {
    return c.json({ error: 'User data not found in database' }, 404);
  }

  // ÉTAPE 3: Retourner JWT token + user data
  return c.json({
    accessToken: data.session.access_token, // JWT généré par Supabase
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId
    }
  });
});
```

**JWT Token (exemple):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ4eXotNzg5IiwiZW1haWwiOiJqZWFuQGFjbWUuY29tIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJpYXQiOjE3MDk4MTk2NDAsImV4cCI6MTcwOTgyMzI0MH0.xyz...

Décodé:
{
  "sub": "xyz-789",           // userId
  "email": "jean@acme.com",
  "role": "authenticated",
  "iat": 1709819640,          // issued at
  "exp": 1709823240           // expires
}
```

#### Frontend Storage
```typescript
// Fichier: /src/services/api.ts (ligne 12-19)

setAccessToken(token: string | null) {
  this.accessToken = token;
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
}
```

---

### 3. **SESSION CHECK (Vérification au démarrage)**

#### Automatic on App Load
```typescript
// Fichier: /src/contexts/UserContext.tsx (ligne 32-57)

useEffect(() => {
  const checkSession = async () => {
    try {
      // ÉTAPE 1: Récupérer token stocké
      const accessToken = apiClient.getAccessToken(); // localStorage.getItem('accessToken')
      
      if (accessToken) {
        // ÉTAPE 2: Valider token auprès du backend
        const { user } = await apiClient.getSession();
        
        // ÉTAPE 3: Mapper et stocker user en contexte
        const mappedUser: User = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: mapRoleStringToEnum(user.role),
          organizationId: user.organizationId,
        };
        setCurrentUserState(mappedUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mappedUser));
      }
    } catch (error) {
      // Token expiré ou invalide → logout silencieux
      apiClient.setAccessToken(null);
      localStorage.removeItem(STORAGE_KEY);
      setCurrentUserState(null);
    } finally {
      setLoading(false);
    }
  };

  checkSession();
}, []);
```

#### Backend Validation
```typescript
// Fichier: /supabase/functions/server/index.tsx (ligne 183-197)

app.get("/make-server-aa780fc8/auth/session", requireAuth, async (c) => {
  // requireAuth middleware a déjà validé le token
  const userId = c.get('userId'); // Extrait par le middleware
  
  // Charger user depuis KV Store
  const user = await getUserFromKV(userId);
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json({ user });
});
```

---

## 🔒 Middleware d'Authentification

### requireAuth Middleware
```typescript
// Fichier: /supabase/functions/server/index.tsx (ligne 39-55)

const requireAuth = async (c: any, next: any) => {
  // ÉTAPE 1: Extraire token du header Authorization
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  
  if (!accessToken) {
    return c.json({ error: 'Unauthorized: No access token provided' }, 401);
  }

  // ÉTAPE 2: Valider token avec Supabase Auth
  const supabase = getAnonClient();
  const { data, error } = await supabase.auth.getUser(accessToken);
  
  if (error || !data.user) {
    return c.json({ error: `Unauthorized: Invalid access token - ${error?.message}` }, 401);
  }

  // ÉTAPE 3: Stocker userId dans contexte de la requête
  c.set('userId', data.user.id);
  c.set('userEmail', data.user.email);
  
  // ÉTAPE 4: Continuer vers le handler de route
  await next();
};
```

---

## 📡 Flux de Requête Protégée (Exemple: Create Pack)

### 1. Frontend Request
```typescript
// Fichier: /src/services/api.ts (ligne 116-126)

async createPack(data: {
  name: string;
  type: string;
  description?: string;
  status?: string;
}) {
  return this.request<{ pack: any }>('/packs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

### 2. API Client Request Method
```typescript
// Fichier: /src/services/api.ts (ligne 28-50)

private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // ÉTAPE 1: Récupérer token
  const token = this.getAccessToken();
  
  // ÉTAPE 2: Ajouter Authorization header
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token || publicAnonKey}`,
    ...options.headers,
  };

  // ÉTAPE 3: Faire la requête HTTP
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // ÉTAPE 4: Gérer erreurs
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}
```

**Requête HTTP résultante:**
```http
POST https://onmxhxfntzjnxexpqfjs.supabase.co/functions/v1/make-server-aa780fc8/packs
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz...

{
  "name": "Pack Donneur d'Ordre - Acme",
  "type": "PACK_DONNEUR_ORDRE",
  "description": "Pack pour audit annuel",
  "status": "draft"
}
```

### 3. Backend Processing
```typescript
// Fichier: /supabase/functions/server/index.tsx (ligne 273-321)

app.post("/make-server-aa780fc8/packs", requireAuth, async (c) => {
  // MIDDLEWARE requireAuth a déjà:
  // - Validé le token JWT
  // - Extrait userId et stocké dans c.get('userId')
  
  const userId = c.get('userId');
  
  // ÉTAPE 1: Charger user depuis KV Store
  const user = await getUserFromKV(userId);
  // getUserFromKV → kv.get(`user:${userId}`) → parse JSON
  
  const orgId = user.organizationId;

  // ÉTAPE 2: Vérifier permissions RBAC
  if (!checkPermission(user.role, ['Directeur ESG', 'Consultant ESG', 'Admin'])) {
    return c.json({ error: 'Forbidden: Insufficient permissions to create packs' }, 403);
  }

  // ÉTAPE 3: Créer pack
  const { name, type, description, status = 'draft' } = await c.req.json();
  
  const packId = generateId(); // crypto.randomUUID()
  const pack = {
    id: packId,
    organizationId: orgId,
    name,
    type,
    description,
    status,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // ÉTAPE 4: Sauvegarder dans KV Store
  await kv.set(`pack:${packId}`, JSON.stringify(pack));
  await kv.set(`org:${orgId}:pack:${packId}`, 'true'); // Index d'ownership

  // ÉTAPE 5: Créer audit trail
  const auditId = generateId();
  const auditEntry = {
    id: auditId,
    userId,
    action: 'pack_created',
    entityType: 'pack',
    entityId: packId,
    timestamp: new Date().toISOString(),
    details: { packName: name, packType: type }
  };
  await kv.set(`audit:${auditId}`, JSON.stringify(auditEntry));
  await kv.set(`org:${orgId}:audit:${auditId}`, 'true');

  return c.json({ pack }, 201);
});
```

**Résultat dans KV Store:**
```
┌─────────────────────────────────┬──────────────────────────────────┐
│ Key                             │ Value                            │
├─────────────────────────────────┼──────────────────────────────────┤
│ pack:pack-456                   │ {"id":"pack-456","name":"Pack...}│
│ org:abc-123:pack:pack-456       │ "true"                           │
│ audit:audit-789                 │ {"userId":"xyz-789","action"...} │
│ org:abc-123:audit:audit-789     │ "true"                           │
└─────────────────────────────────┴──────────────────────────────────┘
```

---

## 🗂️ Schéma de Clés KV Store

### Structure Hiérarchique
```
KV_STORE_AA780FC8
│
├── user:{userId}                    → User entity
├── org:{orgId}                      → Organization entity
├── org:{orgId}:user:{userId}        → Membership index
│
├── pack:{packId}                    → Pack entity
├── org:{orgId}:pack:{packId}        → Ownership index
│
├── folder:{folderId}                → Folder entity
├── pack:{packId}:folder:{folderId}  → Containment index
│
├── indicator:{indicatorId}          → Indicator entity
├── folder:{folderId}:indicator:{indicatorId} → Containment index
│
├── evidence:{evidenceId}            → Evidence entity
├── indicator:{indicatorId}:evidence:{evidenceId} → Link index
│
├── audit:{auditId}                  → Audit entry
└── org:{orgId}:audit:{auditId}      → Audit index by org
```

### Exemples de Requêtes

#### Lister tous les packs d'une organisation
```typescript
// Fichier: /supabase/functions/server/index.tsx (ligne 249-269)

const packKeys = await kv.getByPrefix(`org:${orgId}:pack:`);
// Retourne: ["org:abc-123:pack:pack-1", "org:abc-123:pack:pack-2"]

const packs = await Promise.all(
  packKeys.map(async (key) => {
    const packId = key.split(':').pop(); // Extraire "pack-1"
    const packData = await kv.get(`pack:${packId}`);
    return packData ? JSON.parse(packData) : null;
  })
);
```

#### Vérifier ownership multi-tenant
```typescript
// Fichier: /supabase/functions/server/index.tsx (ligne 325-346)

const packData = await kv.get(`pack:${packId}`);
const pack = JSON.parse(packData);

// Row-Level Security (RLS) en applicatif
if (pack.organizationId !== user.organizationId) {
  return c.json({ error: 'Forbidden: Cannot access packs from other organizations' }, 403);
}
```

---

## 🎭 Système de Permissions (RBAC)

### Roles Définis
```typescript
// Fichier: /src/permissions.ts (ligne 1-8)

export enum Role {
  ADMIN = 'ADMIN',
  CLIENT_OWNER = 'CLIENT_OWNER',         // Directeur ESG
  CLIENT_CONTRIBUTOR = 'CLIENT_CONTRIBUTOR', // Analyste données, Contrôleur
  CONSULTANT = 'CONSULTANT',             // Consultant ESG
  AUDITOR = 'AUDITOR',                   // Auditeur externe
  VIEWER = 'VIEWER',                     // Lecture seule
}
```

### Mapping Backend → Frontend
```typescript
// Fichier: /src/contexts/UserContext.tsx (ligne 108-118)

function mapRoleStringToEnum(roleString: string): Role {
  const mapping: Record<string, Role> = {
    'Directeur ESG': Role.CLIENT_OWNER,
    'Consultant ESG': Role.CONSULTANT,
    'Auditeur externe': Role.AUDITOR,
    'Analyste données': Role.CLIENT_CONTRIBUTOR,
    'Contrôleur interne': Role.CLIENT_CONTRIBUTOR,
    'Admin': Role.ADMIN,
  };
  return mapping[roleString] || Role.VIEWER;
}
```

### Backend Permission Check
```typescript
// Fichier: /supabase/functions/server/index.tsx (ligne 68-70)

const checkPermission = (userRole: string, requiredRoles: string[]) => {
  return requiredRoles.includes(userRole);
};

// Utilisation:
if (!checkPermission(user.role, ['Directeur ESG', 'Consultant ESG', 'Admin'])) {
  return c.json({ error: 'Forbidden: Insufficient permissions' }, 403);
}
```

### Frontend Permission Check
```typescript
// Fichier: /src/permissions.ts (ligne 64-140)

export function can(role: Role, action: Action): boolean {
  const permissions = rolePermissions[role] || [];
  return permissions.includes(action);
}

// Utilisation dans composant:
const canCreatePack = can(currentUserRole, Action.CREATE_PACK);

{canCreatePack && (
  <Button onClick={handleCreatePack}>Créer un pack</Button>
)}
```

---

## 🔄 Lifecycle Complet d'une Session

### 1. **App Start (Refresh de page)**
```
User opens app
     │
     ▼
UserContext mount
     │
     ├─→ localStorage.getItem('accessToken')
     │   └─→ Token trouvé?
     │       ├─→ OUI: GET /auth/session avec token
     │       │         ├─→ 200: User logged in ✅
     │       │         └─→ 401: Token expiré → Logout
     │       └─→ NON: Show AuthPage
     │
     ▼
{currentUser ? <AppContent /> : <AuthPage />}
```

### 2. **User Activity**
```
User interacts with app
     │
     ▼
Component calls API
     │
     ├─→ apiClient.request()
     │   ├─→ Add header: Authorization: Bearer {token}
     │   └─→ POST/GET/PUT/DELETE to backend
     │
     ▼
Backend receives request
     │
     ├─→ requireAuth middleware
     │   ├─→ Extract token from header
     │   ├─→ supabase.auth.getUser(token)
     │   ├─→ Valid? → Set c.userId → next()
     │   └─→ Invalid? → 401 Unauthorized
     │
     ├─→ Route handler
     │   ├─→ Load user: kv.get(`user:${userId}`)
     │   ├─→ Check permissions
     │   ├─→ Check multi-tenant isolation
     │   ├─→ Perform business logic
     │   ├─→ Write to KV Store
     │   └─→ Create audit trail
     │
     ▼
Response to frontend
     │
     ├─→ 200: Success → Update UI
     ├─→ 401: Token expired → Logout user
     ├─→ 403: Forbidden → Show error
     └─→ 500: Server error → Show error
```

### 3. **Token Expiration**
```
Token expires (default: 1 hour)
     │
     ▼
User makes next request
     │
     ├─→ Backend: requireAuth → getUser(token) → 401
     │
     ▼
Frontend catches error
     │
     ├─→ apiClient.request() throws
     │
     ▼
Error handler
     │
     ├─→ If 401 on protected route:
     │   └─→ Clear localStorage
     │       └─→ setCurrentUser(null)
     │           └─→ Redirect to AuthPage
     │
     ▼
User sees login page
```

---

## 📁 Fichiers Clés

### Frontend
```
/src
├── /services
│   └── api.ts                    ← API Client singleton
├── /contexts
│   └── UserContext.tsx           ← Global auth state
├── /app
│   ├── App.tsx                   ← Root component
│   ├── AppContent.tsx            ← Protected routes
│   └── /components
│       ├── AuthPage.tsx          ← Login/Signup UI
│       └── /views
│           ├── PackView.tsx      ← Pack management
│           └── IndicatorView.tsx ← Indicator management
├── permissions.ts                ← RBAC frontend
└── /utils/supabase
    └── info.tsx                  ← Supabase credentials
```

### Backend
```
/supabase/functions/server
├── index.tsx                     ← Main server (Hono routes)
└── kv_store.tsx                  ← KV Store abstraction (READ-ONLY)
```

---

## 🛠️ Variables d'Environnement

### Supabase Edge Function
```bash
# Automatiquement injectées par Supabase
SUPABASE_URL=https://onmxhxfntzjnxexpqfjs.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...  # Pour auth.getUser(), signInWithPassword()
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... # Pour auth.admin.createUser()
SUPABASE_DB_URL=postgresql://...
```

### Frontend (auto-generated)
```typescript
// /utils/supabase/info.tsx
export const projectId = "onmxhxfntzjnxexpqfjs"
export const publicAnonKey = "eyJhbGci..."
```

---

## 🧪 Testing & Development

### Seed Test Data
```javascript
// Dans la console du navigateur après login:
await seedTestData()

// Crée:
// - 3 packs
// - 5 folders par pack
// - 8 indicators par folder
// - 2 evidence par indicator
// - Audit trail entries
```

### Create New Account
```typescript
// Via UI AuthPage → Signup tab
Email: test@example.com
Password: password123
Name: Test User
Organization: Test Org
Role: Directeur ESG

// Backend crée automatiquement:
// 1. Supabase Auth user
// 2. KV user:{userId}
// 3. KV org:{orgId}
// 4. KV org:{orgId}:user:{userId}
```

---

## 🔐 Sécurité

### ✅ Implémenté
- JWT token validation sur toutes routes protégées
- Multi-tenant isolation (RLS applicatif)
- Role-Based Access Control (RBAC)
- Audit trail automatique
- Auto-confirm email (pas de serveur SMTP exposé)
- Token stocké en localStorage (pas de cookies)
- CORS ouvert (API publique)

### ⚠️ Limitations Actuelles
- Pas de refresh token (session expire après ~1h)
- Pas de rate limiting
- Pas de protection CSRF (pas de cookies)
- KV Store pas optimisé pour scale (pas d'index DB)
- Audit trail non queryable (pas de tri/filtre avancé)

---

## 📊 Performance Considerations

### KV Store Patterns
```typescript
// ✅ GOOD: Utiliser getByPrefix pour lister
const packs = await kv.getByPrefix(`org:${orgId}:pack:`);

// ❌ BAD: Ne pas scanner toutes les clés
// Il n'y a pas de kv.list() pour une raison
```

### Caching Strategy
```typescript
// Frontend: User data en localStorage pour éviter roundtrip
localStorage.setItem('solvid_current_user', JSON.stringify(user));

// Backend: Pas de cache (stateless)
// Chaque requête fait: token validation + KV load
```

---

## 🚀 Next Steps (Phase 4)

1. **Connecter vues aux vraies APIs**
   - Remplacer mock data par apiClient.getPack()
   - Ajouter loading states
   - Gérer erreurs réseau

2. **Evidence Vault avec Supabase Storage**
   - Créer bucket: `make-aa780fc8-evidence`
   - Upload fichiers → signedURL
   - Lier à indicators

3. **Exports PDF/ZIP**
   - Route backend: GET /packs/:id/export
   - Générer PDF avec données + preuves
   - Utiliser /tmp pour fichiers temporaires

4. **Améliorer session management**
   - Implémenter refresh token
   - Auto-refresh avant expiration
   - Meilleure UX sur token expiré

---

## 📚 Ressources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Hono Framework](https://hono.dev/)
- [JWT.io](https://jwt.io/) - Decoder tokens
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
