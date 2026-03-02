# 🚀 TRANSFORMATION "OPTION A" — PROGRESS TRACKER

**Date de démarrage** : 30 janvier 2026  
**Objectif** : Transformer Solvid.IA de "outil CSRD + IA" vers **"ESG Audit-Ready Data Room"**

---

## ✅ PHASE 1 : SIMPLIFICATION & REPOSITIONNEMENT (EN COURS)

### 🎯 Changements déjà implémentés

#### 1. **Nouveau positionnement produit** ✅
- **Tagline changée** : "Conformité ESG & CSRD" → **"ESG Audit-Ready Data Room"**
- **Message clair** : Plateforme de traçabilité et auditabilité ESG depuis Excel
- **Positionnement** : Preuves + Traçabilité + Consolidation (pas IA centrale)

#### 2. **Terminologie standard E/S/G** ✅
| ❌ Ancien (CSRD-speak) | ✅ Nouveau (standard ESG) |
|------------------------|---------------------------|
| "Double Matérialité" | "Enjeux prioritaires E/S/G" |
| "Mapping ESRS E1-S4" | "Thématiques E/S/G" |
| "Données Quantitatives" | "Indicateurs clés" |
| "Données Qualitatives" | "Informations qualitatives" |
| "Évaluation carbone" | "Carbone (E1)" |
| "CSRD / ESRS" | "Ressources conformité" |
| "Historique & audit" | **"Audit Trail"** |
| "Reporting & Audit" | **"Exports & Livrables"** |
| "Données ESG" (parcours ESG) | **"Preuves & Documents"** (Evidence Vault) |

#### 3. **Assistant IA masqué** ✅
- **SUPPRIMÉ** de la navigation par défaut (CSRD + ESG)
- **Raison** : Option A = pas de promesse IA centrale
- **Statut** : Code commenté, réactivable si besoin (flag feature)
- **Principe** : IA uniquement en mode Conseil, jamais en Audit

#### 4. **Navigation simplifiée** ✅
**Parcours CSRD** (10 onglets Conseil) :
1. Dashboard
2. Dossiers
3. Enjeux prioritaires E/S/G
4. Thématiques E/S/G
5. Indicateurs clés
6. Informations qualitatives
7. Carbone (E1)
8. Ressources conformité
9. Collaboration
10. Rapports (Conseil) / Exports & Livrables (Pré-audit/Audit)
11. Audit Trail
12. Paramètres

**Parcours ESG** (11 onglets Conseil) :
1. Dashboard
2. Dossiers
3. Enjeux prioritaires
4. Thématiques E/S/G
5. Indicateurs clés
6. Informations qualitatives
7. Carbone (E1)
8. EUDR (optionnel)
9. **Preuves & Documents** ← renommé pour clarté
10. Ressources conformité
11. Collaboration
12. Rapports / Exports & Livrables
13. Audit Trail
14. Paramètres

---

## 📋 CUT LIST — STATUT

### 🔴 SUPPRIMÉ
- ✅ Assistant IA (navigation masquée par défaut)
- ✅ Vocabulaire CSRD non-standard (remplacé par E/S/G)
- ✅ Tagline "Conformité ESG & CSRD" (trop restrictif)

### 🟡 À FAIRE (PHASE 2)
- ⏳ Fusionner "Bibliothèque conformité" + "Vérificateur conformité" → 1 seul onglet "Ressources conformité"
- ⏳ Simplifier les 3 dashboards (Conseil/Pré-audit/Audit) → 1 dashboard universel "Complétude / Manquants / À valider"
- ⏳ Retirer module EUDR profond → pack optionnel activable si secteur forestier

### 🟢 CONSERVÉ & À RENFORCER (PHASE 3-4)
- ✅ Gestion Dossiers (cœur produit)
- ✅ Collaboration + workflow Conseil ↔ Audit
- ✅ Audit Trail (traçabilité)
- ⏳ Système de preuves (Evidence Vault) — à créer
- ⏳ Import Excel/CSV + mapping — à créer
- ⏳ Packs livrables (Donneur d'Ordre / Banque / etc.) — à créer

---

## 🎯 PROCHAINES ÉTAPES (ROADMAP IMMÉDIATE)

### **PHASE 2 : SIMPLIFICATION DASHBOARDS & FUSION MODULES** (2-3h)
**Priorité : HAUTE**

#### Tâche 2.1 : Fusionner Dashboards
- [ ] Créer `DashboardUniversal.tsx` unique
- [ ] KPIs universels : 🔴 Missing / 🟡 In Progress / 🔵 Ready for Review / ✅ Accepted
- [ ] Adapter affichage selon posture (Conseil/Pré-audit/Audit)
- [ ] Supprimer `DashboardConseil.tsx`, `DashboardPreAudit.tsx`, `DashboardAuditExterne.tsx`

#### Tâche 2.2 : Fusionner "Ressources conformité"
- [ ] Fusionner `ComplianceLibrary.tsx` + `ComplianceChecker.tsx` → `ResourcesConformite.tsx`
- [ ] Onglets : "Bibliothèque" / "Pré-contrôles automatiques"
- [ ] Simplifier contenu bibliothèque (structure E/S/G minimale + liens officiels)
- [ ] Supprimer les 2 onglets séparés dans navigation

---

### **PHASE 3 : ARCHITECTURE "PACKS"** (1 journée)
**Priorité : CRITIQUE**

#### Tâche 3.1 : Créer composant `PackSelector`
- [ ] Modal/Page sélection pack lors création dossier
- [ ] 4 packs V1 : Donneur d'Ordre / Questionnaire ESG / Banque / Audit-Ready
- [ ] Description + icône + checklist preview

#### Tâche 3.2 : Modifier `CreationDossier.tsx`
- [ ] Ajouter étape "Sélection pack"
- [ ] Génération automatique checklist selon pack choisi
- [ ] Téléchargement modèle Excel pré-configuré

#### Tâche 3.3 : Créer composant `PackView.tsx`
- [ ] Onglets : Checklist / Indicateurs E/S/G / Preuves / Exports
- [ ] Progress bar % complétude
- [ ] Actions : Exporter pack / Télécharger modèle Excel

---

### **PHASE 4 : IMPORT EXCEL/CSV + MAPPING** (2 jours)
**Priorité : CRITIQUE**

#### Tâche 4.1 : Créer `ImportCenter.tsx`
- [ ] Upload fichier (drag & drop)
- [ ] Parsing CSV/Excel (librairie `papaparse` ou `xlsx`)
- [ ] Aperçu 10 premières lignes
- [ ] Mapping colonnes (dropdown : Entité / Période / Catégorie / Indicateur / Valeur / Unité)
- [ ] Sauvegarde mapping réutilisable

#### Tâche 4.2 : Créer logique recalcul indicateurs
- [ ] Parser données importées → création `ESG_DataRow` (state/context)
- [ ] Agrégation valeurs selon formules (SUM, AVG, RATIO)
- [ ] Mise à jour `ESG_IndicatorValue`
- [ ] Création `ESG_CalculationInput` (inputs sources)

#### Tâche 4.3 : Créer modal "i" Transparence
- [ ] Bouton "i" à côté de chaque indicateur
- [ ] Modal affiche : formule, lignes sources, hypothèses, preuves, dernière MAJ
- [ ] Lien vers lignes Excel sources (numéro ligne)

---

### **PHASE 5 : EVIDENCE VAULT (PREUVES)** (1 journée)
**Priorité : HAUTE**

#### Tâche 5.1 : Créer `EvidenceVault.tsx`
- [ ] Upload fichiers (PDF, Excel, images)
- [ ] Ajout liens externes (Google Drive, etc.)
- [ ] Métadonnées : type (Facture/Contrat/Attestation), période, entité, indicateurs liés
- [ ] Filtres : type, période, statut
- [ ] Prévisualisation PDF (modal)

#### Tâche 5.2 : Liaison preuves ↔ indicateurs
- [ ] Composant `EvidenceLinkManager`
- [ ] Multi-sélection indicateurs lors upload preuve
- [ ] Table `ESG_EvidenceLink` (many-to-many)
- [ ] Affichage preuves liées dans détail indicateur

#### Tâche 5.3 : Validation bloquée sans preuve
- [ ] Warning si indicateur status "Provided" mais aucune preuve
- [ ] Erreur bloquante si auditeur tente "Validated" sans preuve

---

### **PHASE 6 : AUDIT TRAIL RENFORCÉ** (1/2 journée)
**Priorité : MOYENNE**

#### Tâche 6.1 : Renforcer granularité historique
- [ ] Enregistrer TOUTES actions critiques (imports, validations, rejets, commentaires)
- [ ] Afficher valeur avant/après pour modifications
- [ ] Horodatage précis (date + heure)
- [ ] IP utilisateur (optionnel)

#### Tâche 6.2 : Export journal PDF
- [ ] Bouton "Exporter Audit Trail"
- [ ] PDF horodaté avec filtres appliqués
- [ ] Mention "Document immutable"

---

### **PHASE 7 : EXPORTS LIVRABLES** (1 journée)
**Priorité : HAUTE**

#### Tâche 7.1 : Créer `ExportsLivrables.tsx`
- [ ] Sélection type export : Pack spécifique / Dossier complet
- [ ] Options : Inclure preuves / Inclure audit trail / Inclure données brutes
- [ ] Génération PDF synthèse (15-20 pages) :
  - Page de garde
  - Résumé exécutif (% complétude)
  - Checklist complétude
  - KPIs E/S/G
  - Inventaire preuves
  - Audit trail
- [ ] Génération ZIP annexes (preuves + Excel données + checklist)

#### Tâche 7.2 : Historique exports
- [ ] Table exports générés (date, version, auteur, taille)
- [ ] Actions : Télécharger PDF / Télécharger ZIP / Supprimer
- [ ] Versionning automatique

---

## 📊 MÉTRIQUES DE SUCCÈS

### KPIs Produit (objectifs V1)
- [ ] Navigation simplifiée : **≤ 12 onglets** (vs 15 avant)
- [ ] Terminologie : **100% standard E/S/G** (0% jargon CSRD)
- [ ] IA masquée : **0 mention IA** dans navigation par défaut
- [ ] Temps import Excel : **< 5 sec** pour 1000 lignes
- [ ] % complétude dashboard : **temps réel** (recalcul auto)
- [ ] Export PDF : **< 30 sec** génération pack complet

### KPIs UX (objectifs V1)
- [ ] Onboarding : **< 3 clics** pour créer dossier + pack
- [ ] Import Excel : **1 clic** si mapping réutilisé
- [ ] Transparence calcul : **1 clic "i"** pour voir sources
- [ ] Audit trail : **100% actions** enregistrées

---

## 🛠️ STACK TECHNIQUE (RECOMMANDATIONS)

### Frontend (actuel)
- ✅ React + TypeScript
- ✅ Tailwind CSS v4
- ✅ Lucide Icons
- ✅ Vite

### À ajouter pour V1
- [ ] **papaparse** : parsing CSV
- [ ] **xlsx** : parsing Excel
- [ ] **jsPDF** ou **react-pdf** : génération PDF exports
- [ ] **JSZip** : génération ZIP annexes
- [ ] **Supabase** (recommandé) :
  - Database (PostgreSQL)
  - Auth (permissions par rôle)
  - Storage (preuves fichiers)
  - Row Level Security (RLS)

### Structure DB (tables critiques V1)
```sql
-- Voir plan détaillé section "4️⃣ DATA MODEL" dans document principal
- Organization
- User
- ESG_Dossier
- ESG_Pack
- ESG_ChecklistItem
- ESG_DataImport
- ESG_DataRow
- ESG_Indicator
- ESG_IndicatorValue
- ESG_CalculationProfile
- ESG_CalculationInput
- ESG_Evidence
- ESG_EvidenceLink
- ESG_CommentThread
- ESG_Comment
- ESG_AuditLog
- ESG_Task
```

---

## 📝 DÉCISIONS PRODUIT ACTÉES

### ✅ Décisions stratégiques
1. **Pas de promesse IA centrale** — IA optionnelle uniquement en mode Conseil
2. **Terminologie standard E/S/G** — pas de catégories inventées
3. **Excel comme point d'entrée** — l'import Excel doit être 10x plus simple
4. **Auditabilité = cœur produit** — preuves + traçabilité + "i" transparence non négociables
5. **4 segments = 1 socle** — architecture "Packs" permet de servir Donneurs d'ordre / PME / Banques / Pré-audit

### ✅ Décisions UX
1. **Dashboard unique** — adapté selon posture (pas 3 dashboards différents)
2. **Navigation ≤ 12 onglets** — simplicité radicale
3. **"i" Transparence** — bouton visible à côté de CHAQUE indicateur
4. **Exports orientés livrables** — PDF + ZIP, pas de génération narratif auto

### ✅ Décisions techniques
1. **Supabase comme backend** — rapidité développement, RLS natif, storage intégré
2. **Mapping réutilisable** — sauvegardé en JSON, réapplication 1 clic
3. **Audit trail immutable** — append-only, aucune modification possible
4. **Validation bloquée sans preuve** — règle non négociable côté DB

---

## 🚦 STATUT GLOBAL

| Phase | Statut | Effort estimé | Priorité |
|-------|--------|---------------|----------|
| **Phase 1 : Simplification & repositionnement** | ✅ **TERMINÉE** | 2h | CRITIQUE |
| **Phase 2 : Dashboards & fusion modules** | ⏳ **EN ATTENTE** | 3h | HAUTE |
| **Phase 3 : Architecture Packs** | ⏳ **EN ATTENTE** | 1j | CRITIQUE |
| **Phase 4 : Import Excel + mapping** | ⏳ **EN ATTENTE** | 2j | CRITIQUE |
| **Phase 5 : Evidence Vault** | ⏳ **EN ATTENTE** | 1j | HAUTE |
| **Phase 6 : Audit Trail renforcé** | ⏳ **EN ATTENTE** | 0.5j | MOYENNE |
| **Phase 7 : Exports livrables** | ⏳ **EN ATTENTE** | 1j | HAUTE |

**Total effort estimé V1** : **7.5 jours** (≈ 30 jours avec 1-2 devs + 1 designer)

---

## 📞 PROCHAINES ACTIONS IMMÉDIATES

### Pour continuer maintenant :
1. **Valider ce document** avec les stakeholders (fondateurs, clients pilotes)
2. **Choisir** : continuer Phase 2 (Dashboards) OU passer directement Phase 3 (Packs) ?
3. **Setup Supabase** (recommandé) : créer projet + base données + tables schema
4. **Maquettes Figma** (optionnel mais conseillé) : Import Center, Pack View, Evidence Vault

### Pour démarrer Phase 2 (Dashboards) :
```bash
# Créer nouveau composant Dashboard universel
touch /src/app/components/views/DashboardUniversal.tsx
```

### Pour démarrer Phase 3 (Packs) :
```bash
# Créer composants architecture Packs
touch /src/app/components/views/PackSelector.tsx
touch /src/app/components/views/PackView.tsx
```

---

**🎉 Félicitations ! La transformation "Option A" est lancée.**

**Question stratégique** : Veux-tu continuer avec **Phase 2 (simplification)** ou passer directement à **Phase 3-4 (features cœur : Packs + Import Excel)** ?
