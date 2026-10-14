export type ProductType = "PHYSICAL" | "DIGITAL";

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CreateProductPayload {
  name: string;
  description: string;
  basePrice: string;
  stock: number;
  type: ProductType;
  categoryId?: string;
  platformCategoryId?: string | null;
  images?: ProductImageInput[];
  sku?: string;
}

export interface CreateProductResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Product;
}

export interface ProductImageItem {
  id?: string;
  url: string;
  isPrimary?: boolean;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  stock: number;
  type: ProductType;
  categoryId?: string | null;
  platformCategoryId?: string | null;
  images: (string | ProductImageItem)[];
  sku?: string | null;
  status?: string;
  createdAt?: string;
  shopId?: string;
  variants?: any[];
}

export interface ProductPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ProductsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    products: any[];
    pagination: PaginationMeta;
  };
}

export interface FetchProductsParams {
  page?: number;
  limit?: number;
  search?: string;
}
export interface ProductImageInput {
  url: string;
  isPrimary?: boolean;
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  basePrice?: string;
  stock?: number;
  sku?: string;
  categoryId?: string | null;
  platformCategoryId?: string | null;
 images?: ProductImageInput[];
}

export interface UpdateProductResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Product;
}

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface UpdateProductStatusResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Product;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: string | number;
  stock: number;
  sku?: string | null;
  productId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVariantPayload {
  name: string;
  price: string;
  stock: number;
  sku?: string;
}

export interface CreateVariantResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ProductVariant;
}

export interface UpdateVariantPayload {
  name?: string;
  price?: string;
  stock?: number;
  sku?: string;
}

export interface UpdateVariantResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ProductVariant;
}
