
import { api } from "@/lib/axios";

export type MarketplaceFilters = { search?: string; shopId?: string; categorySlug?: string; categoryId?: string; type?: "PHYSICAL" | "DIGITAL"; minPrice?: string; maxPrice?: string; minRating?: number; inStockOnly?: boolean; verifiedShopsOnly?: boolean; sort?: "createdAt" | "basePrice" | "rating" | "name"; order?: "asc" | "desc" };
export type MarketplaceCategory = { id: string; name: string; slug: string; icon?: string | null; imageUrl?: string | null; description?: string | null; productCount: number; children: MarketplaceCategory[] };
export type MarketplaceBrowseResult = {
  products: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage?: boolean;
  };
  categoryBreadcrumb?: Array<{ id: string; name: string; slug: string }>;
};
export const fetchMarketplaceProducts = async (filters: MarketplaceFilters = {}, page = 1): Promise<MarketplaceBrowseResult> => {
  const { data } = await api.get("/products", {
    params: { ...filters, search: filters.search?.trim() || undefined, page, limit: 50 },
  });
  
  // Directly targets response.data.data.products based on your exact JSON payload
  return data?.data || { products: [], pagination: { total: 0, page, limit: 50, totalPages: 0 } };
};

export const fetchProductById = async (productId: string) => {
  const { data } = await api.get(`/products/${productId}`);
  return data?.data?.product || data?.data || data;
};
export type PromotedProduct = {
  coupon: { id: string; code: string; type: "PERCENTAGE" | "FIXED_AMOUNT"; value: number | string; minOrderAmount: number | string | null; expiresAt: string | null };
  product: { id: string; name: string; slug: string; basePrice: number | string; images: Array<{ url: string }>; shop: { slug: string; profile?: { name?: string } | null } };
};
export const fetchPromotedProducts = async (): Promise<PromotedProduct[]> => (await api.get("/products/promotions")).data.data || [];
export const fetchMarketplaceCategories = async (): Promise<MarketplaceCategory[]> => {
  const { data } = await api.get("/categories");
  return data?.data || [];
};
export const fetchStorefront = async (slug: string) => (await api.get(`/shops/${slug}`)).data.data;
export const fetchProductReviews = async (productId: string) => (await api.get(`/products/${productId}/reviews`)).data.data;
export type ProductReviewInput = { rating: number; comment?: string };
export const saveProductReview = async (productId: string, review: ProductReviewInput) => (await api.post(`/products/${productId}/reviews`, review)).data.data;
export const deleteProductReview = async (reviewId: string) => (await api.delete(`/reviews/${reviewId}`)).data;
export type WishlistItem = {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug?: string;
    sku?: string | null;
    basePrice: number | string;
    stock: number;
    status?: string;
    type?: string;
    shop?: {
      id: string;
      slug: string;
      profile?: { name: string; logo?: string | null } | null;
    };
    images: { id?: string; url: string; isPrimary?: boolean }[];
  };
};

export const addWishlistItem = async (productId: string) => (await api.post(`/wishlist/${productId}`)).data.data;
export const removeWishlistItem = async (productId: string) => (await api.delete(`/wishlist/${productId}`)).data;
export const fetchWishlist = async (): Promise<WishlistItem[]> => (await api.get("/wishlist")).data.data;
