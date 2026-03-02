# 🧪 Tests API Backend Supabase

## Test 1 : Health Check (Public)

**Endpoint** : `GET /make-server-aa780fc8/health`

**Résultat attendu** :
```json
{
  "status": "ok",
  "timestamp": "2024-01-30T12:00:00.000Z"
}
```

**Test dans la console** :
```javascript
fetch(`https://${projectId}.supabase.co/functions/v1/make-server-aa780fc8/health`)
  .then(r => r.json())
  .then(data => console.log('Health check:', data));
```

---

## Test 2 : Signup

**Endpoint** : `POST /make-server-aa780fc8/auth/signup`

**Body** :
```json
{
  "email": "test@example.com",
  "password": "password123",
  "name": "Test User",
  "organizationName": "Test Org",
  "role": "Directeur ESG"
}
```

**Résultat attendu** :
```json
{
  "message": "User created successfully",
  "userId": "uuid...",
  "organizationId": "uuid..."
}
```

**Test dans la console** :
```javascript
fetch(`https://${projectId}.supabase.co/functions/v1/make-server-aa780fc8/auth/signup`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + publicAnonKey },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    organizationName: 'Test Org',
    role: 'Directeur ESG'
  })
})
  .then(r => r.json())
  .then(data => console.log('Signup:', data));
```

---

## Test 3 : Login

**Endpoint** : `POST /make-server-aa780fc8/auth/login`

**Body** :
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Résultat attendu** :
```json
{
  "accessToken": "eyJ...",
  "user": {
    "id": "uuid...",
    "email": "test@example.com",
    "name": "Test User",
    "role": "Directeur ESG",
    "organizationId": "uuid..."
  }
}
```

**Test dans la console** :
```javascript
fetch(`https://${projectId}.supabase.co/functions/v1/make-server-aa780fc8/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + publicAnonKey },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  })
})
  .then(r => r.json())
  .then(data => {
    console.log('Login:', data);
    // Sauvegarder le token pour les tests suivants
    window.testToken = data.accessToken;
  });
```

---

## Test 4 : Create Pack (Protected)

**Endpoint** : `POST /make-server-aa780fc8/packs`

**Headers** :
```
Authorization: Bearer {accessToken}
```

**Body** :
```json
{
  "name": "Pack Test API",
  "type": "donneur-ordre",
  "description": "Test via API",
  "status": "draft"
}
```

**Résultat attendu** :
```json
{
  "pack": {
    "id": "uuid...",
    "organizationId": "uuid...",
    "name": "Pack Test API",
    "type": "donneur-ordre",
    "description": "Test via API",
    "status": "draft",
    "createdBy": "user-id",
    "createdAt": "2024-01-30T...",
    "updatedAt": "2024-01-30T..."
  }
}
```

**Test dans la console (après login)** :
```javascript
fetch(`https://${projectId}.supabase.co/functions/v1/make-server-aa780fc8/packs`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + window.testToken
  },
  body: JSON.stringify({
    name: 'Pack Test API',
    type: 'donneur-ordre',
    description: 'Test via API',
    status: 'draft'
  })
})
  .then(r => r.json())
  .then(data => {
    console.log('Pack created:', data);
    window.testPackId = data.pack.id;
  });
```

---

## Test 5 : List Packs (Protected)

**Endpoint** : `GET /make-server-aa780fc8/packs`

**Résultat attendu** :
```json
{
  "packs": [
    {
      "id": "uuid...",
      "name": "Pack Test API",
      "type": "donneur-ordre",
      ...
    }
  ]
}
```

**Test dans la console** :
```javascript
fetch(`https://${projectId}.supabase.co/functions/v1/make-server-aa780fc8/packs`, {
  headers: { 'Authorization': 'Bearer ' + window.testToken }
})
  .then(r => r.json())
  .then(data => console.log('Packs:', data));
```

---

## Test 6 : Create Folder (Protected)

**Endpoint** : `POST /make-server-aa780fc8/folders`

**Body** :
```json
{
  "packId": "{testPackId}",
  "name": "Test Folder",
  "category": "Environnement"
}
```

**Test dans la console** :
```javascript
fetch(`https://${projectId}.supabase.co/functions/v1/make-server-aa780fc8/folders`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + window.testToken
  },
  body: JSON.stringify({
    packId: window.testPackId,
    name: 'Test Folder',
    category: 'Environnement'
  })
})
  .then(r => r.json())
  .then(data => {
    console.log('Folder created:', data);
    window.testFolderId = data.folder.id;
  });
```

---

## Test 7 : Create Indicator (Protected)

**Endpoint** : `POST /make-server-aa780fc8/indicators`

**Body** :
```json
{
  "folderId": "{testFolderId}",
  "code": "TEST-001",
  "name": "Test Indicator",
  "unit": "kWh",
  "value": 1234.5,
  "status": "draft",
  "source": "API Test",
  "methodology": "Direct measurement"
}
```

**Test dans la console** :
```javascript
fetch(`https://${projectId}.supabase.co/functions/v1/make-server-aa780fc8/indicators`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + window.testToken
  },
  body: JSON.stringify({
    folderId: window.testFolderId,
    code: 'TEST-001',
    name: 'Test Indicator',
    unit: 'kWh',
    value: 1234.5,
    status: 'draft',
    source: 'API Test',
    methodology: 'Direct measurement'
  })
})
  .then(r => r.json())
  .then(data => console.log('Indicator created:', data));
```

---

## Test 8 : Get Audit Trail (Protected - Specific Roles)

**Endpoint** : `GET /make-server-aa780fc8/audit-trail`

**Résultat attendu** :
```json
{
  "auditTrail": [
    {
      "id": "uuid...",
      "userId": "user-id",
      "action": "indicator_created",
      "entityType": "indicator",
      "entityId": "indicator-id",
      "timestamp": "2024-01-30T...",
      "details": { "indicatorCode": "TEST-001", ... }
    },
    ...
  ]
}
```

**Test dans la console** :
```javascript
fetch(`https://${projectId}.supabase.co/functions/v1/make-server-aa780fc8/audit-trail`, {
  headers: { 'Authorization': 'Bearer ' + window.testToken }
})
  .then(r => r.json())
  .then(data => console.log('Audit trail:', data));
```

---

## Test 9 : Unauthorized (No Token)

**Test** : Essayer d'accéder à une route protégée sans token

**Résultat attendu** : `401 Unauthorized`

```javascript
fetch(`https://${projectId}.supabase.co/functions/v1/make-server-aa780fc8/packs`)
  .then(r => r.json())
  .then(data => console.log('Should be 401:', data))
  .catch(err => console.error('Error:', err));
```

---

## Test 10 : RBAC Forbidden (Wrong Role)

**Scénario** : Créer un utilisateur avec rôle "Auditeur externe", puis tenter de créer un pack

**Résultat attendu** : `403 Forbidden`

1. Créer compte Auditeur :
```javascript
// Signup comme auditeur
fetch(`https://${projectId}.supabase.co/functions/v1/make-server-aa780fc8/auth/signup`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + publicAnonKey },
  body: JSON.stringify({
    email: 'auditor@test.com',
    password: 'password123',
    name: 'Test Auditor',
    organizationName: 'Audit Firm',
    role: 'Auditeur externe'
  })
})
  .then(r => r.json())
  .then(async (data) => {
    // Login
    const loginRes = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-aa780fc8/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + publicAnonKey },
      body: JSON.stringify({ email: 'auditor@test.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    window.auditorToken = loginData.accessToken;

    // Try to create pack (should fail)
    const packRes = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-aa780fc8/packs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + window.auditorToken
      },
      body: JSON.stringify({ name: 'Forbidden Pack', type: 'test', status: 'draft' })
    });
    const packData = await packRes.json();
    console.log('Should be 403:', packData);
  });
```

---

## ✅ Checklist des tests

- [ ] Test 1 : Health check → 200 OK
- [ ] Test 2 : Signup → 201 Created
- [ ] Test 3 : Login → 200 OK + accessToken
- [ ] Test 4 : Create Pack → 201 Created
- [ ] Test 5 : List Packs → 200 OK + array
- [ ] Test 6 : Create Folder → 201 Created
- [ ] Test 7 : Create Indicator → 201 Created
- [ ] Test 8 : Audit Trail → 200 OK + array (si rôle autorisé)
- [ ] Test 9 : No Token → 401 Unauthorized
- [ ] Test 10 : Wrong Role → 403 Forbidden

---

## 🎯 Test complet avec apiClient

```javascript
// Dans la console après login
const { apiClient } = await import('./services/api');

// Test santé
await apiClient.healthCheck();

// Créer un pack
const { pack } = await apiClient.createPack({
  name: 'Mon pack test',
  type: 'questionnaire',
  description: 'Test complet',
  status: 'draft'
});
console.log('Pack créé:', pack);

// Lister les packs
const { packs } = await apiClient.listPacks();
console.log('Packs:', packs);

// Créer un folder
const { folder } = await apiClient.createFolder({
  packId: pack.id,
  name: 'Environnement',
  category: 'Environnement'
});
console.log('Folder créé:', folder);

// Créer un indicateur
const { indicator } = await apiClient.createIndicator({
  folderId: folder.id,
  code: 'ENV-001',
  name: 'Consommation énergie',
  unit: 'kWh',
  value: 5000,
  status: 'draft',
  source: 'Facture EDF',
  methodology: 'Relevé mensuel'
});
console.log('Indicator créé:', indicator);

// Audit trail
const { auditTrail } = await apiClient.getAuditTrail();
console.log('Audit trail:', auditTrail);
```

---

Tous les tests doivent passer pour confirmer que le backend fonctionne correctement ! ✅
