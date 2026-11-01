export const userDocs = {
  "/api/v1/users/me": {
    "get": {
      "tags": ["Users"],
      "summary": "Get authenticated user profile",
      "description": "Retrieves the current user profile, security standing, roles, and verified shops.",
      "security": [{ "bearerAuth": [] }],
      "responses": {
        "200": { "description": "Profile retrieved successfully." },
        "401": { "description": "Unauthorized. Bearer token missing or invalid." }
      }
    },
    "put": {
      "tags": ["Users"],
      "summary": "Update user profile",
      "description": "Updates full name, contact phone, or profile avatar URL.",
      "security": [{ "bearerAuth": [] }],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "name": { "type": "string", "example": "Jane Doe" },
                "phone": { "type": "string", "example": "+1234567890" },
                "avatar": { "type": "string", "format": "uri", "example": "https://res.cloudinary.com/demo/avatar.jpg" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Profile updated successfully." },
        "400": { "description": "Validation error." }
      }
    },
    "delete": {
      "tags": ["Users"],
      "summary": "Permanently delete account",
      "description": "Deletes the user account permanently. Requires password confirmation.",
      "security": [{ "bearerAuth": [] }],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["password"],
              "properties": {
                "password": { "type": "string", "format": "password", "example": "CurrentPassword123!" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Account permanently deleted." },
        "400": { "description": "Incorrect password or account has active shops/pending payouts." }
      }
    }
  },
  "/api/v1/users/me/upload-signature": {
    "get": {
      "tags": ["Users"],
      "summary": "Generate avatar upload signature",
      "description": "Returns cryptographic Cloudinary upload signature specifically for user profile avatars.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        {
          "name": "mimeType",
          "in": "query",
          "required": true,
          "schema": { "type": "string", "enum": ["image/jpeg", "image/png", "image/webp"] }
        }
      ],
      "responses": {
        "200": { "description": "Upload signature generated." }
      }
    }
  },
  "/api/v1/users/me/change-password": {
    "patch": {
      "tags": ["Users"],
      "summary": "Change account password",
      "description": "Updates password after verifying the existing current password.",
      "security": [{ "bearerAuth": [] }],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["currentPassword", "newPassword", "confirmNewPassword"],
              "properties": {
                "currentPassword": { "type": "string", "format": "password" },
                "newPassword": { "type": "string", "format": "password" },
                "confirmNewPassword": { "type": "string", "format": "password" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Password changed successfully." },
        "400": { "description": "Current password incorrect or new password invalid." }
      }
    }
  },
  "/api/v1/users/me/deactivate": {
    "post": {
      "tags": ["Users"],
      "summary": "Deactivate account",
      "description": "Temporarily disables user account. Can be reactivated later.",
      "security": [{ "bearerAuth": [] }],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["password"],
              "properties": {
                "password": { "type": "string", "format": "password" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Account deactivated." }
      }
    }
  },
  "/api/v1/users/me/reactivate": {
    "post": {
      "tags": ["Users"],
      "summary": "Reactivate account",
      "description": "Reactivates a deactivated account using email and password credentials.",
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["email", "password"],
              "properties": {
                "email": { "type": "string", "format": "email" },
                "password": { "type": "string", "format": "password" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Account successfully reactivated." }
      }
    }
  },
  "/api/v1/users/me/sessions": {
    "get": {
      "tags": ["Users"],
      "summary": "List active login sessions",
      "description": "Returns all active devices and refresh token sessions with browser, IP, and location metadata.",
      "security": [{ "bearerAuth": [] }],
      "responses": {
        "200": { "description": "Active session list retrieved." }
      }
    },
    "delete": {
      "tags": ["Users"],
      "summary": "Revoke all other sessions",
      "description": "Logs out all other devices and terminates all foreign sessions.",
      "security": [{ "bearerAuth": [] }],
      "responses": {
        "200": { "description": "All other sessions revoked." }
      }
    }
  },
  "/api/v1/users/me/sessions/{id}": {
    "delete": {
      "tags": ["Users"],
      "summary": "Revoke a specific session",
      "description": "Terminates a specific active device session by session ID.",
      "security": [{ "bearerAuth": [] }],
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "schema": { "type": "string" },
          "description": "Session ID to revoke"
        }
      ],
      "responses": {
        "200": { "description": "Session revoked." },
        "404": { "description": "Session not found." }
      }
    }
  }
};
