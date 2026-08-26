
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
}

export interface Shop {
  id: string;
  slug: string;
  status: "PENDING" | "ACTIVE" | "PAUSED" | "SUSPENDED" | "CLOSED";
  createdAt: string;
 profile: ShopProfile;
}

export interface CreateShopPayload {
  name :string;
}

export interface CreateShopResponse {
  success:boolean;
  statusCode:number;
  message:string;
  data: Shop[];
}

export  interface GetMyShopResponse {
 success: boolean;
    statusCode: number;
    message: string;
    data: Shop[];
}
