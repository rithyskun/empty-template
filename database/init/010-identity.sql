-- ============================================================
-- Identity & Access Management
-- ============================================================

CREATE TABLE tenants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  slug            VARCHAR(100) NOT NULL UNIQUE,
  domain          VARCHAR(255),
  is_active       BOOLEAN DEFAULT true,
  settings        JSONB DEFAULT '{}',
  -- audit
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN DEFAULT false,
  deleted_at      TIMESTAMPTZ,
  version         INTEGER DEFAULT 0
);

CREATE TABLE companies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  name            VARCHAR(255) NOT NULL,
  code            VARCHAR(50) NOT NULL,
  tax_id          VARCHAR(100),
  is_active       BOOLEAN DEFAULT true,
  -- audit
  created_by      UUID,
  updated_by      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN DEFAULT false,
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID,
  version         INTEGER DEFAULT 0
);

CREATE TABLE branches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  company_id      UUID REFERENCES companies(id),
  name            VARCHAR(255) NOT NULL,
  code            VARCHAR(50) NOT NULL,
  address         TEXT,
  is_active       BOOLEAN DEFAULT true,
  -- audit
  created_by      UUID,
  updated_by      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN DEFAULT false,
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID,
  version         INTEGER DEFAULT 0
);

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  company_id      UUID REFERENCES companies(id),
  branch_id       UUID REFERENCES branches(id),
  email           VARCHAR(255) NOT NULL UNIQUE,
  phone           VARCHAR(50),
  password_hash   VARCHAR(255) NOT NULL,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  must_change_pwd BOOLEAN DEFAULT false,
  last_login_at   TIMESTAMPTZ,
  is_two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret     VARCHAR(255),
  -- audit
  created_by      UUID,
  updated_by      UUID,
  approved_by     UUID,
  approved_at     TIMESTAMPTZ,
  workflow_instance_id UUID,
  trace_id        VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN DEFAULT false,
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID,
  version         INTEGER DEFAULT 0
);

CREATE TABLE roles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  name            VARCHAR(100) NOT NULL,
  code            VARCHAR(50) NOT NULL,
  description     TEXT,
  is_system       BOOLEAN DEFAULT false,
  -- audit
  created_by      UUID,
  updated_by      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted      BOOLEAN DEFAULT false,
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID,
  version         INTEGER DEFAULT 0,
  UNIQUE(tenant_id, code)
);

CREATE TABLE permissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  role_id         UUID REFERENCES roles(id),
  resource        VARCHAR(100) NOT NULL,
  action          VARCHAR(50) NOT NULL,
  -- audit
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role_id, resource, action)
);

CREATE TABLE user_roles (
  user_id         UUID REFERENCES users(id),
  role_id         UUID REFERENCES roles(id),
  tenant_id       UUID REFERENCES tenants(id),
  assigned_at     TIMESTAMPTZ DEFAULT now(),
  assigned_by     UUID,
  PRIMARY KEY (user_id, role_id)
);

-- Indexes
CREATE INDEX idx_users_tenant    ON users(tenant_id);
CREATE INDEX idx_users_email     ON users(email);
CREATE INDEX idx_roles_tenant    ON roles(tenant_id);
CREATE INDEX idx_permissions_role ON permissions(role_id);
