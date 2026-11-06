import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Copy,
  Package,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
  Store,
  Tag,
  Truck,
  XCircle,
  AlertTriangle,
  Sparkles,
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

const getStepIndex = (status: OrderStatus): number => {
  switch (status) {
    case "PENDING":
      return 1;
    case "CONFIRMED":
    case "PROCESSING":
      return 2;
    case "SHIPPED":
      return 3;
    case "DELIVERED":
      return 4;
    default:
      return 0;
  }
};

type TabFilter = "ALL" | "ACTIVE" | "DELIVERED" | "CANCELLED";

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

  const confirmCancellation = () => {
    if (!orderToCancel) return;

    cancelOrder.mutate(orderToCancel.id, {
      onSuccess: () => {
        setOrderToCancel(null);
        toast.add({
          title: "Order cancelled",
          description: `Order #${orderToCancel.id.slice(-8).toUpperCase()} has been cancelled.`,
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

  const copyOrderId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    toast.add({
      title: "Order ID copied",
      description: `Copied #${id.slice(-8).toUpperCase()} to clipboard`,
      type: "info",
    });
  };

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
        if (!matchesId && !matchesShop) return false;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-24 text-slate-900">
      {/* Creative Editorial Header */}
      <div className="relative border-b border-orange-100/70 bg-gradient-to-b from-orange-50/40 via-white to-[#FDFCFB] pt-6 pb-8 sm:pt-8 sm:pb-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          {/* Top navigation row: back button and portal label */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="group inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/90 px-4 py-1.5 text-xs font-bold text-slate-700 shadow-xs backdrop-blur-xs transition hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600"
            >
              <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Store</span>
            </button>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100/60 px-3 py-1 text-[11px] font-bold text-orange-700">
              <Sparkles className="size-3 text-orange-500" />
              <span>NextG Purchases</span>
            </div>
          </div>

          {/* Title & Fluid Summary Badges */}
          <div className="mt-6">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              My Orders
            </h1>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Live fulfillment tracking, order receipts, and return requests in one place.
            </p>

            {/* Creative Inline Capsule Summary Strip */}
            {orders.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 font-bold text-slate-800 shadow-2xs">
                  <Package className="size-3.5 text-orange-500" />
                  <span>{orders.length} total {orders.length === 1 ? "order" : "orders"}</span>
                </span>
                {activeCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50/70 px-3 py-1.5 font-extrabold text-orange-700 shadow-2xs">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-orange-400 opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-orange-500" />
                    </span>
                    <span>{activeCount} in progress</span>
                  </span>
                )}
                {deliveredCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-1.5 font-bold text-emerald-800 shadow-2xs">
                    <PackageCheck className="size-3.5 text-emerald-600" />
                    <span>{deliveredCount} delivered</span>
                  </span>
                )}
                {totalSpent > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 font-bold text-slate-700 shadow-2xs">
                    <Tag className="size-3.5 text-slate-400" />
                    <span>${totalSpent.toFixed(2)} spent</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Unified Filter & Search Bar */}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Segmented Filter Pills */}
            <div className="inline-flex items-center rounded-2xl border border-slate-200/80 bg-white/90 p-1 shadow-2xs backdrop-blur-xs">
              <button
                type="button"
                onClick={() => setActiveTab("ALL")}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                  activeTab === "ALL"
                    ? "bg-orange-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ACTIVE")}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                  activeTab === "ACTIVE"
                    ? "bg-orange-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("DELIVERED")}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                  activeTab === "DELIVERED"
                    ? "bg-orange-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Delivered ({deliveredCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("CANCELLED")}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                  activeTab === "CANCELLED"
                    ? "bg-orange-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cancelled ({cancelledCount})
              </button>
            </div>

            {/* Search Pill Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search order ID or store..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-200/90 bg-white py-2 pl-9 pr-8 text-xs text-slate-900 shadow-2xs outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Order Stream */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Loading Skeletons */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((key) => (
              <div
                key={key}
                className="animate-pulse rounded-3xl border border-slate-200/70 bg-white p-6 shadow-2xs space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 w-36 rounded-lg bg-slate-200" />
                  <div className="h-6 w-24 rounded-full bg-slate-200" />
                </div>
                <div className="h-12 w-full rounded-2xl bg-slate-100" />
                <div className="flex items-center gap-3">
                  <div className="size-14 rounded-2xl bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 rounded bg-slate-200" />
                    <div className="h-3 w-28 rounded bg-slate-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="rounded-3xl border border-rose-200/80 bg-white p-8 text-center shadow-xs sm:p-12">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-3">
              <AlertTriangle className="size-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Failed to load orders</h2>
            <p className="mt-1 text-xs text-slate-500">
              There was a problem reaching the server. Please check your connection and retry.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-600"
            >
              <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} /> Retry
            </button>
          </div>
        )}

        {/* Empty State: No Orders Yet */}
        {!isLoading && !isError && orders.length === 0 && (
          <div className="rounded-3xl border border-orange-200/60 bg-gradient-to-b from-orange-50/30 to-white p-10 text-center shadow-xs sm:p-16">
            <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-orange-500 text-white shadow-lg shadow-orange-500/20 mb-5">
              <ShoppingBag className="size-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
              No orders placed yet
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-slate-500 sm:text-sm">
              Explore thousands of curated products from verified merchants across NextG. Your live parcels, invoices, and delivery status will appear here.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-xs font-extrabold text-white shadow-md shadow-orange-500/25 transition hover:bg-orange-600 hover:shadow-lg"
            >
              <ShoppingBag className="size-4" /> Start Shopping
            </Link>
          </div>
        )}

        {/* Empty State: Filter yielded no results */}
        {!isLoading && !isError && orders.length > 0 && filteredOrders.length === 0 && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-xs sm:p-12">
            <p className="text-sm font-bold text-slate-900">No matching orders found</p>
            <p className="mt-1 text-xs text-slate-500">
              No orders found matching &quot;{searchQuery || activeTab}&quot;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setActiveTab("ALL");
              }}
              className="mt-4 rounded-full border border-orange-300 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-700 transition hover:bg-orange-100"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Creative "Package Pass" Order Cards */}
        {!isLoading && !isError && filteredOrders.length > 0 && (
          <div className="space-y-5">
            {filteredOrders.map((order) => {
              const currentStep = getStepIndex(order.status);
              const storeName = order.shop?.name || order.shop?.slug || "Verified Merchant";
              const formattedDate = new Date(order.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              const isDelivered = order.status === "DELIVERED";
              const isCancelled = order.status === "CANCELLED" || order.status === "REFUNDED";
              const canCancel = order.status === "PENDING" || order.status === "CONFIRMED";

              return (
                <div
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs transition-all duration-300 hover:border-orange-400 hover:shadow-xl hover:shadow-orange-500/5"
                >
                  {/* Card Header: Store Info & Live Status Badge */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      {/* Store Avatar */}
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50 overflow-hidden text-slate-700 font-bold shadow-2xs">
                        {order.shop?.logo ? (
                          <img src={order.shop.logo} alt={storeName} className="size-full object-cover" />
                        ) : (
                          <Store className="size-5 text-slate-500" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-black text-slate-900 group-hover:text-orange-600 transition">
                            {storeName}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs text-slate-400 font-medium">
                            {formattedDate}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                          <span>#{order.id.slice(-8).toUpperCase()}</span>
                          <button
                            type="button"
                            onClick={(e) => copyOrderId(e, order.id)}
                            title="Copy Order ID"
                            className="rounded p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Copy className="size-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="flex items-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                          isDelivered
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : isCancelled
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-orange-50 text-orange-700 border border-orange-200"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            isDelivered
                              ? "bg-emerald-500"
                              : isCancelled
                              ? "bg-rose-500"
                              : "bg-orange-500 animate-pulse"
                          }`}
                        />
                        {isDelivered ? (
                          <PackageCheck className="size-3.5" />
                        ) : isCancelled ? (
                          <XCircle className="size-3.5" />
                        ) : (
                          <Clock className="size-3.5" />
                        )}
                        <span>{order.status.replaceAll("_", " ")}</span>
                      </span>
                    </div>
                  </div>

                  {/* Visual Fulfillment Step Strip directly on the card */}
                  {!isCancelled && (
                    <div className="mt-4 mb-2 rounded-2xl bg-orange-50/30 p-3 sm:p-3.5 border border-orange-100/60">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-2">
                        <span className="flex items-center gap-1.5 text-slate-800">
                          <Truck className="size-3.5 text-orange-500" />
                          <span>Fulfillment Journey</span>
                        </span>
                        <span className="text-orange-600 font-extrabold uppercase tracking-wider text-[10px]">
                          {isDelivered ? "Delivered" : "In Progress"}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                        {["Placed", "Confirmed", "Shipped", "Delivered"].map((stepLabel, idx) => {
                          const isPassed = idx + 1 <= currentStep;
                          const isCurrent = idx + 1 === currentStep;
                          return (
                            <div key={stepLabel} className="space-y-1">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  isPassed ? "bg-orange-500" : "bg-slate-200"
                                } ${isCurrent ? "shadow-xs shadow-orange-500/50" : ""}`}
                              />
                              <span
                                className={`block text-[10px] truncate ${
                                  isPassed ? "text-slate-900 font-extrabold" : "text-slate-400 font-medium"
                                }`}
                              >
                                {stepLabel}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Items Preview */}
                  <div className="py-3.5">
                    {order.items && order.items.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2.5">
                        {order.items.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-2 pr-3.5 max-w-xs transition hover:bg-orange-50/40"
                          >
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.productName}
                                  className="size-full object-cover"
                                />
                              ) : (
                                <Package className="size-5 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-slate-900">
                                {item.productName}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Qty: <span className="font-semibold text-slate-800">{item.quantity}</span> · ${Number(item.unitPrice).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                        {order.itemCount > 3 && (
                          <span className="rounded-2xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                            +{order.itemCount - 3} more items
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Package className="size-4 text-slate-400" />
                        <span>
                          {order.itemCount} {order.itemCount === 1 ? "item" : "items"} in parcel
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Price & Primary Action */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium text-slate-400">Total:</span>
                      <span className="text-lg font-black text-slate-900">
                        ${Number(order.totalAmount).toFixed(2)}
                      </span>
                      {Number(order.discountAmount || 0) > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          <Tag className="size-2.5" /> Saved ${Number(order.discountAmount).toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      {canCancel && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelOrder.reset();
                            setOrderToCancel(order);
                          }}
                          className="rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
                        >
                          Cancel
                        </button>
                      )}
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition group-hover:bg-orange-600 group-hover:shadow-md">
                        <span>View Details</span>
                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination / Load More */}
        {!isLoading && !isError && hasNextPage && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="inline-flex items-center gap-2 rounded-full border border-orange-300 bg-white px-6 py-2.5 text-xs font-bold text-slate-800 shadow-2xs transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isFetchingNextPage && <RefreshCw className="size-3.5 animate-spin text-orange-500" />}
              {isFetchingNextPage ? "Loading more..." : "Load more orders"}
            </button>
          </div>
        )}
      </div>

      {/* Cancellation Confirmation Dialog */}
      <Dialog
        open={!!orderToCancel}
        onOpenChange={(open) => {
          if (!open && !cancelOrder.isPending) {
            setOrderToCancel(null);
            cancelOrder.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this order?</DialogTitle>
            <DialogDescription>
              Order #{orderToCancel?.id.slice(-8).toUpperCase()} can be cancelled because it is
              currently{" "}
              <strong>
                {orderToCancel?.status === "PENDING" ? "pending payment" : "confirmed"}
              </strong>
              . Once an order enters processing or transit, cancellation is no longer available.
            </DialogDescription>
          </DialogHeader>
          {cancelErrorMessage && (
            <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 border border-rose-200">
              {typeof cancelErrorMessage === "string" ? cancelErrorMessage : "Unable to cancel this order."}
            </p>
          )}
          <DialogFooter>
            <button
              type="button"
              onClick={() => {
                cancelOrder.reset();
                setOrderToCancel(null);
              }}
              disabled={cancelOrder.isPending}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Keep order
            </button>
            <button
              type="button"
              onClick={confirmCancellation}
              disabled={cancelOrder.isPending}
              className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelOrder.isPending ? "Cancelling..." : "Yes, cancel order"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
