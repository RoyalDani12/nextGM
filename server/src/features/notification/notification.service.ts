import { NotificationType } from "@prisma/client";
import { logger } from "../../config/logger.js";
import {
  findNotificationPreference,
  upsertNotificationPreference,
  findUserNotifications,
  countUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  findShopOwnerId,
  findSuperAdminIds,
  FindNotificationsOptions,
} from "./notification.repository.js";
import { notificationQueue } from "../../infrastructure/queue/queue.client.js";

const CATEGORY_MAP: Record<NotificationType, "orderUpdates" | "promotions" | "reviews"> = {
  ORDER_PLACED: "orderUpdates",
  ORDER_SHIPPED: "orderUpdates",
  ORDER_DELIVERED: "orderUpdates",
  PAYMENT_SUCCESS: "orderUpdates",
  PAYMENT_REFUNDED: "orderUpdates",
  PAYMENT_FAILED: "orderUpdates",
  COUPON_EXPIRING: "promotions",
  MEMBERSHIP_EXPIRING: "promotions",
  RETURN_REQUESTED: "orderUpdates",
  RETURN_UPDATED: "orderUpdates",
  REVIEW_RECEIVED: "reviews",
};

export const notifyUser = async (params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  shopId?: string;
  meta?: Record<string, any>;
}) => {
  const { userId, type, title, body, shopId, meta } = params;
  const pref = await findNotificationPreference(userId);

  const category = CATEGORY_MAP[type];
  const categoryEnabled = pref ? pref[category] : true;

  if (!categoryEnabled) {
    logger.info({ userId, type }, "Notification skipped - category disabled by user.");
    return;
  }

  const emailEnabled = pref ? pref.emailEnabled : true;

  try {
    await notificationQueue.add("send-notification", {
      userId,
      type,
      title,
      body,
      shopId,
      sendEmail: emailEnabled,
      meta,
    });
  } catch (err) {
    logger.error({ err, userId, type }, "Failed to enqueue notification");
  }
};

export const notifyShopOwner = async (params: {
  shopId: string;
  type: NotificationType;
  title: string;
  body: string;
  meta?: Record<string, any>;
}) => {
  const { shopId, type, title, body, meta } = params;
  const ownerId = await findShopOwnerId(shopId);

  if (!ownerId) {
    logger.warn({ shopId }, "Cannot notify shop owner — shop not found or has no owner.");
    return;
  }

  await notifyUser({
    userId: ownerId,
    type,
    title,
    body,
    shopId,
    meta,
  });
};

export const notifyAdmins = async (params: {
  type: NotificationType;
  title: string;
  body: string;
  meta?: Record<string, any>;
}) => {
  const adminIds = await findSuperAdminIds();
  await Promise.all(
    adminIds.map((adminId) =>
      notifyUser({
        userId: adminId,
        type: params.type,
        title: params.title,
        body: params.body,
        meta: params.meta,
      }),
    ),
  );
};

export const getUserNotificationsService = async (
  userId: string,
  options: FindNotificationsOptions,
) => {
  return findUserNotifications(userId, options);
};

export const getUnreadCountService = async (userId: string, shopId?: string) => {
  const count = await countUnreadNotifications(userId, shopId);
  return { unreadCount: count };
};

export const markAsReadService = async (id: string, userId: string) => {
  await markNotificationAsRead(id, userId);
  return { message: "Notification marked as read." };
};

export const markAllAsReadService = async (userId: string, shopId?: string) => {
  await markAllNotificationsAsRead(userId, shopId);
  return { message: "All notifications marked as read." };
};

export const deleteNotificationService = async (id: string, userId: string) => {
  await deleteNotification(id, userId);
  return { message: "Notification deleted." };
};

export const getNotificationPreferencesService = async (userId: string) => {
  const pref = await findNotificationPreference(userId);
  if (!pref) {
    return {
      userId,
      emailEnabled: true,
      pushEnabled: true,
      orderUpdates: true,
      promotions: true,
      reviews: true,
    };
  }
  return pref;
};

export const updateNotificationPreferencesService = async (
  userId: string,
  data: Partial<{
    emailEnabled: boolean;
    pushEnabled: boolean;
    orderUpdates: boolean;
    promotions: boolean;
    reviews: boolean;
  }>,
) => {
  const updated = await upsertNotificationPreference(userId, data);
  return updated;
};
