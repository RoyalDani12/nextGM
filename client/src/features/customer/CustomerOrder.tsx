import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
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
  RotateCcw,
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

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string; icon: typeof Clock }
> = {
  PENDING: {
    label: "Pending Payment",
    bg: "bg-amber-50/80",
    text: "text-amber-700",
    border: "border-amber-200/80",
    dot: "bg-amber-500",
    icon: Clock,
  },
  CONFIRMED: {
    label: "Confirmed",
    bg: "bg-blue-50/80",
    text: "text-blue-700",
    border: "border-blue-200/80",
    dot: "bg-blue-500",
    icon: CheckCircle2,
  },
  PROCESSING: {
    label: "Processing",
    bg: "bg-indigo-50/80",
    text: "text-indigo-700",
    border: "border-indigo-200/80",
    dot: "bg-indigo-500",
    icon: RefreshCw,
  },
  SHIPPED: {
    label: "Shipped",
    bg: "bg-purple-50/80",
    text: "text-purple-700",
    border: "border-purple-200/80",
    dot: "bg-purple-500",
    icon: Truck,
  },
  DELIVERED: {
    label: "Delivered",
    bg: "bg-emerald-50/80",
    text: "text-emerald-700",
    border: "border-emerald-200/80",
    dot: "bg-emerald-500",
    icon: PackageCheck,
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-rose-50/80",
    text: "text-rose-700",
    border: "border-rose-200/80",
    dot: "bg-rose-500",
    icon: XCircle,
  },
  REFUNDED: {
    label: "Refunded",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-300",
    dot: "bg-slate-500",
    icon: RotateCcw,
  },
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
          description: `Order #${orderToCancel.id.slice(-8).toUpperCase()} was cancelled successfully.`,
          type: "success",
        });
      },
      onError: (error) => {
        const message = isAxiosError(error)
          ? error.response?.data?.message
          : error instanceof Error
            ? error.message
            : "We could not cancel this order.";
        toast.add({
          title: "Cancellation failed",
          description: typeof message === "string" ? message : "We could not cancel this order.",
          type: "error",
        });
      },
    });
  };

  // Copy Order ID with toast feedback
  const copyOrderId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    toast.add({
      title: "Order ID copied",
      description: `Copied #${id.slice(-8).toUpperCase()} to clipboard`,
      type: "info",
    });
  };

  // Metrics calculations
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

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Tab matching
      if (activeTab === "ACTIVE") {
        if (!["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"].includes(order.status)) return false;
      } else if (activeTab === "DELIVERED") {
        if (order.status !== "DELIVERED") return false;
      } else if (activeTab === "CANCELLED") {
        if (!["CANCELLED", "REFUNDED"].includes(order.status)) return false;
      }

      // Search matching (order ID or shop name)
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
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* Top Banner / Header */}
      <div className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-7">
          {/* Top navigation row */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50/80 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
            >
              <ArrowLeft className="size-3.5" />
              <span>Continue Shopping</span>
            </button>
            <span className="text-xs font-medium text-slate-400">Customer Portal</span>
          </div>

          {/* Title & Stats Header */}
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  My Orders
                </h1>
                {orders.length > 0 && (
                  <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-extrabold text-orange-700">
                    {orders.length}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Track live shipments, review order receipts, and manage return requests.
              </p>
            </div>
          </div>

          {/* 4-Card Quick Metrics Grid */}
          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-4">
            {/* Total Orders */}
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 sm:p-4 transition hover:bg-slate-50">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200/80 text-slate-700 shadow-2xs">
                <Package className="size-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
                  Total Orders
                </span>
                <span className="text-lg font-black text-slate-900 sm:text-xl">
                  {orders.length}
                </span>
              </div>
            </div>

            {/* Active Orders */}
            <div className="flex items-center gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/40 p-3 sm:p-4 transition hover:bg-amber-50/70">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white border border-amber-200 text-amber-600 shadow-2xs">
                <Clock className="size-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-amber-600/90 truncate">
                  In Progress
                </span>
                <span className="text-lg font-black text-amber-800 sm:text-xl">
                  {activeCount}
                </span>
              </div>
            </div>

            {/* Delivered */}
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-3 sm:p-4 transition hover:bg-emerald-50/70">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white border border-emerald-200 text-emerald-600 shadow-2xs">
                <PackageCheck className="size-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-600/90 truncate">
                  Delivered
                </span>
                <span className="text-lg font-black text-emerald-800 sm:text-xl">
                  {deliveredCount}
                </span>
              </div>
            </div>

            {/* Total Spent */}
            <div className="flex items-center gap-3 rounded-2xl border border-orange-200/70 bg-orange-50/40 p-3 sm:p-4 transition hover:bg-orange-50/70">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white border border-orange-200 text-orange-600 shadow-2xs">
                <CreditCard className="size-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-orange-600/90 truncate">
                  Total Spent
                </span>
                <span className="text-lg font-black text-orange-950 sm:text-xl truncate">
                  ${totalSpent.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar & Status Tabs Row */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-slate-100">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar rounded-xl bg-slate-100/90 p-1 text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setActiveTab("ALL")}
                className={`rounded-lg px-3.5 py-1.5 transition-all ${
                  activeTab === "ALL"
                    ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                    : "hover:text-slate-900"
                }`}
              >
                All ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ACTIVE")}
                className={`rounded-lg px-3.5 py-1.5 transition-all ${
                  activeTab === "ACTIVE"
                    ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                    : "hover:text-slate-900"
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("DELIVERED")}
                className={`rounded-lg px-3.5 py-1.5 transition-all ${
                  activeTab === "DELIVERED"
                    ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                    : "hover:text-slate-900"
                }`}
              >
                Delivered ({deliveredCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("CANCELLED")}
                className={`rounded-lg px-3.5 py-1.5 transition-all ${
                  activeTab === "CANCELLED"
                    ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                    : "hover:text-slate-900"
                }`}
              >
                Cancelled ({cancelledCount})
              </button>
            </div>

            {/* Smooth Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search order ID or store..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200/90 bg-slate-50/70 py-1.5 pl-9 pr-8 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-xs text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Loading Skeletons */}
        {isLoading && (
          <div className="space-y-3.5">
            {[1, 2, 3].map((key) => (
              <div
                key={key}
                className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 w-36 rounded bg-slate-200" />
                  <div className="h-6 w-24 rounded-full bg-slate-200" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-44 rounded bg-slate-200" />
                    <div className="h-3 w-24 rounded bg-slate-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="rounded-3xl border border-rose-200/90 bg-white p-8 text-center shadow-xs sm:p-12">
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
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} /> Retry
            </button>
          </div>
        )}

        {/* Empty State: No orders placed yet */}
        {!isLoading && !isError && orders.length === 0 && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-10 text-center shadow-xs sm:p-14">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 mb-4">
              <ShoppingBag className="size-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">No orders placed yet</h2>
            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-500 sm:text-sm">
              When you purchase products from verified merchants on NextG, your shipment status,
              order history, and invoices will show up here.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600"
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
              className="mt-4 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Orders List */}
        {!isLoading && !isError && filteredOrders.length > 0 && (
          <div className="space-y-3.5 sm:space-y-4">
            {filteredOrders.map((order) => {
              const cfg = statusConfig[order.status] || {
                label: order.status,
                bg: "bg-slate-100",
                text: "text-slate-700",
                border: "border-slate-200",
                dot: "bg-slate-400",
                icon: Clock,
              };
              const StatusIcon = cfg.icon;

              const storeName = order.shop?.name || order.shop?.slug || "Verified Merchant";
              const formattedDate = new Date(order.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              const canCancel = order.status === "PENDING" || order.status === "CONFIRMED";

              return (
                <div
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="group relative cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:border-orange-300 hover:shadow-md sm:p-5"
                >
                  {/* Card Header: Store, Date, Order ID & Status Badge */}
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3.5">
                    <div className="flex items-center gap-3">
                      {/* Shop Avatar */}
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 overflow-hidden text-slate-700 font-bold">
                        {order.shop?.logo ? (
                          <img src={order.shop.logo} alt={storeName} className="size-full object-cover" />
                        ) : (
                          <Store className="size-4 text-slate-500" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-xs font-bold text-slate-900 hover:text-orange-600 sm:text-sm">
                            {storeName}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-[11px] text-slate-400 sm:text-xs">
                            {formattedDate}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                          <span>#{order.id.slice(-8).toUpperCase()}</span>
                          <button
                            type="button"
                            onClick={(e) => copyOrderId(e, order.id)}
                            title="Copy full Order ID"
                            className="rounded p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Copy className="size-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center justify-between sm:justify-end">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${cfg.bg} ${cfg.text} ${cfg.border}`}
                      >
                        <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                        <StatusIcon className="size-3" />
                        {cfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Product Preview Items */}
                  <div className="py-3 sm:py-3.5">
                    {order.items && order.items.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2.5">
                        {order.items.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-1.5 pr-3 max-w-xs transition hover:bg-slate-100/70"
                          >
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-200/70 bg-white overflow-hidden">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.productName}
                                  className="size-full object-cover"
                                />
                              ) : (
                                <Package className="size-4 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-slate-900">
                                {item.productName}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Qty: {item.quantity} · ${Number(item.unitPrice).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                        {order.itemCount > 3 && (
                          <span className="rounded-xl border border-slate-200/80 bg-slate-50 px-2.5 py-2 text-[11px] font-bold text-slate-600">
                            +{order.itemCount - 3} more items
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Package className="size-4 text-slate-400" />
                        <span>
                          {order.itemCount} {order.itemCount === 1 ? "item" : "items"} in package
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Total Amount, Discount & Action Buttons */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[11px] font-medium text-slate-400">Total:</span>
                      <span className="text-base font-black text-slate-900">
                        ${Number(order.totalAmount).toFixed(2)}
                      </span>
                      {Number(order.discountAmount || 0) > 0 && (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/70">
                          <Tag className="size-2.5" /> -${Number(order.discountAmount).toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {canCancel && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            cancelOrder.reset();
                            setOrderToCancel(order);
                          }}
                          className="rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                          Cancel
                        </button>
                      )}
                      <div className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-2.5 py-1 font-bold text-orange-600 transition group-hover:bg-orange-500 group-hover:text-white">
                        <span>Details</span>
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
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isFetchingNextPage && <RefreshCw className="size-3.5 animate-spin" />}
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
              . Cancellation is only available before fulfillment begins.
            </DialogDescription>
          </DialogHeader>
          {cancelErrorMessage && (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
              {typeof cancelErrorMessage === "string" ? cancelErrorMessage : "We could not cancel this order."}
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
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Keep order
            </button>
            <button
              type="button"
              onClick={confirmCancellation}
              disabled={cancelOrder.isPending}
              className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelOrder.isPending ? "Cancelling..." : "Yes, cancel order"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
