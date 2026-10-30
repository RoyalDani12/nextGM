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
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 md:px-7 ds-shadow-xs transition-all duration-300">
            <div className="flex items-center gap-3 md:gap-4">
                {/* Mobile Drawer trigger */}
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger render={<Button variant="ghost" size="icon" className="rounded-xl text-slate-700 lg:hidden cursor-pointer hover:bg-slate-100" />}>
                        <Menu className="size-5" />
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72 p-0 bg-[#0B0F19] border-r border-slate-800 [&_[data-slot=sheet-close]]:hidden">
                        <SheetHeader className="sr-only"><SheetTitle>Admin navigation</SheetTitle></SheetHeader>
                        <AdminSidebar variant="mobile" onNavItemClick={() => setMobileOpen(false)} />
                    </SheetContent>
                </Sheet>

                {/* Mobile brand (hidden on desktop since sidebar shows it) */}
                <div className="flex items-center gap-2.5 lg:hidden">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                        <ShieldCheck className="size-4 text-orange-400" />
                    </div>
                    <span className="text-xs font-black tracking-wider uppercase text-slate-900">Control Center</span>
                </div>

                {/* Desktop Platform Breadcrumb */}
                <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-400">
                    <span className="flex items-center gap-1.5 font-bold text-slate-800">
                        <ShieldCheck className="size-4 text-orange-500" />
                        Control Center
                    </span>
                    <span className="text-slate-300">/</span>
                    <span className="font-semibold text-slate-600">Enterprise Administration</span>
                </div>
            </div>

            {/* Global Search Bar */}
            <div className="hidden max-w-md flex-1 items-center md:flex">
                <div className="group relative w-full">
                    <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                    <Input placeholder="Search users, stores, orders..." className="h-9 rounded-xl border-slate-200/80 bg-slate-50/80 pl-9 pr-12 text-xs font-medium focus-visible:border-orange-500 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-orange-500/15 transition-all" />
                    <kbd className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-slate-400 ds-shadow-xs"><Command className="size-2.5" />K</kbd>
                </div>
            </div>

            {/* Right Status & Profile Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden items-center gap-2 rounded-full bg-emerald-50/90 border border-emerald-200/60 px-3 py-1 text-[11px] font-bold text-emerald-700 sm:flex">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    All systems operational
                </div>
                <div className="rounded-xl">
                    <NotificationDropdown triggerClassName="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer" />
                </div>
                <div className="mx-0.5 hidden h-5 w-px bg-slate-200 sm:block" />
                <DropdownMenu>
                    <DropdownMenuTrigger render={<button className="rounded-full outline-none transition hover:scale-105 focus-visible:ring-2 focus-visible:ring-orange-500 cursor-pointer" />}>
                        <Avatar className="size-9 ring-2 ring-orange-500/25 ring-offset-2 hover:ring-orange-500/50 transition-all"><AvatarImage src={user?.profile?.avatar ?? undefined} alt={user?.name} /><AvatarFallback className="bg-slate-900 text-xs font-black text-white">{initials}</AvatarFallback></Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="mt-2 w-72 rounded-3xl border-slate-200 bg-white p-2 ds-shadow-xl">
                        <div className="mb-2 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                            <Avatar className="size-10"><AvatarImage src={user?.profile?.avatar ?? undefined} /><AvatarFallback className="bg-orange-100 text-xs font-black text-orange-700">{initials}</AvatarFallback></Avatar>
                            <div className="min-w-0"><p className="truncate text-sm font-black text-slate-900">{user?.name || "Super Admin"}</p><p className="truncate text-[11px] font-medium text-slate-500">{user?.email}</p></div>
                        </div>
                        <DropdownMenuItem onClick={() => navigate("/account/settings")} className="cursor-pointer gap-3 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><UserRound className="size-4 text-slate-400" /> Edit profile & security</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/superadmin/settings")} className="cursor-pointer gap-3 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Settings className="size-4 text-slate-400" /> Platform settings</DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1.5" />
                        <DropdownMenuItem onClick={() => logout.mutate()} className="cursor-pointer gap-3 rounded-2xl px-3 py-2.5 text-xs font-semibold text-red-600 focus:bg-red-50 focus:text-red-700"><LogOut className="size-4" /> Sign out</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
};
