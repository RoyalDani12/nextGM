import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { Spinner } from "@/components/ui/spinner";

type Role = "SUPER_ADMIN" | "SHOP_OWNER" | "SHOP_EMPLOYEE" | "CUSTOMER";
interface ProtectedRouteProps {
   allowedRoles?: Role[];
}
export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
   const isAuthenticated = useAuthStore((state) => (
      state.isAuthenticated && Boolean(state.accessToken && state.user)
   ));
   const isInitializing = useAuthStore((state) => state.isInitializing);

   const user = useAuthStore((state) => state.user);

   if (isInitializing) {
      return (
         <div className="flex items-center justify-center min-h-screen">
            <Spinner className="size-8" />
         </div>
      );
   }

   if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
   }

   if (allowedRoles && (!user || !allowedRoles.includes(user.role as Role))) {
     return <Navigate to="/" replace/>
   }

   return <Outlet />;
}
