# Guide de Migration vers React Query - Solvid.IA

## 📚 Table des matières
1. [Patterns de migration](#patterns-de-migration)
2. [Hooks disponibles](#hooks-disponibles)
3. [Exemples pratiques](#exemples-pratiques)
4. [Best practices](#best-practices)

---

## Patterns de migration

### ❌ AVANT : Appels API manuels

```typescript
import { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';

function MyComponent({ packId }: Props) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [packId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getPackFullDirect(packId);
      setData(response.pack);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (updates) => {
    try {
      await apiClient.updatePack(packId, updates);
      loadData(); // Reload data
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <Loader />;
  if (error) return <Error message={error} />;
  if (!data) return null;

  return <div>{/* Render data */}</div>;
}
```

### ✅ APRÈS : React Query

```typescript
import { usePackFull, useUpdatePack } from '@/hooks/usePack';

function MyComponent({ packId }: Props) {
  const { 
    data: pack, 
    isLoading, 
    isError, 
    error 
  } = usePackFull(packId);

  const updateMutation = useUpdatePack();

  const handleUpdate = (updates) => {
    updateMutation.mutate({ id: packId, data: updates });
    // Optimistic update + auto refetch après succès
  };

  if (isLoading) return <Loader />;
  if (isError) return <Error message={error?.message} />;
  if (!pack) return null;

  return <div>{/* Render pack */}</div>;
}
```

**Bénéfices :**
- ✅ -20 lignes de code boilerplate
- ✅ Cache automatique (pas de refetch inutile)
- ✅ Optimistic updates avec rollback
- ✅ Error handling standardisé
- ✅ Loading states cohérents

---

## Hooks disponibles

### 1. Packs (`/src/hooks/usePack.ts`)

#### `usePacks()` - Liste de tous les packs
```typescript
import { usePacks } from '@/hooks/usePack';

function PacksList() {
  const { data: packs, isLoading, error } = usePacks();
  
  // packs est automatiquement typé
  // Cache : 2 minutes
  // Refetch : automatique sur window focus
}
```

#### `usePackFull(packId)` - Pack complet
```typescript
import { usePackFull } from '@/hooks/usePack';

function PackDetail({ packId }: { packId: string }) {
  const { data: pack, isLoading, refetch } = usePackFull(packId);
  
  // Inclut : folders, indicators, evidence
  // Cache : 3 minutes
  // Refetch : manuel ou après mutations
}
```

#### `useCreatePack()` - Créer un pack
```typescript
import { useCreatePack } from '@/hooks/usePack';

function CreatePackForm() {
  const createMutation = useCreatePack();
  
  const handleSubmit = (formData) => {
    createMutation.mutate({
      name: formData.name,
      type: formData.type,
      description: formData.description,
    }, {
      onSuccess: (data) => {
        // Redirection automatique
        navigate(`/pack/${data.pack.id}`);
      }
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {createMutation.isPending && <Spinner />}
      {createMutation.isError && <Error message={createMutation.error.message} />}
    </form>
  );
}
```

#### `useUpdatePack()` - Mettre à jour un pack
```typescript
import { useUpdatePack } from '@/hooks/usePack';

function PackEditor({ packId }: { packId: string }) {
  const updateMutation = useUpdatePack();
  
  const handleSave = (updates) => {
    updateMutation.mutate({
      id: packId,
      data: updates,
    });
    // Optimistic update automatique
    // Rollback si erreur
  };
}
```

#### `useDeletePack()` - Supprimer un pack
```typescript
import { useDeletePack } from '@/hooks/usePack';

function DeletePackButton({ packId }: { packId: string }) {
  const deleteMutation = useDeletePack();
  
  const handleDelete = () => {
    if (confirm('Êtes-vous sûr ?')) {
      deleteMutation.mutate(packId, {
        onSuccess: () => {
          navigate('/packs');
        }
      });
    }
  };
}
```

---

### 2. Indicateurs (`/src/hooks/useIndicatorUpdates.ts`)

#### Mise à jour de statut
```typescript
import { useIndicatorUpdates } from '@/hooks/useIndicatorUpdates';

function IndicatorCard({ indicator }: { indicator: Indicator }) {
  const {
    markAsProvided,
    markAsMissing,
    markAsNeedsReview,
    isUpdating,
  } = useIndicatorUpdates({
    onSuccess: () => {
      // Callback optionnel après succès
    }
  });
  
  return (
    <div>
      <Button 
        onClick={() => markAsProvided(indicator.id)}
        disabled={isUpdating(indicator.id)}
      >
        {isUpdating(indicator.id) ? <Spinner /> : 'Marquer comme fourni'}
      </Button>
    </div>
  );
}
```

#### Mise à jour de commentaire (debounced)
```typescript
import { useIndicatorUpdates } from '@/hooks/useIndicatorUpdates';

function CommentEditor({ indicator }: { indicator: Indicator }) {
  const [comment, setComment] = useState(indicator.comment);
  const { updateComment, updateCommentImmediate } = useIndicatorUpdates();
  
  return (
    <textarea
      value={comment}
      onChange={(e) => {
        setComment(e.target.value);
        // Auto-save après 1 seconde d'inactivité
        updateComment(indicator.id, e.target.value);
      }}
      onBlur={() => {
        // Save immédiatement au blur
        updateCommentImmediate(indicator.id, comment);
      }}
    />
  );
}
```

#### Mise à jour de valeur
```typescript
import { useIndicatorUpdates } from '@/hooks/useIndicatorUpdates';

function ValueInput({ indicator }: { indicator: Indicator }) {
  const { updateValue, isUpdating } = useIndicatorUpdates();
  
  const handleValueChange = (newValue: number) => {
    updateValue(indicator.id, newValue);
  };
}
```

---

### 3. Evidences (`/src/hooks/useEvidence.ts`)

#### Upload d'evidence
```typescript
import { useUploadEvidence } from '@/hooks/useEvidence';

function UploadForm({ packId, indicatorId }: Props) {
  const uploadMutation = useUploadEvidence();
  
  const handleFileSelect = (file: File) => {
    uploadMutation.mutate({
      packId,
      indicatorId,
      file,
    }, {
      onSuccess: (data) => {
        toast.success('Preuve uploadée');
        // Cache pack invalidé automatiquement
      }
    });
  };
  
  return (
    <input
      type="file"
      onChange={(e) => handleFileSelect(e.target.files[0])}
      disabled={uploadMutation.isPending}
    />
  );
}
```

#### Téléchargement d'evidence
```typescript
import { useDownloadEvidence } from '@/hooks/useEvidence';

function EvidenceCard({ evidence }: { evidence: Evidence }) {
  const downloadMutation = useDownloadEvidence();
  
  const handleDownload = () => {
    downloadMutation.mutate(evidence.id);
    // Ouvre automatiquement dans nouvel onglet
  };
  
  return (
    <Button 
      onClick={handleDownload}
      disabled={downloadMutation.isPending}
    >
      <Download className="size-4" />
      Télécharger
    </Button>
  );
}
```

#### Suppression d'evidence
```typescript
import { useDeleteEvidence } from '@/hooks/useEvidence';

function DeleteButton({ evidence, packId }: Props) {
  const deleteMutation = useDeleteEvidence();
  
  const handleDelete = () => {
    if (confirm('Êtes-vous sûr ?')) {
      deleteMutation.mutate({
        evidenceId: evidence.id,
        packId,
      });
      // Optimistic update : disparaît immédiatement de l'UI
    }
  };
}
```

#### Extraction des evidences depuis pack
```typescript
import { usePackFull } from '@/hooks/usePack';
import { usePackEvidences } from '@/hooks/useEvidence';

function EvidenceList({ packId }: { packId: string }) {
  const { data: pack } = usePackFull(packId);
  const evidences = usePackEvidences(packId, pack);
  
  // evidences est un tableau typé avec toutes les preuves du pack
  return (
    <div>
      {evidences.map(ev => (
        <EvidenceCard key={ev.id} evidence={ev} />
      ))}
    </div>
  );
}
```

---

## Exemples pratiques

### Exemple 1 : Dashboard avec liste de packs

```typescript
import { usePacks } from '@/hooks/usePack';

function Dashboard() {
  const { data: packs = [], isLoading } = usePacks();
  
  if (isLoading) return <Skeleton count={5} />;
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {packs.map(pack => (
        <PackCard key={pack.id} pack={pack} />
      ))}
    </div>
  );
}
```

**Cache behavior :**
- Premier appel : Fetch API
- Appels suivants (< 2 min) : Lecture du cache (0ms)
- Refetch en arrière-plan si fenêtre refocused

---

### Exemple 2 : Détail pack avec mutations

```typescript
import { usePackFull, useUpdatePack } from '@/hooks/usePack';
import { useIndicatorUpdates } from '@/hooks/useIndicatorUpdates';

function PackView({ packId }: { packId: string }) {
  const { data: pack, isLoading } = usePackFull(packId);
  const updatePack = useUpdatePack();
  const { markAsProvided } = useIndicatorUpdates();
  
  const handleStatusChange = (newStatus: string) => {
    updatePack.mutate({
      id: packId,
      data: { status: newStatus },
    });
    // UI met à jour instantanément (optimistic)
    // Rollback si erreur backend
  };
  
  const handleIndicatorProvided = (indicatorId: string) => {
    markAsProvided(indicatorId);
    // Toast de succès automatique
    // Pack refetch automatiquement
  };
  
  if (isLoading) return <Loader />;
  
  return (
    <div>
      <PackHeader pack={pack} onStatusChange={handleStatusChange} />
      <IndicatorsList 
        indicators={pack.indicators}
        onMarkProvided={handleIndicatorProvided}
      />
    </div>
  );
}
```

---

### Exemple 3 : Evidence Vault avec CRUD

```typescript
import { usePackFull } from '@/hooks/usePack';
import { usePackEvidences, useDeleteEvidence, useDownloadEvidence } from '@/hooks/useEvidence';

function EvidenceVault({ packId }: { packId: string }) {
  const { data: pack, refetch } = usePackFull(packId);
  const evidences = usePackEvidences(packId, pack);
  const deleteMutation = useDeleteEvidence();
  const downloadMutation = useDownloadEvidence();
  
  const handleDelete = (evidenceId: string) => {
    deleteMutation.mutate(
      { evidenceId, packId },
      {
        onSuccess: () => {
          toast.success('Preuve supprimée');
          // Evidence disparaît instantanément (optimistic)
          // Pack refetch après confirmation backend
        }
      }
    );
  };
  
  const handleUploadSuccess = () => {
    refetch(); // Recharger le pack pour afficher nouvelle evidence
  };
  
  return (
    <div>
      <UploadForm packId={packId} onSuccess={handleUploadSuccess} />
      <EvidenceGrid
        evidences={evidences}
        onDelete={handleDelete}
        onDownload={(id) => downloadMutation.mutate(id)}
      />
    </div>
  );
}
```

---

## Best practices

### ✅ DO

#### 1. Utiliser les hooks existants
```typescript
// ✅ GOOD
import { usePacks } from '@/hooks/usePack';

function MyComponent() {
  const { data: packs } = usePacks();
}
```

#### 2. Gérer les états loading/error
```typescript
// ✅ GOOD
function MyComponent() {
  const { data, isLoading, isError, error } = usePacks();
  
  if (isLoading) return <Skeleton />;
  if (isError) return <ErrorAlert message={error.message} />;
  if (!data) return null;
  
  return <Content data={data} />;
}
```

#### 3. Utiliser onSuccess/onError pour les side-effects
```typescript
// ✅ GOOD
const createMutation = useCreatePack();

createMutation.mutate(data, {
  onSuccess: (response) => {
    navigate(`/pack/${response.pack.id}`);
    toast.success('Pack créé');
  },
  onError: (error) => {
    console.error('Creation failed:', error);
  }
});
```

#### 4. Utiliser refetch pour forcer un reload
```typescript
// ✅ GOOD
function MyComponent({ packId }) {
  const { data, refetch } = usePackFull(packId);
  
  return (
    <div>
      <Button onClick={refetch}>Actualiser</Button>
    </div>
  );
}
```

---

### ❌ DON'T

#### 1. Ne PAS mélanger appels manuels et React Query
```typescript
// ❌ BAD
function MyComponent() {
  const { data: packs } = usePacks(); // React Query
  
  const loadMore = async () => {
    const response = await apiClient.listPacks(); // Manuel
    // Incohérence cache !
  };
}

// ✅ GOOD
function MyComponent() {
  const { data: packs, refetch } = usePacks();
  
  const loadMore = () => {
    refetch(); // Utilise React Query
  };
}
```

#### 2. Ne PAS gérer le state manuellement si hook existe
```typescript
// ❌ BAD
function MyComponent({ packId }) {
  const [pack, setPack] = useState(null);
  const { data } = usePackFull(packId);
  
  useEffect(() => {
    setPack(data);
  }, [data]);
}

// ✅ GOOD
function MyComponent({ packId }) {
  const { data: pack } = usePackFull(packId);
}
```

#### 3. Ne PAS appeler mutations dans useEffect
```typescript
// ❌ BAD
function MyComponent() {
  const createMutation = useCreatePack();
  
  useEffect(() => {
    createMutation.mutate(data); // Double appel au remount !
  }, []);
}

// ✅ GOOD
function MyComponent() {
  const createMutation = useCreatePack();
  
  const handleCreate = () => {
    createMutation.mutate(data); // Appelé explicitement
  };
}
```

#### 4. Ne PAS oublier de vérifier les données avant utilisation
```typescript
// ❌ BAD
function MyComponent() {
  const { data: pack } = usePackFull(packId);
  
  return <div>{pack.name}</div>; // Crash si pack undefined !
}

// ✅ GOOD
function MyComponent() {
  const { data: pack } = usePackFull(packId);
  
  if (!pack) return null;
  
  return <div>{pack.name}</div>;
}
```

---

## Query Keys Reference

```typescript
// Packs
['packs']                    // Liste de tous les packs
['packs', 'list']            // Liste de tous les packs (alias)
['packs', 'full', packId]    // Pack complet avec données nested

// Indicateurs
['indicators', indicatorId]   // Indicateur individuel

// Evidences (implicites via pack)
// Les evidences sont chargées via le pack parent
// Pas de query key dédié
```

---

## Debugging

### React Query DevTools

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

Ouvrir DevTools : Cliquer sur l'icône en bas à gauche de l'écran

### Inspecter le cache

```typescript
// Dans la console
import { queryClient } from '@/lib/queryClient';

// Voir toutes les queries en cache
queryClient.getQueryCache().getAll();

// Voir une query spécifique
queryClient.getQueryData(['packs', 'full', 'pack-123']);

// Invalider manuellement
queryClient.invalidateQueries({ queryKey: ['packs'] });

// Clear tout le cache
queryClient.clear();
```

---

## Troubleshooting

### Problème : "Les données ne se mettent pas à jour"

**Solution :** Vérifier la stratégie de cache
```typescript
// Dans le hook
const { data, refetch } = usePackFull(packId);

// Forcer un refetch
refetch();

// Ou invalider le cache
queryClient.invalidateQueries({ queryKey: ['packs', 'full', packId] });
```

### Problème : "Trop de requêtes réseau"

**Solution :** Augmenter staleTime
```typescript
// Dans /src/lib/queryClient.ts
staleTime: 10 * 60 * 1000, // 10 minutes au lieu de 5
```

### Problème : "Optimistic update ne rollback pas"

**Solution :** Vérifier le onMutate dans le hook
```typescript
onMutate: async (variables) => {
  // 1. Cancel outgoing queries
  await queryClient.cancelQueries({ queryKey });
  
  // 2. Snapshot previous value
  const previous = queryClient.getQueryData(queryKey);
  
  // 3. Optimistically update
  queryClient.setQueryData(queryKey, newData);
  
  // 4. Return context (crucial!)
  return { previous };
},

onError: (err, variables, context) => {
  // 5. Rollback on error
  if (context?.previous) {
    queryClient.setQueryData(queryKey, context.previous);
  }
}
```

---

## Ressources

- [Documentation React Query](https://tanstack.com/query/latest)
- [Optimistic Updates Guide](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
- [Query Keys Best Practices](https://tkdodo.eu/blog/effective-react-query-keys)

---

**Version :** 1.0.0  
**Dernière mise à jour :** 31 janvier 2026
