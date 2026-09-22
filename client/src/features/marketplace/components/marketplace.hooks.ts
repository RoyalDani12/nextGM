import { useQuery } from "@tanstack/react-query";
// import { fetchMarketplaceProducts,fetchProductById } from "@/api/marketplace.api";
import { fetchMarketplaceProducts,fetchProductById } from "../marketplace.api";

export const useMarketplaceProducts = (searchQuery?: string) => {
  return useQuery({
    queryKey: ["marketplace-products", searchQuery],
    queryFn: () => fetchMarketplaceProducts(searchQuery),
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