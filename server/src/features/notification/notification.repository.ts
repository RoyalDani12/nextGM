import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../../config/db.js";

export const findNotificationPreference = async (userId: string) => {
  return prisma.notificationPreference.findUnique({
    where: { userId },
  });
};

export const upsertNotificationPreference = async (
  userId: string,
  data: Partial<{
    emailEnabled: boolean;
    pushEnabled: boolean;
    orderUpdates: boolean;
    orderPlaced: boolean;
    orderShipped: boolean;
    orderDelivered: boolean;
    promotions: boolean;
    reviews: boolean;
  }>,
) => {
  return prisma.notificationPreference.upsert({
    where: { userId },
    create: {
      userId,
      ...data,
    },
    update: data,
  });
};

export const createNotificationRecored = async (data: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  shopId?: string;
}) => {
  return prisma.notification.create({
    data,
  });
};

export interface FindNotificationsOptions {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  shopId?: string;
}

export const findUserNotifications = async (
  userId: string,
  options: FindNotificationsOptions = {},
  userRole?: string,
) => {
  const { page = 1, limit = 20, unreadOnly = false, shopId } = options;
  const skip = (page - 1) * limit;

  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const userClause: Prisma.NotificationWhereInput = isSuperAdmin
    ? {
        OR: [
          { userId },
          { type: "SHOP_CREATED" },
        ],
      }
    : { userId };

  const where: Prisma.NotificationWhereInput = {
    ...userClause,
    ...(unreadOnly ? { isRead: false } : {}),
    ...(shopId ? { shopId } : {}),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        shop: {
          select: {
            id: true,
            slug: true,
            profile: {
              select: {
                name: true,
                logo: true,
              },
            },
          },
        },
      },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: {
        ...userClause,
        isRead: false,
        ...(shopId ? { shopId } : {}),
      },
    }),
  ]);

  return {
    notifications,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    unreadCount,
  };
};

export const countUnreadNotifications = async (
  userId: string,
  shopId?: string,
  userRole?: string,
) => {
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const userClause: Prisma.NotificationWhereInput = isSuperAdmin
    ? {
        OR: [
          { userId },
          { type: "SHOP_CREATED" },
        ],
      }
    : { userId };

  return prisma.notification.count({
    where: {
      ...userClause,
      isRead: false,
      ...(shopId ? { shopId } : {}),
    },
  });
};

export const markNotificationAsRead = async (
  id: string,
  userId: string,
  userRole?: string,
) => {
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  return prisma.notification.updateMany({
    where: {
      id,
      ...(isSuperAdmin ? {} : { userId }),
    },
    data: {
      isRead: true,
    },
  });
};

export const markAllNotificationsAsRead = async (
  userId: string,
  shopId?: string,
  userRole?: string,
) => {
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const userClause: Prisma.NotificationWhereInput = isSuperAdmin
    ? {
        OR: [
          { userId },
          { type: "SHOP_CREATED" },
        ],
      }
    : { userId };

  return prisma.notification.updateMany({
    where: {
      ...userClause,
      isRead: false,
      ...(shopId ? { shopId } : {}),
    },
    data: {
      isRead: true,
    },
  });
};

export const deleteNotification = async (
  id: string,
  userId: string,
) => {
  return prisma.notification.deleteMany({
    where: {
      id,
      userId,
    },
  });
};

export const findShopOwnerId = async (shopId: string) => {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { ownerId: true },
  });
  return shop?.ownerId ?? null;
};

export const findSuperAdminIds = async () => {
  const admins = await prisma.user.findMany({
    where: { role: "SUPER_ADMIN" },
    select: { id: true },
  });
  return admins.map((a) => a.id);
};