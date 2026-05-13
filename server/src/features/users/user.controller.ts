import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getMeService } from "./user.service.js";

export const getMeController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const result = await getMeService(userId);

    res.status(200).json({
        success: true,
        statusCode: 200,
        message: result.message,
        data: result.user,
    });
});
