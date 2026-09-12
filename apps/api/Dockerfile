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
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules          ./node_modules
COPY --from=builder /app/apps/api/dist         ./apps/api/dist
COPY --from=builder /app/apps/api/prisma       ./apps/api/prisma
COPY --from=builder /app/node_modules/.prisma  ./node_modules/.prisma

CMD ["node", "apps/api/dist/main.js"]
