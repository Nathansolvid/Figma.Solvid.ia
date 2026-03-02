# ⚡ Quick Start - Solvid.IA

> 5 minutes pour démarrer avec Solvid.IA

---

## 🎯 En 30 Secondes

**Solvid.IA** = Plateforme ESG qui rend les données **auditables**, **traçables** et **faciles à consolider**.

**Résultat** : Export 1-click (PDF + preuves) prêt pour audit externe.

---

## 🚀 Installation

```bash
# 1. Installer dépendances
pnpm install

# 2. Configurer Supabase
# → Créer projet sur supabase.com
# → Copier URL + ANON_KEY + SERVICE_ROLE_KEY
# → Les fournir quand demandés par l'app

# 3. Lancer
pnpm dev

# 4. Ouvrir
http://localhost:5173
```

---

## 🔑 Premier Login

```bash
# L'app va créer un compte admin automatiquement au premier lancement
# Sinon, utiliser la route /signup :

Email: admin@example.com
Password: SecurePassword123
Organization: Acme Corp
Role: CONSULTANT
```

---

## 📋 Créer un Pack en 3 Clics

```
1. Dashboard → "Nouveau Pack"
2. Sélectionner "Donneur d'Ordre"
3. Cliquer "Créer"

✅ Pack créé avec 20+ indicateurs pré-remplis
```

---

## ✅ Remplir un Pack

### Marquer un item comme fourni

```
1. Voir checklist
2. Cliquer "Fourni" sur un item
3. Item passe vert ✅

→ Sauvegardé automatiquement dans backend
```

### Ajouter un commentaire

```
1. Cliquer icône 💬 sur un item
2. Taper commentaire
3. Cliquer "Enregistrer"

→ Commentaire affiché sous l'item
```

### Upload une preuve

```
1. Onglet "Preuves"
2. Drag-drop un fichier PDF/Excel/Image
3. Fichier uploadé dans Supabase Storage

→ Lié automatiquement à l'indicateur
```

---

## 📄 Exporter

### PDF seulement

```
Bouton "Exporter" → "PDF seulement"

→ Télécharge rapport.pdf (2-3s)
```

### ZIP complet (PDF + Preuves)

```
Bouton "Exporter" → "ZIP (PDF + Preuves)"

→ Modal progression s'affiche
→ 4 étapes : PDF, Preuves, ZIP, Download
→ Télécharge Pack_Name_2025-01-31.zip (5-10s)

📦 Contenu ZIP :
├── rapport.pdf
├── README.txt
└── preuves/
    ├── file1.pdf
    └── file2.xlsx
```

---

## 📚 Documentation

### Essentiel (Lire dans l'ordre)

1. **README.md** - Vue d'ensemble
2. **SETUP_GUIDE.md** - Setup détaillé (12 étapes)
3. **ARCHITECTURE.md** - Architecture 3-tiers

### Phase 4 (Pour aller plus loin)

4. **PHASE_4_STATUS.md** - Status d'implémentation
5. **PHASE_4_FINAL_SUMMARY.md** - Résumé complet

**Total** : 68,000 mots de documentation

---

## 🆘 Problèmes Courants

### "Failed to fetch"

```bash
# Vérifier que le backend Supabase est bien configuré
# Vérifier SUPABASE_URL et SUPABASE_ANON_KEY

# Dans /utils/supabase/info.tsx :
export const projectId = 'xxxxx';
export const publicAnonKey = 'eyJxxxx...';
```

### "Unauthorized"

```bash
# Se reconnecter
# Vérifier que le token JWT n'est pas expiré

# Si problème persiste :
localStorage.clear();
# Puis refresh page
```

### "Evidence upload failed"

```bash
# Vérifier que le bucket Storage est initialisé
# Appeler POST /storage/init une fois au setup

# Ou initialiser via l'app :
# → Onglet Preuves → Bouton "Initialiser Storage"
```

---

## ⚙️ Configuration

### Variables d'Environnement

L'app utilise des variables stockées dans `/utils/supabase/info.tsx` :

```typescript
export const projectId = 'your-project-id';
export const publicAnonKey = 'your-anon-key';
```

**⚠️ Important** : 
- Le `SERVICE_ROLE_KEY` est stocké dans Supabase Edge Functions (sécurisé)
- Jamais exposé au frontend

---

## 🎓 Exemples de Code

### Créer un pack via API

```typescript
import { apiClient } from '@/services/api';

const pack = await apiClient.createPack({
  name: 'Mon Pack ESG 2024',
  type: 'DONNEUR_ORDRE',
});

console.log('Pack créé:', pack.id);
```

### Marquer un indicator comme fourni

```typescript
await apiClient.updateIndicator('indicator_123', {
  status: 'PROVIDED',
});
```

### Upload une preuve

```typescript
const file = new File([blob], 'preuve.pdf', { type: 'application/pdf' });

await apiClient.uploadEvidence(file, 'indicator_123');
```

Plus d'exemples → **CODE_EXAMPLES.md**

---

## 🚦 Status

| Feature | Status |
|---------|--------|
| Auth | ✅ Production-ready |
| Packs CRUD | ✅ Production-ready |
| Evidence Vault | ✅ Production-ready |
| Export PDF | ✅ Production-ready |
| Export ZIP | ✅ Production-ready |
| Persistence | ✅ Production-ready |
| Documentation | ✅ 68k words |

**Version** : 1.0.0 (Phase 4 Complete)

---

## 🎯 Prochaines Étapes

### Pour Développeurs

1. Lire **ARCHITECTURE.md** pour comprendre le code
2. Lire **CODE_EXAMPLES.md** pour voir des exemples
3. Tester toutes les fonctionnalités
4. Déployer en staging

### Pour Product Managers

1. Lire **README.md** pour vue d'ensemble
2. Lire **PHASE_4_FINAL_SUMMARY.md** pour features complètes
3. Préparer démo client
4. Planifier V2 (roadmap dans README)

### Pour Utilisateurs

1. Suivre ce Quick Start
2. Créer un pack de test
3. Remplir quelques items
4. Exporter en ZIP
5. Partager avec équipe

---

## 📞 Support

**Questions ?**
- Lire la documentation (README, SETUP_GUIDE, etc.)
- Vérifier CHANGELOG pour breaking changes
- Contacter l'équipe Solvid.IA

**Bugs ?**
- Vérifier console browser (F12)
- Vérifier console backend (Supabase logs)
- Créer une issue avec détails

---

## 🎉 C'est Parti !

```bash
pnpm dev
```

Ouvrir http://localhost:5173 et commencer à créer votre premier pack ESG ! 🌱

---

*"Rendre les données ESG auditables, traçables et faciles à consolider"*

**Solvid.IA** - ESG Audit-Ready Data Room
