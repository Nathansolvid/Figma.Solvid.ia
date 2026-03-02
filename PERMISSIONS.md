# 🔐 PERMISSIONS & RBAC - ESG AUDIT-READY DATA ROOM

## Vue d'ensemble

Système de permissions **Role-Based Access Control (RBAC)** pour garantir :
- Sécurité des données
- Séparation des responsabilités (Conseil vs Audit)
- Traçabilité des actions
- Conformité réglementaire (indépendance auditeur)

**Principe** : Chaque action est vérifiée via `can(role, action, resource)`

---

## 👥 Rôles (5 rôles V1)

### 1. ADMIN
**Description** : Administrateur de l'organisation  
**Cas d'usage** : IT Manager, Responsable ESG interne

**Accès** :
- Configuration organisation
- Gestion utilisateurs (invitation, désactivation)
- Accès complet à tous les dossiers de l'organisation
- Gestion des abonnements
- Vue d'ensemble multi-dossiers

---

### 2. CLIENT_CONTRIBUTOR
**Description** : Contributeur interne (entreprise cliente)  
**Cas d'usage** : Contrôleur de gestion, Responsable RSE, Responsable QHSE

**Accès** :
- Import Excel/CSV
- Upload preuves
- Édition checklist (commentaires, assignation)
- **IMPOSSIBLE** : valider/rejeter finalement (uniquement Consultant/Auditor)
- Consultation dashboards
- Demande de support Consultant

---

### 3. CONSULTANT
**Description** : Consultant ESG (cabinet conseil)  
**Cas d'usage** : Consultant ESG accompagnant le client

**Accès** :
- Tout ce que CLIENT_CONTRIBUTOR peut faire
- Création dossiers
- Création Packs
- Pré-contrôles (cohérence, complétude)
- **Marquer "Ready for Review"** (envoyer à l'auditeur)
- Assistant IA (si feature flag activé)
- Génération rapports intermédiaires
- **IMPOSSIBLE** : valider/rejeter final si posture Audit externe (conflit d'intérêt)

---

### 4. AUDITOR
**Description** : Auditeur externe / Commissaire aux comptes  
**Cas d'usage** : CAC, auditeur externe CSRD

**Accès** :
- **LECTURE SEULE** sur données sources
- Consultation dashboards, KPIs, preuves
- **Demander des preuves complémentaires** (crée Task)
- **Approuver / Rejeter / Demander modifications** :
  - PackInstance
  - ChecklistItem
  - IndicatorValue
- Ajouter commentaires audit
- Télécharger exports audit-ready
- Consulter audit trail complet
- **IMPOSSIBLE** :
  - Modifier données sources
  - Import Excel/CSV
  - Upload preuves (sauf sur demande explicite)
  - Utiliser Assistant IA

---

### 5. VIEWER
**Description** : Observateur externe (banque, investisseur, donneur d'ordre)  
**Cas d'usage** : Analyste ESG banque, Responsable achats donneur d'ordre

**Accès** :
- **LECTURE SEULE** sur exports partagés
- Dashboards publics (si partagés)
- **IMPOSSIBLE** :
  - Voir données sources brutes
  - Accéder audit trail complet
  - Modifier quoi que ce soit
  - Consulter preuves (sauf si Pack exporté)

---

## 📊 Matrice de Permissions Détaillée

### Légende
- ✅ **Autorisé**
- ❌ **Interdit**
- 🟡 **Conditionnel** (selon contexte/feature flag)

---

### 1. GESTION ORGANISATION

| Action | ADMIN | CLIENT | CONSULTANT | AUDITOR | VIEWER |
|--------|-------|--------|------------|---------|--------|
| Voir paramètres organisation | ✅ | ❌ | ❌ | ❌ | ❌ |
| Modifier paramètres organisation | ✅ | ❌ | ❌ | ❌ | ❌ |
| Inviter utilisateurs | ✅ | ❌ | 🟡 (si délégué) | ❌ | ❌ |
| Désactiver utilisateurs | ✅ | ❌ | ❌ | ❌ | ❌ |
| Voir liste utilisateurs | ✅ | 🟡 (même org) | 🟡 (même org) | ❌ | ❌ |
| Gérer abonnement | ✅ | ❌ | ❌ | ❌ | ❌ |

---

### 2. GESTION DOSSIERS

| Action | ADMIN | CLIENT | CONSULTANT | AUDITOR | VIEWER |
|--------|-------|--------|------------|---------|--------|
| Créer dossier | ✅ | 🟡 (si délégué) | ✅ | ❌ | ❌ |
| Voir liste dossiers (org) | ✅ | ✅ (assignés) | ✅ (assignés) | ✅ (assignés) | ✅ (partagés) |
| Modifier dossier | ✅ | 🟡 (si owner) | ✅ (si owner/assigné) | ❌ | ❌ |
| Supprimer dossier | ✅ | ❌ | 🟡 (si owner) | ❌ | ❌ |
| Archiver dossier | ✅ | ❌ | ✅ (si owner) | ❌ | ❌ |
| Exporter dossier complet | ✅ | ✅ | ✅ | ✅ | ❌ |

---

### 3. GESTION PACKS

| Action | ADMIN | CLIENT | CONSULTANT | AUDITOR | VIEWER |
|--------|-------|--------|------------|---------|--------|
| Créer Pack (dans dossier) | ✅ | 🟡 (si contributeur dossier) | ✅ | ❌ | ❌ |
| Voir liste Packs | ✅ | ✅ | ✅ | ✅ | ✅ (si partagé) |
| Modifier Pack (nom, config) | ✅ | 🟡 (si owner) | ✅ (si owner) | ❌ | ❌ |
| Supprimer Pack | ✅ | ❌ | 🟡 (si owner + statut Draft) | ❌ | ❌ |
| Marquer "Ready for Review" | ❌ | ❌ | ✅ | ❌ | ❌ |
| Approuver Pack | ✅ (si rôle admin audit) | ❌ | ❌ | ✅ | ❌ |
| Rejeter Pack | ✅ (si rôle admin audit) | ❌ | ❌ | ✅ | ❌ |
| Demander modifications | ✅ | ❌ | 🟡 (si consultant senior) | ✅ | ❌ |

---

### 4. CHECKLIST

| Action | ADMIN | CLIENT | CONSULTANT | AUDITOR | VIEWER |
|--------|-------|--------|------------|---------|--------|
| Voir checklist | ✅ | ✅ | ✅ | ✅ | ✅ (si Pack partagé) |
| Modifier statut item (Provided/Missing) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Assigner responsable | ✅ | 🟡 (si owner Pack) | ✅ | ❌ | ❌ |
| Ajouter commentaire | ✅ | ✅ | ✅ | ✅ | ❌ |
| Valider item (Accepted) | ✅ | ❌ | 🟡 (pré-validation uniquement) | ✅ | ❌ |
| Rejeter item (Rejected) | ✅ | ❌ | ❌ | ✅ | ❌ |
| Supprimer item | ❌ | ❌ | ❌ | ❌ | ❌ |

**Règles spéciales** :
- CLIENT/CONSULTANT peuvent passer de `MISSING` → `PROVIDED`
- Seul AUDITOR peut passer de `PROVIDED` → `ACCEPTED` ou `REJECTED`
- Transition bloquée si statut incohérent (ex: `ACCEPTED` sans preuve)

---

### 5. IMPORT DONNÉES

| Action | ADMIN | CLIENT | CONSULTANT | AUDITOR | VIEWER |
|--------|-------|--------|------------|---------|--------|
| Importer Excel/CSV | ✅ | ✅ | ✅ | ❌ | ❌ |
| Voir historique imports | ✅ | ✅ | ✅ | ✅ | ❌ |
| Télécharger fichier importé | ✅ | ✅ | ✅ | ✅ | ❌ |
| Supprimer import | ✅ | ❌ | 🟡 (si owner) | ❌ | ❌ |
| Modifier mapping | ✅ | ✅ | ✅ | ❌ | ❌ |
| Sauvegarder template mapping | ✅ | ✅ | ✅ | ❌ | ❌ |
| Réappliquer mapping | ✅ | ✅ | ✅ | ❌ | ❌ |

**Règles spéciales** :
- Tout import crée un AuditLog
- AUDITOR peut télécharger le fichier source (lecture seule)

---

### 6. INDICATEURS (KPIs)

| Action | ADMIN | CLIENT | CONSULTANT | AUDITOR | VIEWER |
|--------|-------|--------|------------|---------|--------|
| Voir liste indicateurs | ✅ | ✅ | ✅ | ✅ | ✅ (si Pack partagé) |
| Voir détail KPI | ✅ | ✅ | ✅ | ✅ | 🟡 (si partagé) |
| Voir "i" transparence calcul | ✅ | ✅ | ✅ | ✅ | ❌ |
| Recalculer KPI | ✅ | 🟡 (après import) | ✅ | ❌ | ❌ |
| Modifier formule calcul | ✅ (admin système) | ❌ | ❌ | ❌ | ❌ |
| Ajouter commentaire KPI | ✅ | ✅ | ✅ | ✅ | ❌ |
| Valider KPI (Accepted) | ✅ | ❌ | ❌ | ✅ | ❌ |
| Rejeter KPI (Rejected) | ✅ | ❌ | ❌ | ✅ | ❌ |

**Règles spéciales** :
- **CONTRAINTE CRITIQUE** : KPI ne peut pas être `ACCEPTED` sans preuve liée
- Tout changement statut KPI → AuditLog
- "i" transparence doit TOUJOURS afficher sources + preuves

---

### 7. EVIDENCE VAULT (PREUVES)

| Action | ADMIN | CLIENT | CONSULTANT | AUDITOR | VIEWER |
|--------|-------|--------|------------|---------|--------|
| Voir liste preuves | ✅ | ✅ | ✅ | ✅ | ❌ |
| Télécharger preuve | ✅ | ✅ | ✅ | ✅ | ❌ |
| Upload nouvelle preuve | ✅ | ✅ | ✅ | 🟡 (uniquement sur demande explicite) | ❌ |
| Modifier métadonnées preuve | ✅ | 🟡 (si uploader) | ✅ | ❌ | ❌ |
| Supprimer preuve | ✅ | ❌ | 🟡 (si uploader + statut Draft) | ❌ | ❌ |
| Lier preuve → KPI | ✅ | ✅ | ✅ | ❌ | ❌ |
| Lier preuve → Checklist | ✅ | ✅ | ✅ | ❌ | ❌ |
| Marquer preuve "Vérifiée" | ❌ | ❌ | ❌ | ✅ | ❌ |

**Règles spéciales** :
- Toute preuve uploadée → AuditLog
- Soft delete uniquement (conservation légale)
- AUDITOR peut demander preuve complémentaire (crée Task)

---

### 8. AUDIT CENTER

| Action | ADMIN | CLIENT | CONSULTANT | AUDITOR | VIEWER |
|--------|-------|--------|------------|---------|--------|
| Voir file d'attente "Ready for Review" | ✅ | ❌ | 🟡 (si consultant senior) | ✅ | ❌ |
| Ouvrir revue Pack | ✅ | ❌ | 🟡 (lecture uniquement) | ✅ | ❌ |
| Demander modifications | ✅ | ❌ | ❌ | ✅ | ❌ |
| Approuver Pack | ✅ | ❌ | ❌ | ✅ | ❌ |
| Rejeter Pack | ✅ | ❌ | ❌ | ✅ | ❌ |
| Créer Task (demande preuve) | ✅ | ❌ | ✅ | ✅ | ❌ |

**Règles spéciales** :
- Seul AUDITOR assigné peut approuver/rejeter
- Chaque action → AuditLog + Notification
- CONSULTANT ne peut pas auto-approuver (conflit d'intérêt)

---

### 9. EXPORTS

| Action | ADMIN | CLIENT | CONSULTANT | AUDITOR | VIEWER |
|--------|-------|--------|------------|---------|--------|
| Générer export PDF Pack | ✅ | ✅ | ✅ | ✅ | ❌ |
| Générer export ZIP annexes | ✅ | ✅ | ✅ | ✅ | ❌ |
| Télécharger export | ✅ | ✅ | ✅ | ✅ | ✅ (si partagé) |
| Voir historique exports | ✅ | ✅ | ✅ | ✅ | ❌ |
| Supprimer export | ✅ | ❌ | 🟡 (si créateur) | ❌ | ❌ |
| Partager export avec Viewer | ✅ | ❌ | ✅ | ✅ | ❌ |

**Règles spéciales** :
- Tout export → AuditLog (horodatage immutable)
- Exports audit-ready uniquement si Pack status `APPROVED`
- VIEWER n'accède qu'aux exports explicitement partagés

---

### 10. COLLABORATION (COMMENTAIRES / TÂCHES)

| Action | ADMIN | CLIENT | CONSULTANT | AUDITOR | VIEWER |
|--------|-------|--------|------------|---------|--------|
| Créer commentaire | ✅ | ✅ | ✅ | ✅ | ❌ |
| Modifier son commentaire | ✅ | ✅ | ✅ | ✅ | ❌ |
| Supprimer son commentaire | ✅ | ✅ (< 24h) | ✅ (< 24h) | ❌ | ❌ |
| Créer Task | ✅ | 🟡 (si owner Pack) | ✅ | ✅ | ❌ |
| Assigner Task | ✅ | 🟡 (si owner) | ✅ | ✅ | ❌ |
| Compléter Task | ✅ | ✅ (si assigné) | ✅ (si assigné) | ✅ (si assigné) | ❌ |
| Supprimer Task | ✅ | ❌ | 🟡 (si créateur + statut TODO) | ❌ | ❌ |

**Règles spéciales** :
- AUDITOR ne peut pas supprimer commentaires (traçabilité)
- Tout changement statut Task → AuditLog

---

### 11. AUDIT TRAIL

| Action | ADMIN | CLIENT | CONSULTANT | AUDITOR | VIEWER |
|--------|-------|--------|------------|---------|--------|
| Consulter audit trail | ✅ | 🟡 (actions propres uniquement) | ✅ (dossiers assignés) | ✅ | ❌ |
| Filtrer audit trail | ✅ | ❌ | ✅ | ✅ | ❌ |
| Exporter audit trail | ✅ | ❌ | ✅ | ✅ | ❌ |
| Supprimer entrée audit trail | ❌ | ❌ | ❌ | ❌ | ❌ |

**Règles spéciales** :
- **IMMUTABLE** : aucune suppression/modification possible
- Horodatage cryptographiquement sûr
- Inclus dans export ZIP annexes

---

### 12. ASSISTANT IA (FEATURE FLAG)

| Action | ADMIN | CLIENT | CONSULTANT | AUDITOR | VIEWER |
|--------|-------|--------|------------|---------|--------|
| Activer Assistant IA | ✅ | ❌ | ❌ | ❌ | ❌ |
| Utiliser suggestions IA | ❌ | 🟡 (si activé + posture Conseil) | ✅ (si activé) | ❌ | ❌ |
| Synthèse auto-générée | ❌ | 🟡 (si activé) | ✅ (si activé) | ❌ | ❌ |

**Règles spéciales** :
- Feature flag `aiAssistant: false` par défaut
- **JAMAIS activable en mode Audit externe** (conflit d'intérêt)
- Uniquement disponible si `posture === "Conseil"`

---

## 🎯 Règles de Scoping (Organization)

### Principe : Isolation par Organisation

- Un utilisateur appartient à **une seule Organization**
- Il ne peut accéder qu'aux ressources de son Organisation
- Exception : VIEWER peut accéder à exports partagés d'autres orgs (si lien public)

### Implémentation

```typescript
// Pseudo-code
function canAccessDossier(user: User, dossier: Dossier): boolean {
  // Vérifier que le dossier appartient à l'org de l'utilisateur
  if (dossier.organization_id !== user.organization_id) {
    return false;
  }
  
  // Vérifier que l'utilisateur est assigné au dossier (ou ADMIN)
  if (user.role === 'ADMIN') {
    return true;
  }
  
  return dossier.assigned_user_ids.includes(user.id);
}
```

---

## 🔒 Règles de Séparation des Responsabilités

### 1. Indépendance Auditeur

**Règle** : Un AUDITOR ne peut PAS :
- Modifier les données sources qu'il audite
- Créer/uploader des preuves (sauf demande explicite)
- Utiliser Assistant IA
- Être consultant ET auditeur sur le même dossier

**Raison** : Conformité réglementaire (indépendance CAC)

### 2. Consultant ne peut pas auto-approuver

**Règle** : Un CONSULTANT ne peut PAS :
- Approuver finalement un Pack qu'il a préparé
- Marquer KPI comme `ACCEPTED` (uniquement `COMPUTED`)

**Raison** : Conflit d'intérêt

### 3. Client ne peut pas valider

**Règle** : Un CLIENT_CONTRIBUTOR ne peut PAS :
- Marquer "Ready for Review"
- Approuver/Rejeter quoi que ce soit

**Raison** : Le client fournit les données, ne les valide pas

---

## 🛡️ Implémentation Technique

### Fonction centrale : `can(role, action, resource)`

```typescript
// permissions.ts

export enum Role {
  ADMIN = 'ADMIN',
  CLIENT_CONTRIBUTOR = 'CLIENT_CONTRIBUTOR',
  CONSULTANT = 'CONSULTANT',
  AUDITOR = 'AUDITOR',
  VIEWER = 'VIEWER'
}

export enum Action {
  // Dossiers
  CREATE_DOSSIER = 'CREATE_DOSSIER',
  VIEW_DOSSIER = 'VIEW_DOSSIER',
  EDIT_DOSSIER = 'EDIT_DOSSIER',
  DELETE_DOSSIER = 'DELETE_DOSSIER',
  
  // Packs
  CREATE_PACK = 'CREATE_PACK',
  EDIT_PACK = 'EDIT_PACK',
  MARK_READY_FOR_REVIEW = 'MARK_READY_FOR_REVIEW',
  APPROVE_PACK = 'APPROVE_PACK',
  REJECT_PACK = 'REJECT_PACK',
  
  // Imports
  IMPORT_DATA = 'IMPORT_DATA',
  DELETE_IMPORT = 'DELETE_IMPORT',
  
  // KPIs
  VIEW_KPI_TRANSPARENCY = 'VIEW_KPI_TRANSPARENCY',
  RECALCULATE_KPI = 'RECALCULATE_KPI',
  ACCEPT_KPI = 'ACCEPT_KPI',
  REJECT_KPI = 'REJECT_KPI',
  
  // Preuves
  UPLOAD_EVIDENCE = 'UPLOAD_EVIDENCE',
  DELETE_EVIDENCE = 'DELETE_EVIDENCE',
  VERIFY_EVIDENCE = 'VERIFY_EVIDENCE',
  
  // Audit
  VIEW_AUDIT_CENTER = 'VIEW_AUDIT_CENTER',
  REQUEST_CHANGES = 'REQUEST_CHANGES',
  
  // Exports
  GENERATE_EXPORT = 'GENERATE_EXPORT',
  SHARE_EXPORT = 'SHARE_EXPORT',
  
  // IA
  USE_AI_ASSISTANT = 'USE_AI_ASSISTANT',
}

export type Resource = {
  type: 'DOSSIER' | 'PACK' | 'KPI' | 'EVIDENCE' | 'EXPORT';
  organizationId: string;
  ownerId?: string;
  status?: string;
};

export function can(
  role: Role,
  action: Action,
  resource?: Resource,
  context?: { userId: string; posture?: string; featureFlags?: Record<string, boolean> }
): boolean {
  // Règles par défaut : ADMIN peut tout
  if (role === Role.ADMIN) {
    return true;
  }
  
  switch (action) {
    // DOSSIERS
    case Action.CREATE_DOSSIER:
      return [Role.ADMIN, Role.CONSULTANT].includes(role);
      
    case Action.VIEW_DOSSIER:
      return [Role.ADMIN, Role.CLIENT_CONTRIBUTOR, Role.CONSULTANT, Role.AUDITOR].includes(role);
      
    case Action.EDIT_DOSSIER:
      return [Role.ADMIN, Role.CONSULTANT].includes(role) ||
             (role === Role.CLIENT_CONTRIBUTOR && resource?.ownerId === context?.userId);
      
    case Action.DELETE_DOSSIER:
      return role === Role.ADMIN;
      
    // PACKS
    case Action.CREATE_PACK:
      return [Role.ADMIN, Role.CLIENT_CONTRIBUTOR, Role.CONSULTANT].includes(role);
      
    case Action.MARK_READY_FOR_REVIEW:
      return role === Role.CONSULTANT;
      
    case Action.APPROVE_PACK:
    case Action.REJECT_PACK:
      return role === Role.AUDITOR;
      
    // IMPORTS
    case Action.IMPORT_DATA:
      return [Role.ADMIN, Role.CLIENT_CONTRIBUTOR, Role.CONSULTANT].includes(role);
      
    case Action.DELETE_IMPORT:
      return role === Role.ADMIN ||
             (role === Role.CONSULTANT && resource?.ownerId === context?.userId);
      
    // KPIs
    case Action.VIEW_KPI_TRANSPARENCY:
      return [Role.ADMIN, Role.CLIENT_CONTRIBUTOR, Role.CONSULTANT, Role.AUDITOR].includes(role);
      
    case Action.RECALCULATE_KPI:
      return [Role.ADMIN, Role.CONSULTANT].includes(role);
      
    case Action.ACCEPT_KPI:
    case Action.REJECT_KPI:
      return role === Role.AUDITOR;
      
    // PREUVES
    case Action.UPLOAD_EVIDENCE:
      return [Role.ADMIN, Role.CLIENT_CONTRIBUTOR, Role.CONSULTANT].includes(role);
      
    case Action.DELETE_EVIDENCE:
      return role === Role.ADMIN;
      
    case Action.VERIFY_EVIDENCE:
      return role === Role.AUDITOR;
      
    // AUDIT
    case Action.VIEW_AUDIT_CENTER:
      return [Role.ADMIN, Role.AUDITOR].includes(role);
      
    case Action.REQUEST_CHANGES:
      return role === Role.AUDITOR;
      
    // EXPORTS
    case Action.GENERATE_EXPORT:
      return [Role.ADMIN, Role.CLIENT_CONTRIBUTOR, Role.CONSULTANT, Role.AUDITOR].includes(role);
      
    case Action.SHARE_EXPORT:
      return [Role.ADMIN, Role.CONSULTANT, Role.AUDITOR].includes(role);
      
    // IA
    case Action.USE_AI_ASSISTANT:
      return context?.featureFlags?.aiAssistant === true &&
             context?.posture === 'Conseil' &&
             [Role.CONSULTANT].includes(role);
      
    default:
      return false;
  }
}
```

### Guards en UI

```typescript
// Exemple dans un composant React
import { can, Action, Role } from '@/permissions';

function PackView({ pack, currentUser }) {
  const canApprove = can(
    currentUser.role,
    Action.APPROVE_PACK,
    { type: 'PACK', organizationId: pack.organization_id },
    { userId: currentUser.id }
  );
  
  return (
    <div>
      {canApprove && (
        <Button onClick={handleApprove}>Approuver</Button>
      )}
    </div>
  );
}
```

### Guards en API (backend)

```typescript
// Exemple middleware Express
app.post('/api/packs/:id/approve', authenticate, async (req, res) => {
  const pack = await Pack.findById(req.params.id);
  
  if (!can(req.user.role, Action.APPROVE_PACK, {
    type: 'PACK',
    organizationId: pack.organization_id
  }, { userId: req.user.id })) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // ... logique d'approbation
});
```

---

## 📝 Cas d'Usage Critiques

### Cas 1 : Consultant prépare, Auditeur valide

1. **Consultant** crée Pack → `status = DRAFT`
2. **Client** upload preuves → `checklist status = PROVIDED`
3. **Consultant** vérifie complétude → marque `READY_FOR_REVIEW`
4. **Auditeur** reçoit notification → ouvre Audit Center
5. **Auditeur** demande preuve complémentaire → `status = CHANGES_REQUESTED` + Task créée
6. **Client** ajoute preuve → repasse `READY_FOR_REVIEW`
7. **Auditeur** approuve → `status = APPROVED`

### Cas 2 : Viewer (banque) accède à export partagé

1. **Consultant** génère export Pack → PDF + ZIP
2. **Consultant** partage export avec email banque → crée User VIEWER
3. **Viewer** reçoit lien → accède uniquement au PDF/ZIP
4. **Viewer** NE PEUT PAS accéder aux données sources brutes

### Cas 3 : Admin gère multi-utilisateurs

1. **Admin** invite 3 utilisateurs :
   - Client : role CLIENT_CONTRIBUTOR
   - Consultant externe : role CONSULTANT
   - Auditeur : role AUDITOR
2. **Admin** assigne Dossier → tous peuvent y accéder (selon leur rôle)
3. **Admin** désactive Consultant externe → perd tous les accès

---

## 🚨 Erreurs Courantes à Éviter

### ❌ Erreur 1 : Client auto-approuve
```typescript
// MAUVAIS
if (user.role === 'CLIENT_CONTRIBUTOR') {
  pack.status = 'APPROVED'; // ❌ Client ne peut pas approuver
}

// BON
if (can(user.role, Action.APPROVE_PACK)) {
  pack.status = 'APPROVED'; // ✅ Uniquement AUDITOR
}
```

### ❌ Erreur 2 : Oublier le scoping org
```typescript
// MAUVAIS
const dossiers = await Dossier.find(); // ❌ Retourne TOUS les dossiers

// BON
const dossiers = await Dossier.find({
  organization_id: user.organization_id // ✅ Scoping org
});
```

### ❌ Erreur 3 : Modifier audit trail
```typescript
// MAUVAIS
await AuditLog.update({ id: logId }, { action: 'CORRECTED' }); // ❌ IMMUTABLE

// BON
// Les AuditLog ne sont JAMAIS modifiés/supprimés
```

---

## 🎯 Checklist d'Implémentation

- [ ] Créer fichier `permissions.ts` avec fonction `can()`
- [ ] Implémenter guards UI (cacher boutons non autorisés)
- [ ] Implémenter guards API (middleware authentification + autorisation)
- [ ] Tester chaque matrice de permissions (tests unitaires)
- [ ] Ajouter logging des tentatives d'accès refusé (sécurité)
- [ ] Documenter dans code (commentaires TSDoc)
- [ ] Créer page Settings > Permissions (afficher matrice à l'admin)

---

**Version** : 1.0.0  
**Date** : 30 janvier 2026  
**Maintenu par** : Solution Architect Solvid.IA
