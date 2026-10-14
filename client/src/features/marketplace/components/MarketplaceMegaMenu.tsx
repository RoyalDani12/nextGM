import { Link } from "react-router-dom";
import { BadgeCheck, Flame, TrendingUp } from "lucide-react";
import { useMarketplaceCategories } from "./marketplace.hooks";
export function MarketplaceMegaMenu() {
  const { data: categories = [] } = useMarketplaceCategories();
  return <div className="grid w-[820px] grid-cols-12 gap-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl">
    <div className="col-span-8 grid grid-cols-2 gap-x-7 gap-y-5">{categories.map((parent) => <div key={parent.id}><Link to={`/?categorySlug=${parent.slug}`} className="font-bold text-white hover:text-orange-400">{parent.icon && <span className="mr-2">{parent.icon}</span>}{parent.name}</Link><div className="mt-2 space-y-1">{parent.children.map((child) => <Link key={child.id} to={`/?categorySlug=${child.slug}`} className="block text-xs text-slate-400 hover:text-orange-400">{child.name} <span className="text-slate-600">({child.productCount})</span></Link>)}</div></div>)}</div>
    <div className="col-span-4 rounded-xl border border-slate-700 bg-slate-800/70 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Marketplace highlights</p><div className="mt-4 space-y-4 text-sm"><div className="flex gap-2"><BadgeCheck className="size-5 text-emerald-400"/><span><b>Verified Vendors</b><br/><small className="text-slate-400">Trusted independent stores</small></span></div><div className="flex gap-2"><Flame className="size-5 text-orange-400"/><span><b>Hot Deals & Drops</b><br/><small className="text-slate-400">Limited offers worth catching</small></span></div><div className="flex gap-2"><TrendingUp className="size-5 text-blue-400"/><span><b>Trending Items</b><br/><small className="text-slate-400">What shoppers love now</small></span></div></div></div>
  </div>;
}
