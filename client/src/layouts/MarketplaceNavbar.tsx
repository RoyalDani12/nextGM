import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Search, ShoppingBag, Store, UserRound, LogOut, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/auth.store";
import { useLogout } from "@/features/auth/auth.hooks";
import { BrandMark } from "@/components/layout/BrandMark";

export interface MarketplaceProps {
  isAuthenticated?: boolean;
  user?: { name: string; email: string; avatarUrl?: string } | null;
  onLogout?: () => void;
}

const navItems = [
  { label: "Discover", href: "/" },
  { label: "Shops", href: "/shops" },
  { label: "Pricing", href: "/pricing" },
];

export const MarketplaceNavbar = ({ isAuthenticated, user: suppliedUser, onLogout }: MarketplaceProps = {}) => {
  const navigate = useNavigate();
  const storeUser = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.accessToken);
  const logout = useLogout();
  const user = suppliedUser === undefined ? storeUser : suppliedUser;
  const signedIn = isAuthenticated ?? Boolean(user && token);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submitSearch = () => {
    const query = search.trim();
    if (query) navigate(`/?search=${encodeURIComponent(query)}`);
  };
  const signOut = onLogout ?? (() => logout.mutate());

  return (
    <header className={`sticky top-0 z-50 border-b transition-all ${scrolled ? "border-slate-200 bg-white/90 shadow-sm backdrop-blur-xl" : "border-transparent bg-white"}`}>
      <div className="border-b border-slate-100 bg-slate-950 px-4 py-2 text-center text-[11px] font-bold tracking-wide text-white">
        <span className="text-emerald-300">Nexions</span> — independent shops, one trusted checkout.
      </div>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:gap-8">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation" />}>
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(86vw,340px)] p-0">
            <SheetHeader className="border-b border-slate-200 p-6 text-left">
              <SheetTitle><BrandMark /></SheetTitle>
            </SheetHeader>
            <nav className="space-y-1 p-4">
              {navItems.map((item) => (
                <Link key={item.href} to={item.href} onClick={() => setOpen(false)} className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100">
                  {item.label}<ArrowRight className="size-4 text-slate-400" />
                </Link>
              ))}
              <Link to="/create-shop" onClick={() => setOpen(false)} className="mt-4 flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">
                <Store className="size-4" /> Create a shop
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
        <BrandMark />
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => <Link key={item.href} to={item.href} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950">{item.label}</Link>)}
        </nav>
        <div className="relative ml-auto hidden max-w-sm flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && submitSearch()} placeholder="Search products and shops" className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-9 pr-10" aria-label="Search products and shops" />
          {search && <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label="Clear search"><X className="size-4" /></button>}
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigate("/cart")} aria-label="Open cart" className="relative">
          <ShoppingBag className="size-5" /><span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-emerald-500 text-[10px] font-black text-white">0</span>
        </Button>
        {signedIn ? (
          <DropdownMenu>
            <DropdownMenuTrigger render={<button className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100" aria-label="Open account menu" />}>
              <span className="grid size-8 place-items-center rounded-lg bg-slate-950 text-xs font-black text-white">{user?.name?.slice(0, 1).toUpperCase() ?? "U"}</span>
              <span className="hidden max-w-24 truncate text-sm font-bold text-slate-700 sm:block">{user?.name}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => navigate("/account/settings")}><UserRound className="mr-2 size-4" /> Account settings</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/role-redirect")}><Store className="mr-2 size-4" /> Workspace</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-rose-600"><LogOut className="mr-2 size-4" /> Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="hidden items-center gap-2 sm:flex">
            <Button variant="ghost" onClick={() => navigate("/login")} className="font-bold">Sign in</Button>
            <Button onClick={() => navigate("/register")} className="rounded-xl bg-slate-950 font-bold hover:bg-slate-800">Get started</Button>
          </div>
        )}
      </div>
    </header>
  );
};
