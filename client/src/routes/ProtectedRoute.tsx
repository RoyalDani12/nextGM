import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { Spinner } from "@/components/ui/spinner";

type Role = "SUPER_ADMIN" | "SHOP_OWNER" | "SHOP_EMPLOYEE" | "CUSTOMER";
interface ProtectedRouteProps {
   allowedRoles?: Role[];
}
export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
   const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
   const isInitializing = useAuthStore((state) => state.isInitializing);
   const location = useLocation();

   const user = useAuthStore((state) => state.user);

   if (isInitializing) {
      return (
         <div className="flex items-center justify-center min-h-screen">
            <Spinner className="size-8" />
         </div>
      );
   }

   if (!isAuthenticated) {
      return <Navigate to="/login" state={{ from: location }} replace />;
   }

   if( allowedRoles && user?.role && !allowedRoles.includes(user.role as Role)) {
     return <Navigate to="/" replace/>
   }

   return <Outlet />;
}
