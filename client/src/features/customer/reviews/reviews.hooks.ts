import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    submitProductReview,
    getMyProductReview,
    type SubmitReviewPayload,
} from "./reviews.api";

export const useSubmitProductReview = (productId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: Omit<SubmitReviewPayload, "productId">) =>
            submitProductReview({ productId, ...payload }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["my-review", productId] });
            queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
            queryClient.invalidateQueries({ queryKey: ["customer-order"] });
        },
    });
};

export const useMyProductReview = (productId: string, enabled = true) => {
    return useQuery({
        queryKey: ["my-review", productId],
        queryFn: () => getMyProductReview(productId),
        enabled: Boolean(productId) && enabled,
        staleTime: 1000 * 60 * 5,
    });
};
