import { describe, it, vi, expect, beforeEach } from "vitest";
import {
  registerService,
  loginService,
  refreshTokenService,
  logoutService,
  verifyEmailService,
  forgotPasswordService,
  resetPasswordService,
} from "./auth.services.js";
import * as authRepo from "./auth.repository.js";
import { emailQueue } from "../../infrastructure/queue/queue.client.js";
import { redis } from "../../infrastructure/cache/redis.client.js";
import * as sessionCache from "../../infrastructure/cache/session.cache.js";
import * as authUtils from "../../utils/auth.utils.js";
import * as tokenService from "./token.service.js";

// Mock dependencies
vi.mock("./auth.repository.js");
vi.mock("../../infrastructure/cache/session.cache.js", () => ({
  cacheUserSession: vi.fn().mockResolvedValue(undefined),
  getUserSession: vi.fn().mockResolvedValue(null),
  deleteUserSession: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../infrastructure/cache/redis.client.js", () => ({
  redis: {
    set: vi.fn().mockResolvedValue("OK"),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1),
  },
}));
vi.mock("../../infrastructure/queue/queue.client.js", () => ({
  emailQueue: { add: vi.fn().mockResolvedValue({ id: "job_1" }) },
}));
vi.mock("../../services/email.templates.js", () => ({
  verificationEmailTemplate: vi.fn(() => ({ subject: "Verify", html: "<p>verify</p>" })),
  welcomeEmailTemplate: vi.fn(() => ({ subject: "Welcome", html: "<p>welcome</p>" })),
  resetPasswordEmailTemplate: vi.fn(() => ({ subject: "Reset", html: "<p>reset</p>" })),
  passwordResetSuccessTemplate: vi.fn(() => ({ subject: "Success", html: "<p>success</p>" })),
}));
vi.mock("../admin/audit.service.js", () => ({
  recordAuditLog: vi.fn().mockResolvedValue(undefined),
}));

describe("Authentication Services Unit & Security Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("registerService", () => {
    it("should throw 409 if email already exists", async () => {
      vi.spyOn(authRepo, "findUserByEmail").mockResolvedValue({
        id: "1",
        email: "existing@nexions.io",
      } as any);

      await expect(
        registerService({
          name: "Test",
          email: "existing@nexions.io",
          password: "Password123!",
        })
      ).rejects.toThrow("Email already in use");

      expect(emailQueue.add).not.toHaveBeenCalled();
    });

    it("should register new user and dispatch email verification job", async () => {
      vi.spyOn(authRepo, "findUserByEmail").mockResolvedValue(null);
      vi.spyOn(authRepo, "createUserWithVerification").mockResolvedValue({
        user: { id: "u_1", name: "Test User", email: "new@nexions.io", createdAt: new Date() },
        rawToken: "raw_token_xyz",
      } as any);

      const result = await registerService({
        name: "Test User",
        email: "new@nexions.io",
        password: "Password123!",
      });

      expect(result.user.id).toBe("u_1");
      expect(emailQueue.add).toHaveBeenCalledWith(
        "verify-email",
        expect.objectContaining({ to: "new@nexions.io" })
      );
    });
  });

  describe("loginService", () => {
    const mockDevice = { ipAddress: "127.0.0.1", userAgent: "Mozilla", deviceName: "Chrome" };

    it("should throw 401 on non-existent email without leaking user status", async () => {
      vi.spyOn(authRepo, "findUserByEmail").mockResolvedValue(null);

      await expect(
        loginService({ email: "unknown@nexions.io", password: "Password123!" }, mockDevice)
      ).rejects.toThrow("Invalid password or Email");
    });

    it("should throw 401 when password does not match before checking account flags", async () => {
      vi.spyOn(authRepo, "findUserByEmail").mockResolvedValue({
        id: "u_1",
        email: "user@nexions.io",
        password: "hashed_password",
        isEmailVerified: false, // unverified!
        status: "SUSPENDED", // suspended!
      } as any);
      vi.spyOn(authUtils, "verifyPassword").mockResolvedValue(false);

      // Must fail with password check, NOT revealing suspended or unverified status
      await expect(
        loginService({ email: "user@nexions.io", password: "WrongPassword!" }, mockDevice)
      ).rejects.toThrow("Invalid password or Email");
    });

    it("should throw 403 if valid credentials provided for unverified email", async () => {
      vi.spyOn(authRepo, "findUserByEmail").mockResolvedValue({
        id: "u_1",
        email: "user@nexions.io",
        password: "hashed_password",
        isEmailVerified: false,
        status: "PENDING",
      } as any);
      vi.spyOn(authUtils, "verifyPassword").mockResolvedValue(true);

      await expect(
        loginService({ email: "user@nexions.io", password: "CorrectPassword!" }, mockDevice)
      ).rejects.toThrow("Please verify your email before logging in.");
    });

    it("should throw 403 if account is suspended", async () => {
      vi.spyOn(authRepo, "findUserByEmail").mockResolvedValue({
        id: "u_1",
        email: "user@nexions.io",
        password: "hashed_password",
        isEmailVerified: true,
        status: "SUSPENDED",
      } as any);
      vi.spyOn(authUtils, "verifyPassword").mockResolvedValue(true);

      await expect(
        loginService({ email: "user@nexions.io", password: "CorrectPassword!" }, mockDevice)
      ).rejects.toThrow("Your account has been Suspended");
    });

    it("should return reactivation code and key when account is deactivated", async () => {
      vi.spyOn(authRepo, "findUserByEmail").mockResolvedValue({
        id: "u_1",
        email: "user@nexions.io",
        password: "hashed_password",
        isEmailVerified: true,
        status: "DEACTIVATED",
      } as any);
      vi.spyOn(authUtils, "verifyPassword").mockResolvedValue(true);

      const result = await loginService(
        { email: "user@nexions.io", password: "CorrectPassword!" },
        mockDevice
      );

      expect(result).toHaveProperty("code", "ACCOUNT_DEACTIVATED");
      expect(result).toHaveProperty("reactivationKey");
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringMatching(/^reactivate:/),
        "u_1",
        "EX",
        600
      );
    });

    it("should issue access/refresh tokens and cache session on successful login", async () => {
      vi.spyOn(authRepo, "findUserByEmail").mockResolvedValue({
        id: "u_1",
        name: "Test User",
        email: "user@nexions.io",
        password: "hashed_password",
        role: "CUSTOMER",
        status: "ACTIVE",
        isEmailVerified: true,
        passwordChangedAt: null,
      } as any);
      vi.spyOn(authUtils, "verifyPassword").mockResolvedValue(true);
      vi.spyOn(authRepo, "saveRefreshTokenAndUpdateLastLogin").mockResolvedValue(undefined as any);

      const result = (await loginService(
        { email: "user@nexions.io", password: "CorrectPassword!" },
        mockDevice
      )) as any;

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.id).toBe("u_1");
      expect(sessionCache.cacheUserSession).toHaveBeenCalledWith(
        expect.objectContaining({ id: "u_1", status: "ACTIVE" })
      );
    });
  });

  describe("refreshTokenService", () => {
    it("should throw 401 if refresh token does not exist in database", async () => {
      vi.spyOn(authRepo, "findRefreshToken").mockResolvedValue(null);

      await expect(refreshTokenService("invalid_token")).rejects.toThrow(
        "Invalid or expired Token."
      );
    });

    it("should throw 401 if refresh token is expired", async () => {
      vi.spyOn(authRepo, "findRefreshToken").mockResolvedValue({
        id: "tok_1",
        userId: "u_1",
        expiresAt: new Date(Date.now() - 10000), // in the past
      } as any);

      await expect(refreshTokenService("expired_token")).rejects.toThrow(
        "Refresh token has expired."
      );
    });

    it("should throw 403 if user status is no longer ACTIVE", async () => {
      vi.spyOn(authRepo, "findRefreshToken").mockResolvedValue({
        id: "tok_1",
        userId: "u_1",
        expiresAt: new Date(Date.now() + 60000),
      } as any);
      vi.spyOn(sessionCache, "getUserSession").mockResolvedValue({
        id: "u_1",
        name: "Test",
        email: "test@nexions.io",
        role: "CUSTOMER",
        status: "SUSPENDED",
        passwordChangedAt: null,
      });

      await expect(refreshTokenService("valid_token")).rejects.toThrow("Account suspended");
    });

    it("should rotate token and update session cache on valid refresh", async () => {
      vi.spyOn(authRepo, "findRefreshToken").mockResolvedValue({
        id: "tok_1",
        userId: "u_1",
        expiresAt: new Date(Date.now() + 60000),
      } as any);
      vi.spyOn(sessionCache, "getUserSession").mockResolvedValue({
        id: "u_1",
        name: "Test",
        email: "test@nexions.io",
        role: "CUSTOMER",
        status: "ACTIVE",
        passwordChangedAt: null,
      });
      vi.spyOn(authRepo, "rotateRefreshToken").mockResolvedValue(undefined as any);

      const result = await refreshTokenService("valid_token");

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(authRepo.rotateRefreshToken).toHaveBeenCalledWith(
        "tok_1",
        "u_1",
        expect.any(String)
      );
    });
  });

  describe("logoutService", () => {
    it("should delete refresh token and delete session from Redis", async () => {
      vi.spyOn(authRepo, "deleteRefreshToken").mockResolvedValue({ count: 1 } as any);

      const result = await logoutService("u_1", "raw_refresh_token");

      expect(result.message).toBe("Logged out successfully.");
      expect(authRepo.deleteRefreshToken).toHaveBeenCalled();
      expect(sessionCache.deleteUserSession).toHaveBeenCalledWith("u_1");
    });
  });

  describe("verifyEmailService", () => {
    it("should throw 400 on non-existent token", async () => {
      vi.spyOn(authRepo, "findEmailVerification").mockResolvedValue(null);

      await expect(verifyEmailService("bad_token")).rejects.toThrow(
        "Invalid or Expired verification link"
      );
    });

    it("should throw 400 on expired verification token", async () => {
      vi.spyOn(authRepo, "findEmailVerification").mockResolvedValue({
        id: "v_1",
        userId: "u_1",
        expiresAt: new Date(Date.now() - 5000),
        user: { isEmailVerified: false },
      } as any);

      await expect(verifyEmailService("expired_token")).rejects.toThrow(
        "Verification link has expired"
      );
    });

    it("should mark verified and send welcome email on valid token", async () => {
      vi.spyOn(authRepo, "findEmailVerification").mockResolvedValue({
        id: "v_1",
        userId: "u_1",
        expiresAt: new Date(Date.now() + 10000),
        user: { isEmailVerified: false, email: "user@nexions.io" },
      } as any);
      vi.spyOn(authRepo, "markEmailVerified").mockResolvedValue(undefined as any);

      const result = await verifyEmailService("valid_token");

      expect(result.message).toContain("Email verified successfully");
      expect(authRepo.markEmailVerified).toHaveBeenCalledWith("u_1", "v_1");
      expect(emailQueue.add).toHaveBeenCalledWith(
        "Welcome-email",
        expect.objectContaining({ to: "user@nexions.io" })
      );
    });
  });

  describe("forgotPasswordService & resetPasswordService", () => {
    it("forgotPasswordService should return generic message even if email is unverified or missing", async () => {
      vi.spyOn(authRepo, "findUserByEmail").mockResolvedValue(null);

      const result = await forgotPasswordService("notfound@nexions.io");
      expect(result.message).toContain("If this email is registered");
      expect(emailQueue.add).not.toHaveBeenCalled();
    });

    it("forgotPasswordService should generate token and enqueue email for verified active user", async () => {
      vi.spyOn(authRepo, "findUserByEmail").mockResolvedValue({
        id: "u_1",
        name: "User One",
        email: "user@nexions.io",
        isEmailVerified: true,
        status: "ACTIVE",
      } as any);
      vi.spyOn(authRepo, "deletePasswordResetTokens").mockResolvedValue({ count: 1 } as any);
      vi.spyOn(authRepo, "createPasswordResetToken").mockResolvedValue({} as any);

      const result = await forgotPasswordService("user@nexions.io");

      expect(result.message).toContain("If this email is registered");
      expect(authRepo.createPasswordResetToken).toHaveBeenCalledWith("u_1", expect.any(String));
      expect(emailQueue.add).toHaveBeenCalledWith(
        "reset-password",
        expect.objectContaining({ to: "user@nexions.io" })
      );
    });

    it("resetPasswordService should throw 403 on invalid token", async () => {
      vi.spyOn(authRepo, "findResetPasswordToken").mockResolvedValue(null);

      await expect(resetPasswordService("invalid_token", "NewPass123!")).rejects.toThrow(
        "Invalid or expired reset link."
      );
    });

    it("resetPasswordService should update password, invalidate session, and enqueue success notice", async () => {
      vi.spyOn(authRepo, "findResetPasswordToken").mockResolvedValue({
        id: "reset_1",
        userId: "u_1",
        used: false,
        expiresAt: new Date(Date.now() + 60000),
        user: { name: "User", email: "user@nexions.io" },
      } as any);
      vi.spyOn(authRepo, "resetPasswordAndRevoke").mockResolvedValue(undefined as any);

      const result = await resetPasswordService("valid_token", "NewPass123!");

      expect(result.message).toContain("Password reset successful");
      expect(authRepo.resetPasswordAndRevoke).toHaveBeenCalledWith(
        "reset_1",
        "u_1",
        expect.any(String)
      );
      expect(sessionCache.deleteUserSession).toHaveBeenCalledWith("u_1");
      expect(emailQueue.add).toHaveBeenCalledWith(
        "password-reset-success",
        expect.objectContaining({ to: "user@nexions.io" })
      );
    });
  });
});
