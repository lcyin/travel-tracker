# ─── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package.json yarn.lock ./

# Reduce transient registry timeout failures in CI/container networks
RUN yarn config set network-timeout 600000 -g

# Install ALL dependencies (dev + prod) needed for compilation
RUN sh -c 'for i in 1 2 3; do yarn install --frozen-lockfile --non-interactive && exit 0; echo "yarn install failed, retry $i/3"; done; exit 1'

# Copy source code and config
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src/ ./src/

# Compile TypeScript → dist/
RUN yarn build


# ─── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling in containers
RUN apk add --no-cache dumb-init

# Copy production dependency manifests
COPY package.json yarn.lock ./

# Reduce transient registry timeout failures in CI/container networks
RUN yarn config set network-timeout 600000 -g

# Install production-only dependencies
RUN sh -c 'for i in 1 2 3; do yarn install --frozen-lockfile --production --non-interactive && yarn cache clean && exit 0; echo "yarn install (prod) failed, retry $i/3"; done; exit 1'

# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

# Copy static frontend files (served by ServeStaticModule)
COPY web/ ./web/

# Copy entrypoint script
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Cloud Run sets PORT=8080; your app reads process.env.PORT ?? 3000
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "./docker-entrypoint.sh"]
