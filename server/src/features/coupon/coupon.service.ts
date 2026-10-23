import { AppError } from "../../middleware/appError.js";
import * as repository from "./coupon.repository.js";

const normalise = (code: string) => code.trim().toUpperCase();

export const listCouponsService = (shopId: string) => repository.listCoupons(shopId);

export const createCouponService = async (shopId: string, input: any) => {
    try {
        const productIds: string[] = Array.isArray(input.productIds) ? input.productIds : [];
        const { productIds: _, ...coupon } = input;
        const uniqueProductIds: string[] = Array.from(new Set(productIds));
        if (uniqueProductIds.length && await repository.countProductsOwnedByShop(shopId, uniqueProductIds) !== uniqueProductIds.length) {
            throw new AppError("Every selected product must belong to this shop.", 400);
        }
        return await repository.createCoupon(shopId, {
            ...coupon,
            code: normalise(coupon.code),
            expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt) : null,
            minOrderAmount: (coupon.minOrderAmount !== null && coupon.minOrderAmount !== undefined && coupon.minOrderAmount !== "") ? coupon.minOrderAmount : null,
            maxUses: (coupon.maxUses !== null && coupon.maxUses !== undefined && coupon.maxUses !== "") ? Number(coupon.maxUses) : null,
        }, uniqueProductIds);
    } catch (error: any) {
        if (error.code === "P2002") throw new AppError("A coupon with this code already exists for this shop.", 409);
        throw error;
    }
};

export const updateCouponService = async (shopId: string, couponId: string, input: any) => {
    const productIds: string[] | undefined = Array.isArray(input.productIds) ? input.productIds : undefined;
    const { productIds: _, ...coupon } = input;
    const uniqueProductIds: string[] | undefined = productIds ? Array.from(new Set(productIds)) : undefined;
    if (uniqueProductIds && uniqueProductIds.length && await repository.countProductsOwnedByShop(shopId, uniqueProductIds) !== uniqueProductIds.length) {
        throw new AppError("Every selected product must belong to this shop.", 400);
    }
    const updateData: any = { ...coupon };
    if (coupon.expiresAt !== undefined) {
        updateData.expiresAt = coupon.expiresAt ? new Date(coupon.expiresAt) : null;
    }
    if (coupon.minOrderAmount !== undefined) {
        updateData.minOrderAmount = (coupon.minOrderAmount !== null && coupon.minOrderAmount !== "") ? coupon.minOrderAmount : null;
    }
    if (coupon.maxUses !== undefined) {
        updateData.maxUses = (coupon.maxUses !== null && coupon.maxUses !== "") ? Number(coupon.maxUses) : null;
    }
    const result = await repository.updateCoupon(shopId, couponId, updateData, uniqueProductIds);
    if (!result.count) throw new AppError("Coupon not found.", 404);
    return repository.findCoupon(shopId, couponId);
};

export const deleteCouponService = async (shopId: string, couponId: string) => {
    const coupon = await repository.findCoupon(shopId, couponId);
    if (!coupon) throw new AppError("Coupon not found.", 404);
    if (coupon.usedCount > 0) {
        throw new AppError("Coupons with redemptions cannot be deleted. Pause the coupon instead.", 400);
    }
    const result = await repository.deleteCoupon(shopId, couponId);
    if (!result.count) throw new AppError("Coupon not found.", 404);
};
