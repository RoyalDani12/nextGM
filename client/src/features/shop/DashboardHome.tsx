import { useMyShop } from "./shop.hooks";
import CreateShopPage from "./CreateShopPage";
import ShopPendingPage from "./ShopPendingPage";

export default function DashboardHome() {
    const { data, isLoading } = useMyShop();

    if (isLoading) {
        return <div className="p-8 text-sm text-slate-500">Loading...</div>;
    }

    const shop = data?.data;

    if (!shop) return <CreateShopPage />;
    if (shop.status === "PENDING") return <ShopPendingPage />;

    return (
        <div className="p-8">
            <h1 className="text-xl font-semibold text-slate-900">Welcome back</h1>
            <p className="text-sm text-slate-500 mt-1">Shop status: {shop.status}</p>
        </div>
    );
}