import { beforeEach, describe, expect, it, vi } from "vitest";
import { getOrderAnalyticsAdmin, getPlatformAnalytics } from "./admin.repository.js";
import { prisma } from "../../config/db.js";

vi.mock("../../config/db.js", () => ({
    prisma: {
        order: {
            groupBy: vi.fn(),
            count: vi.fn(),
            findMany: vi.fn(),
            aggregate: vi.fn(),
        },
        returnRequest: {
            count: vi.fn(),
        },
        shop: {
            findMany: vi.fn(),
        },
        $queryRaw: vi.fn(),
    },
}));

describe("getOrderAnalyticsAdmin", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("calculates all 13 platform order analytics metrics accurately", async () => {
        // Mock ordersByStatus
        (prisma.order.groupBy as any)
            .mockResolvedValueOnce([
                { status: "PENDING", _count: { _all: 5 }, _sum: { totalAmount: 250 } },
                { status: "CONFIRMED", _count: { _all: 10 }, _sum: { totalAmount: 1000 } },
                { status: "PROCESSING", _count: { _all: 15 }, _sum: { totalAmount: 1500 } },
                { status: "SHIPPED", _count: { _all: 20 }, _sum: { totalAmount: 2000 } },
                { status: "DELIVERED", _count: { _all: 45 }, _sum: { totalAmount: 4500 } },
                { status: "CANCELLED", _count: { _all: 5 }, _sum: { totalAmount: 300 } },
                { status: "REFUNDED", _count: { _all: 2 }, _sum: { totalAmount: 200 } },
            ])
            // Mock topShops
            .mockResolvedValueOnce([
                { shopId: "shop_1", _count: { _all: 60 }, _sum: { totalAmount: 6000 } },
                { shopId: "shop_2", _count: { _all: 42 }, _sum: { totalAmount: 3750 } },
            ]);

        // Mock totalOrders
        (prisma.order.count as any).mockResolvedValue(102);

        // Mock returnRequest.count
        (prisma.returnRequest.count as any).mockResolvedValue(3);

        // Mock allValidOrders
        (prisma.order.findMany as any)
            .mockResolvedValueOnce([
                { totalAmount: 1000 },
                { totalAmount: 1500 },
                { totalAmount: 2000 },
                { totalAmount: 4500 },
            ])
            // Mock ordersWithAddress
            .mockResolvedValueOnce([
                { totalAmount: 150, shippingAddress: { country: "USA", city: "New York" } },
                { totalAmount: 200, shippingAddress: { country: "USA", city: "New York" } },
                { totalAmount: 350, shippingAddress: { country: "Canada", city: "Toronto" } },
            ])
            // Mock ordersForTimeline
            .mockResolvedValueOnce([
                { createdAt: new Date("2026-11-01T10:00:00Z"), totalAmount: 500, status: "DELIVERED" },
                { createdAt: new Date("2026-11-01T14:00:00Z"), totalAmount: 200, status: "CANCELLED" },
                { createdAt: new Date("2026-11-02T11:00:00Z"), totalAmount: 800, status: "DELIVERED" },
            ]);

        // Mock shop.findMany
        (prisma.shop.findMany as any).mockResolvedValue([
            { id: "shop_1", slug: "tech-haven", profile: { name: "Tech Haven", logo: null } },
            { id: "shop_2", slug: "fashion-hub", profile: { name: "Fashion Hub", logo: null } },
        ]);

        const result = await getOrderAnalyticsAdmin({ range: "30d" });

        // 1. Total orders
        expect(result.totalOrders).toBe(102);

        // 2. Pending orders
        expect(result.pendingOrders).toBe(5);

        // 3. Processing orders (CONFIRMED + PROCESSING = 10 + 15 = 25)
        expect(result.processingOrders).toBe(25);

        // 4. Shipped orders
        expect(result.shippedOrders).toBe(20);

        // 5. Delivered orders
        expect(result.deliveredOrders).toBe(45);

        // 6. Cancelled orders
        expect(result.cancelledOrders).toBe(5);

        // 7. Returned orders
        expect(result.returnedOrders).toBe(3);

        // 8. Orders over time
        expect(result.ordersOverTime).toHaveLength(2); // 2 distinct dates
        expect(result.ordersOverTime[0]!.orders).toBe(2);
        expect(result.ordersOverTime[0]!.delivered).toBe(1);
        expect(result.ordersOverTime[0]!.cancelled).toBe(1);

        // 9. Orders by shop
        expect(result.ordersByShop).toHaveLength(2);
        expect(result.ordersByShop[0]!.shopName).toBe("Tech Haven");
        expect(result.ordersByShop[0]!.count).toBe(60);

        // 10. Orders by geographical location
        expect(result.ordersByLocation).toHaveLength(2);
        expect(result.ordersByLocation[0]!.location).toBe("New York, USA");
        expect(result.ordersByLocation[0]!.count).toBe(2);

        // 11. Average order value (grossRevenue 9000 / 4 valid orders = 2250)
        expect(result.averageOrderValue).toBe(2250);

        // 12. Order cancellation rate (5 / 102 = 4.9%)
        expect(result.orderCancellationRate).toBe(4.9);

        // 13. Order fulfillment rate (45 / 102 = 44.1%)
        expect(result.orderFulfillmentRate).toBe(44.1);
    });

    it("fetches and compiles platform analytics with GMV, statuses, top shops, and timeseries without date_trunc errors", async () => {
        (prisma.order.aggregate as any).mockResolvedValueOnce({
            _sum: { totalAmount: 12500 },
        });

        (prisma.order.groupBy as any)
            // ordersByStatus
            .mockResolvedValueOnce([
                { status: "DELIVERED", _count: { _all: 35 } },
                { status: "PROCESSING", _count: { _all: 10 } },
            ])
            // topShops
            .mockResolvedValueOnce([
                { shopId: "shop_alpha", _sum: { totalAmount: 8500 }, _count: { _all: 25 } },
                { shopId: "shop_beta", _sum: { totalAmount: 4000 }, _count: { _all: 20 } },
            ]);

        // userGrowth $queryRaw
        (prisma.$queryRaw as any)
            .mockResolvedValueOnce([
                { month: "2026-10", count: BigInt(5) },
                { month: "2026-11", count: BigInt(12) },
            ])
            // ordersByMonth $queryRaw
            .mockResolvedValueOnce([
                { month: "2026-10", count: BigInt(15), revenue: 4500 },
                { month: "2026-11", count: BigInt(30), revenue: 8000 },
            ]);

        (prisma.shop.findMany as any).mockResolvedValueOnce([
            { id: "shop_alpha", slug: "alpha-store", profile: { name: "Alpha Store" } },
            { id: "shop_beta", slug: "beta-store", profile: { name: "Beta Store" } },
        ]);

        const analytics = await getPlatformAnalytics();

        expect(analytics.gmv).toBe(12500);
        expect(analytics.ordersByStatus).toEqual([
            { status: "DELIVERED", count: 35 },
            { status: "PROCESSING", count: 10 },
        ]);
        expect(analytics.topShops).toEqual([
            { shopId: "shop_alpha", shopName: "Alpha Store", revenue: 8500, orderCount: 25 },
            { shopId: "shop_beta", shopName: "Beta Store", revenue: 4000, orderCount: 20 },
        ]);
        expect(analytics.userGrowth).toEqual([
            { month: "2026-10", count: 5 },
            { month: "2026-11", count: 12 },
        ]);
        expect(analytics.ordersByMonth).toEqual([
            { month: "2026-10", count: 15, revenue: 4500 },
            { month: "2026-11", count: 30, revenue: 8000 },
        ]);
    });
});
