export type ReturnReason =
  | "DAMAGED"
  | "WRONG_ITEM"
  | "MISSING_ITEM"
  | "NOT_AS_DESCRIBED"
  | "QUALITY_ISSUE"
  | "CHANGED_MIND"
  | "OTHER";

export type ReturnResolution = "REFUND" | "REPLACEMENT";

export interface ReturnRequest {
  id: string;
  orderId: string;
  status: string;
  reason: ReturnReason;
  resolution: ReturnResolution;
  customerNote?: string | null;
  evidenceUrls: string[];
  createdAt: string;
  items: Array<{
    id: string;
    quantity: number;
    orderItem: {
      id: string;
      quantity: number;
      unitPrice: number | string;
      product: { name: string; images: Array<{ url: string }> };
      variant?: { name: string } | null;
    };
  }>;
  statusHistory: Array<{ status: string; note?: string | null; createdAt: string }>;
}

export interface ShopReturnRequest extends ReturnRequest {
  order: {
    customer?: { name?: string | null; email?: string | null } | null;
  };
}

export interface ShopReturnsResponse {
  returns: ShopReturnRequest[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  statusCounts: Record<string, number>;
}
