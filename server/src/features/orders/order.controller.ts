import { Request, Response } from "express"
import { asyncHandler } from "../../utils/asyncHandler.js"
import { AppError } from "../../middleware/appError.js"
import { checkoutService } from "./order.service.js"

export const checkoutController = asyncHandler(
    async (req: Request, res: Response) => {

        const userId = req.user?.id
        if (!userId) {
            throw new AppError("Unauthorized.", 401)
        }

        const { shippingAddress } = req.body

        const result = await checkoutService(userId, shippingAddress)

        res.status(201).json({
            success:    true,
            statusCode: 201,
            message:    "Order placed successfully.",
            data:       result,
        })
    }
)