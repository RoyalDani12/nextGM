import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
    getPlatformStatsService,
    listUsersService,
    getUserByIdService,
    updateUserRoleService,
    updateUserStatusService,
    listShopsService,
    getShopByIdService,
    updateShopStatusService,
    listReviewsService,
    toggleReviewVisibilityService,
    deleteReviewAdminService,
} from "./admin.service.js";

// ─── Platform Stats ───────────────────────────
export const getPlatformStatsController = asyncHandler(async (_req: Request, res: Response) => {
    const data = await getPlatformStatsService();
    res.status(200).json({ success: true, data });
});

// ─── Users ────────────────────────────────────
export const listUsersController = asyncHandler(async (req: Request, res: Response) => {
    const { role, status, search, page, limit } = req.query as Record<string, string>;
    const data = await listUsersService({
        role,
        status,
        search,
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
    });
    res.status(200).json({ success: true, data });
});

export const getUserByIdController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const data = await getUserByIdService(id);
    res.status(200).json({ success: true, data });
});

export const updateUserRoleController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { role } = req.body as { role: string };
    const data = await updateUserRoleService(id, role);
    res.status(200).json({ success: true, message: "User role updated", data });
});

export const updateUserStatusController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: string };
    const data = await updateUserStatusService(id, status);
    res.status(200).json({ success: true, message: "User status updated", data });
});

// ─── Shops ────────────────────────────────────
export const listShopsController = asyncHandler(async (req: Request, res: Response) => {
    const { status, search, page, limit } = req.query as Record<string, string>;
    const data = await listShopsService({
        status,
        search,
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
    });
    res.status(200).json({ success: true, data });
});

export const getShopByIdController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const data = await getShopByIdService(id);
    res.status(200).json({ success: true, data });
});

export const updateShopStatusController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: string };
    const data = await updateShopStatusService(id, status);
    res.status(200).json({ success: true, message: "Shop status updated", data });
});

// ─── Reviews ──────────────────────────────────
export const listReviewsController = asyncHandler(async (req: Request, res: Response) => {
    const { search, rating, isVisible, shopId, page, limit } = req.query as Record<string, string>;
    const data = await listReviewsService({
        search,
        rating: rating ? parseInt(rating) : undefined,
        isVisible: isVisible !== undefined ? isVisible === "true" : undefined,
        shopId,
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
    });
    res.status(200).json({ success: true, data });
});

export const toggleReviewVisibilityController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { isVisible } = req.body as { isVisible: boolean };
    const data = await toggleReviewVisibilityService(id, isVisible);
    res.status(200).json({
        success: true,
        message: `Review ${isVisible ? "shown" : "hidden"} successfully`,
        data,
    });
});

export const deleteReviewAdminController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    await deleteReviewAdminService(id);
    res.status(200).json({ success: true, message: "Review deleted successfully" });
});

