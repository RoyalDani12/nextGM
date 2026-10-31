export const categoryDocs = {
  "/api/v1/categories": {
    "get": {
      "tags": ["Categories"],
      "summary": "Get category hierarchy tree",
      "description": "Returns full recursive tree of categories with nested children for marketplace navigation.",
      "responses": {
        "200": { "description": "Category tree returned." }
      }
    },
    "post": {
      "tags": ["Categories"],
      "summary": "Create category (Super Admin)",
      "description": "Creates a top-level or child category. Requires SUPER_ADMIN authority.",
      "security": [{ "bearerAuth": [] }],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["name"],
              "properties": {
                "name": { "type": "string", "example": "Leather Goods" },
                "description": { "type": "string" },
                "parentId": { "type": "string", "nullable": true },
                "image": { "type": "string", "format": "uri" }
              }
            }
          }
        }
      },
      "responses": {
        "201": { "description": "Category created." },
        "403": { "description": "Forbidden. Requires SUPER_ADMIN role." }
      }
    }
  },
  "/api/v1/categories/flat": {
    "get": {
      "tags": ["Categories"],
      "summary": "Get flattened category list",
      "description": "Returns un-nested list of all active categories with parent references.",
      "responses": {
        "200": { "description": "Flat category list." }
      }
    }
  },
  "/api/v1/categories/{id}": {
    "put": {
      "tags": ["Categories"],
      "summary": "Update category (Super Admin)",
      "description": "Updates name, description, parent, or image.",
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
                "parentId": { "type": "string", "nullable": true },
                "image": { "type": "string", "format": "uri" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Category updated." }
      }
    },
    "delete": {
      "tags": ["Categories"],
      "summary": "Delete category (Super Admin)",
      "description": "Deletes category if it contains no active subcategories or assigned products.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Category deleted." },
        "400": { "description": "Cannot delete category with associated products." }
      }
    }
  }
};
