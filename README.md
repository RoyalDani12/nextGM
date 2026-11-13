# NextGM

## Multi-tenant marketplace infrastructure

<p align="center">
  <img src="https://skillicons.dev/icons?i=ts,react,vite,tailwind,nodejs,express,postgres,prisma,redis,stripe&theme=dark" alt="NextGM Technology Stack" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express_5-000000?style=flat-square&logo=express&logoColor=white" alt="Express 5" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/BullMQ-FF4438?style=flat-square&logo=redis&logoColor=white" alt="BullMQ" />
  <img src="https://img.shields.io/badge/Stripe-635BFF?style=flat-square&logo=stripe&logoColor=white" alt="Stripe" />
  <img src="https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white" alt="Vitest" />
</p>

<p align="center">
  <a href="https://github.com/RoyalDani12/nextGM/actions/workflows/cd.yml"><img src="https://github.com/RoyalDani12/nextGM/actions/workflows/cd.yml/badge.svg" alt="CD Status" /></a>
  <a href="https://github.com/RoyalDani12/nextGM/actions/workflows/ci.yml"><img src="https://github.com/RoyalDani12/nextGM/actions/workflows/ci.yml/badge.svg" alt="CI Status" /></a>
  <a href="https://nextgm-1.onrender.com/"><img src="https://img.shields.io/badge/Render-Production_Live-46E3B7?style=flat-square&logo=render&logoColor=white" alt="Render Production" /></a>
  <a href="https://github.com/RoyalDani12/nextGM/deployments/production"><img src="https://img.shields.io/github/deployments/RoyalDani12/nextGM/production?label=deployment&logo=github&style=flat-square" alt="GitHub Deployment Status" /></a>
</p>

NextGM is a full-stack, multi-tenant commerce platform for international
marketplaces. It connects customers, independent sellers, and platform
operators through one secure commerce system:

- **Customers** discover products, manage carts and wishlists, check out across
  multiple shops, pay through Stripe, track orders, and request returns.
- **Sellers** operate isolated storefronts, manage catalog and inventory,
  fulfill orders, configure payouts, respond to reviews, and monitor analytics.
- **Super admins** govern users, shops, categories, reviews, refunds, payouts,
  support, and marketplace performance.

The platform is designed for correctness at the boundaries that matter most in
commerce: tenant isolation, payment ownership, inventory concurrency, webhook
idempotency, money reconciliation, and recoverable asynchronous work.

> **Release position:** Core customer commerce, seller operations, inventory
> reservations, returns, Stripe payments, refunds, notifications, payout
> workflows, admin governance, and analytics are implemented. Production
> deployment still requires environment-specific infrastructure, monitoring,
> payment-provider verification, and the release gates in this document.

---

## Contents

- [Capabilities](#capabilities)
- [Architecture](#architecture)
- [Core workflows](#core-workflows)
- [Money and payment design](#money-and-payment-design)
- [Inventory and order consistency](#inventory-and-order-consistency)
- [Redis and asynchronous processing](#redis-and-asynchronous-processing)
- [Security model](#security-model)
- [Repository structure](#repository-structure)
- [Technology](#technology)
- [Requirements](#requirements)
- [Local development](#local-development)
- [Environment configuration](#environment-configuration)
- [Database and migrations](#database-and-migrations)
- [API and application routes](#api-and-application-routes)
- [Testing and release validation](#testing-and-release-validation)
- [Production deployment](#production-deployment)
- [Operational runbooks](#operational-runbooks)
- [Known limitations and next hardening](#known-limitations-and-next-hardening)
- [Contributing](#contributing)

---

## Capabilities

### Customer commerce

- Marketplace home page with search, categories, sorting, filters, availability,
  price, rating, and product type controls.
- Responsive marketplace navigation with location-aware delivery country
  display and graceful locale/timezone fallback.
- Product pages with image galleries, variants, pricing, stock, ratings,
  reviews, wishlist actions, and related products.
- Cart grouping by shop, coupon application, shipping method selection, and
  multi-shop checkout.
- Checkout ownership enforcement: an authenticated customer can create a
  payment intent only for their own checkout.
- Stripe Elements payment flow with test/live mode separation requirements,
  idempotent PaymentIntent creation, and webhook-driven confirmation.
- Customer order history, order details, status history, shipment tracking,
  cancellation, invoices, and delivery progress.
- Returns with request reasons, evidence, status transitions, resolutions, and
  customer/seller communication.
- Account registration, email verification, login, password reset, Google OAuth,
  session management, account deactivation, and one-time account reactivation.
- Notification center, notification preferences, saved profile data, and
  support contact flows.

### Seller operations

- Shop creation, selection, profile and branding settings, contact information,
  legal verification data, publishing status, and employee access.
- Product CRUD, variants, images, pricing, categories, status, SKU data, and
  inventory controls.
- Atomic stock reservations at product or variant level with conditional
  `stock >= quantity` updates.
- Reservation expiry and release, cancellation restoration, and commit behavior
  tied to the order lifecycle.
- Low-stock and out-of-stock filters with inline stock adjustment.
- Seller order queue, order detail, status transitions, shipment carrier and
  tracking updates, printable packing slips, and browser-generated invoices.
- Coupons, reviews and seller replies, returns queue, refund-related workflows,
  and seller notifications.
- Stripe Connect onboarding, seller wallets, wallet transactions, payout
  requests, and payout status visibility.
- Seller analytics for revenue, orders, customers, products, fulfillment,
  returns, cancellations, and inventory signals.

### Super-admin governance

- Platform overview with KPI cards, revenue and user-growth charts, order
  health, top shops, and user growth.
- Full order analytics with date ranges, lifecycle pipeline cards, status
  breakdown, order-over-time chart, shop performance, and geographic demand.
- User administration, account status controls, user details, and audit views.
- Shop approval, suspension, closure, reopening, legal verification, risk flags,
  admin notes, health details, and shop-level governance.
- Category taxonomy management, product moderation, review visibility controls,
  return queues, refund initiation, payout administration, and support tickets.
- Audit and activity logging for operational accountability.

### Platform foundations

- TypeScript across client and server.
- REST API versioned under `/api/v1`.
- PostgreSQL as the source of truth through Prisma migrations.
- Redis-backed sessions, rate limiting, and BullMQ queues.
- Stripe payment, refund, Connect, and webhook integrations.
- Cloudinary media storage and SMTP transactional email.
- Structured Pino logging, request IDs, Helmet, CORS, validation, and centralized
  error handling.

---

## Architecture

### System design

```mermaid
flowchart LR
    Browser["React + Vite client"] -->|REST / JSON + cookies| API["Express API"]
    API --> Auth["Auth and tenant middleware"]
    API --> Domains["Feature modules"]
    Domains --> DB[("PostgreSQL / Prisma")]
    Domains --> Redis[("Redis")]
    Domains --> Stripe["Stripe"]
    Domains --> Media["Cloudinary"]
    Domains --> Mail["SMTP"]
    Redis --> Queues["BullMQ queues"]
    Queues --> Worker["Dedicated worker process"]
    Worker --> Mail
    Worker --> Media
    Worker --> DB
    Stripe -->|signed webhooks| API
```

### Server boundaries

The server is organized by business domain rather than by transport concern:

```text
server/src/
├── features/
│   ├── auth/          identity, sessions, OAuth, reactivation
│   ├── users/         profiles, preferences, sessions
│   ├── shop/          tenant settings and seller access
│   ├── product/       catalog, variants, inventory-facing product data
│   ├── cart/          cart and cart-item operations
│   ├── orders/        checkout, orders, reservations, shipment state
│   ├── payment/       PaymentIntents, webhooks, refunds
│   ├── payouts/       Connect onboarding and seller withdrawals
│   ├── returns/       returns and resolutions
│   ├── analytics/     seller analytics
│   ├── admin/         platform governance and admin analytics
│   ├── notification/  notifications and preferences
│   ├── coupon/        coupon validation and usage
│   ├── category/      category taxonomy
│   ├── engagement/    wishlist and reviews
│   ├── support/       support tickets and email
│   └── uploads/       signed/media upload workflows
├── infrastructure/
│   ├── cache/         Redis clients and session cache
│   ├── queue/         BullMQ queues, workers, and expiry sweeps
│   └── storage/       Cloudinary and S3 integrations
├── middleware/        auth, roles, tenant access, validation, limits
├── config/            environment, database, CORS, Helmet, logging, Swagger
└── scripts/           seeds and operational checks
```

### Database domains

The Prisma schema contains the primary commerce, identity, and governance
records, including:

- Identity: `User`, `UserProfile`, `RefreshToken`, verification and reset
  records.
- Tenancy: `Shop`, `ShopProfile`, employees, legal documents, risk flags,
  wallets, and wallet transactions.
- Catalog: `Product`, `ProductVariant`, `ProductImage`, `Category`, and product
  relationships.
- Commerce: `Cart`, `CartItem`, `Checkout`, `Order`, `OrderItem`,
  `ShippingAddress`, `OrderShipment`, and status history.
- Money: `Payment`, `PaymentMethod`, `WebhookEvent`, platform wallet, shop
  wallet, and ledger transactions.
- Inventory: `InventoryReservation` with lifecycle status and expiry metadata.
- Trust and operations: returns, reviews, coupons, notifications, audit logs,
  activity logs, and support tickets.

---

## Core workflows

### Customer checkout

```mermaid
sequenceDiagram
    participant C as Customer
    participant UI as Client
    participant API as Orders API
    participant DB as PostgreSQL
    participant S as Stripe
    participant WH as Webhook API

    C->>UI: Submit cart, address, coupons, shipping
    UI->>API: POST /orders/checkout
    API->>DB: Transaction: validate, reserve stock, create checkout/orders
    DB-->>API: Pending checkout and shop orders
    API-->>UI: Checkout identifier
    UI->>API: POST /payment/intent
    API->>API: Verify checkout.customerId
    API->>S: Create/reuse idempotent PaymentIntent
    S-->>API: Client secret
    API-->>UI: Client secret
    C->>S: Confirm payment with Stripe Elements
    S->>WH: Signed payment_intent.succeeded
    WH->>DB: Idempotent payment/order confirmation
    WH-->>C: Notification and updated order state
```

Important invariants:

1. The server calculates totals from trusted product and variant prices.
2. Checkout ownership is verified before a PaymentIntent is created.
3. Inventory reservation and order creation happen in one database transaction.
4. Stripe webhooks, not the browser redirect, finalize payment state.
5. Duplicate webhook events are ignored through persisted event handling.
6. Payment intent creation uses a persisted idempotency key.

### Refund and return reconciliation

```mermaid
flowchart TD
    Return["Return/refund request"] --> Review["Admin or authorized seller review"]
    Review --> Pending["Order = REFUND_PENDING"]
    Pending --> Stripe["Stripe refund"]
    Stripe --> Webhook["Signed charge.refunded webhook"]
    Webhook --> Event["Persist/check webhook event"]
    Event --> Ledger["Finalize payment, order, return, wallet ledger"]
    Ledger --> Notify["Notify customer and seller"]
    Stripe -->|failure| Restore["Restore previous order state"]
```

The webhook resolves the payment record to its order ID. This prevents a
checkout identifier from being passed into order-state reconciliation and keeps
admin-initiated refunds compatible with asynchronous Stripe delivery.

### Account reactivation

Login can return a reactivation flow for deactivated accounts. The client
submits the one-time reactivation key to `POST /api/v1/auth/reactivate`; the
server validates and consumes the Redis-backed key, restores the account state,
and issues a fresh authenticated session. Reactivation keys must not be logged
or exposed in analytics.

---

## Money and payment design

### Source of truth

- Product and variant prices are read from PostgreSQL during checkout.
- Checkout and order totals are persisted as decimal values.
- Stripe receives an integer amount in the smallest currency unit; the current
  implementation creates USD PaymentIntents from the server-calculated total.
- The browser never decides the payable amount.
- Payment state is reconciled from signed Stripe webhooks.

### Platform money flow

```text
Customer payment
        │
        ▼
Stripe PaymentIntent
        │ payment_intent.succeeded
        ▼
Checkout + shop orders confirmed
        │
        ├── platform commission → PlatformWallet / platform ledger
        ├── seller share        → ShopWallet / wallet ledger
        └── fulfillment         → seller order and shipment workflow
```

The configured `PLATFORM_COMMISSION_RATE` is a decimal fraction, for example
`0.10` for ten percent. Production finance teams should reconcile the
application ledger with Stripe balance transactions and Connect reports before
launching at scale.

### Stripe requirements

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and the client publishable key
  must belong to the same Stripe account and mode.
- `pk_test` must pair with the matching account's `sk_test`; live keys must
  likewise match.
- Production Stripe.js pages must use HTTPS.
- Mount the webhook endpoint with a raw JSON body before `express.json()`.
- Configure the Stripe endpoint to
  `/api/v1/payment/webhooks/stripe`.
- Test successful payments, failed payments, duplicate webhooks, refunds,
  Connect account updates, and delayed webhook delivery in staging.

NextGM does not store raw card numbers. Stripe Elements handles payment details;
the application stores provider identifiers and reconciled payment state.

---

## Inventory and order consistency

Checkout uses transactional, conditional reservation:

```sql
UPDATE ProductVariant
SET stock = stock - :quantity
WHERE id = :variantId
  AND stock >= :quantity;
```

The same guard exists for product-level stock. A zero-row update is treated as
insufficient stock and aborts the transaction. Every successful reservation
creates an `InventoryReservation` record containing:

- product and optional variant
- order
- quantity
- expiry time
- lifecycle status

Reservation expiration runs through BullMQ. Cancellation and expiry restore
stock; successful payment commits the reservation. Concurrency tests verify
that two simultaneous buyers cannot reserve the final unit twice.

Sellers should still use variant-level stock for products with meaningful
options such as size, color, or configuration.

---

## Redis and asynchronous processing

Redis is used in two modes:

1. **Fast API Redis connection**
   - user session cache
   - rate limiting integrations and short-lived state
   - fail-fast commands with bounded timeouts
   - database fallback when the cache is unavailable
2. **BullMQ queue connection**
   - blocking worker commands
   - retries and delayed jobs
   - independent worker process

Configured queues:

| Queue | Responsibility |
| --- | --- |
| `emails` | transactional and support email jobs |
| `image-cleanup` | asynchronous media cleanup |
| `accountPurgeQueue` | deferred account purge work |
| `order-expiration` | reservation/order expiration sweeps |
| `notifications` | asynchronous user notifications |

The worker is started separately with `npm run worker`. The order-expiration
sweep is scheduled every five minutes. Redis is required for reliable queue
processing; a Redis outage must be treated as an operational incident even
though some API paths can use a database fallback.

---

## Security model

### Authentication and sessions

- Passwords are hashed with bcrypt.
- Access tokens are short-lived JWTs (15 minutes in the current implementation).
- Refresh tokens are signed separately and stored/revoked per device.
- Password changes invalidate older access sessions.
- A configurable device limit prevents unbounded refresh sessions.
- Deactivated and suspended accounts are blocked by authentication middleware.
- Production cookies use `httpOnly`, `secure`, and `sameSite` protections.

### Authorization and tenant isolation

- Authentication, role authorization, super-admin authorization, and shop-access
  middleware are separate controls.
- Seller operations are scoped to the requested shop and authenticated owner or
  employee access.
- Unauthorized shop access uses enumeration-resistant `404` responses.
- Payment intent creation verifies the checkout customer identity.
- Admin routes are not a substitute for seller authorization; both boundaries
  are checked where applicable.

### API and data protection

- Zod schemas reject unknown and invalid request fields.
- General, authentication, login, verification, password-reset, notification,
  and heavy-endpoint rate limits are configured.
- Helmet adds security response headers.
- CORS allows the configured client origin and credentials only.
- Stripe signatures are verified against the raw request body.
- Centralized error handling returns request IDs for support correlation.
- Secrets are loaded from environment variables, never from source files.
- Structured logs should be scrubbed of tokens, passwords, client secrets,
  webhook payload secrets, and personal data not needed for operations.

Security review before each international launch should include tenant
enumeration, IDOR, payment ownership, webhook replay, coupon abuse, stock
overselling, refresh-token revocation, upload abuse, rate-limit bypass, and
PII/logging checks.

---

## Repository structure

```text
.
├── client/
│   ├── src/
│   │   ├── features/       # marketplace, customer, seller, payment, admin
│   │   ├── components/     # shared UI and accessible primitives
│   │   ├── routes/         # public and protected route composition
│   │   └── store/          # client authentication and UI state
│   ├── .env.example
│   └── package.json
├── server/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── features/
│   │   ├── infrastructure/
│   │   ├── middleware/
│   │   ├── config/
│   │   └── scripts/
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## Technology

| Layer | Technologies |
| --- | --- |
| Client | React 19, Vite, TypeScript, React Router, TanStack Query, Zustand |
| UI | Tailwind CSS, Radix/shadcn primitives, Lucide, Recharts |
| API | Node.js, Express 5, TypeScript, Zod |
| Persistence | PostgreSQL, Prisma, versioned migrations |
| Cache/jobs | Redis, ioredis, BullMQ |
| Money | Stripe Payments, Stripe Connect, signed webhooks |
| Media/email | Cloudinary, SMTP/Nodemailer |
| Quality | Vitest, Supertest, ESLint, TypeScript builds |
| Operations | Pino structured logs, Swagger UI, request IDs |

---

## Requirements

- Node.js 18 or newer
- PostgreSQL 14 or newer
- Redis 7 or newer
- Stripe account and Stripe CLI for local webhook testing
- Cloudinary account for product and evidence media
- SMTP provider for verification, reset, support, and notification email
- HTTPS termination and a managed secrets solution for production

---

## Local development

### Install

```bash
git clone https://github.com/RoyalDani12/nextGM.git
cd nextGM

cd server
npm install

cd ../client
npm install
```

### Configure

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Fill every required value before starting the API. The server validates its
environment at startup and exits when required configuration is missing or
invalid.

### Prepare PostgreSQL

```bash
cd server
npx prisma generate
npx prisma migrate dev
```

For an already-deployed database, use:

```bash
npx prisma migrate deploy
```

Never use `migrate reset` against a shared or production database.

### Start services

Use separate terminals:

```bash
# API
cd server
npm run dev

# Background workers
cd server
npm run worker

# Client
cd client
npm run dev

# Stripe webhook forwarding
cd server
npm run stripe:listen
```

Local endpoints:

| Service | URL |
| --- | --- |
| Client | `http://localhost:3000` |
| API | `http://localhost:5000` |
| API base | `http://localhost:5000/api/v1` |
| Swagger UI | `http://localhost:5000/api-docs` |

### Backend Docker image

The backend Dockerfile provides a production API image, a reusable worker
command, and a separate Prisma migration target:

```bash
# Build the API/worker image
docker build -f server/Dockerfile -t nextgm-api:latest server

# Apply migrations as a one-time release job
docker build --target migration -f server/Dockerfile -t nextgm-migrate:latest server
docker run --rm --env-file server/.env nextgm-migrate:latest

# Run the API
docker run --rm --env-file server/.env \
  -e NODE_ENV=production \
  -p 5000:5000 nextgm-api:latest

# Run the worker from the same image
docker run --rm --env-file server/.env \
  -e NODE_ENV=production \
  nextgm-api:latest node dist/worker.js
```

The API and worker require the same PostgreSQL, Redis, Stripe, Cloudinary,
SMTP, and authentication configuration. In production, inject these values
from a secret manager rather than committing or copying `.env` files.

### Full Docker Compose stack

For local development, Compose runs PostgreSQL, Redis, the migration job, API,
worker, and frontend together:

```bash
docker compose up --build
```

Services are available at:

| Service | URL |
| --- | --- |
| Frontend | `http://localhost:3000` |
| API | `http://localhost:5000` |
| API health | `http://localhost:5000/health` |
| Swagger UI | `http://localhost:5000/api-docs` |

PostgreSQL and Redis are intentionally reachable only inside the Compose
network; they are not published to the host.

Compose replaces `localhost` with the internal service names for API-to-service
traffic:

```text
DATABASE_URL=postgresql://...@postgres:5432/nextgm
REDIS_URL=redis://redis:6379
```

The `migrate` service runs `prisma migrate deploy` once PostgreSQL is healthy.
The API and worker wait for that job to complete successfully. Persistent
volumes retain PostgreSQL and Redis data between restarts.

To stop the stack without deleting data:

```bash
docker compose down
```

To remove containers and local data volumes:

```bash
docker compose down -v
```

Do not use `down -v` against a shared or production environment.

---

## Environment configuration

### Server variables

The authoritative schema is `server/src/config/env.ts`; keep deployment
configuration aligned with it.

```env
NODE_ENV=development
PORT=5000

DATABASE_URL=postgresql://user:password@localhost:5432/nextgm
REDIS_URL=redis://localhost:6379

JWT_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-a-different-long-random-secret
DEVICE_LIMIT=5
ORDER_RESERVATION_TTL_MINUTES=15

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-user
SMTP_PASS=your-password

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
PLATFORM_COMMISSION_RATE=0.10

CLIENT_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/v1/auth/google/callback
```

### Client variables

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

Do not commit either `.env` file. Use a secret manager in production. Keep
Stripe publishable and secret keys in the same account and mode.

---

## Database and migrations

### Migration lifecycle and client generation

```bash
cd server

# Generate Prisma client
npx prisma generate

# Apply migrations locally in development
npx prisma migrate dev
```

For already-deployed environments (staging, production, CI):

```bash
npx prisma migrate deploy
```

> [!WARNING]
> Never run `prisma migrate reset` against shared, staging, or production databases.

### Database seeding

To populate development environments with initial admin accounts, test sellers, categories, and sample products:

```bash
cd server
npx tsx src/scripts/seedAll.ts
```

---

## API and application routes

### Client route areas

| Area | Routes |
| --- | --- |
| Marketplace | `/`, `/marketplace`, `/products/:productId`, `/shops/:slug` |
| Customer | `/orders`, `/orders/:orderId`, `/returns`, `/wishlist`, `/settings` |
| Checkout | `/cart`, `/checkout`, `/payment/:checkoutId` |
| Seller | `/dashboard/shop/:shopId`, `/products`, `/orders`, `/returns`, `/analytics` |
| Admin | `/superadmin`, `/superadmin/users`, `/superadmin/shops`, `/superadmin/returns` |

### API domains

All API routes are under `/api/v1`:

`auth` · `users` · `shops` · `uploads` · `products` · `categories` · `cart` ·
`orders` · `payment` · `payouts` · `admin` · `notifications` · `returns` ·
`analytics` · `support` · `coupons`

Stripe's webhook endpoint is:

```text
POST /api/v1/payment/webhooks/stripe
```

Interactive API documentation is available at `/api-docs` when enabled by the
running server.

---

## Testing and release validation

Run focused tests during development, then all release gates:

```bash
# Client
cd client
npm run lint
npm run build

# Server
cd ../server
npm run build
npm test -- --run
```

High-value regression coverage includes:

- checkout/payment ownership isolation
- atomic inventory reservation under concurrency
- reservation expiry and cancellation restoration
- payment and refund webhook idempotency
- account authentication and reactivation
- admin order analytics calculations
- seller/admin workflow authorization

Before release, also perform staging acceptance tests for registration,
verification, OAuth, password reset, checkout, Stripe success/failure, delayed
webhooks, refunds, cancellation, returns, payouts, uploads, and tenant
isolation.

---

## Production deployment

### Continuous Deployment (CD) Pipeline

NextGM includes an automated Continuous Deployment pipeline configured in [`.github/workflows/cd.yml`](.github/workflows/cd.yml) with Render Blueprint infrastructure-as-code support in [`render.yaml`](render.yaml).

- **Automated Deploy on Merge:** Every push to `main` executes pre-flight tests, builds production Docker images, pushes them to GitHub Container Registry (GHCR), and triggers Render deploy hooks.
- **Manual Dispatch:** Supports triggering deployments on-demand with fine-grained control via GitHub Actions UI (`workflow_dispatch`).
- **Render Infrastructure as Code:** Deploy the full platform (Express API, BullMQ worker, React static client, PostgreSQL, and Redis) with one click using [`render.yaml`](render.yaml).
- **Runbook & Configuration:** See [docs/cd-deployment.md](docs/cd-deployment.md) for full instructions on configuring GitHub secrets, deploy hooks, and rollback procedures.

### Recommended topology

```text
CDN / WAF / TLS
        │
        ├── Static client deployment
        └── Load balancer
                ├── API replicas
                └── Worker replicas

Managed PostgreSQL ── backups, PITR, replicas
Managed Redis ─────── persistence, alarms, TLS
Stripe / Cloudinary / SMTP
```

### Required release gates

- [ ] Use managed PostgreSQL and Redis with backups, encryption, and alerts.
- [ ] Run `npx prisma migrate deploy` against the intended database.
- [ ] Verify migration status and database connectivity before opening traffic.
- [ ] Configure production `CLIENT_URL` and the single allowed CORS origin.
- [ ] Use strong, unique JWT secrets and document rotation procedures.
- [ ] Serve the client and API through HTTPS.
- [ ] Configure Stripe live keys, Connect settings, and signed webhooks.
- [ ] Verify live/test key account alignment with a real staging payment.
- [ ] Run API and worker as separate independently monitored processes.
- [ ] Configure Cloudinary upload limits, transformations, and access policy.
- [ ] Configure SMTP SPF, DKIM, DMARC, bounce handling, and delivery alerts.
- [ ] Enable centralized logs, metrics, tracing, error reporting, and alerts.
- [ ] Verify backup restoration and rollback procedures.
- [ ] Test graceful shutdown and queue retry behavior.
- [ ] Verify no secrets, tokens, client secrets, or card data appear in logs.
- [ ] Complete tenant-isolation and payment-ownership security testing.

### International-market readiness

Before expanding beyond the initial market, define and test:

- supported currencies, decimal precision, tax/VAT/GST responsibility, and
  invoice requirements
- country-specific payment methods and Stripe availability
- shipping zones, delivery promises, returns windows, and carrier contracts
- address validation, phone number formatting, language, timezone, and locale
- privacy, cookie, consumer-protection, data-retention, and deletion policies
- seller KYC/KYB, sanctions screening, payout timing, and dispute handling
- chargeback ownership, reserve policy, and finance reconciliation
- regional data residency and subprocessors

The current checkout PaymentIntent implementation is USD-based. International
currency, tax, and legal behavior must be explicitly designed before marketing
the platform as globally compliant.

---

## Operational runbooks

### Checkout returns HTTP 500

1. Check API logs using the request ID.
2. Confirm PostgreSQL migrations are deployed:
   `npx prisma migrate status`.
3. Confirm `InventoryReservation` exists and Redis is available.
4. Check stock, order, and transaction errors before retrying.
5. Never manually decrement stock without reconciling reservations.

### Payment client-secret mismatch

1. Confirm client `VITE_STRIPE_PUBLISHABLE_KEY` and server
   `STRIPE_SECRET_KEY` use the same Stripe account.
2. Confirm both are test keys or both are live keys.
3. Confirm the client is using the current PaymentIntent client secret.
4. Inspect the server PaymentIntent ID, not the browser response alone.
5. Rotate exposed credentials immediately; never paste secret keys into issues,
   chat, logs, or source control.

### Missing or delayed webhooks

1. Check Stripe delivery history and signature failures.
2. Confirm the route receives raw JSON before `express.json()`.
3. Check `STRIPE_WEBHOOK_SECRET` and endpoint mode.
4. Inspect persisted webhook event/idempotency records.
5. Reconcile payment, checkout, order, and wallet state before replaying.

### Redis or worker outage

1. Check Redis connectivity, memory, TLS, and authentication.
2. Inspect failed and delayed BullMQ jobs.
3. Keep the API available only for operations whose consistency guarantees
   remain valid without queues.
4. Restore the worker before relying on reservation expiry, notifications,
   account purge, or image cleanup.

---

## Known limitations and next hardening

These are intentional follow-up items, not undocumented assumptions:

1. **Currency and tax model:** checkout currently creates USD PaymentIntents;
   multi-currency pricing, tax calculation, and regional invoices require a
   dedicated finance design.
2. **CORS configuration:** the current environment schema accepts one allowed
   origin. Multi-region frontends need an explicit allow-list implementation.
3. **Observability:** structured logs and request IDs exist, but production
   teams still need external metrics, tracing, alerting, and log retention.
4. **Shipping integrations:** the current system stores shipment methods and
   tracking data; carrier label generation and rate aggregation are future
   integrations.
5. **Compliance operations:** KYC/KYB, tax reporting, GDPR/CCPA workflows, and
   regional consumer-law policies require operational ownership beyond code.
6. **End-to-end coverage:** unit and integration coverage exists for core
   security, payment, inventory, and admin workflows; browser-level checkout
   testing should be added to the deployment pipeline.

---

## Contributing

1. Create a focused branch from `main`.
2. Preserve tenant isolation, server-side authorization, and money invariants.
3. Add tests for behavior changes and migrations for schema changes.
4. Update this README when workflows, environment variables, or operations
   change.
5. Run client lint/build, server build, and relevant tests.
6. Never commit secrets, production data, or copied payment credentials.
7. Open a pull request describing behavior, security impact, migration impact,
   and validation evidence.

NextGM prioritizes reliable money movement, safe multi-tenancy, clear
operational ownership, and a professional customer experience over shortcuts.
