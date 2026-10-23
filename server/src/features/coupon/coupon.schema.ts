import { z } from "zod";

const couponType = z.enum(["PERCENTAGE", "FIXED_AMOUNT"]);

const couponBody = z.object({
    code: z.string().trim().min(3).max(32).regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, hyphens, or underscores only."),
    type: couponType,
    value: z.coerce.number().positive().max(1_000_000),
    minOrderAmount: z.preprocess((val) => (val === "" || val === undefined ? null : val), z.coerce.number().nonnegative().max(1_000_000).nullable().optional()),
    maxUses: z.preprocess((val) => (val === "" || val === undefined ? null : val), z.coerce.number().int().positive().max(1_000_000).nullable().optional()),
    expiresAt: z.preprocess((val) => (val === "" || val === undefined ? null : val), z.coerce.date().nullable().optional()),
    isActive: z.boolean().optional(),
    productIds: z.array(z.string().min(1)).max(100).optional(),
}).strict();

export const createCouponSchema = z.object({ body: couponBody }).superRefine(({ body }, ctx) => {
    if (body.type === "PERCENTAGE" && body.value > 100) {
        ctx.addIssue({ code: "custom", path: ["body", "value"], message: "Percentage discounts cannot exceed 100%." });
    }
    if (body.expiresAt && body.expiresAt.getTime() <= Date.now() - 60_000) {
        ctx.addIssue({ code: "custom", path: ["body", "expiresAt"], message: "Expiry date must be in the future." });
    }
});

export const updateCouponSchema = z.object({ body: couponBody.partial().omit({ code: true }).strict() }).superRefine(({ body }, ctx) => {
    if (body.type === "PERCENTAGE" && body.value !== undefined && body.value > 100) {
        ctx.addIssue({ code: "custom", path: ["body", "value"], message: "Percentage discounts cannot exceed 100%." });
    }
    if (body.expiresAt && body.expiresAt.getTime() <= Date.now() - 60_000) {
        ctx.addIssue({ code: "custom", path: ["body", "expiresAt"], message: "Expiry date must be in the future." });
    }
});

export const couponIdParamSchema = z.object({ params: z.object({ couponId: z.string().min(1) }) });
