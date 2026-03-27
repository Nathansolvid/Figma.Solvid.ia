-- ============================================================
-- Migration : table org_secrets
-- Stockage sécurisé des clés API Anthropic par organisation
-- Option B — clé chiffrée côté serveur, jamais exposée client
-- ============================================================
-- Prérequis : les fonctions public.is_solvid_admin() et
-- public.solvid_org_id() doivent exister (schema_prod_fixed.sql)
-- ============================================================

CREATE TABLE org_secrets (
  organization_id       TEXT PRIMARY KEY,
  anthropic_key_encrypted TEXT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE org_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_secrets_select" ON org_secrets
  FOR SELECT USING (
    public.is_solvid_admin()
    OR organization_id = public.solvid_org_id()
  );

-- INSERT : chaque org ne peut créer que sa propre ligne
CREATE POLICY "org_secrets_insert" ON org_secrets
  FOR INSERT WITH CHECK (
    organization_id = public.solvid_org_id()
  );

-- UPDATE : chaque org ne peut modifier que sa propre ligne
CREATE POLICY "org_secrets_update" ON org_secrets
  FOR UPDATE USING (
    public.is_solvid_admin()
    OR organization_id = public.solvid_org_id()
  );

-- DELETE : chaque org ne peut supprimer que sa propre ligne
CREATE POLICY "org_secrets_delete" ON org_secrets
  FOR DELETE USING (
    public.is_solvid_admin()
    OR organization_id = public.solvid_org_id()
  );
