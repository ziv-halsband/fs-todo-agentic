# Documentation Index

> Start here. Each doc answers a specific question.

---

## Where do I go for...?

| Question                                                             | Document                             |
| -------------------------------------------------------------------- | ------------------------------------ |
| How do I run this project locally?                                   | [DEVELOPMENT.md](./DEVELOPMENT.md)   |
| How does the system fit together? What does each service do?         | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| How do I write tests? What's the test setup?                         | [TESTS.md](./TESTS.md)               |
| What's the full learning plan to production (k8s, Terraform, CI/CD)? | [PLAN.md](./PLAN.md)                 |
| What's the target AWS infra design and milestone tracker?            | [INFRA.md](./INFRA.md)               |
| What are the code conventions and folder structure rules?            | [CONVENTIONS.md](./CONVENTIONS.md)   |

---

## Quick orientation

**What this project is:** A learning-focused full-stack todo app. Business logic is intentionally simple (users → lists → todos). The real goal is building and shipping a production-grade system end to end: services, CI, containers, cloud.

**Stack:**

| Layer      | Tech                                                   |
| ---------- | ------------------------------------------------------ |
| Frontend   | React, Vite, TypeScript, Zustand, MUI v7               |
| Backend    | Node.js, Express, TypeScript                           |
| Database   | PostgreSQL via Prisma (shared schema in `packages/db`) |
| Auth       | JWT in HttpOnly cookies, refresh token rotation        |
| Monorepo   | pnpm workspaces                                        |
| Containers | Docker Compose (local), EKS (planned)                  |
| CI/CD      | GitHub Actions (planned)                               |

**Project layout:**

```
fs-project/
├── services/
│   ├── auth-service/    # Auth: signup, login, me, refresh, logout
│   └── todo-service/    # Lists + todos CRUD
├── packages/
│   ├── db/              # Prisma schema, migrations, shared client
│   ├── backend-common/  # Shared JWT middleware, error classes
│   └── common/          # Shared TypeScript types and enums
├── frontend/            # React SPA
├── docs/                # ← you are here
└── docker-compose.yml
```

---

## Current milestone

See [INFRA.md → Milestone Roadmap](./INFRA.md#milestone-roadmap) for the full roadmap and status.
