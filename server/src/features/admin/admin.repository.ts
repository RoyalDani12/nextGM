import { prisma } from "../../config/db.js";

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

