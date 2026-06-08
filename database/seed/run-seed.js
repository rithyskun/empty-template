require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { Client } = require('pg');

const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000001';

const ROLES = [
  { id: '00000000-0000-0000-0000-000000000010', code: 'SUPER_ADMIN', name: 'Super Administrator', description: 'Complete system access across all tenants', isSystem: true },
  { id: '00000000-0000-0000-0000-000000000011', code: 'ADMIN', name: 'Administrator', description: 'Tenant level administrator access', isSystem: true },
  { id: '00000000-0000-0000-0000-000000000012', code: 'USER', name: 'Standard User', description: 'Regular staff user access', isSystem: true },
  { id: '00000000-0000-0000-0000-000000000013', code: 'FINANCE_MANAGER', name: 'Finance Manager', description: 'Manage financial records and reports', isSystem: false },
  { id: '00000000-0000-0000-0000-000000000014', code: 'ACCOUNTANT', name: 'Accountant', description: 'Handle day-to-day accounting tasks', isSystem: false },
];

const PERMISSIONS = [
  // SUPER_ADMIN
  { roleCode: 'SUPER_ADMIN', resource: 'all', action: 'all' },
  // ADMIN
  { roleCode: 'ADMIN', resource: 'users', action: 'create' },
  { roleCode: 'ADMIN', resource: 'users', action: 'read' },
  { roleCode: 'ADMIN', resource: 'users', action: 'update' },
  { roleCode: 'ADMIN', resource: 'users', action: 'delete' },
  { roleCode: 'ADMIN', resource: 'roles', action: 'create' },
  { roleCode: 'ADMIN', resource: 'roles', action: 'read' },
  { roleCode: 'ADMIN', resource: 'roles', action: 'update' },
  { roleCode: 'ADMIN', resource: 'roles', action: 'delete' },
  { roleCode: 'ADMIN', resource: 'reports', action: 'read' },
  { roleCode: 'ADMIN', resource: 'reports', action: 'export' },
  // USER
  { roleCode: 'USER', resource: 'users', action: 'read' },
  { roleCode: 'USER', resource: 'reports', action: 'read' },
  { roleCode: 'USER', resource: 'invoices', action: 'read' },
  { roleCode: 'USER', resource: 'invoices', action: 'create' },
  { roleCode: 'USER', resource: 'invoices', action: 'update' },
  // FINANCE_MANAGER
  { roleCode: 'FINANCE_MANAGER', resource: 'reports', action: 'read' },
  { roleCode: 'FINANCE_MANAGER', resource: 'reports', action: 'export' },
  { roleCode: 'FINANCE_MANAGER', resource: 'reports', action: 'create' },
  { roleCode: 'FINANCE_MANAGER', resource: 'journal_entries', action: 'read' },
  { roleCode: 'FINANCE_MANAGER', resource: 'journal_entries', action: 'create' },
  { roleCode: 'FINANCE_MANAGER', resource: 'journal_entries', action: 'approve' },
  { roleCode: 'FINANCE_MANAGER', resource: 'budgets', action: 'read' },
  { roleCode: 'FINANCE_MANAGER', resource: 'budgets', action: 'create' },
  { roleCode: 'FINANCE_MANAGER', resource: 'budgets', action: 'update' },
  // ACCOUNTANT
  { roleCode: 'ACCOUNTANT', resource: 'invoices', action: 'read' },
  { roleCode: 'ACCOUNTANT', resource: 'invoices', action: 'create' },
  { roleCode: 'ACCOUNTANT', resource: 'invoices', action: 'update' },
  { roleCode: 'ACCOUNTANT', resource: 'journal_entries', action: 'read' },
  { roleCode: 'ACCOUNTANT', resource: 'journal_entries', action: 'create' },
  { roleCode: 'ACCOUNTANT', resource: 'payments', action: 'read' },
  { roleCode: 'ACCOUNTANT', resource: 'payments', action: 'create' },
  { roleCode: 'ACCOUNTANT', resource: 'payments', action: 'update' },
];

const USERS = [
  { id: '00000000-0000-0000-0000-000000000100', email: 'admin@erp.local', firstName: 'System', lastName: 'Admin', phone: '+1234567890', roleCode: 'SUPER_ADMIN', mustChangePwd: true },
  { id: '00000000-0000-0000-0000-000000000101', email: 'finance@erp.local', firstName: 'Finance', lastName: 'Manager', phone: '+1234567891', roleCode: 'FINANCE_MANAGER', mustChangePwd: false },
  { id: '00000000-0000-0000-0000-000000000102', email: 'accountant@erp.local', firstName: 'Jane', lastName: 'Doe', phone: '+1234567892', roleCode: 'ACCOUNTANT', mustChangePwd: false },
  { id: '00000000-0000-0000-0000-000000000103', email: 'user@erp.local', firstName: 'John', lastName: 'Smith', phone: '+1234567893', roleCode: 'USER', mustChangePwd: false },
];

// password: password123
const PASSWORD_HASH = 'bf65e929ab87330290e2dcc1af32d3b9:b0f5246738ecb5467ac8ea1a42de2d5b1d8cee5b9c7e1859b85c34809ccefa2cbb40719ec51a08fbc023cf2932cacb5d23f9f660d074430a1fb8e51d67ae9529';

async function runSeed() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'erp_financial',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // 1. Seed Tenant
    const tenantRes = await client.query(
      `INSERT INTO tenants (id, name, slug, domain, "isActive", settings, created_at, updated_at, version)
       VALUES ($1, $2, $3, $4, true, '{}', now(), now(), 0)
       ON CONFLICT (slug) DO NOTHING RETURNING id`,
      [SYSTEM_TENANT_ID, 'System Tenant', 'system', 'system.erp.local'],
    );
    const tenantId = tenantRes.rows[0]?.id || SYSTEM_TENANT_ID;
    console.log('Tenant ready:', tenantId);

    // 2. Seed Roles
    const roleMap = {};
    for (const r of ROLES) {
      const existing = await client.query('SELECT id FROM roles WHERE code = $1 LIMIT 1', [r.code]);
      if (existing.rows.length > 0) {
        roleMap[r.code] = existing.rows[0].id;
        console.log(`Role exists: ${r.code}`);
        continue;
      }
      const res = await client.query(
        `INSERT INTO roles (id, tenant_id, name, code, description, "isSystem", created_at, updated_at, version)
         VALUES ($1, $2, $3, $4, $5, $6, now(), now(), 0) RETURNING id`,
        [r.id, tenantId, r.name, r.code, r.description, r.isSystem],
      );
      roleMap[r.code] = res.rows[0].id;
      console.log(`Created role: ${r.code}`);
    }

    // 3. Seed Permissions
    for (const p of PERMISSIONS) {
      const roleId = roleMap[p.roleCode];
      if (!roleId) continue;
      await client.query(
        `INSERT INTO permissions (id, tenant_id, role_id, resource, action, created_at, updated_at, version)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, now(), now(), 0)
         ON CONFLICT (role_id, resource, action) DO NOTHING`,
        [tenantId, roleId, p.resource, p.action],
      );
    }
    console.log('Permissions seeded');

    // 4. Seed Users
    for (const u of USERS) {
      const existing = await client.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [u.email]);
      if (existing.rows.length > 0) {
        console.log(`User exists: ${u.email}`);
        continue;
      }
      await client.query(
        `INSERT INTO users (id, tenant_id, email, phone, password_hash, first_name, last_name, is_active, must_change_pwd, created_at, updated_at, version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, now(), now(), 0)`,
        [u.id, tenantId, u.email, u.phone, PASSWORD_HASH, u.firstName, u.lastName, u.mustChangePwd],
      );
      console.log(`Created user: ${u.email}`);
    }

    // 5. Assign Roles
    for (const u of USERS) {
      const userRes = await client.query('SELECT id FROM users WHERE email = $1', [u.email]);
      const roleId = roleMap[u.roleCode];
      if (!userRes.rows[0] || !roleId) continue;
      const userId = userRes.rows[0].id;
      await client.query(
        `INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at)
         VALUES ($1, $2, $3, now())
         ON CONFLICT (user_id, role_id) DO NOTHING`,
        [userId, roleId, tenantId],
      );
    }
    console.log('User roles assigned');

    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSeed();
