import { redis } from "./redis.client.js";

const SESSION_TTL = 15 * 60; // 15 minutes

interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  status: string;
  passwordChangedAt: Date | null;
}

export const cacheUserSession = async (user: User) => {
  try {
    await redis.set(
      `session:${user.id}`,
      JSON.stringify(user),
      "EX",
      SESSION_TTL
    );
  } catch (error: any) {
    // Fail-safe: if Redis is unavailable, skip caching without breaking the request
    console.warn("Redis Cache Warning (set session skipped):", error?.message || error);
  }
};

// get user session 
export const getUserSession = async (userId: string): Promise<User | null> => {
  try {
    const data = await redis.get(`session:${userId}`);
    if (!data) return null;
    return JSON.parse(data) as User;
  } catch {
    // Fail-safe: if Redis is down, return null to force a DB lookup
    return null;
  }
};

// delete user session
export const deleteUserSession = async (userId: string) => {
  try {
    await redis.del(`session:${userId}`);
  } catch (error: any) {
    // Fail-safe: if Redis is unavailable, skip deletion without breaking the request
    console.warn("Redis Cache Warning (del session skipped):", error?.message || error);
  }
};
