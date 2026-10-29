import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db.js";
import { AppError } from "./appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Attaches req.shop if the authenticated user owns shopId in params.
// 404, not 403 — same enumeration-prevention pattern as orders.
export const authorizeShopAccess = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.id;
        const { shopId } = req.params;

        if (!userId) {
            throw new AppError("Unauthorized.", 401);
        }

        const shop = await prisma.shop.findFirst({
            where: { id: shopId as string, ownerId: userId, deletedAt: null },
            select: { id: true, ownerId: true },
        });

        if (!shop) {
            throw new AppError("Shop not found.", 404);
        }

        req.shop = shop;
        next();
    },
);