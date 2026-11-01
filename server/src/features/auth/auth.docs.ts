export const authDocs = {
  "/api/v1/auth/register": {
    "post": {
      "tags": ["Authentication"],
      "summary": "Register a new user account",
      "description": "Registers a new customer or merchant. Sends an email verification link.",
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["name", "email", "password", "confirmPassword"],
              "properties": {
                "name": { "type": "string", "example": "John Doe" },
                "email": { "type": "string", "format": "email", "example": "john@example.com" },
                "password": { "type": "string", "format": "password", "example": "SecurePass123!" },
                "confirmPassword": { "type": "string", "format": "password", "example": "SecurePass123!" }
              }
            }
          }
        }
      },
      "responses": {
        "201": { "description": "User registered successfully. Verification email sent." },
        "400": { "description": "Validation error or email already in use." },
        "429": { "description": "Too many requests. Rate limit exceeded." }
      }
    }
  },
  "/api/v1/auth/verify-email": {
    "get": {
      "tags": ["Authentication"],
      "summary": "Verify user email via token",
      "description": "Activates the user account upon verifying the email confirmation token.",
      "parameters": [
        {
          "name": "token",
          "in": "query",
          "required": true,
          "schema": { "type": "string" },
          "description": "Cryptographic verification token sent to user's email",
          "example": "abc123token"
        }
      ],
      "responses": {
        "200": { "description": "Email verified successfully." },
        "400": { "description": "Invalid, corrupted, or expired token." }
      }
    }
  },
  "/api/v1/auth/login": {
    "post": {
      "tags": ["Authentication"],
      "summary": "User authentication (Login)",
      "description": "Authenticates user with email and password. Returns access token and sets httpOnly refresh token cookie.",
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["email", "password"],
              "properties": {
                "email": { "type": "string", "format": "email", "example": "john@example.com" },
                "password": { "type": "string", "format": "password", "example": "SecurePass123!" }
              }
            }
          }
        }
      },
      "responses": {
        "200": {
          "description": "Login successful. Returns access token and user profile.",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "success": { "type": "boolean", "example": true },
                  "statusCode": { "type": "integer", "example": 200 },
                  "message": { "type": "string", "example": "Login successful." },
                  "data": {
                    "type": "object",
                    "properties": {
                      "user": {
                        "type": "object",
                        "properties": {
                          "id": { "type": "string" },
                          "name": { "type": "string" },
                          "email": { "type": "string" },
                          "role": { "type": "string", "enum": ["CUSTOMER", "MERCHANT", "SUPER_ADMIN"] }
                        }
                      },
                      "accessToken": { "type": "string" }
                    }
                  }
                }
              }
            }
          }
        },
        "400": { "description": "Invalid credentials or email not verified." },
        "403": { "description": "Account suspended or deactivated." },
        "429": { "description": "Rate limit exceeded." }
      }
    }
  },
  "/api/v1/auth/google": {
    "get": {
      "tags": ["Authentication"],
      "summary": "Initiate Google OAuth SSO",
      "description": "Redirects user to Google OAuth consent screen for seamless Single Sign-On.",
      "responses": {
        "302": { "description": "Redirects to accounts.google.com" }
      }
    }
  },
  "/api/v1/auth/google/callback": {
    "get": {
      "tags": ["Authentication"],
      "summary": "Google OAuth Callback Handler",
      "description": "Exchange Google authorization code for platform session tokens and redirects to dashboard.",
      "parameters": [
        { "name": "code", "in": "query", "required": true, "schema": { "type": "string" } },
        { "name": "state", "in": "query", "required": false, "schema": { "type": "string" } }
      ],
      "responses": {
        "302": { "description": "Redirects to client app with session established." },
        "400": { "description": "OAuth authorization failed." }
      }
    }
  },
  "/api/v1/auth/refresh-token": {
    "post": {
      "tags": ["Authentication"],
      "summary": "Refresh Access Token",
      "description": "Generates a new JWT access token using the valid httpOnly refresh token cookie.",
      "responses": {
        "200": { "description": "New access token granted." },
        "401": { "description": "Invalid or expired refresh token." }
      }
    }
  },
  "/api/v1/auth/logout": {
    "post": {
      "tags": ["Authentication"],
      "summary": "User Logout",
      "description": "Clears httpOnly authentication cookies and revokes active refresh token session.",
      "security": [{ "bearerAuth": [] }],
      "responses": {
        "200": { "description": "Logged out successfully." },
        "401": { "description": "Unauthorized." }
      }
    }
  },
  "/api/v1/auth/resend-verification": {
    "post": {
      "tags": ["Authentication"],
      "summary": "Resend Email Verification",
      "description": "Sends a fresh email verification link if the previous one expired.",
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["email"],
              "properties": {
                "email": { "type": "string", "format": "email", "example": "john@example.com" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Verification email resent." },
        "400": { "description": "User already verified or not found." }
      }
    }
  },
  "/api/v1/auth/forgot-password": {
    "post": {
      "tags": ["Authentication"],
      "summary": "Initiate Password Reset",
      "description": "Generates a password recovery token and sends reset instructions to the registered email.",
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["email"],
              "properties": {
                "email": { "type": "string", "format": "email", "example": "john@example.com" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Password reset instructions dispatched." },
        "404": { "description": "No account registered with that email address." }
      }
    }
  },
  "/api/v1/auth/reset-password": {
    "post": {
      "tags": ["Authentication"],
      "summary": "Complete Password Reset",
      "description": "Resets user password using the token received in recovery email.",
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": ["token", "newPassword", "confirmNewPassword"],
              "properties": {
                "token": { "type": "string", "example": "reset-token-xyz" },
                "newPassword": { "type": "string", "format": "password", "example": "BrandNewSecret123!" },
                "confirmNewPassword": { "type": "string", "format": "password", "example": "BrandNewSecret123!" }
              }
            }
          }
        }
      },
      "responses": {
        "200": { "description": "Password reset successfully. Please login with new credentials." },
        "400": { "description": "Invalid or expired reset token." }
      }
    }
  }
};
