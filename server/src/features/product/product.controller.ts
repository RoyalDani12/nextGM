import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../middleware/appError.js";
import {
    createProductService,
    getShopProductsService,
    updateProductService,
} from "./product.service.js";

export const createProductController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AppError("Unauthorized.", 401);
    }

    const { shopId } = req.params as { shopId: string };

    const result = await createProductService(userId, shopId, req.body);

    res.status(201).json({
        success: true,
        statusCode: 201,
        message: "Product created successfully as draft.",
        data: result,
    });
});

export const getShopProductsController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AppError("Unauthorized.", 401);
    }

    const { shopId } = req.params as { shopId: string };

    const result = await getShopProductsService(userId, shopId, req.query as any);

    res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Products fetched successfully.",
        data: result,
    });
});

export const updateProductController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AppError("Unauthorized.", 401);
    }

    const { shopId, productId } = req.params as {
        shopId: string;
        productId: string;
    };

    const result = await updateProductService(userId, shopId, productId, req.body);

    res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Product updated successfully.",
        data: result,
    });
});
