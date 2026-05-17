import { NextFunction, Response, Request } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "./appError.js";
// import Jwt  from "jsonwebtoken";
import { env } from "../config/env.js";
import { cacheUserSession, getUserSession } from "../infrastructure/cache/session.cache.js";
import { verifyAccessToken } from "../features/auth/token.service.js";
import { findUserById } from "../features/auth/auth.repository.js";
import { AccessTokenPayload } from "../types/auth.types.js";

export const authenticate = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const authHeaders = req.headers.authorization;

        if (!authHeaders || !authHeaders.startsWith("Bearer ")) {
            throw new AppError("Not token provided", 401);
        }

        const token = authHeaders.split(" ")[1];

        if (!token) {
            throw new AppError("Invalid token format", 401);
        }

        const decoded = verifyAccessToken(token) as AccessTokenPayload;

        if (!decoded) {
            throw new AppError("Invalid or expired token", 401);
        }
        const tokenIssuedAt = decoded.iat * 1000;

        let user = await getUserSession(decoded.userId);

        if (!user) {
            const dbUser = await findUserById(decoded.userId);
            if (!dbUser) {
                throw new AppError("User no longer exists", 401);
            }

            // populate redis
            await cacheUserSession({
                id: dbUser.id,
                name: dbUser.name,
                role: dbUser.role,
                status: dbUser.status,
                email: dbUser.email,
                passwordChangedAt: dbUser.passwordChangedAt,
            });
            user = dbUser;
        }
        if (user.passwordChangedAt) {
            const changeTime = new Date(user.passwordChangedAt).getTime();
            if (changeTime > tokenIssuedAt) {
                throw new AppError("Password recently changed.Please login again.", 401);
            }
        }

        if (user.status !== "ACTIVE") {
            throw new AppError("Account suspended", 403);
        }

        req.user = user;
        next();
    },
);
