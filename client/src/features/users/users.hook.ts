import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { useNavigate } from "react-router-dom";
import { type UserProfile } from "../users/user.types";
import { 
    getMeRequest, 
    getUploadSignatureRequest, 
    updateProfileRequest, 
} from "./users.api";
import { useAuthStore } from "../../store/auth.store";
import type { 
    UpdateProfilePayload, 
} from "../users/user.types";


export const useGetMe = () => {
  return useQuery<UserProfile>({
    queryKey: ["users", "me"],
    queryFn: getMeRequest,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
};

export const useUploadSignature =()=>{
  return useMutation({
    mutationFn:getUploadSignatureRequest
  })
}
export const useUpdateProfile = () => {

  const queryClient = useQueryClient();

  const setAuth = useAuthStore((state) => state.setAuth);
  const currentToken = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfileRequest(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users", "me"] });
      
      const currentUser = queryClient.getQueryData(["users", "me"]) as any;
      if (currentUser && currentToken) {
        setAuth({ ...currentUser, ...variables }, currentToken);
      }
    },
  });
};







