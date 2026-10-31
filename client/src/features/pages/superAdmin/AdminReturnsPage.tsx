import { useState } from "react";
import {
    Search,
    RefreshCw,
    ShieldCheck,
    ArrowLeftRight,
    Clock3,
    CheckCircle2,
    Loader2,
    AlertCircle,
    Building2,
    User,
    DollarSign,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAdminReturns, useRefundReturn } from "@/features/admin/admin.hooks";
import { ModalPortal } from "@/components/ui/ds-components";

const statusLabel = (status: string) => {
    switch (status) {
        case "APPROVED":
            return "Approved (Ready for Refund)";
        case "ITEM_RECEIVED":
            return "Item Received";
        case "REFUND_PENDING":
            return "Refund Pending";
        case "REFUNDED":
            return "Refunded";
        case "REQUESTED":
            return "Requested";
        case "UNDER_REVIEW":
            return "Under Review";
        case "REJECTED":
            return "Rejected";
        case "CLOSED":
            return "Closed";
        default:
            return status.replaceAll("_", " ");
    }
};

const statusClass = (status: string) => {
    switch (status) {
        case "REFUNDED":
            return "bg-emerald-500/10 text-emerald-700 border-emerald-300";
        case "APPROVED":
            return "bg-blue-500/10 text-blue-700 border-blue-300 font-semibold";
        case "ITEM_RECEIVED":
            return "bg-amber-500/10 text-amber-700 border-amber-300";
        case "REFUND_PENDING":
            return "bg-purple-500/10 text-purple-700 border-purple-300";
        case "REJECTED":
            return "bg-rose-500/10 text-rose-700 border-rose-300";
        default:
            return "bg-slate-500/10 text-slate-700 border-slate-200";
    }
};

export const AdminReturnsPage = () => {
    const [status, setStatus] = useState("ALL");
    const [search, setSearch] = useState("");
    const [selectedReturnForRefund, setSelectedReturnForRefund] = useState<any | null>(null);

    const { data, isLoading, isError, refetch } = useAdminReturns({ status, search, page: 1, limit: 50 });
    const refund = useRefundReturn();
    const counts = data?.statusCounts ?? {};

    const readyForRefundCount = (counts.APPROVED ?? 0) + (counts.ITEM_RECEIVED ?? 0);

    const handleConfirmRefund = async () => {
        if (!selectedReturnForRefund) return;
        try {
            await refund.mutateAsync(selectedReturnForRefund.id);
            setSelectedReturnForRefund(null);
        } catch {
            // Handled by hook toast
        }
    };

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">Trust & Finance</p>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Returns & Refunds Center</h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Review customer return claims, approve claims, and activate direct customer refunds safely.
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => refetch()}
                    className="rounded-xl border-slate-200 text-xs font-semibold cursor-pointer"
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Queue
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200 mb-3">
                        <Clock3 className="size-5" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                        {(counts.REQUESTED ?? 0) + (counts.UNDER_REVIEW ?? 0)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Customer Claims Needing Review</p>
                </div>

                <div className="rounded-2xl border border-blue-200/90 bg-blue-50/40 p-5 shadow-xs">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 border border-blue-200 mb-3">
                        <ArrowLeftRight className="size-5" />
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{readyForRefundCount}</p>
                    <p className="text-xs text-blue-700/80 mt-0.5 font-medium">Ready For Platform Refund Release</p>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 mb-3">
                        <ShieldCheck className="size-5" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{counts.REFUNDED ?? 0}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Successfully Refunded Orders</p>
                </div>
            </div>

            {/* Search & Status Filters */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs md:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by request ID, order ID, customer name or email..."
                        className="pl-9 rounded-xl border-slate-200 text-xs"
                    />
                </div>
                <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-orange-500 cursor-pointer"
                >
                    <option value="ALL">All Return Statuses</option>
                    {["REQUESTED", "UNDER_REVIEW", "APPROVED", "ITEM_RECEIVED", "REFUND_PENDING", "REFUNDED", "REJECTED", "CLOSED"].map((item) => (
                        <option key={item} value={item}>
                            {statusLabel(item)}
                        </option>
                    ))}
                </select>
            </div>

            {/* Returns Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                {isLoading ? (
                    <div className="p-12 text-center text-slate-500">
                        <Loader2 className="mx-auto size-6 animate-spin text-orange-500 mb-2" />
                        Loading return requests queue...
                    </div>
                ) : isError ? (
                    <div className="p-12 text-center text-rose-500 text-sm">
                        <AlertCircle className="mx-auto size-6 text-rose-500 mb-2" />
                        Unable to load returns queue. Please try refreshing.
                    </div>
                ) : !data?.returns.length ? (
                    <div className="p-12 text-center text-slate-400">
                        <ShieldCheck className="mx-auto size-8 opacity-40 mb-2" />
                        <p className="font-semibold text-slate-700">No return requests found</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your status filter or search query.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto ds-scroll">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                <tr>
                                    <th className="px-5 py-4">Request & Order</th>
                                    <th className="px-5 py-4">Customer</th>
                                    <th className="px-5 py-4">Shop</th>
                                    <th className="px-5 py-4">Amount</th>
                                    <th className="px-5 py-4">Resolution</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4 text-right">Refund Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.returns.map((item) => {
                                    const isRefund = item.resolution === "REFUND";
                                    const canIssueRefund =
                                        isRefund &&
                                        ["APPROVED", "ITEM_RECEIVED", "REQUESTED", "UNDER_REVIEW"].includes(item.status);

                                    return (
                                        <tr key={item.id} className="transition-colors hover:bg-slate-50/60">
                                            <td className="px-5 py-4">
                                                <p className="font-bold text-slate-900">#{item.id.slice(-8).toUpperCase()}</p>
                                                <p className="font-mono text-[10px] text-slate-400">
                                                    Order #{item.orderId.slice(-8).toUpperCase()}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-slate-800">{item.order.customer.name}</p>
                                                <p className="text-[11px] text-slate-400">{item.order.customer.email}</p>
                                            </td>

                                            <td className="px-5 py-4 text-slate-700 font-medium">
                                                {item.order.shop.profile?.name ?? item.order.shop.slug}
                                            </td>

                                            <td className="px-5 py-4 font-bold text-slate-900 whitespace-nowrap">
                                                ${Number(item.order.totalAmount || 0).toFixed(2)}
                                            </td>

                                            <td className="px-5 py-4 capitalize font-semibold text-slate-700">
                                                {item.resolution.toLowerCase()}
                                            </td>

                                            <td className="px-5 py-4">
                                                <Badge variant="outline" className={`rounded-lg px-2.5 py-0.5 text-xs ${statusClass(item.status)}`}>
                                                    {statusLabel(item.status)}
                                                </Badge>
                                            </td>

                                            <td className="px-5 py-4 text-right whitespace-nowrap">
                                                {item.status === "REFUNDED" ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                                                        <CheckCircle2 className="size-3.5" /> Refund Settled
                                                    </span>
                                                ) : item.status === "REFUND_PENDING" ? (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600">
                                                        <Loader2 className="size-3.5 animate-spin" /> Processing
                                                    </span>
                                                ) : canIssueRefund ? (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => setSelectedReturnForRefund(item)}
                                                        className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs h-8 px-3 shadow-xs cursor-pointer"
                                                    >
                                                        <Sparkles className="size-3.5 mr-1" />
                                                        {item.status === "APPROVED" || item.status === "ITEM_RECEIVED"
                                                            ? "Issue Refund"
                                                            : "Approve & Refund"}
                                                    </Button>
                                                ) : (
                                                    <span className="text-[11px] text-slate-400">
                                                        {new Date(item.createdAt).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* CONFIRM REFUND MODAL */}
            {selectedReturnForRefund && (
                <ModalPortal onClose={() => setSelectedReturnForRefund(null)}>
                    <div
                        className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setSelectedReturnForRefund(null);
                        }}
                    >
                        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center gap-3">
                                <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 border border-emerald-200">
                                    <DollarSign className="size-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Initiate Customer Refund</h3>
                                    <p className="text-xs text-slate-500">Super Admin Financial Authorization</p>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-2.5 text-xs">
                                <div className="flex justify-between items-center text-slate-500">
                                    <span>Return Claim:</span>
                                    <strong className="font-mono text-slate-800">
                                        #{selectedReturnForRefund.id.slice(-8).toUpperCase()}
                                    </strong>
                                </div>
                                <div className="flex justify-between items-center text-slate-500">
                                    <span>Customer:</span>
                                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                                        <User className="size-3 text-slate-400" />
                                        {selectedReturnForRefund.order.customer.name}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-slate-500">
                                    <span>Store:</span>
                                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                                        <Building2 className="size-3 text-slate-400" />
                                        {selectedReturnForRefund.order.shop.profile?.name ?? selectedReturnForRefund.order.shop.slug}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-200/80">
                                    <span className="font-bold text-slate-700">Total Refund Amount:</span>
                                    <span className="text-base font-black text-emerald-600">
                                        ${Number(selectedReturnForRefund.order.totalAmount || 0).toFixed(2)} USD
                                    </span>
                                </div>
                            </div>

                            <p className="text-[11px] text-slate-500 leading-relaxed">
                                Authorizing this refund will return funds to the customer, reverse the seller wallet ledger,
                                transition order & return request to <strong>REFUNDED</strong>, and record a security audit entry.
                            </p>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={refund.isPending}
                                    onClick={() => setSelectedReturnForRefund(null)}
                                    className="rounded-xl border-slate-200 text-xs font-semibold cursor-pointer"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    disabled={refund.isPending}
                                    onClick={handleConfirmRefund}
                                    className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-sm shadow-emerald-500/25 cursor-pointer"
                                >
                                    {refund.isPending ? (
                                        <>
                                            <Loader2 className="size-3.5 animate-spin mr-1.5" />
                                            Processing Refund...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="size-3.5 mr-1.5" />
                                            Confirm & Release Refund
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
};
