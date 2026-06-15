import { z } from "zod";

export const getUploadSignatureSchema = z.object({
    query: z
        .object({
            resourceType: z.enum(["user_avatar", "shop_logo", "shop_banner", "product_image"], {
                message: "Invalid asset resource target type.",
            }),

            resourceId: z.string().cuid("Resource identification must be a valid cuid"),

            mimeType: z.enum(["image/jpeg", "image/png", "image/webp"], {
                message: "Unsupported format. Allowed: JPEG, PNG or WEBP",
            }),
        })
        .strict()
});
