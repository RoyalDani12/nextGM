import type { ElementType } from "react";
import { Activity, AlertTriangle, ArrowUpRight, CreditCard, Store, TrendingUp } from "lucide-react";

type Metric = { title: string; value: string; trend: string; trendUp: boolean; icon: ElementType };
const metrics: Metric[] = [
  { title: "Global MRR", value: "$1.24M", trend: "12.5%", trendUp: true, icon: CreditCard },
  { title: "Active stores", value: "14,205", trend: "4.2%", trendUp: true, icon: Store },
  { title: "Platform GMV", value: "$84.5M", trend: "8.1%", trendUp: true, icon: TrendingUp },
  { title: "Error rate", value: "0.01%", trend: "0.04%", trendUp: false, icon: Activity },
];
const stores = [
  ["Nova Athletics", "Enterprise", "$2,499", "Active"], ["Lumina Coffee", "Pro", "$299", "Trial"],
  ["TechGear Pro", "Basic", "$29", "Active"], ["Botanica", "Pro", "$0", "Churned"],
];

export const SuperAdminHome = () => <div className="space-y-8">
  <div><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Command center</p><h1 className="mt-2 text-3xl font-black tracking-tight">Platform overview</h1><p className="mt-1 text-sm text-slate-500">A clear view of health, growth, and the work that needs attention.</p></div>
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ title, value, trend, trendUp, icon: Icon }) => <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</span><span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-600"><Icon className="size-4" /></span></div><p className="mt-5 text-2xl font-black">{value}</p><p className={`mt-1 text-xs font-bold ${trendUp ? "text-emerald-600" : "text-rose-600"}`}>{trendUp ? "+" : "-"}{trend} <span className="font-medium text-slate-400">vs last month</span></p></div>)}</div>
  <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-black">Recent store signups</h2><p className="text-xs text-slate-500">Latest businesses joining the network</p></div><button className="text-xs font-bold text-emerald-600">View all <ArrowUpRight className="ml-1 inline size-3.5" /></button></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3">Store</th><th className="px-5 py-3">Plan</th><th className="px-5 py-3">MRR</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{stores.map(([name, plan, mrr, status]) => <tr key={name} className="hover:bg-slate-50"><td className="px-5 py-4 font-bold">{name}</td><td className="px-5 py-4 text-slate-500">{plan}</td><td className="px-5 py-4 text-slate-500">{mrr}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${status === "Active" ? "bg-emerald-50 text-emerald-700" : status === "Trial" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}>{status}</span></td></tr>)}</tbody></table></div></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-black">Action required</h2><p className="mt-1 text-xs text-slate-500">Keep the platform running smoothly.</p><div className="mt-5 space-y-3">{[["Pending KYC verifications", 12], ["High-risk transactions", 3], ["Database shard warnings", 1]].map(([label, count]) => <div key={String(label)} className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/60 p-3"><span className="flex items-center gap-2 text-xs font-bold text-rose-800"><AlertTriangle className="size-4" /> {label}</span><span className="rounded-lg bg-white px-2 py-1 text-xs font-black text-rose-700">{count}</span></div>)}</div></section>
  </div>
</div>;
