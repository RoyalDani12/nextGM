import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./auth.utils.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
} from "../features/auth/token.service.js";

describe("Auth Utilities & Cryptography", () => {
  it("should hash a password and verify it successfully with bcrypt", async () => {
    const password = "StrongPassword@123";
    const hashed = await hashPassword(password);

    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(password);
    expect(hashed.startsWith("$2b$")).toBe(true);

    const isMatch = await verifyPassword(password, hashed);
    expect(isMatch).toBe(true);

    const isWrongMatch = await verifyPassword("WrongPassword!999", hashed);
    expect(isWrongMatch).toBe(false);
  });

  it("should generate a short-lived access token with expected payload", () => {
    const token = generateAccessToken("usr_123", "CUSTOMER");

    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);

    const decoded = verifyAccessToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe("usr_123");
    expect(decoded?.role).toBe("CUSTOMER");
  });

  it("should generate a refresh token signed with refresh secret", () => {
    const refreshToken = generateRefreshToken("usr_123");

    expect(typeof refreshToken).toBe("string");
    expect(refreshToken.split(".").length).toBe(3);

    // Refresh token should NOT verify with access token secret
    const decodedWithAccessSecret = verifyAccessToken(refreshToken);
    expect(decodedWithAccessSecret).toBeNull();
  });

  it("should reject forged or malformed tokens cleanly", () => {
    expect(verifyAccessToken("invalid.garbage.token")).toBeNull();
    expect(verifyAccessToken("")).toBeNull();
  });
});
