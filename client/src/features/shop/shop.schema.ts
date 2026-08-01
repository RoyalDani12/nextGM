import { z } from "zod";

export const createShopSchema = z.object({
    name: z.string().min(3, "Shop name must be at least 3 characters").max(60, "Keep it under 60 characters"),
});

export type CreateShopFormValues = z.infer<typeof createShopSchema>;