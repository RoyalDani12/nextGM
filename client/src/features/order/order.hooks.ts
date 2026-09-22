import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CheckoutPayload } from "./order.types";
import { checkoutRequest } from "./order.api";

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

