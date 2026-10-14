import { useQuery,useMutation,useQueryClient } from "@tanstack/react-query";

import { createShopRequest,getMyShopRequest ,updateShopStatusRequest,updateShopProfileRequest,closeShopRequest, getPublishReadinessRequest, publishShopRequest} from "./shop.api";
import {
  getUploadSignatureRequest,
  uploadToCloudinary,
  type UploadResourceType,
} from "../upload/upload.api";
import { getShopOrdersRequest ,getShopOrderByIdRequest ,  updateShopOrderStatusRequest,} from "../order/order.api";

import type { CreateShopPayload, UpdateShopProfilePayload, } from "./shop.types";

export const useMyShops = () => {
  return useQuery({
    queryKey: ["my-shops"],
    queryFn: getMyShopRequest,
    retry: false,
  });
};

export const useCreateShop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateShopPayload) =>
      createShopRequest(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["my-shops"],
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

export const useShopOrders = (shopId: string) => {
  return useQuery({
    queryKey: ["shop-orders", shopId],
    queryFn: () => getShopOrdersRequest(shopId),
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
      // Refresh orders list
      queryClient.invalidateQueries({
        queryKey: ["shop-orders", variables.shopId],
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
