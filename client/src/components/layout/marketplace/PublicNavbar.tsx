import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
    Search, 
    Store, 
    Menu, 
    ShoppingBag, 
    Grid,
    Tag,
    X,
    User,
    LogOut,
    ShieldAlert,
    LayoutDashboard,
    Package,
    Users,
    ChevronDown,
    Building2,
    Briefcase,
    Command,
    Zap,
    Bell,
    Settings,
    Hexagon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type UserRole = "PUBLIC" | "CUSTOMER" | "EMPLOYEE" | "SHOP_OWNER" | "SUPER_ADMIN";

interface HeaderProps {
    userRole?: UserRole;
    user?: {
        name: string;
        email: string;
        avatar?: string;
        shopName?: string;
    } | null;
    onLogout?: () => void;
}

const ROLE_CONFIG: Record<UserRole, { 
    links: Array<{ label: string; path: string; icon: any }>; 
    badgeColor: string; 
    roleLabel: string;
    themeText: string;
}> = {
    PUBLIC: {
        roleLabel: "Guest",
        themeText: "text-neutral-400",
        badgeColor: "bg-neutral-800/50 text-neutral-300 border-neutral-700",
        links: [
            { label: "Marketplace", path: "/stores", icon: Grid },
            { label: "Deals", path: "/pricing", icon: Tag },
            { label: "Become a Seller", path: "/sell", icon: Store },
        ]
    },
    CUSTOMER: {
        roleLabel: "Customer",
        themeText: "text-emerald-400",
        badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        links: [
            { label: "Discover", path: "/explore", icon: Zap },
            { label: "Purchases", path: "/orders", icon: Package },
            { label: "Favorites", path: "/saved-stores", icon: Store },
        ]
    },
    EMPLOYEE: {
        roleLabel: "Staff Operations",
        themeText: "text-blue-400",
        badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        links: [
            { label: "Workspace", path: "/employee/dashboard", icon: Briefcase },
            { label: "Inventory", path: "/employee/inventory", icon: Package },
            { label: "Fulfillment", path: "/employee/orders", icon: ShoppingBag },
        ]
    },
    SHOP_OWNER: {
        roleLabel: "Merchant",
        themeText: "text-amber-400",
        badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        links: [
            { label: "Storefront", path: "/my-shop", icon: Building2 },
            { label: "Analytics", path: "/dashboard", icon: LayoutDashboard },
            { label: "Catalog", path: "/dashboard/products", icon: Package },
        ]
    },
    SUPER_ADMIN: {
        roleLabel: "System Admin",
        themeText: "text-rose-400",
        badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/30",
        links: [
            { label: "Command Center", path: "/admin", icon: ShieldAlert },
            { label: "Network", path: "/admin/shops", icon: Building2 },
            { label: "Access Control", path: "/admin/users", icon: Users },
        ]
    }
};

const CATEGORIES = [
    "For You",
    "Digital Assets",
    "Apparel & Style",
    "Tech & Gadgets",
    "Workspace",
    "Creative Tools",
    "New Arrivals"
];

export const PublicNavbar = ({ userRole = "PUBLIC", user, onLogout }: HeaderProps) => {
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("For You");

    const activeConfig = ROLE_CONFIG[userRole] || ROLE_CONFIG.PUBLIC;
    const CART_COUNT = userRole === "CUSTOMER" || userRole === "PUBLIC" ? 3 : 0;

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header className="sticky top-0 z-50 w-full flex flex-col">
            {/* Promo / System Status Bar */}
            <div className="bg-emerald-500 w-full text-black px-4 py-1.5 flex items-center justify-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                <Zap className="size-3.5 fill-black" />
                <span>Next-Gen Commerce Engine is Live. Enjoy zero fees on your first order.</span>
            </div>

            {/* Main Glass Navigation */}
            <div className={`w-full transition-all duration-500 border-b ${
                isScrolled 
                    ? "bg-[#0A0A0A]/80 backdrop-blur-2xl border-neutral-800 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.4)]" 
                    : "bg-[#0A0A0A] border-neutral-900 py-4 text-neutral-100"
            }`}>
                <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 lg:gap-8">
                    
                    {/* Left: Brand & Mobile Sheet */}
                    <div className="flex items-center gap-4">
                        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                            <SheetTrigger 
                                render={
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="lg:hidden rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                                    >
                                        <Menu className="size-5" />
                                    </Button>
                                }
                            />
                            <SheetContent side="left" className="w-[320px] bg-[#0A0A0A] text-neutral-100 border-r border-neutral-800 p-0 flex flex-col">
                                <div className="p-6 border-b border-neutral-800/60">
                                    <SheetHeader className="text-left space-y-4">
                                        <SheetTitle className="flex items-center gap-3 text-white">
                                            <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/50">
                                                <Hexagon className="size-5 text-black fill-black" />
                                            </div>
                                            <span className="text-2xl font-black tracking-tight">NextG.</span>
                                        </SheetTitle>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${activeConfig.badgeColor}`}>
                                                {activeConfig.roleLabel}
                                            </span>
                                        </div>
                                    </SheetHeader>
                                </div>

                                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                                    {/* Mobile Search */}
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                            <Search className="size-4 text-neutral-500 group-focus-within:text-emerald-400 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search the market..."
                                            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl py-3 pl-10 pr-4 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                        />
                                    </div>

                                    {/* Mobile Links */}
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3 px-2">Navigation</p>
                                        {activeConfig.links.map((link) => {
                                            const Icon = link.icon;
                                            return (
                                                <button
                                                    key={link.label}
                                                    onClick={() => { navigate(link.path); setIsMobileMenuOpen(false); }}
                                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800/50 transition-all active:scale-[0.98]"
                                                >
                                                    <Icon className={`size-4 ${activeConfig.themeText}`} />
                                                    {link.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Mobile Auth Footer */}
                                <div className="p-6 border-t border-neutral-800/60 bg-neutral-950/50">
                                    {userRole === "PUBLIC" ? (
                                        <div className="space-y-3">
                                            <Button 
                                                variant="outline" 
                                                className="w-full h-11 border-neutral-800 bg-transparent text-neutral-300 hover:bg-neutral-800"
                                                onClick={() => { navigate("/login"); setIsMobileMenuOpen(false); }}
                                            >
                                                Sign In
                                            </Button>
                                            <Button 
                                                className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
                                                onClick={() => { navigate("/register"); setIsMobileMenuOpen(false); }}
                                            >
                                                Create Account
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/50 border border-neutral-800">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-neutral-300">
                                                    {user?.name?.[0] || "U"}
                                                </div>
                                                <div className="flex flex-col text-left">
                                                    <span className="text-sm font-semibold text-neutral-200">{user?.name}</span>
                                                    <span className="text-[10px] text-neutral-500">{user?.email}</span>
                                                </div>
                                            </div>
                                            <Button size="icon" variant="ghost" onClick={onLogout} className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300">
                                                <LogOut className="size-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>

                        {/* Brand Logo (Desktop) */}
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="relative flex items-center justify-center size-9 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-900/20 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-emerald-500/30">
                                <Hexagon className="size-5 text-black fill-black" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-black tracking-tighter text-white leading-none">
                                    NextG.
                                </span>
                                <span className="text-[9px] font-bold text-emerald-500 tracking-[0.2em] uppercase mt-0.5">
                                    Marketplace
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Center: Advanced Search Bar */}
                    <div className="hidden md:flex flex-1 max-w-2xl px-6">
                        <div className="w-full relative group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Search className="size-4 text-neutral-500 group-focus-within:text-emerald-400 transition-colors" />
                            </div>
                            <Input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search products, stores, or categories..."
                                className="w-full h-11 bg-neutral-900/60 border-neutral-800 rounded-2xl pl-11 pr-24 text-sm text-neutral-100 placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 transition-all hover:bg-neutral-900"
                            />
                            <div className="absolute inset-y-0 right-3 flex items-center gap-2">
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery("")} className="p-1 hover:bg-neutral-800 rounded-md text-neutral-400 hover:text-neutral-200 transition-colors">
                                        <X className="size-3.5" />
                                    </button>
                                )}
                                <div className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-800/80 border border-neutral-700/50 text-[10px] font-mono text-neutral-400">
                                    <Command className="size-3" />
                                    <span>K</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions & Profile */}
                    <div className="flex items-center gap-3 md:gap-5">
                        
                        {/* Desktop Links */}
                        <nav className="hidden xl:flex items-center gap-1 border-r border-neutral-800 pr-5">
                            {activeConfig.links.map((link) => (
                                <Button
                                    key={link.label}
                                    variant="ghost"
                                    onClick={() => navigate(link.path)}
                                    className="text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800/50 h-9 px-3 rounded-lg transition-colors"
                                >
                                    {link.label}
                                </Button>
                            ))}
                        </nav>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-2">
                            {userRole !== "PUBLIC" && (
                                <Button variant="ghost" size="icon" className="hidden sm:inline-flex text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-xl">
                                    <Bell className="size-4.5" />
                                </Button>
                            )}
                            
                            {(userRole === "PUBLIC" || userRole === "CUSTOMER") && (
                                <button 
                                    onClick={() => navigate("/cart")}
                                    className="relative flex items-center justify-center size-10 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white transition-all active:scale-95 group"
                                >
                                    <ShoppingBag className="size-4.5 group-hover:text-emerald-400 transition-colors" />
                                    {CART_COUNT > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-emerald-500 text-black text-[10px] font-bold shadow-sm shadow-emerald-500/20">
                                            {CART_COUNT}
                                        </span>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Authentication / User Profile */}
                        {userRole === "PUBLIC" ? (
                            <div className="hidden sm:flex items-center gap-3 pl-2">
                                <Button 
                                    variant="ghost"
                                    onClick={() => navigate("/login")}
                                    className="text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 h-10 px-4 rounded-xl"
                                >
                                    Sign In
                                </Button>
                                <Button 
                                    onClick={() => navigate("/register")}
                                    className="text-sm font-bold bg-white text-black hover:bg-neutral-200 h-10 px-5 rounded-xl transition-all active:scale-95"
                                >
                                    Join Network
                                </Button>
                            </div>
                        ) : (
                            <DropdownMenu>
                                <DropdownMenuTrigger 
                                    render={
                                        <button className="flex items-center gap-2.5 p-1 pr-3 rounded-full bg-neutral-900 border border-neutral-800 hover:bg-neutral-800/80 transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50">
                                            <div className="size-8 rounded-full bg-neutral-800 flex items-center justify-center text-sm font-bold text-neutral-200 border border-neutral-700">
                                                {user?.name?.[0] || "U"}
                                            </div>
                                            <div className="hidden md:flex flex-col items-start text-left">
                                                <span className="text-xs font-bold text-neutral-200 leading-none max-w-[100px] truncate">{user?.name || "Account"}</span>
                                                <span className={`text-[9px] font-semibold uppercase mt-1 ${activeConfig.themeText}`}>{activeConfig.roleLabel}</span>
                                            </div>
                                            <ChevronDown className="hidden md:block size-3.5 text-neutral-500 ml-1" />
                                        </button>
                                    }
                                />
                                <DropdownMenuContent align="end" className="w-64 p-2 bg-[#0A0A0A] border-neutral-800 rounded-2xl shadow-xl shadow-black/50">
                                    <div className="px-2 py-3 mb-2 rounded-xl bg-neutral-900/50 border border-neutral-800/50">
                                        <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                                        <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <DropdownMenuItem onClick={() => navigate("/profile")} className="rounded-lg text-sm text-neutral-300 focus:bg-neutral-800 focus:text-white cursor-pointer py-2">
                                            <User className="mr-3 size-4 text-neutral-500" /> Account Settings
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => navigate("/preferences")} className="rounded-lg text-sm text-neutral-300 focus:bg-neutral-800 focus:text-white cursor-pointer py-2">
                                            <Settings className="mr-3 size-4 text-neutral-500" /> Preferences
                                        </DropdownMenuItem>
                                    </div>

                                    <DropdownMenuSeparator className="my-2 bg-neutral-800" />
                                    
                                    <DropdownMenuItem onClick={onLogout} className="rounded-lg text-sm text-rose-400 focus:bg-rose-500/10 focus:text-rose-300 cursor-pointer py-2">
                                        <LogOut className="mr-3 size-4" /> Secure Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </div>

            {/* Sub-Navigation / Category Pills (Public & Customer Only) */}
            {(userRole === "PUBLIC" || userRole === "CUSTOMER") && (
                <div className="w-full bg-[#0A0A0A] border-b border-neutral-900">
                    <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-3">
                            {CATEGORIES.map((category) => {
                                const isActive = activeCategory === category;
                                return (
                                    <button
                                        key={category}
                                        onClick={() => setActiveCategory(category)}
                                        className={`relative px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
                                            isActive
                                                ? "bg-white text-black shadow-md shadow-white/10"
                                                : "bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-transparent hover:border-neutral-700"
                                        }`}
                                    >
                                        {category}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default PublicNavbar;