import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Search,
  Command,
  User,
  LogOut,
  Receipt,
  Package,
  Heart,
  RotateCcw,
  MapPin,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/auth.store";
import { useLogout } from "@/features/auth/auth.hooks";
import { useCart } from "@/features/cart/cart.hook";
import { useWishlist } from "../components/marketplace.hooks";
import { MarketplaceDesktopNav } from "../components/MarketplaceDesktopNav";
import { MarketplaceMobileMenu } from "../components/MarketplaceMobileMenu";
import { NotificationDropdown } from "@/features/notification/NotificationDropdown";
import {
  autoDetectDeliveryLocation,
  getStoredDeliveryLocation,
  getBrowserInstantLocation,
  DELIVERY_LOCATION_EVENT,
  type DeliveryLocation,
} from "../utils/deliveryLocation";
import { DeliveryLocationModal } from "../components/DeliveryLocationModal";

type CartGroup = { items: Array<{ quantity: number }> };

export const MarketplaceNavbar = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation>(
    () => getStoredDeliveryLocation() || getBrowserInstantLocation()
  );
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const { data: cartData } = useCart();
  const { data: wishlistItems = [] } = useWishlist();

  const cartItemCount =
    (cartData?.data?.groupedBy as CartGroup[] | undefined)?.reduce(
      (total, group) =>
        total + group.items.reduce((groupTotal, item) => groupTotal + item.quantity, 0),
      0
    ) ?? 0;

  const wishlistItemCount = wishlistItems.length;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Silently detect IP-based country in background (never prompts user for browser geolocation!)
    autoDetectDeliveryLocation().then((loc) => {
      if (loc) setDeliveryLocation(loc);
    });

    const handleLocationChange = (e: Event) => {
      const customEvent = e as CustomEvent<DeliveryLocation>;
      if (customEvent.detail) {
        setDeliveryLocation(customEvent.detail);
      }
    };

    window.addEventListener(DELIVERY_LOCATION_EVENT, handleLocationChange);
    return () => window.removeEventListener(DELIVERY_LOCATION_EVENT, handleLocationChange);
  }, []);

  return (
    <header className="sticky top-0 z-50 flex w-full flex-col select-none border-b border-slate-200 bg-white font-sans antialiased shadow-sm animate-fade-down">
      {/* Top Banner Strip */}
      <div className="w-full border-b border-slate-200 bg-white px-4 py-1.5 text-center text-xs font-semibold tracking-wide text-slate-700">
        <span className="hidden sm:inline">
          Next-Gen Physical E-Commerce Engine.{" "}
          <strong className="text-orange-500 underline decoration-orange-500/40">Enjoy Zero Fees on Your First Order.</strong>
        </span>
        <span className="sm:hidden">
          Next-Gen E-Commerce • <strong className="text-orange-500 underline decoration-orange-500/40">Zero Fees</strong>
        </span>
      </div>

      {/* Main Navbar Bar */}
      <div className={`w-full transition-all duration-300 ${isScrolled ? "bg-white/95 py-2 backdrop-blur-xl" : "bg-white py-3"}`}>
        <div className="flex w-full items-center justify-start gap-6 px-4 sm:px-6 lg:justify-between lg:px-10">
          <MarketplaceMobileMenu
            isAuthenticated={isAuthenticated}
            user={user}
            logout={() => logout()}
            isLoggingOut={isLoggingOut}
            wishlistItemCount={wishlistItemCount}
            deliveryLocation={deliveryLocation}
            onOpenLocationModal={() => setIsLocationModalOpen(true)}
          />

          {/* Search Box */}
          <form onSubmit={(event) => { event.preventDefault(); navigate(searchQuery.trim() ? `/?search=${encodeURIComponent(searchQuery.trim())}` : "/"); }} className="hidden xl:flex flex-1 max-w-xl relative items-center">
            <div className="relative w-full flex items-center">
              <Search className="absolute left-4 size-4 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search physical products, brands, or categories..."
                className="h-11 w-full rounded-full border border-slate-200/90 bg-[#F1F4F8] hover:bg-[#E8EDF3] dark:bg-zinc-800 dark:border-zinc-700 dark:hover:bg-zinc-750 pl-11 pr-28 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all focus-visible:bg-[#F1F4F8] dark:focus-visible:bg-zinc-800 focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-500/20 shadow-none"
              />
              <div className="absolute right-1.5 flex items-center gap-1.5">
                <div className="pointer-events-none hidden sm:flex items-center gap-1 rounded-lg border border-slate-200 bg-white/80 dark:bg-zinc-700 dark:border-zinc-600 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-300 shadow-xs">
                  <Command className="size-3" />
                  <span>NG</span>
                </div>
                <button
                  type="submit"
                  aria-label="Submit search"
                  className="size-8 rounded-full bg-[#F97316] hover:bg-[#EA580C] text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs active:scale-95"
                >
                  <Search className="size-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </form>

          <MarketplaceDesktopNav
            cartItemCount={cartItemCount}
            onCart={() => navigate("/cart")}
            wishlistItemCount={wishlistItemCount}
            onWishlist={() => navigate("/wishlist")}
          />

          {/* Deliver To Selector Button (Amazon / Alibaba style) */}
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="hidden shrink-0 items-center gap-2.5 border-l border-slate-200 pl-4 pr-1 py-1 text-left lg:flex hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer group"
            title={`Delivering to ${deliveryLocation.countryName}. Click to change delivery destination.`}
          >
            <div className="flex size-7 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 group-hover:bg-orange-100 transition-colors shrink-0">
              <MapPin className="size-3.5" />
            </div>
            <div className="flex flex-col text-left leading-tight min-w-0">
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Deliver to</span>
              <span className="flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-slate-100">
                <span aria-hidden="true" className="text-sm leading-none shrink-0">{deliveryLocation.flag}</span>
                <span className="truncate max-w-[110px]">{deliveryLocation.countryName}</span>
                <ChevronDown className="size-3 text-slate-400 group-hover:text-slate-600 shrink-0 transition-transform group-hover:translate-y-0.5" />
              </span>
            </div>
          </button>


          {/* Mobile Actions: Cart + Sign In (or User Menu) */}
          <div className="ml-auto flex items-center gap-3 sm:gap-3.5 lg:hidden">
            <button
              onClick={() => navigate("/cart")}
              className="relative flex size-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-2xs transition-all hover:border-orange-500 hover:bg-orange-50 hover:text-orange-600 active:scale-95"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="size-5.5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-orange-600 text-[10px] font-black text-white shadow-xs border-2 border-white">
                  {cartItemCount}
                </span>
              )}
            </button>

            {!isAuthenticated ? (
              <Link
                to="/login"
                className="group inline-flex items-center justify-center min-h-[40px] px-4 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50/60 transition-all cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
              >
                <span>Sign in</span>
                <ArrowRight className="size-3.5 ml-1.5 text-slate-400 group-hover:text-orange-600 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Open mobile account menu"
                  className="flex items-center gap-1 outline-none cursor-pointer"
                >
                  <div className="size-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-bold text-xs shadow-2xs">
                    {user?.name?.[0]?.toUpperCase() || <User className="size-4" />}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl border border-slate-200 bg-white p-1 shadow-2xl">
                  <div className="border-b border-slate-100 px-3 py-2">
                    <p className="text-[10px] font-medium text-slate-500">Signed in as</p>
                    <p className="text-xs font-bold text-slate-900 truncate">{user?.name || user?.email}</p>
                  </div>
                  <div className="space-y-0.5 p-1 text-slate-700 text-xs">
                    <DropdownMenuItem
                      onClick={() => navigate("/account/settings")}
                      className="cursor-pointer rounded-xl focus:bg-orange-50 focus:text-orange-600"
                    >
                      <User className="mr-2 size-4 text-slate-400" /> Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/orders")}
                      className="cursor-pointer rounded-xl focus:bg-orange-50 focus:text-orange-600"
                    >
                      <Receipt className="mr-2 size-4 text-slate-400" /> Your Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/shops")}
                      className="cursor-pointer rounded-xl focus:bg-orange-50 focus:text-orange-600"
                    >
                      <Package className="mr-2 size-4 text-slate-400" /> See Your Shops
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/wishlist")}
                      className="cursor-pointer rounded-xl focus:bg-rose-50 focus:text-rose-500"
                    >
                      <Heart className="mr-2 size-4 text-rose-400" /> My Wishlist
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="cursor-pointer rounded-xl text-rose-600 focus:bg-rose-50 focus:text-rose-600"
                    >
                      <LogOut className="mr-2 size-4 text-rose-500" /> Sign Out
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {/* Auth Actions */}
            {!isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="group inline-flex items-center justify-center min-h-[40px] px-5 rounded-full border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-200 font-bold text-xs hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50/60 transition-all cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                >
                  <span>Sign in</span>
                  <ArrowRight className="size-3.5 ml-1.5 text-slate-400 group-hover:text-orange-600 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <NotificationDropdown triggerClassName="p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-full transition-all cursor-pointer" />
                <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Open account menu"
                  className="flex items-center gap-2 outline-none group cursor-pointer"
                >
                  <div className="size-9 rounded-full bg-orange-50 border border-orange-200/80 flex items-center justify-center text-orange-500 group-hover:border-orange-500 transition-all">
                    <User className="size-4.5" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl border border-slate-200 bg-white p-1 shadow-2xl">
                  <div className="border-b border-slate-100 px-3 py-2.5">
                    <p className="text-[11px] font-medium text-slate-500">Signed in as</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{user?.name || user?.email}</p>
                  </div>
                  <div className="space-y-0.5 p-1 text-slate-700">
                    <DropdownMenuItem
                      onClick={() => navigate("/account/settings")}
                      className="cursor-pointer rounded-xl focus:bg-orange-50 focus:text-orange-600"
                    >
                      <User className="mr-2 size-4 text-slate-400" /> Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/shops")}
                      className="cursor-pointer rounded-xl focus:bg-orange-50 focus:text-orange-600"
                    >
                      <Package className="mr-2 size-4 text-slate-400" /> See Your Shops
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/orders")}
                      className="cursor-pointer rounded-xl focus:bg-orange-50 focus:text-orange-600"
                    >
                      <Receipt className="mr-2 size-4 text-slate-400" />Your Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/returns")}
                      className="cursor-pointer rounded-xl focus:bg-orange-50 focus:text-orange-600"
                    >
                      <RotateCcw className="mr-2 size-4 text-slate-400" /> Returns & Refunds
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/wishlist")}
                      className="cursor-pointer rounded-xl focus:bg-rose-50 focus:text-rose-500"
                    >
                      <Heart className="mr-2 size-4 text-rose-400" />
                      <span>My Wishlist</span>
                      {wishlistItemCount > 0 && (
                        <span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400">
                          {wishlistItemCount}
                        </span>
                      )}
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator className="bg-slate-100" />
                  <div className="p-1">
                    <DropdownMenuItem
                      disabled={isLoggingOut}
                      onClick={() => logout()}
                      className="cursor-pointer rounded-xl text-red-500 focus:bg-red-50 focus:text-red-500"
                    >
                      <LogOut className="mr-2 size-4" /> {isLoggingOut ? "Signing Out..." : "Sign Out"}
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            )}
          </div>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); navigate(searchQuery.trim() ? `/?search=${encodeURIComponent(searchQuery.trim())}` : "/"); }} className="relative mx-4 mt-3 lg:hidden flex items-center">
          <div className="relative w-full flex items-center">
            <Search className="absolute left-3.5 size-4 text-slate-400 pointer-events-none" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search products, brands and categories..."
              className="h-10 w-full rounded-full border border-slate-200/90 bg-[#F1F4F8] hover:bg-[#E8EDF3] dark:bg-zinc-800 dark:border-zinc-700 dark:hover:bg-zinc-750 pl-10 pr-12 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all focus-visible:bg-[#F1F4F8] dark:focus-visible:bg-zinc-800 focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-500/20 shadow-none"
            />
            <button
              type="submit"
              aria-label="Submit search"
              className="absolute right-1 size-8 rounded-full bg-[#F97316] hover:bg-[#EA580C] text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs active:scale-95"
            >
              <Search className="size-4 stroke-[2.5]" />
            </button>
          </div>
        </form>

        {/* Mobile Deliver To Strip (Amazon / Alibaba style) */}
        <div className="mx-4 mt-2 mb-1 flex items-center justify-start lg:hidden">
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-slate-100/80 hover:bg-slate-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer text-left"
          >
            <MapPin className="size-3 text-orange-500 shrink-0" />
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Deliver to</span>
            <span className="font-bold flex items-center gap-1 text-[11px] text-slate-900 dark:text-slate-100">
              <span aria-hidden="true">{deliveryLocation.flag}</span>
              <span className="truncate max-w-[140px]">{deliveryLocation.countryName}</span>
            </span>
            <ChevronDown className="size-3 text-slate-400" />
          </button>
        </div>
      </div>

      <DeliveryLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={deliveryLocation}
      />
    </header>
  );
};
