import { create } from "zustand"

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "SHOP_OWNER" | "SHOP_EMPLOYEE" | "CUSTOMER" | string;
  avatarUrl?: string;
  profile?: { avatar?: string | null; phone?: string | null; address?: string | null; city?: string | null; country?: string | null };
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  setAuth: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
  setInitializing: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isInitializing: true,

      setAuth: (user, accessToken) => 
        set({ user, accessToken, isAuthenticated: true }),

      setAccessToken: (accessToken) => set({ accessToken }),

      clearAuth: () => 
        set({ user: null, accessToken: null, isAuthenticated: false }),

      setInitializing: (value) => 
        set({ isInitializing: value })
    }))