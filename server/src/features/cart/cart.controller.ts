import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../middleware/appError.js";
import {
    addToCartService,
    getCartService,
    removeCartItemService,
    updateCartItemService,
} from "./cart.service.js";

export const addToCartController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AppError("Unauthorized.", 401);
    }

    const result = await addToCartService(userId, req.body);

    res.status(201).json({
        success: true,
        statusCode: 201,
        message: "Item added to cart.",
        data: result,
    });
});

export const getCartController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized.", 401);

    const result = await getCartService(userId);

    res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Cart fetched successfully.",
        data: result,
    });
});

export const updateCartItemController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
        throw new AppError("Unauthorized.", 401);
    }

    const { itemId } = req.params as { itemId: string };
    const { quantity } = req.body;

    const result = await updateCartItemService(userId, itemId, quantity);

    res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Cart Item Updated.",
        data: result,
    });
});

export const removeCartItemController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
        throw new AppError("Unauthorized.", 401);
    }
    const { itemId } = req.params as { itemId: string };

    const result = await removeCartItemService(userId, itemId);

    res.status(200).json({
        success: true,
        statusCode: 200,
        message: result.message,
    });
});
