import { AppError } from "../../middleware/appError.js";
import {
    AnalyticsRange,
    getShopAnalyticsRepository,
} from "./analytics.repository.js";

const ALLOWED_RANGES: AnalyticsRange[] = ["7d", "30d", "90d", "12m"];

export const getShopAnalyticsService = async (
    shopId: string,
    rawRange?: string
) => {
    if (!shopId) {
        throw new AppError("Shop ID is required", 400);
    }

    const range: AnalyticsRange = ALLOWED_RANGES.includes(
        rawRange as AnalyticsRange
    )
        ? (rawRange as AnalyticsRange)
        : "30d";

    return await getShopAnalyticsRepository(shopId, range);
};
