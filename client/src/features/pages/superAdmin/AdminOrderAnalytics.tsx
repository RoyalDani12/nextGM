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
    BarChart3,
    RefreshCw,
    MapPin,
    ChevronDown,
    ChevronUp,
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

const formatCurrency = (val: number) =>
    `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
    revenue: "#06b6d4",
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
        { label: "Net Revenue", value: formatCurrency(latest.netRevenue), color: PERFORMANCE_COLORS.revenue, key: "revenueIndex" },
        { label: "Fulfillment", value: `${latest.fulfillment.toFixed(1)}%`, color: PERFORMANCE_COLORS.fulfillment, key: "fulfillmentIndex" },
        { label: "Shipped + Delivered", value: `${latest.shipped.toLocaleString()} units`, color: PERFORMANCE_COLORS.shipped, key: "shippedIndex" },
        { label: "Cancellation", value: `${latest.cancellation.toFixed(1)}%`, color: PERFORMANCE_COLORS.cancellation, key: "cancellationIndex" },
    ] as const : [];

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-orange-50/40 p-5">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600">Performance trends</p><h3 className="mt-1 text-lg font-black tracking-tight text-slate-900">Order Analytics</h3><p className="mt-1 text-xs text-slate-500">A single visual view of value, revenue, fulfillment, delivery, and cancellations.</p></div>
                    <span className="rounded-full border border-orange-200 bg-white px-3 py-1.5 text-xs font-bold text-orange-700">{rangeLabel}</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {metrics.map((metric) => <div key={metric.label} className="rounded-xl border border-white bg-white/80 p-3 shadow-sm"><div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500"><span className="size-2 rounded-full" style={{ backgroundColor: metric.color }} />{metric.label}</div><p className="mt-1.5 text-base font-black text-slate-900">{metric.value}</p></div>)}
                </div>
            </div>
            <div className="p-5">
                {points.length ? <ResponsiveContainer width="100%" height={310}><LineChart data={points} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid stroke="#eef2f7" vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <Tooltip content={<PerformanceTooltip />} />
                    <Legend verticalAlign="bottom" height={28} iconType="circle" wrapperStyle={{ fontSize: 11, color: "#64748b", paddingTop: 12 }} />
                    <Line type="monotone" dataKey="aovIndex" name="Avg order value" stroke={PERFORMANCE_COLORS.aov} strokeWidth={2.5} dot={{ r: 3, fill: "#fff", stroke: PERFORMANCE_COLORS.aov, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="revenueIndex" name="Net revenue" stroke={PERFORMANCE_COLORS.revenue} strokeWidth={2.5} dot={{ r: 3, fill: "#fff", stroke: PERFORMANCE_COLORS.revenue, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="fulfillmentIndex" name="Fulfillment rate" stroke={PERFORMANCE_COLORS.fulfillment} strokeWidth={2.5} dot={{ r: 3, fill: "#fff", stroke: PERFORMANCE_COLORS.fulfillment, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="shippedIndex" name="Shipped + delivered" stroke={PERFORMANCE_COLORS.shipped} strokeWidth={2.5} dot={{ r: 3, fill: "#fff", stroke: PERFORMANCE_COLORS.shipped, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="cancellationIndex" name="Cancellation rate" stroke={PERFORMANCE_COLORS.cancellation} strokeWidth={2.5} dot={{ r: 3, fill: "#fff", stroke: PERFORMANCE_COLORS.cancellation, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                </LineChart></ResponsiveContainer> : <div className="flex h-[310px] items-center justify-center text-sm text-slate-400">No order trend data for this period</div>}
                <p className="mt-2 text-center text-[11px] text-slate-400">Lines are indexed to their own maximum so different units remain readable. Hover to see exact values.</p>
            </div>
        </div>
    );
}

function PerformanceTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { aov: number; netRevenue: number; fulfillment: number; shipped: number; cancellation: number; label: string } }> }) {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload;
    return <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-lg"><p className="mb-2 font-bold text-slate-900">{point.label}</p><p className="text-orange-600">Avg Order Value: <b>{formatCurrency(point.aov)}</b></p><p className="text-cyan-600">Net Revenue: <b>{formatCurrency(point.netRevenue)}</b></p><p className="text-emerald-600">Fulfillment: <b>{point.fulfillment.toFixed(1)}%</b></p><p className="text-violet-600">Shipped + Delivered: <b>{point.shipped}</b></p><p className="text-rose-600">Cancellation: <b>{point.cancellation.toFixed(1)}%</b></p></div>;
}

export interface OrderLifecyclePipelineProps {
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
        range: dateFrom || dateTo ? undefined : "all",
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
            desc: "Awaiting payment",
            icon: Clock,
            border: "border-amber-200/70",
            bg: "bg-amber-50/50",
            textTitle: "text-amber-800",
            textCount: "text-amber-950",
            textDesc: "text-amber-700/80",
            iconColor: "text-amber-600",
            activeRing: "ring-2 ring-amber-500 shadow-md",
        },
        {
            key: "PROCESSING",
            label: "Processing",
            count: processing,
            desc: "Packing & fulfillment",
            icon: Package,
            border: "border-orange-200/70",
            bg: "bg-orange-50/50",
            textTitle: "text-orange-800",
            textCount: "text-orange-950",
            textDesc: "text-orange-700/80",
            iconColor: "text-orange-600",
            activeRing: "ring-2 ring-orange-500 shadow-md",
        },
        {
            key: "SHIPPED",
            label: "Shipped",
            count: shipped,
            desc: "In transit to buyer",
            icon: Truck,
            border: "border-violet-200/70",
            bg: "bg-violet-50/50",
            textTitle: "text-violet-800",
            textCount: "text-violet-950",
            textDesc: "text-violet-700/80",
            iconColor: "text-violet-600",
            activeRing: "ring-2 ring-violet-500 shadow-md",
        },
        {
            key: "DELIVERED",
            label: "Delivered",
            count: delivered,
            desc: "Completed successfully",
            icon: CheckCircle2,
            border: "border-emerald-200/70",
            bg: "bg-emerald-50/50",
            textTitle: "text-emerald-800",
            textCount: "text-emerald-950",
            textDesc: "text-emerald-700/80",
            iconColor: "text-emerald-600",
            activeRing: "ring-2 ring-emerald-500 shadow-md",
        },
        {
            key: "CANCELLED",
            label: "Cancelled",
            count: cancelled,
            desc: "Aborted before ship",
            icon: XCircle,
            border: "border-rose-200/70",
            bg: "bg-rose-50/50",
            textTitle: "text-rose-800",
            textCount: "text-rose-950",
            textDesc: "text-rose-700/80",
            iconColor: "text-rose-600",
            activeRing: "ring-2 ring-rose-500 shadow-md",
        },
        {
            key: "REFUNDED",
            label: "Returned",
            count: returned,
            desc: "Claims & disputes",
            icon: RotateCcw,
            border: "border-slate-200",
            bg: "bg-slate-50",
            textTitle: "text-slate-800",
            textCount: "text-slate-950",
            textDesc: "text-slate-500",
            iconColor: "text-slate-600",
            activeRing: "ring-2 ring-slate-500 shadow-md",
        },
    ];

    return (
        <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Order Lifecycle Pipeline
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {cards.map((c) => {
                    const Icon = c.icon;
                    const isSelected = activeStatus === c.key;
                    return (
                        <div
                            key={c.key}
                            onClick={() => onSelectStatus?.(c.key)}
                            className={`rounded-xl border ${c.border} ${c.bg} p-3.5 transition hover:shadow-xs cursor-pointer ${
                                isSelected ? c.activeRing : ""
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold ${c.textTitle}`}>{c.label}</span>
                                <Icon className={`size-4 ${c.iconColor}`} />
                            </div>
                            <div className={`mt-2 text-xl font-black ${c.textCount}`}>
                                {isLoading ? (
                                    <span className="inline-block size-5 animate-pulse rounded bg-slate-200/60" />
                                ) : (
                                    c.count.toLocaleString()
                                )}
                            </div>
                            <p className={`text-[11px] ${c.textDesc} mt-0.5`}>{c.desc}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const AdminOrderAnalyticsSection: React.FC<AdminOrderAnalyticsProps> = ({
    shopId,
    parentDateFrom,
    parentDateTo,
}) => {
    const [range, setRange] = useState<"7d" | "30d" | "90d" | "12m" | "all">("30d");
    const [chartMode, setChartMode] = useState<"both" | "orders" | "revenue">("both");
    const [isExpanded, setIsExpanded] = useState<boolean>(true);

    const filters: AdminOrderAnalyticsFilters = {
        shopId: shopId || undefined,
        dateFrom: parentDateFrom || undefined,
        dateTo: parentDateTo || undefined,
        range: parentDateFrom || parentDateTo ? undefined : range,
    };

    const { data: analytics, isLoading, isError, refetch, isFetching } = useAdminOrderAnalytics(filters);

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8 flex flex-col items-center justify-center min-h-[220px]">
                <Loader2 className="size-8 animate-spin text-orange-500 mb-3" />
                <p className="text-sm font-semibold text-slate-700">Loading Order Analytics...</p>
                <p className="text-xs text-slate-400 mt-1">Aggregating order lifecycle, geographic, and fulfillment metrics</p>
            </div>
        );
    }

    if (isError || !analytics) {
        return (
            <div className="bg-white rounded-2xl border border-rose-100 shadow-xs p-6 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-slate-900 text-sm">Unable to load Order Analytics</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Please check network connectivity or try refreshing.</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                    <RefreshCw size={13} />
                    Retry
                </button>
            </div>
        );
    }

    return (
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-200">
            {/* Header & Controls */}
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/70 via-white to-orange-50/20">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700">
                            <BarChart3 size={12} />
                            Order Intelligence
                        </span>
                        {isFetching && (
                            <span className="flex items-center gap-1 text-[11px] text-orange-600 font-medium">
                                <RefreshCw size={11} className="animate-spin" />
                                Updating...
                            </span>
                        )}
                    </div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
                        Order Analytics Cockpit
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Lifecycle status breakdown, timeline trend, vendor volume, and geographic demand.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Range Preset Tabs (only when not overridden by custom date filter) */}
                    {!parentDateFrom && !parentDateTo && (
                        <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200/60">
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
                                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                                        range === tab.id
                                            ? "bg-white text-slate-900 shadow-xs font-bold"
                                            : "hover:text-slate-900 hover:bg-white/50"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Expand/Collapse Toggle */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                        title={isExpanded ? "Collapse Analytics" : "Expand Analytics"}
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp size={14} />
                                <span>Collapse</span>
                            </>
                        ) : (
                            <>
                                <ChevronDown size={14} />
                                <span>Expand Detailed Analytics</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="flex flex-col gap-6 p-5">
                    {/* ─── Performance Trends ──────────────────────────────────── */}
                    <div>
                        <OrderPerformanceChart analytics={analytics} range={range} />
                    </div>

                    {/* ─── Orders Over Time & Status Breakdown ───────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Timeline AreaChart (2 cols) */}
                        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 p-5 bg-white shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                        <TrendingUp className="size-4 text-orange-500" />
                                        Orders Over Time
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Historical trajectory of marketplace volume and gross merchandise value
                                    </p>
                                </div>
                                <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium text-slate-600">
                                    <button
                                        onClick={() => setChartMode("both")}
                                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                                            chartMode === "both" ? "bg-white text-slate-900 shadow-2xs font-bold" : ""
                                        }`}
                                    >
                                        Both
                                    </button>
                                    <button
                                        onClick={() => setChartMode("orders")}
                                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                                            chartMode === "orders" ? "bg-white text-slate-900 shadow-2xs font-bold" : ""
                                        }`}
                                    >
                                        Orders
                                    </button>
                                    <button
                                        onClick={() => setChartMode("revenue")}
                                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                                            chartMode === "revenue" ? "bg-white text-slate-900 shadow-2xs font-bold" : ""
                                        }`}
                                    >
                                        Revenue
                                    </button>
                                </div>
                            </div>

                            {analytics.ordersOverTime.length > 0 ? (
                                <div className="h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart
                                            data={analytics.ordersOverTime}
                                            margin={{ top: 16, right: 12, left: -8, bottom: 8 }}
                                        >
                                            <defs>
                                                <linearGradient id="orderVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.95} />
                                                    <stop offset="100%" stopColor="#fb923c" stopOpacity={0.55} />
                                                </linearGradient>
                                                <linearGradient id="orderRevGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.95} />
                                                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.55} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e8eef5" vertical={false} />
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
                                                    borderRadius: 12,
                                                    border: "1px solid #e2e8f0",
                                                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                                                    fontSize: 12,
                                                }}
                                                formatter={(value: any, name: any) => {
                                                    if (name === "Revenue" || name === "revenue") {
                                                        return [formatCurrency(Number(value)), "Revenue"];
                                                    }
                                                    return [Number(value).toLocaleString(), "Orders"];
                                                }}
                                                labelStyle={{ fontWeight: "bold", color: "#0f172a", marginBottom: 4 }}
                                            />
                                            <Legend verticalAlign="bottom" height={28} iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 12, color: "#64748b" }} />
                                            {(chartMode === "both" || chartMode === "orders") && (
                                                <Line
                                                    yAxisId="orders"
                                                    type="monotone"
                                                    dataKey="orders"
                                                    name="Orders"
                                                    stroke="#f97316"
                                                    strokeWidth={3}
                                                    dot={{ r: 4, fill: "#fff", stroke: "#f97316", strokeWidth: 2 }}
                                                    activeDot={{ r: 6, fill: "#f97316", stroke: "#fff", strokeWidth: 2 }}
                                                />
                                            )}
                                            {(chartMode === "both" || chartMode === "revenue") && (
                                                <Line
                                                    yAxisId="revenue"
                                                    type="monotone"
                                                    dataKey="revenue"
                                                    name="Revenue"
                                                    stroke="#8b5cf6"
                                                    strokeWidth={3}
                                                    dot={{ r: 4, fill: "#fff", stroke: "#8b5cf6", strokeWidth: 2 }}
                                                    activeDot={{ r: 6, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 2 }}
                                                />
                                            )}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-64 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                                    <ShoppingCart size={24} className="mb-2 opacity-40" />
                                    <p className="text-xs font-semibold">No order trajectory data in this timeframe</p>
                                </div>
                            )}
                        </div>

                        {/* Status Breakdown Donut (1 col) */}
                        <div className="rounded-2xl border border-slate-200/80 p-5 bg-white flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">Status Breakdown</h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Relative proportion of order lifecycle states
                                </p>
                            </div>

                            {analytics.ordersByStatus.length > 0 ? (
                                <div className="my-auto py-2">
                                    <div className="relative h-44 w-full flex items-center justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={analytics.ordersByStatus}
                                                    dataKey="count"
                                                    nameKey="status"
                                                    innerRadius={52}
                                                    outerRadius={75}
                                                    paddingAngle={3}
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
                                            <span className="text-xs font-bold text-slate-400">Total</span>
                                            <span className="text-lg font-black text-slate-900">
                                                {formatCompactNumber(analytics.totalOrders)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Mini status legend list */}
                                    <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100">
                                        {analytics.ordersByStatus.slice(0, 6).map((item) => (
                                            <div key={item.status} className="flex items-center gap-1.5 text-xs">
                                                <span
                                                    className="size-2 rounded-full shrink-0"
                                                    style={{ backgroundColor: STATUS_COLORS[item.status] || "#94a3b8" }}
                                                />
                                                <span className="truncate text-slate-600 capitalize text-[11px]">
                                                    {item.status.replace(/_/g, " ").toLowerCase()}
                                                </span>
                                                <span className="ml-auto font-bold text-slate-900 text-[11px]">
                                                    {item.count}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-44 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                                    No status distribution
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ─── Orders by Shop & Orders by Geographical Location ──────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Orders by Shop */}
                        <div className="rounded-2xl border border-slate-200/80 p-5 bg-white">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                        <Store className="size-4 text-emerald-600" />
                                        Orders by Shop
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Top marketplace stores ranked by volume and revenue contribution
                                    </p>
                                </div>
                                <span className="text-xs font-semibold text-slate-400">
                                    {analytics.ordersByShop.length} Stores Active
                                </span>
                            </div>

                            {analytics.ordersByShop.length > 0 ? (
                                <div className="space-y-3.5">
                                    {analytics.ordersByShop.slice(0, 6).map((shop, idx) => (
                                        <div key={shop.shopId} className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2 truncate">
                                                    <span className="font-mono text-[11px] text-slate-400 w-4">
                                                        #{idx + 1}
                                                    </span>
                                                    <span className="font-bold text-slate-800 truncate">
                                                        {shop.shopName}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                        @{shop.shopSlug}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <span className="font-black text-slate-900">
                                                        {shop.count.toLocaleString()} orders
                                                    </span>
                                                    <span className="text-slate-500 font-semibold text-[11px]">
                                                        {formatCurrency(shop.revenue)}
                                                    </span>
                                                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                                        {shop.percentage.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Progress bar */}
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min(Math.max(shop.percentage, 4), 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-44 flex flex-col items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                                    <Store size={22} className="mb-2 opacity-30" />
                                    No shop order volume recorded
                                </div>
                            )}
                        </div>

                        {/* Orders by Geographical Location */}
                        <div className="rounded-2xl border border-slate-200/80 p-5 bg-white">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                        <Globe className="size-4 text-blue-600" />
                                        Orders by Geographical Location
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Geographic distribution by customer delivery destination
                                    </p>
                                </div>
                                <span className="text-xs font-semibold text-slate-400">
                                    {analytics.ordersByLocation.length} Locations
                                </span>
                            </div>

                            {analytics.ordersByLocation.length > 0 ? (
                                <div className="space-y-3.5">
                                    {analytics.ordersByLocation.slice(0, 6).map((loc, idx) => (
                                        <div key={`${loc.city}-${loc.country}-${idx}`} className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2 truncate">
                                                    <MapPin size={12} className="text-blue-500 shrink-0" />
                                                    <span className="font-bold text-slate-800 truncate">
                                                        {loc.city}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400 font-semibold">
                                                        {loc.country}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <span className="font-black text-slate-900">
                                                        {loc.count.toLocaleString()} orders
                                                    </span>
                                                    <span className="text-slate-500 font-semibold text-[11px]">
                                                        {formatCurrency(loc.revenue)}
                                                    </span>
                                                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">
                                                        {loc.percentage.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Progress bar */}
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min(Math.max(loc.percentage, 4), 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-44 flex flex-col items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                                    <MapPin size={22} className="mb-2 opacity-30" />
                                    No shipping locations registered yet
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default AdminOrderAnalyticsSection;
