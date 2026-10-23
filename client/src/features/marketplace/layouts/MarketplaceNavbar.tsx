import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Search, Command, ChevronDown, User, LogOut,Receipt, Package, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/auth.store";
import { useLogout } from "@/features/auth/auth.hooks";
import { useCart } from "@/features/cart/cart.hook";
import { useWishlist } from "../components/marketplace.hooks";
import { MarketplaceDesktopNav } from "../components/MarketplaceDesktopNav";
import { MarketplaceMobileMenu } from "../components/MarketplaceMobileMenu";

type CartGroup = { items: Array<{ quantity: number }> };

export const MarketplaceNavbar = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  return (
    <header className="sticky top-0 z-50 flex w-full flex-col select-none border-b border-slate-200 bg-white font-sans antialiased shadow-sm">
      {/* Top Banner Strip */}
      <div className="w-full border-b border-slate-200 bg-white px-4 py-1.5 text-center text-xs font-semibold tracking-wide text-slate-700">
        <span className="hidden sm:inline">
          Next-Gen Physical E-Commerce Engine.{" "}
          <strong className="text-orange-400 underline decoration-orange-400/50">Enjoy Zero Fees on Your First Order.</strong>
        </span>
        <span className="sm:hidden">
          Next-Gen E-Commerce • <strong className="text-orange-400 underline decoration-orange-400/50">Zero Fees</strong>
        </span>
      </div>

      {/* Main Navbar Bar */}
      <div className={`w-full transition-all duration-300 ${isScrolled ? "bg-white/95 py-2 backdrop-blur-xl" : "bg-white py-3"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
          <MarketplaceMobileMenu
            isAuthenticated={isAuthenticated}
            logout={() => logout()}
            isLoggingOut={isLoggingOut}
          />

          {/* Search Box */}
          <form onSubmit={(event) => { event.preventDefault(); navigate(searchQuery.trim() ? `/?search=${encodeURIComponent(searchQuery.trim())}` : "/"); }} className="hidden xl:flex flex-1 max-w-xl relative group">
            <Search className="absolute left-4 top-3 size-4 text-slate-400 group-focus-within:text-orange-300 transition-colors" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search physical products, brands, or categories..."
              className="h-11 w-full rounded-full border-2 border-slate-900 bg-white pl-11 pr-24 text-sm font-medium text-slate-900 shadow-none placeholder:text-slate-500 transition-all focus-visible:border-[#3665f3] focus-visible:ring-2 focus-visible:ring-[#3665f3]/20"
            />
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 shadow-xs">
                <Command className="size-3" />
                <span>NG</span>
              </div>
            </div>
          </form>

          <MarketplaceDesktopNav
            cartItemCount={cartItemCount}
            onCart={() => navigate("/cart")}
            wishlistItemCount={wishlistItemCount}
            onWishlist={() => navigate("/wishlist")}
          />

          {/* Mobile Wishlist Button */}
          <button
            onClick={() => navigate("/wishlist")}
            className="lg:hidden relative flex items-center justify-center p-2 text-slate-700 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
            aria-label="Wishlist"
          >
            <Heart className="size-6" />
            {wishlistItemCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-rose-500 text-[11px] font-extrabold text-white shadow-xs">
                {wishlistItemCount}
              </span>
            )}
          </button>

          {/* Mobile Cart Button */}
          <button
            onClick={() => navigate("/cart")}
            className="lg:hidden relative flex items-center justify-center p-2 text-slate-700 hover:text-[#3665f3] hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
            aria-label="Shopping cart"
          >
            <ShoppingCart className="size-6" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-orange-500 text-[11px] font-extrabold text-white shadow-xs">
                {cartItemCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-3">
            {/* Auth Actions */}
            {!isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/login")}
                  className="text-sm font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 h-9 px-4 rounded-full cursor-pointer"
                >
                  Login
                </Button>
                <Button
                  onClick={() => navigate("/register")}
                  className="text-sm font-bold bg-[#3665f3] hover:bg-[#2854d9] text-white h-10 px-5 rounded-full shadow-sm cursor-pointer transition-all"
                >
                  Get Started
                </Button>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 outline-none group cursor-pointer">
                  <div className="size-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-sm font-bold text-[#3665f3] group-hover:border-[#3665f3] transition-all">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <ChevronDown className="hidden md:block size-4 text-slate-500 group-hover:text-slate-950 transition-colors" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl border border-slate-200 bg-white p-1 shadow-2xl">
                  <div className="border-b border-slate-100 px-3 py-2.5">
                    <p className="text-[11px] font-medium text-slate-500">Signed in as</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{user?.name || user?.email}</p>
                  </div>
                  <div className="space-y-0.5 p-1 text-slate-700">
                    <DropdownMenuItem
                      onClick={() => navigate("/account/settings")}
                      className="cursor-pointer rounded-xl focus:bg-blue-50 focus:text-[#3665f3]"
                    >
                      <User className="mr-2 size-4 text-slate-400" /> Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/shops")}
                      className="cursor-pointer rounded-xl focus:bg-blue-50 focus:text-[#3665f3]"
                    >
                      <Package className="mr-2 size-4 text-slate-400" /> See Your Shops
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/customer-order")}
                      className="cursor-pointer rounded-xl focus:bg-blue-50 focus:text-[#3665f3]"
                    >
                      <Receipt className="mr-2 size-4 text-slate-400" />Your Orders
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
            )}
          </div>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); navigate(searchQuery.trim() ? `/?search=${encodeURIComponent(searchQuery.trim())}` : "/"); }} className="relative mx-4 mt-3 lg:hidden">
          <Search className="absolute left-4 top-3 size-4 text-slate-400" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search products, brands and categories"
            className="h-10 w-full rounded-full border border-slate-300 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:border-[#3665f3] focus-visible:ring-2 focus-visible:ring-[#3665f3]/20"
          />
        </form>
      </div>
    </header>
  );
};
