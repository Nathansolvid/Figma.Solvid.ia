# Phase 6 - Vérification Rapide
## Guide de Vérification en 5 Minutes

---

## 🚀 Démarrage Rapide

### 1. Vérifier que l'application démarre
```bash
npm run dev
# ou
pnpm dev
```

**Attendu:** Le serveur démarre sur http://localhost:5173 sans erreurs

---

## 🔍 Tests Visuels Rapides

### 2. Test TransparencyModal (30 secondes)
1. Naviguer vers "Phase 6 Demo" dans la sidebar
2. Cliquer sur l'onglet "TransparencyModal"
3. Cliquer sur le premier indicateur "Émissions GES Scope 1"
4. **VÉRIFIER:** Le modal s'ouvre sans erreur

✅ **Succès:** Modal ouvert avec 4 onglets visibles  
❌ **Échec:** Erreur `React.Children.only expected to receive a single React element child`

---

### 3. Test AuditCenter (30 secondes)
1. Rester sur "Phase 6 Demo"
2. Cliquer sur l'onglet "AuditCenter"
3. Cliquer sur le bouton "Exporter" (avec icône Download)
4. Sélectionner "PDF" dans le dropdown
5. **VÉRIFIER:** L'export démarre (toast de succès)

✅ **Succès:** Export démarre, toast de succès  
❌ **Échec:** Erreur `React.Children.only` ou dropdown ne s'ouvre pas

---

### 4. Test CalculationTransparency (30 secondes)
1. Aller sur "Dashboard" ou "Données ESG"
2. Trouver un indicateur avec l'icône "i" (bulle bleue-verte)
3. Cliquer sur l'icône "i"
4. **VÉRIFIER:** Le Sheet (panneau latéral) s'ouvre

✅ **Succès:** Sheet ouvert avec 5 onglets  
❌ **Échec:** Erreur `React.Children.only` ou rien ne se passe

---

## 🐛 Vérification Console (30 secondes)

### 5. Ouvrir la Console Développeur
1. Appuyer sur **F12** (ou Cmd+Option+I sur Mac)
2. Aller dans l'onglet "Console"
3. Rafraîchir la page (Ctrl+R ou Cmd+R)
4. **VÉRIFIER:** Aucune erreur rouge

✅ **Succès:** Console propre, possibles logs bleus/gris informatifs  
❌ **Échec:** Erreurs rouges, particulièrement `React.Children.only`

---

## 📊 Checklist Ultra-Rapide

| Test | Durée | Résultat |
|------|-------|----------|
| App démarre | 10s | [ ] ✅ / [ ] ❌ |
| TransparencyModal | 30s | [ ] ✅ / [ ] ❌ |
| AuditCenter Export | 30s | [ ] ✅ / [ ] ❌ |
| CalculationTransparency | 30s | [ ] ✅ / [ ] ❌ |
| Console propre | 30s | [ ] ✅ / [ ] ❌ |
| **TOTAL** | **~2min** | **[ ] VALIDÉ** |

---

## 🔧 Commandes de Debug

### Si Erreur React.Children.only

1. **Identifier le composant:**
```
Regarder la stack trace dans la console:
  at Children.only
  at SelectTrigger (ou TabsTrigger, SheetTrigger, etc.)
  at AuditCenter.tsx:168  ← LIGNE PROBLÉMATIQUE
```

2. **Vérifier les corrections appliquées:**
```bash
# Ouvrir le fichier de corrections
cat PHASE_6_CORRECTIONS_FINALES.md
```

3. **Pattern à chercher:**
```tsx
// ❌ INCORRECT - Plusieurs enfants non-wrappés
<SelectTrigger asChild>
  <Button>
    {condition ? <Icon1 /> : <Icon2 />}
    Text
  </Button>
</SelectTrigger>

// ✅ CORRECT - Enfants wrappés dans un div
<SelectTrigger className="...">
  <div>
    {condition ? <Icon1 /> : <Icon2 />}
    <span>Text</span>
  </div>
</SelectTrigger>
```

---

## 🎯 Diagnostic API (si données ne chargent pas)

### Vérifier les Endpoints
Dans la console, chercher:
```
🌐 API Request: { endpoint: '/calculation-summary/...' }
✅ Authorization header set with publicAnonKey (Phase 6 route)
```

### Test Manuel
```bash
# Ouvrir la console dans le navigateur et taper:
apiClient.diagnoseJWT()

# Résultat attendu:
# ✅✅✅ JWT IS VALID! ✅✅✅
```

---

## 📝 Fichiers Modifiés (Référence)

Si besoin de vérifier les corrections:

1. **AuditCenter.tsx** (ligne 168)
   - SelectTrigger avec asChild → sans asChild

2. **TransparencyModal.tsx** (lignes 27-37)
   - Props `open` → `isOpen`
   - Ajout prop `indicatorName`

3. **CalculationTransparency.tsx** (lignes 150-176)
   - SheetTrigger conditionnel → deux SheetTrigger séparés

---

## 🚨 Alertes Critiques

### ⚠️ NE PAS IGNORER
- ❌ Erreurs rouges dans la console
- ❌ Messages `React.Children.only`
- ❌ Requêtes API en échec (status 500)
- ❌ Modal/Sheet qui ne s'ouvre pas

### ✅ PEUT ÊTRE IGNORÉ
- ⚠️ Warnings jaunes React DevTools (hot reload)
- ℹ️ Logs bleus informatifs API
- 📊 Messages "React Query devtools"

---

## 🎉 Confirmation de Succès

### Vous êtes prêt quand:
- [x] Les 5 tests rapides passent ✅
- [x] Console sans erreurs rouges ✅
- [x] Tous les modals/sheets s'ouvrent ✅
- [x] Export fonctionne ✅
- [x] Navigation fluide entre onglets ✅

---

## 📞 Aide Supplémentaire

### Fichiers de Référence
- `/PHASE_6_CORRECTIONS_FINALES.md` → Détails des corrections
- `/PHASE_6_TEST_CHECKLIST.md` → Tests complets
- `/PHASE_6_COMPLETION_CERTIFICATE.md` → État de la Phase 6

### Logs API
Pour voir tous les logs API, dans la console:
```javascript
// Activer les logs détaillés
localStorage.setItem('debug', 'true');

// Désactiver
localStorage.removeItem('debug');
```

---

**Date:** 31 janvier 2026  
**Version:** 1.0  
**Statut:** ✅ Prêt pour tests
