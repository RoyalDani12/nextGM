import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Eye, RefreshCw, Search, Loader2, RotateCcw } from "lucide-react";
import { useShopReturns } from "./return.hooks";
import type { ShopReturnRequest } from "./return.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const RETURN_STATUS_TABS: { value: string; label: string }[] = [
  { value: "ALL", label: "All returns" },
  { value: "REQUESTED", label: "Needs review" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "APPROVED", label: "Approved" },
  { value: "ITEM_RECEIVED", label: "Item received" },
  { value: "REFUND_PENDING", label: "Refund pending" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CLOSED", label: "Closed" },
];

const returnStatusMeta: Record<
  string,
  { label: string; dotClass: string; textClass: string }
> = {
  REQUESTED: {
    label: "Needs review",
    dotClass: "bg-amber-500",
    textClass: "text-amber-700",
  },
  UNDER_REVIEW: {
    label: "Under review",
    dotClass: "bg-blue-500",
    textClass: "text-blue-700",
  },
  APPROVED: {
    label: "Approved",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-700",
  },
  ITEM_SHIPPED: {
    label: "Item shipped",
    dotClass: "bg-sky-500",
    textClass: "text-sky-700",
  },
  ITEM_RECEIVED: {
    label: "Item received",
    dotClass: "bg-indigo-500",
    textClass: "text-indigo-700",
  },
  REFUND_PENDING: {
    label: "Refund pending",
    dotClass: "bg-purple-500",
    textClass: "text-purple-700",
  },
  REFUNDED: {
    label: "Refunded",
    dotClass: "bg-emerald-600",
    textClass: "text-emerald-800",
  },
  REPLACEMENT_SENT: {
    label: "Replacement sent",
    dotClass: "bg-sky-500",
    textClass: "text-sky-700",
  },
  REJECTED: {
    label: "Rejected",
    dotClass: "bg-rose-500",
    textClass: "text-rose-700",
  },
  CLOSED: {
    label: "Closed",
    dotClass: "bg-slate-400",
    textClass: "text-slate-600",
  },
  CANCELLED: {
    label: "Cancelled",
    dotClass: "bg-slate-400",
    textClass: "text-slate-600",
  },
};

export default function ShopReturnsPage() {
  const { shopId = "" } = useParams<{ shopId: string }>();
  const navigate = useNavigate();

  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");

  const params = useMemo(
    () => ({
      status,
      search: search.trim() || undefined,
      page: 1,
      limit: 50,
    }),
    [status, search]
  );

  const { data, isLoading, isError, refetch } = useShopReturns(shopId, params);
  const response = data?.data;
  const returns = response?.returns ?? [];
  const counts = response?.statusCounts ?? {};

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5">
      {/* HEADER */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base font-semibold text-slate-900">
            Returns & refunds
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review customer return claims, replacement requests, and disputes.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="h-8 px-3 text-xs font-medium border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw
            size={13}
            className={isLoading ? "animate-spin text-orange-500" : ""}
          />
          <span>Refresh</span>
        </Button>
      </header>

      {/* KPI STAT ROW */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-xs font-medium text-slate-500 block">
            Needs review
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-slate-900 tabular-nums">
              {counts.REQUESTED ?? 0}
            </span>
            <span className="text-xs text-amber-600 font-medium">pending</span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-xs font-medium text-slate-500 block">
            Under review
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-slate-900 tabular-nums">
              {counts.UNDER_REVIEW ?? 0}
            </span>
            <span className="text-xs text-blue-600 font-medium">in progress</span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-xs font-medium text-slate-500 block">
            Approved
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-slate-900 tabular-nums">
              {counts.APPROVED ?? 0}
            </span>
            <span className="text-xs text-emerald-600 font-medium">eligible</span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-xs font-medium text-slate-500 block">
            Total requests
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-slate-900 tabular-nums">
              {response?.pagination?.total ?? returns.length}
            </span>
            <span className="text-xs text-slate-400">all time</span>
          </div>
        </div>
      </section>

      {/* TABS & SEARCH */}
      <div className="space-y-3">
        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs font-medium">
          {RETURN_STATUS_TABS.map((tab) => {
            const isActive = status === tab.value;
            const tabCount =
              tab.value === "ALL"
                ? (response?.pagination?.total ?? returns.length)
                : (counts[tab.value] ?? 0);
            return (
              <button
                key={tab.value}
                onClick={() => setStatus(tab.value)}
                className={`px-3 py-2 border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? "border-orange-500 text-slate-900 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums ${
                    isActive
                      ? "bg-orange-100 text-orange-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tabCount}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search return ID, order, customer..."
              className="h-9 pl-9 text-xs rounded-lg border-slate-200 placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <Loader2 className="mx-auto size-5 animate-spin text-slate-400 mb-2" />
            <p>Loading return claims…</p>
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-xs text-rose-600">
            <p className="font-medium">Could not load return requests.</p>
            <p className="text-slate-400 mt-1">Please try again later.</p>
          </div>
        ) : returns.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <RotateCcw className="mx-auto size-6 text-slate-300 mb-2" />
            <p className="font-medium text-slate-600">No return requests found</p>
            <p className="text-slate-400 mt-0.5">
              Customer claims will appear here once submitted.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-medium">
                  <th className="py-2.5 px-4">Claim ID</th>
                  <th className="py-2.5 px-4">Order & Date</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Reason</th>
                  <th className="py-2.5 px-4">Resolution</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {returns.map((item: ShopReturnRequest) => {
                  const meta = returnStatusMeta[item.status] ?? {
                    label: item.status.replaceAll("_", " "),
                    dotClass: "bg-slate-400",
                    textClass: "text-slate-600",
                  };

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {/* ID */}
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        #{item.id.slice(-8).toUpperCase()}
                      </td>

                      {/* Order & Date */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-slate-700">
                          #{item.orderId.slice(-8).toUpperCase()}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(item.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800">
                          {item.order.customer?.name || "Customer"}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {item.order.customer?.email}
                        </p>
                      </td>

                      {/* Reason */}
                      <td className="py-3 px-4 text-slate-700 capitalize">
                        {item.reason.replaceAll("_", " ").toLowerCase()}
                      </td>

                      {/* Resolution */}
                      <td className="py-3 px-4">
                        <span className="capitalize text-slate-700 font-medium">
                          {item.resolution?.toLowerCase() ?? "Refund"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          <span
                            className={`size-1.5 rounded-full ${meta.dotClass}`}
                          />
                          <span className={meta.textClass}>{meta.label}</span>
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/dashboard/shop/${shopId}/returns/${item.id}`
                            )
                          }
                          className="h-7 px-2.5 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>Review</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
