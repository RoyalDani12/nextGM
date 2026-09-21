import { z } from "zod";

// import { z } from "zod";

const emptyStringToUndefined = z
  .string()
  .trim()
  .optional()
  .transform((val) => (val === "" ? undefined : val));

export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Product name must be at least 3 characters.")
    .max(200, "Product name cannot exceed 200 characters."),

  description: z
    .string()
    .trim()
    .max(2000, "Description cannot exceed 2000 characters."),

  basePrice: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid price, e.g. 19.99"),

  stock: z
    .number()
    .int("Stock must be a whole number.")
    .min(0, "Stock cannot be negative.")
    .max(100000, "Stock cannot exceed 100,000."),

  type: z.enum(["PHYSICAL", "DIGITAL"]),

  categoryId: emptyStringToUndefined,

  images: z.array(z.string().url()).max(10),

  sku: emptyStringToUndefined,
});

// export type CreateProductFormValues = z.infer<typeof createProductSchema>;

export type CreateProductFormValues = z.infer<
  typeof createProductSchema
>;




export const createVariantSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Variant name is required.")
    .max(100, "Variant name cannot exceed 100 characters."),

  price: z
    .string()
    .trim()
    .regex(
      /^\d+(\.\d{1,2})?$/,
      "Price must be a valid currency amount."
    )
    .refine(
      (value) => Number(value) > 0,
      "Price must be greater than 0."
    ),

  stock: z
    .number()
    .int("Stock must be a whole number.")
    .min(0, "Stock cannot be negative.")
    .max(100000, "Stock cannot exceed 100,000."),

  sku: z
    .string()
    .trim()
    .max(100, "SKU cannot exceed 100 characters.")
    .optional()
    .or(z.literal("")),
});

export type CreateVariantFormValues = z.infer<
  typeof createVariantSchema
>;