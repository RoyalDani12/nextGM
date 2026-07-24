import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../middleware/appError.js";
import { createPaymentIntentService } from "./payment.service.js";

export const createPaymentIntentController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AppError("Unauthorized.", 401);
    }

    const { orderId } = req.params as { orderId: string };

    const result = await createPaymentIntentService(orderId, userId);

    res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Payment intent created successfully.",
        data: result,
    });
});