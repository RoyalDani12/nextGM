import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../middleware/appError.js";
import {
    cancelOrderService,
    checkoutService,
    getCustomerOrdersService,
    getCustomerrderByIdService,
    getShopOrderByIdService,
    getShopOrdersService,
} from "./order.service.js";

export const checkoutController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AppError("Unauthorized.", 401);
    }

    const { shippingAddress } = req.body;

    const result = await checkoutService(userId, shippingAddress);

    res.status(201).json({
        success: true,
        statusCode: 201,
        message: "Order placed successfully.",
        data: result,
    });
});

export const getCustomerOrderController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AppError("Unauthorized", 401);
    }

    const result = await getCustomerOrdersService(userId, req.query as any);

    res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Orders fetched successfully.",
        data: result,
    });
});

export const getCustomerOrderByIdController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AppError("Unauthorized.", 401);
    }

    const { orderId } = req.params as { orderId: string };

    const result = await getCustomerrderByIdService(orderId, userId);

    res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Order feached sucessfully.",
        data: result,
    });
});

export const cancelOrderController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AppError("Unauthorized.", 401);
    }

    const { orderId } = req.params as { orderId: string };

    const result = await cancelOrderService(orderId, userId);

    res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Order cancelled sucessfully.",
        data: result,
    });
});

export const getShopOrdersController = asyncHandler(async (req: Request, res: Response) => {
    const { shopId } = req.params as { shopId: string };
    const result = await getShopOrdersService(shopId, req.query as any);

    res.status(200).json({
        sucess: true,
        statusCode: 200,
        message: "Shop orders fetched sucessfully.",
        data: result,
    });
});

export const getShopOrderByIdController = asyncHandler(async (req: Request, res: Response) => {
    const { shopId, orderId } = req.params as { shopId: string; orderId: string };

    const result = await getShopOrderByIdService(orderId, shopId);
    res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Order fetched successfully.",
        data: result,
    });
});
