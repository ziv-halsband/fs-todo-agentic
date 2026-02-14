# Full-Stack Todo App

A learning-focused full-stack Todo application built with modern web technologies and production-oriented practices.

The project is designed as a realistic end-to-end system: backend services, frontend application, shared infrastructure, CI, and (later) cloud deployment.  
The goal is not just a Todo app, but a solid foundation for building and shipping real products.

---

## Tech Stack

### Backend

- Node.js
- TypeScript
- Express
- PostgreSQL (via Prisma)
- JWT authentication using **HttpOnly cookies**

### Frontend

- React
- TypeScript
- Vite
- Zustand (state management)
- CSS Modules / SCSS

### Tooling & Infra

- pnpm workspace
- Docker Compose (local development)
- GitHub Actions (CI)
- ESLint + Prettier
- Husky + lint-staged

### Planned (later stages)

- Todo service (separate from auth)
- Free-text / agent-based commands
- Kubernetes (AWS)
- CI/CD deployment pipelines

---

## Project Structure (High Level)

```text
fs-project/
├── services/        # Backend services (currently: auth-service)
├── frontend/        # React SPA
├── docs/            # Project documentation
├── docker-compose.yml
└── README.md
```
