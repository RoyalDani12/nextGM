
import { api } from "@/lib/axios"
import type { CreateShopPayload,CreateShopResponse,GetMyShopResponse, PublishReadiness, UpdateShopProfilePayload, UpdateShopLegalInfoPayload } from "./shop.types"

export const  createShopRequest = async (paylod:CreateShopPayload):Promise<CreateShopResponse>=>{
  const { data } = await api.post("/shops",paylod)
  return data 
}

export const getMyShopRequest = async (): Promise<GetMyShopResponse> => {
  const { data } = await api.get("/shops/mine");
  return data;
};

export const updateShopStatusRequest = async (
  shopId: string,
  status: "ACTIVE" | "PAUSED"
) => {
  const { data } = await api.patch(
    `/shops/status/${shopId}`,
    {
      status,
    }
  );

  return data;
};
export const updateShopProfileRequest = async (
  shopId: string,
  payload: UpdateShopProfilePayload
) => {
  const { data } = await api.put(
    `/shops/${shopId}/profile`,
    payload
  );

  return data;
};
export const closeShopRequest = async (
  shopId: string,
  confirmText: string
) => {
  const { data } = await api.delete(`/shops/${shopId}`, {
    data: {
      confirmText,
    },
  });

  return data;
};

export const getPublishReadinessRequest = async (shopId: string): Promise<PublishReadiness> => {
  const { data } = await api.get(`/shops/${shopId}/publish-readiness`);
  return data.data;
};

export const publishShopRequest = async (shopId: string) => {
  const { data } = await api.patch(`/shops/${shopId}/publish`);
  return data.data;
};

export const updateShopLegalInfoRequest = async (
  shopId: string,
  payload: UpdateShopLegalInfoPayload
) => {
  const { data } = await api.put(`/shops/${shopId}/legal-info`, payload);
  return data;
};

export type ShopReview = {
  id: string;
  shopId: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string | null;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    images: { url: string }[];
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  reply: {
    id: string;
    comment: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type ShopReviewsResponse = {
  reviews: ShopReview[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: {
    totalCount: number;
    averageRating: number;
    repliedCount: number;
    unrepliedCount: number;
    ratingDistribution: Record<number, number>;
  };
};

export type ShopReviewsFilters = {
  rating?: string;
  replyStatus?: "all" | "replied" | "unreplied";
  search?: string;
  page?: number;
  limit?: number;
};

export const getShopReviewsRequest = async (
  shopId: string,
  params?: ShopReviewsFilters
): Promise<ShopReviewsResponse> => {
  const { data } = await api.get(`/shops/${shopId}/reviews`, { params });
  return data.data;
};

export const replyShopReviewRequest = async (
  reviewId: string,
  comment: string
) => {
  const { data } = await api.post(`/reviews/${reviewId}/reply`, { comment });
  return data.data;
};

export const deleteShopReviewReplyRequest = async (reviewId: string) => {
  const { data } = await api.delete(`/reviews/${reviewId}/reply`);
  return data;
};

