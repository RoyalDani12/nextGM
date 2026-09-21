export interface AddToCartPayload {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface AddToCartResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    id: string;
    productId: string;
    variantId?: string | null;
    quantity: number;
  };
}