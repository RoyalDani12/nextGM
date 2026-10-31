export const supportDocs = {
  "/api/v1/support": {
    "post": {
      "tags": ["Support & Helpdesk"],
      "summary": "Submit support ticket / contact inquiry",
      "description": "Public or authenticated endpoint to create a support ticket with automated email notification.",
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["subject", "category", "message"],
              "properties": {
                "subject": { "type": "string", "example": "Inquiry regarding order shipment tracking" },
                "category": {
                  "type": "string",
                  "enum": [
                    "ORDER_ISSUE",
                    "PAYMENT_ISSUE",
                    "ACCOUNT_ISSUE",
                    "PRODUCT_ISSUE",
                    "SHIPPING_ISSUE",
                    "RETURN_ISSUE",
                    "GENERAL",
                    "OTHER"
                  ],
                  "example": "ORDER_ISSUE"
                },
                "message": { "type": "string", "example": "Hello, my tracking number has not updated in 3 days." },
                "guestName": { "type": "string", "example": "Alex Rivers" },
                "guestEmail": { "type": "string", "format": "email", "example": "alex@example.com" },
                "priority": { "type": "string", "enum": ["LOW", "MEDIUM", "HIGH", "URGENT"], "default": "MEDIUM" }
              }
            }
          }
        }
      },
      "responses": {
        "201": { "description": "Ticket created. Automated confirmation email sent." }
      }
    }
  },
  "/api/v1/support/my": {
    "get": {
      "tags": ["Support & Helpdesk"],
      "summary": "List customer's support tickets",
      "description": "Returns all support tickets submitted by the authenticated customer with live statuses.",
      "security": [{ "bearerAuth": [] }],
      "responses": {
        "200": { "description": "Tickets list returned." }
      }
    }
  },
  "/api/v1/support/my/{ticketId}": {
    "get": {
      "tags": ["Support & Helpdesk"],
      "summary": "Get customer ticket details & message thread",
      "description": "Returns the complete message history and staff replies for a support ticket.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "ticketId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Ticket conversation returned." },
        "404": { "description": "Ticket not found." }
      }
    }
  },
  "/api/v1/support/my/{ticketId}/reply": {
    "post": {
      "tags": ["Support & Helpdesk"],
      "summary": "Customer reply to support ticket",
      "description": "Appends a new message from the customer to an open support ticket.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "ticketId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["message"],
              "properties": {
                "message": { "type": "string", "example": "Thank you for the update! The carrier delivered the package." }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Reply added." }
      }
    }
  },
  "/api/v1/support/admin": {
    "get": {
      "tags": ["Support & Helpdesk"],
      "summary": "List all support tickets (Admin Helpdesk)",
      "description": "Returns all platform tickets with status, priority, category filters, and assignment data.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "status", "in": "query", "schema": { "type": "string", "enum": ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] } },
        { "name": "priority", "in": "query", "schema": { "type": "string", "enum": ["ALL", "LOW", "MEDIUM", "HIGH", "URGENT"] } },
        { "name": "category", "in": "query", "schema": { "type": "string" } },
        { "name": "page", "in": "query", "schema": { "type": "integer", "default": 1 } },
        { "name": "limit", "in": "query", "schema": { "type": "integer", "default": 20 } }
      ],
      "responses": {
        "200": { "description": "Admin tickets list." },
        "403": { "description": "Forbidden. Requires admin role." }
      }
    }
  },
  "/api/v1/support/admin/{ticketId}": {
    "get": {
      "tags": ["Support & Helpdesk"],
      "summary": "Get admin ticket detail & customer profile",
      "description": "Returns full ticket conversation, customer profile, and admin resolution metadata.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "ticketId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Ticket detail returned." }
      }
    },
    "patch": {
      "tags": ["Support & Helpdesk"],
      "summary": "Update ticket status / priority / assignment (Admin)",
      "description": "Changes ticket status (IN_PROGRESS, RESOLVED, CLOSED), assigns staff member, or escalates priority.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "ticketId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "status": { "type": "string", "enum": ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] },
                "priority": { "type": "string", "enum": ["LOW", "MEDIUM", "HIGH", "URGENT"] },
                "assignedToId": { "type": "string", "nullable": true }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Ticket updated." }
      }
    }
  },
  "/api/v1/support/admin/{ticketId}/reply": {
    "post": {
      "tags": ["Support & Helpdesk"],
      "summary": "Post staff reply to ticket (Admin)",
      "description": "Sends an official staff response to the customer and triggers an automated notification email.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "ticketId", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["message"],
              "properties": {
                "message": { "type": "string", "example": "We have escalated this to the warehouse. A replacement is on its way." },
                "closeTicket": { "type": "boolean", "default": false }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Staff reply sent." }
      }
    }
  }
};
