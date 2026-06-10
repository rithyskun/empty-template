# ERP Financial Platform

Enterprise Resource Planning (ERP) financial platform built as an Nx monorepo with NestJS microservices, Vue.js frontend, and PostgreSQL.

## Tech Stack

- **Monorepo:** [Nx](https://nx.dev) 22.7.5 with npm workspaces
- **Backend:** NestJS 11, TypeORM, PostgreSQL, Redis, BullMQ
- **Frontend:** Vue.js 3, Vite, TailwindCSS, Pinia
- **Observability:** OpenTelemetry, Prometheus
- **Testing:** Jest 30, `@swc/jest`
- **Build:** Webpack (services), Vite (frontend)

## Project Structure

```
apps/                         # Microservices & applications
├── api-gateway/              # API Gateway (entry point, routing)
├── auth-service/             # Authentication (login, MFA, tokens)
├── identity-service/         # Identity (users, roles, permissions)
├── workflow-service/         # Workflow engine (Maker → Checker → Authorizer)
├── payment-service/          # Payment request lifecycle
├── settlement-service/       # Settlement batches & scheduling
├── reconciliation-service/  # Bank reconciliation & matching
├── advance-service/          # Salary advance requests
├── audit-log-service/        # Centralized audit logging
├── report-service/           # Cross-domain reporting
├── scheduler-service/        # Cron jobs & recurring tasks
├── notification-service/    # Email, SMS, push notifications
├── notification-worker/      # BullMQ: notification processing
├── payment-worker/           # BullMQ: payment execution
├── settlement-worker/        # BullMQ: settlement processing
└── erp-frontend/             # Vue.js admin dashboard

libs/                         # Shared libraries
├── auth/                     # JWT strategy, guards, decorators
├── cache/                    # Redis config & cache service
├── common/                   # Base entity, pagination, exceptions
├── constants/                # Platform constants & queue names
├── database/                 # TypeORM config & migrations
├── enums/                    # All platform enums
├── event-bus/                # Domain events & outbox pattern
├── mail/                     # Mail service & queue processors
├── security/                 # Security utilities
├── telemetry/                # OpenTelemetry setup
├── audit-core/               # Audit log domain types
├── identity-core/            # Identity domain (users, roles)
├── payment-core/             # Payment domain types & adapters
├── settlement-core/          # Settlement calculation engine
├── advance-core/             # Advance eligibility & recovery
├── reconciliation-core/      # Match algorithms
├── workflow-core/            # State machine & stage definitions
├── notification-core/       # Notification templates
├── multi-tenancy/            # Tenant isolation helpers
└── ...
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose

### Install dependencies

```bash
npm install
```

### Start infrastructure

```bash
npm run dev:infra   # postgres + redis
```

### Run all core services

```bash
npm run dev:core    # gateway, identity, auth, payment, settlement, audit
```

### Run individual services

```bash
npx nx serve <service-name>
# e.g. npx nx serve payment-service
```

### Run the frontend

```bash
npx nx serve erp-frontend
```

## Available Scripts

| Script                | Description                                      |
| --------------------- | ------------------------------------------------ |
| `npm run dev`         | Gateway + identity + auth + payment + settlement |
| `npm run dev:all`     | All services + workers                           |
| `npm run dev:core`    | Core services only                               |
| `npm run dev:workers` | BullMQ workers only                              |
| `npm run dev:infra`   | Docker compose up postgres + redis               |
| `npm run build`       | Build all projects                               |
| `npm run test`        | Test all projects                                |
| `npm run lint`        | Lint all projects                                |
| `npm run typecheck`   | TypeScript type-check                            |

## Nx Commands

```bash
# List all projects
npx nx show projects

# Build a specific project
npx nx build payment-service

# Test a specific project
npx nx test mail

# Run lint on everything
npx nx run-many -t lint --all

# Check affected projects
npx nx affected -t build

# View project graph
npx nx graph

# Sync TypeScript project references
npx nx sync
```

## Architecture

- **Event-Driven:** Cross-domain communication via `DomainEvent` + outbox pattern
- **Workflow Engine:** Every financial mutation goes through Maker → Checker → Authorizer
- **Multi-Tenant:** All entities carry `tenantId`, `companyId`, `branchId`
- **Financial Integrity:** Double-entry accounting, idempotency keys, soft deletes only
- **Queue Processing:** BullMQ workers for async payment, settlement, and notification jobs

## Documentation

- [Unit Testing Guide](docs/unit-testing.md) — test setup, patterns, and coverage status
- [Architecture & Standards](SKILL.md) — full platform architecture, DDD, CQRS, event design

## Contributing

- Every `libs/*` project must have unit tests. See [docs/unit-testing.md](docs/unit-testing.md).
- Follow the [Nx conventions](https://nx.dev) for generators and task running.
- Never bypass the workflow engine for financial mutations.

---

_This project uses [Nx](https://nx.dev) for monorepo management._
