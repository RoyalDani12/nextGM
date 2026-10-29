import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ClipboardList, Eye, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { useShopReturns } from "./return.hooks";
import type { ShopReturnRequest } from "./return.types";

const statuses = ["ALL", "REQUESTED", "UNDER_REVIEW", "APPROVED", "ITEM_RECEIVED", "REPLACEMENT_SENT", "REJECTED", "CLOSED"];

export default function ShopReturnsPage() {
  const { shopId = "" } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const params = useMemo(() => ({ status, search: search.trim() || undefined, page: 1, limit: 50 }), [status, search]);
  const { data, isLoading, isError, refetch } = useShopReturns(shopId, params);
  const response = data?.data;
  const returns = response?.returns ?? [];
  const counts = response?.statusCounts ?? {};

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">After-sales care</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">Returns & disputes</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">Review customer requests, make fair decisions, and keep every action visible in the audit timeline.</p>
        </div>
        <button type="button" onClick={() => refetch()} className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="size-4" /> Refresh</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Needs attention", counts.REQUESTED ?? 0, "bg-orange-50 text-orange-700"],
          ["Under review", counts.UNDER_REVIEW ?? 0, "bg-blue-50 text-blue-700"],
          ["Approved", counts.APPROVED ?? 0, "bg-emerald-50 text-emerald-700"],
          ["Total requests", response?.pagination.total ?? 0, "bg-slate-100 text-slate-700"],
        ].map(([label, count, color]) => <div key={label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className={`mt-2 inline-flex rounded-lg px-2.5 py-1 text-2xl font-extrabold ${color}`}>{count}</p></div>)}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm md:flex-row">
        <label className="relative flex-1">
          <Search className="absolute left-3 top-3 size-4 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search return ID, order ID, customer..." className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-orange-400" />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-orange-400">
          {statuses.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
        </select>
      </div>

      {isLoading && <div className="rounded-3xl bg-white p-10 text-center text-sm text-slate-500">Loading return requests...</div>}
      {isError && <div className="rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center text-sm font-semibold text-rose-700">Could not load return requests.</div>}
      {!isLoading && !isError && returns.length === 0 && <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm"><ClipboardList className="mx-auto size-10 text-slate-300" /><h2 className="mt-4 font-bold text-slate-900">No matching requests</h2><p className="mt-1 text-sm text-slate-500">New customer return requests will appear here.</p></div>}

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="hidden grid-cols-[1.3fr_1.2fr_1fr_1fr_auto] gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 md:grid">
          <span>Request</span><span>Customer</span><span>Reason</span><span>Status</span><span />
        </div>
        {returns.map((item: ShopReturnRequest) => (
          <div key={item.id} className="grid gap-3 border-b border-slate-100 px-5 py-4 last:border-0 md:grid-cols-[1.3fr_1.2fr_1fr_1fr_auto] md:items-center md:gap-4">
            <div><p className="font-bold text-slate-900">#{item.id.slice(-8).toUpperCase()}</p><p className="mt-1 text-xs text-slate-500">Order #{item.orderId.slice(-8).toUpperCase()} · {new Date(item.createdAt).toLocaleDateString()}</p></div>
            <div><p className="text-sm font-semibold text-slate-800">{item.order.customer?.name || "Customer"}</p><p className="text-xs text-slate-500">{item.order.customer?.email}</p></div>
            <p className="text-sm text-slate-600">{item.reason.replaceAll("_", " ")}</p>
            <span className="w-fit rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700">{item.status.replaceAll("_", " ")}</span>
            <button type="button" onClick={() => navigate(`/dashboard/shop/${shopId}/returns/${item.id}`)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Eye className="size-3.5" /> Review</button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-900"><ShieldCheck className="size-5 shrink-0 text-emerald-600" /><span>Every decision is recorded and the customer receives an automatic status notification.</span><Link to="/help" className="ml-auto font-bold text-emerald-700 hover:underline">Policy help</Link></div>
    </div>
  );
}
