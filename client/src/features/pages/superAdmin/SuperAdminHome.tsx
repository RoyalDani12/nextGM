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
    TrendingUp,
    Calendar,
    Loader2,
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

const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const formatMonth = (m: string) => {
    const [year, month] = m.split("-");
    return new Date(Number(year), Number(month) - 1).toLocaleString("default", { month: "short", year: "2-digit" });
};

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    sub: string;
    onClick?: () => void;
}

const MetricCard = ({ title, value, icon: Icon, sub, onClick }: MetricCardProps) => (
    <div
        onClick={onClick}
        className={`rounded-lg border border-slate-200 bg-white p-4.5 shadow-xs transition-all ${
            onClick ? "hover:border-slate-300 hover:shadow-xs cursor-pointer group" : ""
        }`}
    >
        <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{title}</span>
            <div className="size-8 rounded-md bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600 group-hover:text-slate-900 transition-colors">
                <Icon className="size-3.5" />
            </div>
        </div>
        <div className="mt-2.5">
            <p className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>{sub}</span>
                {onClick && (
                    <ArrowUpRight className="size-3 text-slate-300 group-hover:text-slate-700 transition-colors" />
                )}
            </p>
        </div>
    </div>
);

export const SuperAdminHome = () => {
    const { data: stats, isLoading, isError } = useAdminStats();
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center gap-2">
                <Loader2 className="size-6 animate-spin text-orange-500" />
                <p className="text-xs font-medium text-slate-400">Loading platform metrics...</p>
            </div>
        );
    }

    if (isError || !stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-2 rounded-lg border border-rose-200 bg-rose-50/50 p-8 text-center">
                <p className="text-sm font-semibold text-rose-700">Failed to load platform stats</p>
                <p className="text-xs text-slate-500 max-w-sm">
                    Verify your connection or ensure you have active Super Admin authorization.
                </p>
            </div>
        );
    }

    // Merge monthly data into one unified dataset
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

    const totalRecordedRevenue = stats.monthlyOrders.reduce((sum, item) => sum + (item.revenue || 0), 0);

    const operationsLinks = [
        {
            title: "Orders & Fulfillment",
            desc: "Global marketplace orders and dispute handling",
            icon: ShoppingCart,
            path: "/superadmin/orders",
        },
        {
            title: "Product Catalog",
            desc: "Inspect, moderate and review merchant items",
            icon: Package,
            path: "/superadmin/products",
        },
        {
            title: "Tenant Stores",
            desc: "Manage storefront verification, KYC & approvals",
            icon: Store,
            path: "/superadmin/shops",
        },
        {
            title: "Users & Accounts",
            desc: "User permissions, roles, and status control",
            icon: Users,
            path: "/superadmin/users",
        },
        {
            title: "Platform Analytics",
            desc: "Gross merchandise value, charts & trends",
            icon: BarChart3,
            path: "/superadmin/analytics",
        },
        {
            title: "Coupons & Discounts",
            desc: "Platform discount campaigns and rules",
            icon: Ticket,
            path: "/superadmin/coupons",
        },
        {
            title: "Payouts & Balances",
            desc: "Tenant wallet balances & Stripe oversight",
            icon: CreditCard,
            path: "/superadmin/payouts",
        },
        {
            title: "Support Desk",
            desc: "Inquiries from merchants and customers",
            icon: LifeBuoy,
            path: "/superadmin/support",
        },
        {
            title: "Security & Audits",
            desc: "System event logs and authorization trail",
            icon: Shield,
            path: "/superadmin/audits",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-200">
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-slate-900">
                        Platform Overview
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Real-time aggregate performance, tenant metrics, and marketplace health.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Platform Live
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-2xs">
                        <Calendar className="size-3 text-slate-400" />
                        Last 6 Months
                    </span>
                </div>
            </div>

            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Platform Balance"
                    value={formatCurrency(stats.platformBalance)}
                    icon={CreditCard}
                    sub="Net platform wallet reserves"
                    onClick={() => navigate("/superadmin/billing")}
                />
                <MetricCard
                    title="Gross Volume"
                    value={formatCurrency(totalRecordedRevenue)}
                    icon={TrendingUp}
                    sub="Recorded order volume"
                    onClick={() => navigate("/superadmin/analytics")}
                />
                <MetricCard
                    title="Merchant Stores"
                    value={stats.totalShops.toLocaleString()}
                    icon={Store}
                    sub="Registered tenant shops"
                    onClick={() => navigate("/superadmin/shops")}
                />
                <MetricCard
                    title="Total Accounts"
                    value={stats.totalUsers.toLocaleString()}
                    icon={Users}
                    sub="Buyers, sellers & staff"
                    onClick={() => navigate("/superadmin/users")}
                />
            </div>

            {/* Platform Gross Revenue Trend Chart */}
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
                    <div>
                        <h2 className="text-xs font-semibold text-slate-900">Platform Gross Revenue</h2>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Monthly aggregated merchandise volume across all active stores
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-slate-500">
                            Total volume:{" "}
                            <span className="font-semibold text-slate-900 tabular-nums">
                                {formatCurrency(totalRecordedRevenue)}
                            </span>
                        </span>
                    </div>
                </div>

                {combinedData.length === 0 ? (
                    <div className="h-56 flex items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-md">
                        No revenue recorded in the selected period.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={combinedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.12} />
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 11, fill: "#64748b" }}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                                tick={{ fontSize: 11, fill: "#64748b" }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#ffffff",
                                    borderColor: "#e2e8f0",
                                    borderRadius: "6px",
                                    boxShadow: "0 4px 12px -2px rgb(15 23 42 / 0.08)",
                                    fontSize: "11px",
                                    padding: "8px 12px",
                                }}
                                formatter={(v: any) => [formatCurrency(Number(v || 0)), "Gross Revenue"]}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#ea580c"
                                strokeWidth={2}
                                fill="url(#revenueGrad)"
                                name="Revenue"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Split Charts: Signups & Order Volume */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* User & Shop Signups */}
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
                    <div className="mb-4">
                        <h2 className="text-xs font-semibold text-slate-900">New Signups</h2>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Monthly registration counts for users and tenant shops
                        </p>
                    </div>

                    {combinedData.length === 0 ? (
                        <div className="h-44 flex items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-md">
                            No signup data available
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={combinedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 11, fill: "#64748b" }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 11, fill: "#64748b" }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#ffffff",
                                        borderColor: "#e2e8f0",
                                        borderRadius: "6px",
                                        boxShadow: "0 4px 12px -2px rgb(15 23 42 / 0.08)",
                                        fontSize: "11px",
                                    }}
                                />
                                <Legend
                                    wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
                                    iconType="circle"
                                    iconSize={8}
                                />
                                <Bar dataKey="users" fill="#ea580c" name="Users" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="shops" fill="#0f172a" name="Shops" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Order volume */}
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
                    <div className="mb-4">
                        <h2 className="text-xs font-semibold text-slate-900">Order Volume</h2>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Number of completed purchases fulfilled across all stores
                        </p>
                    </div>

                    {combinedData.length === 0 ? (
                        <div className="h-44 flex items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-md">
                            No orders placed in this period
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={combinedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 11, fill: "#64748b" }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 11, fill: "#64748b" }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#ffffff",
                                        borderColor: "#e2e8f0",
                                        borderRadius: "6px",
                                        boxShadow: "0 4px 12px -2px rgb(15 23 42 / 0.08)",
                                        fontSize: "11px",
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="orders"
                                    stroke="#0f172a"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: "#0f172a" }}
                                    activeDot={{ r: 5, fill: "#ea580c" }}
                                    name="Orders"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Operations Quick Access Directory */}
            <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-slate-900">Operations & Quick Access</p>
                    <span className="text-[11px] text-slate-400">Direct navigation to system modules</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {operationsLinks.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className="rounded-lg border border-slate-200 bg-white p-3.5 hover:border-slate-300 hover:shadow-xs transition-all text-left group flex items-start justify-between cursor-pointer"
                            >
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="size-8 rounded-md bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 text-slate-600 group-hover:text-slate-900 transition-colors">
                                        <Icon className="size-3.5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
                                            {item.title}
                                        </p>
                                        <p className="text-[11px] text-slate-500 leading-normal mt-0.5 line-clamp-1">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                                <ArrowUpRight className="size-3.5 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-2 mt-0.5" />
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
