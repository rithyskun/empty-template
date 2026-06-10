# Database Schema

All raw DDL lives here. Files are numbered and must run in order.

## Running migrations

```bash
cd libs/database/sql
./migrate.sh                    # reads DB_* from .env in project root
```

Or pass an explicit URL:

```bash
./migrate.sh postgres://postgres:postgres@localhost:5432/erp_financial
```

### How the script resolves the database URL (priority order)

1. CLI argument: `./migrate.sh postgres://...`
2. `DATABASE_URL` environment variable
3. Constructed from `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` env vars
4. Loaded automatically from `.env` file at the project root

## Adding a new module

1. Add a new ordered file: `009_<module>.sql`
2. Register it in `migrate.sh` (`FILES` array)
3. If you need new enums/types, add them to `001_base_schema.sql`

## File map

| File                        | Module            | Contents                                                                                    |
| --------------------------- | ----------------- | ------------------------------------------------------------------------------------------- |
| `001_base_schema.sql`       | shared            | Enums: `user_status`, `audit_action`, `audit_entity_type`                                   |
| `002_identity_core.sql`     | identity-core     | tenants, companies, branches, users, roles, permissions, user_roles, active_directory_users |
| `003_audit_core.sql`        | audit-core        | audit_logs                                                                                  |
| `004_payment_core.sql`      | payment-core      | payment_requests, payment_provider_logs                                                     |
| `005_settlement_core.sql`   | settlement-core   | settlement_batches, settlement_transactions                                                 |
| `006_notification_core.sql` | notification-core | notification_templates, notifications                                                       |
| `007_advance_core.sql`      | advance-core      | advance_requests, advance_repayments                                                        |
| `008_workflow_core.sql`     | workflow-core     | workflow_definitions, workflow_stage_definitions, workflow_instances, workflow_stages       |
