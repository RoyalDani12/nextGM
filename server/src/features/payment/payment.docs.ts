export const paymentDocs = {
  "/api/v1/payment/{checkoutId}/intent": {
    "post": {
      "tags": ["Payments"],
      "summary": "Create Stripe PaymentIntent",
      "description": "Generates a Stripe PaymentIntent for the pending checkout session and returns clientSecret for Stripe Elements checkout.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "checkoutId", "in": "path", "required": true, "schema": { "type": "string" }, "description": "Checkout session ID" }
      ],
      "responses": {
        "200": {
          "description": "PaymentIntent created.",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "clientSecret": { "type": "string", "example": "pi_3MtwBwLkdIwHu7ix28a3tqPa_secret_YrKJWePstMGquiOOLpyr1Nwm" },
                  "amount": { "type": "number", "example": 249.99 },
                  "currency": { "type": "string", "example": "usd" }
                }
              }
            }
          }
        },
        "400": { "description": "Checkout session already paid or expired." }
      }
    }
  },
  "/api/v1/payment/webhooks/stripe": {
    "post": {
      "tags": ["Payments"],
      "summary": "Stripe Webhook Listener",
      "description": "Receives asynchronous event webhooks from Stripe (payment_intent.succeeded, payment_intent.payment_failed, charge.refunded). Signature verified with raw request payload.",
      "parameters": [
        { "name": "stripe-signature", "in": "header", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Webhook event handled and ledger settled." },
        "400": { "description": "Invalid Stripe signature." }
      }
    }
  },
  "/api/v1/admin/orders/{orderId}/refund": {
    "post": {
      "tags": ["Payments"],
      "summary": "Initialize admin refund",
      "description": "Super Admin initiated refund. Debits shop wallet ledger atomically and credits customer via Stripe Refund API.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "orderId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": false,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "reason": { "type": "string", "example": "Item damaged in transit / RMA approved" },
                "amount": { "type": "number", "description": "Optional partial refund amount in USD" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Refund processed and ledger adjusted." },
        "403": { "description": "Forbidden. Requires SUPER_ADMIN role." }
      }
    }
  }
};
