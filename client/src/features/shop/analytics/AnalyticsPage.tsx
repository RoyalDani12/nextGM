import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
    DollarSign,
    ShoppingBag,
    TrendingUp,
    TrendingDown,
    Package,
    AlertTriangle,
    RefreshCw,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    Truck,
    XCircle,
    RotateCcw,
    Sparkles,
    ShieldCheck,
    Globe,
    ChevronRight,
    MapPin,
    AlertOctagon,
    Download,
    Check,
} from "lucide-react";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { useShopAnalytics } from "./analytics.hooks";
import type { AnalyticsRange } from "./analytics.types";

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

const downloadAnalyticsCsv = (data: {
    summary: { totalRevenue: number; netRevenue: number; totalOrders: number; averageOrderValue: number; unitsSold: number; returnRequests: number; cancellationRate: number };
    timeline: { label: string; revenue: number; orders: number; units: number }[];
    topProducts: { name: string; unitsSold: number; totalRevenue: number; stock: number }[];
}) => {
    const rows = [
        ["Metric", "Value"],
        ["Gross revenue", data.summary.totalRevenue],
        ["Net revenue", data.summary.netRevenue],
        ["Completed orders", data.summary.totalOrders],
        ["Average order value", data.summary.averageOrderValue],
        ["Units sold", data.summary.unitsSold],
        ["Return requests", data.summary.returnRequests],
        ["Cancellation rate", `${data.summary.cancellationRate}%`],
        [],
        ["Timeline", "Revenue", "Orders", "Units"],
        ...data.timeline.map((point) => [point.label, point.revenue, point.orders, point.units]),
        [],
        ["Top products", "Units sold", "Revenue", "Current stock"],
        ...data.topProducts.map((product) => [product.name, product.unitsSold, product.totalRevenue, product.stock]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `shop-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
};

// MULTI-COLOR SEMANTIC PALETTE:
// Green = Productive / Delivered / Healthy
// Yellow/Amber = In-Progress / Warning / Pending
// Orange = order volume; emerald = healthy performance; amber/rose = attention states.
// Red = Out-of-Stock / Cancelled / Alerts
// Purple = Refunds / Special
const PIPELINE_CONFIG: Record<
    string,
    { label: string; badge: string; color: string; icon: typeof CheckCircle2 }
> = {
    PENDING: {
        label: "New Orders",
        badge: "bg-amber-50 text-amber-800 border-amber-200",
        color: "#f59e0b", // Yellow/Amber
        icon: Clock,
    },
    CONFIRMED: {
        label: "Confirmed",
        badge: "bg-orange-50 text-orange-700 border-orange-200",
        color: "#f97316",
        icon: CheckCircle2,
    },
    PROCESSING: {
        label: "Packing / Processing",
        badge: "bg-orange-50 text-orange-700 border-orange-200",
        color: "#f97316",
        icon: Package,
    },
    SHIPPED: {
        label: "In Transit / Shipped",
        badge: "bg-orange-50 text-orange-700 border-orange-200",
        color: "#fb923c",
        icon: Truck,
    },
    DELIVERED: {
        label: "Delivered",
        badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
        color: "#10b981", // Emerald Green
        icon: CheckCircle2,
    },
    CANCELLED: {
        label: "Cancelled",
        badge: "bg-rose-50 text-rose-700 border-rose-200",
        color: "#ef4444", // Red
        icon: XCircle,
    },
    REFUNDED: {
        label: "Refunded",
        badge: "bg-purple-50 text-purple-700 border-purple-200",
        color: "#a855f7", // Purple
        icon: RotateCcw,
    },
};

const LOCATION_BAR_COLORS = ["#10b981", "#f97316", "#f59e0b", "#fb923c"];

export function AnalyticsPage() {
    const { shopId = "" } = useParams<{ shopId: string }>();
    const [range, setRange] = useState<AnalyticsRange>("30d");

    const { data, isLoading, isError, isFetching, refetch } = useShopAnalytics(
        shopId,
        range
    );

    const rangeLabels: { id: AnalyticsRange; label: string }[] = [
        { id: "7d", label: "7 Days" },
        { id: "30d", label: "30 Days" },
        { id: "90d", label: "90 Days" },
        { id: "12m", label: "12 Months" },
    ];

    if (isLoading) {
        return (
            <div className="mx-auto w-full max-w-7xl space-y-6 animate-pulse">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="h-8 w-48 rounded-lg bg-slate-200" />
                        <div className="mt-2 h-4 w-72 rounded bg-slate-100" />
                    </div>
                    <div className="h-10 w-64 rounded-xl bg-slate-200" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="h-32 rounded-2xl border border-slate-100 bg-slate-50 p-5"
                        />
                    ))}
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="h-80 rounded-2xl border border-slate-100 bg-slate-50" />
                    <div className="h-80 rounded-2xl border border-slate-100 bg-slate-50" />
                </div>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="mx-auto w-full max-w-2xl rounded-3xl border border-rose-100 bg-rose-50/50 p-10 text-center">
                <AlertTriangle className="mx-auto size-9 text-rose-500" />
                <h2 className="mt-3 text-lg font-bold text-slate-900">
                    Failed to load analytics
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                    We encountered an error calculating your store performance.
                    Please check your connection and try again.
                </p>
                <Button
                    onClick={() => refetch()}
                    className="mt-6 rounded-full bg-slate-900 px-6 text-white hover:bg-slate-800"
                >
                    <RefreshCw className="mr-2 size-4" /> Try again
                </Button>
            </div>
        );
    }

    const {
        summary,
        timeline,
        orderPipeline,
        customerLocations,
        topProducts,
        inventoryHealth,
        recentOrders,
    } = data;

    // SEMI-CIRCLE GAUGE:
    // Green = Healthy Ready for Sale
    // Yellow/Amber = Low Stock Warning
    // Red = Out of Stock Critical
    const gaugeData = [
        {
            name: "Ready for Sale (In Stock)",
            value: Math.max(1, inventoryHealth.inStockCount),
            color: "#10b981", // Vibrant Emerald Green
        },
        {
            name: "Low Stock (≤10)",
            value: inventoryHealth.lowStockCount,
            color: "#f59e0b", // Vibrant Amber/Yellow
        },
        {
            name: "Out of Stock",
            value: inventoryHealth.outOfStockCount,
            color: "#ef4444", // Vibrant Red
        },
    ];
    const healthScore = Math.max(0, Math.min(100, Math.round(
        (summary.fulfillmentRate * 0.5) +
        ((100 - summary.returnRate) * 0.25) +
        ((100 - summary.cancellationRate) * 0.25)
    )));

    const performanceInsight =
        summary.revenueGrowth > 0
            ? "Revenue is moving in the right direction. Keep your best-selling products in stock and protect delivery speed."
            : summary.returnRate > 10
              ? "Returns are taking a meaningful share of sales. Review product descriptions, sizing, packaging, and quality checks."
              : summary.cancellationRate > 5
                ? "Cancellations are elevated. Check inventory accuracy and order confirmation speed."
                : "Your store is stable. Use the product and inventory sections below to find the next growth opportunity.";

    return (
        <div className="mx-auto w-full max-w-7xl space-y-7 pb-10 font-sans">
            {/* Header & Controls */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
                            Store performance
                        </h1>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Store Metrics
                        </span>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500">
                        See what is growing, what needs attention, and where to act next.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-xl bg-slate-100 p-1">
                        {rangeLabels.map((r) => (
                            <button
                                key={r.id}
                                onClick={() => setRange(r.id)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                    range === r.id
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        title="Refresh data"
                        className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
                    >
                        <RefreshCw
                            className={`size-4 ${isFetching ? "animate-spin text-emerald-600" : ""}`}
                        />
                    </button>
                    <button
                        onClick={() => downloadAnalyticsCsv(data)}
                        title="Export analytics"
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900"
                    >
                        <Download className="size-4" /> <span className="hidden sm:inline">Export CSV</span>
                    </button>
                </div>
            </div>

            {/* 1. VISUAL BUSINESS SNAPSHOT CARDS WITH EMBEDDED SPARKLINES & GAUGES */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* 1. EMERALD: Revenue & Trend Sparkline */}
                <div className="relative overflow-hidden rounded-3xl border border-emerald-100/80 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                            Period Revenue
                        </span>
                        <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                            <DollarSign className="size-4" />
                        </div>
                    </div>

                    <div className="mt-2.5 flex items-baseline justify-between gap-2">
                        <div>
                            <p className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                                {formatCurrency(summary.totalRevenue)}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5">
                                {summary.revenueGrowth >= 0 ? (
                                    <span className="inline-flex items-center font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] border border-emerald-200">
                                        <TrendingUp className="mr-1 size-3" />
                                        +{summary.revenueGrowth}%
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-[11px] border border-rose-200">
                                        <TrendingDown className="mr-1 size-3" />
                                        {summary.revenueGrowth}%
                                    </span>
                                )}
                                <span className="text-[10px] text-slate-400">vs prev</span>
                            </div>
                        </div>

                        {/* Visual Sparkline */}
                        <div className="h-11 w-24 shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={timeline} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                                    <defs>
                                        <linearGradient id="miniRevGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                                            <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#miniRevGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Net Retention:</span>
                        <span className="font-bold text-emerald-700">
                            {summary.totalRevenue > 0 ? Math.round((summary.netRevenue / summary.totalRevenue) * 100) : 100}%
                        </span>
                    </div>
                </div>

                {/* 2. ORANGE: Orders Volume & Mini Bar Sparkline */}
                <div className="relative overflow-hidden rounded-3xl border border-orange-100/80 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                            Completed Orders
                        </span>
                        <div className="flex size-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
                            <ShoppingBag className="size-4" />
                        </div>
                    </div>

                    <div className="mt-2.5 flex items-baseline justify-between gap-2">
                        <div>
                            <p className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                                {formatNumber(summary.totalOrders)}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5">
                                <span className="inline-flex items-center font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full text-[11px] border border-orange-200">
                                    <TrendingUp className="mr-1 size-3" />
                                    +{summary.ordersGrowth}%
                                </span>
                                <span className="text-[10px] text-slate-400">{summary.allPlacedOrdersCount} placed</span>
                            </div>
                        </div>

                        {/* Visual Sparkline */}
                        <div className="h-11 w-24 shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={timeline} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                                    <Bar dataKey="orders" fill="#f97316" radius={[2, 2, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Fulfillment:</span>
                        <span className="font-bold text-slate-800">
                            {summary.allPlacedOrdersCount > 0 ? Math.round((summary.totalOrders / summary.allPlacedOrdersCount) * 100) : 100}% cleared
                        </span>
                    </div>
                </div>

                {/* 3. AMBER: Average Order Value & Trend */}
                <div className="relative overflow-hidden rounded-3xl border border-amber-100/80 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                            Avg. Order Value
                        </span>
                        <div className="flex size-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                            <Sparkles className="size-4" />
                        </div>
                    </div>

                    <div className="mt-2.5 flex items-baseline justify-between gap-2">
                        <div>
                            <p className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                                {formatCurrency(summary.averageOrderValue)}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5">
                                <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full text-[11px] border border-amber-200">
                                    {summary.uniqueCustomers} buyers
                                </span>
                            </div>
                        </div>

                        {/* Visual Sparkline */}
                        <div className="h-11 w-24 shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={timeline} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                                    <defs>
                                        <linearGradient id="miniAovGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                                            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} fill="url(#miniAovGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Items Sold:</span>
                        <span className="font-bold text-slate-800">{formatNumber(summary.unitsSold)} units</span>
                    </div>
                </div>

                {/* 4. TEAL: Delivery Success & Radial Ring */}
                <div className="relative overflow-hidden rounded-3xl border border-teal-100/80 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                            Delivery Success
                        </span>
                        <div className="flex size-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
                            <ShieldCheck className="size-4" />
                        </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-2">
                        <div>
                            <div className="flex items-baseline gap-1.5">
                                <p className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                                    {summary.fulfillmentRate}%
                                </p>
                            </div>
                            <div className="mt-1 flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                                    Excellent SLA
                                </span>
                            </div>
                        </div>

                        {/* Circular SVG Progress Ring */}
                        <div className="relative size-12 shrink-0 flex items-center justify-center">
                            <svg className="size-12 -rotate-90" viewBox="0 0 48 48">
                                <circle cx="24" cy="24" r="19" stroke="#f1f5f9" strokeWidth="4" fill="none" />
                                <circle
                                    cx="24"
                                    cy="24"
                                    r="19"
                                    stroke="#0d9488"
                                    strokeWidth="4"
                                    fill="none"
                                    strokeDasharray="119.38"
                                    strokeDashoffset={119.38 - (119.38 * Math.min(summary.fulfillmentRate, 100)) / 100}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <Check className="absolute size-4 text-teal-600 font-bold" />
                        </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Return Claims:</span>
                        <span className="font-bold text-slate-800">{summary.returnRequests} claims</span>
                    </div>
                </div>
            </div>

            {/* Visual Store Operations & Health Matrix */}
            <section className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* LEFT: Health Score Radial & AI Recommendation */}
                    <div className="lg:col-span-4 flex items-center gap-4 border-b lg:border-b-0 lg:border-r border-slate-100 pb-5 lg:pb-0 lg:pr-6">
                        {/* Radial Ring */}
                        <div className="relative size-20 shrink-0 flex items-center justify-center">
                            <svg className="size-20 -rotate-90" viewBox="0 0 64 64">
                                <circle cx="32" cy="32" r="26" stroke="#f1f5f9" strokeWidth="5" fill="none" />
                                <circle
                                    cx="32"
                                    cy="32"
                                    r="26"
                                    stroke="#10b981"
                                    strokeWidth="5"
                                    fill="none"
                                    strokeDasharray="163.36"
                                    strokeDashoffset={163.36 - (163.36 * healthScore) / 100}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-sm font-black text-slate-900">{healthScore}%</span>
                                <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-700">Health</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-emerald-500" />
                                <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Performance Pulse</p>
                            </div>
                            <p className="text-xs font-bold text-slate-800 leading-snug">{performanceInsight}</p>
                        </div>
                    </div>

                    {/* RIGHT: 4 Visual Metric Cards with Progress Meters & Badges */}
                    <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {/* 1. Net Revenue */}
                        <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net Revenue</span>
                                <span className="size-2 rounded-full bg-emerald-500" />
                            </div>
                            <p className="text-base font-black text-slate-900">{formatCurrency(summary.netRevenue)}</p>
                            <div className="space-y-1">
                                <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                        style={{ width: `${Math.min(100, summary.totalRevenue > 0 ? (summary.netRevenue / summary.totalRevenue) * 100 : 100)}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium">
                                    {summary.totalRevenue > 0 ? Math.round((summary.netRevenue / summary.totalRevenue) * 100) : 100}% retained
                                </p>
                            </div>
                        </div>

                        {/* 2. Returning Buyers */}
                        <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Returning Buyers</span>
                                <span className="size-2 rounded-full bg-orange-500" />
                            </div>
                            <p className="text-base font-black text-slate-900">{summary.repeatCustomerRate}%</p>
                            <div className="space-y-1">
                                <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-orange-500 transition-all duration-500"
                                        style={{ width: `${Math.min(100, Math.max(8, summary.repeatCustomerRate))}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium">High loyalty</p>
                            </div>
                        </div>

                        {/* 3. Returns */}
                        <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Return Rate</span>
                                <span className="size-2 rounded-full bg-amber-500" />
                            </div>
                            <p className="text-base font-black text-slate-900">{summary.returnRate}%</p>
                            <div className="space-y-1">
                                <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-amber-500 transition-all duration-500"
                                        style={{ width: `${Math.min(100, Math.max(6, summary.returnRate))}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium">Within safe SLA</p>
                            </div>
                        </div>

                        {/* 4. Cancellations */}
                        <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cancellations</span>
                                <span className="size-2 rounded-full bg-rose-500" />
                            </div>
                            <p className="text-base font-black text-slate-900">{summary.cancellationRate}%</p>
                            <div className="space-y-1">
                                <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-rose-500 transition-all duration-500"
                                        style={{ width: `${Math.min(100, Math.max(6, summary.cancellationRate))}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium">Low risk level</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. DUAL SIDE-BY-SIDE GRAPHS */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Graph 1: Revenue Statistics (Spline Area Wave Chart in Emerald Green for productivity & earnings) */}
                <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="size-2.5 rounded-full bg-emerald-500" />
                                <h2 className="text-base font-bold text-slate-900">
                                    Revenue trend
                                </h2>
                            </div>
                            <p className="text-xs text-slate-400">
                                Revenue earned each day compared with the previous period.
                            </p>
                        </div>

                        {/* Chart Legend */}
                        <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                                <span className="size-2.5 rounded-full bg-emerald-500" /> Current
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-slate-400">
                                <span className="size-2 rounded-full border border-slate-300 border-dashed" /> Previous
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 w-full" style={{ height: 300, minHeight: 300 }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart
                                data={timeline}
                                margin={{ top: 15, right: 10, left: -15, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient
                                        id="revGreenGrad"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#10b981"
                                            stopOpacity={0.3}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#10b981"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#f1f5f9"
                                />
                                <XAxis
                                    dataKey="label"
                                    stroke="#94a3b8"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => `$${v}`}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const pt = payload[0].payload;
                                            return (
                                                <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-xl">
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                                        {pt.label}
                                                    </p>
                                                    <p className="mt-1 text-base font-black text-emerald-600">
                                                        {formatCurrency(pt.revenue)}
                                                    </p>
                                                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                                                        <span>{pt.orders} orders</span>
                                                        <span>•</span>
                                                        <span>{pt.units} items</span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                {/* Previous period comparative line */}
                                <Area
                                    type="monotone"
                                    dataKey="prevRevenue"
                                    stroke="#cbd5e1"
                                    strokeWidth={2}
                                    strokeDasharray="4 4"
                                    fill="transparent"
                                />
                                {/* Current period solid wave in vibrant emerald */}
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#revGreenGrad)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Graph 2: Orders and units sold */}
                <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="size-2.5 rounded-full bg-orange-500" />
                                <h2 className="text-base font-bold text-slate-900">
                                    Orders vs items sold
                                </h2>
                            </div>
                            <p className="text-xs text-slate-400">
                                Understand order demand and how many products each order contains.
                            </p>
                        </div>

                        {/* Chart Legend */}
                        <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                            <span className="inline-flex items-center gap-1.5 font-semibold text-orange-700">
                                <span className="size-2.5 rounded-full bg-orange-500" /> Orders
                            </span>
                            <span className="inline-flex items-center gap-1.5 font-semibold text-amber-600">
                                <span className="size-2.5 rounded-full bg-amber-400" /> Products Sold
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 w-full" style={{ height: 300, minHeight: 300 }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={timeline}
                                margin={{ top: 15, right: 10, left: -15, bottom: 0 }}
                                barGap={4}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#f1f5f9"
                                />
                                <XAxis
                                    dataKey="label"
                                    stroke="#94a3b8"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const pt = payload[0].payload;
                                            return (
                                                <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-xl">
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                                        {pt.label}
                                                    </p>
                                                    <div className="mt-1.5 space-y-1 text-xs">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="flex items-center gap-1.5 font-medium text-slate-600">
                                                                <span className="size-2 rounded-full bg-orange-500" /> Orders:
                                                            </span>
                                                            <span className="font-bold text-slate-900">{pt.orders}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="flex items-center gap-1.5 font-medium text-slate-600">
                                                                <span className="size-2 rounded-full bg-amber-400" /> Items Sold:
                                                            </span>
                                                            <span className="font-bold text-slate-900">{pt.units}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar
                                    dataKey="orders"
                                    name="Orders"
                                    fill="#2563eb"
                                    radius={[4, 4, 0, 0]}
                                    barSize={12}
                                />
                                <Bar
                                    dataKey="units"
                                    name="Products Sold"
                                    fill="#f59e0b"
                                    radius={[4, 4, 0, 0]}
                                    barSize={12}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 3. MIDDLE SECTION: 3 RICH CARDS (Green/Yellow/Red Gauge, Pipeline, Multi-Color Locations) */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Column 1: Product Information Semi-Circle Gauge (Green = Healthy, Yellow = Low, Red = Out of stock) */}
                <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                    <div>
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-slate-900">
                                Product Information
                            </h2>
                            <Link
                                to={`/dashboard/shop/${shopId}/products`}
                                className="text-xs font-semibold text-slate-400 hover:text-slate-900 flex items-center"
                            >
                                View <ChevronRight className="size-3.5" />
                            </Link>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Real-time catalog distribution and readiness
                        </p>
                    </div>

                    {/* Semi-Circle / Arch Donut Chart: Green + Yellow + Red */}
                    <div className="relative my-4 flex flex-col items-center justify-center">
                        <div style={{ width: 230, height: 130 }}>
                            <ResponsiveContainer width="100%" height={130}>
                                <PieChart>
                                    <Pie
                                        data={gaugeData}
                                        cx="50%"
                                        cy="100%"
                                        startAngle={180}
                                        endAngle={0}
                                        innerRadius={70}
                                        outerRadius={95}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {gaugeData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                                stroke="transparent"
                                            />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Central In-Stock Health % */}
                        <div className="text-center mt-2">
                            <p className="text-2xl font-black text-slate-900">
                                {inventoryHealth.healthScore}%
                            </p>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block border border-emerald-200">
                                Healthy Stock Score
                            </p>
                        </div>
                    </div>

                    {/* Gauge Legend: Green (Ready), Yellow (Low), Red (Out) */}
                    <div className="space-y-2 border-t border-slate-50 pt-3">
                        <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-2 text-slate-700 font-medium">
                                <span className="size-2.5 rounded-full bg-emerald-500" /> Ready for Sale (In Stock)
                            </span>
                            <span className="font-bold text-emerald-700">
                                {inventoryHealth.inStockCount}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-2 text-slate-700 font-medium">
                                <span className="size-2.5 rounded-full bg-amber-500" /> Low Stock (≤10)
                            </span>
                            <span className="font-bold text-amber-700">
                                {inventoryHealth.lowStockCount}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-2 text-slate-700 font-medium">
                                <span className="size-2.5 rounded-full bg-rose-500" /> Out of Stock
                            </span>
                            <span className="font-bold text-rose-700">
                                {inventoryHealth.outOfStockCount}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Column 2: Fulfillment pipeline by stage */}
                <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                    <div>
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-slate-900">
                                Fulfillment pipeline
                            </h2>
                            <span className="text-xs font-semibold text-slate-400">
                                Live Stages
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            See where orders are waiting and what needs action next.
                        </p>
                    </div>

                    <div className="my-3 space-y-3">
                        {orderPipeline.map((step) => {
                            const config = PIPELINE_CONFIG[step.stage] || {
                                label: step.stage,
                                color: "#10b981",
                                badge: "bg-slate-50 text-slate-700",
                                icon: Package,
                            };
                            const Icon = config.icon;

                            return (
                                <div
                                    key={step.stage}
                                    className="flex items-center justify-between rounded-xl border border-slate-50 bg-slate-50/50 p-2.5 transition hover:bg-slate-50"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className="flex size-7 items-center justify-center rounded-lg text-white shadow-sm"
                                            style={{ backgroundColor: config.color }}
                                        >
                                            <Icon className="size-3.5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">
                                                {config.label}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                {step.productsCount} items in stage
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-xs font-extrabold text-slate-900">
                                            {step.count} orders
                                        </p>
                                        <p className="text-[10px] font-medium text-slate-500">
                                            {formatCurrency(step.totalAmount)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <Link
                        to={`/dashboard/shop/${shopId}/orders`}
                        className="text-center text-xs font-bold text-orange-600 hover:text-orange-700 block border-t border-slate-50 pt-3"
                    >
                        Manage Store Orders →
                    </Link>
                </div>

                {/* Column 3: Customer locations */}
                <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                    <div>
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-slate-900">
                                Buyer footprint
                            </h2>
                            <Globe className="size-4 text-slate-400" />
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Where your customers are ordering from.
                        </p>
                    </div>

                    <div className="my-4 space-y-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900">
                                {formatNumber(summary.uniqueCustomers)}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                                total unique buyers
                            </span>
                        </div>

                        <div className="space-y-3">
                            {customerLocations.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-xs text-slate-400">
                                    Shipping location data will appear after your first addressed order.
                                </div>
                            ) : customerLocations.map((loc, idx) => {
                                const barColor =
                                    LOCATION_BAR_COLORS[idx % LOCATION_BAR_COLORS.length];

                                return (
                                    <div key={loc.location} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs font-medium">
                                            <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                                                <MapPin
                                                    className="size-3.5"
                                                    style={{ color: barColor }}
                                                />
                                                {loc.location}
                                            </span>
                                            <span className="text-slate-500 font-bold">
                                                {loc.count} orders ({loc.percentage}%)
                                            </span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    backgroundColor: barColor,
                                                    width: `${Math.max(8, loc.percentage)}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <p className="text-[11px] text-slate-400 border-t border-slate-50 pt-3 text-center">
                        Calculated from confirmed buyer shipping addresses
                    </p>
                </div>
            </div>

            {/* 4. BOTTOM SECTION: BEST SELLERS & TRAFFIC-LIGHT OUT OF STOCK INDEX */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Left: Best Sellers / Top Products */}
                <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">
                                Product leaders
                            </h2>
                            <p className="text-xs text-slate-400">
                                Products driving revenue and units sold.
                            </p>
                        </div>
                        <Link
                            to={`/dashboard/shop/${shopId}/products`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                            Catalog <ArrowUpRight className="size-3.5" />
                        </Link>
                    </div>

                    <div className="mt-5 space-y-3 flex-1">
                        {topProducts.length > 0 ? (
                            topProducts.map((p, idx) => (
                                <div
                                    key={p.id}
                                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition hover:bg-slate-50"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span
                                            className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                                idx === 0
                                                    ? "bg-amber-400 text-amber-950 shadow-sm"
                                                    : idx === 1
                                                    ? "bg-slate-300 text-slate-800"
                                                    : idx === 2
                                                    ? "bg-amber-700 text-white"
                                                    : "bg-slate-200 text-slate-700"
                                            }`}
                                        >
                                            #{idx + 1}
                                        </span>
                                        <div className="size-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                                            {p.image ? (
                                                <img
                                                    src={p.image}
                                                    alt={p.name}
                                                    className="size-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex size-full items-center justify-center text-slate-300">
                                                    <Package className="size-4" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-bold text-slate-900">
                                                {p.name}
                                            </p>
                                            <p className="text-[11px] text-slate-400">
                                                {formatCurrency(p.price)} unit price
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0 pl-3">
                                        <p className="text-xs font-black text-slate-900">
                                            {formatCurrency(p.totalRevenue)}
                                        </p>
                                        <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                            {p.unitsSold} pcs sold
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex h-48 flex-col items-center justify-center text-center">
                                <Package className="size-8 text-slate-300" />
                                <p className="mt-2 text-xs font-semibold text-slate-700">
                                    No products sold yet in this period
                                </p>
                                <p className="text-[11px] text-slate-400">
                                    Top performers rank automatically when orders are paid.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Out of Stock Index (Traffic-light conditions: Green for safe, Yellow for low, Red for out) */}
                <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="size-4 text-amber-500" />
                                <h2 className="text-base font-bold text-slate-900">
                                    Out of Stock Index
                                </h2>
                            </div>
                            <p className="text-xs text-slate-400">
                                Traffic-light condition meters: Red = Out, Yellow = Low, Green = Safe
                            </p>
                        </div>
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
                            {inventoryHealth.lowStockCount} at risk
                        </span>
                    </div>

                    <div className="mt-5 space-y-3.5 flex-1">
                        {inventoryHealth.criticalItems.length > 0 ? (
                            inventoryHealth.criticalItems.map((item) => {
                                const ratio = Math.min(
                                    100,
                                    Math.round((item.stock / item.maxCapacity) * 100)
                                );
                                const isOut = item.stock <= 0;
                                const isCritical = item.stock <= 5;

                                return (
                                    <div
                                        key={item.id}
                                        className={`rounded-xl border p-3 transition ${
                                            isOut
                                                ? "border-rose-200 bg-rose-50/40"
                                                : isCritical
                                                ? "border-amber-200 bg-amber-50/40"
                                                : "border-slate-100 bg-slate-50/50"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="size-9 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                                                    {item.image ? (
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className="size-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex size-full items-center justify-center text-slate-300">
                                                            <Package className="size-4" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-xs font-bold text-slate-900">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        SKU: {item.sku || "N/A"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <span
                                                        className={`inline-flex items-center gap-1 text-xs font-extrabold ${
                                                            isOut
                                                                ? "text-rose-600"
                                                                : isCritical
                                                                ? "text-amber-600"
                                                                : "text-emerald-600"
                                                        }`}
                                                    >
                                                        {isOut ? (
                                                            <AlertOctagon className="size-3" />
                                                        ) : (
                                                            <AlertTriangle className="size-3" />
                                                        )}
                                                        {isOut ? "0 in stock" : `${item.stock} left`}
                                                    </span>
                                                    <p className="text-[10px] text-slate-400">
                                                        of {item.maxCapacity} cap
                                                    </p>
                                                </div>

                                                <Link
                                                    to={`/dashboard/shop/${shopId}/products/${item.id}`}
                                                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:text-emerald-700 shadow-sm"
                                                >
                                                    Restock
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Traffic-light bar: Red when depleted, Amber when low, Green when healthy */}
                                        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    isOut
                                                        ? "bg-rose-500"
                                                        : isCritical
                                                        ? "bg-amber-400"
                                                        : "bg-emerald-500"
                                                }`}
                                                style={{ width: `${Math.max(5, ratio)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex h-48 flex-col items-center justify-center text-center">
                                <CheckCircle2 className="size-8 text-emerald-500" />
                                <p className="mt-2 text-xs font-semibold text-slate-700">
                                    All inventory levels healthy
                                </p>
                                <p className="text-[11px] text-slate-400">
                                    No products are running low or out of stock.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 5. RECENT TRANSACTIONS TABLE (Color-coded Status Pills) */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">
                            Recent Transactions
                        </h2>
                        <p className="text-xs text-slate-400">
                            Real-time order logs and payment settlements
                        </p>
                    </div>
                    <Link
                        to={`/dashboard/shop/${shopId}/orders`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
                    >
                        View All Orders <ArrowUpRight className="size-3.5" />
                    </Link>
                </div>

                <div className="mt-5 overflow-x-auto">
                    {recentOrders.length > 0 ? (
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400">
                                    <th className="pb-3 font-semibold">Transaction ID</th>
                                    <th className="pb-3 font-semibold">Customer</th>
                                    <th className="pb-3 font-semibold">Location</th>
                                    <th className="pb-3 font-semibold">Quantity</th>
                                    <th className="pb-3 font-semibold">Net Amount</th>
                                    <th className="pb-3 font-semibold">Status</th>
                                    <th className="pb-3 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recentOrders.map((ord) => {
                                    const config = PIPELINE_CONFIG[ord.status] || {
                                        label: ord.status,
                                        badge: "bg-slate-50 text-slate-700 border-slate-200",
                                    };

                                    return (
                                        <tr key={ord.id} className="hover:bg-slate-50/60 transition">
                                            <td className="py-3 font-mono font-bold text-orange-600">
                                                #{ord.id.slice(-8).toUpperCase()}
                                            </td>
                                            <td className="py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex size-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                                                        {ord.customerName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">
                                                            {ord.customerName}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400">
                                                            {ord.customerEmail}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 text-slate-600">
                                                {ord.location}
                                            </td>
                                            <td className="py-3 text-slate-600">
                                                {ord.itemsCount} pcs
                                            </td>
                                            <td className="py-3 font-extrabold text-slate-900">
                                                {formatCurrency(ord.totalAmount)}
                                            </td>
                                            <td className="py-3">
                                                <span
                                                    className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${config.badge}`}
                                                >
                                                    {config.label}
                                                </span>
                                            </td>
                                            <td className="py-3 text-right">
                                                <Link
                                                    to={`/dashboard/shop/${shopId}/orders/${ord.id}`}
                                                    className="inline-flex items-center gap-1 font-semibold text-orange-600 hover:text-orange-700"
                                                >
                                                    View <ArrowUpRight className="size-3" />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-10 text-center text-xs text-slate-400">
                            No transactions recorded yet during this period.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
