# 🧪 PLAN DE TEST - ESG AUDIT-READY DATA ROOM

## Objectif

Valider les **15 workflows critiques** de la plateforme avec des scénarios end-to-end (E2E) couvrant :
- Import & consolidation données
- Architecture Packs
- Evidence Vault
- Workflow Audit (Ready for Review → Approve/Reject)
- Exports audit-ready
- Permissions RBAC
- Audit Trail

**Format** : Préconditions / Étapes / Résultat attendu

---

## 🎯 TEST 1 : Import Excel + Mapping Sauvegardé

### Objectif
Vérifier que l'import Excel fonctionne et que le mapping est réutilisable

### Préconditions
- Utilisateur connecté : role `CONSULTANT`
- Dossier existant : "Exercice 2024"
- Fichier Excel préparé : `donnees_carbone_2024.xlsx`
  - Colonnes : `Indicateur`, `Valeur`, `Unité`, `Source`
  - Lignes : Scope 1, Scope 2, Scope 3

### Étapes
1. Naviguer vers Dossier "Exercice 2024" → onglet "Import"
2. Glisser-déposer `donnees_carbone_2024.xlsx`
3. Système parse le fichier → affiche prévisualisation
4. Mapper les colonnes :
   - `Indicateur` → Nom de l'indicateur
   - `Valeur` → Valeur numérique
   - `Unité` → Unité
   - `Source` → Source de données
5. Nommer le mapping : "Import Carbone Standard"
6. Cocher "Sauvegarder le mapping pour réutilisation"
7. Cliquer "Importer"

### Résultat attendu
- ✅ Import réussi avec message "3 lignes importées"
- ✅ Mapping sauvegardé visible dans "Mes templates de mapping"
- ✅ Données visibles dans onglet "Données ESG"
- ✅ AuditLog créé : `action_type = 'DATA_IMPORTED'`
- ✅ Toast success affiché

---

## 🎯 TEST 2 : Re-import Même Template → Mapping Réappliqué

### Objectif
Vérifier que le mapping sauvegardé est automatiquement réappliqué

### Préconditions
- Mapping "Import Carbone Standard" existe (créé dans Test 1)
- Nouveau fichier : `donnees_carbone_Q1_2024.xlsx` avec MÊMES colonnes

### Étapes
1. Naviguer vers Dossier "Exercice 2024" → onglet "Import"
2. Glisser-déposer `donnees_carbone_Q1_2024.xlsx`
3. Système détecte colonnes similaires
4. Cliquer sur "Utiliser template : Import Carbone Standard"
5. Vérifier prévisualisation (mapping auto-appliqué)
6. Cliquer "Importer"

### Résultat attendu
- ✅ Mapping réappliqué automatiquement (pas de re-mapping manuel)
- ✅ Import réussi
- ✅ Temps d'import < 5 secondes
- ✅ AuditLog créé

---

## 🎯 TEST 3 : KPI Recalcul Après Nouvel Import

### Objectif
Vérifier que les KPIs sont recalculés automatiquement après import

### Préconditions
- Dossier avec import initial : Scope 1 = 1000 tCO2e
- KPI "Total Émissions GES" calculé : 1000 tCO2e
- Pack "Réponse Donneur d'Ordre" actif

### Étapes
1. Importer nouveau fichier avec Scope 1 = 1200 tCO2e (correction)
2. Système détecte doublon période/indicateur
3. Choisir "Remplacer les données existantes"
4. Naviguer vers Pack → onglet "KPIs"

### Résultat attendu
- ✅ KPI "Total Émissions GES" recalculé automatiquement : 1200 tCO2e
- ✅ PackKPIRequirement.status passe de `COMPUTED` → `COMPUTED` (maj)
- ✅ `computed_at` mis à jour
- ✅ Historique calcul conserve ancienne valeur (1000 tCO2e) dans audit trail
- ✅ Warning affiché : "Valeur mise à jour, vérifiez les preuves associées"

---

## 🎯 TEST 4 : KPI Accepted Bloqué Sans Preuve

### Objectif
Vérifier la contrainte critique : KPI ne peut pas être `ACCEPTED` sans preuve

### Préconditions
- KPI "Scope 1" calculé : 1200 tCO2e
- Status actuel : `COMPUTED`
- Aucune preuve liée à ce KPI

### Étapes
1. Utilisateur connecté : role `AUDITOR`
2. Naviguer vers Audit Center → Pack "Réponse Donneur d'Ordre"
3. Onglet KPIs → sélectionner "Scope 1"
4. Tenter de cliquer bouton "Accepter"

### Résultat attendu
- ✅ Bouton "Accepter" **grisé/désactivé**
- ✅ Tooltip affiché : "⚠️ Impossible d'accepter ce KPI sans preuve associée"
- ✅ Warning badge rouge affiché : "Aucune preuve liée"
- ✅ Suggestion affichée : "Demander une preuve via le bouton ci-dessous"
- ✅ Aucun changement de statut
- ✅ Aucune entrée AuditLog créée

---

## 🎯 TEST 5 : Ajout Preuve → Checklist Auto "Provided"

### Objectif
Vérifier que l'upload d'une preuve met à jour automatiquement la checklist

### Préconditions
- Pack "Réponse Donneur d'Ordre" actif
- Checklist item : "INVOICE_ENERGY" → status `MISSING`
- Aucune preuve de type `INVOICE_ENERGY`

### Étapes
1. Utilisateur connecté : role `CLIENT_CONTRIBUTOR`
2. Naviguer vers Pack → onglet "Preuves"
3. Cliquer "Ajouter une preuve"
4. Upload fichier : `facture_energie_2024.pdf`
5. Sélectionner type : `INVOICE_ENERGY`
6. Sélectionner indicateur lié : `ENERGY_TOTAL_KWH`
7. Période : 2024
8. Cliquer "Ajouter"

### Résultat attendu
- ✅ Preuve uploadée avec succès
- ✅ Checklist item "INVOICE_ENERGY" passe automatiquement de `MISSING` → `PROVIDED`
- ✅ Badge checklist affiché : `PROVIDED` (vert)
- ✅ AuditLog créé : `action_type = 'EVIDENCE_ADDED'`
- ✅ Toast success : "Preuve ajoutée et checklist mise à jour"
- ✅ KPI "ENERGY_TOTAL_KWH" affiche icône preuve (📎)

---

## 🎯 TEST 6 : Création Pack Donneur d'Ordre → Checklist Instanciée

### Objectif
Vérifier que la création d'un Pack instancie automatiquement sa checklist

### Préconditions
- Dossier "Exercice 2024" existant
- Template "PACK_DONNEUR_ORDRE" configuré avec :
  - 5 checklist items (dont 3 MANDATORY)
  - 6 KPIs par défaut

### Étapes
1. Utilisateur connecté : role `CONSULTANT`
2. Naviguer vers Dossier "Exercice 2024"
3. Cliquer "Ajouter un Pack"
4. Sélectionner template : "Réponse Donneur d'Ordre"
5. Nommer : "Pack Carrefour 2024"
6. Cliquer "Créer"

### Résultat attendu
- ✅ Pack créé avec `status = DRAFT`
- ✅ 5 checklist items créés automatiquement (tous status `MISSING`)
- ✅ 6 KPI requirements créés (tous status `MISSING`)
- ✅ Redirection vers PackView
- ✅ Onglet "Checklist" affiche les 5 items (3 avec badge "MANDATORY")
- ✅ Onglet "KPIs" affiche les 6 KPIs requis
- ✅ Score de complétude : 0%
- ✅ AuditLog créé : `action_type = 'PACK_CREATED'`

---

## 🎯 TEST 7 : ReadyForReview Bloqué Si Mandatory Missing

### Objectif
Vérifier qu'on ne peut pas soumettre un Pack incomplet

### Préconditions
- Pack "Pack Carrefour 2024" créé
- Checklist :
  - Item 1 (MANDATORY) : `MISSING`
  - Item 2 (MANDATORY) : `PROVIDED`
  - Item 3 (MANDATORY) : `MISSING`
  - Item 4 (RECOMMENDED) : `MISSING`
  - Item 5 (RECOMMENDED) : `PROVIDED`

### Étapes
1. Utilisateur connecté : role `CONSULTANT`
2. Naviguer vers Pack "Pack Carrefour 2024"
3. Tenter de cliquer bouton "Marquer Ready for Review"

### Résultat attendu
- ✅ Bouton "Marquer Ready for Review" **grisé/désactivé**
- ✅ Message affiché : "⚠️ 2 items obligatoires manquants"
- ✅ Liste des items manquants affichée :
  - Item 1 : "Périmètre organisationnel défini"
  - Item 3 : "Sources de données listées"
- ✅ Score de complétude affiché : 40% (2/5)
- ✅ Aucun changement de statut
- ✅ Toast error : "Veuillez compléter tous les items obligatoires"

---

## 🎯 TEST 8 : Consultant ReadyForReview → Apparaît AuditCenter

### Objectif
Vérifier le workflow de soumission pour revue

### Préconditions
- Pack "Pack Carrefour 2024"
- Tous items MANDATORY : `PROVIDED` ou `ACCEPTED`
- KPIs calculés avec preuves

### Étapes
1. Utilisateur connecté : role `CONSULTANT`
2. Naviguer vers Pack "Pack Carrefour 2024"
3. Cliquer bouton "Marquer Ready for Review" (maintenant actif)
4. Modal de confirmation :
   - Message : "Êtes-vous sûr ? Le pack sera soumis à l'auditeur."
   - Champ : "Assigner auditeur" (sélection)
5. Sélectionner auditeur : "Jean Dupont (AUDITOR)"
6. Cliquer "Confirmer"
7. **Changer de compte** → se connecter comme "Jean Dupont (AUDITOR)"
8. Naviguer vers "Audit Center"

### Résultat attendu
- ✅ Pack `status` passe de `IN_PROGRESS` → `READY_FOR_REVIEW`
- ✅ `reviewer_user_id` = ID de Jean Dupont
- ✅ AuditLog créé : `action_type = 'SUBMITTED_FOR_REVIEW'`
- ✅ Notification créée pour Jean Dupont
- ✅ **En tant qu'auditeur** : Pack visible dans file d'attente Audit Center
- ✅ Badge affiché : "1 pack en attente de revue"
- ✅ Toast consultant : "Pack soumis pour revue"
- ✅ Toast auditeur (notification) : "Nouveau pack à réviser"

---

## 🎯 TEST 9 : Auditor RequestChanges → Task + Notif + Status ChangesRequested

### Objectif
Vérifier le workflow de demande de modifications

### Préconditions
- Pack "Pack Carrefour 2024" en `READY_FOR_REVIEW`
- Utilisateur connecté : role `AUDITOR` (Jean Dupont)
- Pack assigné à cet auditeur

### Étapes
1. Ouvrir Audit Center → cliquer sur Pack "Pack Carrefour 2024"
2. Réviser onglet "Checklist" et "KPIs"
3. Identifier problème : KPI "Scope 3" manque de preuve détaillée
4. Cliquer bouton "Demander des modifications"
5. Modal s'ouvre :
   - Champ "Message" : "Le calcul Scope 3 nécessite le détail des postes (déplacements, achats, etc.)"
   - Champ "Assigner à" : "Marie Martin (CLIENT_CONTRIBUTOR)"
   - Champ "Due date" : "15/02/2026"
   - Champ "Priorité" : "HAUTE"
6. Cliquer "Envoyer"

### Résultat attendu
- ✅ Pack `status` passe de `READY_FOR_REVIEW` → `CHANGES_REQUESTED`
- ✅ Task créée :
  - `task_type = REQUEST_CHANGES`
  - `assigned_to_user_id` = ID de Marie Martin
  - `due_date` = 2026-02-15
  - `priority` = HIGH
  - `status` = TODO
- ✅ AuditLog créé : `action_type = 'CHANGES_REQUESTED'`
- ✅ Notification créée pour Marie Martin
- ✅ Toast auditeur : "Demande de modifications envoyée"
- ✅ Email envoyé à Marie Martin (si activé)
- ✅ Pack retiré de la file d'attente Audit Center

---

## 🎯 TEST 10 : Client Ajoute Preuve + Repasse ReadyForReview

### Objectif
Vérifier la boucle de retour après demande de modifications

### Préconditions
- Pack "Pack Carrefour 2024" en `CHANGES_REQUESTED`
- Task assignée à Marie Martin (CLIENT_CONTRIBUTOR)
- Utilisateur connecté : Marie Martin

### Étapes
1. Notification affichée : "Vous avez 1 tâche en attente"
2. Cliquer sur notification → redirigé vers Task
3. Lire description de la demande
4. Naviguer vers Pack → onglet "Preuves"
5. Upload nouveau fichier : `scope3_detail_2024.xlsx`
6. Type : `CARBON_CALCULATION`
7. Indicateur lié : `SCOPE3_CO2`
8. Cliquer "Ajouter"
9. Retour à la Task → cliquer "Marquer comme terminée"
10. Naviguer vers Pack → cliquer "Re-soumettre pour revue"

### Résultat attendu
- ✅ Preuve uploadée avec succès
- ✅ Task `status` passe de `TODO` → `DONE`
- ✅ `completed_at` renseigné
- ✅ Pack `status` repasse de `CHANGES_REQUESTED` → `READY_FOR_REVIEW`
- ✅ AuditLog créé : `action_type = 'RESUBMITTED_FOR_REVIEW'`
- ✅ Notification créée pour Jean Dupont (auditeur)
- ✅ Pack réapparaît dans file d'attente Audit Center
- ✅ Toast client : "Pack re-soumis pour revue"

---

## 🎯 TEST 11 : Auditor Approve → Status Approved + AuditLog

### Objectif
Vérifier le workflow d'approbation finale

### Préconditions
- Pack "Pack Carrefour 2024" en `READY_FOR_REVIEW` (après correction)
- Utilisateur connecté : role `AUDITOR` (Jean Dupont)
- Toutes preuves complètes

### Étapes
1. Ouvrir Audit Center → Pack "Pack Carrefour 2024"
2. Réviser onglets "Checklist", "KPIs", "Preuves"
3. Vérifier "i" transparence calcul pour chaque KPI
4. Cliquer bouton "Approuver le pack"
5. Modal de confirmation :
   - Message : "Êtes-vous sûr d'approuver ce pack ?"
   - Champ "Commentaire final" (optionnel)
6. Rédiger commentaire : "Pack conforme, calculs vérifiés"
7. Cliquer "Confirmer l'approbation"

### Résultat attendu
- ✅ Pack `status` passe de `READY_FOR_REVIEW` → `APPROVED`
- ✅ Tous ChecklistItems MANDATORY passent de `PROVIDED` → `ACCEPTED`
- ✅ Tous KPIRequirements passent de `COMPUTED` → `ACCEPTED`
- ✅ AuditLog créé : `action_type = 'PACK_APPROVED'` avec commentaire
- ✅ Notification créée pour le consultant + client
- ✅ Pack retiré de file d'attente Audit Center
- ✅ Badge "APPROUVÉ" (vert) affiché sur le pack
- ✅ Toast auditeur : "Pack approuvé avec succès"
- ✅ Email envoyé au consultant + client

---

## 🎯 TEST 12 : Export Pack PDF Contient KPI+Checklist+Preuves+AuditTrail

### Objectif
Vérifier que l'export PDF est complet et audit-ready

### Préconditions
- Pack "Pack Carrefour 2024" en `APPROVED`
- Utilisateur connecté : role `CONSULTANT`

### Étapes
1. Naviguer vers Pack "Pack Carrefour 2024"
2. Cliquer onglet "Exports"
3. Sélectionner format : "PDF Synthèse"
4. Options :
   - ☑ Inclure checklist
   - ☑ Inclure KPIs
   - ☑ Inclure inventaire preuves
   - ☑ Inclure audit trail (actions clés)
5. Cliquer "Générer PDF"
6. Attendre génération (barre de progression)
7. Télécharger fichier : `Pack_Carrefour_2024_Synthese.pdf`
8. Ouvrir le PDF

### Résultat attendu

**Structure PDF** :
- ✅ Page 1 : Page de garde
  - Titre : "Pack Réponse Donneur d'Ordre"
  - Nom : "Pack Carrefour 2024"
  - Date : "30 janvier 2026"
  - Statut : "APPROUVÉ"
  - Horodatage immutable
  
- ✅ Page 2 : Vue d'ensemble
  - Score de complétude : 100%
  - Période : 2024
  - Périmètre
  
- ✅ Page 3 : Checklist
  - Tableau : Item | Requirement Level | Status | Preuve
  - 5 items affichés avec statuts
  
- ✅ Page 4 : KPIs
  - Tableau : Indicateur | Valeur | Unité | Statut | Preuve
  - 6 KPIs affichés
  
- ✅ Page 5 : Inventaire Preuves
  - Liste : Nom fichier | Type | Indicateurs liés | Date upload
  - Toutes preuves listées
  
- ✅ Page 6 : Audit Trail (actions clés)
  - Tableau : Date | Action | Utilisateur
  - Actions : PACK_CREATED, SUBMITTED_FOR_REVIEW, CHANGES_REQUESTED, RESUBMITTED, APPROVED
  
- ✅ Page 7 : Déclaration audit
  - "Ce document a été généré le [date] à [heure]"
  - "Hash SHA256 : [hash]" (intégrité)

- ✅ Toast : "Export PDF généré avec succès"
- ✅ AuditLog créé : `action_type = 'EXPORT_GENERATED'`

---

## 🎯 TEST 13 : Export Pack ZIP Contient Preuves + Index.csv

### Objectif
Vérifier que l'export ZIP contient toutes les preuves et un index

### Préconditions
- Pack "Pack Carrefour 2024" en `APPROVED`
- 5 preuves uploadées

### Étapes
1. Naviguer vers Pack → onglet "Exports"
2. Sélectionner format : "ZIP Annexes"
3. Cliquer "Générer ZIP"
4. Télécharger fichier : `Pack_Carrefour_2024_Annexes.zip`
5. Décompresser le ZIP

### Résultat attendu

**Structure ZIP** :
```
Pack_Carrefour_2024_Annexes.zip
├── README.txt
├── Preuves/
│   ├── facture_energie_2024.pdf
│   ├── scope3_detail_2024.xlsx
│   ├── attestation_carbone.pdf
│   ├── export_sirh_2024.xlsx
│   └── rapport_hse.pdf
├── Calculs/
│   ├── SCOPE1_CO2_calcul.json
│   ├── SCOPE2_CO2_calcul.json
│   └── ENERGY_TOTAL_KWH_calcul.json
├── Sources_Excel/
│   ├── donnees_carbone_2024.xlsx
│   └── donnees_carbone_Q1_2024.xlsx
└── index.csv
```

**Contenu index.csv** :
```csv
Nom Fichier,Type,Catégorie,Indicateurs Liés,Période,Date Upload,Uploadé Par
facture_energie_2024.pdf,INVOICE_ENERGY,Preuves,ENERGY_TOTAL_KWH,2024,2026-01-15,Marie Martin
scope3_detail_2024.xlsx,CARBON_CALCULATION,Preuves,SCOPE3_CO2,2024,2026-01-28,Marie Martin
...
```

- ✅ Toutes les preuves présentes (5 fichiers)
- ✅ README.txt explicatif
- ✅ index.csv complet
- ✅ Structure organisée par type
- ✅ AuditLog créé : `action_type = 'EXPORT_GENERATED'`

---

## 🎯 TEST 14 : Viewer N'Accède Qu'aux Exports Partagés

### Objectif
Vérifier les permissions du rôle VIEWER

### Préconditions
- Pack "Pack Carrefour 2024" `APPROVED`
- Export PDF généré
- Utilisateur créé : role `VIEWER` (Analyste Banque XYZ)
- Utilisateur connecté : role `CONSULTANT`

### Étapes
1. **En tant que CONSULTANT**
2. Naviguer vers Pack → onglet "Exports"
3. Sélectionner export PDF du 2026-01-30
4. Cliquer "Partager"
5. Modal :
   - Champ "Email destinataire" : "analyste@banquexyz.com"
   - Checkbox "Créer compte Viewer" : ☑
   - Champ "Message" : "Voici notre rapport ESG 2024"
6. Cliquer "Envoyer"
7. **Se déconnecter**
8. **Se connecter comme VIEWER** : analyste@banquexyz.com
9. Naviguer vers "Mes exports partagés"

### Résultat attendu
- ✅ Email envoyé à analyste@banquexyz.com avec lien
- ✅ Compte VIEWER créé automatiquement
- ✅ **En tant que VIEWER** :
  - Navigation limitée : uniquement "Mes exports partagés"
  - Export PDF visible et téléchargeable
  - **AUCUN accès** à :
    - Données sources brutes
    - Preuves individuelles (sauf si dans ZIP)
    - Audit trail complet
    - Import center
    - KPIs détaillés (sauf dans PDF)
- ✅ AuditLog créé : `action_type = 'EXPORT_SHARED'`
- ✅ Toast VIEWER : "Vous avez accès à 1 export partagé"

---

## 🎯 TEST 15 : Audit Trail Complet - Toute Action Critique Loguée

### Objectif
Vérifier que toutes les actions critiques sont tracées dans l'audit trail

### Préconditions
- Pack "Pack Carrefour 2024" complété (de la création à l'approbation)
- Utilisateur connecté : role `AUDITOR`

### Étapes
1. Naviguer vers Dossier "Exercice 2024"
2. Cliquer onglet "Audit Trail"
3. Filtrer par `resource_type = PACK_INSTANCE`
4. Filtrer par `resource_id = Pack Carrefour 2024`
5. Trier par `created_at DESC`

### Résultat attendu

**Entrées AuditLog** (chronologique inversé) :
```
1. 2026-01-30 16:45:23 | PACK_APPROVED | Jean Dupont (AUDITOR)
   old_value: {"status": "READY_FOR_REVIEW"}
   new_value: {"status": "APPROVED", "comment": "Pack conforme..."}

2. 2026-01-29 14:30:12 | RESUBMITTED_FOR_REVIEW | Marie Martin (CLIENT)
   old_value: {"status": "CHANGES_REQUESTED"}
   new_value: {"status": "READY_FOR_REVIEW"}

3. 2026-01-28 18:20:45 | EVIDENCE_ADDED | Marie Martin (CLIENT)
   new_value: {"file_name": "scope3_detail_2024.xlsx", "linked_to": "SCOPE3_CO2"}

4. 2026-01-27 10:15:00 | CHANGES_REQUESTED | Jean Dupont (AUDITOR)
   old_value: {"status": "READY_FOR_REVIEW"}
   new_value: {"status": "CHANGES_REQUESTED", "message": "Le calcul Scope 3..."}

5. 2026-01-25 09:00:00 | SUBMITTED_FOR_REVIEW | Paul Conseil (CONSULTANT)
   old_value: {"status": "IN_PROGRESS"}
   new_value: {"status": "READY_FOR_REVIEW", "reviewer_id": "..."}

6. 2026-01-20 15:30:00 | EVIDENCE_ADDED | Marie Martin (CLIENT)
   new_value: {"file_name": "facture_energie_2024.pdf"}

7. 2026-01-15 11:00:00 | DATA_IMPORTED | Paul Conseil (CONSULTANT)
   new_value: {"file_name": "donnees_carbone_2024.xlsx", "rows": 3}

8. 2026-01-10 10:00:00 | PACK_CREATED | Paul Conseil (CONSULTANT)
   new_value: {"template": "PACK_DONNEUR_ORDRE", "name": "Pack Carrefour 2024"}
```

**Vérifications** :
- ✅ **TOUTES** les actions critiques loguées (minimum 8 entrées)
- ✅ Horodatage précis (secondes)
- ✅ `user_id` renseigné pour chaque action
- ✅ `old_value` et `new_value` en JSONB
- ✅ IP address renseignée (si disponible)
- ✅ **AUCUNE modification possible** (boutons éditer/supprimer absents)
- ✅ Export audit trail possible (CSV)
- ✅ Filtres fonctionnels (date, type action, utilisateur)

---

## 📊 Récapitulatif Tests

| # | Test | Criticité | Statut |
|---|------|-----------|--------|
| 1 | Import Excel + Mapping | 🔴 CRITIQUE | ☐ TODO |
| 2 | Re-import Mapping Réappliqué | 🟠 HAUTE | ☐ TODO |
| 3 | KPI Recalcul Auto | 🔴 CRITIQUE | ☐ TODO |
| 4 | KPI Accepted Bloqué Sans Preuve | 🔴 CRITIQUE | ☐ TODO |
| 5 | Preuve → Checklist Auto | 🟠 HAUTE | ☐ TODO |
| 6 | Pack Création → Checklist Instanciée | 🔴 CRITIQUE | ☐ TODO |
| 7 | ReadyForReview Bloqué | 🔴 CRITIQUE | ☐ TODO |
| 8 | ReadyForReview → AuditCenter | 🔴 CRITIQUE | ☐ TODO |
| 9 | RequestChanges → Task + Notif | 🔴 CRITIQUE | ☐ TODO |
| 10 | Re-soumission Après Correction | 🟠 HAUTE | ☐ TODO |
| 11 | Approve → Status Approved | 🔴 CRITIQUE | ☐ TODO |
| 12 | Export PDF Complet | 🔴 CRITIQUE | ☐ TODO |
| 13 | Export ZIP + Index | 🟠 HAUTE | ☐ TODO |
| 14 | Viewer Permissions Limitées | 🟡 MOYENNE | ☐ TODO |
| 15 | Audit Trail Complet | 🔴 CRITIQUE | ☐ TODO |

---

## 🚀 Exécution des Tests

### Ordre d'exécution recommandé

**Phase 1 : Import & Données** (Tests 1-3)  
**Phase 2 : Contraintes & Validations** (Tests 4-5)  
**Phase 3 : Architecture Packs** (Tests 6-7)  
**Phase 4 : Workflow Audit** (Tests 8-11)  
**Phase 5 : Exports & Permissions** (Tests 12-14)  
**Phase 6 : Audit Trail** (Test 15)

### Critères de succès global

- ✅ **15/15 tests passent** (100%)
- ✅ Aucune erreur console critique
- ✅ Temps d'exécution total < 30 minutes (manuel)
- ✅ Audit trail contient toutes les actions

---

## 📝 Suivi des Tests

**Template de rapport** :
```markdown
## Test #X : [Nom du Test]
**Date** : [Date exécution]
**Testeur** : [Nom]
**Environnement** : [Dev/Staging/Prod]

**Résultat** : ✅ PASS / ❌ FAIL

**Détails** :
- Étape 1 : ✅
- Étape 2 : ✅
- Étape 3 : ❌ Erreur : [description]

**Bugs identifiés** :
- [BUG-001] Description du bug
- [BUG-002] Description du bug

**Captures d'écran** :
- [screenshot_1.png]
```

---

**Version** : 1.0.0  
**Date** : 30 janvier 2026  
**Maintenu par** : QA Lead Solvid.IA

**Status global** : ☐ 0/15 tests passés
