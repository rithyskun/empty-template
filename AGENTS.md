<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

## Unit Testing

- **Every `libs/*` project must have unit tests.** When you add or modify a
  service/util in a library, add or update its `*.spec.ts` in the same change.
- The full standard, per-lib setup recipe, and authoring patterns live in
  [`docs/unit-testing.md`](docs/unit-testing.md). Read it before adding tests to a
  library that doesn't have them yet, and update its coverage table when a lib
  gains tests.
- Stack: Jest 30 + `@swc/jest`, run via the `@nx/jest` inferred target. Run with
  `npx nx test <project>`, `npx nx affected -t test`, or
  `npx nx run-many -t test --all`.
- Tests are colocated as `*.spec.ts`. Prefer instantiating classes directly with
  mocked collaborators over full `@nestjs/testing` DI wiring.
- Never delete or weaken tests to make a build pass — fix the root cause.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## API Gateway

The `apps/api-gateway` project is a NestJS-based reverse proxy with the following architecture:

### Middleware Pipeline

**All routes:**

1. **`CorrelationMiddleware`** — generates `X-Correlation-Id` and `X-Request-Id` on every request, propagating `X-Correlation-Id` to downstream services.

**External routes (`/api/v1/*`):** 2. **`RateLimitMiddleware`** — Redis-backed rate limiting using `ioredis` (db 1). Keys: `ratelimit:{tier}:{identifier}` where identifier is `user:{userId}` for authenticated requests or `ip:{ip}` otherwise. Tiers: `auth`, `payment`, `write`, `read`, `bulk`. 3. **`GatewayMiddleware`** — JWT/public auth then delegates to `ProxyService` for actual proxying. Verifies JWT via `@erp/auth` for protected routes, skips auth for public routes. `ProxyService` manages per-service circuit breaker state (`CLOSED → OPEN → HALF_OPEN → CLOSED`), trips after 5 consecutive `5xx` errors, recovers after 30s cooldown.

**Internal routes (`/internal/v1/*`):** 2. **`InternalAuthMiddleware`** — verifies `X-Internal-Service-Token` or `Authorization: Bearer {INTERNAL_SERVICE_TOKEN}`. Sets `X-Internal-Service` header. 3. **`InternalRateLimitMiddleware`** — Redis-backed rate limiting with a 1,000 req/min ceiling per calling service (`ratelimit:internal:{service}`). 4. **`GatewayMiddleware`** — delegates to `ProxyService` for actual proxying. Per-service circuit breaker applies here too.

### Service Proxy Layer

The `ProxyService` (`apps/api-gateway/src/app/services/proxy.service.ts`) is the dedicated service proxy layer that sits between the middleware pipeline and downstream services. It:

- Creates and manages `http-proxy-middleware` instances for every route in `ALL_ROUTES`
- Tracks per-service circuit breaker state (`CLOSED → OPEN → HALF_OPEN → CLOSED`)
- Injects `X-User-*`, `X-Internal-Service`, and `X-Correlation-Id` headers into proxied requests
- Records proxy response status codes to update circuit breaker state
- Strips `x-powered-by` from downstream responses

### Route Registry

- **External routes** (`/api/v1/*`) — authenticated via JWT (`@erp/auth` `verifyToken`), forwarded to downstream microservices.
- **Internal routes** (`/internal/v1/*`) — authenticated via `X-Internal-Service-Token` or `Authorization: Bearer {INTERNAL_SERVICE_TOKEN}`. Used for service-to-service calls.
- Auth endpoints (`/api/v1/auth`) route to `AUTH_SERVICE_URL` (`:8001`), not identity-service.

### Health Check

`GET /health` on the gateway performs quick TCP checks against all registered downstream services and returns a map of `up`/`down` statuses.

### Traffic Flow

```
┌─────────────┐   ┌──────────────────────────────────────────────────────────┐   ┌──────────────────────┐
│   Client    │──▶│  API Gateway (:8000)                                     │──▶│  Downstream Services │
│  (Vue.js)   │   │  ┌──────────────────────────────────────────────────┐  │   │  auth-service (:8001)│
└─────────────┘   │  │ CorrelationMiddleware                              │  │   │  identity (:8002)  │
                  │  │   ↓ generate X-Correlation-Id + X-Request-Id       │  │   │  workflow (:8003)  │
                  │  ├──────────────────────────────────────────────────┤  │   │  notifications       │
                  │  │ External: /api/v1/*                                │  │   │  payments (:8005)  │
                  │  │   RateLimitMiddleware (Redis db 1)               │  │   │  settlements (:8006) │
                  │  │     ↓ ratelimit:{tier}:{user|ip}                  │  │   │  reconciliation (:8008)│
                  │  │   GatewayMiddleware                                │  │   │  advances (:8010)    │
                  │  │     ├─ JWT verify → inject headers               │  │   │  reports (:8017)     │
                  │  │     ├─ public skip auth                          │  │   │  scheduler (:8018)   │
                  │  │     └─ per-service circuit breaker               │  │   │  audit-logs (:8021) │
                  │  ├──────────────────────────────────────────────────┤  │   └──────────────────────┘
                  │  │ Internal: /internal/v1/*                           │  │
                  │  │   InternalAuthMiddleware                           │  │
                  │  │     ↓ verify service token                       │  │
                  │  │   InternalRateLimitMiddleware (1k/min)           │  │
                  │  │     ↓ ratelimit:internal:{service}                │  │
                  │  │   GatewayMiddleware                                │  │
                  │  │     ↓ proxy + per-service circuit breaker        │  │
                  │  └──────────────────────────────────────────────────┘  │
                  └──────────────────────────────────────────────────────────┘
```

### Design Rules

- All route targets come from `ALL_ROUTES` in `@erp/constants`.
- Never add ad-hoc proxy middlewares; extend the route registry instead.
- Rate limits must remain Redis-backed (not in-memory) to support horizontal scaling.
- Circuit breaker state is currently per-instance in-memory (sufficient for single-node deployments; consider Redis-backed state if clustering).

## Downstream Service Communication

Services communicate through three primary patterns:

### 1. Synchronous: API Gateway Internal Routes

Service-to-service calls go through the gateway's `/internal/v1/*` endpoints. This ensures consistent auth, rate limiting, and circuit breaker protection.

```
payment-service ──▶ POST /internal/v1/settlements/batch
                    (X-Internal-Service-Token)
                          │
                          ▼
                    API Gateway
                  InternalAuthMiddleware
                  InternalRateLimitMiddleware
                          │
                          ▼
                  settlement-service (:8006)
```

### 2. Asynchronous: BullMQ Job Queues

Services enqueue jobs to Redis-backed queues for durable, retryable work. Dedicated worker processes consume these queues.

**Queue types:**

- `Queues.AUDIT_LOG` — audit record persistence (`audit-log-service` worker)
- `Queues.PAYMENT_EXECUTE` / `Queues.PAYMENT_RETRY` — payment execution (`payment-worker`)
- `Queues.SETTLEMENT_PROCESS` / `Queues.SETTLEMENT_RETRY` — settlement batching (`settlement-worker`)
- `Queues.NOTIFICATION_SEND` — email/SMS/push delivery (`notification-worker`)
- `Queues.JOURNAL_POSTING` — accounting journal entries
- `Queues.RECONCILIATION_RUN` — auto-matching and exception processing
- `Queues.OUTBOX_RELAY` — transactional outbox pattern relay
- `Queues.DEAD_LETTER` — failed job archival

```
payment-service ──▶ Queue.add('execute-payment', { ... })
                          │
                          ▼
                     Redis (BullMQ)
                          │
                          ▼
                  payment-worker ──▶ process(job)
```

### 3. In-Process: Event Emitter

`@erp/event-bus` wraps `@nestjs/event-emitter` for loose coupling within a single service (not cross-service). Events extend `PlatformEvent` with `eventId`, `timestamp`, `traceId`, and `senderService`.

### Preferred Patterns by Use Case

| Use Case                       | Pattern                 | Reason                             |
| ------------------------------ | ----------------------- | ---------------------------------- |
| Read another service's data    | Synchronous via gateway | Immediate consistency              |
| Fire-and-forget side effects   | Async queue             | Durability, retry, decoupling      |
| Cross-service write operations | Async queue             | Avoid distributed transactions     |
| Audit logging                  | Async queue             | Non-blocking, bulk insert support  |
| Same-service decoupling        | In-process events       | Loose coupling without network hop |

## High-Traffic Scaling

When traffic grows, scale along these axes:

### 1. Horizontal Pod Autoscaling (HPA)

Run multiple gateway instances behind a load balancer. The gateway is **stateless** — all shared state lives in Redis (rate limits) or downstream services. JWT verification is stateless.

```
         ┌─▶ gateway-pod-1
LB ──────┼─▶ gateway-pod-2  (all share Redis for rate limits)
         └─▶ gateway-pod-3
```

### 2. Connection Reuse (Already Implemented)

`ProxyService` uses `keepAlive` HTTP agents with configurable `maxSockets` (`PROXY_MAX_SOCKETS`, default 100). This avoids TCP handshake overhead on every downstream request.

### 3. Response Compression (Already Implemented)

`compression()` middleware in `main.ts` gzip-compresses JSON responses > 1KB, reducing bandwidth by ~60-80%.

### 4. Circuit Breaker State Sharing

Current CB state is **per-instance in-memory**. For HPA with >3 pods, consider moving CB state to Redis:

```
redis.hincrby('cb:failures', service, 1)
redis.expire('cb:failures', 30)
```

This prevents one healthy pod from sending traffic to a failing downstream while another pod has already tripped the breaker.

### 5. Read-Heavy Route Caching

For GET endpoints that don't change frequently (e.g., `/api/v1/reports/status`, tenant configs), add a short-lived Redis cache in `GatewayMiddleware`:

```typescript
// Cache GET /api/v1/reports/* for 10s
if (req.method === 'GET' && req.path.startsWith('/api/v1/reports')) {
  const cached = await redis.get(`cache:${req.path}`);
  if (cached) return res.json(JSON.parse(cached));
}
```

### 6. Body Parser Limits

`json({ limit: '1mb' })` prevents oversized payloads from exhausting memory. Adjust via `BODY_PARSER_LIMIT` env var.

### 7. Proxy Timeout

`PROXY_TIMEOUT_MS` (default 30s) prevents hung downstream requests from holding gateway connections indefinitely.

### 8. Separate Ingress for Internal vs External

Internal service-to-service traffic should bypass the public load balancer to avoid:

- TLS termination overhead
- Public IP routing latency
- WAF/DoS inspection

Use a private K8s Service or internal ALB for `/internal/v1/*`.

## Identity Service RBAC

The Identity Service (`apps/identity-service`) is the authority for users, roles, and permissions. It exposes both role-based and fine-grained permission-based authorization primitives.

### Data Model

| Entity         | Description                                                                   |
| -------------- | ----------------------------------------------------------------------------- |
| **User**       | Platform user with email, password hash, tenant/company/branch scoping        |
| **Role**       | Named role with a unique code (e.g., `SUPER_ADMIN`, `TENANT_ADMIN`)           |
| **Permission** | Resource-action grant scoped to a role (`users:read`, `payments:write`)       |
| **UserRole**   | Many-to-many join between users and roles with tenant and assignment metadata |

Relationships:

- `Role` has many `Permission`
- `User` has many `UserRole` → `Role`
- A user's effective permissions = the union of all permissions across all assigned roles

### Core Services (`libs/identity-core`)

- **`UserService`** — password hashing, CRUD, user lookup by email
- **`RoleService`** — role CRUD, permission creation during role creation, user-role assignment/unassignment
- **`PermissionService`** — permission CRUD, bulk role-permission management (`setRolePermissions`), user-level permission resolution (`getUserPermissions`, `hasPermission`)

### Auth Library (`@erp/auth`)

Guards and decorators used across all services:

| Guard / Decorator         | Purpose                                                             |
| ------------------------- | ------------------------------------------------------------------- |
| `JwtAuthGuard`            | Validates Bearer JWT via passport-jwt                               |
| `RolesGuard`              | Checks `user.roles` against `@Roles(...)`                           |
| `PermissionsGuard`        | Checks `user.permissions` against `@Permissions('resource:action')` |
| `@Roles(PlatformRole...)` | Role-level access control                                           |
| `@Permissions(string...)` | Fine-grained resource-action access control                         |
| `@Public()`               | Skips all auth guards                                               |

Guard precedence (typical route stack):

```
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
```

### JWT Payload

The access token issued by `AuthController` includes both roles and permissions:

```json
{
  "userId": "...",
  "tenantId": "...",
  "roles": ["ADMIN"],
  "permissions": ["users:read", "users:write", "payments:read"]
}
```

Permissions are resolved at login, refresh, 2FA verify, and SSO callback by calling `PermissionService.getUserPermissions(userId)`. This keeps the token self-contained so downstream services can verify access without calling the identity service on every request.

### Permission Resolution

```
getUserPermissions(userId)
  └─ find all UserRole rows for user
     └─ find all Permission rows for those roleIds
        └─ deduplicate into "resource:action" strings
```

`hasPermission(userId, resource, action)` returns `true` if the user has:

- the exact `resource:action` permission, or
- the `all:all` wildcard

### API Endpoints (Identity Service)

| Method   | Endpoint                    | Auth   | Purpose                                            |
| -------- | --------------------------- | ------ | -------------------------------------------------- |
| `POST`   | `/auth/login`               | Public | Issues JWT with roles + permissions                |
| `POST`   | `/auth/refresh`             | Public | Refreshes token with current roles + permissions   |
| `POST`   | `/auth/2fa/verify`          | Public | Completes 2FA and issues token                     |
| `POST`   | `/auth/sso/callback`        | Public | JIT-provisions SSO user and issues token           |
| `GET`    | `/permissions`              | Roles  | List permissions (paginated, filterable by roleId) |
| `GET`    | `/permissions/role/:roleId` | Roles  | Get all permissions for a role                     |
| `GET`    | `/permissions/user/:userId` | Roles  | Get all permissions for a user                     |
| `POST`   | `/permissions`              | Roles  | Create a single permission                         |
| `PATCH`  | `/permissions/:id`          | Roles  | Update a permission                                |
| `DELETE` | `/permissions/:id`          | Roles  | Delete a permission                                |
| `POST`   | `/permissions/role`         | Roles  | Bulk replace a role's permissions                  |

### Wildcard and Super Admin

- The `PermissionsGuard` automatically grants access if `user.roles` contains `SUPER_ADMIN`
- The `all:all` permission string acts as a global wildcard in `hasPermission`

### User Provisioning & Approval Workflow

When LDAP/AD or SSO users first access the platform, they are provisioned via Just-In-Time (JIT) creation with `status: PENDING`. An administrator must approve them before they can log in.

**User statuses:**

| Status     | Description                                                                 |
| ---------- | --------------------------------------------------------------------------- |
| `PENDING`  | Newly provisioned (LDAP/AD or SSO), awaiting admin approval. Cannot log in. |
| `ACTIVE`   | Approved and fully operational. Can log in and access resources.            |
| `INACTIVE` | Manually deactivated (e.g., leave of absence). Cannot log in.               |
| `REJECTED` | Admin explicitly rejected the provisioning request. Cannot log in.          |

**Flow:**

```
LDAP/AD Auth Success
      │
      ▼
User exists? ──No──▶ JIT Create User (status = PENDING)
      │
     Yes
      │
      ▼
Check status
      │
   PENDING ──▶ 403: "Your account is pending approval"
   REJECTED ──▶ 403: "Your account has been rejected"
   ACTIVE ──▶ Continue to role/permission resolution → issue JWT
```

**Approval API:**

| Method | Endpoint             | Auth                       | Purpose                   |
| ------ | -------------------- | -------------------------- | ------------------------- |
| `POST` | `/users/:id/approve` | SUPER_ADMIN / TENANT_ADMIN | Promotes PENDING → ACTIVE |
| `POST` | `/users/:id/reject`  | SUPER_ADMIN / TENANT_ADMIN | Sets PENDING → REJECTED   |

### Active Directory Integration

The `ActiveDirectoryUser` entity (`libs/identity-core/src/lib/entities/active-directory-user.entity.ts`) captures AD-specific metadata every time a user authenticates via LDAP/AD.

| Column           | Description                                                             |
| ---------------- | ----------------------------------------------------------------------- |
| `userId`         | FK to `users` table                                                     |
| `adObjectId`     | AD objectGUID or objectSid                                              |
| `dn`             | Full LDAP distinguished name (e.g., `CN=John,OU=Users,DC=erp,DC=local`) |
| `sAMAccountName` | AD sAMAccountName                                                       |
| `domain`         | Extracted AD domain (e.g., `erp.local`)                                 |
| `firstSeenAt`    | Timestamp of first successful AD login to our system                    |
| `lastSyncedAt`   | Timestamp of most recent AD sync / login                                |
| `adAttributes`   | Raw AD entry attributes (JSONB, excludes passwords)                     |

**Service:** `ActiveDirectoryUserService.recordFirstSeen()` upserts the row on every LDAP login:

- If the user has no AD record yet → creates with `firstSeenAt = now`
- If the user already has an AD record → updates `lastSyncedAt` and merges `adAttributes`

**LDAP Service (`@erp/auth` `LdapService`):**
The `authenticate()` method now returns extended `LdapUserResult` including:

- `adObjectId` (from `objectGUID` / `objectSid`)
- `dn` (distinguished name from AD entry)
- `sAMAccountName`
- `domain` (extracted from DN via `extractDomain()`)
- `adAttributes` (raw AD entry, password fields stripped)

## Database Schema

All DDL is centralized in `libs/database/sql/` and executed in numbered order via `migrate.sh`.

### Schema files

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

### Running migrations

```bash
cd libs/database/sql
./migrate.sh                    # auto-loads DB_* from .env in project root
```

URL resolution priority:

1. CLI argument
2. `DATABASE_URL` env var
3. Constructed from `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
4. Loaded from `.env` file at project root

### Adding a new entity (workflow)

When creating a new TypeORM entity, **always** create the matching SQL in `libs/database/sql/`:

1. Add the table DDL to the appropriate numbered file (or create a new `009_*.sql` if it is a new module)
2. Add indexes and foreign keys
3. Register the new file in `migrate.sh` (`FILES` array)
4. If you need new enums, add them to `001_base_schema.sql`

**TypeORM column type rules:**

| Column Type       | Supports `length`?            | Example                                                 |
| ----------------- | ----------------------------- | ------------------------------------------------------- |
| `uuid`            | **NO**                        | `@Column({ type: 'uuid' })` — never add `length`        |
| `varchar`         | YES                           | `@Column({ type: 'varchar', length: 255 })`             |
| `text`            | NO                            | `@Column({ type: 'text' })`                             |
| `decimal`         | NO (use `precision`, `scale`) | `@Column({ type: 'decimal', precision: 18, scale: 2 })` |
| `timestamptz`     | NO                            | `@Column({ type: 'timestamptz' })`                      |
| `jsonb`           | NO                            | `@Column({ type: 'jsonb' })`                            |
| `boolean`         | NO                            | `@Column({ default: false })`                           |
| `int` / `integer` | NO                            | `@Column({ default: 0 })`                               |

> **Common pitfall:** `uuid` columns with `length: 36` will throw `Column userId of Entity X does not support length property.` at runtime. Use `type: 'uuid'` without `length`.

Never put SQL inside individual `libs/*/sql/` folders. All DDL is owned by `libs/database/sql/`.

### Multi-Database Support (`libs/database`)

`DatabaseModule` supports PostgreSQL, MSSQL, MySQL, and MariaDB. It also supports read replicas and external connections.

**Environment variables:**

| Variable       | Default         | Description                               |
| -------------- | --------------- | ----------------------------------------- |
| `DB_TYPE`      | `postgres`      | `postgres`, `mssql`, `mysql`, `mariadb`   |
| `DB_HOST`      | `localhost`     | Master host                               |
| `DB_PORT`      | `5432`          | Master port (1433 for mssql)              |
| `DB_USERNAME`  | `postgres`      | Master username                           |
| `DB_PASSWORD`  | `postgres`      | Master password                           |
| `DB_DATABASE`  | `erp_financial` | Database name                             |
| `DB_REPLICAS`  | —               | Comma-separated `host:port` or JSON array |
| `DB_SSL`       | `false`         | Enable SSL/TLS                            |
| `DB_EXTERNAL`  | `false`         | External DB (extended timeouts)           |
| `DB_POOL_SIZE` | —               | Connection pool max size                  |
| `DB_TIMEOUT`   | —               | Connection timeout (ms)                   |

**Read replicas:**

```bash
# Comma-separated
DB_REPLICAS=192.168.1.10:5432,192.168.1.11:5432

# JSON array (overrides credentials per replica)
DB_REPLICAS=[{"host":"192.168.1.10","port":5432},{"host":"192.168.1.11","port":5432}]
```

When replicas are configured, TypeORM routes writes to the master and reads to the slaves automatically.

**External database (e.g., reporting, legacy):**

```typescript
// In a module that needs a separate connection
DatabaseModule.forExternal('reporting', {
  type: 'mssql',
  host: process.env.REPORT_DB_HOST,
  database: process.env.REPORT_DB_NAME,
  // entities must be provided explicitly
  entities: [ExternalReportEntity],
}),
```

`forExternal` disables `autoLoadEntities` and `synchronize` by default.

**Driver packages (install as needed):**

| DB Type    | Package   |
| ---------- | --------- |
| `postgres` | `pg`      |
| `mssql`    | `mssql`   |
| `mysql`    | `mysql2`  |
| `mariadb`  | `mariadb` |

### Testing

Unit tests for RBAC services live in `libs/identity-core/src/lib/services/`:

- `permission.service.spec.ts` — covers CRUD, `setRolePermissions`, `getUserPermissions`, `hasPermission`
- `role.service.spec.ts` — covers role CRUD, assignment, permission creation
- `user.service.spec.ts` — covers user CRUD, password hashing, role assignment

Unit tests for guards live in `libs/auth/src/lib/guards/`:

- `permissions.guard.spec.ts` — covers public bypass, exact match, wildcard, SUPER_ADMIN fallback, missing permissions

## Frontend Feature Structure

The `apps/erp-frontend` application is organized by **feature folders** under `apps/erp-frontend/features/`. Every feature must follow the same directory layout as `features/auth/`.

### Directory layout per feature

```
features/<feature-name>/
├── components/          # Feature-specific UI components
├── composables/         # Feature-specific Vue composables
├── stores/              # Pinia stores scoped to the feature
├── types/               # TypeScript interfaces and types
├── views/               # Page-level Vue components (routed views)
└── routes.ts            # Route definitions exported as <Feature>Routes[]
```

### Rules

1. **Page components live in `views/`** — never at the feature root. The route file imports them directly (`import UsersView from './views/UsersView.vue'`).
2. **Shared types go in `types/index.ts`** — each feature owns its list-item, form-data, and stats interfaces. Do not inline these inside `.vue` files.
3. **API logic goes in `composables/`** — create a `use<Feature>` composable that wraps `useFetchApi`. Keep `.vue` files thin.
4. **Pinia stores go in `stores/`** — minimal stores for selected-item state or cross-component shared refs.
5. **Route files are thin** — only import views and export a typed `RouteRecordRaw[]` array. No lazy-loading at the route level (views are imported directly).

### Example: `features/users/`

```typescript
// features/users/types/index.ts
export interface UserListItem { id: string; name: string; ... }
export interface UserStats { total: number; active: number; ... }

// features/users/composables/useUsers.ts
export function useUsers() {
  const api = useFetchApi()
  const users = ref<UserListItem[]>([])
  // ...fetch, pagination, computed
  return { api, users, isLoading, error, totalPages }
}

// features/users/stores/users.ts
export const useUsersStore = defineStore('users', () => {
  const selectedUser = ref<UserListItem | null>(null)
  return { selectedUser, setSelectedUser }
})

// features/users/views/UsersView.vue
<script setup lang="ts">
import type { UserListItem } from '../types'
// ...template only, logic delegated to composable/store
</script>

// features/users/routes.ts
import type { RouteRecordRaw } from 'vue-router'
import UsersView from './views/UsersView.vue'
export const userRoutes: RouteRecordRaw[] = [
  { path: '/users', name: 'users', component: UsersView, meta: { requiresAuth: true } },
]
```
