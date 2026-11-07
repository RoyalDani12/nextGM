import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Search, Plus, Menu, User as UserIcon,
    Settings, LogOut, Command, ExternalLink,
    Store,
    ShieldCheck
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
import { NotificationDropdown } from "@/features/notification/NotificationDropdown";

export function DashboardNavbar() {
    const user = useAuthStore((state) => state.user);
    const logout = useLogout();
    const navigate = useNavigate();
    const { shopId = "" } = useParams<{ shopId: string }>();
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
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 md:px-7 ds-shadow-xs transition-all duration-300">
            <div className="flex items-center gap-3 md:gap-4">
                {/* Mobile Drawer Trigger */}
                <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                    <SheetTrigger
                        render={
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
                            >
                                <Menu className="size-5" />
                            </Button>
                        }
                    />
                    <SheetContent
                        side="left"
                        className="p-0 w-[300px] sm:w-[320px] max-w-[85vw] bg-[#533257] border-r border-white/10 text-white shadow-2xl [&_[data-slot=sheet-close]]:hidden"
                    >
                        <SheetHeader className="sr-only">
                            <SheetTitle>Store Navigation</SheetTitle>
                        </SheetHeader>
                        <DashboardSidebar
                            variant="mobile"
                            onNavItemClick={() => setIsMobileOpen(false)}
                        />
                    </SheetContent>
                </Sheet>

                {/* Mobile Store Name (hidden on desktop) */}
                <div className="flex items-center gap-2 lg:hidden">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white">
                        <Store className="size-4" />
                    </div>
                    <span className="text-xs font-black tracking-tight text-slate-900 truncate max-w-[130px]">
                        {activeShop?.profile?.name || "Merchant"}
                    </span>
                </div>

                {/* Desktop Store Breadcrumb & Status */}
                <div className="hidden lg:flex items-center gap-2.5 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 font-bold text-slate-800">
                            <Store className="size-4 text-orange-500" />
                            {activeShop?.profile?.name || "Store"}
                        </span>
                        <span className="text-slate-300">/</span>
                        <span className="font-mono text-[11px] text-slate-500 font-medium">
                            {activeShop?.slug ? `/${activeShop.slug}` : "Workspace"}
                        </span>
                    </div>

                    {activeShop?.legalInfo?.ownerKycStatus === 'VERIFIED' ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100/70 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 shadow-2xs">
                            <ShieldCheck className="size-3 text-emerald-600" />
                            Verified Merchant
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 shadow-2xs">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Store
                        </span>
                    )}
                </div>
            </div>

            {/* CENTER SEARCH */}
            <div className="flex-1 max-w-md hidden md:flex items-center">
                <div className="relative w-full group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                    <Input
                        type="search"
                        placeholder="Search products, orders, customers..."
                        className="pl-10 pr-12 h-9 bg-slate-50/80 border-slate-200/80 focus-visible:bg-white focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-500/20 rounded-xl text-xs font-medium transition-all"
                    />
                    <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-[9px] font-bold text-slate-400 shadow-2xs">
                        <Command className="size-2.5" /> K
                    </kbd>
                </div>
            </div>

            {/* RIGHT CONTROLS */}
            <div className="flex items-center gap-2 sm:gap-2.5">
                {/* Add Product Shortcut */}
                <Button
                    size="sm"
                    className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl font-bold h-9 px-3.5 shadow-sm shadow-orange-500/20 transition-all hover:shadow-orange-500/35 hover:-translate-y-0.5 hidden sm:flex items-center gap-1.5 cursor-pointer text-xs"
                    onClick={() => navigate(`/dashboard/shop/${shopId}/products`)}
                >
                    <Plus className="size-3.5" />
                    <span>Add Product</span>
                </Button>

                {/* View Public Storefront Link */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 size-9 cursor-pointer transition-colors"
                    onClick={() => window.open(activeShop ? `/${activeShop.slug}` : "/", "_blank")}
                    title="Open public storefront"
                >
                    <ExternalLink className="size-4" />
                </Button>

                {/* Notifications */}
                <div className="rounded-xl">
                    <NotificationDropdown shopId={shopId} />
                </div>

                <div className="h-5 w-px bg-slate-200 mx-0.5 hidden sm:block" />

                {/* Avatar Profile Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <button className="outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-orange-500 rounded-full cursor-pointer">
                                <Avatar className="size-9 ring-2 ring-orange-500/25 ring-offset-2 hover:ring-orange-500/50 transition-all">
                                    <AvatarImage src={user?.profile?.avatar ?? undefined} alt={user?.name} />
                                    <AvatarFallback className="bg-slate-900 text-white text-xs font-black">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                            </button>
                        }
                    />
                    <DropdownMenuContent align="end" className="w-68 mt-2 p-2 rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
                        <div className="px-3.5 py-3 bg-slate-50 rounded-2xl border border-slate-100 mb-2 flex items-center gap-3">
                            <Avatar className="size-9">
                                <AvatarImage src={user?.profile?.avatar ?? undefined} alt={user?.name} />
                                <AvatarFallback className="bg-orange-100 text-orange-700 text-xs font-black">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                                <p className="text-xs font-black text-slate-900 truncate">{user?.name || "Merchant"}</p>
                                <p className="text-[11px] font-medium text-slate-500 truncate">{user?.email}</p>
                            </div>
                        </div>
                        <DropdownMenuGroup>
                            <DropdownMenuItem
                                onClick={() => navigate("/account/settings")}
                                className="cursor-pointer gap-2.5 py-2 px-3 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                <UserIcon className="size-4 text-slate-400" /> Account Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => navigate(`/dashboard/shop/${shopId}/settings`)}
                                className="cursor-pointer gap-2.5 py-2 px-3 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                <Settings className="size-4 text-slate-400" /> Store Settings
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator className="my-1.5 bg-slate-100" />
                        <DropdownMenuItem
                            onClick={() => logout.mutate()}
                            className="cursor-pointer gap-2.5 py-2 px-3 rounded-xl text-xs font-semibold text-red-600 focus:bg-red-50 focus:text-red-700"
                        >
                            <LogOut className="size-4" /> Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
