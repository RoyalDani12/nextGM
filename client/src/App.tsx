import { useEffect } from "react";
import { AppRoutes } from "./routes/AppRoutes";
import { PublicNavbar } from "./components/layout/marketplace/PublicNavbar";
import { useAuthStore } from "./store/auth.store";
import { refreshTokenRequest, getMeRequest } from "./api/auth.api";

function App() {
    const setAuth = useAuthStore((state) => state.setAuth);
    const setInitializing = useAuthStore((state) => state.setInitializing);

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const { accessToken } = await refreshTokenRequest();

                useAuthStore.setState({ accessToken });

                const user = await getMeRequest();
                setAuth(user, accessToken);
            } catch {
                // no valid refresh cookie — user isn't logged in, that's fine
            } finally {
                setInitializing(false);
            }
        };

        restoreSession();
    }, [setAuth, setInitializing]);

    return (
        <>
            <PublicNavbar />
            <AppRoutes />
        </>
    );
}

export default App;