import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ExternalLink, Loader2, RotateCcw } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { useShopReturn, useUpdateShopReturnStatus } from "./return.hooks";
import type { ShopReturnRequest } from "./return.types";

const actions: Record<string, Array<{ status: string; label: string; tone: string }>> = {
  REQUESTED: [
    { status: "UNDER_REVIEW", label: "Start review", tone: "border-blue-200 bg-blue-50 text-blue-700" },
    { status: "APPROVED", label: "Approve request", tone: "bg-emerald-600 text-white" },
    { status: "REJECTED", label: "Reject request", tone: "border-rose-200 bg-rose-50 text-rose-700" },
  ],
  UNDER_REVIEW: [
    { status: "APPROVED", label: "Approve request", tone: "bg-emerald-600 text-white" },
    { status: "REJECTED", label: "Reject request", tone: "border-rose-200 bg-rose-50 text-rose-700" },
  ],
  APPROVED: [{ status: "ITEM_RECEIVED", label: "Mark item received", tone: "bg-slate-950 text-white" }],
  ITEM_SHIPPED: [{ status: "ITEM_RECEIVED", label: "Mark item received", tone: "bg-slate-950 text-white" }],
  ITEM_RECEIVED: [
    { status: "REPLACEMENT_SENT", label: "Replacement sent", tone: "bg-blue-600 text-white" },
    { status: "CLOSED", label: "Close request", tone: "border-slate-200 bg-white text-slate-700" },
  ],
  REPLACEMENT_SENT: [{ status: "CLOSED", label: "Close request", tone: "border-slate-200 bg-white text-slate-700" }],
};

export default function ShopReturnDetailPage() {
  const { shopId = "", returnId = "" } = useParams<{ shopId: string; returnId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useShopReturn(shopId, returnId);
  const updateStatus = useUpdateShopReturnStatus();
  const [note, setNote] = useState("");
  const item = (data?.data ?? data) as ShopReturnRequest | undefined;

  const update = (status: string) => {
    updateStatus.mutate({ shopId, returnId, status, note: note.trim() || undefined }, {
      onSuccess: () => { setNote(""); toast.add({ title: "Return updated", description: "The customer has been notified.", type: "success" }); },
      onError: (error) => toast.add({ title: "Could not update return", description: error instanceof Error ? error.message : "Please try again.", type: "error" }),
    });
  };

  if (isLoading) return <div className="flex min-h-[400px] items-center justify-center text-sm text-slate-500">Loading return details...</div>;
  if (isError || !item) return <div className="space-y-4 p-6 text-center"><p className="text-sm text-rose-600">Could not load this return request.</p><button type="button" onClick={() => refetch()} className="rounded-xl border px-4 py-2 text-sm font-semibold">Try again</button></div>;

  return (
    <div className="space-y-7">
      <button type="button" onClick={() => navigate(`/dashboard/shop/${shopId}/returns`)} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950"><ArrowLeft className="size-4" /> Back to returns</button>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">Return request</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">#{item.id.slice(-8).toUpperCase()}</h1><p className="mt-2 text-sm text-slate-500">Order #{item.orderId.slice(-8).toUpperCase()} · Submitted {new Date(item.createdAt).toLocaleString()}</p></div>
        <span className="w-fit rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-700">{item.status.replaceAll("_", " ")}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm"><h2 className="text-base font-extrabold text-slate-900">Customer request</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer</p><p className="mt-1 font-semibold text-slate-800">{item.order.customer?.name}</p><p className="text-xs text-slate-500">{item.order.customer?.email}</p></div><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Preferred resolution</p><p className="mt-1 font-semibold text-slate-800">{item.resolution === "REFUND" ? "Refund" : "Replacement"}</p></div><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Reason</p><p className="mt-1 font-semibold text-slate-800">{item.reason.replaceAll("_", " ")}</p></div></div>{item.customerNote && <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{item.customerNote}</div>}</section>
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm"><h2 className="text-base font-extrabold text-slate-900">Items requested</h2><div className="mt-4 divide-y divide-slate-100">{item.items.map((returnItem) => <div key={returnItem.id} className="flex items-center gap-3 py-3"><div className="size-12 overflow-hidden rounded-xl bg-slate-100">{returnItem.orderItem.product.images?.[0]?.url && <img src={returnItem.orderItem.product.images[0].url} alt="" className="size-full object-cover" />}</div><div className="flex-1"><p className="text-sm font-bold text-slate-800">{returnItem.orderItem.product.name}</p><p className="text-xs text-slate-500">Qty returned: {returnItem.quantity}{returnItem.orderItem.variant?.name ? ` · ${returnItem.orderItem.variant.name}` : ""}</p></div><p className="text-sm font-bold text-slate-800">${(Number(returnItem.orderItem.unitPrice) * returnItem.quantity).toFixed(2)}</p></div>)}</div></section>
          {item.evidenceUrls.length > 0 && <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm"><h2 className="text-base font-extrabold text-slate-900">Customer evidence</h2><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{item.evidenceUrls.map((url: string) => <a key={url} href={url} target="_blank" rel="noreferrer" className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-100"><img src={url} alt="Return evidence" className="size-full object-cover transition group-hover:scale-105" /><ExternalLink className="absolute right-2 top-2 size-4 rounded bg-white/90 p-0.5 text-slate-700" /></a>)}</div></section>}
        </div>
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><RotateCcw className="size-5 text-orange-500" /><h2 className="text-base font-extrabold text-slate-900">Decision center</h2></div><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} rows={4} placeholder="Add a note for the customer..." className="mt-4 w-full resize-none rounded-2xl border border-slate-200 p-3 text-sm outline-none focus:border-orange-400" /><div className="mt-4 space-y-2">{(actions[item.status] ?? []).map((action) => <button key={action.status} type="button" onClick={() => update(action.status)} disabled={updateStatus.isPending} className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition hover:-translate-y-0.5 disabled:opacity-50 ${action.tone}`}>{updateStatus.isPending && <Loader2 className="size-4 animate-spin" />}{action.label}</button>)}</div><p className="mt-4 text-xs leading-5 text-slate-500">Refund payment processing is handled by the platform admin after seller approval.</p></section>
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm"><h2 className="text-base font-extrabold text-slate-900">Decision timeline</h2><div className="mt-5 space-y-5">{item.statusHistory.map((history, index) => <div key={`${history.createdAt}-${index}`} className="relative pl-7 before:absolute before:left-2 before:top-5 before:h-full before:w-px before:bg-slate-200 last:before:hidden"><span className="absolute left-0 top-0.5 flex size-5 items-center justify-center rounded-full bg-slate-900 text-white"><CheckCircle2 className="size-3" /></span><p className="text-xs font-bold uppercase tracking-wider text-slate-800">{history.status.replaceAll("_", " ")}</p><p className="mt-1 text-[11px] text-slate-400">{new Date(history.createdAt).toLocaleString()}</p>{history.note && <p className="mt-2 text-xs leading-5 text-slate-600">{history.note}</p>}</div>)}</div></section>
        </div>
      </div>
    </div>
  );
}
