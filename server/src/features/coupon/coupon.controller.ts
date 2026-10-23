import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { createCouponService, deleteCouponService, listCouponsService, updateCouponService } from "./coupon.service.js";

export const listCouponsController = asyncHandler(async (req: Request, res: Response) => {
    const data = await listCouponsService(req.params.shopId as string);
    res.status(200).json({ success: true, data });
});

export const createCouponController = asyncHandler(async (req: Request, res: Response) => {
    const data = await createCouponService(req.params.shopId as string, req.body);
    res.status(201).json({ success: true, data });
});

export const updateCouponController = asyncHandler(async (req: Request, res: Response) => {
    const data = await updateCouponService(req.params.shopId as string, req.params.couponId as string, req.body);
    res.status(200).json({ success: true, data });
});

export const deleteCouponController = asyncHandler(async (req: Request, res: Response) => {
    await deleteCouponService(req.params.shopId as string, req.params.couponId as string);
    res.status(204).send();
});
