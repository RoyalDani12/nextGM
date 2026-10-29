

import rateLimit from "express-rate-limit";

// The general budget covers the whole API, so keep high-frequency background traffic
// and browser preflight requests out of it.
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    req.method === "OPTIONS" ||
    req.originalUrl.startsWith("/api/v1/notifications"),
  message: {
    status: "error",
    message: "Too many requests. Please try again later",
  },
});

export const notificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many notification requests. Please try again later",
  },
});


// limiter for auth routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many login attempts. Please try again later.",
  },
});


//  API Limiter - for heavy endpoints

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "API rate limit exceeded",
  },
});