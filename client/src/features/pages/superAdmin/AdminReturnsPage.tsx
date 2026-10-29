import { useState } from "react";
import { Search, RefreshCw, ShieldCheck, ArrowLeftRight, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAdminReturns, useRefundReturn } from "@/features/admin/admin.hooks";

const statusLabel = (status: string) => status.replaceAll("_", " ");
const statusClass = (status: string) => {
    if (status === "REFUNDED") return "bg-emerald-500/10 text-emerald-700 border-emerald-200";
    if (status === "REJECTED") return "bg-red-500/10 text-red-700 border-red-200";
    if (status === "ITEM_RECEIVED" || status === "REFUND_PENDING") return "bg-amber-500/10 text-amber-700 border-amber-200";
    return "bg-slate-500/10 text-slate-700 border-slate-200";
};

export const AdminReturnsPage = () => {
    const [status, setStatus] = useState("ALL");
    const [search, setSearch] = useState("");
    const { data, isLoading, isError, refetch } = useAdminReturns({ status, search, page: 1, limit: 50 });
    const refund = useRefundReturn();
    const counts = data?.statusCounts ?? {};

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Trust & finance</p>
                    <h1 className="text-3xl font-bold tracking-tight">Returns & refunds</h1>
                    <p className="mt-2 text-muted-foreground">Review customer claims, monitor seller decisions, and release approved refunds safely.</p>
                </div>
                <Button variant="outline" onClick={() => refetch()}><RefreshCw className="mr-2 h-4 w-4" />Refresh queue</Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border bg-card p-5 shadow-sm"><Clock3 className="mb-3 h-5 w-5 text-amber-600" /><p className="text-2xl font-bold">{(counts.REQUESTED ?? 0) + (counts.UNDER_REVIEW ?? 0)}</p><p className="text-sm text-muted-foreground">Needs review</p></div>
                <div className="rounded-2xl border bg-card p-5 shadow-sm"><ArrowLeftRight className="mb-3 h-5 w-5 text-blue-600" /><p className="text-2xl font-bold">{counts.ITEM_RECEIVED ?? 0}</p><p className="text-sm text-muted-foreground">Ready for refund</p></div>
                <div className="rounded-2xl border bg-card p-5 shadow-sm"><ShieldCheck className="mb-3 h-5 w-5 text-emerald-600" /><p className="text-2xl font-bold">{counts.REFUNDED ?? 0}</p><p className="text-sm text-muted-foreground">Completed refunds</p></div>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm md:flex-row">
                <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search request, order, customer..." className="pl-9" /></div>
                <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
                    <option value="ALL">All statuses</option>
                    {["REQUESTED", "UNDER_REVIEW", "APPROVED", "ITEM_RECEIVED", "REFUND_PENDING", "REFUNDED", "REJECTED", "CLOSED"].map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}
                </select>
            </div>
            <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                {isLoading ? <div className="p-12 text-center text-muted-foreground">Loading return queue...</div> : isError ? <div className="p-12 text-center text-destructive">Unable to load returns. Please try again.</div> : !data?.returns.length ? <div className="p-12 text-center text-muted-foreground">No return requests match these filters.</div> :
                    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-4">Request</th><th className="px-5 py-4">Customer</th><th className="px-5 py-4">Shop</th><th className="px-5 py-4">Resolution</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Action</th></tr></thead><tbody className="divide-y">
                        {data.returns.map((item) => <tr key={item.id} className="transition-colors hover:bg-muted/20"><td className="px-5 py-4"><p className="font-semibold">#{item.id.slice(-8)}</p><p className="text-xs text-muted-foreground">Order #{item.orderId.slice(-8)}</p></td><td className="px-5 py-4"><p className="font-medium">{item.order.customer.name}</p><p className="text-xs text-muted-foreground">{item.order.customer.email}</p></td><td className="px-5 py-4">{item.order.shop.profile?.name ?? item.order.shop.slug}</td><td className="px-5 py-4 capitalize">{item.resolution.toLowerCase()}</td><td className="px-5 py-4"><Badge variant="outline" className={statusClass(item.status)}>{statusLabel(item.status)}</Badge></td><td className="px-5 py-4 text-right">{item.status === "ITEM_RECEIVED" && item.resolution === "REFUND" ? <Button size="sm" disabled={refund.isPending} onClick={() => { if (window.confirm("Initiate this Stripe refund?")) refund.mutate(item.id); }}>Issue refund</Button> : <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</span>}</td></tr>)}
                    </tbody></table></div>}
            </div>
        </div>
    );
};
