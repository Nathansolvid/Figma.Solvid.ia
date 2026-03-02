# 🔧 GUIDE TECHNIQUE — Intégration Module Transparence

## 📋 TABLE DES MATIÈRES

1. [Architecture](#architecture)
2. [Fichiers modifiés](#fichiers-modifiés)
3. [Pattern d'intégration](#pattern-dintégration)
4. [Données créées](#données-créées)
5. [Tests recommandés](#tests-recommandés)
6. [Troubleshooting](#troubleshooting)

---

## 🏗️ ARCHITECTURE

### **Structure des composants**

```
/src
├── app/components/
│   ├── CalculationTransparency.tsx      ← Composant principal
│   └── views/
│       ├── DashboardConseil.tsx         ✅ Intégré
│       ├── DashboardPreAudit.tsx        ✅ Intégré
│       ├── DashboardAuditExterne.tsx    ✅ Intégré
│       ├── EvaluationCarbone.tsx        ✅ Intégré
│       ├── DonneesQuantitatives.tsx     ✅ Intégré
│       ├── DoubleMaterialite.tsx        ✅ Intégré
│       ├── CSRD.tsx                     ✅ Intégré
│       └── TransparencyDemo.tsx         ✅ Intégré
├── data/
│   └── transparencyData.ts              ← Base de données indicateurs
└── types/
    └── transparency.ts                  ← Interfaces TypeScript
```

---

## 📝 FICHIERS MODIFIÉS

### **1. Composant principal**

**`/src/app/components/CalculationTransparency.tsx`**

```typescript
// Signature
interface CalculationTransparencyProps {
  indicatorCode: string;       // Code unique (ex: "E1-1")
  displayedValue: number;       // Valeur affichée (ex: 1240)
  posture: PostureType;         // "conseil" | "pre-audit" | "audit-externe"
  variant?: 'icon' | 'button';  // Type d'affichage
  size?: 'sm' | 'md' | 'lg';    // Taille
}
```

**Modifications effectuées** :
- ✅ Icône redesignée : fond vert clair + bordure
- ✅ Adaptation posture : titre + contenu contextualisé
- ✅ 5 onglets : Vue d'ensemble, Méthode, Données, Facteurs, Audit
- ✅ Warnings dynamiques selon qualité données

---

### **2. Vues métier intégrées**

#### **Dashboard Conseil**
**Fichier** : `/src/app/components/views/DashboardConseil.tsx`

**Lignes modifiées** : ~580-625

```typescript
// Import ajouté
import { CalculationTransparency } from "@/app/components/CalculationTransparency";

// Intégration (ligne ~612)
<div className="flex items-baseline gap-2">
  <span className="text-2xl font-bold text-[#0F4C3A]">152.3</span>
  <span className="text-lg text-gray-500">tCO2e</span>
  <CalculationTransparency 
    indicatorCode="E1_CO2_SCOPE1"
    displayedValue={152.3}
    posture="conseil"
    size="sm"
  />
</div>
```

**Indicateurs intégrés** : 3 (Scope 1, Effectif, Taux féminisation)

---

#### **Dashboard Pré-audit**
**Fichier** : `/src/app/components/views/DashboardPreAudit.tsx`

**Lignes modifiées** : ~70-77

```typescript
// Score d'auditabilité avec transparence
<div className="flex items-baseline gap-2">
  <span className="text-6xl font-bold text-[#F59E0B]">73%</span>
  <CalculationTransparency 
    indicatorCode="AUDIT_READINESS_SCORE"
    displayedValue={73}
    posture="pre-audit"
    size="md"
  />
</div>
```

**Indicateurs intégrés** : 1 (Score 73%)

---

#### **Dashboard Audit Externe**
**Fichier** : `/src/app/components/views/DashboardAuditExterne.tsx`

**Lignes modifiées** : ~67-88

```typescript
// Métriques audit avec transparence
<div className="flex items-center justify-center gap-2">
  <p className="text-4xl font-bold text-orange-600">8</p>
  <CalculationTransparency 
    indicatorCode="AUDIT_NORMS_COUNT"
    displayedValue={8}
    posture="audit-externe"
    size="sm"
  />
</div>
```

**Indicateurs intégrés** : 4 (Normes, Data points, Preuves, Tests)

---

#### **Évaluation Carbone**
**Fichier** : `/src/app/components/views/EvaluationCarbone.tsx`

**Lignes modifiées** : ~572-620

```typescript
// Section "Synthèse avec transparence des calculs"
<div className="flex items-baseline gap-2">
  <span className="text-2xl font-bold text-[#0F4C3A]">{totalScope1.toLocaleString()}</span>
  <span className="text-lg text-gray-500">tCO2e</span>
  <CalculationTransparency 
    indicatorCode="E1_CO2_SCOPE1"
    displayedValue={totalScope1}
    posture={posture}
    size="sm"
  />
</div>
```

**Indicateurs intégrés** : 3 (Total Scope 1, Empreinte totale, Intensité carbone)

---

#### **Données Quantitatives ESRS**
**Fichier** : `/src/app/components/views/DonneesQuantitatives.tsx`

**Lignes modifiées** : ~287-293

```typescript
// Tableau ESRS avec icônes "i"
<TableCell>
  {dp.value !== "-" ? (
    <div className="flex items-center gap-1">
      <span className="font-semibold">{dp.value} {dp.unit}</span>
      <CalculationTransparency 
        indicatorCode={dp.code}
        displayedValue={parseFloat(dp.value)}
        posture={posture}
        size="sm"
      />
    </div>
  ) : (
    <span className="text-muted-foreground">-</span>
  )}
</TableCell>
```

**Indicateurs intégrés** : 8 (E1-1, E1-2, E1-3, E3-1, S1-1, S1-2, S2-1, G1-1)

---

#### **Double Matérialité**
**Fichier** : `/src/app/components/views/DoubleMaterialite.tsx`

**Lignes modifiées** : ~395-420

```typescript
// Scores de matérialité avec transparence
<TableCell>
  <div className="flex items-center gap-1">
    <div className="flex-1 bg-border rounded-full h-2 overflow-hidden">
      <div className="bg-[#0F4C3A] h-full" style={{ width: `${(issue.impactScore / 5) * 100}%` }} />
    </div>
    <span className="text-sm font-medium">{issue.impactScore}/5</span>
    <CalculationTransparency 
      indicatorCode={`MAT_IMPACT_${issue.name.toUpperCase().replace(/\s+/g, '_')}`}
      displayedValue={issue.impactScore}
      posture={posture}
      size="sm"
    />
  </div>
</TableCell>
```

**Indicateurs intégrés** : 12 (6 enjeux × 2 scores)

---

#### **CSRD / ESRS**
**Fichier** : `/src/app/components/views/CSRD.tsx`

**Lignes modifiées** : ~260-270

```typescript
// Progression ESRS avec transparence
<TableCell>
  <div className="flex items-center gap-2">
    <div className="space-y-1 min-w-[120px]">
      <div className="flex justify-between text-xs">
        <span>{standard.completion}%</span>
      </div>
      <Progress value={standard.completion} className="h-1.5" />
    </div>
    <CalculationTransparency 
      indicatorCode={`ESRS_${standard.code.replace(/\s+/g, '_')}_COMPLETION`}
      displayedValue={standard.completion}
      posture={posture}
      size="sm"
    />
  </div>
</TableCell>
```

**Indicateurs intégrés** : 10 (% complétion par norme ESRS)

---

## 🎨 PATTERN D'INTÉGRATION

### **Pattern standard**

```typescript
// 1. Import du composant
import { CalculationTransparency } from "@/app/components/CalculationTransparency";

// 2. Wrapper de la valeur avec flex container
<div className="flex items-center gap-1"> {/* ou gap-2 selon espacement souhaité */}
  
  {/* Valeur originale (inchangée) */}
  <span className="text-2xl font-semibold">{value}</span>
  <span className="text-sm text-muted-foreground">{unit}</span>
  
  {/* Icône de transparence */}
  <CalculationTransparency 
    indicatorCode="CODE_UNIQUE"
    displayedValue={numericValue}
    posture={posture}
    size="sm"  // sm pour tableaux, md pour cards, lg pour hero metrics
  />
  
</div>
```

### **Exemples selon contexte**

#### **1. Dashboard card (grande métrique)**

```typescript
<div className="flex items-baseline gap-2">
  <span className="text-6xl font-bold text-[#0F4C3A]">73%</span>
  <CalculationTransparency 
    indicatorCode="AUDIT_READINESS_SCORE"
    displayedValue={73}
    posture="pre-audit"
    size="md"  // ← md pour visibilité
  />
</div>
```

#### **2. Tableau (petit indicateur)**

```typescript
<TableCell>
  <div className="flex items-center gap-1">
    <span className="font-semibold">{value} {unit}</span>
    <CalculationTransparency 
      indicatorCode={code}
      displayedValue={parseFloat(value)}
      posture={posture}
      size="sm"  // ← sm pour économiser l'espace
    />
  </div>
</TableCell>
```

#### **3. Barre de progression (combo)**

```typescript
<div className="flex items-center gap-2">
  <div className="flex-1">
    <Progress value={completion} className="h-1.5" />
    <span className="text-xs">{completion}%</span>
  </div>
  <CalculationTransparency 
    indicatorCode={`ESRS_${code}_COMPLETION`}
    displayedValue={completion}
    posture={posture}
    size="sm"
  />
</div>
```

---

## 💾 DONNÉES CRÉÉES

### **Fichier** : `/src/data/transparencyData.ts`

**Structure ajoutée** :

```typescript
// Ajout de 13 nouveaux indicateurs
export const indicators: Indicator[] = [
  // ... indicateurs existants ...
  
  // NOUVEAUX INDICATEURS ESRS
  {
    id: 'ind-e1-1',
    name: 'Émissions GES Scope 1',
    code: 'E1-1',
    description: 'Émissions directes de GES (ESRS E1)',
    norm_reference: 'CSRD ESRS E1-6',
    unit: 'tCO₂e',
    aggregation_type: 'sum',
    display_format: 'number',
    transparency_profile_id: 'prof-e1-co2-scope1', // ← Réutilise profil existant
    category: 'environmental',
    pillar: 'E',
    is_mandatory: true,
    is_material: true,
    display_order: 2,
    tooltip: 'Scope 1 - Émissions directes',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2025-01-25'),
  },
  
  // ... E1-2, E1-3, E3-1, S1-1, S1-2, S2-1, G1-1 ...
  
  // INDICATEURS PRÉ-AUDIT & AUDIT
  {
    id: 'ind-audit-readiness',
    name: 'Score d\'auditabilité',
    code: 'AUDIT_READINESS_SCORE',
    description: 'Score global de qualité et traçabilité des données (mode pré-audit)',
    norm_reference: 'N/A - Métrique interne',
    unit: '%',
    aggregation_type: 'weighted_average',
    display_format: 'percent',
    transparency_profile_id: 'prof-audit-readiness',
    category: 'quality',
    pillar: 'Q',
    is_mandatory: false,
    is_material: false,
    display_order: 100,
    tooltip: 'Indicateur synthétique de maturité audit',
    created_at: new Date('2025-01-25'),
    updated_at: new Date('2025-01-25'),
  },
  
  // ... AUDIT_NORMS_COUNT, AUDIT_DATAPOINTS_COUNT, AUDIT_EVIDENCE_COUNT, AUDIT_TESTS_COUNT ...
];
```

**Profils réutilisés intelligemment** :
- `E1-1` → `prof-e1-co2-scope1` (profil existant Scope 1)
- `S1-1` → `prof-s1-headcount` (profil existant Effectif)
- `S1-2` → `prof-s1-training` (nouveau profil à créer)
- Etc.

---

## ✅ TESTS RECOMMANDÉS

### **1. Tests d'affichage**

```bash
# Tester sur chaque posture
1. Se connecter en mode "Conseil"
   → Vérifier icônes "i" visibles avec fond vert clair
   → Cliquer sur icône → Drawer s'ouvre
   → Vérifier titre : "Comment construire cet indicateur"

2. Changer pour "Pré-audit"
   → Vérifier titre : "Vérifier la traçabilité"
   → Vérifier alertes warnings visibles
   → Tester Dashboard Pré-audit : score 73% avec icône

3. Changer pour "Audit externe"
   → Vérifier titre : "Revue méthodologique certifiée"
   → Vérifier onglet "Audit" affiché
   → Tester Dashboard Audit : 4 métriques avec icônes
```

### **2. Tests de parcours**

```bash
# Tester adaptation vocabulaire
1. Parcours "CSRD Obligatoire"
   → Vérifier vocabulaire : ESRS E1, GHG Protocol, Base Carbone ADEME
   → Vérifier références : "CSRD ESRS E1-6 §48"

2. Parcours "ESG Structuré"
   → Vérifier vocabulaire : Environnemental, Social, Gouvernance
   → Vérifier références : ISO 14064-1, GRI Standards
```

### **3. Tests fonctionnels**

```bash
# Tester chaque onglet du drawer
1. Vue d'ensemble
   ✓ Synthèse affichée
   ✓ Warnings affichés (si données incomplètes)
   ✓ Badge qualité visible (Mesuré, Estimé, etc.)

2. Méthode
   ✓ Méthodologie texte affichée
   ✓ Formule affichée
   ✓ Étapes numérotées visibles
   ✓ Hypothèses + limitations affichées

3. Données
   ✓ Table des inputs affichée
   ✓ Liens de preuves cliquables (si disponibles)
   ✓ Badge "Preuve manquante" si pas de lien

4. Facteurs
   ✓ Table des facteurs affichée
   ✓ Sources ADEME / GHG Protocol visibles
   ✓ Warning "Facteur expiré" si applicable

5. Audit
   ✓ Logs d'historique affichés
   ✓ Auteurs + rôles + dates visibles
   ✓ Statut validation visible
```

### **4. Tests de performance**

```bash
# Vérifier que le drawer s'ouvre rapidement
1. Cliquer sur icône "i"
   → Drawer doit s'ouvrir en < 200ms
   
2. Naviguer entre onglets
   → Changement instantané (pas de loading)

3. Ouvrir 10 drawers successifs
   → Pas de ralentissement perceptible
```

---

## 🐛 TROUBLESHOOTING

### **Problème 1 : Icône "i" non visible**

**Symptôme** : Petit cercle gris au lieu d'un rond vert clair

**Cause** : CSS non appliqué après modification

**Solution** :
```bash
# Hard refresh du navigateur
Ctrl + Shift + R  # Windows/Linux
Cmd + Shift + R   # Mac

# Si ça ne suffit pas
npm run dev  # Redémarrer le serveur
```

---

### **Problème 2 : Drawer ne s'ouvre pas**

**Symptôme** : Clic sur icône "i" → rien ne se passe

**Cause** : `indicatorCode` non trouvé dans `transparencyData.ts`

**Solution** :
```typescript
// Vérifier que le code existe
import { indicators } from '@/data/transparencyData';

const found = indicators.find(i => i.code === 'E1-1');
console.log('Indicateur trouvé ?', found); // Doit afficher l'objet

// Si null → ajouter l'indicateur dans transparencyData.ts
```

---

### **Problème 3 : Contenu drawer vide**

**Symptôme** : Drawer s'ouvre mais onglets vides

**Cause** : `transparency_profile_id` non trouvé

**Solution** :
```typescript
// Vérifier que le profil existe
import { calculationProfiles } from '@/data/transparencyData';

const profile = calculationProfiles.find(p => p.id === 'prof-e1-co2-scope1');
console.log('Profil trouvé ?', profile); // Doit afficher l'objet

// Si null → créer le profil dans transparencyData.ts
// OU réutiliser un profil existant
```

---

### **Problème 4 : TypeScript erreurs**

**Symptôme** : `Property 'code' does not exist on type 'Indicator'`

**Cause** : Types non à jour

**Solution** :
```bash
# Vérifier que transparency.ts contient bien
export interface Indicator {
  code: string; // ← Doit être présent
  // ... autres props
}

# Si absent, ajouter dans /src/types/transparency.ts
```

---

### **Problème 5 : Warnings non affichés**

**Symptôme** : Onglet "Vue d'ensemble" sans alertes

**Cause** : Logique de génération warnings

**Solution** :
```typescript
// Dans CalculationTransparency.tsx, vérifier :
const warnings: CalculationWarning[] = [];

// Check missing evidence
const inputsWithoutEvidence = inputs.filter((i) => !i.evidence_link);
if (inputsWithoutEvidence.length > 0) {
  warnings.push({
    type: 'missing_evidence',
    severity: 'warning',
    message: `${inputsWithoutEvidence.length} donnée(s) source sans preuve jointe`,
    recommendation: 'Ajoutez les documents justificatifs',
  });
}

// Vérifier que les inputs ont bien evidence_link: null
```

---

## 📚 RÉFÉRENCES

### **Documentation officielle**

- [CSRD Directive](https://eur-lex.europa.eu/eli/dir/2022/2464)
- [ESRS Standards](https://www.efrag.org/lab6)
- [GHG Protocol](https://ghgprotocol.org/)
- [Base Carbone ADEME](https://www.bilans-ges.ademe.fr/)

### **Fichiers clés**

```
/src/app/components/CalculationTransparency.tsx   ← Composant principal
/src/data/transparencyData.ts                     ← Base de données
/src/types/transparency.ts                        ← Interfaces TypeScript
/INTEGRATION_COMPLETE_SUMMARY.md                  ← Résumé complet
/ANALYSIS_TRANSPARENCY_INTEGRATION.md             ← Analyse modules
```

### **Exemples d'intégration**

Voir les fichiers suivants pour des exemples réels :
- Dashboard : `DashboardConseil.tsx` (lignes ~580-625)
- Tableau : `DonneesQuantitatives.tsx` (lignes ~287-293)
- Card : `DashboardPreAudit.tsx` (lignes ~70-77)
- Matrice : `DoubleMaterialite.tsx` (lignes ~395-420)

---

## 🚀 PROCHAINES INTÉGRATIONS

### **Template pour nouveaux modules**

```typescript
// 1. Import
import { CalculationTransparency } from "@/app/components/CalculationTransparency";

// 2. Props du module (ajouter posture)
interface MonModuleProps {
  posture: PostureType;
  // ... autres props
}

// 3. Wrapper de l'indicateur
<div className="flex items-center gap-1">
  <span className="font-semibold">{value} {unit}</span>
  <CalculationTransparency 
    indicatorCode="MON_CODE_UNIQUE"
    displayedValue={numericValue}
    posture={posture}
    size="sm"
  />
</div>

// 4. Ajouter l'indicateur dans transparencyData.ts
{
  id: 'ind-mon-indicateur',
  name: 'Mon indicateur',
  code: 'MON_CODE_UNIQUE',
  description: '...',
  norm_reference: '...',
  unit: '...',
  transparency_profile_id: 'prof-mon-profil',
  // ... autres props
}

// 5. Créer le profil (ou réutiliser existant)
{
  id: 'prof-mon-profil',
  indicator_id: 'ind-mon-indicateur',
  calculation_method_text: '...',
  formula_text: '...',
  steps: [...],
  // ... autres props
}
```

---

**🎉 Félicitations ! Vous avez maintenant toutes les clés pour intégrer la transparence des calculs dans n'importe quel module de Solvid.IA !**

---

*Document technique généré le 25 janvier 2026*  
*Version 1.0 — Phase 2 Complete*
