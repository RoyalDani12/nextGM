export const couponDocs = {
  "/api/v1/shops/{shopId}/coupons": {
    "get": {
      "tags": ["Coupons"],
      "summary": "List shop promotional coupons",
      "description": "Returns all discount coupons configured for the merchant shop.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "shopId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "List of coupons." }
      }
    },
    "post": {
      "tags": ["Coupons"],
      "summary": "Create discount coupon",
      "description": "Configures percentage or fixed-amount discount codes with usage limits and expiration dates.",
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
              "required": ["code", "discountType", "discountValue"],
              "properties": {
                "code": { "type": "string", "example": "SPRING25" },
                "discountType": { "type": "string", "enum": ["PERCENTAGE", "FIXED"], "example": "PERCENTAGE" },
                "discountValue": { "type": "number", "example": 25 },
                "minOrderAmount": { "type": "number", "example": 50 },
                "maxDiscount": { "type": "number", "example": 100 },
                "usageLimit": { "type": "integer", "example": 500 },
                "expiresAt": { "type": "string", "format": "date-time" }
              }
            }
          }
        }
      },
      "responses": {
        "201": { "description": "Coupon created." },
        "400": { "description": "Coupon code already exists in this shop." }
      }
    }
  },
  "/api/v1/shops/{shopId}/coupons/{couponId}": {
    "patch": {
      "tags": ["Coupons"],
      "summary": "Update discount coupon",
      "description": "Updates coupon parameters, usage limits, or active status.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "shopId", "in": "path", "required": true, "schema": { "type": "string" } },
        { "name": "couponId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "discountValue": { "type": "number" },
                "usageLimit": { "type": "integer" },
                "isActive": { "type": "boolean" },
                "expiresAt": { "type": "string", "format": "date-time" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Coupon updated." }
      }
    },
    "delete": {
      "tags": ["Coupons"],
      "summary": "Delete discount coupon",
      "description": "Permanently removes a coupon from the shop.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "shopId", "in": "path", "required": true, "schema": { "type": "string" } },
        { "name": "couponId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Coupon deleted." }
      }
    }
  }
};
