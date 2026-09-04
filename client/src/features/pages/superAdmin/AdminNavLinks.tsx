import type { ElementType } from "react";
import { NavLink } from "react-router-dom";
import { CreditCard, LayoutDashboard, LifeBuoy, LogOut, Settings, Shield, Store, Users } from "lucide-react";
import { useLogout } from "@/features/auth/auth.hooks";

interface NavItemProps { href: string; icon: ElementType; label: string }
const links = {
  platform: [
    { href: "/superadmin", label: "Overview", icon: LayoutDashboard },
    { href: "/superadmin/stores", label: "Tenants & stores", icon: Store },
    { href: "/superadmin/billing", label: "Global billing", icon: CreditCard },
  ],
  administration: [
    { href: "/superadmin/users", label: "Admin users", icon: Users },
    { href: "/superadmin/audits", label: "Security & audits", icon: Shield },
    { href: "/superadmin/settings", label: "System settings", icon: Settings },
  ],
};

function NavItem({ href, icon: Icon, label }: NavItemProps) {
  return <NavLink to={href} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}><Icon className="size-4" />{label}</NavLink>;
}

export const AdminNavLinks = () => {
  const logout = useLogout();
  return <div className="flex h-full flex-col justify-between py-2"><div className="space-y-7">{Object.entries(links).map(([section, items]) => <div key={section} className="space-y-1"><p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{section}</p>{items.map((item) => <NavItem key={item.href} {...item} />)}</div>)}</div><div className="space-y-1 border-t border-slate-200 pt-4"><NavItem href="/help" icon={LifeBuoy} label="Support" /><button type="button" onClick={() => logout.mutate()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"><LogOut className="size-4" /> Sign out</button></div></div>;
};
