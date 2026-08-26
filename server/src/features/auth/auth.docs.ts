export const authDocs = {
  "/api/auth/register": {
    "post": {
      "tags": ["Authentication"],
      "summary": "Register a new user",
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["name", "email", "password", "confirmPassword"],
              "properties": {
                "name": { "type": "string", "example": "Daniel" },
                "email": { "type": "string", "example": "daniel@test.com" },
                "password": { "type": "string", "example": "StrongPassword123!" },
                "confirmPassword": { "type": "string", "example": "StrongPassword123!" }
              }
            }
          }
        }
      },
      "responses": {
        "201": { "description": "Registered successfully" },
        "400": { "description": "Validation failed" }
      }
    }
  },
  "/api/auth/verify-email": {
    "get": {
      "tags": ["Authentication"],
      "summary": "Verify user email via token",
      "parameters": [
        {
          "name": "token",
          "in": "query",
          "required": true,
          "schema": { "type": "string" },
          "example": "verification-token-xyz"
        }
      ],
      "responses": {
        "200": { "description": "Email verified successfully" },
        "400": { "description": "Invalid or expired token" }
      }
    }
  },
  "/api/auth/login": {
    "post": {
      "tags": ["Authentication"],
      "summary": "User login",
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["email", "password"],
              "properties": {
                "email": { "type": "string", "example": "daniel@test.com" },
                "password": { "type": "string", "example": "StrongPassword123!" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Logged in successfully" },
        "401": { "description": "Invalid credentials" }
      }
    }
  },
  "/api/auth/refresh-token": {
    "post": {
      "tags": ["Authentication"],
      "summary": "Refresh access token using refresh token cookie",
      "security": [{ "bearerAuth": [] }],
      "responses": {
        "200": { "description": "Token refreshed successfully" },
        "401": { "description": "Unauthorized / Invalid session" }
      }
    }
  },
  "/api/auth/logout": {
    "post": {
      "tags": ["Authentication"],
      "summary": "Logout user and clear session cookies",
      "security": [{ "bearerAuth": [] }],
      "responses": {
        "200": { "description": "Logged out successfully" },
        "401": { "description": "Unauthorized" }
      }
    }
  },
  "/api/auth/resend-verification": {
    "post": {
      "tags": ["Authentication"],
      "summary": "Resend email verification link",
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["email"],
              "properties": {
                "email": { "type": "string", "example": "daniel@test.com" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Verification email resent successfully" },
        "400": { "description": "Validation failed" }
      }
    }
  },
  "/api/auth/forgot-password": {
    "post": {
      "tags": ["Authentication"],
      "summary": "Request password reset link",
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["email"],
              "properties": {
                "email": { "type": "string", "example": "daniel@test.com" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Password reset link sent to email" },
        "400": { "description": "Validation failed" },
        "404": { "description": "User not found" }
      }
    }
  },
  "/api/auth/reset-password": {
    "post": {
      "tags": ["Authentication"],
      "summary": "Reset password using the received token",
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["token", "newPassword"],
              "properties": {
                "token": { "type": "string", "example": "reset-token-xyz-123" },
                "newPassword": { "type": "string", "example": "NewStrongPassword123!" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Password reset successfully" },
        "400": { "description": "Validation failed or invalid token" }
      }
    }
  }
};