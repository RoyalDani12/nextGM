import { describe, it, expect } from "vitest";
import { hashPassword, generateToken } from "./auth.utils.js";

describe("Auth utilities", () => {
  it("Should hash the password successful", async () => {
    const password = "pass123";
    const hashed = await hashPassword(password);

    expect(hashed).toBeDefined();
    // logic hash should not be equal to the plain password
    expect(hashed).not.toBe(password);
  });

  it("Should generate a valid JWT string", () => {
    const payload = { id: "123", email: "test@test.com" };
    const token = generateToken(payload);

    expect(typeof token).toBe("string");
    // JWT has three patterns
    expect(token.split(".").length).toBe(3);
  });
});
