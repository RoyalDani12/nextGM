export const productDocs = {
  "/api/shops/{shopId}/products": {
    post: {
      summary: "Create a product in a shop",
      tags: ["Products"],
      security: [{ bearerAuth: [] }],
      parameters: [{ in: "path", name: "shopId", required: true, schema: { type: "string" } }],
      responses: { 201: { description: "Product created." } }
    },
    get: {
      summary: "Get owner's shop product list",
      tags: ["Products"],
      security: [{ bearerAuth: [] }],
      parameters: [{ in: "path", name: "shopId", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Products retrieved." } }
    }
  },
  "/api/shops/{shopId}/products/{productId}": {
    put: {
      summary: "Update product details",
      tags: ["Products"],
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: "path", name: "shopId", required: true, schema: { type: "string" } },
        { in: "path", name: "productId", required: true, schema: { type: "string" } }
      ],
      responses: { 200: { description: "Product modified." } }
    }
  },
  "/api/shops/{shopId}/products/{productId}/status": {
    patch: {
      summary: "Change product visibility status",
      tags: ["Products"],
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: "path", name: "shopId", required: true, schema: { type: "string" } },
        { in: "path", name: "productId", required: true, schema: { type: "string" } }
      ],
      responses: { 200: { description: "Status modified." } }
    }
  }
};