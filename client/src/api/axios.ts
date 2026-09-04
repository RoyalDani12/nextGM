import axios, {
    type AxiosError,
    type InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "../store/auth.store";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };
type QueuedRequest = {
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
};

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let isRefreshing = false;
let refreshQueue: QueuedRequest[] = [];

const isAuthEndpoint = (url?: string) =>
    url?.includes("/auth/login") ||
    url?.includes("/auth/register") ||
    url?.includes("/auth/refresh-token") ||
    url?.includes("/auth/verify-email");

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as RetryableRequest | undefined;
        if (!originalRequest) {
            return Promise.reject(error);
        }

        if (error.response?.status === 403 && !isAuthEndpoint(originalRequest.url)) {
            useAuthStore.getState().clearAuth();
            window.location.assign("/login");
            return Promise.reject(error);
        }

        if (
            error.response?.status !== 401 ||
            originalRequest._retry ||
            isAuthEndpoint(originalRequest.url)
        ) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                refreshQueue.push({
                    resolve: (token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(api(originalRequest));
                    },
                    reject,
                });
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const { data } = await api.post("/auth/refresh-token");
            const newToken: string = data.data.accessToken;
            useAuthStore.getState().setAccessToken(newToken);
            refreshQueue.forEach(({ resolve }) => resolve(newToken));
            refreshQueue = [];
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
        } catch (refreshError) {
            useAuthStore.getState().clearAuth();
            refreshQueue.forEach(({ reject }) => reject(refreshError));
            refreshQueue = [];
            window.location.assign("/login");
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    },
);
