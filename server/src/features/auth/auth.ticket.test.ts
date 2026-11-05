import { describe, it, expect } from "vitest";
import {
  generateOAuthState,
  verifyOAuthState,
  createAuthTicket,
  consumeAuthTicket,
} from "./auth.ticket.js";

describe("OAuth State Security (HMAC Signed)", () => {
  const secret = "test-secret-key-123456789";

  it("should generate a valid state and verify it successfully", () => {
    const state = generateOAuthState(secret);
    expect(typeof state).toBe("string");
    expect(state.length).toBeGreaterThan(20);

    const isValid = verifyOAuthState(state, secret);
    expect(isValid).toBe(true);
  });

  it("should reject tampered state", () => {
    const state = generateOAuthState(secret);
    const tampered = state.slice(0, -4) + "XXXX";
    expect(verifyOAuthState(tampered, secret)).toBe(false);
  });

  it("should reject state signed with a different secret", () => {
    const state = generateOAuthState(secret);
    expect(verifyOAuthState(state, "wrong-secret-key")).toBe(false);
  });

  it("should reject expired state", () => {
    const state = generateOAuthState(secret);
    // Max age of 0ms should fail immediately
    expect(verifyOAuthState(state, secret, -1000)).toBe(false);
  });
});

describe("Single-Use Exchange Ticket", () => {
  const samplePayload = {
    accessToken: "test-access-token-xyz",
    refreshToken: "test-refresh-token-abc",
    user: {
      id: "usr_123",
      name: "Daniel Test",
      email: "daniel@example.com",
      role: "CUSTOMER",
    },
  };

  it("should create a ticket and consume it successfully once", async () => {
    const ticket = await createAuthTicket(samplePayload);
    expect(typeof ticket).toBe("string");
    expect(ticket.length).toBe(64);

    const consumed = await consumeAuthTicket(ticket);
    expect(consumed).not.toBeNull();
    expect(consumed?.accessToken).toBe(samplePayload.accessToken);
    expect(consumed?.user.email).toBe(samplePayload.user.email);

    // Second consumption must be burned (single-use)
    const secondTry = await consumeAuthTicket(ticket);
    expect(secondTry).toBeNull();
  });

  it("should return null for non-existent ticket", async () => {
    const result = await consumeAuthTicket("non_existent_ticket_12345");
    expect(result).toBeNull();
  });
});
