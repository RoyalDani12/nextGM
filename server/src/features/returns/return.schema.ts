import { z } from "zod";

const returnItemSchema = z.object({
  orderItemId: z.string().cuid(),
  quantity: z.number().int().min(1).max(100),
});

export const createReturnSchema = z.object({
  body: z.object({
    orderId: z.string().cuid(),
    reason: z.enum([
      "DAMAGED",
      "WRONG_ITEM",
      "MISSING_ITEM",
      "NOT_AS_DESCRIBED",
      "QUALITY_ISSUE",
      "CHANGED_MIND",
      "OTHER",
    ]),
    resolution: z.enum(["REFUND", "REPLACEMENT"]).default("REFUND"),
    customerNote: z.string().trim().max(2000).optional(),
    items: z.array(returnItemSchema).min(1).max(50),
  }),
});

export const returnIdParamsSchema = z.object({
  params: z.object({ returnId: z.string().cuid() }),
});

export const updateReturnEvidenceSchema = z.object({
  params: z.object({ returnId: z.string().cuid() }),
  body: z.object({
    evidenceUrls: z.array(z.string().url()).max(5),
  }),
});

export const sellerReturnsQuerySchema = z.object({
  params: z.object({ shopId: z.string().cuid() }),
  query: z.object({
    status: z.string().trim().optional(),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export const sellerReturnParamsSchema = z.object({
  params: z.object({ shopId: z.string().cuid(), returnId: z.string().cuid() }),
});

export const sellerReturnStatusSchema = z.object({
  params: z.object({ shopId: z.string().cuid(), returnId: z.string().cuid() }),
  body: z.object({
    status: z.enum([
      "UNDER_REVIEW",
      "APPROVED",
      "REJECTED",
      "ITEM_RECEIVED",
      "REFUND_PENDING",
      "REPLACEMENT_SENT",
      "CLOSED",
    ]),
    note: z.string().trim().max(2000).optional(),
  }),
});
