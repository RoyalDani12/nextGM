import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  getUserNotificationsService,
  getUnreadCountService,
  markAsReadService,
  markAllAsReadService,
  deleteNotificationService,
  getNotificationPreferencesService,
  updateNotificationPreferencesService,
} from "./notification.service.js";

export const getNotificationsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const unreadOnly = req.query.unreadOnly === "true";
    const shopId = req.query.shopId as string | undefined;

    const data = await getUserNotificationsService(userId, {
      page: isNaN(page) ? 1 : page,
      limit: isNaN(limit) ? 20 : limit,
      unreadOnly,
      shopId,
    });

    res.status(200).json({
      success: true,
      data,
    });
  },
);

export const getUnreadCountController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const shopId = req.query.shopId as string | undefined;

    const data = await getUnreadCountService(userId, shopId);

    res.status(200).json({
      success: true,
      data,
    });
  },
);

export const markAsReadController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params as { id: string };

    const result = await markAsReadService(id, userId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  },
);

export const markAllAsReadController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const shopId = (req.body?.shopId || req.query.shopId) as string | undefined;

    const result = await markAllAsReadService(userId, shopId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  },
);

export const deleteNotificationController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params as { id: string };

    const result = await deleteNotificationService(id, userId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  },
);

export const getPreferencesController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const data = await getNotificationPreferencesService(userId);

    res.status(200).json({
      success: true,
      data,
    });
  },
);

export const updatePreferencesController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const data = await updateNotificationPreferencesService(userId, req.body);

    res.status(200).json({
      success: true,
      message: "Notification preferences updated.",
      data,
    });
  },
);
