import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotificationsRequest,
  getUnreadCountRequest,
  markNotificationAsReadRequest,
  markAllNotificationsAsReadRequest,
  deleteNotificationRequest,
  getNotificationPreferencesRequest,
  updateNotificationPreferencesRequest,
  GetNotificationsParams,
} from "./notification.api";
import type { UpdatePreferencesPayload } from "./notification.types";

export const useNotifications = (params: GetNotificationsParams = {}, enabled = true) => {
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: () => getNotificationsRequest(params),
    enabled,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
};

export const useUnreadNotificationCount = (shopId?: string, enabled = true) => {
  return useQuery({
    queryKey: ["notifications-unread", shopId],
    queryFn: () => getUnreadCountRequest(shopId),
    enabled,
    refetchInterval: 20_000, // Poll every 20 seconds for real-time badge updates
    refetchOnWindowFocus: true,
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationAsReadRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shopId?: string) => markAllNotificationsAsReadRequest(shopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNotificationRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });
};

export const useNotificationPreferences = (enabled = true) => {
  return useQuery({
    queryKey: ["notification-preferences"],
    queryFn: getNotificationPreferencesRequest,
    enabled,
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdatePreferencesPayload) =>
      updateNotificationPreferencesRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
  });
};
