export const uploadDocs = {
  "/api/uploads/signature": {
    get: {
      summary: "Generate direct secure cloud storage upload tokens",
      tags: ["Upload Assets"],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: "Signed authentication payload string block returned." } }
    }
  }
};