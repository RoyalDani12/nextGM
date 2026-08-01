export interface Shop {
  id:string;
  slug:string;
  status:"PENDING" | "ACTIVE" | "PAUSED" | "SUSPENDED" | " CLOSED";
  createdAt:string;
}

export interface CreateShopPayload {
  name :string;
}

export interface CreateShopResponse {
  success:boolean;
  statusCode:number;
  message:string;
  data:Shop;
}

export  interface GetMyShopResponse {
 success: boolean;
    statusCode: number;
    message: string;
    data: Shop | null;
}
