import { useState } from "react";
import { Command, Menu, Search, Settings, ShieldCheck, UserRound, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdminSidebar } from "./AdminSidebar";
import { NotificationDropdown } from "@/features/notification/NotificationDropdown";
import { useAuthStore } from "@/store/auth.store";
import { useLogout } from "@/features/auth/auth.hooks";

export const SuperAdminHeader = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const logout = useLogout();
    const initials = user?.name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "SA";

    return (
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-6 transition-all duration-300">
            <div className="flex items-center gap-3">
                {/* Mobile Drawer trigger */}
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger render={<Button variant="ghost" size="icon" className="size-8 rounded-md text-slate-700 lg:hidden cursor-pointer hover:bg-slate-100" />}>
                        <Menu className="size-4.5" />
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[300px] sm:w-[320px] max-w-[85vw] p-0 bg-[#533257] border-r border-white/10 text-white shadow-2xl [&_[data-slot=sheet-close]]:hidden">
                        <SheetHeader className="sr-only"><SheetTitle>Admin navigation</SheetTitle></SheetHeader>
                        <AdminSidebar variant="mobile" onNavItemClick={() => setMobileOpen(false)} />
                    </SheetContent>
                </Sheet>

                {/* Mobile brand (hidden on desktop since sidebar shows it) */}
                <div className="flex items-center gap-2 lg:hidden">
                    <div className="flex size-7 items-center justify-center rounded-md bg-orange-500 text-white">
                        <ShieldCheck className="size-3.5" />
                    </div>
                    <span className="text-xs font-semibold tracking-tight text-slate-900">Control Center</span>
                </div>

                {/* Desktop Platform Breadcrumb */}
                <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-400">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <ShieldCheck className="size-3.5 text-orange-500" />
                        Control Center
                    </span>
                    <span className="text-slate-300">/</span>
                    <span className="font-mono text-[11px] text-slate-500 font-medium">Enterprise Admin</span>
                </div>
            </div>

            {/* Global Search Bar */}
            <div className="hidden max-w-md flex-1 items-center md:flex">
                <div className="group relative w-full">
                    <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                    <Input placeholder="Search users, stores, orders..." className="h-8.5 rounded-md border-slate-200 bg-slate-50/80 pl-8 pr-12 text-xs font-medium focus-visible:border-orange-500 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-orange-500/20 transition-all" />
                    <kbd className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-slate-400"><Command className="size-2.5" />K</kbd>
                </div>
            </div>

            {/* Right Status & Profile Controls */}
            <div className="flex items-center gap-2">
                <div className="hidden items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-800 sm:flex">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    All systems operational
                </div>
                <div>
                    <NotificationDropdown triggerClassName="size-8 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100" />
                </div>
                <div className="mx-0.5 hidden h-4 w-px bg-slate-200 sm:block" />
                <DropdownMenu>
                    <DropdownMenuTrigger render={<button className="outline-none transition-transform hover:scale-102 focus-visible:ring-2 focus-visible:ring-orange-500 rounded-full cursor-pointer" />}>
                        <Avatar className="size-8 ring-1 ring-slate-200 hover:ring-slate-300 transition-all"><AvatarImage src={user?.profile?.avatar ?? undefined} alt={user?.name} /><AvatarFallback className="bg-slate-900 text-[11px] font-semibold text-white">{initials}</AvatarFallback></Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 mt-1.5 p-1 rounded-lg border border-slate-200 bg-white shadow-lg">
                        <div className="px-3 py-2.5 bg-slate-50/70 rounded-md border border-slate-100 mb-1 flex items-center gap-2.5">
                            <Avatar className="size-8"><AvatarImage src={user?.profile?.avatar ?? undefined} /><AvatarFallback className="bg-orange-100 text-[11px] font-semibold text-orange-700">{initials}</AvatarFallback></Avatar>
                            <div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-900">{user?.name || "Super Admin"}</p><p className="truncate text-[11px] text-slate-500">{user?.email}</p></div>
                        </div>
                        <DropdownMenuItem onClick={() => navigate("/account/settings")} className="cursor-pointer gap-2 py-1.5 px-2.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 focus:bg-slate-50"><UserRound className="size-3.5 text-slate-400" /> Account Settings</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/superadmin/settings")} className="cursor-pointer gap-2 py-1.5 px-2.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 focus:bg-slate-50"><Settings className="size-3.5 text-slate-400" /> Platform Settings</DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1 bg-slate-100" />
                        <DropdownMenuItem onClick={() => logout.mutate()} className="cursor-pointer gap-2 py-1.5 px-2.5 rounded-md text-xs font-medium text-red-600 focus:bg-red-50 focus:text-red-700"><LogOut className="size-3.5" /> Sign Out</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
};
