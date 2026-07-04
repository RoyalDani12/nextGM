import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../middleware/appError.js";
import {
    checkoutService,
    getCustomerOrdersService,
    getCustomerrderByIdService,
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
