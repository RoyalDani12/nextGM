export const notificationDocs = {
  "/api/v1/notifications": {
    "get": {
      "tags": ["Notifications"],
      "summary": "Get user notifications list",
      "description": "Returns in-app notifications (orders, shipping, returns, support replies, payouts) with pagination.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "page", "in": "query", "schema": { "type": "integer", "default": 1 } },
        { "name": "limit", "in": "query", "schema": { "type": "integer", "default": 20 } },
        { "name": "unreadOnly", "in": "query", "schema": { "type": "boolean", "default": false } }
      ],
      "responses": {
        "200": { "description": "Notifications list." }
      }
    }
  },
  "/api/v1/notifications/unread-count": {
    "get": {
      "tags": ["Notifications"],
      "summary": "Get unread notifications count",
      "description": "Returns the number of unread notifications for badge rendering.",
      "security": [{ "bearerAuth": [] }],
      "responses": {
        "200": {
          "description": "Unread count returned.",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "count": { "type": "integer", "example": 3 }
                }
              }
            }
          }
        }
      }
    }
  },
  "/api/v1/notifications/read-all": {
    "patch": {
      "tags": ["Notifications"],
      "summary": "Mark all notifications as read",
      "description": "Marks all unread notifications for the user as read.",
      "security": [{ "bearerAuth": [] }],
      "responses": {
        "200": { "description": "All notifications marked as read." }
      }
    }
  },
  "/api/v1/notifications/{id}/read": {
    "patch": {
      "tags": ["Notifications"],
      "summary": "Mark single notification as read",
      "description": "Marks a specific notification as read by ID.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Notification marked read." }
      }
    }
  },
  "/api/v1/notifications/{id}": {
    "delete": {
      "tags": ["Notifications"],
      "summary": "Delete single notification",
      "description": "Removes a notification from the user's notification feed.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
      ],
      "responses": {
        "200": { "description": "Notification deleted." }
      }
    }
  },
  "/api/v1/notifications/preferences": {
    "get": {
      "tags": ["Notifications"],
      "summary": "Get notification channel preferences",
      "description": "Returns email and in-app preferences for order, marketing, and security notifications.",
      "security": [{ "bearerAuth": [] }],
      "responses": {
        "200": { "description": "User notification preferences." }
      }
    },
    "put": {
      "tags": ["Notifications"],
      "summary": "Update notification channel preferences",
      "description": "Updates email and in-app alert subscriptions.",
      "security": [{ "bearerAuth": [] }],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "emailOrders": { "type": "boolean" },
                "emailMarketing": { "type": "boolean" },
                "emailSecurity": { "type": "boolean" },
                "inAppOrders": { "type": "boolean" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Preferences saved." }
      }
    }
  }
};
