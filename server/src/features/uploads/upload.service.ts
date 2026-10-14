import { cloudinary } from "../../infrastructure/storage/cloudinary.client.js";
import { AppError } from "../../middleware/appError.js";
import { env } from "../../config/env.js";
import { findShopById } from "../shop/shop.repository.js";
import { GenerateSignatureInput, MimeType } from "./upload.types.js";
import { findProductWithShop } from "../product/product.repository.js";
import { prisma } from "../../config/db.js";

// FIX: Ensure your dictionary explicitly covers all possible valid union values
const MIME_TO_EXTENSION: Record<MimeType, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
};

export const generateUploadSignatureService = async ({
    userId,
    resourceType,
    resourceId,
    mimeType,
}: GenerateSignatureInput) => {
    let folder: string;

    switch (resourceType) {
        case "user_avatar": {
            if (resourceId !== userId) {
                throw new AppError("You can only upload your own avatar.", 403);
            }
            folder = `user_avatar/${userId}`;
            break;
        }
        case "shop_logo":
        case "shop_banner": {
            const shop = await findShopById(resourceId);
            if (!shop) {
                throw new AppError("shop not found.", 404);
            }
            if (shop.ownerId !== userId) {
                throw new AppError("You do not own this shop.", 403);
            }
            const assetType = resourceType === "shop_logo" ? "logo" : "banner";
            folder = `shop_assets/${resourceId}/${assetType}`;
            break;
        }
        case "product_image": {
            // Check if resourceId is a shopId owned by user
            const shop = await findShopById(resourceId);
            if (shop) {
                if (shop.ownerId !== userId) {
                    throw new AppError("You do not own this shop.", 403);
                }
                folder = `product_images/${resourceId}`;
                break;
            }

            // Or check if resourceId is a productId belonging to a shop owned by user
            const product = await findProductWithShop(resourceId);
            if (!product || product.deletedAt) {
                throw new AppError("Shop or product not found.", 404);
            }

            if (product.shop.ownerId !== userId) {
                throw new AppError("You do not own this product's shop.", 403);
            }

            folder = `product_images/${product.shopId}`;
            break;
        }
        case "category_image": {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
            if (user?.role !== "SUPER_ADMIN") {
                throw new AppError("Only administrators can upload category images.", 403);
            }
            folder = "categories";
            break;
        }
        default: {
            throw new AppError("Invalid resource type.", 400);
        }
    }

    const timestamp = Math.round(Date.now() / 1000);

    const signature = cloudinary.utils.api_sign_request(
        {
            timestamp,
            folder,
        },
        env.CLOUDINARY_API_SECRET,
    );

    return {
        signature,
        timestamp,
        folder,
        apiKey: env.CLOUDINARY_API_KEY,
        cloudName: env.CLOUDINARY_CLOUD_NAME,
    };
};
