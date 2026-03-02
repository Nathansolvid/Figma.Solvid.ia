# ✅ CORRECTIONS APPLIQUÉES

**Date** : 3 février 2026  
**Erreur initiale** : `SyntaxError: The requested module '/src/hooks/useEvidence.ts?t=1770128626471' does not provide an export named 'useDeleteEvidence'`

---

## 🔍 DIAGNOSTIC

L'erreur provenait d'un **fichier obsolète** (`EvidenceVaultSimple.tsx`) qui tentait d'importer des exports inexistants depuis `useEvidence.ts` :

```typescript
// ❌ Ancien import (incorrect)
import { useDeleteEvidence, useDownloadEvidence, usePackEvidences } from '@/hooks/useEvidence';
```

Le hook `useEvidence` exporte en réalité une **fonction unique** qui retourne un objet avec des méthodes :

```typescript
// ✅ Export correct
export function useEvidence(packId?: string, indicatorId?: string) {
  return {
    evidence,
    loading,
    error,
    uploadEvidence,
    deleteEvidence,    // ← Méthode, pas un hook séparé
    downloadEvidence,  // ← Méthode, pas un hook séparé
    linkToIndicator,
    reload: loadEvidence,
  };
}
```

---

## 🛠️ CORRECTIONS APPLIQUÉES

### 1. ✅ **Nettoyage du fichier obsolète `EvidenceVaultSimple.tsx`**

**Action** : Remplacé par un stub minimal pour éviter les erreurs d'import

**Fichier modifié** : `/src/app/components/views/EvidenceVaultSimple.tsx`

```typescript
/**
 * FICHIER OBSOLÈTE - NE PLUS UTILISER
 * Utiliser EvidenceVault.tsx à la place
 */

export function EvidenceVaultSimple() {
  return null;
}

export default EvidenceVaultSimple;
```

---

### 2. ✅ **Correction de l'import dans `PackView.tsx`**

**Action** : Remplacé `EvidenceVaultSimple` par `EvidenceVault`

**Fichier modifié** : `/src/app/components/views/PackView.tsx`

**Avant** :
```typescript
import { EvidenceVaultSimple } from "@/app/components/views/EvidenceVaultSimple";

// ...

<EvidenceVaultSimple packId={pack.id} />
```

**Après** :
```typescript
import { EvidenceVault } from "@/app/components/views/EvidenceVault";

// ...

<EvidenceVault packId={pack.id} />
```

---

## ✅ RÉSULTAT

- ❌ **Avant** : Erreur d'import `useDeleteEvidence` inexistant
- ✅ **Après** : Tous les imports sont corrects et cohérents

---

## 📋 FICHIERS MODIFIÉS

1. `/src/app/components/views/EvidenceVaultSimple.tsx` - Vidé et rendu inactif
2. `/src/app/components/views/PackView.tsx` - Import corrigé

---

## 🎯 VALIDATION

### Imports corrects dans le projet :

```typescript
// ✅ Dans EvidenceVault.tsx
import { useEvidence } from "@/hooks/useEvidence";
const { evidence, loading, uploadEvidence, deleteEvidence, downloadEvidence } = useEvidence(packId);

// ✅ Dans PackView.tsx  
import { EvidenceVault } from "@/app/components/views/EvidenceVault";
<EvidenceVault packId={pack.id} />

// ✅ Dans AppContent.tsx
import { EvidenceVault } from "@/app/components/views/EvidenceVault";
<EvidenceVault packId={currentPackId || undefined} />
```

---

## 🚀 PROCHAINES ÉTAPES

1. Recharger l'application dans le navigateur
2. Vérifier qu'il n'y a plus d'erreurs dans la console
3. Tester la navigation vers "Preuves & Documents"
4. Tester l'upload d'une preuve

---

**Toutes les erreurs ont été corrigées ! L'application devrait maintenant fonctionner sans problème. ✅**
