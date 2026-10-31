import { z } from "zod";

export const createShopSchema = z.object({
    body: z
        .object({
            name: z
                .string()
                .trim()
                .min(3, "Shop name must be at least 3 characters.")
                .max(100, "Shop name cannot exceed 100 characters."),
        })
        .strict(),
});

export const updateShopProfileSchema = z.object({
    body: z
        .object({
            description: z
                .string()
                .trim()
                .max(1000, "Description cannot exceed 1000 characters.")
                .optional(),

            logo: z.string().url("Logo must be a valid URL.").max(2048).optional(),

            banner: z.string().url("Banner must be a valid URL.").max(2048).optional(),

            phone: z
                .string()
                .trim()
                .regex(/^\+?[1-9]\d{1,14}$/, "Invalid international phone format")
                .optional(),

            email: z.string().email("Invalid email format.").optional(),

            address: z.string().trim().max(200).optional(),

            city: z.string().trim().max(100).optional(),

            country: z.string().trim().max(100).optional(),

            website: z.string().url("Website must be a valid URL.").max(2048).optional(),

            shippingPolicy: z.string().trim().max(2000, "Shipping policy cannot exceed 2000 characters.").optional(),

            returnsPolicy: z.string().trim().max(2000, "Returns policy cannot exceed 2000 characters.").optional(),
        })
        .strict(),
});

export const updateShopStatusSchema = z.object({
    body: z
        .object({
            status: z.enum(["ACTIVE", "PAUSED"], {
                message: "Status must be either ACTIVE or PAUSED.",
            }),
        })
        .strict(),
});

export const closeShopSchema = z.object({
    body: z.object({
        confirmText: z
            .string()
            .refine(
                (val) => val === "CLOSE MY SHOP",
                { message: "Type CLOSE MY SHOP to confirm." }
            )
    }).strict()
})

// shop.schema.ts
export const updateShopLegalInfoSchema = z.object({
    body: z.object({
        legalBusinessName: z.string().min(2).optional(),
        taxId: z.string().min(3).optional(),
        entityType: z.string().min(2).optional(),
        ownerIdType: z.string().nullable().optional(),
        ownerIdNumber: z.string().nullable().optional(),
        ownerIdCardFront: z.string().nullable().optional(),
        ownerIdCardBack: z.string().nullable().optional(),
        submitForVerification: z.boolean().optional(),
    }).passthrough(),
});
