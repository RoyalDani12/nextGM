import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
    Home,
    Package,
    ShoppingBag,
    BarChart3,
    Wallet,
    Settings,
    Globe,
    Percent,
    PanelLeft,
    Store,
} from "lucide-react";

const PIN_STORAGE_KEY = "dashboard-sidebar-pinned";

interface SidebarProps {
    onNavItemClick?: () => void;
    variant?: "desktop" | "mobile";
}

export function DashboardSidebar({
    onNavItemClick,
    variant = "desktop",
}: SidebarProps) {
    const location = useLocation();
    const { shopId } = useParams<{ shopId: string }>();

    const isMobile = variant === "mobile";

    const navigation = shopId
        ? [
              {
                  title: "Dashboard",
                  href: `/dashboard/shop/${shopId}`,
                  icon: Home,
              },
              {
                  title: "Analytics",
                  href: `/dashboard/shop/${shopId}/analytics`,
                  icon: BarChart3,
              },
              {
                  title: "Products",
                  href: `/dashboard/shop/${shopId}/products`,
                  icon: Package,
              },
              {
                  title: "Orders",
                  href: `/dashboard/shop/${shopId}/orders`,
                  icon: ShoppingBag,
                  badge: "12",
              },
              {
                  title: "Discounts",
                  href: `/dashboard/shop/${shopId}/discounts`,
                  icon: Percent,
              },
              {
                  title: "Payouts",
                  href: `/dashboard/shop/${shopId}/payouts`,
                  icon: Wallet,
              },
              {
                  title: "Settings",
                  href: `/dashboard/shop/${shopId}/settings`,
                  icon: Settings,
              },
          ]
        : [];

    // "Pinned" = user explicitly clicked to keep it open.
    // Persisted across reloads.
    const [pinned, setPinned] = useState<boolean>(() => {
        if (isMobile || typeof window === "undefined") return true;

        const stored = window.localStorage.getItem(
            PIN_STORAGE_KEY
        );

        return stored === null ? true : stored === "true";
    });

    // "Peeking" = mouse is hovering a collapsed rail.
    // Temporary, not persisted.
    const [isPeeking, setIsPeeking] = useState(false);

    useEffect(() => {
        if (isMobile) return;

        window.localStorage.setItem(
            PIN_STORAGE_KEY,
            String(pinned)
        );
    }, [pinned, isMobile]);

    const collapsedRail = !isMobile && !pinned;
    const isFlyout = collapsedRail && isPeeking;

    const expanded = isMobile || pinned || isFlyout;

    const currentShopDashboard = shopId
        ? `/dashboard/shop/${shopId}`
        : "/dashboard";

    return (
        <div
            onMouseEnter={() =>
                collapsedRail && setIsPeeking(true)
            }
            onMouseLeave={() => setIsPeeking(false)}
            className={`relative h-full shrink-0 transition-[width] duration-150 ease-out ${
                collapsedRail ? "w-16" : "w-64"
            }`}
        >
            <aside
                className={`flex flex-col h-full bg-white select-none transition-all duration-150 ease-out ${
                    isFlyout
                        ? "absolute left-0 top-0 w-64 z-50 rounded-r-2xl border-r border-slate-200 shadow-2xl shadow-slate-900/10"
                        : "w-full"
                }`}
            >
                {/* TOP BAR */}
                <div
                    className={`h-12 flex items-center border-b border-slate-100 shrink-0 px-3 ${
                        expanded
                            ? "justify-between"
                            : "justify-center"
                    }`}
                >
                    {expanded ? (
                        <Link
                            to={currentShopDashboard}
                            className="flex items-center gap-2 px-1 group"
                        >
                            <img
                                src="/ChatGPT Image Sep 5, 2026, 12_33_26 AM.png"
                                alt="Nexions Logo"
                                className="h-6 w-auto object-contain"
                            />
                        </Link>
                    ) : (
                        <Link
                            to={currentShopDashboard}
                            className="flex items-center justify-center"
                        >
                            <img
                                src="/ChatGPT Image Sep 5, 2026, 12_33_26 AM.png"
                                alt="Nexions Logo"
                                className="h-5 w-auto object-contain"
                            />
                        </Link>
                    )}

                    {!isMobile && (
                        <button
                            onClick={() =>
                                setPinned((prev) => !prev)
                            }
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors shrink-0 cursor-pointer"
                            title={
                                pinned
                                    ? "Collapse sidebar"
                                    : "Pin sidebar open"
                            }
                        >
                            <PanelLeft className="size-4.5" />
                        </button>
                    )}
                </div>

                {/* NAVIGATION LINKS */}
                <div className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {navigation.map((item) => {
                        const isActive =
                            location.pathname === item.href;

                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.title}
                                to={item.href}
                                onClick={onNavItemClick}
                                className={`relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    isActive
                                        ? "bg-orange-50 text-orange-600 font-semibold"
                                        : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                                }`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <Icon
                                        className={`size-4 shrink-0 ${
                                            isActive
                                                ? "text-orange-600"
                                                : "text-slate-500"
                                        }`}
                                    />

                                    {expanded && (
                                        <span className="truncate">
                                            {item.title}
                                        </span>
                                    )}
                                </div>

                                {expanded && item.badge && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-600 shrink-0">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* FOOTER */}
                <div className="p-2 border-t border-slate-100 shrink-0 space-y-0.5">
                    {/* SWITCH SHOP */}
                    <Link
                        to="/dashboard/shops"
                        onClick={onNavItemClick}
                        className={`relative flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            location.pathname ===
                            "/dashboard/shops"
                                ? "bg-orange-50 text-orange-600 font-semibold"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                    >
                        <div className="flex items-center gap-2.5 min-w-0 w-full">
                            <Store
                                className={`size-4 shrink-0 ${
                                    location.pathname ===
                                    "/dashboard/shops"
                                        ? "text-orange-600"
                                        : "text-slate-500"
                                }`}
                            />

                            {expanded && (
                                <span className="truncate">
                                    Switch Shop
                                </span>
                            )}
                        </div>
                    </Link>

                    {/* VIEW STORE */}
                    <a
                        href="/"
                        target="_blank"
                        rel="noreferrer"
                        className="relative flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                        <div className="flex items-center gap-2.5 min-w-0 w-full">
                            <Globe className="size-4 shrink-0 text-slate-500" />

                            {expanded && (
                                <span className="truncate">
                                    View Store
                                </span>
                            )}
                        </div>
                    </a>
                </div>
            </aside>
        </div>
    );
}