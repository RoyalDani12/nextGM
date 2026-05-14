import z from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string()
      .trim()
      .min(3, "Name must be at least 3 characters")
      .max(50, "Name cannot exceed 50 characters")
      .optional(),
      
    phone: z.string()
      .trim()
      .regex(/^\+?[1-9]\d{1,14}$/, "Invalid international phone format")
      .optional(),
      
    address: z.string()
      .trim()
      .min(5, "Address must be at least 5 characters")
      .max(100, "Address cannot exceed 100 characters")
      .optional(),
      
    country: z.string()
      .trim()
      .min(2, "Country code/name must be at least 2 characters")
      .max(50, "Country name is too long")
      .optional(),
      
    city: z.string()
      .trim()
      .min(2, "City must be at least 2 characters")
      .max(50, "City cannot exceed 50 characters")
      .optional(),
      
    avatar: z.string()
      .url("Avatar must be a valid URL string")
      .max(2048, "URL is too long")
      .optional()
  }).strict() // Rejects any unexpected fields (e.g., body.role = "admin")
});

// Extract the TypeScript type automatically from the schema
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;