export const cartDocs = {
  "/api/cart/items": {
    "post": {
      "tags": ["Cart"],
      "summary": "Add an item to the shopping cart",
      "security": [{ "bearerAuth": [] }],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["productId", "quantity"],
              "properties": {
                "productId": { "type": "string", "example": "prod_12345" },
                "quantity": { "type": "integer", "minimum": 1, "example": 1 }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Item added to cart successfully" },
        "400": { "description": "Validation failed / Out of stock" },
        "401": { "description": "Unauthorized" }
      }
    }
  },
  "/api/cart/view-cart-items": {
    "get": {
      "tags": ["Cart"],
      "summary": "Get all active items in the customer's cart",
      "security": [{ "bearerAuth": [] }],
      "responses": {
        "200": { "description": "Cart items retrieved successfully" },
        "401": { "description": "Unauthorized" }
      }
    }
  },
  "/api/cart/items/{itemId}": {
    "patch": {
      "tags": ["Cart"],
      "summary": "Update the quantity of a specific cart item",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        {
          "name": "itemId",
          "in": "path",
          "required": true,
          "schema": { "type": "string" },
          "example": "item_67890"
        }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["quantity"],
              "properties": {
                "quantity": { "type": "integer", "minimum": 1, "example": 3 }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Cart item updated successfully" },
        "400": { "description": "Validation failed" },
        "401": { "description": "Unauthorized" },
        "404": { "description": "Cart item not found" }
      }
    },
    "delete": {
      "tags": ["Cart"],
      "summary": "Remove a specific item from the cart",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        {
          "name": "itemId",
          "in": "path",
          "required": true,
          "schema": { "type": "string" },
          "example": "item_67890"
        }
      ],
      "responses": {
        "200": { "description": "Item removed from cart successfully" },
        "401": { "description": "Unauthorized" },
        "404": { "description": "Cart item not found" }
      }
    }
  },
  "/api/cart/clear": {
    "delete": {
      "tags": ["Cart"],
      "summary": "Clear all items from the customer's cart",
      "security": [{ "bearerAuth": [] }],
      "responses": {
        "200": { "description": "Cart cleared successfully" },
        "401": { "description": "Unauthorized" }
      }
    }
  }
};