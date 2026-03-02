# Phase 6 : Guide Technique Complet
## Transparence & Audit Trail avec React Query

**Version :** 1.0.0  
**Date :** 3 février 2026  
**Status :** ✅ Production Ready

---

## 📚 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Hooks React Query](#hooks-react-query)
4. [Composants UI](#composants-ui)
5. [API Endpoints](#api-endpoints)
6. [Guide d'intégration](#guide-dintégration)
7. [Best Practices](#best-practices)
8. [Exemples d'utilisation](#exemples-dutilisation)
9. [Troubleshooting](#troubleshooting)

---

## Vue d'ensemble

La Phase 6 implémente un système complet de **transparence** et **d'audit trail** pour Solvid.IA, avec les objectifs suivants :

### Objectifs principaux
- ✅ **Auditabilité** : Chaque action tracée et horodatée
- ✅ **Traçabilité** : Historique complet des modifications
- ✅ **Transparence** : Calculs explicables et vérifiables
- ✅ **Performance** : Cache intelligent avec React Query
- ✅ **UX** : Composants modernes et intuitifs

### Technologies utilisées
```json
{
  "@tanstack/react-query": "^5.x",
  "react": "^18.x",
  "lucide-react": "^0.x",
  "sonner": "^1.x"
}
```

### Livrables Phase 6
| Livrable | Type | Lignes | Status |
|----------|------|--------|--------|
| useTransparency.ts | Hook | 350 | ✅ |
| useAuditTrail.ts | Hook | 285 | ✅ |
| TransparencyModal.tsx | Composant | 614 | ✅ |
| AuditTrail.tsx | Composant | 234 | ✅ |
| AuditCenter.tsx | Composant | 718 | ✅ |
| API methods | Service | 19 méthodes | ✅ |

**Total : ~3850 lignes de code production-ready**

---

## Architecture

### Diagramme de l'architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │           COMPOSANTS UI (3 composants)                │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │  TransparencyModal   │   AuditTrail   │ AuditCenter  │ │
│  │   (Calcul details)   │ (1 entity log) │ (Org view)   │ │
│  └───────────────┬───────────────┬───────────────┬───────┘ │
│                  │               │               │         │
│  ┌───────────────┴───────────────┴───────────────┴───────┐ │
│  │         HOOKS REACT QUERY (23 hooks)                  │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │  useTransparency.ts  │  useAuditTrail.ts             │ │
│  │  (15 hooks + 3 util) │  (8 hooks + 5 util)           │ │
│  └───────────────┬───────────────┬───────────────────────┘ │
│                  │               │                         │
│  ┌───────────────┴───────────────┴───────────────────────┐ │
│  │              API CLIENT (apiClient)                   │ │
│  │  - Cache management                                   │ │
│  │  - Error handling                                     │ │
│  │  - Auth with JWT                                      │ │
│  └───────────────┬───────────────────────────────────────┘ │
│                  │                                         │
└──────────────────┼─────────────────────────────────────────┘
                   │ HTTPS + JWT
                   ▼
┌─────────────────────────────────────────────────────────────┐
│               BACKEND (Supabase Edge Functions)             │
├─────────────────────────────────────────────────────────────┤
│  Routes :                                                   │
│  - /indicators/:id/calculation-profile                      │
│  - /indicators/:id/calculation-summary                      │
│  - /audit-trail/organization                                │
│  - /audit-trail/statistics                                  │
│  - /audit-trail/export                                      │
│  - ... (19 routes total)                                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│            DATABASE (Supabase Postgres)                     │
│  Tables :                                                   │
│  - calculation_profiles                                     │
│  - calculation_inputs                                       │
│  - calculation_factors                                      │
│  - audit_trail                                              │
│  - kv_store_aa780fc8 (fallback)                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Hooks React Query

### useTransparency.ts (15 hooks)

#### Query Keys
```typescript
export const transparencyKeys = {
  all: ['transparency'] as const,
  profiles: () => [...transparencyKeys.all, 'profile'] as const,
  profile: (indicatorId: string) => [...transparencyKeys.profiles(), indicatorId] as const,
  inputs: (profileId: string) => [...transparencyKeys.all, 'inputs', profileId] as const,
  factors: (profileId: string) => [...transparencyKeys.all, 'factors', profileId] as const,
  logs: (profileId: string) => [...transparencyKeys.all, 'logs', profileId] as const,
  summary: (indicatorId: string) => [...transparencyKeys.all, 'summary', indicatorId] as const,
  warnings: (indicatorId: string) => [...transparencyKeys.all, 'warnings', indicatorId] as const,
};
```

#### Hooks disponibles

##### 1. useCalculationProfile
```typescript
const { data: profile, isLoading, error } = useCalculationProfile(indicatorId);

// Retour :
{
  id: string;
  indicatorId: string;
  formula: string;
  methodology: string;
  status: 'draft' | 'validated' | 'rejected';
  validatedAt?: string;
  validatedBy?: string;
  comment?: string;
}
```

**Stale time :** 5 minutes  
**Use case :** Afficher le profil de calcul d'un indicateur

##### 2. useCalculationInputs
```typescript
const { data: inputs, isLoading } = useCalculationInputs(profileId);

// Retour :
Array<{
  id: string;
  profileId: string;
  name: string;
  source: string;
  type: 'excel' | 'manual' | 'api';
  value: any;
  unit?: string;
  date?: string;
  evidenceId?: string;
}>
```

**Stale time :** 3 minutes  
**Use case :** Lister toutes les sources de données d'un calcul

##### 3. useCalculationFactors
```typescript
const { data: factors, isLoading } = useCalculationFactors(profileId);

// Retour :
Array<{
  id: string;
  name: string;
  value: number;
  source: string;
  standard?: string;
}>
```

**Stale time :** 10 minutes (rarement changent)  
**Use case :** Afficher les facteurs d'émission ou coefficients

##### 4. useCalculationLogs
```typescript
const { data: logs, isLoading } = useCalculationLogs(profileId);

// Retour :
Array<{
  id: string;
  timestamp: string;
  step: string;
  operation: string;
  input: any;
  output: any;
  status: 'success' | 'warning' | 'error';
}>
```

**Stale time :** 5 minutes  
**Use case :** Afficher les étapes détaillées d'un calcul

##### 5. useCalculationSummary
```typescript
const { data: summary, isLoading } = useCalculationSummary(indicatorId);

// Retour :
{
  totalInputs: number;
  totalFactors: number;
  totalSteps: number;
  lastCalculated: string;
  result: number;
  unit: string;
  confidence: 'high' | 'medium' | 'low';
}
```

**Stale time :** 2 minutes  
**Use case :** Afficher un résumé rapide du calcul

##### 6. useCalculationWarnings
```typescript
const { data: warnings, isLoading } = useCalculationWarnings(indicatorId);

// Retour :
Array<{
  id: string;
  type: 'missing_data' | 'outdated_factor' | 'low_confidence';
  message: string;
  severity: 'low' | 'medium' | 'high';
  field?: string;
}>
```

**Stale time :** 2 minutes  
**Use case :** Alerter sur les problèmes de qualité des données

##### 7. useUpdateCalculationProfile (Mutation)
```typescript
const updateProfile = useUpdateCalculationProfile();

await updateProfile.mutateAsync({
  profileId: 'prof-123',
  updates: {
    formula: 'input1 * factor1',
    methodology: 'GHG Protocol Scope 1',
  },
});

// Optimistic update : ✅
// Invalidation auto : ✅
// Toast success : ✅
```

##### 8. useAddCalculationInput (Mutation)
```typescript
const addInput = useAddCalculationInput();

await addInput.mutateAsync({
  profileId: 'prof-123',
  name: 'Consommation électrique',
  source: 'Facture EDF Q1 2026',
  type: 'excel',
  value: 12500,
  unit: 'kWh',
  evidenceId: 'ev-456',
});
```

##### 9. useUpdateCalculationInput (Mutation)
```typescript
const updateInput = useUpdateCalculationInput();

await updateInput.mutateAsync({
  inputId: 'inp-789',
  updates: { value: 13000 },
});
```

##### 10. useDeleteCalculationInput (Mutation)
```typescript
const deleteInput = useDeleteCalculationInput();

await deleteInput.mutateAsync('inp-789');
// Toast : "Source supprimée"
```

##### 11. useValidateCalculation (Mutation)
```typescript
const validate = useValidateCalculation();

await validate.mutateAsync({
  profileId: 'prof-123',
  comment: 'Calcul vérifié selon norme ISO 14064',
});

// Met à jour le status : draft → validated
// Enregistre validatedAt + validatedBy
```

##### 12. useExportTransparency (Mutation)
```typescript
const exportTransp = useExportTransparency();

await exportTransp.mutateAsync({
  indicatorId: 'ind-123',
  format: 'pdf', // ou 'json' | 'excel'
});

// Retour : { downloadUrl: 'https://...' }
// Toast : "Export réussi"
```

#### Utilities

```typescript
// Statut de validation
getStatusLabel('validated'); // → 'Validé'
getStatusColor('validated'); // → 'bg-green-100 text-green-800'

// Niveau de confiance
getConfidenceLabel('high'); // → 'Élevé'
getConfidenceColor('high'); // → 'text-green-600'

// Sévérité des warnings
getSeverityColor('high'); // → 'text-red-600'
```

---

### useAuditTrail.ts (8 hooks)

#### Query Keys
```typescript
export const auditKeys = {
  all: ['audit'] as const,
  lists: () => [...auditKeys.all, 'list'] as const,
  list: (filters?: any) => [...auditKeys.lists(), filters] as const,
  indicator: (indicatorId: string) => [...auditKeys.all, 'indicator', indicatorId] as const,
  pack: (packId: string) => [...auditKeys.all, 'pack', packId] as const,
  user: (userId: string) => [...auditKeys.all, 'user', userId] as const,
  dateRange: (start: string, end: string) => [...auditKeys.all, 'dateRange', start, end] as const,
  organization: () => [...auditKeys.all, 'organization'] as const,
  statistics: () => [...auditKeys.all, 'statistics'] as const,
};
```

#### Types

```typescript
export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  userId: string;
  role: 'client' | 'consultant' | 'auditeur';
  action: 'create' | 'update' | 'validate' | 'reject' | 'delete' | 'evidence_added' | 'evidence_removed';
  entityType: 'indicator' | 'pack' | 'evidence' | 'folder';
  entityId: string;
  entityName?: string;
  field?: string;
  oldValue?: string | number;
  newValue?: string | number;
  justification?: string;
  comment?: string;
  affectedFields?: string[];
  metadata?: Record<string, any>;
}

export interface AuditFilters {
  indicatorId?: string;
  packId?: string;
  userId?: string;
  action?: AuditEntry['action'] | AuditEntry['action'][];
  entityType?: AuditEntry['entityType'] | AuditEntry['entityType'][];
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AuditStatistics {
  totalEntries: number;
  entriesByAction: Record<AuditEntry['action'], number>;
  entriesByEntityType: Record<AuditEntry['entityType'], number>;
  entriesByUser: { userId: string; userName: string; count: number }[];
  mostActiveEntities: { entityId: string; entityName: string; entityType: string; count: number }[];
  recentActivity: { date: string; count: number }[];
}
```

#### Hooks disponibles

##### 1. useIndicatorAuditTrail
```typescript
const { data: entries, isLoading } = useIndicatorAuditTrail(indicatorId);

// Retour : AuditEntry[]
```

**Stale time :** 2 minutes  
**Use case :** Timeline d'audit pour un indicateur spécifique

##### 2. usePackAuditTrail
```typescript
const { data: entries, isLoading } = usePackAuditTrail(packId);

// Retour : AuditEntry[]
```

**Stale time :** 2 minutes  
**Use case :** Timeline d'audit pour un pack spécifique

##### 3. useAuditTrail (avec filtres)
```typescript
const { data: entries } = useAuditTrail({
  action: 'validate',
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  limit: 100,
});

// Retour : AuditEntry[]
```

**Stale time :** 2 minutes  
**Use case :** Timeline filtrée (ex: toutes les validations du mois)

##### 4. useAuditTrailByDateRange
```typescript
const { data: entries } = useAuditTrailByDateRange(
  '2026-01-01T00:00:00Z',
  '2026-01-31T23:59:59Z'
);
```

**Stale time :** 5 minutes (historique)  
**Use case :** Rapport mensuel/hebdomadaire

##### 5. useOrganizationAuditTrail
```typescript
const { data, isLoading } = useOrganizationAuditTrail({
  limit: 50,
  offset: 0,
  action: ['validate', 'reject'],
  entityType: 'indicator',
});

// Retour :
{
  entries: AuditEntry[];
  total: number;
  hasMore: boolean;
}
```

**Stale time :** 1 minute (très actif)  
**Use case :** AuditCenter - vue organisation complète

##### 6. useAuditStatistics
```typescript
const { data: stats } = useAuditStatistics({
  startDate: '2026-01-01',
  endDate: '2026-01-31',
});

// Retour : AuditStatistics (voir type ci-dessus)
```

**Stale time :** 5 minutes  
**Use case :** Dashboard analytics dans AuditCenter

##### 7. useCreateAuditEntry (Mutation)
```typescript
const createEntry = useCreateAuditEntry();

await createEntry.mutateAsync({
  user: 'John Doe',
  userId: 'user-123',
  role: 'consultant',
  action: 'validate',
  entityType: 'indicator',
  entityId: 'ind-456',
  entityName: 'Émissions Scope 1',
  comment: 'Validation après revue',
});

// Pas de toast (silent) pour éviter bruit UX
// Invalidation auto des trails concernés
```

##### 8. useExportAuditTrail (Mutation)
```typescript
const exportAudit = useExportAuditTrail();

await exportAudit.mutateAsync({
  filters: { action: 'validate', startDate: '2026-01-01' },
  format: 'pdf',
});

// Retour : { downloadUrl: 'https://...' }
// Toast : "Export réussi"
```

#### Utilities

```typescript
// Labels d'action
getActionLabel('validate'); // → 'Validé'
getActionColor('validate'); // → 'bg-green-100 text-green-800'

// Labels de type d'entité
getEntityTypeLabel('indicator'); // → 'Indicateur'
getEntityTypeColor('indicator'); // → 'bg-green-100 text-green-800'

// Formatage timestamp
formatAuditTimestamp('2026-02-03T10:30:00Z');
// → "Il y a 5 min" (si < 1h)
// → "Il y a 2h" (si < 24h)
// → "Il y a 3j" (si < 7j)
// → "3 fév" (sinon)
```

---

## Composants UI

### 1. TransparencyModal

#### Props
```typescript
interface TransparencyModalProps {
  indicatorId: string;
  indicatorName: string;
  isOpen: boolean;
  onClose: () => void;
}
```

#### Utilisation
```tsx
import { TransparencyModal } from '@/app/components/TransparencyModal';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Voir transparence
      </Button>
      
      <TransparencyModal
        indicatorId="ind-123"
        indicatorName="Émissions GES Scope 1"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
```

#### Onglets
1. **Calcul** : Formule + résultat + logs
2. **Sources** : Liste des inputs avec CRUD
3. **Facteurs** : Coefficients utilisés
4. **Historique** : Logs d'exécution

#### Actions
- ✅ Ajouter/modifier/supprimer source
- ✅ Valider/rejeter le calcul
- ✅ Exporter (PDF/JSON/Excel)

---

### 2. AuditTrail

#### Props
```typescript
interface AuditTrailProps {
  entityType: 'indicator' | 'pack';
  entityId: string;
  compact?: boolean;
  maxHeight?: string;
}
```

#### Utilisation
```tsx
import { AuditTrail } from '@/app/components/AuditTrail';

// Dans un modal ou sidebar
<AuditTrail
  entityType="indicator"
  entityId="ind-123"
  compact={false}
  maxHeight="600px"
/>

// Version compacte (sidebar)
<AuditTrail
  entityType="pack"
  entityId="pack-456"
  compact={true}
  maxHeight="400px"
/>
```

#### Features
- ✅ Timeline chronologique
- ✅ Badges colorés (action + type)
- ✅ Diff visuel (ancien → nouveau)
- ✅ Timestamps relatifs
- ✅ Mode compact pour sidebars

---

### 3. AuditCenter

#### Props
```typescript
// Aucune prop - composant standalone
```

#### Utilisation
```tsx
import { AuditCenter } from '@/app/components/AuditCenter';

// Dans une route dédiée
function AuditCenterPage() {
  return (
    <div className="container mx-auto">
      <AuditCenter />
    </div>
  );
}
```

#### Sections
1. **Header** : 4 KPI cards (total, validations, modifs, users)
2. **Filters** : Recherche + 3 selects (période, action, entité)
3. **Timeline Tab** : Cards d'audit avec pagination
4. **Statistics Tab** : 4 dashboards analytics

#### Actions
- ✅ Recherche fulltext
- ✅ Filtres combinables
- ✅ Export PDF/CSV/JSON
- ✅ Actualiser
- ✅ Charger plus (pagination)

---

## API Endpoints

### Transparency Routes

#### GET /indicators/:id/calculation-profile
```http
GET /indicators/ind-123/calculation-profile
Authorization: Bearer <jwt>

Response 200:
{
  "profile": {
    "id": "prof-456",
    "indicatorId": "ind-123",
    "formula": "input1 * factor1",
    "methodology": "GHG Protocol",
    "status": "validated",
    "validatedAt": "2026-02-01T10:00:00Z",
    "validatedBy": "user-789"
  }
}
```

#### GET /calculation-profiles/:id/inputs
```http
GET /calculation-profiles/prof-456/inputs
Authorization: Bearer <jwt>

Response 200:
{
  "inputs": [
    {
      "id": "inp-111",
      "profileId": "prof-456",
      "name": "Consommation gaz",
      "source": "Facture Engie",
      "type": "excel",
      "value": 12500,
      "unit": "kWh",
      "evidenceId": "ev-222"
    }
  ]
}
```

#### POST /calculation-inputs
```http
POST /calculation-inputs
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "profileId": "prof-456",
  "name": "Consommation gaz",
  "source": "Facture Engie",
  "type": "excel",
  "value": 12500,
  "unit": "kWh",
  "evidenceId": "ev-222"
}

Response 201:
{
  "input": { ... }
}
```

#### PUT /calculation-inputs/:id
```http
PUT /calculation-inputs/inp-111
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "value": 13000
}

Response 200:
{
  "input": { ... }
}
```

#### DELETE /calculation-inputs/:id
```http
DELETE /calculation-inputs/inp-111
Authorization: Bearer <jwt>

Response 200:
{
  "message": "Input deleted successfully"
}
```

#### GET /calculation-profiles/:id/factors
```http
GET /calculation-profiles/prof-456/factors
Authorization: Bearer <jwt>

Response 200:
{
  "factors": [
    {
      "id": "fac-333",
      "name": "Facteur émission gaz naturel",
      "value": 0.227,
      "unit": "kgCO2e/kWh",
      "source": "Base Carbone ADEME",
      "standard": "ISO 14064"
    }
  ]
}
```

#### GET /calculation-profiles/:id/logs
```http
GET /calculation-profiles/prof-456/logs
Authorization: Bearer <jwt>

Response 200:
{
  "logs": [
    {
      "id": "log-444",
      "timestamp": "2026-02-03T10:00:00Z",
      "step": "1. Chargement données",
      "operation": "load_input",
      "input": { "name": "Consommation gaz" },
      "output": { "value": 12500 },
      "status": "success"
    }
  ]
}
```

#### GET /indicators/:id/calculation-summary
```http
GET /indicators/ind-123/calculation-summary
Authorization: Bearer <jwt>

Response 200:
{
  "summary": {
    "totalInputs": 3,
    "totalFactors": 2,
    "totalSteps": 5,
    "lastCalculated": "2026-02-03T10:00:00Z",
    "result": 2837.5,
    "unit": "kgCO2e",
    "confidence": "high"
  }
}
```

#### GET /indicators/:id/calculation-warnings
```http
GET /indicators/ind-123/calculation-warnings
Authorization: Bearer <jwt>

Response 200:
{
  "warnings": [
    {
      "id": "warn-555",
      "type": "outdated_factor",
      "message": "Facteur émission datant de 2024",
      "severity": "medium",
      "field": "factor1"
    }
  ]
}
```

#### POST /calculation-profiles/:id/validate
```http
POST /calculation-profiles/prof-456/validate
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "comment": "Calcul vérifié selon ISO 14064"
}

Response 200:
{
  "profile": {
    "id": "prof-456",
    "status": "validated",
    "validatedAt": "2026-02-03T10:30:00Z",
    "validatedBy": "user-789"
  }
}
```

#### GET /indicators/:id/export-transparency
```http
GET /indicators/ind-123/export-transparency?format=pdf
Authorization: Bearer <jwt>

Response 200:
{
  "downloadUrl": "https://storage.supabase.co/..."
}
```

---

### Audit Trail Routes

#### GET /audit-trail
```http
GET /audit-trail?action=validate&startDate=2026-01-01&limit=50
Authorization: Bearer <jwt>

Response 200:
{
  "entries": [
    {
      "id": "audit-111",
      "timestamp": "2026-02-03T10:00:00Z",
      "user": "John Doe",
      "userId": "user-789",
      "role": "consultant",
      "action": "validate",
      "entityType": "indicator",
      "entityId": "ind-123",
      "entityName": "Émissions Scope 1",
      "comment": "Validation après revue"
    }
  ]
}
```

#### GET /indicators/:id/audit-trail
```http
GET /indicators/ind-123/audit-trail
Authorization: Bearer <jwt>

Response 200:
{
  "entries": [ ... ]
}
```

#### GET /packs/:id/audit-trail
```http
GET /packs/pack-456/audit-trail
Authorization: Bearer <jwt>

Response 200:
{
  "entries": [ ... ]
}
```

#### POST /audit-trail
```http
POST /audit-trail
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "user": "John Doe",
  "userId": "user-789",
  "role": "consultant",
  "action": "validate",
  "entityType": "indicator",
  "entityId": "ind-123",
  "entityName": "Émissions Scope 1",
  "field": "value",
  "oldValue": "2500",
  "newValue": "2837.5",
  "comment": "Mise à jour après recalcul"
}

Response 201:
{
  "entry": { ... }
}
```

#### GET /audit-trail/export
```http
GET /audit-trail/export?format=pdf&action=validate&startDate=2026-01-01
Authorization: Bearer <jwt>

Response 200:
{
  "downloadUrl": "https://storage.supabase.co/..."
}
```

#### GET /audit-trail/organization
```http
GET /audit-trail/organization?limit=50&offset=0&action=validate
Authorization: Bearer <jwt>

Response 200:
{
  "entries": [ ... ],
  "total": 234,
  "hasMore": true
}
```

#### GET /audit-trail/statistics
```http
GET /audit-trail/statistics?startDate=2026-01-01&endDate=2026-01-31
Authorization: Bearer <jwt>

Response 200:
{
  "statistics": {
    "totalEntries": 234,
    "entriesByAction": {
      "create": 45,
      "update": 89,
      "validate": 67,
      "reject": 12,
      "delete": 5,
      "evidence_added": 14,
      "evidence_removed": 2
    },
    "entriesByEntityType": {
      "indicator": 156,
      "pack": 34,
      "evidence": 16,
      "folder": 28
    },
    "entriesByUser": [
      { "userId": "user-1", "userName": "John Doe", "count": 89 },
      { "userId": "user-2", "userName": "Jane Smith", "count": 67 }
    ],
    "mostActiveEntities": [
      {
        "entityId": "ind-123",
        "entityName": "Émissions Scope 1",
        "entityType": "indicator",
        "count": 34
      }
    ],
    "recentActivity": [
      { "date": "2026-01-31", "count": 23 },
      { "date": "2026-01-30", "count": 19 }
    ]
  }
}
```

---

## Guide d'intégration

### 1. Setup initial

#### Installer React Query (si pas déjà fait)
```bash
npm install @tanstack/react-query
# ou
pnpm add @tanstack/react-query
```

#### Configurer QueryClient dans App.tsx
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute par défaut
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Votre app */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

---

### 2. Intégrer TransparencyModal

#### Dans une page d'indicateur
```tsx
import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { TransparencyModal } from '@/app/components/TransparencyModal';
import { FileSearch } from 'lucide-react';

function IndicatorDetailPage({ indicator }) {
  const [isTranspOpen, setIsTranspOpen] = useState(false);

  return (
    <div>
      <h1>{indicator.name}</h1>
      <p>Valeur : {indicator.value} {indicator.unit}</p>
      
      {/* Bouton pour ouvrir transparence */}
      <Button onClick={() => setIsTranspOpen(true)}>
        <FileSearch className="h-4 w-4 mr-2" />
        Voir transparence
      </Button>

      {/* Modal transparence */}
      <TransparencyModal
        indicatorId={indicator.id}
        indicatorName={indicator.name}
        isOpen={isTranspOpen}
        onClose={() => setIsTranspOpen(false)}
      />
    </div>
  );
}
```

---

### 3. Intégrer AuditTrail

#### Dans un sidebar ou modal
```tsx
import { AuditTrail } from '@/app/components/AuditTrail';

function IndicatorSidebar({ indicator }) {
  return (
    <div className="w-96 border-l p-4">
      <h2 className="text-lg font-bold mb-4">Historique</h2>
      
      {/* Timeline d'audit */}
      <AuditTrail
        entityType="indicator"
        entityId={indicator.id}
        compact={true}
        maxHeight="500px"
      />
    </div>
  );
}
```

---

### 4. Intégrer AuditCenter

#### Créer une route dédiée
```tsx
// src/app/pages/AuditCenterPage.tsx
import { AuditCenter } from '@/app/components/AuditCenter';

export function AuditCenterPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <AuditCenter />
    </div>
  );
}
```

#### Ajouter dans la navigation
```tsx
import { Shield } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Packs', href: '/packs', icon: Folder },
  { name: 'Centre d\'audit', href: '/audit-center', icon: Shield }, // ← Nouveau
];
```

---

### 5. Créer un audit entry manuellement

#### Exemple après une action utilisateur
```tsx
import { useCreateAuditEntry } from '@/hooks/useAuditTrail';

function MyComponent() {
  const createAuditEntry = useCreateAuditEntry();
  const currentUser = useCurrentUser(); // Votre hook auth

  const handleValidate = async (indicator) => {
    // 1. Action métier
    await apiClient.updateIndicator(indicator.id, { status: 'validated' });

    // 2. Créer entrée audit
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

    toast.success('Indicateur validé');
  };

  return <Button onClick={() => handleValidate(indicator)}>Valider</Button>;
}
```

---

### 6. Exporter des données

#### Export transparence
```tsx
import { useExportTransparency } from '@/hooks/useTransparency';

function ExportButton({ indicatorId }) {
  const exportMutation = useExportTransparency();

  const handleExport = async (format: 'pdf' | 'json' | 'excel') => {
    const result = await exportMutation.mutateAsync({
      indicatorId,
      format,
    });

    // Ouvrir l'URL de téléchargement
    window.open(result.downloadUrl, '_blank');
  };

  return (
    <Select onValueChange={handleExport}>
      <SelectTrigger>
        <Button disabled={exportMutation.isPending}>
          {exportMutation.isPending ? 'Export...' : 'Exporter'}
        </Button>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pdf">PDF</SelectItem>
        <SelectItem value="json">JSON</SelectItem>
        <SelectItem value="excel">Excel</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

#### Export audit trail
```tsx
import { useExportAuditTrail } from '@/hooks/useAuditTrail';

function ExportAuditButton({ filters }) {
  const exportMutation = useExportAuditTrail();

  const handleExport = async (format: 'pdf' | 'csv' | 'json') => {
    const result = await exportMutation.mutateAsync({
      filters,
      format,
    });

    window.open(result.downloadUrl, '_blank');
  };

  return (
    <Button onClick={() => handleExport('pdf')}>
      Exporter PDF
    </Button>
  );
}
```

---

## Best Practices

### 1. Query Keys
```typescript
// ✅ BON : Utiliser les factory functions
const { data } = useQuery({
  queryKey: transparencyKeys.profile(indicatorId),
  queryFn: () => apiClient.getCalculationProfile(indicatorId),
});

// ❌ MAUVAIS : Hardcoder les keys
const { data } = useQuery({
  queryKey: ['profile', indicatorId],
  queryFn: () => apiClient.getCalculationProfile(indicatorId),
});
```

### 2. Stale Time
```typescript
// ✅ BON : Adapter selon fréquence de changement
const { data: factors } = useQuery({
  queryKey: transparencyKeys.factors(profileId),
  queryFn: () => apiClient.getCalculationFactors(profileId),
  staleTime: 10 * 60 * 1000, // 10 minutes - rarement modifiés
});

// ⚠️ OK : Données fréquemment modifiées
const { data: logs } = useQuery({
  queryKey: transparencyKeys.logs(profileId),
  queryFn: () => apiClient.getCalculationLogs(profileId),
  staleTime: 30 * 1000, // 30 secondes
});
```

### 3. Invalidation
```typescript
// ✅ BON : Invalider les queries concernées
const updateProfile = useMutation({
  mutationFn: (updates) => apiClient.updateCalculationProfile(id, updates),
  onSuccess: () => {
    // Invalider profile ET summary ET warnings
    queryClient.invalidateQueries({ queryKey: transparencyKeys.profile(id) });
    queryClient.invalidateQueries({ queryKey: transparencyKeys.summary(indicatorId) });
    queryClient.invalidateQueries({ queryKey: transparencyKeys.warnings(indicatorId) });
  },
});

// ❌ MAUVAIS : Invalider tout
queryClient.invalidateQueries(); // Trop large !
```

### 4. Optimistic Updates
```typescript
// ✅ BON : Update optimiste pour meilleure UX
const updateInput = useMutation({
  mutationFn: ({ inputId, updates }) => apiClient.updateCalculationInput(inputId, updates),
  onMutate: async ({ inputId, updates }) => {
    // Cancel ongoing refetches
    await queryClient.cancelQueries({ queryKey: transparencyKeys.inputs(profileId) });

    // Snapshot
    const previousInputs = queryClient.getQueryData(transparencyKeys.inputs(profileId));

    // Optimistic update
    queryClient.setQueryData(transparencyKeys.inputs(profileId), (old: any) =>
      old.map((input: any) =>
        input.id === inputId ? { ...input, ...updates } : input
      )
    );

    return { previousInputs };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    if (context?.previousInputs) {
      queryClient.setQueryData(transparencyKeys.inputs(profileId), context.previousInputs);
    }
  },
  onSettled: () => {
    // Refetch to ensure sync
    queryClient.invalidateQueries({ queryKey: transparencyKeys.inputs(profileId) });
  },
});
```

### 5. Error Handling
```typescript
// ✅ BON : Gérer les erreurs avec fallback UI
const { data, isError, error } = useCalculationProfile(indicatorId);

if (isError) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Erreur de chargement</AlertTitle>
      <AlertDescription>
        {error instanceof Error ? error.message : 'Une erreur est survenue'}
      </AlertDescription>
    </Alert>
  );
}
```

### 6. Loading States
```typescript
// ✅ BON : Skeletons pendant chargement
const { data: profile, isLoading } = useCalculationProfile(indicatorId);

if (isLoading) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}
```

### 7. Conditional Fetching
```typescript
// ✅ BON : Désactiver query si pas de données
const { data: profile } = useCalculationProfile(indicatorId);

const { data: inputs } = useCalculationInputs(profile?.id, {
  enabled: !!profile?.id, // Ne fetch que si profile existe
});
```

---

## Exemples d'utilisation

### Exemple 1 : Page complète d'un indicateur
```tsx
import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { TransparencyModal } from '@/app/components/TransparencyModal';
import { AuditTrail } from '@/app/components/AuditTrail';
import { FileSearch, History } from 'lucide-react';

function IndicatorPage({ indicatorId }) {
  const [isTranspOpen, setIsTranspOpen] = useState(false);
  const [showAudit, setShowAudit] = useState(false);

  // Charger indicateur (votre hook existant)
  const { data: indicator, isLoading } = useIndicator(indicatorId);

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{indicator.name}</h1>
          <p className="text-muted-foreground">{indicator.code}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsTranspOpen(true)}>
            <FileSearch className="h-4 w-4 mr-2" />
            Transparence
          </Button>
          <Button variant="outline" onClick={() => setShowAudit(!showAudit)}>
            <History className="h-4 w-4 mr-2" />
            Historique
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Valeur</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {indicator.value} <span className="text-2xl text-muted-foreground">{indicator.unit}</span>
              </div>
              <Badge className="mt-4">
                {indicator.status === 'validated' ? 'Validé' : 'Brouillon'}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Méthodologie</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{indicator.methodology || 'Non renseignée'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar avec audit trail */}
        {showAudit && (
          <div className="col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Historique</CardTitle>
              </CardHeader>
              <CardContent>
                <AuditTrail
                  entityType="indicator"
                  entityId={indicatorId}
                  compact={true}
                  maxHeight="600px"
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modal transparence */}
      <TransparencyModal
        indicatorId={indicatorId}
        indicatorName={indicator.name}
        isOpen={isTranspOpen}
        onClose={() => setIsTranspOpen(false)}
      />
    </div>
  );
}
```

---

### Exemple 2 : Dashboard avec statistiques
```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { useAuditStatistics } from '@/hooks/useAuditTrail';
import { Activity, TrendingUp, Users } from 'lucide-react';

function DashboardPage() {
  // Statistiques du dernier mois
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);

  const { data: stats, isLoading } = useAuditStatistics({
    startDate: startDate.toISOString(),
    endDate: new Date().toISOString(),
  });

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total activité */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Activité totale</p>
                <p className="text-3xl font-bold">{stats.totalEntries}</p>
              </div>
              <Activity className="h-8 w-8 text-[#059669]" />
            </div>
          </CardContent>
        </Card>

        {/* Validations */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Validations</p>
                <p className="text-3xl font-bold">{stats.entriesByAction.validate || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* Utilisateurs actifs */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
                <p className="text-3xl font-bold">{stats.entriesByUser.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top utilisateurs */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Utilisateurs les plus actifs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.entriesByUser.slice(0, 5).map((user, index) => (
              <div key={user.userId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#E8F3F0] text-[#059669] font-bold">
                    {index + 1}
                  </div>
                  <span className="font-medium">{user.userName}</span>
                </div>
                <span className="text-2xl font-bold">{user.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Troubleshooting

### Problème : Query ne se met pas à jour après mutation

**Cause :** Invalidation oubliée ou query key incorrecte

**Solution :**
```typescript
const updateProfile = useMutation({
  mutationFn: (updates) => apiClient.updateCalculationProfile(id, updates),
  onSuccess: () => {
    // ✅ Invalider avec la bonne query key
    queryClient.invalidateQueries({ queryKey: transparencyKeys.profile(indicatorId) });
  },
});
```

---

### Problème : Trop de requêtes API

**Cause :** Stale time trop court ou pas de cache

**Solution :**
```typescript
// Augmenter stale time pour données stables
const { data } = useQuery({
  queryKey: transparencyKeys.factors(profileId),
  queryFn: () => apiClient.getCalculationFactors(profileId),
  staleTime: 10 * 60 * 1000, // 10 minutes au lieu de 1
});
```

---

### Problème : Loading infini

**Cause :** Erreur silencieuse ou condition `enabled` incorrecte

**Solution :**
```typescript
// Vérifier les erreurs
const { data, isLoading, isError, error } = useQuery({
  queryKey: [...],
  queryFn: async () => {
    console.log('Fetching...');
    const result = await apiClient.getProfile(id);
    console.log('Result:', result);
    return result;
  },
});

// Vérifier condition enabled
const { data } = useQuery({
  queryKey: [...],
  queryFn: () => apiClient.getProfile(id),
  enabled: !!id, // ← Important !
});
```

---

### Problème : "Cannot read property 'entries' of undefined"

**Cause :** Accès à `data` avant qu'elle soit chargée

**Solution :**
```typescript
// ❌ MAUVAIS
const { data } = useAuditTrail({ indicatorId });
return <div>{data.entries.map(...)}</div>; // Crash si data = undefined

// ✅ BON
const { data, isLoading } = useAuditTrail({ indicatorId });
if (isLoading) return <Skeleton />;
return <div>{data.entries.map(...)}</div>;

// ✅ BON (avec optional chaining)
const { data } = useAuditTrail({ indicatorId });
const entries = data?.entries || [];
return <div>{entries.map(...)}</div>;
```

---

### Problème : Export ne fonctionne pas

**Cause :** URL de téléchargement expirée ou CORS

**Solution :**
```typescript
// Ouvrir l'URL immédiatement après réception
const handleExport = async (format) => {
  const result = await exportMutation.mutateAsync({ indicatorId, format });
  
  // ✅ Ouvrir immédiatement (signed URL expire après 1h)
  window.open(result.downloadUrl, '_blank');
};
```

---

### Problème : Audit trail ne se met pas à jour en temps réel

**Cause :** Cache React Query non invalidé

**Solution :**
```typescript
// Après chaque action, invalider audit trail
const handleUpdate = async () => {
  await apiClient.updateIndicator(id, updates);
  
  // ✅ Invalider audit trail
  queryClient.invalidateQueries({ queryKey: auditKeys.indicator(id) });
  queryClient.invalidateQueries({ queryKey: auditKeys.organization() });
};
```

---

## Ressources

### Documentation officielle
- [React Query Docs](https://tanstack.com/query/latest)
- [React Query Devtools](https://tanstack.com/query/latest/docs/react/devtools)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

### Fichiers clés
```
/src/hooks/
├── useTransparency.ts          # 15 hooks + 3 utilities
└── useAuditTrail.ts            # 8 hooks + 5 utilities

/src/app/components/
├── TransparencyModal.tsx       # 614 lignes
├── AuditTrail.tsx              # 234 lignes
└── AuditCenter.tsx             # 718 lignes

/src/services/
└── api.ts                      # 19 méthodes API

/docs/
├── PHASE_6_DAY1_SUMMARY.md     # Jour 1 : Hooks
├── PHASE_6_DAY2_SUMMARY.md     # Jour 2 : Composants
├── PHASE_6_DAY3_SUMMARY.md     # Jour 3 : AuditCenter
└── PHASE_6_TECHNICAL_GUIDE.md  # Ce guide
```

---

**Version :** 1.0.0  
**Dernière mise à jour :** 3 février 2026  
**Auteur :** Équipe Solvid.IA  
**Status :** ✅ Production Ready

Pour toute question, consulter les fichiers de documentation ou les exemples d'utilisation dans ce guide.
