# NextG — Multi-Tenant E-Commerce SaaS Platform

A production-grade, multi-tenant e-commerce marketplace API built with Node.js, TypeScript, and PostgreSQL. Modeled on the Amazon architecture — many independent sellers, one shared customer base, one checkout, one payment split automatically across shops.

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

NextG is a full-featured multi-tenant e-commerce SaaS platform that enables:

- **Customers** to browse shops, add items from multiple shops to one cart, place all orders in a **single unified checkout**, and pay once via Stripe — the system automatically splits and settles funds to each shop
- **Shop Owners** to manage their storefront, products, orders, and **withdraw their earnings** directly to their bank account via Stripe Connect
- **Super Admins** to manage platform-wide concerns, including refunds

Built with production concerns in mind: tenant isolation, race condition prevention, atomic payment/webhook processing, reservation-based inventory management, GDPR compliance, structured logging, and background job processing.

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
│ ┌────────┐ ┌────────┐ ┌─────────┐ ┌──────────────────┐  │
│ │ Order  │ │Payment │ │ Payouts │ │  Notification    │  │
│ └────────┘ └────────┘ └─────────┘ └──────────────────┘  │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Middleware Layer                     │   │
│  │ authenticate │ authorizeShopAccess │ authorizeSuperAdmin │
│  │ validate │ rateLimit                              │   │
│  └──────────────────────────────────────────────────┘   │
└──────┬──────────────┬───────────────┬──────────┬────────┘
       │               │               │          │
┌──────▼──────┐ ┌──────▼─────┐ ┌──────▼──────┐ ┌─▼──────────┐
│ PostgreSQL  │ │   Redis    │ │ Cloudinary  │ │   Stripe   │
│  (Prisma)   │ │ (Cache +   │ │   (Media)   │ │ Payments + │
│             │ │  Queue)    │ │             │ │ Connect +  │
└─────────────┘ └────────────┘ └─────────────┘ │ Webhooks   │
                       │                        └────────────┘
                ┌──────▼──────┐
                │   BullMQ    │
                │  (Workers)  │
                │  Email      │
                │  Image      │
                │  GDPR Purge │
                │  Order Expiry│
                │  Notification│
                └─────────────┘
```

### Multi-Tenancy Model

Each **Shop** is a tenant. Data isolation is enforced at the application layer — every query is scoped by `shopId`. Tenant A can never access Tenant B's products, orders, or customer data. Shop-scoped access is enforced centrally via the `authorizeShopAccess` middleware, checking `Shop.ownerId` against the authenticated user.

### Unified Checkout & Automatic Settlement

When a customer checks out with items from multiple shops, the system:
1. Creates a single **Checkout** record grouping all per-shop Orders
2. Generates a single Stripe **PaymentIntent** for the full cart total
3. On `payment_intent.succeeded` webhook — atomically:
   - Confirms all child Orders
   - Credits **90%** of each Order's total to the respective **ShopWallet**
   - Credits **10%** of each Order's total to the **PlatformWallet** as commission

```
Customer pays $500 once
         │
         ▼
    Stripe PaymentIntent
         │
         ▼ (webhook: payment_intent.succeeded)
   ┌─────────────────────┐
   │   ATOMIC SETTLEMENT │
   └──────────┬──────────┘
              │
   ┌──────────┼──────────┐
   ▼          ▼          ▼
Shop A     Shop B     Shop C
 $180       $162       $108
(90%)      (90%)      (90%)
              +
         PlatformWallet
              $50
             (10%)
```

### Stripe Connect & Payouts

Shop owners connect a real bank account via **Stripe Express** onboarding. Once verified, they can withdraw their `ShopWallet` balance directly to their bank. The payout is atomic — the wallet is only debited if the Stripe Transfer succeeds.

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
| Stripe | Payment processing, Connect, PaymentIntents, webhooks, refunds |
| Pino | Structured JSON logging |
| Zod | Runtime input validation |
| JWT | Stateless authentication |
| bcrypt | Password hashing |
| Cloudinary | Media storage + CDN |
| Nodemailer | Transactional email |

### Frontend
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
- Redis-backed session caching, 15-minute TTL, DB fallback on cache miss
- Rate limiting on all sensitive endpoints (Redis-backed, multi-server safe)
- Role-based access: `CUSTOMER`, `SHOP_OWNER`, `SHOP_EMPLOYEE`, `SUPER_ADMIN`

### Unified Checkout
- **Single payment** for multi-shop cart — no more per-shop checkout loops
- Atomic Checkout record groups all per-shop Orders
- One Stripe PaymentIntent for the full cart total
- Automatic fund settlement on webhook confirmation

### Wallet & Settlement
- **ShopWallet**: credited automatically on every successful order (90% of order total)
- **PlatformWallet**: credited automatically with 10% commission on every order
- Full `WalletTransaction` audit trail for every credit/debit

### Stripe Connect & Payouts
- Shop owners onboard via Stripe Express (bank account, identity verification)
- `payoutsEnabled` flag set automatically via `account.updated` Stripe webhook
- Atomic withdrawal: wallet debited only if Stripe Transfer succeeds
- Payout dashboard in the shop owner UI

### Shop Module (Multi-Tenant Core)
- Shop creation with auto-generated unique slugs
- Status machine: PENDING → ACTIVE ↔ PAUSED / SUSPENDED / CLOSED
- Shop legal info (business name, tax ID, entity type)
- Centralized `authorizeShopAccess` middleware (404 on unauthorized — enumeration-safe)

### Product Module
- Full product lifecycle: DRAFT → ACTIVE ↔ ARCHIVED
- Product variants (size, color, etc.) with individual pricing + stock
- Multi-image support with primary image management
- Atomic, race-condition-safe stock decrement/restore
- Public catalog with search, category, product type, price, stock, verified-shop, and minimum-rating filters
- Server-calculated visible review count and average rating, with catalog sorting by rating, price, name, or recency

### Categories & Platform Administration
- Hierarchical platform categories with product counts, managed from the super-admin workspace
- Category-aware product creation and public catalog browsing
- Super-admin navigation for users, shops, categories, and shop moderation workflows
- Public browse with search, filters, price range, pagination

### Cart Module
- Multi-shop cart, grouped by shop
- Stock and availability validation before checkout
- Auto-creation on first add, quantity upsert

### Order Module
- Checkout: atomic per-shop order creation, price snapshot at time of purchase, immediate stock reservation
- Customer order history + detail (paginated, filterable)
- Customer-initiated cancellation, automatic stock restoration
- Shop-side order management with status transitions (`PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED`)
- **Reservation TTL system:** unpaid orders auto-expire (default 15 min) via BullMQ

### Shipping & Fulfillment
- Per-shop shipment records are created atomically during checkout
- Customers select **Standard**, **Express**, or **Store Pickup** for every shop in a multi-shop cart
- Shipping fee and delivery estimate are captured with the order, so later shop changes cannot alter an existing purchase
- Shop owners dispatch orders with carrier, tracking number, tracking link, and a delivery note
- Customers see a delivery estimate, shipment timeline, carrier details, and a safe external tracking link in their order details
- `ORDER_SHIPPED` and `ORDER_DELIVERED` updates are delivered in-app and by email, respecting notification preferences

### Payment Module
- Stripe PaymentIntent + Elements (card data never touches the server)
- Atomic webhook idempotency (insert + state update in single transaction)
- Handles `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `account.updated`
- Admin-initiated refunds (`SUPER_ADMIN`-gated)

### Notification Module
- In-app notifications + transactional email, delivered asynchronously via BullMQ
- Per-category user preferences and per-channel toggles
- Wired into order/payment lifecycle events

### Background Jobs (BullMQ — separate worker process)
- Email queue: verification, password reset, transactional notifications
- Image cleanup queue: async Cloudinary deletion
- GDPR purge queue: 30-day delayed anonymization
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
git clone https://github.com/yourusername/nextg.git

# Server
cd nextg/server
npm install
cp .env.example .env
# Fill in your values
npx prisma migrate dev
npm run dev

# In a separate terminal — start the background worker
npm run worker

# In a separate terminal — forward Stripe webhooks locally
npm run stripe:listen

# Client
cd ../client
npm install
cp .env.example .env
npm run dev
```

---

## Environment Variables

### Server (`server/.env`)
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/nextg
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_here
BCRYPT_ROUNDS=12
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@nextg.com
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
ORDER_RESERVATION_TTL_MINUTES=15
DEVICE_LIMIT=5
CLIENT_URL=http://localhost:5173
```

### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
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
| POST | `/auth/forgot-password` | Request password reset | Public |
| POST | `/auth/reset-password` | Reset password with token | Public |

### Order & Checkout Routes
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/orders/checkout` | Create Checkout + all Orders from cart | Required |
| GET | `/orders` | Customer order history | Required |
| GET | `/orders/:orderId` | Customer order detail | Required |
| POST | `/orders/:orderId/cancel` | Cancel a `PENDING`/`CONFIRMED` order | Required |

### Payment Routes
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/payment/:checkoutId/intent` | Create/reuse Stripe PaymentIntent for Checkout | Required |
| POST | `/payment/webhooks/stripe` | Stripe webhook receiver | Signature-verified |
| POST | `/admin/orders/:orderId/refund` | Initiate a refund | `SUPER_ADMIN` |

### Payout Routes (Shop Owners)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/payouts/:shopId/status` | Get wallet balance + Stripe Connect status | Owner |
| POST | `/payouts/:shopId/onboard` | Generate Stripe Express onboarding link | Owner |
| POST | `/payouts/:shopId/withdraw` | Withdraw funds to bank account | Owner |

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

---

## Database Schema

```
User ──────── UserProfile
  │
  ├── RefreshToken (sessions)
  ├── Shop (ownedShops) ──── ShopProfile
  │     │                ├── Product ──── ProductImage
  │     │                │           ├── ProductVariant
  │     │                ├── Order ──── OrderItem
  │     │                │         ├── ShippingAddress
  │     │                │         └── OrderStatusHistory
  │     │                ├── Coupon
  │     │                ├── ShopWallet  (stripeAccountId, balance, payoutsEnabled)
  │     │                └── WalletTransaction
  │     │
  ├── Checkout ──── Order[]  ←── groups all per-shop orders
  │         └── Payment      ←── one payment for the whole checkout
  │
  ├── PlatformWallet
  │         └── PlatformWalletTransaction
  │
  ├── Review
  ├── Notification
  └── AuditLog

WebhookEvent   (Stripe event idempotency log, not user-scoped)
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
| File Upload | Signed Cloudinary uploads |
| Input Validation | Zod schemas on every endpoint |
| Tenant Isolation | `shopId` enforced via `authorizeShopAccess` middleware |
| Payment Data | Card data never touches the server — Stripe Elements |
| Webhook Authenticity | Cryptographic signature verification |
| Payout Authorization | Shop owner verified before any transfer |
| GDPR | 30-day grace period + full anonymization job |

---

## Project Structure

```
nextg/
├── server/
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── shop/
│   │   │   ├── product/
│   │   │   ├── cart/
│   │   │   ├── orders/
│   │   │   ├── payment/       # Stripe PaymentIntents + webhooks + settlement
│   │   │   ├── payouts/       # Stripe Connect onboarding + withdrawals
│   │   │   ├── notification/
│   │   │   └── uploads/
│   │   ├── middleware/
│   │   ├── infrastructure/    # Redis, BullMQ, Cloudinary
│   │   ├── services/          # JWT, email templates
│   │   ├── utils/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   └── worker.ts
│   └── prisma/
│       └── schema.prisma
│
└── client/
    └── src/
        ├── api/               # Axios wrappers
        ├── features/
        │   ├── auth/
        │   ├── cart/
        │   ├── order/         # CheckoutPage, OrderConfirmationPage
        │   ├── payment/       # PaymentPage (Stripe Elements)
        │   ├── shop/
        │   │   └── payouts/   # PayoutDashboard, hooks
        │   └── customer/
        └── routes/
```

---

## Roadmap

### ✅ Completed
- Authentication system (register, login, logout, refresh, email verify, password reset)
- User management (profile, password, sessions, account lifecycle, GDPR)
- Shop module (create, profile, status lifecycle, public view)
- Product module (CRUD, status lifecycle, images, variants, public browse)
- Cart module (multi-shop cart, stock validation)
- Order module (checkout, cancellation, shop-side management, reservation TTL + expiration + sweep)
- **Unified Checkout** — single payment for multi-shop cart (Checkout model + one PaymentIntent)
- **Automatic Settlement** — atomic 90/10 split to ShopWallet + PlatformWallet on webhook
- **Stripe Connect & Payouts** — Express onboarding, payout dashboard, atomic bank transfers
- Notification module (in-app + email, per-category/per-channel preferences)
- Shared upload signatures (user avatars, shop assets, product images)
- Structured logging with Pino + request IDs

### 📋 Planned
- Product Reviews (with purchase verification)
- Coupon / Discount module (schema already scaffolded)
- Employee module (shop staff with role-based permissions)
- Admin module (platform-wide user/shop management)
- Analytics dashboard (shop revenue, visits, conversions)
- Real-time notifications (Socket.io)
- OpenAPI/Swagger documentation
- Docker containerization
- CI/CD pipeline (GitHub Actions)

---

## License

MIT
