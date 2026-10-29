import { Request, Response } from "express"
import { asyncHandler } from "../../utils/asyncHandler.js"
import { AppError } from "../../middleware/appError.js"
import { generateUploadSignatureService } from "./upload.service.js"

export const getUploadSignatureController = asyncHandler(
    async (req: Request, res: Response) => {

        const userId = req.user?.id
        if (!userId) {
            throw new AppError("Unauthorized.", 401)
        }

        const { resourceType, resourceId, mimeType } = req.query as {
            resourceType: "user_avatar" | "shop_logo" | "shop_banner" | "product_image" | "category_image" | "return_evidence"
            resourceId:   string
            mimeType:     "image/jpeg" | "image/png" | "image/webp"
        }

        const result = await generateUploadSignatureService({
            userId,
            resourceType,
            resourceId,
            mimeType,
        })

        res.status(200).json({
            success:    true,
            statusCode: 200,
            message:    "Upload signature generated successfully.",
            data:       result,
        })
    }
)
