-- ============================================================================
-- 002_identity_core.sql
-- ============================================================================
-- Users, roles, permissions, tenants, companies, branches, AD mapping.
-- Depends on: 001_base_schema.sql
-- ============================================================================

-- ============================================================================
-- tenants
-- ============================================================================
CREATE TABLE tenants (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid,
    company_id      uuid,
    branch_id       uuid,
    created_by      uuid,
    updated_by      uuid,
    approved_by     uuid,
    approved_at     timestamptz,
    workflow_instance_id uuid,
    trace_id        varchar,
    is_deleted      boolean DEFAULT false,
    deleted_at      timestamptz,
    deleted_by      uuid,
    version         integer DEFAULT 1,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),

    name            varchar(255) NOT NULL,
    slug            varchar(100) NOT NULL UNIQUE,
    domain          varchar,
    is_active       boolean DEFAULT true,
    settings        jsonb DEFAULT '{}'
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_is_deleted ON tenants(is_deleted);

-- ============================================================================
-- companies
-- ============================================================================
CREATE TABLE companies (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid,
    company_id      uuid,
    branch_id       uuid,
    created_by      uuid,
    updated_by      uuid,
    approved_by     uuid,
    approved_at     timestamptz,
    workflow_instance_id uuid,
    trace_id        varchar,
    is_deleted      boolean DEFAULT false,
    deleted_at      timestamptz,
    deleted_by      uuid,
    version         integer DEFAULT 1,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),

    name            varchar(255) NOT NULL,
    code            varchar(50) NOT NULL,
    tax_id          varchar,
    is_active       boolean DEFAULT true
);

CREATE INDEX idx_companies_tenant_id ON companies(tenant_id);
CREATE INDEX idx_companies_is_deleted ON companies(is_deleted);

ALTER TABLE companies ADD CONSTRAINT fk_companies_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- ============================================================================
-- branches
-- ============================================================================
CREATE TABLE branches (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid,
    company_id      uuid,
    branch_id       uuid,
    created_by      uuid,
    updated_by      uuid,
    approved_by     uuid,
    approved_at     timestamptz,
    workflow_instance_id uuid,
    trace_id        varchar,
    is_deleted      boolean DEFAULT false,
    deleted_at      timestamptz,
    deleted_by      uuid,
    version         integer DEFAULT 1,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),

    name            varchar(255) NOT NULL,
    code            varchar(50) NOT NULL,
    address         text,
    is_active       boolean DEFAULT true
);

CREATE INDEX idx_branches_company_id ON branches(company_id);
CREATE INDEX idx_branches_is_deleted ON branches(is_deleted);

ALTER TABLE branches ADD CONSTRAINT fk_branches_company
    FOREIGN KEY (company_id) REFERENCES companies(id);

-- ============================================================================
-- users
-- ============================================================================
CREATE TABLE users (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid,
    company_id      uuid,
    branch_id       uuid,
    created_by      uuid,
    updated_by      uuid,
    approved_by     uuid,
    approved_at     timestamptz,
    workflow_instance_id uuid,
    trace_id        varchar,
    is_deleted      boolean DEFAULT false,
    deleted_at      timestamptz,
    deleted_by      uuid,
    version         integer DEFAULT 1,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),

    email           varchar(255) NOT NULL UNIQUE,
    phone           varchar(50),
    password_hash   varchar(255) NOT NULL,
    first_name      varchar(100) NOT NULL,
    last_name       varchar(100) NOT NULL,
    is_active       boolean DEFAULT true,
    status          user_status DEFAULT 'ACTIVE',
    must_change_pwd boolean DEFAULT false,
    last_login_at   timestamptz,
    is_two_factor_enabled boolean DEFAULT false,
    two_factor_secret varchar(255)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_is_deleted ON users(is_deleted);

-- ============================================================================
-- roles
-- ============================================================================
CREATE TABLE roles (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid,
    company_id      uuid,
    branch_id       uuid,
    created_by      uuid,
    updated_by      uuid,
    approved_by     uuid,
    approved_at     timestamptz,
    workflow_instance_id uuid,
    trace_id        varchar,
    is_deleted      boolean DEFAULT false,
    deleted_at      timestamptz,
    deleted_by      uuid,
    version         integer DEFAULT 1,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),

    name            varchar(100) NOT NULL,
    code            varchar(50) NOT NULL,
    description     text,
    is_system       boolean DEFAULT false
);

CREATE INDEX idx_roles_code ON roles(code);
CREATE INDEX idx_roles_is_deleted ON roles(is_deleted);

-- ============================================================================
-- permissions
-- ============================================================================
CREATE TABLE permissions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid,
    company_id      uuid,
    branch_id       uuid,
    created_by      uuid,
    updated_by      uuid,
    approved_by     uuid,
    approved_at     timestamptz,
    workflow_instance_id uuid,
    trace_id        varchar,
    is_deleted      boolean DEFAULT false,
    deleted_at      timestamptz,
    deleted_by      uuid,
    version         integer DEFAULT 1,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),

    role_id         uuid NOT NULL,
    resource        varchar(100) NOT NULL,
    action          varchar(50) NOT NULL
);

CREATE UNIQUE INDEX idx_permissions_role_resource_action
    ON permissions(role_id, resource, action)
    WHERE is_deleted = false;
CREATE INDEX idx_permissions_role_id ON permissions(role_id);
CREATE INDEX idx_permissions_is_deleted ON permissions(is_deleted);

ALTER TABLE permissions ADD CONSTRAINT fk_permissions_role
    FOREIGN KEY (role_id) REFERENCES roles(id);

-- ============================================================================
-- user_roles
-- ============================================================================
CREATE TABLE user_roles (
    user_id         uuid NOT NULL,
    role_id         uuid NOT NULL,
    tenant_id       uuid,
    assigned_at     timestamptz DEFAULT now(),
    assigned_by     uuid,

    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_tenant_id ON user_roles(tenant_id);

ALTER TABLE user_roles ADD CONSTRAINT fk_user_roles_user
    FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE user_roles ADD CONSTRAINT fk_user_roles_role
    FOREIGN KEY (role_id) REFERENCES roles(id);

-- ============================================================================
-- active_directory_users
-- ============================================================================
CREATE TABLE active_directory_users (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid,
    company_id      uuid,
    branch_id       uuid,
    created_by      uuid,
    updated_by      uuid,
    approved_by     uuid,
    approved_at     timestamptz,
    workflow_instance_id uuid,
    trace_id        varchar,
    is_deleted      boolean DEFAULT false,
    deleted_at      timestamptz,
    deleted_by      uuid,
    version         integer DEFAULT 1,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),

    user_id         uuid NOT NULL,
    ad_object_id    varchar(255),
    dn              varchar(500) NOT NULL,
    sam_account_name varchar(100) NOT NULL,
    domain          varchar(255) NOT NULL,
    first_seen_at   timestamptz NOT NULL,
    last_synced_at  timestamptz NOT NULL,
    ad_attributes   jsonb
);

CREATE INDEX idx_ad_users_user_id ON active_directory_users(user_id);
CREATE INDEX idx_ad_users_sam_account_name ON active_directory_users(sam_account_name);
CREATE INDEX idx_ad_users_domain ON active_directory_users(domain);
CREATE INDEX idx_ad_users_is_deleted ON active_directory_users(is_deleted);

ALTER TABLE active_directory_users ADD CONSTRAINT fk_ad_users_user
    FOREIGN KEY (user_id) REFERENCES users(id);
