import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  DollarSign,
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
  Sparkles,
  Store,
  TrendingDown,
  TrendingUp,
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
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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

const statusStyle: Record<ShopStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Setup in progress",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  ACTIVE: {
    label: "Trading & Live",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  PAUSED: {
    label: "Store Paused",
    className: "bg-blue-50 text-blue-800 border-blue-200",
  },
  SUSPENDED: {
    label: "Suspended",
    className: "bg-rose-50 text-rose-800 border-rose-200",
  },
  CLOSED: {
    label: "Store Closed",
    className: "bg-slate-100 text-slate-700 border-slate-300",
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
    title: "Create store profile",
    description: "Establish your basic storefront identity.",
    icon: Store,
    destination: "settings",
  },
  {
    key: "hasName",
    title: "Add public store name",
    description: "The public trading name buyers will see.",
    icon: UserRound,
    destination: "settings",
  },
  {
    key: "hasDescription",
    title: "Add store description",
    description: "Describe your catalog and specialty to shoppers.",
    icon: FileText,
    destination: "settings",
  },
  {
    key: "hasLogo",
    title: "Upload store logo",
    description: "Add a recognizable visual identity and brand badge.",
    icon: ImagePlus,
    destination: "settings",
  },
  {
    key: "hasContactInfo",
    title: "Add merchant contact details",
    description: "Provide customer support email and phone.",
    icon: UserRound,
    destination: "settings",
  },
  {
    key: "hasAddress",
    title: "Add business address",
    description: "Physical operating address or registered office.",
    icon: MapPin,
    destination: "settings",
  },
  {
    key: "hasLegalInfo",
    title: "Legal & tax registration",
    description: "Provide tax ID/EIN and entity classification.",
    icon: Building2,
    destination: "settings",
  },
  {
    key: "hasAtLeastOneActiveProduct",
    title: "Publish active product",
    description: "Add at least one item available for instant checkout.",
    icon: PackagePlus,
    destination: "products",
  },
];

const orderStatusBadges: Record<
  string,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pending Payment",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  CONFIRMED: {
    label: "Confirmed (To Pack)",
    className: "bg-orange-50 text-orange-800 border-orange-200",
  },
  PROCESSING: {
    label: "Processing",
    className: "bg-blue-50 text-blue-800 border-blue-200",
  },
  SHIPPED: {
    label: "Shipped",
    className: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  DELIVERED: {
    label: "Delivered",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-rose-50 text-rose-800 border-rose-200",
  },
  REFUNDED: {
    label: "Refunded",
    className: "bg-purple-50 text-purple-800 border-purple-200",
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

  // Range toggle for metrics (7d or 30d)
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

  // Loading state for initial shop readiness check
  if (readiness.isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="mx-auto size-8 animate-spin text-orange-500" />
          <p className="text-xs font-semibold text-slate-500 tracking-wide">
            Verifying store readiness & operational cockpit...
          </p>
        </div>
      </div>
    );
  }

  // Error state for shop readiness
  if (readiness.isError || !readiness.data) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-8 text-center max-w-xl mx-auto space-y-4">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <AlertCircle className="size-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Unable to retrieve shop status
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Your shop configuration is safe. Please check connection and try again.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            readiness.refetch();
            analyticsQuery.refetch();
          }}
          className="rounded-xl border-slate-300 text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className="mr-1.5 size-3.5" /> Retry verification
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

  // Analytics payload parsing
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

  // Compute Today's Point from timeline (last point is today)
  const todayPoint = timeline.length > 0 ? timeline[timeline.length - 1] : null;

  // Compute Action Required Metrics
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

  // Refresh handler
  const handleRefreshAll = () => {
    readiness.refetch();
    analyticsQuery.refetch();
    returnsQuery.refetch();
  };

  // 1-Click Status Update Handler
  const handleStatusUpdate = (orderId: string, nextStatus: string) => {
    updateStatus.mutate(
      { shopId, orderId, status: nextStatus },
      {
        onSuccess: () => {
          toast.add({
            title: "Order Updated",
            description: `Order #${orderId.slice(0, 8)} status updated to ${nextStatus}.`,
            type: "success",
          });
          analyticsQuery.refetch();
        },
        onError: (err: any) => {
          toast.add({
            title: "Status update failed",
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

  // Quick Ship Submit Handler
  const handleConfirmShipment = () => {
    if (!shippingOrder) return;
    const finalCarrier = carrier === "Other" ? customCarrier.trim() : carrier;

    if (!finalCarrier) {
      toast.add({
        title: "Missing carrier",
        description: "Please specify a shipping carrier name.",
        type: "error",
      });
      return;
    }

    if (!trackingNumber.trim()) {
      toast.add({
        title: "Missing tracking number",
        description: "Please provide a valid tracking number for package tracking.",
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
            title: "Shipment Dispatched",
            description: `Order #${shippingOrder.id.slice(0, 8)} has been marked as shipped with ${finalCarrier}.`,
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
    <div className="mx-auto w-full max-w-6xl space-y-7">
      {/* 1. HERO STORE HEADER CARD */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 md:p-8 shadow-xs">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            {shop?.profile?.logo ? (
              <img
                src={shop.profile.logo}
                alt={shop.profile.name || "Store"}
                className="size-16 rounded-2xl object-cover border border-slate-200 shadow-2xs"
              />
            ) : (
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20">
                <Store className="size-8" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {shop?.profile?.name ?? "Merchant Workspace"}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${status.className}`}
                >
                  <BadgeCheck className="size-3.5" /> {status.label}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 font-medium">
                Storefront:{" "}
                <span className="font-mono text-slate-700">
                  {shop?.slug ? `/${shop.slug}` : shopId}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons & Range Switcher */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {isStoreActive && (
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setRange("7d")}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                    range === "7d"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  7 Days
                </button>
                <button
                  type="button"
                  onClick={() => setRange("30d")}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                    range === "30d"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  30 Days
                </button>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              disabled={readiness.isFetching || analyticsQuery.isFetching}
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold h-9 px-3.5 gap-1.5 cursor-pointer"
            >
              <RefreshCw
                className={`size-3.5 ${
                  readiness.isFetching || analyticsQuery.isFetching
                    ? "animate-spin text-orange-500"
                    : ""
                }`}
              />
              <span>Refresh</span>
            </Button>

            <Button
              size="sm"
              onClick={() =>
                window.open(shop ? `/${shop.slug}` : "/", "_blank")
              }
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold h-9 px-4 gap-1.5 cursor-pointer shadow-2xs"
            >
              <ExternalLink className="size-3.5" />
              <span>View Storefront</span>
            </Button>
          </div>
        </div>

        {/* Collapsible Onboarding Badge for ACTIVE stores */}
        {isStoreActive ? (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Check className="size-4 stroke-[3]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Store Verified & Live
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      All {setupItems.length} Requirements Complete
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Your merchant account is fully configured and customer checkout is operational.
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChecklist((prev) => !prev)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 h-8 px-2.5 gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <span>
                  {showChecklist ? "Hide Checklist" : "View Checklist (8/8)"}
                </span>
                {showChecklist ? (
                  <ChevronUp className="size-3.5" />
                ) : (
                  <ChevronDown className="size-3.5" />
                )}
              </Button>
            </div>

            {/* Expanded Checklist Modal/Accordion View */}
            {showChecklist && (
              <div className="mt-4 pt-4 border-t border-slate-100 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in duration-200">
                {setupItems.map((item) => {
                  const Icon = item.icon;
                  const isComplete = checks[item.key];
                  return (
                    <Link
                      key={item.key}
                      to={`${dashboardPath}/${item.destination}`}
                      className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-2.5 hover:border-orange-300 hover:bg-white transition-all text-xs group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className="size-3.5 text-slate-500 group-hover:text-orange-600 shrink-0" />
                        <span className="font-semibold text-slate-700 truncate text-[11px]">
                          {item.title}
                        </span>
                      </div>
                      {isComplete ? (
                        <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 ml-1.5" />
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
          /* Readiness Progress Bar for PENDING stores */
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">
                Onboarding & Publishing Readiness
              </span>
              <span className="font-bold text-orange-600">
                {completed} of {setupItems.length} Requirements Verified ({percent}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* 2. ACTION REQUIRED ALERT STREAM (Active Stores) */}
      {isStoreActive && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight text-slate-900 uppercase tracking-wider text-[11px] text-slate-400">
              Immediate Operations
            </h2>
            <span className="text-[11px] text-slate-500 font-medium">
              Real-time store alerts
            </span>
          </div>

          {hasNoActionRequired ? (
            <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-white p-4 shadow-2xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900">
                      All Caught Up — No Action Required!
                    </p>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Operational Health 100%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    All customer orders are dispatched, no return requests are awaiting review, and product stock levels are healthy.
                  </p>
                </div>
              </div>
              <Link
                to={`${dashboardPath}/orders`}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                <span>View Orders Feed</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Alert 1: Orders Awaiting Fulfillment */}
              <Link
                to={`${dashboardPath}/orders`}
                className={`group relative overflow-hidden rounded-2xl border p-4 shadow-2xs transition-all hover:shadow-sm ${
                  awaitingFulfillmentCount > 0
                    ? "border-amber-200/90 bg-amber-50/60 hover:border-amber-400"
                    : "border-slate-200/80 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-10 items-center justify-center rounded-xl ${
                        awaitingFulfillmentCount > 0
                          ? "bg-amber-100 text-amber-700 shadow-2xs"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Truck className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                        Orders To Dispatch
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Awaiting pack & ship
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-black ${
                      awaitingFulfillmentCount > 0
                        ? "bg-amber-200/80 text-amber-900"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {awaitingFulfillmentCount}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span
                    className={
                      awaitingFulfillmentCount > 0
                        ? "font-semibold text-amber-800"
                        : "text-slate-400"
                    }
                  >
                    {awaitingFulfillmentCount > 0
                      ? `⚠️ ${awaitingFulfillmentCount} order${
                          awaitingFulfillmentCount === 1 ? "" : "s"
                        } require fulfillment`
                      : "All orders packed & shipped"}
                  </span>
                  <ArrowRight className="size-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              {/* Alert 2: Pending Return Requests */}
              <Link
                to={`${dashboardPath}/returns`}
                className={`group relative overflow-hidden rounded-2xl border p-4 shadow-2xs transition-all hover:shadow-sm ${
                  pendingReturnsCount > 0
                    ? "border-purple-200/90 bg-purple-50/60 hover:border-purple-400"
                    : "border-slate-200/80 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-10 items-center justify-center rounded-xl ${
                        pendingReturnsCount > 0
                          ? "bg-purple-100 text-purple-700 shadow-2xs"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <RotateCcw className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-purple-800 transition-colors">
                        Pending Returns
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Disputes & claims
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-black ${
                      pendingReturnsCount > 0
                        ? "bg-purple-200/80 text-purple-900"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {pendingReturnsCount}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span
                    className={
                      pendingReturnsCount > 0
                        ? "font-semibold text-purple-800"
                        : "text-slate-400"
                    }
                  >
                    {pendingReturnsCount > 0
                      ? `⚠️ ${pendingReturnsCount} dispute${
                          pendingReturnsCount === 1 ? "" : "s"
                        } require review`
                      : "No pending return claims"}
                  </span>
                  <ArrowRight className="size-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              {/* Alert 3: Low-Stock Warnings */}
              <Link
                to={`${dashboardPath}/products`}
                className={`group relative overflow-hidden rounded-2xl border p-4 shadow-2xs transition-all hover:shadow-sm ${
                  lowStockCount > 0
                    ? "border-rose-200/90 bg-rose-50/60 hover:border-rose-400"
                    : "border-slate-200/80 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-10 items-center justify-center rounded-xl ${
                        lowStockCount > 0
                          ? "bg-rose-100 text-rose-700 shadow-2xs"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <AlertTriangle className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-rose-800 transition-colors">
                        Stock Warnings
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Low or out of stock
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-black ${
                      lowStockCount > 0
                        ? "bg-rose-200/80 text-rose-900"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {lowStockCount}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span
                    className={
                      lowStockCount > 0
                        ? "font-semibold text-rose-800"
                        : "text-slate-400"
                    }
                  >
                    {lowStockCount > 0
                      ? `⚠️ ${lowStockCount} product${
                          lowStockCount === 1 ? "" : "s"
                        } below stock limit`
                      : "Inventory healthy & in stock"}
                  </span>
                  <ArrowRight className="size-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            </div>
          )}
        </section>
      )}

      {/* 3. LIVE DAILY & PERIOD METRICS (Active Stores) */}
      {isStoreActive && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Performance Cockpit
              </h2>
              <p className="text-xs text-slate-500">
                Live metrics across daily checkouts, gross revenue, and fulfillment
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Feed
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Metric 1: Today's Sales & Period Gross */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Today's Sales
                </span>
                <div className="flex size-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                  <DollarSign className="size-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black tracking-tight text-slate-900">
                  {formatCurrency(todayPoint?.revenue ?? 0)}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  {summary.revenueGrowth >= 0 ? (
                    <span className="inline-flex items-center font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] border border-emerald-200">
                      <TrendingUp className="mr-0.5 size-2.5" />
                      +{summary.revenueGrowth}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-[10px] border border-rose-200">
                      <TrendingDown className="mr-0.5 size-2.5" />
                      {summary.revenueGrowth}%
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400">vs prev {range}</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Period Gross ({range}):</span>
                <span className="font-bold text-slate-800">
                  {formatCurrency(summary.totalRevenue)}
                </span>
              </div>
            </div>

            {/* Metric 2: Orders Today & Total Volume */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Orders Today
                </span>
                <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <ShoppingBag className="size-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black tracking-tight text-slate-900">
                  {todayPoint?.orders ?? 0}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  {summary.ordersGrowth >= 0 ? (
                    <span className="inline-flex items-center font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] border border-emerald-200">
                      <TrendingUp className="mr-0.5 size-2.5" />
                      +{summary.ordersGrowth}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-[10px] border border-rose-200">
                      <TrendingDown className="mr-0.5 size-2.5" />
                      {summary.ordersGrowth}%
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400">vs prev {range}</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Completed Orders:</span>
                <span className="font-bold text-slate-800">
                  {formatNumber(summary.totalOrders)}
                </span>
              </div>
            </div>

            {/* Metric 3: Average Order Value (AOV) */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Avg Order Value
                </span>
                <div className="flex size-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                  <Sparkles className="size-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black tracking-tight text-slate-900">
                  {formatCurrency(summary.averageOrderValue)}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  {summary.aovGrowth >= 0 ? (
                    <span className="inline-flex items-center font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] border border-emerald-200">
                      <TrendingUp className="mr-0.5 size-2.5" />
                      +{summary.aovGrowth}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-[10px] border border-rose-200">
                      <TrendingDown className="mr-0.5 size-2.5" />
                      {summary.aovGrowth}%
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400">basket value</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Fulfillment Rate:</span>
                <span className="font-bold text-emerald-700">
                  {summary.fulfillmentRate}%
                </span>
              </div>
            </div>

            {/* Metric 4: Units Sold */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Units Sold
                </span>
                <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Package className="size-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black tracking-tight text-slate-900">
                  {formatNumber(todayPoint?.units ?? 0)}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  {summary.unitsGrowth >= 0 ? (
                    <span className="inline-flex items-center font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] border border-emerald-200">
                      <TrendingUp className="mr-0.5 size-2.5" />
                      +{summary.unitsGrowth}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-[10px] border border-rose-200">
                      <TrendingDown className="mr-0.5 size-2.5" />
                      {summary.unitsGrowth}%
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400">vs prev {range}</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Total Units ({range}):</span>
                <span className="font-bold text-slate-800">
                  {formatNumber(summary.unitsSold)}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. REVENUE SPARKLINE CHART & CRITICAL STOCK WATCHLIST (Active Stores) */}
      {isStoreActive && (
        <section className="grid gap-6 lg:grid-cols-12">
          {/* Revenue Sparkline AreaChart (7 of 12 columns) */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Sales Trend & Revenue Curve
                  </h3>
                  <p className="text-xs text-slate-500">
                    Daily gross volume over the last {range === "7d" ? "7 days" : "30 days"}
                  </p>
                </div>

                {summary.peakDay?.label && summary.peakDay.label !== "N/A" && (
                  <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700 border border-orange-200 self-start sm:self-auto">
                    Peak: {summary.peakDay.label} ({formatCurrency(summary.peakDay.revenue)})
                  </span>
                )}
              </div>

              {/* Chart */}
              <div className="mt-6 h-60 w-full">
                {timeline.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={timeline}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#64748b", fontSize: 11 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-md backdrop-blur-xs text-xs">
                                <p className="font-bold text-slate-900">{d.label || label}</p>
                                <p className="mt-1 text-sm font-extrabold text-orange-600">
                                  {formatCurrency(d.revenue)}
                                </p>
                                <div className="mt-1 flex items-center gap-3 text-slate-500">
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
                        strokeWidth={2.5}
                        fill="url(#salesGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    No timeline transactions recorded yet.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Net Revenue (Post-refunds):</span>
              <span className="font-extrabold text-slate-900">
                {formatCurrency(summary.netRevenue)}
              </span>
            </div>
          </div>

          {/* Critical Stock Watchlist (5 of 12 columns) */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Critical Stock Watchlist
                  </h3>
                  <p className="text-xs text-slate-500">
                    Products at or below reorder threshold
                  </p>
                </div>
                <Link
                  to={`${dashboardPath}/products`}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700"
                >
                  Manage All
                </Link>
              </div>

              <div className="mt-4 space-y-3">
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
                        className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-white hover:border-slate-200 transition-all flex items-center gap-3"
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="size-11 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="flex size-11 items-center justify-center rounded-xl bg-slate-200/60 text-slate-500 shrink-0">
                            <Package className="size-5" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {item.name}
                            </h4>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                                isOutOfStock
                                  ? "bg-rose-100 text-rose-700 border border-rose-200"
                                  : isCriticallyLow
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {isOutOfStock
                                ? "Out of Stock"
                                : `${item.stock} left`}
                            </span>
                          </div>

                          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                            <span className="font-mono text-[10px] text-slate-400 truncate">
                              {item.sku || "NO-SKU"}
                            </span>
                            <span className="font-semibold text-slate-800">
                              {formatCurrency(item.price)}
                            </span>
                          </div>

                          {/* Inventory Capacity Bar */}
                          <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-200/70 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
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
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-10 text-center">
                    <ShieldCheck className="size-8 text-emerald-500 mb-2" />
                    <p className="text-xs font-bold text-slate-900">
                      Catalog In Good Health
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500 max-w-[200px]">
                      No products are currently under the minimum stock threshold.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <Link
                to={`${dashboardPath}/products`}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 py-2 text-xs font-bold text-slate-700 transition-colors"
              >
                <span>Add or Restock Products</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 5. RECENT ORDERS TABLE & QUICK FULFILLMENT ACTIONS (Active Stores) */}
      {isStoreActive && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Recent Orders & Quick Fulfillment
              </h2>
              <p className="text-xs text-slate-500">
                1-click status transitions and courier shipping dispatch
              </p>
            </div>

            <Link
              to={`${dashboardPath}/orders`}
              className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 self-start sm:self-auto"
            >
              <span>View All Shop Orders</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <Card className="overflow-hidden border-slate-200/90 shadow-2xs rounded-3xl">
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <ShoppingBag className="size-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">No orders yet</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm">
                  Your storefront is live and ready for customers. As buyers complete checkouts, their orders will populate here with 1-click shipping actions.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/70">
                  <TableRow className="border-b border-slate-100 hover:bg-transparent">
                    <TableHead className="w-[110px] text-xs font-bold text-slate-700">
                      Order ID
                    </TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">
                      Customer & Destination
                    </TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">
                      Items
                    </TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">
                      Total
                    </TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">
                      Date
                    </TableHead>
                    <TableHead className="text-right text-xs font-bold text-slate-700">
                      Quick Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => {
                    const badge =
                      orderStatusBadges[order.status] ?? {
                        label: order.status,
                        className: "bg-slate-100 text-slate-700",
                      };
                    const isConfirmed = order.status === "CONFIRMED";
                    const isProcessing = order.status === "PROCESSING";
                    const isShipped = order.status === "SHIPPED";

                    return (
                      <TableRow
                        key={order.id}
                        className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                      >
                        <TableCell className="font-mono text-xs font-semibold text-slate-900">
                          <Link
                            to={`${dashboardPath}/orders/${order.id}`}
                            className="hover:text-orange-600 transition-colors"
                          >
                            #{order.id.slice(0, 8)}
                          </Link>
                        </TableCell>

                        <TableCell>
                          <div className="font-semibold text-xs text-slate-900">
                            {order.customerName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {order.location || "Direct Delivery"}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="bg-slate-100 text-slate-700 border-slate-200 text-[11px] font-medium"
                          >
                            {order.itemsCount} {order.itemsCount === 1 ? "item" : "items"}
                          </Badge>
                        </TableCell>

                        <TableCell className="font-bold text-xs text-slate-900">
                          {formatCurrency(order.totalAmount)}
                        </TableCell>

                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </TableCell>

                        <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* 1-Click Primary Action */}
                            {isConfirmed && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleStatusUpdate(order.id, "PROCESSING")
                                }
                                disabled={updateStatus.isPending}
                                className="h-8 rounded-xl border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold gap-1 cursor-pointer"
                              >
                                {updateStatus.isPending ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="size-3.5" />
                                )}
                                <span>Process</span>
                              </Button>
                            )}

                            {isProcessing && (
                              <Button
                                size="sm"
                                onClick={() => setShippingOrder(order)}
                                className="h-8 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold gap-1 shadow-2xs cursor-pointer"
                              >
                                <Truck className="size-3.5" />
                                <span>Ship</span>
                              </Button>
                            )}

                            {isShipped && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleStatusUpdate(order.id, "DELIVERED")
                                }
                                disabled={updateStatus.isPending}
                                className="h-8 rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold gap-1 cursor-pointer"
                              >
                                {updateStatus.isPending ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <BadgeCheck className="size-3.5" />
                                )}
                                <span>Delivered</span>
                              </Button>
                            )}

                            {/* Dropdown for More Options */}
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                                  />
                                }
                              >
                                <MoreVertical className="size-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigate(`${dashboardPath}/orders/${order.id}`)
                                  }
                                  className="cursor-pointer text-xs font-medium"
                                >
                                  <Eye className="size-3.5 mr-2" />
                                  <span>View Order Details</span>
                                </DropdownMenuItem>

                                {!isProcessing && !isShipped && order.status !== "DELIVERED" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusUpdate(order.id, "PROCESSING")
                                    }
                                    className="cursor-pointer text-xs font-medium"
                                  >
                                    <CheckCircle2 className="size-3.5 mr-2 text-blue-600" />
                                    <span>Mark as Processing</span>
                                  </DropdownMenuItem>
                                )}

                                {!isShipped && order.status !== "DELIVERED" && (
                                  <DropdownMenuItem
                                    onClick={() => setShippingOrder(order)}
                                    className="cursor-pointer text-xs font-medium"
                                  >
                                    <Truck className="size-3.5 mr-2 text-orange-600" />
                                    <span>Record Shipment</span>
                                  </DropdownMenuItem>
                                )}

                                {isShipped && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusUpdate(order.id, "DELIVERED")
                                    }
                                    className="cursor-pointer text-xs font-medium"
                                  >
                                    <BadgeCheck className="size-3.5 mr-2 text-emerald-600" />
                                    <span>Mark as Delivered</span>
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
          </Card>
        </section>
      )}

      {/* 6. QUICK OPERATIONS SHORTCUT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to={`${dashboardPath}/products`}
          className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-orange-500/40 hover:shadow-sm transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Package className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                Catalog Products
              </p>
              <p className="text-[11px] text-slate-400">
                {analytics?.inventoryHealth?.totalProducts ?? 0} active listings
              </p>
            </div>
          </div>
          <ArrowRight className="size-4 text-slate-300 group-hover:text-orange-500 transition-colors" />
        </Link>

        <Link
          to={`${dashboardPath}/orders`}
          className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-orange-500/40 hover:shadow-sm transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShoppingBag className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Shop Orders
              </p>
              <p className="text-[11px] text-slate-400">
                {awaitingFulfillmentCount > 0
                  ? `${awaitingFulfillmentCount} to ship`
                  : "All fulfilled"}
              </p>
            </div>
          </div>
          <ArrowRight className="size-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
        </Link>

        <Link
          to={`${dashboardPath}/returns`}
          className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-orange-500/40 hover:shadow-sm transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <RotateCcw className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                Returns & Refunds
              </p>
              <p className="text-[11px] text-slate-400">
                {pendingReturnsCount > 0
                  ? `${pendingReturnsCount} pending review`
                  : "No open claims"}
              </p>
            </div>
          </div>
          <ArrowRight className="size-4 text-slate-300 group-hover:text-purple-500 transition-colors" />
        </Link>

        <Link
          to={`${dashboardPath}/reviews`}
          className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-orange-500/40 hover:shadow-sm transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Customer Reviews
              </p>
              <p className="text-[11px] text-slate-400">Ratings & feedback</p>
            </div>
          </div>
          <ArrowRight className="size-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
        </Link>
      </div>

      {/* 7. FULL STORE ONBOARDING CHECKLIST (For PENDING stores) */}
      {!isStoreActive && (
        <section className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Onboarding Checklist
              </h2>
              <p className="text-xs text-slate-500">
                Complete each requirement to activate your store for public purchases.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {setupItems.map((item) => {
              const Icon = item.icon;
              const isComplete = checks[item.key];
              return (
                <Link
                  key={item.key}
                  to={`${dashboardPath}/${item.destination}`}
                  className="group flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all hover:border-orange-500/40 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${
                        isComplete
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-orange-50 text-orange-600 border-orange-100"
                      }`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                          {item.title}
                        </h3>
                        {isComplete && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500 truncate leading-relaxed">
                        {isComplete ? "Requirement satisfied." : item.description}
                      </p>
                    </div>
                  </div>

                  {isComplete ? (
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-500 ml-2" />
                  ) : (
                    <CircleDashed className="size-5 shrink-0 text-orange-400 group-hover:text-orange-600 transition-colors ml-2" />
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 8. PUBLISH STORE BANNER (For PENDING stores) */}
      {shopStatus === "PENDING" && (
        <section className="flex flex-col gap-4 rounded-3xl border border-orange-200/80 bg-gradient-to-r from-orange-50/60 via-amber-50/40 to-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="size-4.5 text-orange-600" />
              {passed
                ? "Your Store is Ready to Publish!"
                : "Finish Remaining Onboarding Steps"}
            </h2>
            <p className="mt-1 text-xs text-slate-600 max-w-xl">
              {passed
                ? "All requirements are verified by the platform. Click Publish to make your storefront live on the public marketplace."
                : `${setupItems.length - completed} item${
                    setupItems.length - completed === 1 ? "" : "s"
                  } still require your attention before publishing.`}
            </p>
            {publishShop.isError && (
              <p className="mt-2 text-xs font-semibold text-rose-600">
                Publishing failed. Please refresh verification and try again.
              </p>
            )}
          </div>

          <Button
            disabled={!canPublish || publishShop.isPending}
            onClick={() => publishShop.mutate()}
            className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold h-10 px-5 text-xs shadow-sm shadow-orange-500/25 shrink-0 cursor-pointer disabled:opacity-50"
          >
            {publishShop.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Rocket className="mr-2 size-4" />
            )}
            {passed ? "Publish Store Live" : "Requirements Incomplete"}
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
        <DialogContent className="sm:max-w-md rounded-3xl bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Truck className="size-5 text-orange-600" />
              Ship Order #{shippingOrder?.id.slice(0, 8)}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Provide carrier and package tracking details for customer fulfillment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Carrier selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Shipping Carrier <span className="text-rose-500">*</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {COMMON_CARRIERS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCarrier(c)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all cursor-pointer ${
                      carrier === c
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {carrier === "Other" && (
                <div className="pt-1">
                  <Input
                    placeholder="Enter carrier name (e.g. SwiftLogistics)"
                    value={customCarrier}
                    onChange={(e) => setCustomCarrier(e.target.value)}
                    className="h-9 rounded-xl text-xs"
                  />
                </div>
              )}
            </div>

            {/* Tracking Number */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Tracking Number <span className="text-rose-500">*</span>
              </Label>
              <Input
                placeholder="e.g. 1Z9999999999999999 or 9400100000000000000000"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="h-9 rounded-xl font-mono text-xs"
              />
            </div>

            {/* Tracking URL */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Tracking Link URL <span className="text-[11px] text-slate-400 font-normal">(Optional)</span>
              </Label>
              <Input
                placeholder="https://track.fedex.com/..."
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                className="h-9 rounded-xl text-xs"
              />
            </div>

            {/* Shipment Note */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Internal Shipment Note <span className="text-[11px] text-slate-400 font-normal">(Optional)</span>
              </Label>
              <Input
                placeholder="e.g. Packed with bubble wrap, left at drop-off station"
                value={shipNote}
                onChange={(e) => setShipNote(e.target.value)}
                className="h-9 rounded-xl text-xs"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShippingOrder(null)}
              className="rounded-xl border-slate-200 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmShipment}
              disabled={markShipped.isPending}
              className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold cursor-pointer"
            >
              {markShipped.isPending ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Truck className="mr-1.5 size-3.5" />
              )}
              <span>Confirm & Dispatch</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
