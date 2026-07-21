# UCBean — Project Context

## What is UCBean

UCBean (Around the Bean) is a **family coffee shop platform** at a university campus.
Tone: local, warm, photo-driven — NOT corporate, NOT Starbucks.

**Two systems, one backend:**

| System | Audience | Stack |
|---|---|---|
| Web app | Customers (mobile + desktop) | Next.js 15 — responsive, mobile-first |
| CRM | Owner / staff | Future phase (shadcn/ui) |

Prototypes (reference only): `prototype-design/ubcbean/project/`

---

## Scope Decision (final — from client presentation)

### Included
- Marketing website with café story, photos, environment
- Online menu (hot, iced, filter coffee, whole beans)
- Coffee pickup reservation with date/time slot
- Table reservation
- Online ordering + payment (Stripe)
- User accounts + order history
- CRM for owner/staff (future phase)

### Discarded (not in this build)
- Native mobile app (React Native / Expo) — removed entirely
- Bean subscriptions — deferred
- Loyalty / rewards / stamps shop — deferred
- Separate desktop prototype as standalone product

---

## Backend Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | NestJS 11 | Module system maps 1:1 to DDD domains |
| HTTP adapter | Fastify | ~2x throughput over Express |
| ORM | Prisma 6 | Type-safe, best migration story |
| Database | PostgreSQL 16 | Relational, fits the ER |
| Auth | JWT custom (HS256) | No third-party dep; 15 min access / 7 day refresh |
| Monorepo | pnpm workspaces | Single `node_modules` |
| Container | Docker + Compose | One-command local dev |

## Frontend Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v3 + shadcn/ui |
| Fonts | Playfair Display (headings) + Plus Jakarta Sans (body) |
| Icons | Lucide React |
| Animation | Framer Motion (native-feel transitions) |

---

## Architecture — Backend

**Clean Architecture + DDD.** Dependency direction:
```
presentation → application → domain ← infrastructure
```

```
api/src/modules/{domain}/
├── domain/
│   ├── entities/       ← Pure TS classes, zero framework imports
│   ├── repositories/   ← Interfaces (IOrderRepository…)
│   └── value-objects/  ← Enums, Money, etc.
├── application/
│   └── use-cases/      ← One class per use case
├── infrastructure/
│   ├── repositories/   ← Prisma implementations
│   └── mappers/        ← Prisma model ↔ domain entity
└── presentation/
    ├── controllers/    ← @Controller, guards
    └── dtos/           ← class-validator shapes
```

**Key rules:**
- Prisma types never appear in `domain/` or `application/`
- Cross-module: service → service via NestJS DI, never repo → repo
- Repository bindings: `{ provide: USER_REPOSITORY, useClass: PrismaUserRepository }`
- Tokens are `Symbol`s — no string collisions

---

## Monorepo Layout

```
ucbean/
├── apps/
│   ├── api/         ← NestJS backend
│   └── web/         ← Next.js 15 customer web app
├── packages/
│   └── shared/      ← Enums (Role, OrderStatus…) shared across apps
├── prototype-design/ ← Reference prototypes only
├── package.json     ← pnpm workspaces root
├── pnpm-workspace.yaml
└── docker-compose.yml
```

---

## Data Model (13 tables — active scope)

Schema: `apps/api/prisma/schema.prisma`

| Domain | Tables |
|---|---|
| Identity | User, Address |
| Catalog | Category, Product |
| Commerce | Order, OrderItem, OrderStatusHistory |
| Reservations | PickupReservation, Table, TableReservation |
| Payments | Payment, PaymentMethod |
| Notifications | Notification |

**Deferred (not in schema):** LoyaltyCard, StampHistory, Reward, RewardRedemption, Subscription

**Key design decisions:**
- `Orders.slot_time` does NOT exist — slot lives in `PickupReservation.slotTime`
- `Orders.deliveryAddressId` — nullable FK (null for table/pickup orders)
- `Products.sold_today` — computed at query time, not stored
- `Table.posX / posY` — floor plan coordinates for CRM map view

---

## Auth Flow

```
POST /api/v1/auth/register  → access token (15 min) + refresh cookie (7 days)
POST /api/v1/auth/login     → same
POST /api/v1/auth/refresh   → reads httpOnly cookie, rotates both tokens
POST /api/v1/auth/logout    → clears hash + clears cookie
GET  /api/v1/users/me       → requires Bearer token
```

- Access token: stateless JWT HS256, 15 min
- Refresh: JWT stored as bcrypt hash in `User.refreshToken`, httpOnly + SameSite=Strict cookie
- `@Roles(Role.OWNER)` + `RolesGuard` for CRM-only endpoints

---

## Key NestJS Patterns Used

| Pattern | File |
|---|---|
| Global PrismaModule | `src/prisma/prisma.module.ts` |
| Custom provider (repo binding) | each `*.module.ts` providers array |
| PassportStrategy (jwt) | `auth/infrastructure/strategies/jwt.strategy.ts` |
| Custom param decorator | `common/decorators/current-user.decorator.ts` |
| Global ValidationPipe | `main.ts` — whitelist + transform |
| Global ExceptionFilter | `common/filters/http-exception.filter.ts` → RFC 7807 |
| Global ResponseInterceptor | `common/interceptors/response.interceptor.ts` → `{ data: … }` |

---

## Web App Design Principles

- **Mobile-first, feels native:** bottom tab nav on mobile, smooth transitions, touch-friendly
- **Photo-driven:** real café photos lead every section — hero, about, menu
- **Warm earthy palette:** stone, amber, espresso tones — not corporate green/blue
- **Family business voice:** story-first, personal, community-focused
- **University context:** student-friendly, accessible pricing communication
- **PWA-ready:** manifest.json, viewport cover, standalone display

---

## How to Run Locally

```bash
# Backend
cp apps/api/.env.example apps/api/.env   # set JWT_SECRET
pnpm install
docker compose up postgres -d
pnpm db:migrate
pnpm dev:api                             # :3000

# Web app
pnpm dev:web                             # :3001

# DB browser
pnpm db:studio                           # :5555
```

---

## Build Phases

| Phase | Scope | Status |
|---|---|---|
| 1 — Foundation | Monorepo, Prisma, Docker, Auth, Users | Done |
| 2 — Web App Shell | Next.js, layout, mobile nav, home page | In progress |
| 3 — Menu + Ordering | Products, cart, checkout, Stripe | Pending |
| 4 — Reservations | Pickup slot picker, table reservation (feels native) | Pending |
| 5 — CRM APIs | Dashboard, product/order management | Pending |
| 6 — Polish | PWA, SEO, perf, Lighthouse ≥ 90 | Pending |

---

## What We Skip (for now)

- Native mobile app — responsive web covers it
- GraphQL — REST is sufficient for this scope
- Subscriptions + Loyalty — deferred to Phase 7+
- Redis/caching — add when latency is measured
- Message queue — notifications synchronous until volume demands it
- Turborepo — add when 3+ apps need pipeline caching
