import {
    Users, Store, CreditCard, ShoppingCart, Loader2
} from "lucide-react";
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line, Legend
} from "recharts";
import { useAdminStats } from "@/features/admin/admin.hooks";
import { useNavigate } from "react-router-dom";

const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const formatMonth = (m: string) => {
    const [year, month] = m.split("-");
    return new Date(Number(year), Number(month) - 1).toLocaleString("default", { month: "short", year: "2-digit" });
};

const StatCard = ({
    title, value, icon: Icon, color, sub
}: { title: string; value: string | number; icon: React.ElementType; color: string; sub?: string }) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <div className={`p-2 rounded-lg ${color}`}>
                <Icon size={20} className="text-white" />
            </div>
        </div>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
);

export const SuperAdminHome = () => {
    const { data: stats, isLoading, isError } = useAdminStats();
    const navigate = useNavigate();

    if (isLoading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
    );

    if (isError || !stats) return (
        <div className="flex items-center justify-center h-64 text-red-500">
            Failed to load platform stats.
        </div>
    );

    // Merge monthly data into one unified dataset for combined chart
    const months = Array.from(new Set([
        ...stats.monthlyUsers.map(d => d.month),
        ...stats.monthlyShops.map(d => d.month),
        ...stats.monthlyOrders.map(d => d.month),
    ])).sort();

    const combinedData = months.map(month => ({
        month: formatMonth(month),
        users: stats.monthlyUsers.find(d => d.month === month)?.count ?? 0,
        shops: stats.monthlyShops.find(d => d.month === month)?.count ?? 0,
        orders: stats.monthlyOrders.find(d => d.month === month)?.count ?? 0,
        revenue: stats.monthlyOrders.find(d => d.month === month)?.revenue ?? 0,
    }));

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
                <p className="text-sm text-gray-500 mt-1">Real-time metrics across all tenants</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Users" value={stats.totalUsers.toLocaleString()} icon={Users} color="bg-blue-500" sub="Excluding deleted accounts" />
                <StatCard title="Active Shops" value={stats.totalShops.toLocaleString()} icon={Store} color="bg-emerald-500" sub="Excluding closed shops" />
                <StatCard title="Total Orders" value={stats.totalOrders.toLocaleString()} icon={ShoppingCart} color="bg-violet-500" />
                <StatCard title="Platform Balance" value={formatCurrency(stats.platformBalance)} icon={CreditCard} color="bg-amber-500" sub="10% commission collected" />
            </div>

            {/* Revenue Chart */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">Monthly Revenue</h2>
                        <p className="text-xs text-gray-400">Order revenue across all shops (last 6 months)</p>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={combinedData}>
                        <defs>
                            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v: any) => formatCurrency(Number(v || 0))} />
                        <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revenueGrad)" name="Revenue" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Users + Shops + Orders charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User & Shop Signups */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-1">New Signups</h2>
                    <p className="text-xs text-gray-400 mb-4">Users and shops created per month</p>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={combinedData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="users" fill="#3b82f6" name="Users" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="shops" fill="#10b981" name="Shops" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Order volume */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-1">Order Volume</h2>
                    <p className="text-xs text-gray-400 mb-4">Number of orders per month</p>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={combinedData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="orders" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} name="Orders" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                    onClick={() => navigate("/superadmin/users")}
                    className="bg-white border border-gray-100 shadow-sm rounded-xl p-5 text-left hover:shadow-md transition-shadow flex items-center gap-4"
                >
                    <div className="p-3 bg-blue-50 rounded-lg"><Users size={20} className="text-blue-600" /></div>
                    <div>
                        <p className="font-semibold text-gray-900">Manage Users</p>
                        <p className="text-sm text-gray-500">View, search, and update user roles &amp; status</p>
                    </div>
                </button>
                <button
                    onClick={() => navigate("/superadmin/shops")}
                    className="bg-white border border-gray-100 shadow-sm rounded-xl p-5 text-left hover:shadow-md transition-shadow flex items-center gap-4"
                >
                    <div className="p-3 bg-emerald-50 rounded-lg"><Store size={20} className="text-emerald-600" /></div>
                    <div>
                        <p className="font-semibold text-gray-900">Manage Shops</p>
                        <p className="text-sm text-gray-500">View all shops, suspend or activate them</p>
                    </div>
                </button>
            </div>
        </div>
    );
};