-- ============================================================
-- Solvid.IA — Row Level Security (RLS) Policies
-- À appliquer dans : Supabase Dashboard → SQL Editor
-- ============================================================
-- Ces policies garantissent que chaque utilisateur ne peut
-- accéder QU'AUX données de son organisation, même via
-- l'API Supabase directe (bypass du filtrage code).
-- Les ADMIN voient toutes les données.
-- ============================================================

-- ── Helper : vérifie si l'utilisateur courant est ADMIN ──────────────────────
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

-- ── Helper : retourne l'organizationId du JWT courant ────────────────────────
CREATE OR REPLACE FUNCTION auth.org_id()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT auth.jwt() -> 'user_metadata' ->> 'organizationId';
$$;


-- ════════════════════════════════════════════════════════════
-- TABLE : dossiers
-- ════════════════════════════════════════════════════════════
ALTER TABLE dossiers ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "dossiers_select" ON dossiers;
DROP POLICY IF EXISTS "dossiers_insert" ON dossiers;
DROP POLICY IF EXISTS "dossiers_update" ON dossiers;
DROP POLICY IF EXISTS "dossiers_delete" ON dossiers;

CREATE POLICY "dossiers_select" ON dossiers
  FOR SELECT USING (
    auth.is_solvid_admin()
    OR organization_id = auth.org_id()
  );

CREATE POLICY "dossiers_insert" ON dossiers
  FOR INSERT WITH CHECK (
    auth.is_solvid_admin()
    OR organization_id = auth.org_id()
  );

CREATE POLICY "dossiers_update" ON dossiers
  FOR UPDATE USING (
    auth.is_solvid_admin()
    OR organization_id = auth.org_id()
  );

CREATE POLICY "dossiers_delete" ON dossiers
  FOR DELETE USING (
    auth.is_solvid_admin()
    OR organization_id = auth.org_id()
  );


-- ════════════════════════════════════════════════════════════
-- TABLE : vsme_values
-- ════════════════════════════════════════════════════════════
ALTER TABLE vsme_values ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vsme_values_select" ON vsme_values;
DROP POLICY IF EXISTS "vsme_values_insert" ON vsme_values;
DROP POLICY IF EXISTS "vsme_values_update" ON vsme_values;
DROP POLICY IF EXISTS "vsme_values_delete" ON vsme_values;

CREATE POLICY "vsme_values_select" ON vsme_values
  FOR SELECT USING (
    auth.is_solvid_admin()
    OR organization_id = auth.org_id()
  );

CREATE POLICY "vsme_values_insert" ON vsme_values
  FOR INSERT WITH CHECK (
    auth.is_solvid_admin()
    OR organization_id = auth.org_id()
  );

CREATE POLICY "vsme_values_update" ON vsme_values
  FOR UPDATE USING (
    auth.is_solvid_admin()
    OR organization_id = auth.org_id()
  );

CREATE POLICY "vsme_values_delete" ON vsme_values
  FOR DELETE USING (
    auth.is_solvid_admin()
    OR organization_id = auth.org_id()
  );


-- ════════════════════════════════════════════════════════════
-- TABLE : mission_notes
-- ════════════════════════════════════════════════════════════
ALTER TABLE mission_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mission_notes_select" ON mission_notes;
DROP POLICY IF EXISTS "mission_notes_insert" ON mission_notes;
DROP POLICY IF EXISTS "mission_notes_update" ON mission_notes;
DROP POLICY IF EXISTS "mission_notes_delete" ON mission_notes;

CREATE POLICY "mission_notes_select" ON mission_notes
  FOR SELECT USING (
    auth.is_solvid_admin()
    OR organization_id = auth.org_id()
  );

CREATE POLICY "mission_notes_insert" ON mission_notes
  FOR INSERT WITH CHECK (
    auth.is_solvid_admin()
    OR organization_id = auth.org_id()
  );

CREATE POLICY "mission_notes_update" ON mission_notes
  FOR UPDATE USING (
    auth.is_solvid_admin()
    OR organization_id = auth.org_id()
  );

CREATE POLICY "mission_notes_delete" ON mission_notes
  FOR DELETE USING (
    auth.is_solvid_admin()
    OR organization_id = auth.org_id()
  );


-- ════════════════════════════════════════════════════════════
-- VÉRIFICATION (optionnel — à lancer après application)
-- ════════════════════════════════════════════════════════════
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('dossiers', 'vsme_values', 'mission_notes')
-- ORDER BY tablename, cmd;
