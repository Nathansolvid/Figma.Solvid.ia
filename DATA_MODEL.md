# 🗄️ DATA MODEL - ESG AUDIT-READY DATA ROOM

## Vue d'ensemble

Architecture de données pour une plateforme **ESG audit-ready** centrée sur :
- Multi-organisation
- RBAC (Role-Based Access Control)
- Traçabilité complète (audit trail)
- Architecture en **Packs** (livrables)
- Evidence-based (preuves obligatoires)

**Base de données recommandée** : PostgreSQL 14+  
**ORM recommandé** : Prisma / TypeORM / Supabase Client

---

## 📊 Schéma Relationnel (15+ tables)

### 🏢 1. Organization

**Description** : Entreprise / Cabinet / Entité racine

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Identifiant unique |
| `name` | VARCHAR(255) | NOT NULL | Nom de l'organisation |
| `type` | ENUM | NOT NULL | `CLIENT` / `CONSULTANT` / `AUDIT_FIRM` |
| `industry` | VARCHAR(100) | NULLABLE | Secteur d'activité |
| `country` | VARCHAR(2) | NOT NULL | Code pays ISO (ex: FR) |
| `siret` | VARCHAR(14) | NULLABLE | SIRET (France) |
| `subscription_plan` | ENUM | NOT NULL | `FREE` / `STARTER` / `PRO` / `ENTERPRISE` |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Dernière modification |

**Index** :
- `idx_org_name` sur `name`
- `idx_org_type` sur `type`

**Règles** :
- Soft delete : ajouter `deleted_at TIMESTAMP NULL`

---

### 👤 2. User

**Description** : Utilisateur de la plateforme

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Identifiant unique |
| `organization_id` | UUID | FOREIGN KEY → Organization | Organisation de rattachement |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Email (identifiant) |
| `password_hash` | VARCHAR(255) | NOT NULL | Hash bcrypt du mot de passe |
| `first_name` | VARCHAR(100) | NOT NULL | Prénom |
| `last_name` | VARCHAR(100) | NOT NULL | Nom |
| `role` | ENUM | NOT NULL | `ADMIN` / `CLIENT_CONTRIBUTOR` / `CONSULTANT` / `AUDITOR` / `VIEWER` |
| `is_active` | BOOLEAN | DEFAULT TRUE | Compte actif |
| `last_login_at` | TIMESTAMP | NULLABLE | Dernière connexion |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Dernière modification |

**Index** :
- `idx_user_email` sur `email`
- `idx_user_org` sur `organization_id`
- `idx_user_role` sur `role`

**Règles** :
- Email unique globalement
- Un User appartient à une seule Organization
- Rôle détermine les permissions (voir PERMISSIONS.md)

---

### 📁 3. ESG_Dossier

**Description** : Dossier ESG (projet / exercice / périmètre)

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Identifiant unique |
| `organization_id` | UUID | FOREIGN KEY → Organization | Organisation propriétaire |
| `name` | VARCHAR(255) | NOT NULL | Nom du dossier (ex: "Exercice 2024") |
| `type` | ENUM | NOT NULL | `CSRD_MANDATORY` / `ESG_STRUCTURED` |
| `period_start` | DATE | NOT NULL | Début de période |
| `period_end` | DATE | NOT NULL | Fin de période |
| `entity_scope` | TEXT | NULLABLE | Périmètre entités (JSON array ou texte) |
| `status` | ENUM | DEFAULT 'DRAFT' | `DRAFT` / `IN_PROGRESS` / `READY_FOR_REVIEW` / `APPROVED` / `ARCHIVED` |
| `owner_user_id` | UUID | FOREIGN KEY → User | Responsable principal |
| `created_by` | UUID | FOREIGN KEY → User | Créateur |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Dernière modification |

**Index** :
- `idx_dossier_org` sur `organization_id`
- `idx_dossier_status` sur `status`
- `idx_dossier_owner` sur `owner_user_id`

**Règles** :
- `period_end` > `period_start`
- Un dossier appartient à une seule Organization
- Soft delete recommandé

---

### 📦 4. ESG_PackTemplate

**Description** : Template de Pack (Donneur d'Ordre, Banque, etc.)

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Identifiant unique |
| `code` | VARCHAR(50) | UNIQUE, NOT NULL | Code technique (ex: `PACK_DONNEUR_ORDRE`) |
| `name` | VARCHAR(255) | NOT NULL | Nom affiché (ex: "Réponse Donneur d'Ordre") |
| `description` | TEXT | NULLABLE | Description du pack |
| `default_kpis` | JSONB | NOT NULL | Array de `indicator_code` (ex: `["SCOPE1_CO2", "ENERGY_TOTAL_KWH"]`) |
| `required_evidence_types` | JSONB | NOT NULL | Array de types de preuves (ex: `["INVOICE_ENERGY", "HR_EXPORT"]`) |
| `checklist_template_items` | JSONB | NOT NULL | Array d'objets `{code, label, requirement_level}` |
| `export_layout` | JSONB | NULLABLE | Config sections export PDF |
| `is_active` | BOOLEAN | DEFAULT TRUE | Template actif |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Dernière modification |

**Index** :
- `idx_pack_template_code` sur `code`

**Règles** :
- 4 templates V1 : `PACK_DONNEUR_ORDRE`, `PACK_QUESTIONNAIRE`, `PACK_BANQUE`, `PACK_PREAUDIT`
- JSONB permet flexibilité structure
- Validation JSON Schema recommandée

**Exemple JSONB** :
```json
{
  "default_kpis": ["SCOPE1_CO2", "SCOPE2_CO2", "ENERGY_TOTAL_KWH"],
  "required_evidence_types": ["INVOICE_ENERGY", "CARBON_METHOD"],
  "checklist_template_items": [
    {
      "code": "ORG_SCOPE_DEFINED",
      "label": "Périmètre organisationnel défini",
      "requirement_level": "MANDATORY"
    },
    {
      "code": "DATA_SOURCES_LISTED",
      "label": "Sources de données listées",
      "requirement_level": "RECOMMENDED"
    }
  ]
}
```

---

### 📋 5. ESG_PackInstance

**Description** : Instance d'un Pack dans un Dossier

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Identifiant unique |
| `dossier_id` | UUID | FOREIGN KEY → ESG_Dossier | Dossier parent |
| `template_id` | UUID | FOREIGN KEY → ESG_PackTemplate | Template utilisé |
| `name` | VARCHAR(255) | NOT NULL | Nom de l'instance (ex: "Pack Carrefour 2024") |
| `status` | ENUM | DEFAULT 'DRAFT' | `DRAFT` / `IN_PROGRESS` / `READY_FOR_REVIEW` / `CHANGES_REQUESTED` / `APPROVED` / `REJECTED` |
| `owner_user_id` | UUID | FOREIGN KEY → User | Responsable du pack |
| `reviewer_user_id` | UUID | FOREIGN KEY → User, NULLABLE | Auditeur assigné |
| `completion_score` | INTEGER | DEFAULT 0 | Score 0-100 de complétude |
| `created_by` | UUID | FOREIGN KEY → User | Créateur |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Dernière modification |

**Index** :
- `idx_pack_instance_dossier` sur `dossier_id`
- `idx_pack_instance_status` sur `status`
- `idx_pack_instance_reviewer` sur `reviewer_user_id`

**Règles** :
- Un dossier peut avoir plusieurs PackInstances
- Transition `READY_FOR_REVIEW` bloquée si mandatory checklist items incomplets
- `completion_score` calculé automatiquement (trigger/cron)

---

### ✅ 6. ESG_PackChecklistItem

**Description** : Item de checklist d'un Pack

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Identifiant unique |
| `pack_instance_id` | UUID | FOREIGN KEY → ESG_PackInstance | Pack parent |
| `code` | VARCHAR(100) | NOT NULL | Code de l'item (ex: `ORG_SCOPE_DEFINED`) |
| `label` | VARCHAR(255) | NOT NULL | Libellé affiché |
| `requirement_level` | ENUM | NOT NULL | `MANDATORY` / `RECOMMENDED` |
| `status` | ENUM | DEFAULT 'MISSING' | `MISSING` / `PROVIDED` / `NEEDS_REVIEW` / `ACCEPTED` / `REJECTED` |
| `assigned_to_user_id` | UUID | FOREIGN KEY → User, NULLABLE | Responsable assigné |
| `due_date` | DATE | NULLABLE | Date limite |
| `comment` | TEXT | NULLABLE | Commentaire / notes |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Dernière modification |

**Index** :
- `idx_checklist_pack` sur `pack_instance_id`
- `idx_checklist_status` sur `status`
- `idx_checklist_assigned` sur `assigned_to_user_id`

**Règles** :
- Créés automatiquement à l'instanciation d'un Pack (depuis template)
- `MANDATORY` items bloquent transition `READY_FOR_REVIEW`

---

### 📊 7. ESG_PackKPIRequirement

**Description** : KPI requis pour un Pack

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Identifiant unique |
| `pack_instance_id` | UUID | FOREIGN KEY → ESG_PackInstance | Pack parent |
| `indicator_code` | VARCHAR(100) | NOT NULL | Code indicateur (ex: `SCOPE1_CO2`) |
| `period` | VARCHAR(20) | NOT NULL | Période (ex: "2024", "Q1-2024") |
| `entity_scope` | VARCHAR(255) | NULLABLE | Périmètre entités |
| `status` | ENUM | DEFAULT 'MISSING' | `MISSING` / `COMPUTED` / `NEEDS_REVIEW` / `ACCEPTED` / `REJECTED` |
| `value` | DECIMAL(15,4) | NULLABLE | Valeur calculée |
| `unit` | VARCHAR(50) | NULLABLE | Unité |
| `comment` | TEXT | NULLABLE | Commentaire auditeur |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Dernière modification |

**Index** :
- `idx_kpi_req_pack` sur `pack_instance_id`
- `idx_kpi_req_indicator` sur `indicator_code`
- `idx_kpi_req_status` sur `status`

**Règles** :
- Créés automatiquement à l'instanciation d'un Pack
- `status` passe à `COMPUTED` dès qu'une valeur existe
- Lien vers `ESG_IndicatorValue` pour détail calcul

---

### 📥 8. ESG_DataImport

**Description** : Import de fichier Excel/CSV

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Identifiant unique |
| `dossier_id` | UUID | FOREIGN KEY → ESG_Dossier | Dossier cible |
| `file_name` | VARCHAR(255) | NOT NULL | Nom fichier original |
| `file_size` | INTEGER | NOT NULL | Taille en octets |
| `file_type` | VARCHAR(50) | NOT NULL | MIME type (ex: `text/csv`) |
| `file_url` | TEXT | NOT NULL | URL stockage (S3, Supabase Storage, etc.) |
| `mapping_profile` | JSONB | NOT NULL | Mapping colonnes → champs (réutilisable) |
| `period` | VARCHAR(20) | NOT NULL | Période des données |
| `rows_imported` | INTEGER | DEFAULT 0 | Nombre de lignes importées |
| `status` | ENUM | DEFAULT 'PENDING' | `PENDING` / `PROCESSING` / `COMPLETED` / `FAILED` |
| `error_log` | TEXT | NULLABLE | Log erreurs si échec |
| `imported_by` | UUID | FOREIGN KEY → User | Utilisateur importeur |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Dernière modification |

**Index** :
- `idx_import_dossier` sur `dossier_id`
- `idx_import_status` sur `status`
- `idx_import_period` sur `period`

**Règles** :
- `mapping_profile` sauvegardé pour réutilisation
- Support multi-périodes via champ `period`

**Exemple mapping_profile** :
```json
{
  "column_mapping": {
    "Indicateur": "indicator_name",
    "Valeur": "value",
    "Unité": "unit",
    "Source": "source"
  },
  "template_name": "Import Carbone 2024"
}
```

---

### 📄 9. ESG_DataRow

**Description** : Ligne de données normalisée (issues des imports)

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Identifiant unique |
| `dossier_id` | UUID | FOREIGN KEY → ESG_Dossier | Dossier parent |
| `import_id` | UUID | FOREIGN KEY → ESG_DataImport | Import source |
| `indicator_code` | VARCHAR(100) | NOT NULL | Code indicateur mappé |
| `period` | VARCHAR(20) | NOT NULL | Période |
| `entity` | VARCHAR(255) | NULLABLE | Entité / site |
| `value` | DECIMAL(15,4) | NOT NULL | Valeur numérique |
| `unit` | VARCHAR(50) | NULLABLE | Unité |
| `source` | VARCHAR(255) | NULLABLE | Source de la donnée |
| `raw_data` | JSONB | NULLABLE | Données brutes complètes (traçabilité) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Date de création |

**Index** :
- `idx_datarow_dossier` sur `dossier_id`
- `idx_datarow_indicator` sur `indicator_code`
- `idx_datarow_period` sur `period`

**Règles** :
- Lignes immuables (pas de UPDATE, seulement DELETE + INSERT)
- `raw_data` conserve ligne Excel complète (audit trail)

---

### 📈 10. ESG_Indicator

**Description** : Définition d'un indicateur ESG

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Identifiant unique |
| `code` | VARCHAR(100) | UNIQUE, NOT NULL | Code technique (ex: `SCOPE1_CO2`) |
| `name` | VARCHAR(255) | NOT NULL | Nom affiché |
| `category` | ENUM | NOT NULL | `ENVIRONMENT` / `SOCIAL` / `GOVERNANCE` |
| `subcategory` | VARCHAR(100) | NULLABLE | Sous-catégorie (ex: "Climat", "Effectifs") |
| `unit` | VARCHAR(50) | NOT NULL | Unité par défaut (ex: "tCO2e", "ETP") |
| `formula` | TEXT | NULLABLE | Formule de calcul (texte explicatif) |
| `data_source` | TEXT | NULLABLE | Source de données attendue |
| `methodology` | TEXT | NULLABLE | Méthodologie de calcul |
| `is_active` | BOOLEAN | DEFAULT TRUE | Indicateur actif |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Dernière modification |

**Index** :
- `idx_indicator_code` sur `code`
- `idx_indicator_category` sur `category`

**Règles** :
- 42 indicateurs prédéfinis en V1
- Extensible par l'admin

---

### 🎯 11. ESG_IndicatorValue

**Description** : Valeur calculée d'un indicateur (pour un dossier/période)

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Identifiant unique |
| `dossier_id` | UUID | FOREIGN KEY → ESG_Dossier | Dossier parent |
| `indicator_code` | VARCHAR(100) | FOREIGN KEY → ESG_Indicator | Indicateur |
| `period` | VARCHAR(20) | NOT NULL | Période |
| `entity_scope` | VARCHAR(255) | NULLABLE | Périmètre entités |
| `value` | DECIMAL(15,4) | NOT NULL | Valeur calculée |
| `unit` | VARCHAR(50) | NOT NULL | Unité |
| `calculation_profile_id` | UUID | FOREIGN KEY → ESG_CalculationProfile | Profil de calcul utilisé |
| `status` | ENUM | DEFAULT 'COMPUTED' | `COMPUTED` / `NEEDS_REVIEW` / `ACCEPTED` / `REJECTED` |
| `auditor_comment` | TEXT | NULLABLE | Commentaire auditeur |
| `computed_at` | TIMESTAMP | NOT NULL | Date de calcul |
| `computed_by` | UUID | FOREIGN KEY → User | Utilisateur ayant déclenché calcul |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Dernière modification |

**Index** :
- `idx_indicator_value_dossier` sur `dossier_id`
- `idx_indicator_value_indicator` sur `indicator_code`
- `idx_indicator_value_status` sur `status`

**Règles** :
- **CONTRAINTE CRITIQUE** : Ne peut pas passer à `ACCEPTED` sans au moins 1 Evidence liée
- Un triplet (dossier_id, indicator_code, period, entity_scope) = unique
- `calculation_profile_id` obligatoire (transparence calcul)

---

### 🧮 12. ESG_CalculationProfile

**Description** : Méthode/formule de calcul d'un indicateur

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Identifiant unique |
| `indicator_code` | VARCHAR(100) | FOREIGN KEY → ESG_Indicator | Indicateur concerné |
| `name` | VARCHAR(255) | NOT NULL | Nom du profil (ex: "Scope 1 Méthode GHG Protocol") |
| `formula` | TEXT | NOT NULL | Formule détaillée (markdown/texte) |
| `calculation_steps` | JSONB | NOT NULL | Étapes de calcul (array d'objets) |
| `assumptions` | TEXT | NULLABLE | Hypothèses / limitations |
| `methodology_reference` | VARCHAR(255) | NULLABLE | Référence normative (ex: "GHG Protocol 2015") |
| `created_by` | UUID | FOREIGN KEY → User | Créateur |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Dernière modification |

**Index** :
- `idx_calc_profile_indicator` sur `indicator_code`

**Règles** :
- Plusieurs profils possibles par indicateur (méthodes différentes)
- Utilisé pour afficher "i" transparence calcul

**Exemple calculation_steps** :
```json
{
  "steps": [
    {
      "step": 1,
      "label": "Récupérer consommation gaz naturel (m³)",
      "source": "import_id:abc123, column:gaz_m3"
    },
    {
      "step": 2,
      "label": "Appliquer facteur d'émission 2.03 kgCO2e/m³",
      "source": "ADEME Base Carbone v23"
    },
    {
      "step": 3,
      "label": "Convertir kg en tonnes (÷ 1000)",
      "formula": "value_m3 * 2.03 / 1000"
    }
  ]
}
```

---

### 🔗 13. ESG_CalculationInput

**Description** : Inputs utilisés pour un calcul (traçabilité)

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Identifiant unique |
| `indicator_value_id` | UUID | FOREIGN KEY → ESG_IndicatorValue | Valeur calculée |
| `calculation_profile_id` | UUID | FOREIGN KEY → ESG_CalculationProfile | Profil utilisé |
| `data_row_id` | UUID | FOREIGN KEY → ESG_DataRow, NULLABLE | Ligne de données source |
| `input_type` | ENUM | NOT NULL | `DATA_ROW` / `CONSTANT` / `EXTERNAL_FACTOR` |
| `input_value` | DECIMAL(15,4) | NULLABLE | Valeur de l'input |
| `input_label` | VARCHAR(255) | NOT NULL | Libellé de l'input |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Date de création |

**Index** :
- `idx_calc_input_value` sur `indicator_value_id`

**Règles** :
- Permet de "rejouer" le calcul exactement
- Essentiel pour "i" transparence

---

### 📎 14. ESG_Evidence

**Description** : Pièce justificative (fichier/lien)

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Identifiant unique |
| `dossier_id` | UUID | FOREIGN KEY → ESG_Dossier | Dossier parent |
| `pack_instance_id` | UUID | FOREIGN KEY → ESG_PackInstance, NULLABLE | Pack lié (si applicable) |
| `file_name` | VARCHAR(255) | NOT NULL | Nom du fichier |
| `file_size` | INTEGER | NULLABLE | Taille en octets |
| `file_type` | VARCHAR(100) | NOT NULL | Type (ex: `INVOICE`, `ATTESTATION`, `HR_EXPORT`) |
| `file_url` | TEXT | NOT NULL | URL stockage |
| `linked_indicator_codes` | JSONB | NULLABLE | Array de codes indicateurs liés (ex: `["SCOPE1_CO2"]`) |
| `linked_checklist_item_ids` | JSONB | NULLABLE | Array d'IDs checklist liés |
| `period` | VARCHAR(20) | NULLABLE | Période concernée |
| `entity` | VARCHAR(255) | NULLABLE | Entité concernée |
| `source` | VARCHAR(255) | NULLABLE | Source (ex: "Comptabilité") |
| `owner_user_id` | UUID | FOREIGN KEY → User | Propriétaire |
| `metadata` | JSONB | NULLABLE | Métadonnées supplémentaires |
| `uploaded_by` | UUID | FOREIGN KEY → User | Utilisateur uploadeur |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Dernière modification |

**Index** :
- `idx_evidence_dossier` sur `dossier_id`
- `idx_evidence_pack` sur `pack_instance_id`
- `idx_evidence_type` sur `file_type`

**Règles** :
- Types de preuves standardisés (INVOICE_ENERGY, HR_EXPORT, CARBON_METHOD, etc.)
- Liaison multiple indicateurs/checklist (JSONB)
- Soft delete recommandé (conservation légale)

---

### 📝 15. ESG_CommentThread

**Description** : Fil de discussion

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Identifiant unique |
| `dossier_id` | UUID | FOREIGN KEY → ESG_Dossier | Dossier parent |
| `pack_instance_id` | UUID | FOREIGN KEY → ESG_PackInstance, NULLABLE | Pack lié |
| `subject` | VARCHAR(255) | NOT NULL | Sujet de la discussion |
| `status` | ENUM | DEFAULT 'OPEN' | `OPEN` / `IN_PROGRESS` / `RESOLVED` / `CLOSED` |
| `created_by` | UUID | FOREIGN KEY → User | Créateur |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Dernière modification |

**Index** :
- `idx_thread_dossier` sur `dossier_id`
- `idx_thread_pack` sur `pack_instance_id`

---

### 💬 16. ESG_Comment

**Description** : Commentaire dans un fil

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Identifiant unique |
| `thread_id` | UUID | FOREIGN KEY → ESG_CommentThread | Fil parent |
| `content` | TEXT | NOT NULL | Contenu du commentaire |
| `author_user_id` | UUID | FOREIGN KEY → User | Auteur |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Dernière modification |

**Index** :
- `idx_comment_thread` sur `thread_id`

---

### 📜 17. ESG_AuditLog

**Description** : Journal d'audit (traçabilité complète)

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Identifiant unique |
| `dossier_id` | UUID | FOREIGN KEY → ESG_Dossier, NULLABLE | Dossier concerné |
| `pack_instance_id` | UUID | FOREIGN KEY → ESG_PackInstance, NULLABLE | Pack concerné |
| `action_type` | VARCHAR(100) | NOT NULL | Type d'action (ex: `STATUS_CHANGE`, `EVIDENCE_ADDED`) |
| `resource_type` | VARCHAR(100) | NOT NULL | Type de ressource (ex: `PACK_INSTANCE`, `INDICATOR_VALUE`) |
| `resource_id` | UUID | NOT NULL | ID de la ressource |
| `old_value` | JSONB | NULLABLE | Ancienne valeur |
| `new_value` | JSONB | NULLABLE | Nouvelle valeur |
| `user_id` | UUID | FOREIGN KEY → User | Utilisateur ayant effectué l'action |
| `ip_address` | VARCHAR(45) | NULLABLE | Adresse IP |
| `user_agent` | TEXT | NULLABLE | User agent |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Horodatage immutable |

**Index** :
- `idx_audit_dossier` sur `dossier_id`
- `idx_audit_resource` sur `resource_type, resource_id`
- `idx_audit_user` sur `user_id`
- `idx_audit_created` sur `created_at`

**Règles** :
- **IMMUTABLE** : pas de UPDATE/DELETE
- Toute action critique doit créer un AuditLog :
  - Changement statut (Pack, Checklist, KPI)
  - Ajout/modification/suppression Evidence
  - Import données
  - Validation/rejet
  - Commentaires auditeur
- Horodatage cryptographiquement sûr (optionnel : blockchain pour certif)

---

### ✅ 18. ESG_Task

**Description** : Tâche / demande d'action

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Identifiant unique |
| `dossier_id` | UUID | FOREIGN KEY → ESG_Dossier | Dossier parent |
| `pack_instance_id` | UUID | FOREIGN KEY → ESG_PackInstance, NULLABLE | Pack lié |
| `task_type` | ENUM | NOT NULL | `REQUEST_EVIDENCE` / `REQUEST_CHANGES` / `REVIEW_REQUIRED` |
| `title` | VARCHAR(255) | NOT NULL | Titre de la tâche |
| `description` | TEXT | NOT NULL | Description détaillée |
| `priority` | ENUM | DEFAULT 'MEDIUM' | `LOW` / `MEDIUM` / `HIGH` / `CRITICAL` |
| `status` | ENUM | DEFAULT 'TODO' | `TODO` / `IN_PROGRESS` / `BLOCKED` / `DONE` |
| `assigned_to_user_id` | UUID | FOREIGN KEY → User | Responsable |
| `created_by_user_id` | UUID | FOREIGN KEY → User | Créateur |
| `due_date` | DATE | NULLABLE | Date limite |
| `completed_at` | TIMESTAMP | NULLABLE | Date de complétion |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Dernière modification |

**Index** :
- `idx_task_assigned` sur `assigned_to_user_id`
- `idx_task_status` sur `status`
- `idx_task_due` sur `due_date`

**Règles** :
- Créée automatiquement lors de `RequestChanges` par auditeur
- Notifie l'assigné (voir Notifications)

---

### 🔔 19. ESG_Notification (optionnel V1.1)

**Description** : Notification utilisateur

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Identifiant unique |
| `user_id` | UUID | FOREIGN KEY → User | Destinataire |
| `type` | VARCHAR(100) | NOT NULL | Type (ex: `TASK_ASSIGNED`, `READY_FOR_REVIEW`) |
| `title` | VARCHAR(255) | NOT NULL | Titre |
| `message` | TEXT | NOT NULL | Message |
| `resource_type` | VARCHAR(100) | NULLABLE | Type de ressource liée |
| `resource_id` | UUID | NULLABLE | ID ressource liée |
| `is_read` | BOOLEAN | DEFAULT FALSE | Lu/non lu |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Date de création |

**Index** :
- `idx_notif_user` sur `user_id`
- `idx_notif_read` sur `is_read`

---

## 🔐 Contraintes de Validation

### Contraintes globales

1. **Toute IndicatorValue à statut `ACCEPTED` DOIT avoir au moins 1 Evidence liée**
   ```sql
   CHECK (
     status != 'ACCEPTED' OR
     EXISTS (SELECT 1 FROM ESG_Evidence WHERE linked_indicator_codes @> ARRAY[indicator_code])
   )
   ```

2. **Un Pack ne peut pas être `READY_FOR_REVIEW` si des checklist items MANDATORY sont Missing/Rejected**
   ```sql
   CHECK (
     status != 'READY_FOR_REVIEW' OR
     NOT EXISTS (
       SELECT 1 FROM ESG_PackChecklistItem
       WHERE pack_instance_id = id
       AND requirement_level = 'MANDATORY'
       AND status IN ('MISSING', 'REJECTED')
     )
   )
   ```

3. **period_end > period_start dans ESG_Dossier**

4. **Soft delete** : Utiliser `deleted_at TIMESTAMP NULL` plutôt que DELETE réel (conservation légale)

---

## 🔍 Index Recommandés

### Index de performance critiques

```sql
-- Recherche dossiers par org + statut
CREATE INDEX idx_dossier_org_status ON ESG_Dossier(organization_id, status);

-- Recherche packs prêts pour revue
CREATE INDEX idx_pack_status_reviewer ON ESG_PackInstance(status, reviewer_user_id);

-- Recherche preuves par type + période
CREATE INDEX idx_evidence_type_period ON ESG_Evidence(file_type, period);

-- Audit trail par date
CREATE INDEX idx_audit_created_desc ON ESG_AuditLog(created_at DESC);

-- Tâches en retard
CREATE INDEX idx_task_due_status ON ESG_Task(due_date, status) WHERE status != 'DONE';
```

### Index full-text (PostgreSQL)

```sql
-- Recherche dans preuves
CREATE INDEX idx_evidence_search ON ESG_Evidence USING GIN(to_tsvector('french', file_name || ' ' || COALESCE(source, '')));

-- Recherche dans indicateurs
CREATE INDEX idx_indicator_search ON ESG_Indicator USING GIN(to_tsvector('french', name || ' ' || COALESCE(description, '')));
```

---

## 🔄 Relations Clés

```
Organization
  ├─ User (1:N)
  └─ ESG_Dossier (1:N)
       ├─ ESG_PackInstance (1:N)
       │    ├─ ESG_PackChecklistItem (1:N)
       │    └─ ESG_PackKPIRequirement (1:N)
       ├─ ESG_DataImport (1:N)
       │    └─ ESG_DataRow (1:N)
       ├─ ESG_IndicatorValue (1:N)
       │    ├─ ESG_CalculationProfile (N:1)
       │    └─ ESG_CalculationInput (1:N)
       ├─ ESG_Evidence (1:N)
       ├─ ESG_CommentThread (1:N)
       │    └─ ESG_Comment (1:N)
       ├─ ESG_AuditLog (1:N)
       └─ ESG_Task (1:N)

ESG_PackTemplate (système)
  └─ ESG_PackInstance (1:N)

ESG_Indicator (référentiel)
  ├─ ESG_IndicatorValue (1:N)
  └─ ESG_CalculationProfile (1:N)
```

---

## 🚀 Migration V1 (Ordre de création)

1. Organization
2. User
3. ESG_Dossier
4. ESG_PackTemplate (seed avec 4 templates)
5. ESG_Indicator (seed avec 42 indicateurs)
6. ESG_DataImport
7. ESG_DataRow
8. ESG_PackInstance
9. ESG_PackChecklistItem
10. ESG_PackKPIRequirement
11. ESG_CalculationProfile
12. ESG_IndicatorValue
13. ESG_CalculationInput
14. ESG_Evidence
15. ESG_CommentThread
16. ESG_Comment
17. ESG_AuditLog
18. ESG_Task
19. ESG_Notification (V1.1)

---

## 📝 Exemple de requêtes critiques

### 1. Vérifier si un Pack est prêt pour revue

```sql
SELECT
  pi.id,
  pi.name,
  COUNT(DISTINCT ci.id) FILTER (WHERE ci.requirement_level = 'MANDATORY') as mandatory_items,
  COUNT(DISTINCT ci.id) FILTER (WHERE ci.requirement_level = 'MANDATORY' AND ci.status IN ('ACCEPTED', 'PROVIDED')) as completed_mandatory,
  CASE
    WHEN COUNT(DISTINCT ci.id) FILTER (WHERE ci.requirement_level = 'MANDATORY') =
         COUNT(DISTINCT ci.id) FILTER (WHERE ci.requirement_level = 'MANDATORY' AND ci.status IN ('ACCEPTED', 'PROVIDED'))
    THEN TRUE
    ELSE FALSE
  END as can_submit_for_review
FROM ESG_PackInstance pi
LEFT JOIN ESG_PackChecklistItem ci ON ci.pack_instance_id = pi.id
WHERE pi.id = :pack_id
GROUP BY pi.id, pi.name;
```

### 2. Calculer le score de complétude d'un Pack

```sql
UPDATE ESG_PackInstance
SET completion_score = (
  SELECT ROUND(
    100.0 * COUNT(*) FILTER (WHERE status IN ('ACCEPTED', 'PROVIDED')) / NULLIF(COUNT(*), 0)
  )
  FROM ESG_PackChecklistItem
  WHERE pack_instance_id = ESG_PackInstance.id
)
WHERE id = :pack_id;
```

### 3. Récupérer la file d'attente Audit Center

```sql
SELECT
  pi.*,
  d.name as dossier_name,
  u.first_name || ' ' || u.last_name as owner_name,
  COUNT(DISTINCT ci.id) as total_items,
  COUNT(DISTINCT ci.id) FILTER (WHERE ci.status = 'NEEDS_REVIEW') as items_to_review
FROM ESG_PackInstance pi
JOIN ESG_Dossier d ON d.id = pi.dossier_id
JOIN User u ON u.id = pi.owner_user_id
LEFT JOIN ESG_PackChecklistItem ci ON ci.pack_instance_id = pi.id
WHERE pi.status = 'READY_FOR_REVIEW'
  AND (pi.reviewer_user_id = :current_user_id OR pi.reviewer_user_id IS NULL)
GROUP BY pi.id, d.name, u.first_name, u.last_name
ORDER BY pi.updated_at ASC;
```

---

**Version** : 1.0.0  
**Date** : 30 janvier 2026  
**Maintenu par** : Solution Architect Solvid.IA
