export const authDocs = {
  "/api/auth/register": {
    post: {
      tags: ["Authentication"],
      summary: "Register a new user",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "email", "password", "confirmPassword"],
              properties: {
                name: { type: "string", example: "Daniel" },
                email: { type: "string", example: "daniel@test.com" },
                password: { type: "string", example: "StrongPassword123!" },
                confirmPassword: { type: "string", example: "StrongPassword123!" }
              }
            }
          }
        }
      },
      responses: { 201: { description: "Registered successfully" }, 400: { description: "Validation failed" } }
    }
  },
  "/api/auth/login": {
    post: {
      tags: ["Authentication"],
      summary: "User login",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "password"],
              properties: {
                email: { type: "string", example: "daniel@test.com" },
                password: { type: "string", example: "StrongPassword123!" }
              }
            }
          }
        }
      },
      responses: { 200: { description: "Logged in successfully" }, 401: { description: "Invalid credentials" } }
    }
  },
  "/api/auth/verify-email": {
    get: {
      tags: ["Authentication"],
      summary: "Verify user email via token",
      parameters: [
        { name: "token", in: "query", required: true, schema: { type: "string" }, example: "verification-token-xyz" }
      ],
      responses: { 200: { description: "Email verified" } }
    }
  }
};