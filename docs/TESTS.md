# Testing Guide

> Reference for writing integration tests across all backend services.
> Established pattern: auth-service. Replicate for: todo-service.

---

## What kind of tests we write

**Integration tests** (API tests) using supertest.

- Spin up the real Express app (not a mock)
- Send real HTTP requests
- Assert on HTTP responses (status, body shape, cookies, headers)
- Use a real Postgres database (via testcontainers — Docker)

We do **not** write unit tests for individual functions. Integration tests at the route level give more confidence per test and are closer to how the app is actually used.

---

## Stack

| Tool                                            | Role                                                              |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| `jest`                                          | Test runner                                                       |
| `ts-jest`                                       | Compiles TypeScript for Jest                                      |
| `supertest`                                     | Makes HTTP requests against Express app in-process (no real port) |
| `testcontainers` + `@testcontainers/postgresql` | Spins up a real Postgres Docker container per test run            |
| `prisma db push`                                | Pushes schema to the test DB (no migration files needed)          |

---

## File structure (per service)

```
services/<service-name>/
├── jest.config.js           # Jest configuration
├── jest.globalSetup.js      # Starts Postgres container, sets env vars, pushes schema
├── jest.globalTeardown.js   # Stops the container after all tests
├── tsconfig.test.json       # Extends service tsconfig, relaxes noUnusedLocals etc.
├── package.json             # test script: "jest --runInBand"
└── src/
    ├── app.ts               # Express app exported (NO app.listen here)
    ├── index.ts             # Only: dotenv.config() + app.listen()
    └── __tests__/
        ├── testHelpers.ts   # cleanDatabase() — wipes all tables between tests
        ├── signup.test.ts
        ├── login.test.ts
        └── ...
```

---

## Critical: app.ts vs index.ts split

**This must be done before writing any tests.**

`index.ts` must only contain server startup. `app.ts` exports the configured Express app with no side effects.

```typescript
// src/app.ts — exported, no listen()
import express from 'express';
// ... middleware, routes setup ...
export const app: Express = express();

// src/index.ts — entrypoint only
import dotenv from 'dotenv';
dotenv.config({ override: true }); // MUST be before importing app
import { app } from './app';
app.listen(process.env.PORT || 3000);
```

**Why:** supertest wraps the `app` object directly. If `listen()` is called on import, you get port conflicts and flaky tests.

**Why dotenv stays in index.ts:** tests set `DATABASE_URL` and other env vars themselves (via globalSetup). If dotenv ran in `app.ts`, it would override them with `.env` values.

---

## jest.config.js

```js
/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  globalSetup: '<rootDir>/jest.globalSetup.js',
  globalTeardown: '<rootDir>/jest.globalTeardown.js',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Point workspace packages to their TypeScript source.
    // Without this, Jest follows package.json "main" → dist/ which
    // doesn't have the generated Prisma client files.
    '^@fs-project/db$': '<rootDir>/../../packages/db/src/index.ts',
    '^@fs-project/backend-common$':
      '<rootDir>/../../packages/backend-common/src/index.ts',
    '^@fs-project/common$': '<rootDir>/../../packages/common/src/index.ts',
  },
  testTimeout: 60000, // testcontainers needs time on first run
  verbose: true,
};

module.exports = config;
```

**Key decisions:**

- `moduleNameMapper` for `@fs-project/*` — resolves workspace packages to TypeScript source, not compiled `dist/`. Required because `dist/` doesn't contain Prisma's generated `.js` files.
- `testTimeout: 60000` — Docker image pull on first run takes ~20s. Default 5s would always time out.
- Config file must be `.js` (not `.ts`) — `jest.config.ts` requires `ts-node` to parse, which is an extra dep just for a config file.

---

## jest.globalSetup.js

```js
const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const { execSync } = require('child_process');
const path = require('path');

module.exports = async function globalSetup() {
  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('test_db')
    .withUsername('test')
    .withPassword('test')
    .start();

  const databaseUrl = container.getConnectionUri();

  // Set env vars — workers inherit these because globalSetup runs
  // in the CLI process BEFORE workers are forked.
  process.env.DATABASE_URL = databaseUrl;
  process.env.JWT_SECRET = 'test-jwt-secret-for-tests-minimum-32-chars';
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
  process.env.BCRYPT_ROUNDS = '1'; // ~1ms per hash vs ~100ms at round=10
  process.env.NODE_ENV = 'test';

  // Push schema (no migration files needed for tests)
  execSync('pnpm prisma db push --skip-generate --accept-data-loss', {
    cwd: path.resolve(__dirname, '../../packages/db'),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });

  // Store container — globalSetup and globalTeardown run in the same
  // CLI process, so global is shared between them.
  global.__POSTGRES_CONTAINER__ = container;
};
```

**Why `pnpm prisma` not direct binary path:** pnpm resolves the `prisma` binary from `packages/db`'s own dependencies. Using a hardcoded path like `node_modules/.bin/prisma` fails because pnpm doesn't always hoist binaries to the workspace root.

**Why `BCRYPT_ROUNDS=1`:** bcrypt with 10 rounds = ~100ms per hash. With tests doing signup in `beforeEach`, this would add seconds per test file. Round 1 = ~1ms, making the full suite run in 2–3s instead of 30s+.

---

## jest.globalTeardown.js

```js
module.exports = async function globalTeardown() {
  if (global.__POSTGRES_CONTAINER__) {
    await global.__POSTGRES_CONTAINER__.stop();
  }
};
```

---

## tsconfig.test.json

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noUncheckedIndexedAccess": false
  },
  "include": ["src/**/*"]
}
```

**Why:** the root tsconfig has strict rules that are noisy in test files (e.g. `noUnusedLocals` rejects helper variables). Tests use a relaxed version.

---

## package.json test script

```json
"test": "jest --runInBand"
```

**Why `--runInBand`:** all test files share one Postgres container. Parallel execution causes FK/uniqueness collisions (e.g. two test files both try to create `test@example.com` at the same time).

**Important:** `runInBand: true` in `jest.config.js` does NOT work — it is silently ignored. It must be the CLI flag.

---

## testHelpers.ts

```typescript
import { prisma } from '@fs-project/db';

// Delete in FK-safe order (children before parents).
// User has onDelete: Cascade, but we're explicit here.
export async function cleanDatabase(): Promise<void> {
  await prisma.todo.deleteMany();
  await prisma.list.deleteMany();
  await prisma.user.deleteMany();
}
```

Call this in `beforeEach` of every test file. Never in `afterEach` — clean state before each test, not after.

---

## Test file pattern

```typescript
import request from 'supertest';
import { app } from '../app';
import { cleanDatabase } from './testHelpers';

const VALID_USER = { email: 'test@example.com', password: 'Test1234!', fullName: 'Test User' };

beforeEach(async () => {
  await cleanDatabase(); // always start from empty DB
});

describe('POST /some/endpoint', () => {
  describe('happy path', () => {
    it('returns 201 and ...', async () => {
      const res = await request(app).post('/some/endpoint').send({ ... });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('validation errors', () => { ... });
  describe('auth errors', () => { ... });
});
```

---

## Cookie handling in supertest

Supertest has no cookie jar — you must extract and forward cookies manually.

```typescript
// After signup/login, extract Set-Cookie header:
const cookies = res.headers['set-cookie'] as unknown as string[];

// Send cookies on the next request:
const meRes = await request(app).get('/auth/me').set('Cookie', cookies);
```

**Why `as unknown as string[]`:** supertest types `set-cookie` as `string | string[] | undefined`. TypeScript doesn't allow direct cast to `string[]`. Cast via `unknown` first.

---

## What to test per endpoint

| Scenario              | What to assert                                                              |
| --------------------- | --------------------------------------------------------------------------- |
| Happy path            | Status code, response body shape, no sensitive fields (e.g. `passwordHash`) |
| Cookie-setting routes | `Set-Cookie` headers present, `HttpOnly` flag present                       |
| Protected routes      | 401 with no token, 401 with invalid token                                   |
| Validation            | 400 with `success: false` for each invalid input                            |
| Conflict              | 409 when resource already exists                                            |
| Auth errors           | 401 with generic message (no user enumeration leakage)                      |
| Session lifecycle     | Chain: signup → action → assert state changed (e.g. logout → /me = 401)     |

---

## Known gotchas

| Issue                                     | Cause                                                                       | Fix                                                                 |
| ----------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `prisma: No such file or directory`       | Direct binary path doesn't work in pnpm workspaces                          | Use `pnpm prisma` with cwd set to `packages/db`                     |
| `Cannot find module './generated/prisma'` | Jest resolves `@fs-project/db` to `dist/` which has no generated files      | Add `moduleNameMapper` pointing to `src/`                           |
| Tests collide (unique constraint errors)  | Test files running in parallel share one DB                                 | Use `--runInBand` in the test script                                |
| `runInBand: true` in config ignored       | It's a CLI-only flag                                                        | Put it in package.json script                                       |
| Token comparison flaky                    | JWT `iat` is second-precision; signup + refresh in same second = same token | Don't compare raw token strings — test that the token works instead |
| `jest.config.ts` needs ts-node            | Jest can't parse TS config without ts-node                                  | Use `jest.config.js`                                                |
