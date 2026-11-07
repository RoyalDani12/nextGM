import { useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  Compass,
  Heart,
  HelpCircle,
  Package,
  Store,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
  Receipt,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useMarketplaceCategories } from "./marketplace.hooks";
import { NotificationDropdown } from "@/features/notification/NotificationDropdown";
import { useUnreadNotificationCount } from "@/features/notification/notification.hooks";

interface MarketplaceMobileMenuProps {
  isAuthenticated: boolean;
  user?: {
    id: string;
    name?: string;
    email?: string;
    role?: string;
  } | null;
  logout: () => void;
  isLoggingOut: boolean;
  wishlistItemCount?: number;
}

export const MarketplaceMobileMenu = ({
  isAuthenticated,
  user,
  logout,
  isLoggingOut,
  wishlistItemCount = 0,
}: MarketplaceMobileMenuProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { data: categories = [] } = useMarketplaceCategories();
  const { data: countData } = useUnreadNotificationCount(undefined, isAuthenticated);
  const unreadCount = countData?.unreadCount ?? 0;

  const goTo = (path: string) => {
    navigate(path);
    setIsMobileOpen(false);
    if (path.includes("#marketplace-deals")) {
      setTimeout(() => document.getElementById("marketplace-deals")?.scrollIntoView({ behavior: "smooth" }), 100);
    } else if (path.includes("#marketplace-products")) {
      setTimeout(() => document.getElementById("marketplace-products")?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const currentCategorySlug = searchParams.get("categorySlug");

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/" && !currentCategorySlug;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
      <div className="flex items-center gap-2">
        <SheetTrigger
          className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-colors cursor-pointer outline-none"
          aria-label="Open navigation menu"
        >
          <Menu className="size-6" />
        </SheetTrigger>

        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex items-center justify-center size-8 rounded-xl bg-slate-900 overflow-hidden shadow-xs group-hover:scale-105 transition-transform">
            <img
              src="/ChatGPT Image Sep 5, 2026, 12_33_26 AM.png"
              alt="NextG Logo"
              className="size-full object-cover"
            />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900">
            NextG<span className="text-orange-500">.</span>
          </span>
        </Link>
      </div>

      <SheetContent
        side="left"
        className="w-[310px] sm:w-[350px] bg-white text-slate-800 border-r border-slate-200/90 p-0 overflow-y-auto flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden shadow-xs">
              <img
                src="/ChatGPT Image Sep 5, 2026, 12_33_26 AM.png"
                alt="NextG Logo"
                className="size-full object-cover"
              />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900">NextG.</span>
              <p className="text-[10px] font-semibold text-slate-400">Multi-Vendor Marketplace</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4 flex-1">
          {/* User Account / Auth Card */}
          {isAuthenticated && user ? (
            <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-50 to-orange-50/40 p-3.5 space-y-3 shadow-xs">
              {/* Profile summary */}
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-full bg-orange-500 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0 shadow-orange-500/25">
                  {user.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {user.name || "My Account"}
                    </p>
                    {user.role && user.role !== "CUSTOMER" && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700">
                        {user.role.replace("_", " ")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>

              {/* Quick Actions Row: Notifications & Wishlist & Orders */}
              <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-200/50">
                {/* Notifications */}
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:bg-slate-50 transition-colors">
                  <NotificationDropdown
                    align="start"
                    triggerClassName="size-7 flex items-center justify-center text-slate-700 hover:text-slate-900"
                  />
                  <span className="text-[10px] font-bold text-slate-600 mt-1">
                    Alerts {unreadCount > 0 && `(${unreadCount})`}
                  </span>
                </div>

                {/* Wishlist */}
                <button
                  onClick={() => goTo("/wishlist")}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl bg-white border shadow-2xs transition-colors cursor-pointer ${
                    isActive("/wishlist")
                      ? "border-rose-200 bg-rose-50/50 text-rose-600"
                      : "border-slate-200/80 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="relative size-7 flex items-center justify-center">
                    <Heart className="size-4.5 text-rose-500" />
                    {wishlistItemCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 px-0.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-extrabold text-white">
                        {wishlistItemCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 mt-1">Wishlist</span>
                </button>

                {/* Orders */}
                <button
                  onClick={() => goTo("/customer-order")}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl bg-white border shadow-2xs transition-colors cursor-pointer ${
                    isActive("/customer-order")
                      ? "border-orange-200 bg-orange-50/50 text-orange-600"
                      : "border-slate-200/80 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="size-7 flex items-center justify-center">
                    <Receipt className="size-4.5 text-orange-500" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 mt-1">Orders</span>
                </button>

                <button
                  onClick={() => goTo("/returns")}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl bg-white border shadow-2xs transition-colors cursor-pointer ${
                    isActive("/returns")
                      ? "border-orange-200 bg-orange-50/50 text-orange-600"
                      : "border-slate-200/80 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="size-7 flex items-center justify-center">
                    <RotateCcw className="size-4.5 text-orange-500" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 mt-1">Returns</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 space-y-3">
              <div>
                <p className="text-sm font-bold text-slate-900">Welcome to NextG</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sign in to track orders, save favorite items, and receive notifications.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => goTo("/login")}
                  className="flex-1 h-9 rounded-xl text-xs font-bold border-slate-300 text-slate-700 hover:bg-white"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => goTo("/register")}
                  className="flex-1 h-9 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/25"
                >
                  Join Free
                </Button>
              </div>
            </div>
          )}

          {/* Primary Navigation with Active Highlighting */}
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Marketplace
            </p>

            <button
              onClick={() => goTo("/")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive("/")
                  ? "bg-orange-50 text-orange-600 shadow-xs"
                  : "text-slate-700 hover:bg-slate-100/70 hover:text-slate-900"
              }`}
            >
              <span className="flex items-center gap-3">
                <Compass className="size-4" /> Explore Catalog
              </span>
              <ChevronRight className="size-3.5 opacity-40" />
            </button>

            <button
              onClick={() => goTo("/how-it-works")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive("/how-it-works")
                  ? "bg-orange-50 text-orange-600 shadow-xs"
                  : "text-slate-700 hover:bg-slate-100/70 hover:text-slate-900"
              }`}
            >
              <span className="flex items-center gap-3">
                <HelpCircle className="size-4" /> How It Works
              </span>
              <ChevronRight className="size-3.5 opacity-40" />
            </button>

            {isAuthenticated && (
              <>
                <button
                  onClick={() => goTo("/customer-order")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive("/customer-order")
                      ? "bg-orange-50 text-orange-600 shadow-xs"
                      : "text-slate-700 hover:bg-slate-100/70 hover:text-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Package className="size-4" /> My Orders
                  </span>
                  <ChevronRight className="size-3.5 opacity-40" />
                </button>

                <button
                  onClick={() => goTo("/wishlist")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive("/wishlist")
                      ? "bg-orange-50 text-orange-600 shadow-xs"
                      : "text-slate-700 hover:bg-slate-100/70 hover:text-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Heart className="size-4" /> Wishlist
                  </span>
                  {wishlistItemCount > 0 && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                      {wishlistItemCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => goTo("/shops")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive("/shops")
                      ? "bg-orange-50 text-orange-600 shadow-xs"
                      : "text-slate-700 hover:bg-slate-100/70 hover:text-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Store className="size-4" /> My Stores
                  </span>
                  <ChevronRight className="size-3.5 opacity-40" />
                </button>

                <button
                  onClick={() => goTo("/account/settings")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive("/account/settings")
                      ? "bg-orange-50 text-orange-600 shadow-xs"
                      : "text-slate-700 hover:bg-slate-100/70 hover:text-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Settings className="size-4" /> Profile & Settings
                  </span>
                  <ChevronRight className="size-3.5 opacity-40" />
                </button>
              </>
            )}
          </div>

          {/* Shop Categories Accordion (Clean, no weird diamond icons) */}
          <div className="pt-2 border-t border-slate-100">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Browse Categories
            </p>

            <Accordion className="px-1 space-y-1">
              {categories.map((parent) => (
                <AccordionItem
                  key={parent.id}
                  value={parent.id}
                  className="border-b border-slate-100/80 rounded-xl overflow-hidden"
                >
                  <AccordionTrigger className="min-h-10 px-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 hover:no-underline rounded-lg transition-colors">
                    <span className="flex items-center gap-2">
                      <span>{parent.name}</span>
                      {parent.productCount > 0 && (
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                          {parent.productCount}
                        </span>
                      )}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-2 pt-1 pl-4 space-y-1">
                    <button
                      onClick={() => goTo(`/?categorySlug=${parent.slug}#marketplace-products`)}
                      className={`flex min-h-8 w-full items-center justify-between rounded-lg px-2.5 text-left text-xs transition-colors ${
                        currentCategorySlug === parent.slug
                          ? "bg-orange-50 font-bold text-orange-600"
                          : "font-semibold text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span>All {parent.name}</span>
                      <span className="text-[10px] text-slate-400">{parent.productCount}</span>
                    </button>

                    {parent.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => goTo(`/?categorySlug=${child.slug}#marketplace-products`)}
                        className={`flex min-h-8 w-full items-center justify-between rounded-lg px-2.5 text-left text-xs transition-colors ${
                          currentCategorySlug === child.slug
                            ? "bg-orange-50 font-bold text-orange-600"
                            : "font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        }`}
                      >
                        <span>{child.name}</span>
                        {child.productCount > 0 && (
                          <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-500 font-semibold">
                            {child.productCount}
                          </span>
                        )}
                      </button>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Become a Seller Banner Button */}
          <div className="pt-2">
            <button
              onClick={() => goTo("/shops/new")}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md shadow-orange-500/25 hover:opacity-95 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Store className="size-4.5" />
                <div className="text-left">
                  <p className="text-xs font-black">Open Your Store</p>
                  <p className="text-[10px] text-orange-100">Zero fees on first order</p>
                </div>
              </div>
              <ChevronRight className="size-4 opacity-75" />
            </button>
          </div>
        </div>

        {/* Footer / Logout */}
        {isAuthenticated && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <Button
              variant="ghost"
              disabled={isLoggingOut}
              onClick={() => {
                logout();
                setIsMobileOpen(false);
              }}
              className="w-full justify-start h-10 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
            >
              <LogOut className="mr-2.5 size-4" />
              {isLoggingOut ? "Signing Out..." : "Sign Out"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
