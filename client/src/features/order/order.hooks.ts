import { useMutation, useQueryClient } from "@tanstack/react-query";
import { checkoutRequest } from "@/api/order.api";
import type { CheckoutPayload } from "./order.types";

export const useCheckout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CheckoutPayload) =>
      checkoutRequest(payload),

    onSuccess: () => {
      // Cart was cleared by the backend after successful checkout.
      queryClient.invalidateQueries({
        queryKey: ["cart"],
      });

      queryClient.invalidateQueries({
        queryKey: ["orders"],
      });
    },
  });
};

