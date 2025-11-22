# ============================================
# Auth Service - Dockerfile (Monorepo Optimized)
# ============================================
# Optimized for:
# - Fast rebuilds (aggressive caching)
# - Minimal image size
# - pnpm workspace support
# - Scalable to 100+ services

# ============================================
# Stage 1: Base
# ============================================
FROM node:22-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm@10

# Set working directory
WORKDIR /app

# ============================================
# Stage 2: Dependencies (Workspace-Aware)
# ============================================
FROM base AS dependencies

# Copy workspace configuration (rarely changes = good caching)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy service package.json (changes when deps change)
COPY services/auth-service/package.json ./services/auth-service/

# OPTIMIZATION: pnpm fetch downloads to global cache first
# This layer is cached even if package.json changes slightly
RUN pnpm fetch --filter auth-service

# Install dependencies from cache
# --frozen-lockfile: Ensure lockfile isn't modified
# --offline: Use fetched cache (faster)
# --filter: Install only auth-service dependencies
RUN pnpm install --filter auth-service --frozen-lockfile --offline

# ============================================
# Stage 3: Build Context (Copy Source)
# ============================================
FROM dependencies AS build-context

# Copy Prisma schema (needed for generation)
COPY services/auth-service/prisma ./services/auth-service/prisma

# Copy TypeScript config
COPY services/auth-service/tsconfig.json ./services/auth-service/

# Copy source code
COPY services/auth-service/src ./services/auth-service/src

# ============================================
# Stage 4: Development
# ============================================
FROM build-context AS development

# Set working directory to service
WORKDIR /app/services/auth-service

# Generate Prisma Client
RUN pnpm prisma generate

# Expose port
EXPOSE 3001

# Development: Hot reload with tsx
CMD ["pnpm", "run", "dev"]

# ============================================
# Stage 5: Builder (Production Build)
# ============================================
FROM build-context AS builder

WORKDIR /app/services/auth-service

# Generate Prisma Client
RUN pnpm prisma generate

# Build TypeScript
RUN pnpm run build

# Prune dev dependencies (keep only production)
RUN pnpm prune --prod

# ============================================
# Stage 6: Production (Minimal Runtime)
# ============================================
FROM node:22-alpine AS production

# Install pnpm (needed for running)
RUN npm install -g pnpm@10

WORKDIR /app

# Copy ONLY production artifacts
COPY --from=builder /app/services/auth-service/dist ./dist
COPY --from=builder /app/services/auth-service/node_modules ./node_modules
COPY --from=builder /app/services/auth-service/package.json ./
COPY --from=builder /app/services/auth-service/prisma ./prisma

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Production: Run compiled JS
CMD ["node", "dist/index.js"]
