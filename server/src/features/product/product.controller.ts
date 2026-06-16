import { Request, Response } from "express"
import { asyncHandler } from "../../utils/asyncHandler.js"
import { AppError } from "../../middleware/appError.js"
import { createProductService } from "./product.service.js"

export const createProductController = asyncHandler(
    async (req: Request, res: Response) => {

        const userId = req.user?.id
        if (!userId) {
            throw new AppError("Unauthorized.", 401)
        }

        const { shopId } = req.params as { shopId: string }

        const result = await createProductService(userId, shopId, req.body)

        res.status(201).json({
            success:    true,
            statusCode: 201,
            message:    "Product created successfully as draft.",
            data:       result,
        })
    }
)