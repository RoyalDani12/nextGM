export const userDocs = {
  "/api/users/me": {
    get: {
      summary: "Fetch current authenticated session user profile profile",
      tags: ["User Accounts"],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: "Identity data returned." } }
    },
    put: {
      summary: "Modify personal profile demographic properties",
      tags: ["User Accounts"],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: "Profile schema adjusted." } }
    },
    delete: {
      summary: "Terminate client account structure entirely",
      tags: ["User Accounts"],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: "Account state systematically deleted." } }
    }
  },
  "/api/users/me/upload-signature": {
    get: {
      summary: "Generate upload tokens scoped specific to user space profiles",
      tags: ["User Accounts"],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: "Signature key block string generated." } }
    }
  },
  "/api/users/me/change-password": {
    patch: {
      summary: "Rotate account login password keys",
      tags: ["User Accounts"],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: "Security credential updated." } }
    }
  },
  "/api/users/me/deactivate": {
    post: {
      summary: "Temporarily freeze active identity states",
      tags: ["User Accounts"],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: "Account state changed to deactivated." } }
    }
  },
  "/api/users/me/reactivate": {
    post: {
      summary: "Re-enable access scopes to previously frozen identity states",
      tags: ["User Accounts"],
      responses: { 200: { description: "User account reactivated." } }
    }
  },
  "/api/users/me/sessions": {
    get: {
      summary: "Audit logged in token tracker devices",
      tags: ["User Sessions"],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: "Active records list payload array." } }
    },
    delete: {
      summary: "Revoke and purge all concurrent devices sessions except current",
      tags: ["User Sessions"],
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: "Outlying device tokens blacklisted." } }
    }
  },
  "/api/users/me/sessions/{id}": {
    delete: {
      summary: "Kill single specific state hardware session token index",
      tags: ["User Sessions"],
      security: [{ bearerAuth: [] }],
      parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Target session revoked." } }
    }
  }
};