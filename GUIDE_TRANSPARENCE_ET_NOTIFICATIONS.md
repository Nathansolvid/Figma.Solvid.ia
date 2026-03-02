# 📘 Guide Complet : Transparence des Données et Notifications

## 🎯 Vue d'ensemble

Votre application Solvid.IA dispose maintenant de **toutes les fonctionnalités de transparence et notifications** opérationnelles. Ce guide vous explique où trouver chaque fonctionnalité et comment les utiliser.

---

## 📊 1. TRANSPARENCE DES DONNÉES

### 🔍 Où accéder à la transparence ?

#### Option 1 : Vue "Indicateurs clés" (RECOMMANDÉ)
1. **Navigation** : Cliquez sur **"Indicateurs clés"** dans le menu latéral gauche
2. **Interface** : Vous verrez un tableau avec tous vos indicateurs ESG
3. **Action** : Sur chaque ligne, cliquez sur le bouton 👁️ **"Voir transparence"**
4. **Résultat** : Une modal s'ouvre avec 3 onglets :

   **Onglet "Calcul"**
   - Formule mathématique complète
   - Liste des inputs avec valeurs et sources
   - Facteurs de conversion appliqués
   - Niveau de qualité des données
   - Bouton pour valider le calcul

   **Onglet "Historique"**
   - Audit trail complet de toutes les actions
   - Qui a fait quoi et quand
   - Commentaires de validation
   - Modifications de valeurs

   **Onglet "Validation"**
   - Statut actuel de l'indicateur
   - Alertes et warnings
   - Métadonnées et configuration

#### Option 2 : Dans un Pack
1. **Navigation** : Allez dans **"Packs"** puis ouvrez un pack
2. **Onglet** : Cliquez sur l'onglet **"KPI Requirements"**
3. **Action** : Même bouton 👁️ disponible pour chaque indicateur

#### Option 3 : Nouveau Tableau de Bord Transparence
1. **Fichier** : `/src/app/components/views/TransparencyDashboard.tsx` (créé)
2. **Description** : Vue d'ensemble de toutes les fonctionnalités de transparence
3. **Contenu** :
   - Statistiques de transparence (taux de couverture)
   - Exemples d'indicateurs avec transparence
   - Guide d'utilisation interactif
   - Accès rapide aux fonctionnalités

> **Note** : Pour ajouter ce dashboard au menu, il faut l'ajouter manuellement dans `AppContent.tsx` (voir section "Personnalisation" ci-dessous).

---

## 🔔 2. SYSTÈME DE NOTIFICATIONS

### 📍 Localisation

La **cloche de notifications** 🔔 se trouve **en haut à droite** de l'interface, à côté de votre email.

### ✨ Fonctionnalités

#### Indicateur visuel
- **Badge rouge** : Indique le nombre de notifications non lues
- **Animation** : Se met à jour automatiquement toutes les 30 secondes

#### Types de notifications supportés
1. **PACK_READY_FOR_REVIEW** 🔔
   - Quand un pack est prêt pour revue
   - Destiné aux auditeurs

2. **PACK_CHANGES_REQUESTED** ⚠️
   - Quand des modifications sont demandées
   - Destiné au propriétaire du pack

3. **PACK_APPROVED** ✅
   - Quand un pack est approuvé
   - Destiné au propriétaire du pack

4. **PACK_REJECTED** ❌
   - Quand un pack est rejeté
   - Destiné au propriétaire du pack

5. **TASK_ASSIGNED** 📋
   - Quand une tâche vous est assignée
   - Destiné au collaborateur assigné

#### Actions disponibles
- **Cliquer sur une notification** : Vous amène directement au pack concerné
- **Marquer comme lu** : Clic sur une notification
- **Tout marquer comme lu** : Bouton en haut du dropdown
- **Supprimer** : Icône ❌ sur chaque notification

### 🔧 Backend Notifications

**Routes disponibles** :
- `GET /notifications` - Liste toutes vos notifications
- `PATCH /notifications/:id/read` - Marquer une notification comme lue
- `PATCH /notifications/read-all` - Tout marquer comme lu
- `DELETE /notifications/:id` - Supprimer une notification

**Fichier serveur** : `/supabase/functions/server/notifications-routes.tsx`

---

## 🗂️ 3. AUTRES FONCTIONNALITÉS OPÉRATIONNELLES

### Dashboard Analytics
- **Menu** : "Dashboard"
- **Contenu** :
  - Métriques clés (packs actifs, completion, preuves)
  - Graphiques de répartition par statut
  - Distribution de completion
  - Évolution sur 5 semaines
  - Liste des packs récents

### Packs
- **Menu** : "Packs"
- **Fonctionnalités** :
  - Création de packs selon templates (Donneur d'Ordre, Questionnaire, Banque, Pré-Audit)
  - Vue détaillée par pack avec 4 onglets :
    - Checklist : Items à valider
    - KPI Requirements : Indicateurs requis avec transparence
    - Preuves : Documents justificatifs
    - Audit Trail : Historique complet

### Import de données
- **Menu** : "Import données"
- **Fonctionnalités** :
  - Import Excel/CSV
  - Mapping réutilisable
  - Validation et aperçu
  - Intégration automatique

### Evidence Vault (Preuves & Documents)
- **Menu** : "Preuves & Documents"
- **Fonctionnalités** :
  - Upload de fichiers (Excel, PDF, images)
  - Liaison aux indicateurs
  - Métadonnées complètes
  - Recherche et filtrage

### Checklist & Workflow
- **Menu** : "Checklist & Workflow"
- **Fonctionnalités** :
  - Gestion des tâches
  - Assignation
  - Suivi d'avancement
  - Validation par étapes

### Audit Center (réservé aux Auditeurs)
- **Menu** : "Audit Center"
- **Rôle requis** : AUDITOR ou ADMIN
- **Fonctionnalités** :
  - File d'attente des packs à reviewer
  - Interface de validation
  - Demande de modifications
  - Approbation/Rejet

### Exports & Livrables
- **Menu** : "Exports & Livrables"
- **Fonctionnalités** :
  - Export PDF de packs
  - Export ZIP avec toutes les preuves
  - Rapports audit-ready
  - Documentation complète

### Audit Trail (Traçabilité)
- **Menu** : "Audit Trail"
- **Fonctionnalités** :
  - Journal complet de toutes les actions
  - Filtrage par utilisateur, date, action
  - Export pour archivage
  - Conformité réglementaire

---

## 🎨 4. PERSONNALISATION

### Ajouter le Dashboard Transparence au menu

Si vous souhaitez ajouter le nouveau tableau de bord de transparence au menu principal :

1. **Ouvrir** : `/src/app/AppContent.tsx`

2. **Ajouter au type ViewType** (ligne ~41) :
```typescript
type ViewType = 
  | "dashboard" 
  | "dossiers"
  | "transparency-dashboard"  // ← AJOUTER
  // ... autres types
```

3. **Ajouter à la navigation** (dans `mainNav`, ligne ~84) :
```typescript
{ 
  id: "transparency-dashboard", 
  label: "Transparence", 
  icon: Eye,  // Importer Eye de lucide-react
  tooltip: "Tableau de bord de transparence des données" 
},
```

4. **Ajouter au switch renderView()** (ligne ~250) :
```typescript
case "transparency-dashboard":
  return <TransparencyDashboard />;
```

---

## 📚 5. STRUCTURE DES FICHIERS

### Composants de Transparence
```
/src/app/components/
├── TransparencyModal.tsx          # Modal de transparence (PRINCIPAL)
├── CalculationTransparency.tsx    # Détails des calculs
└── views/
    ├── DonneesQuantitatives.tsx   # Vue indicateurs avec transparence
    └── TransparencyDashboard.tsx  # Dashboard transparence (NOUVEAU)
```

### Composants de Notifications
```
/src/app/components/
└── NotificationBell.tsx           # Cloche de notifications (OPÉRATIONNEL)
```

### Hooks et Services
```
/src/hooks/
├── useTransparency.ts             # Hooks React Query pour transparence
└── useAuditTrail.ts               # Hooks pour audit trail

/src/services/
└── api.ts                         # Client API avec gestion tokens
```

### Backend
```
/supabase/functions/server/
├── index.tsx                      # Serveur Hono principal
├── notifications-routes.tsx       # Routes notifications
└── phase6-routes.tsx              # Routes transparence/calculs
```

---

## 🧪 6. TESTER LES FONCTIONNALITÉS

### Test Transparence
1. Allez dans **"Indicateurs clés"**
2. Cliquez sur l'icône 👁️ sur n'importe quel indicateur
3. Vérifiez que la modal s'ouvre avec les 3 onglets
4. Explorez les calculs, l'historique et la validation

### Test Notifications
1. Cliquez sur la **cloche 🔔** en haut à droite
2. Vous devriez voir le dropdown des notifications
3. Si aucune notification, créez-en via le backend ou attendez une action (ex: pack prêt pour revue)

### Test Packs
1. Allez dans **"Packs"**
2. Créez un nouveau pack (ex: "Donneur d'Ordre")
3. Ouvrez le pack créé
4. Naviguez entre les onglets (Checklist, KPI, Preuves, Audit Trail)
5. Testez la transparence depuis l'onglet KPI

---

## 🔐 7. SÉCURITÉ & PERMISSIONS

### Gestion des rôles
L'application utilise un système de rôles :
- **CLIENT_OWNER** : Directeur ESG (accès complet aux packs)
- **CLIENT_CONTRIBUTOR** : Analyste données (contribution aux packs)
- **CONSULTANT** : Consultant ESG (création et conseil)
- **AUDITOR** : Auditeur externe (revue et validation)
- **ADMIN** : Administrateur (accès total)
- **VIEWER** : Lecteur (lecture seule)

### Stockage sécurisé
- **Access tokens** : Stockés dans localStorage avec refresh automatique
- **Données sensibles** : Stockées dans Supabase avec chiffrement
- **Fichiers** : Stockés dans Supabase Storage avec buckets privés

---

## 🐛 8. DEBUGGING

### Logs disponibles dans la console

Pour diagnostiquer les problèmes, ouvrez la console du navigateur (F12) :

```javascript
// Diagnostiquer les problèmes JWT
diagnoseJWT()

// Inspecter le debug Phase 6
debugPhase6.help()

// Peupler des données de test
seedTestData()
seedPhase6Data()
```

### Erreurs courantes

**"Cannot create pack: user data not available"**
- Vérifiez que vous êtes bien connecté
- Vérifiez le localStorage (accessToken et userData doivent être présents)

**"Failed to load notifications"**
- Vérifiez la connexion au backend Supabase
- Vérifiez que le serveur Edge Function est démarré

**"Transparency modal ne s'ouvre pas"**
- Vérifiez que l'indicatorId est valide
- Vérifiez les logs dans la console pour voir l'erreur

---

## 📞 9. SUPPORT

### Logs importants
Tous les composants logguent leurs actions dans la console :
- Préfixe **🔍** : Debug général
- Préfixe **✅** : Succès
- Préfixe **❌** : Erreur
- Préfixe **📬** : Notifications
- Préfixe **🔔** : Actions utilisateur

### Vérification rapide
Utilisez `localStorage.getItem('accessToken')` dans la console pour vérifier la présence du token.

---

## 🎉 CONCLUSION

Votre application Solvid.IA est maintenant **100% fonctionnelle** avec :
- ✅ Transparence complète des calculs ESG
- ✅ Système de notifications en temps réel
- ✅ Gestion de packs par segments
- ✅ Import Excel/CSV
- ✅ Evidence Vault
- ✅ Audit Center
- ✅ Exports PDF/ZIP
- ✅ Audit Trail complet

Toutes les fonctionnalités sont **opérationnelles** et prêtes à l'emploi ! 🚀
