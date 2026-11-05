import { useEffect, useRef } from "react";
import { AppRoutes } from "./routes/AppRoutes";
import { useAuthStore } from "./store/auth.store";
import { refreshTokenRequest, getMeRequest } from "./features/auth/auth.api";
import { Spinner } from "./components/ui/spinner";

function App() {
   const setAuth = useAuthStore((state) => state.setAuth);
   const clearAuth = useAuthStore((state) => state.clearAuth);
   const setInitializing = useAuthStore((state) => state.setInitializing);
   const isInitializing = useAuthStore((state) => state.isInitializing);

   // 1. Create a ref to track if we've already started restoring the session
   const hasAttemptedRestore = useRef(false);

   useEffect(() => {
      // 2. If we already tried, exit early to prevent StrictMode double-fires
      if (hasAttemptedRestore.current) return;
      hasAttemptedRestore.current = true;

      const restoreSession = async () => {
         try {
            // Use Promise.race with a 10s failsafe so UI never freezes indefinitely
            const restorePromise = (async () => {
               const { accessToken } = await refreshTokenRequest();
               useAuthStore.setState({ accessToken });
               const user = await getMeRequest();
               setAuth(user, accessToken);
            })();

            const timeoutPromise = new Promise((_, reject) =>
               setTimeout(() => reject(new Error("Session restore timeout")), 10000)
            );

            await Promise.race([restorePromise, timeoutPromise]);
         } catch {
            // A persisted profile is not proof of a valid server session.
            clearAuth();
         } finally {
            setInitializing(false);
         }
      };

      restoreSession();
   }, [setAuth, setInitializing]);

   if (isInitializing) {
      return (
        <div className="flex items-center justify-center min-h-screen w-full">
   <Spinner className="size-8 text-black" />
</div>
      );
   }

   return (
      <>
         <AppRoutes />
      </>
   );
}

export default App;
