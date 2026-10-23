import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { couponApi, type CouponInput } from "./coupons.api";

const key = (shopId: string) => ["shop", shopId, "coupons"] as const;

export const useCoupons = (shopId: string) => useQuery({ queryKey: key(shopId), queryFn: () => couponApi.list(shopId), enabled: Boolean(shopId) });

export const useCreateCoupon = (shopId: string) => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: CouponInput) => couponApi.create(shopId, input), onSuccess: () => queryClient.invalidateQueries({ queryKey: key(shopId) }) });
};

export const useUpdateCoupon = (shopId: string) => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ couponId, input }: { couponId: string; input: Partial<CouponInput> }) => couponApi.update(shopId, couponId, input), onSuccess: () => queryClient.invalidateQueries({ queryKey: key(shopId) }) });
};

export const useDeleteCoupon = (shopId: string) => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (couponId: string) => couponApi.remove(shopId, couponId), onSuccess: () => queryClient.invalidateQueries({ queryKey: key(shopId) }) });
};
