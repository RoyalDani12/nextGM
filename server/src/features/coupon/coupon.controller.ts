import { extractClientIp } from '../admin/audit.service.js';
import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { createCouponService, deleteCouponService, listCouponsService, updateCouponService } from "./coupon.service.js";

export const listCouponsController = asyncHandler(async (req: Request, res: Response) => {
    const data = await listCouponsService(req.params.shopId as string);
    res.status(200).json({ success: true, data });
});

export const createCouponController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id || (req as any).user?.userId;
    const clientIp = extractClientIp(req);
    const data = await createCouponService(req.params.shopId as string, req.body, userId, clientIp);
    res.status(201).json({ success: true, data });
});

export const updateCouponController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id || (req as any).user?.userId;
    const clientIp = extractClientIp(req);
    const data = await updateCouponService(req.params.shopId as string, req.params.couponId as string, req.body, userId, clientIp);
    res.status(200).json({ success: true, data });
});

export const deleteCouponController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id || (req as any).user?.userId;
    const clientIp = extractClientIp(req);
    await deleteCouponService(req.params.shopId as string, req.params.couponId as string, userId, clientIp);
    res.status(204).send();
});
