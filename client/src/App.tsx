import { useEffect, useRef } from "react";
import { AppRoutes } from "./routes/AppRoutes";
import { useAuthStore } from "./store/auth.store";
import { refreshTokenRequest, getMeRequest } from "./features/auth/auth.api";

function App() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setInitializing = useAuthStore((state) => state.setInitializing);

  const hasAttemptedRestore = useRef(false);

  useEffect(() => {
    if (hasAttemptedRestore.current) return;
    hasAttemptedRestore.current = true;

    const restoreSession = async () => {
      const persistedUser = useAuthStore.getState().user;

      // If user was never logged in (no persisted profile), unlock auth state immediately
      if (!persistedUser) {
        setInitializing(false);
        return;
      }

      try {
        // Non-blocking 3.5s timeout: if Render backend is sleeping or slow, fail softly
        const restorePromise = (async () => {
          const { accessToken } = await refreshTokenRequest();
          useAuthStore.setState({ accessToken });
          const user = await getMeRequest();
          setAuth(user, accessToken);
        })();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Session restore timeout")), 3500)
        );

        await Promise.race([restorePromise, timeoutPromise]);
      } catch {
        clearAuth();
      } finally {
        setInitializing(false);
      }
    };

    restoreSession();
  }, [setAuth, clearAuth, setInitializing]);

  // Public pages render instantly (0ms delay).
  // Protected routes (/dashboard, /superadmin, /checkout) independently guard their own auth state.
  return <AppRoutes />;
}

export default App;
