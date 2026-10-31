export const productDocs = {
  "/api/v1/products": {
    "get": {
      "tags": ["Products"],
      "summary": "Browse marketplace products",
      "description": "Public catalog search with multi-faceted filtering (search, category, price range, sorting, pagination).",
      "parameters": [
        { "name": "search", "in": "query", "schema": { "type": "string" }, "description": "Keyword search across product title and description" },
        { "name": "categoryId", "in": "query", "schema": { "type": "string" }, "description": "Category CUID" },
        { "name": "minPrice", "in": "query", "schema": { "type": "number" }, "description": "Minimum base price filter" },
        { "name": "maxPrice", "in": "query", "schema": { "type": "number" }, "description": "Maximum base price filter" },
        { "name": "sort", "in": "query", "schema": { "type": "string", "enum": ["newest", "price_asc", "price_desc", "popular"], "default": "newest" } },
        { "name": "page", "in": "query", "schema": { "type": "integer", "default": 1 } },
        { "name": "limit", "in": "query", "schema": { "type": "integer", "default": 20 } }
      ],
      "responses": {
        "200": { "description": "Paginated product search results." }
      }
    }
  },
  "/api/v1/products/promotions": {
    "get": {
      "tags": ["Products"],
      "summary": "Get promoted and featured marketplace products",
      "description": "Returns top featured, trending, and discounted marketplace items.",
      "responses": {
        "200": { "description": "Promoted product list returned." }
      }
    }
  },
  "/api/v1/products/{productId}": {
    "get": {
      "tags": ["Products"],
      "summary": "Get public product detail by ID",
      "description": "Returns product specifications, images, variants, seller storefront info, and stock levels.",
      "parameters": [
        { "name": "productId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Product details returned." },
        "404": { "description": "Product not found or inactive." }
      }
    }
  },
  "/api/v1/shops/{shopId}/products": {
    "get": {
      "tags": ["Products"],
      "summary": "List merchant products (Seller Dashboard)",
      "description": "Returns all products belonging to the merchant's store including draft, active, and out-of-stock items.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "shopId", "in": "path", "required": true, "schema": { "type": "string" } },
        { "name": "status", "in": "query", "schema": { "type": "string", "enum": ["ALL", "DRAFT", "ACTIVE", "ARCHIVED"] } },
        { "name": "page", "in": "query", "schema": { "type": "integer", "default": 1 } },
        { "name": "limit", "in": "query", "schema": { "type": "integer", "default": 50 } }
      ],
      "responses": {
        "200": { "description": "Merchant product inventory returned." }
      }
    },
    "post": {
      "tags": ["Products"],
      "summary": "Create a new product listing",
      "description": "Creates a product with initial price, inventory, category, and images.",
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
              "required": ["name", "basePrice", "categoryId"],
              "properties": {
                "name": { "type": "string", "example": "Handcrafted Leather Briefcase" },
                "description": { "type": "string" },
                "basePrice": { "type": "number", "example": 249.99 },
                "categoryId": { "type": "string" },
                "sku": { "type": "string", "example": "BRF-LTH-01" },
                "stock": { "type": "integer", "example": 25 },
                "images": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "url": { "type": "string" },
                      "isPrimary": { "type": "boolean" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "responses": {
        "201": { "description": "Product created successfully." }
      }
    }
  },
  "/api/v1/shops/{shopId}/products/{productId}": {
    "put": {
      "tags": ["Products"],
      "summary": "Update product details",
      "description": "Updates product title, description, price, category, or inventory.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "shopId", "in": "path", "required": true, "schema": { "type": "string" } },
        { "name": "productId", "in": "path", "required": true, "schema": { "type": "string" } }
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
                "basePrice": { "type": "number" },
                "categoryId": { "type": "string" },
                "sku": { "type": "string" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Product updated." }
      }
    },
    "delete": {
      "tags": ["Products"],
      "summary": "Soft delete / archive product",
      "description": "Archives product listing so it is no longer purchasable.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "shopId", "in": "path", "required": true, "schema": { "type": "string" } },
        { "name": "productId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Product archived." }
      }
    }
  },
  "/api/v1/shops/{shopId}/products/{productId}/status": {
    "patch": {
      "tags": ["Products"],
      "summary": "Update product lifecycle status",
      "description": "Changes product visibility (DRAFT, ACTIVE, ARCHIVED).",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "shopId", "in": "path", "required": true, "schema": { "type": "string" } },
        { "name": "productId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["status"],
              "properties": {
                "status": { "type": "string", "enum": ["DRAFT", "ACTIVE", "ARCHIVED"] }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Product status updated." }
      }
    }
  },
  "/api/v1/shops/{shopId}/products/{productId}/images": {
    "post": {
      "tags": ["Products"],
      "summary": "Attach product photo",
      "description": "Appends an uploaded image URL to the product gallery.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "shopId", "in": "path", "required": true, "schema": { "type": "string" } },
        { "name": "productId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["url"],
              "properties": {
                "url": { "type": "string", "format": "uri" },
                "isPrimary": { "type": "boolean", "default": false }
              }
            }
          }
        }
      },
      "responses": {
        "201": { "description": "Image attached." }
      }
    }
  },
  "/api/v1/shops/{shopId}/products/{productId}/variants": {
    "post": {
      "tags": ["Products"],
      "summary": "Create product variant",
      "description": "Creates a distinct size, color, or style SKU variant.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "shopId", "in": "path", "required": true, "schema": { "type": "string" } },
        { "name": "productId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["name", "price", "sku", "stock"],
              "properties": {
                "name": { "type": "string", "example": "Size M / Obsidian Black" },
                "price": { "type": "number", "example": 259.99 },
                "sku": { "type": "string", "example": "BRF-LTH-M-BLK" },
                "stock": { "type": "integer", "example": 10 }
              }
            }
          }
        }
      },
      "responses": {
        "201": { "description": "Variant created." }
      }
    }
  },
  "/api/v1/shops/{shopId}/products/{productId}/variants/{variantId}": {
    "put": {
      "tags": ["Products"],
      "summary": "Update product variant",
      "description": "Updates variant price, stock level, or SKU identifier.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "shopId", "in": "path", "required": true, "schema": { "type": "string" } },
        { "name": "productId", "in": "path", "required": true, "schema": { "type": "string" } },
        { "name": "variantId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "name": { "type": "string" },
                "price": { "type": "number" },
                "stock": { "type": "integer" },
                "sku": { "type": "string" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Variant updated." }
      }
    },
    "delete": {
      "tags": ["Products"],
      "summary": "Delete product variant",
      "description": "Removes a specific product variant.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "shopId", "in": "path", "required": true, "schema": { "type": "string" } },
        { "name": "productId", "in": "path", "required": true, "schema": { "type": "string" } },
        { "name": "variantId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Variant deleted." }
      }
    }
  }
};
