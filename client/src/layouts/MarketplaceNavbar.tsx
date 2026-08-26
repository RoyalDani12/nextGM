import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
    Search, Menu, Zap, Package, 
    User, LogOut, Command, Store, HelpCircle, 
    Tag, Compass, ChevronDown, Sparkles, Languages, Check,
    ArrowRight, TrendingUp, ShieldCheck, Flame, Shirt, Laptop, Home, HeartPulse, Trophy, Sparkle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

interface MarketplaceProps {
    isAuthenticated: boolean;
    user: { name: string; email: string; avatarUrl?: string } | null;
    onLogout: () => void;
}

const LANGUAGES = [
    { code: "en", name: "English", country: "us" },
    { code: "am", name: "አማርኛ", country: "et" },
    { code: "fr", name: "Français", country: "fr" },
    { code: "ar", name: "العربية", country: "sa" },
];

// EXPLORE MEGA-MENU (Includes standard category shortcuts)
const EXPLORE_MEGA_MENU = {
    featured: {
        title: "Curated Store Drops",
        description: "Discover top-rated physical goods, custom apparel, and tech gear from verified vendors.",
        badge: "Hot Products",
        href: "/collections/featured",
        bgGradient: "from-green-500/10 via-orange-500/10 to-slate-50",
    },
    sections: [
        {
            title: "Explore Categories",
            links: [
                { name: "Apparel & Fashion", desc: "Streetwear, footwear & custom merch", href: "/categories/apparel", icon: Shirt },
                { name: "Tech & Electronics", desc: "Gadgets, audio gear & accessories", href: "/categories/tech", icon: Laptop },
                { name: "Home & Workspace", desc: "Furniture, lighting & desk accessories", href: "/categories/workspace", icon: Home },
                { name: "Beauty & Personal", desc: "Skincare, grooming & wellness items", href: "/categories/beauty", icon: HeartPulse },
                { name: "Sports & Outdoor", desc: "Outdoor essentials & gym equipment", href: "/categories/sports", icon: Trophy },
                { name: "New Arrivals", desc: "Latest physical products added", href: "/new-arrivals", icon: Sparkle },
            ],
        },
        {
            title: "Marketplace Highlights",
            links: [
                { name: "Verified Stores", desc: "Hand-picked independent physical vendors", href: "/shops?filter=verified", icon: ShieldCheck },
                { name: "Hot Deals & Drops", desc: "Limited-time physical product discounts", href: "/deals", icon: Flame },
                { name: "Trending Items", desc: "Most popular physical goods this week", href: "/trending", icon: TrendingUp },
            ],
        },
    ]
};

// CATEGORIES MEGA-MENU (Strictly physical goods)
const CATEGORIES_MEGA_MENU = [
    {
        title: "Apparel & Style",
        items: ["Men's & Women's Wear", "Footwear & Sneakers", "Bags & Leather Goods", "Custom Merchandise", "Watches & Jewelry"]
    },
    {
        title: "Tech & Electronics",
        items: ["Smartphones & Accessories", "Audio & Headphones", "Power Banks & Chargers", "Smart Home Hardware", "Cable Management"]
    },
    {
        title: "Home & Workspace",
        items: ["Ergonomic Desk Setup", "Mechanical Keyboards", "Office & Ambient Lighting", "Desk Organizers", "Decor & Furniture"]
    },
    {
        title: "Sports & Personal Care",
        items: ["Fitness Gear & Equipment", "Outdoor & Camping", "Skincare & Grooming", "Travel Accessories"]
    }
];

export const MarketplaceNavbar = ({ isAuthenticated, user, onLogout }: MarketplaceProps) => {
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [language, setLanguage] = useState(LANGUAGES[0]);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header className="sticky top-0 z-50 w-full flex flex-col font-sans antialiased bg-white select-none shadow-xs">
            {/* Top Announcement Bar */}
            <div className="bg-gradient-to-r from-green-600 via-green-500 to-orange-500 w-full text-white px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold tracking-wide shadow-inner">
                <Sparkles className="size-4" />
                <span>Next-Gen Physical E-Commerce Engine. <strong>Enjoy Zero Fees on Your First Order.</strong></span>
            </div>

            {/* Main Navigation Bar */}
            <div className={`w-full transition-all duration-200 border-b border-slate-200 ${
                isScrolled ? "bg-white/95 backdrop-blur-md py-2.5 shadow-md" : "bg-white py-3.5"
            }`}>
                <div className="max-w-[96rem] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
                    
                    {/* Brand & Mobile Menu */}
                    <div className="flex items-center gap-4">
                        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                            <SheetTrigger className="lg:hidden p-2 text-slate-900 hover:bg-slate-100 rounded-md transition-colors outline-none">
                                <Menu className="size-5" />
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[300px] bg-white text-slate-900 border-r border-slate-200 p-0 overflow-y-auto">
                                <div className="p-6 border-b border-slate-200 flex items-center gap-3">
                                    <div className="size-8 rounded bg-slate-900 flex items-center justify-center shadow-xs">
                                        <Zap className="size-4 text-white fill-white" />
                                    </div>
                                    <span className="text-xl font-extrabold tracking-tight text-slate-900">Nexions</span>
                                </div>
                                <div className="p-4 space-y-2">
                                    <Button onClick={() => { navigate("/register-shop"); setIsMobileOpen(false); }} className="w-full justify-start h-11 bg-gradient-to-r from-green-600 to-orange-500 hover:opacity-95 text-white font-bold rounded-md transition-all shadow-xs">
                                        <Store className="mr-3 size-4" /> Create Shop
                                    </Button>
                                    
                                    <div className="space-y-1 py-4 border-b border-slate-100">
                                        <button onClick={() => { navigate("/"); setIsMobileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"><Compass className="size-4" /> Explore</button>
                                        <button onClick={() => { navigate("/categories"); setIsMobileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"><Tag className="size-4" /> Categories</button>
                                        <button onClick={() => { navigate("/shops"); setIsMobileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"><Store className="size-4" /> Shops</button>
                                        <button onClick={() => { navigate("/how-it-works"); setIsMobileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"><HelpCircle className="size-4" /> How It Works</button>
                                        <button onClick={() => { navigate("/pricing"); setIsMobileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"><Zap className="size-4" /> Pricing</button>
                                    </div>

                                    {/* Language Switcher */}
                                    <div className="py-2 border-b border-slate-100 px-3">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="w-full flex items-center justify-between py-2 text-sm font-bold text-slate-700 hover:text-slate-900 outline-none cursor-pointer">
                                                <div className="flex items-center gap-2.5">
                                                    <Languages className="size-4 mr-1"/> 
                                                    <img 
                                                        src={`https://flagcdn.com/${language.country}.svg`} 
                                                        alt={language.name} 
                                                        className="w-7 h-5 rounded-xs object-cover border border-slate-200 shadow-2xs" 
                                                    />
                                                    <span className="uppercase font-bold text-sm">{language.code}</span>
                                                </div>
                                                <ChevronDown className="size-4 opacity-50" />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="w-[250px] bg-white p-1 shadow-lg">
                                                <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider px-2 py-1.5">
                                                    Choose Language
                                                </div>
                                                <DropdownMenuSeparator className="bg-slate-100 my-1" />
                                                {LANGUAGES.map((lang) => {
                                                    const isSelected = language.code === lang.code;
                                                    return (
                                                        <DropdownMenuItem 
                                                            key={lang.code} 
                                                            onClick={() => setLanguage(lang)} 
                                                            className={`cursor-pointer font-semibold text-sm flex items-center justify-between py-2 px-2.5 rounded-md transition-colors ${
                                                                isSelected ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-700 focus:bg-slate-100 focus:text-slate-900"
                                                            }`}
                                                        >
                                                            <div className="flex items-center">
                                                                <img 
                                                                    src={`https://flagcdn.com/${lang.country}.svg`} 
                                                                    alt={lang.name} 
                                                                    className="w-7 h-5 mr-3 rounded-xs object-cover border border-slate-200 shadow-2xs" 
                                                                />
                                                                <span className="uppercase font-bold text-xs mr-2 text-slate-500">[{lang.code}]</span>
                                                                <span>{lang.name}</span>
                                                            </div>
                                                            <Check className={`size-4 text-green-600 transition-opacity ${isSelected ? "opacity-100" : "opacity-0"}`} />
                                                        </DropdownMenuItem>
                                                    );
                                                })}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {!isAuthenticated ? (
                                        <div className="space-y-2 pt-4">
                                            <Button variant="outline" className="w-full h-10 border-slate-300 text-slate-900 hover:bg-slate-100 font-bold" onClick={() => { navigate("/login"); setIsMobileOpen(false); }}>Login</Button>
                                            <Button className="w-full h-10 bg-slate-900 text-white hover:bg-slate-800 font-bold" onClick={() => { navigate("/register"); setIsMobileOpen(false); }}>Get Started</Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-1 pt-4">
                                            <Button variant="ghost" className="w-full justify-start text-slate-700 font-semibold hover:text-slate-900 hover:bg-slate-100" onClick={() => { navigate("/profile"); setIsMobileOpen(false); }}><User className="mr-3 size-4"/> Account Settings</Button>
                                            <Button variant="ghost" className="w-full justify-start text-slate-700 font-semibold hover:text-orange-600 hover:bg-orange-50" onClick={() => { onLogout(); setIsMobileOpen(false); }}><LogOut className="mr-3 size-4" /> Sign Out</Button>
                                        </div>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>

                        <Link to="/" className="flex items-center gap-2.5">
                            <div className="flex items-center justify-center size-8 rounded bg-slate-900 shadow-xs">
                                <Zap className="size-4 text-white fill-white" />
                            </div>
                            <span className="text-2xl font-extrabold tracking-tight text-slate-900">NextG.</span>
                        </Link>
                    </div>

                    {/* Central Search Bar */}
                    <div className="hidden xl:flex flex-1 max-w-xl relative group">
                        <Search className="absolute left-3.5 top-3 size-4 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                        <Input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search physical products, brands, or categories..."
                            className="w-full h-10 bg-slate-50 border-2 border-slate-200 rounded-lg pl-10 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 focus-visible:border-green-600 transition-all font-medium shadow-2xs"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-300 bg-white text-[10px] font-bold text-slate-500 shadow-2xs">
                                <Command className="size-3" /><span>K</span>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <NavigationMenu className="hidden lg:flex">
                        <NavigationMenuList className="flex items-center gap-1">
                            
                            {/* EXPLORE TAB (Includes main product categories) */}
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="bg-transparent text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 data-[state=open]:bg-slate-100 px-3 py-2 rounded-md">
                                    Explore
                                </NavigationMenuTrigger>
                                <NavigationMenuContent className="p-6 bg-white border border-slate-200 rounded-xl shadow-2xl w-[850px] grid grid-cols-12 gap-6">
                                    <div className="col-span-8 grid grid-cols-2 gap-6">
                                        {EXPLORE_MEGA_MENU.sections.map((sec, idx) => (
                                            <div key={idx} className="space-y-3">
                                                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">{sec.title}</h4>
                                                <div className="space-y-1">
                                                    {sec.links.map((link, lIdx) => {
                                                        const IconComp = link.icon;
                                                        return (
                                                            <Link 
                                                                key={lIdx} 
                                                                to={link.href}
                                                                className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
                                                            >
                                                                <div className="p-2 rounded-md bg-slate-100 text-slate-700 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                                                    <IconComp className="size-4" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-bold text-slate-900 group-hover:text-green-600 transition-colors">{link.name}</div>
                                                                    <p className="text-xs text-slate-500 line-clamp-1">{link.desc}</p>
                                                                </div>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Featured Promo Box */}
                                    <div className={`col-span-4 rounded-xl p-5 bg-gradient-to-br ${EXPLORE_MEGA_MENU.featured.bgGradient} border border-slate-200 flex flex-col justify-between relative overflow-hidden`}>
                                        <div className="space-y-2">
                                            <span className="inline-block bg-orange-500 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wide">
                                                {EXPLORE_MEGA_MENU.featured.badge}
                                            </span>
                                            <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                                                {EXPLORE_MEGA_MENU.featured.title}
                                            </h3>
                                            <p className="text-xs text-slate-600 leading-relaxed">
                                                {EXPLORE_MEGA_MENU.featured.description}
                                            </p>
                                        </div>
                                        <Link 
                                            to={EXPLORE_MEGA_MENU.featured.href} 
                                            className="mt-4 flex items-center justify-between font-bold text-xs text-green-700 hover:text-green-800 transition-colors group"
                                        >
                                            <span>Browse Collection</span>
                                            <ArrowRight className="size-4 transform group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            {/* CATEGORIES TAB (Strictly Physical Product Types) */}
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="bg-transparent text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 data-[state=open]:bg-slate-100 px-3 py-2 rounded-md">
                                    Categories
                                </NavigationMenuTrigger>
                                <NavigationMenuContent className="p-6 bg-white border border-slate-200 rounded-xl shadow-2xl w-[750px] grid grid-cols-4 gap-6">
                                    {CATEGORIES_MEGA_MENU.map((col, cIdx) => (
                                        <div key={cIdx} className="space-y-3">
                                            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">{col.title}</h4>
                                            <ul className="space-y-2">
                                                {col.items.map((item, iIdx) => (
                                                    <li key={iIdx}>
                                                        <Link 
                                                            to={`/categories/${item.toLowerCase().replace(/\s+/g, '-')}`}
                                                            className="text-xs font-semibold text-slate-600 hover:text-green-600 transition-colors block py-0.5"
                                                        >
                                                            {item}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            {/* DIRECT LINKS */}
                            <NavigationMenuItem>
                                <Link to="/shops" className={`${navigationMenuTriggerStyle()} bg-transparent text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-md`}>
                                    Shops
                                </Link>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <Link to="/how-it-works" className={`${navigationMenuTriggerStyle()} bg-transparent text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-md`}>
                                    How It Works
                                </Link>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <Link to="/pricing" className={`${navigationMenuTriggerStyle()} bg-transparent text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-md`}>
                                    Pricing
                                </Link>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>

                    {/* Actions & Language Selector */}
                    <div className="flex items-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger className="hidden lg:flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors outline-none px-2 py-1.5 rounded-md hover:bg-slate-100 cursor-pointer">
                                <img 
                                    src={`https://flagcdn.com/${language.country}.svg`} 
                                    alt={language.name} 
                                    className="w-7 h-5 rounded-xs object-cover border border-slate-200 shadow-2xs" 
                                />
                                <span className="uppercase font-bold text-xs tracking-wider">{language.code}</span>
                                <ChevronDown className="size-3.5 opacity-60" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 bg-white p-1 shadow-lg border border-slate-200">
                                <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider px-2 py-1.5">
                                    Choose Language
                                </div>
                                <DropdownMenuSeparator className="bg-slate-100 my-1" />
                                {LANGUAGES.map((lang) => {
                                    const isSelected = language.code === lang.code;
                                    return (
                                        <DropdownMenuItem 
                                            key={lang.code} 
                                            onClick={() => setLanguage(lang)} 
                                            className={`cursor-pointer font-semibold text-sm flex items-center justify-between py-2 px-2.5 rounded-md transition-colors ${
                                                isSelected ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-700 focus:bg-slate-100 focus:text-slate-900"
                                            }`}
                                        >
                                            <div className="flex items-center">
                                                <img 
                                                    src={`https://flagcdn.com/${lang.country}.svg`} 
                                                    alt={lang.name} 
                                                    className="w-7 h-5 mr-3 rounded-xs object-cover border border-slate-200 shadow-2xs" 
                                                />
                                                <span className="uppercase font-bold text-xs mr-2 text-slate-500">[{lang.code}]</span>
                                                <span>{lang.name}</span>
                                            </div>
                                            <Check className={`size-4 text-green-600 transition-opacity ${isSelected ? "opacity-100" : "opacity-0"}`} />
                                        </DropdownMenuItem>
                                    );
                                })}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="hidden sm:block h-6 w-px bg-slate-200 mx-1"></div>

                        {!isAuthenticated ? (
                            <div className="hidden sm:flex items-center gap-3">
                                <Button variant="ghost" onClick={() => navigate("/login")} className="text-sm font-bold text-slate-900 hover:bg-slate-100 h-9 px-4 rounded-full">Login</Button>
                                <Button onClick={() => navigate("/register")} className="text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 h-9 px-5 rounded-full shadow-md">Get Started</Button>
                            </div>
                        ) : (
                            <DropdownMenu>
                                <DropdownMenuTrigger className="flex items-center gap-2 outline-none group cursor-pointer">
                                    <div className="size-9 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-sm font-bold text-slate-900 group-hover:border-green-600 transition-colors shadow-2xs">
                                        {user?.name?.[0]?.toUpperCase() || "U"}
                                    </div>
                                    <ChevronDown className="hidden md:block size-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 bg-white border border-slate-200 rounded-lg shadow-xl mt-1 p-0">
                                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 rounded-t-lg">
                                        <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                                        <p className="text-xs font-medium text-slate-500 truncate mt-0.5">{user?.email}</p>
                                    </div>
                                    <div className="p-1">
                                        <DropdownMenuItem onClick={() => navigate("/profile")} className="text-sm font-semibold text-slate-700 focus:bg-slate-100 focus:text-slate-900 cursor-pointer rounded-md py-2.5"><User className="mr-2 size-4 text-slate-500"/> Account</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => navigate("/orders")} className="text-sm font-semibold text-slate-700 focus:bg-slate-100 focus:text-slate-900 cursor-pointer rounded-md py-2.5"><Package className="mr-2 size-4 text-slate-500"/> Orders</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => navigate("/create-shop")} className="text-sm font-bold text-green-600 focus:bg-green-50 focus:text-green-700 cursor-pointer rounded-md py-2.5"><Store className="mr-2 size-4"/> Start Selling</DropdownMenuItem>
                                    </div>
                                    <DropdownMenuSeparator className="bg-slate-100 m-0" />
                                    <div className="p-1">
                                        <DropdownMenuItem onClick={onLogout} className="text-sm font-semibold text-slate-700 focus:bg-orange-50 focus:text-orange-600 cursor-pointer rounded-md py-2.5"><LogOut className="mr-2 size-4"/> Sign Out</DropdownMenuItem>
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