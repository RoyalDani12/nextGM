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
} from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

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

const CATEGORIES_MEGA_MENU = [
  {
    title: "Apparel & Style",
    items: [
      "Men's & Women's Wear",
      "Footwear & Sneakers",
      "Bags & Leather Goods",
      "Custom Merchandise",
      "Watches & Jewelry",
    ],
  },
  {
    title: "Tech & Electronics",
    items: [
      "Smartphones & Accessories",
      "Audio & Headphones",
      "Power Banks & Chargers",
      "Smart Home Hardware",
      "Cable Management",
    ],
  },
  {
    title: "Home & Workspace",
    items: [
      "Ergonomic Desk Setup",
      "Mechanical Keyboards",
      "Office & Ambient Lighting",
      "Desk Organizers",
      "Decor & Furniture",
    ],
  },
  {
    title: "Sports & Personal Care",
    items: [
      "Fitness Gear & Equipment",
      "Outdoor & Camping",
      "Skincare & Grooming",
      "Travel Accessories",
    ],
  },
];

interface MarketplaceDesktopNavProps {
  cartItemCount: number;
  onCart: () => void;
}

export const MarketplaceDesktopNav = ({
  cartItemCount,
  onCart,
}: MarketplaceDesktopNavProps) => {
  return (
    <NavigationMenu className="hidden lg:flex">
      <NavigationMenuList className="flex items-center gap-1.5">

        {/* Explore */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 data-[state=open]:bg-slate-800 data-[state=open]:text-white px-3 py-2 rounded-xl transition-all cursor-pointer">
            Explore
          </NavigationMenuTrigger>

          <NavigationMenuContent className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-[850px] grid grid-cols-12 gap-6 text-slate-100">
            <div className="col-span-8 grid grid-cols-2 gap-6">
              {EXPLORE_MEGA_MENU.sections.map((section) => (
                <div
                  key={section.title}
                  className="space-y-3"
                >
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {section.title}
                  </h4>

                  <div className="space-y-1">
                    {section.links.map((link) => {
                      const Icon = link.icon;

                      return (
                        <Link
                          key={link.name}
                          to={link.href}
                          className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800 transition-all group"
                        >
                          <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:bg-orange-500/20 group-hover:text-orange-400 transition-all shadow-xs">
                            <Icon className="size-4" />
                          </div>

                          <div>
                            <div className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                              {link.name}
                            </div>

                            <p className="text-xs text-slate-400 line-clamp-1">
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

            <div className="col-span-4 rounded-xl p-5 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 flex flex-col justify-between relative overflow-hidden shadow-xl">
              <div className="space-y-2">
                <span className="inline-block bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wide">
                  {EXPLORE_MEGA_MENU.featured.badge}
                </span>

                <h3 className="text-base font-bold text-white leading-snug">
                  {EXPLORE_MEGA_MENU.featured.title}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {EXPLORE_MEGA_MENU.featured.description}
                </p>
              </div>

              <Link
                to={EXPLORE_MEGA_MENU.featured.href}
                className="mt-4 flex items-center justify-between font-bold text-xs text-orange-400 hover:text-orange-300 transition-colors group"
              >
                <span>Browse Collection</span>
                <ArrowRight className="size-4 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Categories */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 data-[state=open]:bg-slate-800 data-[state=open]:text-white px-3 py-2 rounded-xl transition-all cursor-pointer">
            Categories
          </NavigationMenuTrigger>

          <NavigationMenuContent className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-[750px] grid grid-cols-4 gap-6 text-slate-100">
            {CATEGORIES_MEGA_MENU.map((column) => (
              <div
                key={column.title}
                className="space-y-3"
              >
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {column.title}
                </h4>

                <ul className="space-y-2">
                  {column.items.map((item) => (
                    <li key={item}>
                      <Link
                        to={`/categories/${item
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                        className="text-xs font-medium text-slate-400 hover:text-orange-400 transition-colors block py-1"
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

        {/* How It Works */}
        <NavigationMenuItem>
          <Link
            to="/how-it-works"
            className={`${navigationMenuTriggerStyle()} bg-transparent text-sm font-semibold px-3 py-2 rounded-xl transition-all text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer`}
          >
            How It Works
          </Link>
        </NavigationMenuItem>

        {/* Pricing */}
        <NavigationMenuItem>
          <Link
            to="/pricing"
            className={`${navigationMenuTriggerStyle()} bg-transparent text-sm font-semibold px-3 py-2 rounded-xl transition-all text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer`}
          >
            Pricing
          </Link>
        </NavigationMenuItem>

        {/* Cart */}
        <NavigationMenuItem>
          <button
            onClick={onCart}
            aria-label="Shopping Cart"
            className="relative flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all group cursor-pointer ml-1"
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