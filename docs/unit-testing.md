# Unit Testing Guide

This workspace requires **every `libs/*` project to have unit tests**. This guide
is the single source of truth for how tests are configured, written, and run.
Future contributors (humans and AI agents) must follow it when adding or changing
library code.

## Standard

- **Every library in `libs/*` must have unit tests.** New libraries are not
  considered complete until their public services/utilities are covered.
- **When you add or change a service/util in a lib, add or update its spec** in
  the same change.
- Tests are **colocated** with the source as `*.spec.ts` (e.g.
  `mail.service.ts` -> `mail.service.spec.ts`).
- Never weaken or delete existing tests to make a build pass. Fix the root cause.

## Toolchain

- **Runner:** [Jest 30](https://jestjs.io/) via the `@nx/jest` inferred `test` target.
- **Transform:** [`@swc/jest`](https://github.com/swc-project/jest) (fast, uses the
  already-installed `@swc/core`). Legacy decorators are enabled so NestJS
  `@Injectable()`, `@Processor()`, parameter decorators, etc. compile correctly.
- **Plugin registration:** `@nx/jest/plugin` is registered in `nx.json`, so any
  project that has a `jest.config.ts` automatically gets a `test` target.

## Running tests

```bash
# A single library
npx nx test <project>          # e.g. npx nx test mail

# Everything (and only) affected by your changes
npx nx affected -t test

# The whole workspace
npx nx run-many -t test --all

# Watch / coverage (pass through to jest)
npx nx test <project> --watch
npx nx test <project> --coverage
```

> Prefer `nx` over calling `jest` directly so caching and project config apply.

## Adding tests to a library that has none

Each lib needs four small wiring changes (copy from `libs/mail` or `libs/auth`)
plus the spec files. Replace `<lib>` with the project's directory name and use the
correct `displayName`.

### 1. `libs/<lib>/jest.config.ts`

```ts
export default {
  displayName: '<lib>',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    // NOTE: this key MUST match the @nx/jest preset key so it *replaces* the
    // default ts-jest transform instead of being merged alongside it.
    '^.+\\.(ts|js|mts|mjs|cts|cjs|html)$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', decorators: true },
          transform: { legacyDecorator: true, decoratorMetadata: true },
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/libs/<lib>',
};
```

### 2. `libs/<lib>/tsconfig.spec.json`

```jsonc
{
  "extends": "./tsconfig.lib.json",
  "compilerOptions": {
    "outDir": "./out-tsc/jest",
    "tsBuildInfoFile": "./out-tsc/jest/tsconfig.spec.tsbuildinfo",
    "rootDir": ".",
    "types": ["jest", "node"]
  },
  "exclude": [],
  "include": [
    "jest.config.ts",
    "src/**/*.test.ts",
    "src/**/*.spec.ts",
    "src/**/*.d.ts"
  ],
  "references": [{ "path": "./tsconfig.lib.json" }]
}
```

### 3. Reference the spec config in `libs/<lib>/tsconfig.json`

```jsonc
{
  "references": [
    { "path": "./tsconfig.lib.json" },
    { "path": "./tsconfig.spec.json" }
  ]
}
```

### 4. Exclude specs from the library build in `libs/<lib>/tsconfig.lib.json`

```jsonc
{
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.spec.ts", "src/**/*.test.ts", "jest.config.ts"]
}
```

> If the lib uses NestJS decorators, make sure `tsconfig.lib.json` also has
> `"experimentalDecorators": true` and `"emitDecoratorMetadata": true`.

After wiring, verify both targets:

```bash
npx nx test <lib> --skip-nx-cache
npx nx typecheck <lib> --skip-nx-cache
```

## How to write the tests

Keep unit tests **fast and dependency-free** — instantiate the class directly and
mock collaborators. Reserve `@nestjs/testing`'s `Test.createTestingModule` for
cases that genuinely need DI wiring.

- **Plain services / utils:** `new MyService()` and assert behavior. See
  `libs/auth/src/lib/services/totp.service.spec.ts`.
- **Env-driven services:** snapshot and restore `process.env` in
  `beforeEach`/`afterAll`, and explicitly delete the vars you assert on so tests
  are independent of the host environment. See
  `libs/mail/src/lib/mail.service.spec.ts`.
- **Services with injected collaborators:** pass mocks into the constructor, e.g.
  `new MailQueueService({ add: jest.fn(), addBulk: jest.fn() } as unknown as Queue)`.
  See `libs/mail/src/lib/mail-queue.service.spec.ts`.
- **BullMQ processors (`WorkerHost`):** construct with a mocked service and call
  `process(job)` with a fake `Job`. See
  `libs/mail/src/lib/mail.processor.spec.ts`.
- **External modules (`nodemailer`, etc.):** mock with `jest.mock('module')` at
  the top of the file. See `libs/mail/src/lib/mail.service.spec.ts`.

## Coverage status

Keep this list current as libraries gain tests.

| Library            | Unit tests |
| ------------------ | ---------- |
| auth               | yes        |
| mail               | yes        |
| identity-core      | yes        |
| security           | yes        |
| advance-core       | no         |
| audit-core         | no         |
| cache              | no         |
| common             | no         |
| constants          | no         |
| database           | no         |
| enums              | no         |
| event-bus          | no         |
| multi-tenancy      | no         |
| notification-core  | no         |
| payment-core       | no         |
| reconciliation-core| no         |
| settlement-core    | no         |
| telemetry          | no         |
| workflow-core      | no         |

> `constants` and `enums` are largely declaration-only; cover them only if they
> contain real logic.

## Troubleshooting

### `Cannot access 'X' before initialization` when importing TypeORM entities

Bidirectional TypeORM relations create a **circular import** between entity files
(e.g. `Role` <-> `Permission`). Under Jest's CommonJS evaluation, `@swc/jest` with
`decoratorMetadata: true` emits an *eager* `design:type` reference to the related
class, which is hit during the circular load before the class is initialized.

**Fix (already applied to `identity-core`):** wrap the related-entity property type
in TypeORM's `Relation<T>` wrapper. This keeps `decoratorMetadata: true` (which
TypeORM's bare `@Column()` needs to infer column types) while making the emitted
type a non-eager `Object`, breaking the cycle. It is type-only and does not change
runtime behavior or the DB schema.

```ts
import type { Relation } from 'typeorm';

@ManyToOne(() => Role, (r) => r.permissions)
@JoinColumn({ name: 'role_id' })
role!: Relation<Role>; // not `role!: Role`
```

Do **not** "fix" this by setting `decoratorMetadata: false` — TypeORM's `@Column()`
then fails with `ColumnTypeUndefinedError`.
