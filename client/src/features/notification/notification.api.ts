import { api } from "@/lib/axios";
import type {
  NotificationListResponse,
  NotificationPreferences,
  UpdatePreferencesPayload,
} from "./notification.types";

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  shopId?: string;
}

export const getNotificationsRequest = async (
  params: GetNotificationsParams = {},
): Promise<NotificationListResponse> => {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.unreadOnly) query.set("unreadOnly", "true");
  if (params.shopId) query.set("shopId", params.shopId);

  const queryString = query.toString();
  const url = queryString ? `/notifications?${queryString}` : "/notifications";
  const { data } = await api.get(url);
  return data.data;
};

export const getUnreadCountRequest = async (
  shopId?: string,
): Promise<{ unreadCount: number }> => {
  const url = shopId
    ? `/notifications/unread-count?shopId=${encodeURIComponent(shopId)}`
    : "/notifications/unread-count";
  const { data } = await api.get(url);
  return data.data;
};

export const markNotificationAsReadRequest = async (
  id: string,
): Promise<{ message: string }> => {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data;
};

export const markAllNotificationsAsReadRequest = async (
  shopId?: string,
): Promise<{ message: string }> => {
  const { data } = await api.patch("/notifications/read-all", { shopId });
  return data;
};

export const deleteNotificationRequest = async (
  id: string,
): Promise<{ message: string }> => {
  const { data } = await api.delete(`/notifications/${id}`);
  return data;
};

export const getNotificationPreferencesRequest = async (): Promise<NotificationPreferences> => {
  const { data } = await api.get("/notifications/preferences");
  return data.data;
};

export const updateNotificationPreferencesRequest = async (
  payload: UpdatePreferencesPayload,
): Promise<{ message: string; data: NotificationPreferences }> => {
  const { data } = await api.put("/notifications/preferences", payload);
  return data;
};
