import { useEffect } from "react";
import { Navigate, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardNavbar } from "./DashboardNavbar";
import { useMyShops } from "./shop.hooks";
import { ShopUnderReview } from "./components/ShopUnderReview";

export function DashboardLayout() {
    const { shopId = "" } = useParams<{ shopId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { data: shopsResponse, isLoading, isFetching, isError, refetch, isRefetching } = useMyShops();
    const shops = shopsResponse?.data ?? [];
    const currentShop = shops.find((shop) => shop.id === shopId);
    const hasShopAccess = !!currentShop;

    useEffect(() => {
        if (!isLoading && !isFetching && !isError && shopId && !hasShopAccess) {
            navigate("/shops", { replace: true, state: { from: location.pathname } });
        }
    }, [hasShopAccess, isError, isFetching, isLoading, location.pathname, navigate, shopId]);

    if (isLoading || (!hasShopAccess && isFetching)) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
                <div className="flex items-center gap-2 text-xs">
                    <Loader2 className="size-4 animate-spin text-orange-500" />
                    <span>Loading workspace…</span>
                </div>
            </div>
        );
    }

    if (isError || !hasShopAccess || !currentShop) {
        return <Navigate to="/shops" replace />;
    }

    // If shop is pending review or rejected by admin, display the dedicated review status workspace
    if (currentShop.status?.toUpperCase() === "PENDING" || currentShop.status?.toUpperCase() === "REJECTED") {
        return (
            <div className="min-h-screen bg-slate-50 font-sans antialiased flex flex-col">
                <DashboardNavbar />
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    <ShopUnderReview shop={currentShop} onRefresh={refetch} isRefreshing={isRefetching} />
                </main>
            </div>
        );
    }

    return (
        <div className="seller-dashboard flex h-screen w-screen overflow-hidden bg-slate-50 font-sans antialiased">
            {/* Desktop Sidebar: docked to the left, full height from the very top */}
            <div className="hidden h-full shrink-0 border-r border-slate-800 bg-[#533257] lg:flex">
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
