import { api } from "@/lib/axios";
import type { AnalyticsRange, ShopAnalyticsData } from "./analytics.types";

export const getShopAnalytics = async (
    shopId: string,
    range: AnalyticsRange = "30d"
): Promise<ShopAnalyticsData> => {
    const response = await api.get(`/shops/${shopId}/analytics`, {
        params: { range },
    });
    return response.data.data;
};
