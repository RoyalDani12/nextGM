export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
}

export type ShippingMethod = "STANDARD" | "EXPRESS" | "PICKUP";

export interface CheckoutPayload {
  shippingAddress: ShippingAddress;
  couponCodes?: Record<string, string>;
  shippingMethods?: Record<string, ShippingMethod>;
}

export interface CheckoutOrder {
  id: string;
  shopId: string;
  shopSlug: string;
  totalAmount: string;
  discountAmount?: string;
  shipping?: {
    method: ShippingMethod;
    fee: string;
    estimatedDeliveryStart: string;
    estimatedDeliveryEnd: string;
  };
  itemCount: number;
}

export interface CheckoutResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    checkoutId: string;
    orders: CheckoutOrder[];
    totalOrders: number;
    grandTotal: string;
  };
}
