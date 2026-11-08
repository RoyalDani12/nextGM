import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  ExternalLink,
  Eye,
  FileText,
  ImagePlus,
  Loader2,
  MapPin,
  MoreVertical,
  Package,
  PackagePlus,
  RefreshCw,
  Rocket,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  UserRound,
  ArrowRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

import {
  useMyShops,
  usePublishReadiness,
  usePublishShop,
  useUpdateShopOrderStatus,
  useMarkShopOrderShipped,
} from "./shop.hooks";
import { useShopAnalytics } from "./analytics/analytics.hooks";
import { useShopReturns } from "../returns/return.hooks";
import type { PublishReadinessChecks, ShopStatus } from "./shop.types";
import type {
  AnalyticsRange,
  RecentOrderAnalytics,
} from "./analytics/analytics.types";

const statusStyle: Record<
  ShopStatus,
  { label: string; dotClass: string; textClass: string; bgClass: string }
> = {
  PENDING: {
    label: "Pending setup",
    dotClass: "bg-amber-500",
    textClass: "text-amber-700",
    bgClass: "bg-amber-50 border-amber-200",
  },
  ACTIVE: {
    label: "Active",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-700",
    bgClass: "bg-emerald-50 border-emerald-200",
  },
  PAUSED: {
    label: "Paused",
    dotClass: "bg-blue-500",
    textClass: "text-blue-700",
    bgClass: "bg-blue-50 border-blue-200",
  },
  SUSPENDED: {
    label: "Suspended",
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
};

const setupItems: Array<{
  key: keyof PublishReadinessChecks;
  title: string;
  description: string;
  icon: typeof Store;
  destination: "settings" | "products";
}> = [
  {
    key: "hasProfile",
    title: "Store profile",
    description: "Basic storefront info",
    icon: Store,
    destination: "settings",
  },
  {
    key: "hasName",
    title: "Store name",
    description: "Public trading display name",
    icon: UserRound,
    destination: "settings",
  },
  {
    key: "hasDescription",
    title: "Description",
    description: "Store catalog description",
    icon: FileText,
    destination: "settings",
  },
  {
    key: "hasLogo",
    title: "Store logo",
    description: "Brand badge and icon",
    icon: ImagePlus,
    destination: "settings",
  },
  {
    key: "hasContactInfo",
    title: "Contact information",
    description: "Support email and phone",
    icon: UserRound,
    destination: "settings",
  },
  {
    key: "hasAddress",
    title: "Business address",
    description: "Operating physical address",
    icon: MapPin,
    destination: "settings",
  },
  {
    key: "hasLegalInfo",
    title: "Legal & tax details",
    description: "Tax ID and registration",
    icon: Building2,
    destination: "settings",
  },
  {
    key: "hasAtLeastOneActiveProduct",
    title: "Active product",
    description: "At least one listed item",
    icon: PackagePlus,
    destination: "products",
  },
];

const orderStatusBadges: Record<
  string,
  { label: string; dotClass: string; textClass: string }
> = {
  PENDING: {
    label: "Pending",
    dotClass: "bg-amber-500",
    textClass: "text-amber-700",
  },
  CONFIRMED: {
    label: "Confirmed",
    dotClass: "bg-blue-500",
    textClass: "text-blue-700",
  },
  PROCESSING: {
    label: "Processing",
    dotClass: "bg-sky-500",
    textClass: "text-sky-700",
  },
  SHIPPED: {
    label: "Shipped",
    dotClass: "bg-indigo-500",
    textClass: "text-indigo-700",
  },
  DELIVERED: {
    label: "Delivered",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-700",
  },
  CANCELLED: {
    label: "Cancelled",
    dotClass: "bg-slate-400",
    textClass: "text-slate-600",
  },
  REFUNDED: {
    label: "Refunded",
    dotClass: "bg-rose-500",
    textClass: "text-rose-700",
  },
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(val);
};

const formatNumber = (val: number) => {
  return new Intl.NumberFormat("en-US").format(val);
};

const COMMON_CARRIERS = [
  "FedEx",
  "DHL Express",
  "UPS",
  "USPS",
  "Royal Mail",
  "DPD",
  "Other",
];

export function DashboardHome() {
  const { shopId = "" } = useParams<{ shopId: string }>();
  const navigate = useNavigate();

  const [range, setRange] = useState<AnalyticsRange>("7d");
  const [showChecklist, setShowChecklist] = useState<boolean>(false);

  // Quick ship modal state
  const [shippingOrder, setShippingOrder] = useState<RecentOrderAnalytics | null>(null);
  const [carrier, setCarrier] = useState<string>("FedEx");
  const [customCarrier, setCustomCarrier] = useState<string>("");
  const [trackingNumber, setTrackingNumber] = useState<string>("");
  const [trackingUrl, setTrackingUrl] = useState<string>("");
  const [shipNote, setShipNote] = useState<string>("");

  // Data fetching
  const readiness = usePublishReadiness(shopId);
  const publishShop = usePublishShop(shopId);
  const { data: shopsResponse } = useMyShops();
  const shop = shopsResponse?.data?.find((item) => item.id === shopId);
  const dashboardPath = `/dashboard/shop/${shopId}`;

  // Live operational data
  const analyticsQuery = useShopAnalytics(shopId, range);
  const returnsQuery = useShopReturns(shopId, { status: "ALL", limit: 1 });
  const updateStatus = useUpdateShopOrderStatus();
  const markShipped = useMarkShopOrderShipped();

  if (readiness.isLoading) {
    return (
      <div className="flex min-h-[380px] items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="mx-auto size-6 animate-spin text-slate-400" />
          <p className="text-xs text-slate-500">Loading store dashboard…</p>
        </div>
      </div>
    );
  }

  if (readiness.isError || !readiness.data) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center max-w-md mx-auto space-y-3">
        <AlertCircle className="mx-auto size-8 text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-900">
          Unable to load dashboard
        </h2>
        <p className="text-xs text-slate-500">
          Please check your connection and try again.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            readiness.refetch();
            analyticsQuery.refetch();
          }}
          className="rounded-lg border-slate-200 text-xs font-medium cursor-pointer"
        >
          <RefreshCw className="mr-1.5 size-3.5" /> Retry
        </Button>
      </div>
    );
  }

  const { checks, passed, shopStatus } = readiness.data;
  const completed = setupItems.filter((item) => checks[item.key]).length;
  const percent = Math.round((completed / setupItems.length) * 100);
  const status = statusStyle[shopStatus] || statusStyle.PENDING;
  const canPublish = passed && shopStatus === "PENDING";
  const isStoreActive = shopStatus === "ACTIVE";

  const analytics = analyticsQuery.data;
  const summary = analytics?.summary ?? {
    totalRevenue: 0,
    revenueGrowth: 0,
    totalOrders: 0,
    ordersGrowth: 0,
    averageOrderValue: 0,
    aovGrowth: 0,
    unitsSold: 0,
    unitsGrowth: 0,
    fulfillmentRate: 100,
    netRevenue: 0,
    refundedAmount: 0,
    peakDay: { label: "N/A", revenue: 0, orders: 0 },
  };
  const timeline = analytics?.timeline ?? [];
  const orderPipeline = analytics?.orderPipeline ?? [];
  const recentOrders = analytics?.recentOrders ?? [];
  const criticalItems = analytics?.inventoryHealth?.criticalItems ?? [];

  const todayPoint = timeline.length > 0 ? timeline[timeline.length - 1] : null;

  const awaitingFulfillmentCount =
    (orderPipeline.find((p) => p.stage === "CONFIRMED")?.count ?? 0) +
    (orderPipeline.find((p) => p.stage === "PROCESSING")?.count ?? 0);

  const pendingReturnsCount =
    (returnsQuery.data?.data?.statusCounts?.REQUESTED ?? 0) +
    (returnsQuery.data?.data?.statusCounts?.UNDER_REVIEW ?? 0);

  const lowStockCount =
    (analytics?.inventoryHealth?.lowStockCount ?? 0) +
    (analytics?.inventoryHealth?.outOfStockCount ?? 0);

  const hasNoActionRequired =
    awaitingFulfillmentCount === 0 &&
    pendingReturnsCount === 0 &&
    lowStockCount === 0;

  const handleRefreshAll = () => {
    readiness.refetch();
    analyticsQuery.refetch();
    returnsQuery.refetch();
  };

  const handleStatusUpdate = (orderId: string, nextStatus: string) => {
    updateStatus.mutate(
      { shopId, orderId, status: nextStatus },
      {
        onSuccess: () => {
          toast.add({
            title: "Order updated",
            description: `Order #${orderId.slice(0, 8)} status set to ${nextStatus}.`,
            type: "success",
          });
          analyticsQuery.refetch();
        },
        onError: (err: any) => {
          toast.add({
            title: "Update failed",
            description:
              err?.response?.data?.message ||
              err?.message ||
              "Could not update status.",
            type: "error",
          });
        },
      }
    );
  };

  const handleConfirmShipment = () => {
    if (!shippingOrder) return;
    const finalCarrier = carrier === "Other" ? customCarrier.trim() : carrier;

    if (!finalCarrier) {
      toast.add({
        title: "Carrier required",
        description: "Please specify a carrier name.",
        type: "error",
      });
      return;
    }

    if (!trackingNumber.trim()) {
      toast.add({
        title: "Tracking number required",
        description: "Please enter a valid tracking number.",
        type: "error",
      });
      return;
    }

    markShipped.mutate(
      {
        shopId,
        orderId: shippingOrder.id,
        shipment: {
          carrier: finalCarrier,
          trackingNumber: trackingNumber.trim(),
          trackingUrl: trackingUrl.trim() || undefined,
          note: shipNote.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.add({
            title: "Shipment confirmed",
            description: `Order #${shippingOrder.id.slice(0, 8)} marked as shipped with ${finalCarrier}.`,
            type: "success",
          });
          setShippingOrder(null);
          setTrackingNumber("");
          setTrackingUrl("");
          setShipNote("");
          setCustomCarrier("");
          analyticsQuery.refetch();
        },
        onError: (err: any) => {
          toast.add({
            title: "Shipment failed",
            description:
              err?.response?.data?.message ||
              err?.message ||
              "Could not record shipment.",
            type: "error",
          });
        },
      }
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5">
      {/* 1. HEADER SECTION */}
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            {shop?.profile?.logo ? (
              <img
                src={shop.profile.logo}
                alt={shop.profile.name || "Store"}
                className="size-11 rounded-lg object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
                <Store className="size-5" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-semibold text-slate-900">
                  {shop?.profile?.name ?? "Store"}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${status.bgClass}`}
                >
                  <span className={`size-1.5 rounded-full ${status.dotClass}`} />
                  <span className={status.textClass}>{status.label}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {shop?.slug ? `/${shop.slug}` : shopId}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {isStoreActive && (
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setRange("7d")}
                  className={`rounded-md px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                    range === "7d"
                      ? "bg-white text-slate-900 font-semibold shadow-2xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  7D
                </button>
                <button
                  type="button"
                  onClick={() => setRange("30d")}
                  className={`rounded-md px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                    range === "30d"
                      ? "bg-white text-slate-900 font-semibold shadow-2xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  30D
                </button>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              disabled={readiness.isFetching || analyticsQuery.isFetching}
              className="h-8 px-2.5 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium cursor-pointer"
            >
              <RefreshCw
                className={`size-3.5 ${
                  readiness.isFetching || analyticsQuery.isFetching
                    ? "animate-spin text-orange-500"
                    : ""
                }`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(shop ? `/${shop.slug}` : "/", "_blank")
              }
              className="h-8 px-3 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium gap-1.5 cursor-pointer"
            >
              <ExternalLink className="size-3.5" />
              <span>Storefront</span>
            </Button>
          </div>
        </div>

        {/* Collapsible checklist for active stores */}
        {isStoreActive ? (
          <div className="mt-4 pt-3.5 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-600 font-medium">
                  Store setup complete ({setupItems.length}/{setupItems.length})
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowChecklist((prev) => !prev)}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{showChecklist ? "Hide checklist" : "View checklist"}</span>
                {showChecklist ? (
                  <ChevronUp className="size-3.5" />
                ) : (
                  <ChevronDown className="size-3.5" />
                )}
              </button>
            </div>

            {showChecklist && (
              <div className="mt-3 pt-3 border-t border-slate-100 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {setupItems.map((item) => {
                  const Icon = item.icon;
                  const isComplete = checks[item.key];
                  return (
                    <Link
                      key={item.key}
                      to={`${dashboardPath}/${item.destination}`}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 hover:bg-white hover:border-slate-300 transition-colors text-xs group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="size-3.5 text-slate-400 group-hover:text-orange-500 shrink-0" />
                        <span className="font-medium text-slate-700 truncate text-xs">
                          {item.title}
                        </span>
                      </div>
                      {isComplete ? (
                        <Check className="size-3.5 text-emerald-600 shrink-0 ml-1.5" />
                      ) : (
                        <CircleDashed className="size-3.5 text-amber-500 shrink-0 ml-1.5" />
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Readiness progress for pending stores */
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">
                Store setup progress
              </span>
              <span className="font-medium text-slate-900">
                {completed} of {setupItems.length} completed ({percent}%)
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-orange-500 transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* 2. ATTENTION REQUIRED (Active Stores) */}
      {isStoreActive && (
        <section className="space-y-2">
          {hasNoActionRequired ? (
            <div className="rounded-lg border border-slate-200 bg-white p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-600 font-medium">
                  No immediate action needed. Orders, returns, and inventory are in good standing.
                </span>
              </div>
              <Link
                to={`${dashboardPath}/orders`}
                className="text-xs font-medium text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
              >
                <span>View orders</span>
                <ArrowRight className="size-3" />
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {/* Alert 1: Orders to fulfill */}
              <Link
                to={`${dashboardPath}/orders`}
                className={`rounded-lg border p-3.5 transition-colors flex items-center justify-between group ${
                  awaitingFulfillmentCount > 0
                    ? "border-amber-200 bg-amber-50/40 hover:bg-amber-50/70"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-1.5 rounded-full ${
                        awaitingFulfillmentCount > 0
                          ? "bg-amber-500"
                          : "bg-slate-300"
                      }`}
                    />
                    <span className="text-xs font-semibold text-slate-900">
                      Orders to fulfill
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-3.5">
                    {awaitingFulfillmentCount > 0
                      ? `${awaitingFulfillmentCount} awaiting pack & ship`
                      : "All orders dispatched"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      awaitingFulfillmentCount > 0
                        ? "text-amber-800"
                        : "text-slate-400"
                    }`}
                  >
                    {awaitingFulfillmentCount}
                  </span>
                  <ArrowRight className="size-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              {/* Alert 2: Pending Returns */}
              <Link
                to={`${dashboardPath}/returns`}
                className={`rounded-lg border p-3.5 transition-colors flex items-center justify-between group ${
                  pendingReturnsCount > 0
                    ? "border-purple-200 bg-purple-50/40 hover:bg-purple-50/70"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-1.5 rounded-full ${
                        pendingReturnsCount > 0
                          ? "bg-purple-500"
                          : "bg-slate-300"
                      }`}
                    />
                    <span className="text-xs font-semibold text-slate-900">
                      Return requests
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-3.5">
                    {pendingReturnsCount > 0
                      ? `${pendingReturnsCount} awaiting review`
                      : "No pending requests"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      pendingReturnsCount > 0
                        ? "text-purple-800"
                        : "text-slate-400"
                    }`}
                  >
                    {pendingReturnsCount}
                  </span>
                  <ArrowRight className="size-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              {/* Alert 3: Low stock */}
              <Link
                to={`${dashboardPath}/products`}
                className={`rounded-lg border p-3.5 transition-colors flex items-center justify-between group ${
                  lowStockCount > 0
                    ? "border-rose-200 bg-rose-50/40 hover:bg-rose-50/70"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-1.5 rounded-full ${
                        lowStockCount > 0 ? "bg-rose-500" : "bg-slate-300"
                      }`}
                    />
                    <span className="text-xs font-semibold text-slate-900">
                      Low stock items
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-3.5">
                    {lowStockCount > 0
                      ? `${lowStockCount} items at or below limit`
                      : "Stock levels healthy"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      lowStockCount > 0 ? "text-rose-700" : "text-slate-400"
                    }`}
                  >
                    {lowStockCount}
                  </span>
                  <ArrowRight className="size-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            </div>
          )}
        </section>
      )}

      {/* 3. KEY METRICS CARDS (Active Stores) */}
      {isStoreActive && (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Gross revenue */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <span className="text-xs font-medium text-slate-500 block">
              Gross revenue
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-semibold text-slate-900 tabular-nums">
                {formatCurrency(todayPoint?.revenue ?? 0)}
              </span>
              <span className="text-[11px] text-slate-400">today</span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>{range === "7d" ? "7-day" : "30-day"} total:</span>
              <span className="font-semibold text-slate-800 tabular-nums">
                {formatCurrency(summary.totalRevenue)}
              </span>
            </div>
          </div>

          {/* Card 2: Orders */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <span className="text-xs font-medium text-slate-500 block">
              Orders placed
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-semibold text-slate-900 tabular-nums">
                {todayPoint?.orders ?? 0}
              </span>
              <span className="text-[11px] text-slate-400">today</span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>{range === "7d" ? "7-day" : "30-day"} total:</span>
              <span className="font-semibold text-slate-800 tabular-nums">
                {formatNumber(summary.totalOrders)}
              </span>
            </div>
          </div>

          {/* Card 3: Average Order Value */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <span className="text-xs font-medium text-slate-500 block">
              Average order value
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-semibold text-slate-900 tabular-nums">
                {formatCurrency(summary.averageOrderValue)}
              </span>
              {summary.aovGrowth >= 0 ? (
                <span className="text-[11px] font-medium text-emerald-700">
                  +{summary.aovGrowth}%
                </span>
              ) : (
                <span className="text-[11px] font-medium text-rose-600">
                  {summary.aovGrowth}%
                </span>
              )}
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Fulfillment rate:</span>
              <span className="font-semibold text-slate-800 tabular-nums">
                {summary.fulfillmentRate}%
              </span>
            </div>
          </div>

          {/* Card 4: Units Sold */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <span className="text-xs font-medium text-slate-500 block">
              Units sold
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-semibold text-slate-900 tabular-nums">
                {formatNumber(todayPoint?.units ?? 0)}
              </span>
              <span className="text-[11px] text-slate-400">today</span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>{range === "7d" ? "7-day" : "30-day"} total:</span>
              <span className="font-semibold text-slate-800 tabular-nums">
                {formatNumber(summary.unitsSold)}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* 4. REVENUE CHART & LOW STOCK WATCHLIST (Active Stores) */}
      {isStoreActive && (
        <section className="grid gap-5 lg:grid-cols-12">
          {/* Revenue Chart (7 of 12 cols) */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-semibold text-slate-900">
                    Gross revenue
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {range === "7d" ? "Last 7 days" : "Last 30 days"}
                  </p>
                </div>

                {summary.peakDay?.label && summary.peakDay.label !== "N/A" && (
                  <span className="text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded px-2 py-0.5">
                    Peak: {summary.peakDay.label} ({formatCurrency(summary.peakDay.revenue)})
                  </span>
                )}
              </div>

              {/* AreaChart */}
              <div className="mt-4 h-56 w-full">
                {timeline.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={timeline}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-md text-xs">
                                <p className="font-semibold text-slate-900">{d.label || label}</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900 tabular-nums">
                                  {formatCurrency(d.revenue)}
                                </p>
                                <div className="mt-1 flex items-center gap-2 text-slate-500 text-[11px]">
                                  <span>{d.orders} orders</span>
                                  <span>•</span>
                                  <span>{d.units} units</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#f97316"
                        strokeWidth={1.75}
                        fill="url(#revenueGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    No transactions recorded for this period.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Net revenue:</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {formatCurrency(summary.netRevenue)}
              </span>
            </div>
          </div>

          {/* Low Stock Watchlist (5 of 12 cols) */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-semibold text-slate-900">
                    Low stock inventory
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Items needing replenishment
                  </p>
                </div>
                <Link
                  to={`${dashboardPath}/products`}
                  className="text-xs font-medium text-orange-600 hover:text-orange-700"
                >
                  Manage
                </Link>
              </div>

              <div className="mt-3 space-y-2">
                {criticalItems.length > 0 ? (
                  criticalItems.slice(0, 4).map((item) => {
                    const isOutOfStock = item.stock <= 0;
                    const isCriticallyLow = item.stock > 0 && item.stock <= 5;
                    const percentRemaining = Math.min(
                      100,
                      Math.max(4, Math.round((item.stock / (item.maxCapacity || 50)) * 100))
                    );

                    return (
                      <div
                        key={item.id}
                        className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 flex items-center gap-2.5"
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="size-9 rounded-md object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="flex size-9 items-center justify-center rounded-md bg-white border border-slate-200 text-slate-400 shrink-0">
                            <Package className="size-4" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <h4 className="text-xs font-medium text-slate-800 truncate">
                              {item.name}
                            </h4>
                            <span
                              className={`text-[10px] font-medium shrink-0 ${
                                isOutOfStock
                                  ? "text-rose-600 font-semibold"
                                  : isCriticallyLow
                                  ? "text-amber-600"
                                  : "text-slate-600"
                              }`}
                            >
                              {isOutOfStock ? "Out of stock" : `${item.stock} left`}
                            </span>
                          </div>

                          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span className="truncate">{item.sku || "—"}</span>
                            <span className="font-semibold text-slate-700 font-sans">
                              {formatCurrency(item.price)}
                            </span>
                          </div>

                          {/* Subtle inventory bar */}
                          <div className="mt-1 h-1 w-full rounded-full bg-slate-200/60 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isOutOfStock
                                  ? "bg-rose-500"
                                  : isCriticallyLow
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${percentRemaining}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-slate-400">
                    <ShieldCheck className="size-6 text-slate-300 mb-1" />
                    <p className="font-medium text-slate-600">All products in stock</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No items currently below threshold.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100">
              <Link
                to={`${dashboardPath}/products`}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span>Inventory catalog</span>
                <ArrowRight className="size-3.5 text-slate-400" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 5. RECENT ORDERS TABLE (Active Stores) */}
      {isStoreActive && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Recent orders
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Latest customer purchases and fulfillment status
              </p>
            </div>

            <Link
              to={`${dashboardPath}/orders`}
              className="text-xs font-medium text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
            >
              <span>View all orders</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            {recentOrders.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <ShoppingBag className="mx-auto size-6 text-slate-300 mb-2" />
                <p className="font-medium text-slate-600">No orders placed yet</p>
                <p className="text-slate-400 mt-0.5">
                  Orders will show here once customers start checking out.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200 hover:bg-transparent">
                    <TableHead className="h-9 text-xs font-medium text-slate-500">Order</TableHead>
                    <TableHead className="h-9 text-xs font-medium text-slate-500">Customer</TableHead>
                    <TableHead className="h-9 text-xs font-medium text-slate-500">Items</TableHead>
                    <TableHead className="h-9 text-xs font-medium text-slate-500">Total</TableHead>
                    <TableHead className="h-9 text-xs font-medium text-slate-500">Status</TableHead>
                    <TableHead className="h-9 text-xs font-medium text-slate-500">Date</TableHead>
                    <TableHead className="h-9 text-right text-xs font-medium text-slate-500">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => {
                    const badge =
                      orderStatusBadges[order.status] ?? {
                        label: order.status,
                        dotClass: "bg-slate-400",
                        textClass: "text-slate-600",
                      };
                    const isConfirmed = order.status === "CONFIRMED";
                    const isProcessing = order.status === "PROCESSING";
                    const isShipped = order.status === "SHIPPED";

                    return (
                      <TableRow
                        key={order.id}
                        className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                      >
                        <TableCell className="font-mono text-xs font-medium text-slate-900 py-3">
                          <Link
                            to={`${dashboardPath}/orders/${order.id}`}
                            className="hover:text-orange-600 transition-colors"
                          >
                            #{order.id.slice(0, 8)}
                          </Link>
                        </TableCell>

                        <TableCell className="py-3">
                          <div className="text-xs font-medium text-slate-800">
                            {order.customerName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {order.location || "Standard"}
                          </div>
                        </TableCell>

                        <TableCell className="text-xs text-slate-600 py-3">
                          {order.itemsCount} {order.itemsCount === 1 ? "item" : "items"}
                        </TableCell>

                        <TableCell className="font-semibold text-xs text-slate-900 tabular-nums py-3">
                          {formatCurrency(order.totalAmount)}
                        </TableCell>

                        <TableCell className="py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                            <span className={`size-1.5 rounded-full ${badge.dotClass}`} />
                            <span className={badge.textClass}>{badge.label}</span>
                          </span>
                        </TableCell>

                        <TableCell className="text-xs text-slate-500 whitespace-nowrap py-3">
                          {new Date(order.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>

                        <TableCell className="text-right py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {isConfirmed && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleStatusUpdate(order.id, "PROCESSING")
                                }
                                disabled={updateStatus.isPending}
                                className="h-7 px-2.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                {updateStatus.isPending ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <Check className="size-3" />
                                )}
                                <span>Process</span>
                              </button>
                            )}

                            {isProcessing && (
                              <button
                                type="button"
                                onClick={() => setShippingOrder(order)}
                                className="h-7 px-2.5 rounded-md bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Truck className="size-3" />
                                <span>Ship</span>
                              </button>
                            )}

                            {isShipped && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleStatusUpdate(order.id, "DELIVERED")
                                }
                                disabled={updateStatus.isPending}
                                className="h-7 px-2.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                {updateStatus.isPending ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <Check className="size-3" />
                                )}
                                <span>Delivered</span>
                              </button>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <button
                                    type="button"
                                    className="size-7 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                                  />
                                }
                              >
                                <MoreVertical className="size-3.5" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 rounded-lg p-1 border-slate-200 text-xs">
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigate(`${dashboardPath}/orders/${order.id}`)
                                  }
                                  className="cursor-pointer text-xs font-medium"
                                >
                                  <Eye className="size-3.5 mr-2 text-slate-400" />
                                  <span>View order</span>
                                </DropdownMenuItem>

                                {!isProcessing && !isShipped && order.status !== "DELIVERED" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusUpdate(order.id, "PROCESSING")
                                    }
                                    className="cursor-pointer text-xs font-medium"
                                  >
                                    <Check className="size-3.5 mr-2 text-slate-400" />
                                    <span>Process order</span>
                                  </DropdownMenuItem>
                                )}

                                {!isShipped && order.status !== "DELIVERED" && (
                                  <DropdownMenuItem
                                    onClick={() => setShippingOrder(order)}
                                    className="cursor-pointer text-xs font-medium"
                                  >
                                    <Truck className="size-3.5 mr-2 text-slate-400" />
                                    <span>Record shipment</span>
                                  </DropdownMenuItem>
                                )}

                                {isShipped && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusUpdate(order.id, "DELIVERED")
                                    }
                                    className="cursor-pointer text-xs font-medium"
                                  >
                                    <Check className="size-3.5 mr-2 text-emerald-600" />
                                    <span>Mark delivered</span>
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </section>
      )}

      {/* 6. SHORTCUT CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link
          to={`${dashboardPath}/products`}
          className="rounded-lg border border-slate-200 bg-white p-3.5 hover:border-slate-300 transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <Package className="size-4 text-slate-400 group-hover:text-orange-500 transition-colors" />
            <div>
              <p className="text-xs font-medium text-slate-900 group-hover:text-orange-600 transition-colors">
                Products
              </p>
              <p className="text-[11px] text-slate-400">
                {analytics?.inventoryHealth?.totalProducts ?? 0} listed
              </p>
            </div>
          </div>
          <ArrowRight className="size-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
        </Link>

        <Link
          to={`${dashboardPath}/orders`}
          className="rounded-lg border border-slate-200 bg-white p-3.5 hover:border-slate-300 transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="size-4 text-slate-400 group-hover:text-orange-500 transition-colors" />
            <div>
              <p className="text-xs font-medium text-slate-900 group-hover:text-orange-600 transition-colors">
                Orders
              </p>
              <p className="text-[11px] text-slate-400">
                {awaitingFulfillmentCount > 0
                  ? `${awaitingFulfillmentCount} pending`
                  : "All fulfilled"}
              </p>
            </div>
          </div>
          <ArrowRight className="size-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
        </Link>

        <Link
          to={`${dashboardPath}/returns`}
          className="rounded-lg border border-slate-200 bg-white p-3.5 hover:border-slate-300 transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <RotateCcw className="size-4 text-slate-400 group-hover:text-orange-500 transition-colors" />
            <div>
              <p className="text-xs font-medium text-slate-900 group-hover:text-orange-600 transition-colors">
                Returns
              </p>
              <p className="text-[11px] text-slate-400">
                {pendingReturnsCount > 0
                  ? `${pendingReturnsCount} pending`
                  : "None open"}
              </p>
            </div>
          </div>
          <ArrowRight className="size-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
        </Link>

        <Link
          to={`${dashboardPath}/reviews`}
          className="rounded-lg border border-slate-200 bg-white p-3.5 hover:border-slate-300 transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <UserRound className="size-4 text-slate-400 group-hover:text-orange-500 transition-colors" />
            <div>
              <p className="text-xs font-medium text-slate-900 group-hover:text-orange-600 transition-colors">
                Reviews
              </p>
              <p className="text-[11px] text-slate-400">Customer feedback</p>
            </div>
          </div>
          <ArrowRight className="size-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
        </Link>
      </section>

      {/* 7. FULL CHECKLIST (For PENDING stores) */}
      {!isStoreActive && (
        <section className="space-y-3">
          <div>
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Setup checklist
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete these steps to activate your storefront for buyer checkout.
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {setupItems.map((item) => {
              const Icon = item.icon;
              const isComplete = checks[item.key];
              return (
                <Link
                  key={item.key}
                  to={`${dashboardPath}/${item.destination}`}
                  className="rounded-lg border border-slate-200 bg-white p-3 hover:border-slate-300 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-slate-100 bg-slate-50 text-slate-600">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                          {item.title}
                        </span>
                        {isComplete && (
                          <span className="text-[10px] text-emerald-700 font-medium">
                            • Done
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {isComplete ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600 ml-2" />
                  ) : (
                    <CircleDashed className="size-4 shrink-0 text-slate-300 group-hover:text-orange-500 transition-colors ml-2" />
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 8. PUBLISH STORE BANNER (For PENDING stores) */}
      {shopStatus === "PENDING" && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-900">
              {passed ? "Store is ready to publish" : "Complete setup to publish"}
            </h3>
            <p className="text-xs text-slate-500 max-w-xl">
              {passed
                ? "All requirements are verified. Publish your store to make it live for shoppers."
                : `${setupItems.length - completed} requirement${
                    setupItems.length - completed === 1 ? "" : "s"
                  } remaining before your storefront can be published.`}
            </p>
            {publishShop.isError && (
              <p className="text-xs text-rose-600 font-medium">
                Publishing failed. Please refresh and try again.
              </p>
            )}
          </div>

          <Button
            size="sm"
            disabled={!canPublish || publishShop.isPending}
            onClick={() => publishShop.mutate()}
            className="h-8 px-4 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg cursor-pointer disabled:opacity-50 shrink-0 inline-flex items-center gap-1.5"
          >
            {publishShop.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Rocket className="size-3.5" />
            )}
            <span>{passed ? "Publish store" : "Setup incomplete"}</span>
          </Button>
        </section>
      )}

      {/* QUICK SHIP DIALOG MODAL */}
      <Dialog
        open={Boolean(shippingOrder)}
        onOpenChange={(open) => {
          if (!open) {
            setShippingOrder(null);
            setTrackingNumber("");
            setTrackingUrl("");
            setShipNote("");
            setCustomCarrier("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-lg bg-white p-5 shadow-xl border border-slate-200">
          <DialogHeader className="space-y-1 pb-2 border-b border-slate-100">
            <DialogTitle className="text-base font-semibold text-slate-900">
              Ship order #{shippingOrder?.id.slice(0, 8)}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Enter carrier and tracking details for customer fulfillment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 pt-3">
            {/* Carrier selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Carrier <span className="text-rose-500">*</span>
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_CARRIERS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCarrier(c)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium border transition-colors cursor-pointer ${
                      carrier === c
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {carrier === "Other" && (
                <Input
                  placeholder="Carrier name (e.g. SwiftLogistics)"
                  value={customCarrier}
                  onChange={(e) => setCustomCarrier(e.target.value)}
                  className="h-9 rounded-lg border-slate-200 text-xs mt-1"
                />
              )}
            </div>

            {/* Tracking Number */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Tracking number <span className="text-rose-500">*</span>
              </Label>
              <Input
                placeholder="e.g. 1Z9999999999999999"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="h-9 rounded-lg border-slate-200 font-mono text-xs"
              />
            </div>

            {/* Tracking URL */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Tracking URL <span className="text-slate-400 font-normal">(Optional)</span>
              </Label>
              <Input
                placeholder="https://track.carrier.com/..."
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                className="h-9 rounded-lg border-slate-200 text-xs"
              />
            </div>

            {/* Internal note */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Internal note <span className="text-slate-400 font-normal">(Optional)</span>
              </Label>
              <Input
                placeholder="e.g. Packed with bubble wrap"
                value={shipNote}
                onChange={(e) => setShipNote(e.target.value)}
                className="h-9 rounded-lg border-slate-200 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShippingOrder(null)}
              className="h-8 px-3 text-xs font-medium text-slate-700 border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmShipment}
              disabled={markShipped.isPending}
              className="h-8 px-4 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg cursor-pointer"
            >
              {markShipped.isPending ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Truck className="mr-1.5 size-3.5" />
              )}
              <span>Confirm shipment</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
