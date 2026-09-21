import { api } from "@/api/axios"

import type { CreateShopPayload,CreateShopResponse,GetMyShopResponse,  UpdateShopProfilePayload } from "../features/shop/shop.types"

export const  createShopRequest = async (paylod:CreateShopPayload):Promise<CreateShopResponse>=>{
  const { data } = await api.post("/shops",paylod)
  return data 
}

export const getMyShopRequest = async (): Promise<GetMyShopResponse> => {
  const { data } = await api.get("/shops/mine");
  return data;
};

export const updateShopStatusRequest = async (
  shopId: string,
  status: "ACTIVE" | "PAUSED"
) => {
  const { data } = await api.patch(
    `/shops/status/${shopId}`,
    {
      status,
    }
  );

  return data;
};
export const updateShopProfileRequest = async (
  shopId: string,
  payload: UpdateShopProfilePayload
) => {
  const { data } = await api.put(
    `/shops/${shopId}/profile`,
    payload
  );

  return data;
};
export const closeShopRequest = async (
  shopId: string,
  confirmText: string
) => {
  const { data } = await api.delete(`/shops/${shopId}`, {
    data: {
      confirmText,
    },
  });

  return data;
};