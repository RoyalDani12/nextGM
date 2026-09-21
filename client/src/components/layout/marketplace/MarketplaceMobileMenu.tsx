import { useState, type Dispatch, type SetStateAction } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Compass, Tag, HelpCircle, Languages, ChevronDown, Check, User, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const LANGUAGES = [
  { code: "en", name: "English", country: "us" },
  { code: "am", name: "አማርኛ", country: "et" },
  { code: "fr", name: "Français", country: "fr" },
  { code: "ar", name: "العربية", country: "sa" },
];

const NAV_ITEMS = [
  { label: "Explore", path: "/", icon: Compass },
  { label: "Categories", path: "/categories", icon: Tag },
  { label: "How It Works", path: "/how-it-works", icon: HelpCircle },
  { label: "Pricing", path: "/pricing", icon: Zap },
];

interface MarketplaceMobileMenuProps {
  language: { code: string; name: string; country: string };
  setLanguage: Dispatch<SetStateAction<{ code: string; name: string; country: string }>>;
  isAuthenticated: boolean;
  logout: () => void;
  isLoggingOut: boolean;
}

export const MarketplaceMobileMenu = ({
  language,
  setLanguage,
  isAuthenticated,
  logout,
  isLoggingOut,
}: MarketplaceMobileMenuProps) => {
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const goTo = (path: string) => { navigate(path); setIsMobileOpen(false); };

  return (
    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
      <div className="flex items-center gap-3">
        <SheetTrigger className="lg:hidden p-2 text-stone-300 hover:bg-sky-500/10 hover:text-sky-100 rounded-lg transition-all outline-none" aria-label="Open mobile menu">
          <Menu className="size-5" />
        </SheetTrigger>
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center size-9 rounded-xl bg-[#374151] shadow-lg overflow-hidden group-hover:scale-105 transition-transform">
            <img src="/ChatGPT Image Sep 5, 2026, 12_33_26 AM.png" alt="NextG Logo" className="size-full object-cover" />
          </div>
          <span className="text-2xl font-black tracking-tight text-stone-100">NextG<span className="text-stone-400">.</span></span>
        </Link>
      </div>

      <SheetContent side="left" className="w-[300px] bg-[#131921] text-stone-100 border-r border-[#232f3e] p-0 overflow-y-auto">
        <div className="p-6 border-b border-[#232f3e] flex items-center gap-3">
          <div className="size-8 rounded-lg bg-[#374151] flex items-center justify-center shadow-lg overflow-hidden">
            <img src="/ChatGPT Image Sep 5, 2026, 12_33_26 AM.png" alt="NextG Logo" className="size-full object-cover" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-stone-100">NextG.</span>
        </div>

        <div className="p-4 space-y-2">
          <Button onClick={() => goTo("/shops/new")} className="w-full justify-start h-11 bg-[#374151] hover:bg-[#4b5563] text-white font-black rounded-lg transition-all shadow-lg">
            <Zap className="mr-3 size-4" /> Create Shop
          </Button>

          <div className="space-y-1.5 py-4 border-b border-[#232f3e]">
            {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
              <button key={path} onClick={() => goTo(path)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-stone-300 hover:text-sky-100 hover:bg-sky-500/10">
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>

          <div className="py-2 border-b border-[#232f3e] px-3">
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full flex items-center justify-between py-2 text-sm font-bold text-stone-300 hover:text-sky-100 outline-none cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Languages className="size-4 mr-1 text-stone-400" />
                  <img src={`https://flagcdn.com/${language.country}.svg`} alt={language.name} className="w-7 h-5 rounded-sm object-cover border border-[#232f3e] shadow-sm" />
                  <span className="uppercase font-bold text-sm text-stone-200">{language.code}</span>
                </div>
                <ChevronDown className="size-4 opacity-50" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[250px] bg-[#131921] border border-[#232f3e] p-1 shadow-2xl">
                <div className="text-xs font-extrabold text-stone-400 uppercase tracking-wider px-2 py-1.5">Choose Language</div>
                <DropdownMenuSeparator className="bg-[#232f3e] my-1" />
                {LANGUAGES.map((lang) => {
                  const isSelected = language.code === lang.code;
                  return (
                    <DropdownMenuItem key={lang.code} onClick={() => setLanguage(lang)} className={`cursor-pointer font-semibold text-sm flex items-center justify-between py-2 px-2.5 rounded-lg transition-all ${isSelected ? "bg-sky-500/10 text-sky-100 font-bold" : "text-stone-300 focus:bg-sky-500/10 focus:text-sky-100"}`}>
                      <div className="flex items-center">
                        <img src={`https://flagcdn.com/${lang.country}.svg`} alt={lang.name} className="w-7 h-5 mr-3 rounded-sm object-cover border border-[#232f3e] shadow-sm" />
                        <span className="uppercase font-bold text-xs mr-2 text-stone-500">[{lang.code}]</span>
                        <span>{lang.name}</span>
                      </div>
                      <Check className={`size-4 text-sky-200 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {!isAuthenticated ? (
            <div className="space-y-2 pt-4">
              <Button variant="outline" className="w-full h-10 border-[#232f3e] bg-transparent text-stone-200 hover:bg-sky-500/10 hover:text-sky-100 font-bold" onClick={() => goTo("/login")}>
                Login
              </Button>
              <Button className="w-full h-10 bg-white text-stone-950 hover:bg-stone-200 font-black" onClick={() => goTo("/register")}>
                Get Started
              </Button>
            </div>
          ) : (
            <div className="space-y-1 pt-4">
              <Button variant="ghost" className="w-full justify-start text-stone-300 font-semibold hover:text-sky-100 hover:bg-sky-500/10" onClick={() => goTo("/account/settings")}>
                <User className="mr-3 size-4" /> Account Settings
              </Button>
              <Button variant="ghost" disabled={isLoggingOut} className="w-full justify-start text-stone-300 font-semibold hover:text-rose-400 hover:bg-rose-950/30" onClick={() => { logout(); setIsMobileOpen(false); }}>
                <LogOut className="mr-3 size-4" /> {isLoggingOut ? "Signing Out..." : "Sign Out"}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
