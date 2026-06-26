import { z } from "zod";

export const createProductSchema = z.object({
    params: z.object({
        shopId: z.string().cuid("Invalid shop identification format."),
    }),

    body: z
        .object({
            name: z
                .string()
                .trim()
                .min(3, "Product name must be at least 3 characters.")
                .max(200, "Product name cannot exceed 200 characters."),

            description: z
                .string()
                .trim()
                .max(2000, "Description cannot exceed 2000 characters.")
                .default(""),

            basePrice: z
                .string()
                .regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid currency amount (e.g., 19.99)")
                .transform((val) => parseFloat(val))
                .pipe(
                    z
                        .number()
                        .min(0.01, "Price must be at least 0.01")
                        .max(1000000, "Price cannot exceed 1,000,000"),
                ),

            stock: z
                .number()
                .int("Stock must be a whole number.")
                .min(0, "Stock cannot be negative.")
                .max(100000, "Stock cannot exceed 100,000 units per item."),

            type: z
                .enum(["PHYSICAL", "DIGITAL"], {
                    message: "Type must be either PHYSICAL or DIGITAL.",
                })
                .default("PHYSICAL"),

            categoryId: z.string().cuid("Invalid category ID format.").optional(),

            images: z
                .array(z.string().url("Each image must be a valid asset URL."))
                .max(10, "You can upload a maximum of 10 images.")
                .default([]),
            sku: z.string().optional(),
        })
        .strict(),
});

export const getShopProductsSchema = z.object({
    query: z.object({
        status: z
            .enum(["DRAFT", "ACTIVE", "ARCHIVED"])
            .optional(),

        page: z
            .string()
            .regex(/^\d+$/, "Page must be a positive number.")
            .transform(Number)
            .optional(),

        limit: z
            .string()
            .regex(/^\d+$/, "Limit must be a positive number.")
            .transform(Number)
            .optional(),

        sort: z
            .enum(["createdAt", "name", "basePrice", "stock"])
            .optional(),

        order: z
            .enum(["asc", "desc"])
            .optional(),
    })
})

export const updateProductSchema = z.object({
    body: z.object({
        name: z
            .string()
            .trim()
            .min(3, "Product name must be at least 3 characters.")
            .max(200, "Product name cannot exceed 200 characters.")
            .optional(),

        description: z
            .string()
            .trim()
            .max(2000, "Description cannot exceed 2000 characters.")
            .optional(),

        basePrice: z
            .string()
            .regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid amount (e.g. 19.99)")
            .optional(),

        stock: z
            .number()
            .int("Stock must be a whole number.")
            .min(0, "Stock cannot be negative.")
            .optional(),

        categoryId: z
            .string()
            .cuid("Invalid category ID.")
            .optional(),

        sku: z
            .string()
            .trim()
            .max(100, "SKU cannot exceed 100 characters.")
            .optional(),

    }).strict()
})

export const updateProductStatusSchema = z.object({
    body:z.object({
        status:z.enum(["ACTIVE","ARCHIVED"],{
            message:"Status must be either Active or Archived."
        })
    }).strict()
})

export const deleteProductSchema = z.object({
    params: z.object({
        shopId:    z.string().cuid("Invalid shop ID."),
        productId: z.string().cuid("Invalid product ID."),
    })
})

export const browseProductsSchema = z.object({
    query: z.object({
        page: z
            .string()
            .regex(/^\d+$/)
            .transform(Number)
            .optional(),

        limit: z
            .string()
            .regex(/^\d+$/)
            .transform(Number)
            .optional(),

        sort: z
            .enum(["createdAt", "basePrice", "name"])
            .optional(),

        order: z
            .enum(["asc", "desc"])
            .optional(),

        shopId: z
            .string()
            .cuid()
            .optional(),

        categoryId: z
            .string()
            .cuid()
            .optional(),

        type: z
            .enum(["PHYSICAL", "DIGITAL"])
            .optional(),

        minPrice: z
            .string()
            .regex(/^\d+(\.\d{1,2})?$/)
            .optional(),

        maxPrice: z
            .string()
            .regex(/^\d+(\.\d{1,2})?$/)
            .optional(),

        search: z
            .string()
            .trim()
            .max(100)
            .optional(),
    })
})

export const addProductImageSchema = z.object({
    body: z.object({
        url: z
            .string()
            .url("Image must be a valid URL.")
            .refine(
                (url) => url.includes("res.cloudinary.com"),
                { message: "Image must be uploaded via Cloudinary." }
            ),

        isPrimary: z
            .boolean()
            .optional()
            .default(false),

    }).strict()
})

export const createVariantSchema = z.object({
    body:z.object({
        name: z
              .string()
              .trim()
              .min(1,"Varaint name is required")
              .max(100,"Variant name cannot exceed 100 characters."),
        price:z
               .string()
               .regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid amount (e.g. 9.99)"),
        stock:z
              .number()
              .int("Stock must be a whole number.")
              .min(0, "Stock cannot be negative."),
        sku:z
             .string()
             .trim()
             .max(100,"SKU cannot exceed 100 characters.")
             .optional()

    }).strict()
})