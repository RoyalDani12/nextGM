import { ArrowRight, Search, Store } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { MarketplaceNavbar } from "@/layouts/MarketplaceNavbar";
import Footer from "./Footer";

const collections = ["Apparel & style", "Tech & gadgets", "Home & workspace", "Beauty & wellness"];

export function ShopDirectory() {
  const [query, setQuery] = useState("");
  const visible = collections.filter((item) => item.toLowerCase().includes(query.toLowerCase()));
  return <div className="min-h-screen bg-slate-50"><MarketplaceNavbar /><main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20"><div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Marketplace directory</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Find your next favorite shop.</h1><p className="mt-4 text-sm leading-7 text-slate-500">Browse curated collections from independent merchants building something special.</p></div><div className="relative mt-8 max-w-xl"><Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search collections" className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" /></div><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{visible.map((collection) => <Link to="/" key={collection} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md"><span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><Store className="size-5" /></span><h2 className="mt-6 font-black">{collection}</h2><p className="mt-2 text-xs leading-5 text-slate-500">Explore verified products and thoughtful makers.</p><span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-emerald-600">Explore <ArrowRight className="size-3.5 transition group-hover:translate-x-1" /></span></Link>)}</div></main><Footer /></div>;
}
