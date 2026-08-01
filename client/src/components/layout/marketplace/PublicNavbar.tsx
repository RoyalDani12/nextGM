import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
    Search, ShoppingCart, Store, Menu, Bell, 
    Package, User as UserIcon, LogOut, Settings, Command, Sparkles
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const CART_COUNT = 3;
const UNREAD_NOTIFICATIONS = 1;

export function PublicNavbar() {
    const user = useAuthStore((state) => state.user);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const logout = useLogout();
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const initials = user?.name
        ?.split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "US";

    return (
        <header 
            className={`sticky top-0 z-50 w-full transition-all duration-300 bg-white ${
                isScrolled ? "shadow-sm border-b border-zinc-200 backdrop-blur-md bg-white/90" : "border-b border-zinc-100"
            }`}
        >
            {/* Animated Neon Violet to Fuchsia Top Accent Bar */}
            <div className="h-1 w-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 animate-pulse" />

            <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 h-[4.5rem] flex items-center justify-between gap-4 lg:gap-8">
                
                {/* Left: Mobile Toggle & Brand */}
                <div className="flex items-center gap-4">
                    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                        <SheetTrigger>
                            <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-zinc-950 hover:bg-zinc-100 rounded-xl">
                                <Menu className="size-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-white border-r border-zinc-200 rounded-none shadow-2xl">
                            <SheetHeader className="pb-6 border-b border-zinc-100">
                                <SheetTitle className="text-left font-black text-2xl flex items-center gap-2">
                                    <Sparkles className="size-6 text-zinc-950" />
                                    <span className="text-zinc-950">
                                        Nexions
                                    </span>
                                </SheetTitle>
                            </SheetHeader>
                            <div className="py-6 flex flex-col gap-6">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 group-focus-within:text-zinc-950 transition-colors" />
                                    <Input
                                        type="search"
                                        placeholder="Search products..."
                                        className="pl-10 bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-950/5 focus-visible:border-zinc-950 h-12 rounded-xl text-zinc-950 font-medium transition-all"
                                    />
                                </div>
                                <nav className="flex flex-col gap-1">
                                    <Button variant="ghost" className="justify-start h-12 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl font-bold transition-colors" onClick={() => { navigate("/sell"); setIsMobileMenuOpen(false); }}>
                                        <Store className="mr-3 size-4" /> Sell on Nexions
                                    </Button>
                                    {isAuthenticated && (
                                        <>
                                            <Button variant="ghost" className="justify-start h-12 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl font-bold transition-colors" onClick={() => { navigate("/orders"); setIsMobileMenuOpen(false); }}>
                                                <Package className="mr-3 size-4" /> My Orders
                                            </Button>
                                            <div className="h-px w-full bg-zinc-100 my-2" />
                                            <Button variant="ghost" className="justify-start h-12 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-bold transition-colors" onClick={() => logout.mutate()}>
                                                <LogOut className="mr-3 size-4" /> Sign Out
                                            </Button>
                                        </>
                                    )}
                                </nav>
                            </div>
                        </SheetContent>
                    </Sheet>

                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="size-9 bg-zinc-950 flex items-center justify-center text-white hidden sm:flex transition-transform duration-300 group-hover:scale-105 shadow-sm rounded-xl">
                            <Sparkles className="size-5 text-white" />
                        </div>
                        <span className="text-2xl font-black tracking-tight text-zinc-950">
                            Nexions
                        </span>
                    </Link>
                </div>

                {/* Center: Search */}
                <div className="hidden md:flex flex-1 max-w-2xl relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="size-4 text-zinc-400 transition-colors group-focus-within:text-zinc-950" />
                    </div>
                    <Input
                        type="search"
                        placeholder="Search products, shops, and more..."
                        className="w-full pl-11 pr-14 h-11 bg-zinc-50 border-zinc-200 hover:bg-white focus-visible:bg-white focus-visible:border-zinc-950 focus-visible:ring-4 focus-visible:ring-zinc-950/5 transition-all rounded-full text-zinc-950 placeholder:text-zinc-400 font-medium shadow-inner shadow-zinc-100/50"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                        <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-1 rounded-md border border-zinc-200 bg-white text-[10px] font-bold text-zinc-400 shadow-sm">
                            <Command className="size-3" /> K
                        </kbd>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <Button
                        variant="ghost"
                        className="hidden lg:inline-flex gap-2 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 font-bold rounded-full px-5 h-10 transition-colors"
                        onClick={() => navigate("/sell")}
                    >
                        <Store className="size-4" />
                        Sell
                    </Button>

                    {isAuthenticated && (
                        <Button variant="ghost" size="icon" className="relative text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-full size-10 hidden sm:inline-flex transition-colors">
                            <Bell className="size-5" />
                            {UNREAD_NOTIFICATIONS > 0 && (
                                <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-red-500 border-2 border-white ring-2 ring-red-500/20" />
                            )}
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-full size-10 transition-colors group"
                        onClick={() => navigate("/cart")}
                    >
                        <ShoppingCart className="size-5 transition-transform group-hover:scale-110 group-active:scale-95" />
                        {CART_COUNT > 0 && (
                            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 flex items-center justify-center text-[11px] font-black bg-zinc-950 text-white border-2 border-white shadow-sm rounded-full">
                                {CART_COUNT > 99 ? '99+' : CART_COUNT}
                            </Badge>
                        )}
                    </Button>

                    <div className="h-8 w-px bg-zinc-200 mx-1 hidden sm:block" />

                    {isAuthenticated && user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger >
                                <button className="outline-none ml-1 transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 rounded-full">
                                    <Avatar className="size-9 sm:size-10 border-2 border-white shadow-md shadow-zinc-200/50 hover:border-zinc-300 transition-colors">
                                        <AvatarImage src={user.avatarUrl || " "} alt={user.name} />
                                        <AvatarFallback className="bg-zinc-100 text-zinc-950 text-sm font-black">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 mt-2 p-2 rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-200/50">
                                <div className="px-3 py-3 mb-2 bg-zinc-50 rounded-xl border border-zinc-100">
                                    <p className="text-sm font-black text-zinc-950 leading-tight mb-0.5">{user.name}</p>
                                    <p className="text-xs font-medium text-zinc-500 truncate">{user.email}</p>
                                </div>
                                <DropdownMenuGroup>
                                    <DropdownMenuItem onClick={() => navigate("/account")} className="cursor-pointer gap-3 py-2.5 px-3 rounded-xl text-sm font-bold text-zinc-600 focus:bg-zinc-100 focus:text-zinc-950">
                                        <UserIcon className="size-4" /> Account Settings
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate("/orders")} className="cursor-pointer gap-3 py-2.5 px-3 rounded-xl text-sm font-bold text-zinc-600 focus:bg-zinc-100 focus:text-zinc-950">
                                        <Package className="size-4" /> My Orders
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate("/store/settings")} className="cursor-pointer gap-3 py-2.5 px-3 rounded-xl text-sm font-bold text-zinc-600 focus:bg-zinc-100 focus:text-zinc-950">
                                        <Settings className="size-4" /> Store Dashboard
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator className="my-1.5 bg-zinc-100" />
                                <DropdownMenuItem
                                    onClick={() => logout.mutate()}
                                    className="cursor-pointer gap-3 py-2.5 px-3 rounded-xl text-sm font-bold text-red-600 focus:bg-red-50 focus:text-red-700"
                                >
                                    <LogOut className="size-4" /> Sign out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex items-center gap-2 sm:gap-3 ml-1">
                            <Button 
                                variant="ghost" 
                                className="hidden sm:inline-flex font-bold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-full px-5 h-10 transition-colors" 
                                onClick={() => navigate("/login")}
                            >
                                Sign In
                            </Button>
                            <Button 
                                className="bg-zinc-950 hover:bg-zinc-800 text-white border-0 rounded-full px-6 h-10 font-bold shadow-sm transition-all active:scale-95" 
                                onClick={() => navigate("/register")}
                            >
                                Sign Up
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}