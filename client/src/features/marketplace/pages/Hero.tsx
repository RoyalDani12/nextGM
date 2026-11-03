import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowRight, BadgeCheck, Grid2X2, List, Loader2, PackageOpen, RotateCcw, Search, ShoppingBag, SlidersHorizontal, Sparkles, Star, X } from "lucide-react";
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
      category && { label: category.name, clear: () => changeFilters({ ...filters, categorySlug: undefined }) },
      filters.minPrice || filters.maxPrice ? { label: `$${filters.minPrice || "0"} – $${filters.maxPrice || "∞"}`, clear: () => changeFilters({ ...filters, minPrice: undefined, maxPrice: undefined }) } : null,
      filters.minRating ? { label: `${filters.minRating}★ & Up`, clear: () => changeFilters({ ...filters, minRating: undefined }) } : null,
      filters.inStockOnly ? { label: "In Stock", clear: () => changeFilters({ ...filters, inStockOnly: undefined }) } : null,
      filters.verifiedShopsOnly ? { label: "Verified stores", clear: () => changeFilters({ ...filters, verifiedShopsOnly: undefined }) } : null,
      filters.type ? { label: filters.type === "PHYSICAL" ? "Physical" : "Digital", clear: () => changeFilters({ ...filters, type: undefined }) } : null,
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

  return <div className="min-h-screen bg-slate-50 text-slate-900">
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
            <div className="hero-product hero-product-small overflow-hidden rounded-[1.65rem] border border-white/20 bg-orange-200 shadow-xl shadow-slate-950/30">
              {heroProducts[1]?.images?.[0]?.url ? <img src={heroProducts[1]?.images?.[0]?.url} alt={heroProducts[1]?.name} className="h-full w-full object-cover" /> : <div className="hero-product-fallback-alt h-full" />}
            </div>
            <div className="hero-stat rounded-[1.65rem] border border-white/15 bg-white/10 p-5 backdrop-blur-xl"><span className="text-3xl font-black tracking-tight">100%</span><p className="mt-1 text-xs font-medium leading-5 text-slate-300">Independent<br />storefronts</p></div>
          </div>
          <div className="hero-float-card absolute -bottom-3 -left-2 flex items-center gap-3 rounded-2xl border border-white/15 bg-slate-950/75 p-3 pr-5 shadow-2xl backdrop-blur-xl sm:-left-7"><span className="flex size-10 items-center justify-center rounded-xl bg-orange-400 text-slate-950"><ShoppingBag className="size-5" /></span><span><span className="block text-xs text-slate-400">Made for discovery</span><strong className="text-sm">Find your next thing</strong></span></div>
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
          <div className="mt-6 flex items-center gap-3"><Button onClick={() => document.getElementById("marketplace-products")?.scrollIntoView({ behavior: "smooth" })} className="h-10 rounded-lg bg-orange-400 px-5 font-bold text-slate-950 hover:bg-orange-300">Shop now <ArrowRight className="ml-1.5 size-4" /></Button><span className="hidden items-center gap-1.5 text-xs font-medium text-slate-300 sm:inline-flex"><BadgeCheck className="size-4 text-emerald-300" /> Verified sellers</span></div>
          <div className="mt-6 flex gap-2 overflow-hidden sm:mt-7">{categories.slice(0, 4).map((category) => <button key={category.id} onClick={() => changeFilters({ ...filters, categorySlug: category.slug })} className="shrink-0 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-white/20">{category.name}</button>)}</div>
        </div>
      </div>
    </section>}
    <MarketplaceHeroCarousel products={products} categories={categories} onCategory={(slug) => changeFilters({ ...filters, categorySlug: slug })} />
    <main id="marketplace-products" className="w-full px-4 py-6 pb-24 sm:px-6 lg:px-10 lg:pb-8">
      <PromotionCarousel onSelect={setSelectedProductId} />
      <MarketplaceFilterSidebar categories={categories} filters={filters} onChange={changeFilters} onReset={reset}/>
      <div className="min-w-0">
        <div className="border-b border-slate-200 pb-4"><nav className="mb-3 flex flex-wrap gap-1 text-xs text-slate-500"><span>Marketplace</span>{breadcrumb.map((item) => <span key={item.id}>› <button onClick={() => changeFilters({ ...filters, categorySlug: item.slug })} className="hover:text-orange-600">{item.name}</button></span>)}</nav><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-black"><ShoppingBag className="size-5"/> {breadcrumb.at(-1)?.name || "All products"}</h2><p className="mt-1 text-sm text-slate-500">Showing {total ? `1–${products.length} of ${total}` : "0"} products</p></div><div className="hidden items-center gap-2 md:flex"><label className="text-xs font-bold text-slate-500">Sort</label><select value={selectedSort} onChange={(event) => { const [sort, order] = event.target.value.split(":"); changeFilters({ ...filters, sort: sort as CatalogFilters["sort"], order: order as CatalogFilters["order"] }); }} className="h-9 rounded border bg-white px-2 text-xs">{sortOptions.map((item) => <option key={item.label} value={`${item.sort}:${item.order}`}>{item.label}</option>)}</select><div className="flex rounded border p-0.5"><button onClick={() => setView("grid")} aria-label="Grid view" className={`rounded p-1.5 ${view === "grid" ? "bg-slate-900 text-white" : ""}`}><Grid2X2 className="size-4"/></button><button onClick={() => setView("list")} aria-label="List view" className={`rounded p-1.5 ${view === "list" ? "bg-slate-900 text-white" : ""}`}><List className="size-4"/></button></div></div></div></div>
        {activeChips.length > 0 && <div className="mt-4 flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-slate-500">Active:</span>{activeChips.map((chip) => <button key={chip.label} onClick={chip.clear} className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">{chip.label}<X className="size-3"/></button>)}<button onClick={reset} className="ml-1 text-xs font-bold text-slate-600 hover:text-slate-950"><RotateCcw className="mr-1 inline size-3"/>Clear all</button></div>}
        <div className="mt-5 flex flex-wrap gap-2 lg:hidden"><button onClick={() => changeFilters({ ...filters, type: filters.type === "PHYSICAL" ? undefined : "PHYSICAL" })} className={`rounded-full px-3 py-1.5 text-xs font-bold ${filters.type === "PHYSICAL" ? "bg-slate-950 text-white" : "bg-white border"}`}>Physical</button><button onClick={() => changeFilters({ ...filters, type: filters.type === "DIGITAL" ? undefined : "DIGITAL" })} className={`rounded-full px-3 py-1.5 text-xs font-bold ${filters.type === "DIGITAL" ? "bg-slate-950 text-white" : "bg-white border"}`}>Digital</button><button onClick={() => changeFilters({ ...filters, minRating: filters.minRating === 4 ? undefined : 4 })} className={`rounded-full px-3 py-1.5 text-xs font-bold ${filters.minRating === 4 ? "bg-slate-950 text-white" : "bg-white border"}`}><Star className="mr-1 inline size-3 fill-amber-400 text-amber-400"/>4★ & up</button><SlidersHorizontal className="ml-auto mt-1 size-4 text-slate-400"/></div>
        {isLoading && <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="size-5 animate-spin"/>Loading marketplace…</div>}{isError && <div className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">Products could not be loaded. Please retry.</div>}{!isLoading && !isError && products.length === 0 && <div className="mt-6 flex min-h-64 flex-col items-center justify-center text-slate-500"><PackageOpen className="size-10"/><p className="mt-3 font-semibold">No products match these filters.</p><button onClick={reset} className="mt-2 text-sm font-bold text-orange-600">Clear all filters</button></div>}
        {!isLoading && !isError && products.length > 0 && (view === "grid" ? <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4">{products.map((product) => <DealCard key={product.id} id={product.id} image={product.images?.[0]?.url} name={product.name} seller={product.shop?.profile?.name || product.shop?.slug} price={product.basePrice} promotion={product.promotion} type={product.type} onSelect={setSelectedProductId}/>)}</div> : <div className="mt-6 space-y-3">{products.map((product) => <button key={product.id} onClick={() => setSelectedProductId(product.id)} className="flex w-full gap-4 rounded-xl border bg-white p-3 text-left hover:border-orange-300"><img src={product.images?.[0]?.url} className="size-24 rounded-lg bg-slate-100 object-cover"/><span className="min-w-0 flex-1"><span className="block truncate font-bold">{product.name}</span><span className="mt-1 block text-sm text-slate-500">{product.shop?.profile?.name || product.shop?.slug}</span><span className="mt-2 flex items-center gap-1 text-xs text-amber-500"><Star className="size-3 fill-current"/>{product.averageRating?.toFixed(1) || "New"} ({product.reviewCount || 0})</span></span><span className="font-black">${product.basePrice}</span></button>)}</div>)}
        {!isLoading && !isError && hasNextPage && (
          <div className="mt-8 flex justify-center">
            <Button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="min-w-44 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isFetchingNextPage && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isFetchingNextPage ? "Loading products..." : "Load more products"}
            </Button>
          </div>
        )}
      </div>
    </main><MobileFilterSheet categories={categories} filters={filters} total={total} onChange={changeFilters} onReset={reset}/><ProductDetailView productId={selectedProductId} isOpen={Boolean(selectedProductId)} onClose={() => setSelectedProductId(null)}/>
  </div>;
}
