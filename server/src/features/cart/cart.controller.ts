import { Request, Response } from "express"
import { asyncHandler } from "../../utils/asyncHandler.js"
import { AppError } from "../../middleware/appError.js"
import { addToCartService } from "./cart.service.js"

export const addToCartController = asyncHandler(
    async (req: Request, res: Response) => {

        const userId = req.user?.id
        if (!userId) {
            throw new AppError("Unauthorized.", 401)
        }

        const result = await addToCartService(userId, req.body)

        res.status(201).json({
            success:    true,
            statusCode: 201,
            message:    "Item added to cart.",
            data:       result,
        })
    }
)