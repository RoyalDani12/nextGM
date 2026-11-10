export type NotificationType =
  | "ORDER_PLACED"
  | "ORDER_SHIPPED"
  | "ORDER_DELIVERED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_REFUNDED"
  | "PAYMENT_FAILED"
  | "REVIEW_RECEIVED"
  | "RETURN_REQUESTED"
  | "RETURN_UPDATED"
  | "COUPON_EXPIRING"
  | "MEMBERSHIP_EXPIRING";

export interface Notification {
  id: string;
  userId: string;
  shopId: string | null;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  meta?: {
    returnRequestId?: string;
    orderId?: string;
    status?: string;
  } | null;
  shop?: {
    id: string;
    slug: string;
    profile?: {
      name: string;
      logo: string | null;
    } | null;
  } | null;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

export interface NotificationPreferences {
  id?: string;
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  orderUpdates: boolean;
  orderPlaced?: boolean;
  orderShipped?: boolean;
  orderDelivered?: boolean;
  promotions: boolean;
  reviews: boolean;
}

export interface UpdatePreferencesPayload {
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  orderUpdates?: boolean;
  orderPlaced?: boolean;
  orderShipped?: boolean;
  orderDelivered?: boolean;
  promotions?: boolean;
  reviews?: boolean;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  shopId?: string;
}
