
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

export const getCustomerOrdersRequest = async () => {
  const { data } = await api.get("/orders");
  return data;
};

export const getCustomerOrderByIdRequest = async (orderId: string) => {
  const { data } = await api.get(`/orders/${orderId}`);
  return data;
};

export const getShopOrdersRequest = async (shopId:string)=>{
  const { data } = await api.get(`/orders/${shopId}/orders`)
  return data
}

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
