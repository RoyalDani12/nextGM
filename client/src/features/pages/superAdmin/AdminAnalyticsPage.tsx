import React from "react";
import { Loader2, BarChart3, TrendingUp, ShoppingCart, Users, Store, DollarSign } from "lucide-react";
import { usePlatformAnalytics, useAdminStats } from "@/features/admin/admin.hooks";

const ORDER_STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-yellow-400",
    CONFIRMED: "bg-blue-400",
    PROCESSING: "bg-orange-400",
    SHIPPED: "bg-violet-400",
    DELIVERED: "bg-emerald-500",
    CANCELLED: "bg-red-400",
    REFUNDED: "bg-gray-400",
    EXPIRED: "bg-gray-300",
    REFUND_PENDING: "bg-amber-400",
};

const StatCard = ({
    label,
    value,
    icon: Icon,
    sub,
    accent = "orange",
}: {
    label: string;
    value: string;
    icon: React.ElementType;
    sub?: string;
    accent?: "orange" | "emerald" | "violet" | "blue";
}) => {
    const accents: Record<string, string> = {
        orange: "bg-orange-50 text-orange-600",
        emerald: "bg-emerald-50 text-emerald-600",
        violet: "bg-violet-50 text-violet-600",
        blue: "bg-blue-50 text-blue-600",
    };
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500 font-medium">{label}</p>
                <div className={`p-2 rounded-lg ${accents[accent]}`}>
                    <Icon size={18} />
                </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
    );
};

const BarChart = ({
    data,
    valueKey,
    labelKey,
    color = "bg-orange-500",
    formatValue = (v: number) => String(v),
}: {
    data: Record<string, any>[];
    valueKey: string;
    labelKey: string;
    color?: string;
    formatValue?: (v: number) => string;
}) => {
    const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);
    return (
        <div className="space-y-2">
            {data.map((item, i) => {
                const val = Number(item[valueKey]) || 0;
                const pct = (val / max) * 100;
                return (
                    <div key={i} className="flex items-center gap-3">
                        <p className="text-xs text-gray-500 w-16 shrink-0 text-right font-mono">{String(item[labelKey]).slice(-5)}</p>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div
                                className={`${color} h-2.5 rounded-full transition-all duration-500`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <p className="text-xs font-semibold text-gray-700 w-20 shrink-0">{formatValue(val)}</p>
                    </div>
                );
            })}
        </div>
    );
};

export const AdminAnalyticsPage = () => {
    const { data: analytics, isLoading: analyticsLoading } = usePlatformAnalytics();
    const { data: stats, isLoading: statsLoading } = useAdminStats();

    const isLoading = analyticsLoading || statsLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
        );
    }

    const totalOrdersByStatus = analytics?.ordersByStatus.reduce((a, s) => a + s.count, 0) ?? 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="size-6 text-orange-600" />
                    Platform Analytics
                </h1>
                <p className="text-sm text-gray-500 mt-1">Real-time overview of platform performance</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total GMV"
                    value={`$${(analytics?.gmv ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={DollarSign}
                    sub="Gross Merchandise Value"
                    accent="orange"
                />
                <StatCard
                    label="Total Orders"
                    value={(stats?.totalOrders ?? 0).toLocaleString()}
                    icon={ShoppingCart}
                    sub="All-time orders"
                    accent="violet"
                />
                <StatCard
                    label="Active Shops"
                    value={(stats?.totalShops ?? 0).toLocaleString()}
                    icon={Store}
                    sub="Registered tenants"
                    accent="emerald"
                />
                <StatCard
                    label="Total Users"
                    value={(stats?.totalUsers ?? 0).toLocaleString()}
                    icon={Users}
                    sub="Registered accounts"
                    accent="blue"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue by Month */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="font-semibold text-gray-900">Revenue by Month</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Last 12 months</p>
                        </div>
                        <TrendingUp size={18} className="text-orange-500" />
                    </div>
                    {analytics?.ordersByMonth.length ? (
                        <BarChart
                            data={analytics.ordersByMonth}
                            valueKey="revenue"
                            labelKey="month"
                            color="bg-orange-500"
                            formatValue={(v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                        />
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
                    )}
                </div>

                {/* Orders by Month */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="font-semibold text-gray-900">Orders by Month</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Last 12 months</p>
                        </div>
                        <ShoppingCart size={18} className="text-violet-500" />
                    </div>
                    {analytics?.ordersByMonth.length ? (
                        <BarChart
                            data={analytics.ordersByMonth}
                            valueKey="count"
                            labelKey="month"
                            color="bg-violet-500"
                            formatValue={(v) => v.toLocaleString()}
                        />
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top 10 Shops by Revenue */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="font-semibold text-gray-900">Top Shops by Revenue</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Top 10 performing shops</p>
                        </div>
                        <Store size={18} className="text-emerald-500" />
                    </div>
                    {analytics?.topShops.length ? (
                        <div className="space-y-3">
                            {analytics.topShops.map((shop, i) => {
                                const maxRev = analytics.topShops[0].revenue || 1;
                                return (
                                    <div key={shop.shopId} className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-gray-400 w-5 shrink-0">#{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{shop.shopName}</p>
                                            <div className="mt-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-emerald-500 h-1.5 rounded-full"
                                                    style={{ width: `${(shop.revenue / maxRev) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-bold text-orange-600">${shop.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                            <p className="text-xs text-gray-400">{shop.orderCount} orders</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
                    )}
                </div>

                {/* Orders by Status */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="font-semibold text-gray-900">Orders by Status</h2>
                            <p className="text-xs text-gray-400 mt-0.5">{totalOrdersByStatus.toLocaleString()} total orders</p>
                        </div>
                        <ShoppingCart size={18} className="text-blue-500" />
                    </div>
                    {analytics?.ordersByStatus.length ? (
                        <div className="space-y-3">
                            {analytics.ordersByStatus
                                .sort((a, b) => b.count - a.count)
                                .map((item) => {
                                    const pct = totalOrdersByStatus > 0 ? Math.round((item.count / totalOrdersByStatus) * 100) : 0;
                                    const color = ORDER_STATUS_COLORS[item.status] ?? "bg-gray-400";
                                    return (
                                        <div key={item.status} className="flex items-center gap-3">
                                            <div className={`size-2.5 rounded-full shrink-0 ${color}`} />
                                            <p className="text-sm text-gray-700 flex-1 capitalize">{item.status.replace(/_/g, " ").toLowerCase()}</p>
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                    <div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
                                                </div>
                                                <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                                                <span className="text-sm font-semibold text-gray-900 w-12 text-right">{item.count.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
                    )}
                </div>
            </div>

            {/* User Growth */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="font-semibold text-gray-900">User Growth</h2>
                        <p className="text-xs text-gray-400 mt-0.5">New registrations per month (last 12 months)</p>
                    </div>
                    <Users size={18} className="text-blue-500" />
                </div>
                {analytics?.userGrowth.length ? (
                    <BarChart
                        data={analytics.userGrowth}
                        valueKey="count"
                        labelKey="month"
                        color="bg-blue-500"
                        formatValue={(v) => v.toLocaleString()}
                    />
                ) : (
                    <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
                )}
            </div>
        </div>
    );
};

export default AdminAnalyticsPage;
