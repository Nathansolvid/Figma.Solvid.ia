# 🧪 TESTS E2E INTERACTIFS - SOLVID.IA

**Date** : 1er février 2026  
**Durée totale** : 35 minutes  
**Objectif** : Valider les 5 workflows critiques  

---

## 🎯 Instructions Générales

### Avant de Commencer

1. **Lancer l'application** :
   ```bash
   npm run dev
   ```

2. **Ouvrir dans le navigateur** :
   ```
   http://localhost:5173
   ```

3. **Ouvrir la console développeur** :
   - Appuyer sur `F12` (Windows/Linux)
   - Ou `Cmd+Option+J` (Mac)
   - Garder la console ouverte pendant tous les tests

4. **Préparer 2 onglets** (pour Test 4 - Collaboration) :
   - Onglet 1 : Mode navigation privée (ou profil Chrome 1)
   - Onglet 2 : Mode normal (ou profil Chrome 2)

### Comment Utiliser Ce Guide

- ✅ Cocher chaque étape après validation
- ❌ Marquer les échecs avec commentaire
- 📝 Noter les observations dans "Notes"
- 🐛 Signaler les bugs découverts

---

## 📋 TEST 1 : WORKFLOW PACK COMPLET

**Durée** : 10 minutes  
**Objectif** : Valider le cycle de vie complet d'un pack  
**Rôle** : Consultant ESG

### Étape 1 : Connexion

- [ ] Se connecter avec :
  - Email : `admin@solvid.ia`
  - Password : `admin123`

**✅ Critère de succès** :
- Dashboard s'affiche
- Nom utilisateur visible dans le header
- Menu latéral accessible

**Notes** :
```
_______________________________________________________
```

---

### Étape 2 : Créer un Pack

- [ ] Cliquer sur "Packs" dans le menu latéral
- [ ] Cliquer sur "+ Nouveau Pack"
- [ ] Remplir le formulaire :
  - Nom : `Test E2E - Pack Donneur d'Ordre`
  - Template : `Donneur d'ordre`
  - Description : `Pack de test pour validation E2E`
- [ ] Cliquer "Créer"

**✅ Critères de succès** :
- Toast de succès : "Pack créé avec succès"
- Redirection vers la vue du pack
- Pack apparaît dans la liste des packs

**Console** :
- ✅ Vérifier : `📦 Pack created successfully`
- ✅ Vérifier : `📁 Creating default folders...`

**Notes** :
```
_______________________________________________________
```

---

### Étape 3 : Vérifier le Chargement des Indicateurs

- [ ] Attendre 2-3 secondes
- [ ] Observer l'onglet "Checklist"

**✅ Critères de succès** :
- ~10 indicateurs E/S/G affichés
- Indicateurs regroupés en "Obligatoires" et "Recommandés"
- Statut initial : "Manquant" (cercle gris)
- Score de complétude : 0%

**Console** :
- ✅ Vérifier : `✅ Pack saved to KV successfully`
- ✅ Vérifier : Aucune erreur rouge

**Notes** :
```
_______________________________________________________
```

---

### Étape 4 : Marquer des Indicateurs comme "Fourni"

- [ ] Sélectionner 5 indicateurs obligatoires
- [ ] Cliquer sur le bouton "Fourni" (vert) de chaque indicateur

**✅ Critères de succès (pour chaque indicateur)** :
- Statut change immédiatement à "Fourni" (cercle bleu) ⚡ < 50ms
- Badge vert "Fourni" s'affiche
- Score de complétude augmente progressivement
- Toast : "Indicateur mis à jour"

**Console** :
- ✅ Vérifier : `📊 PUT /indicators/:id called`
- ✅ Vérifier : `✅ Indicator updated successfully`

**Notes** :
```
_______________________________________________________
```

---

### Étape 5 : Vérifier la Barre de Progression

- [ ] Observer le score de complétude en haut de page

**✅ Critères de succès** :
- Score > 0% (ex: 50% si 5/10 indicateurs fournis)
- Barre verte animée
- Texte : "X/Y items obligatoires complétés"

**Notes** :
```
_______________________________________________________
```

---

### Étape 6 : Uploader une Preuve

- [ ] Cliquer sur l'onglet "Preuves"
- [ ] Vérifier que l'Evidence Vault est vide
- [ ] Cliquer sur "Uploader une preuve"
- [ ] Sélectionner un fichier (PDF, Excel, ou image)
- [ ] Remplir :
  - Nom : `Facture électricité 2025`
  - Description : `Preuve pour Scope 2`
  - Période : `2025`
- [ ] Cliquer "Uploader"

**✅ Critères de succès** :
- Toast : "Preuve uploadée avec succès"
- Preuve apparaît dans la liste
- Nom de fichier, taille, date visibles
- Badge "0 indicateurs liés"

**Console** :
- ✅ Vérifier : `📎 Evidence uploaded successfully`
- ✅ Vérifier : Audit log créé

**Notes** :
```
_______________________________________________________
```

---

### Étape 7 : Lier la Preuve à un Indicateur

- [ ] Trouver la preuve uploadée
- [ ] Cliquer sur "Lier à un indicateur"
- [ ] Sélectionner un indicateur (ex: "Émissions GES Scope 2")
- [ ] Confirmer

**✅ Critères de succès** :
- Toast : "Preuve liée à l'indicateur"
- Badge "1 indicateur lié" s'affiche
- Revenir à l'onglet "Checklist"
- L'indicateur affiche un badge "1 preuve" (icône dossier)
- Badge "⚠️ Sans preuve" disparaît

**Notes** :
```
_______________________________________________________
```

---

### Étape 8 : Compléter Tous les Indicateurs Obligatoires

- [ ] Retourner à l'onglet "Checklist"
- [ ] Marquer tous les indicateurs restants comme "Fourni"

**✅ Critères de succès** :
- Score de complétude = 100%
- Message : "✓ Prêt pour revue"
- Bouton "Soumettre pour revue" activé (non grisé)

**Notes** :
```
_______________________________________________________
```

---

### Étape 9 : Soumettre pour Revue

- [ ] Cliquer sur "Soumettre pour revue" (en bas de page)
- [ ] Confirmer dans la modale

**✅ Critères de succès** :
- Toast : "Pack soumis pour revue"
- Toast : "L'auditeur sera notifié"
- Statut du pack change à "Prêt pour revue" (badge orange)
- Bouton "Soumettre" disparaît

**Console** :
- ✅ Vérifier : `📊 Pack status updated to READY_FOR_REVIEW`

**Notes** :
```
_______________________________________________________
```

---

### ✅ Résultat Test 1

- [ ] ✅ PASS - Workflow complet fonctionnel
- [ ] ❌ FAIL - Problèmes rencontrés (détailler ci-dessous)

**Bugs découverts** :
```
_______________________________________________________
```

**Temps réel** : _________ min

---

## 📋 TEST 2 : CONTRAINTE KPI SANS PREUVE

**Durée** : 5 minutes  
**Objectif** : Valider que la contrainte serveur bloque l'acceptation sans preuve  
**Rôle** : Auditeur

### Étape 1 : Se Connecter en tant qu'Auditeur

- [ ] Se déconnecter (bouton "Déconnexion" dans le menu)
- [ ] Se reconnecter avec :
  - Email : `auditeur@solvid.ia`
  - Password : `auditeur123`

**Note** : Si cet utilisateur n'existe pas, créez-le via :
```javascript
// Dans la console du navigateur
await fetch('/make-server-aa780fc8/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'auditeur@solvid.ia',
    password: 'auditeur123',
    name: 'Auditeur Test',
    organizationName: 'Solvid Test Org',
    role: 'Auditeur'
  })
}).then(r => r.json()).then(console.log)
```

**Notes** :
```
_______________________________________________________
```

---

### Étape 2 : Ouvrir un Pack avec Indicateurs Sans Preuve

- [ ] Aller dans "Packs"
- [ ] Créer un nouveau pack "Test Sans Preuve"
- [ ] Ouvrir le pack
- [ ] Marquer 1 indicateur comme "Fourni" (SANS uploader de preuve)

**✅ Critères de succès** :
- Indicateur marqué "Fourni"
- Badge "⚠️ Sans preuve" visible sur l'indicateur

**Notes** :
```
_______________________________________________________
```

---

### Étape 3 : Tenter d'Accepter l'Indicateur (UI)

- [ ] Essayer de marquer l'indicateur comme "Accepté"

**✅ Critères de succès** :
- Bouton "Accepter" DÉSACTIVÉ (grisé)
- Alert rouge affichée : "Impossible de valider cet indicateur"
- Message : "Au moins une preuve documentaire doit être liée..."
- Tooltip au survol du bouton : "⚠️ Preuve manquante"

**Notes** :
```
_______________________________________________________
```

---

### Étape 4 : Tenter d'Accepter via API Directe (Serveur)

- [ ] Ouvrir la console développeur
- [ ] Copier l'ID de l'indicateur (visible dans l'URL ou dans l'inspect)
- [ ] Exécuter ce code dans la console :

```javascript
// Récupérer le token
const token = localStorage.getItem('JWT_TOKEN');

// Tenter de marquer comme accepté
fetch('/make-server-aa780fc8/indicators/INDICATOR_ID_ICI', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ status: 'accepted' })
})
.then(r => r.json())
.then(result => {
  console.log('🔴 RÉSULTAT SERVEUR:', result);
})
```

**✅ Critères de succès** :
- Réponse serveur : **Erreur 400**
- Code : `EVIDENCE_REQUIRED`
- Message : `Impossible de valider un indicateur sans preuve liée`
- Details inclus :
  - indicatorId
  - indicatorCode
  - evidenceCount: 0
  - requirement: "Au moins une preuve documentaire..."

**Console Serveur** :
- ✅ Vérifier : `❌ CONSTRAINT VIOLATION: Cannot accept indicator without evidence`
- ✅ Vérifier : Audit log créé avec `action: 'constraint_violation_attempted'`

**Notes** :
```
_______________________________________________________
```

---

### Étape 5 : Uploader une Preuve et Réessayer

- [ ] Aller dans l'onglet "Preuves"
- [ ] Uploader une preuve
- [ ] Lier la preuve à l'indicateur
- [ ] Retourner à l'onglet "Checklist"
- [ ] Essayer de marquer comme "Accepté"

**✅ Critères de succès** :
- Bouton "Accepter" ACTIVÉ (non grisé)
- Alert rouge disparaît
- Clic sur "Accepter" fonctionne
- Status change à "Accepté"
- Badge vert "Accepté" s'affiche
- Toast : "Indicateur validé"

**Notes** :
```
_______________________________________________________
```

---

### ✅ Résultat Test 2

- [ ] ✅ PASS - Contrainte stricte appliquée (UI + Serveur)
- [ ] ❌ FAIL - Problèmes rencontrés (détailler ci-dessous)

**Bugs découverts** :
```
_______________________________________________________
```

**Temps réel** : _________ min

---

## 📋 TEST 3 : BULK OPERATIONS

**Durée** : 5 minutes  
**Objectif** : Valider le mode sélection multiple et actions groupées  
**Rôle** : Consultant ESG

### Étape 1 : Se Reconnecter en Consultant

- [ ] Se déconnecter
- [ ] Se reconnecter avec :
  - Email : `admin@solvid.ia`
  - Password : `admin123`

**Notes** :
```
_______________________________________________________
```

---

### Étape 2 : Ouvrir un Pack avec 10+ Indicateurs

- [ ] Aller dans "Packs"
- [ ] Ouvrir le pack "Test E2E - Pack Donneur d'Ordre" (créé dans Test 1)
- [ ] Vérifier qu'il y a au moins 10 indicateurs

**✅ Critères de succès** :
- Pack s'affiche
- Checklist avec 10+ indicateurs

**Notes** :
```
_______________________________________________________
```

---

### Étape 3 : Activer le Mode Sélection

- [ ] Cliquer sur le bouton "Mode sélection" dans le header (à côté de "Partager")

**✅ Critères de succès** :
- Bouton devient bleu et change de texte : "Quitter sélection"
- Checkboxes apparaissent à gauche de chaque indicateur
- Aucune barre d'actions (car rien n'est sélectionné)

**Notes** :
```
_______________________________________________________
```

---

### Étape 4 : Sélectionner 5 Indicateurs

- [ ] Cocher 5 checkboxes d'indicateurs différents

**✅ Critères de succès** :
- Chaque checkbox cochée devient bleue ✓
- Une barre d'actions bleue apparaît en haut
- Texte : "5 indicateurs sélectionnés"
- 3 boutons visibles :
  - "Marquer fourni" (vert)
  - "Marquer manquant" (orange)
  - "Supprimer" (rouge)
- Bouton "Tout désélectionner"

**Notes** :
```
_______________________________________________________
```

---

### Étape 5 : Action Groupée "Marquer Fourni"

- [ ] Cliquer sur le bouton "Marquer fourni" (vert)

**✅ Critères de succès** :
- Toast de progression : "Mise à jour en cours..." puis "1/5... 2/5... 3/5... 4/5... 5/5"
- Toast final : "5 indicateurs mis à jour avec succès"
- Les 5 indicateurs affichent le statut "Fourni"
- Les checkboxes sont automatiquement désélectionnées
- La barre d'actions disparaît
- Score de complétude augmente

**Console** :
- ✅ Vérifier : 5 appels `PUT /indicators/:id`
- ✅ Vérifier : `✅ Bulk operation completed: 5 indicators updated`

**Notes** :
```
_______________________________________________________
```

---

### Étape 6 : Sélectionner 3 Indicateurs pour Suppression

- [ ] Cocher 3 autres indicateurs
- [ ] Cliquer sur le bouton "Supprimer" (rouge)

**✅ Critères de succès** :
- Modale de confirmation s'affiche
- Message : "Êtes-vous sûr de vouloir supprimer 3 indicateur(s) ?"
- 2 boutons : "Annuler" et "Supprimer"

**Notes** :
```
_______________________________________________________
```

---

### Étape 7 : Annuler la Suppression

- [ ] Cliquer sur "Annuler"

**✅ Critères de succès** :
- Modale se ferme
- Les 3 indicateurs sont toujours là
- Checkboxes toujours cochées
- Barre d'actions toujours visible

**Notes** :
```
_______________________________________________________
```

---

### Étape 8 : Confirmer la Suppression

- [ ] Cliquer à nouveau sur "Supprimer"
- [ ] Cliquer sur "Supprimer" dans la modale

**✅ Critères de succès** :
- Toast : "3 indicateurs supprimés"
- Les 3 indicateurs disparaissent de la liste
- Checkboxes désélectionnées
- Barre d'actions disparaît
- Score de complétude recalculé

**Console** :
- ✅ Vérifier : 3 appels `DELETE /indicators/:id`

**Notes** :
```
_______________________________________________________
```

---

### Étape 9 : Quitter le Mode Sélection

- [ ] Cliquer sur "Quitter sélection"

**✅ Critères de succès** :
- Bouton redevient blanc : "Mode sélection"
- Toutes les checkboxes disparaissent
- Barre d'actions disparaît (si elle était visible)

**Notes** :
```
_______________________________________________________
```

---

### ✅ Résultat Test 3

- [ ] ✅ PASS - Bulk operations 100% fonctionnel
- [ ] ❌ FAIL - Problèmes rencontrés (détailler ci-dessous)

**Bugs découverts** :
```
_______________________________________________________
```

**Temps réel** : _________ min

---

## 📋 TEST 4 : COLLABORATION TEMPS RÉEL

**Durée** : 10 minutes  
**Objectif** : Valider la collaboration multi-utilisateurs via BroadcastChannel  
**Prérequis** : 2 onglets (ou 2 navigateurs)

### Préparation : Créer 2 Utilisateurs

#### Créer User 1 : Alice (Consultant)

Dans la console du navigateur :

```javascript
await fetch('/make-server-aa780fc8/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'alice@solvid.ia',
    password: 'alice123',
    name: 'Alice Consultant',
    organizationName: 'Solvid Test Org',
    role: 'Consultant ESG'
  })
}).then(r => r.json()).then(console.log)
```

#### Créer User 2 : Bob (Auditeur)

```javascript
await fetch('/make-server-aa780fc8/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'bob@solvid.ia',
    password: 'bob123',
    name: 'Bob Auditeur',
    organizationName: 'Solvid Test Org',
    role: 'Auditeur'
  })
}).then(r => r.json()).then(console.log)
```

**Notes** :
```
_______________________________________________________
```

---

### Étape 1 : Connexion Onglet 1 (Alice)

- [ ] Onglet 1 : Ouvrir http://localhost:5173
- [ ] Se connecter avec :
  - Email : `alice@solvid.ia`
  - Password : `alice123`

**✅ Critères de succès** :
- Dashboard s'affiche
- Header affiche "Alice Consultant"

**Notes** :
```
_______________________________________________________
```

---

### Étape 2 : Connexion Onglet 2 (Bob)

- [ ] Onglet 2 : Ouvrir http://localhost:5173 (navigation privée ou autre profil)
- [ ] Se connecter avec :
  - Email : `bob@solvid.ia`
  - Password : `bob123`

**✅ Critères de succès** :
- Dashboard s'affiche
- Header affiche "Bob Auditeur"

**Notes** :
```
_______________________________________________________
```

---

### Étape 3 : Alice Ouvre un Pack

- [ ] Onglet 1 (Alice) : Aller dans "Packs"
- [ ] Créer ou ouvrir un pack (ex: "Test Collaboration")

**✅ Critères de succès** :
- Pack s'affiche
- Header du pack affiche :
  - Nom du pack
  - Badge "1 actif"
  - 1 avatar avec initiales "AC" (Alice Consultant)

**Console Onglet 1** :
- ✅ Vérifier : `👥 Collaboration service ready`
- ✅ Vérifier : `🔔 Broadcasting user_joined event`

**Notes** :
```
_______________________________________________________
```

---

### Étape 4 : Bob Ouvre le Même Pack

- [ ] Onglet 2 (Bob) : Aller dans "Packs"
- [ ] Ouvrir le **même pack** que Alice

**✅ Critères de succès (Onglet 2 - Bob)** :
- Pack s'affiche
- Header du pack affiche :
  - Badge "2 actifs"
  - 2 avatars : "AC" (Alice) et "BA" (Bob)

**✅ Critères de succès (Onglet 1 - Alice)** :
- Badge change automatiquement à "2 actifs"
- 2 avatars visibles : "AC" et "BA"

**Console Onglet 2** :
- ✅ Vérifier : `🔔 Collaboration event received: user_joined`
- ✅ Vérifier : `👥 Active users: 2`

**Notes** :
```
_______________________________________________________
```

---

### Étape 5 : Alice Modifie un Indicateur

- [ ] Onglet 1 (Alice) : Marquer un indicateur comme "Fourni"

**✅ Critères de succès (Onglet 1 - Alice)** :
- Indicateur change à "Fourni" immédiatement
- Toast : "Indicateur mis à jour"

**✅ Critères de succès (Onglet 2 - Bob)** :
- Toast apparaît : "🔄 Mise à jour" ou "Modification détectée"
- Pack se refetch automatiquement (loading spinner rapide)
- Indicateur affiche maintenant "Fourni"

**Console Onglet 2** :
- ✅ Vérifier : `🔔 Collaboration event received: indicator_updated`
- ✅ Vérifier : `♻️ Invalidating pack cache...`
- ✅ Vérifier : `📊 Refetching pack data...`

**Notes** :
```
_______________________________________________________
```

---

### Étape 6 : Bob Ajoute un Commentaire

- [ ] Onglet 2 (Bob) : Cliquer sur l'icône "💬" d'un indicateur
- [ ] Ajouter un commentaire : "Besoin de précision sur la source"
- [ ] Cliquer "Enregistrer"

**✅ Critères de succès (Onglet 2 - Bob)** :
- Commentaire s'affiche sous l'indicateur
- Toast : "Commentaire ajouté"

**✅ Critères de succès (Onglet 1 - Alice)** :
- Toast apparaît : "💬 Nouveau commentaire"
- Pack se refetch automatiquement
- Commentaire de Bob visible sous l'indicateur

**Console Onglet 1** :
- ✅ Vérifier : `🔔 Collaboration event received: comment_updated`

**Notes** :
```
_______________________________________________________
```

---

### Étape 7 : Alice Ferme l'Onglet

- [ ] Onglet 1 (Alice) : Fermer complètement l'onglet

**✅ Critères de succès (Onglet 2 - Bob)** :
- Badge change automatiquement à "1 actif"
- Avatar "AC" (Alice) disparaît
- Seul l'avatar "BA" (Bob) reste visible

**Console Onglet 2** :
- ✅ Vérifier : `🔔 Collaboration event received: user_left`
- ✅ Vérifier : `👥 Active users: 1`

**Notes** :
```
_______________________________________________________
```

---

### ✅ Résultat Test 4

- [ ] ✅ PASS - Collaboration temps réel opérationnelle
- [ ] ❌ FAIL - Problèmes rencontrés (détailler ci-dessous)

**Bugs découverts** :
```
_______________________________________________________
```

**Temps réel** : _________ min

---

## 📋 TEST 5 : EXPORTS PDF/ZIP

**Durée** : 5 minutes  
**Objectif** : Valider les exports avec preuves et audit trail  
**Rôle** : Consultant ESG

### Étape 1 : Se Connecter

- [ ] Se connecter avec :
  - Email : `admin@solvid.ia`
  - Password : `admin123`

**Notes** :
```
_______________________________________________________
```

---

### Étape 2 : Ouvrir un Pack Complété

- [ ] Aller dans "Packs"
- [ ] Ouvrir le pack "Test E2E - Pack Donneur d'Ordre" (créé dans Test 1)
- [ ] Vérifier qu'il contient :
  - Des indicateurs avec statut "Fourni"
  - Au moins 1 preuve uploadée

**✅ Critères de succès** :
- Pack s'affiche
- Score de complétude > 0%
- Onglet "Preuves" contient au moins 1 fichier

**Notes** :
```
_______________________________________________________
```

---

### Étape 3 : Export PDF

- [ ] Cliquer sur le bouton "Exporter" (icône Download) dans le header

**✅ Critères de succès** :
- Toast : "Génération du PDF en cours..."
- Toast : "Veuillez patienter"
- Après 2-3 secondes :
  - Toast : "PDF généré avec succès"
  - Toast : "Le fichier a été téléchargé"
- Un fichier PDF se télécharge automatiquement

**Nom du fichier** : `pack-[nom-du-pack]-[date].pdf`

**Notes** :
```
_______________________________________________________
```

---

### Étape 4 : Vérifier le Contenu du PDF

- [ ] Ouvrir le fichier PDF téléchargé

**✅ Critères de succès** :
- **Page 1 : Synthèse**
  - Nom du pack
  - Date de création
  - Score de complétude
  - Statut du pack
  - Organisation

- **Page 2 : Checklist**
  - Liste complète des indicateurs
  - Statuts (Fourni, Manquant, etc.)
  - Codes indicateurs

- **Page 3 : KPIs**
  - Valeurs des indicateurs
  - Unités
  - Périodes

- **Footer de chaque page** :
  - Horodatage immutable
  - "Généré le [date] à [heure]"

**Notes** :
```
_______________________________________________________
```

---

### Étape 5 : Export ZIP

- [ ] Retourner dans l'application
- [ ] Cliquer sur le bouton "Exporter ZIP" (à côté de "Exporter")

**✅ Critères de succès** :
- Modal de progression s'ouvre immédiatement
- Barre de progression démarre à 0%
- Messages successifs :
  - "Démarrage..."
  - "Préparation de l'export..."
  - "Ajout des preuves (1/X)..."
  - "Ajout des preuves (2/X)..."
  - "Génération de l'index..."
  - "Compression du ZIP..."
  - "Finalisation..."
- Barre atteint 100%
- Bouton "Télécharger" devient vert
- Message final : "Export ZIP terminé !"

**Nom du fichier** : `pack-[nom-du-pack]-[date].zip`

**Notes** :
```
_______________________________________________________
```

---

### Étape 6 : Vérifier le Contenu du ZIP

- [ ] Extraire le fichier ZIP téléchargé
- [ ] Explorer le contenu

**✅ Critères de succès** :
- **Dossier `/evidences/`** :
  - Contient tous les fichiers de preuves uploadés
  - Noms de fichiers préservés
  - Tailles correctes

- **Fichier `/index.csv`** :
  - Format CSV lisible
  - Colonnes : Indicateur, Preuve, Date, Type
  - Mapping complet indicateurs ↔ preuves

- **Fichier `/audit-trail.json`** :
  - Format JSON valide
  - Liste chronologique des événements :
    - indicator_updated
    - evidence_uploaded
    - pack_status_changed
  - Pour chaque event :
    - timestamp
    - userId
    - action
    - entityType
    - details

- **Fichier `/metadata.json`** :
  - Nom de l'organisation
  - Nom du pack
  - Date d'export
  - Version de l'application

**Notes** :
```
_______________________________________________________
```

---

### Étape 7 : Vérifier la Fermeture de la Modal

- [ ] Cliquer sur "Fermer" dans la modal d'export ZIP

**✅ Critères de succès** :
- Modal se ferme
- Retour à la vue du pack
- Aucune erreur console

**Notes** :
```
_______________________________________________________
```

---

### ✅ Résultat Test 5

- [ ] ✅ PASS - Exports complets et auditables
- [ ] ❌ FAIL - Problèmes rencontrés (détailler ci-dessous)

**Bugs découverts** :
```
_______________________________________________________
```

**Temps réel** : _________ min

---

## 📊 RÉSULTATS GLOBAUX

### Récapitulatif des Tests

| # | Test | Résultat | Temps | Bugs |
|---|------|----------|-------|------|
| 1 | Workflow pack complet | ⬜ PASS / ⬜ FAIL | ___ min | ___ |
| 2 | Contrainte KPI | ⬜ PASS / ⬜ FAIL | ___ min | ___ |
| 3 | Bulk operations | ⬜ PASS / ⬜ FAIL | ___ min | ___ |
| 4 | Collaboration | ⬜ PASS / ⬜ FAIL | ___ min | ___ |
| 5 | Exports PDF/ZIP | ⬜ PASS / ⬜ FAIL | ___ min | ___ |

**Total temps réel** : _________ min (estimé : 35 min)

---

### Score de Succès

**Formule** : (Tests PASS / 5) × 100

**Score obtenu** : _________ %

**Interprétation** :
- 100% : ✅ Production ready
- 80-99% : ⚠️ Bugs mineurs à corriger
- 60-79% : ❌ Bugs majeurs, retour en développement
- <60% : ❌❌ Refonte nécessaire

---

### Bugs Critiques Découverts

1. **Bug #1** :
   ```
   Description : _________________________________________________
   Sévérité : ⬜ Bloquant / ⬜ Majeur / ⬜ Mineur
   Test concerné : Test #___
   Étape : ___
   Reproduction : ___________________________________________
   ```

2. **Bug #2** :
   ```
   Description : _________________________________________________
   Sévérité : ⬜ Bloquant / ⬜ Majeur / ⬜ Mineur
   Test concerné : Test #___
   Étape : ___
   Reproduction : ___________________________________________
   ```

3. **Bug #3** :
   ```
   Description : _________________________________________________
   Sévérité : ⬜ Bloquant / ⬜ Majeur / ⬜ Mineur
   Test concerné : Test #___
   Étape : ___
   Reproduction : ___________________________________________
   ```

---

### Recommandations

**Si score ≥ 80%** :
- [ ] Corriger les bugs mineurs identifiés
- [ ] Déployer en production pilote
- [ ] Monitorer l'usage réel

**Si score < 80%** :
- [ ] Prioriser les bugs critiques
- [ ] Créer un plan de correction
- [ ] Re-tester après corrections

---

## 🎯 Validation Finale

### Checklist de Production-Readiness

- [ ] ✅ Tous les tests ont PASS
- [ ] ✅ Aucun bug bloquant
- [ ] ✅ Bugs mineurs documentés
- [ ] ✅ Performance acceptable
- [ ] ✅ Console sans erreurs critiques

### Signature de Validation

**Testeur** : ________________________________  
**Date** : ________________________________  
**Verdict** : ⬜ ✅ PRODUCTION READY / ⬜ ❌ NON READY  

**Commentaires** :
```
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
```

---

## 📞 Support

**Questions ou problèmes pendant les tests ?**

1. Vérifier la console développeur (F12)
2. Relire les critères de succès
3. Consulter `/OPTION_A_COMPLETE.md` pour détails techniques
4. Créer un ticket avec :
   - Numéro du test
   - Numéro de l'étape
   - Screenshot de l'erreur
   - Logs console

---

🎉 **Bon courage pour les tests !** 🧪

**Temps estimé total** : 35 minutes  
**Difficulté** : ⭐⭐ Modérée  
**Prérequis** : Application lancée + Console ouverte
