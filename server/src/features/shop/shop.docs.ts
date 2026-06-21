export const shopDocs = {
  // 1. Create Shop (POST /api/shops)
  "/api/shops": {
    post: {
      tags: ["Shops"],
      summary: "Create a new multi-vendor shop",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "description"],
              properties: {
                name: { type: "string", example: "Daniel Tech Store" },
                description: { type: "string", example: "High-performance hardware components store." }
              }
            }
          }
        }
      },
      responses: {
        201: { description: "Shop created successfully" },
        400: { description: "Bad Request - Validation failure" },
        401: { description: "Unauthorized - Invalid token" }
      }
    }
  },

  // 2. Get My Shop (GET /api/shops/me)
  "/api/shops/me": {
    get: {
      tags: ["Shops"],
      summary: "Get current authenticated user's shop profile",
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: "Shop details retrieved successfully" },
        401: { description: "Unauthorized" },
        404: { description: "Shop not found for this user" }
      }
    }
  },

  // 3. Update Shop Status (PATCH /api/shops/status/:id)
  "/api/shops/status/{id}": {
    patch: {
      tags: ["Shops"],
      summary: "Update shop activation status (Admin/Owner internal hook)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "The unique ID of the shop",
          schema: { type: "string" },
          example: "shop-uuid-1111"
        }
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["status"],
              properties: {
                status: { type: "string", enum: ["ACTIVE", "INACTIVE", "SUSPENDED"], example: "ACTIVE" }
              }
            }
          }
        }
      },
      responses: {
        200: { description: "Shop status updated successfully" },
        400: { description: "Invalid status value" },
        401: { description: "Unauthorized" }
      }
    }
  },

  // 4. Update Shop Profile (PUT /api/shops/:id/profile)
  "/api/shops/{id}/profile": {
    put: {
      tags: ["Shops"],
      summary: "Update shop profile information",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "The unique ID of the shop",
          schema: { type: "string" },
          example: "shop-uuid-1111"
        }
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "description"],
              properties: {
                name: { type: "string", example: "Updated Daniel Tech Store" },
                description: { type: "string", example: "Our newly updated store description detailing products." }
              }
            }
          }
        }
      },
      responses: {
        200: { description: "Shop profile updated successfully" },
        400: { description: "Validation failed" },
        401: { description: "Unauthorized" }
      }
    }
  },

  // 5. Close Shop (DELETE /api/shops/:id)
  "/api/shops/{id}": {
    delete: {
      tags: ["Shops"],
      summary: "Close/Delete a shop permanently",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "The unique ID of the shop to close",
          schema: { type: "string" },
          example: "shop-uuid-1111"
        }
      ],
      responses: {
        200: { description: "Shop closed successfully" },
        401: { description: "Unauthorized" },
        404: { description: "Shop not found" }
      }
    }
  },

  // 6. Get Shop By Slug (GET /api/shops/:slug)
  "/api/shops/{slug}": {
    get: {
      tags: ["Shops"],
      summary: "Get a shop's public details by its unique URL slug",
      parameters: [
        {
          name: "slug",
          in: "path",
          required: true,
          description: "The URL friendly slug of the shop",
          schema: { type: "string" },
          example: "daniel-tech-store"
        }
      ],
      responses: {
        200: { description: "Public shop profile data retrieved" },
        404: { description: "Shop slug does not exist" }
      }
    }
  }
};