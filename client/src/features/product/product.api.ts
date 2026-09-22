
import { api } from "@/lib/axios";
import type {
  CreateProductPayload,
  CreateProductResponse,
  // GetShopProductsResponse
  ProductsResponse,
  FetchProductsParams,
  UpdateProductPayload,
  UpdateProductResponse,
  UpdateProductStatusResponse,
   ProductStatus,
   UpdateVariantPayload,
   CreateVariantPayload,
   CreateVariantResponse,
   UpdateVariantResponse
} from "./product.types";

// export type ProductStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

export const createProductRequest = async (
  shopId: string,
  payload: CreateProductPayload
): Promise<CreateProductResponse> => {
  const { data } = await api.post(
    `/shops/${shopId}/products`,
    payload
  );

  return data;
};

export const getShopProductsRequest = async (
  shopId: string,
  params?: FetchProductsParams
): Promise<ProductsResponse> => {
  const { data } = await api.get(`/shops/${shopId}/products`, {
    params,
  });
  return data;
};

export const updateProductRequest = async (
  shopId: string,
  productId: string,
  payload: UpdateProductPayload
): Promise<UpdateProductResponse> => {
  const { data } = await api.put(
    `/shops/${shopId}/products/${productId}`,
    payload
  );
  return data;
};

export const deleteProductRequest = async (
  shopId: string,
  productId: string
) => {
  const { data } = await api.delete(
    `/shops/${shopId}/products/${productId}`
  );

  return data;
};

export const updateProductStatusRequest = async (
  shopId: string,
  productId: string,
  status: ProductStatus
): Promise<UpdateProductStatusResponse> => {
  const { data } = await api.patch(
    `/shops/${shopId}/products/${productId}/status`,
    { status }
  );

  return data;
};


export const createVariantRequest = async (
  shopId: string,
  productId: string,
  payload: CreateVariantPayload
): Promise<CreateVariantResponse> => {
  const { data } = await api.post<CreateVariantResponse>(
    `/shops/${shopId}/products/${productId}/variants`,
    payload
  );

  return data;
};

/**
 * Update a product variant
 */
export const updateVariantRequest = async (
  shopId: string,
  productId: string,
  variantId: string,
  payload: UpdateVariantPayload
): Promise<UpdateVariantResponse> => {
  const { data } = await api.put<UpdateVariantResponse>(
    `/shops/${shopId}/products/${productId}/variants/${variantId}`,
    payload
  );

  return data;
};

/**
 * Delete a product variant
 */
export const deleteVariantRequest = async (
  shopId: string,
  productId: string,
  variantId: string
) => {
  const { data } = await api.delete(
    `/shops/${shopId}/products/${productId}/variants/${variantId}`
  );

  return data;
};