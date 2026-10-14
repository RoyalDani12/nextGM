import { z } from "zod";

export const categoryBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  parentId: z.string().cuid().nullable().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  icon: z.string().trim().max(80).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10000).optional(),
}).strict();

export const createCategorySchema = z.object({ body: categoryBodySchema });
export const updateCategorySchema = z.object({ params: z.object({ id: z.string().cuid() }), body: categoryBodySchema.partial().refine((data) => Object.keys(data).length > 0) });
export const deleteCategorySchema = z.object({ params: z.object({ id: z.string().cuid() }) });
