import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getShopAnalyticsService } from "./analytics.service.js";
import { AppError } from "../../middleware/appError.js";

export const getShopAnalyticsController = asyncHandler(
    async (req: Request, res: Response) => {
        const rawShopId = req.params.shopId || req.shop?.id;
        const shopId = Array.isArray(rawShopId) ? rawShopId[0] : rawShopId;
        if (!shopId) {
            throw new AppError("Shop identifier is missing.", 400);
        }

        const range = typeof req.query.range === "string" ? req.query.range : undefined;
        const result = await getShopAnalyticsService(shopId, range);

        res.status(200).json({
            success: true,
            statusCode: 200,
            message: "Shop analytics retrieved successfully.",
            data: result,
        });
    }
);
