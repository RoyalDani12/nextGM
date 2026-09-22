
import { api } from "@/lib/axios";

export const fetchMarketplaceProducts = async (searchQuery?: string) => {
  const { data } = await api.get("/products", {
    params: { 
      search: searchQuery && searchQuery.trim() !== "" ? searchQuery : undefined, 
      limit: 50 
    },
  });
  
  // Directly targets response.data.data.products based on your exact JSON payload
  return data?.data?.products || [];
};

export const fetchProductById = async (productId: string) => {
  const { data } = await api.get(`/products/${productId}`);
  return data?.data?.product || data?.data || data;
};