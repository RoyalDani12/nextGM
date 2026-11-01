import { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { authDocs } from "../features/auth/auth.docs.js";
import { userDocs } from "../features/users/user.docs.js";
import { uploadDocs } from "../features/uploads/upload.docs.js";
import { shopDocs } from "../features/shop/shop.docs.js";
import { productDocs } from "../features/product/product.docs.js";
import { categoryDocs } from "../features/category/category.docs.js";
import { cartDocs } from "../features/cart/cart.docs.js";
import { orderDocs } from "../features/orders/orders.docs.js";
import { paymentDocs } from "../features/payment/payment.docs.js";
import { payoutDocs } from "../features/payouts/payout.docs.js";
import { couponDocs } from "../features/coupon/coupon.docs.js";
import { returnDocs } from "../features/returns/return.docs.js";
import { engagementDocs } from "../features/engagement/engagement.docs.js";
import { notificationDocs } from "../features/notification/notification.docs.js";
import { analyticsDocs } from "../features/analytics/analytics.docs.js";
import { supportDocs } from "../features/support/support.docs.js";
import { adminDocs } from "../features/admin/admin.docs.js";

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "NXEIO Core Multi-Vendor Platform API",
    version: "1.0.0",
    description: "Comprehensive production OpenAPI 3.0 documentation covering all modules across Authentication, Users & Sessions, Cloud Asset Uploads, Merchant Shops & KYC Verification, Products & Inventory, Categories, Shopping Cart, Orders & Logistics, Payments & Stripe Webhooks, Payouts & Stripe Connect, Coupons, Returns & RMA, Customer Engagement (Reviews & Wishlist), Notifications, Analytics, Customer Support & Helpdesk, and Super Admin Platform Operations.",
    contact: {
      name: "NXEIO Platform Engineering Team",
      email: "support@nxeio.com"
    }
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local Development Server"
    }
  ],
  tags: [
    { name: "Authentication", description: "Registration, email verification, login, Google OAuth SSO, tokens, and password recovery" },
    { name: "Users", description: "User profile, avatar uploads, password change, account lifecycle, and active login device sessions" },
    { name: "Uploads", description: "Direct Cloudinary asset signature generation (avatars, logos, banners, product photos, KYC ID cards, return evidence)" },
    { name: "Shops", description: "Merchant store creation, branding, legal business registration, KYC verification request, publishing readiness, and wallet" },
    { name: "Products", description: "Public marketplace product catalog, search & filtering, merchant listings, images, and multi-attribute variants" },
    { name: "Categories", description: "Public category hierarchy tree, flat list, and Super Admin category management" },
    { name: "Cart", description: "Shopping cart operations, line item quantities, and guest cart merging upon login" },
    { name: "Orders", description: "Multi-vendor checkout, customer order tracking, cancellation, and merchant shipping & fulfillment" },
    { name: "Payments", description: "Stripe PaymentIntents, automated webhook listeners, and platform ledger settlements" },
    { name: "Payouts", description: "Stripe Express Connect onboarding, capability status, and merchant direct bank withdrawals" },
    { name: "Coupons", description: "Merchant discount codes, percentage / fixed discounts, usage thresholds, and expiry" },
    { name: "Returns & RMA", description: "Customer return claims, evidence photo uploads, seller inspection, and return status workflow" },
    { name: "Engagement & Reviews", description: "Customer product reviews, verified purchase ratings, merchant replies, and personal wishlists" },
    { name: "Notifications", description: "In-app notifications feed, unread badge counts, mark-as-read actions, and channel preferences" },
    { name: "Analytics", description: "Merchant sales performance, GMV, orders velocity, delivery rates, and best-selling product rankings" },
    { name: "Support & Helpdesk", description: "Customer and guest support ticket inquiries, customer message thread, and administrative resolution" },
    { name: "Super Admin - Platform Operations", description: "High-level platform KPI statistics, GMV volume, and 10% platform commission revenue" },
    { name: "Super Admin - Users", description: "Administrative user accounts management, roles, status changes, password resets, and impersonation" },
    { name: "Super Admin - Shops & KYC", description: "Merchant store approvals, suspensions, KYC government ID audits, and compliance vault" },
    { name: "Super Admin - Moderation", description: "Global moderation of customer reviews, coupons, and product listings" },
    { name: "Super Admin - Fulfillment", description: "Shipment logistics tracking and customer refund issuance for return disputes" },
    { name: "Super Admin - Orders", description: "Master order ledger and detailed checkout inspector" },
    { name: "Super Admin - Analytics & Finance", description: "Platform revenue analytics, 10% commission calculations, payout summaries, and billing" },
    { name: "Super Admin - Security & Audits", description: "Immutable audit trail records for all 10 sensitive platform operations" }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT Bearer token obtained from /api/v1/auth/login"
      }
    }
  },
  paths: {
    ...authDocs,
    ...userDocs,
    ...uploadDocs,
    ...shopDocs,
    ...productDocs,
    ...categoryDocs,
    ...cartDocs,
    ...orderDocs,
    ...paymentDocs,
    ...payoutDocs,
    ...couponDocs,
    ...returnDocs,
    ...engagementDocs,
    ...notificationDocs,
    ...analyticsDocs,
    ...supportDocs,
    ...adminDocs
  }
};

export const setupSwagger = (app: Express): void => {
  app.use(
    ["/api-docs", "/api-docs/"],
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      customSiteTitle: "NXEIO Platform API Documentation",
      customCss: `
        .swagger-ui .topbar { background-color: #0f172a; border-bottom: 2px solid #f97316; }
        .swagger-ui .topbar .download-url-wrapper { display: none; }
        .swagger-ui .info .title { color: #0f172a; font-weight: 800; }
        .swagger-ui .opblock.opblock-post { border-color: #10b981; background: rgba(16, 185, 129, 0.05); }
        .swagger-ui .opblock.opblock-get { border-color: #3b82f6; background: rgba(59, 130, 246, 0.05); }
        .swagger-ui .opblock.opblock-put, .swagger-ui .opblock.opblock-patch { border-color: #f97316; background: rgba(249, 115, 22, 0.05); }
        .swagger-ui .opblock.opblock-delete { border-color: #ef4444; background: rgba(239, 68, 68, 0.05); }
      `
    })
  );

  // Raw JSON specification endpoint
  app.get("/api-docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerDocument);
  });
};
