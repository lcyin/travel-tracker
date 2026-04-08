# ─── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package.json yarn.lock ./

# Install ALL dependencies (dev + prod) needed for compilation
RUN yarn install --frozen-lockfile

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

# Install production-only dependencies
RUN yarn install --frozen-lockfile --production && yarn cache clean

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
