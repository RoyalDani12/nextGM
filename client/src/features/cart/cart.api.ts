// import { api } from "@/api/axios";
import { api } from "@/lib/axios";
import type {
  AddToCartPayload,
  AddToCartResponse,
} from "@/features/cart/cart.types";
import { getGuestCartItems } from "./guest-cart";

export const addToCartRequest = async (
  payload: AddToCartPayload
): Promise<AddToCartResponse> => {
  const { data } = await api.post("/cart/items", payload);

  return data;
};

export const getCartRequest = async () => {
  const { data } = await api.get("/cart/view-cart-items");
  return data;
};

export const clearCartRequest = async () => {
  const { data } = await api.delete("/cart/clear");

  return data;
}

export const updateCartItemRequest = async (
  itemId: string,
  quantity: number
) => {
  const { data } = await api.patch(
    `/cart/items/${itemId}`,
    { quantity }
  );

  return data;
};

export const removeCartItemRequest = async (
  itemId: string
) => {
  const { data } = await api.delete(
    `/cart/items/${itemId}`
  );

  return data;
};

export const mergeCartRequest = async () => {
  const { data } = await api.post("/cart/merge", {
    items: getGuestCartItems().map(({ productId, variantId, quantity }) => ({
      productId,
      variantId,
      quantity,
    })),
  });

  return data;
};

export interface ValidateCouponPayload {
  code: string;
  shopIds?: string[];
  subtotal?: number;
  items?: Array<{
    productId: string;
    variantId?: string | null;
    quantity: number;
    price: number;
    shopId?: string;
  }>;
}

export const validateCartCouponRequest = async (payload: ValidateCouponPayload) => {
  const { data } = await api.post("/cart/validate-coupon", payload);
  return data;
};