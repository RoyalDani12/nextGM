import { ArrowRight, BadgeCheck, Flame, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useMarketplaceCategories } from "./marketplace.hooks";

const cardStyles = [
  "from-orange-50 to-amber-50 border-orange-100",
  "from-amber-50 to-orange-50 border-orange-100",
  "from-emerald-50 to-teal-50 border-emerald-100",
  "from-violet-50 to-fuchsia-50 border-violet-100",
];

export function MarketplaceMegaMenu() {
  const { data: categories = [] } = useMarketplaceCategories();

  const handleNavScroll = (href: string) => {
    if (href.includes("#marketplace-deals")) {
      document.getElementById("marketplace-deals")?.scrollIntoView({ behavior: "smooth" });
    } else if (href.includes("#marketplace-products")) {
      document.getElementById("marketplace-products")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="grid w-[860px] grid-cols-12 gap-5 rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl">
      {/* Left: Browse departments */}
      <div className="col-span-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-orange-500">
              Browse departments
            </p>
            <p className="mt-1 text-sm text-slate-500">Find a good place to start.</p>
          </div>
          <Link
            to="/#marketplace-products"
            onClick={() => handleNavScroll("#marketplace-products")}
            className="text-xs font-bold text-orange-500 hover:text-orange-600 hover:underline cursor-pointer"
          >
            View all
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {categories.slice(0, 4).map((parent, index) => (
            <div
              key={parent.id}
              className={`group relative flex flex-col justify-between rounded-xl border bg-gradient-to-br p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                cardStyles[index % cardStyles.length]
              }`}
            >
              <Link
                to={`/?categorySlug=${parent.slug}#marketplace-products`}
                onClick={() => handleNavScroll("#marketplace-products")}
                className="block cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{parent.icon || "✦"}</span>
                  <ArrowRight className="size-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-orange-500" />
                </div>
                <h3 className="mt-3 text-sm font-extrabold text-slate-900 group-hover:text-orange-600 transition-colors">
                  {parent.name}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {parent.productCount} items · {parent.children.length} collections
                </p>
              </Link>

              {/* Subcategories (clickable pills) */}
              {parent.children.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 relative z-10">
                  {parent.children.slice(0, 3).map((child) => (
                    <Link
                      key={child.id}
                      to={`/?categorySlug=${child.slug}#marketplace-products`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavScroll("#marketplace-products");
                      }}
                      className="rounded-full bg-white/90 hover:bg-orange-500 hover:text-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 transition-all shadow-2xs hover:shadow-xs cursor-pointer border border-black/5"
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right: Why NextG */}
      <aside className="col-span-4 rounded-xl border border-orange-100 bg-gradient-to-b from-orange-50/40 to-white p-5 flex flex-col justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-orange-500">Why NextG</p>
          <div className="mt-5 space-y-3 text-sm">
            <Link
              to="/?verifiedShopsOnly=true#marketplace-products"
              onClick={() => handleNavScroll("#marketplace-products")}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-emerald-50/70 transition-colors group cursor-pointer"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 group-hover:scale-105 transition-transform">
                <BadgeCheck className="size-5" />
              </span>
              <span>
                <b className="text-slate-800 group-hover:text-emerald-700 transition-colors">Verified stores</b>
                <small className="mt-0.5 block text-slate-500">Shop from trusted independents.</small>
              </span>
            </Link>

            <Link
              to="/?sort=createdAt&order=desc#marketplace-products"
              onClick={() => handleNavScroll("#marketplace-products")}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-orange-50/70 transition-colors group cursor-pointer"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 group-hover:scale-105 transition-transform">
                <Flame className="size-5" />
              </span>
              <span>
                <b className="text-slate-800 group-hover:text-orange-600 transition-colors">New drops</b>
                <small className="mt-0.5 block text-slate-500">Fresh products worth discovering.</small>
              </span>
            </Link>

            <Link
              to="/?sort=rating&order=desc#marketplace-products"
              onClick={() => handleNavScroll("#marketplace-products")}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-orange-50/70 transition-colors group cursor-pointer"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 group-hover:scale-105 transition-transform">
                <TrendingUp className="size-5" />
              </span>
              <span>
                <b className="text-slate-800 group-hover:text-orange-600 transition-colors">Trending now</b>
                <small className="mt-0.5 block text-slate-500">See what shoppers are loving.</small>
              </span>
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
