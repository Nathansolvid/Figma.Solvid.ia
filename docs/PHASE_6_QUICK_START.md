# Phase 6 : Quick Start Guide
## Transparence & Audit Trail - Démarrage Rapide

**Temps de lecture :** 10 minutes  
**Temps d'intégration :** 30 minutes

---

## 🚀 Démarrage en 5 minutes

### 1. Importer les hooks
```tsx
import {
  useCalculationProfile,
  useCalculationInputs,
  useExportTransparency,
} from '@/hooks/useTransparency';

import {
  useIndicatorAuditTrail,
  useCreateAuditEntry,
  useExportAuditTrail,
} from '@/hooks/useAuditTrail';
```

### 2. Utiliser les composants
```tsx
import { TransparencyModal } from '@/app/components/TransparencyModal';
import { AuditTrail } from '@/app/components/AuditTrail';
import { AuditCenter } from '@/app/components/AuditCenter';
```

### 3. Exemple minimal
```tsx
function MyComponent() {
  const [showTransp, setShowTransp] = useState(false);
  const indicatorId = 'ind-123';

  return (
    <>
      <Button onClick={() => setShowTransp(true)}>
        Voir transparence
      </Button>

      <TransparencyModal
        indicatorId={indicatorId}
        indicatorName="Émissions GES"
        isOpen={showTransp}
        onClose={() => setShowTransp(false)}
      />
    </>
  );
}
```

---

## 📖 Cas d'usage courants

### Cas 1 : Afficher la transparence d'un indicateur

```tsx
import { useState } from 'react';
import { TransparencyModal } from '@/app/components/TransparencyModal';

function IndicatorCard({ indicator }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <h3>{indicator.name}</h3>
      <p>Valeur : {indicator.value} {indicator.unit}</p>
      
      <Button onClick={() => setIsOpen(true)}>
        Voir calcul
      </Button>

      <TransparencyModal
        indicatorId={indicator.id}
        indicatorName={indicator.name}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
}
```

**Résultat :** Modal avec 4 onglets (Calcul, Sources, Facteurs, Historique)

---

### Cas 2 : Afficher l'historique d'un indicateur

```tsx
import { AuditTrail } from '@/app/components/AuditTrail';

function IndicatorSidebar({ indicatorId }) {
  return (
    <div className="w-96 border-l p-4">
      <h2>Historique</h2>
      
      <AuditTrail
        entityType="indicator"
        entityId={indicatorId}
        compact={true}
        maxHeight="500px"
      />
    </div>
  );
}
```

**Résultat :** Timeline avec badges colorés + diff visuel

---

### Cas 3 : Page Centre d'audit (admin)

```tsx
import { AuditCenter } from '@/app/components/AuditCenter';

function AuditCenterPage() {
  return (
    <div className="container mx-auto">
      <AuditCenter />
    </div>
  );
}

// Dans votre router
<Route path="/audit-center" element={<AuditCenterPage />} />
```

**Résultat :** Dashboard complet avec filtres + statistiques + export

---

### Cas 4 : Enregistrer une action dans l'audit

```tsx
import { useCreateAuditEntry } from '@/hooks/useAuditTrail';

function ValidateButton({ indicator }) {
  const createAuditEntry = useCreateAuditEntry();
  const currentUser = useCurrentUser();

  const handleValidate = async () => {
    // 1. Action métier
    await apiClient.updateIndicator(indicator.id, {
      status: 'validated',
    });

    // 2. Enregistrer dans audit trail
    await createAuditEntry.mutateAsync({
      user: currentUser.name,
      userId: currentUser.id,
      role: currentUser.role,
      action: 'validate',
      entityType: 'indicator',
      entityId: indicator.id,
      entityName: indicator.name,
      field: 'status',
      oldValue: 'draft',
      newValue: 'validated',
      comment: 'Validation manuelle',
    });

    toast.success('Validé !');
  };

  return (
    <Button onClick={handleValidate}>
      Valider
    </Button>
  );
}
```

**Résultat :** Entrée audit créée + timeline mise à jour automatiquement

---

### Cas 5 : Charger des données de calcul

```tsx
import { useCalculationProfile, useCalculationInputs } from '@/hooks/useTransparency';

function CalculationDetails({ indicatorId }) {
  const { data: profile, isLoading: profileLoading } = useCalculationProfile(indicatorId);
  const { data: inputs, isLoading: inputsLoading } = useCalculationInputs(profile?.id);

  if (profileLoading) return <Skeleton />;

  return (
    <div>
      <h2>Formule : {profile.formula}</h2>
      <h3>Méthodologie : {profile.methodology}</h3>

      {inputsLoading ? (
        <Skeleton />
      ) : (
        <ul>
          {inputs.map((input) => (
            <li key={input.id}>
              {input.name} : {input.value} {input.unit} (source: {input.source})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

**Résultat :** Affichage des détails de calcul avec chargement progressif

---

### Cas 6 : Exporter en PDF

```tsx
import { useExportTransparency } from '@/hooks/useTransparency';

function ExportButton({ indicatorId }) {
  const exportMutation = useExportTransparency();

  const handleExport = async () => {
    const result = await exportMutation.mutateAsync({
      indicatorId,
      format: 'pdf',
    });

    // Ouvrir PDF dans nouvel onglet
    window.open(result.downloadUrl, '_blank');
  };

  return (
    <Button
      onClick={handleExport}
      disabled={exportMutation.isPending}
    >
      {exportMutation.isPending ? 'Export...' : 'Exporter PDF'}
    </Button>
  );
}
```

**Résultat :** PDF téléchargé avec toute la transparence du calcul

---

### Cas 7 : Filtrer l'audit trail

```tsx
import { useAuditTrail } from '@/hooks/useAuditTrail';

function ValidationHistory() {
  // Ne charger que les validations
  const { data: entries, isLoading } = useAuditTrail({
    action: 'validate',
    startDate: '2026-01-01',
    limit: 50,
  });

  if (isLoading) return <Skeleton />;

  return (
    <ul>
      {entries.map((entry) => (
        <li key={entry.id}>
          {entry.user} a validé {entry.entityName} le {new Date(entry.timestamp).toLocaleDateString()}
        </li>
      ))}
    </ul>
  );
}
```

**Résultat :** Liste filtrée des validations

---

### Cas 8 : Ajouter une source de données

```tsx
import { useAddCalculationInput } from '@/hooks/useTransparency';

function AddSourceForm({ profileId }) {
  const addInput = useAddCalculationInput();
  const [formData, setFormData] = useState({
    name: '',
    source: '',
    value: 0,
    unit: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    await addInput.mutateAsync({
      profileId,
      type: 'excel',
      ...formData,
    });

    toast.success('Source ajoutée');
    setFormData({ name: '', source: '', value: 0, unit: '' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        placeholder="Nom de la source"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <Input
        placeholder="Source (ex: Facture EDF)"
        value={formData.source}
        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
      />
      <Input
        type="number"
        placeholder="Valeur"
        value={formData.value}
        onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
      />
      <Input
        placeholder="Unité (ex: kWh)"
        value={formData.unit}
        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
      />
      <Button type="submit" disabled={addInput.isPending}>
        Ajouter
      </Button>
    </form>
  );
}
```

**Résultat :** Nouvelle source ajoutée + liste mise à jour automatiquement

---

### Cas 9 : Statistiques d'activité

```tsx
import { useAuditStatistics } from '@/hooks/useAuditTrail';

function ActivityDashboard() {
  const { data: stats, isLoading } = useAuditStatistics({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
    endDate: new Date().toISOString(),
  });

  if (isLoading) return <Skeleton />;

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardHeader>Total d'activité</CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{stats.totalEntries}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>Validations</CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-green-600">
            {stats.entriesByAction.validate || 0}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>Utilisateurs actifs</CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-blue-600">
            {stats.entriesByUser.length}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Résultat :** Dashboard KPI des 30 derniers jours

---

### Cas 10 : Valider un calcul

```tsx
import { useValidateCalculation } from '@/hooks/useTransparency';

function ValidateCalculationButton({ profileId }) {
  const validate = useValidateCalculation();

  const handleValidate = async () => {
    await validate.mutateAsync({
      profileId,
      comment: 'Calcul vérifié selon norme ISO 14064',
    });

    toast.success('Calcul validé');
  };

  return (
    <Button onClick={handleValidate} disabled={validate.isPending}>
      Valider le calcul
    </Button>
  );
}
```

**Résultat :** Status passe à "validated" + badge vert affiché

---

## 🎨 Personnalisation

### Changer les couleurs des badges

```tsx
// Dans useAuditTrail.ts
export function getActionColor(action: AuditEntry['action']): string {
  const colors: Record<AuditEntry['action'], string> = {
    validate: 'bg-green-100 text-green-800', // ← Modifier ici
    reject: 'bg-red-100 text-red-800',
    // ...
  };
  return colors[action] || 'bg-gray-100 text-gray-800';
}
```

### Adapter les labels

```tsx
// Dans useAuditTrail.ts
export function getActionLabel(action: AuditEntry['action']): string {
  const labels: Record<AuditEntry['action'], string> = {
    validate: 'Validé', // ← Modifier ici (ex: "Approved")
    reject: 'Rejeté',
    // ...
  };
  return labels[action] || action;
}
```

### Modifier le stale time

```tsx
// Dans useTransparency.ts
export function useCalculationProfile(indicatorId: string | null) {
  return useQuery({
    queryKey: transparencyKeys.profile(indicatorId || ''),
    queryFn: async () => { ... },
    staleTime: 10 * 60 * 1000, // ← 10 minutes au lieu de 5
  });
}
```

---

## 🔧 Configuration avancée

### Activer React Query Devtools

```tsx
// Dans src/app/App.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Votre app */}
      
      {/* Devtools (seulement en dev) */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Résultat :** Icône en bas à gauche pour inspecter les queries

---

### Configurer le cache global

```tsx
// Dans src/app/App.tsx
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute par défaut
      gcTime: 5 * 60 * 1000, // 5 minutes (garbage collection)
      retry: 1, // 1 retry en cas d'erreur
      refetchOnWindowFocus: false, // Pas de refetch au focus
    },
    mutations: {
      retry: 0, // Pas de retry pour mutations
    },
  },
});
```

---

### Ajouter des logs de debug

```tsx
// Dans useTransparency.ts
export function useCalculationProfile(indicatorId: string | null) {
  return useQuery({
    queryKey: transparencyKeys.profile(indicatorId || ''),
    queryFn: async () => {
      console.log('🔍 Fetching profile for:', indicatorId);
      const response = await apiClient.getCalculationProfile(indicatorId!);
      console.log('✅ Profile loaded:', response.profile);
      return response.profile;
    },
    // ...
  });
}
```

---

## ⚠️ Erreurs courantes

### Erreur 1 : "Cannot read property 'entries' of undefined"
```tsx
// ❌ MAUVAIS
const { data } = useAuditTrail({ indicatorId });
return <div>{data.entries.map(...)}</div>; // Crash !

// ✅ BON
const { data } = useAuditTrail({ indicatorId });
const entries = data?.entries || []; // Safe
return <div>{entries.map(...)}</div>;
```

### Erreur 2 : Query ne se met pas à jour
```tsx
// ❌ MAUVAIS : Oubli d'invalidation
const updateProfile = useMutation({
  mutationFn: (updates) => apiClient.updateCalculationProfile(id, updates),
  // Pas de onSuccess !
});

// ✅ BON : Avec invalidation
const updateProfile = useMutation({
  mutationFn: (updates) => apiClient.updateCalculationProfile(id, updates),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: transparencyKeys.profile(indicatorId) });
  },
});
```

### Erreur 3 : Too many requests (429)
```tsx
// ❌ MAUVAIS : staleTime trop court
const { data } = useQuery({
  queryKey: [...],
  queryFn: () => apiClient.getFactors(id),
  staleTime: 0, // Refetch à chaque rendu !
});

// ✅ BON : staleTime adapté
const { data } = useQuery({
  queryKey: [...],
  queryFn: () => apiClient.getFactors(id),
  staleTime: 10 * 60 * 1000, // 10 minutes OK pour facteurs
});
```

---

## 📚 Ressources

### Documentation complète
- [Guide technique complet](/docs/PHASE_6_TECHNICAL_GUIDE.md)
- [Résumés des jours 1-3](/PHASE_6_DAY*_SUMMARY.md)

### Liens externes
- [React Query Docs](https://tanstack.com/query/latest)
- [Lucide Icons](https://lucide.dev/)
- [Sonner Toast](https://sonner.emilkowal.ski/)

---

## 🎯 Checklist d'intégration

- [ ] Importer les hooks nécessaires
- [ ] Importer les composants UI
- [ ] Ajouter TransparencyModal dans une page
- [ ] Ajouter AuditTrail dans un sidebar
- [ ] Créer route /audit-center avec AuditCenter
- [ ] Enregistrer les actions dans l'audit trail
- [ ] Tester les exports PDF/CSV
- [ ] Activer React Query Devtools (dev)
- [ ] Configurer stale times adaptés
- [ ] Gérer les erreurs avec fallback UI

---

**Temps total d'intégration :** 30 minutes  
**Composants prêts à l'emploi :** 3  
**Hooks disponibles :** 23  
**Endpoints API :** 19

🎉 **Vous êtes prêt à utiliser la Phase 6 !**

Pour des questions avancées, consultez le [Guide Technique](/docs/PHASE_6_TECHNICAL_GUIDE.md).
