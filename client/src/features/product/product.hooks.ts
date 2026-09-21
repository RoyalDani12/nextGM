import { useMutation, useQueryClient,useQuery } from "@tanstack/react-query";
import { createProductRequest ,
  getShopProductsRequest,
  updateProductRequest,
  deleteProductRequest,
  updateProductStatusRequest,
  createVariantRequest,
  updateVariantRequest,
  deleteVariantRequest,
} from "./product.api";
import type { 
  CreateProductPayload,
  FetchProductsParams ,
  UpdateProductPayload,
  // UpdateProductResponse,
  // UpdateProductStatusResponse,
  ProductStatus,
  CreateVariantPayload,
  UpdateVariantPayload
} from "./product.types";

export const useCreateProduct = (shopId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProductPayload) =>
      createProductRequest(shopId, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["shop-products", shopId],
      });
    },
  });
};
export const useShopProducts = (
  shopId: string,
  params?: FetchProductsParams
) => {
  return useQuery({
    queryKey: ["shop-products", shopId, params],
    queryFn: () => getShopProductsRequest(shopId, params),
    enabled: !!shopId,
    retry: false,
  });
};


export const useUpdateProduct = (shopId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: string;
      payload: UpdateProductPayload;
    }) => updateProductRequest(shopId, productId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-products", shopId] });
    },
  });
};

export const useDeleteProduct = (shopId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) =>
      deleteProductRequest(shopId, productId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["shop-products", shopId],
      });
    },
  });
};


export const useUpdateProductStatus = (shopId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      status,
    }: {
      productId: string;
      status: ProductStatus;
    }) =>
      updateProductStatusRequest(shopId, productId, status),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["shop-products", shopId],
      });
    },
  });
};

export const useCreateVariant = (
  shopId: string,
  productId: string
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateVariantPayload) =>
      createVariantRequest(shopId, productId, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["shop-products", shopId],
      });
    },
  });
};

/**
 * Update Variant
 */
export const useUpdateVariant = (
  shopId: string,
  productId: string
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      variantId,
      payload,
    }: {
      variantId: string;
      payload: UpdateVariantPayload;
    }) =>
      updateVariantRequest(
        shopId,
        productId,
        variantId,
        payload
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["shop-products", shopId],
      });
    },
  });
};

/**
 * Delete Variant
 */
export const useDeleteVariant = (
  shopId: string,
  productId: string
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variantId: string) =>
      deleteVariantRequest(
        shopId,
        productId,
        variantId
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["shop-products", shopId],
      });
    },
  });
};