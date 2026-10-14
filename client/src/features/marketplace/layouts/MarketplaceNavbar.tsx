import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Search, Command, ChevronDown, Check, User, LogOut,Receipt, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/auth.store";
import { useLogout } from "@/features/auth/auth.hooks";
import { useCart } from "@/features/cart/cart.hook";
import { MarketplaceDesktopNav } from "../components/MarketplaceDesktopNav";
import { MarketplaceMobileMenu } from "../components/MarketplaceMobileMenu";

const LANGUAGES = [
  { code: "en", name: "English", country: "us" },
  { code: "am", name: "አማርኛ", country: "et" },
  { code: "fr", name: "Français", country: "fr" },
  { code: "ar", name: "العربية", country: "sa" },
];
type CartGroup = { items: Array<{ quantity: number }> };

export const MarketplaceNavbar = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [language, setLanguage] = useState(LANGUAGES[0]);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const { data: cartData } = useCart();

  const cartItemCount =
    (cartData?.data?.groupedBy as CartGroup[] | undefined)?.reduce(
      (total, group) =>
        total + group.items.reduce((groupTotal, item) => groupTotal + item.quantity, 0),
      0
    ) ?? 0;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 flex w-full flex-col select-none border-b border-slate-800 bg-slate-900 font-sans antialiased shadow-sm">
      {/* Top Banner Strip */}
      <div className="bg-slate-800/90 border-b border-slate-700/50 w-full text-slate-200 px-4 py-1.5 flex items-center justify-center text-xs font-semibold tracking-wide">
        <span className="hidden sm:inline">
          Next-Gen Physical E-Commerce Engine.{" "}
          <strong className="text-orange-400 underline decoration-orange-400/50">Enjoy Zero Fees on Your First Order.</strong>
        </span>
        <span className="sm:hidden">
          Next-Gen E-Commerce • <strong className="text-orange-400 underline decoration-orange-400/50">Zero Fees</strong>
        </span>
      </div>

      {/* Main Navbar Bar */}
      <div className={`w-full transition-all duration-300 ${isScrolled ? "bg-slate-900/95 py-2 shadow-sm backdrop-blur-xl" : "bg-slate-900 py-3"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
          <MarketplaceMobileMenu
            language={language}
            setLanguage={setLanguage}
            isAuthenticated={isAuthenticated}
            logout={() => logout()}
            isLoggingOut={isLoggingOut}
          />

          {/* Search Box */}
          <div className="hidden xl:flex flex-1 max-w-xl relative group">
            <Search className="absolute left-3.5 top-2.5 size-4 text-slate-400 group-focus-within:text-orange-400 transition-colors" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search physical products, brands, or categories..."
              className="w-full h-9 bg-slate-800 border border-slate-700/60 rounded-xl pl-10 pr-12 text-sm text-slate-100 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:border-orange-500 transition-all font-medium shadow-inner"
            />
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-600 bg-slate-900 text-[10px] font-bold text-slate-400 shadow-xs">
                <Command className="size-3" />
                <span>NG</span>
              </div>
            </div>
          </div>

          <MarketplaceDesktopNav cartItemCount={cartItemCount} onCart={() => navigate("/cart")} />

          {/* Mobile Cart Button */}
          <button
            onClick={() => navigate("/cart")}
            className="lg:hidden relative flex items-center justify-center p-2 text-slate-300 hover:text-orange-400 hover:bg-orange-500/10 rounded-xl transition-all cursor-pointer"
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
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger className="hidden lg:flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-all outline-none px-2.5 py-1.5 rounded-xl hover:bg-slate-800 cursor-pointer border border-transparent hover:border-slate-700">
                <img
                  src={`https://flagcdn.com/${language.country}.svg`}
                  alt={language.name}
                  className="w-6 h-4 rounded-xs object-cover border border-slate-700 shadow-xs"
                />
                <span className="uppercase font-bold text-xs tracking-wider">{language.code}</span>
                <ChevronDown className="size-3.5 opacity-60" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-slate-900 p-1.5 shadow-2xl border border-slate-800 rounded-2xl">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1.5">Choose Language</div>
                <DropdownMenuSeparator className="bg-slate-800 my-1" />
                {LANGUAGES.map((lang) => {
                  const isSelected = language.code === lang.code;
                  return (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => setLanguage(lang)}
                      className={`cursor-pointer font-medium text-sm flex items-center justify-between py-2 px-2.5 rounded-xl ${
                        isSelected ? "bg-orange-500/10 text-orange-400 font-semibold" : "text-slate-300 focus:bg-slate-800 focus:text-white"
                      }`}
                    >
                      <div className="flex items-center">
                        <img src={`https://flagcdn.com/${lang.country}.svg`} alt={lang.name} className="w-6 h-4 mr-3 rounded-xs object-cover border border-slate-700" />
                        <span className="uppercase font-bold text-xs mr-2 text-slate-500">[{lang.code}]</span>
                        <span>{lang.name}</span>
                      </div>
                      <Check className={isSelected ? "size-4 text-orange-500" : "size-4 opacity-0"} />
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="hidden sm:block h-5 w-px bg-slate-800 mx-1" />

            {/* Auth Actions */}
            {!isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/login")}
                  className="text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 h-9 px-4 rounded-xl cursor-pointer"
                >
                  Login
                </Button>
                <Button
                  onClick={() => navigate("/register")}
                  className="text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white h-9 px-5 rounded-xl shadow-md cursor-pointer transition-all"
                >
                  Get Started
                </Button>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 outline-none group cursor-pointer">
                  <div className="size-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-orange-400 group-hover:border-orange-500 transition-all">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <ChevronDown className="hidden md:block size-4 text-slate-400 group-hover:text-white transition-colors" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1">
                  <div className="px-3 py-2.5 border-b border-slate-800">
                    <p className="text-[11px] font-medium text-slate-400">Signed in as</p>
                    <p className="text-sm font-bold text-white truncate">{user?.name || user?.email}</p>
                  </div>
                  <div className="p-1 space-y-0.5 text-slate-200">
                    <DropdownMenuItem
                      onClick={() => navigate("/account/settings")}
                      className="cursor-pointer rounded-xl focus:bg-slate-800 focus:text-white"
                    >
                      <User className="mr-2 size-4 text-slate-400" /> Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/shops")}
                      className="cursor-pointer rounded-xl focus:bg-slate-800 focus:text-white"
                    >
                      <Package className="mr-2 size-4 text-slate-400" /> See Your Shops
                    </DropdownMenuItem>
                    {/* </DropdownMenuItem> */}
                    <DropdownMenuItem
                      onClick={() => navigate("/customer-order")}
                      className="cursor-pointer rounded-xl focus:bg-slate-800 focus:text-white"
                    >
                      <Receipt className="mr-2 size-4 text-slate-400" />Your Order
                    </DropdownMenuItem>
                         </div>
                  <DropdownMenuSeparator className="bg-slate-800" />
                  <div className="p-1">
                    <DropdownMenuItem
                      disabled={isLoggingOut}
                      onClick={() => logout()}
                      className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer rounded-xl"
                    >
                      <LogOut className="mr-2 size-4" /> {isLoggingOut ? "Signing Out..." : "Sign Out"}
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
