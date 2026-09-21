import { api } from "../../lib/axios";
import type {
    LoginPayload,
    RegisterPayload,
    LoginResponse,
    RegisterResponse,
    DeactivatedResponse,
    ForgetPayload,
   resetPasswordPayload 
} from "./auth.types";



export const loginRequest = async (
    payload: LoginPayload,
): Promise<LoginResponse | DeactivatedResponse> => {
    const { data } = await api.post("/auth/login", payload);
    return data;
};



export const registerRequest = async (
    payload: RegisterPayload,
): Promise<RegisterResponse> => {
    const { data } = await api.post("/auth/register", payload);
    return data;
};



export const logoutRequest = async (): Promise<void> => {
    await api.post("/auth/logout");
};



export const refreshTokenRequest = async (): Promise<{ accessToken: string }> => {
    const { data } = await api.post("/auth/refresh-token");
    return data.data;
};

export const getMeRequest = async () => {
    const { data } = await api.get("/users/me");
    return data.data; // adjust based on your actual GET /users/me response shape
};


export const verifyEmailRequest = async(token:string)=>{
  const { data } = await api.get(`/auth/verify-email?token=${token}`)
  return data
}


export const forgetPasswordRequest = async (payload:ForgetPayload)=>{
    const { data } = await api.post('/auth/forgot-password',payload)
    return data
}

export const resetPasswordRequest = async (payload:resetPasswordPayload )=>{
    const { data } = await api.post('/auth/reset-password',payload)
    return data
}