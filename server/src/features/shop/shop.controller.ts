import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../middleware/appError.js";
import {
    createShopService,
    getMyShopsService,
    updateShopProfileService,
    getShopBySlugService,
    updateShopStatusService,
    closeShopService,
    updateShopLegalInfoService,
    getPublishReadinessService,
    publishShopService,
    getShopWalletService
} from "./shop.service.js";

export const createShopController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AppError("Unauthorized", 401);
    }

    const { name } = req.body;
    const result = await createShopService(userId, name);

    res.status(201).json({
        success: true,
        statusCode: 201,
        message: "Shop created successfully.Pending review.",
        data: result,
    });
});

export const getMyShopsController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AppError("Unauthorized.", 401);
    }

    const result = await getMyShopsService(userId);

    res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Shop fetched successfully.",
        data: result,
    });
});

export const updateShopProfileController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AppError("Unauthorized.", 401);
    }

    const shopId = req.params.id as string;
    if (!shopId) {
        throw new AppError("Shop Id messing", 400);
    }

    const result = await updateShopProfileService(userId, shopId, req.body);

    res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Shop profile updated successfully.",
        data: result,
    });
});

export const getShopBySlugController = asyncHandler(async (req: Request, res: Response) => {
    const slug = req.params.slug as string;

    const result = await getShopBySlugService(slug);

    res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Shop fetched successfully.",
        data: result,
    });
});

export const updateShopStatusController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AppError("Unauthorized.", 401);
    }

    const shopId = req.params.id as string;
    const { status } = req.body;

    const result = await updateShopStatusService(userId, shopId, status);
    res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Shop status updated to ${result.status}.`,
        data: result,
    });
});

export const closeShopController = asyncHandler(
    async (req: Request, res: Response) => {

        const userId = req.user?.id
        if (!userId) {
            throw new AppError("Unauthorized.", 401)
        }

        const shopId = req.params.id as string

        const result = await closeShopService(userId, shopId)

        res.status(200).json({
            success:    true,
            statusCode: 200,
            message:    result.message,
        })
    }
)

export const updateShopLegalInfoController = asyncHandler(async (req: Request, res: Response) => {
    const result = await updateShopLegalInfoService(req.shop!.id, req.body);
    res.status(200).json({
         success: true,
         statusCode: 200, 
         message: "Legal info saved.",
         data: result
         });
});

export const getPublishReadinessController = asyncHandler(async (req: Request, res: Response) => {
    const result = await getPublishReadinessService(req.shop!.id);
    res.status(200).json({
         success: true, 
         statusCode: 200,
         message: "Publish readiness checked.",
         data: result
         });
});

export const publishShopController = asyncHandler(async (req: Request, res: Response) => {
    const result = await publishShopService(req.shop!.id);
    res.status(200).json({ 
         success: true,
         statusCode: 200,
         message: "Shop published successfully.",
         data: result
         });
});

export const getShopWalletController = asyncHandler(async (req: Request, res: Response) => {
    const result = await getShopWalletService(req.shop!.id);
    res.status(200).json({ 
        success: true,
         statusCode: 200,
         message: "Wallet fetched.",
         data: result
         });
});