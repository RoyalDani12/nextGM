import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
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
} from "lucide-react";
import { useCustomerOrder } from "./customerOrder.hook";
import { toast } from "@/components/ui/toast";

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
  { label: string; bg: string; text: string; border: string; icon: typeof Clock }
> = {
  PENDING: {
    label: "Pending Payment",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: Clock,
  },
  CONFIRMED: {
    label: "Confirmed",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: CheckCircle2,
  },
  PROCESSING: {
    label: "Processing",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    icon: RefreshCw,
  },
  SHIPPED: {
    label: "Shipped & In Transit",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: Truck,
  },
  DELIVERED: {
    label: "Delivered",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: PackageCheck,
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: XCircle,
  },
  REFUNDED: {
    label: "Refunded",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-300",
    icon: AlertTriangle,
  },
};

type TabFilter = "ALL" | "ACTIVE" | "DELIVERED" | "CANCELLED";

export default function CustomerOrder() {
  const navigate = useNavigate();
  const { data: response, isLoading, isError, refetch, isFetching } = useCustomerOrder();

  const orders: CustomerOrderSummary[] = useMemo(() => {
    return response?.data?.orders ?? (Array.isArray(response?.data) ? response.data : []);
  }, [response]);

  const [activeTab, setActiveTab] = useState<TabFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

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
        const matchesShop = order.shop?.name?.toLowerCase().includes(query) || order.shop?.slug?.toLowerCase().includes(query);
        if (!matchesId && !matchesShop) return false;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  // Overall statistics
  const totalSpent = useMemo(() => {
    return orders
      .filter((o) => o.status !== "CANCELLED" && o.status !== "REFUNDED")
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  }, [orders]);

  const deliveredCount = useMemo(() => {
    return orders.filter((o) => o.status === "DELIVERED").length;
  }, [orders]);

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Banner / Header */}
      <div className="border-b border-slate-200/80 bg-white shadow-xs">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
              >
                <ArrowLeft className="size-3.5" /> Back
              </button>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                My Orders
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Track shipments, view detailed receipts, and manage your purchases.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center">
                <span className="block text-[11px] font-bold tracking-wider uppercase text-slate-400">Total Orders</span>
                <span className="text-lg font-bold text-slate-900">{orders.length}</span>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center">
                <span className="block text-[11px] font-bold tracking-wider uppercase text-slate-400">Delivered</span>
                <span className="text-lg font-bold text-emerald-700">{deliveredCount}</span>
              </div>
              <div className="hidden sm:block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center">
                <span className="block text-[11px] font-bold tracking-wider uppercase text-slate-400">Total Spent</span>
                <span className="text-lg font-bold text-slate-900">${totalSpent.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Search Bar & Tab Navigation */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
              <button
                onClick={() => setActiveTab("ALL")}
                className={`rounded-lg px-3.5 py-1.5 transition ${
                  activeTab === "ALL" ? "bg-white text-slate-900 shadow-xs font-bold" : "hover:text-slate-900"
                }`}
              >
                All ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab("ACTIVE")}
                className={`rounded-lg px-3.5 py-1.5 transition ${
                  activeTab === "ACTIVE" ? "bg-white text-slate-900 shadow-xs font-bold" : "hover:text-slate-900"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setActiveTab("DELIVERED")}
                className={`rounded-lg px-3.5 py-1.5 transition ${
                  activeTab === "DELIVERED" ? "bg-white text-slate-900 shadow-xs font-bold" : "hover:text-slate-900"
                }`}
              >
                Delivered
              </button>
              <button
                onClick={() => setActiveTab("CANCELLED")}
                className={`rounded-lg px-3.5 py-1.5 transition ${
                  activeTab === "CANCELLED" ? "bg-white text-slate-900 shadow-xs font-bold" : "hover:text-slate-900"
                }`}
              >
                Cancelled
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Order # or Store..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Loading Skeletons */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((key) => (
              <div key={key} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs animate-pulse space-y-4">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                  <div className="h-6 w-24 bg-slate-200 rounded-full" />
                </div>
                <div className="flex gap-4">
                  <div className="size-16 bg-slate-200 rounded-xl" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 w-48 bg-slate-200 rounded" />
                    <div className="h-3 w-28 bg-slate-100 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="rounded-3xl border border-rose-200 bg-white p-10 text-center shadow-xs">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-3">
              <AlertTriangle className="size-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Failed to load orders</h2>
            <p className="mt-1 text-xs text-slate-500">There was a problem reaching the server. Please try again.</p>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
            >
              <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} /> Retry
            </button>
          </div>
        )}

        {/* Empty State: No orders at all */}
        {!isLoading && !isError && orders.length === 0 && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 mb-4">
              <ShoppingBag className="size-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">No orders placed yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 leading-relaxed">
              When you purchase products from independent merchants across Nexions, your order status, item tracking, and invoices will appear right here.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 transition"
            >
              <ShoppingBag className="size-4" /> Start Shopping
            </Link>
          </div>
        )}

        {/* Empty State: Filter yielded no results */}
        {!isLoading && !isError && orders.length > 0 && filteredOrders.length === 0 && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-10 text-center shadow-xs">
            <p className="text-sm font-bold text-slate-900">No matching orders found</p>
            <p className="mt-1 text-xs text-slate-500">
              No orders found matching &quot;{searchQuery || activeTab}&quot;.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveTab("ALL");
              }}
              className="mt-4 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Orders List */}
        {!isLoading && !isError && filteredOrders.length > 0 && (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const cfg = statusConfig[order.status] || {
                label: order.status,
                bg: "bg-slate-100",
                text: "text-slate-700",
                border: "border-slate-200",
                icon: Clock,
              };
              const StatusIcon = cfg.icon;

              const storeName = order.shop?.name || order.shop?.slug || "Store";
              const formattedDate = new Date(order.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-orange-300 hover:shadow-md transition-all duration-200"
                >
                  {/* Card Header */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Shop Avatar */}
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold overflow-hidden border border-slate-200/80">
                        {order.shop?.logo ? (
                          <img src={order.shop.logo} alt={storeName} className="size-full object-cover" />
                        ) : (
                          <Store className="size-5 text-slate-500" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{storeName}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs text-slate-500">{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <span>Order #{order.id.slice(-8).toUpperCase()}</span>
                          <button
                            type="button"
                            onClick={(e) => copyOrderId(e, order.id)}
                            title="Copy full Order ID"
                            className="text-slate-400 hover:text-slate-700 transition"
                          >
                            <Copy className="size-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                      >
                        <StatusIcon className="size-3.5" />
                        {cfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Product Preview Items */}
                  <div className="py-4">
                    {order.items && order.items.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-3">
                        {order.items.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-2 pr-3 max-w-xs"
                          >
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200/60 overflow-hidden">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.productName} className="size-full object-cover" />
                              ) : (
                                <Package className="size-5 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold text-slate-900">{item.productName}</p>
                              <p className="text-[11px] text-slate-500">
                                Qty: {item.quantity} · ${Number(item.unitPrice).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                        {order.itemCount > 3 && (
                          <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                            +{order.itemCount - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Package className="size-4 text-slate-400" />
                        <span>{order.itemCount} {order.itemCount === 1 ? "item" : "items"} in package</span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
                    <div>
                      <span className="text-slate-400">Total: </span>
                      <span className="font-extrabold text-base text-slate-900">
                        ${Number(order.totalAmount).toFixed(2)}
                      </span>
                      {Number(order.discountAmount || 0) > 0 && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          <Tag className="size-2.5" /> Saved ${Number(order.discountAmount).toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 font-bold text-orange-600 group-hover:text-orange-700 transition">
                      <span>View details</span>
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
