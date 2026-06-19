export const authDocs = {
  "/api/auth/register": {
    post: {
      summary: "Register a new user",
      tags: ["Authentication"],
      responses: { 201: { description: "User registered successfully." } }
    }
  },
  "/api/auth/verify-email": {
    get: {
      summary: "Verify user email address",
      tags: ["Authentication"],
      responses: { 200: { description: "Email verified successfully." } }
    }
  },
  "/api/auth/login": {
    post: {
      summary: "Log in user credentials",
      tags: ["Authentication"],
      responses: { 200: { description: "Login successful." } }
    }
  },
  "/api/auth/refresh-token": {
    post: {
      summary: "Refresh access token",
      tags: ["Authentication"],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: "Token refreshed." } }
    }
  },
  "/api/auth/logout": {
    post: {
      summary: "Log out user session",
      tags: ["Authentication"],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: "Logged out." } }
    }
  },
  "/api/auth/resend-verification": {
    post: {
      summary: "Resend email verification link",
      tags: ["Authentication"],
      responses: { 200: { description: "Verification email sent." } }
    }
  },
  "/api/auth/forgot-password": {
    post: {
      summary: "Request password reset token",
      tags: ["Authentication"],
      responses: { 200: { description: "Reset email dispatched." } }
    }
  },
  "/api/auth/reset-password": {
    post: {
      summary: "Execute account password reset",
      tags: ["Authentication"],
      responses: { 200: { description: "Password reset completed." } }
    }
  }
};