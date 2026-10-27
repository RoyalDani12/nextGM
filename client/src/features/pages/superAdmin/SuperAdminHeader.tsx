import { useState } from "react";
import { Search, Menu } from "lucide-react";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdminNavLinks } from "./AdminNavLinks";
import { NotificationDropdown } from "@/features/notification/NotificationDropdown";

export const SuperAdminHeader = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="h-16 bg-background border-b border-border px-4 lg:px-8 flex items-center justify-between sticky top-0 z-50">
      
      {/* Left Area: Mobile Sheet Trigger, Brand, & Search */}
      <div className="flex items-center gap-4 flex-1">
        
        {/* Mobile Navigation Trigger using Sheet */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" />}>
            <Menu size={20} />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 flex flex-col p-6">
            <SheetHeader className="text-left pb-4 border-b border-border">
              <SheetTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
                  S
                </div>
                <span>SystemOS Admin</span>
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto mt-4">
              <AdminNavLinks />
            </div>
          </SheetContent>
        </Sheet>

        {/* Global Search Bar */}
        <div className="hidden sm:flex items-center relative w-full max-w-md">
          <Search size={16} className="absolute left-3 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Search stores, users, or transactions..." 
            className="w-full pl-9 bg-muted/40"
          />
        </div>
      </div>

      {/* Right Area: System Status, Notifications, & Profile Dropdown */}
      <div className="flex items-center gap-4">
        
        {/* Status Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Systems Nominal
          </span>
        </div>

        {/* Notifications Dropdown */}
        <NotificationDropdown triggerClassName="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-all cursor-pointer" />

        {/* Profile Avatar & Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger render={<button className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring" />}>
            <Avatar className="h-9 w-9">
              <AvatarImage src="" alt="Super Admin" />
              <AvatarFallback className="bg-primary text-primary-foreground font-medium text-sm">
                SA
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium leading-none">Super Admin</p>
              <p className="text-xs text-muted-foreground mt-1">admin@systemos.com</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<a href="#" />}>Profile Settings</DropdownMenuItem>
            <DropdownMenuItem render={<a href="#" />}>Platform Audit Logs</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<button className="w-full text-destructive" />} className="text-destructive focus:text-destructive">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  );
};