import express from "express";
import { z } from "zod";
import { prisma } from "../../config/db.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../middleware/appError.js";
import { notifyUser, notifyShopOwner } from "../notification/notification.service.js";

const router = express.Router();
const productParams = z.object({ params: z.object({ productId: z.string().cuid() }) });
const reviewParams = z.object({ params: z.object({ reviewId: z.string().cuid() }) });
const reviewBody = z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(2000).optional(),
});
const replyBody = z.object({ comment: z.string().trim().min(1).max(2000) });

router.get(
    "/products/:productId/reviews",
    validate(productParams),
    asyncHandler(async (req, res) => {
        const productId = req.params.productId as string;
        const reviews = await prisma.review.findMany({
            where: { productId, isVisible: true },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                userId: true,
                rating: true,
                comment: true,
                createdAt: true,
                updatedAt: true,
                user: { select: { name: true } },
                reply: { select: { id: true, comment: true, createdAt: true, updatedAt: true } },
            },
        });
        const averageRating = reviews.length
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
            : 0;
        res.json({
            success: true,
            data: {
                averageRating: Number(averageRating.toFixed(1)),
                reviewCount: reviews.length,
                reviews,
            },
        });
    }),
);

router.post(
    "/products/:productId/reviews",
    authenticate,
    validate(z.object({ ...productParams.shape, body: reviewBody })),
    asyncHandler(async (req, res) => {
        const userId = req.user!.id;
        const productId = req.params.productId as string;
        const product = await prisma.product.findFirst({
            where: { id: productId, status: "ACTIVE", deletedAt: null },
            select: { name: true, shopId: true },
        });
        if (!product) throw new AppError("Product not found.", 404);
        const deliveredPurchase = await prisma.orderItem.findFirst({
            where: {
                productId,
                order: { customerId: userId, status: "DELIVERED", deletedAt: null },
            },
            select: { id: true },
        });
        if (!deliveredPurchase)
            throw new AppError("You can review this product after it has been delivered.", 403);
        const review = await prisma.review.upsert({
            where: { productId_userId: { productId, userId } },
            create: {
                productId,
                userId,
                shopId: product.shopId,
                rating: req.body.rating,
                comment: req.body.comment,
            },
            update: { rating: req.body.rating, comment: req.body.comment, isVisible: true },
            select: {
                id: true,
                userId: true,
                rating: true,
                comment: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        try {
            await notifyShopOwner({
                shopId: product.shopId,
                type: "REVIEW_RECEIVED",
                title: "New Review Received ⭐",
                body: `Your product "${product.name}" received a ${req.body.rating}-star review.`,
                meta: {
                    productId,
                    reviewId: review.id,
                    rating: req.body.rating,
                },
            });
        } catch (err) {
            console.error("Failed to notify shop owner of review:", err);
        }

        res.status(201).json({ success: true, message: "Review saved.", data: review });
    }),
);

router.delete(
    "/reviews/:reviewId",
    authenticate,
    validate(reviewParams),
    asyncHandler(async (req, res) => {
        const review = await prisma.review.findUnique({
            where: { id: req.params.reviewId as string },
            select: { userId: true },
        });
        if (!review) throw new AppError("Review not found.", 404);
        if (review.userId !== req.user!.id && req.user!.role !== "SUPER_ADMIN")
            throw new AppError("You cannot delete this review.", 403);
        await prisma.review.delete({ where: { id: req.params.reviewId as string } });
        res.json({ success: true, message: "Review deleted." });
    }),
);

const shopReviewsParams = z.object({
    params: z.object({ shopId: z.string().min(1) }),
    query: z.object({
        rating: z.string().optional(),
        replyStatus: z.enum(["all", "replied", "unreplied"]).optional(),
        search: z.string().optional(),
        page: z.string().optional(),
        limit: z.string().optional(),
    }).optional(),
});

router.get(
    "/shops/:shopId/reviews",
    authenticate,
    validate(shopReviewsParams),
    asyncHandler(async (req, res) => {
        const shopId = req.params.shopId as string;
        const userId = req.user!.id;
        const userRole = req.user!.role;

        const shop = await prisma.shop.findUnique({
            where: { id: shopId },
            select: {
                id: true,
                ownerId: true,
                employees: { where: { userId }, select: { id: true } },
            },
        });
        if (!shop) throw new AppError("Shop not found.", 404);

        const isOwner = shop.ownerId === userId;
        const isEmployee = shop.employees.length > 0;
        const isAdmin = userRole === "SUPER_ADMIN";

        if (!isOwner && !isEmployee && !isAdmin) {
            throw new AppError("Forbidden. You cannot manage reviews for this shop.", 403);
        }

        const ratingQuery = req.query.rating ? parseInt(req.query.rating as string, 10) : undefined;
        const replyStatus = (req.query.replyStatus as string) || "all";
        const search = (req.query.search as string)?.trim();
        const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
        const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || "20", 10)));
        const skip = (page - 1) * limit;

        const where: any = {
            shopId,
            ...(ratingQuery && !isNaN(ratingQuery) ? { rating: ratingQuery } : {}),
            ...(replyStatus === "replied" ? { reply: { isNot: null } } : {}),
            ...(replyStatus === "unreplied" ? { reply: null } : {}),
            ...(search
                ? {
                      OR: [
                          { comment: { contains: search, mode: "insensitive" } },
                          { product: { name: { contains: search, mode: "insensitive" } } },
                          { user: { name: { contains: search, mode: "insensitive" } } },
                      ],
                  }
                : {}),
        };

        const [reviews, total, allShopReviews] = await Promise.all([
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
                where: { shopId },
                select: { rating: true, reply: { select: { id: true } } },
            }),
        ]);

        const totalCount = allShopReviews.length;
        const sumRatings = allShopReviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalCount > 0 ? Number((sumRatings / totalCount).toFixed(1)) : 0;
        const repliedCount = allShopReviews.filter((r) => r.reply !== null).length;
        const unrepliedCount = totalCount - repliedCount;

        const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        for (const r of allShopReviews) {
            if (r.rating >= 1 && r.rating <= 5) {
                ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
            }
        }

        res.json({
            success: true,
            data: {
                reviews,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
                stats: {
                    totalCount,
                    averageRating,
                    repliedCount,
                    unrepliedCount,
                    ratingDistribution,
                },
            },
        });
    }),
);

router.post(
    "/reviews/:reviewId/reply",
    authenticate,
    validate(z.object({ ...reviewParams.shape, body: replyBody })),
    asyncHandler(async (req, res) => {
        const review = await prisma.review.findUnique({
            where: { id: req.params.reviewId as string },
            select: {
                userId: true,
                product: { select: { name: true } },
                shop: {
                    select: {
                        id: true,
                        ownerId: true,
                        employees: { where: { userId: req.user!.id }, select: { id: true } },
                        profile: { select: { name: true } },
                    },
                },
            },
        });
        if (!review) throw new AppError("Review not found.", 404);
        const isOwner = review.shop.ownerId === req.user!.id;
        const isEmployee = review.shop.employees.length > 0;
        const isAdmin = req.user!.role === "SUPER_ADMIN";
        if (!isOwner && !isEmployee && !isAdmin)
            throw new AppError("You cannot reply to this review.", 403);
        const reply = await prisma.reviewReply.upsert({
            where: { reviewId: req.params.reviewId as string },
            create: { reviewId: req.params.reviewId as string, comment: req.body.comment },
            update: { comment: req.body.comment },
        });

        try {
            await notifyUser({
                userId: review.userId,
                type: "REVIEW_RECEIVED",
                title: "Response to your review 💬",
                body: `${review.shop.profile?.name || "The merchant"} replied to your review on ${review.product?.name || "a product"}.`,
                shopId: review.shop.id,
            });
        } catch (err) {
            console.error("Failed to notify customer of review reply:", err);
        }

        res.status(201).json({ success: true, message: "Reply saved.", data: reply });
    }),
);

router.delete(
    "/reviews/:reviewId/reply",
    authenticate,
    validate(reviewParams),
    asyncHandler(async (req, res) => {
        const review = await prisma.review.findUnique({
            where: { id: req.params.reviewId as string },
            select: {
                shop: {
                    select: {
                        ownerId: true,
                        employees: { where: { userId: req.user!.id }, select: { id: true } },
                    },
                },
            },
        });
        if (!review) throw new AppError("Review not found.", 404);
        const isOwner = review.shop.ownerId === req.user!.id;
        const isEmployee = review.shop.employees.length > 0;
        const isAdmin = req.user!.role === "SUPER_ADMIN";
        if (!isOwner && !isEmployee && !isAdmin)
            throw new AppError("You cannot delete this reply.", 403);
        await prisma.reviewReply.deleteMany({ where: { reviewId: req.params.reviewId as string } });
        res.json({ success: true, message: "Reply deleted." });
    }),
);

router.patch(
    "/reviews/:reviewId/visibility",
    authenticate,
    validate(
        z.object({
            ...reviewParams.shape,
            body: z.object({ isVisible: z.boolean() }),
        }),
    ),
    asyncHandler(async (req, res) => {
        if (req.user!.role !== "SUPER_ADMIN") throw new AppError("Forbidden.", 403);
        const review = await prisma.review.update({
            where: { id: req.params.reviewId as string },
            data: { isVisible: req.body.isVisible },
            select: { id: true, isVisible: true },
        });
        res.json({ success: true, message: "Review visibility updated.", data: review });
    }),
);

router.get(
    "/wishlist",
    authenticate,
    asyncHandler(async (req, res) => {
        const items = await prisma.wishlistItem.findMany({
            where: { userId: req.user!.id },
            orderBy: { createdAt: "desc" },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        sku: true,
                        basePrice: true,
                        stock: true,
                        status: true,
                        type: true,
                        shop: {
                            select: {
                                id: true,
                                slug: true,
                                profile: { select: { name: true, logo: true } },
                            },
                        },
                        images: { take: 2, orderBy: { isPrimary: "desc" }, select: { url: true } },
                    },
                },
            },
        });
        res.json({ success: true, data: items });
    }),
);

router.post(
    "/wishlist/:productId",
    authenticate,
    validate(productParams),
    asyncHandler(async (req, res) => {
        const productId = req.params.productId as string;
        const userId = req.user!.id;
        const product = await prisma.product.findFirst({
            where: { id: productId, status: "ACTIVE", deletedAt: null },
            select: { id: true },
        });
        if (!product) throw new AppError("Product not found.", 404);
        const item = await prisma.wishlistItem.upsert({
            where: { userId_productId: { userId, productId } },
            create: { userId, productId },
            update: {},
        });
        res.status(201).json({ success: true, data: item });
    }),
);

router.delete(
    "/wishlist/:productId",
    authenticate,
    validate(productParams),
    asyncHandler(async (req, res) => {
        await prisma.wishlistItem.deleteMany({
            where: { userId: req.user!.id, productId: req.params.productId as string },
        });
        res.json({ success: true });
    }),
);

export default router;
