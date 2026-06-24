-- ============================================================
-- CEO Brain SaaS — Schema do Banco de Dados
-- Execute no Supabase SQL Editor do projeto NOVO (ceobrain-saas)
-- ============================================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'canceled');
CREATE TYPE user_role            AS ENUM ('admin', 'member', 'viewer');
CREATE TYPE activity_type        AS ENUM ('stage_change', 'note', 'create', 'update', 'delete', 'system');

-- ============================================================
-- TABELA: plans
-- ============================================================

CREATE TABLE plans (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                     VARCHAR(100) NOT NULL,
  price_monthly            DECIMAL(10,2) NOT NULL,
  price_annual             DECIMAL(10,2) NOT NULL,
  features                 JSONB DEFAULT '{}',
  stripe_price_monthly_id  VARCHAR(100),
  stripe_price_annual_id   VARCHAR(100),
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

-- Plano único CEO Brain
INSERT INTO plans (name, price_monthly, price_annual, features) VALUES (
  'CEO Brain',
  99.00,
  1089.00,
  '{"kanban": true, "cnpj_search": true, "automations": true, "reports": true, "unlimited_users": true}'
);

-- ============================================================
-- TABELA: organizations
-- ============================================================

CREATE TABLE organizations (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                     VARCHAR(255) NOT NULL,
  slug                     VARCHAR(100) UNIQUE NOT NULL,
  logo_url                 TEXT,
  plan_id                  UUID REFERENCES plans(id),
  subscription_status      subscription_status NOT NULL DEFAULT 'trial',
  trial_ends_at            TIMESTAMPTZ,
  subscription_started_at  TIMESTAMPTZ,
  subscription_ended_at    TIMESTAMPTZ,
  stripe_customer_id       VARCHAR(100),
  stripe_subscription_id   VARCHAR(100),
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW(),
  deleted_at               TIMESTAMPTZ
);

CREATE INDEX idx_organizations_slug   ON organizations(slug);
CREATE INDEX idx_organizations_stripe ON organizations(stripe_customer_id);

-- ============================================================
-- TABELA: profiles (complementa auth.users)
-- ============================================================

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   VARCHAR(255),
  avatar_url  TEXT,
  phone       VARCHAR(20),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Criar perfil automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- TABELA: organization_members
-- ============================================================

CREATE TABLE organization_members (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role             user_role NOT NULL DEFAULT 'member',
  invited_by       UUID REFERENCES auth.users(id),
  invited_at       TIMESTAMPTZ DEFAULT NOW(),
  accepted_at      TIMESTAMPTZ,
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org  ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);

-- Função auxiliar: retorna organização e role do usuário autenticado
CREATE OR REPLACE FUNCTION get_user_organization(p_user_id UUID)
RETURNS TABLE(organization_id UUID, role user_role) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT om.organization_id, om.role
  FROM organization_members om
  WHERE om.user_id = p_user_id
    AND om.is_active = TRUE
    AND om.accepted_at IS NOT NULL
  LIMIT 1;
END;
$$;

-- ============================================================
-- TABELA: funnels
-- ============================================================

CREATE TABLE funnels (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  description      TEXT,
  stages           TEXT[] NOT NULL DEFAULT ARRAY['Prospecção','Negociação','Proposta','Fechamento','Ganho','Perdido'],
  currency         VARCHAR(3) NOT NULL DEFAULT 'BRL',
  created_by       UUID NOT NULL REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX idx_funnels_org ON funnels(organization_id) WHERE deleted_at IS NULL;

-- ============================================================
-- TABELA: contacts
-- ============================================================

CREATE TABLE contacts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  email            VARCHAR(255),
  phone            VARCHAR(20),
  company          VARCHAR(255),
  cnpj             VARCHAR(14),       -- link com a base de empresas
  position         VARCHAR(100),
  custom_fields    JSONB DEFAULT '{}',
  created_by       UUID NOT NULL REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX idx_contacts_org  ON contacts(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_cnpj ON contacts(cnpj) WHERE cnpj IS NOT NULL;

-- ============================================================
-- TABELA: opportunities
-- ============================================================

CREATE TABLE opportunities (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  funnel_id            UUID NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id           UUID REFERENCES contacts(id) ON DELETE SET NULL,
  title                VARCHAR(255) NOT NULL,
  description          TEXT,
  value                DECIMAL(15,2) DEFAULT 0,
  stage                VARCHAR(100) NOT NULL,
  probability          SMALLINT DEFAULT 50 CHECK (probability BETWEEN 0 AND 100),
  expected_close_date  DATE,
  owner_id             UUID NOT NULL REFERENCES auth.users(id),
  tags                 TEXT[] DEFAULT '{}',
  custom_fields        JSONB DEFAULT '{}',
  lost_reason          TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  deleted_at           TIMESTAMPTZ
);

CREATE INDEX idx_opps_org    ON opportunities(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_opps_funnel ON opportunities(funnel_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_opps_owner  ON opportunities(owner_id);
CREATE INDEX idx_opps_stage  ON opportunities(stage);

-- ============================================================
-- TABELA: activity_logs
-- ============================================================

CREATE TABLE activity_logs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id),
  entity_type      VARCHAR(50) NOT NULL,   -- 'opportunity', 'contact', 'funnel'
  entity_id        UUID NOT NULL,
  type             activity_type NOT NULL,
  description      TEXT NOT NULL,
  metadata         JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logs_org    ON activity_logs(organization_id, created_at DESC);
CREATE INDEX idx_logs_entity ON activity_logs(entity_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE organizations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnels              ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities        ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs        ENABLE ROW LEVEL SECURITY;

-- Helper: verifica se o usuário autenticado é membro da organização
CREATE OR REPLACE FUNCTION is_member_of(org_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND is_active = TRUE
      AND accepted_at IS NOT NULL
  );
$$;

-- Helper: verifica se o usuário é admin da organização
CREATE OR REPLACE FUNCTION is_admin_of(org_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND is_active = TRUE
      AND accepted_at IS NOT NULL
  );
$$;

-- ---- Policies: organizations ----
CREATE POLICY "Membros veem sua organização"
  ON organizations FOR SELECT
  USING (is_member_of(id));

CREATE POLICY "Apenas admins atualizam organização"
  ON organizations FOR UPDATE
  USING (is_admin_of(id));

-- ---- Policies: profiles ----
CREATE POLICY "Usuário vê seu próprio perfil"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Usuário atualiza seu próprio perfil"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- ---- Policies: organization_members ----
CREATE POLICY "Membros veem outros membros da mesma org"
  ON organization_members FOR SELECT
  USING (is_member_of(organization_id));

CREATE POLICY "Admins gerenciam membros"
  ON organization_members FOR ALL
  USING (is_admin_of(organization_id));

-- ---- Policies: funnels ----
CREATE POLICY "Membros veem funis da sua org"
  ON funnels FOR SELECT
  USING (is_member_of(organization_id) AND deleted_at IS NULL);

CREATE POLICY "Admins e members criam funis"
  ON funnels FOR INSERT
  WITH CHECK (is_member_of(organization_id));

CREATE POLICY "Admins editam funis"
  ON funnels FOR UPDATE
  USING (is_admin_of(organization_id));

-- ---- Policies: contacts ----
CREATE POLICY "Membros veem contatos da sua org"
  ON contacts FOR SELECT
  USING (is_member_of(organization_id) AND deleted_at IS NULL);

CREATE POLICY "Membros criam e editam contatos"
  ON contacts FOR ALL
  USING (is_member_of(organization_id));

-- ---- Policies: opportunities ----
CREATE POLICY "Membros veem oportunidades da sua org"
  ON opportunities FOR SELECT
  USING (is_member_of(organization_id) AND deleted_at IS NULL);

CREATE POLICY "Membros criam oportunidades"
  ON opportunities FOR INSERT
  WITH CHECK (is_member_of(organization_id));

CREATE POLICY "Dono ou admin edita oportunidade"
  ON opportunities FOR UPDATE
  USING (
    is_member_of(organization_id) AND
    (owner_id = auth.uid() OR is_admin_of(organization_id))
  );

CREATE POLICY "Apenas admin deleta (soft)"
  ON opportunities FOR UPDATE
  USING (is_admin_of(organization_id));

-- ---- Policies: activity_logs ----
CREATE POLICY "Membros veem logs da sua org"
  ON activity_logs FOR SELECT
  USING (is_member_of(organization_id));

CREATE POLICY "Sistema insere logs"
  ON activity_logs FOR INSERT
  WITH CHECK (is_member_of(organization_id));

-- ============================================================
-- TRIGGER: atualiza updated_at automaticamente
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_funnels_updated_at
  BEFORE UPDATE ON funnels FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_opportunities_updated_at
  BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_org_members_updated_at
  BEFORE UPDATE ON organization_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
