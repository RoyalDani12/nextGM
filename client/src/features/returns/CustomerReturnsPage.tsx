import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, ShieldCheck } from "lucide-react";
import { useCustomerReturns } from "./return.hooks";

export default function CustomerReturnsPage() {
  const { data: returns = [], isLoading, isError } = useCustomerReturns();

  return (
    <div className="min-h-screen bg-slate-50/70 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link to="/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950">
          <ArrowLeft className="size-4" /> Back to orders
        </Link>
        <div className="mt-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">Customer care</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">Returns & refunds</h1>
            <p className="mt-2 text-sm text-slate-500">Review your requests and follow their progress.</p>
          </div>
          <ShieldCheck className="hidden size-10 text-emerald-500 sm:block" />
        </div>

        {isLoading && <div className="mt-8 rounded-3xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">Loading your return requests...</div>}
        {isError && <div className="mt-8 rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-sm font-semibold text-rose-700">We could not load your return requests. Please try again.</div>}
        {!isLoading && !isError && returns.length === 0 && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <RotateCcw className="mx-auto size-10 text-slate-300" />
            <h2 className="mt-4 text-lg font-bold text-slate-900">No return requests yet</h2>
            <p className="mt-2 text-sm text-slate-500">If something is not right with a delivered order, you can start a return from its details page.</p>
          </div>
        )}
        <div className="mt-8 space-y-4">
          {returns.map((returnRequest) => (
            <article key={returnRequest.id} className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600"><RotateCcw className="size-5" /></div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Return Request</p>
                    <h2 className="mt-1 text-base font-extrabold text-slate-900">Return Claim</h2>
                    <p className="mt-1 text-xs text-slate-500">{returnRequest.items.length} item{returnRequest.items.length === 1 ? "" : "s"} · {returnRequest.resolution === "REFUND" ? "Refund" : "Replacement"}</p>
                  </div>
                </div>
                <span className="w-fit rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">{returnRequest.status.replaceAll("_", " ")}</span>
              </div>
              <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                <div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Reason</p><p className="mt-1 text-sm font-semibold text-slate-700">{returnRequest.reason.replaceAll("_", " ")}</p></div>
                <div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Submitted</p><p className="mt-1 text-sm font-semibold text-slate-700">{new Date(returnRequest.createdAt).toLocaleDateString()}</p></div>
              </div>
              <Link to={`/orders/${returnRequest.orderId}`} className="mt-5 inline-flex text-sm font-bold text-orange-600 hover:text-orange-700">View original order →</Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
