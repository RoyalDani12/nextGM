import { redis } from "../../infrastructure/cache/redis.client.js";
import crypto from "crypto";

export interface AuthTicketPayload {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

// In-memory fallback if Redis is temporarily unreachable
const memoryTicketStore = new Map<string, { payload: AuthTicketPayload; expiresAt: number }>();

const TICKET_TTL_SECONDS = 60; // 60-second single-use ticket

/**
 * Generate a single-use exchange ticket for OAuth callback
 */
export const createAuthTicket = async (payload: AuthTicketPayload): Promise<string> => {
  const ticket = crypto.randomBytes(32).toString("hex");
  const key = `auth:ticket:${ticket}`;

  try {
    await redis.set(key, JSON.stringify(payload), "EX", TICKET_TTL_SECONDS);
  } catch (error) {
    console.warn("[Auth Ticket] Redis unavailable, using in-memory store fallback:", error);
  }

  // Also record in memory store as safety net
  memoryTicketStore.set(ticket, {
    payload,
    expiresAt: Date.now() + TICKET_TTL_SECONDS * 1000,
  });

  // Keep memory map compact
  if (memoryTicketStore.size > 200) {
    const now = Date.now();
    for (const [k, v] of memoryTicketStore.entries()) {
      if (v.expiresAt < now) memoryTicketStore.delete(k);
    }
  }

  return ticket;
};

/**
 * Consume and burn a single-use exchange ticket
 */
export const consumeAuthTicket = async (ticket: string): Promise<AuthTicketPayload | null> => {
  if (!ticket || typeof ticket !== "string") return null;

  const key = `auth:ticket:${ticket}`;
  let dataStr: string | null = null;

  try {
    dataStr = await redis.get(key);
    if (dataStr) {
      await redis.del(key); // Burn immediately
    }
  } catch (error) {
    console.warn("[Auth Ticket] Redis get failed, checking in-memory fallback:", error);
  }

  if (dataStr) {
    memoryTicketStore.delete(ticket);
    try {
      return JSON.parse(dataStr) as AuthTicketPayload;
    } catch {
      return null;
    }
  }

  // Check in-memory store
  const item = memoryTicketStore.get(ticket);
  if (item) {
    memoryTicketStore.delete(ticket); // Burn immediately
    if (item.expiresAt > Date.now()) {
      return item.payload;
    }
  }

  return null;
};

/**
 * Generate a tamper-proof, timestamped, HMAC-signed OAuth state string.
 * Completely eliminates the need for state cookies that get dropped by browsers.
 */
export const generateOAuthState = (secret: string): string => {
  const timestamp = Date.now().toString();
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = `${timestamp}:${nonce}`;
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}:${hmac}`).toString("base64url");
};

/**
 * Verify HMAC signature and validity window of OAuth state.
 */
export const verifyOAuthState = (stateStr: string, secret: string, maxAgeMs = 10 * 60 * 1000): boolean => {
  try {
    if (!stateStr || typeof stateStr !== "string") return false;
    const decoded = Buffer.from(stateStr, "base64url").toString("utf-8");
    const [timestampStr, nonce, receivedHmac] = decoded.split(":");
    if (!timestampStr || !nonce || !receivedHmac) return false;

    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    if (isNaN(timestamp) || now - timestamp > maxAgeMs || now < timestamp - 60000) {
      return false; // Expired or invalid timestamp
    }

    const payload = `${timestampStr}:${nonce}`;
    const expectedHmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    if (receivedHmac.length !== expectedHmac.length) return false;
    return crypto.timingSafeEqual(Buffer.from(receivedHmac), Buffer.from(expectedHmac));
  } catch {
    return false;
  }
};
