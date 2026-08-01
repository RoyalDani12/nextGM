import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

export default function ProtectedRoute() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isInitializing = useAuthStore((state) => state.isInitializing);

    if (isInitializing) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-sm text-slate-500">Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}