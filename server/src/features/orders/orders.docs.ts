export const orderDocs = {
  "/api/orders/checkout": {
    "post": {
      "tags": ["Orders"],
      "summary": "Checkout cart and create an order",
      "security": [{ "bearerAuth": [] }],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["cartItems", "shippingAddress", "paymentMethod"],
              "properties": {
                "cartItems": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "productId": { "type": "string", "example": "prod_67890" },
                      "quantity": { "type": "integer", "example": 2 }
                    }
                  }
                },
                "shippingAddress": { "type": "string", "example": "123 Main St, Debre Berhan" },
                "paymentMethod": { "type": "string", "example": "STRIPE" }
              }
            }
          }
        }
      },
      "responses": {
        "201": { "description": "Order created successfully" },
        "400": { "description": "Validation failed" },
        "401": { "description": "Unauthorized" }
      }
    }
  },
  "/api/orders": {
    "get": {
      "tags": ["Orders"],
      "summary": "Get customer order history",
      "security": [{ "bearerAuth": [] }],
      "responses": {
        "200": { "description": "List of customer orders retrieved" },
        "401": { "description": "Unauthorized" }
      }
    }
  },
  "/api/orders/{orderId}": {
    "get": {
      "tags": ["Orders"],
      "summary": "Get customer order details by ID",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        {
          "name": "orderId",
          "in": "path",
          "required": true,
          "schema": { "type": "string" },
          "example": "ord_12345"
        }
      ],
      "responses": {
        "200": { "description": "Order details retrieved" },
        "401": { "description": "Unauthorized" },
        "404": { "description": "Order not found" }
      }
    }
  },
  "/api/orders/{orderId}/cancel": {
    "post": {
      "tags": ["Orders"],
      "summary": "Cancel a specific order",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        {
          "name": "orderId",
          "in": "path",
          "required": true,
          "schema": { "type": "string" },
          "example": "ord_12345"
        }
      ],
      "responses": {
        "200": { "description": "Order cancelled successfully" },
        "400": { "description": "Order cannot be cancelled" },
        "401": { "description": "Unauthorized" }
      }
    }
  },
  "/api/orders/{shopId}/orders": {
    "get": {
      "tags": ["Orders"],
      "summary": "Get all orders placed under a specific shop",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        {
          "name": "shopId",
          "in": "path",
          "required": true,
          "schema": { "type": "string" },
          "example": "shop_99887"
        }
      ],
      "responses": {
        "200": { "description": "Shop orders retrieved" },
        "401": { "description": "Unauthorized" },
        "403": { "description": "Forbidden - Access Denied" }
      }
    }
  },
  "/api/orders/{shopId}/orders/{orderId}": {
    "get": {
      "tags": ["Orders"],
      "summary": "Get specific order details for a shop",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        {
          "name": "shopId",
          "in": "path",
          "required": true,
          "schema": { "type": "string" },
          "example": "shop_99887"
        },
        {
          "name": "orderId",
          "in": "path",
          "required": true,
          "schema": { "type": "string" },
          "example": "ord_12345"
        }
      ],
      "responses": {
        "200": { "description": "Shop order details retrieved" },
        "401": { "description": "Unauthorized" },
        "403": { "description": "Forbidden - Access Denied" },
        "404": { "description": "Order not found" }
      }
    }
  },
  
  "/api/orders/{shopId}/orders/{orderId}/status": {
    "patch": {
      "tags": ["Orders"],
      "summary": "Update order status via state machine event",
      "description": "Transitions an order status safely by validating the sent event against the current state machine rules.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        {
          "name": "shopId",
          "in": "path",
          "required": true,
          "schema": { "type": "string" },
          "example": "shop_99887"
        },
        {
          "name": "orderId",
          "in": "path",
          "required": true,
          "schema": { "type": "string" },
          "example": "ord_12345"
        }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["event"],
              "properties": {
                "event": {
                  "type": "string",
                  "enum": [
                    "PAYMENT_SUCCESS",
                    "PAYMENT_TIMEOUT",
                    "FULFILLMENT_START",
                    "COURIER_PICKUP",
                    "CUSTOMER_CONFIRMATION",
                    "CUSTOMER_RETURN_FILED"
                  ],
                  "description": "The explicit event triggering the transition in the status lifecycle state chart",
                  "example": "FULFILLMENT_START"
                }
              }
            }
          }
        }
      },
      "responses": {
        "200": {
          "description": "Order status updated successfully",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "previousStatus": { "type": "string", "example": "PAID" },
                  "currentStatus": { "type": "string", "example": "PROCESSING" }
                }
              }
            }
          }
        },
        "400": { 
          "description": "Bad Request - Invalid state machine transition or schema validation failed" 
        },
        "401": { 
          "description": "Unauthorized - Missing or invalid authentication token" 
        },
        "403": { 
          "description": "Forbidden - Authenticated user does not have permission to manage this shop" 
        },
        "404": { 
          "description": "Order or shop not found" 
        }
      }
    }
  }


};