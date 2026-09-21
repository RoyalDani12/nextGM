// store/useAuthStore.ts
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  setInitializing: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isInitializing: true,

      setAuth: (user, accessToken) => 
        set({ user, accessToken, isAuthenticated: true }),

      clearAuth: () => 
        set({ user: null, accessToken: null, isAuthenticated: false }),

      setInitializing: (value) => 
        set({ isInitializing: value })
    }),
    {
      name: "auth-storage", 
      // The access token is deliberately kept in memory. A new tab restores it
      // from the httpOnly refresh cookie, rather than trusting stale local data.
      partialize: (state) => ({ 
        user: state.user,
      }),
    }
  )
)
