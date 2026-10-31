import { extractClientIp } from '../admin/audit.service.js';
import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../middleware/appError.js";
import {
    getPayoutStatusService,
    generateOnboardingLinkService,
    withdrawFundsService,
} from "./payout.service.js";
import { findShopById } from "../shop/shop.repository.js";

const verifyShopOwner = async (shopId: string, userId: string) => {
    const shop = await findShopById(shopId);
    if (!shop) throw new AppError("Shop not found", 404);
    if (shop.ownerId !== userId) throw new AppError("Forbidden: You do not own this shop", 403);
    return shop;
};

export const getPayoutStatusController = asyncHandler(async (req: Request, res: Response) => {
    const shopId = req.params.shopId as string;
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);

    await verifyShopOwner(shopId, userId);
    const status = await getPayoutStatusService(shopId);

    res.status(200).json({ success: true, data: status });
});

export const createOnboardingLinkController = asyncHandler(async (req: Request, res: Response) => {
    const shopId = req.params.shopId as string;
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);

    await verifyShopOwner(shopId, userId);

    const origin = (req.headers.origin as string) || "http://localhost:5173";
    const result = await generateOnboardingLinkService(shopId, origin);

    res.status(200).json({ success: true, data: result });
});

export const withdrawFundsController = asyncHandler(async (req: Request, res: Response) => {
    const shopId = req.params.shopId as string;
    const userId = req.user?.id;
    const { amount } = req.body as { amount: number };

    if (!userId) throw new AppError("Unauthorized", 401);
    if (typeof amount !== "number" || amount <= 0) throw new AppError("A positive numeric amount is required", 400);

    await verifyShopOwner(shopId, userId);
    const clientIp = extractClientIp(req);
    const result = await withdrawFundsService(shopId, amount, userId, clientIp);

    res.status(200).json({
        success: true,
        message: "Payout successful",
        data: { newBalance: result.wallet.balance },
    });
});
