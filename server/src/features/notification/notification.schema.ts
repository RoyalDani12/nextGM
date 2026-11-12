import { z } from "zod";

export const getNotificationsSchema = z.object({
  query: z
    .object({
      page: z.string().optional(),
      limit: z.string().optional(),
      unreadOnly: z.string().optional(),
      shopId: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

export const notificationIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Notification ID is required"),
  }),
});

export const markAllReadSchema = z.object({
  body: z
    .object({
      shopId: z.string().optional(),
    })
    .optional(),
});

export const updatePreferencesSchema = z.object({
  body: z
    .object({
      emailEnabled: z.boolean().optional(),
      pushEnabled: z.boolean().optional(),
      orderUpdates: z.boolean().optional(),
      orderPlaced: z.boolean().optional(),
      orderShipped: z.boolean().optional(),
      orderDelivered: z.boolean().optional(),
      promotions: z.boolean().optional(),
      reviews: z.boolean().optional(),
    })
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one preference setting must be provided.",
    ),
});
