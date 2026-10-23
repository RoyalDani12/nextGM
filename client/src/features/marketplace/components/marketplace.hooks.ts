import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import {
  addWishlistItem,
  deleteProductReview,
  fetchMarketplaceProducts,
  fetchProductById,
  fetchMarketplaceCategories,
  fetchProductReviews,
  fetchPromotedProducts,
  fetchWishlist,
  removeWishlistItem,
  saveProductReview,
  type MarketplaceFilters,
  type ProductReviewInput,
  type WishlistItem,
} from "../marketplace.api";

export const usePromotedProducts = () => useQuery({
  queryKey: ["marketplace-promotions"],
  queryFn: fetchPromotedProducts,
  staleTime: 1000 * 60,
});

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

export const useMarketplaceCategories = () =>
  useQuery({
    queryKey: ["marketplace-categories"],
    queryFn: fetchMarketplaceCategories,
    staleTime: 1000 * 60 * 10,
  });

export const useProductReviews = (productId?: string) =>
  useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: () => fetchProductReviews(productId!),
    enabled: Boolean(productId),
  });

export const useSaveProductReview = (productId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (review: ProductReviewInput) => saveProductReview(productId!, review),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-products"] });
      queryClient.invalidateQueries({ queryKey: ["product-detail", productId] });
    },
  });
};

export const useDeleteProductReview = (productId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => deleteProductReview(reviewId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] }),
  });
};

// ─── GUEST & AUTHENTICATED WISHLIST ──────────────────────────────────────────

const GUEST_WISHLIST_KEY = "guest_wishlist";

export const getGuestWishlist = (): WishlistItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const setGuestWishlist = (items: WishlistItem[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("guest_wishlist_updated"));
  } catch (e) {
    console.error("Failed to save guest wishlist", e);
  }
};

export const useWishlist = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    };
    window.addEventListener("guest_wishlist_updated", handleUpdate);
    return () => window.removeEventListener("guest_wishlist_updated", handleUpdate);
  }, [queryClient]);

  return useQuery({
    queryKey: ["wishlist", isAuthenticated],
    queryFn: async (): Promise<WishlistItem[]> => {
      if (!isAuthenticated) {
        return getGuestWishlist();
      }

      // If user is authenticated, sync any pending guest items to the backend database
      const guestItems = getGuestWishlist();
      if (guestItems.length > 0) {
        for (const g of guestItems) {
          try {
            await addWishlistItem(g.productId);
          } catch {
            // ignore if already added
          }
        }
        setGuestWishlist([]);
      }

      try {
        return await fetchWishlist();
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 30, // 30 seconds
  });
};

export const useWishlistToggle = () => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useMutation({
    mutationFn: async ({
      productId,
      saved,
      productData,
    }: {
      productId: string;
      saved: boolean;
      productData?: Partial<WishlistItem["product"]>;
    }) => {
      if (!isAuthenticated) {
        // Guest mode via localStorage
        const current = getGuestWishlist();
        if (saved) {
          const updated = current.filter((item) => item.productId !== productId);
          setGuestWishlist(updated);
        } else {
          const alreadyIn = current.some((item) => item.productId === productId);
          if (!alreadyIn) {
            const newItem: WishlistItem = {
              id: `guest_${productId}`,
              userId: "guest",
              productId,
              createdAt: new Date().toISOString(),
              product: {
                id: productId,
                name: productData?.name || "Product",
                slug: productData?.slug,
                sku: productData?.sku,
                basePrice: productData?.basePrice || 0,
                stock: productData?.stock ?? 10,
                status: productData?.status || "ACTIVE",
                type: productData?.type || "PHYSICAL",
                shop: productData?.shop || { id: "guest_shop", slug: "store", profile: { name: "Store" } },
                images: productData?.images || [],
              },
            };
            setGuestWishlist([newItem, ...current]);
          }
        }
        return { success: true };
      }

      // Authenticated mode via Backend
      if (saved) {
        return await removeWishlistItem(productId);
      } else {
        return await addWishlistItem(productId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
};

