import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { loginRequest, registerRequest, logoutRequest } from "../../api/auth.api";
import { useAuthStore } from "../../store/auth.store";
import { isDeactivatedResponse } from "./auth.types";
import type { LoginPayload, RegisterPayload } from "./auth.types";

export const useLogin = () => {
    const setAuth = useAuthStore((state) => state.setAuth);
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (payload: LoginPayload) => loginRequest(payload),
        onSuccess: (response) => {
            if (isDeactivatedResponse(response)) {
                return; // component reads mutation.data, shows reactivation UI
            }

            const { accessToken, user } = response.data; // now correctly typed as LoginResponse
            setAuth(user, accessToken);
            navigate("/dashboard");
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
    const navigate = useNavigate();

    return useMutation({
        mutationFn: logoutRequest,
        onSuccess: () => {
            clearAuth();
            navigate("/login");
        },
    });
};