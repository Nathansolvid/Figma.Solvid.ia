# RBAC TARGETS - Actions sensibles à protéger

## PHASE 0 - CHECKLIST COMPLÈTE

### Fichiers principaux identifiés
- [x] NotificationBell.tsx (ligne 173 TODO)
- [x] permissions.ts (can() function)
- [x] AppContent.tsx (navigation state)

### Actions RBAC à appliquer (par fichier)

#### /src/app/components/views/ListeDossiers.tsx
- [ ] CREATE_DOSSIER - Bouton "Nouveau dossier"
- [ ] VIEW_DOSSIER - Cliquer pour ouvrir
- [ ] EDIT_DOSSIER - Actions d'édition
- [ ] DELETE_DOSSIER - Bouton supprimer

#### /src/app/components/views/PackSelector.tsx
- [ ] CREATE_PACK - Sélection template + création

#### /src/app/components/views/PackView.tsx
- [ ] EDIT_PACK - Édition infos pack
- [ ] MARK_READY_FOR_REVIEW - Bouton "Soumettre pour revue"
- [ ] EDIT_PACK - Modification checklist/KPIs

#### /src/app/components/views/ImportCenter.tsx
- [ ] IMPORT_DATA - Zone dropzone + bouton Import
- [ ] DELETE_IMPORT - Suppression imports historique

#### /src/app/components/views/EvidenceVault.tsx
- [ ] UPLOAD_EVIDENCE - Upload zone + bouton
- [ ] DELETE_EVIDENCE - Suppression preuves
- [ ] VERIFY_EVIDENCE - Validation preuves (si présent)

#### /src/app/components/views/ChecklistWorkflow.tsx
- [ ] EDIT_PACK - Changement status checklist items
- [ ] ACCEPT_KPI - Status ACCEPTED (réservé AUDITOR)
- [ ] REJECT_KPI - Status REJECTED (réservé AUDITOR)
- [ ] EDIT_PACK - Assignation responsable + échéances

#### /src/app/components/views/ExportsLivrables.tsx
- [ ] GENERATE_EXPORT - Bouton générer export
- [ ] SHARE_EXPORT - Partage (si implémenté)
- [ ] (lecture seule OK pour tous) - Télécharger depuis historique

#### /src/app/components/views/AuditCenter.tsx
- [ ] VIEW_AUDIT_CENTER - Accès à la vue (AUDITOR/ADMIN seuls)
- [ ] APPROVE_PACK - Bouton approuver
- [ ] REJECT_PACK - Bouton rejeter
- [ ] REQUEST_CHANGES - Bouton demander changements

#### /src/app/components/views/IndicatorsView.tsx
- [ ] VIEW_KPI_TRANSPARENCY - Icône "i" (lecture OK pour tous)
- [ ] RECALCULATE_KPI - Bouton recalculer (si présent)
- [ ] ACCEPT_KPI - Valider KPI (AUDITOR)
- [ ] REJECT_KPI - Rejeter KPI (AUDITOR)

#### /src/app/components/views/Historique.tsx
- [ ] (lecture seule pour tous)

### Empty States à implémenter

1. **ListeDossiers** - "Créez votre premier dossier"
2. **PackSelector/Liste** - "Créez votre premier pack"
3. **ImportCenter** - "Importez des données Excel/CSV"
4. **IndicatorsView** - "Aucun indicateur"
5. **EvidenceVault** - "Aucune preuve uploadée"
6. **ChecklistWorkflow** - "Aucune tâche"
7. **ExportsLivrables** - "Aucun export généré"
8. **Historique** - "Aucune activité"
9. **AuditCenter** - "Aucun pack à réviser"

### Composants à créer

- [ ] /src/services/navigationService.ts - Navigation resolver
- [ ] /src/app/components/GuardedAction.tsx - Wrapper RBAC
- [ ] /src/hooks/useGuardedClick.ts - Hook RBAC
- [ ] /src/app/components/EmptyState.tsx - Composant universel
- [ ] Tests : navigationService.test.ts
- [ ] Tests : GuardedAction.test.tsx

---

## Statut : PHASE 0 COMPLETE ✅

Prêt à implémenter PHASE 1.
