# Phase 6 - Checklist de Tests
## Date: 31 janvier 2026

## 🎯 Objectif
Valider le bon fonctionnement de tous les composants Phase 6 après corrections.

---

## ✅ Tests à Effectuer

### 1. Navigation et Accès
- [ ] Accéder à l'application via le navigateur
- [ ] Se connecter avec les identifiants de test
- [ ] Naviguer vers "Phase 6 Demo" dans la sidebar
- [ ] Vérifier que la page se charge sans erreurs console

**Critères de succès:**
- Aucune erreur dans la console du navigateur
- Page affichée avec le header "Phase 6 - Démonstration"
- 4 onglets visibles: Introduction, TransparencyModal, AuditTrail, AuditCenter

---

### 2. Onglet Introduction
- [ ] Vérifier l'affichage des 3 cards de présentation
- [ ] Vérifier les badges "100% Complétée", "3 Composants", "23 Hooks React Query", "19 Endpoints API"
- [ ] Vérifier la card "Statistiques Phase 6" avec les 4 métriques
- [ ] Cliquer sur les boutons "Voir la démo" de chaque card

**Critères de succès:**
- Toutes les informations sont affichées correctement
- Les boutons "Voir la démo" changent d'onglet correctement
- Aucune erreur dans la console

---

### 3. TransparencyModal
- [ ] Cliquer sur l'onglet "TransparencyModal"
- [ ] Vérifier l'affichage des 3 cards d'indicateurs
- [ ] Cliquer sur le premier indicateur (Émissions GES Scope 1)
- [ ] Vérifier l'ouverture du modal
- [ ] Vérifier les 4 onglets du modal:
  - [ ] **Calcul**: Méthode, formule, étapes, hypothèses, limites
  - [ ] **Sources**: Tableau des données sources
  - [ ] **Facteurs**: Liste des facteurs de calcul
  - [ ] **Historique**: Audit trail de l'indicateur
- [ ] Tester les boutons d'export (PDF, Excel, JSON)
- [ ] Fermer le modal avec le bouton X
- [ ] Tester avec les 2 autres indicateurs

**Critères de succès:**
- Modal s'ouvre sans erreur React.Children.only ✅
- Tous les onglets sont accessibles
- Les données sont affichées correctement
- Le bouton de fermeture fonctionne
- Aucune erreur dans la console

---

### 4. AuditTrail
- [ ] Cliquer sur l'onglet "AuditTrail"
- [ ] Section "Audit Trail - Indicateur":
  - [ ] Sélectionner un indicateur dans la liste
  - [ ] Vérifier l'affichage de la timeline
  - [ ] Vérifier les badges colorés pour chaque action
  - [ ] Vérifier les timestamps relatifs
  - [ ] Vérifier l'affichage des anciennes/nouvelles valeurs
- [ ] Section "Audit Trail - Pack":
  - [ ] Sélectionner un pack dans la liste
  - [ ] Vérifier l'affichage de la timeline
  - [ ] Vérifier que les données sont différentes de l'indicateur

**Critères de succès:**
- Timeline s'affiche correctement
- Les badges sont colorés selon le type d'action
- Les timestamps sont formatés (ex: "Il y a 2h")
- Les diffs ancien → nouveau sont visibles
- Le scroll fonctionne si plus de 5 entrées

---

### 5. AuditCenter
- [ ] Cliquer sur l'onglet "AuditCenter"
- [ ] Vérifier l'affichage des 4 KPI cards en haut:
  - [ ] Total d'entrées
  - [ ] Validations
  - [ ] Modifications
  - [ ] Utilisateurs actifs
- [ ] Tester les filtres:
  - [ ] **Recherche**: Taper un nom d'utilisateur
  - [ ] **Date Range**: Changer entre "Aujourd'hui", "7 derniers jours", "30 derniers jours", "Tout"
  - [ ] **Type d'action**: Filtrer par "Créations", "Modifications", "Validations", etc.
  - [ ] **Type d'entité**: Filtrer par "Indicateurs", "Packs", "Preuves", "Dossiers"
- [ ] Vérifier les badges de filtres actifs en dessous
- [ ] Tester le bouton "Exporter":
  - [ ] Sélectionner "PDF" → Vérifier que l'export démarre ✅
  - [ ] Sélectionner "CSV" → Vérifier que l'export démarre
  - [ ] Sélectionner "JSON" → Vérifier que l'export démarre
- [ ] Tester le bouton "Actualiser"
- [ ] Vérifier l'onglet "Timeline":
  - [ ] Liste des entrées d'audit
  - [ ] Badges colorés pour actions et types d'entités
  - [ ] Affichage des anciennes/nouvelles valeurs
  - [ ] Bouton "Charger plus" si applicable
- [ ] Vérifier l'onglet "Statistiques":
  - [ ] Actions par type (avec pourcentages)
  - [ ] Activité par type d'entité (avec pourcentages)
  - [ ] Utilisateurs les plus actifs (top 5)
  - [ ] Entités les plus modifiées (top 5)

**Critères de succès:**
- SelectTrigger "Exporter" fonctionne sans erreur React.Children.only ✅
- Tous les filtres sont fonctionnels
- Les statistiques sont calculées correctement
- Le bouton "Charger plus" charge les entrées suivantes
- Aucune erreur dans la console

---

## 🐛 Tests de Régression

### CalculationTransparency
- [ ] Aller dans "Dashboard" ou "Données ESG"
- [ ] Trouver un indicateur avec l'icône "i" de transparence
- [ ] Cliquer sur l'icône "i"
- [ ] Vérifier que le Sheet s'ouvre correctement
- [ ] Vérifier que les 5 onglets fonctionnent (Vue d'ensemble, Méthode, Données, Facteurs, Audit)
- [ ] Tester avec variant="button" si disponible

**Critères de succès:**
- Sheet s'ouvre sans erreur React.Children.only ✅
- Les deux variantes (icon et button) fonctionnent
- Tous les onglets sont accessibles

---

## 📊 Tests de Performance

### Chargement Initial
- [ ] Mesurer le temps de chargement de la page Phase6Demo
- [ ] Vérifier qu'il n'y a pas de requêtes API en échec
- [ ] Vérifier que React Query cache les données correctement

**Critères de succès:**
- Chargement < 2 secondes
- Aucune requête en échec (status 500)
- Les données en cache ne sont pas rechargées inutilement

### Navigation entre Onglets
- [ ] Naviguer rapidement entre les 4 onglets de Phase6Demo
- [ ] Vérifier qu'il n'y a pas de lag
- [ ] Vérifier que les composants se montent/démontent correctement

**Critères de succès:**
- Navigation fluide (< 200ms)
- Aucune erreur de montage/démontage

---

## 🔍 Tests de Console

### Vérifications Console
- [ ] Ouvrir la console du navigateur (F12)
- [ ] Vérifier qu'il n'y a AUCUNE erreur rouge
- [ ] Vérifier qu'il n'y a pas d'avertissements React critiques
- [ ] Les logs API doivent montrer:
  ```
  🌐 API Request: { endpoint: '...', hasToken: true/false }
  ✅ Authorization header set...
  ```

**Critères de succès:**
- ❌ **0 erreurs** dans la console
- ⚠️ **0 warnings critiques** (warnings mineurs acceptables)
- ✅ Tous les logs API sont corrects

---

## 📝 Tests d'Intégration

### Workflow Complet
1. [ ] Se connecter en tant que CLIENT
2. [ ] Aller sur Phase6Demo
3. [ ] Tester TransparencyModal sur les 3 indicateurs
4. [ ] Tester AuditTrail sur 2 indicateurs et 1 pack
5. [ ] Aller sur AuditCenter
6. [ ] Appliquer 3 filtres différents
7. [ ] Exporter en PDF
8. [ ] Se déconnecter

**Critères de succès:**
- Workflow complet sans aucune erreur
- Toutes les fonctionnalités accessibles
- Export PDF réussi

---

## 🎯 Résultat Attendu

### Checklist Globale
- [ ] ✅ Tous les tests passent
- [ ] ✅ Aucune erreur React.Children.only
- [ ] ✅ Aucune erreur dans la console
- [ ] ✅ Toutes les fonctionnalités sont accessibles
- [ ] ✅ Les performances sont acceptables
- [ ] ✅ L'expérience utilisateur est fluide

### Statut Final: **[ ] VALIDÉ** / **[ ] À CORRIGER**

---

## 📞 En Cas de Problème

### Démarche de Debugging
1. Ouvrir la console (F12)
2. Noter l'erreur exacte
3. Identifier le composant en erreur
4. Vérifier les props passées au composant
5. Vérifier l'utilisation de `asChild`
6. Consulter `/PHASE_6_CORRECTIONS_FINALES.md` pour les patterns corrects

### Erreurs Connues (Corrigées)
- ✅ `React.Children.only` dans AuditCenter → SelectTrigger
- ✅ `React.Children.only` dans CalculationTransparency → SheetTrigger
- ✅ Incohérence des props dans TransparencyModal

---

**Testeur:** ___________________  
**Date:** ___________________  
**Durée des tests:** ___________________  
**Nombre d'anomalies trouvées:** ___________________  
**Statut:** ___________________  

---

**Signature:**

Client: ___________________  
Consultant: ___________________  
Développeur: ___________________
