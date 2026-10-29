import { api } from "@/lib/axios";

export interface SubmitReviewPayload {
    productId: string;
    rating: number;
    comment?: string;
}

export interface ProductReviewItem {
    id: string;
    userId: string;
    rating: number;
    comment?: string | null;
    createdAt: string;
    updatedAt: string;
    user?: {
        name: string;
    };
    reply?: {
        id: string;
        comment: string;
        createdAt: string;
        updatedAt: string;
    } | null;
}

export const submitProductReview = async (
    payload: SubmitReviewPayload
): Promise<ProductReviewItem> => {
    const { productId, rating, comment } = payload;
    const response = await api.post(`/products/${productId}/reviews`, {
        rating,
        comment: comment?.trim() || undefined,
    });
    return response.data.data;
};

export const getMyProductReview = async (
    productId: string
): Promise<ProductReviewItem | null> => {
    try {
        const response = await api.get(`/products/${productId}/reviews/my`);
        return response.data.data ?? null;
    } catch {
        return null;
    }
};
