import { useQuery } from "@tanstack/react-query";
// import { fetchMarketplaceProducts,fetchProductById } from "@/api/marketplace.api";
import { fetchMarketplaceProducts, fetchProductById, fetchMarketplaceCategories, type MarketplaceFilters } from "../marketplace.api";

export const useMarketplaceProducts = (filters: MarketplaceFilters | string = {}) => {
  const normalized = typeof filters === "string" ? { search: filters } : filters;
  return useQuery({
    queryKey: ["marketplace-products", normalized],
    queryFn: () => fetchMarketplaceProducts(normalized),
    staleTime: 1000 * 60 * 2, // 2 minutes cache
  });
};




export const useProductDetails = (productId?: string) => {
  return useQuery({
    queryKey: ["product-detail", productId],
    queryFn: () => fetchProductById(productId!),
    enabled: !!productId,
    staleTime: 1000 * 60 * 2, // 2 minutes cache
  });
};

export const useMarketplaceCategories = () => useQuery({ queryKey: ["marketplace-categories"], queryFn: fetchMarketplaceCategories, staleTime: 1000 * 60 * 10 });
