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
import { useMarketplaceCategories } from "./marketplace.hooks";

const getCategoryIcon = (name: string) => {
  const n = name.toLowerCase();
  if (
    n.includes("apparel") ||
    n.includes("cloth") ||
    n.includes("shirt") ||
    n.includes("men") ||
    n.includes("women") ||
    n.includes("child") ||
    n.includes("style")
  ) {
    return Shirt;
  }
  if (
    n.includes("tech") ||
    n.includes("electr") ||
    n.includes("device") ||
    n.includes("laptop") ||
    n.includes("phone")
  ) {
    return Laptop;
  }
  if (
    n.includes("home") ||
    n.includes("space") ||
    n.includes("work") ||
    n.includes("furnit") ||
    n.includes("decor")
  ) {
    return Home;
  }
  if (
    n.includes("beauty") ||
    n.includes("health") ||
    n.includes("care") ||
    n.includes("skin")
  ) {
    return HeartPulse;
  }
  if (
    n.includes("sport") ||
    n.includes("gym") ||
    n.includes("fit") ||
    n.includes("outdoor")
  ) {
    return Trophy;
  }
  return Sparkle;
};

const DEFAULT_CATEGORY_LINKS = [
  {
    name: "Apparel & Fashion",
    desc: "Streetwear, footwear & custom merch",
    href: "/?categorySlug=apparel#marketplace-products",
    icon: Shirt,
  },
  {
    name: "Tech & Electronics",
    desc: "Gadgets, audio gear & accessories",
    href: "/?categorySlug=tech#marketplace-products",
    icon: Laptop,
  },
  {
    name: "Home & Workspace",
    desc: "Furniture, lighting & desk accessories",
    href: "/?categorySlug=workspace#marketplace-products",
    icon: Home,
  },
  {
    name: "Beauty & Personal",
    desc: "Skincare, grooming & wellness items",
    href: "/?categorySlug=beauty#marketplace-products",
    icon: HeartPulse,
  },
  {
    name: "Sports & Outdoor",
    desc: "Outdoor essentials & gym equipment",
    href: "/?categorySlug=sports#marketplace-products",
    icon: Trophy,
  },
];

const HIGHLIGHT_LINKS = [
  {
    name: "Verified Vendors",
    desc: "Hand-picked independent physical vendors",
    href: "/?verifiedShopsOnly=true#marketplace-products",
    icon: ShieldCheck,
  },
  {
    name: "Hot Deals & Drops",
    desc: "Limited-time physical product discounts",
    href: "/#marketplace-deals",
    icon: Flame,
  },
  {
    name: "Trending Items",
    desc: "Most popular physical goods this week",
    href: "/?sort=rating&order=desc#marketplace-products",
    icon: TrendingUp,
  },
];

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
  const { data: categories = [] } = useMarketplaceCategories();

  const handleNavScroll = (href: string) => {
    if (href.includes("#marketplace-deals")) {
      document.getElementById("marketplace-deals")?.scrollIntoView({ behavior: "smooth" });
    } else if (href.includes("#marketplace-products")) {
      document.getElementById("marketplace-products")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const dynamicCategoryLinks =
    categories.length > 0
      ? [
          ...categories.slice(0, 5).map((cat) => ({
            name: cat.name,
            desc: `${cat.productCount} item${cat.productCount === 1 ? "" : "s"} · ${cat.children?.length || 0} subcategories`,
            href: `/?categorySlug=${cat.slug}#marketplace-products`,
            icon: getCategoryIcon(cat.name),
          })),
          {
            name: "New Arrivals",
            desc: "Latest physical products added",
            href: "/?sort=createdAt&order=desc#marketplace-products",
            icon: Sparkle,
          },
        ]
      : [
          ...DEFAULT_CATEGORY_LINKS,
          {
            name: "New Arrivals",
            desc: "Latest physical products added",
            href: "/?sort=createdAt&order=desc#marketplace-products",
            icon: Sparkle,
          },
        ];

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
              {/* Explore Categories Column */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Explore Categories
                </h4>

                <div className="space-y-1">
                  {dynamicCategoryLinks.map((link) => {
                    const Icon = link.icon;

                    return (
                      <Link
                        key={link.name}
                        to={link.href}
                        onClick={() => handleNavScroll(link.href)}
                        className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-all group cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all shadow-xs">
                          <Icon className="size-4" />
                        </div>

                        <div>
                          <div className="text-sm font-semibold text-slate-800 group-hover:text-orange-500 transition-colors">
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

              {/* Marketplace Highlights Column */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Marketplace Highlights
                </h4>

                <div className="space-y-1">
                  {HIGHLIGHT_LINKS.map((link) => {
                    const Icon = link.icon;

                    return (
                      <Link
                        key={link.name}
                        to={link.href}
                        onClick={() => handleNavScroll(link.href)}
                        className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-all group cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all shadow-xs">
                          <Icon className="size-4" />
                        </div>

                        <div>
                          <div className="text-sm font-semibold text-slate-800 group-hover:text-orange-500 transition-colors">
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
            </div>

            {/* Featured Card */}
            <div className="relative col-span-4 flex flex-col justify-between overflow-hidden rounded-xl border border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-orange-100/40 p-5 shadow-xl">
              <div className="space-y-2">
                <span className="inline-block bg-white border border-orange-200 text-orange-600 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wide">
                  Hot Products
                </span>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  Curated Store Drops
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Discover top-rated physical goods, custom apparel, and tech gear from verified vendors.
                </p>
              </div>

              <Link
                to="/?verifiedShopsOnly=true&sort=rating&order=desc#marketplace-products"
                onClick={() => handleNavScroll("#marketplace-products")}
                className="mt-4 flex items-center justify-between font-bold text-xs text-orange-600 hover:text-orange-700 transition-colors group cursor-pointer"
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
            className="relative ml-1 flex items-center gap-2 rounded-full px-3 py-2 text-slate-700 transition-all group cursor-pointer hover:bg-orange-50 hover:text-orange-500"
          >
            <div className="relative">
              <ShoppingCart className="size-6 group-hover:scale-105 transition-transform" />

              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-extrabold text-white shadow-sm shadow-orange-500/30">
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
