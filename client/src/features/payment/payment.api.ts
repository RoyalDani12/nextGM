import { api } from "../../lib/axios";

export interface PaymentIntentResponse {
    clientSecret: string;
    paymentId: string;
}

export const createPaymentIntent = async (checkoutId: string): Promise<PaymentIntentResponse> => {
    const response = await api.post(`/payment/${checkoutId}/intent`);
    return response.data.data;
};
