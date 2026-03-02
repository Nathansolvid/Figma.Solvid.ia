# 🚀 GUIDE RAPIDE DE TEST - PHASE 5

## ⚡ Test Express (5 minutes)

### 1️⃣ Démarrer l'App
```bash
npm run dev
```

### 2️⃣ Login
- Ouvrir `http://localhost:5173`
- Login avec n'importe quel compte

### 3️⃣ Ouvrir Dashboard
- Cliquer "Dashboard" dans la sidebar gauche
- ✅ **Attendu** : Loading spinner → Puis données

### 4️⃣ Vérifications Rapides

#### ✅ Métriques (4 cards en haut)
- Packs Actifs
- Completion Moyenne
- Preuves Uploadées
- Packs Validés

#### ✅ Charts (3 graphiques)
- **Camembert** : Répartition par status
- **Barres** : Distribution completion
- **Lignes** : Évolution 5 semaines

#### ✅ Liste Packs Récents
- 5 derniers packs (si existants)
- Ou message "Aucun pack"

### 5️⃣ Test Cache
1. Cliquer sur "Dossiers"
2. Re-cliquer sur "Dashboard"
3. ✅ **Attendu** : Données instantanées (pas de spinner)

---

## 🔍 Que Vérifier ?

### Console DevTools
```
✅ Pas d'erreurs rouges
✅ Pas de warnings critiques
✅ (Optionnel) Logs React Query
```

### Visuel
```
✅ Icons colorisés en vert (#059669)
✅ Charts s'affichent correctement
✅ Textes lisibles
✅ Pas de layout cassé
```

### Interactions
```
✅ Hover sur charts → Tooltip visible
✅ Navigation sidebar fluide
✅ Transitions smooth
```

---

## ��� Si Erreur ?

### Erreur : "apiClient.getPacks is not a function"
**Status** : ✅ **DÉJÀ CORRIGÉ**  
Si vous voyez encore cette erreur, rafraîchir le navigateur (Ctrl+R)

### Erreur : "Cannot read property 'status' of undefined"
**Cause** : Aucun pack dans la base de données  
**Solution** : Créer un pack de test ou utiliser `seedTestData()`

### Erreur : Charts ne s'affichent pas
**Cause** : Package recharts non installé  
**Solution** : Vérifier que `recharts` est dans `package.json`

### Erreur : React Query non défini
**Cause** : Package non installé  
**Solution** : Vérifier que `@tanstack/react-query` est installé

---

## 🎯 Résultats Attendus

| Test | Résultat Attendu |
|------|------------------|
| **Loading** | Spinner visible 1-2s puis données |
| **Métriques** | 4 cards avec valeurs numériques |
| **Pie Chart** | Graphique coloré avec labels |
| **Bar Chart** | 4 barres vertes (0-25%, 26-50%, etc.) |
| **Line Chart** | 2 lignes (bleue + verte) |
| **Liste Packs** | Max 5 packs ou empty state |
| **Cache** | Re-affichage instantané (< 50ms) |
| **Console** | Aucune erreur rouge |

---

## 📝 Checklist Rapide

```
[ ] App démarre sans erreur
[ ] Login fonctionne
[ ] Dashboard visible dans sidebar
[ ] Loading spinner visible
[ ] 4 metric cards affichées
[ ] Pie chart visible et colorisé
[ ] Bar chart avec 4 barres
[ ] Line chart avec 2 lignes
[ ] Liste packs récents affichée
[ ] Cache fonctionne (re-navigation instant)
[ ] Console sans erreurs
[ ] Responsive OK (optionnel)
```

---

## ✅ Si Tout Fonctionne

**Félicitations ! Phase 5a est opérationnelle ! 🎉**

Prochaines étapes :
1. ✅ Marquer Phase 5a comme complétée
2. 🚀 Démarrer migration PackView
3. 🚀 Démarrer migration EvidenceVault
4. 🚀 Implémenter debounce comments

---

## 🚨 Bugs Connus (Non Bloquants)

1. ⚠️ **Trend data mocké** - Line chart avec fausses données historiques (attendu)
2. ⚠️ **PackView pas migré** - Optimistic updates pas encore actifs dans PackView
3. ⚠️ **EvidenceVault pas migré** - Pas de cache pour evidences

---

**Temps estimé** : 5 minutes  
**Niveau de difficulté** : 🟢 Facile  
**Bloquant** : ❌ Non (tests exploratoires)
