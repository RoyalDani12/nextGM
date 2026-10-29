import { api } from "@/lib/axios";
import type { ReturnReason, ReturnResolution, ReturnRequest, ShopReturnRequest, ShopReturnsResponse } from "./return.types";

export const createReturnRequest = async (payload: {
  orderId: string;
  reason: ReturnReason;
  resolution: ReturnResolution;
  customerNote?: string;
  items: Array<{ orderItemId: string; quantity: number }>;
}) => {
  const { data } = await api.post<{ data: ReturnRequest }>("/returns", payload);
  return data.data;
};

export const getCustomerReturnsRequest = async () => {
  const { data } = await api.get<{ data: ReturnRequest[] }>("/returns");
  return data.data;
};

export const cancelReturnRequest = async (returnId: string) => {
  const { data } = await api.post<{ data: ReturnRequest }>(`/returns/${returnId}/cancel`);
  return data.data;
};

export const updateReturnEvidenceRequest = async (returnId: string, evidenceUrls: string[]) => {
  const { data } = await api.patch<{ data: ReturnRequest }>(`/returns/${returnId}/evidence`, { evidenceUrls });
  return data.data;
};

export const getShopReturnsRequest = async (shopId: string, params: { status?: string; search?: string; page?: number; limit?: number }) => {
  const { data } = await api.get<{ data: ShopReturnsResponse }>(`/shops/${shopId}/returns`, { params });
  return data;
};

export const getShopReturnByIdRequest = async (shopId: string, returnId: string) => {
  const { data } = await api.get<{ data: ShopReturnRequest }>(`/shops/${shopId}/returns/${returnId}`);
  return data;
};

export const updateShopReturnStatusRequest = async (variables: {
  shopId: string;
  returnId: string;
  status: string;
  note?: string;
}) => {
  const { data } = await api.patch(`/shops/${variables.shopId}/returns/${variables.returnId}/status`, {
    status: variables.status,
    note: variables.note,
  });
  return data;
};
