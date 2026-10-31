export const engagementDocs = {
  "/api/v1/products/{productId}/reviews": {
    "get": {
      "tags": ["Engagement & Reviews"],
      "summary": "Get product reviews & rating score",
      "description": "Returns verified reviews, average star rating, and merchant responses for a product.",
      "parameters": [
        { "name": "productId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Product reviews and average rating." }
      }
    },
    "post": {
      "tags": ["Engagement & Reviews"],
      "summary": "Create verified product review",
      "description": "Allows a customer who purchased the product to leave a 1-5 star review and comment.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "productId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["rating"],
              "properties": {
                "rating": { "type": "integer", "minimum": 1, "maximum": 5, "example": 5 },
                "comment": { "type": "string", "example": "Exceeded expectations! Impeccable leather finish." }
              }
            }
          }
        }
      },
      "responses": {
        "201": { "description": "Review published." },
        "400": { "description": "Customer has already reviewed this product or has not purchased it." }
      }
    }
  },
  "/api/v1/products/{productId}/reviews/my": {
    "get": {
      "tags": ["Engagement & Reviews"],
      "summary": "Get current user's review for product",
      "description": "Returns the authenticated user's review for this product if already submitted.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "productId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "User's review returned." }
      }
    }
  },
  "/api/v1/reviews/{reviewId}": {
    "delete": {
      "tags": ["Engagement & Reviews"],
      "summary": "Delete user's own review",
      "description": "Deletes the authenticated user's review.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "reviewId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Review deleted." }
      }
    }
  },
  "/api/v1/shops/{shopId}/reviews": {
    "get": {
      "tags": ["Engagement & Reviews"],
      "summary": "List all reviews for a merchant shop",
      "description": "Returns all customer reviews across all products in the shop for merchant review management.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "shopId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Shop reviews list." }
      }
    }
  },
  "/api/v1/reviews/{reviewId}/reply": {
    "post": {
      "tags": ["Engagement & Reviews"],
      "summary": "Merchant reply to customer review",
      "description": "Merchant responds publicly to a customer review on their product.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "reviewId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["comment"],
              "properties": {
                "comment": { "type": "string", "example": "Thank you for supporting our workshop! Glad you love the briefcase." }
              }
            }
          }
        }
      },
      "responses": {
        "201": { "description": "Reply posted." }
      }
    },
    "delete": {
      "tags": ["Engagement & Reviews"],
      "summary": "Delete merchant review reply",
      "description": "Removes the merchant's reply to a customer review.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "reviewId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Reply deleted." }
      }
    }
  },
  "/api/v1/reviews/{reviewId}/visibility": {
    "patch": {
      "tags": ["Engagement & Reviews"],
      "summary": "Toggle review visibility (Admin/Merchant)",
      "description": "Hides or restores a review from public storefront display.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "reviewId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Visibility toggled." }
      }
    }
  },
  "/api/v1/wishlist": {
    "get": {
      "tags": ["Wishlist"],
      "summary": "Get customer wishlist",
      "description": "Returns all saved bookmark products in the customer's personal wishlist.",
      "security": [{ "bearerAuth": [] }],
      "responses": {
        "200": { "description": "Wishlist items returned." }
      }
    }
  },
  "/api/v1/wishlist/{productId}": {
    "post": {
      "tags": ["Wishlist"],
      "summary": "Add product to wishlist",
      "description": "Saves a product to the user's wishlist.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "productId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "201": { "description": "Product added to wishlist." }
      }
    },
    "delete": {
      "tags": ["Wishlist"],
      "summary": "Remove product from wishlist",
      "description": "Removes a product from the user's wishlist.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "productId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Product removed from wishlist." }
      }
    }
  }
};
