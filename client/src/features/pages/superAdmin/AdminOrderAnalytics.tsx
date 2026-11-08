import React, { useState } from "react";
import {
    Loader2,
    ShoppingCart,
    Clock,
    Package,
    Truck,
    CheckCircle2,
    XCircle,
    RotateCcw,
    TrendingUp,
    Globe,
    Store,
    RefreshCw,
    MapPin,
} from "lucide-react";
import {
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { useAdminOrderAnalytics } from "@/features/admin/admin.hooks";
import type { AdminOrderAnalyticsFilters, AdminOrderAnalyticsResponse } from "@/features/admin/admin.api";

const STATUS_COLORS: Record<string, string> = {
    PENDING: "#f59e0b",
    CONFIRMED: "#3b82f6",
    PROCESSING: "#f97316",
    SHIPPED: "#8b5cf6",
    DELIVERED: "#10b981",
    CANCELLED: "#ef4444",
    REFUNDED: "#64748b",
    EXPIRED: "#94a3b8",
    REFUND_PENDING: "#fbbf24",
    RETURN_REQUESTED: "#eab308",
    RETURNED: "#78716c",
};

const formatCurrency = (val: number | string | undefined | null) => {
    const num = typeof val === "string" ? parseFloat(val) : (val ?? 0);
    if (isNaN(num)) return "$0.00";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

const formatCompactNumber = (val: number) => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
    return val.toLocaleString();
};

interface AdminOrderAnalyticsProps {
    shopId?: string;
    parentDateFrom?: string;
    parentDateTo?: string;
}

const PERFORMANCE_COLORS = {
    aov: "#f97316",
    revenue: "#0ea5e9",
    fulfillment: "#10b981",
    shipped: "#8b5cf6",
    cancellation: "#ef4444",
};

function buildTimeline(points: AdminOrderAnalyticsResponse["ordersOverTime"], range: string) {
    const pointMap = new Map(points.map((point) => [point.date, point]));
    const bucketCount = range === "7d" ? 7 : range === "30d" ? 30 : 12;
    const monthly = range === "12m" || range === "all";
    const dates = Array.from({ length: bucketCount }, (_, index) => {
        const date = new Date();
        date.setDate(1);
        if (monthly) date.setMonth(date.getMonth() - (bucketCount - index - 1));
        else date.setDate(date.getDate() - (bucketCount - index - 1));
        return date;
    });

    return dates.map((date) => {
        const key = monthly
            ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
            : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const existing = pointMap.get(key);
        return existing || {
            date: key,
            label: monthly
                ? date.toLocaleString("en-US", { month: "short", year: "2-digit" })
                : date.toLocaleString("en-US", { month: "short", day: "numeric" }),
            orders: 0,
            revenue: 0,
            netRevenue: 0,
            delivered: 0,
            shippedDelivered: 0,
            cancelled: 0,
        };
    });
}

function OrderPerformanceChart({ analytics, range }: { analytics: AdminOrderAnalyticsResponse; range: string }) {
    const rawPoints = buildTimeline(analytics.ordersOverTime, range);
    const derivedPoints = rawPoints.map((point) => ({
        ...point,
        aov: point.orders ? point.revenue / point.orders : 0,
        fulfillment: point.orders ? (point.delivered / point.orders) * 100 : 0,
        shipped: point.shippedDelivered,
        cancellation: point.orders ? (point.cancelled / point.orders) * 100 : 0,
    }));
    const max = (key: "aov" | "revenue" | "fulfillment" | "shipped" | "cancellation") =>
        Math.max(...derivedPoints.map((point) => point[key] || 0), 1);
    const maxima = {
        aov: max("aov"),
        revenue: max("revenue"),
        fulfillment: max("fulfillment"),
        shipped: max("shipped"),
        cancellation: max("cancellation"),
    };
    const points = derivedPoints.map((point) => ({
        ...point,
        aovIndex: (point.aov / maxima.aov) * 100,
        revenueIndex: (point.netRevenue / maxima.revenue) * 100,
        fulfillmentIndex: (point.fulfillment / maxima.fulfillment) * 100,
        shippedIndex: (point.shipped / maxima.shipped) * 100,
        cancellationIndex: (point.cancellation / maxima.cancellation) * 100,
    }));
    const latest = [...points].reverse().find((point) => point.orders > 0) || points[points.length - 1];
    const rangeLabel = range === "all" ? "All time" : range === "12m" ? "Last 12 months" : `Last ${range.replace("d", " days")}`;
    const metrics = latest ? [
        { label: "Avg Order Value", value: formatCurrency(latest.aov), color: PERFORMANCE_COLORS.aov, key: "aovIndex" },
        { label: "Net Settlement", value: formatCurrency(latest.netRevenue), color: PERFORMANCE_COLORS.revenue, key: "revenueIndex" },
        { label: "Fulfillment Rate", value: `${latest.fulfillment.toFixed(1)}%`, color: PERFORMANCE_COLORS.fulfillment, key: "fulfillmentIndex" },
        { label: "Units Dispatched", value: `${latest.shipped.toLocaleString()} units`, color: PERFORMANCE_COLORS.shipped, key: "shippedIndex" },
        { label: "Cancellation Rate", value: `${latest.cancellation.toFixed(1)}%`, color: PERFORMANCE_COLORS.cancellation, key: "cancellationIndex" },
    ] as const : [];

    return (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
                <div>
                    <h3 className="text-xs font-semibold text-slate-900">Performance Trends</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        Core settlement, order values, delivery completion, and cancellation indicators.
                    </p>
                </div>
                <span className="text-[11px] font-medium text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-md self-start sm:self-auto">
                    {rangeLabel}
                </span>
            </div>

            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {metrics.map((metric) => (
                    <div key={metric.label} className="p-3 rounded-md border border-slate-200/80 bg-white">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                            <span className="size-1.5 rounded-full" style={{ backgroundColor: metric.color }} />
                            <span>{metric.label}</span>
                        </div>
                        <p className="mt-1 text-sm font-bold text-slate-900 tabular-nums">{metric.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Order Lifecycle Pipeline Component ───────────────────────────
interface OrderLifecyclePipelineProps {
    dateFrom?: string;
    dateTo?: string;
    activeStatus?: string;
    onSelectStatus?: (status: string) => void;
}

export const OrderLifecyclePipeline: React.FC<OrderLifecyclePipelineProps> = ({
    dateFrom,
    dateTo,
    activeStatus,
    onSelectStatus,
}) => {
    const { data: analytics, isLoading } = useAdminOrderAnalytics({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
    });

    const pending = analytics?.pendingOrders ?? 0;
    const processing = analytics?.processingOrders ?? 0;
    const shipped = analytics?.shippedOrders ?? 0;
    const delivered = analytics?.deliveredOrders ?? 0;
    const cancelled = analytics?.cancelledOrders ?? 0;
    const returned = analytics?.returnedOrders ?? 0;

    const cards = [
        {
            key: "PENDING",
            label: "Pending",
            count: pending,
            desc: "Awaiting settlement",
            icon: Clock,
            dot: "bg-amber-500",
            activeClass: "bg-amber-50/40 border-amber-500 ring-1 ring-amber-500 shadow-2xs",
            hoverBorder: "hover:border-amber-300",
            iconColor: "text-amber-600",
        },
        {
            key: "PROCESSING",
            label: "Processing",
            count: processing,
            desc: "Fulfillment in progress",
            icon: Package,
            dot: "bg-orange-500",
            activeClass: "bg-orange-50/40 border-orange-500 ring-1 ring-orange-500 shadow-2xs",
            hoverBorder: "hover:border-orange-300",
            iconColor: "text-orange-600",
        },
        {
            key: "SHIPPED",
            label: "Shipped",
            count: shipped,
            desc: "In transit to buyer",
            icon: Truck,
            dot: "bg-violet-500",
            activeClass: "bg-violet-50/40 border-violet-500 ring-1 ring-violet-500 shadow-2xs",
            hoverBorder: "hover:border-violet-300",
            iconColor: "text-violet-600",
        },
        {
            key: "DELIVERED",
            label: "Delivered",
            count: delivered,
            desc: "Completed delivery",
            icon: CheckCircle2,
            dot: "bg-emerald-500",
            activeClass: "bg-emerald-50/40 border-emerald-500 ring-1 ring-emerald-500 shadow-2xs",
            hoverBorder: "hover:border-emerald-300",
            iconColor: "text-emerald-600",
        },
        {
            key: "CANCELLED",
            label: "Cancelled",
            count: cancelled,
            desc: "Aborted orders",
            icon: XCircle,
            dot: "bg-rose-500",
            activeClass: "bg-rose-50/40 border-rose-500 ring-1 ring-rose-500 shadow-2xs",
            hoverBorder: "hover:border-rose-300",
            iconColor: "text-rose-600",
        },
        {
            key: "REFUNDED",
            label: "Returned / Disputes",
            count: returned,
            desc: "Settled returns",
            icon: RotateCcw,
            dot: "bg-slate-400",
            activeClass: "bg-slate-100 border-slate-700 ring-1 ring-slate-700 shadow-2xs",
            hoverBorder: "hover:border-slate-300",
            iconColor: "text-slate-600",
        },
    ];

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Order Lifecycle Pipeline
                </span>
                {activeStatus && (
                    <button
                        onClick={() => onSelectStatus?.("")}
                        className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                        Clear status filter
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {cards.map((c) => {
                    const isSelected = activeStatus === c.key;
                    const Icon = c.icon;
                    return (
                        <button
                            key={c.key}
                            onClick={() => onSelectStatus?.(c.key)}
                            className={`text-left p-3 rounded-lg border transition-all cursor-pointer ${
                                isSelected
                                    ? c.activeClass
                                    : `bg-white border-slate-200 ${c.hoverBorder} hover:bg-slate-50/50`
                            }`}
                        >
                            <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                                <span className="flex items-center gap-1.5">
                                    <span className={`size-1.5 rounded-full ${c.dot}`} />
                                    {c.label}
                                </span>
                                <Icon size={13} className={isSelected ? c.iconColor : "text-slate-400"} />
                            </div>
                            <div className="mt-1.5 text-lg font-bold tracking-tight text-slate-900 tabular-nums">
                                {isLoading ? (
                                    <span className="inline-block size-4 animate-pulse rounded bg-slate-200" />
                                ) : (
                                    c.count.toLocaleString()
                                )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{c.desc}</p>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ─── Main Admin Order Analytics Section ───────────────────────────
// Permanently displayed (not collapsible) with clean fintech visual hierarchy
export const AdminOrderAnalyticsSection: React.FC<AdminOrderAnalyticsProps> = ({
    shopId,
    parentDateFrom,
    parentDateTo,
}) => {
    const [range, setRange] = useState<"7d" | "30d" | "90d" | "12m" | "all">("30d");
    const [chartMode, setChartMode] = useState<"both" | "orders" | "revenue">("both");

    const filters: AdminOrderAnalyticsFilters = {
        shopId: shopId || undefined,
        dateFrom: parentDateFrom || undefined,
        dateTo: parentDateTo || undefined,
        range: parentDateFrom || parentDateTo ? undefined : range,
    };

    const { data: analytics, isLoading, isError, refetch, isFetching } = useAdminOrderAnalytics(filters);

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-8 flex flex-col items-center justify-center min-h-[200px] gap-2 text-slate-400">
                <Loader2 className="size-6 animate-spin text-slate-500" />
                <p className="text-xs font-medium">Aggregating order analytics…</p>
            </div>
        );
    }

    if (isError || !analytics) {
        return (
            <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-5 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-slate-900 text-xs">Unable to load order analytics</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Please check network connectivity or refresh.</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
                >
                    <RefreshCw size={12} />
                    <span>Retry</span>
                </button>
            </div>
        );
    }

    return (
        <section className="space-y-4">
            {/* Header & Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold text-slate-900">
                            Order Analytics
                        </h2>
                        {isFetching && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                                <RefreshCw size={11} className="animate-spin text-orange-500" />
                                Updating…
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Volume trends, gross merchandise value, fulfillment efficiency, and regional distribution.
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Timeframe Presets */}
                    {!parentDateFrom && !parentDateTo && (
                        <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-md text-xs font-medium text-slate-600 border border-slate-200/60">
                            {(
                                [
                                    { id: "7d", label: "7D" },
                                    { id: "30d", label: "30D" },
                                    { id: "90d", label: "90D" },
                                    { id: "12m", label: "12M" },
                                    { id: "all", label: "All" },
                                ] as const
                            ).map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setRange(tab.id)}
                                    className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                                        range === tab.id
                                            ? "bg-white text-slate-900 shadow-2xs font-semibold"
                                            : "hover:text-slate-900 text-slate-600"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Performance Trends Strip */}
            <OrderPerformanceChart analytics={analytics} range={range} />

            {/* ─── Orders Over Time & Status Distribution ──────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Timeline Area/Line Chart (2 cols) */}
                <div className="lg:col-span-2 rounded-lg border border-slate-200 p-4 bg-white shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                        <div>
                            <h3 className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                                <TrendingUp className="size-3.5 text-slate-600" />
                                Orders & Revenue Trajectory
                            </h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                Transaction count and gross merchandise settlement
                            </p>
                        </div>

                        {/* Chart Mode Selector */}
                        <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-md text-xs font-medium text-slate-600">
                            <button
                                onClick={() => setChartMode("both")}
                                className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                                    chartMode === "both" ? "bg-white text-slate-900 shadow-2xs font-semibold" : "text-slate-600"
                                }`}
                            >
                                Both
                            </button>
                            <button
                                onClick={() => setChartMode("orders")}
                                className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                                    chartMode === "orders" ? "bg-white text-slate-900 shadow-2xs font-semibold" : "text-slate-600"
                                }`}
                            >
                                Orders
                            </button>
                            <button
                                onClick={() => setChartMode("revenue")}
                                className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                                    chartMode === "revenue" ? "bg-white text-slate-900 shadow-2xs font-semibold" : "text-slate-600"
                                }`}
                            >
                                Revenue
                            </button>
                        </div>
                    </div>

                    {analytics.ordersOverTime.length > 0 ? (
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={analytics.ordersOverTime}
                                    margin={{ top: 12, right: 12, left: -12, bottom: 4 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis
                                        dataKey="label"
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                                    />
                                    <YAxis
                                        yAxisId="orders"
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                                        tickFormatter={formatCompactNumber}
                                        hide={chartMode === "revenue"}
                                    />
                                    <YAxis
                                        yAxisId="revenue"
                                        orientation="right"
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                                        tickFormatter={(v) => `$${formatCompactNumber(v)}`}
                                        hide={chartMode === "orders"}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: 8,
                                            border: "1px solid #e2e8f0",
                                            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                            fontSize: 12,
                                        }}
                                        formatter={(value: any, name: any) => {
                                            if (name === "Revenue" || name === "revenue") {
                                                return [formatCurrency(Number(value)), "Revenue"];
                                            }
                                            return [Number(value).toLocaleString(), "Orders"];
                                        }}
                                        labelStyle={{ fontWeight: 600, color: "#0f172a", marginBottom: 2 }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={24}
                                        iconType="circle"
                                        wrapperStyle={{ fontSize: 11, paddingTop: 8, color: "#64748b" }}
                                    />
                                    {(chartMode === "both" || chartMode === "orders") && (
                                        <Line
                                            yAxisId="orders"
                                            type="monotone"
                                            dataKey="orders"
                                            name="Orders"
                                            stroke="#f97316"
                                            strokeWidth={2}
                                            dot={{ r: 3, fill: "#fff", stroke: "#f97316", strokeWidth: 1.5 }}
                                            activeDot={{ r: 5, fill: "#f97316", stroke: "#fff", strokeWidth: 2 }}
                                        />
                                    )}
                                    {(chartMode === "both" || chartMode === "revenue") && (
                                        <Line
                                            yAxisId="revenue"
                                            type="monotone"
                                            dataKey="revenue"
                                            name="Revenue"
                                            stroke="#0ea5e9"
                                            strokeWidth={2}
                                            dot={{ r: 3, fill: "#fff", stroke: "#0ea5e9", strokeWidth: 1.5 }}
                                            activeDot={{ r: 5, fill: "#0ea5e9", stroke: "#fff", strokeWidth: 2 }}
                                        />
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-56 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-md">
                            <ShoppingCart size={20} className="mb-1.5 opacity-40" />
                            <p className="text-xs font-medium">No order data recorded in this period</p>
                        </div>
                    )}
                </div>

                {/* Status Breakdown Donut (1 col) */}
                <div className="rounded-lg border border-slate-200 p-4 bg-white shadow-2xs flex flex-col justify-between">
                    <div>
                        <h3 className="font-semibold text-slate-900 text-xs">Status Distribution</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            Proportion of orders across fulfillment states
                        </p>
                    </div>

                    {analytics.ordersByStatus.length > 0 ? (
                        <div className="my-auto py-1">
                            <div className="relative h-40 w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={analytics.ordersByStatus}
                                            dataKey="count"
                                            nameKey="status"
                                            innerRadius={46}
                                            outerRadius={68}
                                            paddingAngle={2}
                                        >
                                            {analytics.ordersByStatus.map((entry) => (
                                                <Cell
                                                    key={entry.status}
                                                    fill={STATUS_COLORS[entry.status] || "#94a3b8"}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: any, name: any) => [
                                                `${Number(value).toLocaleString()} orders`,
                                                String(name).replace(/_/g, " "),
                                            ]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-[10px] font-medium text-slate-400 uppercase">Total</span>
                                    <span className="text-base font-bold text-slate-900 tabular-nums">
                                        {formatCompactNumber(analytics.totalOrders)}
                                    </span>
                                </div>
                            </div>

                            {/* Mini status legend list */}
                            <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2.5 border-t border-slate-100">
                                {analytics.ordersByStatus.slice(0, 6).map((item) => (
                                    <div key={item.status} className="flex items-center gap-1.5 text-xs">
                                        <span
                                            className="size-1.5 rounded-full shrink-0"
                                            style={{ backgroundColor: STATUS_COLORS[item.status] || "#94a3b8" }}
                                        />
                                        <span className="truncate text-slate-600 capitalize text-[11px]">
                                            {item.status.replace(/_/g, " ").toLowerCase()}
                                        </span>
                                        <span className="ml-auto font-medium text-slate-900 text-[11px] tabular-nums">
                                            {item.count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-40 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-md">
                            No status distribution
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Orders by Shop & Orders by Geographical Location ──────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Orders by Merchant Shop */}
                <div className="rounded-lg border border-slate-200 p-4 bg-white shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                                <Store className="size-3.5 text-slate-600" />
                                Top Merchants by Volume
                            </h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                Merchant storefronts ranked by orders and settlement value
                            </p>
                        </div>
                        <span className="text-[11px] font-medium text-slate-500">
                            {analytics.ordersByShop.length} active
                        </span>
                    </div>

                    {analytics.ordersByShop.length > 0 ? (
                        <div className="space-y-2.5">
                            {analytics.ordersByShop.slice(0, 5).map((shop, idx) => (
                                <div key={shop.shopId} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 truncate">
                                            <span className="font-mono text-[11px] text-slate-400 w-3">
                                                {idx + 1}
                                            </span>
                                            <span className="font-medium text-slate-900 truncate">
                                                {shop.shopName}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-mono">
                                                @{shop.shopSlug}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2.5 shrink-0 text-xs">
                                            <span className="font-semibold text-slate-900 tabular-nums">
                                                {shop.count.toLocaleString()} orders
                                            </span>
                                            <span className="text-slate-500 text-[11px] tabular-nums">
                                                {formatCurrency(shop.revenue)}
                                            </span>
                                            <span className="text-[10px] font-medium px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                                                {shop.percentage.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-slate-800 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min(Math.max(shop.percentage, 3), 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-36 flex flex-col items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-md">
                            <Store size={18} className="mb-1 opacity-30" />
                            No merchant volume recorded
                        </div>
                    )}
                </div>

                {/* Orders by Geographical Delivery Location */}
                <div className="rounded-lg border border-slate-200 p-4 bg-white shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                                <Globe className="size-3.5 text-slate-600" />
                                Delivery Locations
                            </h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                Customer distribution by destination region
                            </p>
                        </div>
                        <span className="text-[11px] font-medium text-slate-500">
                            {analytics.ordersByLocation.length} regions
                        </span>
                    </div>

                    {analytics.ordersByLocation.length > 0 ? (
                        <div className="space-y-2.5">
                            {analytics.ordersByLocation.slice(0, 5).map((loc, idx) => (
                                <div key={`${loc.city}-${loc.country}-${idx}`} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5 truncate">
                                            <MapPin size={11} className="text-slate-400 shrink-0" />
                                            <span className="font-medium text-slate-900 truncate">
                                                {loc.city}
                                            </span>
                                            <span className="text-[11px] text-slate-400">
                                                {loc.country}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2.5 shrink-0 text-xs">
                                            <span className="font-semibold text-slate-900 tabular-nums">
                                                {loc.count.toLocaleString()} orders
                                            </span>
                                            <span className="text-slate-500 text-[11px] tabular-nums">
                                                {formatCurrency(loc.revenue)}
                                            </span>
                                            <span className="text-[10px] font-medium px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                                                {loc.percentage.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-sky-600 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min(Math.max(loc.percentage, 3), 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-36 flex flex-col items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-md">
                            <MapPin size={18} className="mb-1 opacity-30" />
                            No delivery locations registered
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default AdminOrderAnalyticsSection;
