# 🚀 QUICK START - PHASE 9 : EXPORTS & LIVRABLES

## Guide de test rapide pour les exports Solvid.IA

---

## 🎯 Accès rapide

### Où trouver la fonctionnalité ?
1. Ouvrir Solvid.IA
2. Navigation → **Exports & Livrables** (onglet dans le menu)
3. Vous êtes sur la page d'exports !

---

## ✅ TEST 1 : Générer votre premier export

### Étapes
1. **Sélectionnez le format** :
   - PDF (rapport lisible)
   - JSON (données structurées)
   - Excel/CSV (tableur)
   - ⭐ **ZIP (tous les formats)** ← Recommandé pour premier test

2. **Sélectionnez le périmètre** :
   - ⭐ **Export complet** ← Recommandé

3. **Filtres (optionnel)** :
   - Catégorie : Toutes (E, S, G)

4. **Options avancées** :
   - ☑️ Inclure transparence des calculs
   - ☑️ Inclure audit trail
   - ☑️ Inclure preuves
   - ☑️ Inclure détails de calcul

5. **Cliquez sur "Générer l'export"**

### Résultat attendu
✅ Toast "Génération de l'export..."  
✅ Toast "Export généré avec succès !"  
✅ **Téléchargement automatique du fichier ZIP**  
✅ Export ajouté à l'historique  

---

## ✅ TEST 2 : Explorer le fichier ZIP téléchargé

### Contenu du ZIP
Ouvrez le fichier ZIP téléchargé (ex: `ESG_Export_2026-02-03.zip`)

Vous devriez trouver :
```
📁 ESG_Export/
  ├── 📄 rapport.pdf        ← Rapport complet
  ├── 📊 export.csv         ← Données Excel
  ├── 📁 donnees.json       ← Données API
  └── 📝 README.txt         ← Documentation
```

### Vérifications
✅ `rapport.pdf` s'ouvre correctement  
✅ `export.csv` s'ouvre dans Excel  
✅ `donnees.json` contient vos indicateurs  
✅ `README.txt` explique le contenu  

---

## ✅ TEST 3 : Consulter l'historique

### Étapes
1. Sur la page Exports & Livrables
2. Scrollez vers le bas
3. Section "Historique des Exports"

### Vérifications
✅ Votre export apparaît dans la liste  
✅ Format affiché : "PDF + JSON + Excel" (si ZIP)  
✅ Taille affichée : "X MB"  
✅ Date affichée : "Il y a X min"  
✅ Statut : Badge vert "Terminé" ✓  

### Actions disponibles
- 👁️ **Aperçu** (en développement)
- ⬇️ **Télécharger** → Re-télécharge le fichier
- 🗑️ **Supprimer** → Supprime de l'historique (avec confirmation)

---

## ✅ TEST 4 : Re-télécharger un export

### Étapes
1. Dans l'historique
2. Cliquez sur le bouton **⬇️ Télécharger**

### Résultat attendu
✅ Toast "Téléchargement démarré"  
✅ Fichier téléchargé à nouveau  
✅ Même contenu que l'original  

---

## ✅ TEST 5 : Supprimer un export

### Étapes
1. Dans l'historique
2. Cliquez sur le bouton **🗑️ Supprimer**
3. Confirmez la suppression

### Résultat attendu
✅ Popup de confirmation  
✅ Toast "Export supprimé"  
✅ Export retiré de l'historique  

---

## 🔧 TEST 6 : Tester les différents formats

### PDF uniquement
1. Format : **PDF**
2. Périmètre : Export complet
3. Générer

**Résultat** : Téléchargement d'un `.pdf`

### JSON uniquement
1. Format : **JSON**
2. Périmètre : Indicateurs uniquement
3. Générer

**Résultat** : Téléchargement d'un `.json`

### CSV/Excel uniquement
1. Format : **Excel/CSV**
2. Périmètre : Audit Trail uniquement
3. Générer

**Résultat** : Téléchargement d'un `.csv`

---

## 📊 CONTENU DES EXPORTS

### PDF (`rapport.pdf`)
- **Page 1 : Couverture**
  - Logo Solvid.IA
  - Titre "Rapport ESG Audit-Ready"
  - Métadonnées
  - Score de complétude

- **Section 1 : Résumé Exécutif**
  - Nombre d'indicateurs total
  - Répartition E/S/G
  - Événements d'audit
  - Preuves jointes

- **Section 2 : Indicateurs ESG**
  - Tableau complet avec code, nom, catégorie, valeur, statut

- **Section 3 : Audit Trail**
  - 50 événements les plus récents
  - Date, utilisateur, action, type

- **Footer**
  - Branding + Date génération + Numérotation pages

### CSV (`export.csv`)
**Deux sections** :

1. **INDICATEURS ESG**
```csv
Code,Nom,Catégorie,Valeur,Unité,Période,Statut
E1-CO2,Émissions CO2,E,14540,tCO2e,2025,validated
...
```

2. **AUDIT TRAIL**
```csv
Timestamp,Utilisateur,Action,Type Entité,ID Entité,...
2026-02-03T10:30:00Z,Alice,UPDATE,INDICATOR,ind-e1-co2,...
...
```

### JSON (`donnees.json`)
```json
{
  "exportDate": "2026-02-03T10:30:00.000Z",
  "scope": "complete",
  "options": { ... },
  "indicators": [ ... ],
  "auditTrail": [ ... ],
  "evidences": [ ... ]
}
```

### README (`README.txt`)
Documentation explicative du contenu :
- Organisation
- Date d'export
- Contenu du dossier
- Statistiques
- Instructions d'utilisation

---

## 🎨 STATISTIQUES AFFICHÉES

### KPI Cards (en haut de la page)
1. **Indicateurs** : Nombre total d'indicateurs ESG
2. **Événements Audit** : Nombre d'entrées audit trail
3. **Preuves** : Nombre de fichiers de preuves
4. **Taille Totale** : Taille des données (mock)

---

## ⚠️ CAS D'ERREUR À TESTER

### Aucune donnée
1. Base de données vide (pas d'indicateurs)
2. Résultat : **Empty state** affiché
3. Message : "Aucune donnée à exporter"

### Historique vide
1. Première visite
2. Résultat : Message "Aucun export pour le moment"

### Erreur de génération (simulation)
1. Si erreur lors de la génération
2. Résultat : Toast error + Log console

---

## 🧪 CHECKLIST DE TEST COMPLÈTE

### Configuration
- [ ] Sélection format PDF
- [ ] Sélection format JSON
- [ ] Sélection format Excel
- [ ] Sélection format ZIP (tous)
- [ ] Sélection périmètre "Indicateurs uniquement"
- [ ] Sélection périmètre "Audit Trail uniquement"
- [ ] Sélection périmètre "Preuves uniquement"
- [ ] Sélection périmètre "Export complet"
- [ ] Filtre catégorie E
- [ ] Filtre catégorie S
- [ ] Filtre catégorie G
- [ ] Filtre toutes catégories
- [ ] Toggle checkbox "Transparence"
- [ ] Toggle checkbox "Audit Trail"
- [ ] Toggle checkbox "Preuves"
- [ ] Toggle checkbox "Calculs"

### Génération
- [ ] Clic "Générer l'export"
- [ ] Toast loading affiché
- [ ] Toast success affiché
- [ ] Fichier téléchargé automatiquement
- [ ] Historique mis à jour

### Historique
- [ ] Liste des exports affichée
- [ ] Ordre anti-chronologique (plus récents en premier)
- [ ] Format affiché correctement
- [ ] Taille affichée correctement
- [ ] Date relative affichée ("Il y a X min")
- [ ] Badge statut coloré

### Actions historique
- [ ] Bouton Aperçu (toast "En développement")
- [ ] Bouton Télécharger (fichier téléchargé)
- [ ] Bouton Supprimer (avec confirmation)

### Empty states
- [ ] Empty state si pas de données
- [ ] Empty state historique vide

### Contenu fichiers
- [ ] PDF s'ouvre correctement
- [ ] PDF contient sections attendues
- [ ] CSV s'ouvre dans Excel
- [ ] CSV contient indicateurs + audit trail
- [ ] JSON parsable
- [ ] JSON contient structure attendue
- [ ] ZIP contient 4 fichiers
- [ ] README.txt est lisible

---

## 🔍 DÉBOGAGE

### Problème : Export ne se télécharge pas
**Solution** :
1. Ouvrir la console navigateur (F12)
2. Chercher erreurs dans l'onglet Console
3. Vérifier les logs :
   - `✅ Export added to history: exp-...`
   - Erreurs éventuelles

### Problème : Historique vide
**Solution** :
1. Vérifier IndexedDB dans DevTools
2. Application → Storage → IndexedDB → `solvid-export-history`
3. Store `exports` devrait contenir les entrées

### Problème : Fichier corrompu
**Solution** :
1. Régénérer l'export
2. Vérifier la console pour erreurs
3. Tester avec un périmètre plus petit

---

## 📞 SUPPORT

### Logs utiles
- `✅ Export added to history: {id}`
- `🗑️ Export deleted: {id}`
- Erreurs : `console.error()` avec stack trace

### Fonctions console disponibles
```javascript
// Lister tous les exports
(await getAllExports())

// Statistiques
(await getExportStats())

// Supprimer tous les exports (reset)
(await clearAllExports())
```

---

## 🎉 RÉSUMÉ

La Phase 9 vous permet de :
- ✅ Générer des exports en **4 formats**
- ✅ Configurer **5 options avancées**
- ✅ Consulter **l'historique complet**
- ✅ **Re-télécharger** les exports passés
- ✅ **Supprimer** les exports obsolètes

**Tout fonctionne en local (IndexedDB), pas de backend requis !**

---

**Prochaine étape** : Phase 10 (Tests + Polish) pour stabilisation finale.

**Bon test ! 🚀**
