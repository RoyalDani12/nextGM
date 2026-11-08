import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  RefreshCw,
  Download,
  AlertCircle,
  Loader2,
  Package,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useShopAnalytics } from "./analytics.hooks";
import type { AnalyticsRange } from "./analytics.types";

const fmt = (val: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(val || 0);

const fmtNumber = (val: number) =>
  new Intl.NumberFormat("en-US").format(val || 0);

const downloadAnalyticsCsv = (data: {
  summary: {
    totalRevenue: number;
    netRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    unitsSold: number;
    returnRequests: number;
    cancellationRate: number;
  };
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
    ...data.topProducts.map((p) => [p.name, p.unitsSold, p.totalRevenue, p.stock]),
  ];
  const csv = rows
    .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
};

const RANGE_OPTIONS: { id: AnalyticsRange; label: string }[] = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "12m", label: "12 months" },
];

const renderOrderStatus = (status: string) => {
  switch (status) {
    case "DELIVERED":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Delivered
        </span>
      );
    case "SHIPPED":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700">
          <span className="size-1.5 rounded-full bg-blue-500" />
          Shipped
        </span>
      );
    case "PROCESSING":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
          <span className="size-1.5 rounded-full bg-amber-500" />
          Processing
        </span>
      );
    case "CONFIRMED":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-700">
          <span className="size-1.5 rounded-full bg-orange-500" />
          Confirmed
        </span>
      );
    case "CANCELLED":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600">
          <span className="size-1.5 rounded-full bg-rose-500" />
          Cancelled
        </span>
      );
    case "REFUNDED":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-700">
          <span className="size-1.5 rounded-full bg-purple-500" />
          Refunded
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <span className="size-1.5 rounded-full bg-slate-400" />
          {status}
        </span>
      );
  }
};

const formatPipelineStage = (stage: string) => {
  switch (stage) {
    case "PENDING":
      return "New orders";
    case "CONFIRMED":
      return "Confirmed";
    case "PROCESSING":
      return "Processing";
    case "SHIPPED":
      return "Shipped";
    case "DELIVERED":
      return "Delivered";
    case "CANCELLED":
      return "Cancelled";
    case "REFUNDED":
      return "Refunded";
    default:
      return stage;
  }
};

const tooltipStyle = {
  backgroundColor: "#fff",
  borderColor: "#e2e8f0",
  borderRadius: "8px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
  fontSize: "12px",
  padding: "6px 10px",
};

export function AnalyticsPage() {
  const { shopId = "" } = useParams<{ shopId: string }>();
  const [range, setRange] = useState<AnalyticsRange>("30d");

  const { data, isLoading, isError, isFetching, refetch } = useShopAnalytics(
    shopId,
    range
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[460px] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-sm mx-auto text-center py-20 space-y-3">
        <AlertCircle className="size-8 text-slate-300 mx-auto" />
        <p className="text-sm font-medium text-slate-700">Couldn't load analytics</p>
        <p className="text-xs text-slate-400">Check your connection and try again.</p>
        <button
          onClick={() => refetch()}
          className="text-xs font-medium text-orange-600 hover:text-orange-700 cursor-pointer"
        >
          Retry
        </button>
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

  return (
    <div className="space-y-5 max-w-[1200px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Store performance and revenue overview
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Time range selector */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
            {RANGE_OPTIONS.map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                  range === r.id
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => downloadAnalyticsCsv(data)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Download size={13} />
            Export
          </button>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-40"
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Top 4 Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5">
          <p className="text-xs text-slate-500 font-medium">Gross revenue</p>
          <p className="text-xl font-semibold text-slate-900 mt-1 tabular-nums">
            {fmt(summary.totalRevenue)}
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px]">
            {summary.revenueGrowth >= 0 ? (
              <span className="text-emerald-700 font-medium flex items-center gap-0.5">
                <TrendingUp size={11} /> +{summary.revenueGrowth}%
              </span>
            ) : (
              <span className="text-rose-600 font-medium flex items-center gap-0.5">
                <TrendingDown size={11} /> {summary.revenueGrowth}%
              </span>
            )}
            <span className="text-slate-400">vs prev</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5">
          <p className="text-xs text-slate-500 font-medium">Total orders</p>
          <p className="text-xl font-semibold text-slate-900 mt-1 tabular-nums">
            {fmtNumber(summary.totalOrders)}
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px]">
            {summary.ordersGrowth >= 0 ? (
              <span className="text-emerald-700 font-medium flex items-center gap-0.5">
                <TrendingUp size={11} /> +{summary.ordersGrowth}%
              </span>
            ) : (
              <span className="text-rose-600 font-medium flex items-center gap-0.5">
                <TrendingDown size={11} /> {summary.ordersGrowth}%
              </span>
            )}
            <span className="text-slate-400">vs prev</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5">
          <p className="text-xs text-slate-500 font-medium">Average order value</p>
          <p className="text-xl font-semibold text-slate-900 mt-1 tabular-nums">
            {fmt(summary.averageOrderValue)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            {fmtNumber(summary.unitsSold)} items sold
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5">
          <p className="text-xs text-slate-500 font-medium">Net revenue</p>
          <p className="text-xl font-semibold text-slate-900 mt-1 tabular-nums">
            {fmt(summary.netRevenue)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            {summary.totalRevenue > 0
              ? `${Math.round((summary.netRevenue / summary.totalRevenue) * 100)}% retention`
              : "100% retention"}
          </p>
        </div>
      </div>

      {/* Operational Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <p className="text-xs text-slate-500 font-medium">Fulfillment rate</p>
          <p className="text-lg font-semibold text-slate-900 mt-0.5 tabular-nums">
            {summary.fulfillmentRate}%
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <p className="text-xs text-slate-500 font-medium">Repeat buyers</p>
          <p className="text-lg font-semibold text-slate-900 mt-0.5 tabular-nums">
            {summary.repeatCustomerRate}%
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <p className="text-xs text-slate-500 font-medium">Return claims</p>
          <p className="text-lg font-semibold text-slate-900 mt-0.5 tabular-nums">
            {summary.returnRequests}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <p className="text-xs text-slate-500 font-medium">Cancellation rate</p>
          <p className="text-lg font-semibold text-slate-900 mt-0.5 tabular-nums">
            {summary.cancellationRate}%
          </p>
        </div>
      </div>

      {/* Charts (Side by Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Revenue chart */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-slate-800">Revenue over time</h2>
            <span className="text-xs text-slate-400 font-medium">
              Total: {fmt(summary.totalRevenue)}
            </span>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  tickFormatter={(v) => `$${v}`}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val: any) => [fmt(Number(val)), "Revenue"]}
                  cursor={{ stroke: "#cbd5e1", strokeWidth: 1, strokeDasharray: "4 4" }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f97316"
                  strokeWidth={1.5}
                  fill="url(#analyticsRevGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders vs Units */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-slate-800">Orders & items sold</h2>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-sm bg-blue-500" /> Orders
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-sm bg-orange-400" /> Items
              </span>
            </div>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeline} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val: any, name: any) => [
                    val,
                    name === "orders" ? "Orders" : "Items sold",
                  ]}
                  cursor={{ fill: "rgba(241, 245, 249, 0.4)" }}
                />
                <Bar dataKey="orders" fill="#3b82f6" radius={[3, 3, 0, 0]} name="orders" />
                <Bar dataKey="units" fill="#fb923c" radius={[3, 3, 0, 0]} name="units" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Middle: Pipeline, Inventory, Buyer Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Pipeline */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-slate-800">Order stages</h2>
              <Link
                to={`/dashboard/shop/${shopId}/orders`}
                className="text-xs font-medium text-orange-600 hover:text-orange-700"
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {orderPipeline.map((step) => (
                <div key={step.stage} className="py-2 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">
                    {formatPipelineStage(step.stage)}
                  </span>
                  <div className="text-right">
                    <span className="font-semibold text-slate-800 tabular-nums">
                      {step.count}
                    </span>
                    <span className="text-slate-400 text-[11px] ml-1.5">
                      ({fmt(step.totalAmount)})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Inventory Summary */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-slate-800">Inventory status</h2>
              <Link
                to={`/dashboard/shop/${shopId}/products`}
                className="text-xs font-medium text-orange-600 hover:text-orange-700"
              >
                Products
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              <div className="py-2.5 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  In stock
                </span>
                <span className="font-semibold text-slate-800 tabular-nums">
                  {inventoryHealth.inStockCount}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="size-2 rounded-full bg-amber-500" />
                  Low stock (≤10)
                </span>
                <span className="font-semibold text-amber-700 tabular-nums">
                  {inventoryHealth.lowStockCount}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="size-2 rounded-full bg-rose-500" />
                  Out of stock
                </span>
                <span className="font-semibold text-rose-600 tabular-nums">
                  {inventoryHealth.outOfStockCount}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-500">Stock health score</span>
                <span className="font-semibold text-slate-800 tabular-nums">
                  {inventoryHealth.healthScore}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Buyer Locations */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-slate-800">Buyer locations</h2>
              <span className="text-xs text-slate-400">
                {fmtNumber(summary.uniqueCustomers)} buyers
              </span>
            </div>

            {customerLocations.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Location data will appear once orders are placed.
              </p>
            ) : (
              <div className="space-y-2.5 mt-2">
                {customerLocations.slice(0, 5).map((loc) => (
                  <div key={loc.location} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 truncate max-w-[150px]">
                        {loc.location}
                      </span>
                      <span className="text-slate-400 tabular-nums font-mono text-[11px]">
                        {loc.count} ({loc.percentage}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-400 rounded-full"
                        style={{ width: `${Math.max(6, loc.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Top products & Low stock items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Top Products */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-slate-800">Top selling products</h2>
            <Link
              to={`/dashboard/shop/${shopId}/products`}
              className="text-xs font-medium text-orange-600 hover:text-orange-700"
            >
              Catalog
            </Link>
          </div>

          {topProducts.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              No product sales recorded in this period.
            </p>
          ) : (
            <div className="divide-y divide-slate-50">
              {topProducts.map((p, idx) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-medium text-slate-400 w-4">
                      {idx + 1}
                    </span>
                    <div className="size-8 shrink-0 rounded bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="size-full object-cover" />
                      ) : (
                        <Package size={14} className="text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{p.name}</p>
                      <p className="text-[11px] text-slate-400">{fmt(p.price)}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-slate-900 tabular-nums">
                      {fmt(p.totalRevenue)}
                    </p>
                    <p className="text-[11px] text-slate-400">{p.unitsSold} sold</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-slate-800">Inventory alerts</h2>
            {inventoryHealth.lowStockCount > 0 && (
              <span className="text-xs font-medium text-amber-600">
                {inventoryHealth.lowStockCount} low stock
              </span>
            )}
          </div>

          {inventoryHealth.criticalItems.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              All inventory levels are healthy.
            </p>
          ) : (
            <div className="divide-y divide-slate-50">
              {inventoryHealth.criticalItems.map((item) => {
                const isOut = item.stock <= 0;

                return (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-8 shrink-0 rounded bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="size-full object-cover" />
                        ) : (
                          <Package size={14} className="text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">{item.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {item.sku || "No SKU"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span
                        className={`text-xs font-medium ${
                          isOut ? "text-rose-600" : "text-amber-600"
                        }`}
                      >
                        {isOut ? "Out of stock" : `${item.stock} left`}
                      </span>
                      <Link
                        to={`/dashboard/shop/${shopId}/products/${item.id}`}
                        className="text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 px-2 py-1 rounded transition-colors"
                      >
                        Restock
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-sm font-medium text-slate-800">Recent orders</h2>
          <Link
            to={`/dashboard/shop/${shopId}/orders`}
            className="text-xs font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            All orders <ArrowUpRight size={12} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-xs text-slate-400 py-10 text-center">
            No orders recorded in this period.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500 font-medium">
                  <th className="text-left px-4 py-3 font-medium">Order</th>
                  <th className="text-left px-4 py-3 font-medium">Customer</th>
                  <th className="text-left px-4 py-3 font-medium">Items</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-slate-900">
                      <Link
                        to={`/dashboard/shop/${shopId}/orders/${ord.id}`}
                        className="hover:underline text-slate-900"
                      >
                        #{ord.id.slice(-8).toUpperCase()}
                      </Link>
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-800 leading-tight">
                        {ord.customerName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[200px] mt-0.5">
                        {ord.customerEmail}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-500">
                      {ord.itemsCount} {ord.itemsCount === 1 ? "item" : "items"}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {renderOrderStatus(ord.status)}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-right tabular-nums text-sm font-medium text-slate-900">
                      {fmt(ord.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
