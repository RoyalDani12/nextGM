import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Search, Command, User, LogOut, Receipt, Package, Heart, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/auth.store";
import { useLogout } from "@/features/auth/auth.hooks";
import { useCart } from "@/features/cart/cart.hook";
import { useWishlist } from "../components/marketplace.hooks";
import { MarketplaceDesktopNav } from "../components/MarketplaceDesktopNav";
import { MarketplaceMobileMenu } from "../components/MarketplaceMobileMenu";
import { NotificationDropdown } from "@/features/notification/NotificationDropdown";

type CartGroup = { items: Array<{ quantity: number }> };
type DeliveryLocation = { countryCode: string; countryName: string };
type ReverseGeocodeResponse = { countryCode?: string; countryName?: string };

const timezoneCountries: Record<string, DeliveryLocation> = {
  "Africa/Addis_Ababa": { countryCode: "ET", countryName: "Ethiopia" },
  "Africa/Cairo": { countryCode: "EG", countryName: "Egypt" },
  "Africa/Johannesburg": { countryCode: "ZA", countryName: "South Africa" },
  "Africa/Lagos": { countryCode: "NG", countryName: "Nigeria" },
  "Africa/Nairobi": { countryCode: "KE", countryName: "Kenya" },
  "America/Chicago": { countryCode: "US", countryName: "United States" },
  "America/Denver": { countryCode: "US", countryName: "United States" },
  "America/Los_Angeles": { countryCode: "US", countryName: "United States" },
  "America/New_York": { countryCode: "US", countryName: "United States" },
  "Asia/Dubai": { countryCode: "AE", countryName: "United Arab Emirates" },
  "Asia/Kolkata": { countryCode: "IN", countryName: "India" },
  "Asia/Tokyo": { countryCode: "JP", countryName: "Japan" },
  "Australia/Sydney": { countryCode: "AU", countryName: "Australia" },
  "Europe/Berlin": { countryCode: "DE", countryName: "Germany" },
  "Europe/London": { countryCode: "GB", countryName: "United Kingdom" },
  "Europe/Paris": { countryCode: "FR", countryName: "France" },
};

function getFallbackDeliveryLocation(): DeliveryLocation {
  const locale = navigator.languages?.[0] || navigator.language;
  const localeRegion = locale?.match(/[-_]([A-Z]{2})$/i)?.[1]?.toUpperCase();

  if (localeRegion) {
    try {
      const countryName = new Intl.DisplayNames([locale], { type: "region" }).of(localeRegion);
      if (countryName) return { countryCode: localeRegion, countryName };
    } catch {
      // Fall through to the timezone mapping when region names are unavailable.
    }
  }

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return timezoneCountries[timezone] || { countryCode: "US", countryName: "United States" };
}

async function detectDeliveryLocation(signal: AbortSignal): Promise<DeliveryLocation> {
  if (!navigator.geolocation) throw new Error("Geolocation is not supported by this browser.");

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: 300000,
      timeout: 10000,
    });
  });
  const { latitude, longitude } = position.coords;
  const response = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
    { signal },
  );
  if (!response.ok) throw new Error(`Reverse geocoding failed with status ${response.status}.`);
  const location = (await response.json()) as ReverseGeocodeResponse;
  if (!location.countryCode || !location.countryName) throw new Error("Reverse geocoding returned no country.");
  return { countryCode: location.countryCode.toUpperCase(), countryName: location.countryName };
}

function countryFlag(countryCode: string) {
  return countryCode.replace(/[A-Z]/g, (letter) => String.fromCodePoint(letter.charCodeAt(0) + 127397));
}

export const MarketplaceNavbar = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation | null>(null);
  const [locationSource, setLocationSource] = useState<"locating" | "detected" | "fallback">("locating");

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
    const controller = new AbortController();
    detectDeliveryLocation(controller.signal)
      .then((location) => {
        setDeliveryLocation(location);
        setLocationSource("detected");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.warn("Precise delivery location detection failed; using browser fallback.", error);
        setDeliveryLocation(getFallbackDeliveryLocation());
        setLocationSource("fallback");
      });
    return () => controller.abort();
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

          <div className="hidden shrink-0 items-center gap-2 border-l border-slate-200 pl-5 text-left lg:flex" title={deliveryLocation ? `Delivery location: ${deliveryLocation.countryName}` : "Detecting your delivery location"}>
            <span className="text-[10px] font-medium leading-none text-slate-500">Deliver to:</span>
            {deliveryLocation ? (
              <span className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                <span aria-hidden="true" className="text-base leading-none">{countryFlag(deliveryLocation.countryCode)}</span>
                {deliveryLocation.countryCode}
                {locationSource === "fallback" && <span className="sr-only">estimated</span>}
              </span>
            ) : <span className="text-xs font-semibold text-slate-400">Detecting…</span>}
          </div>


          {/* Mobile Actions: Cart + Sign In (or User Menu) */}
          <div className="ml-auto flex items-center gap-2 sm:gap-2.5 lg:hidden">
            <button
              onClick={() => navigate("/cart")}
              className="relative flex cursor-pointer items-center justify-center rounded-xl p-2 text-slate-700 transition-all hover:bg-orange-50 hover:text-orange-500"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="size-5.5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 flex items-center justify-center rounded-full bg-orange-500 text-[10px] font-extrabold text-white shadow-xs">
                  {cartItemCount}
                </span>
              )}
            </button>

            {!isAuthenticated ? (
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-1.5 rounded-full border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
              >
                Sign in
              </Link>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Open mobile account menu"
                  className="flex items-center gap-1 outline-none cursor-pointer"
                >
                  <div className="size-8.5 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-bold text-xs shadow-2xs">
                    {user?.name?.[0]?.toUpperCase() || <User className="size-3.5" />}
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
                      onClick={() => navigate("/customer-order")}
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

          <div className="flex items-center gap-3">
            {/* Auth Actions */}
            {!isAuthenticated ? (
              <div className="hidden lg:flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="inline-flex items-center px-4.5 py-2 rounded-full border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                >
                  Sign in
                </Link>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
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
                      onClick={() => navigate("/customer-order")}
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
      </div>
    </header>
  );
};
