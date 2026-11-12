import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import {
  getNotificationsRequest,
  getUnreadCountRequest,
  markNotificationAsReadRequest,
  markAllNotificationsAsReadRequest,
  deleteNotificationRequest,
  getNotificationPreferencesRequest,
  updateNotificationPreferencesRequest,
} from "./notification.api";
import type {
  UpdatePreferencesPayload,
  GetNotificationsParams,
} from "./notification.types";

export const useNotifications = (params: GetNotificationsParams = {}, enabled = true) => {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.accessToken);
  const isAuthReady = Boolean(user && token);

  return useQuery({
    queryKey: ["notifications", params, user?.id],
    queryFn: () => getNotificationsRequest(params),
    enabled: enabled && isAuthReady,
    refetchInterval: isAuthReady ? 15_000 : false,
    refetchOnWindowFocus: true,
    staleTime: 5_000,
  });
};

export const useUnreadNotificationCount = (shopId?: string, enabled = true) => {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.accessToken);
  const isAuthReady = Boolean(user && token);

  return useQuery({
    queryKey: ["notifications-unread", shopId, user?.id],
    queryFn: () => getUnreadCountRequest(shopId),
    enabled: enabled && isAuthReady,
    refetchInterval: isAuthReady ? 15_000 : false,
    refetchOnWindowFocus: true,
    staleTime: 5_000,
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
