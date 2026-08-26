import { useEffect, useRef } from "react";
import { AppRoutes } from "./routes/AppRoutes";
import { useAuthStore } from "./store/auth.store";
import { refreshTokenRequest, getMeRequest } from "./api/auth.api";
import { Spinner } from "./components/ui/spinner";

function App() {
   const setAuth = useAuthStore((state) => state.setAuth);
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
            const { accessToken } = await refreshTokenRequest();
            useAuthStore.setState({ accessToken });
            const user = await getMeRequest();
            setAuth(user, accessToken);
         } catch {
            // Not logged in, which is fine
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
