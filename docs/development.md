# Development Guide

Onboarding and day-to-day development guide for the ERP Financial Platform.

## Prerequisites

- **Node.js** 20+ (check with `node --version`)
- **npm** 10+ (comes with Node.js)
- **Docker** & **Docker Compose** (for PostgreSQL, Redis)
- **Git**

## Initial Setup

### 1. Clone and install

```bash
git clone <repo-url> erp_financial
cd erp_financial
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Review `.env` and adjust values for your local environment (database credentials, Redis host, etc.).

### 3. Start infrastructure

```bash
npm run dev:infra
```

This starts PostgreSQL and Redis in Docker. Check with:

```bash
docker compose ps
```

### 4. Verify the workspace

```bash
# Check all projects are recognized
npx nx show projects

# Run a quick build + typecheck
npx nx run-many -t typecheck -t build --all
```

## Running the Platform

### Core services (recommended for new devs)

```bash
npm run dev:core
```

Runs: `api-gateway`, `identity-service`, `auth-service`, `payment-service`, `settlement-service`, `audit-log-service`

### Everything at once

```bash
npm run dev:all
```

Runs all services + workers (resource-heavy).

### Individual services

```bash
npx nx serve <service-name>
# Examples:
npx nx serve api-gateway
npx nx serve payment-service
npx nx serve identity-service
```

### Frontend only

```bash
npx nx serve erp-frontend
```

### Workers only

```bash
npm run dev:workers
```

Runs: `payment-worker`, `settlement-worker`, `notification-worker`

## Day-to-Day Workflow

### Before starting work

```bash
# Pull latest, sync dependencies
npm install

# Ensure TS project references are up to date
npx nx sync
```

### Making changes

1. **Write code** in the relevant `apps/` or `libs/` project.
2. **Add/update tests** for any library changes. See [unit-testing.md](unit-testing.md).
3. **Verify locally:**

```bash
# Type-check affected projects
npx nx affected -t typecheck

# Build affected projects
npx nx affected -t build

# Run tests for affected projects
npx nx affected -t test

# Lint affected projects
npx nx affected -t lint
```

### Committing

The project uses **Husky** for git hooks. `npm install` should have set this up automatically. If not:

```bash
npx husky install
```

## Nx Essentials

### View the project graph

```bash
npx nx graph
```

### Run a target for one project

```bash
npx nx <target> <project>
npx nx build payment-service
npx nx test mail
npx nx lint erp-frontend
npx nx typecheck identity-core
```

### Run a target for all projects

```bash
npx nx run-many -t <target> --all
npx nx run-many -t test --all
```

### Run only affected by your changes

```bash
npx nx affected -t build
npx nx affected -t test
npx nx affected -t lint
```

### Skip NX cache (useful when debugging)

```bash
npx nx build payment-service --skip-nx-cache
```

## Adding a New Library

Every library needs unit tests. Follow the setup in [unit-testing.md](unit-testing.md) and update the coverage table.

```bash
# Generate a new library
npx nx g @nx/js:lib libs/my-lib

# Add jest config, tsconfig.spec.json, etc.
# (see unit-testing.md for the full checklist)
```

## Architecture Quick Reference

### Service Layer Pattern

```typescript
// Apps use NestJS DI + TypeORM + outbox events
@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly repo: Repository<PaymentEntity>,
    private readonly outbox: OutboxService,
  ) {}

  async create(dto: CreatePaymentDto, ctx: RequestContext) {
    return this.dataSource.transaction(async (mgr) => {
      // 1. Save entity
      const payment = mgr.create(PaymentEntity, { ...dto });
      await mgr.save(payment);

      // 2. Write outbox event (not direct emit)
      await this.outbox.write(
        mgr,
        PaymentCreatedEvent.EVENT_NAME,
        payment.id,
        payment,
        ctx,
      );

      return payment;
    });
  }
}
```

### Domain Events

Cross-domain communication uses `DomainEvent` + outbox pattern. Never import another domain's service directly.

```typescript
// libs/event-bus/src/events/payment.events.ts
export class PaymentCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'payment.created';
  // ...
}
```

### Workflow Engine

All financial mutations require **Maker → Checker → Authorizer** workflow stages.

### Multi-Tenancy

Every entity extends `AuditableEntity` and carries `tenantId`, `companyId`, `branchId`.

## Troubleshooting

### "Cannot find configuration for task X:target"

```bash
# Check available targets
npx nx show project <project> --json | jq '.targets | keys'
```

### "The workspace is out of sync"

```bash
npx nx sync
npx nx reset    # if sync doesn't fix stale cache
```

### ESLint errors on `erp-frontend`

The frontend uses **ESLint flat config** (`eslint.config.mjs` at workspace root). Do not use `--ext` or `--ignore-path` flags.

If you see `no-unassigned-vars` errors, the frontend may be resolving an old ESLint v8 from a stale `node_modules`. Run:

```bash
rm -rf node_modules apps/node_modules apps/erp-frontend/node_modules package-lock.json
npm install
```

### TypeScript project reference errors

```bash
npx nx sync
```

### Database connection errors

1. Ensure `npm run dev:infra` is running.
2. Check `.env` database credentials match `docker-compose.yml`.
3. Verify PostgreSQL is reachable: `docker exec -it erp-postgres psql -U <user> -d <db>`

### Redis / BullMQ errors

Ensure Redis is running:

```bash
docker compose ps redis
redis-cli ping   # should return PONG
```

### NestJS decorator errors in tests

Tests use `@swc/jest` with `legacyDecorator: true` and `decoratorMetadata: true`. If you see `Cannot access 'X' before initialization` with TypeORM entities, wrap related types in `Relation<T>`:

```typescript
import type { Relation } from 'typeorm';

@ManyToOne(() => Role, (r) => r.permissions)
role!: Relation<Role>;   // not `role!: Role`
```

## IDE Setup

### VS Code

Recommended extensions:

- **Nx Console** — run targets, view project graph
- **ESLint** — lint on save (respects `eslint.config.mjs`)
- **Prettier** — format on save
- **Volar** — Vue 3 support (for frontend work)

### Useful commands

```bash
# Format everything
npx nx format:write --all

# Check formatting
npx nx format:check --all

# View project dependencies
npx nx graph --print | jq '.graph.dependencies["payment-service"]'
```

## Useful Resources

- [Nx Documentation](https://nx.dev)
- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Unit Testing Guide](unit-testing.md)
- [Architecture & Standards](../SKILL.md)
