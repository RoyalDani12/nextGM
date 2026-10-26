# Nexions — Multi-Tenant SaaS E-Commerce Platform

> A production-grade, full-stack multi-tenant e-commerce marketplace platform built with **Node.js + TypeScript** (backend) and **React + Vite** (frontend). Modeled on the Amazon architecture — many independent sellers, one shared customer base, one unified checkout, and automatic payment settlement across shops.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Feature Status](#feature-status)
  - [✅ Completed Features](#-completed-features)
  - [🚧 In Progress / Partially Built](#-in-progress--partially-built)
  - [📋 Planned Features](#-planned-features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Security](#security)
- [Contributing](#contributing)

---

## Overview

Nexions is a full-featured multi-tenant e-commerce SaaS platform enabling:

- 🛍️ **Customers** — Browse a unified marketplace, add items from multiple independent shops into one cart, complete a **single checkout** via Stripe, and have funds automatically split and settled to each shop's wallet
- 🏪 **Shop Owners** — Manage their storefront, branding, products, orders, discounts, reviews, payout settings, and withdraw earnings directly to their bank account via Stripe Connect
- 🛡️ **Super Admins** — Full platform governance including user management, shop approval/suspension, category taxonomy management, review moderation, and refund processing

Built with production concerns in mind: multi-tenant data isolation, race-condition-safe inventory, atomic payment/webhook processing, reservation-based stock management, GDPR compliance hooks, structured logging, background job processing, and Stripe Connect payouts.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              CLIENT (React + Vite + TypeScript)              │
│  Marketplace · Shop Dashboard · Super Admin · Customer Portal│
└───────────────────────────┬─────────────────────────────────┘
                             │ HTTPS / REST
┌───────────────────────────▼─────────────────────────────────┐
│                    EXPRESS API SERVER                        │
│                                                              │
│  auth  │  users  │  shops  │  products  │  cart  │  orders  │
│  payment  │  payouts  │  engagement  │  coupon  │  admin    │
│  category  │  notification  │  uploads                      │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Middleware: authenticate │ authorizeShopAccess         │  │
│  │ validate (Zod) │ rateLimiter │ httpLogger              │  │
│  └────────────────────────────────────────────────────────┘  │
└──────┬─────────────┬────────────────┬──────────┬────────────┘
       │             │                │          │
┌──────▼──────┐ ┌────▼───────┐ ┌──────▼──────┐ ┌▼───────────┐
│ PostgreSQL  │ │   Redis    │ │ Cloudinary  │ │   Stripe   │
│  (Prisma)   │ │ Cache +    │ │   Media     │ │ PaymentInt │
│             │ │ BullMQ     │ │   CDN       │ │ Connect +  │
└─────────────┘ └────┬───────┘ └─────────────┘ │ Webhooks   │
                     │                          └────────────┘
              ┌──────▼──────┐
              │   BullMQ    │
              │  Workers    │
              │  ─ Email    │
              │  ─ Image    │
              │  ─ GDPR     │
              │  ─ Expiry   │
              │  ─ Notif.   │
              └─────────────┘
```

### Multi-Tenancy Model

Each **Shop** is an isolated tenant. Data isolation is enforced at the application layer — every query scoped to `shopId`. The `authorizeShopAccess` middleware verifies `shop.ownerId === req.user.id` before any shop-scoped operation, and returns `404` (not `403`) to prevent shop enumeration attacks.

### Unified Checkout & Automatic Settlement

When a customer checks out with items from multiple shops:

1. A single `Checkout` record groups all per-shop `Order` records
2. One Stripe `PaymentIntent` is created for the full cart total
3. On `payment_intent.succeeded` webhook — atomically:
   - All child Orders are confirmed
   - **90%** of each Order's total is credited to the respective `ShopWallet`
   - **10%** of each Order's total is credited to the `PlatformWallet` as commission

```
Customer pays $500 once
         │
         ▼ Stripe PaymentIntent
         │ webhook: payment_intent.succeeded
    ┌────▼────────────────┐
    │   ATOMIC SETTLEMENT  │
    └──────────┬───────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
 Shop A     Shop B     PlatformWallet
  $180       $270          $50
 (90%)      (90%)         (10%)
```

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js 18+ + TypeScript | Runtime + type safety |
| Express.js | HTTP server framework |
| Prisma ORM | Type-safe database access + schema migrations |
| PostgreSQL 14+ | Primary relational database |
| Redis 7+ | Session cache · rate limiting · BullMQ message broker |
| BullMQ | Background job queues (separate worker process) |
| Stripe API + Connect | Payment processing · PaymentIntents · webhooks · Express onboarding |
| Pino | Structured JSON logging with request IDs |
| Zod | Runtime input validation on every endpoint |
| JWT | Stateless access tokens (15 min) + refresh token rotation |
| bcrypt | Password hashing |
| Cloudinary | Signed media uploads + CDN delivery |
| Nodemailer | Transactional email (verify, reset, order, notifications) |
| Swagger / OpenAPI | Auto-generated API documentation |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | SPA framework + dev server |
| TypeScript | End-to-end type safety |
| TailwindCSS v4 | Utility-first styling |
| shadcn/ui + Radix UI | Accessible component primitives |
| Stripe Elements | Embedded card capture (card data never hits the server) |
| TanStack React Query v5 | Server state management + caching |
| Zustand | Client-side auth state |
| React Router v6 | Client-side routing |
| Recharts | Data visualization (analytics dashboards) |
| Zod | Client-side form validation |

---

## Feature Status

### ✅ Completed Features

#### 🔐 Authentication & Security
- [x] JWT access tokens (15 min) + HttpOnly cookie refresh token rotation (7 days)
- [x] bcrypt password hashing
- [x] Email verification on registration (BullMQ email queue)
- [x] Password reset via secure time-limited tokens
- [x] Immediate token invalidation on password change (`passwordChangedAt` pattern)
- [x] Multi-device session management (view active sessions, revoke single, revoke all)
- [x] Redis-backed session caching with DB fallback on cache miss
- [x] Rate limiting on all sensitive endpoints (Redis-backed, horizontally scalable)
- [x] Role-based access: `CUSTOMER`, `SHOP_OWNER`, `SHOP_EMPLOYEE`, `SUPER_ADMIN`
- [x] Helmet.js security headers + CORS configuration

#### 👤 User Management
- [x] User profile management (name, bio, avatar upload via Cloudinary)
- [x] Password change with session invalidation
- [x] Account deactivation and 30-day GDPR anonymization queue
- [x] Account settings page (avatar, name, email display, device sessions)

#### 🏪 Shop Module (Multi-Tenant Core)
- [x] Shop creation with auto-generated unique slugs + role promotion (`CUSTOMER → SHOP_OWNER`)
- [x] Status machine: `PENDING → ACTIVE ↔ PAUSED → CLOSED / SUSPENDED`
- [x] 8-point backend publishing readiness checklist (verified before going live)
- [x] One-click publish: shop promoted from PENDING to ACTIVE when all checks pass
- [x] **Shop Settings Page** — 5-tab management interface:
  - Branding & Profile (logo/banner Cloudinary upload, store name, description)
  - Contact & Location (email, phone, address, city, country, website)
  - Legal & Compliance (Business Name, Tax ID/EIN, Entity Type)
  - Publishing Readiness (live 8-point checklist with "Publish Now" button)
  - Status & Danger Zone (pause/activate toggle, permanent closure dialog)
- [x] `authorizeShopAccess` middleware (enumeration-safe `404` on unauthorized access)
- [x] Shop selection UI when owner has multiple shops

#### 📦 Product Module
- [x] Full product lifecycle: `DRAFT → ACTIVE ↔ ARCHIVED` with soft-delete
- [x] Product variants (size, color, etc.) with individual stock counts and pricing
- [x] Multi-image support with primary image designation
- [x] Atomic, race-condition-safe stock decrement (SELECT FOR UPDATE pattern)
- [x] Public catalog with search, category filtering, product type, price range, stock availability, verified shop, and minimum rating filters
- [x] Server-calculated average rating and review count on catalog items
- [x] Sort by rating, price, name, or recency

#### 🛒 Cart Module
- [x] Multi-shop cart — items from different shops in one unified cart
- [x] Cart grouped by shop in UI (for UX clarity)
- [x] Stock and availability validation before checkout
- [x] Auto-creation on first item add, quantity upsert, item removal, full clear

#### 🛍️ Marketplace & Customer Experience
- [x] Unified marketplace homepage with search, filters, category browsing
- [x] Product detail view with image gallery, variant selector, add-to-cart, add-to-wishlist
- [x] Category mega-menu with hierarchical navigation (platform categories)
- [x] Filter sidebar (price range, rating, in-stock, verified shops, product type)
- [x] Mobile filter sheet with responsive design
- [x] Hero carousel + promotional banners
- [x] Wishlist (add/remove from any page, persistent, accessible without login fallback)

#### 💳 Checkout & Payment
- [x] Unified single-payment checkout for multi-shop cart
- [x] Atomic `Checkout` record creating all per-shop `Order` records in one transaction
- [x] Stripe `PaymentIntent` creation with currency and amount validation
- [x] Stripe Elements embedded card capture (PCI-compliant, card data never hits server)
- [x] Coupon/discount application at checkout (fixed amount and percentage types)
- [x] Shipping method selection per shop (Standard / Express / Store Pickup)
- [x] Order confirmation page with summary after successful payment
- [x] Stripe webhook handler: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `account.updated`
- [x] Atomic webhook idempotency (insert + state machine update in single DB transaction)

#### 💰 Wallet & Automatic Settlement
- [x] `ShopWallet`: auto-credited with **90%** of each order total on webhook confirmation
- [x] `PlatformWallet`: auto-credited with **10%** commission on every order
- [x] Full `WalletTransaction` audit trail for every credit and debit

#### 💸 Stripe Connect & Payouts
- [x] Shop owners onboard via Stripe Express (bank account + identity verification)
- [x] `payoutsEnabled` flag auto-updated via `account.updated` Stripe webhook
- [x] Atomic withdrawal: wallet debited only if Stripe Transfer succeeds
- [x] Full payout dashboard UI (wallet balance, Stripe Connect status, withdrawal history, withdraw button)

#### 📦 Order Management
- [x] Customer order history list with metric cards (total orders, delivered count, total spent)
- [x] Status filter tabs (All / Active / Delivered / Cancelled) + search by order ID or store name
- [x] Order detail page with 4-step delivery progress stepper (Placed → Confirmed → Shipped → Delivered)
- [x] Customer-initiated order cancellation with automatic stock restoration
- [x] Shop-side order management: status transitions (`PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED`)
- [x] Tracking number and carrier info input for shipping updates
- [x] **Reservation TTL system**: unpaid orders auto-expire via BullMQ (default 15 min) + periodic orphan sweep
- [x] Redesigned order pages with professional UI/UX (metric cards, status pills, thumbnail previews, 1-click copy order ID)

#### 🏷️ Coupon & Discounts
- [x] Coupon creation: fixed amount (`FIXED_AMOUNT`) and percentage (`PERCENTAGE`) types
- [x] Expiry date, minimum order amount, and maximum discount cap
- [x] Per-shop coupon management (create, list, activate/deactivate, delete)
- [x] Coupon validation at checkout with server-side enforcement
- [x] Coupon savings badge shown on order history and order details

#### ⭐ Reviews & Ratings
- [x] Customer product reviews (purchase-verified — only available after order `DELIVERED`)
- [x] Star rating (1–5) with optional comment text
- [x] Review upsert (edit your review later)
- [x] Shop owner review management dashboard (filter by rating, reply status, search)
- [x] Shop owner reply to reviews (create / update / delete reply)
- [x] Super admin review visibility toggle (hide/show)
- [x] Public review listing on product detail pages
- [x] Rating distribution stats and average rating in shop review dashboard

#### 🗂️ Categories (Platform-Wide)
- [x] Hierarchical category taxonomy (parent → children tree)
- [x] Category management in super admin panel (create, edit, delete)
- [x] Category-aware product creation and catalog filtering
- [x] Category mega-menu in marketplace navbar (desktop + mobile)
- [x] Featured categories and category image/icon support

#### 🛡️ Super Admin Module
- [x] Admin dashboard home
- [x] User management (list all users, view user detail, account status management)
- [x] Shop management (list all shops, shop detail view, shop approval/moderation)
- [x] Category taxonomy management (CRUD for platform-wide categories)
- [x] Review moderation (visibility toggle, list all reviews)
- [x] Admin-initiated Stripe refunds

#### 🔔 In-App Notification Center & Transactional Emails
- [x] Full REST API endpoints (`GET /notifications`, `GET /notifications/unread-count`, `PATCH /:id/read`, `PATCH /read-all`, `DELETE /:id`)
- [x] Reusable `NotificationDropdown` with animated unread counter, category badges, relative time, and smart deep-linking
- [x] Live notification bell integrated into **Shop Owner Dashboard**, **Customer Marketplace**, and **Super Admin Header**
- [x] Account Notification & Email Preferences management (`orderUpdates`, `promotions`, `reviews`, `emailEnabled`)
- [x] Automated notification triggers: Order placed (customer + merchant), shipped, delivered, cancelled, and reviews/replies
- [x] `Notification` & `NotificationPreference` Prisma models
- [x] `notificationQueue` (BullMQ): async in-app record creation + branded transactional email hand-off
- [x] Professional responsive HTML email templates (`renderOrderPlacedEmail`, `renderGenericNotificationEmail`)

#### ⚙️ Background Jobs (BullMQ Worker Process)
- [x] Email queue: verification, password reset, transactional order/payment notifications
- [x] Image cleanup queue: async Cloudinary deletion on product/shop image removal
- [x] GDPR purge queue: 30-day delayed full anonymization job
- [x] Order expiration queue: reservation TTL enforcement + periodic orphan cleanup sweep
- [x] Notification queue: in-app record creation + email hand-off

#### 📁 Media Uploads
- [x] Server-signed Cloudinary uploads (signature generated server-side, upload direct from client)
- [x] Upload types: `user_avatar`, `shop_logo`, `shop_banner`, `product_image`
- [x] Async cleanup on image replacement/deletion via BullMQ

---

### 🚧 In Progress / Partially Built

#### 📊 Shop Analytics Dashboard
- **Route**: `/dashboard/shop/:shopId/analytics` → currently renders `<div>Analytics Page</div>` placeholder
- **Backend**: ✅ `ShopAnalytics` and `ProductAnalytics` Prisma models exist; no aggregation endpoint yet
- **Frontend**: ✅ `recharts` already installed in `client/package.json`
- **Missing**: `GET /api/v1/shops/:shopId/analytics` endpoint · Revenue over time area chart · Orders bar chart · AOV metric cards · Top 5 selling products table

#### 👥 Shop Employee Module
- **Route**: `/employee` → currently renders `<div>Employee Dashboard</div>` placeholder
- **Backend**: ✅ `ShopEmployee`, `ShopEmployeeRole` Prisma models exist; no employee CRUD endpoints
- **Frontend**: ❌ No employee management UI built
- **Missing**: Staff invite by email · Role assignment (MANAGER / STAFF) · Employee dashboard view

---

### 📋 Planned Features

#### 🔔 Real-Time Notifications (WebSockets)
- Socket.io integration for push notifications without page refresh
- Live order status updates in customer and shop dashboards
- Unread notification count badge update without polling

#### 📊 Shop Analytics Dashboard (Complete)
- Backend analytics aggregation endpoint
- Revenue trend area chart (daily/weekly/monthly)
- Order volume bar chart
- Average Order Value (AOV) metric card
- Top 5 best-selling products table
- Customer growth and retention metrics

#### 👥 Shop Employee Management (Complete)
- Staff invitation via email with role assignment
- Employees can view and manage orders on behalf of shop owner
- Permission-based access (`MANAGER` vs `STAFF`)
- Employee dashboard with restricted product/order access

#### 🔍 Advanced Marketplace Search
- Dedicated `/search` page with full URL-state-driven filters
- Debounced instant search with suggestions
- Recent searches history (localStorage)
- Price histogram slider
- Combined filters with clear-all chip bar

#### 📱 Progressive Web App (PWA)
- Service worker for offline product catalog browsing
- Push notification support (order shipped, delivered)
- App manifest + install prompt

#### 🐳 Docker & Production Infrastructure
- Multi-container `docker-compose.yml` (API server · PostgreSQL · Redis · BullMQ worker)
- Production `Dockerfile` with multi-stage build
- Health check endpoints for load balancer readiness probes
- Environment-specific configuration management

#### 🚀 CI/CD Pipeline
- GitHub Actions workflow for automated TypeScript checks, linting, and testing
- Automated Docker image build and push on merge to `main`
- Prisma migration safety checks before deploy

#### 🧪 Testing Suite
- Unit tests for service layer (auth, order settlement, wallet logic)
- Integration tests for API endpoints (checkout flow, webhook handler)
- E2E smoke tests for critical paths (register → purchase → payout)

#### 🌐 Internationalization (i18n)
- Multi-language support for marketplace UI
- RTL layout support

---

## Project Structure

```
nexions/
├── server/
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/          # JWT, refresh tokens, email verify, password reset
│   │   │   ├── users/         # Profile, sessions, GDPR, account lifecycle
│   │   │   ├── shop/          # Multi-tenant shop management, settings, wallet
│   │   │   ├── product/       # Products, variants, images, status, public catalog
│   │   │   ├── cart/          # Multi-shop cart, stock validation
│   │   │   ├── orders/        # Checkout, order lifecycle, cancellation, TTL
│   │   │   ├── payment/       # Stripe PaymentIntents, webhooks, settlement, refunds
│   │   │   ├── payouts/       # Stripe Connect onboarding, atomic bank transfers
│   │   │   ├── coupon/        # Discount codes, validation, shop management
│   │   │   ├── engagement/    # Reviews (CRUD, replies), Wishlist (add/remove/list)
│   │   │   ├── category/      # Platform-wide hierarchical categories
│   │   │   ├── notification/  # In-app notification records + preference management
│   │   │   ├── admin/         # Super admin: users, shops, refunds governance
│   │   │   └── uploads/       # Server-signed Cloudinary upload signatures
│   │   ├── infrastructure/
│   │   │   ├── cache/         # Redis client
│   │   │   └── queue/         # BullMQ queues + workers (email, image, GDPR, expiry, notif)
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── authorizeShopAccess.middleware.ts
│   │   │   ├── validate.middleware.ts
│   │   │   ├── rateLimiter.middleware.ts
│   │   │   └── errorHandler.middleware.ts
│   │   ├── services/          # JWT, email templates, token service
│   │   ├── config/            # DB, logger, Swagger, CORS
│   │   ├── app.ts             # Express app setup
│   │   ├── server.ts          # HTTP server entry point
│   │   └── worker.ts          # BullMQ worker process entry point
│   └── prisma/
│       └── schema.prisma      # Full 50+ model schema
│
└── client/
    └── src/
        ├── features/
        │   ├── auth/          # Login, Register, VerifyEmail, ForgotPassword, ResetPassword
        │   ├── users/         # Account Settings (avatar, password, sessions)
        │   ├── marketplace/   # Home, Hero, ProductDetailView, Navbar, Filters, Wishlist
        │   ├── shop/          # Dashboard, DashboardHome, ShopSettingsPage, Payouts, Reviews
        │   │   ├── components/    # ShopDetail, ShopProfileEditDialog, CloseShopDialog, ShopStatusToggle
        │   │   └── payouts/       # PayoutDashboard, hooks, API
        │   ├── product/       # ProductPage (owner), ProductDetailPage (owner)
        │   ├── cart/          # CartPage, cart hooks
        │   ├── order/         # CheckoutPage, OrderConfirmationPage
        │   ├── payment/       # PaymentPage (Stripe Elements)
        │   ├── customer/      # CustomerOrder, CustomerOrderDetailPage, WishlistPage
        │   ├── admin/         # Admin API + hooks (used by super admin pages)
        │   └── pages/
        │       └── superAdmin/  # AdminHome, Users, Shops, Categories, Reviews, Layout
        ├── components/ui/     # shadcn/ui component library
        ├── store/             # Zustand auth store
        ├── lib/               # Axios instance
        └── routes/
            ├── AppRoutes.tsx
            ├── ProtectedRoute.tsx
            └── RoleRedirect.tsx
```

---

## Getting Started

### Prerequisites

```bash
Node.js >= 18.0.0
PostgreSQL >= 14
Redis >= 7
Stripe CLI (for local webhook testing)
```

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/RoyalDani12/nxeio_project_v_01.git
cd nxeio_project_v_01

# 2. Server setup
cd server
npm install
cp .env.example .env
# Fill in your environment values (see Environment Variables section below)
npx prisma migrate dev --name init
npx prisma generate

# 3. Start the API server
npm run dev

# 4. In a separate terminal — start the background worker process
npm run worker

# 5. In a separate terminal — forward Stripe webhooks to localhost
npx stripe listen --forward-to localhost:5000/api/v1/payment/webhooks/stripe

# 6. Client setup
cd ../client
npm install
cp .env.example .env
npm run dev
```

The app will be running at:
- **Client**: `http://localhost:5173`
- **API**: `http://localhost:5000`
- **Swagger Docs**: `http://localhost:5000/api-docs`

---

## Environment Variables

### Server (`server/.env`)

```env
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nexions_dev

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_jwt_secret_here_min_32_chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
DEVICE_LIMIT=5
ORDER_RESERVATION_TTL_MINUTES=15

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM="Nexions <noreply@nexions.com>"

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# CORS
CLIENT_URL=http://localhost:5173
```

### Client (`client/.env`)

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

---

## API Reference

> Full interactive documentation available at `http://localhost:5000/api-docs` (Swagger UI)

**Base URL**: `http://localhost:5000/api/v1`

### Authentication
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/register` | Register a new account | Public |
| POST | `/auth/login` | Login → returns access token + sets refresh cookie | Public |
| POST | `/auth/logout` | Logout current device (invalidate session) | Required |
| POST | `/auth/refresh-token` | Rotate refresh token → new access token | Cookie |
| POST | `/auth/verify-email` | Verify email with token from email | Public |
| POST | `/auth/forgot-password` | Send password reset email | Public |
| POST | `/auth/reset-password` | Reset password with secure token | Public |

### Shop Management
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/shops` | Create a new shop | Required |
| GET | `/shops/mine` | List owner's shops | Required |
| PUT | `/shops/:id/profile` | Update shop profile (name, description, logo, etc.) | Owner |
| PUT | `/shops/:shopId/legal-info` | Update legal info (business name, tax ID, entity type) | Owner |
| PATCH | `/shops/status/:id` | Pause or activate shop | Owner |
| PATCH | `/shops/:shopId/publish` | Publish PENDING shop to ACTIVE | Owner |
| GET | `/shops/:shopId/publish-readiness` | Get 8-point readiness checklist | Owner |
| GET | `/shops/:shopId/wallet` | Get wallet balance + transaction history | Owner |
| DELETE | `/shops/:id` | Close shop permanently | Owner |
| GET | `/shops/:slug` | Public shop storefront page | Public |

### Products
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/shops/:shopId/products` | Create a product | Owner |
| GET | `/shops/:shopId/products` | List shop products (owner view) | Owner |
| PUT | `/shops/:shopId/products/:id` | Update product details | Owner |
| PATCH | `/shops/:shopId/products/:id/status` | Publish or archive product | Owner |
| DELETE | `/shops/:shopId/products/:id` | Soft-delete product | Owner |
| GET | `/products` | Browse all active products (with filters) | Public |
| GET | `/products/:id` | Product detail | Public |

### Cart
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/cart` | View cart (grouped by shop) | Required |
| POST | `/cart/items` | Add item to cart | Required |
| PATCH | `/cart/items/:itemId` | Update item quantity | Required |
| DELETE | `/cart/items/:itemId` | Remove item from cart | Required |
| DELETE | `/cart` | Clear entire cart | Required |

### Orders & Checkout
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/orders/checkout` | Create Checkout + per-shop Orders from cart | Required |
| GET | `/orders` | Customer order history (paginated) | Required |
| GET | `/orders/:orderId` | Customer order detail | Required |
| POST | `/orders/:orderId/cancel` | Cancel a PENDING / CONFIRMED order | Required |
| GET | `/orders/:shopId/orders` | Shop order list (owner view) | Owner |
| GET | `/orders/:shopId/orders/:orderId` | Shop order detail (owner view) | Owner |
| PATCH | `/orders/:shopId/orders/:orderId/status` | Update order status + tracking info | Owner |

### Payment
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/payment/:checkoutId/intent` | Create or reuse Stripe PaymentIntent | Required |
| POST | `/payment/webhooks/stripe` | Stripe webhook receiver (raw body, signature-verified) | Webhook |
| POST | `/admin/orders/:orderId/refund` | Initiate refund | SUPER_ADMIN |

### Payouts (Stripe Connect)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/payouts/:shopId/status` | Wallet balance + Stripe Connect onboarding status | Owner |
| POST | `/payouts/:shopId/onboard` | Generate Stripe Express onboarding link | Owner |
| POST | `/payouts/:shopId/withdraw` | Withdraw wallet balance to bank account | Owner |

### Coupons
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/shops/:shopId/coupons` | Create a coupon | Owner |
| GET | `/shops/:shopId/coupons` | List shop coupons | Owner |
| PATCH | `/shops/:shopId/coupons/:id` | Update coupon | Owner |
| DELETE | `/shops/:shopId/coupons/:id` | Delete coupon | Owner |

### Reviews & Engagement
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/products/:productId/reviews` | Public product reviews | Public |
| POST | `/products/:productId/reviews` | Submit review (purchase-verified) | Required |
| DELETE | `/reviews/:reviewId` | Delete own review | Required |
| GET | `/shops/:shopId/reviews` | Shop review management list | Owner |
| POST | `/reviews/:reviewId/reply` | Reply to a customer review | Owner |
| DELETE | `/reviews/:reviewId/reply` | Delete review reply | Owner |
| PATCH | `/reviews/:reviewId/visibility` | Toggle review visibility | SUPER_ADMIN |

### Wishlist
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/wishlist` | Get user's wishlist | Required |
| POST | `/wishlist/:productId` | Add product to wishlist | Required |
| DELETE | `/wishlist/:productId` | Remove product from wishlist | Required |

### Categories
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/categories` | List all platform categories (tree) | Public |
| POST | `/categories` | Create category | SUPER_ADMIN |
| PUT | `/categories/:id` | Update category | SUPER_ADMIN |
| DELETE | `/categories/:id` | Delete category | SUPER_ADMIN |

### Notifications
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/notifications` | List user notifications (paginated, unread filter, shop filter) | Required |
| GET | `/notifications/unread-count` | Get fast count of unread notifications | Required |
| PATCH | `/notifications/:id/read` | Mark single notification as read | Required |
| PATCH | `/notifications/read-all` | Mark all notifications as read (optionally shop-scoped) | Required |
| DELETE | `/notifications/:id` | Delete a notification | Required |
| GET | `/notifications/preferences` | Get user notification & email channel settings | Required |
| PUT | `/notifications/preferences` | Update notification & email preferences | Required |

### Super Admin
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/admin/users` | List all users (paginated, searchable) | SUPER_ADMIN |
| GET | `/admin/users/:id` | User detail + activity | SUPER_ADMIN |
| PATCH | `/admin/users/:id/status` | Update user account status | SUPER_ADMIN |
| GET | `/admin/shops` | List all shops | SUPER_ADMIN |
| GET | `/admin/shops/:id` | Shop detail + owner info | SUPER_ADMIN |

---

## Database Schema

```
User ─────── UserProfile
  │
  ├── RefreshToken[]         (multi-device sessions)
  ├── ActivityLog[]          (login events, key actions)
  ├── AuditLog[]             (admin actions)
  ├── Notification[]         (in-app alerts)
  ├── NotificationPreference (per-category toggles)
  ├── WishlistItem[]
  ├── Review[]
  │
  ├── Shop[] ─────────────── ShopProfile
  │     │                 ├── ShopLegalInfo
  │     │                 ├── ShopWallet
  │     │                 │   └── WalletTransaction[]
  │     │                 ├── ShopEmployee[]
  │     │                 │   └── ShopEmployeeRole[]
  │     │                 ├── Product[] ─── ProductVariant[]
  │     │                 │             ├── ProductImage[]
  │     │                 │             └── ProductAnalytics[]
  │     │                 ├── Coupon[]
  │     │                 ├── Review[]
  │     │                 ├── ShopAnalytics[]
  │     │                 └── ShopMembership
  │     │
  ├── Checkout[] ─────────── Order[] ─── OrderItem[]
  │         │                       ├── ShippingAddress
  │         │                       ├── Shipment
  │         │                       └── OrderStatusHistory[]
  │         └── Payment
  │
  └── UserMembership

PlatformWallet
  └── PlatformWalletTransaction[]

WebhookEvent[]    (Stripe idempotency log — not user-scoped)
Category[]        (hierarchical, self-referential tree)
MembershipPlan[]
```

---

## Security

| Concern | Implementation |
|---|---|
| SQL Injection | Prisma parameterized queries — no raw SQL |
| XSS | `helmet.js` Content-Security-Policy headers |
| CSRF | `SameSite=Strict` cookies + CORS allow-list |
| Brute Force | Redis-backed rate limiting per IP (multi-server safe) |
| Token Theft | Short-lived JWTs (15 min) + HttpOnly refresh token rotation |
| File Upload | Server-signed Cloudinary upload signatures (client uploads direct) |
| Input Validation | Zod schemas on every API endpoint |
| Tenant Isolation | `shopId` scoped queries, `authorizeShopAccess` middleware (returns 404 not 403) |
| Payment Data | Card data never hits the server — Stripe Elements + PaymentIntent |
| Webhook Authenticity | Stripe signature verification (`stripe.webhooks.constructEvent`) |
| Payout Authorization | Shop owner ownership verified before every transfer |
| GDPR | 30-day grace period + full anonymization background job |
| Password Changes | All active sessions invalidated via `passwordChangedAt` JWT check |

---

## License

MIT

---

## Author

Built by [RoyalDani12](https://github.com/RoyalDani12)
