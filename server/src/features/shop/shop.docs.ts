export const shopDocs = {
  "/api/v1/shops": {
    "post": {
      "tags": ["Shops"],
      "summary": "Create a new merchant store",
      "description": "Initializes a store workspace in PENDING onboarding state.",
      "security": [{ "bearerAuth": [] }],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["name"],
              "properties": {
                "name": { "type": "string", "example": "Nexus Premium Atelier" }
              }
            }
          }
        }
      },
      "responses": {
        "201": { "description": "Shop workspace created." },
        "400": { "description": "Validation error or invalid shop name." }
      }
    }
  },
  "/api/v1/shops/mine": {
    "get": {
      "tags": ["Shops"],
      "summary": "List my owned shops",
      "description": "Returns all shops belonging to the authenticated merchant.",
      "security": [{ "bearerAuth": [] }],
      "responses": {
        "200": { "description": "List of shops retrieved." }
      }
    }
  },
  "/api/v1/shops/{slug}": {
    "get": {
      "tags": ["Shops"],
      "summary": "Get public shop storefront by slug",
      "description": "Returns public storefront profile, branding, shipping policy, and products count.",
      "parameters": [
        { "name": "slug", "in": "path", "required": true, "schema": { "type": "string" }, "example": "nexus-atelier" }
      ],
      "responses": {
        "200": { "description": "Storefront data returned." },
        "404": { "description": "Storefront not found or suspended." }
      }
    }
  },
  "/api/v1/shops/{id}/profile": {
    "put": {
      "tags": ["Shops"],
      "summary": "Update shop branding and storefront profile",
      "description": "Updates store logo, banner, bio description, phone, email, address, and policies.",
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
                "description": { "type": "string" },
                "logo": { "type": "string", "format": "uri" },
                "banner": { "type": "string", "format": "uri" },
                "email": { "type": "string", "format": "email" },
                "phone": { "type": "string" },
                "address": { "type": "string" },
                "city": { "type": "string" },
                "country": { "type": "string" },
                "website": { "type": "string", "format": "uri" },
                "shippingPolicy": { "type": "string" },
                "returnsPolicy": { "type": "string" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Store profile updated." }
      }
    }
  },
  "/api/v1/shops/status/{id}": {
    "patch": {
      "tags": ["Shops"],
      "summary": "Toggle shop status (Active / Paused)",
      "description": "Merchants can temporarily pause orders during vacation or restocking.",
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
                "status": { "type": "string", "enum": ["ACTIVE", "PAUSED"] }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Shop status toggled." }
      }
    }
  },
  "/api/v1/shops/{id}": {
    "delete": {
      "tags": ["Shops"],
      "summary": "Permanently close store",
      "description": "Archives products and permanently closes store operations.",
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
              "required": ["confirmText"],
              "properties": {
                "confirmText": { "type": "string", "example": "CLOSE MY SHOP" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Shop closed." }
      }
    }
  },
  "/api/v1/shops/{shopId}/legal-info": {
    "put": {
      "tags": ["Shops"],
      "summary": "Update legal compliance & submit KYC verification",
      "description": "Saves legal registration info and submits owner ID cards (Front & Back) for KYC verification review.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "shopId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "legalBusinessName": { "type": "string", "example": "Apex Commerce LLC" },
                "taxId": { "type": "string", "example": "12-3456789" },
                "entityType": { "type": "string", "example": "LLC" },
                "ownerIdType": { "type": "string", "enum": ["NATIONAL_ID", "PASSPORT", "DRIVERS_LICENSE", "RESIDENCE_PERMIT"], "example": "NATIONAL_ID" },
                "ownerIdNumber": { "type": "string", "example": "A98234102" },
                "ownerIdCardFront": { "type": "string", "format": "uri" },
                "ownerIdCardBack": { "type": "string", "format": "uri" },
                "submitForVerification": { "type": "boolean", "example": true }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Legal & KYC info saved. Verification transitioned to PENDING if submitted." }
      }
    }
  },
  "/api/v1/shops/{shopId}/publish-readiness": {
    "get": {
      "tags": ["Shops"],
      "summary": "Check 8 publishing readiness requirements",
      "description": "Evaluates store profile, logo, banner, contact info, address, legal compliance, and products.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "shopId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Readiness checklist status." }
      }
    }
  },
  "/api/v1/shops/{shopId}/publish": {
    "patch": {
      "tags": ["Shops"],
      "summary": "Publish store to live marketplace",
      "description": "Transitions shop status from PENDING to ACTIVE once all readiness requirements pass.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "shopId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Shop published live." },
        "400": { "description": "Incomplete readiness requirements." }
      }
    }
  },
  "/api/v1/shops/{shopId}/wallet": {
    "get": {
      "tags": ["Shops"],
      "summary": "Get shop ledger wallet & balance",
      "description": "Returns settled balance, locked funds, total earnings, and recent ledger entries.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "shopId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Wallet data returned." }
      }
    }
  },
  "/api/v1/shops/{shopId}/analytics": {
    "get": {
      "tags": ["Shops"],
      "summary": "Get shop sales & customer analytics",
      "description": "Returns revenue trajectory, average order value, conversion rate, and product performance.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "shopId", "in": "path", "required": true, "schema": { "type": "string" } },
        { "name": "period", "in": "query", "schema": { "type": "string", "enum": ["7d", "30d", "90d", "all"], "default": "30d" } }
      ],
      "responses": {
        "200": { "description": "Analytics dataset returned." }
      }
    }
  }
};
