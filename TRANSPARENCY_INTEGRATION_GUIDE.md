# 🎯 GUIDE D'INTÉGRATION — MODULE TRANSPARENCE DES CALCULS

## 📍 OÙ INTÉGRER CE MODULE ?

Le module de **Transparence des Calculs** doit être intégré **partout où un indicateur chiffré est affiché** dans Solvid.IA. Voici la liste exhaustive des emplacements stratégiques :

---

## ✅ MODULES PRIORITAIRES (À INTÉGRER EN PRIORITÉ)

### 1️⃣ **Dashboard** (Déjà fait ✅)
**Fichier** : `/src/app/components/views/DashboardConseil.tsx`

**Indicateurs concernés** :
- ✅ Émissions Scope 1 : 152.3 tCO2e
- ✅ Effectif total : 325 ETP
- ✅ Taux de féminisation : 43.8%

**Raison** : Premier écran vu par l'utilisateur → visibilité maximale

---

### 2️⃣ **Évaluation Carbone** (PRIORITÉ 1)
**Fichier** : `/src/app/components/views/CarbonAssessmentConseil.tsx`

**Indicateurs à équiper** :
- 🔲 **Scope 1** (émissions directes)
  - Total Scope 1
  - Par source (gaz, fioul, véhicules)
  - Fuites fugitives
  
- 🔲 **Scope 2** (énergie)
  - Électricité (location-based)
  - Électricité (market-based)
  - Réseau de chaleur/froid
  
- 🔲 **Scope 3** (chaîne de valeur)
  - Achats (cat 1)
  - Déplacements (cat 6-7)
  - Fin de vie (cat 12)
  - Total Scope 3

- 🔲 **Bilan total**
  - Émissions totales
  - Intensité carbone (tCO2e/M€)
  - Évolution vs N-1

**Impact** : ⭐⭐⭐⭐⭐ **CRITIQUE**  
→ Module le plus technique, nécessitant la plus forte traçabilité

---

### 3️⃣ **Données Quantitatives ESRS** (PRIORITÉ 1)
**Fichier** : `/src/app/components/views/QuantitativeDataConseil.tsx`

**Indicateurs à équiper** :
- 🔲 **E1 - Climat**
  - Émissions GES (Scopes 1, 2, 3)
  - Intensité carbone
  - Énergie consommée (MWh)
  - Part d'énergies renouvelables (%)

- 🔲 **E3 - Eau**
  - Consommation d'eau (m³)
  - Eau recyclée (%)
  - Stress hydrique

- 🔲 **E5 - Économie circulaire**
  - Déchets générés (tonnes)
  - Taux de valorisation (%)
  - Déchets dangereux (tonnes)

- 🔲 **S1 - Personnel**
  - Effectif total (ETP)
  - Répartition H/F (%)
  - Turnover (%)
  - Formation (heures/ETP)
  - Accidents du travail (TF/TG)

- 🔲 **S2 - Chaîne de valeur**
  - Fournisseurs audités (%)
  - Non-conformités détectées

- 🔲 **G1 - Gouvernance**
  - Indépendance conseil (%)
  - Diversité conseil (% femmes)
  - Formation administrateurs (heures)

**Impact** : ⭐⭐⭐⭐⭐ **CRITIQUE**  
→ Cœur du reporting CSRD, exigence maximale de traçabilité

---

### 4️⃣ **Matérialité (DMA)** (PRIORITÉ 2)
**Fichier** : `/src/app/components/views/MaterialityConseil.tsx`

**Indicateurs à équiper** :
- 🔲 Scores de matérialité (0-10)
- 🔲 Scores IRO par enjeu
- 🔲 Seuils de matérialité calculés
- 🔲 Nombre de parties prenantes consultées

**Impact** : ⭐⭐⭐⭐ **IMPORTANT**  
→ Justification méthodologique de la sélection des enjeux

---

### 5️⃣ **Rapports & Exports** (PRIORITÉ 2)
**Fichier** : `/src/app/components/views/ReportsConseil.tsx`

**Indicateurs à équiper** :
- 🔲 Tous les KPIs du rapport final
- 🔲 Graphiques (valeurs affichées)
- 🔲 Tableaux récapitulatifs

**Impact** : ⭐⭐⭐⭐ **IMPORTANT**  
→ Document final remis au client et aux auditeurs

---

## 🔄 MODULES SECONDAIRES (À INTÉGRER SI PERTINENT)

### 6️⃣ **Analyse de Matérialité**
**Fichier** : `/src/app/components/views/MaterialityAnalysis.tsx`

**Indicateurs** :
- 🔲 Scores de criticité financière
- 🔲 Scores d'impact environnemental/social
- 🔲 Nombre de répondants par stakeholder

**Impact** : ⭐⭐⭐ MOYEN

---

### 7️⃣ **Assistant IA** (si applicable selon posture)
**Fichier** : `/src/app/components/views/IAAssistantConseil.tsx`

**Indicateurs** :
- 🔲 Suggestions de calculs (si l'IA propose des valeurs)

**Impact** : ⭐⭐ FAIBLE (contexte = assistance, pas reporting)

---

### 8️⃣ **Données Qualitatives**
**Fichier** : `/src/app/components/views/QualitativeDataConseil.tsx`

**Indicateurs** :
- 🔲 Métriques dérivées des politiques (ex: taux de couverture d'une politique)
- 🔲 Nombre de procédures documentées

**Impact** : ⭐⭐ FAIBLE (moins de calculs chiffrés)

---

## 🚫 MODULES NON CONCERNÉS

Ces modules n'ont **pas besoin** du module de transparence :

- ❌ **Bibliothèque de conformité** (documentation réglementaire pure)
- ❌ **Vérificateur de conformité** (checks automatiques, pas d'indicateurs)
- ❌ **Équipe & Utilisateurs** (gestion admin)
- ❌ **Paramètres** (configuration)
- ❌ **EUDR Module** (déjà un module spécialisé)

---

## 📊 STRATÉGIE D'INTÉGRATION PAR PHASE

### **PHASE 1 - Quick Wins (Impact immédiat)**
1. ✅ Dashboard (FAIT)
2. 🔲 Évaluation Carbone
3. 🔲 Données Quantitatives ESRS

**Délai** : 1-2 jours  
**Bénéfice** : 80% de la valeur perçue

---

### **PHASE 2 - Consolidation**
4. 🔲 Matérialité (DMA)
5. 🔲 Rapports & Exports

**Délai** : 1 jour  
**Bénéfice** : 15% de valeur additionnelle

---

### **PHASE 3 - Complétion**
6. 🔲 Analyse de Matérialité
7. 🔲 Données Qualitatives (si applicable)

**Délai** : 0.5 jour  
**Bénéfice** : 5% de valeur additionnelle

---

## 🎯 EXEMPLE D'INTÉGRATION DANS CARBON ASSESSMENT

```tsx
// Dans /src/app/components/views/CarbonAssessmentConseil.tsx

import { CalculationTransparency } from '@/app/components/CalculationTransparency';

// Exemple pour Scope 1
<div className="border rounded-lg p-4 bg-white">
  <div className="text-sm text-gray-600 mb-1">Émissions Scope 1</div>
  <div className="flex items-baseline gap-2">
    <span className="text-3xl font-bold text-[#0F4C3A]">152.3</span>
    <span className="text-lg text-gray-500">tCO2e</span>
    
    {/* 🎯 MODULE DE TRANSPARENCE */}
    <CalculationTransparency 
      indicatorCode="E1_CO2_SCOPE1"  // Code unique de l'indicateur
      displayedValue={152.3}          // Valeur affichée
      posture={posture}               // Adaptation UI
      size="md"                       // Taille icône
    />
  </div>
</div>
```

---

## 🔑 RÈGLES D'OR POUR L'INTÉGRATION

### ✅ À FAIRE

1. **Ajouter l'icône "i" à CHAQUE indicateur chiffré**
   - Même si la méthodologie semble simple
   - Renforce la crédibilité globale

2. **Utiliser la bonne taille d'icône**
   - `size="sm"` : petits chiffres (tableaux)
   - `size="md"` : chiffres moyens (cartes)
   - `size="lg"` : grands KPIs (dashboard)

3. **Passer la posture utilisateur**
   - Permet l'adaptation UI selon conseil/pré-audit/audit

4. **Créer les profils de calcul pour chaque indicateur**
   - Minimum : méthode + formule + 1 input
   - Idéal : méthode + formule + steps + inputs + factors + logs

### ❌ À ÉVITER

1. **Ne pas ajouter l'icône sur :**
   - Les labels textuels
   - Les pourcentages d'avancement (UI, pas métier)
   - Les compteurs techniques (nombre de clics, etc.)

2. **Ne pas dupliquer le code du composant**
   - Toujours utiliser `<CalculationTransparency>`
   - Ne jamais recréer l'icône "i" manuellement

3. **Ne pas oublier l'import**
   ```tsx
   import { CalculationTransparency } from '@/app/components/CalculationTransparency';
   ```

---

## 📦 CHECKLIST PAR MODULE

### **Évaluation Carbone**
- [ ] Import du composant
- [ ] Icône "i" sur Total Scope 1
- [ ] Icône "i" sur Total Scope 2
- [ ] Icône "i" sur Total Scope 3
- [ ] Icône "i" sur Émissions totales
- [ ] Icône "i" sur Intensité carbone
- [ ] Créer les 5 profils de calcul correspondants
- [ ] Tester l'ouverture du drawer

### **Données Quantitatives**
- [ ] Import du composant
- [ ] Icône "i" sur tous les indicateurs E1
- [ ] Icône "i" sur tous les indicateurs E3
- [ ] Icône "i" sur tous les indicateurs E5
- [ ] Icône "i" sur tous les indicateurs S1
- [ ] Icône "i" sur tous les indicateurs G1
- [ ] Créer les profils de calcul (minimum 10)
- [ ] Tester avec différentes postures

### **Dashboard**
- [x] Import du composant ✅
- [x] Icône "i" sur KPI Carbone ✅
- [x] Icône "i" sur KPI Social ✅
- [x] Message explicatif ✅
- [x] Test fonctionnel ✅

---

## 🎨 DESIGN SYSTEM — POSITIONNEMENT DE L'ICÔNE

### **Placement standard** (recommandé)
```tsx
<div className="flex items-baseline gap-2">
  <span className="text-3xl font-bold">152.3</span>
  <span className="text-lg text-gray-500">tCO2e</span>
  <CalculationTransparency indicatorCode="..." displayedValue={152.3} />
</div>
```

### **Dans un tableau**
```tsx
<TableCell>
  <div className="flex items-center gap-1">
    <span className="font-semibold">152.3</span>
    <CalculationTransparency 
      indicatorCode="..." 
      displayedValue={152.3} 
      size="sm"  // Petite icône pour tableaux
      variant="icon"
    />
  </div>
</TableCell>
```

### **Avec badge de qualité**
```tsx
<div className="space-y-2">
  <div className="flex items-baseline gap-2">
    <span className="text-3xl font-bold">152.3</span>
    <span className="text-lg text-gray-500">tCO2e</span>
    <CalculationTransparency indicatorCode="..." displayedValue={152.3} />
  </div>
  <Badge className="bg-green-100 text-green-800">
    📊 Données mesurées
  </Badge>
</div>
```

---

## 🚀 PROCHAINES ÉTAPES RECOMMANDÉES

### **Étape 1 : Évaluation Carbone** (PRIORITÉ ABSOLUE)
1. Ouvrir `/src/app/components/views/CarbonAssessmentConseil.tsx`
2. Ajouter l'import `CalculationTransparency`
3. Identifier tous les chiffres affichés (Scopes 1, 2, 3, Total)
4. Ajouter l'icône "i" à côté de chaque valeur
5. Créer les profils de calcul dans `/src/data/transparencyData.ts`
6. Tester avec les 3 postures

### **Étape 2 : Données Quantitatives**
1. Ouvrir `/src/app/components/views/QuantitativeDataConseil.tsx`
2. Répéter le processus pour chaque pilier (E, S, G)
3. Focus sur les indicateurs obligatoires CSRD d'abord

### **Étape 3 : Rapports**
1. Intégrer dans les vues finales de rapport
2. S'assurer que l'export PDF inclut les références aux calculs

---

## 💡 VALEUR AJOUTÉE PAR MODULE

| Module | Impact Transparence | Effort d'intégration | ROI |
|--------|---------------------|----------------------|-----|
| **Évaluation Carbone** | ⭐⭐⭐⭐⭐ | 2h | 🔥 TRÈS ÉLEVÉ |
| **Données Quantitatives** | ⭐⭐⭐⭐⭐ | 3h | 🔥 TRÈS ÉLEVÉ |
| **Dashboard** | ⭐⭐⭐⭐ | 30min ✅ | ✅ FAIT |
| **Matérialité** | ⭐⭐⭐ | 1h | MOYEN |
| **Rapports** | ⭐⭐⭐⭐ | 1h30 | ÉLEVÉ |
| **Données Qualitatives** | ⭐⭐ | 30min | FAIBLE |

---

## 🎯 RÉSUMÉ EXÉCUTIF

**MODULE CRÉÉ** : ✅ Transparent, réutilisable, générique

**DÉJÀ INTÉGRÉ** :
- ✅ Dashboard (3 indicateurs)
- ✅ Démo de transparence (6 indicateurs)

**À INTÉGRER EN PRIORITÉ** :
1. 🎯 Évaluation Carbone (5 indicateurs) → Impact maximal
2. 🎯 Données Quantitatives (15-20 indicateurs) → Conformité CSRD
3. 🎯 Rapports finaux (tous KPIs) → Auditabilité

**EFFORT TOTAL ESTIMÉ** : 6-8 heures de développement

**BÉNÉFICE** : Différenciation concurrentielle majeure + audit-readiness maximale

---

**Le module est prêt. L'intégration stratégique dans les modules métier peut commencer ! 🚀**
