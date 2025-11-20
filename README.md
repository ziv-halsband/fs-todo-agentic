# Full-Stack Todo Application - Learning Project

A production-grade full-stack application built with microservices architecture, focusing on learning and mastering backend, frontend, DevOps, and CI/CD practices.

## 🎯 Project Goals

- Master **backend development** with Node.js, Express, PostgreSQL, Redis
- Strengthen **frontend skills** with React, MUI, and modern state management
- Practice **DevOps & CI/CD** with Docker, Kubernetes, GitHub Actions, ArgoCD
- Learn **SQL databases** with Prisma ORM and migrations
- Implement **authentication & authorization** with RBAC
- Build **microservices** with proper service-to-service communication
- Deploy to **AWS** with cost management and monitoring

## 🏗️ Architecture

### Monorepo Structure
```
fs-project/
├── services/
│   ├── auth-service/      # Authentication & authorization
│   └── todo-service/      # Todo management (Phase 2)
├── frontend/              # React application
├── packages/
│   ├── common/           # Shared types, utilities
│   └── backend-common/   # DB clients, middleware
├── infra/
│   ├── docker/           # Docker Compose configs
│   └── k8s/              # Kubernetes manifests
├── .github/workflows/    # CI/CD pipelines
└── docs/                 # Documentation
```

### Tech Stack

**Backend**
- Node.js + Express + TypeScript
- PostgreSQL (with Prisma ORM)
- Redis (sessions & caching)
- JWT authentication
- bcrypt password hashing

**Frontend**
- React 18 + TypeScript
- Material-UI (MUI) + SCSS Modules
- Zustand (state management)
- React Router
- Axios

**DevOps**
- Docker + Docker Compose
- Kubernetes (Minikube local, AWS EKS production)
- GitHub Actions
- ArgoCD (GitOps)
- AWS services

## 🚀 Quick Start

### Prerequisites
- Node.js >= 22.0.0 (v22.21.0 recommended)
- pnpm >= 10.0.0
- Docker Desktop
- Minikube (for K8s development)

### Installation

```bash
# Install dependencies
pnpm install

# Start local development (Docker Compose)
pnpm docker:up

# Run auth service
pnpm dev:auth

# Run frontend
pnpm dev:frontend
```

### Environment Setup

Copy `.env.example` files in each service and configure:
```bash
cp services/auth-service/.env.example services/auth-service/.env
```

## 📚 Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md) - System design and service interactions
- [Development Guide](./docs/DEVELOPMENT.md) - Local setup, commands, debugging
- [Coding Conventions](./docs/CONVENTIONS.md) - Standards and best practices
- [Cost Management](./docs/COST_MANAGEMENT.md) - AWS budget controls and cleanup

## 🎓 Learning Focus Areas

### Phase 1: Authentication (Current)
- ✅ Email/password authentication
- ✅ JWT token management
- ✅ Session handling with Redis
- ✅ Prisma ORM & migrations
- ✅ Docker Compose setup
- ✅ Minikube deployment
- ✅ CI/CD with GitHub Actions

### Phase 2: Todo Management (Next)
- Todo CRUD operations
- Todo sharing & collaboration
- RBAC (Owner, Editor, Guest roles)
- Service-to-service communication
- Google OAuth integration
- ArgoCD deployment
- AWS EKS production deployment

### Phase 3: Advanced Features (Future)
- Microfrontends architecture
- AI integration (Langchain)
- Real-time updates (WebSockets)
- Advanced monitoring & logging
- Performance optimization

## 📦 Available Commands

```bash
# Development
pnpm dev:auth          # Run auth service in dev mode
pnpm dev:frontend      # Run frontend in dev mode
pnpm dev:all           # Run all services

# Docker
pnpm docker:up         # Start Docker Compose services
pnpm docker:down       # Stop and remove containers
pnpm docker:logs       # View container logs

# Database
pnpm db:migrate        # Run Prisma migrations
pnpm db:seed           # Seed database with test data
pnpm db:studio         # Open Prisma Studio

# Testing
pnpm test              # Run all tests
pnpm test:auth         # Test auth service
pnpm lint              # Run linters
pnpm type-check        # TypeScript type checking

# Kubernetes
pnpm k8s:start         # Start Minikube cluster
pnpm k8s:deploy        # Deploy to Minikube
pnpm k8s:destroy       # Delete Minikube cluster

# Build
pnpm build             # Build all packages
pnpm build:auth        # Build auth service
pnpm build:frontend    # Build frontend
```

## 🧪 Testing

### Local Testing with Postman
1. Start services: `pnpm docker:up`
2. Import Postman collection from `docs/postman/`
3. Test endpoints at `http://localhost:3001/api/auth`

### Endpoints
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (requires JWT)
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token

## 🔒 Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with expiration
- HTTP-only cookies for refresh tokens
- CORS configuration
- Environment variable validation
- SQL injection prevention (Prisma)
- Rate limiting on auth endpoints

## 🤝 Contributing

This is a personal learning project, but feel free to use it as a reference!

## 📄 License

MIT

