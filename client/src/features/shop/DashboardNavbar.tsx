import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Search, Bell, Plus, Menu, User as UserIcon,
    Settings, LogOut, Command, ExternalLink,
    Sparkles
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { useAuthStore } from "@/store/auth.store";
import { useLogout } from "@/features/auth/auth.hooks";
import { DashboardSidebar } from "./DashboardSidebar";
import { useMyShops } from "./shop.hooks";

export function DashboardNavbar() {
    const user = useAuthStore((state) => state.user);
    const logout = useLogout();
    const navigate = useNavigate();
    const { shopId } = useParams<{ shopId: string }>();
    const { data: shopsResponse } = useMyShops();
    const activeShop = shopsResponse?.data?.find((shop) => shop.id === shopId);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const initials = user?.name
        ?.split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "US";

    return (
        <div className="sticky top-0 z-40 w-full bg-slate-50 pt-3 px-3 pb-2 md:pt-4 md:px-6 dark:bg-[#0b0d12]">
            <header className="flex items-center justify-between gap-4 w-full h-16 px-3 md:px-5 bg-white border border-slate-200/70 rounded-full shadow-sm dark:border-white/10 dark:!bg-[#171a21] dark:shadow-black/20">
                <div className="flex items-center gap-3 md:gap-5">
                    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                        <SheetTrigger
                            render={
                                <Button variant="ghost" size="icon" className="lg:hidden text-slate-700 hover:bg-slate-100 rounded-full">
                                    <Menu className="size-5" />
                                </Button>
                            }
                        />
                        <SheetContent
                            side="left"
                            className="p-0 w-72 bg-white border-r border-slate-200 text-slate-900 [&_[data-slot=sheet-close]]:hidden"
                        >
                            <SheetHeader className="sr-only">
                                <SheetTitle>Navigation Menu</SheetTitle>
                            </SheetHeader>
                            <DashboardSidebar
                                variant="mobile"
                                onNavItemClick={() => setIsMobileOpen(false)}
                            />
                        </SheetContent>
                    </Sheet>

                    {/* SaaS Workspace Switcher / Logo */}
                    <div className="hidden md:flex items-center gap-3 pr-5 border-r border-slate-100 cursor-pointer group">
                        <div className="size-9 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm shadow-orange-500/20">
                            <Sparkles className="size-4 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                                Nexions
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                Pro Plan
                            </span>
                        </div>
                    </div>
                </div>

                {/* CENTER SECTION: Search */}
                <div className="flex-1 max-w-xl flex items-center gap-3">
                    <div className="relative flex-1 hidden md:block group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                        <Input
                            type="search"
                            placeholder="Search orders, products, customers..."
                            className="pl-10 pr-12 h-10 bg-slate-50 border-transparent focus-visible:bg-white focus-visible:border-orange-500 focus-visible:ring-4 focus-visible:ring-orange-500/10 rounded-full text-sm font-medium transition-all"
                        />
                        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-slate-200 text-[9px] font-bold text-slate-400 shadow-sm">
                            <Command className="size-3" /> K
                        </kbd>
                    </div>
                </div>

                {/* RIGHT SECTION */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <Button
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold h-9 px-4 shadow-sm shadow-orange-500/20 transition-all hover:shadow-orange-500/40 hover:-translate-y-0.5 hidden sm:flex gap-1.5 cursor-pointer"
                        onClick={() => navigate("/shops/new")}
                    >
                        <Plus className="size-4" />
                        <span>Create Shop</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="hidden sm:inline-flex rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 size-9 cursor-pointer"
                        onClick={() => window.open(activeShop ? `/${activeShop.slug}` : "/", "_blank")}
                        title="View Live Store"
                    >
                        <ExternalLink className="size-4" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <Button variant="ghost" size="icon" className="relative text-slate-600 hover:bg-slate-100 rounded-full size-9 transition-colors cursor-pointer">
                                    <Bell className="size-4" />
                                    <span className="absolute top-2 right-2.5 size-2 bg-orange-500 rounded-full ring-2 ring-white" />
                                </Button>
                            }
                        />
                        <DropdownMenuContent align="end" className="w-80 p-3 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50">
                            <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-slate-100">
                                <p className="text-xs font-black text-slate-900">Notifications</p>
                                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">2 New</span>
                            </div>
                            <div className="p-2 hover:bg-slate-50 rounded-2xl cursor-pointer transition-colors">
                                <p className="text-[13px] text-slate-800 font-medium">New order #1024 received</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">2 minutes ago</p>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <button className="outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-orange-500 rounded-full ml-1 cursor-pointer">
                                    <Avatar className="size-9 ring-2 ring-orange-500/20 ring-offset-2 ring-offset-white shadow-sm">
                                        <AvatarImage src={user?.profile?.avatar ?? undefined} alt={user?.name} />
                                        <AvatarFallback className="bg-slate-900 text-white text-xs font-black">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                </button>
                            }
                        />
                        <DropdownMenuContent align="end" className="w-64 mt-2 p-2 rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
                            <div className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 mb-2 flex items-center gap-3">
                                <Avatar className="size-10">
                                    <AvatarImage src={user?.profile?.avatar ?? undefined} alt={user?.name} />
                                    <AvatarFallback className="bg-orange-100 text-orange-700 text-xs font-black">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col overflow-hidden">
                                    <p className="text-sm font-black text-slate-900 truncate">{user?.name}</p>
                                    <p className="text-[11px] font-medium text-slate-500 truncate">{user?.email}</p>
                                </div>
                            </div>
                            <DropdownMenuGroup>
                                <DropdownMenuItem onClick={() => navigate("/account/settings")} className="cursor-pointer gap-3 py-2.5 px-3 rounded-2xl text-xs font-bold text-slate-700 focus:bg-slate-100 focus:text-slate-900">
                                    <UserIcon className="size-4 text-slate-400" /> Account Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/dashboard/shop/${shopId}/settings`)} className="cursor-pointer gap-3 py-2.5 px-3 rounded-2xl text-xs font-bold text-slate-700 focus:bg-slate-100 focus:text-slate-900">
                                    <Settings className="size-4 text-slate-400" /> Workspace Settings
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator className="my-1.5 bg-slate-100 mx-2" />
                            <DropdownMenuItem onClick={() => logout.mutate()} className="cursor-pointer gap-3 py-2.5 px-3 rounded-2xl text-xs font-bold text-red-600 focus:bg-red-50 focus:text-red-700">
                                <LogOut className="size-4" /> Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
        </div>
    );
}
