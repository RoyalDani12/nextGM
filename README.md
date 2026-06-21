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

- **Customers** to browse shops, discover products, and place orders
- **Shop Owners** to create and manage their storefront, products, employees, and orders
- **Super Admins** to manage the entire platform — users, shops, moderation

Built with production concerns in mind: tenant isolation, race condition prevention, GDPR compliance, structured logging, background job processing, and CDN-backed file uploads.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (React/Vite)                   │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────┐
│                   EXPRESS API SERVER                     │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │   Auth   │  │   User   │  │   Shop   │  │Product │  │
│  │  Module  │  │  Module  │  │  Module  │  │ Module │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Middleware Layer                     │   │
│  │  authenticate │ authorizeRoles │ validate │ rateLimit│
│  └──────────────────────────────────────────────────┘   │
└──────┬──────────────┬───────────────┬───────────────────┘
       │              │               │
┌──────▼──────┐ ┌─────▼──────┐ ┌────▼────────┐
│  PostgreSQL  │ │   Redis    │ │  Cloudinary │
│  (Prisma)   │ │  (Cache +  │ │   (Media)   │
│             │ │   Queue)   │ │             │
└─────────────┘ └────────────┘ └─────────────┘
                      │
               ┌──────▼──────┐
               │  BullMQ     │
               │  (Workers)  │
               │  Email      │
               │  Image      │
               │  GDPR Purge │
               └─────────────┘
```

### Multi-Tenancy Model

Each **Shop** is a tenant. Data isolation is enforced at the application layer — every query is scoped by `shopId`. Tenant A can never access Tenant B's products, orders, or customer data.

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js + TypeScript | Runtime + type safety |
| Express.js | HTTP framework |
| Prisma ORM | Database access + migrations |
| PostgreSQL | Primary database |
| Redis | Session cache + rate limiting |
| BullMQ | Background job processing |
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
| React Query | Server state management |
| Zustand | Client state management |

---

## Features

### Authentication & Security
- JWT access tokens (15 min) + refresh token rotation (7 days)
- bcrypt password hashing (cost factor 12)
- Email verification on registration
- Password reset via secure time-limited tokens
- Immediate token invalidation on password change (`passwordChangedAt` pattern)
- Device session management (view, revoke single, revoke all)
- Device fingerprinting (IP address, user agent, parsed device name)
- Per-device session limits (configurable, oldest evicted)
- Rate limiting on all sensitive endpoints (Redis-backed, multi-server safe)
- Signed Cloudinary uploads (server never processes file bytes)

### User Management
- Full profile management (name, avatar, phone, address)
- Account lifecycle: active → deactivated → reactivated → deleted
- GDPR-compliant permanent deletion with 30-day anonymization queue
- Redis-backed session caching with DB fallback
- Notification preferences

### Shop Module (Multi-Tenant Core)
- Shop creation with auto-generated unique slugs
- Two-step onboarding: create shell → complete profile
- Shop status machine: PENDING → ACTIVE ↔ PAUSED / SUSPENDED / CLOSED
- Owner-controlled pause/activate with admin-only suspension
- Soft delete with product archival cascade
- Shared Cloudinary upload signatures for logo/banner

### Product Module
- Full product lifecycle: DRAFT → ACTIVE ↔ ARCHIVED
- Per-shop slug + SKU uniqueness (not global)
- Category tree support (nested parent/child categories)
- Product variants (size, color, etc.) with individual pricing + stock
- Multi-image support with primary image management
- Decimal-safe price handling (string-based, no floating-point drift)
- Public browse with search, filters, price range, pagination
- Race condition-safe stock management (SELECT FOR UPDATE)

### Background Jobs (BullMQ)
- Email queue: verification, password reset, deletion notifications
- Image cleanup queue: async Cloudinary deletion on avatar/logo change
- GDPR purge queue: 30-day delayed anonymization after account deletion

---

## Getting Started

### Prerequisites

```bash
Node.js >= 18
PostgreSQL >= 14
Redis >= 7
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

# Start development server
npm run dev
```

### Running In Production

```bash
npm run build
npm start
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
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

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

# Device Limits
DEVICE_LIMIT=5

# Frontend
CLIENT_URL=http://localhost:3000
```

---

## API Documentation

Base URL: `http://localhost:5000/api`

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
| GET | `/users/me/upload-signature` | Get avatar upload signature | Required |

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
| GET | `/products` | Browse all products | Public |
| GET | `/products/:id` | Product detail | Public |

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
  │     │                │         └── ShippingAddress
  │     │                ├── Coupon
  │     │                └── ShopEmployee
  │     │
  ├── Order (as customer)
  ├── Review
  ├── Notification
  └── AuditLog
```

### Key Design Decisions

```
Multi-tenancy:    shopId scoped queries everywhere
Soft deletes:     deletedAt DateTime? on User, Shop, Product, Order
Idempotency:      idempotencyKey @unique on Order and Payment
Decimal prices:   Prisma Decimal type, accepted as strings in API
Audit trail:      AuditLog table tracks CREATE/UPDATE/DELETE/LOGIN
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
| Password Change | Immediate token invalidation via passwordChangedAt |
| File Upload | Signed Cloudinary uploads, server never touches bytes |
| Input Validation | Zod schemas on every endpoint |
| Tenant Isolation | shopId enforced on every shop-scoped query |
| GDPR | 30-day grace period + full anonymization job |

---

## Performance

| Optimization | Detail |
|---|---|
| Redis session cache | Reduces DB reads on every authenticated request |
| Composite DB indexes | `[shopId, status]`, `[userId, isRead]` etc. |
| Parallel queries | `Promise.all` for count + data on list endpoints |
| Async job processing | BullMQ for email, image cleanup, GDPR purge |
| Direct-to-CDN uploads | Cloudinary signed uploads bypass server |
| Decimal-safe prices | String-based input prevents floating-point drift |

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
│   │   └── uploads/        # Shared upload signatures
│   │
│   ├── infrastructure/
│   │   ├── cache/          # Redis client + session helpers
│   │   ├── queue/          # BullMQ queues + workers
│   │   └── storage/        # Cloudinary client
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── errorHandler.middleware.ts
│   │   ├── validate.middleware.ts
│   │   ├── rateLimiter.middleware.ts
│   │   ├── httpLogger.middleware.ts
│   │   └── notFound.ts
│   │
│   ├── services/
│   │   ├── token.service.ts    # JWT helpers
│   │   └── email.templates.ts  # Email HTML templates
│   │
│   ├── types/
│   │   ├── auth.types.ts
│   │   └── express.d.ts        # req.user type augmentation
│   │
│   ├── utils/
│   │   ├── asyncHandler.ts
│   │   ├── generateSlug.ts
│   │   ├── parseDevice.ts
│   │   └── cloudinaryHelper.ts
│   │
│   ├── app.ts              # Express app setup
│   └── server.ts           # Entry point
│
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Migration history
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
- Product module (CRUD, status lifecycle, images, public browse)
- Shared upload signature module (user avatars, shop assets, product images)
- Structured logging with Pino + request IDs

### 🔧 In Progress
- Order module

### 📋 Planned
- Order module (place, track, cancel, status history)
- Payment module (Stripe integration, webhooks, refunds)
- Notification module (in-app, email, preferences)
- Employee module (shop staff with role-based permissions)
- Review module (product reviews with shop owner replies)
- Coupon module (percentage, fixed, free shipping)
- Admin module (platform-wide user/shop management)
- Search (Postgres full-text search with filters)
- Analytics dashboard (shop revenue, visits, conversions)
- Webhook system (shops subscribe to order events)
- API versioning (/api/v1/)
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
