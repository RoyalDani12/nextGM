import { z } from "zod"

export const addToCartSchema = z.object({
    body: z.object({
        productId: z
            .string()
            .cuid("Invalid product ID."),

        variantId: z
            .string()
            .cuid("Invalid variant ID.")
            .optional(),

        quantity: z
            .number()
            .int("Quantity must be a whole number.")
            .min(1,   "Quantity must be at least 1.")
            .max(100, "Quantity cannot exceed 100."),

    }).strict()
})

export const updateCartItemSchema = z.object({
    body: z.object({
        quantity: z
            .number()
            .int("Quantity must be a whole number.")
            .min(1,   "Quantity must be at least 1.")
            .max(100, "Quantity cannot exceed 100."),
    }).strict()
})

export const mergeCartSchema = z.object({
    body: z.object({
        items: z.array(z.object({
            productId: z.string().cuid("Invalid product ID."),
            variantId: z.string().cuid("Invalid variant ID.").optional(),
            quantity: z.number().int().min(1).max(100),
        })).max(100),
    }).strict(),
});