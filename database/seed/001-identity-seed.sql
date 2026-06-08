-- ============================================================
-- Identity & Access Management Seed Data
-- ============================================================

-- 1. System Tenant
INSERT INTO tenants (id, name, slug, domain, is_active, settings, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'System Tenant',
  'system',
  'system.erp.local',
  true,
  '{}',
  now(),
  now()
)
ON CONFLICT (slug) DO NOTHING;

-- 2. System Roles
INSERT INTO roles (id, tenant_id, name, code, description, is_system, created_at, updated_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'Super Administrator',
    'SUPER_ADMIN',
    'Complete system access across all tenants',
    true,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000001',
    'Administrator',
    'ADMIN',
    'Tenant level administrator access',
    true,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000001',
    'Standard User',
    'USER',
    'Regular staff user access',
    true,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000013',
    '00000000-0000-0000-0000-000000000001',
    'Finance Manager',
    'FINANCE_MANAGER',
    'Manage financial records and reports',
    false,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000014',
    '00000000-0000-0000-0000-000000000001',
    'Accountant',
    'ACCOUNTANT',
    'Handle day-to-day accounting tasks',
    false,
    now(),
    now()
  )
ON CONFLICT (tenant_id, code) DO NOTHING;

-- 3. Permissions for SUPER_ADMIN (all resources, all actions)
INSERT INTO permissions (id, tenant_id, role_id, resource, action, created_at, updated_at)
VALUES
  (
    '00000000-0000-0000-0000-000000000020',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000010',
    'all',
    'all',
    now(),
    now()
  )
ON CONFLICT (role_id, resource, action) DO NOTHING;

-- Permissions for ADMIN (tenant-level management)
INSERT INTO permissions (id, tenant_id, role_id, resource, action, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'users', 'create', now(), now()),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'users', 'read',   now(), now()),
  ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'users', 'update', now(), now()),
  ('00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'users', 'delete', now(), now()),
  ('00000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'roles', 'create', now(), now()),
  ('00000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'roles', 'read',   now(), now()),
  ('00000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'roles', 'update', now(), now()),
  ('00000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'roles', 'delete', now(), now()),
  ('00000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'reports', 'read', now(), now()),
  ('00000000-0000-0000-0000-00000000002a', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'reports', 'export', now(), now())
ON CONFLICT (role_id, resource, action) DO NOTHING;

-- Permissions for USER (read-only for most)
INSERT INTO permissions (id, tenant_id, role_id, resource, action, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-00000000002b', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000012', 'users', 'read',   now(), now()),
  ('00000000-0000-0000-0000-00000000002c', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000012', 'reports', 'read',  now(), now()),
  ('00000000-0000-0000-0000-00000000002d', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000012', 'invoices', 'read', now(), now()),
  ('00000000-0000-0000-0000-00000000002e', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000012', 'invoices', 'create', now(), now()),
  ('00000000-0000-0000-0000-00000000002f', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000012', 'invoices', 'update', now(), now())
ON CONFLICT (role_id, resource, action) DO NOTHING;

-- Permissions for FINANCE_MANAGER
INSERT INTO permissions (id, tenant_id, role_id, resource, action, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000013', 'reports', 'read',   now(), now()),
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000013', 'reports', 'export', now(), now()),
  ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000013', 'reports', 'create', now(), now()),
  ('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000013', 'journal_entries', 'read',   now(), now()),
  ('00000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000013', 'journal_entries', 'create', now(), now()),
  ('00000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000013', 'journal_entries', 'approve', now(), now()),
  ('00000000-0000-0000-0000-000000000036', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000013', 'budgets', 'read',   now(), now()),
  ('00000000-0000-0000-0000-000000000037', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000013', 'budgets', 'create', now(), now()),
  ('00000000-0000-0000-0000-000000000038', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000013', 'budgets', 'update', now(), now())
ON CONFLICT (role_id, resource, action) DO NOTHING;

-- Permissions for ACCOUNTANT
INSERT INTO permissions (id, tenant_id, role_id, resource, action, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000039', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000014', 'invoices', 'read',   now(), now()),
  ('00000000-0000-0000-0000-00000000003a', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000014', 'invoices', 'create', now(), now()),
  ('00000000-0000-0000-0000-00000000003b', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000014', 'invoices', 'update', now(), now()),
  ('00000000-0000-0000-0000-00000000003c', '00000000-0000-0000-0000-000000001', '00000000-0000-0000-0000-000000000014', 'journal_entries', 'read',   now(), now()),
  ('00000000-0000-0000-0000-00000000003d', '00000000-0000-0000-0000-000000001', '00000000-0000-0000-0000-000000000014', 'journal_entries', 'create', now(), now()),
  ('00000000-0000-0000-0000-00000000003e', '00000000-0000-0000-0000-000000001', '00000000-0000-0000-0000-000000000014', 'payments', 'read',   now(), now()),
  ('00000000-0000-0000-0000-00000000003f', '00000000-0000-0000-0000-000000001', '00000000-0000-0000-0000-000000000014', 'payments', 'create', now(), now()),
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000001', '00000000-0000-0000-0000-000000000014', 'payments', 'update', now(), now())
ON CONFLICT (role_id, resource, action) DO NOTHING;

-- 4. Default Admin User (password: password123)
-- Hash generated with Node.js crypto.scryptSync
INSERT INTO users (
  id, tenant_id, email, phone, password_hash,
  first_name, last_name, is_active, must_change_pwd,
  created_at, updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000100',
  '00000000-0000-0000-0000-000000000001',
  'admin@erp.local',
  '+1234567890',
  'bf65e929ab87330290e2dcc1af32d3b9:b0f5246738ecb5467ac8ea1a42de2d5b1d8cee5b9c7e1859b85c34809ccefa2cbb40719ec51a08fbc023cf2932cacb5d23f9f660d074430a1fb8e51d67ae9529',
  'System',
  'Admin',
  true,
  true,
  now(),
  now()
)
ON CONFLICT (email) DO NOTHING;

-- 5. Assign SUPER_ADMIN role to default admin user
INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
VALUES (
  '00000000-0000-0000-0000-000000000100',
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  now()
)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 6. Demo users
INSERT INTO users (
  id, tenant_id, email, phone, password_hash,
  first_name, last_name, is_active, must_change_pwd,
  created_at, updated_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000001',
    'finance@erp.local',
    '+1234567891',
    'bf65e929ab87330290e2dcc1af32d3b9:b0f5246738ecb5467ac8ea1a42de2d5b1d8cee5b9c7e1859b85c34809ccefa2cbb40719ec51a08fbc023cf2932cacb5d23f9f660d074430a1fb8e51d67ae9529',
    'Finance',
    'Manager',
    true,
    false,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000001',
    'accountant@erp.local',
    '+1234567892',
    'bf65e929ab87330290e2dcc1af32d3b9:b0f5246738ecb5467ac8ea1a42de2d5b1d8cee5b9c7e1859b85c34809ccefa2cbb40719ec51a08fbc023cf2932cacb5d23f9f660d074430a1fb8e51d67ae9529',
    'Jane',
    'Doe',
    true,
    false,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000001',
    'user@erp.local',
    '+1234567893',
    'bf65e929ab87330290e2dcc1af32d3b9:b0f5246738ecb5467ac8ea1a42de2d5b1d8cee5b9c7e1859b85c34809ccefa2cbb40719ec51a08fbc023cf2932cacb5d23f9f660d074430a1fb8e51d67ae9529',
    'John',
    'Smith',
    true,
    false,
    now(),
    now()
  )
ON CONFLICT (email) DO NOTHING;

-- Assign roles to demo users
INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', now()), -- finance@erp.local -> FINANCE_MANAGER
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', now()), -- accountant@erp.local -> ACCOUNTANT
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', now())  -- user@erp.local -> USER
ON CONFLICT (user_id, role_id) DO NOTHING;
