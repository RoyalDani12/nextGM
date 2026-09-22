import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import { getPayoutStatus, generateOnboardingLink, withdrawFunds } from "../../api/payouts.api";
import { getPayoutStatus,generateOnboardingLink,withdrawFunds } from "./payouts.api";

export const usePayoutStatus = (shopId: string) => {
    return useQuery({
        queryKey: ["payoutStatus", shopId],
        queryFn: () => getPayoutStatus(shopId),
        enabled: !!shopId,
    });
};

export const useGenerateOnboardingLink = (shopId: string) => {
    return useMutation({
        mutationFn: () => generateOnboardingLink(shopId),
    });
};

export const useWithdrawFunds = (shopId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (amount: number) => withdrawFunds(shopId, amount),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payoutStatus", shopId] });
        },
    });
};
