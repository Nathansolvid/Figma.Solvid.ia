# 📁 Structure du Projet - Solvid.IA

> Vue d'ensemble complète de tous les fichiers et dossiers

---

## 🌳 Arborescence

```
solvid-ia/
│
├── 📄 README.md                           # Guide principal
├── 📄 QUICKSTART.md                       # Démarrage rapide (5 min)
├── 📄 CHANGELOG.md                        # Historique des modifications
├── 📄 PROJECT_STRUCTURE.md                # Ce fichier
├── 📄 package.json                        # Dépendances npm
│
├── 📚 Documentation/
│   ├── ARCHITECTURE.md                    # Architecture 3-tiers (10k mots)
│   ├── SETUP_GUIDE.md                     # Setup complet (6k mots)
│   ├── CODE_EXAMPLES.md                   # Exemples pratiques (5k mots)
│   │
│   ├── Phase 4/
│   │   ├── PHASE_4_STATUS.md              # Status implémentation (3k mots)
│   │   ├── PHASE_4_COMPLETE_SUMMARY.md    # Résumé PackView (4k mots)
│   │   ├── PHASE_4_EVIDENCE_VAULT_COMPLETE.md  # Evidence Vault (8k mots)
│   │   ├── PHASE_4_PDF_EXPORT_COMPLETE.md      # Export PDF (7k mots)
│   │   ├── PHASE_4_PERSISTENCE_COMPLETE.md     # Persistence (6k mots)
│   │   ├── PHASE_4_ZIP_EXPORT_COMPLETE.md      # Export ZIP (9k mots)
│   │   └── PHASE_4_FINAL_SUMMARY.md            # Résumé final (6k mots)
│   │
│   └── Total: 68,000 mots
│
├── src/
│   ├── app/
│   │   ├── App.tsx                        # Entry point
│   │   │
│   │   ├── components/
│   │   │   ├── views/
│   │   │   │   ├── PackView.tsx           # Vue principale d'un pack ⭐
│   │   │   │   ├── PacksView.tsx          # Liste des packs
│   │   │   │   └── EvidenceVaultSimple.tsx # Gestionnaire de preuves ⭐
│   │   │   │
│   │   │   ├── EvidenceUpload.tsx         # Upload zone drag-drop ⭐
│   │   │   ├── ExportZipModal.tsx         # Modal progression ZIP ⭐
│   │   │   │
│   │   │   └── ui/                        # Composants shadcn/ui
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── progress.tsx          # Barre de progression
│   │   │       ├── badge.tsx
│   │   │       ├── dropdown-menu.tsx
│   │   │       └── ... (40+ composants)
│   │   │
│   │   └── styles/
│   │       ├── theme.css                  # Tokens Tailwind v4
│   │       └── fonts.css                  # Imports fonts
│   │
│   ├── hooks/
│   │   └── useIndicatorUpdates.ts         # Hook updates avec debounce ⭐
│   │
│   ├── services/
│   │   ├── api.ts                         # Client API REST ⭐
│   │   └── supabase.ts                    # Client Supabase (Auth + Storage)
│   │
│   ├── utils/
│   │   ├── pdfExport.ts                   # Génération PDF ⭐
│   │   ├── zipExport.ts                   # Génération ZIP ⭐
│   │   └── supabase/
│   │       └── info.tsx                   # Config Supabase (projectId, keys)
│   │
│   ├── permissions.ts                     # RBAC (4 rôles, actions)
│   │
│   └── main.tsx                           # Entry point React
│
├── supabase/
│   └── functions/
│       └── server/
│           ├── index.tsx                  # Backend Hono server ⭐
│           └── kv_store.tsx               # Utilitaires KV Store (protected)
│
├── public/
│   └── ... (assets statiques)
│
└── config/
    ├── vite.config.ts                     # Config Vite
    └── tailwind.config.js                 # Config Tailwind v4 (si créé)
```

**⭐ = Fichiers clés de la Phase 4**

---

## 📂 Détails par Dossier

### `/` (Racine)

| Fichier | Description | Taille |
|---------|-------------|--------|
| `README.md` | Guide principal avec quick start, features, architecture | 3k mots |
| `QUICKSTART.md` | Démarrage en 5 minutes | 1.5k mots |
| `CHANGELOG.md` | Historique des versions | 2k mots |
| `PROJECT_STRUCTURE.md` | Ce fichier | 1k mots |
| `package.json` | Dépendances npm (React, TypeScript, jspdf, jszip, etc.) | - |

---

### `/src/app/components/views/`

Vue principale de l'application.

| Fichier | Description | Lignes | Status |
|---------|-------------|--------|--------|
| `PackView.tsx` | Vue complète d'un pack ESG avec checklist, KPIs, preuves, exports | ~700 | ✅ Phase 4 |
| `PacksView.tsx` | Liste de tous les packs avec recherche/filtres | ~400 | ✅ Phase 3 |
| `EvidenceVaultSimple.tsx` | Gestionnaire Evidence Vault (upload/download/delete) | ~600 | ✅ Phase 4 |

**PackView.tsx** - Fonctionnalités :
- Chargement pack via API (`apiClient.getPackFull()`)
- Loading/Error states
- Onglets : Checklist, KPIs, Preuves
- Boutons "Marquer fourni" avec persistence
- Modal commentaires
- Exports PDF et ZIP
- Score de complétude

**EvidenceVaultSimple.tsx** - Fonctionnalités :
- Liste des preuves avec recherche
- Upload drag-drop
- Download via signed URLs
- Delete avec confirmation
- Filtres par type/période
- Empty/Loading/Error states

---

### `/src/app/components/`

Composants réutilisables.

| Fichier | Description | Lignes | Status |
|---------|-------------|--------|--------|
| `EvidenceUpload.tsx` | Zone drag-drop pour upload fichiers | ~200 | ✅ Phase 4 |
| `ExportZipModal.tsx` | Modal progression export ZIP avec 4 étapes | ~150 | ✅ Phase 4 |

**EvidenceUpload.tsx** - Fonctionnalités :
- Drag-drop zone stylée
- Validation types (PDF, Excel, Images, CSV)
- Preview fichier sélectionné
- Progress pendant upload
- Toast notifications

**ExportZipModal.tsx** - Fonctionnalités :
- Progress bar animée (0-100%)
- 4 étapes visualisées (PDF, Preuves, ZIP, Download)
- Messages dynamiques
- Icons de status (Loader, CheckCircle, AlertCircle)
- Error state

---

### `/src/app/components/ui/`

Composants UI shadcn/ui (40+ composants).

**Essentiels** :
- `button.tsx` - Boutons (variants: default, outline, ghost, destructive)
- `card.tsx` - Cards avec header/content/footer
- `dialog.tsx` - Modals
- `dropdown-menu.tsx` - Menus déroulants
- `badge.tsx` - Badges de status
- `progress.tsx` - Barres de progression
- `tabs.tsx` - Onglets
- `table.tsx` - Tableaux

**Formulaires** :
- `input.tsx` - Champs texte
- `textarea.tsx` - Champs multi-lignes
- `checkbox.tsx` - Cases à cocher
- `select.tsx` - Listes déroulantes
- `switch.tsx` - Interrupteurs

**Autres** :
- `toast.tsx` / `sonner.tsx` - Notifications
- `alert.tsx` - Alertes
- `separator.tsx` - Séparateurs
- `scroll-area.tsx` - Zones scrollables
- ... et 30+ autres

**Total** : ~3,000 lignes de composants UI

---

### `/src/hooks/`

Hooks React personnalisés.

| Fichier | Description | Lignes | Status |
|---------|-------------|--------|--------|
| `useIndicatorUpdates.ts` | Hook pour updates indicators avec debounce | ~200 | ✅ Phase 4 |

**useIndicatorUpdates.ts** - API :
```typescript
const {
  markAsProvided,         // async (indicatorId)
  markAsMissing,          // async (indicatorId)
  updateComment,          // debounced (indicatorId, comment)
  updateCommentImmediate, // async (indicatorId, comment)
  updateValue,            // async (indicatorId, value)
  isUpdating,             // (indicatorId) => boolean
} = useIndicatorUpdates({
  onSuccess: () => {},
  onError: (error) => {},
  debounceMs: 1000,
});
```

---

### `/src/services/`

Services pour interactions backend.

| Fichier | Description | Lignes | Status |
|---------|-------------|--------|--------|
| `api.ts` | Client API REST complet | ~300 | ✅ Phase 4 |
| `supabase.ts` | Client Supabase (Auth + Storage) | ~50 | ✅ Phase 2 |

**api.ts** - Méthodes principales :

**Auth** :
- `signup(email, password, organizationName, role)`

**Packs** :
- `getPacks()` - Liste packs
- `createPack(name, type)` - Créer pack
- `getPack(id)` - Détails pack
- `getPackFull(id)` - Pack complet avec folders/indicators/evidence
- `updatePack(id, updates)` - Mettre à jour
- `deletePack(id)` - Supprimer

**Indicators** :
- `updateIndicator(id, updates)` - Mettre à jour (status, comment, value)

**Evidence** :
- `initStorage()` - Initialiser bucket
- `uploadEvidence(file, indicatorId)` - Upload fichier
- `downloadEvidence(evidenceId)` - Signed URL download
- `getEvidenceDownloadUrl(evidenceId)` - Alias
- `deleteEvidence(evidenceId)` - Supprimer
- `listEvidence(indicatorId)` - Liste preuves

---

### `/src/utils/`

Utilitaires réutilisables.

| Fichier | Description | Lignes | Status |
|---------|-------------|--------|--------|
| `pdfExport.ts` | Génération PDF professionnelle (jspdf + autotable) | ~400 | ✅ Phase 4 |
| `zipExport.ts` | Génération ZIP (PDF + preuves) avec progress | ~400 | ✅ Phase 4 |
| `supabase/info.tsx` | Config Supabase (projectId, publicAnonKey) | ~10 | ✅ Phase 1 |

**pdfExport.ts** - Fonction principale :
```typescript
export async function exportPackToPDF(pack: Pack): Promise<void>
```

Génère :
- Cover page avec branding
- Section 1 : Checklist (tableaux)
- Section 2 : KPIs (tableaux)
- Section 3 : Preuves (tableaux)
- Footer automatique

**zipExport.ts** - Fonction principale :
```typescript
export async function exportPackToZIP(
  pack: Pack,
  organizationName?: string,
  onProgress?: (progress: number, message: string) => void
): Promise<void>
```

Génère :
- PDF en mémoire
- Download toutes les preuves (parallèle)
- README.txt
- Compression DEFLATE level 6

---

### `/src/permissions.ts`

Système RBAC complet.

**Rôles** :
```typescript
enum Role {
  CLIENT = 'CLIENT',
  CONSULTANT = 'CONSULTANT',
  DIRECTEUR_ESG = 'DIRECTEUR_ESG',
  AUDITEUR = 'AUDITEUR',
}
```

**Actions** :
```typescript
enum Action {
  CREATE_PACK,
  VIEW_PACK,
  EDIT_PACK,
  DELETE_PACK,
  MARK_READY_FOR_REVIEW,
  APPROVE_PACK,
  REJECT_PACK,
  // ... 10+ actions
}
```

**API** :
```typescript
can(role: Role, action: Action): boolean
```

---

### `/supabase/functions/server/`

Backend Hono server.

| Fichier | Description | Lignes | Status |
|---------|-------------|--------|--------|
| `index.tsx` | Serveur Hono avec toutes les routes | ~1,200 | ✅ Phase 4 |
| `kv_store.tsx` | Utilitaires KV Store (protected, ne pas modifier) | ~100 | ✅ Phase 1 |

**index.tsx** - Routes :

**Auth** :
- `POST /signup` - Créer user

**Packs** :
- `GET /packs` - Liste
- `POST /packs` - Créer
- `GET /packs/:id` - Détails
- `GET /packs/:id/full` - Complet (optimisé)
- `PUT /packs/:id` - Mettre à jour
- `DELETE /packs/:id` - Supprimer

**Folders** :
- `POST /packs/:id/folders` - Ajouter
- `PUT /folders/:id` - Mettre à jour
- `DELETE /folders/:id` - Supprimer

**Indicators** :
- `POST /folders/:id/indicators` - Ajouter
- `PUT /indicators/:id` - Mettre à jour ⭐
- `DELETE /indicators/:id` - Supprimer
- `GET /indicators/:id/evidence` - Liste preuves

**Evidence** :
- `POST /storage/init` - Initialiser bucket ⭐
- `POST /evidence/upload` - Upload fichier ⭐
- `GET /evidence/:id/download` - Signed URL ⭐
- `DELETE /evidence/:id` - Supprimer ⭐

**Middleware** :
- `requireAuth` - Validation JWT

---

## 📦 Dépendances (package.json)

### Production

**Core** :
- `react@18.3.1`
- `react-dom@18.3.1`
- `typescript` (via vite)

**UI** :
- `@radix-ui/*` (40+ composants primitives)
- `lucide-react@0.487.0` (icons)
- `sonner@2.0.3` (toasts)
- `tailwindcss@4.1.12`

**PDF/ZIP** :
- `jspdf@2.5.2` ⭐
- `jspdf-autotable@3.8.4` ⭐
- `jszip@3.10.1` ⭐

**Parsing** :
- `papaparse@5.5.3` (CSV)
- `xlsx@0.18.5` (Excel)

**Autres** :
- `date-fns@3.6.0` (dates)
- `motion@12.23.24` (animations)
- `react-hook-form@7.55.0` (formulaires)

### Dev

- `vite@6.3.5`
- `@vitejs/plugin-react@4.7.0`
- `@tailwindcss/vite@4.1.12`

**Total** : 60+ dépendances

---

## 📊 Statistiques du Projet

### Code

| Type | Fichiers | Lignes | Mots |
|------|----------|--------|------|
| TypeScript/TSX | ~50 | ~8,000 | ~40k |
| CSS | ~5 | ~500 | ~2k |
| JSON | ~2 | ~100 | ~500 |
| **Total Code** | **~57** | **~8,600** | **~42.5k** |

### Documentation

| Document | Mots |
|----------|------|
| ARCHITECTURE.md | 10,000 |
| SETUP_GUIDE.md | 6,000 |
| CODE_EXAMPLES.md | 5,000 |
| PHASE_4_STATUS.md | 3,000 |
| PHASE_4_COMPLETE_SUMMARY.md | 4,000 |
| PHASE_4_EVIDENCE_VAULT_COMPLETE.md | 8,000 |
| PHASE_4_PDF_EXPORT_COMPLETE.md | 7,000 |
| PHASE_4_PERSISTENCE_COMPLETE.md | 6,000 |
| PHASE_4_ZIP_EXPORT_COMPLETE.md | 9,000 |
| PHASE_4_FINAL_SUMMARY.md | 6,000 |
| README.md | 3,000 |
| QUICKSTART.md | 1,500 |
| CHANGELOG.md | 2,000 |
| PROJECT_STRUCTURE.md | 1,000 |
| **Total Documentation** | **71,500** |

### Totaux

- **Code** : ~8,600 lignes
- **Documentation** : ~71,500 mots
- **Ratio Doc/Code** : 8.3 mots/ligne (très bien documenté ✅)

---

## 🔑 Fichiers Clés par Feature

### 1. Evidence Vault

**Backend** :
- `supabase/functions/server/index.tsx` (routes Storage)

**Frontend** :
- `src/app/components/EvidenceUpload.tsx` (upload zone)
- `src/app/components/views/EvidenceVaultSimple.tsx` (gestionnaire)
- `src/services/api.ts` (méthodes API)

**Total** : ~1,000 lignes

---

### 2. Export PDF

**Files** :
- `src/utils/pdfExport.ts` (génération PDF)
- `src/app/components/views/PackView.tsx` (handler)

**Total** : ~450 lignes

---

### 3. Export ZIP

**Files** :
- `src/utils/zipExport.ts` (génération ZIP)
- `src/app/components/ExportZipModal.tsx` (modal progression)
- `src/app/components/views/PackView.tsx` (handler)

**Total** : ~600 lignes

---

### 4. Persistence Updates

**Files** :
- `src/hooks/useIndicatorUpdates.ts` (hook)
- `src/app/components/views/PackView.tsx` (integration)
- `supabase/functions/server/index.tsx` (route PUT)

**Total** : ~400 lignes

---

## 🛡️ Fichiers Protégés (Ne PAS Modifier)

Ces fichiers sont gérés par le système Figma Make :

- `/src/app/components/figma/ImageWithFallback.tsx`
- `/pnpm-lock.yaml`
- `/supabase/functions/server/kv_store.tsx` ⚠️
- `/utils/supabase/info.tsx` (sauf projectId/keys)

**Modification** = risque de casser l'application

---

## 📝 Conventions de Nommage

### Fichiers

- **Composants React** : `PascalCase.tsx` (ex: `PackView.tsx`)
- **Hooks** : `useCamelCase.ts` (ex: `useIndicatorUpdates.ts`)
- **Utils** : `camelCase.ts` (ex: `pdfExport.ts`)
- **Styles** : `kebab-case.css` (ex: `theme.css`)

### Variables

- **Composants** : `PascalCase` (ex: `PackView`)
- **Fonctions** : `camelCase` (ex: `exportPackToPDF`)
- **Constantes** : `UPPER_SNAKE_CASE` (ex: `API_BASE_URL`)
- **Types** : `PascalCase` (ex: `Pack`, `Indicator`)

---

## 🚀 Fichiers Créés en Phase 4

**Backend** :
- Routes Evidence Vault (dans `index.tsx`)
- Route `GET /packs/:id/full` (dans `index.tsx`)
- Route `PUT /indicators/:id` (dans `index.tsx`)

**Frontend** :
- `src/app/components/EvidenceUpload.tsx` ✨
- `src/app/components/views/EvidenceVaultSimple.tsx` ✨
- `src/app/components/ExportZipModal.tsx` ✨
- `src/hooks/useIndicatorUpdates.ts` ✨
- `src/utils/pdfExport.ts` ✨
- `src/utils/zipExport.ts` ✨

**Documentation** :
- `ARCHITECTURE.md` ✨
- `SETUP_GUIDE.md` ✨
- `CODE_EXAMPLES.md` ✨
- `PHASE_4_STATUS.md` ✨
- `PHASE_4_COMPLETE_SUMMARY.md` ✨
- `PHASE_4_EVIDENCE_VAULT_COMPLETE.md` ✨
- `PHASE_4_PDF_EXPORT_COMPLETE.md` ✨
- `PHASE_4_PERSISTENCE_COMPLETE.md` ✨
- `PHASE_4_ZIP_EXPORT_COMPLETE.md` ✨
- `PHASE_4_FINAL_SUMMARY.md` ✨
- `README.md` (réécriture) ✨
- `QUICKSTART.md` ✨
- `CHANGELOG.md` ✨
- `PROJECT_STRUCTURE.md` (ce fichier) ✨

**Total Phase 4** : 6 fichiers code + 14 fichiers documentation = **20 fichiers**

---

## 📍 Navigation Rapide

**Pour démarrer** :
1. `README.md` - Vue d'ensemble
2. `QUICKSTART.md` - 5 minutes pour lancer

**Pour setup** :
1. `SETUP_GUIDE.md` - 12 étapes détaillées

**Pour comprendre le code** :
1. `ARCHITECTURE.md` - Architecture complète
2. `CODE_EXAMPLES.md` - Exemples pratiques

**Pour voir les features** :
1. `PHASE_4_FINAL_SUMMARY.md` - Résumé complet

**Pour contribuer** :
1. `ARCHITECTURE.md` - Conventions
2. `PROJECT_STRUCTURE.md` (ce fichier) - Structure
3. `CHANGELOG.md` - Historique

---

**Dernière mise à jour** : 31 janvier 2025  
**Version** : 1.0.0 (Phase 4 Complete)
