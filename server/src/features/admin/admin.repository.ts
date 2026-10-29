import { prisma } from "../../config/db.js";

const adminReturnInclude = {
    items: {
        include: {
            orderItem: {
                include: {
                    product: { select: { name: true, images: { where: { isPrimary: true }, select: { url: true }, take: 1 } } },
                    variant: { select: { name: true } },
                },
            },
        },
    },
    statusHistory: { orderBy: { createdAt: "asc" as const } },
    order: {
        select: {
            id: true,
            totalAmount: true,
            customer: { select: { name: true, email: true } },
            shop: { select: { id: true, slug: true, profile: { select: { name: true } } } },
        },
    },
} as const;

// ─────────────────────────────────────────────
// PLATFORM STATS
// ─────────────────────────────────────────────
export const getPlatformStats = async () => {
    const [totalUsers, totalShops, totalOrders, platformWallet] = await Promise.all([
        prisma.user.count({ where: { status: { not: "DELETED" } } }),
        prisma.shop.count({ where: { status: { not: "CLOSED" } } }),
        prisma.order.count(),
        prisma.platformWallet.findFirst(),
    ]);

    // Monthly signups for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyUsers = await prisma.$queryRaw<{ month: string; count: bigint }[]>`
        SELECT TO_CHAR("createdAt", 'YYYY-MM') as month, COUNT(*) as count
        FROM "User"
        WHERE "createdAt" >= ${sixMonthsAgo}
        GROUP BY month
        ORDER BY month ASC
    `;

    const monthlyShops = await prisma.$queryRaw<{ month: string; count: bigint }[]>`
        SELECT TO_CHAR("createdAt", 'YYYY-MM') as month, COUNT(*) as count
        FROM "Shop"
        WHERE "createdAt" >= ${sixMonthsAgo}
        GROUP BY month
        ORDER BY month ASC
    `;

    const monthlyOrders = await prisma.$queryRaw<{ month: string; count: bigint; revenue: number }[]>`
        SELECT TO_CHAR(o."createdAt", 'YYYY-MM') as month, COUNT(*) as count, COALESCE(SUM(o."totalAmount"), 0) as revenue
        FROM "Order" o
        WHERE o."createdAt" >= ${sixMonthsAgo}
        GROUP BY month
        ORDER BY month ASC
    `;

    return {
        totalUsers,
        totalShops,
        totalOrders,
        platformBalance: platformWallet ? Number(platformWallet.balance) : 0,
        monthlyUsers: monthlyUsers.map(r => ({ month: r.month, count: Number(r.count) })),
        monthlyShops: monthlyShops.map(r => ({ month: r.month, count: Number(r.count) })),
        monthlyOrders: monthlyOrders.map(r => ({ month: r.month, count: Number(r.count), revenue: Number(r.revenue) })),
    };
};

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────
export const listUsersAdmin = async (filters: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}) => {
    const { role, status, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
        status: { not: "DELETED" },
        ...(role && { role: role as any }),
        ...(status && { status: status as any }),
        ...(search && {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ],
        }),
    };

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                profile: { select: { avatar: true } },
                ownedShops: { select: { id: true, slug: true, status: true }, take: 1 },
            },
        }),
        prisma.user.count({ where }),
    ]);

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getUserByIdAdmin = async (id: string) => {
    return prisma.user.findUnique({
        where: { id },
        include: {
            profile: true,
            ownedShops: {
                select: { id: true, slug: true, status: true, createdAt: true, profile: { select: { name: true } } },
            },
        },
    });
};

export const updateUserRoleAdmin = async (id: string, role: string) => {
    return prisma.user.update({ where: { id }, data: { role: role as any } });
};

export const updateUserStatusAdmin = async (id: string, status: string) => {
    return prisma.user.update({ where: { id }, data: { status: status as any } });
};

// ─────────────────────────────────────────────
// SHOPS
// ─────────────────────────────────────────────
export const listShopsAdmin = async (filters: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}) => {
    const { status, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
        ...(status && { status: status as any }),
        ...(search && {
            OR: [
                { slug: { contains: search, mode: "insensitive" } },
                { profile: { name: { contains: search, mode: "insensitive" } } },
            ],
        }),
    };

    const [shops, total] = await Promise.all([
        prisma.shop.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                slug: true,
                status: true,
                createdAt: true,
                owner: { select: { id: true, name: true, email: true } },
                profile: { select: { logo: true, name: true } },
                wallet: { select: { balance: true } },
                _count: { select: { products: true, orders: true } },
            },
        }),
        prisma.shop.count({ where }),
    ]);

    return { shops, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getShopByIdAdmin = async (id: string) => {
    return prisma.shop.findUnique({
        where: { id },
        include: {
            owner: { select: { id: true, name: true, email: true } },
            profile: true,
            wallet: true,
            _count: { select: { products: true, orders: true } },
        },
    });
};

export const updateShopStatusAdmin = async (id: string, status: string) => {
    return prisma.shop.update({ where: { id }, data: { status: status as any } });
};

export const listShipmentsAdmin = async (filters: { status?: string; search?: string; page?: number; limit?: number }) => {
    const { status, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;
    const where: any = {
        shipment: { isNot: null },
        ...(status ? { status: status as any } : {}),
        ...(search ? { OR: [
            { id: { contains: search, mode: "insensitive" } },
            { shop: { profile: { name: { contains: search, mode: "insensitive" } } } },
            { shipment: { trackingNumber: { contains: search, mode: "insensitive" } } },
        ] } : {}),
    };

    const [shipments, total, pending, shipped, delivered] = await Promise.all([
        prisma.order.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, select: {
            id: true, status: true, createdAt: true, totalAmount: true,
            shop: { select: { id: true, slug: true, profile: { select: { name: true } } } },
            customer: { select: { name: true, email: true } },
            shipment: { select: { method: true, fee: true, carrier: true, trackingNumber: true, trackingUrl: true, estimatedDeliveryEnd: true, shippedAt: true, deliveredAt: true } },
        }}),
        prisma.order.count({ where }),
        prisma.order.count({ where: { shipment: { isNot: null }, status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] } } }),
        prisma.order.count({ where: { shipment: { isNot: null }, status: "SHIPPED" } }),
        prisma.order.count({ where: { shipment: { isNot: null }, status: "DELIVERED" } }),
    ]);
    return { shipments, total, page, limit, totalPages: Math.ceil(total / limit), stats: { pending, shipped, delivered } };
};

export const listReturnsAdmin = async (filters: { status?: string; search?: string; page?: number; limit?: number }) => {
    const { status, search, page = 1, limit = 20 } = filters;
    const where: any = {
        ...(status && status !== "ALL" ? { status } : {}),
        ...(search ? {
            OR: [
                { id: { contains: search, mode: "insensitive" } },
                { orderId: { contains: search, mode: "insensitive" } },
                { order: { customer: { name: { contains: search, mode: "insensitive" } } } },
                { order: { customer: { email: { contains: search, mode: "insensitive" } } } },
            ],
        } : {}),
    };
    const [returns, total, statusCounts] = await prisma.$transaction([
        prisma.returnRequest.findMany({ where, include: adminReturnInclude, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
        prisma.returnRequest.count({ where }),
        prisma.returnRequest.groupBy({ by: ["status"], where, _count: { _all: true } }),
    ]);
    return {
        returns,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        statusCounts: Object.fromEntries(statusCounts.map((entry) => [entry.status, entry._count._all])),
    };
};

export const getReturnAdmin = async (id: string) =>
    prisma.returnRequest.findUnique({ where: { id }, include: adminReturnInclude });

export const setReturnRefundPendingAdmin = async (id: string) =>
    prisma.$transaction(async (tx) => {
        const request = await tx.returnRequest.findUnique({ where: { id }, select: { status: true } });
        if (!request) return null;
        if (request.status !== "ITEM_RECEIVED") throw new Error("Return must be marked item received before refund.");
        await tx.returnStatusHistory.create({
            data: { returnRequestId: id, status: "REFUND_PENDING", note: "Refund approved by platform administrator." },
        });
        return tx.returnRequest.update({ where: { id }, data: { status: "REFUND_PENDING" }, include: adminReturnInclude });
    });

// ─────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────
export const listReviewsAdmin = async (filters: {
    search?: string;
    rating?: number;
    isVisible?: boolean;
    shopId?: string;
    page?: number;
    limit?: number;
}) => {
    const { search, rating, isVisible, shopId, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
        ...(typeof isVisible === "boolean" ? { isVisible } : {}),
        ...(rating && !isNaN(rating) ? { rating } : {}),
        ...(shopId ? { shopId } : {}),
        ...(search
            ? {
                  OR: [
                      { comment: { contains: search, mode: "insensitive" } },
                      { product: { name: { contains: search, mode: "insensitive" } } },
                      { user: { name: { contains: search, mode: "insensitive" } } },
                      { user: { email: { contains: search, mode: "insensitive" } } },
                  ],
              }
            : {}),
    };

    const [reviews, total, allReviews] = await Promise.all([
        prisma.review.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        images: { take: 1, orderBy: { isPrimary: "desc" }, select: { url: true } },
                    },
                },
                shop: {
                    select: {
                        id: true,
                        slug: true,
                        profile: { select: { name: true } },
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                reply: true,
            },
        }),
        prisma.review.count({ where }),
        prisma.review.findMany({
            select: { rating: true, isVisible: true },
        }),
    ]);

    const totalPlatformReviews = allReviews.length;
    const visibleCount = allReviews.filter((r) => r.isVisible).length;
    const hiddenCount = totalPlatformReviews - visibleCount;
    const avgRating =
        totalPlatformReviews > 0
            ? Number((allReviews.reduce((sum, r) => sum + r.rating, 0) / totalPlatformReviews).toFixed(1))
            : 0;

    return {
        reviews,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        stats: {
            totalPlatformReviews,
            visibleCount,
            hiddenCount,
            avgRating,
        },
    };
};

export const updateReviewVisibilityAdmin = async (id: string, isVisible: boolean) => {
    return prisma.review.update({
        where: { id },
        data: { isVisible },
        select: { id: true, isVisible: true },
    });
};

export const deleteReviewAdmin = async (id: string) => {
    await prisma.reviewReply.deleteMany({ where: { reviewId: id } });
    return prisma.review.delete({
        where: { id },
    });
};
