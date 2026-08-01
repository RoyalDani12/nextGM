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
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
   (response) => response,
   async (error) => {
      const originalRequest = error.config;
              
       const isAuthEndpoint = originalRequest.url?.includes("/auth/login")
            || originalRequest.url?.includes("/auth/register");
      if (error.response?.status !== 401 || originalRequest._retry,isAuthEndpoint) {
         return Promise.reject(error);
      }

      if (isRefreshing) {
         return new Promise((resolve) => {
            refreshQueue.push((token: string) => {
               originalRequest.headers.Authorization = `Bearer ${token}`;
               resolve(api(originalRequest));
            });
         });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
         const { data } = await api.post("/auth/refresh-token");
         const newToken = data.data.accessToken;

         useAuthStore.getState().setAuth(useAuthStore.getState().user!, newToken);

         refreshQueue.forEach((cb) => cb(newToken));
         refreshQueue = [];

         originalRequest.headers.Authorization = `Bearer ${newToken}`;
         return api(originalRequest);
      } catch (refreshError) {
         useAuthStore.getState().clearAuth();
         refreshQueue = [];
         return Promise.reject(refreshError);
      } finally {
         isRefreshing = false;
      }
   },
);
