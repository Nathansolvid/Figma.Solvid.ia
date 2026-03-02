# 🧪 PRÉPARATION DES TESTS E2E

**Durée** : 5 minutes  
**Objectif** : Préparer l'environnement pour exécuter les 5 tests critiques

---

## ✅ Checklist Préparation (5 min)

### 1. Lancer l'Application

```bash
# Dans le terminal
npm run dev
```

**✅ Vérifier** :
- Terminal affiche : `Local: http://localhost:5173/`
- Aucune erreur de compilation
- Message : `ready in XXX ms`

---

### 2. Ouvrir dans le Navigateur

```
http://localhost:5173
```

**✅ Vérifier** :
- Page de login s'affiche
- Pas de 404 ou erreur réseau
- Console développeur sans erreurs rouges

---

### 3. Créer les Utilisateurs de Test

Ouvrir la console développeur (F12) et exécuter ces commandes :

#### User 1 : Admin (Directeur ESG)

```javascript
await fetch('http://localhost:5173/make-server-aa780fc8/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@solvid.ia',
    password: 'admin123',
    name: 'Admin Directeur',
    organizationName: 'Solvid Test Org',
    role: 'Directeur ESG'
  })
}).then(r => r.json()).then(console.log)
```

**✅ Résultat attendu** :
```json
{
  "message": "User created successfully",
  "userId": "...",
  "organizationId": "..."
}
```

---

#### User 2 : Consultant ESG

```javascript
await fetch('http://localhost:5173/make-server-aa780fc8/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'consultant@solvid.ia',
    password: 'consultant123',
    name: 'Jean Consultant',
    organizationName: 'Solvid Test Org',
    role: 'Consultant ESG'
  })
}).then(r => r.json()).then(console.log)
```

---

#### User 3 : Auditeur

```javascript
await fetch('http://localhost:5173/make-server-aa780fc8/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'auditeur@solvid.ia',
    password: 'auditeur123',
    name: 'Marie Auditeur',
    organizationName: 'Solvid Test Org',
    role: 'Auditeur'
  })
}).then(r => r.json()).then(console.log)
```

---

#### User 4 : Alice (pour Test Collaboration)

```javascript
await fetch('http://localhost:5173/make-server-aa780fc8/auth/signup', {
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

---

#### User 5 : Bob (pour Test Collaboration)

```javascript
await fetch('http://localhost:5173/make-server-aa780fc8/auth/signup', {
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

---

### 4. Vérifier la Création des Utilisateurs

```javascript
// Vérifier que l'organisation existe
const orgId = 'org-...' // Remplacer par l'ID retourné ci-dessus
await fetch(`http://localhost:5173/make-server-aa780fc8/organizations/${orgId}`, {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  }
}).then(r => r.json()).then(console.log)
```

---

### 5. Tester la Connexion

- [ ] Se connecter avec : `admin@solvid.ia` / `admin123`
- [ ] Dashboard s'affiche
- [ ] Nom "Admin Directeur" visible dans le header
- [ ] Menu latéral accessible

**✅ Si tout fonctionne** : Préparation terminée !

---

### 6. Préparer 2 Onglets (pour Test 4)

Pour le Test 4 (Collaboration), vous aurez besoin de 2 onglets :

**Option A : Navigation privée**
- Onglet 1 : Mode normal
- Onglet 2 : Mode privé (Ctrl+Shift+N sur Chrome)

**Option B : Deux profils Chrome**
- Profil 1 : Votre profil habituel
- Profil 2 : Créer un nouveau profil (icône avatar en haut à droite)

**Option C : Deux navigateurs**
- Navigateur 1 : Chrome
- Navigateur 2 : Firefox ou Edge

---

### 7. Préparer des Fichiers de Test

Créer 3 fichiers pour les tests de preuves :

#### Fichier 1 : `facture-electricite.pdf`
- Contenu : PDF fictif (peut être vide ou un screenshot)
- Taille : 100-500 KB

#### Fichier 2 : `rapport-ges.xlsx`
- Contenu : Excel fictif
- Taille : 50-200 KB

#### Fichier 3 : `photo-installation.jpg`
- Contenu : Image JPG
- Taille : 500 KB - 2 MB

**Astuce** : Utiliser des fichiers existants renommés ou créer des fichiers fictifs.

---

### 8. Configuration Console Développeur

- [ ] Ouvrir la console (F12)
- [ ] Onglet "Console" actif
- [ ] Filtrer : Afficher tous les niveaux (Verbose, Info, Warning, Error)
- [ ] Désactiver "Hide network messages" (pour voir les requêtes)
- [ ] Activer "Preserve log" (pour garder l'historique)

**Screenshot recommandé** :
```
Console > Settings (icône engrenage)
☑ Preserve log
☑ Show timestamps
```

---

## 🎯 Récapitulatif Préparation

### Checklist Finale

- [ ] ✅ Application lancée sur http://localhost:5173
- [ ] ✅ 5 utilisateurs créés (admin, consultant, auditeur, alice, bob)
- [ ] ✅ Connexion testée avec admin@solvid.ia
- [ ] ✅ 2 onglets/navigateurs préparés
- [ ] ✅ 3 fichiers de test créés (PDF, Excel, Image)
- [ ] ✅ Console développeur configurée
- [ ] ✅ Guide de test ouvert : `/TESTS_E2E_GUIDE_INTERACTIF.md`

**Si tout est coché** : ✅ Vous êtes prêt pour les tests !

---

## 🐛 Dépannage Préparation

### Problème : Utilisateur déjà existant

**Erreur** :
```json
{ "error": "User with this email already exists" }
```

**Solution** :
- Utiliser un autre email (ex: `admin2@solvid.ia`)
- Ou réinitialiser IndexedDB :
  ```javascript
  // Dans la console
  indexedDB.deleteDatabase('solvid-esg-db')
  // Puis rafraîchir la page (F5)
  ```

---

### Problème : Serveur ne répond pas

**Erreur** :
```
Failed to fetch
```

**Solution** :
1. Vérifier que `npm run dev` tourne
2. Vérifier l'URL : `http://localhost:5173` (pas `https`)
3. Vérifier les logs du terminal
4. Redémarrer le serveur :
   ```bash
   Ctrl+C
   npm run dev
   ```

---

### Problème : IndexedDB non initialisée

**Erreur** :
```
Database not initialized
```

**Solution** :
1. Rafraîchir la page (F5)
2. Attendre 2-3 secondes
3. Vérifier la console : `✅ IndexedDB initialized`
4. Si erreur persiste, vider le cache :
   - F12 > Application > Storage > Clear site data

---

### Problème : JWT invalide

**Erreur** :
```
Invalid JWT
```

**Solution** :
1. Se déconnecter
2. Vider le localStorage :
   ```javascript
   localStorage.clear()
   ```
3. Rafraîchir la page (F5)
4. Se reconnecter

---

## 📞 Support

**Si vous rencontrez un problème** :
1. Vérifier les logs de la console (F12)
2. Vérifier les logs du terminal `npm run dev`
3. Consulter `/OPTION_A_COMPLETE.md` pour détails techniques
4. Réinitialiser IndexedDB si nécessaire

---

## 🚀 Prêt pour les Tests ?

**Temps de préparation estimé** : 5 minutes  
**Temps de test total** : 35 minutes  
**Temps total** : **40 minutes**

👉 **Prochaine étape** : Ouvrir `/TESTS_E2E_GUIDE_INTERACTIF.md` et commencer le Test 1 !

---

**Bon courage ! 🧪**

**Note** : Gardez ce fichier ouvert dans un autre onglet pour référence pendant les tests.
