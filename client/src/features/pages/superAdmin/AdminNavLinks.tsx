import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Store, CreditCard, Settings, Users, Tags, Shield, LifeBuoy, LogOut, MessageSquare, Truck, RotateCcw } from "lucide-react";
import { useLogout } from "@/features/auth/auth.hooks";

interface AdminNavLinksProps {
    expanded?: boolean;
    onNavItemClick?: () => void;
}

const NavItem = ({ href, icon: Icon, label, expanded, onClick }: { href: string; icon: React.ElementType; label: string; expanded: boolean; onClick?: () => void }) => {
    const location = useLocation();
    const active = location.pathname === href || (href !== "/superadmin" && location.pathname.startsWith(href));
    return (
        <Link
            to={href}
            onClick={onClick}
            title={!expanded ? label : undefined}
            className={`relative mb-1 flex items-center rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors ${expanded ? "gap-3" : "justify-center"} ${active ? "bg-orange-50 text-orange-600" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
        >
            <Icon className={`size-4 shrink-0 ${active ? "text-orange-600" : "text-slate-400"}`} />
            {expanded && <span className="truncate">{label}</span>}
            {active && <span className="absolute bottom-2 right-2 size-1.5 rounded-full bg-orange-500" />}
        </Link>
    );
};

export const AdminNavLinks = ({ expanded = true, onNavItemClick }: AdminNavLinksProps) => {
    const logout = useLogout();
    return (
        <div className="flex min-h-full flex-col justify-between">
            <div className="space-y-5">
                <div>
                    {expanded && <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Platform</p>}
                    <NavItem href="/superadmin" icon={LayoutDashboard} label="Overview" expanded={expanded} onClick={onNavItemClick} />
                    <NavItem href="/superadmin/shops" icon={Store} label="Tenants & stores" expanded={expanded} onClick={onNavItemClick} />
                    <NavItem href="/superadmin/users" icon={Users} label="Users & access" expanded={expanded} onClick={onNavItemClick} />
                    <NavItem href="/superadmin/categories" icon={Tags} label="Categories" expanded={expanded} onClick={onNavItemClick} />
                    <NavItem href="/superadmin/reviews" icon={MessageSquare} label="Reviews & moderation" expanded={expanded} onClick={onNavItemClick} />
                    <NavItem href="/superadmin/shipments" icon={Truck} label="Fulfillment" expanded={expanded} onClick={onNavItemClick} />
                    <NavItem href="/superadmin/returns" icon={RotateCcw} label="Returns & refunds" expanded={expanded} onClick={onNavItemClick} />
                    <NavItem href="/superadmin/billing" icon={CreditCard} label="Global billing" expanded={expanded} onClick={onNavItemClick} />
                </div>
                <div>
                    {expanded && <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Administration</p>}
                    <NavItem href="/superadmin/audits" icon={Shield} label="Security & audits" expanded={expanded} onClick={onNavItemClick} />
                    <NavItem href="/superadmin/settings" icon={Settings} label="System settings" expanded={expanded} onClick={onNavItemClick} />
                </div>
            </div>
            <div className="mt-6 border-t border-slate-100 pt-4">
                <NavItem href="/superadmin/support" icon={LifeBuoy} label="Support center" expanded={expanded} onClick={onNavItemClick} />
                <button onClick={() => logout.mutate()} title={!expanded ? "Sign out" : undefined} className={`flex w-full items-center rounded-xl px-2.5 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50 ${expanded ? "gap-3" : "justify-center"}`}>
                    <LogOut className="size-4 shrink-0" />
                    {expanded && <span>Sign out</span>}
                </button>
            </div>
        </div>
    );
};
