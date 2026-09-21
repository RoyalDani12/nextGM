import { useQuery } from "@tanstack/react-query";
import { getCustomerOrderByIdRequest,getCustomerOrdersRequest } from "@/api/order.api";


export const useCustomerOrder =()=>{
  return useQuery({
    queryKey:["customer-order"],
    queryFn:getCustomerOrdersRequest
  })
}


export const useCustomerOrderId =(orderId:string)=>{
  return useQuery ({
    queryKey:["customer-order",orderId],
    queryFn:()=> getCustomerOrderByIdRequest(orderId)
  })
}