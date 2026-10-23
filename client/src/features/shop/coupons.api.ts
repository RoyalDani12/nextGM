import { api } from "@/lib/axios";

export type CouponType = "PERCENTAGE" | "FIXED_AMOUNT";

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: string | number;
  minOrderAmount: string | number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  products?: Array<{ productId: string; product: { id: string; name: string; images?: Array<{ url: string }> } }>;
}

export interface CouponInput {
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number | null;
  maxUses?: number | null;
  expiresAt?: string | null;
  isActive?: boolean;
  productIds?: string[];
}

const base = (shopId: string) => `/shops/${shopId}/coupons`;

export const couponApi = {
  list: async (shopId: string): Promise<Coupon[]> => (await api.get(base(shopId))).data.data,
  create: async (shopId: string, input: CouponInput): Promise<Coupon> => (await api.post(base(shopId), input)).data.data,
  update: async (shopId: string, couponId: string, input: Partial<CouponInput>): Promise<Coupon> =>
    (await api.patch(`${base(shopId)}/${couponId}`, input)).data.data,
  remove: async (shopId: string, couponId: string) => api.delete(`${base(shopId)}/${couponId}`),
};
