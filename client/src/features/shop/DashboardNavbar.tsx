import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Menu, User as UserIcon,
    Settings, LogOut, ExternalLink,
    Store,
    ShieldCheck
} from "lucide-react";
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

    const isLive = activeShop?.status?.toUpperCase() === "ACTIVE";
    const isPending = activeShop?.status?.toUpperCase() === "PENDING";
    const isRejected = activeShop?.status?.toUpperCase() === "REJECTED";

    const initials = user?.name
        ?.split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "US";

    return (
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-6 transition-all duration-300">
            <div className="flex items-center gap-3">
                {/* Mobile Drawer Trigger (only when shop is live) */}
                {isLive && (
                    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                        <SheetTrigger
                            render={
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="lg:hidden size-8 text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer"
                                >
                                    <Menu className="size-4.5" />
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
                )}

                {/* Mobile Store Name (hidden on desktop) */}
                <div className="flex items-center gap-2 lg:hidden">
                    <div className="flex size-7 items-center justify-center rounded-md bg-orange-500 text-white shadow-xs">
                        <Store className="size-3.5" />
                    </div>
                    <span className="text-xs font-semibold tracking-tight text-slate-900 truncate max-w-[140px]">
                        {activeShop?.profile?.name || "Merchant"}
                    </span>
                    {isPending && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                            Review
                        </span>
                    )}
                </div>

                {/* Desktop Store Breadcrumb & Status */}
                <div className="hidden lg:flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <Store className="size-3.5 text-orange-500" />
                            {activeShop?.profile?.name || "Store"}
                        </span>
                        <span className="text-slate-300">/</span>
                        <span className="font-mono text-[11px] text-slate-500 font-medium">
                            {activeShop?.slug ? `/${activeShop.slug}` : "Workspace"}
                        </span>
                    </div>

                    {isPending ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Under Review
                        </span>
                    ) : isRejected ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                            Rejected
                        </span>
                    ) : activeShop?.legalInfo?.ownerKycStatus === 'VERIFIED' ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                            <ShieldCheck className="size-3 text-emerald-600" />
                            Verified Merchant
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Store
                        </span>
                    )}
                </div>
            </div>

            {/* RIGHT CONTROLS */}
            <div className="flex items-center gap-2">
                {/* View Public Storefront Link (only when live) */}
                {isLive && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition-colors"
                        onClick={() => window.open(activeShop ? `/${activeShop.slug}` : "/", "_blank")}
                        title="Open public storefront"
                    >
                        <ExternalLink className="size-3.5" />
                    </Button>
                )}

                {/* Notifications */}
                <div>
                    <NotificationDropdown shopId={shopId} />
                </div>

                <div className="h-4 w-px bg-slate-200 mx-0.5" />

                {/* Avatar Profile Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <button className="outline-none transition-transform hover:scale-102 focus-visible:ring-2 focus-visible:ring-orange-500 rounded-full cursor-pointer">
                                <Avatar className="size-8 ring-1 ring-slate-200 hover:ring-slate-300 transition-all">
                                    <AvatarImage src={user?.profile?.avatar ?? undefined} alt={user?.name} />
                                    <AvatarFallback className="bg-slate-900 text-white text-[11px] font-semibold">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                            </button>
                        }
                    />
                    <DropdownMenuContent align="end" className="w-64 mt-1.5 p-1 rounded-lg border border-slate-200 bg-white shadow-lg">
                        <div className="px-3 py-2.5 bg-slate-50/70 rounded-md border border-slate-100 mb-1 flex items-center gap-2.5">
                            <Avatar className="size-8">
                                <AvatarImage src={user?.profile?.avatar ?? undefined} alt={user?.name} />
                                <AvatarFallback className="bg-orange-100 text-orange-700 text-[11px] font-semibold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                                <p className="text-xs font-semibold text-slate-900 truncate">{user?.name || "Merchant"}</p>
                                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                            </div>
                        </div>
                        <DropdownMenuGroup>
                            <DropdownMenuItem
                                onClick={() => navigate("/account/settings")}
                                className="cursor-pointer gap-2 py-1.5 px-2.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 focus:bg-slate-50"
                            >
                                <UserIcon className="size-3.5 text-slate-400" /> Account Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => navigate(`/dashboard/shop/${shopId}/settings`)}
                                className="cursor-pointer gap-2 py-1.5 px-2.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 focus:bg-slate-50"
                            >
                                <Settings className="size-3.5 text-slate-400" /> Store Settings
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator className="my-1 bg-slate-100" />
                        <DropdownMenuItem
                            onClick={() => logout.mutate()}
                            className="cursor-pointer gap-2 py-1.5 px-2.5 rounded-md text-xs font-medium text-red-600 focus:bg-red-50 focus:text-red-700"
                        >
                            <LogOut className="size-3.5" /> Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
