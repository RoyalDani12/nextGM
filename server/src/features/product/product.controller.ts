import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../middleware/appError.js";
import {
    createProductService,
    getShopProductsService,
    updateProductService,
    updateProductStatusService,
    deleteProductService,
    getPublicProductService,
    getPromotedProductsService,
    getPublicCouponsService,
    browseProductsService,
    addProductImageService,
    createVaraintService,
    updateVariantService,
    deleteVariantService,
} from "./product.service.js";

export const getPromotedProductsController = asyncHandler(async (_req: Request, res: Response) => {
    const data = await getPromotedProductsService();
    res.status(200).json({ success: true, data });
});

export const getPublicCouponsController = asyncHandler(async (_req: Request, res: Response) => {
    const data = await getPublicCouponsService();
    res.status(200).json({ success: true, data });
});

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

export const updateProductStatusController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AppError("Unauthorized.", 401);
    }

    const { shopId, productId } = req.params as {
        shopId: string;
        productId: string;
    };
    const { status } = req.body;

    const result = await updateProductStatusService(userId, shopId, productId, status);

    res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Product status updated to ${result.status}.`,
        data: result,
    });
});

export const deleteProductController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AppError("Unauthorized.", 401);
    }

    const { shopId, productId } = req.params as {
        shopId: string;
        productId: string;
    };

    const result = await deleteProductService(userId, shopId, productId);

    res.status(200).json({
        success: true,
        statusCode: 200,
        message: result.message,
    });
});

export const getPublicProductController = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params as { productId: string };

    const result = await getPublicProductService(productId);

    res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Product fetched successfully.",
        data: result,
    });
});

export const browseProductsController = asyncHandler(async (req: Request, res: Response) => {
    const result = await browseProductsService(req.query as any);

    res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Products fetched successfully.",
        data: result,
    });
});

export const addProductImageController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AppError("Unauthorized.", 401);
    }

    const { shopId, productId } = req.params as {
        shopId: string;
        productId: string;
    };

    const result = await addProductImageService(userId, shopId, productId, req.body);

    res.status(201).json({
        success: true,
        statusCode: 201,
        message: "Product image added successfully.",
        data: result,
    });
});

export const createVariantController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized.", 401);

    const { shopId, productId } = req.params as {
        shopId: string;
        productId: string;
    };

    const result = await createVaraintService(userId, shopId, productId, req.body);

    res.status(201).json({
        success: true,
        statusCode: 201,
        message: "Variant created successfully.",
        data: result,
    });
});

export const updateVariantController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized.", 401);

    const { shopId, productId, variantId } = req.params as {
        shopId: string;
        productId: string;
        variantId: string;
    };

    const result = await updateVariantService(userId, shopId, productId, variantId, req.body);

    res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Variant updated successfully.",
        data: result,
    });
});

export const deleteVariantController = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?.id
        if (!userId) throw new AppError("Unauthorized.", 401)

        const { shopId, productId, variantId } = req.params as {
            shopId:    string
            productId: string
            variantId: string
        }

        const result = await deleteVariantService(
            userId, shopId, productId, variantId
        )

        res.status(200).json({
            success:    true,
            statusCode: 200,
            message:    result.message,
        })
    }
)
