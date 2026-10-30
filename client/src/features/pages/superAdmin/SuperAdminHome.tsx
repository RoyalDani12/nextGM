import React from "react";
import {
    Users,
    Store,
    CreditCard,
    ShoppingCart,
    BarChart3,
    Ticket,
    LifeBuoy,
    Shield,
    ArrowUpRight,
    Package,
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
    LineChart,
    Line,
    Legend,
} from "recharts";
import { useAdminStats } from "@/features/admin/admin.hooks";
import { useNavigate } from "react-router-dom";
import { PageEnter, PageHeader, LoadingState } from "@/components/ui/ds-components";

const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const formatMonth = (m: string) => {
    const [year, month] = m.split("-");
    return new Date(Number(year), Number(month) - 1).toLocaleString("default", { month: "short", year: "2-digit" });
};

const StatCard = ({
    title,
    value,
    icon: Icon,
    iconBg,
    sub,
    onClick,
}: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    iconBg: string;
    sub?: string;
    onClick?: () => void;
}) => (
    <div
        onClick={onClick}
        className={`ds-stat-card ${onClick ? "cursor-pointer" : ""}`}
    >
        <div className="flex items-center justify-between">
            <p className="ds-stat-label">{title}</p>
            <div className={`ds-stat-icon-wrapper ${iconBg}`}>
                <Icon size={18} className="text-white" />
            </div>
        </div>
        <p className="ds-stat-value">{value}</p>
        {sub && <p className="ds-stat-sub">{sub}</p>}
    </div>
);

export const SuperAdminHome = () => {
    const { data: stats, isLoading, isError } = useAdminStats();
    const navigate = useNavigate();

    if (isLoading)
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <LoadingState label="Loading control center metrics..." size={32} />
            </div>
        );

    if (isError || !stats)
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 bg-white rounded-2xl border border-red-100 p-8 text-center ds-shadow-sm">
                <p className="text-base font-bold text-red-600">Failed to load platform stats</p>
                <p className="text-xs text-slate-500 max-w-md">
                    Check your connection or verify you have SUPER_ADMIN permissions.
                </p>
            </div>
        );

    // Merge monthly data into one unified dataset for combined chart
    const months = Array.from(
        new Set([
            ...stats.monthlyUsers.map((d) => d.month),
            ...stats.monthlyShops.map((d) => d.month),
            ...stats.monthlyOrders.map((d) => d.month),
        ])
    ).sort();

    const combinedData = months.map((month) => ({
        month: formatMonth(month),
        users: stats.monthlyUsers.find((d) => d.month === month)?.count ?? 0,
        shops: stats.monthlyShops.find((d) => d.month === month)?.count ?? 0,
        orders: stats.monthlyOrders.find((d) => d.month === month)?.count ?? 0,
        revenue: stats.monthlyOrders.find((d) => d.month === month)?.revenue ?? 0,
    }));

    return (
        <PageEnter className="space-y-8">
            {/* Header */}
            <PageHeader
                title="Platform Control Center"
                subtitle="Real-time metrics, store operations & system oversight across the marketplace"
            />

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers.toLocaleString()}
                    icon={Users}
                    iconBg="bg-blue-600"
                    sub="Registered platform users"
                    onClick={() => navigate("/superadmin/users")}
                />
                <StatCard
                    title="Active Shops"
                    value={stats.totalShops.toLocaleString()}
                    icon={Store}
                    iconBg="bg-emerald-600"
                    sub="Operational tenant stores"
                    onClick={() => navigate("/superadmin/shops")}
                />
                <StatCard
                    title="Total Orders"
                    value={stats.totalOrders.toLocaleString()}
                    icon={ShoppingCart}
                    iconBg="bg-amber-600"
                    sub="Across all tenant shops"
                    onClick={() => navigate("/superadmin/orders")}
                />
                <StatCard
                    title="Platform Balance"
                    value={formatCurrency(stats.platformBalance)}
                    icon={CreditCard}
                    iconBg="bg-orange-600"
                    sub="Net platform wallet funds"
                    onClick={() => navigate("/superadmin/billing")}
                />
            </div>

            {/* Revenue Chart */}
            <div className="ds-card p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">Platform Gross Revenue</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Order revenue aggregated across all tenant shops</p>
                    </div>
                </div>
                {combinedData.length === 0 ? (
                    <div className="h-56 flex items-center justify-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                        No revenue recorded in the last 6 months yet
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={combinedData}>
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} />
                            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: "#64748b" }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#ffffff",
                                    borderColor: "#e2e8f0",
                                    borderRadius: "12px",
                                    boxShadow: "0 10px 25px -5px rgb(15 23 42 / 0.1)",
                                }}
                                formatter={(v: any) => [formatCurrency(Number(v || 0)), "Revenue"]}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#f97316"
                                strokeWidth={2.5}
                                fill="url(#revenueGrad)"
                                name="Revenue"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Users + Shops + Orders charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User & Shop Signups */}
                <div className="ds-card p-6">
                    <h2 className="text-base font-bold text-slate-900 mb-1 tracking-tight">New Signups</h2>
                    <p className="text-xs text-slate-400 mb-4">Users and shops created per month</p>
                    {combinedData.length === 0 ? (
                        <div className="h-44 flex items-center justify-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                            No signup data in the selected period
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={combinedData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#ffffff",
                                        borderColor: "#e2e8f0",
                                        borderRadius: "12px",
                                        boxShadow: "0 10px 25px -5px rgb(15 23 42 / 0.1)",
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="users" fill="#f97316" name="Users" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="shops" fill="#10b981" name="Shops" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Order volume */}
                <div className="ds-card p-6">
                    <h2 className="text-base font-bold text-slate-900 mb-1 tracking-tight">Order Volume</h2>
                    <p className="text-xs text-slate-400 mb-4">Number of completed orders per month</p>
                    {combinedData.length === 0 ? (
                        <div className="h-44 flex items-center justify-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                            No orders placed yet
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={combinedData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#ffffff",
                                        borderColor: "#e2e8f0",
                                        borderRadius: "12px",
                                        boxShadow: "0 10px 25px -5px rgb(15 23 42 / 0.1)",
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="orders"
                                    stroke="#f97316"
                                    strokeWidth={2.5}
                                    dot={{ r: 4, fill: "#f97316" }}
                                    activeDot={{ r: 6 }}
                                    name="Orders"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Operations Quick Access Grid */}
            <div>
                <p className="ds-section-label mb-3">Operations & Management</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <button
                        onClick={() => navigate("/superadmin/orders")}
                        className="ds-card-interactive p-5 text-left group"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-3 bg-orange-50 rounded-xl group-hover:bg-orange-100 transition-colors">
                                <ShoppingCart size={20} className="text-orange-600" />
                            </div>
                            <ArrowUpRight size={16} className="text-slate-300 group-hover:text-orange-600 transition-colors" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors">All Orders</p>
                            <p className="text-xs text-slate-500 mt-1">Platform-wide fulfillment and order inspect</p>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate("/superadmin/products")}
                        className="ds-card-interactive p-5 text-left group"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-3 bg-orange-50 rounded-xl group-hover:bg-orange-100 transition-colors">
                                <Package size={20} className="text-orange-600" />
                            </div>
                            <ArrowUpRight size={16} className="text-slate-300 group-hover:text-orange-600 transition-colors" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors">Product Catalog</p>
                            <p className="text-xs text-slate-500 mt-1">Inspect & moderate all merchant products</p>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate("/superadmin/analytics")}
                        className="ds-card-interactive p-5 text-left group"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                                <BarChart3 size={20} className="text-blue-600" />
                            </div>
                            <ArrowUpRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Analytics</p>
                            <p className="text-xs text-slate-500 mt-1">GMV, top stores & growth trends</p>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate("/superadmin/shops")}
                        className="ds-card-interactive p-5 text-left group"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                                <Store size={20} className="text-emerald-600" />
                            </div>
                            <ArrowUpRight size={16} className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Tenants & Stores</p>
                            <p className="text-xs text-slate-500 mt-1">Moderate shops, approve or suspend</p>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate("/superadmin/users")}
                        className="ds-card-interactive p-5 text-left group"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
                                <Users size={20} className="text-indigo-600" />
                            </div>
                            <ArrowUpRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Users & Access</p>
                            <p className="text-xs text-slate-500 mt-1">Manage accounts, roles and status</p>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate("/superadmin/coupons")}
                        className="ds-card-interactive p-5 text-left group"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors">
                                <Ticket size={20} className="text-purple-600" />
                            </div>
                            <ArrowUpRight size={16} className="text-slate-300 group-hover:text-purple-600 transition-colors" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors">Coupons</p>
                            <p className="text-xs text-slate-500 mt-1">Platform-wide discount oversight</p>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate("/superadmin/payouts")}
                        className="ds-card-interactive p-5 text-left group"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition-colors">
                                <CreditCard size={20} className="text-amber-600" />
                            </div>
                            <ArrowUpRight size={16} className="text-slate-300 group-hover:text-amber-600 transition-colors" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">Payouts</p>
                            <p className="text-xs text-slate-500 mt-1">Tenant wallet balances & Stripe oversight</p>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate("/superadmin/support")}
                        className="ds-card-interactive p-5 text-left group"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-3 bg-rose-50 rounded-xl group-hover:bg-rose-100 transition-colors">
                                <LifeBuoy size={20} className="text-rose-600" />
                            </div>
                            <ArrowUpRight size={16} className="text-slate-300 group-hover:text-rose-600 transition-colors" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors">Support Desk</p>
                            <p className="text-xs text-slate-500 mt-1">Resolve customer & merchant tickets</p>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate("/superadmin/audits")}
                        className="ds-card-interactive p-5 text-left group"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-slate-200 transition-colors">
                                <Shield size={20} className="text-slate-700" />
                            </div>
                            <ArrowUpRight size={16} className="text-slate-300 group-hover:text-slate-700 transition-colors" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 group-hover:text-slate-700 transition-colors">Security & Audits</p>
                            <p className="text-xs text-slate-500 mt-1">Activity logs and security event trail</p>
                        </div>
                    </button>
                </div>
            </div>
        </PageEnter>
    );
};
