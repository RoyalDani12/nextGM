# Nexions — Multi-Tenant E-Commerce SaaS Platform

A production-grade, multi-tenant e-commerce API built with Node.js, TypeScript, and PostgreSQL. Designed to power marketplace platforms where multiple shop owners sell to customers on a single platform.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Security](#security)
- [Performance](#performance)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)

---

## Overview

Nexions is a full-featured multi-tenant e-commerce SaaS backend that enables:

- **Customers** to browse shops, discover products, place orders, and pay securely via Stripe
- **Shop Owners** to create and manage their storefront, products, and incoming orders
- **Super Admins** to manage platform-wide concerns, including refunds

Built with production concerns in mind: tenant isolation, race condition prevention, atomic payment/webhook processing, reservation-based inventory management, GDPR compliance, structured logging, background job processing, and CDN-backed file uploads.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (React/Vite)                   │
└───────────────────────────┬─────────────────────────────┘
                             │ HTTPS
┌───────────────────────────▼─────────────────────────────┐
│                   EXPRESS API SERVER                     │
│                                                           │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌─────────┐ │
│ │  Auth  │ │  User  │ │  Shop  │ │Product │ │  Cart   │ │
│ └────────┘ └────────┘ └────────┘ └────────┘ └─────────┘ │
│ ┌────────┐ ┌────────┐ ┌──────────────┐                  │
│ │ Order  │ │Payment │ │ Notification │                  │
│ └────────┘ └────────┘ └──────────────┘                  │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Middleware Layer                     │   │
│  │ authenticate │ authorizeShopAccess │ authorizeSuperAdmin │
│  │ validate │ rateLimit                              │   │
│  └──────────────────────────────────────────────────┘   │
└──────┬──────────────┬───────────────┬──────────┬────────┘
       │               │               │          │
┌──────▼──────┐ ┌──────▼─────┐ ┌──────▼──────┐ ┌─▼──────┐
│ PostgreSQL  │ │   Redis    │ │ Cloudinary  │ │ Stripe │
│  (Prisma)   │ │ (Cache +   │ │   (Media)   │ │(Payments│
│             │ │  Queue)    │ │             │ │+Webhooks)│
└─────────────┘ └────────────┘ └─────────────┘ └─────────┘
                       │
                ┌──────▼──────┐
                │   BullMQ    │
                │  (Workers)  │
                │  Email      │
                │  Image      │
                │  GDPR Purge │
                │  Order Expiration + Sweep │
                │  Notification │
                └─────────────┘
```

### Multi-Tenancy Model

Each **Shop** is a tenant. Data isolation is enforced at the application layer — every query is scoped by `shopId`. Tenant A can never access Tenant B's products, orders, or customer data. Shop-scoped access is enforced centrally via the `authorizeShopAccess` middleware, checking `Shop.ownerId` against the authenticated user.

### Order Reservation Model

Stock is decremented atomically at order creation (`PENDING`), not at payment confirmation — this reserves inventory the instant a customer checks out. Unpaid reservations automatically expire after a configurable TTL (default 15 minutes), restoring stock via a dedicated BullMQ worker. A periodic sweep job acts as a fallback in case the primary expiration job is lost (e.g. Redis restart without persistence).

### Payment & Webhook Model

All payment state transitions (`PENDING → CONFIRMED`, `REFUND_PENDING → REFUNDED`) are driven exclusively by verified Stripe webhook events — never by the initiating API call alone. Webhook idempotency (`WebhookEvent` table, unique constraint on `stripeEventId`) and the corresponding order/payment state update run inside a single atomic transaction, so a duplicate delivery can never be marked "processed" without the real state change having actually committed.

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js + TypeScript | Runtime + type safety |
| Express.js | HTTP framework |
| Prisma ORM | Database access + migrations |
| PostgreSQL | Primary database |
| Redis | Session cache + rate limiting + queue backend |
| BullMQ | Background job processing (separate worker process) |
| Stripe | Payment processing, PaymentIntents, webhooks, refunds |
| Pino | Structured JSON logging |
| Zod | Runtime input validation |
| JWT | Stateless authentication |
| bcrypt | Password hashing |
| Cloudinary | Media storage + CDN |
| Nodemailer | Transactional email |

### Frontend (In Progress)
| Technology | Purpose |
|---|---|
| React + Vite | UI framework |
| TypeScript | Type safety |
| TailwindCSS | Styling |
| Stripe Elements | Embedded card payment UI |
| React Query | Server state management |
| Zustand | Client state management |

---

## Features

### Authentication & Security
- JWT access tokens (15 min) + refresh token rotation (7 days)
- bcrypt password hashing
- Email verification on registration
- Password reset via secure time-limited tokens
- Immediate token invalidation on password change (`passwordChangedAt` pattern)
- Device session management (view, revoke single, revoke all)
- Device fingerprinting (IP address, user agent, parsed device name)
- Per-device session limits (configurable, oldest evicted)
- Redis-backed session caching, 15-minute TTL, DB fallback on cache miss
- Rate limiting on all sensitive endpoints (Redis-backed, multi-server safe)
- Signed Cloudinary uploads (server never processes file bytes)
- Role-based access: `CUSTOMER`, `SHOP_OWNER`, `SHOP_EMPLOYEE`, `SUPER_ADMIN` (shop ownership currently derived from `Shop.ownerId`; employee/staff roles reserved for the upcoming Employee module)

### User Management
- Full profile management (name, avatar, phone, address)
- Account lifecycle: active → deactivated → reactivated → deleted
- GDPR-compliant permanent deletion with 30-day anonymization queue
- Notification preferences (per-category: order updates, promotions, reviews; per-channel: email, push)

### Shop Module (Multi-Tenant Core)
- Shop creation with auto-generated unique slugs
- Two-step onboarding: create shell → complete profile
- Shop status machine: PENDING → ACTIVE ↔ PAUSED / SUSPENDED / CLOSED
- Owner-controlled pause/activate with admin-only suspension
- Soft delete with product archival cascade
- Shared Cloudinary upload signatures for logo/banner
- Centralized `authorizeShopAccess` middleware (404 on missing/unauthorized shop — enumeration-safe)

### Product Module
- Full product lifecycle: DRAFT → ACTIVE ↔ ARCHIVED
- Per-shop slug + SKU uniqueness (not global)
- Category tree support (platform-wide categories + shop-level internal organization)
- Product variants (size, color, etc.) with individual pricing + stock
- Multi-image support with primary image management
- Decimal-safe price handling (string-based API input, Prisma Decimal storage)
- Public browse with search, filters, price range, pagination
- Atomic, race-condition-safe stock decrement/restore (`updateMany` + conditional guard, not read-then-write)

### Cart Module
- Multi-shop cart, grouped and split into one order per shop at checkout
- Stock and availability validation before checkout
- Auto-creation on first add, quantity upsert

### Order Module
- Checkout: atomic per-shop order creation, price snapshot at time of purchase, immediate stock reservation
- Multi-shop cart splits into independent orders (one per shop) in a single transaction
- Customer order history + detail (paginated, filterable, full item/shipping/payment/status-history view)
- Customer-initiated cancellation (`PENDING`/`CONFIRMED` only), atomic guard against double-cancel and races with shop-side updates, automatic stock restoration
- Shop-side order management: list, detail, and status transitions (`PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED`)
- **Reservation TTL system:** unpaid `PENDING` orders auto-expire (default 15 min) via a dedicated BullMQ worker running in a separate process; stock is restored automatically; a periodic sweep job (every 5 min) catches orders whose primary expiration job was lost
- Full `OrderStatusHistory` audit trail on every transition

### Payment Module
- Stripe integration via PaymentIntent + Stripe Elements (embedded, PCI-light — card data never touches the server)
- `POST /orders/:orderId/intent` — idempotent PaymentIntent creation; repeated calls reuse the existing PaymentIntent rather than creating duplicates
- Stripe webhook endpoint with raw-body signature verification (mounted before global JSON body parsing, as required by Stripe)
- No user-session auth on the webhook route — cryptographic signature verification (`stripe-signature` header + webhook secret) is the security boundary, since Stripe is a server-to-server caller, not a logged-in user
- **Atomic webhook idempotency:** the `WebhookEvent` idempotency insert and the actual `Order`/`Payment` state update run inside a single database transaction, preventing an event from being marked "processed" if the real update failed
- Handles `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`; unrecognized event types are acknowledged (200) without action, per Stripe's retry semantics
- Admin-initiated refunds (`SUPER_ADMIN`-gated), with an atomic `REFUND_PENDING` guard preventing duplicate refund attempts on the same order while one is in flight
- Refunds do **not** automatically restore stock — a deliberate, separate inventory-reconciliation decision (noted as a known gap pending a dedicated restock flow)

### Notification Module
- In-app notifications (`Notification` table) + transactional email, delivered asynchronously via BullMQ (never blocks the triggering request)
- Per-category user preferences (`orderUpdates`, `promotions`, `reviews`) and per-channel toggles (`emailEnabled`, `pushEnabled`); missing preference records default to fully opted-in
- Wired directly into existing order/payment lifecycle events: `ORDER_PLACED`, `PAYMENT_SUCCESS`, `PAYMENT_FAILED`, `PAYMENT_REFUNDED`, `ORDER_SHIPPED`, `ORDER_DELIVERED`
- Branded HTML email templates (shared base layout, per-notification-type content), Outlook-safe table-based layout with progressive CSS animation
- Notification delivery is best-effort and fully decoupled from the triggering business operation — a failed notification never breaks checkout, payment confirmation, or order fulfillment

### Background Jobs (BullMQ — separate worker process)
- Email queue: verification, password reset, deletion notifications, transactional notification emails
- Image cleanup queue: async Cloudinary deletion on avatar/logo change
- GDPR purge queue: 30-day delayed anonymization after account deletion
- Order expiration queue: reservation TTL enforcement + periodic orphan sweep
- Notification queue: in-app record creation + email hand-off

---

## Getting Started

### Prerequisites

```bash
Node.js >= 18
PostgreSQL >= 14
Redis >= 7
Stripe CLI (for local webhook testing)
```

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/nexions.git
cd nexions/server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your values (see Environment Variables section)

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start the API server
npm run dev

# In a separate terminal — start the background worker process
npm run worker

# In a separate terminal — forward Stripe webhooks locally
npm run stripe:listen
```

### Running In Production

```bash
npm run build
npm start
# Run the worker process separately in production — never colocated with the API process
```

---

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nexions

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_jwt_secret_here

# Bcrypt
BCRYPT_ROUNDS=12

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@nexions.com

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Order Reservation
ORDER_RESERVATION_TTL_MINUTES=15

# Device Limits
DEVICE_LIMIT=5

# Frontend
CLIENT_URL=http://localhost:3000
```

---

## API Documentation

Base URL: `http://localhost:5000/api/v1`

### Auth Routes
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/register` | Register new account | Public |
| POST | `/auth/login` | Login | Public |
| POST | `/auth/logout` | Logout current device | Required |
| POST | `/auth/refresh-token` | Rotate refresh token | Cookie |
| POST | `/auth/verify-email` | Verify email address | Public |
| POST | `/auth/resend-verification` | Resend verification email | Public |
| POST | `/auth/forgot-password` | Request password reset | Public |
| POST | `/auth/reset-password` | Reset password with token | Public |

### User Routes
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/users/me` | Get current user profile | Required |
| PUT | `/users/me` | Update profile | Required |
| PATCH | `/users/me/change-password` | Change password | Required |
| POST | `/users/me/deactivate` | Deactivate account | Required |
| POST | `/users/me/reactivate` | Reactivate account | Public |
| DELETE | `/users/me/permanent` | Permanently delete account | Required |
| GET | `/users/me/sessions` | List active sessions | Required |
| DELETE | `/users/me/sessions/:id` | Revoke single session | Required |
| DELETE | `/users/me/sessions` | Revoke all other sessions | Required |

### Shop Routes
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/shops` | Create shop | Required |
| GET | `/shops/me` | Get owner's shop | Required |
| PUT | `/shops/:id/profile` | Update shop profile | Owner |
| PATCH | `/shops/:id/status` | Pause or activate shop | Owner |
| DELETE | `/shops/:id` | Close shop permanently | Owner |
| GET | `/shops/:slug` | Public shop storefront | Public |

### Product Routes
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/shops/:shopId/products` | Create product | Owner |
| GET | `/shops/:shopId/products` | List shop products | Owner |
| PUT | `/shops/:shopId/products/:id` | Update product | Owner |
| PATCH | `/shops/:shopId/products/:id/status` | Publish or archive | Owner |
| DELETE | `/shops/:shopId/products/:id` | Soft delete product | Owner |
| POST | `/shops/:shopId/products/:id/images` | Add product image | Owner |
| POST | `/shops/:shopId/products/:id/variants` | Add product variant | Owner |
| GET | `/products` | Browse all products | Public |
| GET | `/products/:id` | Product detail | Public |

### Cart Routes
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/cart/items` | Add item to cart | Required |
| GET | `/cart` | View cart (grouped by shop) | Required |
| PATCH | `/cart/items/:itemId` | Update item quantity | Required |
| DELETE | `/cart/items/:itemId` | Remove item | Required |
| DELETE | `/cart` | Clear cart | Required |

### Order Routes
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/orders/checkout` | Place order(s) from cart | Required |
| GET | `/orders` | Customer order history | Required |
| GET | `/orders/:orderId` | Customer order detail | Required |
| POST | `/orders/:orderId/cancel` | Cancel a `PENDING`/`CONFIRMED` order | Required (owner) |
| GET | `/shops/:shopId/orders` | Shop's incoming orders | Owner |
| GET | `/shops/:shopId/orders/:orderId` | Shop order detail | Owner |
| PATCH | `/shops/:shopId/orders/:orderId/status` | Advance fulfillment status | Owner |

### Payment Routes
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/payment/:orderId/intent` | Create/reuse Stripe PaymentIntent | Required (owner) |
| POST | `/payment/webhooks/stripe` | Stripe webhook receiver | Signature-verified (no session auth) |
| POST | `/admin/orders/:orderId/refund` | Initiate a refund | `SUPER_ADMIN` |

### Upload Routes
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/uploads/signature` | Get Cloudinary upload signature | Required |

---

## Database Schema

### Core Models

```
User ──────── UserProfile
  │
  ├── RefreshToken (sessions)
  ├── Shop (ownedShops) ──── ShopProfile
  │     │                ├── Product ──── ProductImage
  │     │                │           ├── ProductVariant
  │     │                │           └── ProductCategory
  │     │                ├── Order ──── OrderItem
  │     │                │         ├── Payment
  │     │                │         ├── ShippingAddress
  │     │                │         └── OrderStatusHistory
  │     │                ├── Coupon
  │     │                └── ShopEmployee
  │     │
  ├── Order (as customer)
  ├── PaymentMethod
  ├── Review
  ├── Notification
  ├── NotificationPreference
  └── AuditLog

WebhookEvent   (Stripe event idempotency log, not user-scoped)
```

### Key Design Decisions

```
Multi-tenancy:      shopId scoped queries everywhere; ownership derived
                     from Shop.ownerId, not a separate role flag
Soft deletes:        deletedAt DateTime? on User, Shop, Product, Order
Idempotency (DB):    idempotencyKey @unique on Order and Payment
Idempotency (webhook): WebhookEvent.stripeEventId @unique, checked and
                     written inside the same transaction as the state
                     change it guards
Decimal prices:      Prisma Decimal type, accepted as strings in API
Order reservation:   stock decremented at PENDING, released via TTL
                     expiration worker or shop/customer cancellation
Audit trail:         OrderStatusHistory tracks every order transition;
                     AuditLog tracks CREATE/UPDATE/DELETE/LOGIN
```

---

## Security

| Concern | Implementation |
|---|---|
| SQL Injection | Prisma parameterized queries |
| XSS | helmet.js headers |
| CSRF | SameSite cookies + CORS |
| Brute Force | Redis rate limiting per IP |
| Token Theft | Short-lived JWTs + refresh rotation |
| Password Change | Immediate token invalidation via `passwordChangedAt` |
| File Upload | Signed Cloudinary uploads, server never touches bytes |
| Input Validation | Zod schemas on every endpoint |
| Tenant Isolation | `shopId` enforced on every shop-scoped query via `authorizeShopAccess` |
| Enumeration Prevention | `404`, not `403`, on ownership failures (orders, shops) |
| Payment Data | Card data never touches the server — Stripe Elements + PaymentIntent |
| Webhook Authenticity | Cryptographic signature verification, not session auth |
| Refund Authorization | `SUPER_ADMIN`-only, role check via `authorizeSuperAdmin` |
| GDPR | 30-day grace period + full anonymization job |

---

## Performance

| Optimization | Detail |
|---|---|
| Redis session cache | Reduces DB reads on every authenticated request (15-min TTL) |
| Composite DB indexes | `[shopId, status]`, `[userId, isRead]`, `[status, reservationExpiresAt]`, etc. |
| Parallel queries | `Promise.all` for count + data on list endpoints, and for stock decrement/restore |
| Atomic stock operations | `updateMany` + conditional guard, not read-then-write — prevents overselling under concurrent checkout |
| Async job processing | BullMQ for email, image cleanup, GDPR purge, order expiration, notifications |
| Separate worker process | Background jobs never share an event loop with the API server |
| Direct-to-CDN uploads | Cloudinary signed uploads bypass server |
| Decimal-safe prices | String-based input prevents floating-point drift |
| Reservation sweep fallback | Guards against lost BullMQ jobs on Redis restart without persistence |

---

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   ├── db.ts           # Prisma client
│   │   ├── env.ts          # Environment validation (Zod)
│   │   ├── cors.ts         # CORS configuration
│   │   └── logger.ts       # Pino logger setup
│   │
│   ├── features/
│   │   ├── auth/           # Authentication module
│   │   ├── users/          # User management module
│   │   ├── shop/           # Shop/tenant module
│   │   ├── product/        # Product module
│   │   ├── cart/           # Cart module
│   │   ├── orders/         # Order module
│   │   ├── payment/        # Payment module (Stripe + webhooks + refunds)
│   │   ├── notification/   # Notification module
│   │   └── uploads/        # Shared upload signatures
│   │
│   ├── infrastructure/
│   │   ├── cache/          # Redis client + session helpers
│   │   ├── queue/          # BullMQ queues + workers + expiration/sweep logic
│   │   └── storage/        # Cloudinary client
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── authorizeShopAccess.middleware.ts
│   │   ├── authorizeSuperAdmin.middleware.ts
│   │   ├── errorHandler.middleware.ts
│   │   ├── validate.middleware.ts
│   │   ├── rateLimiter.middleware.ts
│   │   ├── httpLogger.middleware.ts
│   │   └── notFound.ts
│   │
│   ├── services/
│   │   ├── token.service.ts    # JWT helpers
│   │   └── email.templates.ts  # Branded HTML email templates
│   │
│   ├── types/
│   │   ├── auth.types.ts
│   │   └── express.d.ts        # req.user / req.shop type augmentation
│   │
│   ├── utils/
│   │   ├── asyncHandler.ts
│   │   ├── generateSlug.ts
│   │   ├── parseDevice.ts
│   │   └── cloudinaryHelper.ts
│   │
│   ├── app.ts               # Express app setup (webhook mounted pre-JSON-parser)
│   ├── server.ts            # API entry point
│   └── worker.ts            # Background worker entry point (separate process)
│
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Migration history
│
├── .env.example
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

---

## Roadmap

### ✅ Completed
- Authentication system (register, login, logout, refresh, email verify, password reset)
- User management (profile, password, sessions, account lifecycle)
- Shop module (create, profile, status, close, public view)
- Product module (CRUD, status lifecycle, images, variants, public browse)
- Cart module (multi-shop cart, stock validation)
- Order module (checkout, cancellation, shop-side management, reservation TTL + expiration worker + sweep fallback)
- Payment module (Stripe PaymentIntent + Elements, webhook signature verification, atomic idempotent webhook processing, admin-gated refunds)
- Notification module (in-app + email, per-category/per-channel preferences, branded HTML templates, wired into order/payment lifecycle events)
- Shared upload signature module (user avatars, shop assets, product images)
- Structured logging with Pino + request IDs

### 🔧 Known Gaps (deliberate, tracked)
- Refunds do not automatically restore stock — pending a dedicated restock/inventory-reconciliation flow
- `DELIVERED` status is shop-confirmed only (v1 scope); customer- or carrier-confirmed delivery planned once the Review module needs a trustworthy delivery signal
- Role changes are subject to up to a 15-minute Redis session cache staleness window; explicit session invalidation on role change planned alongside the Admin module
- Multi-shop cart checkout currently rolls back *all* shops' orders if any single shop's stock guard fails — per-shop independent success/failure not yet decided

### 📋 Planned
- Employee module (shop staff with role-based permissions — `ShopEmployee` model already scaffolded)
- Review module (product reviews with shop owner replies)
- Coupon module (percentage, fixed, free shipping — schema scaffolded, unused)
- Admin module (platform-wide user/shop management, role promotion with session invalidation)
- Frontend (React + Vite + Stripe Elements) — in progress, parallel to backend hardening
- Search (Postgres full-text search with filters)
- Analytics dashboard (shop revenue, visits, conversions)
- Real-time notifications (Socket.io) — deferred until a frontend dashboard exists to consume it
- Docker containerization
- CI/CD pipeline (GitHub Actions)
- Load testing (k6)
- OpenAPI/Swagger documentation

---

## Contributing

This is a solo learning project built with mentorship. Not accepting external contributions at this time.

---

## License

MIT
