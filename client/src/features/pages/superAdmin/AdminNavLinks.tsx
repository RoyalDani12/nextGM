import React from "react";
import { 
  LayoutDashboard, 
  Store, 
  CreditCard, 
  Settings, 
  Users, 
  Tags,
  Shield, 
  LifeBuoy,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
// import useAuthStore from "@/store/useAuthStore";
import { useAuthStore } from "@/store/auth.store";

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
}

const NavItem = ({ href, icon: Icon, label }: NavItemProps) => {
  const location = useLocation();
  const active = location.pathname === href || (href !== '/superadmin' && location.pathname.startsWith(href));

  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      className="w-full justify-start gap-3 px-3 font-medium"
      asChild
    >
      <Link to={href}>
        <Icon size={18} className={active ? "text-foreground" : "text-muted-foreground"} />
        <span>{label}</span>
      </Link>
    </Button>
  );
};

export const AdminNavLinks = () => {
  const { clearAuth } = useAuthStore();
  
  return (
    <div className="flex flex-col h-full justify-between py-2">
      <div className="space-y-6">
        {/* Platform Section */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Platform
          </p>
          <NavItem href="/superadmin" icon={LayoutDashboard} label="Overview" />
          <NavItem href="/superadmin/shops" icon={Store} label="Tenants & Stores" />
          <NavItem href="/superadmin/users" icon={Users} label="Users" />
          <NavItem href="/superadmin/categories" icon={Tags} label="Categories" />
          <NavItem href="#" icon={CreditCard} label="Global Billing" />
        </div>

        {/* Administration Section */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Administration
          </p>
          <NavItem href="#" icon={Shield} label="Security & Audits" />
          <NavItem href="#" icon={Settings} label="System Settings" />
        </div>
      </div>

      {/* Footer Section */}
      <div className="pt-4 border-t border-border space-y-1">
        <NavItem href="#" icon={LifeBuoy} label="Support Tickets" />
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive font-medium"
          onClick={() => clearAuth()}
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );
};
