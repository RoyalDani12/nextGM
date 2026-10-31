import { useEffect } from "react";
import { Navigate, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardNavbar } from "./DashboardNavbar";
import { useMyShops } from "./shop.hooks";

export function DashboardLayout() {
    const { shopId = "" } = useParams<{ shopId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { data: shopsResponse, isLoading, isError } = useMyShops();
    const shops = shopsResponse?.data ?? [];
    const hasShopAccess = shops.some((shop) => shop.id === shopId);

    useEffect(() => {
        if (!isLoading && !isError && shopId && !hasShopAccess) {
            navigate("/shops", { replace: true, state: { from: location.pathname } });
        }
    }, [hasShopAccess, isError, isLoading, location.pathname, navigate, shopId]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center text-sm font-medium bg-[#0B0F19]">
                <div className="flex items-center gap-3">
                    <span className="size-2.5 rounded-full bg-orange-500 animate-ping" />
                    <span className="text-slate-300 font-semibold text-xs tracking-wide">Loading store workspace...</span>
                </div>
            </div>
        );
    }

    if (isError || !hasShopAccess) {
        return <Navigate to="/shops" replace />;
    }

    return (
        <div className="seller-dashboard flex h-screen w-screen overflow-hidden bg-slate-50 font-sans antialiased">
            {/* Desktop Sidebar: docked to the left, full height from the very top */}
            <div className="hidden h-full shrink-0 border-r border-slate-800 bg-[#0F172A] lg:flex">
                <DashboardSidebar variant="desktop" />
            </div>

            {/* Right Content Area: Header at top + scrollable Main content */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <DashboardNavbar />
                <main className="min-w-0 flex-1 overflow-y-auto ds-scroll bg-slate-50/70">
                    <div className="p-4 md:p-6 lg:p-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
