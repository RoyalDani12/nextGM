export const shopDocs = {
  "/api/shops": {
    post: {
      summary: "Create a new multi-tenant shop platform",
      tags: ["Shops"],
      security: [{ bearerAuth: [] }],
      responses: { 201: { description: "Shop created successfully." } }
    }
  },
  "/api/shops/me": {
    get: {
      summary: "Get authenticated user's shop overview",
      tags: ["Shops"],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: "Shop profile details returned." } }
    }
  },
  "/api/shops/status/{id}": {
    patch: {
      summary: "Update shop system status status",
      tags: ["Shops"],
      security: [{ bearerAuth: [] }],
      parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Shop status altered." } }
    }
  },
  "/api/shops/{id}/profile": {
    put: {
      summary: "Update shop configuration meta profiles",
      tags: ["Shops"],
      security: [{ bearerAuth: [] }],
      parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Profile data updated." } }
    }
  },
  "/api/shops/{id}": {
    delete: {
      summary: "Soft close/delete shop platform",
      tags: ["Shops"],
      security: [{ bearerAuth: [] }],
      parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Shop marked terminated." } }
    }
  },
  "/api/shops/{slug}": {
    get: {
      summary: "Resolve public storefront shop by string URL slug",
      tags: ["Shops"],
      parameters: [{ in: "path", name: "slug", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Store data structural payload." } }
    }
  }
};