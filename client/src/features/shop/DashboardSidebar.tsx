import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    Home,
    LayoutDashboard,
    Package,
    ShoppingBag,
    Users,
    BarChart3,
    Wallet,
    Settings,
    Globe,
    Box,
    Tags,
    Percent,
    PanelLeft,
    ChevronRight,
    Store
} from "lucide-react";

const navigation = [
    { title: "Home", href: "/dashboard", icon: Home },
    { title: "Shops", href: "/dashboard/shops", icon: Store },
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    {
        title: "Products",
        href: "/dashboard/products",
        icon: Package,
        subItems: [
            { title: "All Products", href: "/dashboard/products", icon: Box },
            { title: "Categories", href: "/dashboard/categories", icon: Tags },
        ],
    },
    { title: "Orders", href: "/dashboard/orders", icon: ShoppingBag, badge: "12" },
    { title: "Customers", href: "/dashboard/customers", icon: Users },
    { title: "Discounts", href: "/dashboard/discounts", icon: Percent },
    { title: "Payouts", href: "/dashboard/payouts", icon: Wallet },
    { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

const PIN_STORAGE_KEY = "dashboard-sidebar-pinned";

interface SidebarProps {
    /** Called after a nav link is clicked — used to close the mobile Sheet */
    onNavItemClick?: () => void;
    /** "desktop": collapsible rail + hover-peek. "mobile": always full, no collapse UI. */
    variant?: "desktop" | "mobile";
}

export function DashboardSidebar({ onNavItemClick, variant = "desktop" }: SidebarProps) {
    const location = useLocation();
    const isMobile = variant === "mobile";

    // "Pinned" = user explicitly clicked to keep it open. Persisted across reloads.
    const [pinned, setPinned] = useState<boolean>(() => {
        if (isMobile || typeof window === "undefined") return true;
        const stored = window.localStorage.getItem(PIN_STORAGE_KEY);
        return stored === null ? true : stored === "true";
    });

    // "Peeking" = mouse is hovering a collapsed rail — temporary, not persisted.
    const [isPeeking, setIsPeeking] = useState(false);
    const [productsOpen, setProductsOpen] = useState(true);

    useEffect(() => {
        if (isMobile) return;
        window.localStorage.setItem(PIN_STORAGE_KEY, String(pinned));
    }, [pinned, isMobile]);

    const collapsedRail = !isMobile && !pinned;
    const isFlyout = collapsedRail && isPeeking;
    // Whether nav content should render expanded (labels, chevrons, badges visible)
    const expanded = isMobile || pinned || isFlyout;

    return (
        <div
            onMouseEnter={() => collapsedRail && setIsPeeking(true)}
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
                        expanded ? "justify-between" : "justify-center"
                    }`}
                >
                    {expanded ? (
                        <span className="flex items-center gap-1.5 px-1">
                            <span className="size-6 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                                <span className="text-white text-[11px] font-black">N</span>
                            </span>
                            <span className="text-sm font-extrabold tracking-tight text-slate-900">
                                Next<span className="text-emerald-500">G</span>
                            </span>
                        </span>
                    ) : (
                        <span className="size-6 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                            <span className="text-white text-[11px] font-black">N</span>
                        </span>
                    )}

                    {!isMobile && (
                        <button
                            onClick={() => setPinned((prev) => !prev)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors shrink-0"
                            title={pinned ? "Collapse sidebar" : "Pin sidebar open"}
                        >
                            <PanelLeft className="size-4.5" />
                        </button>
                    )}
                </div>

                {/* NAVIGATION LINKS */}
                <div className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {navigation.map((item) => {
                        const isProducts = item.title === "Products";
                        const isExactActive = location.pathname === item.href;
                        const hasSubItems = !!item.subItems;
                        const isSubActive =
                            hasSubItems && item.subItems?.some((sub) => location.pathname === sub.href);
                        const isActive = isExactActive || isSubActive;
                        const Icon = item.icon;

                        if (isProducts) {
                            return (
                                <div key="products-group" className="space-y-0.5">
                                    <button
                                        onClick={() => {
                                            if (!pinned) setPinned(true);
                                            setProductsOpen((prev) => !prev);
                                        }}
                                        className={`relative w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                            isActive
                                                ? "bg-emerald-50 text-emerald-600 font-semibold"
                                                : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <Icon
                                                className={`size-4 shrink-0 ${
                                                    isActive ? "text-emerald-600" : "text-slate-500"
                                                }`}
                                            />
                                            {expanded && <span className="truncate">Products</span>}
                                        </div>
                                        {expanded && (
                                            <ChevronRight
                                                className={`size-3.5 text-slate-400 shrink-0 transition-transform ${
                                                    productsOpen ? "rotate-90" : ""
                                                }`}
                                            />
                                        )}
                                    </button>

                                    {productsOpen && expanded && (
                                        <div className="pl-7 space-y-0.5 pt-0.5">
                                            {item.subItems?.map((sub) => {
                                                const subActive = location.pathname === sub.href;
                                                return (
                                                    <Link
                                                        key={sub.href}
                                                        to={sub.href}
                                                        onClick={onNavItemClick}
                                                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                                                            subActive
                                                                ? "text-emerald-600 font-semibold bg-emerald-50/60"
                                                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                                                        }`}
                                                    >
                                                        <span className="truncate">{sub.title}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={item.title}
                                to={item.href}
                                onClick={onNavItemClick}
                                className={`relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    isActive
                                        ? "bg-emerald-50 text-emerald-600 font-semibold"
                                        : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                                }`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <Icon
                                        className={`size-4 shrink-0 ${
                                            isActive ? "text-emerald-600" : "text-slate-500"
                                        }`}
                                    />
                                    {expanded && <span className="truncate">{item.title}</span>}
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

                {/* FOOTER LINK */}
                <div className="p-2 border-t border-slate-100 shrink-0">
                    <a
                        href="/"
                        target="_blank"
                        rel="noreferrer"
                        className="relative flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                        <div className="flex items-center gap-2.5 min-w-0 w-full">
                            <Globe className="size-4 shrink-0 text-slate-500" />
                            {expanded && <span className="truncate">View Store</span>}
                        </div>
                    </a>
                </div>
            </aside>
        </div>
    );
}