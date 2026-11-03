export const orderDocs = {
  "/api/v1/orders/checkout": {
    "post": {
      "tags": ["Orders"],
      "summary": "Create checkout session & lock orders",
      "description": "Validates inventory, applies discounts/coupons, splits cart by merchant shops, and creates pending order records ready for payment.",
      "security": [{ "bearerAuth": [] }],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["shippingAddress"],
              "properties": {
                "shippingAddress": {
                  "type": "object",
                  "required": ["fullName", "street", "city", "state", "postalCode", "country", "phone"],
                  "properties": {
                    "fullName": { "type": "string", "example": "Jane Doe" },
                    "street": { "type": "string", "example": "742 Evergreen Terrace" },
                    "city": { "type": "string", "example": "Springfield" },
                    "state": { "type": "string", "example": "OR" },
                    "postalCode": { "type": "string", "example": "97477" },
                    "country": { "type": "string", "example": "US" },
                    "phone": { "type": "string", "example": "+15551234567" }
                  }
                },
                "couponCode": { "type": "string", "example": "WELCOME10" },
                "notes": { "type": "string", "example": "Please leave at side door" }
              }
            }
          }
        }
      },
      "responses": {
        "201": {
          "description": "Checkout initiated. Returns checkoutId and sub-orders for each shop."
        },
        "400": { "description": "Cart is empty, price changed, or insufficient inventory." }
      }
    }
  },
  "/api/v1/orders": {
    "get": {
      "tags": ["Orders"],
      "summary": "List customer order history",
      "description": "Returns all orders placed by the authenticated customer with fulfillment and payment status.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "page", "in": "query", "schema": { "type": "integer", "default": 1 } },
        { "name": "limit", "in": "query", "schema": { "type": "integer", "default": 10 } },
        { "name": "status", "in": "query", "schema": { "type": "string", "enum": ["ALL", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] } }
      ],
      "responses": {
        "200": { "description": "Customer orders list retrieved." }
      }
    }
  },
  "/api/v1/orders/{orderId}": {
    "get": {
      "tags": ["Orders"],
      "summary": "Get customer order details",
      "description": "Returns full line item breakdown, tracking code, shipping address, and invoice for a specific order.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "orderId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Order details returned." },
        "404": { "description": "Order not found." }
      }
    }
  },
  "/api/v1/orders/{orderId}/cancel": {
    "post": {
      "tags": ["Orders"],
      "summary": "Cancel unfulfilled order",
      "description": "Customer cancellation of an order before fulfillment dispatch.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "orderId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Order cancelled." },
        "400": { "description": "Order has already been shipped or completed." }
      }
    }
  },
  "/api/v1/orders/{shopId}/orders": {
    "get": {
      "tags": ["Orders"],
      "summary": "List merchant shop orders (Seller)",
      "description": "Returns orders placed for the merchant's store with customer details, items, and delivery deadlines.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "shopId", "in": "path", "required": true, "schema": { "type": "string" } },
        { "name": "status", "in": "query", "schema": { "type": "string", "enum": ["ALL", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] } },
        { "name": "search", "in": "query", "schema": { "type": "string" }, "description": "Search by customer name, email, order ID, or tracking number" },
        { "name": "startDate", "in": "query", "schema": { "type": "string", "format": "date" }, "description": "Start of date range (YYYY-MM-DD)" },
        { "name": "endDate", "in": "query", "schema": { "type": "string", "format": "date" }, "description": "End of date range (YYYY-MM-DD)" },
        { "name": "page", "in": "query", "schema": { "type": "integer", "default": 1 } },
        { "name": "limit", "in": "query", "schema": { "type": "integer", "default": 20 } }
      ],
      "responses": {
        "200": { "description": "Shop orders list returned." }
      }
    }
  },
  "/api/v1/orders/{shopId}/orders/{orderId}": {
    "get": {
      "tags": ["Orders"],
      "summary": "Get merchant shop order detail",
      "description": "Returns detailed line items, packaging slip info, and customer delivery address.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "shopId", "in": "path", "required": true, "schema": { "type": "string" } },
        { "name": "orderId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Shop order detail returned." }
      }
    }
  },
  "/api/v1/orders/{shopId}/orders/{orderId}/shipment": {
    "patch": {
      "tags": ["Orders"],
      "summary": "Mark order as shipped with tracking",
      "description": "Records carrier name and tracking number, updates status to SHIPPED, and sends customer shipping confirmation.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "shopId", "in": "path", "required": true, "schema": { "type": "string" } },
        { "name": "orderId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["carrier", "trackingNumber"],
              "properties": {
                "carrier": { "type": "string", "example": "FedEx" },
                "trackingNumber": { "type": "string", "example": "794829103948" },
                "estimatedDelivery": { "type": "string", "format": "date-time" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Order marked shipped and tracking recorded." }
      }
    }
  },
  "/api/v1/orders/{shopId}/orders/{orderId}/status": {
    "patch": {
      "tags": ["Orders"],
      "summary": "Update order status",
      "description": "Transitions order between PROCESSING, DELIVERED, or CANCELLED.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "shopId", "in": "path", "required": true, "schema": { "type": "string" } },
        { "name": "orderId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["status"],
              "properties": {
                "status": { "type": "string", "enum": ["PROCESSING", "DELIVERED", "CANCELLED"] }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Order status updated." }
      }
    }
  }
};
