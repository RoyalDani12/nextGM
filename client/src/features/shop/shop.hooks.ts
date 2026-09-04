import { useQuery,useMutation,useQueryClient } from "@tanstack/react-query";

import { createShopRequest,getMyShopRequest } from "./shop.api";

import type { CreateShopPayload } from "./shop.types";
import { useAuthStore } from "@/store/auth.store";

export const useMyShops = () => {
  const isAuthenticated = useAuthStore((state) => (
    state.isAuthenticated && Boolean(state.user && state.accessToken)
  ));

  return useQuery({
    queryKey: ["my-shops"],
    queryFn: getMyShopRequest,
    retry: false,
    enabled: isAuthenticated,
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