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
        <div className="sticky top-0 z-40 w-full bg-slate-50 px-3 pb-2 pt-3 md:px-6 md:pt-4">
            <header className="flex h-16 items-center justify-between gap-4 rounded-full border border-slate-200/70 bg-white px-3 shadow-sm md:px-5">
                <div className="flex items-center gap-3 md:gap-5">
                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                        <SheetTrigger render={<Button variant="ghost" size="icon" className="rounded-full text-slate-700 lg:hidden" />}><Menu className="size-5" /></SheetTrigger>
                        <SheetContent side="left" className="w-72 p-0 [&_[data-slot=sheet-close]]:hidden">
                            <SheetHeader className="sr-only"><SheetTitle>Admin navigation</SheetTitle></SheetHeader>
                            <AdminSidebar variant="mobile" onNavItemClick={() => setMobileOpen(false)} />
                        </SheetContent>
                    </Sheet>
                    <div className="hidden items-center gap-3 border-r border-slate-100 pr-5 md:flex">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm"><ShieldCheck className="size-4" /></div>
                        <div><p className="text-[13px] font-black text-slate-900">Nexions</p><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Control center</p></div>
                    </div>
                </div>
                <div className="hidden max-w-xl flex-1 items-center md:flex">
                    <div className="group relative w-full">
                        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500" />
                        <Input placeholder="Search users, stores, orders..." className="h-10 rounded-full border-transparent bg-slate-50 pl-10 pr-12 text-sm font-medium focus-visible:border-orange-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-orange-500/10" />
                        <kbd className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[9px] font-bold text-slate-400 shadow-sm"><Command className="size-3" />K</kbd>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-[10px] font-bold text-emerald-700 sm:flex"><span className="size-2 rounded-full bg-emerald-500" />All systems operational</div>
                    <div className="rounded-full"><NotificationDropdown triggerClassName="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" /></div>
                    <div className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />
                    <DropdownMenu>
                        <DropdownMenuTrigger render={<button className="rounded-full outline-none transition hover:scale-105 focus-visible:ring-2 focus-visible:ring-orange-500" />}>
                            <Avatar className="size-9 ring-2 ring-orange-500/20 ring-offset-2"><AvatarImage src={user?.profile?.avatar ?? undefined} alt={user?.name} /><AvatarFallback className="bg-slate-900 text-xs font-black text-white">{initials}</AvatarFallback></Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="mt-2 w-72 rounded-3xl border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/50">
                            <div className="mb-2 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                <Avatar className="size-10"><AvatarImage src={user?.profile?.avatar ?? undefined} /><AvatarFallback className="bg-orange-100 text-xs font-black text-orange-700">{initials}</AvatarFallback></Avatar>
                                <div className="min-w-0"><p className="truncate text-sm font-black text-slate-900">{user?.name || "Super Admin"}</p><p className="truncate text-[11px] font-medium text-slate-500">{user?.email}</p></div>
                            </div>
                            <DropdownMenuItem onClick={() => navigate("/account/settings")} className="cursor-pointer gap-3 rounded-2xl px-3 py-2.5 text-xs font-bold"><UserRound className="size-4 text-slate-400" /> Edit profile & security</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate("/superadmin/settings")} className="cursor-pointer gap-3 rounded-2xl px-3 py-2.5 text-xs font-bold"><Settings className="size-4 text-slate-400" /> Platform settings</DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1.5" />
                            <DropdownMenuItem onClick={() => logout.mutate()} className="cursor-pointer gap-3 rounded-2xl px-3 py-2.5 text-xs font-bold text-red-600 focus:bg-red-50 focus:text-red-700"><LogOut className="size-4" /> Sign out</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
        </div>
    );
};
