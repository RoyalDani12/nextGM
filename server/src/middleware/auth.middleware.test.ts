import { describe, it, vi, expect, beforeEach } from "vitest";
import { authenticate } from "./auth.middleware.js";
import { authorizeRoles } from "./authorizeRoles.middleware.js";
import { authorizeSuperAdmin } from "./authorizeSuperAdmin.middleware.js";
import * as tokenService from "../features/auth/token.service.js";
import * as sessionCache from "../infrastructure/cache/session.cache.js";
import * as authRepo from "../features/auth/auth.repository.js";

vi.mock("../features/auth/token.service.js");
vi.mock("../infrastructure/cache/session.cache.js");
vi.mock("../features/auth/auth.repository.js");

describe("Authentication & Authorization Middleware Tests", () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      headers: {},
      user: undefined,
    };
    res = {};
    next = vi.fn();
  });

  describe("authenticate middleware", () => {
    it("should call next with 401 if authorization header is missing", async () => {
      authenticate(req, res, next);
      await Promise.resolve();

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Not token provided",
          statusCode: 401,
        })
      );
    });

    it("should call next with 401 if header does not start with Bearer", async () => {
      req.headers.authorization = "Basic 123456";
      authenticate(req, res, next);
      await Promise.resolve();

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Not token provided",
          statusCode: 401,
        })
      );
    });

    it("should call next with 401 if token is expired or invalid", async () => {
      req.headers.authorization = "Bearer invalid_or_expired_jwt";
      vi.spyOn(tokenService, "verifyAccessToken").mockReturnValue(null as any);

      authenticate(req, res, next);
      await Promise.resolve();

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid or expired token",
          statusCode: 401,
        })
      );
    });

    it("should call next with 401 if user password was changed after token issuance", async () => {
      req.headers.authorization = "Bearer valid_jwt";
      const tokenIssuedSec = 1700000000;
      vi.spyOn(tokenService, "verifyAccessToken").mockReturnValue({
        userId: "u_1",
        role: "CUSTOMER",
        iat: tokenIssuedSec,
      } as any);

      // Password changed 10 seconds after token was issued
      const passwordChangedMs = (tokenIssuedSec + 10) * 1000;
      vi.spyOn(sessionCache, "getUserSession").mockResolvedValue({
        id: "u_1",
        name: "Test User",
        email: "test@nexions.io",
        role: "CUSTOMER",
        status: "ACTIVE",
        passwordChangedAt: new Date(passwordChangedMs),
      });

      authenticate(req, res, next);
      // Wait for async execution
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Password recently changed.Please login again.",
          statusCode: 401,
        })
      );
    });

    it("should call next with 403 if user account is suspended", async () => {
      req.headers.authorization = "Bearer valid_jwt";
      vi.spyOn(tokenService, "verifyAccessToken").mockReturnValue({
        userId: "u_1",
        role: "CUSTOMER",
        iat: 1700000000,
      } as any);

      vi.spyOn(sessionCache, "getUserSession").mockResolvedValue({
        id: "u_1",
        name: "Test User",
        email: "test@nexions.io",
        role: "CUSTOMER",
        status: "SUSPENDED",
        passwordChangedAt: null,
      });

      authenticate(req, res, next);
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Account suspended.Contact support.",
          statusCode: 403,
        })
      );
    });

    it("should call next with 403 if user account is deactivated", async () => {
      req.headers.authorization = "Bearer valid_jwt";
      vi.spyOn(tokenService, "verifyAccessToken").mockReturnValue({
        userId: "u_1",
        role: "CUSTOMER",
        iat: 1700000000,
      } as any);

      vi.spyOn(sessionCache, "getUserSession").mockResolvedValue({
        id: "u_1",
        name: "Test User",
        email: "test@nexions.io",
        role: "CUSTOMER",
        status: "DEACTIVATED",
        passwordChangedAt: null,
      });

      authenticate(req, res, next);
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Account deactivated.reactivate to continue.",
          statusCode: 403,
        })
      );
    });

    it("should attach user to req and call next() on valid active token", async () => {
      req.headers.authorization = "Bearer valid_jwt";
      vi.spyOn(tokenService, "verifyAccessToken").mockReturnValue({
        userId: "u_1",
        role: "CUSTOMER",
        iat: 1700000000,
      } as any);

      const activeUser = {
        id: "u_1",
        name: "Test User",
        email: "test@nexions.io",
        role: "CUSTOMER",
        status: "ACTIVE",
        passwordChangedAt: null,
      };
      vi.spyOn(sessionCache, "getUserSession").mockResolvedValue(activeUser);

      authenticate(req, res, next);
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(req.user).toEqual(activeUser);
      expect(next).toHaveBeenCalledWith(); // called with no arguments
    });
  });

  describe("authorizeRoles & authorizeSuperAdmin middleware", () => {
    it("authorizeRoles should allow request when user has authorized role", () => {
      req.user = { id: "u_1", role: "SHOP_OWNER" };
      const middleware = authorizeRoles("SHOP_OWNER", "SUPER_ADMIN");

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("authorizeRoles should throw 403 when user does not have authorized role", () => {
      req.user = { id: "u_1", role: "CUSTOMER" };
      const middleware = authorizeRoles("SHOP_OWNER", "SUPER_ADMIN");

      expect(() => middleware(req, res, next)).toThrow("Forbidden.");
      expect(next).not.toHaveBeenCalled();
    });

    it("authorizeSuperAdmin should allow SUPER_ADMIN role only", () => {
      req.user = { id: "u_1", role: "SUPER_ADMIN" };

      authorizeSuperAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("authorizeSuperAdmin should throw 403 for SHOP_OWNER and CUSTOMER", () => {
      req.user = { id: "u_1", role: "SHOP_OWNER" };

      expect(() => authorizeSuperAdmin(req, res, next)).toThrow("Forbidden.");
      expect(next).not.toHaveBeenCalled();
    });
  });
});
