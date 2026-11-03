
import { api } from "@/lib/axios";
import type { CheckoutPayload, CheckoutResponse } from "@/features/order/order.types";

export const checkoutRequest = async (
  payload: CheckoutPayload,
): Promise<CheckoutResponse> => {
  const { data } = await api.post(
    "/orders/checkout",
    payload,
  );

  return data;
};

export const getCustomerOrdersRequest = async (page = 1, limit = 10) => {
  const { data } = await api.get("/orders", { params: { page, limit } });
  return data;
};

export const cancelCustomerOrderRequest = async (orderId: string) => {
  const { data } = await api.post(`/orders/${orderId}/cancel`);
  return data;
};

export const getCustomerOrderByIdRequest = async (orderId: string) => {
  const { data } = await api.get(`/orders/${orderId}`);
  return data;
};

export interface GetShopOrdersParams {
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const getShopOrdersRequest = async (
  shopId: string,
  params?: GetShopOrdersParams
) => {
  const { data } = await api.get(`/orders/${shopId}/orders`, { params });
  return data;
};

export const getShopOrderByIdRequest = async (
  shopId: string,
  orderId: string
) => {
  const { data } = await api.get(
    `/orders/${shopId}/orders/${orderId}`
  );

  return data;
};

export const updateShopOrderStatusRequest = async (
  shopId: string,
  orderId: string,
  status: string,
) => {
  const { data } = await api.patch(
    `/orders/${shopId}/orders/${orderId}/status`,
    {
      status,
    },
  );

  return data;
};

export const markShopOrderShippedRequest = async (
  shopId: string,
  orderId: string,
  shipment: {
    carrier: string;
    trackingNumber?: string;
    trackingUrl?: string;
    note?: string;
  },
) => {
  const { data } = await api.patch(
    `/orders/${shopId}/orders/${orderId}/shipment`,
    shipment,
  );
  return data;
};
