# Phase 6 : Transparence & Audit Trail avec React Query

**Date de début :** 31 janvier 2026  
**Statut :** 🚧 **EN COURS**

---

## 📋 Objectifs

Intégrer le système de transparence des calculs et d'audit trail dans l'écosystème React Query pour offrir une traçabilité complète et temps réel de toutes les modifications effectuées sur les données ESG.

---

## 🎯 Livrables

### 1. Hooks React Query ✅
- [x] `/src/hooks/useAuditTrail.ts` - Gestion de l'audit trail
- [x] `/src/hooks/useTransparency.ts` - Gestion de la transparence des calculs
- [x] Ajout des méthodes API dans `/src/services/api.ts`

### 2. Composants à migrer 🚧
- [ ] `/src/app/components/TransparencyModal.tsx` → React Query
- [ ] `/src/app/components/AuditTrail.tsx` → React Query
- [ ] Création `/src/app/components/views/AuditCenter.tsx` (nouveau)
- [ ] Intégration dans `IndicatorsView.tsx`

### 3. Nouvelles fonctionnalités 📝
- [ ] Timeline interactive des changements
- [ ] Export audit trail (CSV, PDF, JSON)
- [ ] Export transparence (PDF, Excel, JSON)
- [ ] Filtres avancés sur audit trail
- [ ] Recherche dans l'historique

---

## 🗂 Structure des hooks créés

### `useAuditTrail.ts` ✅

**Queries:**
- `useIndicatorAuditTrail(indicatorId)` - Historique d'un indicateur
- `usePackAuditTrail(packId)` - Historique d'un pack
- `useAuditTrail(filters)` - Historique filtré
- `useAuditTrailByDateRange(start, end)` - Historique par période

**Mutations:**
- `useCreateAuditEntry()` - Créer une entrée d'audit
- `useExportAuditTrail()` - Exporter l'historique

**Utilities:**
- `getActionLabel(action)` - Label humain de l'action
- `getActionColor(action)` - Couleur selon l'action
- `formatAuditTimestamp(timestamp)` - Format relatif ("Il y a 5 min")

**Query Keys:**
```typescript
auditKeys.indicator(id)    // ['audit', 'indicator', id]
auditKeys.pack(id)         // ['audit', 'pack', id]
auditKeys.list(filters)    // ['audit', 'list', filters]
auditKeys.dateRange(s, e)  // ['audit', 'dateRange', start, end]
```

**Cache Strategy:**
- Stale time: 2 minutes (audit trail change fréquemment)
- GC time: 5 minutes
- Invalidation: après chaque mutation sur indicateur/pack

---

### `useTransparency.ts` ✅

**Queries:**
- `useCalculationProfile(indicatorId)` - Profil de calcul
- `useCalculationInputs(profileId)` - Données sources
- `useCalculationFactors(profileId)` - Facteurs de calcul
- `useCalculationLogs(profileId)` - Logs de calcul
- `useCalculationSummary(indicatorId)` - Résumé complet
- `useCalculationWarnings(indicatorId)` - Alertes et warnings

**Mutations:**
- `useUpdateCalculationProfile()` - Mettre à jour le profil
- `useAddCalculationInput()` - Ajouter une donnée source
- `useUpdateCalculationInput()` - Modifier une donnée source
- `useDeleteCalculationInput()` - Supprimer une donnée source (optimistic)
- `useValidateCalculation()` - Valider le calcul
- `useExportTransparency()` - Exporter la transparence

**Utilities:**
- `getQualityLevelLabel(level)` - Label du niveau de qualité
- `getQualityLevelColor(level)` - Couleur selon qualité
- `getConfidenceLevelIcon(level)` - Icône de confiance

**Query Keys:**
```typescript
transparencyKeys.profile(id)     // ['transparency', 'profile', id]
transparencyKeys.inputs(id)      // ['transparency', 'inputs', id]
transparencyKeys.factors(id)     // ['transparency', 'factors', id]
transparencyKeys.logs(id)        // ['transparency', 'logs', id]
transparencyKeys.summary(id)     // ['transparency', 'summary', id]
transparencyKeys.warnings(id)    // ['transparency', 'warnings', id]
```

**Cache Strategy:**
- Stale time: 3-10 minutes selon le type
  - Profiles: 5 min (relativement stables)
  - Inputs: 3 min (peuvent changer)
  - Factors: 10 min (très stables)
  - Logs: 2 min (changent fréquemment)
- Optimistic Updates: sur ajout/suppression d'inputs
- Invalidation: après validation du calcul

---

## 🔄 Migration TransparencyModal

### Avant (actuel)
```typescript
// Props avec données passées directement
interface TransparencyModalProps {
  indicator: Indicator;  // Toutes les données passées en prop
  open: boolean;
  onClose: () => void;
}

// Pas de chargement dynamique
// Pas de cache
// Pas de refetch
```

### Après (React Query)
```typescript
// Props simplifiées
interface TransparencyModalProps {
  indicatorId: string;  // Seulement l'ID
  open: boolean;
  onClose: () => void;
}

function TransparencyModal({ indicatorId, open, onClose }) {
  // Chargement avec React Query
  const { data: summary, isLoading } = useCalculationSummary(indicatorId);
  const { data: warnings } = useCalculationWarnings(indicatorId);
  const updateInput = useUpdateCalculationInput();
  const validateCalc = useValidateCalculation();
  
  // Optimistic updates sur modifications
  // Cache automatique
  // Refetch après mutations
}
```

**Bénéfices:**
- ✅ Chargement à la demande (pas de données inutiles)
- ✅ Cache des données de transparence
- ✅ Optimistic updates sur modifications
- ✅ Refetch automatique après validation
- ✅ Loading/error states gérés

---

## 🔄 Migration AuditTrail

### Avant (actuel)
```typescript
interface AuditTrailProps {
  entries: AuditEntry[];  // Données passées en prop
  compact?: boolean;
}

// Données statiques
// Pas de refetch
// Pas de filtrage dynamique
```

### Après (React Query)
```typescript
interface AuditTrailProps {
  entityType: 'indicator' | 'pack';
  entityId: string;
  compact?: boolean;
}

function AuditTrail({ entityType, entityId, compact }) {
  // Chargement selon le type
  const { data: entries, isLoading, refetch } = 
    entityType === 'indicator'
      ? useIndicatorAuditTrail(entityId)
      : usePackAuditTrail(entityId);
  
  // Auto-refresh possible
  // Filtres dynamiques
  // Export disponible
}
```

**Bénéfices:**
- ✅ Chargement dynamique selon l'entité
- ✅ Refetch manuel via bouton "Actualiser"
- ✅ Cache des historiques
- ✅ Filtrage côté client optimisé

---

## 🆕 Nouveau composant: AuditCenter

### Objectif
Vue centralisée de tous les audits de l'organisation avec filtres avancés.

### Fonctionnalités
- **Timeline globale** : Tous les événements de l'organisation
- **Filtres avancés** :
  - Par type d'action (create, update, validate, reject...)
  - Par type d'entité (indicator, pack, evidence, folder)
  - Par utilisateur
  - Par période (aujourd'hui, cette semaine, ce mois, custom)
  - Par pack/indicateur spécifique
- **Recherche** : Texte libre dans les commentaires et justifications
- **Export** : CSV, PDF, JSON avec filtres appliqués
- **Statistiques** :
  - Nombre d'actions par type
  - Utilisateurs les plus actifs
  - Entités les plus modifiées
  - Timeline des validations

### Structure
```typescript
function AuditCenter() {
  const [filters, setFilters] = useState<AuditFilters>({
    startDate: startOfDay(new Date()),
    endDate: endOfDay(new Date()),
  });
  
  const { data: entries, isLoading } = useAuditTrail(filters);
  const exportMutation = useExportAuditTrail();
  
  const stats = useMemo(() => {
    // Calcul des statistiques depuis entries
    return calculateStats(entries);
  }, [entries]);
  
  return (
    <div>
      <FilterBar filters={filters} onChange={setFilters} />
      <Stats data={stats} />
      <Timeline entries={entries} />
      <ExportButtons onExport={exportMutation.mutate} />
    </div>
  );
}
```

---

## 🎨 UX Améliorée

### 1. Timeline interactive
- Scroll infini avec virtualisation (react-window)
- Groupement par jour/semaine/mois
- Expansion des détails au clic
- Diff visuel (old value → new value)
- Liens directs vers les entités modifiées

### 2. Notifications temps réel
- Badge sur l'icône audit trail si nouvelles entrées
- Toast discret lors de modifications par d'autres utilisateurs
- Indicateur "Quelqu'un a modifié cet indicateur" avec bouton refetch

### 3. Export intelligent
- Preview avant export
- Choix des colonnes à exporter
- Format personnalisable (CSV, PDF avec logo, JSON)
- Email automatique si export volumineux

### 4. Recherche avancée
- Recherche texte plein
- Suggestions de filtres basées sur l'historique
- Sauvegarde des filtres favoris
- Recherche par regex pour power users

---

## 📊 Architecture de données

### Flux de données Audit Trail

```
┌─────────────────────────────────────────────────────────────┐
│                   USER ACTION                                │
│  (Update indicator, Add evidence, Validate pack...)         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              MUTATION HOOK                                   │
│  (useIndicatorMutations, useEvidence, usePack...)           │
│  - Execute mutation                                          │
│  - Create audit entry automatically                          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND API                                     │
│  - Save mutation to database                                 │
│  - Create audit entry in audit_trail table                   │
│  - Return updated data + audit entry                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│         REACT QUERY CACHE INVALIDATION                       │
│  - Invalidate entity cache (indicator, pack...)              │
│  - Invalidate audit trail cache for entity                   │
│  - Trigger refetch if components are mounted                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              UI UPDATE                                       │
│  - Optimistic update shows immediately                       │
│  - Audit trail refreshed with new entry                      │
│  - Toast notification shown                                  │
└─────────────────────────────────────────────────────────────┘
```

### Flux de données Transparence

```
┌─────────────────────────────────────────────────────────────┐
│           USER OPENS TRANSPARENCY MODAL                      │
│  Click on "Transparence" button for indicator                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│     PARALLEL QUERIES (React Query)                           │
│  ├─ useCalculationProfile(indicatorId)                       │
│  ├─ useCalculationInputs(profileId)                          │
│  ├─ useCalculationFactors(profileId)                         │
│  ├─ useCalculationLogs(profileId)                            │
│  └─ useCalculationWarnings(indicatorId)                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              CACHE CHECK                                     │
│  - If data in cache + fresh → Use cache (0ms)               │
│  - If data in cache + stale → Show cache + refetch bg       │
│  - If no cache → Fetch API                                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│          RENDER TRANSPARENCY MODAL                           │
│  - 4 tabs: Calcul, Sources, Preuves, Historique             │
│  - All data loaded in parallel                               │
│  - Mutations available (update inputs, validate, etc.)       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Tests de validation

### Test 1: Audit Trail - Chargement indicateur
1. Ouvrir un indicateur
2. Modifier sa valeur
3. Ouvrir TransparencyModal > onglet "Historique"
4. Observer l'entrée d'audit de la modification
5. Vérifier: ancien valeur → nouvelle valeur

**Attendu:**
- ✅ Historique chargé depuis cache si déjà consulté
- ✅ Nouvelle entrée visible immédiatement
- ✅ Diff visuel correct

### Test 2: Transparency - Modification input
1. Ouvrir TransparencyModal
2. Onglet "Sources"
3. Modifier une donnée source (ex: changer la valeur)
4. Observer l'UI
5. Vérifier que le calcul se recalcule

**Attendu:**
- ✅ Optimistic update: donnée change immédiatement
- ✅ Requête API en background
- ✅ Recalcul automatique de l'indicateur
- ✅ Toast de succès

### Test 3: Audit Center - Filtres
1. Aller sur AuditCenter
2. Appliquer filtre: action = "validate"
3. Observer que seules les validations s'affichent
4. Changer filtre: userId = current user
5. Observer ses propres actions uniquement

**Attendu:**
- ✅ Filtrage instantané (pas de refetch)
- ✅ URL mise à jour avec query params
- ✅ Compteur d'entrées correct
- ✅ Export respecte les filtres

### Test 4: Export Audit Trail
1. Dans AuditCenter, appliquer des filtres
2. Cliquer "Exporter CSV"
3. Observer le téléchargement
4. Vérifier le contenu du CSV

**Attendu:**
- ✅ CSV contient uniquement les entrées filtrées
- ✅ Colonnes complètes (date, user, action, entity, old/new value...)
- ✅ Format lisible (dates en français, labels traduits)
- ✅ Toast de succès

### Test 5: Transparence - Validation calcul
1. Ouvrir TransparencyModal
2. Vérifier que le calcul est "draft" ou "pending_review"
3. Cliquer "Valider le calcul"
4. Ajouter un commentaire de validation
5. Confirmer

**Attendu:**
- ✅ Statut passe à "validated"
- ✅ Badge vert "Validé"
- ✅ Entrée d'audit créée automatiquement
- ✅ Notification à l'équipe (si implémenté)
- ✅ Refetch des données

---

## 📅 Timeline Phase 6

### Jour 1 (31 janvier - Aujourd'hui) ✅
- [x] Création `useAuditTrail.ts` avec toutes les queries/mutations
- [x] Création `useTransparency.ts` avec queries pour calculs
- [x] Ajout méthodes API dans `apiClient`
- [x] Documentation du plan Phase 6

### Jour 2 (1er février)
- [ ] Migration `TransparencyModal.tsx` vers React Query
- [ ] Migration `AuditTrail.tsx` vers React Query
- [ ] Tests des composants migrés
- [ ] Documentation des patterns

### Jour 3 (2 février)
- [ ] Création `AuditCenter.tsx` (nouveau composant)
- [ ] Implémentation filtres avancés
- [ ] Implémentation timeline interactive
- [ ] Implémentation recherche

### Jour 4 (3 février)
- [ ] Implémentation exports (CSV, PDF, JSON)
- [ ] Optimisations performances (virtualisation)
- [ ] Tests de validation complets
- [ ] Documentation finale

**Durée estimée :** 3-4 jours

---

## 🎯 Critères de succès

### Performance
- [ ] Chargement audit trail < 200ms (cache hit)
- [ ] Chargement transparence < 300ms (cache hit)
- [ ] Filtrage client-side < 50ms pour 1000 entrées
- [ ] Export < 2s pour 1000 entrées

### Fonctionnel
- [ ] 100% des mutations créent une entrée d'audit
- [ ] Tous les champs de l'audit trail sont remplis correctement
- [ ] Diff old/new value visible pour toutes les modifications
- [ ] Export contient toutes les données filtrées
- [ ] Timeline groupée par jour/semaine/mois

### UX
- [ ] Loading skeletons sur tous les chargements
- [ ] Error boundaries sur tous les composants
- [ ] Messages d'erreur explicites
- [ ] Toasts de succès après mutations
- [ ] Feedback visuel sur actions (optimistic updates)

### Documentation
- [ ] Guide d'utilisation AuditCenter
- [ ] Documentation des hooks
- [ ] Exemples de filtres avancés
- [ ] FAQ troubleshooting

---

## 🚀 Prochaines étapes

Après la Phase 6, nous aurons :
- ✅ Architecture React Query complète (Phases 5 + 6)
- ✅ Audit trail complet de toutes les actions
- ✅ Transparence des calculs avec traçabilité
- ✅ Exports complets pour audits externes
- ✅ Filtres et recherche avancés

**Phase 7 (après) :** Collaboration temps réel
- WebSockets pour notifications live
- Présence utilisateurs
- Conflits de modifications
- Chat intégré

**Phase 8 (après) :** Optimisations avancées
- Prefetching intelligent
- Service Worker pour offline
- Cache persistence (localStorage)
- Performance monitoring

---

**Auteur :** Claude (Figma AI Assistant)  
**Date :** 31 janvier 2026  
**Version :** 1.0.0  
**Statut :** 🚧 EN COURS
