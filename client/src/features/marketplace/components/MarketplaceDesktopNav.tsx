import { Link } from "react-router-dom";
import {
  ArrowRight,
  Flame,
  HeartPulse,
  Home,
  Laptop,
  ShieldCheck,
  Shirt,
  Sparkle,
  Trophy,
  TrendingUp,
  ShoppingCart,
  Heart,
} from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { MarketplaceMegaMenu } from "./MarketplaceMegaMenu";

const EXPLORE_MEGA_MENU = {
  featured: {
    title: "Curated Store Drops",
    description:
      "Discover top-rated physical goods, custom apparel, and tech gear from verified vendors.",
    badge: "Hot Products",
    href: "/collections/featured",
  },

  sections: [
    {
      title: "Explore Categories",
      links: [
        {
          name: "Apparel & Fashion",
          desc: "Streetwear, footwear & custom merch",
          href: "/categories/apparel",
          icon: Shirt,
        },
        {
          name: "Tech & Electronics",
          desc: "Gadgets, audio gear & accessories",
          href: "/categories/tech",
          icon: Laptop,
        },
        {
          name: "Home & Workspace",
          desc: "Furniture, lighting & desk accessories",
          href: "/categories/workspace",
          icon: Home,
        },
        {
          name: "Beauty & Personal",
          desc: "Skincare, grooming & wellness items",
          href: "/categories/beauty",
          icon: HeartPulse,
        },
        {
          name: "Sports & Outdoor",
          desc: "Outdoor essentials & gym equipment",
          href: "/categories/sports",
          icon: Trophy,
        },
        {
          name: "New Arrivals",
          desc: "Latest physical products added",
          href: "/new-arrivals",
          icon: Sparkle,
        },
      ],
    },
    {
      title: "Marketplace Highlights",
      links: [
        {
          name: "Verified Vendors",
          desc: "Hand-picked independent physical vendors",
          href: "/vendors?filter=verified",
          icon: ShieldCheck,
        },
        {
          name: "Hot Deals & Drops",
          desc: "Limited-time physical product discounts",
          href: "/deals",
          icon: Flame,
        },
        {
          name: "Trending Items",
          desc: "Most popular physical goods this week",
          href: "/trending",
          icon: TrendingUp,
        },
      ],
    },
  ],
};

interface MarketplaceDesktopNavProps {
  cartItemCount: number;
  onCart: () => void;
  wishlistItemCount?: number;
  onWishlist?: () => void;
}

export const MarketplaceDesktopNav = ({
  cartItemCount,
  onCart,
  wishlistItemCount = 0,
  onWishlist,
}: MarketplaceDesktopNavProps) => {
  return (
    <NavigationMenu className="hidden lg:flex">
      <NavigationMenuList className="flex items-center gap-1.5">

        {/* Explore */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent text-sm font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 data-[state=open]:bg-slate-100 data-[state=open]:text-slate-950 px-3 py-2 rounded-full transition-all cursor-pointer">
            Explore
          </NavigationMenuTrigger>

          <NavigationMenuContent className="grid w-[850px] grid-cols-12 gap-6 rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl">
            <div className="col-span-8 grid grid-cols-2 gap-6">
              {EXPLORE_MEGA_MENU.sections.map((section) => (
                <div
                  key={section.title}
                  className="space-y-3"
                >
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {section.title}
                  </h4>

                  <div className="space-y-1">
                    {section.links.map((link) => {
                      const Icon = link.icon;

                      return (
                        <Link
                          key={link.name}
                          to={link.href}
                          className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-all group"
                        >
                          <div className="p-2 rounded-lg bg-blue-50 text-[#3665f3] group-hover:bg-[#3665f3] group-hover:text-white transition-all shadow-xs">
                            <Icon className="size-4" />
                          </div>

                          <div>
                            <div className="text-sm font-semibold text-slate-800 group-hover:text-[#3665f3] transition-colors">
                              {link.name}
                            </div>

                            <p className="text-xs text-slate-500 line-clamp-1">
                              {link.desc}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="relative col-span-4 flex flex-col justify-between overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-100 p-5 shadow-xl">
              <div className="space-y-2">
                <span className="inline-block bg-white border border-blue-200 text-[#3665f3] text-[10px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wide">
                  {EXPLORE_MEGA_MENU.featured.badge}
                </span>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {EXPLORE_MEGA_MENU.featured.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {EXPLORE_MEGA_MENU.featured.description}
                </p>
              </div>

              <Link
                to={EXPLORE_MEGA_MENU.featured.href}
                className="mt-4 flex items-center justify-between font-bold text-xs text-[#3665f3] hover:text-[#2854d9] transition-colors group"
              >
                <span>Browse Collection</span>
                <ArrowRight className="size-4 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Categories */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent text-sm font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 data-[state=open]:bg-slate-100 data-[state=open]:text-slate-950 px-3 py-2 rounded-full transition-all cursor-pointer">
            Categories
          </NavigationMenuTrigger>

          <NavigationMenuContent><MarketplaceMegaMenu /></NavigationMenuContent>
        </NavigationMenuItem>

        {/* How It Works */}
        <NavigationMenuItem>
          <Link
            to="/how-it-works"
            className={`${navigationMenuTriggerStyle()} bg-transparent text-sm font-semibold px-3 py-2 rounded-full transition-all text-slate-700 hover:text-slate-950 hover:bg-slate-100 cursor-pointer`}
          >
            How It Works
          </Link>
        </NavigationMenuItem>

        {/* Wishlist */}
        <NavigationMenuItem>
          <button
            onClick={onWishlist}
            aria-label="Wishlist"
            className="relative ml-1 flex items-center gap-2 rounded-full px-3 py-2 text-slate-700 transition-all group cursor-pointer hover:bg-rose-50 hover:text-rose-500"
          >
            <div className="relative">
              <Heart className="size-6 group-hover:scale-105 group-hover:text-rose-400 transition-all" />

              {wishlistItemCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white shadow-sm">
                  {wishlistItemCount}
                </span>
              )}
            </div>

            <span className="text-xs font-bold hidden xl:inline">
              Wishlist
            </span>
          </button>
        </NavigationMenuItem>

        {/* Cart */}
        <NavigationMenuItem>
          <button
            onClick={onCart}
            aria-label="Shopping Cart"
            className="relative ml-1 flex items-center gap-2 rounded-full px-3 py-2 text-slate-700 transition-all group cursor-pointer hover:bg-blue-50 hover:text-[#3665f3]"
          >
            <div className="relative">
              <ShoppingCart className="size-6 group-hover:scale-105 transition-transform" />

              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-extrabold text-white shadow-sm">
                  {cartItemCount}
                </span>
              )}
            </div>

            <span className="text-xs font-bold hidden xl:inline">
              Cart
            </span>
          </button>
        </NavigationMenuItem>

      </NavigationMenuList>
    </NavigationMenu>
  );
};
