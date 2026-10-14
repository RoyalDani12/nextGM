import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { useNavigate } from "react-router-dom";
import { type UserProfile } from "../users/user.types";
import { 
    getMeRequest, 
    getUploadSignatureRequest, 
    updateProfileRequest, 
    getSessionsRequest,
    revokeSessionRequest,
    revokeOtherSessionsRequest,
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
    onSuccess: (response) => {
      const updatedUser = response.data;
      queryClient.setQueryData(["users", "me"], updatedUser);
      if (updatedUser && currentToken) {
        setAuth(updatedUser, currentToken);
      }
    },
  });
};

export const useSessions = () => useQuery({
  queryKey: ["users", "sessions"],
  queryFn: getSessionsRequest,
});

export const useRevokeSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeSessionRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users", "sessions"] }),
  });
};

export const useRevokeOtherSessions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeOtherSessionsRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users", "sessions"] }),
  });
};







