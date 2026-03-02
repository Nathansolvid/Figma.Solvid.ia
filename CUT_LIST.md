# 🔪 CUT LIST - REPOSITIONNEMENT "ESG AUDIT-READY DATA ROOM"

## Objectif du repositionnement

Transformer l'outil d'un positionnement "CSRD + IA" vers **"ESG Audit-Ready Data Room"** centré sur :
- ✅ Auditabilité
- ✅ Traçabilité  
- ✅ Consolidation depuis Excel
- ✅ Exports livrables (Packs)

---

## 🗑️ REMOVE (Supprimer de la navigation/UI par défaut)

### 1. CSRD Full Coverage ESRS Exhaustif
**Statut** : ❌ SUPPRIMÉ  
**Raison** :
- Marché CSRD strict plus petit qu'anticipé
- Référentiel trop changeant (EFRAG updates fréquents)
- Lourdeur excessive pour PME/ETI
- Complexité UX rebutante

**Impact UX** :
- ✅ Retirer la navigation "Mapping ESRS" détaillée
- ✅ Simplifier vers structure E/S/G standard
- ✅ Remplacer par approche "Packs" orientés livrables

**Maintenu** : Structure E/S/G de base (universelle)

---

### 2. Génération Automatique de Rapport Narratif Complet
**Statut** : ❌ SUPPRIMÉ  
**Raison** :
- Promesses IA souvent non tenues sur le marché
- Risque juridique : générer du texte sans validation
- Les consultants utilisent déjà ChatGPT/Mistral
- L'entreprise n'a pas toujours de politiques formalisées

**Impact UX** :
- ✅ Supprimer le bouton "Générer rapport automatique"
- ✅ Retirer les templates de narratif pré-rempli
- ✅ Focus sur exports de **données + preuves**, pas de storytelling

**Alternative** : Export structuré PDF + ZIP avec données vérifiables

---

### 3. Dashboards ESG Avancés / Scoring Sophistiqué
**Statut** : ❌ SUPPRIMÉ  
**Raison** :
- Risque de "belle UI" sans substance
- Scoring complexe sans preuves = valeur faible
- Détourne l'attention de la traçabilité
- Benchmarking sectoriel nécessite base de données externe (V2+)

**Impact UX** :
- ✅ Retirer les vues "Score ESG global"
- ✅ Supprimer graphiques radar/benchmarking
- ✅ Remplacer par dashboards simples "Complet / Manquant / À valider"

**Maintenu** : Dashboard simple avec KPIs clés E/S/G

---

### 4. Terminologie Maison / Catégories Inventées
**Statut** : ❌ SUPPRIMÉ  
**Raison** :
- Confusion utilisateur (chaque outil invente sa taxonomie)
- Nécessite formation supplémentaire
- Réduit la portabilité des données
- Marché attend des standards (E/S/G, VSME, GRI)

**Impact UX** :
- ✅ Retirer tous les labels propriétaires
- ✅ Utiliser uniquement : Environnement, Social, Gouvernance
- ✅ Si CSRD : utiliser codes ESRS officiels (E1, S1, etc.)
- ✅ Si VSME : utiliser structure VSME officielle

**Maintenu** : Terminologie ISO/GRI/ESRS standard

---

## 🔒 HIDE-EXPERIMENTAL (Feature Flag OFF par défaut)

### 1. Assistant IA
**Statut** : 🟡 CACHÉ PAR DÉFAUT (feature flag)  
**Raison** :
- IA n'est PAS le produit différenciant
- Utile uniquement en mode Conseil (suggestions, synthèse)
- JAMAIS en mode Audit (risque de biais)
- Sur-vendu par la concurrence → attentes déçues

**Activation** :
- ✅ Feature flag `aiAssistant: false` par défaut
- ✅ Activable uniquement si `posture === "Conseil"`
- ✅ Caché complètement en mode Pré-audit et Audit externe

**Impact UX** :
- Pas de bouton "Assistant IA" visible par défaut
- Activation via Settings > Experimental > AI Assistant (Conseil uniquement)
- Message clair : "Assistant optionnel pour suggestions, pas pour validation"

---

### 2. Connecteurs ERP/SIRH
**Statut** : 🟡 ROADMAP V2 (non implémenté V1)  
**Raison** :
- Complexité technique élevée
- Chaque ERP = connecteur sur-mesure
- Excel reste dominant en PME/ETI
- ROI incertain sur V1

**Activation** :
- ✅ Feature flag `connectors: false`
- ✅ Développement prévu Q3-Q4 2026

**Impact UX** :
- Pas de section "Connecteurs" en V1
- Import Excel/CSV suffit pour MVP

---

### 3. Modules Compliance Profonds (EUDR Deep-Tech)
**Statut** : 🟡 ROADMAP V2+ (non implémenté V1)  
**Raison** :
- Complexité technique (cartographie supply chain, géolocalisation)
- Marché de niche (déforestation importée)
- Nécessite partenariats data externes
- Pas critique pour 95% des clients V1

**Activation** :
- ✅ Feature flag `eudrAdvanced: false`
- ✅ Développement conditionné à demande client

**Impact UX** :
- Retirer navigation "EUDR" détaillée en V1
- Maintenir possibilité d'ajouter indicateurs EUDR manuellement via import Excel

---

### 4. Dashboards Multi-Normes Avancés
**Statut** : 🟡 CACHÉ (feature flag)  
**Raison** :
- Complexité UX élevée
- Nécessite expertise normative utilisateur
- Risque de confusion (CSRD vs GRI vs SFDR)

**Activation** :
- ✅ Feature flag `advancedDash: false`
- ✅ V1 : un seul référentiel par dossier

**Impact UX** :
- Dashboard unique E/S/G simple
- Pas de switch GRI/CSRD/SFDR en V1

---

## ✅ KEEP (Conserver et améliorer)

### 1. Dossiers ESG
**Statut** : ✅ CONSERVÉ + AMÉLIORÉ  
**Raison** : Socle organisationnel indispensable  
**Améliorations** :
- Ajouter notion de **Packs** dans chaque dossier
- Clarifier périmètre / période / objectif

---

### 2. Import Excel/CSV + Mapping Réutilisable
**Statut** : ✅ CONSERVÉ (CORE FEATURE)  
**Raison** : **Différenciateur clé** vs concurrence  
**Améliorations** :
- Sauvegarder templates de mapping
- Support multi-périodes (Q1, Q2, Année)
- Détection automatique colonnes (ML léger optionnel V1.1)

---

### 3. KPI Simples (42 indicateurs ESG)
**Statut** : ✅ CONSERVÉ  
**Raison** : Base de données normalisée essentielle  
**Améliorations** :
- Lier chaque KPI à un **Pack** (voir section Packs)
- Ajouter **statut audit** par KPI (Missing/Computed/Accepted/Rejected)

---

### 4. Evidence Vault
**Statut** : ✅ CONSERVÉ (CORE FEATURE)  
**Raison** : **Différenciateur clé** (auditabilité)  
**Améliorations** :
- Typage strict des preuves (Facture, Attestation, Export SIRH, etc.)
- Liaison preuve ↔ KPI ↔ Pack Checklist
- Métadonnées renforcées (période, entité, source, propriétaire)

---

### 5. Checklist & Statuts
**Statut** : ✅ CONSERVÉ + AMÉLIORÉ  
**Raison** : Workflow central pour audit  
**Améliorations** :
- Générer **checklist automatique par Pack**
- Statuts granulaires : Missing / Provided / NeedsReview / Accepted / Rejected
- Blocage transition "Ready for Review" si mandatory incomplet

---

### 6. Audit Trail
**Statut** : ✅ CONSERVÉ + RENFORCÉ  
**Raison** : Exigence réglementaire audit  
**Améliorations** :
- Logger **toutes** actions critiques :
  - Changement statut
  - Ajout/modif preuve
  - Import données
  - Validation/rejet
  - Commentaires auditeur
- Horodatage immutable
- Export audit trail en annexe ZIP

---

### 7. "i" Transparence Calcul
**Statut** : ✅ CONSERVÉ (CORE FEATURE)  
**Raison** : **Différenciateur unique** (audit-rejouable)  
**Améliorations** :
- Afficher **toujours** :
  - Formule
  - Étapes de calcul
  - Inputs (lignes importées) avec références
  - Preuves liées
  - Hypothèses/limitations
  - Dernière mise à jour
  - Statut audit
- ⚠️ Warning si : pas de preuve, facteur expiré, donnée estimée
- Interdire affichage KPI sans CalculationProfile

---

### 8. Exports Orientés Livrables
**Statut** : ✅ CONSERVÉ + RÉORIENTÉ  
**Raison** : Sortie finale attendue par client  
**Améliorations** :
- Export **par Pack** (pas générique) :
  - PDF synthèse (résumé + checklist + KPIs + inventaire preuves + audit trail clés)
  - ZIP annexes (preuves + calculs + sources Excel + index.csv)
- Horodatage immutable
- Versionning automatique

---

## 📊 Feature Flags Configuration

```json
{
  "packs": true,                  // ✅ V1 - Architecture centrale
  "aiAssistant": false,           // 🟡 OFF par défaut, activable en mode Conseil
  "csrdFull": false,              // ❌ CSRD exhaustif supprimé
  "advancedDash": false,          // 🟡 Dashboards avancés cachés
  "connectors": false,            // 🟡 V2 - Connecteurs ERP/SIRH
  "eudrAdvanced": false,          // 🟡 V2+ - Module EUDR profond
  "multiNormesView": false,       // 🟡 V2 - Switch GRI/CSRD/SFDR
  "benchmarkingSectoriel": false  // 🟡 V2+ - Comparaison sectorielle
}
```

---

## 🎯 Impact Global du Repositionnement

### Avant (CSRD + IA)
❌ Positionnement flou : "Outil CSRD avec IA"  
❌ Marché limité : entreprises soumises CSRD uniquement  
❌ Promesses IA sur-vendues  
❌ Complexité UX rebutante  
❌ Dépendance référentiel changeant  

### Après (ESG Audit-Ready Data Room)
✅ Positionnement clair : "Rendre les données ESG auditables, traçables, faciles à consolider — en partant d'Excel"  
✅ Marché élargi : 4 segments (fournisseurs, PME/ETI, investisseurs, compliance)  
✅ IA optionnelle (pas le produit)  
✅ UX simplifiée : Excel-first  
✅ Architecture Packs (livrables orientés demandeur)  

---

## 📈 Métriques de Succès du Repositionnement

| Critère | Avant | Après (Cible) |
|---------|-------|---------------|
| Temps onboarding | 45 min | < 10 min |
| Taux abandon import données | 60% | < 15% |
| NPS consultants | 20 | > 60 |
| Taux adoption Evidence Vault | 30% | > 80% |
| Exports audit-ready générés/mois | 10 | > 200 |

---

## 🚀 Prochaines Étapes

1. ✅ Appliquer feature flags dans `featureFlags.ts`
2. ✅ Implémenter architecture **Packs** (voir PACK_TEMPLATES.json)
3. ✅ Refactoriser navigation (retirer CSRD-only)
4. ✅ Masquer Assistant IA par défaut
5. ✅ Simplifier dashboards (focus complet/manquant/à valider)
6. ✅ Renforcer Evidence Vault + Audit Trail
7. ✅ Documenter terminologie standard (E/S/G, VSME)

---

**Date d'application** : 30 janvier 2026  
**Version** : 1.0.0 → 1.0.0-production-ready  
**Validé par** : Product Lead + Solution Architect
