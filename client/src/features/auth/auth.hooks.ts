import { useMutation,useQuery,useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { loginRequest, registerRequest, logoutRequest,verifyEmailRequest,forgetPasswordRequest, resetPasswordRequest } from "./auth.api";
import { useAuthStore } from "../../store/auth.store";
import { isDeactivatedResponse } from "./auth.types";
import type { LoginPayload, RegisterPayload,ForgetPayload,resetPasswordPayload  } from "./auth.types";

export const useLogin = () => {
    const setAuth = useAuthStore((state) => state.setAuth);
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (payload: LoginPayload) => loginRequest(payload),
        onSuccess: (response) => {
            if (isDeactivatedResponse(response)) {
                return; 
            }

            const { accessToken, user } = response.data; 
            setAuth(user, accessToken);
            queryClient.removeQueries({ queryKey: ["my-shops"] });
            navigate("/role-redirect");
        },
    });
};

export const useRegister = () => {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (payload: RegisterPayload) => registerRequest(payload),
        onSuccess: () => {
            navigate("/verify-email-notice");
        },
    });
};

export const useLogout = () => {
    const clearAuth = useAuthStore((state) => state.clearAuth);
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: logoutRequest,
        onSettled: () => {
            queryClient.clear();
            clearAuth();
            navigate("/login");
        },
    });
};


// Converted to useQuery to avoid duplicate fires on mount/StrictMode
export const useVerifyEmail = (token: string | null) => {
    return useQuery({
        queryKey: ["verifyEmail", token],
        queryFn: () => verifyEmailRequest(token!),
        enabled: !!token,
        retry: false,
        staleTime: Infinity,
    });
};


export const useForgotPassword = ()=>{
      return  useMutation({
        mutationFn:(email:ForgetPayload)=>forgetPasswordRequest(email),
        
      })
}


export const useResetPassword = ()=>{
    return useMutation({
        mutationFn:(payload:resetPasswordPayload )=>resetPasswordRequest(payload),

    })
}
