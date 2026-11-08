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
    X,
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
            className={`relative h-full shrink-0 transition-[width] duration-150 ease-out ${
                isMobile ? "w-full" : collapsedRail ? "w-[68px]" : "w-60"
            }`}
        >
            <aside
                className={`seller-sidebar flex flex-col h-full bg-[#533257] text-white select-none transition-all duration-150 ease-out ${
                    isMobile
                        ? "w-full border-r-0"
                        : "w-full border-r border-white/10"
                } ${
                    isFlyout
                        ? "absolute left-0 top-0 w-60 z-50 rounded-r-lg border-r border-white/10 shadow-2xl bg-[#533257]"
                        : ""
                }`}
            >
                {/* BRAND HEADER (Matches navbar height 64px) */}
                <div
                    className={`h-16 flex items-center border-b border-white/10 shrink-0 px-3.5 ${
                        expanded ? "justify-between" : "justify-center"
                    }`}
                >
                    {expanded ? (
                        <Link
                            to={currentShopDashboard}
                            className="flex items-center gap-2.5 min-w-0"
                            onClick={onNavItemClick}
                        >
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white">
                                <Store className="size-4" />
                            </div>
                            <div className="min-w-0 flex flex-col">
                                <span className="truncate text-xs font-semibold text-white">
                                    {activeShop?.profile?.name || "Store"}
                                </span>
                                <span className="text-[10px] text-white/50 truncate font-mono">
                                    {activeShop?.slug ? `/${activeShop.slug}` : "Console"}
                                </span>
                            </div>
                        </Link>
                    ) : (
                        <Link
                            to={currentShopDashboard}
                            className="flex items-center justify-center"
                            onClick={onNavItemClick}
                            title={activeShop?.profile?.name || "Store"}
                        >
                            <div className="flex size-8 items-center justify-center rounded-lg bg-orange-500 text-white">
                                <Store className="size-4" />
                            </div>
                        </Link>
                    )}

                    {isMobile ? (
                        <button
                            type="button"
                            onClick={onNavItemClick}
                            className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                            title="Close navigation"
                            aria-label="Close navigation"
                        >
                            <X className="size-4" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setPinned((prev) => !prev)}
                            className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                            title={pinned ? "Collapse sidebar" : "Pin sidebar"}
                            aria-label={pinned ? "Collapse sidebar" : "Pin sidebar"}
                        >
                            <PanelLeft className="size-3.5" />
                        </button>
                    )}
                </div>

                {/* NAVIGATION ITEMS */}
                <div className="flex-1 w-full px-2.5 py-3 space-y-1 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {expanded && (
                        <div className="px-2.5 pb-1 text-[10px] font-medium uppercase tracking-wider text-white/40">
                            Store menu
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
                                className={`group relative flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer ${
                                    isActive
                                        ? "bg-orange-500 text-white font-medium"
                                        : "text-white/75 hover:text-white hover:bg-white/8 font-normal"
                                } ${!expanded ? "justify-center px-2" : ""}`}
                            >
                                <div className={`flex items-center gap-2.5 min-w-0 ${!expanded ? "justify-center" : ""}`}>
                                    <Icon
                                        className={`size-4 shrink-0 ${
                                            isActive
                                                ? "text-white"
                                                : "text-white/60 group-hover:text-white"
                                        }`}
                                    />

                                    {expanded && (
                                        <span className="truncate">{item.title}</span>
                                    )}
                                </div>

                                {expanded && item.badge && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/20 text-white ml-2">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* FOOTER */}
                <div className="p-2.5 border-t border-white/10 shrink-0 space-y-0.5 w-full">
                    {/* SWITCH SHOP */}
                    <Link
                        to="/shops"
                        onClick={onNavItemClick}
                        title={!expanded ? "Switch shop" : undefined}
                        className={`group flex items-center rounded-lg px-2.5 py-1.5 text-xs text-white/70 hover:text-white hover:bg-white/8 transition-colors cursor-pointer ${
                            !expanded ? "justify-center px-2" : "justify-between"
                        }`}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <Store className="size-4 shrink-0 text-white/50 group-hover:text-white transition-colors" />
                            {expanded && <span className="truncate">Switch shop</span>}
                        </div>
                    </Link>

                    {/* VIEW PUBLIC STORE */}
                    <a
                        href={activeShop ? `/${activeShop.slug}` : "/"}
                        target="_blank"
                        rel="noreferrer"
                        title={!expanded ? "View storefront" : undefined}
                        className={`group flex items-center rounded-lg px-2.5 py-1.5 text-xs text-white/70 hover:text-white hover:bg-white/8 transition-colors cursor-pointer ${
                            !expanded ? "justify-center px-2" : "justify-between"
                        }`}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <Globe className="size-4 shrink-0 text-white/50 group-hover:text-white transition-colors" />
                            {expanded && <span className="truncate">View storefront</span>}
                        </div>
                        {expanded && (
                            <ExternalLink className="size-3 text-white/40 group-hover:text-white transition-colors" />
                        )}
                    </a>

                    {/* STATUS PILL */}
                    {expanded && (
                        <div className="pt-2">
                            <div className="flex items-center justify-between rounded-lg bg-black/20 border border-white/10 px-2.5 py-1.5 text-xs text-white/80">
                                <span className="flex items-center gap-1.5">
                                    <span
                                        className={`size-1.5 rounded-full ${
                                            activeShop?.status === "ACTIVE"
                                                ? "bg-emerald-400"
                                                : "bg-amber-400"
                                        }`}
                                    />
                                    <span className="text-[11px] text-white/80 font-medium">
                                        {activeShop?.status === "ACTIVE"
                                            ? "Active"
                                            : "Setup mode"}
                                    </span>
                                </span>
                                <span className="font-mono text-[10px] text-white/40 uppercase">
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
