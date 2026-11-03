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
    DollarSign,
    Percent,
    Globe,
    Store,
    ChevronDown,
    ChevronUp,
    BarChart3,
    RefreshCw,
    MapPin,
} from "lucide-react";
import {
    AreaChart,
    Area,
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
import type { AdminOrderAnalyticsFilters } from "@/features/admin/admin.api";

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

export const AdminOrderAnalyticsSection: React.FC<AdminOrderAnalyticsProps> = ({
    shopId,
    parentDateFrom,
    parentDateTo,
}) => {
    const [range, setRange] = useState<"7d" | "30d" | "90d" | "12m" | "all">("30d");
    const [isExpanded, setIsExpanded] = useState<boolean>(true);
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
                                <span>Expand ({analytics.totalOrders.toLocaleString()} Orders)</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="p-5 space-y-6">
                    {/* ─── Top 4 Core Performance KPI Cards ─────────────────────── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                        {/* Total Orders */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white shadow-sm">
                            <div className="flex items-center justify-between text-slate-300 text-xs font-semibold uppercase tracking-wider">
                                <span>Total Orders</span>
                                <span className="p-1.5 bg-white/10 rounded-lg text-orange-400">
                                    <ShoppingCart size={15} />
                                </span>
                            </div>
                            <div className="mt-2 text-2xl md:text-3xl font-black tracking-tight">
                                {analytics.totalOrders.toLocaleString()}
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300 border-t border-white/10 pt-2">
                                <span>Gross GMV</span>
                                <span className="font-bold text-white">{formatCurrency(analytics.grossRevenue)}</span>
                            </div>
                        </div>

                        {/* Average Order Value (AOV) */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
                            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                                <span>Avg Order Value (AOV)</span>
                                <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                                    <DollarSign size={15} />
                                </span>
                            </div>
                            <div className="mt-2 text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                                {formatCurrency(analytics.averageOrderValue)}
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                                <span>Net Platform Revenue</span>
                                <span className="font-bold text-slate-900">{formatCurrency(analytics.netRevenue)}</span>
                            </div>
                        </div>

                        {/* Fulfillment Rate */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
                            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                                <span>Fulfillment Rate</span>
                                <span className="p-1.5 bg-violet-50 text-violet-600 rounded-lg">
                                    <TrendingUp size={15} />
                                </span>
                            </div>
                            <div className="mt-2 text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
                                <span>{analytics.orderFulfillmentRate.toFixed(1)}%</span>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                                <span>Shipped + Delivered</span>
                                <span className="font-bold text-emerald-600">
                                    {(analytics.shippedOrders + analytics.deliveredOrders).toLocaleString()} units
                                </span>
                            </div>
                        </div>

                        {/* Cancellation Rate */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
                            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                                <span>Cancellation Rate</span>
                                <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                                    <Percent size={15} />
                                </span>
                            </div>
                            <div className="mt-2 text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                                {analytics.orderCancellationRate.toFixed(1)}%
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                                <span>Refunded Amount</span>
                                <span className="font-bold text-rose-600">{formatCurrency(analytics.refundedAmount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* ─── 6 Status Pipeline Cards ───────────────────────────────── */}
                    <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                            Order Lifecycle Pipeline
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {/* Pending */}
                            <div className="rounded-xl border border-amber-200/70 bg-amber-50/50 p-3.5 transition hover:shadow-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-amber-800">Pending</span>
                                    <Clock className="size-4 text-amber-600" />
                                </div>
                                <div className="mt-2 text-xl font-black text-amber-950">
                                    {analytics.pendingOrders.toLocaleString()}
                                </div>
                                <p className="text-[11px] text-amber-700/80 mt-0.5">Awaiting payment</p>
                            </div>

                            {/* Processing */}
                            <div className="rounded-xl border border-orange-200/70 bg-orange-50/50 p-3.5 transition hover:shadow-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-orange-800">Processing</span>
                                    <Package className="size-4 text-orange-600" />
                                </div>
                                <div className="mt-2 text-xl font-black text-orange-950">
                                    {analytics.processingOrders.toLocaleString()}
                                </div>
                                <p className="text-[11px] text-orange-700/80 mt-0.5">Packing & fulfillment</p>
                            </div>

                            {/* Shipped */}
                            <div className="rounded-xl border border-violet-200/70 bg-violet-50/50 p-3.5 transition hover:shadow-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-violet-800">Shipped</span>
                                    <Truck className="size-4 text-violet-600" />
                                </div>
                                <div className="mt-2 text-xl font-black text-violet-950">
                                    {analytics.shippedOrders.toLocaleString()}
                                </div>
                                <p className="text-[11px] text-violet-700/80 mt-0.5">In transit to buyer</p>
                            </div>

                            {/* Delivered */}
                            <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-3.5 transition hover:shadow-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-emerald-800">Delivered</span>
                                    <CheckCircle2 className="size-4 text-emerald-600" />
                                </div>
                                <div className="mt-2 text-xl font-black text-emerald-950">
                                    {analytics.deliveredOrders.toLocaleString()}
                                </div>
                                <p className="text-[11px] text-emerald-700/80 mt-0.5">Completed successfully</p>
                            </div>

                            {/* Cancelled */}
                            <div className="rounded-xl border border-rose-200/70 bg-rose-50/50 p-3.5 transition hover:shadow-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-rose-800">Cancelled</span>
                                    <XCircle className="size-4 text-rose-600" />
                                </div>
                                <div className="mt-2 text-xl font-black text-rose-950">
                                    {analytics.cancelledOrders.toLocaleString()}
                                </div>
                                <p className="text-[11px] text-rose-700/80 mt-0.5">Aborted before ship</p>
                            </div>

                            {/* Returned */}
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 transition hover:shadow-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800">Returned</span>
                                    <RotateCcw className="size-4 text-slate-600" />
                                </div>
                                <div className="mt-2 text-xl font-black text-slate-950">
                                    {analytics.returnedOrders.toLocaleString()}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">Claims & disputes</p>
                            </div>
                        </div>
                    </div>

                    {/* ─── Orders Over Time & Status Breakdown ───────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Timeline AreaChart (2 cols) */}
                        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 p-5 bg-white">
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
                                        <AreaChart
                                            data={analytics.ordersOverTime}
                                            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient id="orderVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                                                </linearGradient>
                                                <linearGradient id="orderRevGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                                                </linearGradient>
                                            </defs>
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
                                            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                                            {(chartMode === "both" || chartMode === "orders") && (
                                                <Area
                                                    yAxisId="orders"
                                                    type="monotone"
                                                    dataKey="orders"
                                                    name="Orders"
                                                    stroke="#f97316"
                                                    strokeWidth={2.5}
                                                    fillOpacity={1}
                                                    fill="url(#orderVolumeGrad)"
                                                />
                                            )}
                                            {(chartMode === "both" || chartMode === "revenue") && (
                                                <Area
                                                    yAxisId="revenue"
                                                    type="monotone"
                                                    dataKey="revenue"
                                                    name="Revenue"
                                                    stroke="#8b5cf6"
                                                    strokeWidth={2.5}
                                                    fillOpacity={1}
                                                    fill="url(#orderRevGrad)"
                                                />
                                            )}
                                        </AreaChart>
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
