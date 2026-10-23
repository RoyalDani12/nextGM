export type ShopStatus =
  | "PENDING"
  | "ACTIVE"
  | "PAUSED"
  | "SUSPENDED"
  | "CLOSED";

export interface ShopProfile {
  name: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
  shippingPolicy: string | null;
  returnsPolicy: string | null;
}

export interface ShopLegalInfo {
  legalBusinessName: string;
  taxId: string;
  entityType: string;
}

export interface Shop {
  id: string;
  slug: string;
  status: ShopStatus;
  createdAt: string;
  profile: ShopProfile;
  legalInfo?: ShopLegalInfo | null;
}

export interface CreateShopPayload {
  name: string;
}

export interface CreateShopResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Pick<Shop, "id" | "slug" | "status" | "createdAt">;
}

export interface GetMyShopResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Shop[];
}
export interface UpdateShopProfilePayload {
  name?: string;
  description?: string;
  logo?: string;
  banner?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  shippingPolicy?: string;
  returnsPolicy?: string;
}

export interface UpdateShopLegalInfoPayload {
  legalBusinessName: string;
  taxId: string;
  entityType: string;
}

export type PublishReadinessChecks = {
  hasProfile: boolean;
  hasName: boolean;
  hasDescription: boolean;
  hasLogo: boolean;
  hasContactInfo: boolean;
  hasAddress: boolean;
  hasLegalInfo: boolean;
  hasAtLeastOneActiveProduct: boolean;
};

export interface PublishReadiness {
  shopStatus: ShopStatus;
  passed: boolean;
  checks: PublishReadinessChecks;
}
