# Nexions

## Multi-tenant commerce infrastructure for modern marketplaces

Nexions is a full-stack SaaS commerce platform for operating a marketplace with
independent sellers, shared customers, unified checkout, seller workspaces, and
super-admin governance.

The platform is designed around three connected experiences:

- **Customers** discover products, manage carts and wishlists, pay for
  multi-shop orders, track deliveries, and request returns.
- **Sellers** operate isolated storefronts, manage products and orders, review
  analytics, configure payouts, and process return requests.
- **Super admins** govern users, shops, categories, reviews, refunds, and
  platform operations from a dedicated control center.

> **Project status:** Core customer commerce, seller operations, returns and
> refunds, notifications, Stripe payments, super-admin workflows, and seller
> analytics are implemented. Inventory and stock reservation is the next major
> production feature.

---

## Contents

- [Product capabilities](#product-capabilities)
- [Architecture](#architecture)
- [Technology](#technology)
- [Repository structure](#repository-structure)
- [Requirements](#requirements)
- [Local development](#local-development)
- [Environment variables](#environment-variables)
- [Database and migrations](#database-and-migrations)
- [Application routes](#application-routes)
- [Testing and validation](#testing-and-validation)
- [Security model](#security-model)
- [Production checklist](#production-checklist)
- [Roadmap](#roadmap)
- [Contributing](#contributing)

---

## Product capabilities

### Customer experience

- Marketplace browsing with search, categories, sorting, and filters
- Product details, variants, image galleries, ratings, and reviews
- Multi-shop cart with shop-grouped presentation
- Guest-friendly wishlist behavior with authenticated persistence
- Unified checkout for items from multiple shops
- Stripe Elements payment experience
- Order history, order details, delivery progress, and cancellation
- Return requests, evidence uploads, status history, and cancellation
- In-app notifications with deep links
- Account profile, password, preferences, and session management

### Seller workspace

- Multi-tenant shop creation and shop selection
- Shop profile, branding, contact, legal, publishing, and status settings
- Product and variant management
- Product images, pricing, status, and stock fields
- Order list, order detail, status transitions, carrier, and tracking updates
- Coupon and discount management
- Review moderation and seller replies
- Return request queue and return detail workflow
- Stripe Connect onboarding, wallet balance, and withdrawals
- Visual analytics for revenue, orders, fulfillment, customers, products,
  returns, cancellations, and inventory signals
- Seller notifications and operational shortcuts

### Super-admin control center

- Platform dashboard with a dedicated responsive shell
- User list, user details, and account administration
- Shop list, shop details, approval, and moderation
- Platform category taxonomy management
- Review visibility moderation
- Returns and refunds queue
- Stripe refund initiation with webhook reconciliation
- Notifications, profile menu, and secure logout

### Platform foundations

- TypeScript across the client and server
- Prisma migrations with PostgreSQL
- JWT access tokens and rotating refresh sessions
- Role-based access for customers, shop owners, shop employees, and super admins
- Shop-scoped authorization with enumeration-safe `404` responses
- Zod request validation
- Redis-backed rate limiting and BullMQ background jobs
- Structured request logging and request IDs
- Cloudinary media uploads
- Stripe webhook verification and idempotent payment processing

---

## Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│ React + Vite client                                          │
│ Marketplace · Customer portal · Seller workspace · Admin     │
└─────────────────────────────┬────────────────────────────────┘
                              │ REST / JSON
┌─────────────────────────────▼────────────────────────────────┐
│ Express + TypeScript API                                     │
│ auth · users · shops · products · cart · orders · payment     │
│ returns · analytics · notifications · coupons · admin         │
└──────────────┬──────────────────┬──────────────────┬──────────┘
               │                  │                  │
        PostgreSQL / Prisma      Redis             Stripe
        source of truth          cache/jobs        payments/webhooks
                                                   Connect/payouts
               │                  │
               └──────────────┬───┘
                              ▼
                       BullMQ worker
                       email and async jobs
```

### Multi-tenancy

Each shop is a tenant. Shop-owned queries are scoped by both `shopId` and the
authenticated owner. The `authorizeShopAccess` middleware intentionally
returns `404` when a shop does not exist or does not belong to the current
seller, preventing shop enumeration.

### Checkout and payment flow

1. The customer submits a cart containing products from one or more shops.
2. The API creates one checkout and separate shop orders in a transaction.
3. Stripe creates one PaymentIntent for the checkout total.
4. The Stripe webhook is verified and processed idempotently.
5. Orders and wallet ledger entries are reconciled from webhook state.
6. Refund requests are reconciled through Stripe refund webhooks.

The server remains the source of truth for totals, permissions, payment state,
order state, and refund state.

---

## Technology

### Client

| Technology | Role |
| --- | --- |
| React | UI framework |
| Vite | Development server and production bundler |
| TypeScript | Static typing |
| React Router | Application routing |
| TanStack React Query | Server state and caching |
| Zustand | Client authentication state |
| Tailwind CSS | UI styling |
| Radix UI and shadcn/ui | Accessible UI primitives |
| Recharts | Seller analytics visualizations |
| Stripe React | Payment Elements |
| Zod | Form and input validation |

### Server

| Technology | Role |
| --- | --- |
| Node.js and TypeScript | Runtime and application code |
| Express | HTTP API |
| Prisma | ORM and migrations |
| PostgreSQL | Primary database |
| Redis | Rate limiting, caching, and queues |
| BullMQ | Background jobs |
| Stripe | Payments, Connect, refunds, and webhooks |
| Cloudinary | Media storage and delivery |
| Zod | Runtime request validation |
| Pino | Structured logging |
| Vitest and Supertest | Automated tests |

---

## Repository structure

```text
.
├── client/
│   ├── src/
│   │   ├── features/
│   │   │   ├── admin/              # Admin APIs and hooks
│   │   │   ├── auth/               # Authentication screens and state
│   │   │   ├── cart/               # Cart and guest cart behavior
│   │   │   ├── customer/           # Customer orders and wishlist
│   │   │   ├── marketplace/        # Storefront and product discovery
│   │   │   ├── order/              # Checkout and order confirmation
│   │   │   ├── payment/            # Stripe payment UI
│   │   │   ├── returns/            # Customer and seller returns
│   │   │   ├── shop/               # Seller dashboard and analytics
│   │   │   ├── users/              # Profile and account settings
│   │   │   └── pages/superAdmin/   # Super-admin pages and shell
│   │   ├── components/ui/          # Shared UI primitives
│   │   ├── routes/                 # Route composition and guards
│   │   └── store/                  # Zustand stores
│   └── package.json
├── server/
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema
│   │   └── migrations/             # Versioned migrations
│   ├── src/
│   │   ├── features/               # Domain modules
│   │   ├── middleware/             # Auth, validation, access, limits
│   │   └── scripts/                # Seed and operational scripts
│   └── package.json
└── README.md
```

---

## Requirements

- Node.js 18 or newer
- PostgreSQL 14 or newer
- Redis 7 or newer
- Stripe test account and Stripe CLI for local webhooks
- Cloudinary account for media uploads
- SMTP provider for transactional email

---

## Local development

### 1. Clone the repository

```bash
git clone https://github.com/RoyalDani12/saas-multi-tenant-commerce-platform.git
cd saas-multi-tenant-commerce-platform
```

### 2. Install dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### 3. Configure environment variables

Create `server/.env` and `client/.env` using the examples below. Never commit
real credentials, webhook secrets, or production connection strings.

### 4. Prepare the database

From `server/`:

```bash
npx prisma generate
npx prisma migrate dev
```

For a deployed environment, use the non-destructive command:

```bash
npx prisma migrate deploy
```

### 5. Start the services

Open separate terminals:

```bash
# Terminal 1: API
cd server
npm run dev

# Terminal 2: background worker
cd server
npm run worker

# Terminal 3: client
cd client
npm run dev

# Terminal 4: Stripe webhook forwarding
cd server
npm run stripe:listen
```

Default local URLs:

| Service | URL |
| --- | --- |
| Client | `http://localhost:5173` |
| API | `http://localhost:5000` |
| API base | `http://localhost:5000/api/v1` |
| Swagger UI | `http://localhost:5000/api-docs` |

---

## Environment variables

### Server

```env
NODE_ENV=development
PORT=5000

DATABASE_URL=postgresql://postgres:password@localhost:5432/nexions_dev
REDIS_URL=redis://localhost:6379

JWT_SECRET=replace_with_a_long_random_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
DEVICE_LIMIT=5
ORDER_RESERVATION_TTL_MINUTES=15

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_user
SMTP_PASS=your_password
EMAIL_FROM="Nexions <noreply@example.com>"

STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

CLIENT_URL=http://localhost:5173
```

### Client

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

Use Stripe test keys for local HTTP development. Live Stripe.js integrations
must be served over HTTPS.

---

## Application routes

The client route map is composed in `client/src/routes/AppRoutes.tsx`.

| Area | Representative routes |
| --- | --- |
| Marketplace | `/`, `/marketplace`, `/products/:productId`, `/shops/:slug` |
| Customer | `/orders`, `/orders/:orderId`, `/returns`, `/wishlist`, `/settings` |
| Checkout | `/cart`, `/checkout`, `/payment/:checkoutId` |
| Seller | `/dashboard/shop/:shopId`, `/products`, `/orders`, `/returns`, `/analytics` |
| Super admin | `/superadmin`, `/superadmin/users`, `/superadmin/shops`, `/superadmin/returns` |

The API is versioned under `/api/v1`. Important domains include:

- `/auth`
- `/users`
- `/shops`
- `/products`
- `/cart`
- `/orders`
- `/payment`
- `/payouts`
- `/returns`
- `/notifications`
- `/analytics`
- `/admin`

Interactive API documentation is available at `/api-docs` when the server is
running.

---

## Testing and validation

Run the smallest relevant command while developing, then run all gates before
releasing:

```bash
# Client type-check and production build
cd client
npm run build

# Client lint
npm run lint

# Server type-check/build
cd ../server
npm run build

# Server tests
npm test -- --run
```

The current release validation includes a passing client build, server build,
and server test suite. Vite may report a bundle-size warning; this is a
performance follow-up item, not a build failure.

---

## Security model

- Passwords are hashed with bcrypt.
- Access is role-based and protected by authentication middleware.
- Refresh sessions are rotated and can be revoked per device or globally.
- Sensitive input is validated with Zod before reaching domain services.
- Shop access checks both tenant identity and ownership.
- Unauthorized shop access returns `404` to avoid tenant enumeration.
- Stripe webhook signatures are verified against the raw request body.
- Payment and refund processing is designed to be idempotent.
- Rate limiting protects authentication, notification, and general API traffic.
- Helmet and CORS are enabled at the API boundary.
- Secrets are read from environment variables and must not be committed.

Security-sensitive changes should be tested against both an authorized tenant
and an unauthorized tenant before release.

---

## Production checklist

Before deploying a release:

- [ ] Use managed PostgreSQL and Redis with backups and monitoring.
- [ ] Run `npx prisma migrate deploy` against the intended database.
- [ ] Set strong production secrets and verify secret rotation procedures.
- [ ] Configure production CORS and HTTPS-only cookies.
- [ ] Configure Stripe live keys, Connect settings, and webhook endpoints.
- [ ] Run the worker process independently from the API process.
- [ ] Confirm Cloudinary upload restrictions and SMTP delivery.
- [ ] Exercise login, checkout, payment webhook, cancellation, returns, and refunds
      in staging.
- [ ] Verify tenant isolation with multiple seller accounts.
- [ ] Confirm health checks, structured logs, alerts, and error tracking.
- [ ] Review database backups and rollback procedures.
- [ ] Build and serve the client over HTTPS.

---

## Roadmap

### Next: inventory and stock management

The next production feature is a reliable inventory domain:

- Available, reserved, committed, damaged, and unavailable quantities
- Variant-level stock tracking and SKU support
- Atomic reservations during checkout
- Expiration and release of abandoned reservations
- Stock restoration after cancellation or refund
- Seller inventory dashboard and stock history
- Low-stock notifications
- Admin inventory visibility

### Following priorities

1. Inventory and stock reservation
2. Seller fulfillment and shipping operations
3. Address book and saved checkout addresses
4. Support tickets and customer disputes
5. Seller notification center improvements
6. Profit, shipping-cost, and payout analytics
7. Storefront event tracking and conversion analytics
8. Deployment observability and expanded integration coverage

---

## Contributing

1. Create a focused branch from `main`.
2. Keep changes scoped to one feature or fix.
3. Preserve tenant isolation and server-side authorization.
4. Add or update tests for behavior changes.
5. Run the client build, server build, and relevant tests.
6. Use clear conventional commit messages.
7. Open a pull request with the behavior, validation, and migration impact
   clearly described.

Nexions is maintained as a production-focused commerce platform: correctness,
security, tenant isolation, and reliable payment state take priority over
short-term UI shortcuts.
