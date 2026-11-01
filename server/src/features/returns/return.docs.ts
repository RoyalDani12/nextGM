export const returnDocs = {
  "/api/v1/returns": {
    "get": {
      "tags": ["Returns & RMA"],
      "summary": "List customer return claims",
      "description": "Returns all return/refund requests filed by the authenticated customer.",
      "security": [{ "bearerAuth": [] }],
      "responses": {
        "200": { "description": "Customer returns list." }
      }
    },
    "post": {
      "tags": ["Returns & RMA"],
      "summary": "Submit product return request",
      "description": "Initiates an RMA return claim for items from a delivered order with reason, notes, and evidence photos.",
      "security": [{ "bearerAuth": [] }],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["orderId", "reason", "items"],
              "properties": {
                "orderId": { "type": "string" },
                "reason": { "type": "string", "enum": ["DAMAGED", "DEFECTIVE", "WRONG_ITEM", "NOT_AS_DESCRIBED", "CHANGED_MIND", "OTHER"] },
                "customerNote": { "type": "string", "example": "Fabric had a tear upon opening parcel" },
                "items": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "required": ["orderItemId", "quantity"],
                    "properties": {
                      "orderItemId": { "type": "string" },
                      "quantity": { "type": "integer", "minimum": 1 }
                    }
                  }
                },
                "evidenceImages": {
                  "type": "array",
                  "items": { "type": "string", "format": "uri" }
                }
              }
            }
          }
        }
      },
      "responses": {
        "201": { "description": "Return request submitted." },
        "400": { "description": "Order not eligible for return or outside return policy window." }
      }
    }
  },
  "/api/v1/returns/{returnId}": {
    "get": {
      "tags": ["Returns & RMA"],
      "summary": "Get customer return claim detail",
      "description": "Returns status tracking, seller response, RMA shipping instructions, and status history timeline.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "returnId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Return request details." },
        "404": { "description": "Return claim not found." }
      }
    }
  },
  "/api/v1/returns/{returnId}/cancel": {
    "post": {
      "tags": ["Returns & RMA"],
      "summary": "Cancel return request",
      "description": "Customer closes/cancels an open return request.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "returnId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Return request cancelled." }
      }
    }
  },
  "/api/v1/returns/{returnId}/evidence": {
    "patch": {
      "tags": ["Returns & RMA"],
      "summary": "Append photographic evidence to return",
      "description": "Uploads additional evidence pictures of damaged or defective items.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "returnId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["images"],
              "properties": {
                "images": { "type": "array", "items": { "type": "string", "format": "uri" } }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Evidence attached." }
      }
    }
  },
  "/api/v1/shops/{shopId}/returns": {
    "get": {
      "tags": ["Returns & RMA"],
      "summary": "List merchant RMA returns",
      "description": "Returns all return requests filed against the merchant's store with status filters.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "shopId", "in": "path", "required": true, "schema": { "type": "string" } },
        { "name": "status", "in": "query", "schema": { "type": "string", "enum": ["ALL", "REQUESTED", "APPROVED", "REJECTED", "ITEM_RECEIVED", "REFUNDED", "CANCELLED"], "default": "ALL" } },
        { "name": "page", "in": "query", "schema": { "type": "integer", "default": 1 } },
        { "name": "limit", "in": "query", "schema": { "type": "integer", "default": 50 } }
      ],
      "responses": {
        "200": { "description": "Merchant return claims list." }
      }
    }
  },
  "/api/v1/shops/{shopId}/returns/{returnId}": {
    "get": {
      "tags": ["Returns & RMA"],
      "summary": "Get merchant return claim detail",
      "description": "Returns full claim context, evidence images, customer explanation, and status transition options.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "shopId", "in": "path", "required": true, "schema": { "type": "string" } },
        { "name": "returnId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Return details." }
      }
    }
  },
  "/api/v1/shops/{shopId}/returns/{returnId}/status": {
    "patch": {
      "tags": ["Returns & RMA"],
      "summary": "Update return status (Approve / Reject / Mark Received)",
      "description": "Merchant reviews the return claim and approves it for return shipment, marks the physical item received, or rejects with reason.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "shopId", "in": "path", "required": true, "schema": { "type": "string" } },
        { "name": "returnId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["status"],
              "properties": {
                "status": { "type": "string", "enum": ["APPROVED", "REJECTED", "ITEM_RECEIVED"] },
                "sellerNote": { "type": "string", "example": "Return approved. Please use the attached return shipping label." }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Return status updated." }
      }
    }
  }
};
