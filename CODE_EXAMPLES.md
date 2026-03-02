# 💻 Code Examples - Solvid.IA

Exemples de code concrets pour implémenter les fonctionnalités courantes.

---

## 🔐 Authentification

### Signup + Auto-login
```typescript
// Frontend: /src/app/components/AuthPage.tsx
const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    // Étape 1: Créer le compte
    await apiClient.signup({
      email: signupEmail,
      password: signupPassword,
      name: signupName,
      organizationName: signupOrgName,
      role: signupRole,
    });

    // Étape 2: Login automatique
    const response = await apiClient.login(signupEmail, signupPassword);
    
    // Étape 3: Notifier le parent (AppContent)
    onLogin(response.accessToken, response.user);
    
  } catch (err: any) {
    setError(err.message || "Échec de l'inscription");
  } finally {
    setLoading(false);
  }
};
```

### Login avec gestion d'erreur
```typescript
// Frontend
const handleLogin = async (email: string, password: string) => {
  try {
    const { accessToken, user } = await apiClient.login(email, password);
    
    // Mapper le rôle backend → enum frontend
    const mappedUser: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: mapRoleStringToEnum(user.role),
      organizationId: user.organizationId,
    };
    
    // Sauvegarder en contexte
    setCurrentUser(mappedUser);
    
    // Toast success
    toast.success(`Bienvenue ${user.name} !`);
    
  } catch (error: any) {
    // Gérer les erreurs spécifiques
    if (error.message.includes('Invalid login credentials')) {
      toast.error('Email ou mot de passe incorrect');
    } else if (error.message.includes('Email not confirmed')) {
      toast.error('Veuillez confirmer votre email');
    } else {
      toast.error('Erreur de connexion', { description: error.message });
    }
  }
};
```

### Check Session au démarrage
```typescript
// Frontend: /src/contexts/UserContext.tsx
useEffect(() => {
  const checkSession = async () => {
    try {
      const accessToken = apiClient.getAccessToken();
      
      if (!accessToken) {
        setLoading(false);
        return; // Pas de token → pas logged in
      }

      // Valider le token avec le backend
      const { user } = await apiClient.getSession();
      
      // User valid → restore session
      const mappedUser: User = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: mapRoleStringToEnum(user.role),
        organizationId: user.organizationId,
      };
      
      setCurrentUserState(mappedUser);
      
    } catch (error) {
      // Token expiré → silent logout
      console.log('Session expired, logging out');
      apiClient.setAccessToken(null);
      setCurrentUserState(null);
    } finally {
      setLoading(false);
    }
  };

  checkSession();
}, []);
```

### Logout
```typescript
// Frontend
const logout = async () => {
  try {
    await apiClient.logout();
  } catch (error) {
    console.error('Logout error:', error);
    // Continuer quand même
  } finally {
    setCurrentUser(null);
    apiClient.setAccessToken(null);
    toast.info('Vous êtes déconnecté');
  }
};
```

---

## 📦 CRUD Operations

### Créer un Pack
```typescript
// Frontend
const handleCreatePack = async () => {
  setLoading(true);
  
  try {
    const { pack } = await apiClient.createPack({
      name: packName,
      type: selectedTemplate, // 'PACK_DONNEUR_ORDRE'
      description: packDescription,
      status: 'draft'
    });
    
    toast.success('Pack créé avec succès !');
    
    // Naviguer vers le pack
    setCurrentView({ type: 'pack', packId: pack.id });
    
    // Ou rafraîchir la liste
    await refreshPackList();
    
  } catch (error: any) {
    toast.error('Erreur lors de la création', { 
      description: error.message 
    });
  } finally {
    setLoading(false);
  }
};
```

```typescript
// Backend: /supabase/functions/server/index.tsx
app.post("/make-server-aa780fc8/packs", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const user = await getUserFromKV(userId);
    const orgId = user.organizationId;

    // Vérifier permissions
    if (!checkPermission(user.role, ['Directeur ESG', 'Consultant ESG', 'Admin'])) {
      return c.json({ error: 'Forbidden: Insufficient permissions to create packs' }, 403);
    }

    const { name, type, description, status = 'draft' } = await c.req.json();

    // Valider les inputs
    if (!name || !type) {
      return c.json({ error: 'Name and type are required' }, 400);
    }

    // Créer le pack
    const packId = generateId();
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

    // Sauvegarder
    await kv.set(`pack:${packId}`, JSON.stringify(pack));
    await kv.set(`org:${orgId}:pack:${packId}`, 'true');

    // Audit trail
    const auditId = generateId();
    await kv.set(`audit:${auditId}`, JSON.stringify({
      id: auditId,
      userId,
      action: 'pack_created',
      entityType: 'pack',
      entityId: packId,
      timestamp: new Date().toISOString(),
      details: { packName: name, packType: type }
    }));
    await kv.set(`org:${orgId}:audit:${auditId}`, 'true');

    return c.json({ pack }, 201);

  } catch (error) {
    console.error('Create pack error:', error);
    return c.json({ error: `Failed to create pack: ${error.message}` }, 500);
  }
});
```

### Lister les Packs (avec loading)
```typescript
// Frontend
const PackList = () => {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPacks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { packs } = await apiClient.listPacks();
        setPacks(packs);
        
      } catch (err: any) {
        setError(err.message);
        toast.error('Impossible de charger les packs');
      } finally {
        setLoading(false);
      }
    };

    loadPacks();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        <p>Erreur: {error}</p>
        <Button onClick={() => window.location.reload()}>Réessayer</Button>
      </div>
    );
  }

  if (packs.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        <p>Aucun pack trouvé</p>
        <Button onClick={handleCreatePack}>Créer mon premier pack</Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {packs.map(pack => (
        <PackCard key={pack.id} pack={pack} />
      ))}
    </div>
  );
};
```

### Mettre à jour un Pack
```typescript
// Frontend
const handleUpdatePack = async (packId: string, updates: Partial<Pack>) => {
  try {
    const { pack } = await apiClient.updatePack(packId, updates);
    
    // Mettre à jour l'état local
    setPack(pack);
    
    toast.success('Pack mis à jour');
    
  } catch (error: any) {
    toast.error('Erreur lors de la mise à jour', { 
      description: error.message 
    });
  }
};

// Exemple: Changer le statut
await handleUpdatePack(packId, { status: 'READY_FOR_REVIEW' });

// Exemple: Modifier plusieurs champs
await handleUpdatePack(packId, {
  name: 'Nouveau nom',
  description: 'Nouvelle description',
  status: 'IN_PROGRESS'
});
```

### Supprimer un Pack (avec confirmation)
```typescript
// Frontend
const handleDeletePack = async (packId: string) => {
  // Confirmation
  const confirmed = window.confirm(
    'Êtes-vous sûr de vouloir supprimer ce pack ? Cette action est irréversible.'
  );
  
  if (!confirmed) return;

  try {
    await apiClient.deletePack(packId);
    
    toast.success('Pack supprimé');
    
    // Retirer de la liste locale
    setPacks(packs.filter(p => p.id !== packId));
    
    // Ou rediriger
    navigate('/dashboard');
    
  } catch (error: any) {
    if (error.message.includes('Forbidden')) {
      toast.error('Vous n\'avez pas les permissions pour supprimer ce pack');
    } else {
      toast.error('Erreur lors de la suppression', { 
        description: error.message 
      });
    }
  }
};
```

---

## 🔍 Charger des Données Imbriquées

### Charger Pack + Folders + Indicators
```typescript
// Frontend
interface FullPack extends Pack {
  folders: Folder[];
  indicators: Indicator[];
}

const loadFullPack = async (packId: string): Promise<FullPack> => {
  // Étape 1: Charger le pack
  const { pack } = await apiClient.getPack(packId);
  
  // Étape 2: Charger les folders
  const { folders } = await apiClient.listFolders(packId);
  
  // Étape 3: Charger les indicators pour chaque folder
  const foldersWithIndicators = await Promise.all(
    folders.map(async (folder) => {
      const { indicators } = await apiClient.listIndicators(folder.id);
      return {
        ...folder,
        indicators
      };
    })
  );
  
  // Étape 4: Aplatir les indicators
  const allIndicators = foldersWithIndicators.flatMap(f => f.indicators);
  
  return {
    ...pack,
    folders: foldersWithIndicators,
    indicators: allIndicators
  };
};

// Utilisation
const [fullPack, setFullPack] = useState<FullPack | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const load = async () => {
    try {
      const data = await loadFullPack(packId);
      setFullPack(data);
    } catch (error) {
      console.error('Failed to load pack:', error);
    } finally {
      setLoading(false);
    }
  };
  load();
}, [packId]);
```

### Backend: Route Optimisée pour Charger Tout
```typescript
// Backend
app.get("/make-server-aa780fc8/packs/:id/full", requireAuth, async (c) => {
  try {
    const packId = c.req.param('id');
    const userId = c.get('userId');
    const user = await getUserFromKV(userId);

    // Charger pack
    const packData = await kv.get(`pack:${packId}`);
    if (!packData) {
      return c.json({ error: 'Pack not found' }, 404);
    }

    const pack = JSON.parse(packData);
    
    // Vérifier ownership
    if (pack.organizationId !== user.organizationId) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Charger folders
    const folderKeys = await kv.getByPrefix(`pack:${packId}:folder:`);
    const folders = await Promise.all(
      folderKeys.map(async (key) => {
        const folderId = key.split(':').pop();
        const folderData = await kv.get(`folder:${folderId}`);
        return folderData ? JSON.parse(folderData) : null;
      })
    );

    // Charger indicators
    const indicatorPromises = folders.filter(Boolean).map(async (folder) => {
      const indicatorKeys = await kv.getByPrefix(`folder:${folder.id}:indicator:`);
      const indicators = await Promise.all(
        indicatorKeys.map(async (key) => {
          const indicatorId = key.split(':').pop();
          const indicatorData = await kv.get(`indicator:${indicatorId}`);
          return indicatorData ? JSON.parse(indicatorData) : null;
        })
      );
      return { folderId: folder.id, indicators: indicators.filter(Boolean) };
    });
    
    const indicatorsByFolder = await Promise.all(indicatorPromises);

    return c.json({
      pack: {
        ...pack,
        folders: folders.filter(Boolean).map(folder => ({
          ...folder,
          indicators: indicatorsByFolder.find(i => i.folderId === folder.id)?.indicators || []
        }))
      }
    });

  } catch (error) {
    console.error('Get full pack error:', error);
    return c.json({ error: `Failed to get pack: ${error.message}` }, 500);
  }
});
```

---

## 🔒 Gestion des Permissions

### Frontend: Cacher des boutons selon le rôle
```typescript
import { can, Action, Role } from '@/permissions';
import { useUser } from '@/contexts/UserContext';

const PackActions = ({ pack }: { pack: Pack }) => {
  const { currentUser } = useUser();
  
  const canEdit = can(currentUser.role, Action.EDIT_PACK);
  const canDelete = can(currentUser.role, Action.DELETE_PACK);
  const canSubmit = can(currentUser.role, Action.MARK_READY_FOR_REVIEW);

  return (
    <div className="flex gap-2">
      {canEdit && (
        <Button onClick={handleEdit}>
          <Edit className="size-4 mr-2" />
          Modifier
        </Button>
      )}
      
      {canSubmit && pack.status === 'IN_PROGRESS' && (
        <Button onClick={handleSubmit}>
          <Send className="size-4 mr-2" />
          Soumettre pour revue
        </Button>
      )}
      
      {canDelete && (
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="size-4 mr-2" />
          Supprimer
        </Button>
      )}
    </div>
  );
};
```

### Backend: Vérifier les permissions
```typescript
// Backend
const requireRole = (allowedRoles: string[]) => {
  return async (c: any, next: any) => {
    const userId = c.get('userId');
    const user = await getUserFromKV(userId);
    
    if (!checkPermission(user.role, allowedRoles)) {
      return c.json({ 
        error: `Forbidden: This action requires one of: ${allowedRoles.join(', ')}` 
      }, 403);
    }
    
    await next();
  };
};

// Utilisation
app.delete(
  "/make-server-aa780fc8/packs/:id", 
  requireAuth, 
  requireRole(['Directeur ESG', 'Admin']),
  async (c) => {
    // Handler
  }
);
```

---

## 📊 Audit Trail

### Créer des entrées d'audit
```typescript
// Backend helper
const createAuditEntry = async (
  userId: string,
  organizationId: string,
  action: string,
  entityType: string,
  entityId: string,
  details: any
) => {
  const auditId = generateId();
  const auditEntry = {
    id: auditId,
    userId,
    action,
    entityType,
    entityId,
    timestamp: new Date().toISOString(),
    details
  };
  
  await kv.set(`audit:${auditId}`, JSON.stringify(auditEntry));
  await kv.set(`org:${organizationId}:audit:${auditId}`, 'true');
  
  return auditEntry;
};

// Utilisation dans une route
app.put("/make-server-aa780fc8/indicators/:id", requireAuth, async (c) => {
  const indicatorId = c.req.param('id');
  const userId = c.get('userId');
  const user = await getUserFromKV(userId);
  const updates = await c.req.json();

  // Update indicator...
  const updatedIndicator = { ...indicator, ...updates };
  await kv.set(`indicator:${indicatorId}`, JSON.stringify(updatedIndicator));

  // Audit trail
  await createAuditEntry(
    userId,
    user.organizationId,
    'indicator_updated',
    'indicator',
    indicatorId,
    { 
      oldValue: indicator.value,
      newValue: updates.value,
      changes: Object.keys(updates)
    }
  );

  return c.json({ indicator: updatedIndicator });
});
```

### Afficher l'audit trail
```typescript
// Frontend
const AuditTrail = () => {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAudit = async () => {
      try {
        const { auditTrail } = await apiClient.getAuditTrail();
        setAuditEntries(auditTrail);
      } catch (error) {
        toast.error('Impossible de charger l\'audit trail');
      } finally {
        setLoading(false);
      }
    };
    loadAudit();
  }, []);

  return (
    <div className="space-y-2">
      {auditEntries.map(entry => (
        <Card key={entry.id}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="font-medium">{entry.action}</p>
                <p className="text-sm text-gray-600">
                  {entry.entityType} • {new Date(entry.timestamp).toLocaleString('fr-FR')}
                </p>
              </div>
              <Badge>{entry.details?.status || 'completed'}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
```

---

## 🔄 Optimistic Updates

### Update avec rollback
```typescript
// Frontend
const handleUpdateIndicator = async (indicatorId: string, newValue: number) => {
  // Sauvegarder l'ancienne valeur
  const oldIndicator = { ...indicator };
  
  // Update optimiste (UI instantanée)
  setIndicator({ ...indicator, value: newValue });
  
  try {
    // Envoyer au backend
    const { indicator: updated } = await apiClient.updateIndicator(indicatorId, { 
      value: newValue 
    });
    
    // Confirmation backend
    setIndicator(updated);
    toast.success('Indicateur mis à jour');
    
  } catch (error) {
    // Rollback en cas d'erreur
    setIndicator(oldIndicator);
    toast.error('Erreur lors de la mise à jour', { 
      description: error.message 
    });
  }
};
```

---

## 🔍 Recherche et Filtres

### Recherche côté frontend (petit dataset)
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [packs, setPacks] = useState<Pack[]>([]);

const filteredPacks = useMemo(() => {
  if (!searchQuery) return packs;
  
  const query = searchQuery.toLowerCase();
  return packs.filter(pack => 
    pack.name.toLowerCase().includes(query) ||
    pack.description?.toLowerCase().includes(query) ||
    pack.type.toLowerCase().includes(query)
  );
}, [packs, searchQuery]);

return (
  <>
    <Input
      placeholder="Rechercher un pack..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
    
    {filteredPacks.map(pack => (
      <PackCard key={pack.id} pack={pack} />
    ))}
  </>
);
```

### Recherche côté backend (grand dataset)
```typescript
// Backend
app.get("/make-server-aa780fc8/packs/search", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const user = await getUserFromKV(userId);
    const query = c.req.query('q')?.toLowerCase() || '';

    // Charger tous les packs de l'org
    const packKeys = await kv.getByPrefix(`org:${user.organizationId}:pack:`);
    const packs = await Promise.all(
      packKeys.map(async (key) => {
        const packId = key.split(':').pop();
        const packData = await kv.get(`pack:${packId}`);
        return packData ? JSON.parse(packData) : null;
      })
    );

    // Filtrer côté serveur
    const filtered = packs.filter(Boolean).filter(pack => 
      pack.name.toLowerCase().includes(query) ||
      pack.description?.toLowerCase().includes(query) ||
      pack.type.toLowerCase().includes(query)
    );

    return c.json({ packs: filtered });

  } catch (error) {
    console.error('Search packs error:', error);
    return c.json({ error: `Search failed: ${error.message}` }, 500);
  }
});
```

---

## ⚡ Performance Optimizations

### Debounced Search
```typescript
import { useMemo, useState, useEffect } from 'react';

const useDebounce = (value: string, delay: number = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Utilisation
const SearchPacks = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (debouncedQuery) {
      searchPacks(debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <Input
      placeholder="Rechercher..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
  );
};
```

### Pagination
```typescript
// Backend
app.get("/make-server-aa780fc8/packs", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const user = await getUserFromKV(userId);
    
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;

    const packKeys = await kv.getByPrefix(`org:${user.organizationId}:pack:`);
    const allPacks = await Promise.all(
      packKeys.map(async (key) => {
        const packId = key.split(':').pop();
        const packData = await kv.get(`pack:${packId}`);
        return packData ? JSON.parse(packData) : null;
      })
    );

    const packs = allPacks.filter(Boolean);
    const total = packs.length;
    const paginated = packs.slice(offset, offset + limit);

    return c.json({
      packs: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('List packs error:', error);
    return c.json({ error: `Failed to list packs: ${error.message}` }, 500);
  }
});
```

---

## 🧪 Testing Examples

### Test API avec Jest
```typescript
// __tests__/api.test.ts
import { apiClient } from '@/services/api';

describe('API Client', () => {
  beforeEach(() => {
    // Reset token
    apiClient.setAccessToken(null);
  });

  it('should login successfully', async () => {
    const response = await apiClient.login('test@example.com', 'password123');
    
    expect(response.accessToken).toBeDefined();
    expect(response.user.email).toBe('test@example.com');
  });

  it('should fail login with wrong password', async () => {
    await expect(
      apiClient.login('test@example.com', 'wrongpassword')
    ).rejects.toThrow('Invalid login credentials');
  });

  it('should require auth for protected routes', async () => {
    await expect(
      apiClient.listPacks()
    ).rejects.toThrow('Unauthorized');
  });
});
```

### Mock API pour développement
```typescript
// src/services/mockApi.ts
export const mockApiClient = {
  login: async (email: string, password: string) => {
    await delay(500); // Simuler latence réseau
    
    if (password !== 'password123') {
      throw new Error('Invalid credentials');
    }
    
    return {
      accessToken: 'mock-token-' + Date.now(),
      user: {
        id: 'mock-user-id',
        email,
        name: 'Mock User',
        role: 'Directeur ESG',
        organizationId: 'mock-org-id'
      }
    };
  },
  
  listPacks: async () => {
    await delay(300);
    return {
      packs: [
        { id: '1', name: 'Pack Mock 1', type: 'PACK_DONNEUR_ORDRE', status: 'draft' },
        { id: '2', name: 'Pack Mock 2', type: 'PACK_QUESTIONNAIRE', status: 'IN_PROGRESS' },
      ]
    };
  }
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
```

---

## 🎯 Bonus: Seed Data Function

```typescript
// Frontend: Fonction pour créer des données de test
window.seedTestData = async function() {
  console.log('🌱 Seeding test data...');
  
  try {
    const { apiClient } = await import('@/services/api');
    
    // Créer 3 packs
    const packs = [];
    for (let i = 1; i <= 3; i++) {
      const { pack } = await apiClient.createPack({
        name: `Pack Test ${i}`,
        type: ['PACK_DONNEUR_ORDRE', 'PACK_QUESTIONNAIRE', 'PACK_BANQUE'][i - 1],
        description: `Description du pack test ${i}`,
        status: ['draft', 'IN_PROGRESS', 'READY_FOR_REVIEW'][i - 1]
      });
      packs.push(pack);
      console.log(`✅ Created pack: ${pack.name}`);
    }
    
    // Créer folders pour chaque pack
    for (const pack of packs) {
      for (let i = 1; i <= 5; i++) {
        const { folder } = await apiClient.createFolder({
          packId: pack.id,
          name: `Folder ${i}`,
          category: ['Environmental', 'Social', 'Governance'][i % 3]
        });
        
        // Créer indicators pour chaque folder
        for (let j = 1; j <= 8; j++) {
          await apiClient.createIndicator({
            folderId: folder.id,
            code: `E${i}-${j}`,
            name: `Indicator ${i}.${j}`,
            unit: 'tCO2e',
            value: Math.random() * 1000,
            status: ['draft', 'COMPUTED', 'ACCEPTED'][j % 3],
            source: 'Test data',
            methodology: 'Seed function'
          });
        }
      }
    }
    
    console.log('🎉 Test data created successfully!');
    console.log('📊 Created:', {
      packs: packs.length,
      folders: packs.length * 5,
      indicators: packs.length * 5 * 8
    });
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
  }
};

// Utilisation:
// Dans la console: await seedTestData()
```

---

**💡 Ces exemples couvrent 90% des cas d'usage de Solvid.IA !**
