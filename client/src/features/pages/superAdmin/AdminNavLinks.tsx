import React from "react";
import { 
  LayoutDashboard, 
  Store, 
  CreditCard, 
  Settings, 
  Users, 
  Shield, 
  LifeBuoy,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

const NavItem = ({ href, icon: Icon, label, active }: NavItemProps) => (
  <Button
    variant={active ? "secondary" : "ghost"}
    className="w-full justify-start gap-3 px-3 font-medium"
    render={<a href={href} />}
  >
    <Icon size={18} className={active ? "text-foreground" : "text-muted-foreground"} />
    <span>{label}</span>
  </Button>
);

export const AdminNavLinks = () => {
  return (
    <div className="flex flex-col h-full justify-between py-2">
      <div className="space-y-6">
        {/* Platform Section */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Platform
          </p>
          <NavItem href="#" icon={LayoutDashboard} label="Overview" active />
          <NavItem href="#" icon={Store} label="Tenants & Stores" />
          <NavItem href="#" icon={CreditCard} label="Global Billing" />
        </div>

        {/* Administration Section */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Administration
          </p>
          <NavItem href="#" icon={Users} label="Admin Users" />
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
          render={<button type="button" />}
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );
};