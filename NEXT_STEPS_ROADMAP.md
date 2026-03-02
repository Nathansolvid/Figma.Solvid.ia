# 🚀 Roadmap - Prochaines Étapes Solvid.IA

**Date**: 31 janvier 2026  
**Version Actuelle**: Phase 4 Complete  
**Status**: 🟢 Production-Ready

---

## 🎯 Phase 5 - Propositions d'Amélioration

### Option A: Optimisation Performance & UX

#### 1. Optimistic Updates ⚡
**Priorité**: Haute  
**Effort**: Moyen

**Objectif**: Améliorer l'UX en mettant à jour l'interface immédiatement, avant la confirmation du backend.

**Implémentation**:
```typescript
// Exemple dans useIndicatorUpdates.ts
const markAsProvided = async (id: string) => {
  // Update local state immédiatement
  setLocalState(prev => updateStatus(prev, id, 'PROVIDED'));
  
  try {
    // Puis update backend
    await apiClient.updateIndicator(id, { status: 'PROVIDED' });
  } catch (error) {
    // Rollback en cas d'erreur
    setLocalState(prev => revertStatus(prev, id));
    toast.error('Échec de la mise à jour');
  }
};
```

**Avantages**:
- ✅ Interface ultra-réactive
- ✅ Meilleure perception de performance
- ✅ Feedback immédiat pour l'utilisateur

**Fichiers à modifier**:
- `/src/hooks/useIndicatorUpdates.ts`
- `/src/app/components/views/PackView.tsx`

---

#### 2. Caching avec React Query 💾
**Priorité**: Haute  
**Effort**: Moyen

**Objectif**: Réduire les appels API en cachant les données fréquemment consultées.

**Installation**:
```bash
pnpm install @tanstack/react-query
```

**Implémentation**:
```typescript
// src/hooks/usePack.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function usePack(packId: string) {
  return useQuery({
    queryKey: ['pack', packId],
    queryFn: () => apiClient.getPackFullDirect(packId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useUpdateIndicator() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => apiClient.updateIndicator(id, data),
    onSuccess: (_, { packId }) => {
      // Invalider cache pack pour refetch
      queryClient.invalidateQueries(['pack', packId]);
    }
  });
}
```

**Avantages**:
- ✅ Réduction drastique des appels API
- ✅ Meilleure gestion des erreurs réseau
- ✅ Prefetching automatique
- ✅ Déduplication des requêtes

---

#### 3. Lazy Loading & Code Splitting 📦
**Priorité**: Moyenne  
**Effort**: Faible

**Objectif**: Réduire le bundle initial en chargeant les composants à la demande.

**Implémentation**:
```typescript
// src/app/AppContent.tsx
import { lazy, Suspense } from 'react';

const PackView = lazy(() => import('@/app/components/views/PackView'));
const EvidenceVault = lazy(() => import('@/app/components/views/EvidenceVaultSimple'));

// Dans le render
<Suspense fallback={<LoadingSpinner />}>
  {currentView === 'PACK' && <PackView packId={selectedPack} />}
</Suspense>
```

**Avantages**:
- ✅ Bundle initial plus léger
- ✅ Time to interactive plus rapide
- ✅ Meilleur score Lighthouse

---

### Option B: Fonctionnalités Collaboratives

#### 1. Real-Time Sync avec WebSocket 🔄
**Priorité**: Haute  
**Effort**: Élevé

**Objectif**: Voir les modifications des autres utilisateurs en temps réel.

**Technologies**:
- Supabase Realtime (WebSocket intégré)
- Broadcast channels pour sync multi-onglets

**Implémentation**:
```typescript
// src/hooks/useRealtimeSync.ts
import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export function useRealtimeSync(packId: string, onUpdate: () => void) {
  useEffect(() => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Subscribe aux changements
    const channel = supabase
      .channel(`pack:${packId}`)
      .on('broadcast', { event: 'indicator_updated' }, (payload) => {
        console.log('Indicator updated by:', payload.user);
        onUpdate(); // Refresh pack data
      })
      .subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  }, [packId]);
}
```

**Features**:
- ✅ Voir qui est en train de modifier (présence)
- ✅ Updates en temps réel sur tous les écrans
- ✅ Indicateur "User X modifie l'indicateur Y"
- ✅ Conflict resolution automatique

**Backend Modifications**:
```typescript
// Après chaque update d'indicator
const channel = supabase.channel(`pack:${packId}`);
await channel.send({
  type: 'broadcast',
  event: 'indicator_updated',
  payload: {
    user: user.name,
    indicatorId: indicator.id,
    timestamp: new Date().toISOString()
  }
});
```

---

#### 2. Système de Commentaires 💬
**Priorité**: Moyenne  
**Effort**: Moyen

**Objectif**: Permettre aux collaborateurs de discuter directement sur les indicateurs.

**Data Model**:
```typescript
interface Comment {
  id: string;
  indicatorId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  mentions?: string[]; // @user_id
  resolved: boolean;
}
```

**UI Component**:
```typescript
// src/app/components/CommentThread.tsx
export function CommentThread({ indicatorId }: { indicatorId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  
  return (
    <div className="space-y-4">
      {comments.map(comment => (
        <CommentCard key={comment.id} comment={comment} />
      ))}
      <CommentInput indicatorId={indicatorId} onSubmit={handleAddComment} />
    </div>
  );
}
```

**Features**:
- ✅ Thread de commentaires par indicateur
- ✅ @mentions avec notifications
- ✅ Marquer comme résolu
- ✅ Rich text editor (bold, italic, liens)

---

#### 3. Activity Feed 📊
**Priorité**: Faible  
**Effort**: Moyen

**Objectif**: Historique des actions effectuées sur le pack.

**Implémentation**:
```typescript
// src/app/components/ActivityFeed.tsx
export function ActivityFeed({ packId }: { packId: string }) {
  const activities = [
    {
      id: '1',
      user: 'Marie Dupont',
      action: 'marked_provided',
      target: 'GHG-SCOPE-1',
      timestamp: '2026-01-31T10:30:00Z'
    },
    {
      id: '2',
      user: 'Jean Martin',
      action: 'uploaded_evidence',
      target: 'Bilan_GES_2024.pdf',
      timestamp: '2026-01-31T09:15:00Z'
    }
  ];
  
  return (
    <div className="space-y-2">
      {activities.map(activity => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
```

---

### Option C: Import & Export Avancés

#### 1. Import Excel Intelligent 📊
**Priorité**: Haute  
**Effort**: Élevé

**Objectif**: Importer des données ESG depuis des fichiers Excel existants.

**Technologies**:
- `xlsx` (déjà installé ✅)
- Mapping intelligent colonnes → champs

**Implémentation**:
```typescript
// src/utils/excelImport.ts
import * as XLSX from 'xlsx';

export async function importFromExcel(file: File): Promise<ImportResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);
  
  // Détection automatique des colonnes
  const mapping = detectColumnMapping(rows[0]);
  
  // Transformation rows → indicators
  const indicators = rows.map(row => ({
    code: row[mapping.code],
    value: parseFloat(row[mapping.value]),
    unit: row[mapping.unit],
    comment: row[mapping.comment]
  }));
  
  return { indicators, warnings: [] };
}
```

**Features**:
- ✅ Drag & drop Excel
- ✅ Preview des données avant import
- ✅ Mapping automatique des colonnes
- ✅ Validation des données
- ✅ Rapport d'import (succès/erreurs)

---

#### 2. Export Excel Personnalisé 📈
**Priorité**: Moyenne  
**Effort**: Moyen

**Objectif**: Exporter les données dans un format compatible avec d'autres outils.

**Implémentation**:
```typescript
// src/utils/excelExport.ts
import * as XLSX from 'xlsx';

export function exportToExcel(pack: Pack) {
  const data = pack.kpiRequirements.map(kpi => ({
    'Code': kpi.code,
    'Indicateur': kpi.label,
    'Valeur': kpi.currentValue,
    'Unité': kpi.unit,
    'Status': kpi.status,
    'Commentaire': kpi.comment,
    'Preuves': kpi.evidences.map(e => e.file_name).join(', ')
  }));
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Indicateurs ESG');
  
  XLSX.writeFile(wb, `${sanitize(pack.name)}_export.xlsx`);
}
```

---

### Option D: Dashboard Analytics

#### 1. Graphiques de Progression 📊
**Priorité**: Haute  
**Effort**: Moyen

**Objectif**: Visualiser l'avancement ESG de l'organisation.

**Technologies**:
- `recharts` (déjà installé ✅)

**Charts à créer**:

##### A. Completion Score Timeline
```typescript
<LineChart data={completionHistory}>
  <Line type="monotone" dataKey="score" stroke="#059669" />
  <XAxis dataKey="date" />
  <YAxis domain={[0, 100]} />
</LineChart>
```

##### B. KPIs par Pilier E/S/G
```typescript
<BarChart data={kpisByPillar}>
  <Bar dataKey="provided" fill="#059669" />
  <Bar dataKey="missing" fill="#DC2626" />
  <XAxis dataKey="pillar" />
</BarChart>
```

##### C. Evidence Upload Activity
```typescript
<AreaChart data={uploadActivity}>
  <Area type="monotone" dataKey="count" fill="#059669" />
  <XAxis dataKey="week" />
</AreaChart>
```

---

#### 2. KPIs Dashboard 📈
**Priorité**: Haute  
**Effort**: Moyen

**Métriques à afficher**:

```typescript
// src/app/components/views/Dashboard.tsx
export function Dashboard() {
  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard 
        title="Packs Actifs"
        value={12}
        change="+3 ce mois"
        trend="up"
      />
      <MetricCard 
        title="Completion Moyenne"
        value="78%"
        change="+12% vs mois dernier"
        trend="up"
      />
      <MetricCard 
        title="Preuves Uploadées"
        value={145}
        change="+28 cette semaine"
        trend="up"
      />
      <MetricCard 
        title="Temps Moyen Pack"
        value="5.2j"
        change="-1.3j vs mois dernier"
        trend="down"
      />
    </div>
  );
}
```

---

### Option E: Amélioration Backend

#### 1. Migration vers Postgres Tables 🗄️
**Priorité**: Moyenne  
**Effort**: Élevé

**Objectif**: Remplacer KV Store par vraies tables Postgres pour meilleures performances et requêtes complexes.

**Avantages**:
- ✅ Requêtes SQL complexes (JOIN, aggregations)
- ✅ Full-text search natif
- ✅ Indexes pour performances
- ✅ Transactions ACID
- ✅ Supabase RLS natif

**Migration Plan**:
1. Créer schema SQL
2. Script de migration KV → Postgres
3. Adapter routes backend
4. Tests exhaustifs
5. Déploiement progressif

**Schema Exemple**:
```sql
-- Migration initiale
CREATE TABLE packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  value NUMERIC,
  unit TEXT,
  status TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicators ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their org's packs"
  ON packs FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));
```

---

#### 2. Caching Redis ⚡
**Priorité**: Faible  
**Effort**: Moyen

**Objectif**: Cache pour requêtes fréquentes.

**Implémentation**:
- Upstash Redis (compatible Supabase)
- Cache GET `/packs/:id/full` pendant 5 minutes
- Invalidation sur updates

---

## 🎯 Recommandations Prioritaires

### Pour la Phase 5 Immédiate:

**Top 3 Priorités**:
1. 🥇 **Optimistic Updates** - Impact UX maximal, effort moyen
2. 🥈 **Import Excel** - Forte demande utilisateur, différenciation forte
3. 🥉 **Dashboard Analytics** - Valeur ajoutée importante, visuellement impactant

**Roadmap Recommandée**:

```
Phase 5a (2-3 semaines):
├── Optimistic Updates
├── React Query Caching
└── Dashboard Analytics basique

Phase 5b (3-4 semaines):
├── Import Excel
├── Export Excel avancé
└── Real-time Sync (WebSocket)

Phase 5c (4-5 semaines):
├── Système de Commentaires
├── Activity Feed
└── Migration Postgres (si nécessaire)
```

---

## 📊 Matrice Effort vs Impact

| Feature | Impact | Effort | Priorité | Phase |
|---------|--------|--------|----------|-------|
| Optimistic Updates | 🔥🔥🔥 | ⚙️⚙️ | 🥇 Haute | 5a |
| React Query | 🔥🔥🔥 | ⚙️⚙️ | 🥇 Haute | 5a |
| Dashboard Analytics | 🔥🔥🔥 | ⚙️⚙️ | 🥇 Haute | 5a |
| Import Excel | 🔥🔥🔥 | ⚙️⚙️⚙️ | 🥈 Haute | 5b |
| Real-time Sync | 🔥🔥 | ⚙️⚙️⚙️ | 🥈 Moyenne | 5b |
| Commentaires | 🔥🔥 | ⚙️⚙️ | 🥉 Moyenne | 5c |
| Activity Feed | 🔥 | ⚙️⚙️ | 🥉 Faible | 5c |
| Migration Postgres | 🔥🔥 | ⚙️⚙️⚙️⚙️ | ⚠️ Si nécessaire | 6 |

**Légende**:
- 🔥 Impact: Plus de flammes = plus d'impact
- ⚙️ Effort: Plus d'engrenages = plus d'effort
- 🥇🥈🥉 Priorité

---

## 🚀 Quick Wins (1-2 jours chacun)

Ces features peuvent être implémentées rapidement pour valeur immédiate:

1. **Loading Skeletons** - Remplacer spinners par skeletons
2. **Keyboard Shortcuts** - Ctrl+S pour sauvegarder, etc.
3. **Bulk Select** - Sélectionner plusieurs items checklist
4. **Dark Mode** - Toggle theme clair/sombre
5. **Export CSV** - Alternative légère à Excel
6. **Search Global** - Recherche dans tous les packs
7. **Notifications Toast Plus Riches** - Actions dans les toasts
8. **Tutorial Onboarding** - Guide premier usage

---

## 📝 Notes Importantes

### Contraintes Techniques
- ✅ Figma Make = No hot-reload backend
- ✅ JWT issues = Utiliser routes `-direct`
- ✅ KV Store = Limité pour queries complexes
- ✅ Edge Functions = Cold starts possibles

### Considérations Business
- 🎯 Focus sur **auditabilité** (valeur centrale)
- 🎯 Excel = Format universel B2B (priorité haute)
- 🎯 Simplicité > Complexité (éviter feature bloat)
- 🎯 Mobile-responsive pas prioritaire (B2B desktop-first)

---

**Prêt pour la Phase 5 !** 🚀

Quelle option voulez-vous prioriser ?
