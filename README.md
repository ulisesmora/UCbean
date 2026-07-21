# Around the Bean — UCBean Platform

Family-owned coffee shop platform for a university campus café.
Responsive web app (Next.js 15) + REST API (NestJS 11) in a pnpm monorepo.

---

## Runtime requirements

| Tool | Version | Install |
|------|---------|---------|
| **Node.js** | **22 LTS** (22.x) | [nodejs.org](https://nodejs.org) · or `nvm use 22` |
| **pnpm** | **9.x** | `npm install -g pnpm@9` |
| **Docker** | 24+ | [docker.com](https://www.docker.com) |
| **Docker Compose** | v2 (bundled) | included with Docker Desktop |

> pnpm workspaces manages all packages from a single `node_modules`.
> Do **not** use `npm install` or `yarn` — the lockfile is pnpm-only.

---

## Repository layout

```
ucbean/
├── apps/
│   ├── api/          NestJS 11 + Fastify — REST API (:3000)
│   └── web/          Next.js 15 App Router — customer web app (:3001)
├── packages/
│   └── shared/       Shared enums & types (Role, OrderStatus…)
├── prototype-design/ Reference prototypes — do not ship
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json      Root scripts
```

---

## Quick start — local development

### 1. Clone & install

```bash
git clone https://github.com/<your-org>/ucbean.git
cd ucbean
pnpm install
```

### 2. Environment

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` and set a real `JWT_SECRET` (32+ random chars):

```env
DATABASE_URL=postgresql://ucbean:dev_password@localhost:5432/ucbean
JWT_SECRET=replace-with-a-long-random-string
COOKIE_SECRET=replace-with-another-secret
PORT=3000
NODE_ENV=development
```

### 3. Start the database

```bash
docker compose up postgres -d
```

Postgres runs on `localhost:5432`.
Wait for the healthcheck to pass (`docker compose ps` → `healthy`).

### 4. Run migrations & generate Prisma client

```bash
pnpm db:migrate      # creates tables + generates client
```

### 5. Start the apps

```bash
# Two terminals (or use a process manager):
pnpm dev:api         # → http://localhost:3000
pnpm dev:web         # → http://localhost:3001
```

---

## Root scripts

| Script | What it does |
|--------|-------------|
| `pnpm dev:api` | NestJS in watch mode |
| `pnpm dev:web` | Next.js dev server |
| `pnpm build:api` | Production build of the API |
| `pnpm build:web` | Production build of the web app |
| `pnpm db:migrate` | Run pending Prisma migrations |
| `pnpm db:generate` | Regenerate Prisma client after schema changes |
| `pnpm db:studio` | Open Prisma Studio at :5555 |
| `pnpm db:reset` | Drop + recreate DB + re-run migrations (dev only) |

---

## API

Base URL: `http://localhost:3000/api/v1`

### Auth endpoints

```
POST /auth/register   body: { name, email, password, phone? }
POST /auth/login      body: { email, password }
POST /auth/refresh    (reads httpOnly cookie)
POST /auth/logout
GET  /users/me        Bearer token required
```

### JWT strategy

- **Access token** — HS256, 15 min, sent as `Authorization: Bearer <token>`
- **Refresh token** — 7 days, stored as bcrypt hash in DB, sent as httpOnly `SameSite=Strict` cookie

---

## Web app

URL: `http://localhost:3001`

| Route | Page |
|-------|------|
| `/` | Home — hero, about, menu preview, gallery, events CTA |
| `/menu` | Full menu — Hot / Iced / Filter / Beans |
| `/pickup` | Order for pickup (Phase 3) |
| `/table` | Table reservation (Phase 4) |
| `/events` | Venue rental — packages & enquiry |
| `/about` | Family story + sourcing |
| `/profile` | Account / sign in |
| `/order` | Cart |

### Design tokens

| Token | Value | Use |
|-------|-------|-----|
| `birch-50` | `#f7f3ed` | Page background |
| `forest-700` | `#2d5235` | CTAs, active nav, links |
| `bark-500` | `#8b6f47` | Serif italic accent, prices |
| `forest-900` | `#12251a` | Dark sections |

Typography: **Plus Jakarta Sans** (body/headings) + **Playfair Display italic** (accent words).

---

## Database

PostgreSQL 16 · Prisma 6 ORM

Schema: `apps/api/prisma/schema.prisma`

**13 active tables:**
`User` · `Address` · `Category` · `Product` · `Order` · `OrderItem` · `OrderStatusHistory` · `PickupReservation` · `Table` · `TableReservation` · `PaymentMethod` · `Payment` · `Notification`

**Deferred (not in schema):** LoyaltyCard · Subscription · Rewards

After any schema change:
```bash
pnpm db:migrate      # dev
pnpm db:generate     # if only client needs refresh
```

---

## Docker — full stack

Run everything in containers (no local Node needed after image build):

```bash
docker compose up --build
```

Services: `postgres` (:5432) + `api` (:3000).
The web app is not containerised yet — run it locally with `pnpm dev:web`.

---

## Backend architecture

Clean Architecture + DDD. Dependency direction:
```
presentation → application → domain ← infrastructure
```

Each domain module (`auth`, `users`, `products`, `orders`, `payments`, `reservations`, `notifications`) follows:

```
src/modules/{domain}/
├── domain/
│   ├── entities/        Pure TS classes, zero framework imports
│   ├── repositories/    Interfaces (IOrderRepository…)
│   └── value-objects/   Enums, Money…
├── application/
│   └── use-cases/       One class per use case
├── infrastructure/
│   ├── repositories/    Prisma implementations
│   └── mappers/         Prisma model ↔ domain entity
└── presentation/
    ├── controllers/     @Controller + guards
    └── dtos/            class-validator DTOs
```

---

## Build phases

| Phase | Scope | Status |
|-------|-------|--------|
| 1 — Foundation | Monorepo, Prisma, Docker, Auth, Users | Done |
| 2 — Web shell | Next.js layout, nav, home, menu, events | Done |
| 3 — Menu & ordering | Products API, cart, checkout, Stripe | Pending |
| 4 — Reservations | Pickup slot picker, table reservation | Pending |
| 5 — CRM APIs | Dashboard, product/order management | Pending |
| 6 — Polish | PWA, SEO, Lighthouse ≥ 90 | Pending |

---

## Git workflow

```bash
# Feature branch
git checkout -b feat/your-feature

# Commit
git add <files>
git commit -m "feat: description"

# Push & open PR
git push -u origin feat/your-feature
```

Conventional commits: `feat:` · `fix:` · `chore:` · `docs:` · `refactor:`

---

## Troubleshooting

**`pnpm install` fails** — confirm Node 22 is active: `node -v`

**`db:migrate` fails with connection error** — confirm postgres is healthy:
```bash
docker compose ps
docker compose up postgres -d
```

**Port 3000 or 3001 already in use:**
```bash
# macOS / Linux
lsof -i :3000 | grep LISTEN
# Windows
netstat -ano | findstr :3000
```

**Prisma client out of date after schema change:**
```bash
pnpm db:generate
```
