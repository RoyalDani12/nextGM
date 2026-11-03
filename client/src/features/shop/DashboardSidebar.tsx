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
    MessageSquare,
    RotateCcw,
    ExternalLink,
} from "lucide-react";
import { useMyShops } from "./shop.hooks";

const PIN_STORAGE_KEY = "seller-dashboard-sidebar-pinned";

interface NavItem {
    title: string;
    href: string;
    icon: any;
    badge?: string;
}

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
    const { data: shopsResponse } = useMyShops();
    const activeShop = shopsResponse?.data?.find((shop) => shop.id === shopId);

    const isMobile = variant === "mobile";

    const navigation: NavItem[] = shopId
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
                  title: "Products & Inventory",
                  href: `/dashboard/shop/${shopId}/products`,
                  icon: Package,
              },
              {
                  title: "Orders & Fulfillment",
                  href: `/dashboard/shop/${shopId}/orders`,
                  icon: ShoppingBag,
              },
              {
                  title: "Customer Reviews",
                  href: `/dashboard/shop/${shopId}/reviews`,
                  icon: MessageSquare,
              },
              {
                  title: "Returns & Refunds",
                  href: `/dashboard/shop/${shopId}/returns`,
                  icon: RotateCcw,
              },
              {
                  title: "Discounts & Coupons",
                  href: `/dashboard/shop/${shopId}/discounts`,
                  icon: Percent,
              },
              {
                  title: "Payouts & Wallet",
                  href: `/dashboard/shop/${shopId}/payouts`,
                  icon: Wallet,
              },
              {
                  title: "Store Settings",
                  href: `/dashboard/shop/${shopId}/settings`,
                  icon: Settings,
              },
          ]
        : [];

    const [pinned, setPinned] = useState<boolean>(() => {
        if (isMobile || typeof window === "undefined") return true;
        const stored = window.localStorage.getItem(PIN_STORAGE_KEY);
        return stored === null ? true : stored === "true";
    });

    const [isPeeking, setIsPeeking] = useState(false);

    useEffect(() => {
        if (isMobile) return;
        window.localStorage.setItem(PIN_STORAGE_KEY, String(pinned));
    }, [pinned, isMobile]);

    const collapsedRail = !isMobile && !pinned;
    const isFlyout = collapsedRail && isPeeking;
    const expanded = isMobile || pinned || isFlyout;

    const currentShopDashboard = shopId ? `/dashboard/shop/${shopId}` : "/shops";

    return (
        <div
            onMouseEnter={() => collapsedRail && setIsPeeking(true)}
            onMouseLeave={() => setIsPeeking(false)}
            className={`relative h-full shrink-0 transition-[width] duration-200 ease-out ${
                collapsedRail ? "w-[72px]" : "w-64"
            }`}
        >
            <aside
                className={`seller-sidebar flex flex-col h-full bg-[#533257] text-white select-none transition-all duration-200 ease-out border-r border-slate-800 ${
                    isFlyout
                        ? "absolute left-0 top-0 w-64 z-50 rounded-r-2xl border-r border-slate-800 shadow-2xl shadow-black/80 bg-[#533257]"
                        : "w-full"
                }`}
            >
                {/* TOP BRAND BAR - Exactly h-16 (64px) to match Navbar */}
                <div
                    className={`h-16 flex items-center border-b border-slate-800 shrink-0 px-3.5 ${
                        expanded ? "justify-between" : "justify-center"
                    }`}
                >
                    {expanded ? (
                        <Link
                            to={currentShopDashboard}
                            className="flex items-center gap-2.5 px-1 group min-w-0"
                            onClick={onNavItemClick}
                        >
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-md shadow-orange-500/30 transition-transform duration-200 group-hover:scale-105">
                                <Store className="size-4.5 text-white" />
                            </div>
                            <div className="min-w-0 flex flex-col">
                                <div className="flex items-center gap-1.5">
                                    <span className="truncate text-xs font-black tracking-tight text-white group-hover:text-orange-400 transition-colors">
                                        {activeShop?.profile?.name || "Merchant Portal"}
                                    </span>
                                </div>
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                    Store Workspace
                                </span>
                            </div>
                        </Link>
                    ) : (
                        <Link
                            to={currentShopDashboard}
                            className="flex items-center justify-center"
                            onClick={onNavItemClick}
                            title={activeShop?.profile?.name || "Store Dashboard"}
                        >
                            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-md shadow-orange-500/30 transition-transform hover:scale-105">
                                <Store className="size-4.5 text-white" />
                            </div>
                        </Link>
                    )}

                    {!isMobile && (
                        <button
                            onClick={() => setPinned((prev) => !prev)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                            title={pinned ? "Collapse sidebar" : "Pin sidebar open"}
                            aria-label={pinned ? "Collapse sidebar" : "Pin sidebar open"}
                        >
                            <PanelLeft className="size-4" />
                        </button>
                    )}
                </div>

                {/* NAVIGATION SECTION */}
                <div className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {expanded && (
                        <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Store Operations
                        </div>
                    )}

                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.title}
                                to={item.href}
                                onClick={onNavItemClick}
                                title={!expanded ? item.title : undefined}
                                className={`group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-all duration-150 cursor-pointer ${
                                    isActive
                                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-md shadow-orange-500/25"
                                        : "text-slate-300 hover:text-white hover:bg-white/10 hover:translate-x-0.5 font-medium"
                                } ${!expanded ? "justify-center px-2" : ""}`}
                            >
                                <div className={`flex items-center gap-3 min-w-0 ${!expanded ? "justify-center" : ""}`}>
                                    <Icon
                                        className={`size-4 shrink-0 transition-transform duration-150 ${
                                            isActive
                                                ? "text-white scale-110"
                                                : "text-slate-400 group-hover:text-white"
                                        }`}
                                    />

                                    {expanded && (
                                        <span className="truncate">{item.title}</span>
                                    )}
                                </div>

                                {expanded && (
                                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                        {item.badge && (
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                isActive
                                                    ? "bg-white/20 text-white border border-white/30"
                                                    : "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                                            }`}>
                                                {item.badge}
                                            </span>
                                        )}
                                        {isActive && (
                                            <span
                                                className="size-1.5 rounded-full bg-white shadow-xs"
                                                aria-hidden="true"
                                            />
                                        )}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* BOTTOM FOOTER SECTION */}
                <div className="p-2.5 border-t border-slate-800 shrink-0 space-y-1">
                    {/* SWITCH SHOP */}
                    <Link
                        to="/shops"
                        onClick={onNavItemClick}
                        title={!expanded ? "Switch Shop" : undefined}
                        className={`group relative flex items-center rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-150 cursor-pointer ${
                            !expanded ? "justify-center px-2" : "justify-between"
                        }`}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <Store className="size-4 shrink-0 text-slate-400 group-hover:text-orange-400 transition-colors" />
                            {expanded && <span className="truncate">Switch Shop</span>}
                        </div>
                    </Link>

                    {/* VIEW LIVE STORE */}
                    <a
                        href={activeShop ? `/${activeShop.slug}` : "/"}
                        target="_blank"
                        rel="noreferrer"
                        title={!expanded ? "View Live Store" : undefined}
                        className={`group relative flex items-center rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-150 cursor-pointer ${
                            !expanded ? "justify-center px-2" : "justify-between"
                        }`}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <Globe className="size-4 shrink-0 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                            {expanded && <span className="truncate">View Public Store</span>}
                        </div>
                        {expanded && (
                            <ExternalLink className="size-3 text-slate-400 group-hover:text-white transition-colors" />
                        )}
                    </a>

                    {/* STORE STATUS BADGE */}
                    {expanded && (
                        <div className="pt-2">
                            <div className="flex items-center justify-between rounded-xl bg-slate-900/90 border border-slate-800 px-3 py-2 text-[11px] text-slate-300">
                                <span className="flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                    Store Active
                                </span>
                                <span className="font-mono text-[10px] text-slate-400 uppercase font-semibold">
                                    {activeShop?.status || "LIVE"}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
}
