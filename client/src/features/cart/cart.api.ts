// import { api } from "@/api/axios";
import { api } from "@/lib/axios";
import type {
  AddToCartPayload,
  AddToCartResponse,
} from "@/features/cart/cart.types";

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
  const { data } = await api.post("/cart/merge");

  return data;
};