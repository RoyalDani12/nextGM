import { useQuery } from "@tanstack/react-query";
import { getShopAnalytics } from "./analytics.api";
import type { AnalyticsRange } from "./analytics.types";

export const useShopAnalytics = (
    shopId: string,
    range: AnalyticsRange = "30d"
) => {
    return useQuery({
        queryKey: ["shop-analytics", shopId, range],
        queryFn: () => getShopAnalytics(shopId, range),
        enabled: Boolean(shopId),
        staleTime: 1000 * 60 * 2, // 2 minutes cache
    });
};
