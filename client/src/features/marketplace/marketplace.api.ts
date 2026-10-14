
import { api } from "@/lib/axios";

export type MarketplaceFilters = { search?: string; categorySlug?: string; categoryId?: string; type?: "PHYSICAL" | "DIGITAL"; minPrice?: string; maxPrice?: string; minRating?: number; inStockOnly?: boolean; verifiedShopsOnly?: boolean; sort?: "createdAt" | "basePrice" | "rating" | "name"; order?: "asc" | "desc" };
export type MarketplaceCategory = { id: string; name: string; slug: string; icon?: string | null; imageUrl?: string | null; description?: string | null; productCount: number; children: MarketplaceCategory[] };
export type MarketplaceBrowseResult = { products: any[]; pagination: { total: number; page: number; limit: number; totalPages: number }; categoryBreadcrumb?: Array<{ id: string; name: string; slug: string }> };
export const fetchMarketplaceProducts = async (filters: MarketplaceFilters = {}): Promise<MarketplaceBrowseResult> => {
  const { data } = await api.get("/products", {
    params: { ...filters, search: filters.search?.trim() || undefined, limit: 50 },
  });
  
  // Directly targets response.data.data.products based on your exact JSON payload
  return data?.data || { products: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } };
};

export const fetchProductById = async (productId: string) => {
  const { data } = await api.get(`/products/${productId}`);
  return data?.data?.product || data?.data || data;
};
export const fetchMarketplaceCategories = async (): Promise<MarketplaceCategory[]> => {
  const { data } = await api.get("/categories");
  return data?.data || [];
};
