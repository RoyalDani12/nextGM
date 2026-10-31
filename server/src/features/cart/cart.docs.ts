export const cartDocs = {
  "/api/v1/cart/view-cart-items": {
    "get": {
      "tags": ["Cart"],
      "summary": "View active shopping cart",
      "description": "Retrieves all items in the user's cart grouped by shop with live prices, discounts, and inventory validation.",
      "security": [{ "bearerAuth": [] }],
      "responses": {
        "200": { "description": "Cart contents retrieved." }
      }
    }
  },
  "/api/v1/cart/items": {
    "post": {
      "tags": ["Cart"],
      "summary": "Add product to cart",
      "description": "Adds a product variant with specified quantity to the shopping cart.",
      "security": [{ "bearerAuth": [] }],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["productId", "quantity"],
              "properties": {
                "productId": { "type": "string" },
                "variantId": { "type": "string", "nullable": true },
                "quantity": { "type": "integer", "minimum": 1, "example": 2 }
              }
            }
          }
        }
      },
      "responses": {
        "201": { "description": "Item added to cart." },
        "400": { "description": "Insufficient inventory or invalid product." }
      }
    }
  },
  "/api/v1/cart/items/{itemId}": {
    "patch": {
      "tags": ["Cart"],
      "summary": "Update item quantity in cart",
      "description": "Adjusts the quantity of a specific cart line item.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "itemId", "in": "path", "required": true, "schema": { "type": "string" } }
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
        "200": { "description": "Cart item updated." }
      }
    },
    "delete": {
      "tags": ["Cart"],
      "summary": "Remove item from cart",
      "description": "Deletes a specific line item from the active cart.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "itemId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Item removed from cart." }
      }
    }
  },
  "/api/v1/cart/clear": {
    "delete": {
      "tags": ["Cart"],
      "summary": "Clear entire cart",
      "description": "Removes all items from the user's active shopping cart.",
      "security": [{ "bearerAuth": [] }],
      "responses": {
        "200": { "description": "Cart emptied." }
      }
    }
  },
  "/api/v1/cart/merge": {
    "post": {
      "tags": ["Cart"],
      "summary": "Merge guest session cart into user cart",
      "description": "Called upon login to merge anonymous guest localStorage cart items into the authenticated database cart.",
      "security": [{ "bearerAuth": [] }],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["items"],
              "properties": {
                "items": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "required": ["productId", "quantity"],
                    "properties": {
                      "productId": { "type": "string" },
                      "variantId": { "type": "string", "nullable": true },
                      "quantity": { "type": "integer", "minimum": 1 }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Cart items successfully merged." }
      }
    }
  }
};
