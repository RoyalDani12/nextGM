import { useEffect, useMemo, useState } from "react";
import { Grid2X2, List, Loader2, PackageOpen, RotateCcw, Search, ShoppingBag, SlidersHorizontal, Star, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DealCard } from "../components/DealCard";
import { ProductDetailView } from "../components/ProductDetailView";
import { MarketplaceFilterSidebar } from "../components/MarketplaceFilterSidebar";
import { MobileFilterSheet } from "../components/MobileFilterSheet";
import { emptyCatalogFilters, sortOptions, type CatalogFilters } from "../components/marketplace.filters";
import { useMarketplaceCategories, useMarketplaceProducts } from "../components/marketplace.hooks";

type MarketplaceProduct = { id: string; name: string; description?: string; basePrice: number | string; type?: string; averageRating?: number; reviewCount?: number; images?: Array<{ url?: string }>; shop?: { slug?: string; profile?: { name?: string } } };

export default function Hero() {
  const [params, setParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<CatalogFilters>({ ...emptyCatalogFilters, categorySlug: params.get("categorySlug") || undefined });
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const { data: categories = [] } = useMarketplaceCategories();
  const { data: result, isLoading, isError } = useMarketplaceProducts({ ...filters, search });
  const products = (result?.products || []) as MarketplaceProduct[];
  const total = result?.pagination?.total || 0;
  const breadcrumb = result?.categoryBreadcrumb || [];

  useEffect(() => { const slug = params.get("categorySlug") || undefined; setFilters((current) => current.categorySlug === slug ? current : { ...current, categorySlug: slug }); }, [params]);
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

  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <section className="relative overflow-hidden bg-slate-950 px-4 py-14 text-white sm:py-20"><div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#ea580c33,_transparent_35%)]"/><div className="relative mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-400">NextG Marketplace</p><h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">Find exceptional goods from verified independent stores.</h1><form onSubmit={(event) => { event.preventDefault(); setSearch(searchInput); }} className="mt-7 flex max-w-3xl gap-2 rounded-2xl bg-white p-2 shadow-2xl"><Search className="my-auto ml-3 size-5 shrink-0 text-slate-400"/><Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search products, brands and categories" className="border-0 text-slate-900 shadow-none focus-visible:ring-0"/><Button type="submit" className="bg-orange-500 font-bold hover:bg-orange-600">Search</Button></form></div></section>
    <main className="mx-auto max-w-7xl px-4 py-6 pb-24 lg:px-8 lg:pb-8">
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">{categories.map((category) => <button key={category.id} onClick={() => changeFilters({ ...filters, categorySlug: category.slug })} className={`shrink-0 rounded-full border px-3 py-2 text-xs font-bold ${filters.categorySlug === category.slug ? "border-slate-950 bg-slate-950 text-white" : "bg-white"}`}>{category.icon} {category.name}</button>)}</div>
      <div className="flex gap-8"><MarketplaceFilterSidebar categories={categories} filters={filters} onChange={changeFilters} onReset={reset}/><div className="min-w-0 flex-1">
        <div className="border-b border-slate-200 pb-4"><nav className="mb-3 flex flex-wrap gap-1 text-xs text-slate-500"><span>Marketplace</span>{breadcrumb.map((item) => <span key={item.id}>› <button onClick={() => changeFilters({ ...filters, categorySlug: item.slug })} className="hover:text-orange-600">{item.name}</button></span>)}</nav><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-black"><ShoppingBag className="size-5"/> {breadcrumb.at(-1)?.name || "All products"}</h2><p className="mt-1 text-sm text-slate-500">Showing {total ? `1–${products.length} of ${total}` : "0"} products</p></div><div className="hidden items-center gap-2 md:flex"><label className="text-xs font-bold text-slate-500">Sort</label><select value={selectedSort} onChange={(event) => { const [sort, order] = event.target.value.split(":"); changeFilters({ ...filters, sort: sort as CatalogFilters["sort"], order: order as CatalogFilters["order"] }); }} className="h-9 rounded border bg-white px-2 text-xs">{sortOptions.map((item) => <option key={item.label} value={`${item.sort}:${item.order}`}>{item.label}</option>)}</select><div className="flex rounded border p-0.5"><button onClick={() => setView("grid")} aria-label="Grid view" className={`rounded p-1.5 ${view === "grid" ? "bg-slate-900 text-white" : ""}`}><Grid2X2 className="size-4"/></button><button onClick={() => setView("list")} aria-label="List view" className={`rounded p-1.5 ${view === "list" ? "bg-slate-900 text-white" : ""}`}><List className="size-4"/></button></div></div></div></div>
        {activeChips.length > 0 && <div className="mt-4 flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-slate-500">Active:</span>{activeChips.map((chip) => <button key={chip.label} onClick={chip.clear} className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">{chip.label}<X className="size-3"/></button>)}<button onClick={reset} className="ml-1 text-xs font-bold text-slate-600 hover:text-slate-950"><RotateCcw className="mr-1 inline size-3"/>Clear all</button></div>}
        <div className="mt-5 flex flex-wrap gap-2 lg:hidden"><button onClick={() => changeFilters({ ...filters, type: filters.type === "PHYSICAL" ? undefined : "PHYSICAL" })} className={`rounded-full px-3 py-1.5 text-xs font-bold ${filters.type === "PHYSICAL" ? "bg-slate-950 text-white" : "bg-white border"}`}>Physical</button><button onClick={() => changeFilters({ ...filters, type: filters.type === "DIGITAL" ? undefined : "DIGITAL" })} className={`rounded-full px-3 py-1.5 text-xs font-bold ${filters.type === "DIGITAL" ? "bg-slate-950 text-white" : "bg-white border"}`}>Digital</button><button onClick={() => changeFilters({ ...filters, minRating: filters.minRating === 4 ? undefined : 4 })} className={`rounded-full px-3 py-1.5 text-xs font-bold ${filters.minRating === 4 ? "bg-slate-950 text-white" : "bg-white border"}`}><Star className="mr-1 inline size-3 fill-amber-400 text-amber-400"/>4★ & up</button><SlidersHorizontal className="ml-auto mt-1 size-4 text-slate-400"/></div>
        {isLoading && <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="size-5 animate-spin"/>Loading marketplace…</div>}{isError && <div className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">Products could not be loaded. Please retry.</div>}{!isLoading && !isError && products.length === 0 && <div className="mt-6 flex min-h-64 flex-col items-center justify-center text-slate-500"><PackageOpen className="size-10"/><p className="mt-3 font-semibold">No products match these filters.</p><button onClick={reset} className="mt-2 text-sm font-bold text-orange-600">Clear all filters</button></div>}
        {!isLoading && !isError && products.length > 0 && (view === "grid" ? <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4">{products.map((product) => <DealCard key={product.id} id={product.id} image={product.images?.[0]?.url} name={product.name} seller={product.shop?.profile?.name || product.shop?.slug} price={product.basePrice} type={product.type} onSelect={setSelectedProductId}/>)}</div> : <div className="mt-6 space-y-3">{products.map((product) => <button key={product.id} onClick={() => setSelectedProductId(product.id)} className="flex w-full gap-4 rounded-xl border bg-white p-3 text-left hover:border-orange-300"><img src={product.images?.[0]?.url} className="size-24 rounded-lg bg-slate-100 object-cover"/><span className="min-w-0 flex-1"><span className="block truncate font-bold">{product.name}</span><span className="mt-1 block text-sm text-slate-500">{product.shop?.profile?.name || product.shop?.slug}</span><span className="mt-2 flex items-center gap-1 text-xs text-amber-500"><Star className="size-3 fill-current"/>{product.averageRating?.toFixed(1) || "New"} ({product.reviewCount || 0})</span></span><span className="font-black">${product.basePrice}</span></button>)}</div>)}
      </div></div>
    </main><MobileFilterSheet categories={categories} filters={filters} total={total} onChange={changeFilters} onReset={reset}/><ProductDetailView productId={selectedProductId} isOpen={Boolean(selectedProductId)} onClose={() => setSelectedProductId(null)}/>
  </div>;
}
