import { useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { addToCartRequest,
        getCartRequest,
        clearCartRequest, 
        updateCartItemRequest,
         removeCartItemRequest,
         mergeCartRequest,
         } from "./cart.api";
import type { AddToCartPayload } from "./cart.types";
import { useAuthStore } from "@/store/auth.store";
import {
  clearGuestCart,
  getGuestCartResponse,
  removeGuestCartItem,
  updateGuestCartItem,
} from "./guest-cart";

export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddToCartPayload) => addToCartRequest(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cart"],
      });
    },
  });
};

export const useCart = () => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const refresh = () => queryClient.invalidateQueries({ queryKey: ["cart"] });
    window.addEventListener("guest_cart_updated", refresh);
    return () => window.removeEventListener("guest_cart_updated", refresh);
  }, [queryClient]);

  return useQuery({
    queryKey: ["cart"],
    queryFn: () => isAuthenticated ? getCartRequest() : Promise.resolve(getGuestCartResponse()),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useMutation({
    mutationFn: () => {
      if (!isAuthenticated) {
        clearGuestCart();
        return Promise.resolve();
      }
      return clearCartRequest();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cart"],
      });
    },
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useMutation({
    mutationFn: ({
      itemId,
      quantity,
    }: {
      itemId: string;
      quantity: number;
    }) => {
      if (!isAuthenticated) {
        updateGuestCartItem(itemId, quantity);
        return Promise.resolve();
      }
      return updateCartItemRequest(itemId, quantity);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cart"],
      });
    },
  });
};

export const useRemoveCartItem = () => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useMutation({
    mutationFn: (itemId: string) => {
      if (!isAuthenticated) {
        removeGuestCartItem(itemId);
        return Promise.resolve();
      }
      return removeCartItemRequest(itemId);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cart"],
      });
    },
  });
};

export const useMergeCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mergeCartRequest,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cart"],
      });
    },
  });
};