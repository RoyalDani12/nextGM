import axios from "axios";
import { useAuthStore } from "../store/auth.store";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let isRefreshing = false;
// FIX 1: Queue must hold both resolve and reject
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = [];

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (!originalRequest) return Promise.reject(error);
              
        const isAuthEndpoint = originalRequest.url?.includes("/auth/login")
            || originalRequest.url?.includes("/auth/register")
            || originalRequest.url?.includes("/auth/refresh-token")
            || originalRequest.url?.includes("/auth/verify-email")
            || originalRequest.url?.includes("/auth/logout")
            || originalRequest.url?.includes("/auth/forgot-password")
            || originalRequest.url?.includes("/auth/reset-password")
            || originalRequest.url?.includes("/auth/reactivate")
            || originalRequest.url?.includes("/auth/resend-verification");

        if (error.response?.status !== 401 || originalRequest._retry || isAuthEndpoint) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                // FIX 3: Push both resolve and reject to the queue
                refreshQueue.push({
                    resolve: (token: string) => {
                        originalRequest.headers = originalRequest.headers ?? {};
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(api(originalRequest));
                    },
                    reject: (err: any) => reject(err)
                });
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const { data } = await api.post("/auth/refresh-token");
            const newToken = data.data.accessToken;

            useAuthStore.getState().setAuth(useAuthStore.getState().user!, newToken);

            // Resolve all queued requests
            refreshQueue.forEach((prom) => prom.resolve(newToken));
            refreshQueue = [];

            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
        } catch (refreshError) {
            useAuthStore.getState().clearAuth();
            
            // FIX 4: Explicitly reject hanging promises so the app doesn't freeze
            refreshQueue.forEach((prom) => prom.reject(refreshError));
            refreshQueue = [];
            
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);
