export const adminDocs = {
  "/api/v1/admin/stats": {
    "get": {
      "tags": ["Super Admin - Platform Operations"],
      "summary": "Platform high-level operational statistics",
      "description": "Returns gross GMV, settled volume, 10% platform net commission revenue, total users, shops, orders, and pending approval queues.",
      "security": [{ "bearerAuth": [] }],
      "responses": {
        "200": { "description": "Platform KPI stats." },
        "403": { "description": "Forbidden. Requires SUPER_ADMIN role." }
      }
    }
  },
  "/api/v1/admin/users": {
    "get": {
      "tags": ["Super Admin - Users"],
      "summary": "List all platform users with filtering",
      "description": "Paginated list of platform accounts with role, status, email verification, and date range filters.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "search", "in": "query", "schema": { "type": "string" } },
        { "name": "role", "in": "query", "schema": { "type": "string", "enum": ["ALL", "CUSTOMER", "MERCHANT", "SUPER_ADMIN"] } },
        { "name": "status", "in": "query", "schema": { "type": "string", "enum": ["ALL", "ACTIVE", "INACTIVE", "SUSPENDED", "DEACTIVATED"] } },
        { "name": "page", "in": "query", "schema": { "type": "integer", "default": 1 } },
        { "name": "limit", "in": "query", "schema": { "type": "integer", "default": 20 } }
      ],
      "responses": {
        "200": { "description": "Users list returned." }
      }
    }
  },
  "/api/v1/admin/users/{id}": {
    "get": {
      "tags": ["Super Admin - Users"],
      "summary": "Get detailed user account dossier",
      "description": "Returns user profile, login sessions, shops, order history, and security flags.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "User dossier returned." }
      }
    }
  },
  "/api/v1/admin/users/bulk-status": {
    "post": {
      "tags": ["Super Admin - Users"],
      "summary": "Bulk update user account statuses",
      "description": "Changes the status of multiple users simultaneously (e.g. bulk suspend, bulk activate).",
      "security": [{ "bearerAuth": [] }],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["userIds", "status"],
              "properties": {
                "userIds": { "type": "array", "items": { "type": "string" } },
                "status": { "type": "string", "enum": ["ACTIVE", "INACTIVE", "SUSPENDED"] }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Statuses updated." }
      }
    }
  },
  "/api/v1/admin/users/bulk-email": {
    "post": {
      "tags": ["Super Admin - Users"],
      "summary": "Broadcast email to selected users",
      "description": "Sends system announcements or compliance notifications to targeted accounts.",
      "security": [{ "bearerAuth": [] }],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["userIds", "subject", "message"],
              "properties": {
                "userIds": { "type": "array", "items": { "type": "string" } },
                "subject": { "type": "string" },
                "message": { "type": "string" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Broadcast queued." }
      }
    }
  },
  "/api/v1/admin/users/{id}/role": {
    "patch": {
      "tags": ["Super Admin - Users"],
      "summary": "Change user security role",
      "description": "Promotes or demotes user role (CUSTOMER, MERCHANT, SUPER_ADMIN). Logged to audit trail.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["role"],
              "properties": {
                "role": { "type": "string", "enum": ["CUSTOMER", "MERCHANT", "SUPER_ADMIN"] }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Role updated." }
      }
    }
  },
  "/api/v1/admin/users/{id}/status": {
    "patch": {
      "tags": ["Super Admin - Users"],
      "summary": "Change user status",
      "description": "Suspends, activates, or deactivates user account.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["status"],
              "properties": {
                "status": { "type": "string", "enum": ["ACTIVE", "INACTIVE", "SUSPENDED", "DEACTIVATED"] }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Status updated." }
      }
    }
  },
  "/api/v1/admin/users/{id}/profile": {
    "patch": {
      "tags": ["Super Admin - Users"],
      "summary": "Administrative update to user profile",
      "description": "Overrides name or phone of user for compliance correction.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "name": { "type": "string" },
                "phone": { "type": "string" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Profile updated." }
      }
    }
  },
  "/api/v1/admin/users/{id}/reset-password": {
    "post": {
      "tags": ["Super Admin - Users"],
      "summary": "Trigger administrative password reset",
      "description": "Generates a secure temporary password reset token and emails it to the user. Logged to audit trail.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Password reset email sent." }
      }
    }
  },
  "/api/v1/admin/users/{id}/impersonate": {
    "post": {
      "tags": ["Super Admin - Users"],
      "summary": "Impersonate user account",
      "description": "Generates temporary session token to inspect customer or merchant issue directly. Strictly logged to audit trail.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Impersonation session established." }
      }
    }
  },
  "/api/v1/admin/users/{id}/send-email": {
    "post": {
      "tags": ["Super Admin - Users"],
      "summary": "Send direct email to user",
      "description": "Dispatches individual custom email notification to user from platform administration.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["subject", "message"],
              "properties": {
                "subject": { "type": "string" },
                "message": { "type": "string" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Email sent." }
      }
    }
  },
  "/api/v1/admin/shops": {
    "get": {
      "tags": ["Super Admin - Shops & KYC"],
      "summary": "List all merchant stores",
      "description": "Returns all shops with status (PENDING, ACTIVE, SUSPENDED, CLOSED), owner details, and verification standing.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "status", "in": "query", "schema": { "type": "string" } },
        { "name": "search", "in": "query", "schema": { "type": "string" } },
        { "name": "page", "in": "query", "schema": { "type": "integer", "default": 1 } },
        { "name": "limit", "in": "query", "schema": { "type": "integer", "default": 20 } }
      ],
      "responses": {
        "200": { "description": "Shops list." }
      }
    }
  },
  "/api/v1/admin/shops/{id}": {
    "get": {
      "tags": ["Super Admin - Shops & KYC"],
      "summary": "Get full shop dossier & compliance record",
      "description": "Returns store workspace, owner details, legal registration, KYC identity proof scans, documents vault, audit timeline, and risk flags.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Shop dossier returned." }
      }
    }
  },
  "/api/v1/admin/shops/{id}/status": {
    "patch": {
      "tags": ["Super Admin - Shops & KYC"],
      "summary": "Update shop operational status",
      "description": "Directly updates status to ACTIVE, PAUSED, SUSPENDED, or CLOSED.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["status"],
              "properties": {
                "status": { "type": "string", "enum": ["ACTIVE", "PAUSED", "SUSPENDED", "CLOSED"] }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Status updated." }
      }
    }
  },
  "/api/v1/admin/shops/{id}/approve": {
    "post": {
      "tags": ["Super Admin - Shops & KYC"],
      "summary": "Approve pending shop onboard request",
      "description": "Approves merchant store application and activates storefront catalog.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Shop approved." }
      }
    }
  },
  "/api/v1/admin/shops/{id}/reject": {
    "post": {
      "tags": ["Super Admin - Shops & KYC"],
      "summary": "Reject pending shop application",
      "description": "Rejects store onboarding with specific reasons sent to merchant.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["reason"],
              "properties": {
                "reason": { "type": "string", "example": "Incomplete legal entity documentation" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Shop application rejected." }
      }
    }
  },
  "/api/v1/admin/shops/{id}/suspend": {
    "post": {
      "tags": ["Super Admin - Shops & KYC"],
      "summary": "Suspend shop operations",
      "description": "Immediately suspends store for compliance violations or high return rates. Logged to audit trail.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["reason"],
              "properties": {
                "reason": { "type": "string" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Shop suspended." }
      }
    }
  },
  "/api/v1/admin/shops/{id}/close": {
    "post": {
      "tags": ["Super Admin - Shops & KYC"],
      "summary": "Permanently close store (Admin)",
      "description": "Forces permanent closure of a shop.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Shop closed." }
      }
    }
  },
  "/api/v1/admin/shops/{id}/reopen": {
    "post": {
      "tags": ["Super Admin - Shops & KYC"],
      "summary": "Reopen suspended/paused store",
      "description": "Restores shop to ACTIVE standing after review.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Shop reopened." }
      }
    }
  },
  "/api/v1/admin/shops/{id}/verification": {
    "patch": {
      "tags": ["Super Admin - Shops & KYC"],
      "summary": "Audit & approve/reject Owner KYC & Business Tax ID",
      "description": "Super Admin reviews front & back government ID scans and updates ownerKycStatus to VERIFIED or REJECTED with notes.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "ownerKycStatus": { "type": "string", "enum": ["UNVERIFIED", "PENDING", "IN_REVIEW", "VERIFIED", "REJECTED"], "example": "VERIFIED" },
                "ownerKycNotes": { "type": "string", "example": "National ID verified against civil registry" },
                "businessVerificationStatus": { "type": "string", "enum": ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"] },
                "taxIdStatus": { "type": "string", "enum": ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"] },
                "addressVerificationStatus": { "type": "string", "enum": ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"] }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "KYC standing updated. Verified badge awarded if VERIFIED." }
      }
    }
  },
  "/api/v1/admin/shops/{id}/documents": {
    "post": {
      "tags": ["Super Admin - Shops & KYC"],
      "summary": "Upload compliance document to shop vault",
      "description": "Adds article of incorporation, proof of address, or tax certificate to legal document vault.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["type", "url", "name"],
              "properties": {
                "type": { "type": "string", "example": "BUSINESS_REGISTRATION" },
                "url": { "type": "string", "format": "uri" },
                "name": { "type": "string", "example": "Certificate_of_Formation.pdf" }
              }
            }
          }
        }
      },
      "responses": {
        "201": { "description": "Document added." }
      }
    }
  },
  "/api/v1/admin/shops/{id}/documents/{documentId}": {
    "patch": {
      "tags": ["Super Admin - Shops & KYC"],
      "summary": "Verify or reject legal document",
      "description": "Updates document status to VERIFIED or REJECTED.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } },
        { "name": "documentId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["status"],
              "properties": {
                "status": { "type": "string", "enum": ["VERIFIED", "REJECTED"] }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Document verified." }
      }
    },
    "delete": {
      "tags": ["Super Admin - Shops & KYC"],
      "summary": "Delete legal document",
      "description": "Removes document from vault.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } },
        { "name": "documentId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Document deleted." }
      }
    }
  },
  "/api/v1/admin/shops/{id}/notes": {
    "post": {
      "tags": ["Super Admin - Shops & KYC"],
      "summary": "Add internal compliance note",
      "description": "Records private audit notes visible only to Super Admins.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["note"],
              "properties": {
                "note": { "type": "string", "example": "Merchant confirmed high volume seasonal campaign starting Nov 1." }
              }
            }
          }
        }
      },
      "responses": {
        "201": { "description": "Note added." }
      }
    }
  },
  "/api/v1/admin/shops/{id}/risk-flags": {
    "post": {
      "tags": ["Super Admin - Shops & KYC"],
      "summary": "Flag shop for risk / AML review",
      "description": "Applies a risk indicator (HIGH_REFUND_RATE, SUSPECTED_FRAUD, POLICY_VIOLATION).",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["flagType", "reason"],
              "properties": {
                "flagType": { "type": "string", "example": "HIGH_REFUND_RATE" },
                "reason": { "type": "string", "example": "Returns exceeded 15% threshold over 7 days." }
              }
            }
          }
        }
      },
      "responses": {
        "201": { "description": "Risk flag created." }
      }
    }
  },
  "/api/v1/admin/shops/{id}/risk-flags/{flagId}/resolve": {
    "patch": {
      "tags": ["Super Admin - Shops & KYC"],
      "summary": "Resolve risk flag",
      "description": "Dismisses risk flag after compliance investigation.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } },
        { "name": "flagId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Risk flag resolved." }
      }
    }
  },
  "/api/v1/admin/reviews": {
    "get": {
      "tags": ["Super Admin - Moderation"],
      "summary": "List all customer reviews across platform",
      "description": "Global review moderation queue with spam & flag filters.",
      "security": [{ "bearerAuth": [] }],
      "responses": {
        "200": { "description": "Reviews list." }
      }
    }
  },
  "/api/v1/admin/reviews/{id}/visibility": {
    "patch": {
      "tags": ["Super Admin - Moderation"],
      "summary": "Toggle review visibility",
      "description": "Hides abusive or inappropriate customer reviews.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Visibility updated." }
      }
    }
  },
  "/api/v1/admin/reviews/{id}": {
    "delete": {
      "tags": ["Super Admin - Moderation"],
      "summary": "Permanently delete review",
      "description": "Removes spam review from platform.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Review deleted." }
      }
    }
  },
  "/api/v1/admin/shipments": {
    "get": {
      "tags": ["Super Admin - Fulfillment"],
      "summary": "List all platform shipments",
      "description": "Returns logistics data, carrier performance, and delivery tracking across all shops.",
      "security": [{ "bearerAuth": [] }],
      "responses": {
        "200": { "description": "Shipments list." }
      }
    }
  },
  "/api/v1/admin/returns": {
    "get": {
      "tags": ["Super Admin - Fulfillment"],
      "summary": "List all platform returns & refund disputes",
      "description": "Global list of all return claims with claim statuses and total refund volumes.",
      "security": [{ "bearerAuth": [] }],
      "responses": {
        "200": { "description": "Returns list." }
      }
    }
  },
  "/api/v1/admin/returns/{id}": {
    "get": {
      "tags": ["Super Admin - Fulfillment"],
      "summary": "Get return claim detail & refund status",
      "description": "Returns RMA claim details, customer evidence, and merchant notes.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Return details." }
      }
    }
  },
  "/api/v1/admin/returns/{id}/refund": {
    "post": {
      "tags": ["Super Admin - Fulfillment"],
      "summary": "Execute platform customer refund for return claim",
      "description": "Super Admin initiated refund. Atomically executes Stripe refund, marks return claim REFUNDED, debits merchant wallet ledger, and records audit trail.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Refund executed." },
        "400": { "description": "Return already refunded or payment record not found." }
      }
    }
  },
  "/api/v1/admin/orders": {
    "get": {
      "tags": ["Super Admin - Orders"],
      "summary": "List all platform orders",
      "description": "Master orders audit table across all shops with payment and fulfillment status.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "page", "in": "query", "schema": { "type": "integer", "default": 1 } },
        { "name": "limit", "in": "query", "schema": { "type": "integer", "default": 20 } }
      ],
      "responses": {
        "200": { "description": "Orders list." }
      }
    }
  },
  "/api/v1/admin/orders/{orderId}": {
    "get": {
      "tags": ["Super Admin - Orders"],
      "summary": "Get master order detail",
      "description": "Returns complete checkout context, all shop sub-orders, Stripe charge ID, and line item breakdown.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "orderId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Order details." }
      }
    }
  },
  "/api/v1/admin/analytics/platform": {
    "get": {
      "tags": ["Super Admin - Analytics & Finance"],
      "summary": "Platform-wide financial analytics & commission breakdown",
      "description": "Calculates gross sales, 10% platform revenue cut, merchant payouts, and growth metrics.",
      "security": [{ "bearerAuth": [] }],
      "responses": {
        "200": { "description": "Platform analytics." }
      }
    }
  },
  "/api/v1/admin/payouts": {
    "get": {
      "tags": ["Super Admin - Analytics & Finance"],
      "summary": "List all merchant payout withdrawals",
      "description": "Returns payout transfer history across all merchant stores.",
      "security": [{ "bearerAuth": [] }],
      "responses": {
        "200": { "description": "Payouts list." }
      }
    }
  },
  "/api/v1/admin/payouts/summary": {
    "get": {
      "tags": ["Super Admin - Analytics & Finance"],
      "summary": "Platform payout & 10% commission liquidity summary",
      "description": "Returns total platform commission earned (10%), total merchant payouts, and available platform wallet balance.",
      "security": [{ "bearerAuth": [] }],
      "responses": {
        "200": { "description": "Payouts summary." }
      }
    }
  },
  "/api/v1/admin/billing/overview": {
    "get": {
      "tags": ["Super Admin - Analytics & Finance"],
      "summary": "Billing & revenue overview",
      "description": "Returns monthly recurring metrics, fee breakdowns, and payment gateway charges.",
      "security": [{ "bearerAuth": [] }],
      "responses": {
        "200": { "description": "Billing overview." }
      }
    }
  },
  "/api/v1/admin/audit-logs": {
    "get": {
      "tags": ["Super Admin - Security & Audits"],
      "summary": "Query sensitive operations audit trail",
      "description": "Returns immutable audit logs for role changes, password resets, user deactivations, shop suspensions, refunds, payout modifications, coupon updates, product moderation, support assignments, and impersonation.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "action", "in": "query", "schema": { "type": "string" }, "description": "Filter by action (e.g. ROLE_CHANGE, REFUND_ISSUED, USER_IMPERSONATION)" },
        { "name": "page", "in": "query", "schema": { "type": "integer", "default": 1 } },
        { "name": "limit", "in": "query", "schema": { "type": "integer", "default": 50 } }
      ],
      "responses": {
        "200": { "description": "Audit logs returned." }
      }
    }
  },
  "/api/v1/admin/coupons": {
    "get": {
      "tags": ["Super Admin - Moderation"],
      "summary": "List all coupons across platform",
      "description": "Returns all merchant promotional coupons for platform compliance review.",
      "security": [{ "bearerAuth": [] }],
      "responses": {
        "200": { "description": "Coupons list." }
      }
    }
  },
  "/api/v1/admin/coupons/{id}/toggle": {
    "patch": {
      "tags": ["Super Admin - Moderation"],
      "summary": "Toggle coupon active status (Admin)",
      "description": "Forces coupon activation or deactivation.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Coupon status toggled." }
      }
    }
  },
  "/api/v1/admin/products": {
    "get": {
      "tags": ["Super Admin - Moderation"],
      "summary": "List all products across platform",
      "description": "Master products list for marketplace quality and compliance moderation.",
      "security": [{ "bearerAuth": [] }],
      "responses": {
        "200": { "description": "Products list." }
      }
    }
  },
  "/api/v1/admin/products/{id}": {
    "get": {
      "tags": ["Super Admin - Moderation"],
      "summary": "Get product detail (Admin)",
      "description": "Returns full product dossier, inventory, pricing, and shop owner details.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Product details." }
      }
    }
  },
  "/api/v1/admin/products/{id}/status": {
    "patch": {
      "tags": ["Super Admin - Moderation"],
      "summary": "Update product moderation status",
      "description": "Approve, flag, or take down products violating platform terms. Logged to audit trail.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["status"],
              "properties": {
                "status": { "type": "string", "enum": ["ACTIVE", "DRAFT", "ARCHIVED"] }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Product status updated." }
      }
    }
  }
};
