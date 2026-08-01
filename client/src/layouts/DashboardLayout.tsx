import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingBag, Settings } from "lucide-react";

const navItems = [
    { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
    { label: "Products", path: "/dashboard/products", icon: Package },
    { label: "Orders", path: "/dashboard/orders", icon: ShoppingBag },
    { label: "Settings", path: "/dashboard/settings", icon: Settings },
];

export function DashboardLayout() {
    const location = useLocation();

    return (
        <div className="min-h-screen flex bg-slate-50">
            <aside className="w-60 shrink-0 border-r border-slate-200 bg-white flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-slate-200">
                    <span className="font-bold text-slate-900">Nexions</span>
                    <span className="ml-2 text-xs text-slate-400">Seller</span>
                </div>
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map(({ label, path, icon: Icon }) => {
                        const active = location.pathname === path;
                        return (
                            <Link
                                key={path}
                                to={path}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    active
                                        ? "bg-indigo-50 text-indigo-700"
                                        : "text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                <Icon className="size-4" />
                                {label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            <div className="flex-1 min-w-0">
                <Outlet />
            </div>
        </div>
    );
}