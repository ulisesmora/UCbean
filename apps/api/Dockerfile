FROM node:22-alpine AS builder
WORKDIR /app

RUN npm i -g pnpm@10.30.3

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

COPY . .

ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
RUN for i in 1 2 3 4 5 6; do       pnpm --filter @ucbean/api db:generate && break;       echo "prisma generate failed (attempt $i), retrying in 10s";       sleep 10;     done;     pnpm --filter @ucbean/api db:generate
RUN pnpm --filter @ucbean/api build

# --- runner ---
FROM node:22-alpine AS runner
ENV NODE_ENV=production

# The whole workspace. pnpm links each app's dependencies out of the root
# store through apps/api/node_modules, so copying only the root node_modules
# (as this used to) leaves the API unable to resolve a single package. The
# Prisma client is generated inside that store too, not in node_modules/.prisma.
COPY --from=builder /app /app
WORKDIR /app/apps/api

# tsconfig includes prisma/, so Nest builds to dist/src, not dist.
# Pending migrations are applied on every boot; `migrate deploy` never resets.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/src/main.js"]
