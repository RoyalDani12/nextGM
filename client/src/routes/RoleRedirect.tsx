import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { Spinner } from "@/components/ui/spinner";

export default function RoleRedirect() {
  const user = useAuthStore((state) => state.user);
  const isInitializing = useAuthStore((state) => state.isInitializing);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case "SUPER_ADMIN":
      return <Navigate to="/superadmin" replace />;

    case "SHOP_OWNER":
      return <Navigate to="/shops" replace />;
    case "SHOP_EMPLOYEE":
      return <Navigate to="/employee" replace />;
    case "CUSTOMER":
    default:
      // Everyone defaults to the storefront home
      return <Navigate to="/" replace />;
  }
}
