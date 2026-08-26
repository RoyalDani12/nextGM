import { useQuery,useMutation,useQueryClient } from "@tanstack/react-query";

import { createShopRequest,getMyShopRequest } from "./shop.api";

import type { CreateShopPayload } from "./shop.types";

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