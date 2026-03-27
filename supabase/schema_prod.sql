-- ============================================================
-- Solvid.IA — Schéma complet (structure uniquement, sans données)
-- Généré depuis src/types/supabase.ts + migrations RLS
-- Cible : projet DEV (audofeyqrxglxutqtvja)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ════════════════════════════════════════════════════════════
-- CORE TABLES (migration 001)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS organizations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  sector       TEXT,
  size         TEXT,
  logo         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id               UUID PRIMARY KEY,
  email            TEXT NOT NULL,
  name             TEXT NOT NULL DEFAULT '',
  role             TEXT NOT NULL DEFAULT 'CLIENT_OWNER',
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  avatar           TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dossiers (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  client_org          TEXT,
  fiscal_year         TEXT NOT NULL DEFAULT '2025',
  referentiel_id      TEXT,
  mission_type        TEXT,
  pathway_type        TEXT,
  provider_org        TEXT,
  lead_consultant     TEXT,
  start_date          TEXT,
  end_date            TEXT,
  selected_workflows  TEXT[],
  pack_type           TEXT,
  status              TEXT NOT NULL DEFAULT 'active',
  period_mode         TEXT,
  custom_periods      JSONB,
  description         TEXT,
  organization_id     TEXT NOT NULL,
  owner_id            TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dossiers_organization_id_idx ON dossiers(organization_id);

CREATE TABLE IF NOT EXISTS vsme_values (
  id               TEXT PRIMARY KEY,
  dossier_id       TEXT NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  code             TEXT NOT NULL,
  raw_value        TEXT NOT NULL DEFAULT '',
  statut           TEXT NOT NULL DEFAULT 'non_renseigne',
  period           TEXT NOT NULL DEFAULT 'annuel',
  organization_id  TEXT NOT NULL,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vsme_values_dossier_id_idx ON vsme_values(dossier_id);
CREATE INDEX IF NOT EXISTS vsme_values_organization_id_idx ON vsme_values(organization_id);

CREATE TABLE IF NOT EXISTS mission_notes (
  id               TEXT PRIMARY KEY,
  dossier_id       TEXT NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  content          TEXT NOT NULL DEFAULT '',
  author           TEXT NOT NULL,
  category         TEXT NOT NULL DEFAULT 'general',
  organization_id  TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mission_notes_dossier_id_idx ON mission_notes(dossier_id);

-- ════════════════════════════════════════════════════════════
-- PACK MANAGEMENT (migration 004)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pack_templates (
  id                       TEXT PRIMARY KEY,
  code                     TEXT NOT NULL UNIQUE,
  name                     TEXT NOT NULL,
  description              TEXT NOT NULL DEFAULT '',
  category                 TEXT,
  checklist_template_items JSONB NOT NULL DEFAULT '[]',
  default_kpis             JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS pack_instances (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  dossier_id       TEXT NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  template_code    TEXT NOT NULL,
  template_name    TEXT NOT NULL,
  organization_id  TEXT NOT NULL,
  owner_id         TEXT,
  status           TEXT NOT NULL DEFAULT 'draft',
  completion_score NUMERIC,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at     TIMESTAMPTZ,
  reviewed_at      TIMESTAMPTZ,
  reviewer_id      TEXT
);
CREATE INDEX IF NOT EXISTS pack_instances_dossier_id_idx ON pack_instances(dossier_id);
CREATE INDEX IF NOT EXISTS pack_instances_organization_id_idx ON pack_instances(organization_id);

CREATE TABLE IF NOT EXISTS checklist_items (
  id                TEXT PRIMARY KEY,
  pack_id           TEXT NOT NULL REFERENCES pack_instances(id) ON DELETE CASCADE,
  code              TEXT NOT NULL,
  label             TEXT NOT NULL,
  requirement_level TEXT,
  category          TEXT,
  status            TEXT NOT NULL DEFAULT 'pending',
  description       TEXT,
  comment           TEXT,
  assigned_to       TEXT,
  due_date          TEXT,
  organization_id   TEXT NOT NULL,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS checklist_items_pack_id_idx ON checklist_items(pack_id);

CREATE TABLE IF NOT EXISTS kpi_requirements (
  id               TEXT PRIMARY KEY,
  pack_id          TEXT NOT NULL REFERENCES pack_instances(id) ON DELETE CASCADE,
  code             TEXT NOT NULL,
  name             TEXT NOT NULL,
  unit             TEXT NOT NULL DEFAULT '',
  category         TEXT,
  status           TEXT NOT NULL DEFAULT 'non_renseigne',
  value            NUMERIC,
  period           TEXT,
  calculation_type TEXT,
  formula          TEXT,
  sources          TEXT,
  methodology      TEXT,
  has_evidence     BOOLEAN NOT NULL DEFAULT false,
  evidence_count   INTEGER NOT NULL DEFAULT 0,
  warnings         JSONB NOT NULL DEFAULT '[]',
  organization_id  TEXT NOT NULL,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS kpi_requirements_pack_id_idx ON kpi_requirements(pack_id);

CREATE TABLE IF NOT EXISTS folders (
  id               TEXT PRIMARY KEY,
  pack_id          TEXT NOT NULL REFERENCES pack_instances(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  category         TEXT,
  description      TEXT,
  organization_id  TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS indicators (
  id                TEXT PRIMARY KEY,
  folder_id         TEXT REFERENCES folders(id) ON DELETE SET NULL,
  pack_id           TEXT NOT NULL REFERENCES pack_instances(id) ON DELETE CASCADE,
  code              TEXT NOT NULL,
  name              TEXT NOT NULL,
  unit              TEXT NOT NULL DEFAULT '',
  category          TEXT,
  status            TEXT NOT NULL DEFAULT 'non_renseigne',
  value             NUMERIC,
  period            TEXT,
  requirement_level TEXT,
  has_evidence      BOOLEAN NOT NULL DEFAULT false,
  evidence_count    INTEGER NOT NULL DEFAULT 0,
  comment           TEXT,
  organization_id   TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS indicators_pack_id_idx ON indicators(pack_id);

CREATE TABLE IF NOT EXISTS evidence (
  id                TEXT PRIMARY KEY,
  pack_id           TEXT NOT NULL REFERENCES pack_instances(id) ON DELETE CASCADE,
  workflow_id       TEXT,
  indicator_id      TEXT REFERENCES indicators(id) ON DELETE SET NULL,
  file_name         TEXT NOT NULL,
  file_type         TEXT NOT NULL,
  file_size         BIGINT NOT NULL DEFAULT 0,
  file_hash         TEXT,
  storage_path      TEXT,
  period            TEXT,
  category          TEXT,
  uploaded_by       TEXT,
  uploaded_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  linked_indicators JSONB NOT NULL DEFAULT '[]',
  completion_type   TEXT,
  justification     TEXT,
  organization_id   TEXT NOT NULL,
  updated_at        TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS evidence_pack_id_idx ON evidence(pack_id);

CREATE TABLE IF NOT EXISTS evidence_links (
  id              TEXT PRIMARY KEY,
  evidence_id     TEXT NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  kpi_id          TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- DATA IMPORTS (migration 004)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS data_imports (
  id              TEXT PRIMARY KEY,
  pack_id         TEXT NOT NULL REFERENCES pack_instances(id) ON DELETE CASCADE,
  file_name       TEXT NOT NULL,
  mapping_name    TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',
  rows_total      INTEGER NOT NULL DEFAULT 0,
  rows_created    INTEGER NOT NULL DEFAULT 0,
  rows_updated    INTEGER NOT NULL DEFAULT 0,
  rows_errored    INTEGER NOT NULL DEFAULT 0,
  error_details   JSONB,
  uploaded_by     TEXT,
  organization_id TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS data_rows (
  id               TEXT PRIMARY KEY,
  import_id        TEXT NOT NULL REFERENCES data_imports(id) ON DELETE CASCADE,
  pack_id          TEXT NOT NULL,
  indicator_code   TEXT NOT NULL,
  value            NUMERIC,
  unit             TEXT,
  period           TEXT,
  source           TEXT,
  methodology      TEXT,
  comment          TEXT,
  row_index        INTEGER,
  organization_id  TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- TASKS & NOTIFICATIONS (migration 004)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tasks (
  id                  TEXT PRIMARY KEY,
  title               TEXT NOT NULL,
  description         TEXT NOT NULL DEFAULT '',
  category            TEXT,
  status              TEXT NOT NULL DEFAULT 'todo',
  priority            TEXT NOT NULL DEFAULT 'medium',
  pack_id             TEXT REFERENCES pack_instances(id) ON DELETE SET NULL,
  assigned_to         TEXT,
  due_date            TEXT,
  linked_indicators   JSONB NOT NULL DEFAULT '[]',
  has_excel_template  BOOLEAN NOT NULL DEFAULT false,
  excel_template_url  TEXT,
  excel_status        TEXT,
  tags                JSONB NOT NULL DEFAULT '[]',
  created_by          TEXT,
  organization_id     TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at        TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS notifications (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL,
  type             TEXT NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  pack_id          TEXT REFERENCES pack_instances(id) ON DELETE SET NULL,
  read             BOOLEAN NOT NULL DEFAULT false,
  organization_id  TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);

-- ════════════════════════════════════════════════════════════
-- AUDIT & EXPORT (migration 004)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS audit_logs (
  id               TEXT PRIMARY KEY,
  entity_type      TEXT NOT NULL,
  entity_id        TEXT NOT NULL,
  action           TEXT NOT NULL,
  user_id          TEXT,
  user_name        TEXT,
  user_role        TEXT,
  details          JSONB,
  before_data      JSONB,
  after_data       JSONB,
  ip_address       TEXT,
  organization_id  TEXT NOT NULL,
  timestamp        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_organization_id_idx ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS audit_logs_entity_id_idx ON audit_logs(entity_id);

CREATE TABLE IF NOT EXISTS export_history (
  id               TEXT PRIMARY KEY,
  pack_id          TEXT NOT NULL,
  type             TEXT,
  file_name        TEXT NOT NULL,
  file_size        BIGINT NOT NULL DEFAULT 0,
  storage_path     TEXT,
  generated_by     TEXT,
  organization_id  TEXT NOT NULL,
  generated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- INVITATIONS (migration 004)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS invitations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email               TEXT NOT NULL,
  role                TEXT NOT NULL DEFAULT 'CLIENT_OWNER',
  organization_id     TEXT NOT NULL,
  organization_name   TEXT,
  invited_by          TEXT,
  invited_by_name     TEXT,
  status              TEXT NOT NULL DEFAULT 'pending',
  subscription_plan   TEXT NOT NULL DEFAULT 'free',
  expires_at          TIMESTAMPTZ NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at         TIMESTAMPTZ,
  accepted_user_id    TEXT
);

-- ════════════════════════════════════════════════════════════
-- ERP INTEGRATION (migration 004)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS erp_connections (
  id                TEXT PRIMARY KEY,
  organization_id   TEXT NOT NULL,
  provider          TEXT NOT NULL,
  name              TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'inactive',
  credentials       JSONB NOT NULL DEFAULT '{}',
  config            JSONB NOT NULL DEFAULT '{}',
  last_sync_status  TEXT,
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS erp_mappings (
  id               TEXT PRIMARY KEY,
  connection_id    TEXT NOT NULL REFERENCES erp_connections(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  rules            JSONB NOT NULL DEFAULT '[]',
  organization_id  TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS erp_sync_jobs (
  id               TEXT PRIMARY KEY,
  connection_id    TEXT NOT NULL REFERENCES erp_connections(id) ON DELETE CASCADE,
  status           TEXT NOT NULL DEFAULT 'pending',
  triggered_by     TEXT,
  stats            JSONB NOT NULL DEFAULT '{}',
  errors           JSONB NOT NULL DEFAULT '[]',
  data_preview     JSONB,
  organization_id  TEXT NOT NULL,
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS esg_data_points (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vsme_code        TEXT NOT NULL,
  pillar           TEXT,
  value            NUMERIC,
  unit             TEXT,
  source           TEXT,
  confidence       NUMERIC,
  organization_id  TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- KV STORE (Edge Function Make)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS kv_store_aa780fc8 (
  key    TEXT PRIMARY KEY,
  value  JSONB
);

-- ════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT auth.jwt() -> 'user_metadata' ->> 'organizationId';
$$;

CREATE OR REPLACE FUNCTION auth.is_solvid_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN',
    false
  );
$$;

CREATE OR REPLACE FUNCTION auth.org_id()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT auth.jwt() -> 'user_metadata' ->> 'organizationId';
$$;

-- ════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════

ALTER TABLE dossiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dossiers_select" ON dossiers;
DROP POLICY IF EXISTS "dossiers_insert" ON dossiers;
DROP POLICY IF EXISTS "dossiers_update" ON dossiers;
DROP POLICY IF EXISTS "dossiers_delete" ON dossiers;
CREATE POLICY "dossiers_select" ON dossiers FOR SELECT USING (auth.is_solvid_admin() OR organization_id = auth.org_id());
CREATE POLICY "dossiers_insert" ON dossiers FOR INSERT WITH CHECK (auth.is_solvid_admin() OR organization_id = auth.org_id());
CREATE POLICY "dossiers_update" ON dossiers FOR UPDATE USING (auth.is_solvid_admin() OR organization_id = auth.org_id());
CREATE POLICY "dossiers_delete" ON dossiers FOR DELETE USING (auth.is_solvid_admin() OR organization_id = auth.org_id());

ALTER TABLE vsme_values ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vsme_values_select" ON vsme_values;
DROP POLICY IF EXISTS "vsme_values_insert" ON vsme_values;
DROP POLICY IF EXISTS "vsme_values_update" ON vsme_values;
DROP POLICY IF EXISTS "vsme_values_delete" ON vsme_values;
CREATE POLICY "vsme_values_select" ON vsme_values FOR SELECT USING (auth.is_solvid_admin() OR organization_id = auth.org_id());
CREATE POLICY "vsme_values_insert" ON vsme_values FOR INSERT WITH CHECK (auth.is_solvid_admin() OR organization_id = auth.org_id());
CREATE POLICY "vsme_values_update" ON vsme_values FOR UPDATE USING (auth.is_solvid_admin() OR organization_id = auth.org_id());
CREATE POLICY "vsme_values_delete" ON vsme_values FOR DELETE USING (auth.is_solvid_admin() OR organization_id = auth.org_id());

ALTER TABLE mission_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mission_notes_select" ON mission_notes;
DROP POLICY IF EXISTS "mission_notes_insert" ON mission_notes;
DROP POLICY IF EXISTS "mission_notes_update" ON mission_notes;
DROP POLICY IF EXISTS "mission_notes_delete" ON mission_notes;
CREATE POLICY "mission_notes_select" ON mission_notes FOR SELECT USING (auth.is_solvid_admin() OR organization_id = auth.org_id());
CREATE POLICY "mission_notes_insert" ON mission_notes FOR INSERT WITH CHECK (auth.is_solvid_admin() OR organization_id = auth.org_id());
CREATE POLICY "mission_notes_update" ON mission_notes FOR UPDATE USING (auth.is_solvid_admin() OR organization_id = auth.org_id());
CREATE POLICY "mission_notes_delete" ON mission_notes FOR DELETE USING (auth.is_solvid_admin() OR organization_id = auth.org_id());

ALTER TABLE pack_instances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pack_instances_select" ON pack_instances;
DROP POLICY IF EXISTS "pack_instances_insert" ON pack_instances;
DROP POLICY IF EXISTS "pack_instances_update" ON pack_instances;
DROP POLICY IF EXISTS "pack_instances_delete" ON pack_instances;
CREATE POLICY "pack_instances_select" ON pack_instances FOR SELECT USING (auth.is_solvid_admin() OR organization_id = auth.org_id());
CREATE POLICY "pack_instances_insert" ON pack_instances FOR INSERT WITH CHECK (auth.is_solvid_admin() OR organization_id = auth.org_id());
CREATE POLICY "pack_instances_update" ON pack_instances FOR UPDATE USING (auth.is_solvid_admin() OR organization_id = auth.org_id());
CREATE POLICY "pack_instances_delete" ON pack_instances FOR DELETE USING (auth.is_solvid_admin() OR organization_id = auth.org_id());
