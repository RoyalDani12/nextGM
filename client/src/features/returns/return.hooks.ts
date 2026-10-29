import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelReturnRequest,
  createReturnRequest,
  getCustomerReturnsRequest,
  updateReturnEvidenceRequest,
  getShopReturnsRequest,
  getShopReturnByIdRequest,
  updateShopReturnStatusRequest,
} from "./return.api";

export const useCustomerReturns = () =>
  useQuery({ queryKey: ["customer-returns"], queryFn: getCustomerReturnsRequest });

export const useCreateReturnRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReturnRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-returns"] });
      queryClient.invalidateQueries({ queryKey: ["customer-order"] });
    },
  });
};

export const useCancelReturnRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelReturnRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customer-returns"] }),
  });
};

export const useUpdateReturnEvidence = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ returnId, evidenceUrls }: { returnId: string; evidenceUrls: string[] }) =>
      updateReturnEvidenceRequest(returnId, evidenceUrls),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customer-returns"] }),
  });
};

export const useShopReturns = (shopId: string, params: { status?: string; search?: string; page?: number; limit?: number }) =>
  useQuery({
    queryKey: ["shop-returns", shopId, params],
    queryFn: () => getShopReturnsRequest(shopId, params),
    enabled: Boolean(shopId),
  });

export const useShopReturn = (shopId: string, returnId: string) =>
  useQuery({
    queryKey: ["shop-return", shopId, returnId],
    queryFn: () => getShopReturnByIdRequest(shopId, returnId),
    enabled: Boolean(shopId && returnId),
  });

export const useUpdateShopReturnStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateShopReturnStatusRequest,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shop-returns", variables.shopId] });
      queryClient.invalidateQueries({ queryKey: ["shop-return", variables.shopId, variables.returnId] });
      queryClient.invalidateQueries({ queryKey: ["customer-returns"] });
    },
  });
};
