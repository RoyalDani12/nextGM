import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Store,
    CreditCard,
    Users,
    Tags,
    Shield,
    LifeBuoy,
    LogOut,
    MessageSquare,
    Truck,
    RotateCcw,
    ShoppingCart,
    BarChart3,
    Wallet,
    Ticket,
    Package,
} from "lucide-react";
import { useLogout } from "@/features/auth/auth.hooks";

interface AdminNavLinksProps {
    expanded?: boolean;
    onNavItemClick?: () => void;
}

const NavItem = ({
    href,
    icon: Icon,
    label,
    expanded,
    onClick,
}: {
    href: string;
    icon: React.ElementType;
    label: string;
    expanded: boolean;
    onClick?: () => void;
}) => {
    const location = useLocation();
    const active = location.pathname === href || (href !== "/superadmin" && location.pathname.startsWith(href));
    return (
        <Link
            to={href}
            onClick={onClick}
            title={!expanded ? label : undefined}
            className={`group relative flex items-center rounded-xl mb-1 text-[13px] transition-all duration-150 select-none cursor-pointer ${
                expanded ? "gap-3 px-3 py-2.5" : "justify-center px-0 py-2.5"
            } ${
                active
                    ? "text-white font-bold bg-gradient-to-r from-orange-500 to-amber-500 shadow-md shadow-orange-500/25"
                    : "text-slate-300 font-medium hover:text-white hover:bg-white/10 hover:translate-x-0.5"
            }`}
        >
            <Icon
                className={`size-4 shrink-0 transition-all duration-150 ${
                    active
                        ? "text-white scale-110"
                        : "text-slate-400 group-hover:text-white group-hover:scale-105"
                }`}
            />
            {expanded && <span className="truncate">{label}</span>}
            {active && expanded && (
                <span className="ml-auto size-1.5 rounded-full bg-white shadow-xs shrink-0" />
            )}
        </Link>
    );
};

export const AdminNavLinks = ({ expanded = true, onNavItemClick }: AdminNavLinksProps) => {
    const logout = useLogout();
    return (
        <div className="flex min-h-full flex-col justify-between">
            <div className="space-y-4">
                <div>
                    {expanded && (
                        <p className="px-3 mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Platform
                        </p>
                    )}
                    <NavItem href="/superadmin" icon={LayoutDashboard} label="Overview" expanded={expanded} onClick={onNavItemClick} />
                    <NavItem href="/superadmin/analytics" icon={BarChart3} label="Analytics" expanded={expanded} onClick={onNavItemClick} />
                    <NavItem href="/superadmin/orders" icon={ShoppingCart} label="All Orders" expanded={expanded} onClick={onNavItemClick} />
                    <NavItem href="/superadmin/products" icon={Package} label="Product Catalog" expanded={expanded} onClick={onNavItemClick} />
                    <NavItem href="/superadmin/shops" icon={Store} label="Tenants & Stores" expanded={expanded} onClick={onNavItemClick} />
                    <NavItem href="/superadmin/users" icon={Users} label="Users & Access" expanded={expanded} onClick={onNavItemClick} />
                    <NavItem href="/superadmin/categories" icon={Tags} label="Categories" expanded={expanded} onClick={onNavItemClick} />
                    <NavItem href="/superadmin/coupons" icon={Ticket} label="Coupons" expanded={expanded} onClick={onNavItemClick} />
                    <NavItem href="/superadmin/reviews" icon={MessageSquare} label="Reviews & Moderation" expanded={expanded} onClick={onNavItemClick} />
                    <NavItem href="/superadmin/shipments" icon={Truck} label="Fulfillment" expanded={expanded} onClick={onNavItemClick} />
                    <NavItem href="/superadmin/returns" icon={RotateCcw} label="Returns & Refunds" expanded={expanded} onClick={onNavItemClick} />
                    <NavItem href="/superadmin/payouts" icon={Wallet} label="Payouts" expanded={expanded} onClick={onNavItemClick} />
                    <NavItem href="/superadmin/billing" icon={CreditCard} label="Global Billing" expanded={expanded} onClick={onNavItemClick} />
                </div>
                <div>
                    {expanded && (
                        <p className="px-3 mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Administration
                        </p>
                    )}
                    <NavItem href="/superadmin/audits" icon={Shield} label="Security & Audits" expanded={expanded} onClick={onNavItemClick} />
                </div>
            </div>
            <div className="mt-6 border-t border-white/10 pt-3">
                <NavItem href="/superadmin/support" icon={LifeBuoy} label="Support Center" expanded={expanded} onClick={onNavItemClick} />
                <button
                    onClick={() => logout.mutate()}
                    title={!expanded ? "Sign out" : undefined}
                    className={`flex w-full items-center rounded-xl px-2.5 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer ${
                        expanded ? "gap-3" : "justify-center"
                    }`}
                >
                    <LogOut className="size-4 shrink-0 text-rose-400" />
                    {expanded && <span>Sign out</span>}
                </button>
            </div>
        </div>
    );
};
