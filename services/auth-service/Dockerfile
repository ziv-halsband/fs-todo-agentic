# ============================================
# Auth Service - Dockerfile (Monorepo)
# ============================================
# 3-stage build: Dependencies → Builder → Production

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:22-alpine AS dependencies

RUN npm install -g pnpm@10 && apk add --no-cache openssl
WORKDIR /app

# Copy workspace config + lockfile (good cache layer)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/backend-common/package.json ./packages/backend-common/
COPY packages/common/package.json ./packages/common/
COPY services/auth-service/package.json ./services/auth-service/

RUN pnpm install --filter auth-service... --frozen-lockfile --ignore-scripts

# ============================================
# Stage 2: Builder
# ============================================
FROM dependencies AS builder

# Copy shared packages source
COPY packages/backend-common ./packages/backend-common
COPY packages/common ./packages/common

# Copy service source + Prisma schema + TS config
COPY services/auth-service ./services/auth-service
COPY tsconfig.json ./

WORKDIR /app/services/auth-service

# Build shared packages first (they export from dist/)
RUN cd /app/packages/common && pnpm run build && \
    cd /app/packages/backend-common && pnpm run build

# Generate Prisma → Build TS → Copy generated client into dist
RUN pnpm prisma generate && \
    pnpm run build && \
    cp -r src/generated dist/generated

# Create standalone production bundle (flat node_modules, no symlinks)
RUN pnpm deploy --filter auth-service --prod --legacy /app/production

# ============================================
# Stage 3: Production
# ============================================
FROM node:22-alpine AS production

RUN apk add --no-cache openssl

WORKDIR /app

# Copy production node_modules from pnpm deploy (flat, no symlinks)
COPY --from=builder /app/production/node_modules ./node_modules
COPY --from=builder /app/production/package.json ./

# Copy compiled code + generated Prisma client
COPY --from=builder /app/services/auth-service/dist ./dist

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/index.js"]
