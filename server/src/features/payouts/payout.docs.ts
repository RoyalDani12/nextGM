export const payoutDocs = {
  "/api/v1/payouts/{shopId}/status": {
    "get": {
      "tags": ["Payouts"],
      "summary": "Get merchant payout status & wallet balance",
      "description": "Returns Stripe Connect onboarding status, payout capabilities, available ledger balance, and lifetime withdrawals.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "shopId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": {
          "description": "Payout standing returned.",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean" },
                  "data": {
                    "type": "object",
                    "properties": {
                      "chargesEnabled": { "type": "boolean" },
                      "payoutsEnabled": { "type": "boolean" },
                      "detailsSubmitted": { "type": "boolean" },
                      "balance": { "type": "number", "example": 1900.00 },
                      "currency": { "type": "string", "example": "USD" },
                      "totalWithdrawn": { "type": "number", "example": 600.00 }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "/api/v1/payouts/{shopId}/onboard": {
    "post": {
      "tags": ["Payouts"],
      "summary": "Generate Stripe Connect onboarding link",
      "description": "Generates a secure hosted Stripe Express onboarding link for the merchant to link checking accounts or debit cards.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "shopId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": {
          "description": "Stripe Connect onboarding URL generated.",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "url": { "type": "string", "format": "uri", "example": "https://connect.stripe.com/setup/s/..." }
                }
              }
            }
          }
        }
      }
    }
  },
  "/api/v1/payouts/{shopId}/withdraw": {
    "post": {
      "tags": ["Payouts"],
      "summary": "Initiate direct bank payout withdrawal",
      "description": "Transfers available settled merchant wallet funds to their connected bank account with 0% fee.",
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
              "required": ["amount"],
              "properties": {
                "amount": { "type": "number", "minimum": 10, "example": 500.00 }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Payout initiated and ledger debited." },
        "400": { "description": "Insufficient available wallet balance or payout amount below threshold." }
      }
    }
  }
};
