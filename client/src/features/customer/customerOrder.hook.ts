import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelCustomerOrderRequest,
  getCustomerOrderByIdRequest,
  getCustomerOrdersRequest,
} from "../order/order.api";


export const useCustomerOrder =()=>{
  return useInfiniteQuery({
    queryKey:["customer-orders"],
    queryFn:({ pageParam }) => getCustomerOrdersRequest(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.data?.pagination;
      return pagination?.hasNextPage ? pagination.page + 1 : undefined;
    },
  })
}


export const useCustomerOrderId =(orderId:string)=>{
  return useQuery ({
    queryKey:["customer-order",orderId],
    queryFn:()=> getCustomerOrderByIdRequest(orderId)
  })
}

export const useCancelCustomerOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelCustomerOrderRequest,
    onSuccess: (_data, orderId) => {
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      queryClient.invalidateQueries({ queryKey: ["customer-order", orderId] });
    },
  });
};