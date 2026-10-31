import { api } from "../../../lib/axios";

export interface WalletTransactionItem {
    id: string;
    shopId: string;
    type: "CREDIT" | "DEBIT";
    amount: number;
    balanceAfter: number;
    note: string | null;
    createdAt: string;
    orderId?: string | null;
}

export interface PayoutStatus {
    balance: number;
    totalWithdrawn?: number;
    totalEarned?: number;
    stripeAccountId: string | null;
    payoutsEnabled: boolean;
    transactions?: WalletTransactionItem[];
}

export const getPayoutStatus = async (shopId: string): Promise<PayoutStatus> => {
    const response = await api.get(`/payouts/${shopId}/status`);
    return response.data.data;
};

export const generateOnboardingLink = async (shopId: string): Promise<{ url: string }> => {
    const response = await api.post(`/payouts/${shopId}/onboard`);
    return response.data.data;
};

export const withdrawFunds = async (shopId: string, amount: number): Promise<{ newBalance: string | number }> => {
    const response = await api.post(`/payouts/${shopId}/withdraw`, { amount });
    return response.data.data;
};
