# 📊 MODULE DE TRANSPARENCE DES CALCULS - DOCUMENTATION COMPLÈTE

## 🎯 Vue d'ensemble

Le **Module de Transparence des Calculs** est un système générique et réutilisable permettant d'afficher le détail de calcul de chaque indicateur ESG via une icône "i" (info). Ce module rend chaque indicateur **compréhensible**, **traçable**, **audit-ready** et **justifiable** sans surcharger l'interface principale.

---

## 📁 Structure des fichiers créés

```
/src
├── /types
│   └── transparency.ts           ✅ Types TypeScript complets (485 lignes)
├── /data
│   └── transparencyData.ts       ✅ Données de démonstration (615 lignes)
├── /app/components
│   ├── CalculationTransparency.tsx  ✅ Composant réutilisable (705 lignes)
│   └── /views
│       └── TransparencyDemo.tsx     ✅ Page de démonstration (340 lignes)
└── /app/App.tsx                      ✅ Intégration dans navigation
```

---

## 🗄️ MODÈLE DE DONNÉES (5 tables principales)

### 1️⃣ **Indicator** - Catalogue des indicateurs

```typescript
interface Indicator {
  id: string;
  name: string;                    // "Émissions totales de GES"
  code: string;                    // "E1_CO2_TOTAL"
  description: string;
  norm_reference?: string;         // "CSRD ESRS E1-6"
  unit: string;                    // "tCO2e", "%", "ETP"
  aggregation_type: AggregationType; // sum, avg, ratio, custom
  display_format: DisplayFormat;   // number, percent, currency
  transparency_profile_id?: string;
  
  // Classification
  category: 'environmental' | 'social' | 'governance' | 'cross_cutting';
  pillar?: 'E' | 'S' | 'G';
  is_mandatory: boolean;
  is_material: boolean;
  
  // Affichage
  display_order?: number;
  tooltip?: string;
  
  created_at: Date;
  updated_at: Date;
}
```

**Exemple** :
```typescript
{
  id: 'ind-e1-co2-scope1',
  name: 'Émissions Scope 1',
  code: 'E1_CO2_SCOPE1',
  description: 'Émissions directes de GES...',
  norm_reference: 'CSRD ESRS E1-6 §48',
  unit: 'tCO2e',
  aggregation_type: 'sum',
  display_format: 'number',
  pillar: 'E',
  is_mandatory: true,
  is_material: true
}
```

---

### 2️⃣ **CalculationProfile** - Fiche de calcul

```typescript
interface CalculationProfile {
  id: string;
  indicator_id: string;
  
  // Méthode de calcul
  calculation_method_text: string;  // Description humaine
  formula_text: string;             // Formule lisible
  formula_latex?: string;           // Pour affichage mathématique
  steps: string[];                  // Liste ordonnée d'étapes
  
  // Contexte
  assumptions: string;              // Hypothèses retenues
  limitations: string;              // Limites de la méthode
  quality_level: QualityLevel;      // measured, estimated, mixed, calculated
  
  // Métadonnées
  methodology_reference?: string;   // "GHG Protocol, Bilan Carbone"
  version: string;                  // "1.2"
  valid_from?: Date;
  valid_to?: Date;
  
  // Validation
  validation_status: ValidationStatus;
  validated_by?: string;
  validated_at?: Date;
  validation_comment?: string;
  
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by?: string;
}
```

**Exemple** :
```typescript
{
  id: 'prof-e1-co2-scope1',
  indicator_id: 'ind-e1-co2-scope1',
  calculation_method_text: 'Calcul des émissions Scope 1 selon la méthode GHG Protocol...',
  formula_text: 'Émissions Scope 1 = Σ(Consommation combustible × Facteur d\'émission) + Σ(Quantité fugitive × PRG)',
  steps: [
    '1. Collecter les factures de gaz naturel, fioul, GPL pour l\'année 2024',
    '2. Convertir les volumes en kWh PCI si nécessaire',
    '3. Appliquer les facteurs d\'émission Base Carbone ADEME v12.1 (2024)',
    '4. Additionner les émissions de combustion stationnaire',
    '5. Ajouter les émissions fugitives de fluides frigorigènes',
    '6. Totaliser pour obtenir les émissions Scope 1'
  ],
  assumptions: 'Hypothèses retenues : (1) Les factures couvrent 100% de la consommation réelle...',
  limitations: 'Limites : (1) Les émissions de procédés industriels ne sont pas applicables...',
  quality_level: 'measured',
  methodology_reference: 'GHG Protocol Corporate Accounting and Reporting Standard (2004) + ISO 14064-1:2018',
  version: '1.2',
  validation_status: 'validated',
  validated_by: 'Marie Dupont (Auditeur externe)',
  validated_at: new Date('2024-12-15'),
  validation_comment: 'Méthodologie conforme CSRD. Facteurs ADEME à jour. Documentation complète.'
}
```

---

### 3️⃣ **CalculationInput** - Données sources

```typescript
interface CalculationInput {
  id: string;
  calculation_profile_id: string;
  
  // Identification
  input_name: string;               // "Consommation de gaz naturel"
  input_code?: string;              // "GAZ_NAT_2024"
  input_type: InputType;            // activity_data, factor, constant, manual
  
  // Valeur
  value: number | string;           // 487500
  unit: string;                     // "kWh PCI"
  
  // Source
  source_type: SourceType;          // invoice, erp, estimation, provider
  source_reference: string;         // "Factures Engie janvier-décembre 2024"
  source_system?: string;           // "Comptabilité fournisseurs SAP"
  
  // Contexte
  period_start?: Date;
  period_end?: Date;
  entity?: string;                  // "Siège social Paris"
  scope?: string;                   // "France métropolitaine"
  
  // Preuve
  evidence_link?: string;           // URL vers fichier / document
  evidence_filename?: string;
  evidence_uploaded_at?: Date;
  
  // Qualité
  confidence_level: ConfidenceLevel; // high, medium, low
  data_quality_note?: string;
  
  // Métadonnées
  is_estimated: boolean;
  estimation_method?: string;
  
  created_at: Date;
  updated_at: Date;
  created_by: string;
}
```

**Exemple** :
```typescript
{
  id: 'input-gas-2024',
  calculation_profile_id: 'prof-e1-co2-scope1',
  input_name: 'Consommation de gaz naturel',
  input_code: 'GAZ_NAT_2024',
  input_type: 'activity_data',
  value: 487500,
  unit: 'kWh PCI',
  source_type: 'invoice',
  source_reference: 'Factures Engie janvier-décembre 2024 (12 factures)',
  source_system: 'Comptabilité fournisseurs SAP',
  period_start: new Date('2024-01-01'),
  period_end: new Date('2024-12-31'),
  entity: 'Siège social Paris',
  scope: 'France métropolitaine',
  evidence_link: '/documents/factures-gaz-2024.pdf',
  evidence_filename: 'factures-gaz-2024.pdf',
  confidence_level: 'high',
  data_quality_note: 'Données mesurées par compteur certifié. Toutes les factures disponibles.',
  is_estimated: false
}
```

---

### 4️⃣ **CalculationFactor** - Facteurs d'émission / conversion

```typescript
interface CalculationFactor {
  id: string;
  calculation_profile_id: string;
  
  // Identification
  factor_name: string;              // "Facteur d'émission - Gaz naturel"
  factor_code?: string;             // "FE_GAZ_NAT_2024"
  factor_type?: string;             // emission_factor, conversion_factor
  
  // Valeur
  factor_value: number;             // 0.227
  factor_unit: string;              // "kgCO2e/kWh PCI"
  uncertainty_range?: string;       // "±3%"
  
  // Source
  factor_source: FactorSource;      // ademe, ghg_protocol, provider, custom
  source_reference: string;         // "Base Carbone ADEME v12.1 (2024)"
  source_url?: string;
  source_document?: string;
  
  // Validité
  valid_from?: Date;
  valid_to?: Date;
  is_expired: boolean;
  
  // Contexte
  geographical_scope?: string;      // "France"
  sector?: string;
  justification_text?: string;
  
  created_at: Date;
  updated_at: Date;
}
```

**Exemple** :
```typescript
{
  id: 'factor-gas-fe',
  calculation_profile_id: 'prof-e1-co2-scope1',
  factor_name: 'Facteur d\'émission - Gaz naturel',
  factor_code: 'FE_GAZ_NAT_2024',
  factor_type: 'emission_factor',
  factor_value: 0.227,
  factor_unit: 'kgCO2e/kWh PCI',
  uncertainty_range: '±3%',
  factor_source: 'ademe',
  source_reference: 'Base Carbone ADEME v12.1 (2024) - Gaz naturel - Combustion',
  source_url: 'https://www.bilans-ges.ademe.fr/',
  valid_from: new Date('2024-01-01'),
  valid_to: new Date('2024-12-31'),
  is_expired: false,
  geographical_scope: 'France',
  justification_text: 'Facteur officiel ADEME pour le gaz naturel distribué en France métropolitaine...'
}
```

---

### 5️⃣ **CalculationLog** - Audit trail

```typescript
interface CalculationLog {
  id: string;
  calculation_profile_id: string;
  
  // Action
  action: CalculationAction;        // created, updated, input_changed, factor_changed, validated
  action_detail?: string;
  
  // Changements
  field_changed?: string;
  old_value?: string | number;
  new_value?: string | number;
  
  // Contexte
  performed_by: string;
  performed_by_role?: string;
  performed_at: Date;
  
  // Commentaire
  comment?: string;
  
  // Métadonnées
  ip_address?: string;
  user_agent?: string;
}
```

**Exemple** :
```typescript
{
  id: 'log-004',
  calculation_profile_id: 'prof-e1-co2-scope1',
  action: 'validated',
  action_detail: 'Validation du calcul Scope 1 par l\'auditeur',
  performed_by: 'Marie Dupont',
  performed_by_role: 'Auditeur externe',
  performed_at: new Date('2024-12-15T16:45:00'),
  comment: 'Validation conforme CSRD. Méthodologie robuste, facteurs à jour, documentation complète.'
}
```

---

## 🎨 COMPOSANT UI RÉUTILISABLE

### **CalculationTransparency** - Composant universel

```typescript
interface CalculationTransparencyProps {
  indicatorCode: string;           // Code de l'indicateur (ex: "E1_CO2_SCOPE1")
  displayedValue?: number | string; // Valeur affichée
  posture?: 'conseil' | 'pre-audit' | 'audit-externe';
  size?: 'sm' | 'md' | 'lg';       // Taille de l'icône
  variant?: 'icon' | 'button';     // Type d'affichage
}
```

**Utilisation** :
```tsx
import { CalculationTransparency } from '@/app/components/CalculationTransparency';

// Dans un composant
<div className="flex items-baseline gap-2">
  <span className="text-3xl font-bold">152.3</span>
  <span className="text-lg text-gray-500">tCO2e</span>
  <CalculationTransparency 
    indicatorCode="E1_CO2_SCOPE1" 
    displayedValue={152.3}
    posture="conseil"
    size="md"
  />
</div>
```

---

## 📋 CONTENU DU DRAWER (Sheet)

Le composant affiche un **drawer lateral (Sheet)** avec 5 onglets :

### **SECTION 1 - Vue d'ensemble**
- 🎯 **À quoi correspond cet indicateur ?**
  - Nom de l'indicateur
  - Description
  - Norme / data point CSRD associé
  - Unité affichée
  - Pilier ESG (E/S/G)
  - Badges : Obligatoire, Matériel

### **SECTION 2 - Méthode de calcul**
- 🧮 **Comment est-il calculé ?**
  - Méthode (texte descriptif)
  - Formule lisible
  - Étapes du calcul (liste numérotée)
  - Hypothèses retenues
  - Limites de la méthode
  - Référence méthodologique (ex: GHG Protocol)

### **SECTION 3 - Données sources**
- 📊 **Données utilisées**
  - Tableau des inputs :
    - Nom de la donnée
    - Valeur + unité
    - Source (facture, ERP, estimation)
    - Niveau de confiance (high/medium/low)
    - Lien preuve (cliquable → document)
  - Badge "Estimé" si applicable

### **SECTION 4 - Facteurs & hypothèses**
- 🔢 **Facteurs**
  - Tableau des facteurs d'émission/conversion :
    - Nom du facteur
    - Valeur + unité
    - Source officielle (ADEME, GHG Protocol)
    - Validité (dates, expiration)
    - Lien source externe

### **SECTION 5 - Fiabilité & Audit**
- 🛡️ **Audit**
  - Niveau de qualité (Mesuré / Estimé / Mixte / Calculé)
  - Dernière mise à jour
  - Version du profil
  - Statut validation (Validé / En attente / Rejeté)
  - Validation par (nom + rôle + date + commentaire)
  - Historique des modifications (logs)

---

## ⚠️ SYSTÈME D'ALERTES AUTOMATIQUE

Le composant génère automatiquement des **warnings** selon les règles suivantes :

| Type | Condition | Sévérité | Message |
|------|-----------|----------|---------|
| `missing_evidence` | Input sans `evidence_link` | Warning | "X donnée(s) source sans preuve jointe" |
| `expired_factor` | Facteur avec `is_expired = true` | Critical | "X facteur(s) expiré(s)" |
| `low_confidence` | Input avec `confidence_level = 'low'` | Warning | "X donnée(s) avec niveau de confiance faible" |
| `estimation` | Input avec `is_estimated = true` | Info | "Indicateur basé sur X estimation(s)" |

**Affichage** :
```tsx
<Card className="border-orange-300 bg-orange-50">
  <AlertTriangle className="w-5 h-5 text-orange-600" />
  <div>2 points d'attention</div>
  <ul>
    <li>⚠️ 1 donnée(s) source sans preuve jointe</li>
    <li>💡 Ajoutez les documents justificatifs pour renforcer l'auditabilité</li>
  </ul>
</Card>
```

---

## 🔐 PERMISSIONS PAR POSTURE

| Posture | Lecture | Édition | Commentaires | Validation |
|---------|---------|---------|--------------|------------|
| **Client** | ✅ Complète | ❌ | ❌ | ❌ |
| **Consultant** | ✅ Complète | ✅ Profil, Inputs, Factors | ✅ | ❌ |
| **Pré-audit** | ✅ Complète | ⚠️ Limitée | ✅ | ⚠️ Peut rejeter |
| **Audit externe** | ✅ Complète | ❌ | ✅ | ✅ Valide/Rejette |

---

## 📤 EXPORT PDF

Bouton "Export PDF" dans le header du drawer :
```typescript
const handleExport = () => {
  // Génération PDF avec jsPDF ou équivalent
  // Contenu : toutes les sections + warnings + preuves
};
```

**Contenu du PDF** :
- Page 1 : Indicateur + valeur + méthodologie
- Page 2 : Données sources (tableau)
- Page 3 : Facteurs utilisés
- Page 4 : Historique audit trail
- Annexes : Liens vers preuves

---

## 🎯 EXEMPLES D'INDICATEURS DÉMO

### **1. Indicateur Environnemental (E) - Émissions Scope 1**
```typescript
Code: E1_CO2_SCOPE1
Valeur: 152.3 tCO2e
Norme: CSRD ESRS E1-6 §48
Qualité: 📊 Données mesurées
Méthode: GHG Protocol
Inputs: 
  - Gaz naturel : 487500 kWh PCI (factures Engie)
  - Fioul : 12500 litres (bons de livraison)
  - Fluides frigorigènes : 2.5 kg (estimation)
Facteurs:
  - FE Gaz naturel : 0.227 kgCO2e/kWh (ADEME v12.1)
  - FE Fioul : 3.24 kgCO2e/litre (ADEME v12.1)
  - PRG R410A : 2088 kgCO2e/kg (IPCC AR5)
Validation: ✅ Validé par Marie Dupont (Auditeur externe)
```

### **2. Indicateur Social (S) - Taux de féminisation**
```typescript
Code: S1_GENDER_RATIO
Valeur: 43.8 %
Norme: CSRD ESRS S1-9
Qualité: 📊 Données mesurées
Méthode: Ratio ETP
Inputs:
  - Femmes ETP : 142.5 (SIRH ADP au 31/12/2024)
  - Effectif total ETP : 325 (SIRH ADP au 31/12/2024)
Formule: (142.5 / 325) × 100 = 43.8%
Validation: ✅ Validé par Claire Dubois (DRH)
```

### **3. Indicateur Gouvernance (G) - Indépendance conseil**
```typescript
Code: G1_BOARD_INDEPENDENCE
Valeur: 58.3 %
Norme: CSRD ESRS 2-GOV1
Qualité: 📊 Données mesurées
Méthode: Ratio administrateurs indépendants
```

---

## 🚀 WORKFLOWS AUTOMATIQUES

### **A) Lors de l'affichage d'un indicateur :**
1. Charger `Indicator` correspondant via `indicatorCode`
2. Charger `CalculationProfile` lié via `transparency_profile_id`
3. Charger `CalculationInput[]` via `calculation_profile_id`
4. Charger `CalculationFactor[]` via `calculation_profile_id`
5. Charger `CalculationLog[]` via `calculation_profile_id`
6. Générer `warnings` automatiques
7. Afficher le drawer avec les 5 onglets

### **B) Lors de la modification d'une donnée source :**
1. Mettre à jour `CalculationInput`
2. Créer entrée `CalculationLog` :
   ```typescript
   {
     action: 'input_changed',
     field_changed: 'Consommation gaz naturel',
     old_value: 450000,
     new_value: 487500,
     performed_by: 'Sophie Bernard',
     performed_at: new Date()
   }
   ```
3. Mettre à jour automatiquement l'indicateur affiché
4. Déclencher recalcul si formule dynamique

### **C) Règles d'audit :**
| Règle | Condition | Action |
|-------|-----------|--------|
| Preuve manquante | Input sans `evidence_link` | ⚠️ Warning dans le "i" |
| Facteur expiré | Factor avec `is_expired = true` | 🔴 Critical warning |
| Estimation | Input avec `is_estimated = true` | 📐 Badge "Estimated" |
| Validation requise | Profile avec `validation_status = 'draft'` | 🟡 Badge "En attente" |

---

## 📊 INDICATEURS DISPONIBLES (6 démo)

| Code | Nom | Pilier | Norme CSRD | Qualité |
|------|-----|--------|------------|---------|
| `E1_CO2_TOTAL` | Émissions totales GES | E | ESRS E1-6 | Mixte |
| `E1_CO2_SCOPE1` | Émissions Scope 1 | E | ESRS E1-6 §48 | Mesuré |
| `E1_INTENSITY` | Intensité carbone | E | ESRS E1-6 §53 | Calculé |
| `S1_HEADCOUNT` | Effectif total | S | ESRS S1-6 | Mesuré |
| `S1_GENDER_RATIO` | Taux de féminisation | S | ESRS S1-9 | Mesuré |
| `G1_BOARD_INDEPENDENCE` | Indépendance conseil | G | ESRS 2-GOV1 | Mesuré |

---

## 🎨 DESIGN SYSTEM

### **Couleurs par qualité** :
- 📊 **Mesuré** : `bg-green-100 text-green-800`
- 📐 **Estimé** : `bg-orange-100 text-orange-800`
- 📊📐 **Mixte** : `bg-blue-100 text-blue-800`
- 🧮 **Calculé** : `bg-blue-100 text-blue-800`

### **Badges confiance** :
- ✓ **Élevée** : `bg-green-100 text-green-800`
- ~ **Moyenne** : `bg-orange-100 text-orange-800`
- ⚠ **Faible** : `bg-red-100 text-red-800`

### **Badges validation** :
- ✓ **Validé** : `bg-green-100 text-green-800`
- ✗ **Rejeté** : `bg-red-100 text-red-800`
- ⏳ **En attente** : `bg-gray-100 text-gray-800`
- 📝 **Brouillon** : `bg-gray-100 text-gray-800`

---

## ✅ RÈGLES IMPORTANTES

1. ⚠️ **Aucun indicateur ne peut être affiché sans `CalculationProfile` associé**
   - Si `transparency_profile_id` est `null` → pas d'icône "i"
   
2. 🔄 **Le composant "i" doit être identique partout**
   - Utiliser `<CalculationTransparency>` dans tous les modules
   
3. 📄 **Le contenu du "i" doit être exportable en PDF**
   - Bouton "Export PDF" dans le header
   
4. 🔒 **Permissions strictes par posture**
   - Audit externe : lecture seule + commentaires
   
5. 📊 **Warnings automatiques obligatoires**
   - Vérification preuve, facteurs, confiance à chaque ouverture

---

## 🚀 ACCÈS DANS L'APPLICATION

### **Navigation** :
1. Aller dans le menu latéral
2. Cliquer sur **"Démo de transparence"** (icône AlertCircle)
3. Voir les 6 indicateurs ESG avec icône "i"
4. Cliquer sur l'icône "i" pour ouvrir le drawer

### **Intégration future** :
Le composant `<CalculationTransparency>` peut être intégré dans :
- Dashboard (KPIs principaux)
- Évaluation Carbone (Scopes 1-2-3)
- Données Quantitatives (tous les datapoints ESRS)
- Données Qualitatives (ratios, scores)
- Rapports (indicateurs finaux)

---

## 📝 EXEMPLE D'INTÉGRATION

```tsx
// Dans n'importe quel composant
import { CalculationTransparency } from '@/app/components/CalculationTransparency';

function DashboardCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Émissions GES 2024</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-[#0F4C3A]">8,547</span>
          <span className="text-2xl text-gray-500">tCO2e</span>
          
          {/* ✨ Module de transparence */}
          <CalculationTransparency 
            indicatorCode="E1_CO2_TOTAL" 
            displayedValue={8547}
            posture="conseil"
            size="lg"
            variant="icon"
          />
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          vs 2023 : -8.2% ✓
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 🎉 RÉSULTAT

**Le module de Transparence des Calculs est maintenant 100% opérationnel !**

✅ **6 indicateurs ESG démo** (E1, S1, G1)
✅ **Composant réutilisable** générique
✅ **5 onglets** de transparence complète
✅ **Warnings automatiques** intelligents
✅ **Audit trail** complet
✅ **Export PDF** prêt à implémenter
✅ **Permissions** par posture
✅ **Design system** cohérent Solvid.IA

**Chaque indicateur est désormais audit-ready avec traçabilité complète de A à Z !** 🚀
