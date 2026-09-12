import type {
    NextFunction,
    Request,
    Response,
} from "express";

import {
    cacheUserSession,
    getUserSession,
} from "../infrastructure/cache/session.cache.js";

import {
    verifyAccessToken,
} from "../features/auth/token.service.js";

import {
    findUserById,
} from "../features/auth/auth.repository.js";

import type {
    AccessTokenPayload,
} from "../types/auth.types.js";

export const optionalAuthenticate = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const authHeader =
            req.headers.authorization;

        // No access token = guest
        if (
            !authHeader ||
            !authHeader.startsWith(
                "Bearer ",
            )
        ) {
            return next();
        }

        const token =
            authHeader.split(" ")[1];

        if (!token) {
            return next();
        }

        const decoded =
            verifyAccessToken(
                token,
            ) as AccessTokenPayload;

        if (!decoded) {
            return next();
        }

        const tokenIssuedAt =
            decoded.iat * 1000;

        let user =
            await getUserSession(
                decoded.userId,
            );

        if (!user) {
            const dbUser =
                await findUserById(
                    decoded.userId,
                );

            if (!dbUser) {
                return next();
            }

            await cacheUserSession({
                id: dbUser.id,
                name: dbUser.name,
                role: dbUser.role,
                status: dbUser.status,
                email: dbUser.email,
                passwordChangedAt:
                    dbUser.passwordChangedAt,
            });

            user = dbUser;
        }

        if (user.passwordChangedAt) {
            const changeTime =
                new Date(
                    user.passwordChangedAt,
                ).getTime();

            if (
                changeTime >
                tokenIssuedAt
            ) {
                return next();
            }
        }

        if (
            user.status !== "ACTIVE"
        ) {
            return next();
        }

        req.user = user;

        next();
    } catch {
        // Invalid/expired token should not
        // prevent guest cart functionality.
        next();
    }
};