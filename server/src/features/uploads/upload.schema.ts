import { z } from "zod";

export const getUploadSignatureSchema = z.object({
    query: z
        .object({
            resourceType: z.enum(["user_avatar", "shop_logo", "shop_banner", "product_image", "category_image", "return_evidence"], {
                message: "Invalid asset resource target type.",
            }),

            // category images are platform assets and do not belong to a single record yet
            resourceId: z.string().min(1, "Resource identification is required"),

            mimeType: z.enum(["image/jpeg", "image/png", "image/webp"], {
                message: "Unsupported format. Allowed: JPEG, PNG or WEBP",
            }),
        })
        .strict()
});
