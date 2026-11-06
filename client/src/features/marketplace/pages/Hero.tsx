import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertCircle, ArrowRight, BadgeCheck, Grid2X2, List, Loader2, PackageOpen, RotateCcw, Search, ShoppingBag, Sparkles, Star, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DealCard } from "../components/DealCard";
import { ProductDetailView } from "../components/ProductDetailView";
import { MarketplaceFilterSidebar } from "../components/MarketplaceFilterSidebar";
import { MobileFilterSheet } from "../components/MobileFilterSheet";
import { PromotionCarousel } from "../components/PromotionCarousel";
import { MarketplaceHeroCarousel } from "../components/MarketplaceHeroCarousel";
import { emptyCatalogFilters, sortOptions, type CatalogFilters } from "../components/marketplace.filters";
import { useMarketplaceCategories, useMarketplaceProducts } from "../components/marketplace.hooks";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

type MarketplaceProduct = { id: string; name: string; description?: string; basePrice: number | string; type?: string; averageRating?: number; reviewCount?: number; images?: Array<{ url?: string }>; shop?: { slug?: string; profile?: { name?: string } }; promotion?: { code: string; type: "PERCENTAGE" | "FIXED_AMOUNT"; value: number | string; minOrderAmount?: number | string | null; expiresAt?: string | null } | null };

export default function Hero() {
  const [params, setParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(params.get("search") || "");
  const [search, setSearch] = useState(params.get("search") || "");
  const [filters, setFilters] = useState<CatalogFilters>({ ...emptyCatalogFilters, categorySlug: params.get("categorySlug") || undefined });
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const { data: categories = [] } = useMarketplaceCategories();
  const {
    data,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMarketplaceProducts({ ...filters, search });
  const products = (data?.pages.flatMap((page) => page.products) || []) as MarketplaceProduct[];
  const firstPage = data?.pages[0];
  const total = firstPage?.pagination?.total || 0;
  const breadcrumb = firstPage?.categoryBreadcrumb || [];

  useEffect(() => {
    const slug = params.get("categorySlug") || undefined;
    const query = params.get("search") || "";
    setFilters((current) => current.categorySlug === slug ? current : { ...current, categorySlug: slug });
    setSearchInput(query);
    setSearch(query);
  }, [params]);
  const changeFilters = (next: CatalogFilters) => { setFilters(next); const query = new URLSearchParams(params); if (next.categorySlug) query.set("categorySlug", next.categorySlug); else query.delete("categorySlug"); setParams(query, { replace: true }); };
  const reset = () => { setSearch(""); setSearchInput(""); changeFilters({ ...emptyCatalogFilters }); };
  const activeChips = useMemo(() => {
    const category = categories.flatMap((parent) => [parent, ...parent.children]).find((item) => item.slug === filters.categorySlug);
    return [
      category && { label: `Category: ${category.name}`, clear: () => changeFilters({ ...filters, categorySlug: undefined }) },
      filters.minPrice || filters.maxPrice ? { label: `Price: $${filters.minPrice || "0"} – $${filters.maxPrice || "∞"}`, clear: () => changeFilters({ ...filters, minPrice: undefined, maxPrice: undefined }) } : null,
      filters.minRating ? { label: `Rating: ${filters.minRating}★ & Up`, clear: () => changeFilters({ ...filters, minRating: undefined }) } : null,
      filters.inStockOnly ? { label: "In Stock Only", clear: () => changeFilters({ ...filters, inStockOnly: undefined }) } : null,
      filters.verifiedShopsOnly ? { label: "Verified Stores", clear: () => changeFilters({ ...filters, verifiedShopsOnly: undefined }) } : null,
      filters.type ? { label: `Format: ${filters.type === "PHYSICAL" ? "Physical" : "Digital"}`, clear: () => changeFilters({ ...filters, type: undefined }) } : null,
    ].filter(Boolean) as Array<{ label: string; clear: () => void }>;
  }, [categories, filters]);
  const selectedSort = `${filters.sort || "createdAt"}:${filters.order || "desc"}`;

  const heroProducts = products.slice(0, 3);
  const compactHeroProduct = products[0];
  const showLegacyHero = false;
  const runSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = searchInput.trim();
    setSearch(query);
    const next = new URLSearchParams(params);
    if (query) next.set("search", query); else next.delete("search");
    setParams(next, { replace: true });
  };

  return <div className="w-full bg-slate-50 text-slate-900">
    {showLegacyHero && <section aria-hidden="true">
      <div className="hero-grid absolute inset-0 opacity-40" />
      <div className="hero-orb hero-orb-one" /><div className="hero-orb hero-orb-two" /><div className="hero-orb hero-orb-three" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.06fr_.94fr] lg:gap-16">
        <div className="hero-reveal">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold tracking-wide text-orange-100 backdrop-blur">
            <Sparkles className="size-3.5 text-orange-300" /> The new way to discover independent brands
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[.96] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Your next <span className="hero-gradient-text">favorite find</span> is closer than you think.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">Thoughtful objects, standout essentials and emerging brands—curated from independent stores worth knowing.</p>
          <form onSubmit={runSearch} className="hero-search mt-8 flex max-w-xl items-center gap-2 rounded-2xl p-2 shadow-2xl shadow-slate-950/40">
            <Search className="ml-3 size-5 shrink-0 text-slate-400" />
            <Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="What are you looking for?" className="h-11 border-0 bg-transparent px-2 text-base text-slate-950 shadow-none placeholder:text-slate-400 focus-visible:ring-0" />
            <Button type="submit" className="h-11 rounded-xl bg-slate-950 px-5 font-bold text-white shadow-lg transition-transform hover:scale-[1.03] hover:bg-slate-800">Explore <ArrowRight className="ml-1.5 size-4" /></Button>
          </form>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-slate-300">
            <span className="inline-flex items-center gap-2"><BadgeCheck className="size-4 text-emerald-300" /> Verified independent stores</span>
            <span className="inline-flex items-center gap-2"><Star className="size-4 fill-orange-300 text-orange-300" /> Fresh drops every week</span>
          </div>
        </div>
        <div className="hero-showcase hero-reveal-delayed relative mx-auto w-full max-w-lg">
          <div className="hero-halo absolute inset-10 rounded-full" />
          <div className="relative grid grid-cols-2 gap-4 p-4 sm:gap-5 sm:p-6">
            <div className="hero-product hero-product-tall row-span-2 overflow-hidden rounded-[2rem] border border-white/20 bg-slate-800 shadow-2xl shadow-slate-950/50">
              {heroProducts[0]?.images?.[0]?.url ? <img src={heroProducts[0]?.images?.[0]?.url} alt={heroProducts[0]?.name} className="h-full w-full object-cover" /> : <div className="hero-product-fallback h-full" />}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent p-5 pt-16"><p className="text-xs font-medium text-slate-300">Curated for you</p><p className="mt-1 font-bold">{heroProducts[0]?.name || "Everyday essentials"}</p></div>
            </div>
            <div className="hero-product hero-product-small overflow-hidden rounded-[1.65rem] border border-white/20 bg-orange-100 shadow-xl shadow-slate-950/30">
              {heroProducts[1]?.images?.[0]?.url ? <img src={heroProducts[1]?.images?.[0]?.url} alt={heroProducts[1]?.name} className="h-full w-full object-cover" /> : <div className="hero-product-fallback-alt h-full" />}
            </div>
            <div className="hero-stat rounded-[1.65rem] border border-white/15 bg-white/10 p-5 backdrop-blur-xl"><span className="text-3xl font-black tracking-tight">100%</span><p className="mt-1 text-xs font-medium leading-5 text-slate-300">Independent<br />storefronts</p></div>
          </div>
          <div className="hero-float-card absolute -bottom-3 -left-2 flex items-center gap-3 rounded-2xl border border-white/15 bg-slate-950/75 p-3 pr-5 shadow-2xl backdrop-blur-xl sm:-left-7"><span className="flex size-10 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm shadow-orange-500/30"><ShoppingBag className="size-5" /></span><span><span className="block text-xs text-slate-400">Made for discovery</span><strong className="text-sm">Find your next thing</strong></span></div>
        </div>
      </div>
    </section>}
    {showLegacyHero && <section className="compact-hero relative isolate h-[320px] overflow-hidden text-white sm:h-[350px] lg:h-[370px]">
      <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#18223c] to-[#31233a]" />
      <div className="compact-hero-glow absolute -right-16 -top-24 hidden h-[430px] w-[430px] rounded-full lg:block" />
      <div className="absolute inset-y-0 right-0 hidden w-[48%] lg:block">
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#18223c] via-transparent to-transparent" />
        {compactHeroProduct?.images?.[0]?.url ? <img src={compactHeroProduct?.images?.[0]?.url} alt="Featured product" className="h-full w-full object-cover opacity-90" /> : <div className="h-full w-full compact-hero-art" />}
      </div>
      <div className="relative mx-auto flex h-full max-w-7xl items-center px-5 sm:px-8 lg:px-10">
        <div className="compact-hero-content max-w-xl">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-orange-300"><span className="h-px w-7 bg-orange-300" /> New season, new finds</p>
          <h1 className="mt-4 text-4xl font-black leading-[.98] tracking-[-.045em] sm:text-5xl">Made for your<br /><span className="text-orange-300">everyday discovery.</span></h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-300 sm:text-base">Explore trusted independent stores and discover products that feel made for you.</p>
          <div className="mt-6 flex items-center gap-3"><Button onClick={() => document.getElementById("marketplace-products")?.scrollIntoView({ behavior: "smooth" })} className="h-10 rounded-lg bg-orange-500 px-5 font-bold text-white hover:bg-orange-600 shadow-md shadow-orange-500/25">Shop now <ArrowRight className="ml-1.5 size-4" /></Button><span className="hidden items-center gap-1.5 text-xs font-medium text-slate-300 sm:inline-flex"><BadgeCheck className="size-4 text-emerald-300" /> Verified sellers</span></div>
          <div className="mt-6 flex gap-2 overflow-hidden sm:mt-7">{categories.slice(0, 4).map((category) => <button key={category.id} onClick={() => changeFilters({ ...filters, categorySlug: category.slug })} className="shrink-0 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-white/20">{category.name}</button>)}</div>
        </div>
      </div>
    </section>}
    <MarketplaceHeroCarousel products={products} categories={categories} onCategory={(slug) => changeFilters({ ...filters, categorySlug: slug })} />
    <main id="marketplace-products" className="w-full px-4 py-6 pb-20 sm:px-6 lg:px-10 lg:pb-16 mb-8 font-sans">
      <PromotionCarousel onSelect={setSelectedProductId} />

      {/* 2-Column Alibaba / Enterprise SaaS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Column (w-72 / 1 col on lg): Sticky Desktop Sidebar */}
        <div className="hidden lg:block lg:col-span-1 sticky top-24 self-start">
          <MarketplaceFilterSidebar
            categories={categories}
            filters={filters}
            onChange={changeFilters}
            onReset={reset}
          />
        </div>

        {/* Right Column (3 cols): Top Utility Bar + Active Chips + Product Grid */}
        <div className="lg:col-span-3 min-w-0">
          {/* Top Utility & Active Filter Chips Bar */}
          <div className="mb-6 space-y-3 animate-fade-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
              <div>
                <nav className="mb-1 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                  <span>Marketplace</span>
                  {breadcrumb.map((item) => (
                    <span key={item.id} className="flex items-center gap-1">
                      <span className="text-slate-300">›</span>
                      <button
                        onClick={() => changeFilters({ ...filters, categorySlug: item.slug })}
                        className="hover:text-orange-500 transition-colors cursor-pointer font-medium"
                      >
                        {item.name}
                      </button>
                    </span>
                  ))}
                </nav>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <ShoppingBag className="size-5 text-orange-500" />
                  {breadcrumb.at(-1)?.name || "All Products"}
                </h1>
                <p className="mt-0.5 text-xs text-slate-500 font-medium">
                  Showing {total ? `1–${products.length} of ${total}` : "0"} products
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Sort dropdown */}
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-bold text-slate-500 hidden sm:inline">Sort:</label>
                  <select
                    value={selectedSort}
                    onChange={(event) => {
                      const [sort, order] = event.target.value.split(":");
                      changeFilters({
                        ...filters,
                        sort: sort as CatalogFilters["sort"],
                        order: order as CatalogFilters["order"],
                      });
                    }}
                    className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs focus:border-orange-500 focus:outline-none cursor-pointer"
                  >
                    {sortOptions.map((item) => (
                      <option key={item.label} value={`${item.sort}:${item.order}`}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* View switcher */}
                <div className="flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
                  <button
                    onClick={() => setView("grid")}
                    aria-label="Grid view"
                    className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                      view === "grid" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <Grid2X2 className="size-4" />
                  </button>
                  <button
                    onClick={() => setView("list")}
                    aria-label="List view"
                    className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                      view === "list" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <List className="size-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Active Removable Filter Chips Bar */}
            {activeChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1 animate-fade-in">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Active:
                </span>
                {activeChips.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={chip.clear}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 border border-orange-200 px-2.5 py-1 text-xs font-bold text-orange-600 hover:bg-orange-100 transition-colors group cursor-pointer shadow-2xs shadow-orange-500/5"
                  >
                    <span>{chip.label}</span>
                    <X className="size-3 text-orange-500 group-hover:text-orange-700 transition-colors" />
                  </button>
                ))}
                <button
                  onClick={reset}
                  className="ml-auto sm:ml-2 inline-flex items-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 text-xs font-bold shadow-sm shadow-orange-500/25 hover:shadow-md hover:shadow-orange-500/35 active:scale-95 transition-all cursor-pointer"
                  title="Clear all active filters"
                >
                  <RotateCcw className="size-3.5 stroke-[2.5]" />
                  <span>Clear All</span>
                </button>
              </div>
            )}
          </div>

          {/* Skeleton Pulse Loader */}
          {isLoading && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-3 2xl:grid-cols-4 animate-fade-in">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-100 bg-white p-2.5 flex flex-col justify-between overflow-hidden shadow-2xs"
                >
                  <div className="space-y-2">
                    <div className="aspect-square w-full max-h-[170px] sm:max-h-[190px] rounded-lg bg-slate-100 animate-pulse" />
                    <div className="space-y-1.5 px-0.5 pt-1">
                      <div className="h-3 w-4/5 rounded bg-slate-100 animate-pulse" />
                      <div className="h-2.5 w-1/2 rounded bg-slate-100 animate-pulse" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100/80">
                    <div className="h-4 w-14 rounded bg-slate-100 animate-pulse" />
                    <div className="h-3 w-10 rounded bg-slate-100 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl border border-rose-200 bg-rose-50/70 text-center animate-fade-in space-y-3.5 mx-auto max-w-lg my-6">
              <div className="size-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                <AlertCircle className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-rose-900">Products could not be loaded</h3>
                <p className="text-xs text-rose-700/90 max-w-xs">
                  Please check your connection and retry.
                </p>
              </div>
              <Button
                onClick={() => refetch()}
                variant="outline"
                size="sm"
                className="rounded-xl border-rose-300 hover:bg-rose-100 text-rose-700 font-bold text-xs shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="size-3.5 text-rose-600" />
                <span>Retry</span>
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && products.length === 0 && (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500 animate-fade-in">
              <PackageOpen className="size-12 text-slate-300" />
              <h3 className="mt-3 text-base font-bold text-slate-800">No products found</h3>
              <p className="mt-1 text-xs text-slate-400 max-w-xs">
                No items match your active filters. Try broadening your criteria or reset filters.
              </p>
              <button
                onClick={reset}
                className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-orange-500 hover:shadow-md hover:shadow-orange-500/25 transition-all cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Active Product Grid Matrix */}
          {!isLoading && !isError && products.length > 0 && (
            view === "grid" ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-3 2xl:grid-cols-4 justify-items-center sm:justify-items-stretch animate-fade-up">
                {products.map((product, idx) => (
                  <div key={product.id} className="w-full max-w-[280px] sm:max-w-none">
                    <ScrollReveal delayMs={(idx % 6) * 40} direction="up">
                      <DealCard
                        id={product.id}
                        image={product.images?.[0]?.url}
                        name={product.name}
                        seller={product.shop?.profile?.name || product.shop?.slug}
                        price={product.basePrice}
                        promotion={product.promotion}
                        type={product.type}
                        onSelect={setSelectedProductId}
                      />
                    </ScrollReveal>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 animate-fade-up">
                {products.map((product, idx) => (
                  <ScrollReveal key={product.id} delayMs={(idx % 6) * 40} direction="up">
                    <button
                      key={product.id}
                      onClick={() => setSelectedProductId(product.id)}
                      className="flex w-full gap-4 rounded-xl border border-slate-100 bg-white p-3 text-left hover:border-orange-300 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 cursor-pointer"
                    >
                      <img
                        src={product.images?.[0]?.url}
                        className="size-24 rounded-lg bg-slate-100 object-cover shrink-0"
                        alt={product.name}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold text-slate-900 text-sm">{product.name}</span>
                        <span className="mt-1 block text-xs text-slate-500 font-medium">
                          {product.shop?.profile?.name || product.shop?.slug}
                        </span>
                        <span className="mt-2 flex items-center gap-1 text-xs text-slate-600 font-semibold">
                          <Star className="size-3 fill-yellow-400 text-yellow-400" />
                          {product.averageRating?.toFixed(1) || "New"} ({product.reviewCount || 0})
                        </span>
                      </span>
                      <span className="font-black text-slate-900 text-base shrink-0">${product.basePrice}</span>
                    </button>
                  </ScrollReveal>
                ))}
              </div>
            )
          )}

          {/* Load More Button */}
          {!isLoading && !isError && hasNextPage && (
            <div className="mt-10 flex justify-center">
              <Button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="min-w-44 rounded-xl bg-slate-900 hover:bg-orange-500 hover:shadow-md hover:shadow-orange-500/25 px-6 py-3 text-xs font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer shadow-md"
              >
                {isFetchingNextPage && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isFetchingNextPage ? "Loading products..." : "Load more products"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </main><MobileFilterSheet categories={categories} filters={filters} total={total} onChange={changeFilters} onReset={reset}/><ProductDetailView productId={selectedProductId} isOpen={Boolean(selectedProductId)} onClose={() => setSelectedProductId(null)}/>
  </div>;
}
