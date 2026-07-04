import { z } from "zod"

export const checkoutSchema = z.object({
    body: z.object({

        shippingAddress: z.object({
            fullName: z
                .string()
                .trim()
                .min(2,   "Full name must be at least 2 characters.")
                .max(100, "Full name exceeds maximum length."),

            phone: z
                .string()
                .trim()
                .regex(
                    /^\+?[1-9]\d{1,14}$/,
                    "Phone must be a valid international E.164 format."
                ),

            address: z
                .string()
                .trim()
                .min(5,   "Street address must be descriptive.")
                .max(200, "Address line too long."),

            city: z
                .string()
                .trim()
                .min(2,   "City name is required.")
                .max(100, "City name too long."),

            country: z
                .string()
                .trim()
                .length(2, "Country must be a valid 2-letter ISO code (e.g. US, ET)."),

            postalCode: z
                .string()
                .trim()
                .max(20, "Postal code too long.")
                .transform((val) => (val === "" ? undefined : val))
                .optional(),

        }).strict(),

    }).strict(),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>