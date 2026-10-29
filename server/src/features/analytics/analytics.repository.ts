import { OrderStatus } from "@prisma/client";
import { prisma } from "../../config/db.js";

export type AnalyticsRange = "7d" | "30d" | "90d" | "12m";

const VALID_REVENUE_STATUSES: OrderStatus[] = [
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
];

const getRangeDates = (range: AnalyticsRange) => {
    const endDate = new Date();
    const startDate = new Date();
    let intervalDays = 30;

    switch (range) {
        case "7d":
            intervalDays = 7;
            startDate.setDate(endDate.getDate() - 6);
            break;
        case "30d":
            intervalDays = 30;
            startDate.setDate(endDate.getDate() - 29);
            break;
        case "90d":
            intervalDays = 90;
            startDate.setDate(endDate.getDate() - 89);
            break;
        case "12m":
            intervalDays = 365;
            startDate.setMonth(endDate.getMonth() - 11);
            startDate.setDate(1);
            break;
        default:
            intervalDays = 30;
            startDate.setDate(endDate.getDate() - 29);
            break;
    }

    startDate.setHours(0, 0, 0, 0);

    const prevEndDate = new Date(startDate);
    prevEndDate.setMilliseconds(prevEndDate.getMilliseconds() - 1);

    const prevStartDate = new Date(startDate);
    if (range === "12m") {
        prevStartDate.setFullYear(prevStartDate.getFullYear() - 1);
    } else {
        prevStartDate.setDate(prevStartDate.getDate() - intervalDays);
    }
    prevStartDate.setHours(0, 0, 0, 0);

    return { startDate, endDate, prevStartDate, prevEndDate, intervalDays };
};

const formatDateKey = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

const formatMonthKey = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
};

export const getShopAnalyticsRepository = async (
    shopId: string,
    range: AnalyticsRange = "30d"
) => {
    const { startDate, endDate, prevStartDate, prevEndDate } = getRangeDates(range);

    // 1. Current Period Orders (with shipping address)
    const currentOrders = await prisma.order.findMany({
        where: {
            shopId,
            createdAt: { gte: startDate, lte: endDate },
            deletedAt: null,
        },
        select: {
            id: true,
            status: true,
            totalAmount: true,
            discountAmount: true,
            customerId: true,
            createdAt: true,
            customer: {
                select: { name: true, email: true },
            },
            shippingAddress: {
                select: { country: true, city: true },
            },
            items: {
                select: {
                    id: true,
                    productId: true,
                    quantity: true,
                    unitPrice: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    // 2. Previous Period Orders (for comparison curve and growth rates)
    const prevOrders = await prisma.order.findMany({
        where: {
            shopId,
            createdAt: { gte: prevStartDate, lte: prevEndDate },
            deletedAt: null,
        },
        select: {
            id: true,
            status: true,
            totalAmount: true,
            createdAt: true,
            items: {
                select: { quantity: true },
            },
        },
    });

    const returnRequests = await prisma.returnRequest.findMany({
        where: {
            order: { shopId },
            createdAt: { gte: startDate, lte: endDate },
        },
        select: { status: true },
    });

    // 3. Compute Metrics for Current Period
    const validCurrentOrders = currentOrders.filter((o) =>
        VALID_REVENUE_STATUSES.includes(o.status)
    );

    const totalRevenue = validCurrentOrders.reduce(
        (sum, o) => sum + Number(o.totalAmount),
        0
    );
    const totalOrders = validCurrentOrders.length;
    const allPlacedOrdersCount = currentOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const deliveredCount = currentOrders.filter((o) => o.status === "DELIVERED").length;
    const fulfillmentRate =
        totalOrders > 0 ? Math.round((deliveredCount / totalOrders) * 100) : 100;

    const unitsSold = validCurrentOrders.reduce(
        (sum, o) => sum + o.items.reduce((iSum, item) => iSum + item.quantity, 0),
        0
    );

    const uniqueCustomerIds = new Set(
        validCurrentOrders.map((o) => o.customerId).filter(Boolean)
    );
    const uniqueCustomers = uniqueCustomerIds.size;
    const customerOrderCounts = new Map<string, number>();
    for (const order of validCurrentOrders) {
        if (order.customerId) {
            customerOrderCounts.set(
                order.customerId,
                (customerOrderCounts.get(order.customerId) ?? 0) + 1,
            );
        }
    }
    const repeatCustomers = Array.from(customerOrderCounts.values()).filter((count) => count > 1).length;
    const cancelledOrders = currentOrders.filter((o) => o.status === "CANCELLED").length;
    const refundedAmount = currentOrders
        .filter((o) => o.status === "REFUNDED")
        .reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const returnRequestsCount = returnRequests.length;
    const resolvedReturnRequests = returnRequests.filter((request) =>
        ["REJECTED", "CLOSED", "REFUNDED", "REPLACEMENT_SENT"].includes(request.status),
    ).length;

    // 4. Compute Metrics for Previous Period
    const validPrevOrders = prevOrders.filter((o) =>
        VALID_REVENUE_STATUSES.includes(o.status)
    );
    const prevRevenue = validPrevOrders.reduce(
        (sum, o) => sum + Number(o.totalAmount),
        0
    );
    const prevTotalOrders = validPrevOrders.length;
    const prevAov = prevTotalOrders > 0 ? prevRevenue / prevTotalOrders : 0;
    const prevUnitsSold = validPrevOrders.reduce(
        (sum, o) => sum + o.items.reduce((iSum, item) => iSum + item.quantity, 0),
        0
    );

    const calcGrowth = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    const revenueGrowth = calcGrowth(totalRevenue, prevRevenue);
    const ordersGrowth = calcGrowth(totalOrders, prevTotalOrders);
    const aovGrowth = calcGrowth(averageOrderValue, prevAov);
    const unitsGrowth = calcGrowth(unitsSold, prevUnitsSold);

    // 5. Generate Continuous Timeline Data (with previous period comparison)
    const timelineMap = new Map<
        string,
        {
            date: string;
            label: string;
            revenue: number;
            orders: number;
            units: number;
            prevRevenue: number;
            prevOrders: number;
        }
    >();

    if (range === "12m") {
        const cursor = new Date(startDate);
        while (cursor <= endDate) {
            const key = formatMonthKey(cursor);
            const label = cursor.toLocaleString("default", {
                month: "short",
                year: "2-digit",
            });
            timelineMap.set(key, {
                date: key,
                label,
                revenue: 0,
                orders: 0,
                units: 0,
                prevRevenue: 0,
                prevOrders: 0,
            });
            cursor.setMonth(cursor.getMonth() + 1);
        }

        for (const order of validCurrentOrders) {
            const key = formatMonthKey(order.createdAt);
            const point = timelineMap.get(key);
            if (point) {
                point.revenue += Number(order.totalAmount);
                point.orders += 1;
                point.units += order.items.reduce((s, it) => s + it.quantity, 0);
            }
        }
    } else {
        const cursor = new Date(startDate);
        while (cursor <= endDate) {
            const key = formatDateKey(cursor);
            const label = cursor.toLocaleString("default", {
                month: "short",
                day: "numeric",
            });
            timelineMap.set(key, {
                date: key,
                label,
                revenue: 0,
                orders: 0,
                units: 0,
                prevRevenue: 0,
                prevOrders: 0,
            });
            cursor.setDate(cursor.getDate() + 1);
        }

        for (const order of validCurrentOrders) {
            const key = formatDateKey(order.createdAt);
            const point = timelineMap.get(key);
            if (point) {
                point.revenue += Number(order.totalAmount);
                point.orders += 1;
                point.units += order.items.reduce((s, it) => s + it.quantity, 0);
            }
        }

        // Map previous orders by day offset
        const timelineKeys = Array.from(timelineMap.keys());
        for (const prevOrder of validPrevOrders) {
            const diffDays = Math.floor(
                (prevOrder.createdAt.getTime() - prevStartDate.getTime()) /
                    (1000 * 60 * 60 * 24)
            );
            if (diffDays >= 0 && diffDays < timelineKeys.length) {
                const targetKey = timelineKeys[diffDays];
                if (targetKey) {
                    const pt = timelineMap.get(targetKey);
                    if (pt) {
                        pt.prevRevenue += Number(prevOrder.totalAmount);
                        pt.prevOrders += 1;
                    }
                }
            }
        }
    }

    const timeline = Array.from(timelineMap.values()).map((p) => ({
        ...p,
        revenue: Number(p.revenue.toFixed(2)),
        prevRevenue: Number(p.prevRevenue.toFixed(2)),
    }));

    let peakDay = { label: "N/A", revenue: 0, orders: 0 };
    for (const pt of timeline) {
        if (pt.revenue > peakDay.revenue) {
            peakDay = { label: pt.label, revenue: pt.revenue, orders: pt.orders };
        }
    }

    // 6. Orders Pipeline by Stage (from Reference 2)
    const pipelineStages: OrderStatus[] = [
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
    ];

    const orderPipeline = pipelineStages.map((stage) => {
        const matching = currentOrders.filter((o) => o.status === stage);
        const count = matching.length;
        const productsCount = matching.reduce(
            (sum, o) => sum + o.items.reduce((iSum, it) => iSum + it.quantity, 0),
            0
        );
        const stageTotal = matching.reduce(
            (sum, o) => sum + Number(o.totalAmount),
            0
        );
        return {
            stage,
            count,
            productsCount,
            totalAmount: Number(stageTotal.toFixed(2)),
        };
    });

    // 7. Customer Locations (from Reference 1)
    const locationMap = new Map<string, { location: string; count: number; revenue: number }>();
    for (const order of currentOrders) {
        const loc =
            order.shippingAddress?.country ||
            order.shippingAddress?.city ||
            "United States";
        const existing = locationMap.get(loc) || { location: loc, count: 0, revenue: 0 };
        existing.count += 1;
        existing.revenue += Number(order.totalAmount);
        locationMap.set(loc, existing);
    }

    const customerLocations = Array.from(locationMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 4)
        .map((loc) => ({
            location: loc.location,
            count: loc.count,
            percentage:
                allPlacedOrdersCount > 0
                    ? Math.round((loc.count / allPlacedOrdersCount) * 100)
                    : 100,
        }));

    // Fallback if no locations recorded yet
    if (customerLocations.length === 0) {
        customerLocations.length = 0;
    }

    // 8. Order Status Breakdown for Donut Chart
    const statusCounts: Record<string, number> = {};
    for (const order of currentOrders) {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    }

    const allStatuses: OrderStatus[] = [
        "DELIVERED",
        "SHIPPED",
        "PROCESSING",
        "CONFIRMED",
        "PENDING",
        "CANCELLED",
        "REFUNDED",
    ];

    const orderStatusBreakdown = allStatuses
        .map((st) => {
            const count = statusCounts[st] || 0;
            const percentage =
                allPlacedOrdersCount > 0
                    ? Number(((count / allPlacedOrdersCount) * 100).toFixed(1))
                    : 0;
            return {
                status: st,
                count,
                percentage,
            };
        })
        .filter((item) => item.count > 0 || allPlacedOrdersCount === 0);

    // 9. Top Selling Products (from Reference 1 & 2)
    const productStats = new Map<
        string,
        { productId: string; unitsSold: number; totalRevenue: number }
    >();

    for (const order of validCurrentOrders) {
        for (const item of order.items) {
            const existing = productStats.get(item.productId) || {
                productId: item.productId,
                unitsSold: 0,
                totalRevenue: 0,
            };
            existing.unitsSold += item.quantity;
            existing.totalRevenue += Number(item.unitPrice) * item.quantity;
            productStats.set(item.productId, existing);
        }
    }

    const topProductEntries = Array.from(productStats.values())
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5);

    const productIds = topProductEntries.map((e) => e.productId);

    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
            id: true,
            name: true,
            slug: true,
            basePrice: true,
            stock: true,
            images: {
                where: { isPrimary: true },
                select: { url: true },
                take: 1,
            },
        },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const topProducts = topProductEntries.map((item) => {
        const prod = productMap.get(item.productId);
        return {
            id: item.productId,
            name: prod?.name || "Product",
            slug: prod?.slug || "",
            image: prod?.images[0]?.url || null,
            price: prod ? Number(prod.basePrice) : 0,
            stock: prod?.stock ?? 0,
            unitsSold: item.unitsSold,
            totalRevenue: Number(item.totalRevenue.toFixed(2)),
        };
    });

    // 10. Inventory & Catalog Health (from Reference 1 Semi-circle & Reference 2 Out-of-Stock Index)
    const [totalProducts, lowStockCount, outOfStockCount, criticalProducts] =
        await Promise.all([
            prisma.product.count({
                where: { shopId, deletedAt: null },
            }),
            prisma.product.count({
                where: { shopId, stock: { gt: 0, lte: 10 }, deletedAt: null },
            }),
            prisma.product.count({
                where: { shopId, stock: 0, deletedAt: null },
            }),
            prisma.product.findMany({
                where: { shopId, stock: { lte: 15 }, deletedAt: null },
                select: {
                    id: true,
                    name: true,
                    sku: true,
                    stock: true,
                    basePrice: true,
                    images: {
                        where: { isPrimary: true },
                        select: { url: true },
                        take: 1,
                    },
                },
                orderBy: { stock: "asc" },
                take: 5,
            }),
        ]);

    const inStockCount = Math.max(0, totalProducts - outOfStockCount - lowStockCount);
    const healthScore =
        totalProducts > 0
            ? Math.round(
                  ((inStockCount + lowStockCount * 0.5) / totalProducts) * 100
              )
            : 100;

    const criticalItems = criticalProducts.map((p) => {
        const maxCapacity = Math.max(50, p.stock * 3 || 30);
        return {
            id: p.id,
            name: p.name,
            sku: p.sku || "",
            stock: p.stock,
            maxCapacity,
            price: Number(p.basePrice),
            image: p.images[0]?.url || null,
        };
    });

    // 11. Recent 5 Orders for Dashboard Table (with City/Country)
    const recentOrders = currentOrders.slice(0, 5).map((order) => ({
        id: order.id,
        customerName: order.customer?.name || "Guest Customer",
        customerEmail: order.customer?.email || "",
        location: order.shippingAddress
            ? `${order.shippingAddress.city || ""}, ${order.shippingAddress.country || ""}`.replace(/^, |, $/g, "")
            : "Direct Sale",
        totalAmount: Number(order.totalAmount),
        status: order.status,
        itemsCount: order.items.reduce((s, it) => s + it.quantity, 0),
        createdAt: order.createdAt.toISOString(),
    }));

    return {
        summary: {
            totalRevenue: Number(totalRevenue.toFixed(2)),
            revenueGrowth,
            totalOrders,
            ordersGrowth,
            averageOrderValue: Number(averageOrderValue.toFixed(2)),
            aovGrowth,
            unitsSold,
            unitsGrowth,
            uniqueCustomers,
            repeatCustomers,
            repeatCustomerRate: uniqueCustomers > 0 ? Math.round((repeatCustomers / uniqueCustomers) * 100) : 0,
            allPlacedOrdersCount,
            cancelledOrders,
            cancellationRate: allPlacedOrdersCount > 0 ? Math.round((cancelledOrders / allPlacedOrdersCount) * 100) : 0,
            returnRequests: returnRequestsCount,
            resolvedReturnRequests,
            returnRate: totalOrders > 0 ? Math.round((returnRequestsCount / totalOrders) * 100) : 0,
            refundedAmount: Number(refundedAmount.toFixed(2)),
            netRevenue: Number((totalRevenue - refundedAmount).toFixed(2)),
            fulfillmentRate,
            peakDay,
        },
        timeline,
        orderPipeline,
        customerLocations,
        orderStatusBreakdown,
        topProducts,
        inventoryHealth: {
            totalProducts,
            inStockCount,
            lowStockCount,
            outOfStockCount,
            healthScore,
            criticalItems,
        },
        recentOrders,
    };
};
