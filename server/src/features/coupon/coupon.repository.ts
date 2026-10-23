import { prisma } from "../../config/db.js";

export const listCoupons = (shopId: string) =>
    prisma.coupon.findMany({
        where: { shopId },
        include: { products: { include: { product: { select: { id: true, name: true, images: { take: 1, orderBy: { isPrimary: "desc" }, select: { url: true } } } } } } },
        orderBy: { createdAt: "desc" },
    });

export const findCoupon = (shopId: string, couponId: string) =>
    prisma.coupon.findFirst({ where: { id: couponId, shopId } });

export const createCoupon = (shopId: string, data: any, productIds: string[]) => prisma.coupon.create({
    data: { ...data, shopId, products: productIds.length ? { createMany: { data: productIds.map((productId) => ({ productId })) } } : undefined },
    include: { products: { include: { product: { select: { id: true, name: true } } } } },
});

export const updateCoupon = (shopId: string, couponId: string, data: any, productIds?: string[]) =>
    prisma.$transaction(async (tx) => {
        const result = await tx.coupon.updateMany({ where: { id: couponId, shopId }, data });
        if (result.count && productIds !== undefined) {
            await tx.couponProduct.deleteMany({ where: { couponId } });
            if (productIds.length) await tx.couponProduct.createMany({ data: productIds.map((productId) => ({ couponId, productId })) });
        }
        return result;
    });

export const deleteCoupon = (shopId: string, couponId: string) =>
    prisma.coupon.deleteMany({ where: { id: couponId, shopId } });

export const countProductsOwnedByShop = (shopId: string, productIds: string[]) =>
    prisma.product.count({ where: { id: { in: productIds }, shopId, deletedAt: null } });
