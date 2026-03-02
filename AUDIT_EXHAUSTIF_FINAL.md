# 🔍 AUDIT EXHAUSTIF - SOLVID.IA PRODUCTION-READY

**Auditeur** : QA Senior SaaS B2B  
**Date** : 30 janvier 2026  
**Méthodologie** : Inspection code + Comparaison PROMPT #1 + PROMPT #2  
**Statut** : ⚠️ **NON PRODUCTION-READY** (Backend manquant + Parcours/Postures contradictoires)

---

# 📌 PARTIE 1 : RAPPEL DES ATTENTES

## PROMPT #1 (Grand prompt initial)

**Objectif** : Transformer en "La plateforme qui rend les données ESG auditables, traçables et faciles à consolider — en partant d'Excel."

**Éléments clés demandés** :
- CUT LIST (Remove/Hide/Keep)
- Packs orientés livrables (4 segments)
- Import Excel/CSV + mapping réutilisable
- KPI + transparence calcul ("i")
- Evidence Vault
- Checklist & statuts
- Audit trail
- Exports orientés livrables
- Permissions/RBAC
- Audit Center
- Roadmap V1/V1.1/V2
- Plan de test 15 cas

## PROMPT #2 (RÔLE Builder - 9 sections)

1. CUT LIST (REMOVE/HIDE/KEEP) + featureFlags
2. Architecture Packs (data entities, templates, UI, automations)
3. Data model (DATA_MODEL.md)
4. Permissions & Auth (PERMISSIONS.md + RBAC + can())
5. Audit Center complet
6. "i" Transparence calcul (warnings, exigences, interdictions)
7. Workflows/Notifications (Tasks + Notifs)
8. Test plan 15 cas (TEST_PLAN.md)
9. Refactor navigation (menu simple, masquage CSRD-only/IA-heavy)

---

# 🎯 PARTIE 2 : AUDIT PROMPT #2 (Section par section)

## SECTION 1 : CUT LIST + FEATURE FLAGS

### Demandé
- Fichier CUT_LIST.md avec REMOVE/HIDE/KEEP
- Raison + impact UX pour chaque item
- Fichier featureFlags.ts
- Application des flags dans navigation

### Livré
✅ **CUT_LIST.md** (155 lignes)
- 3 sections : REMOVE (4 items), HIDE-EXPERIMENTAL (4 items), KEEP (8 items)
- Justifications + impact UX détaillés
- Configuration feature flags JSON

✅ **featureFlags.ts** (280 lignes)
- 14 feature flags définis
- Helpers : `isFeatureEnabled()`, `getFeatureLabel()`, etc.
- Guards UI : `shouldShowFeature()`

✅ **Application dans App.tsx**
- Import `isFeatureEnabled` ligne 55
- Navigation "Packs" conditionnelle ligne 100-102
- IA masquée (commentée lignes 111-112, 135-136)

### Manquant
❌ Application complète de la CUT LIST dans l'UI actuelle (voir section Parcours/Postures ci-dessous)

### Fichiers concernés
- `/CUT_LIST.md`
- `/src/featureFlags.ts`
- `/src/app/App.tsx` (lignes 55, 100-102, 111-112)

### Score : **90%** ⚠️
**Raison** : Documentation 100%, implémentation feature flags 100%, mais **navigation contient encore "CSRD Obligatoire" vs "ESG Structuré"** ce qui contredit le repositionnement (voir section spéciale ci-dessous)

---

## SECTION 2 : ARCHITECTURE PACKS

### 2.1 DATA ENTITIES

#### Demandé
- ESG_PackTemplate
- ESG_PackInstance
- ESG_PackChecklistItem
- ESG_PackKPIRequirement

#### Livré
✅ **DATA_MODEL.md** (lignes 220-350)
- 4 entities documentées avec tous les champs

⚠️ **Types TypeScript** (`/src/types/packs.ts`)
- PackTemplate ✅ (lignes 19-29)
- ESGPack ✅ (lignes 55-65) *mais nommé ESGPack au lieu de ESG_PackInstance*
- ChecklistItem ✅ (lignes 67-83)
- ❌ ESG_PackKPIRequirement **PAS de type dédié** (implicite dans ChecklistItem?)

⚠️ **Implémentation backend**
- ❌ Aucune table créée (pas de DB)
- ❌ Aucune API
- ✅ Mock data dans composants

#### Score : **70%** ⚠️
**Raison** : Documentation 100%, Types 75%, Implémentation backend 0%

---

### 2.2 PACK TEMPLATES

#### Demandé
- 4 templates : PACK_DONNEUR_ORDRE, PACK_QUESTIONNAIRE, PACK_BANQUE, PACK_PREAUDIT
- Avec KPIs par défaut, evidence types requis, checklist template items

#### Livré
✅ **PACK_TEMPLATES.json** (420 lignes) - **MAIS NON UTILISÉ**
- 4 templates complets
- KPIs, evidence types, checklist items, export layout

✅ **packTemplates.ts** (434 lignes) - **VRAIE SOURCE**
- 4 templates complets (donneur-ordre, questionnaire-esg, banque, audit-ready)
- Checklist items détaillés (15 items Pack Donneur Ordre, 5 items Questionnaire, etc.)
- Excel template config
- Helpers : `getPackTemplate()`, `calculateCompletionPercentage()`, `getChecklistStats()`

⚠️ **Incohérence** : PACK_TEMPLATES.json vs packTemplates.ts
- Structure différente
- PACK_TEMPLATES.json pas importé dans le code
- packTemplates.ts est la vraie source

#### Score : **95%** ✅
**Raison** : Templates complets et fonctionnels, mais duplication PACK_TEMPLATES.json inutile

---

### 2.3 UI/UX

#### Demandé
- PackSelector
- PackView (3 onglets : Checklist / KPIs / Preuves)
- PackExport (optionnel si intégré)

#### Livré
✅ **PackSelector.tsx** (230 lignes)
- Sélection des 4 templates
- Configuration nom du pack
- Preview checklist + KPIs
- Création pack (simulée ligne 68-90)

✅ **PackView.tsx** (420 lignes)
- 3 onglets : Checklist ✅ / KPIs ✅ / Preuves ✅
- Actions : Mark Provided, Add Comment, Submit for Review
- Score de complétude
- Bouton "Ready for Review" (avec validation mandatory items)

❌ **PackExport.tsx** - PAS CRÉÉ
- Mentionné optionnel si intégré dans PackView
- Export existe dans ExportsLivrables.tsx existant (non spécifique aux Packs)

⚠️ **Props incohérents**
- PackSelector attend `dossierId` + `dossierName` (ligne 12-16)
- PackView attend `pack` + `currentUserRole` + `currentUserId` (ligne 55-59)
- **MAIS** App.tsx appelle avec `posture` + `parcours` (lignes 274-276)
- ❌ **Les props ne matchent pas !**

#### Score : **70%** ⚠️
**Raison** : 2/3 composants créés, mais **props incompatibles avec App.tsx** = composants non fonctionnels en l'état

---

### 2.4 AUTOMATIONS

#### Demandé
- OnCreate PackInstance → cloner checklist/KPIs
- OnUpload Evidence → checklist auto "Provided"
- Transition ReadyForReview → bloquer si mandatory missing
- OnKPI Computed → mettre status
- Audit actions → AuditLog + Task + Notif

#### Livré
⚠️ **PackSelector.tsx** (lignes 68-90)
- Création pack + instanciation checklist/KPIs **simulée frontend**
- `setTimeout()` → pas de persistance

⚠️ **PackView.tsx**
- `handleMarkProvided()` (lignes 147-151) → **état local** seulement
- `handleSubmitForReview()` (lignes 169-180) → **simulé** avec setTimeout
- Validation mandatory items ✅ (lignes 135-136)

❌ **Aucune automation backend**
- Pas de trigger DB
- Pas d'API
- Tout simulé frontend

#### Score : **30%** ❌
**Raison** : Logique UI OK, mais **0% backend** = non fonctionnel en production

---

### Fichiers concernés (Section 2)
- `/PACK_TEMPLATES.json` (420 lignes - non utilisé)
- `/src/data/packTemplates.ts` (434 lignes - vraie source)
- `/src/types/packs.ts` (84 lignes)
- `/src/app/components/views/PackSelector.tsx` (230 lignes)
- `/src/app/components/views/PackView.tsx` (420 lignes)

### Score global Section 2 : **70%** ⚠️

---

## SECTION 3 : DATA MODEL

### Demandé
- DATA_MODEL.md avec 15+ tables
- Champs clés + types + contraintes
- Relations
- Index recommandés

### Livré
✅ **DATA_MODEL.md** (950 lignes)
- **19 tables** documentées (dépasse les 15 demandées)
- Champs détaillés avec types SQL
- Contraintes UNIQUE, NOT NULL, FOREIGN KEY
- Index recommandés
- Exemples de requêtes SQL

**Tables** :
1. Organization ✅
2. User ✅
3. ESG_Dossier ✅
4. ESG_DataImport ✅
5. ESG_DataRow ✅
6. ESG_Indicator ✅
7. ESG_IndicatorValue ✅
8. ESG_Evidence ✅
9. ESG_AuditLog ✅
10. ESG_CommentThread ✅
11. ESG_Comment ✅
12. ESG_Task ✅
13. **ESG_PackTemplate ✅**
14. **ESG_PackInstance ✅**
15. **ESG_PackChecklistItem ✅**
16. **ESG_PackKPIRequirement ✅**
17. ESG_CalculationProfile ✅
18. ESG_CalculationInput ✅
19. ESG_Notification ✅

⚠️ **Contrainte critique documentée** (ligne 580) :
> "Un IndicatorValue ne peut pas être ACCEPTED sans au moins 1 Evidence liée"

❌ **Aucune implémentation backend**
- 0 table créée
- 0 base de données
- 0 API

### Fichiers concernés
- `/DATA_MODEL.md` (950 lignes)

### Score : **100% documentation / 0% implémentation** = **50%** ⚠️

---

## SECTION 4 : PERMISSIONS & AUTH

### 4.1 Auth minimale

#### Demandé
- currentUser persistant + role + org
- Même si mock au début

#### Livré
❌ **Aucune authentification**
- Pas de contexte User
- Pas de localStorage/sessionStorage
- Pas de mock user dans App.tsx
- **Les composants reçoivent `currentUserRole` en props mais App.tsx ne le fournit pas**

### 4.2 PERMISSIONS.md

#### Demandé
- Matrice ressource × action × rôle
- Règles clés

#### Livré
✅ **PERMISSIONS.md** (480 lignes)
- 5 rôles détaillés
- 12 sections de permissions
- Matrice complète
- Cas d'usage
- Code TypeScript exemple

### 4.3 Implémentation permissions.ts

#### Demandé
- Function can(role, action, resource)
- Guards UI
- Guards data layer

#### Livré
✅ **permissions.ts** (390 lignes)
- Enum Role (5 rôles) ✅
- Enum Action (15+ actions) ✅
- Function `can(role, action, resource, context)` ✅ (lignes 63-181)
- Helpers : `getRoleLabel()`, `getRoleBadgeColor()`, etc. ✅
- PERMISSION_MATRIX (référence) ✅

⚠️ **Utilisation dans le code**
- Import dans App.tsx ligne 54 ✅
- **MAIS** : `can()` n'est **jamais appelé** dans App.tsx !
- PackView.tsx ligne 5 : `import { can, Action, Role }` ✅
- PackView.tsx ligne 168 : `const canMarkReadyForReview = can(currentUserRole, Action.MARK_READY_FOR_REVIEW);` ✅
- **MAIS** : `currentUserRole` vient d'où ? Props non fournies par App.tsx !

❌ **Guards data layer**
- Aucun guard côté API (pas d'API)

### Fichiers concernés
- `/PERMISSIONS.md` (480 lignes)
- `/src/permissions.ts` (390 lignes)
- `/src/app/App.tsx` (ligne 54 - import non utilisé)
- `/src/app/components/views/PackView.tsx` (lignes 5, 168 - props manquantes)

### Score : **40%** ❌
**Raison** : Documentation 100%, Code 100%, **Intégration 0%** (pas de user context, props non fournies)

---

## SECTION 5 : AUDIT CENTER

### Demandé
- Écran complet
- Liste packs ReadyForReview
- Panneau de revue
- Actions : RequestChanges / Approve / Reject
- Génération AuditLog + Task + Notification

### Livré
✅ **AuditCenter.tsx** (480 lignes)
- Liste packs avec filtres (search + type) ✅
- Stats cards (en attente / approuvés / temps moyen) ✅
- Panneau de revue avec infos pack ✅
- Actions :
  - Approve ✅ (lignes 122-142)
  - Reject ✅ (lignes 144-164)
  - RequestChanges ✅ (lignes 166-191)
- Modals pour chaque action ✅

⚠️ **Mock data** (lignes 49-104)
- 3 packs en attente **hardcodés**
- `const [packsInQueue, setPacksInQueue] = useState<PackInQueue[]>([...])`

⚠️ **Simulation setTimeout** (lignes 125, 149, 173)
- Approve : `setTimeout(() => { toast.success(); })` (ligne 125)
- Reject : `setTimeout(() => { toast.success(); })` (ligne 149)
- RequestChanges : `setTimeout(() => { toast.success(); })` (ligne 173)

❌ **Pas de persistance**
- Aucune création AuditLog
- Aucune création Task
- Aucune notification réelle

⚠️ **Props incohérents**
- AuditCenter attend `currentAuditorId` + `currentAuditorName` (lignes 37-39)
- **MAIS** App.tsx appelle avec `posture` + `parcours` (ligne 278)
- ❌ **Props ne matchent pas !**

### Fichiers concernés
- `/src/app/components/views/AuditCenter.tsx` (480 lignes)
- `/src/app/App.tsx` (ligne 278 - props incompatibles)

### Score : **60%** ⚠️
**Raison** : UI 100%, Logique frontend 100%, **Backend 0%**, **Props incompatibles**

---

## SECTION 6 : "i" TRANSPARENCE CALCUL

### Demandé
> "Vérifier/compléter que la fiche 'i' affiche TOUJOURS :
> - formule, étapes, inputs, preuves, hypothèses, limitations
> - warning si pas de preuve, facteur expiré, donnée estimée
> - Interdire affichage KPI sans CalculationProfile"

### Livré
❌ **Composant TransparencyDemo.tsx existant INCHANGÉ**
- Vérifié par recherche "warning|TOUJOURS|interdire" : 0 résultat
- Composant existe (créé dans Phase 6 selon PHASE_6_TRANSPARENCE_COMPLETE.md)
- **MAIS** : Aucune amélioration apportée selon Section 6 du prompt

⚠️ **Dans DATA_MODEL.md** (ligne 660) :
> "Interdire l'affichage d'un KPI sans CalculationProfile associé."
- Documentation OK
- Implémentation ❌

### Fichiers concernés
- `/src/app/components/views/TransparencyDemo.tsx` (existant, non modifié)
- `/src/app/components/CalculationTransparency.tsx` (existant, non modifié)
- `/src/app/components/TransparencyModal.tsx` (existant, non modifié)

### Score : **0%** ❌
**Raison** : **Section complètement ignorée**. Composants existants pas améliorés.

---

## SECTION 7 : WORKFLOWS / NOTIFICATIONS

### Demandé
- ESG_Task créée
- ESG_Notification créée
- Logique création Task quand RequestChanges
- Notif auditeur quand ReadyForReview
- Notif consultant/client quand Approved

### Livré
✅ **DATA_MODEL.md** (lignes 800-850)
- ESG_Task documentée ✅
- ESG_Notification documentée ✅

⚠️ **Types TypeScript**
- ❌ Pas de `/src/types/tasks.ts`
- ❌ Pas de `/src/types/notifications.ts`

⚠️ **Logique frontend simulée**
- AuditCenter.tsx ligne 179 : `toast.success('Demande de modifications envoyée')` → **toast** au lieu de notification système
- PackView.tsx ligne 174 : `toast.success('Pack soumis pour revue')` → **toast** au lieu de notification

❌ **Backend**
- Aucune table créée
- Aucune API
- Aucune logique de notification

### Fichiers concernés
- `/DATA_MODEL.md` (lignes 800-850)
- `/src/app/components/views/AuditCenter.tsx` (ligne 179)
- `/src/app/components/views/PackView.tsx` (ligne 174)

### Score : **20%** ❌
**Raison** : Documentation 100%, Types 0%, Implémentation 0%

---

## SECTION 8 : TEST PLAN

### Demandé
- TEST_PLAN.md avec 15 tests E2E
- Format Préconditions / Étapes / Résultat attendu
- Tests **EXÉCUTÉS**

### Livré
✅ **TEST_PLAN.md** (720 lignes)
- 15 tests documentés ✅
- Format Préconditions/Étapes/Résultat ✅
- Ordre d'exécution recommandé ✅
- Template de rapport ✅

❌ **Exécution**
- 0/15 tests exécutés
- Aucun rapport de test
- Pas de captures d'écran
- Pas de bugs reportés

### Fichiers concernés
- `/TEST_PLAN.md` (720 lignes)

### Score : **50%** ⚠️
**Raison** : Documentation 100%, **Exécution 0%**

---

## SECTION 9 : REFACTOR NAVIGATION

### Demandé
- Navigation V1 simplifiée
- Ajouter Packs + Audit Center
- Supprimer/masquer CSRD-only / IA-heavy

### Livré
✅ **App.tsx** - Navigation mise à jour
- Import Packs + AuditCenter (lignes 50-52) ✅
- Navigation "Packs" conditionnelle (lignes 100-102) ✅
- Navigation "Audit Center" pour auditeurs (lignes 117-119, 141-143) ✅
- IA commentée (lignes 111-112, 135-136) ✅

⚠️ **PROBLÈME MAJEUR : Parcours/Postures toujours présents**
- Ligne 86 : `type ParcoursType = "csrd-obligatoire" | "esg-structure";`
- Ligne 87 : `type PostureType = "conseil" | "pre-audit" | "audit-externe";`
- Lignes 143-168 : Sélecteur de posture affiché dans sidebar
- Lignes 169-189 : Sélecteur de parcours affiché dans sidebar
- **CONTRADICTION avec CUT_LIST.md** qui demande de supprimer "CSRD full coverage"

### Fichiers concernés
- `/src/app/App.tsx` (lignes 50-52, 86-87, 100-102, 111-119, 143-189)

### Score : **70%** ⚠️
**Raison** : Packs + Audit Center OK, **MAIS parcours/postures contradictoires** (voir section spéciale ci-dessous)

---

## SCORES RÉCAPITULATIFS PROMPT #2

| Section | Score | Bloquant Prod ? |
|---------|-------|-----------------|
| 1. CUT LIST + Feature Flags | 90% ⚠️ | Non |
| 2. Architecture Packs | 70% ⚠️ | **OUI** (backend manquant) |
| 3. Data Model | 50% ⚠️ | **OUI** (tables manquantes) |
| 4. Permissions & Auth | 40% ❌ | **OUI** (auth manquante) |
| 5. Audit Center | 60% ⚠️ | **OUI** (backend manquant) |
| 6. Transparence "i" | 0% ❌ | Non (existant OK) |
| 7. Workflows/Notif | 20% ❌ | **OUI** (backend manquant) |
| 8. Test Plan | 50% ⚠️ | Non (doc OK) |
| 9. Navigation | 70% ⚠️ | Non (UI OK) |

**SCORE GLOBAL PROMPT #2** : **50%** ❌

---

# 🎯 PARTIE 3 : AUDIT PROMPT #1 (Grand prompt initial)

## CUT LIST

### Demandé
- Remove/Hide/Keep avec justifications

### Livré
✅ CUT_LIST.md complet (155 lignes)

**Score** : **100%** ✅

---

## PACKS / LIVRABLES

### Demandé
- Architecture Packs orientés livrables
- 4 segments

### Livré
✅ 4 templates créés (packTemplates.ts)
⚠️ UI créée mais props incompatibles
❌ Backend manquant

**Score** : **60%** ⚠️

---

## EXCEL-FIRST IMPORT/MAPPING

### Demandé
- Import Excel/CSV
- Mapping réutilisable

### Livré
✅ ImportCenter.tsx existant (Phase 4)
✅ Mapping réutilisable fonctionnel
⚠️ Pas de lien avec Packs

**Score** : **90%** ✅ (existant V1)

---

## EVIDENCE + CHECKLIST + AUDIT TRAIL

### Demandé
- Evidence Vault
- Checklist
- Audit Trail

### Livré
✅ EvidenceVault.tsx existant (Phase 7)
✅ ChecklistWorkflow.tsx existant (Phase 8)
✅ Historique.tsx existant (Audit Trail)
⚠️ Pas intégré avec Packs

**Score** : **90%** ✅ (existant V1)

---

## TRANSPARENCE KPI ("i")

### Demandé
- Fiche transparence avec warnings
- Interdire affichage sans CalculationProfile

### Livré
✅ TransparencyDemo.tsx existant (Phase 6)
❌ **PAS amélioré selon Section 6 du prompt #2**

**Score** : **50%** ⚠️ (existant OK, mais améliorations manquantes)

---

## EXPORTS ORIENTÉS LIVRABLES

### Demandé
- Exports PDF + ZIP
- Orientés Pack (pas générique)

### Livré
✅ ExportsLivrables.tsx existant
❌ **PAS orienté Pack** (export générique)

**Score** : **60%** ⚠️

---

## PERMISSIONS / RBAC

### Demandé
- Système de permissions
- 5 rôles

### Livré
✅ permissions.ts créé (390 lignes)
✅ PERMISSIONS.md créé (480 lignes)
❌ **Pas intégré** (pas de user context, props non fournies)

**Score** : **40%** ❌

---

## AUDIT CENTER

### Demandé
- File d'attente packs
- Actions auditeur

### Livré
✅ AuditCenter.tsx créé (480 lignes)
⚠️ Props incompatibles
❌ Backend manquant

**Score** : **60%** ⚠️

---

## ROADMAP V1/V1.1/V2

### Demandé
- Documentation roadmap

### Livré
✅ CUT_LIST.md contient roadmap V1/V2
✅ featureFlags.ts documente V1/V1.1/V2

**Score** : **100%** ✅

---

## PLAN DE TEST

### Demandé
- 15 tests E2E documentés

### Livré
✅ TEST_PLAN.md complet (720 lignes)
❌ 0/15 tests exécutés

**Score** : **50%** ⚠️

---

## SCORES RÉCAPITULATIFS PROMPT #1

| Élément | Score | Bloquant Prod ? |
|---------|-------|-----------------|
| CUT LIST | 100% ✅ | Non |
| Packs/Livrables | 60% ⚠️ | **OUI** |
| Import Excel | 90% ✅ | Non (existant) |
| Evidence+Checklist+Trail | 90% ✅ | Non (existant) |
| Transparence "i" | 50% ⚠️ | Non |
| Exports livrables | 60% ⚠️ | Non |
| Permissions/RBAC | 40% ❌ | **OUI** |
| Audit Center | 60% ⚠️ | **OUI** |
| Roadmap | 100% ✅ | Non |
| Plan de test | 50% ⚠️ | Non (doc OK) |

**SCORE GLOBAL PROMPT #1** : **70%** ⚠️

---

# ⚠️ PARTIE 4 : SECTION SPÉCIALE - PARCOURS & POSTURES

## Constat actuel (App.tsx)

### Ce qui est affiché dans l'UI

**Ligne 86-87** :
```typescript
type ParcoursType = "csrd-obligatoire" | "esg-structure";
type PostureType = "conseil" | "pre-audit" | "audit-externe";
```

**Lignes 143-168** : Sélecteur de **POSTURE** dans sidebar
- Mode Conseil (vert)
- Mode Pré-audit (orange)
- Mode Audit externe (rouge)

**Lignes 169-189** : Sélecteur de **PARCOURS** dans sidebar
- CSRD Obligatoire (badge sombre)
- ESG Structuré (badge vert)

**OnboardingPosture.tsx** (non vérifié mais importé ligne 28)
- Demande à l'utilisateur de choisir parcours + posture au démarrage

### Nombre total de combinaisons

**2 parcours × 3 postures = 6 vues différentes** :
1. CSRD Obligatoire + Mode Conseil
2. CSRD Obligatoire + Mode Pré-audit
3. CSRD Obligatoire + Mode Audit externe
4. ESG Structuré + Mode Conseil
5. ESG Structuré + Mode Pré-audit
6. ESG Structuré + Mode Audit externe

---

## Alignement avec les 2 prompts

### PROMPT #1 demandait :
> "Architecture en 4 packs opérationnels"

**4 segments** :
1. Donneur d'Ordre
2. Questionnaire ESG
3. Banque/Investisseurs
4. Pré-Audit / Audit-Ready

**PAS de mention de "parcours CSRD vs ESG"**

### PROMPT #2 (CUT_LIST.md) demandait :

**REMOVE** :
> "CSRD Full Coverage ESRS Exhaustif"

**Raison** :
> "Marché CSRD strict plus petit qu'anticipé"

### Contradiction identifiée

✅ **Postures** (Conseil / Pré-audit / Audit externe) = **COHÉRENT**
- Correspond aux rôles RBAC
- Aligné avec PERMISSIONS.md (CLIENT, CONSULTANT, AUDITOR)

❌ **Parcours** (CSRD Obligatoire vs ESG Structuré) = **CONTRADICTOIRE**
- CUT_LIST.md dit **supprimer CSRD exhaustif**
- **MAIS** App.tsx affiche toujours "CSRD Obligatoire" comme option
- **Confusion utilisateur** : "CSRD" est marqué comme REMOVE mais reste visible
- **Risque commercial** : Sur-promesse CSRD alors que positionnement = ESG audit-ready

---

## Recommandation actionnable

### Option A (RECOMMANDÉE) : Fusionner en un seul parcours "ESG Audit-Ready"

**Action** :
1. **Supprimer** le sélecteur de parcours (lignes 169-189 de App.tsx)
2. **Supprimer** `type ParcoursType` (ligne 86)
3. **Garder** uniquement les 3 postures (Conseil / Pré-audit / Audit externe)
4. **Renommer** les postures en **RÔLES** (pas "modes") :
   - Consultant
   - Pré-auditeur
   - Auditeur externe

**Navigation unifiée** :
```
Dashboard
Dossiers
  └─ Packs (4 templates)
     ├─ Donneur d'Ordre
     ├─ Questionnaire ESG
     ├─ Banque/Investisseurs
     └─ Pré-Audit/Audit-Ready
Import données
Indicateurs clés
Preuves & Documents
Checklist & Workflow
[Si rôle = Auditeur] Audit Center
Exports & Livrables
Audit Trail
Paramètres
```

**Avantages** :
- ✅ Cohérent avec CUT_LIST.md
- ✅ Simplifie l'UX (6 vues → 3 vues)
- ✅ Évite la confusion "CSRD Obligatoire" alors que supprimé
- ✅ Aligné avec architecture Packs

**Inconvénients** :
- Nécessite refactoring App.tsx (suppression `parcours` partout)
- Nécessite refactoring OnboardingPosture.tsx
- Estimation : **2-3 heures**

---

### Option B (DÉCONSEILLÉE) : Conserver mais renommer

**Action** :
1. Renommer "CSRD Obligatoire" → "Reporting structuré E/S/G"
2. Renommer "ESG Structuré" → "Reporting allégé E/S/G"
3. Masquer derrière feature flag `csrdFull`

**Avantages** :
- ✅ Peu de refactoring

**Inconvénients** :
- ❌ Maintient la confusion
- ❌ Pas aligné avec "Option A" (repositionnement)
- ❌ Complexité UI inutile

---

### Option C (SI MARCHÉ CSRD OBLIGATOIRE CONFIRMÉ) : Conserver mais feature-flag

**Action** :
1. Ajouter `csrdMandatory: false` dans featureFlags.ts
2. Masquer parcours "CSRD Obligatoire" si flag = false
3. Documenter dans CUT_LIST.md pourquoi conservé

**Avantages** :
- ✅ Flexibilité future si marché CSRD rebondit

**Inconvénients** :
- ❌ Complexité de maintenance
- ❌ Pas aligné avec positionnement "Option A"

---

## Risques UX/Commerciaux si on laisse tel quel

### Risque 1 : Confusion client
> "Vous dites que CSRD n'est pas le produit, mais vous affichez 'CSRD Obligatoire' en menu ?"

**Impact** : ⚠️ Crédibilité

### Risque 2 : Sur-promesse
> "J'ai choisi 'CSRD Obligatoire' mais où sont les ESRS détaillés ?"

**Impact** : ⚠️ Déception utilisateur, churn

### Risque 3 : Message marketing flou
> "C'est pour la CSRD ou pour l'ESG général ?"

**Impact** : ⚠️ Positionnement pas clair, difficulté commerciale

### Risque 4 : Onboarding trop complexe
> "6 combinaisons possibles avant de commencer"

**Impact** : ⚠️ Abandon onboarding, friction

---

## Décision recommandée

### 🎯 **SUPPRIMER les parcours, GARDER les postures comme rôles**

**Justification** :
1. CUT_LIST.md dit **REMOVE CSRD Full**
2. Architecture Packs = 4 segments (pas 2 parcours × 3 postures)
3. Simplification UX (6 → 3 vues)
4. Alignement commercial "ESG Audit-Ready"

**Effort** : 2-3 heures de refactoring  
**Impact** : ⚠️ **BLOQUANT pour cohérence produit**

---

# 📊 PARTIE 5 : RÉCAPITULATIF GLOBAL

## Documentation

| Type | Score | Commentaire |
|------|-------|-------------|
| CUT_LIST.md | 100% ✅ | Complet |
| DATA_MODEL.md | 100% ✅ | 19 tables documentées |
| PERMISSIONS.md | 100% ✅ | Matrice complète |
| TEST_PLAN.md | 100% ✅ | 15 tests documentés |
| PACK_TEMPLATES.json | 100% ✅ | 4 templates |
| packTemplates.ts | 100% ✅ | Code complet |

**SCORE DOCUMENTATION** : **100%** ✅

---

## UI (Composants React)

| Composant | Score | Commentaire |
|-----------|-------|-------------|
| PackSelector.tsx | 80% ⚠️ | Props incompatibles avec App.tsx |
| PackView.tsx | 80% ⚠️ | Props incompatibles avec App.tsx |
| AuditCenter.tsx | 80% ⚠️ | Props incompatibles avec App.tsx |
| App.tsx (navigation) | 70% ⚠️ | Packs OK, **parcours/postures contradictoires** |
| TransparencyDemo.tsx | 50% ⚠️ | Existant OK, améliorations Section 6 manquantes |

**SCORE UI** : **70%** ⚠️

---

## Logique métier / Persistance

| Élément | Score | Commentaire |
|---------|-------|-------------|
| Base de données | 0% ❌ | Aucune table créée |
| API REST | 0% ❌ | Aucune route |
| Authentification | 0% ❌ | Pas de JWT/session |
| RBAC backend | 0% ❌ | Permissions côté serveur manquantes |
| Automations Packs | 0% ❌ | Tout simulé frontend (setTimeout) |
| Notifications | 0% ❌ | Toasts au lieu de notifs système |
| Audit Trail persistant | 0% ❌ | Pas de logs DB |

**SCORE LOGIQUE MÉTIER** : **10%** ❌ (structure types OK, implémentation 0%)

---

## Sécurité & Permissions

| Élément | Score | Commentaire |
|---------|-------|-------------|
| permissions.ts (code) | 100% ✅ | Function can() complète |
| Intégration UI | 20% ❌ | `can()` appelé dans PackView mais props manquantes |
| User Context | 0% ❌ | Pas de currentUser global |
| Guards API | 0% ❌ | Pas d'API |
| RLS (Row Level Security) | 0% ❌ | Pas de DB |

**SCORE SÉCURITÉ** : **20%** ❌

---

## Tests

| Type | Score | Commentaire |
|------|-------|-------------|
| Documentation | 100% ✅ | 15 tests E2E documentés |
| Exécution | 0% ❌ | Aucun test exécuté |
| Rapport de bugs | 0% ❌ | Aucun bug reporté |
| Tests automatisés | 0% ❌ | Pas de Vitest/Playwright |

**SCORE TESTS** : **50%** ⚠️ (doc 100%, exec 0%)

---

## SCORE GLOBAL FINAL

| Catégorie | Score |
|-----------|-------|
| Documentation | 100% ✅ |
| UI | 70% ⚠️ |
| Logique métier | 10% ❌ |
| Sécurité | 20% ❌ |
| Tests (doc) | 100% ✅ |
| Tests (exec) | 0% ❌ |

**MOYENNE PONDÉRÉE** :
- Documentation (20%) : 100% × 0.2 = 20
- UI (25%) : 70% × 0.25 = 17.5
- Logique métier (30%) : 10% × 0.3 = 3
- Sécurité (15%) : 20% × 0.15 = 3
- Tests (10%) : 50% × 0.1 = 5

**SCORE GLOBAL** : **48.5%** ❌

**STATUT** : ⚠️ **NON PRODUCTION-READY**

---

# 📝 PARTIE 6 : TODO LIST PRIORISÉE

## P1 - BLOQUANT PRODUCTION (Critique)

### 1. Corriger props incompatibles (2-3 heures)

**Fichiers** :
- `/src/app/App.tsx`
- `/src/app/components/views/PackSelector.tsx`
- `/src/app/components/views/PackView.tsx`
- `/src/app/components/views/AuditCenter.tsx`

**Actions** :
1. Créer User Context (currentUser avec id, role, orgId)
2. Fournir currentUser dans App.tsx
3. Passer currentUser.role aux composants
4. Passer dossierId/dossierName à PackSelector
5. Passer currentAuditorId/Name à AuditCenter

**Critère de validation** : Composants s'affichent sans erreur console

---

### 2. Supprimer parcours CSRD/ESG (2-3 heures)

**Fichiers** :
- `/src/app/App.tsx`
- `/src/app/components/views/OnboardingPosture.tsx`

**Actions** :
1. Supprimer `type ParcoursType` (ligne 86)
2. Supprimer sélecteur parcours (lignes 169-189)
3. Remplacer `getNavigation(parcours, posture)` par `getNavigation(posture)`
4. Fusionner csrdNavigation et esgNavigation en une seule navigation
5. Mettre à jour OnboardingPosture pour ne demander que le rôle

**Critère de validation** : Menu affiche 1 seule navigation (pas 2 parcours)

---

### 3. Implémenter backend minimal (3-5 jours)

**Option A : Supabase** (recommandé)
- Créer projet Supabase
- Créer 19 tables (DATA_MODEL.md)
- Configurer RLS policies (PERMISSIONS.md)
- Connecter frontend (API client)
- Remplacer mock data par vraies queries

**Option B : Node.js + PostgreSQL**
- Setup serveur Express
- Setup PostgreSQL
- Migrations Prisma
- Routes API CRUD
- Middleware auth + RBAC

**Critère de validation** : Création pack persiste en DB

---

### 4. Intégrer authentification (1 jour)

**Actions** :
1. Setup Supabase Auth ou JWT
2. Créer User Context
3. Login/Logout UI
4. Persist session (localStorage)
5. Guards routes (redirect si non auth)

**Critère de validation** : User connecté voit son nom dans sidebar

---

### 5. Connecter Packs au backend (2 jours)

**Actions** :
1. API POST /packs/create
2. API GET /packs/:id
3. API PUT /packs/:id/status
4. API GET /audit-center/queue
5. API POST /packs/:id/approve
6. API POST /packs/:id/request-changes

**Critère de validation** : Pack créé visible après refresh page

---

## P2 - IMPORTANT (Non bloquant mais améliore qualité)

### 6. Améliorer TransparencyDemo (4 heures)

**Section 6 du PROMPT #2** :
- Ajouter warnings si pas de preuve
- Ajouter warning si facteur expiré
- Ajouter warning si donnée estimée
- Interdire affichage KPI sans CalculationProfile

**Fichiers** :
- `/src/app/components/views/TransparencyDemo.tsx`
- `/src/app/components/CalculationTransparency.tsx`

**Critère de validation** : Modal transparence affiche ⚠️ si preuve manquante

---

### 7. Créer PackExport.tsx (3 heures)

**Actions** :
1. Créer composant PackExport
2. Export PDF orienté Pack (résumé + checklist + KPIs + preuves)
3. Export ZIP (preuves + index.csv)
4. Intégrer dans PackView

**Critère de validation** : Bouton "Exporter" dans PackView fonctionne

---

### 8. Implémenter notifications système (1 jour)

**Actions** :
1. Créer table ESG_Notification
2. API POST /notifications
3. Composant NotificationCenter (dropdown)
4. Badge count dans sidebar
5. Remplacer toasts par notifs

**Critère de validation** : Notif "Pack approuvé" apparaît dans dropdown

---

### 9. Exécuter les 15 tests E2E (1 jour)

**Actions** :
1. Lire TEST_PLAN.md
2. Exécuter manuellement chaque test
3. Reporter résultats (PASS/FAIL)
4. Créer issues pour bugs trouvés
5. Mettre à jour TEST_PLAN.md avec statut

**Critère de validation** : 15/15 tests ont un statut PASS ou FAIL

---

## P3 - POLISH (Améliore UX mais pas critique)

### 10. Harmoniser PACK_TEMPLATES.json et packTemplates.ts (1 heure)

**Actions** :
1. Choisir une seule source (recommandé : packTemplates.ts)
2. Supprimer PACK_TEMPLATES.json ou le synchroniser
3. Documenter dans README quelle source utiliser

---

### 11. Ajouter tests automatisés (2 jours)

**Actions** :
1. Setup Vitest
2. Tests unitaires permissions.ts
3. Tests unitaires featureFlags.ts
4. Setup Playwright
5. Tests E2E critiques (création pack, approve)

---

### 12. Monitoring & Analytics (1 jour)

**Actions** :
1. Setup Sentry (erreurs)
2. Setup Posthog (analytics)
3. Tracking événements clés (pack créé, approuvé, etc.)

---

# 🎯 CONCLUSION DE L'AUDIT

## Verdict final

**SCORE GLOBAL** : **48.5%** ❌

**STATUT** : ⚠️ **NON PRODUCTION-READY**

---

## Points forts

✅ **Documentation exhaustive** : 2725 lignes (100%)  
✅ **Architecture claire** : Packs bien pensés  
✅ **Composants UI créés** : 3/4 composants livrés  
✅ **Types TypeScript** : Structure solide  
✅ **Feature flags** : Système flexible  

---

## Points bloquants

❌ **Backend 0%** : Aucune table, aucune API, aucune persistance  
❌ **Auth 0%** : Pas de currentUser, pas de session  
❌ **Props incompatibles** : Composants non fonctionnels avec App.tsx  
❌ **Parcours/Postures contradictoires** : Menu contredit CUT_LIST.md  
❌ **Section 6 ignorée** : Transparence "i" pas améliorée  
❌ **Tests 0%** : Aucun test exécuté  

---

## Effort pour production-ready

### Critique (P1) : **6-8 jours**
1. Corriger props (3h)
2. Supprimer parcours (3h)
3. Backend Supabase (3-5j)
4. Auth (1j)
5. Connecter Packs (2j)

### Important (P2) : **4-5 jours**
6. Améliorer transparence (4h)
7. PackExport (3h)
8. Notifications (1j)
9. Exécuter tests (1j)

### Polish (P3) : **3-4 jours**
10-12. Harmonisation + Tests auto + Monitoring

**TOTAL** : **13-17 jours** pour version production

---

## Recommandation finale

### Court terme (cette semaine)

**Priorité absolue** :
1. ✅ Corriger props incompatibles (débloquer UI)
2. ✅ Supprimer parcours CSRD/ESG (cohérence produit)
3. ✅ Setup Supabase + tables critiques (backend minimal)

**Temps** : 2-3 jours

---

### Moyen terme (mois prochain)

1. Authentification complète
2. API Packs complète
3. Tests E2E exécutés
4. Notifications système
5. Amélioration transparence "i"

**Temps** : 10-15 jours

---

## Hypothèses de l'audit

1. **OnboardingPosture.tsx non vérifié en détail** (importé mais pas inspecté)
2. **TransparencyDemo.tsx supposé existant** (vérifié par recherche)
3. **ExportsLivrables.tsx supposé générique** (pas orienté Packs)
4. **Props incompatibles vérifiés par code**, pas par exécution runtime
5. **Backend 0% confirmé** : Aucun fichier serveur trouvé

---

**Date d'audit** : 30 janvier 2026  
**Prochain audit recommandé** : Après implémentation P1 (backend + props)  
**Auditeur** : QA Senior SaaS B2B

---

*Fin du rapport d'audit exhaustif*
