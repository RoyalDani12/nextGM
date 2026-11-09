import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Package,
  RefreshCw,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { useShopReturn, useUpdateShopReturnStatus } from "./return.hooks";
import type { ShopReturnRequest } from "./return.types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const actionButtonsMap: Record<
  string,
  Array<{ status: string; label: string; variant: "primary" | "secondary" | "destructive" }>
> = {
  REQUESTED: [
    { status: "UNDER_REVIEW", label: "Start review", variant: "secondary" },
    { status: "APPROVED", label: "Approve request", variant: "primary" },
    { status: "REJECTED", label: "Reject request", variant: "destructive" },
  ],
  UNDER_REVIEW: [
    { status: "APPROVED", label: "Approve request", variant: "primary" },
    { status: "REJECTED", label: "Reject request", variant: "destructive" },
  ],
  APPROVED: [
    { status: "ITEM_RECEIVED", label: "Mark item received", variant: "primary" },
  ],
  ITEM_SHIPPED: [
    { status: "ITEM_RECEIVED", label: "Mark item received", variant: "primary" },
  ],
  ITEM_RECEIVED: [
    { status: "REFUND_PENDING", label: "Authorize refund", variant: "primary" },
    { status: "REPLACEMENT_SENT", label: "Replacement sent", variant: "secondary" },
    { status: "CLOSED", label: "Close claim", variant: "secondary" },
  ],
  REPLACEMENT_SENT: [
    { status: "CLOSED", label: "Close claim", variant: "secondary" },
  ],
};

const returnStatusMeta: Record<
  string,
  { label: string; dotClass: string; textClass: string; bgClass: string }
> = {
  REQUESTED: {
    label: "Needs review",
    dotClass: "bg-amber-500",
    textClass: "text-amber-700",
    bgClass: "bg-amber-50 border-amber-200",
  },
  UNDER_REVIEW: {
    label: "Under review",
    dotClass: "bg-blue-500",
    textClass: "text-blue-700",
    bgClass: "bg-blue-50 border-blue-200",
  },
  APPROVED: {
    label: "Approved",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-700",
    bgClass: "bg-emerald-50 border-emerald-200",
  },
  ITEM_SHIPPED: {
    label: "Item shipped",
    dotClass: "bg-sky-500",
    textClass: "text-sky-700",
    bgClass: "bg-sky-50 border-sky-200",
  },
  ITEM_RECEIVED: {
    label: "Item received",
    dotClass: "bg-indigo-500",
    textClass: "text-indigo-700",
    bgClass: "bg-indigo-50 border-indigo-200",
  },
  REFUND_PENDING: {
    label: "Refund pending",
    dotClass: "bg-purple-500",
    textClass: "text-purple-700",
    bgClass: "bg-purple-50 border-purple-200",
  },
  REFUNDED: {
    label: "Refunded",
    dotClass: "bg-emerald-600",
    textClass: "text-emerald-800",
    bgClass: "bg-emerald-50 border-emerald-200",
  },
  REPLACEMENT_SENT: {
    label: "Replacement sent",
    dotClass: "bg-sky-500",
    textClass: "text-sky-700",
    bgClass: "bg-sky-50 border-sky-200",
  },
  REJECTED: {
    label: "Rejected",
    dotClass: "bg-rose-500",
    textClass: "text-rose-700",
    bgClass: "bg-rose-50 border-rose-200",
  },
  CLOSED: {
    label: "Closed",
    dotClass: "bg-slate-400",
    textClass: "text-slate-600",
    bgClass: "bg-slate-50 border-slate-200",
  },
  CANCELLED: {
    label: "Cancelled",
    dotClass: "bg-slate-400",
    textClass: "text-slate-600",
    bgClass: "bg-slate-50 border-slate-200",
  },
};

export default function ShopReturnDetailPage() {
  const { shopId = "", returnId = "" } = useParams<{
    shopId: string;
    returnId: string;
  }>();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useShopReturn(shopId, returnId);
  const updateStatus = useUpdateShopReturnStatus();
  const [note, setNote] = useState("");

  const item = (data?.data ?? data) as ShopReturnRequest | undefined;

  const handleUpdate = (nextStatus: string) => {
    updateStatus.mutate(
      { shopId, returnId, status: nextStatus, note: note.trim() || undefined },
      {
        onSuccess: () => {
          setNote("");
          toast.add({
            title: "Claim updated",
            description: "The customer has been notified of your decision.",
            type: "success",
          });
        },
        onError: (error) => {
          toast.add({
            title: "Update failed",
            description:
              error instanceof Error ? error.message : "Please try again.",
            type: "error",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[380px] items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="mx-auto size-5 animate-spin text-slate-400" />
          <p className="text-xs text-slate-500">Loading return details…</p>
        </div>
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center max-w-md mx-auto space-y-3">
        <Package className="mx-auto size-8 text-slate-300" />
        <h2 className="text-sm font-semibold text-slate-900">
          Claim not found
        </h2>
        <p className="text-xs text-slate-500">
          Could not retrieve return claim ID: {returnId}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="rounded-lg border-slate-200 text-xs font-medium cursor-pointer"
        >
          <RefreshCw className="mr-1.5 size-3.5" /> Retry
        </Button>
      </div>
    );
  }

  const statusMeta = returnStatusMeta[item.status] ?? {
    label: item.status.replaceAll("_", " "),
    dotClass: "bg-slate-400",
    textClass: "text-slate-600",
    bgClass: "bg-slate-50 border-slate-200",
  };

  const availableActions = actionButtonsMap[item.status] ?? [];

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <Link
          to={`/dashboard/shop/${shopId}/returns`}
          className="hover:text-slate-700 transition-colors"
        >
          Returns
        </Link>
        <ChevronRight size={12} />
        <span className="font-mono text-slate-700 font-medium">
          #{item.id.slice(-8).toUpperCase()}
        </span>
      </div>

      {/* HEADER */}
      <header className="rounded-lg border border-slate-200 bg-white p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/shop/${shopId}/returns`)}
            className="size-8 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Back to returns"
          >
            <ArrowLeft size={14} />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-base font-semibold font-mono text-slate-900">
                Return #{item.id.slice(-8).toUpperCase()}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${statusMeta.bgClass}`}
              >
                <span className={`size-1.5 rounded-full ${statusMeta.dotClass}`} />
                <span className={statusMeta.textClass}>{statusMeta.label}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Order #{item.orderId.slice(-8).toUpperCase()} • Submitted{" "}
              {new Date(item.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <Link
          to={`/dashboard/shop/${shopId}/orders/${item.orderId}`}
          className="h-8 px-3 text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg inline-flex items-center gap-1.5 self-start sm:self-auto transition-colors"
        >
          <span>View order details</span>
          <ExternalLink size={12} />
        </Link>
      </header>

      {/* TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: Request details, items, evidence (8 of 12 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* REQUEST DETAILS */}
          <section className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Request details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-slate-400">
                  Customer
                </span>
                <p className="font-semibold text-slate-900">
                  {item.order.customer?.name || "Customer"}
                </p>
                <p className="text-slate-500">{item.order.customer?.email}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-medium text-slate-400">
                  Preferred resolution
                </span>
                <p className="font-semibold text-slate-900 capitalize">
                  {item.resolution === "REFUND" ? "Refund payment" : "Replacement item"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-medium text-slate-400">
                  Reason for return
                </span>
                <p className="font-semibold text-slate-900 capitalize">
                  {item.reason.replaceAll("_", " ").toLowerCase()}
                </p>
              </div>
            </div>

            {item.customerNote && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-medium text-slate-400 block mb-1">
                  Customer note
                </span>
                <p className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 text-xs text-slate-700 leading-relaxed">
                  "{item.customerNote}"
                </p>
              </div>
            )}
          </section>

          {/* ITEMS TO RETURN */}
          <section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Items claimed ({item.items.length})
              </h2>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-medium">
                  <th className="py-2.5 px-4">Item description</th>
                  <th className="py-2.5 px-4 text-center">Qty returned</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {item.items.map((returnItem) => (
                  <tr key={returnItem.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                          {returnItem.orderItem.product.images?.[0]?.url ? (
                            <img
                              src={returnItem.orderItem.product.images[0].url}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : (
                            <Package size={16} className="text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">
                            {returnItem.orderItem.product.name}
                          </p>
                          {returnItem.orderItem.variant?.name && (
                            <p className="text-[11px] text-slate-500">
                              Variant: {returnItem.orderItem.variant.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-800 tabular-nums">
                      {returnItem.quantity}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900 tabular-nums">
                      $
                      {(
                        Number(returnItem.orderItem.unitPrice) *
                        returnItem.quantity
                      ).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* CUSTOMER EVIDENCE (if provided) */}
          {item.evidenceUrls.length > 0 && (
            <section className="rounded-lg border border-slate-200 bg-white p-5 space-y-3">
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Photo evidence ({item.evidenceUrls.length})
              </h2>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {item.evidenceUrls.map((url: string, index: number) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50 hover:opacity-95 transition-opacity"
                  >
                    <img
                      src={url}
                      alt={`Evidence ${index + 1}`}
                      className="size-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                      <ExternalLink size={16} />
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN: Decision panel & timeline (4 of 12 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* DECISION ACTION PANEL */}
          <section className="rounded-lg border border-slate-200 bg-white p-5 space-y-3.5">
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Take action
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Note for customer <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={2000}
                rows={3}
                placeholder="Explain the decision or provide return instructions..."
                className="text-xs rounded-lg border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:border-orange-500"
              />
            </div>

            <div className="space-y-2 pt-1">
              {availableActions.length === 0 ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 text-center">
                  This return claim has been closed. No further actions are required.
                </div>
              ) : (
                availableActions.map((action) => {
                  let buttonClass = "w-full h-8 text-xs font-semibold rounded-lg transition-colors cursor-pointer";
                  if (action.variant === "primary") {
                    buttonClass += " bg-orange-500 hover:bg-orange-600 text-white shadow-none";
                  } else if (action.variant === "destructive") {
                    buttonClass += " border border-rose-200 text-rose-600 hover:bg-rose-50";
                  } else {
                    buttonClass += " border border-slate-200 text-slate-700 hover:bg-slate-50";
                  }

                  return (
                    <button
                      key={action.status}
                      type="button"
                      onClick={() => handleUpdate(action.status)}
                      disabled={updateStatus.isPending}
                      className={buttonClass}
                    >
                      {updateStatus.isPending ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Loader2 size={13} className="animate-spin" />
                          Processing…
                        </span>
                      ) : (
                        action.label
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
              Refunds are automatically processed by the system after approval. The customer will be emailed upon each status change.
            </p>
          </section>

          {/* TIMELINE */}
          <section className="rounded-lg border border-slate-200 bg-white p-5 space-y-3">
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Activity history
            </h2>

            {item.statusHistory.length === 0 ? (
              <p className="text-xs text-slate-400">No events logged.</p>
            ) : (
              <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                {item.statusHistory.map((history, index) => (
                  <div key={`${history.createdAt}-${index}`} className="relative text-xs">
                    <span className="absolute -left-[19px] top-1 size-2 rounded-full bg-slate-400 ring-2 ring-white" />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 uppercase tracking-wide text-[11px]">
                        {history.status.replaceAll("_", " ")}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(history.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {history.note && (
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        {history.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
