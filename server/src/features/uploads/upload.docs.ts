export const uploadDocs = {
  "/api/v1/uploads/signature": {
    "get": {
      "tags": ["Uploads"],
      "summary": "Generate Cloudinary upload signature",
      "description": "Returns cryptographic authorization credentials for direct client-to-Cloudinary asset uploads.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        {
          "name": "resourceType",
          "in": "query",
          "required": true,
          "schema": {
            "type": "string",
            "enum": [
              "user_avatar",
              "shop_logo",
              "shop_banner",
              "product_image",
              "category_image",
              "return_evidence",
              "kyc_document"
            ]
          },
          "description": "Category of asset being uploaded",
          "example": "kyc_document"
        },
        {
          "name": "resourceId",
          "in": "query",
          "required": true,
          "schema": { "type": "string" },
          "description": "Target entity ID (e.g., shopId for kyc_document/logos, productId for product images)",
          "example": "cmv97hicg000068bo5bigximx"
        },
        {
          "name": "mimeType",
          "in": "query",
          "required": true,
          "schema": { "type": "string", "enum": ["image/jpeg", "image/png", "image/webp"] },
          "example": "image/jpeg"
        }
      ],
      "responses": {
        "200": {
          "description": "Upload signature successfully generated.",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "statusCode": { "type": "integer", "example": 200 },
                  "message": { "type": "string" },
                  "data": {
                    "type": "object",
                    "properties": {
                      "signature": { "type": "string" },
                      "timestamp": { "type": "integer" },
                      "folder": { "type": "string" },
                      "apiKey": { "type": "string" },
                      "cloudName": { "type": "string" }
                    }
                  }
                }
              }
            }
          }
        },
        "400": { "description": "Invalid asset resource target or unsupported image MIME type." },
        "403": { "description": "Forbidden. User does not own the target resource." }
      }
    }
  }
};
