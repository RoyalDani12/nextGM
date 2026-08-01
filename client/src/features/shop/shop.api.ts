import { api } from "@/api/axios"

import type { CreateShopPayload,CreateShopResponse,GetMyShopResponse } from "./shop.types"

export const  createShopRequest = async (paylod:CreateShopPayload):Promise<CreateShopResponse>=>{
  const { data } = await api.post("/shops",paylod)
  return data 
}

export const getMyShopRequest = async (): Promise<GetMyShopResponse>=>{
  const { data } = await api.get("/shops/me")
  return data 
}