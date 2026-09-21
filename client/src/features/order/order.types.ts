export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
}

export interface CheckoutPayload {
  shippingAddress: ShippingAddress;
}

export interface CheckoutOrder {
  id: string;
  shopId: string;
  shopSlug: string;
  totalAmount: string;
  itemCount: number;
}

export interface CheckoutResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    orders: CheckoutOrder[];
    totalOrders: number;
    grandTotal: string;
  };
}