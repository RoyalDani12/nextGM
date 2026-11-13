import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  ChevronRight,
  Package,
  RefreshCw,
  Search,
  Store,
} from "lucide-react";
import { useCancelCustomerOrder, useCustomerOrder } from "./customerOrder.hook";
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export interface OrderItemPreview {
  id: string;
  quantity: number;
  unitPrice: number | string;
  productName: string;
  imageUrl?: string | null;
}

export interface CustomerOrderSummary {
  id: string;
  status: OrderStatus;
  totalAmount: number | string;
  discountAmount?: number | string;
  createdAt: string;
  itemCount: number;
  items?: OrderItemPreview[];
  shop?: {
    slug: string;
    name?: string | null;
    logo?: string | null;
  };
  payment?: {
    status?: string;
  } | null;
}

type TabFilter = "ALL" | "ACTIVE" | "DELIVERED" | "CANCELLED";

const getStatusBadge = (status: OrderStatus) => {
  switch (status) {
    case "DELIVERED":
      return {
        label: "Delivered",
        dotClass: "bg-emerald-500",
        badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
      };
    case "SHIPPED":
      return {
        label: "In transit",
        dotClass: "bg-indigo-500",
        badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200/80",
      };
    case "PROCESSING":
      return {
        label: "Processing",
        dotClass: "bg-sky-500",
        badgeClass: "bg-sky-50 text-sky-800 border-sky-200/80",
      };
    case "CONFIRMED":
      return {
        label: "Confirmed",
        dotClass: "bg-blue-500",
        badgeClass: "bg-blue-50 text-blue-800 border-blue-200/80",
      };
    case "PENDING":
      return {
        label: "Payment pending",
        dotClass: "bg-amber-500",
        badgeClass: "bg-amber-50 text-amber-800 border-amber-200/80",
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        dotClass: "bg-slate-400",
        badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
      };
    case "REFUNDED":
      return {
        label: "Refunded",
        dotClass: "bg-rose-500",
        badgeClass: "bg-rose-50 text-rose-800 border-rose-200/80",
      };
    default:
      return {
        label: status,
        dotClass: "bg-slate-400",
        badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
      };
  }
};

export default function CustomerOrder() {
  const navigate = useNavigate();
  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useCustomerOrder();
  const cancelOrder = useCancelCustomerOrder();

  const orders: CustomerOrderSummary[] = useMemo(() => {
    return data?.pages.flatMap((page) => page?.data?.orders ?? []) ?? [];
  }, [data]);

  const [activeTab, setActiveTab] = useState<TabFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [orderToCancel, setOrderToCancel] = useState<CustomerOrderSummary | null>(null);

  const cancelErrorMessage = isAxiosError(cancelOrder.error)
    ? cancelOrder.error.response?.data?.message
    : cancelOrder.error instanceof Error
      ? cancelOrder.error.message
      : null;

  // Safe back navigation preventing browser history loops
  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const confirmCancellation = () => {
    if (!orderToCancel) return;

    cancelOrder.mutate(orderToCancel.id, {
      onSuccess: () => {
        setOrderToCancel(null);
        toast.add({
          title: "Order cancelled",
          description: "Your order has been cancelled successfully.",
          type: "success",
        });
      },
      onError: (error) => {
        const message = isAxiosError(error)
          ? error.response?.data?.message
          : error instanceof Error
            ? error.message
            : "Unable to cancel this order.";
        toast.add({
          title: "Cancellation failed",
          description: typeof message === "string" ? message : "Unable to cancel this order.",
          type: "error",
        });
      },
    });
  };

  // Metrics calculation
  const activeCount = useMemo(() => {
    return orders.filter((o) =>
      ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"].includes(o.status)
    ).length;
  }, [orders]);

  const deliveredCount = useMemo(() => {
    return orders.filter((o) => o.status === "DELIVERED").length;
  }, [orders]);

  const cancelledCount = useMemo(() => {
    return orders.filter((o) => ["CANCELLED", "REFUNDED"].includes(o.status)).length;
  }, [orders]);

  const totalSpent = useMemo(() => {
    return orders
      .filter((o) => o.status !== "CANCELLED" && o.status !== "REFUNDED")
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (activeTab === "ACTIVE") {
        if (!["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"].includes(order.status)) return false;
      } else if (activeTab === "DELIVERED") {
        if (order.status !== "DELIVERED") return false;
      } else if (activeTab === "CANCELLED") {
        if (!["CANCELLED", "REFUNDED"].includes(order.status)) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesId = order.id.toLowerCase().includes(query);
        const matchesShop =
          order.shop?.name?.toLowerCase().includes(query) ||
          order.shop?.slug?.toLowerCase().includes(query);
        const matchesItem = order.items?.some((i) =>
          i.productName?.toLowerCase().includes(query)
        );
        if (!matchesId && !matchesShop && !matchesItem) return false;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 text-slate-900">
      {/* Top Header */}
      <div className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-orange-500 hover:text-orange-600 active:scale-95"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Store</span>
            </button>
            <div className="text-xs font-semibold text-slate-400">
              Purchases & Settlement
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 pt-6 sm:pt-8 sm:px-6 lg:px-8">
        {/* Title & Action Row */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Orders
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Track fulfillment status, review invoices, and manage returns across all merchants.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-orange-500 hover:text-orange-600 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin text-orange-600" : "text-slate-400"}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Financial Metrics Strip */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <p className="text-xs font-medium text-slate-500">Total settled</p>
            <p className="mt-1 font-mono text-xl font-bold tracking-tight text-slate-900">
              ${totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">Net platform spend</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <p className="text-xs font-medium text-slate-500">All orders</p>
            <p className="mt-1 font-mono text-xl font-bold tracking-tight text-slate-900">
              {orders.length}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">Total placed</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <p className="text-xs font-medium text-slate-500">In fulfillment</p>
            <p className="mt-1 font-mono text-xl font-bold tracking-tight text-orange-600">
              {activeCount}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">Active shipments</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <p className="text-xs font-medium text-slate-500">Delivered</p>
            <p className="mt-1 font-mono text-xl font-bold tracking-tight text-emerald-600">
              {deliveredCount}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">Completed deliveries</p>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
          {/* Orange 600 Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition active:scale-95 ${
                activeTab === "ALL"
                  ? "bg-orange-600 text-white shadow-sm shadow-orange-600/25"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600"
              }`}
            >
              All orders ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ACTIVE")}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition active:scale-95 ${
                activeTab === "ACTIVE"
                  ? "bg-orange-600 text-white shadow-sm shadow-orange-600/25"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600"
              }`}
            >
              In fulfillment ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("DELIVERED")}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition active:scale-95 ${
                activeTab === "DELIVERED"
                  ? "bg-orange-600 text-white shadow-sm shadow-orange-600/25"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600"
              }`}
            >
              Delivered ({deliveredCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("CANCELLED")}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition active:scale-95 ${
                activeTab === "CANCELLED"
                  ? "bg-orange-600 text-white shadow-sm shadow-orange-600/25"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600"
              }`}
            >
              Cancelled & refunded ({cancelledCount})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search store, item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-7 text-xs text-slate-900 shadow-2xs outline-none transition placeholder:text-slate-400 focus:border-orange-600 focus:ring-1 focus:ring-orange-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="rounded-2xl border border-slate-200/80 bg-white divide-y divide-slate-100 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-slate-200" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-36 rounded bg-slate-200" />
                    <div className="h-3 w-48 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="h-6 w-24 rounded-lg bg-slate-100" />
                <div className="h-6 w-16 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-2xs">
            <p className="text-sm font-semibold text-slate-900">Failed to load purchases</p>
            <p className="mt-1 text-xs text-slate-500">
              There was an issue retrieving your orders. Please check your connection and retry.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-orange-700 active:scale-95 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State: Zero orders */}
        {!isLoading && !isError && orders.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 mb-3">
              <Package className="size-6" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">No orders placed yet</h2>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              When you purchase items on NextG, your orders, live fulfillment tracking, and invoices will be listed here.
            </p>
            <Link
              to="/"
              className="mt-5 inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-orange-700 active:scale-95 transition"
            >
              Explore products
            </Link>
          </div>
        )}

        {/* Empty State: No search results */}
        {!isLoading && !isError && orders.length > 0 && filteredOrders.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm font-semibold text-slate-900">No matching purchases</p>
            <p className="mt-1 text-xs text-slate-500">
              No orders matched &ldquo;{searchQuery || activeTab}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setActiveTab("ALL");
              }}
              className="mt-4 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-orange-700 active:scale-95 transition"
            >
              Reset filters
            </button>
          </div>
        )}

        {/* Orders Ledger List */}
        {!isLoading && !isError && filteredOrders.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs divide-y divide-slate-100">
            {filteredOrders.map((order) => {
              const statusBadge = getStatusBadge(order.status);
              const storeName = order.shop?.name || order.shop?.slug || "Merchant";
              const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const canCancel = order.status === "PENDING" || order.status === "CONFIRMED";

              return (
                <div
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="group flex flex-col p-4 sm:p-5 transition hover:bg-slate-50/80 cursor-pointer gap-3 sm:gap-4"
                >
                  {/* Top Row: Store Avatar, Order Ref, Date & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden text-slate-600">
                        {order.shop?.logo ? (
                          <img src={order.shop.logo} alt={storeName} className="size-full object-cover" />
                        ) : (
                          <Store className="size-5 text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-bold text-slate-900">
                            {storeName}
                          </span>
                        </div>

                        <p className="mt-0.5 truncate text-xs font-medium text-slate-800">
                          {order.items && order.items.length > 0
                            ? order.items.map((i) => i.productName).join(", ")
                            : `${order.itemCount} item${order.itemCount === 1 ? "" : "s"}`}
                        </p>

                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {formattedDate} · {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border ${statusBadge.badgeClass}`}
                      >
                        <span className={`size-1.5 rounded-full ${statusBadge.dotClass}`} />
                        <span>{statusBadge.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: Price + Buttons (Full responsive) */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-3">
                    <div>
                      <span className="text-xs text-slate-400 mr-1.5">Total</span>
                      <span className="font-mono text-base font-bold text-slate-900">
                        ${Number(order.totalAmount).toFixed(2)}
                      </span>
                      {Number(order.discountAmount || 0) > 0 && (
                        <span className="ml-2 text-[11px] font-semibold text-emerald-600">
                          Saved ${Number(order.discountAmount).toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {canCancel && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelOrder.reset();
                            setOrderToCancel(order);
                          }}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 active:scale-95"
                        >
                          Cancel
                        </button>
                      )}

                      {/* Main Orange 600 Action Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/orders/${order.id}`);
                        }}
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-4 py-1.5 text-xs font-bold shadow-xs hover:shadow-md transition active:scale-95"
                      >
                        <span>View details</span>
                        <ChevronRight className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {!isLoading && !isError && hasNextPage && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 text-xs font-bold shadow-xs hover:shadow-md transition active:scale-95 disabled:opacity-50"
            >
              {isFetchingNextPage && <RefreshCw className="size-3.5 animate-spin text-white" />}
              {isFetchingNextPage ? "Loading..." : "Load more orders"}
            </button>
          </div>
        )}
      </main>

      {/* Cancellation Dialog */}
      <Dialog
        open={!!orderToCancel}
        onOpenChange={(open) => {
          if (!open && !cancelOrder.isPending) {
            setOrderToCancel(null);
            cancelOrder.reset();
          }
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Cancel order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? If authorized or captured, your payment will be refunded.
            </DialogDescription>
          </DialogHeader>

          {cancelErrorMessage && (
            <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 border border-rose-200">
              {typeof cancelErrorMessage === "string" ? cancelErrorMessage : "Unable to cancel this order."}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => {
                cancelOrder.reset();
                setOrderToCancel(null);
              }}
              disabled={cancelOrder.isPending}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Keep order
            </button>
            <button
              type="button"
              onClick={confirmCancellation}
              disabled={cancelOrder.isPending}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50"
            >
              {cancelOrder.isPending ? "Cancelling..." : "Cancel order"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
