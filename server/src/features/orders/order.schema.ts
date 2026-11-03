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
        couponCodes: z.record(z.string().min(1), z.string().trim().min(3).max(32)).optional(),
        shippingMethods: z.record(z.string().min(1), z.enum(["STANDARD", "EXPRESS", "PICKUP"])).optional(),

    }).strict(),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>


export const getOrdersSchema = z.object({
    query: z.object({
        status: z
            .enum([
                "PENDING",
                "CONFIRMED",
                "PROCESSING",
                "SHIPPED",
                "DELIVERED",
                "CANCELLED",
                "REFUNDED",
            ])
            .optional(),

        page: z
            .union([
                z.string().regex(/^\d+$/).transform(Number),
                z.number().int().positive(),
            ])
            .optional(),
        limit: z
            .union([
                z.string().regex(/^\d+$/).transform(Number),
                z.number().int().positive(),
            ])
            .optional(),
        search: z.string().trim().max(100).optional(),
        startDate: z.string().trim().optional(),
        endDate: z.string().trim().optional(),
    }),
});
export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      "CONFIRMED",
      "PROCESSING",
      "DELIVERED",
    ], {
      message: "Status must be CONFIRMED, PROCESSING, or DELIVERED."
    })
  }).strict()
});

export const markOrderShippedSchema = z.object({
  body: z.object({
    carrier: z.string().trim().min(2).max(100),
    trackingNumber: z.string().trim().min(2).max(100).optional(),
    trackingUrl: z.string().trim().url().max(500).refine((url) => /^https?:\/\//i.test(url), "Tracking link must use http or https.").optional(),
    note: z.string().trim().max(500).optional(),
  }).strict(),
});
