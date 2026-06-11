# Permissions, Roles & Users — Full Implementation Checklist

> Created after auditing frontend (`apps/erp-frontend/features/{permissions,roles,users}`) and backend (`apps/identity-service`, `libs/identity-core`).

---

## Phase 1 — API Path & Gateway Alignment

- [ ] **1.1 Fix frontend API base paths**
  - `useFetchApi` calls `/permissions`, `/roles`, `/users` directly
  - Gateway only proxies `/api/v1/identity/*` to identity-service
  - **Fix:** Update all frontend composables/views to call `/api/v1/identity/permissions`, `/api/v1/identity/roles`, `/api/v1/identity/users`
  - **Alternative:** Add dedicated gateway routes for `/permissions`, `/roles`, `/users` → identity-service (not recommended, breaks prefix convention)

- [ ] **1.2 Verify gateway path rewrite**
  - Confirm `/api/v1/identity/permissions` strips prefix and forwards `/permissions` to identity-service `:8002`
  - Test end-to-end with a working endpoint (e.g. `GET /api/v1/identity/roles`)

---

## Phase 2 — Backend Data Model Alignment (CRITICAL)

> The frontend assumes **standalone global permissions** (`name`, `slug`, `module`, `action`, `description`) that can be assigned to many roles.  
> The backend currently stores **role-scoped permissions** (`roleId`, `resource`, `action`) — each row belongs to exactly one role.

### 2.1 Permission Entity Refactor

- [ ] **2.1.1 Add `PermissionDefinition` entity** (or rename/refactor `Permission`)
  - Fields: `id`, `name`, `slug`, `module`, `action`, `description`, `tenantId`, `isSystem`, `createdAt`, `updatedAt`
  - `slug` format: `{module}:{action}` (e.g. `users:create`)
- [ ] **2.1.2 Add `RolePermission` join table** (many-to-many)
  - Fields: `roleId`, `permissionId`
- [ ] **2.1.3 Decide migration strategy**
  - Option A: Drop-recreate `permissions` table (acceptable if no production data)
  - Option B: Migration script that extracts unique `resource:action` pairs into new `PermissionDefinition` table, then populates `RolePermission` join table
- [ ] **2.1.4 Update DTOs**
  - `CreatePermissionDto`: `name`, `slug`, `module`, `action`, `description`, `tenantId?`
  - `UpdatePermissionDto`: same fields optional
  - `PermissionResponseDto`: `id`, `name`, `slug`, `module`, `action`, `description`, `rolesCount?`, `tenantId?`, `createdAt`, `updatedAt`
  - `SetRolePermissionsDto`: `roleId`, `permissionIds: string[]`

### 2.2 Role Entity Refactor

- [ ] **2.2.1 Add missing fields to `Role` entity**
  - `slug` (or alias `code` → `slug` in API response)
  - `isActive` (boolean, default `true`)
- [ ] **2.2.2 Update DTOs**
  - `CreateRoleDto`: add `slug`, `isActive?`, `permissionIds?: string[]`
  - `UpdateRoleDto`: add `slug?`, `isActive?`, `permissionIds?: string[]`
  - `RoleResponseDto`: include `slug`, `isActive`, `permissions` (full objects or IDs), `userCount?`

### 2.3 User Entity / DTO Refactor

- [ ] **2.3.1 Add `avatar` field to `User` entity** (optional string, nullable)
- [ ] **2.3.2 Update `UserResponseDto`**
  - Include `roleId` (primary role id) and `role` object `{ id, name, slug }`
  - Frontend currently expects single role per user
- [ ] **2.3.3 Add missing DTOs**
  - `ResetPasswordDto`: `newPassword`, `confirmPassword`

---

## Phase 3 — Backend Service Layer

### 3.1 Permission Service (`libs/identity-core`)

- [ ] **3.1.1 Rewrite `PermissionService` for standalone permissions**
  - `create(dto)` → create global permission definition
  - `update(id, dto)` → update global permission
  - `delete(id)` → delete global permission (cascade delete from `RolePermission`)
  - `list({ tenantId, page, limit, search?, module? })` → paginated list with optional search by name/slug/module
  - `findById(id)` → single permission with `rolesCount`
  - `getRolePermissions(roleId)` → return permission definitions linked to role
  - `setRolePermissions(roleId, permissionIds[])` → replace all role-permission links
  - `getUserPermissions(userId)` → return unique slugs from all user's roles
  - `hasPermission(userId, resource, action)` → unchanged logic
- [ ] **3.1.2 Add `getPermissionStats()`**
  - Returns: `{ total, system, user, role, unused }`
- [ ] **3.1.3 Add `getPermissionUsage()`**
  - Returns: array of `{ permission, roleCount }` for each permission

### 3.2 Role Service (`libs/identity-core`)

- [ ] **3.2.1 Update `RoleService`**
  - `create(dto)` → support `slug`, `isActive`, `permissionIds`
  - `update(id, dto)` → support `slug`, `isActive`, `permissionIds`
  - `list({ tenantId, page, limit, search?, isActive? })` → add search & filter
  - `findById(id)` → include permissions and userCount
  - `delete(id)` → soft delete (already done), cascade remove `RolePermission` links
- [ ] **3.2.2 Add `getRoleStats()`**
  - Returns: `{ total, active, inactive, withPermissions }`
- [ ] **3.2.3 Add `toggleRoleActive(id, isActive)`**

### 3.3 User Service (`libs/identity-core`)

- [ ] **3.3.1 Update `UserService`**
  - `create(dto)` → support `avatar`, `roleId` (assign primary role)
  - `update(id, dto)` → support `avatar`, `roleId`
  - `list({ tenantId, page, limit, search?, status? })` → add search & filter
  - `findById(id)` → include primary role info
- [ ] **3.3.2 Add missing action methods**
  - `activateUser(id)` → status = `ACTIVE`, `isActive = true`
  - `deactivateUser(id)` → status = `INACTIVE`, `isActive = false`
  - `suspendUser(id)` → status = `SUSPENDED`, `isActive = false`
  - `resetPassword(id, newPassword)` → hash and update `passwordHash`
- [ ] **3.3.3 Add `getUserStats()`**
  - Returns: `{ total, active, inactive, pending, suspended, locked }`

---

## Phase 4 — Backend Controllers

### 4.1 Permissions Controller (`apps/identity-service`)

- [ ] **4.1.1 Update existing endpoints** to use new DTOs/service signatures
- [ ] **4.1.2 Add `GET /permissions/stats`** → `getPermissionStats()`
- [ ] **4.1.3 Add `GET /permissions/usage`** → `getPermissionUsage()`
- [ ] **4.1.4 Add query param support to `GET /permissions`**
  - `search` (name/slug/module), `module`, `page`, `limit`

### 4.2 Roles Controller (`apps/identity-service`)

- [ ] **4.2.1 Update existing endpoints** to use new DTOs/service signatures
- [ ] **4.2.2 Add `GET /roles/stats`** → `getRoleStats()`
- [ ] **4.2.3 Add `GET /roles/active`** → list only `isActive = true` roles
- [ ] **4.2.4 Add query param support to `GET /roles`**
  - `search`, `isActive`, `page`, `limit`

### 4.3 Users Controller (`apps/identity-service`)

- [ ] **4.3.1 Update existing endpoints** to use new DTOs/service signatures
- [ ] **4.3.2 Add `GET /users/stats`** → `getUserStats()`
- [ ] **4.3.3 Add `POST /users/:id/activate`** → `activateUser(id)`
- [ ] **4.3.4 Add `POST /users/:id/deactivate`** → `deactivateUser(id)`
- [ ] **4.3.5 Add `POST /users/:id/suspend`** → `suspendUser(id)`
- [ ] **4.3.6 Add `POST /users/:id/reset-password`** → `resetPassword(id, dto)`
- [ ] **4.3.7 Add query param support to `GET /users`**
  - `search`, `status`, `page`, `limit`

---

## Phase 5 — Frontend Updates

### 5.1 API Path Fixes

- [ ] **5.1.1 Update `useFetchApi` callers** in all three features
  - Change `/permissions` → `/api/v1/identity/permissions`
  - Change `/roles` → `/api/v1/identity/roles`
  - Change `/users` → `/api/v1/identity/users`

### 5.2 Type Alignment

- [ ] **5.2.1 Update `@features/auth/types` `Permission` interface**
  - Match backend `PermissionResponseDto` after refactor
- [ ] **5.2.2 Update `@features/auth/types` `Role` interface**
  - Add `slug`, `isActive`, `userCount`
- [ ] **5.2.3 Update `@features/auth/types` `ApiUser` interface**
  - Add `avatar`, `roleId`, ensure `role` shape matches

### 5.3 View Logic Updates

- [ ] **5.3.1 `PermissionsView.vue`**
  - Verify create/edit form fields map to new DTO (`name`, `slug`, `module`, `action`, `description`)
  - Ensure `slug` auto-generation from `module:action` if needed
  - Update `transformApiPermission` to match new response shape
- [ ] **5.3.2 `RolesView.vue`**
  - Verify `slug` ↔ `code` mapping is no longer needed (backend now returns `slug`)
  - Verify `isActive` toggle works with backend `PATCH /roles/:id`
  - Update permission picker to use new `permissionIds` array on role create/update
- [ ] **5.3.3 `UsersView.vue`**
  - Verify `roleId` select works with `GET /api/v1/identity/roles/active`
  - Verify status actions (activate, deactivate, suspend) call correct endpoints
  - Verify reset-password modal calls correct endpoint

---

## Phase 6 — Unit Tests

- [ ] **6.1 Backend tests**
  - `PermissionService` — CRUD, role assignment, stats
  - `RoleService` — CRUD, toggle active, stats
  - `UserService` — CRUD, status transitions, password reset, stats
- [ ] **6.2 Controller tests**
  - Identity-service controllers for permissions, roles, users
- [ ] **6.3 Frontend tests**
  - Composables: `usePermissions`, `useRoles`, `useUsers`
  - Views: basic mount/render tests

---

## Phase 7 — Integration & Verification

- [ ] **7.1 Run backend build & tests**
  - `npx nx build identity-service`
  - `npx nx test identity-service`
- [ ] **7.2 Run frontend build & lint**
  - `npx nx build erp-frontend`
  - `npx nx lint erp-frontend`
- [ ] **7.3 End-to-end smoke test**
  - Start identity-service, API gateway, frontend
  - Login → navigate to Administration → Permissions/Roles/Users
  - CRUD operations on each module
  - Verify stats cards update correctly

---

## Summary of Key Architectural Decisions Needed

| Decision               | Current State                                | Target State                                                                                          |
| ---------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Permission model       | Role-scoped (`roleId`, `resource`, `action`) | Global definitions (`name`, `slug`, `module`, `action`, `description`) with many-to-many role links   |
| Role primary key field | `code`                                       | `slug` (add new field or alias)                                                                       |
| Role status            | No `isActive`                                | Add `isActive` boolean                                                                                |
| User role              | Many-to-many via `UserRole`                  | Frontend assumes single primary role — decide if backend enforces single role or frontend picks first |
| API paths              | `/permissions`, `/roles`, `/users`           | `/api/v1/identity/...` (or add gateway routes)                                                        |
