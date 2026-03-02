# Phase 6 : Best Practices & Patterns Avancés
## Transparence & Audit Trail avec React Query

**Audience :** Développeurs expérimentés  
**Niveau :** Avancé

---

## 📐 Architecture Patterns

### Pattern 1 : Query Key Factory

**Problème :** Query keys dupliquées et difficiles à maintenir

**Solution :** Centraliser dans des factory functions

```typescript
// ✅ EXCELLENT : Factory avec hiérarchie
export const transparencyKeys = {
  all: ['transparency'] as const,
  profiles: () => [...transparencyKeys.all, 'profile'] as const,
  profile: (indicatorId: string) => [...transparencyKeys.profiles(), indicatorId] as const,
  inputs: (profileId: string) => [...transparencyKeys.all, 'inputs', profileId] as const,
  factors: (profileId: string) => [...transparencyKeys.all, 'factors', profileId] as const,
};

// Usage
const { data } = useQuery({
  queryKey: transparencyKeys.profile(indicatorId),
  // ...
});

// Invalidation précise
queryClient.invalidateQueries({ queryKey: transparencyKeys.profile(indicatorId) });

// Invalidation large
queryClient.invalidateQueries({ queryKey: transparencyKeys.profiles() }); // Tous les profiles
queryClient.invalidateQueries({ queryKey: transparencyKeys.all }); // Tout transparency
```

**Avantages :**
- ✅ Type-safe
- ✅ Évite les typos
- ✅ Invalidation précise ou large
- ✅ Autocomplete dans IDE

---

### Pattern 2 : Optimistic Updates

**Problème :** UI lag après mutations

**Solution :** Mettre à jour le cache avant la réponse serveur

```typescript
export function useUpdateCalculationInput(profileId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ inputId, updates }: { inputId: string; updates: Partial<Input> }) => {
      return apiClient.updateCalculationInput(inputId, updates);
    },
    
    // 🎯 Phase 1 : Optimistic update
    onMutate: async ({ inputId, updates }) => {
      // Cancel ongoing refetches (éviter écrasement)
      await queryClient.cancelQueries({ queryKey: transparencyKeys.inputs(profileId) });

      // Snapshot de l'ancien état
      const previousInputs = queryClient.getQueryData<Input[]>(transparencyKeys.inputs(profileId));

      // Optimistic update du cache
      queryClient.setQueryData<Input[]>(transparencyKeys.inputs(profileId), (old) =>
        old?.map((input) =>
          input.id === inputId ? { ...input, ...updates } : input
        ) || []
      );

      // Retourner context pour rollback potentiel
      return { previousInputs };
    },

    // 🎯 Phase 2 : En cas d'erreur, rollback
    onError: (err, variables, context) => {
      if (context?.previousInputs) {
        queryClient.setQueryData(
          transparencyKeys.inputs(profileId),
          context.previousInputs
        );
      }
      toast.error('Erreur lors de la mise à jour');
    },

    // 🎯 Phase 3 : Toujours refetch pour sync serveur
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: transparencyKeys.inputs(profileId) });
      queryClient.invalidateQueries({ queryKey: transparencyKeys.summary(indicatorId) });
    },

    // 🎯 Phase 4 : Toast de succès
    onSuccess: () => {
      toast.success('Source mise à jour');
    },
  });
}
```

**Timeline :**
```
User clicks → [0ms] UI updated (optimistic)
              [10ms] API call starts
              [200ms] API responds success → [201ms] Refetch (sync)
              
OU
              [200ms] API responds error → [201ms] Rollback + toast error
```

**Avantages :**
- ✅ UI instantanée (0ms perceived latency)
- ✅ Rollback automatique si erreur
- ✅ Sync garantie avec serveur via refetch

---

### Pattern 3 : Dependent Queries

**Problème :** Charger des données qui dépendent d'autres données

**Solution :** Option `enabled` pour contrôler l'exécution

```typescript
function CalculationDetails({ indicatorId }: { indicatorId: string }) {
  // 1. Charger le profile en premier
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
  } = useCalculationProfile(indicatorId);

  // 2. Charger les inputs SEULEMENT si profile existe
  const {
    data: inputs,
    isLoading: inputsLoading,
  } = useCalculationInputs(profile?.id || '', {
    enabled: !!profile?.id, // ⚠️ Crucial : ne lance pas si pas de profile
  });

  // 3. Charger les factors SEULEMENT si profile existe
  const {
    data: factors,
    isLoading: factorsLoading,
  } = useCalculationFactors(profile?.id || '', {
    enabled: !!profile?.id,
  });

  // Loading state intelligent
  if (profileLoading) {
    return <Skeleton>Chargement du profil...</Skeleton>;
  }

  if (profileError) {
    return <Alert variant="destructive">Erreur de chargement du profil</Alert>;
  }

  // Profile chargé → inputs/factors chargent en parallèle
  const isLoadingDetails = inputsLoading || factorsLoading;

  return (
    <div>
      <h2>Formule : {profile.formula}</h2>

      {isLoadingDetails ? (
        <Skeleton>Chargement des détails...</Skeleton>
      ) : (
        <>
          <InputsList inputs={inputs} />
          <FactorsList factors={factors} />
        </>
      )}
    </div>
  );
}
```

**Waterfall évité :**
```
✅ BON :
Profile [0-200ms]
        ↓
Inputs + Factors [200-400ms] (parallèle)

❌ MAUVAIS (sans enabled) :
Profile [0-200ms]
        ↓
Inputs [200-400ms]
       ↓
Factors [400-600ms] (séquentiel = lent !)
```

---

### Pattern 4 : Prefetching

**Problème :** Latence lors de navigation vers nouvelle page

**Solution :** Prefetch au hover ou à l'avance

```typescript
function IndicatorCard({ indicator }: { indicator: Indicator }) {
  const queryClient = useQueryClient();

  // Prefetch au hover de la card
  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: transparencyKeys.profile(indicator.id),
      queryFn: () => apiClient.getCalculationProfile(indicator.id),
      staleTime: 60 * 1000, // Cache 1 minute
    });
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onClick={() => navigate(`/indicators/${indicator.id}`)}
    >
      <h3>{indicator.name}</h3>
      <p>{indicator.value} {indicator.unit}</p>
    </div>
  );
}
```

**Résultat :**
- Hover → Prefetch en arrière-plan
- Click → Données déjà en cache = chargement instantané

---

### Pattern 5 : Pagination Infinie

**Problème :** AuditCenter charge tout d'un coup (lourd)

**Solution :** useInfiniteQuery pour pagination

```typescript
export function useOrganizationAuditTrailInfinite(filters?: Omit<AuditFilters, 'offset' | 'limit'>) {
  return useInfiniteQuery({
    queryKey: [...auditKeys.organization(), filters],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await apiClient.getOrganizationAuditTrail({
        ...filters,
        offset: pageParam,
        limit: 50,
      });
      return response;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * 50; // offset suivant
    },
    initialPageParam: 0,
    staleTime: 1 * 60 * 1000,
  });
}

// Usage dans composant
function AuditCenterInfinite() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useOrganizationAuditTrailInfinite({ action: 'validate' });

  const allEntries = data?.pages.flatMap(page => page.entries) || [];

  return (
    <div>
      {allEntries.map((entry) => (
        <AuditCard key={entry.id} entry={entry} />
      ))}

      {hasNextPage && (
        <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Chargement...' : 'Charger plus'}
        </Button>
      )}
    </div>
  );
}
```

**Avantages :**
- ✅ Charge par blocs de 50
- ✅ Bouton "Charger plus" ou scroll infini
- ✅ Cache toutes les pages déjà chargées

---

### Pattern 6 : Global Error Boundary

**Problème :** Erreurs React Query non catchées

**Solution :** Error Boundary globale

```typescript
// ErrorBoundary.tsx
import { Component, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🔴 Error Boundary caught:', error, errorInfo);
    
    // Optionnel : Envoyer à Sentry / monitoring
    // Sentry.captureException(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-lg">
            <AlertTitle>Une erreur est survenue</AlertTitle>
            <AlertDescription>
              {this.state.error?.message || 'Erreur inconnue'}
            </AlertDescription>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.reload();
              }}
              className="mt-4"
            >
              Recharger la page
            </Button>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

// App.tsx
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {/* Votre app */}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

---

## 🎯 Performance Optimizations

### Optimization 1 : Select pour extraire données

**Problème :** Re-render inutile quand seule une partie des données change

**Solution :** Option `select` pour extraire uniquement ce qui nous intéresse

```typescript
// ❌ MAUVAIS : Re-render si N'IMPORTE quelle propriété du profile change
function MyComponent({ indicatorId }) {
  const { data: profile } = useCalculationProfile(indicatorId);
  
  return <div>{profile.status}</div>; // Re-render même si formula change !
}

// ✅ BON : Re-render seulement si status change
function MyComponent({ indicatorId }) {
  const status = useQuery({
    queryKey: transparencyKeys.profile(indicatorId),
    queryFn: () => apiClient.getCalculationProfile(indicatorId),
    select: (data) => data.status, // Extract seulement status
  });
  
  return <div>{status.data}</div>; // Re-render seulement si status change
}
```

**Gain :** Moins de re-renders = UI plus fluide

---

### Optimization 2 : useMemo pour filtres

**Problème :** Filtrage côté client recalculé à chaque render

**Solution :** useMemo pour mémoriser résultat

```typescript
function AuditTimeline({ entries }) {
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ BON : Recalculé seulement si entries ou searchTerm change
  const filteredEntries = useMemo(() => {
    if (!searchTerm) return entries;
    
    const term = searchTerm.toLowerCase();
    return entries.filter((entry) =>
      entry.user.toLowerCase().includes(term) ||
      entry.entityName?.toLowerCase().includes(term)
    );
  }, [entries, searchTerm]);

  return (
    <>
      <Input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {filteredEntries.map((entry) => (
        <AuditCard key={entry.id} entry={entry} />
      ))}
    </>
  );
}
```

---

### Optimization 3 : React.memo pour composants lourds

**Problème :** Composants enfants re-render inutilement

**Solution :** React.memo pour éviter re-renders

```typescript
// ✅ BON : Mémorisé, re-render seulement si entry change
export const AuditCard = React.memo(({ entry }: { entry: AuditEntry }) => {
  return (
    <div className="border rounded p-4">
      <div className="flex items-center gap-2">
        <Badge className={getActionColor(entry.action)}>
          {getActionLabel(entry.action)}
        </Badge>
        <span>{entry.user}</span>
        <span className="text-muted-foreground">
          {formatAuditTimestamp(entry.timestamp)}
        </span>
      </div>
      {entry.comment && <p className="mt-2 text-sm">{entry.comment}</p>}
    </div>
  );
});

AuditCard.displayName = 'AuditCard';
```

---

### Optimization 4 : Virtualisation pour listes longues

**Problème :** 500+ entrées d'audit = DOM lourd

**Solution :** react-window pour virtualiser

```typescript
import { FixedSizeList } from 'react-window';

function AuditTimelineVirtualized({ entries }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <AuditCard entry={entries[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={600} // Hauteur visible
      itemCount={entries.length}
      itemSize={120} // Hauteur d'une card
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

**Gain :** Render seulement ~10 items visibles au lieu de 500 = 50x plus rapide

---

### Optimization 5 : Debounce pour recherche

**Problème :** Recherche API appelée à chaque frappe

**Solution :** Debounce de 300ms

```typescript
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

// Hook custom
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Usage
function SearchableAuditTrail() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 300); // 300ms

  const { data: entries } = useAuditTrail({
    search: debouncedSearch, // API appelée seulement après 300ms sans frappe
  });

  return (
    <>
      <Input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Rechercher..."
      />
      {entries?.map((entry) => (
        <AuditCard key={entry.id} entry={entry} />
      ))}
    </>
  );
}
```

**Gain :** "hello" = 1 API call au lieu de 5

---

## 🔒 Security Best Practices

### Security 1 : Sanitize user input

**Problème :** XSS via commentaires audit

**Solution :** Sanitize avant affichage

```typescript
import DOMPurify from 'dompurify';

function AuditCard({ entry }) {
  // ✅ BON : Sanitize comment avant affichage
  const safeComment = DOMPurify.sanitize(entry.comment || '');

  return (
    <div>
      <p dangerouslySetInnerHTML={{ __html: safeComment }} />
    </div>
  );
}

// OU sans HTML
function AuditCard({ entry }) {
  // ✅ MEILLEUR : Afficher text pur (auto-escaped par React)
  return (
    <div>
      <p>{entry.comment}</p>
    </div>
  );
}
```

---

### Security 2 : Valider côté client ET serveur

**Problème :** Validation seulement côté client = bypassable

**Solution :** Validation côté serveur obligatoire

```typescript
// Frontend (UX)
function AddSourceForm() {
  const [value, setValue] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Validation côté client (UX feedback rapide)
    if (!value || value < 0) {
      toast.error('Valeur invalide');
      return;
    }

    // ⚠️ Serveur DOIT aussi valider !
    try {
      await addInput.mutateAsync({ value });
    } catch (error) {
      // Erreur serveur si validation échoue
      toast.error(error.message);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

```typescript
// Backend (sécurité)
app.post('/calculation-inputs', async (c) => {
  const body = await c.req.json();

  // ✅ Validation serveur OBLIGATOIRE
  if (!body.value || typeof body.value !== 'number' || body.value < 0) {
    return c.json({ error: 'Invalid value' }, 400);
  }

  // ... créer input
});
```

---

### Security 3 : Rate limiting sur mutations

**Problème :** User spam mutations = surcharge serveur

**Solution :** Throttle côté client + rate limit serveur

```typescript
// Frontend : Throttle avec lodash
import { throttle } from 'lodash';

function ValidateButton({ profileId }) {
  const validate = useValidateCalculation();

  // ✅ Maximum 1 validation par seconde
  const throttledValidate = useMemo(
    () =>
      throttle(
        () => validate.mutate({ profileId }),
        1000, // 1 seconde
        { leading: true, trailing: false }
      ),
    [validate, profileId]
  );

  return (
    <Button onClick={throttledValidate} disabled={validate.isPending}>
      Valider
    </Button>
  );
}
```

---

## 🧪 Testing Strategies

### Test Pattern 1 : Mock React Query

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCalculationProfile } from '@/hooks/useTransparency';

describe('useCalculationProfile', () => {
  it('should fetch profile successfully', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(
      () => useCalculationProfile('ind-123'),
      { wrapper }
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      id: 'prof-456',
      indicatorId: 'ind-123',
      formula: 'input1 * factor1',
      // ...
    });
  });
});
```

---

### Test Pattern 2 : Test composant avec React Query

```typescript
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TransparencyModal } from '@/app/components/TransparencyModal';

describe('TransparencyModal', () => {
  it('should render calculation details', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TransparencyModal
          indicatorId="ind-123"
          indicatorName="Émissions GES"
          isOpen={true}
          onClose={() => {}}
        />
      </QueryClientProvider>
    );

    // Wait for loading to finish
    expect(screen.getByText(/chargement/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/formule/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/input1 \* factor1/i)).toBeInTheDocument();
  });
});
```

---

## 📊 Monitoring & Analytics

### Monitor 1 : Tracking query performance

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onSuccess: (data, query) => {
        console.log(`✅ Query success: ${query.queryKey.join('/')}`, {
          duration: query.state.dataUpdatedAt - query.state.fetchedAt,
          data,
        });
      },
      onError: (error, query) => {
        console.error(`❌ Query error: ${query.queryKey.join('/')}`, error);
        
        // Envoyer à Sentry
        // Sentry.captureException(error);
      },
    },
  },
});
```

---

### Monitor 2 : Custom React Query Devtools Panel

```typescript
// Devtools avec metrics custom
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* ... */}
      <ReactQueryDevtools
        initialIsOpen={false}
        position="bottom-right"
        toggleButtonProps={{
          style: {
            backgroundColor: '#059669',
            color: 'white',
          },
        }}
      />
    </QueryClientProvider>
  );
}
```

---

## 🚀 Advanced Patterns

### Advanced 1 : Parallel Queries avec Promise.all

```typescript
function DashboardStats({ indicatorIds }: { indicatorIds: string[] }) {
  // ❌ MAUVAIS : Séquentiel (lent)
  const profile1 = useCalculationProfile(indicatorIds[0]);
  const profile2 = useCalculationProfile(indicatorIds[1]);
  const profile3 = useCalculationProfile(indicatorIds[2]);

  // ✅ BON : Parallèle avec useQueries
  const results = useQueries({
    queries: indicatorIds.map((id) => ({
      queryKey: transparencyKeys.profile(id),
      queryFn: () => apiClient.getCalculationProfile(id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const allLoaded = results.every((r) => r.isSuccess);
  const profiles = results.map((r) => r.data);

  if (!allLoaded) return <Skeleton />;

  return (
    <div className="grid grid-cols-3 gap-4">
      {profiles.map((profile) => (
        <ProfileCard key={profile.id} profile={profile} />
      ))}
    </div>
  );
}
```

**Gain :** 3 queries en parallèle = 200ms au lieu de 600ms (3x plus rapide)

---

### Advanced 2 : Conditional Mutations

```typescript
function SmartValidateButton({ profile }) {
  const validate = useValidateCalculation();
  const queryClient = useQueryClient();

  const handleValidate = async () => {
    // Vérifier conditions avant mutation
    const warnings = queryClient.getQueryData(
      transparencyKeys.warnings(profile.indicatorId)
    );

    if (warnings && warnings.some((w) => w.severity === 'high')) {
      const confirmed = confirm(
        'Il y a des warnings critiques. Continuer quand même ?'
      );
      if (!confirmed) return;
    }

    await validate.mutateAsync({ profileId: profile.id });
  };

  return <Button onClick={handleValidate}>Valider</Button>;
}
```

---

### Advanced 3 : Query Retries avec exponential backoff

```typescript
export function useCalculationProfile(indicatorId: string | null) {
  return useQuery({
    queryKey: transparencyKeys.profile(indicatorId || ''),
    queryFn: async () => {
      const response = await apiClient.getCalculationProfile(indicatorId!);
      return response.profile;
    },
    enabled: !!indicatorId,
    staleTime: 5 * 60 * 1000,
    
    // ✅ Retry avec exponential backoff
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Attempt 0: 1s
    // Attempt 1: 2s
    // Attempt 2: 4s
    // Attempt 3: 8s (max 30s)
  });
}
```

---

## 🎓 Conclusion

### Checklist Best Practices

**Architecture**
- [ ] Query keys centralisées dans factory functions
- [ ] Optimistic updates pour mutations fréquentes
- [ ] Dependent queries avec `enabled`
- [ ] Prefetching pour navigation anticipée
- [ ] Error Boundary globale

**Performance**
- [ ] `select` pour extraire données spécifiques
- [ ] `useMemo` pour calculs lourds
- [ ] `React.memo` pour composants lourds
- [ ] Virtualisation pour listes >100 items
- [ ] Debounce pour recherche

**Security**
- [ ] Sanitize user input
- [ ] Validation côté client ET serveur
- [ ] Rate limiting sur mutations
- [ ] HTTPS only
- [ ] JWT avec expiration courte

**Testing**
- [ ] Unit tests pour hooks
- [ ] Integration tests pour composants
- [ ] Mock API avec MSW
- [ ] Coverage >80%

**Monitoring**
- [ ] React Query Devtools en dev
- [ ] Sentry pour erreurs en prod
- [ ] Analytics pour usage
- [ ] Performance monitoring

---

**Niveau atteint :** Expert React Query ✅  
**Prêt pour production :** Oui ✅  
**Performance :** Optimisée ✅  
**Sécurité :** Renforcée ✅

🎉 **Vous maîtrisez maintenant les patterns avancés de React Query !**
