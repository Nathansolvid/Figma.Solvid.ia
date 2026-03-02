# 📚 DOCUMENTATION SOLVID.IA

## ESG Audit-Ready Data Room

Version : 1.0.0  
Date : 30 janvier 2026  
Auteur : Équipe Solvid.IA

---

## 🎯 Vue d'ensemble

**Solvid.IA** est une plateforme B2B SaaS ESG repositionnée autour d'un concept central :

> **"Rendre les données ESG auditables, traçables et faciles à consolider — en partant d'Excel"**

### Positionnement unique

**Tagline** : *ESG Audit-Ready Data Room*

**Proposition de valeur** :
- ✅ Auditabilité : Transparence totale des calculs et sources
- ✅ Traçabilité : Audit trail complet de toutes les modifications
- ✅ Consolidation : Import Excel/CSV avec mapping intelligent
- ✅ Evidence-based : Gestion centralisée des pièces justificatives

---

## 🏗️ Architecture technique

### Stack technologique

**Frontend**
- React 18.3.1
- TypeScript
- Tailwind CSS v4
- Vite 6.3.5
- Lucide React (icônes)

**Bibliothèques principales**
- `recharts` - Graphiques et visualisations
- `papaparse` - Parsing CSV
- `xlsx` - Lecture fichiers Excel
- `jspdf` - Génération PDF
- `jszip` - Création archives ZIP
- `date-fns` - Gestion dates
- `react-hook-form` - Formulaires
- `sonner` - Notifications toast

**UI Components**
- Radix UI (composants accessibles)
- shadcn/ui (design system)
- Material UI (composants avancés)

---

## 📦 Structure du projet

```
/src
├── /app
│   ├── /components
│   │   ├── /ui              # Composants UI de base (Button, Card, etc.)
│   │   └── /views           # Vues principales de l'application
│   │       ├── OnboardingPosture.tsx
│   │       ├── DashboardUniversal.tsx
│   │       ├── ListeDossiers.tsx
│   │       ├── DoubleMaterialite.tsx
│   │       ├── MappingESRS.tsx
│   │       ├── DonneesQuantitatives.tsx
│   │       ├── DonneesQualitatives.tsx
│   │       ├── EvaluationCarbone.tsx
│   │       ├── DonneesESG.tsx
│   │       ├── Collaboration.tsx
│   │       ├── ChecklistWorkflow.tsx
│   │       ├── ExportsLivrables.tsx
│   │       └── ...
│   └── App.tsx              # Composant principal
├── /styles
│   ├── theme.css            # Thème global
│   └── fonts.css            # Polices personnalisées
└── main.tsx                 # Point d'entrée
```

---

## 🎨 Système de design

### Palette de couleurs

**Couleurs principales**
- Vert foncé primaire : `#0A3B2E`
- Vert accent : `#059669` → `#10B981`
- Vert clair : `#E8F3F0`

**Couleurs postures**
- Conseil : `#059669` (vert)
- Pré-audit : `#F59E0B` (orange)
- Audit externe : `#EA580C` (orange foncé)

**Couleurs sémantiques**
- Success : `#10B981`
- Warning : `#F59E0B`
- Error : `#EF4444`
- Info : `#3B82F6`

### Typographie

- Police principale : System font stack
- Titres : font-bold
- Corps de texte : font-normal

---

## 🚀 Fonctionnalités principales

### Phase 1 : Repositionnement ✅
- Onboarding posture (Conseil / Pré-audit / Audit externe)
- Choix parcours (CSRD Obligatoire / ESG Structuré)
- Navigation adaptative selon posture

### Phase 2 : Dashboard Universel ✅
- KPIs adaptatifs selon posture
- 4 vues : Consolidé, Environnement, Social, Gouvernance
- Graphiques interactifs (Recharts)
- Filtres période et scope

### Phase 3 : Import Excel/CSV ✅
- Drag & drop de fichiers
- Parsing intelligent (papaparse, xlsx)
- Mapping interactif colonnes → indicateurs
- Prévisualisation données
- Validation et import

### Phase 4 : Système d'indicateurs ✅
- 42 indicateurs ESG prédéfinis
- Classification E/S/G
- Formules de calcul transparentes
- Unités et méthodes explicites
- Drill-down sur chaque indicateur

### Phase 5 : Evidence Vault ✅
- Upload pièces justificatives
- Catégorisation automatique
- Association indicateur ↔ preuve
- Métadonnées complètes
- Recherche et filtres avancés

### Phase 6 : Collaboration ✅
- 3 modes selon posture :
  - **Conseil** : Discussion ouverte
  - **Pré-audit** : Q&A structurée
  - **Audit externe** : Demandes d'informations formelles
- Assignation tâches
- Statuts et priorités
- Notifications

### Phase 7 : Checklist & Workflow ✅
- 10 tâches mockées
- 6 KPIs temps réel
- Filtres avancés (statut, priorité, responsable)
- Actions en masse
- Vue Kanban et liste

### Phase 8 : Transparence & Calculs ✅
- Affichage formules de calcul
- Sources de données traçables
- Historique modifications
- Drill-down complet

### Phase 9 : Exports & Livrables ✅
- **Génération PDF synthèse** (jsPDF)
  - 7 sections structurées
  - Horodatage immutable
  - Versionning automatique
- **Génération ZIP annexes** (JSZip)
  - Structure /Preuves/ /Calculs/ /Sources_Excel/
  - README explicatif
- **Historique exports**
  - Conservation 30 jours
  - Actions : Aperçu, Télécharger, Supprimer

### Phase 10 : Tests + Polish ✅ (en cours)
- Documentation complète
- Guide d'utilisation
- Checklist de vérification

---

## 🎯 Parcours utilisateur

### Parcours 1 : CSRD Obligatoire

**Navigation disponible**
1. Dashboard
2. Dossiers
3. Enjeux prioritaires E/S/G (Double matérialité)
4. Thématiques E/S/G (Mapping ESRS)
5. Indicateurs clés
6. Informations qualitatives
7. Carbone (E1)
8. Ressources conformité
9. Collaboration / Demandes d'informations
10. Checklist & Workflow
11. Exports & Livrables (pré-audit/audit uniquement)
12. Rapports (conseil uniquement)
13. Audit Trail
14. Paramètres

### Parcours 2 : ESG Structuré

**Navigation disponible**
1. Dashboard
2. Dossiers
3. Enjeux prioritaires
4. Thématiques E/S/G
5. Indicateurs clés
6. Informations qualitatives
7. Carbone (E1)
8. EUDR (optionnel)
9. Preuves & Documents (Evidence Vault)
10. Ressources conformité
11. Collaboration / Demandes d'informations
12. Checklist & Workflow
13. Exports & Livrables (pré-audit/audit uniquement)
14. Rapports (conseil uniquement)
15. Audit Trail
16. Paramètres

---

## 🔐 Modes d'utilisation (Postures)

### Mode Conseil
**Public** : Consultants ESG accompagnant leurs clients

**Caractéristiques**
- ✅ Accès complet aux modules de saisie
- ✅ Assistant IA optionnel (masqué par défaut)
- ✅ Collaboration ouverte
- ✅ Génération rapports
- ❌ Pas d'exports audit-ready

**Badge** : Vert `#059669`

### Mode Pré-audit
**Public** : Équipes internes préparant un audit externe

**Caractéristiques**
- ✅ Focus sur l'auditabilité
- ✅ Checklist de préparation
- ✅ Exports audit-ready (PDF + ZIP)
- ✅ Q&A structurée
- ❌ Pas d'assistant IA

**Badge** : Orange `#F59E0B`

### Mode Audit externe
**Public** : Commissaires aux comptes / auditeurs externes

**Caractéristiques**
- 👁️ Lecture seule sur la plupart des modules
- ✅ Demandes d'informations formelles
- ✅ Exports audit-ready
- ✅ Audit trail complet
- ❌ Pas de modification données
- ❌ Pas d'assistant IA
- ❌ Pas de rapports

**Badge** : Orange foncé `#EA580C`

---

## 📊 Indicateurs ESG

### Environnement (E)

**Climat (E1)**
- Émissions GES Scope 1 (tCO2e)
- Émissions GES Scope 2 (tCO2e)
- Émissions GES Scope 3 (tCO2e)
- Intensité carbone (tCO2e/M€)

**Énergie**
- Consommation électricité (MWh)
- Consommation gaz naturel (MWh)
- Part énergies renouvelables (%)

**Eau**
- Consommation eau (m³)
- Recyclage eau (%)

**Déchets**
- Production déchets dangereux (t)
- Production déchets non dangereux (t)
- Taux de recyclage (%)

### Social (S)

**Effectifs**
- Effectif total (ETP)
- Répartition par type de contrat (%)
- Répartition par genre (%)
- Taux de turnover (%)

**Santé & Sécurité**
- Accidents du travail (nombre)
- Taux de fréquence accidents
- Jours d'arrêt maladie (jours)

**Formation**
- Heures de formation (h)
- Budget formation (€)
- Taux de participation (%)

**Diversité**
- Femmes au CA (%)
- Écart salarial H/F (%)
- Travailleurs handicapés (%)

### Gouvernance (G)

**Structure**
- Membres conseil d'administration
- Administrateurs indépendants
- Comités spécialisés

**Éthique**
- Code de conduite (Oui/Non)
- Formations anti-corruption (%)
- Signalements éthiques (nombre)

**Conformité**
- Amendes réglementaires (€)
- Litiges en cours (nombre)
- Certifications obtenues

---

## 🔄 Workflows principaux

### 1. Onboarding
```
1. Choix posture (Conseil / Pré-audit / Audit externe)
2. Choix parcours (CSRD Obligatoire / ESG Structuré)
3. Accès dashboard adaptatif
```

### 2. Import de données
```
1. Créer un dossier
2. Upload fichier Excel/CSV
3. Mapper colonnes → indicateurs
4. Prévisualiser données
5. Valider import
6. Consulter données consolidées
```

### 3. Ajout preuves
```
1. Naviguer vers Evidence Vault
2. Upload fichier (PDF, image, Excel)
3. Catégoriser (Facture, Attestation, etc.)
4. Associer à un indicateur
5. Valider métadonnées
```

### 4. Génération export audit
```
1. Naviguer vers Exports & Livrables
2. Sélectionner format (PDF / ZIP / Les deux)
3. Choisir période
4. Configurer options (preuves, calculs, graphiques)
5. Générer
6. Télécharger fichiers
```

### 5. Collaboration
```
Mode Conseil :
- Créer discussion
- Ajouter commentaires
- Mentionner collaborateurs

Mode Pré-audit :
- Créer question
- Assigner responsable
- Répondre et valider

Mode Audit externe :
- Créer demande d'information
- Assigner responsable interne
- Suivre statut réponse
```

---

## 🧪 Tests de vérification

### Checklist fonctionnelle

#### ✅ Onboarding
- [x] Sélection posture
- [x] Sélection parcours
- [x] Navigation adaptée selon choix

#### ✅ Dashboard
- [x] Affichage KPIs
- [x] 4 vues (Consolidé, E, S, G)
- [x] Graphiques interactifs
- [x] Filtres période

#### ✅ Imports
- [x] Upload Excel
- [x] Upload CSV
- [x] Mapping colonnes
- [x] Prévisualisation
- [x] Import données

#### ✅ Indicateurs
- [x] Liste des 42 indicateurs
- [x] Détail formules
- [x] Sources traçables
- [x] Drill-down

#### ✅ Evidence Vault
- [x] Upload fichiers
- [x] Catégorisation
- [x] Association indicateur
- [x] Recherche

#### ✅ Collaboration
- [x] Mode Conseil
- [x] Mode Pré-audit
- [x] Mode Audit externe
- [x] Assignation tâches

#### ✅ Checklist
- [x] Affichage tâches
- [x] KPIs temps réel
- [x] Filtres avancés
- [x] Actions en masse

#### ✅ Exports
- [x] Génération PDF
- [x] Génération ZIP
- [x] Historique exports
- [x] Téléchargement

---

## 🎓 Guide d'utilisation

### Pour les consultants (Mode Conseil)

1. **Démarrage**
   - Sélectionnez "Mode Conseil" à l'onboarding
   - Choisissez le parcours adapté à votre client
   - Explorez le dashboard pour comprendre la structure

2. **Collecte de données**
   - Créez un dossier pour votre client
   - Importez les fichiers Excel/CSV fournis
   - Mappez les colonnes vers les indicateurs ESG
   - Validez les données importées

3. **Ajout de preuves**
   - Collectez les pièces justificatives (factures, attestations, etc.)
   - Uploadez-les dans l'Evidence Vault
   - Associez chaque preuve à l'indicateur correspondant

4. **Collaboration**
   - Créez des discussions pour échanger avec le client
   - Assignez des tâches de collecte de données
   - Suivez l'avancement via la checklist

5. **Génération rapports**
   - Utilisez le module "Rapports" pour créer des synthèses
   - Exportez en PDF pour présentation client

### Pour les équipes pré-audit (Mode Pré-audit)

1. **Préparation**
   - Sélectionnez "Mode Pré-audit" à l'onboarding
   - Complétez la checklist de préparation

2. **Consolidation données**
   - Importez toutes les données ESG de l'entreprise
   - Vérifiez la traçabilité de chaque indicateur
   - Associez systématiquement les preuves

3. **Vérification**
   - Utilisez la fonctionnalité "Transparence" pour vérifier les calculs
   - Consultez l'audit trail pour valider l'historique

4. **Q&A structurée**
   - Anticipez les questions d'audit
   - Documentez les réponses avec preuves

5. **Export audit-ready**
   - Générez le package complet (PDF + ZIP)
   - Vérifiez que toutes les preuves sont incluses
   - Archivez le package pour l'audit

### Pour les auditeurs (Mode Audit externe)

1. **Accès lecture seule**
   - Recevez les accès en mode "Audit externe"
   - Explorez les données en lecture seule

2. **Demandes d'informations**
   - Créez des demandes formelles via le module Collaboration
   - Assignez à l'équipe interne
   - Suivez les statuts de réponse

3. **Vérification**
   - Consultez l'audit trail pour tracer toutes les modifications
   - Téléchargez les preuves depuis l'Evidence Vault
   - Vérifiez les formules de calcul dans le module Transparence

4. **Export**
   - Téléchargez le package audit-ready (PDF + ZIP)
   - Utilisez l'historique des exports pour tracer les versions

---

## 🔧 Configuration

### Variables d'environnement

Aucune variable d'environnement requise pour le MVP. Toutes les données sont mockées côté client.

### Déploiement

Le projet utilise Vite, donc pour construire :

```bash
npm run build
```

Les fichiers de production seront générés dans `/dist`.

---

## 📈 Roadmap future

### Court terme (Q1-Q2 2026)
- [ ] Connexion backend (API REST)
- [ ] Base de données PostgreSQL
- [ ] Authentification utilisateurs (JWT)
- [ ] Gestion multi-entreprises
- [ ] Permissions granulaires

### Moyen terme (Q3-Q4 2026)
- [ ] Module EUDR complet
- [ ] Intégration API externes (facturation, ERP)
- [ ] Notifications temps réel (WebSocket)
- [ ] Export formats additionnels (Word, Excel)
- [ ] Templates de rapports personnalisables

### Long terme (2027+)
- [ ] IA pour détection anomalies données
- [ ] Benchmarking sectoriel
- [ ] Module GRI Standards
- [ ] Module SFDR
- [ ] API publique pour intégrations tierces

---

## 🤝 Support

Pour toute question ou problème :
- Email : support@solvid.ia
- Documentation : docs.solvid.ia
- Slack : solvid-workspace

---

## 📝 Licence

© 2026 Solvid.IA - Tous droits réservés

---

**Dernière mise à jour** : 30 janvier 2026  
**Version documentation** : 1.0.0
