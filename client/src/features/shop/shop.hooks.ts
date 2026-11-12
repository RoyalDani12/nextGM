import { useQuery,useMutation,useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";

import {
  createShopRequest,
  getMyShopRequest,
  updateShopStatusRequest,
  updateShopProfileRequest,
  closeShopRequest,
  getPublishReadinessRequest,
  publishShopRequest,
  updateShopLegalInfoRequest,
  getShopReviewsRequest,
  replyShopReviewRequest,
  deleteShopReviewReplyRequest,
  type ShopReviewsFilters,
} from "./shop.api";
import {
  getUploadSignatureRequest,
  uploadToCloudinary,
  type UploadResourceType,
} from "../upload/upload.api";
import {
  getShopOrdersRequest,
  getShopOrderByIdRequest,
  markShopOrderShippedRequest,
  updateShopOrderStatusRequest,
  type GetShopOrdersParams,
} from "../order/order.api";

import type { CreateShopPayload, UpdateShopProfilePayload, UpdateShopLegalInfoPayload } from "./shop.types";

export const useMyShops = (options?: { refetchInterval?: number | false }) => {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: ["my-shops", userId],
    queryFn: getMyShopRequest,
    enabled: !!userId,
    retry: false,
    staleTime: 10 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: options?.refetchInterval,
  });
};

export const useCreateShop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateShopPayload) =>
      createShopRequest(payload),

    onSuccess: (response: any) => {
      const { user, accessToken, ...newShop } = response?.data || {};
      if (user && accessToken) {
        useAuthStore.getState().setAuth(user, accessToken);
      } else if (user) {
        const currentToken = useAuthStore.getState().accessToken || "";
        useAuthStore.getState().setAuth(user, currentToken);
      } else {
        const currentUser = useAuthStore.getState().user;
        if (currentUser && currentUser.role === "CUSTOMER") {
          useAuthStore.getState().setAuth(
            { ...currentUser, role: "SHOP_OWNER" },
            useAuthStore.getState().accessToken || ""
          );
        }
      }

      const activeUserId = user?.id || useAuthStore.getState().user?.id;
      if (newShop && newShop.id && activeUserId) {
        queryClient.setQueryData(["my-shops", activeUserId], (old: any) => {
          const oldList = old?.data || (Array.isArray(old) ? old : []);
          return {
            ...old,
            success: true,
            statusCode: 200,
            message: "Shop fetched successfully.",
            data: [newShop, ...oldList.filter((s: any) => s.id !== newShop.id)],
          };
        });
      }

      queryClient.invalidateQueries({
        queryKey: ["my-shops"],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-me"],
      });
    },
  });
};

export const useUpdateShopStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      shopId,
      status,
    }: {
      shopId: string;
      status: "ACTIVE" | "PAUSED";
    }) => updateShopStatusRequest(shopId, status),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["my-shops"],
      });
    },
  });
};

export const useUpdateShopProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      shopId,
      payload,
    }: {
      shopId: string;
      payload: UpdateShopProfilePayload;
    }) => updateShopProfileRequest(shopId, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["my-shops"],
      });
    },
  });
};


export const useUpdateShopLegalInfo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      shopId,
      payload,
    }: {
      shopId: string;
      payload: UpdateShopLegalInfoPayload;
    }) => updateShopLegalInfoRequest(shopId, payload),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["my-shops"],
      });
      queryClient.invalidateQueries({
        queryKey: ["shop-publish-readiness", variables.shopId],
      });
    },
  });
};

export const useShopImageUpload = () => {
  return useMutation({
    mutationFn: async ({
      file,
      shopId,
      resourceType,
    }: {
      file: File;
      shopId: string;
      resourceType: UploadResourceType;
    }) => {
      const signature = await getUploadSignatureRequest(
        resourceType,
        shopId,
        file.type
      );

      const result = await uploadToCloudinary(file, signature);

      return result.secure_url as string;
    },
  });
};

export const useCloseShop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      shopId,
      confirmText,
    }: {
      shopId: string;
      confirmText: string;
    }) => closeShopRequest(shopId, confirmText),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["my-shops"],
      });
    },
  });
};

export const useShopOrders = (
  shopId: string,
  params?: GetShopOrdersParams
) => {
  return useQuery({
    queryKey: ["shop-orders", shopId, params],
    queryFn: () => getShopOrdersRequest(shopId, params),
    enabled: !!shopId,
  });
};

export const useShopOrder = (
  shopId: string,
  orderId: string
) => {
  return useQuery({
    queryKey: ["shop-order", shopId, orderId],

    queryFn: () =>
      getShopOrderByIdRequest(shopId, orderId),

    enabled: !!shopId && !!orderId,
  });
};

export const useUpdateShopOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      shopId,
      orderId,
      status,
    }: {
      shopId: string;
      orderId: string;
      status: string;
    }) =>
      updateShopOrderStatusRequest(
        shopId,
        orderId,
        status,
      ),

    onSuccess: (_, variables) => {
      // Refresh orders list and dashboard analytics
      queryClient.invalidateQueries({
        queryKey: ["shop-orders", variables.shopId],
      });
      queryClient.invalidateQueries({
        queryKey: ["shop-analytics", variables.shopId],
      });

      // Refresh current order detail
      queryClient.invalidateQueries({
        queryKey: [
          "shop-order",
          variables.shopId,
          variables.orderId,
        ],
      });
    },
  });
};

export const useMarkShopOrderShipped = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      shopId,
      orderId,
      shipment,
    }: {
      shopId: string;
      orderId: string;
      shipment: { carrier: string; trackingNumber?: string; trackingUrl?: string; note?: string };
    }) => markShopOrderShippedRequest(shopId, orderId, shipment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shop-orders", variables.shopId] });
      queryClient.invalidateQueries({ queryKey: ["shop-analytics", variables.shopId] });
      queryClient.invalidateQueries({ queryKey: ["shop-order", variables.shopId, variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["customer-order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["customer-order"] });
    },
  });
};

export const usePublishReadiness = (shopId: string) => useQuery({
  queryKey: ["shop-publish-readiness", shopId],
  queryFn: () => getPublishReadinessRequest(shopId),
  enabled: Boolean(shopId),
  refetchInterval: 10_000,
  refetchOnWindowFocus: true,
});

export const usePublishShop = (shopId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => publishShopRequest(shopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-publish-readiness", shopId] });
      queryClient.invalidateQueries({ queryKey: ["my-shops"] });
    },
  });
};

export const useShopReviews = (shopId: string, filters?: ShopReviewsFilters) => {
  return useQuery({
    queryKey: ["shop-reviews", shopId, filters],
    queryFn: () => getShopReviewsRequest(shopId, filters),
    enabled: !!shopId,
  });
};

export const useReplyShopReview = (shopId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, comment }: { reviewId: string; comment: string }) =>
      replyShopReviewRequest(reviewId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-reviews", shopId] });
    },
  });
};

export const useDeleteShopReviewReply = (shopId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => deleteShopReviewReplyRequest(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-reviews", shopId] });
    },
  });
};
