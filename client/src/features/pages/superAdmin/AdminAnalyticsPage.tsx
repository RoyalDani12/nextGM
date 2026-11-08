import { useState, useMemo } from "react";
import { Download, RefreshCw, Loader2, AlertCircle } from "lucide-react";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { usePlatformAnalytics, useAdminStats } from "@/features/admin/admin.hooks";

const STATUS_COLORS: Record<string, string> = {
  DELIVERED: "#10b981",
  SHIPPED: "#8b5cf6",
  PROCESSING: "#f97316",
  CONFIRMED: "#3b82f6",
  PENDING: "#f59e0b",
  CANCELLED: "#ef4444",
  REFUNDED: "#64748b",
  EXPIRED: "#94a3b8",
};

const fmt = (val: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);

const fmtCompact = (val: number) => {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}k`;
  return `$${Math.round(val)}`;
};

const formatMonthLabel = (value: string, showYear = false) => {
  const [year, month] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  if (showYear) {
    return date.toLocaleString("en-US", { month: "short", year: "2-digit" });
  }
  return date.toLocaleString("en-US", { month: "short" });
};

// Generates continuous monthly series for up to 24 months (2 full years)
const getAnalyticsMonths = (count = 24) =>
  Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (count - 1 - index));
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });

const TIMEFRAMES = [
  { id: "ALL", label: "All time", monthsCount: 24, labelDesc: "All recorded history" },
  { id: "12M", label: "12 months", monthsCount: 12, labelDesc: "Past 12 months" },
  { id: "6M", label: "6 months", monthsCount: 6, labelDesc: "Past 6 months" },
  { id: "30D", label: "30 days", monthsCount: 2, labelDesc: "Past 30 days" },
] as const;

type TimeframeOption = (typeof TIMEFRAMES)[number]["id"];

const tooltipStyle = {
  backgroundColor: "#fff",
  borderColor: "#e2e8f0",
  borderRadius: "8px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
  fontSize: "12px",
  padding: "6px 10px",
};

export function AdminAnalyticsPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>("ALL");

  const {
    data: analytics,
    isLoading: analyticsLoading,
    isFetching: analyticsFetching,
    isError: analyticsError,
    refetch: refetchAnalytics,
  } = usePlatformAnalytics();

  const {
    data: stats,
    isLoading: statsLoading,
    isFetching: statsFetching,
    isError: statsError,
    refetch: refetchStats,
  } = useAdminStats();

  const isInitialLoading =
    (analyticsLoading || statsLoading) && !analytics && !stats;
  const isFetching = analyticsFetching || statsFetching;
  const hasError = (analyticsError || statsError) && !analytics && !stats;

  const handleRefresh = () => {
    refetchAnalytics();
    refetchStats();
  };

  const activeTf = useMemo(
    () => TIMEFRAMES.find((t) => t.id === selectedTimeframe) || TIMEFRAMES[0],
    [selectedTimeframe]
  );

  const months = useMemo(
    () => getAnalyticsMonths(24),
    []
  );

  const monthlyOrders = useMemo(
    () =>
      new Map(
        (analytics?.ordersByMonth || []).map((item) => [item.month, item])
      ),
    [analytics?.ordersByMonth]
  );

  const monthlyUsers = useMemo(
    () =>
      new Map(
        (analytics?.userGrowth || []).map((item) => [item.month, item])
      ),
    [analytics?.userGrowth]
  );

  const monthlyShops = useMemo(
    () =>
      new Map((stats?.monthlyShops || []).map((item) => [item.month, item])),
    [stats?.monthlyShops]
  );

  // Full 24-month continuous timeseries
  const allMonthlyData = useMemo(() => {
    return months.map((month) => {
      const orderItem = monthlyOrders.get(month);
      const userItem = monthlyUsers.get(month);
      const shopItem = monthlyShops.get(month);
      return {
        month,
        label: formatMonthLabel(month, true),
        shortLabel: formatMonthLabel(month, false),
        revenue: orderItem?.revenue || 0,
        orders: orderItem?.count || 0,
        users: userItem?.count || 0,
        shops: shopItem?.count || 0,
      };
    });
  }, [months, monthlyOrders, monthlyUsers, monthlyShops]);

  // Data sliced based on selected timeframe
  const filteredData = useMemo(() => {
    const sliced = allMonthlyData.slice(-activeTf.monthsCount);
    const showYearInLabel = activeTf.monthsCount > 12;
    return sliced.map((item) => ({
      ...item,
      displayLabel: showYearInLabel ? item.label : item.shortLabel,
    }));
  }, [allMonthlyData, activeTf]);

  const statuses = useMemo(() => {
    return [...(analytics?.ordersByStatus || [])].sort(
      (a, b) => b.count - a.count
    );
  }, [analytics?.ordersByStatus]);

  const totalOrdersInStatus = useMemo(
    () => statuses.reduce((sum, item) => sum + item.count, 0),
    [statuses]
  );

  const topShops = useMemo(() => {
    return (analytics?.topShops || []).slice(0, 6).map((shop) => ({
      ...shop,
      name:
        shop.shopName.length > 20
          ? `${shop.shopName.slice(0, 20)}…`
          : shop.shopName,
    }));
  }, [analytics?.topShops]);

  const gmv = analytics?.gmv || stats?.grossVolume || 0;
  const totalOrders = stats?.totalOrders || 0;
  const totalShops = stats?.totalShops || 0;
  const totalUsers = stats?.totalUsers || 0;

  const handleExportCSV = () => {
    const headers = ["Month", "Revenue (USD)", "Orders", "New Users", "New Shops"];
    const rows = filteredData.map((d) => [
      `"${d.month}"`,
      `"${d.revenue.toFixed(2)}"`,
      `"${d.orders}"`,
      `"${d.users}"`,
      `"${d.shops}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `platform-analytics-${selectedTimeframe.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isInitialLoading) {
    return (
      <div className="flex min-h-[460px] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="max-w-sm mx-auto text-center py-20 space-y-3">
        <AlertCircle className="mx-auto size-8 text-slate-300" />
        <p className="text-sm font-medium text-slate-700">Couldn't load analytics</p>
        <p className="text-xs text-slate-400">Check your connection and try again.</p>
        <button
          onClick={handleRefresh}
          className="text-xs font-medium text-orange-600 hover:text-orange-700 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Platform performance, transaction volume, and growth metrics
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Timeframe horizon toggle pills */}
          <div className="inline-flex items-center p-0.5 rounded-lg border border-slate-200 bg-slate-100 text-xs shadow-2xs">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.id}
                onClick={() => setSelectedTimeframe(tf.id)}
                className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                  selectedTimeframe === tf.id
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Download size={13} />
            Export
          </button>

          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-40"
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Cards - Full Width Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5">
          <p className="text-xs text-slate-500 font-medium">Gross volume</p>
          <p className="text-xl font-semibold text-slate-900 mt-1 tabular-nums">
            {fmt(gmv)}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5">
          <p className="text-xs text-slate-500 font-medium">Total orders</p>
          <p className="text-xl font-semibold text-slate-900 mt-1 tabular-nums">
            {totalOrders.toLocaleString()}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5">
          <p className="text-xs text-slate-500 font-medium">Active shops</p>
          <p className="text-xl font-semibold text-slate-900 mt-1 tabular-nums">
            {totalShops.toLocaleString()}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5">
          <p className="text-xs text-slate-500 font-medium">Total users</p>
          <p className="text-xl font-semibold text-slate-900 mt-1 tabular-nums">
            {totalUsers.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Charts Grid: Side by Side (100% Full Width whether Sidebar is Open or Closed) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
        {/* Graph 1: Revenue */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 w-full">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-slate-800">Revenue</h2>
            <span className="text-xs text-slate-400">{activeTf.labelDesc}</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={filteredData}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="displayLabel"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  tickFormatter={fmtCompact}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val: any) => [fmt(Number(val)), "Revenue"]}
                  labelFormatter={(_label, payload) => {
                    const row = payload?.[0]?.payload;
                    return row ? `${row.month} (${row.displayLabel})` : "";
                  }}
                  cursor={{
                    stroke: "#cbd5e1",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f97316"
                  strokeWidth={1.5}
                  fill="url(#revGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 2: Orders */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 w-full">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-slate-800">Orders</h2>
            <span className="text-xs text-slate-400">{activeTf.labelDesc}</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredData}
                margin={{ top: 4, right: 8, left: -24, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="displayLabel"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val: any) => [
                    Number(val).toLocaleString(),
                    "Orders",
                  ]}
                  labelFormatter={(_label, payload) => {
                    const row = payload?.[0]?.payload;
                    return row ? `${row.month} (${row.displayLabel})` : "";
                  }}
                  cursor={{ fill: "#f8fafc" }}
                />
                <Bar
                  dataKey="orders"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                  barSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 3: User Growth */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 w-full">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-slate-800">User growth</h2>
            <span className="text-xs text-slate-400">New registrations ({activeTf.labelDesc})</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={filteredData}
                margin={{ top: 4, right: 8, left: -24, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="displayLabel"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val: any) => [
                    Number(val).toLocaleString(),
                    "New users",
                  ]}
                  labelFormatter={(_label, payload) => {
                    const row = payload?.[0]?.payload;
                    return row ? `${row.month} (${row.displayLabel})` : "";
                  }}
                  cursor={{
                    stroke: "#cbd5e1",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#2563eb"
                  strokeWidth={1.5}
                  fill="url(#userGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 4: Order Status Breakdown */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 w-full flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-slate-800">Order status</h2>
            <span className="text-xs text-slate-400">
              {totalOrdersInStatus.toLocaleString()} total orders
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-4 py-2">
            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statuses}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={44}
                    outerRadius={64}
                    paddingAngle={3}
                  >
                    {statuses.map((item) => (
                      <Cell
                        key={item.status}
                        fill={STATUS_COLORS[item.status] || "#94a3b8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val: any, name: any) => [
                      Number(val).toLocaleString(),
                      String(name).replace(/_/g, " "),
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5">
              {statuses.slice(0, 5).map((item) => {
                const pct =
                  totalOrdersInStatus > 0
                    ? Math.round((item.count / totalOrdersInStatus) * 100)
                    : 0;
                const color = STATUS_COLORS[item.status] || "#94a3b8";

                return (
                  <div
                    key={item.status}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="capitalize">
                        {item.status.replace(/_/g, " ").toLowerCase()}
                      </span>
                    </span>
                    <span className="text-slate-400 font-mono text-[11px] tabular-nums">
                      {item.count.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Graph 5: Top Shops by Revenue */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 w-full">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-slate-800">
              Top shops by revenue
            </h2>
            <span className="text-xs text-slate-400">Leading sellers</span>
          </div>

          <div className="h-60 w-full">
            {topShops.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No shop revenue recorded yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topShops}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 4, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    horizontal={false}
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={115}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val: any) => [fmt(Number(val)), "Revenue"]}
                    cursor={{ fill: "#f8fafc" }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#10b981"
                    radius={[0, 4, 4, 0]}
                    barSize={16}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Graph 6: Shop Growth */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 w-full">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-slate-800">Shop growth</h2>
            <span className="text-xs text-slate-400">New merchant registrations</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={filteredData}
                margin={{ top: 4, right: 8, left: -24, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="shopGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="displayLabel"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val: any) => [
                    Number(val).toLocaleString(),
                    "New shops",
                  ]}
                  labelFormatter={(_label, payload) => {
                    const row = payload?.[0]?.payload;
                    return row ? `${row.month} (${row.displayLabel})` : "";
                  }}
                  cursor={{
                    stroke: "#cbd5e1",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="shops"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  fill="url(#shopGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAnalyticsPage;
