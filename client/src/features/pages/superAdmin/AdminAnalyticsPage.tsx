import { Loader2, BarChart3, ShoppingCart, Users, Store, DollarSign, ArrowUpRight } from "lucide-react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { usePlatformAnalytics, useAdminStats } from "@/features/admin/admin.hooks";

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
};

const formatMoney = (value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const formatMonth = (value: string) => {
    const [year, month] = value.split("-");
    return new Date(Number(year), Number(month) - 1).toLocaleString("en-US", { month: "short" });
};
const getAnalyticsMonths = () => Array.from({ length: 12 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (11 - index));
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
});

function StatCard({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: React.ElementType; tone: string }) {
    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
                    <p className="mt-3 text-2xl font-black tracking-tight text-slate-900">{value}</p>
                </div>
                <span className={`flex size-10 items-center justify-center rounded-xl ${tone}`}><Icon className="size-5" /></span>
            </div>
            <p className="mt-3 text-xs text-slate-400">{detail}</p>
        </div>
    );
}

function ChartCard({ title, subtitle, children, className = "" }: { title: string; subtitle: string; children: React.ReactNode; className?: string }) {
    return (
        <section className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ${className}`}>
            <div className="mb-5 flex items-start justify-between">
                <div><h2 className="font-black tracking-tight text-slate-900">{title}</h2><p className="mt-1 text-xs text-slate-400">{subtitle}</p></div>
                <button type="button" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-900" aria-label={`${title} details`}><ArrowUpRight className="size-4" /></button>
            </div>
            {children}
        </section>
    );
}

export const AdminAnalyticsPage = () => {
    const { data: analytics, isLoading: analyticsLoading } = usePlatformAnalytics();
    const { data: stats, isLoading: statsLoading } = useAdminStats();

    if (analyticsLoading || statsLoading) return <div className="flex h-96 items-center justify-center"><Loader2 className="size-8 animate-spin text-orange-500" /></div>;

    const monthlyOrders = new Map((analytics?.ordersByMonth || []).map((item) => [item.month, item]));
    const monthlyUsers = new Map((analytics?.userGrowth || []).map((item) => [item.month, item]));
    const months = getAnalyticsMonths();
    const monthly = months.map((month) => {
        const item = monthlyOrders.get(month);
        return { month, count: item?.count || 0, revenue: item?.revenue || 0, label: formatMonth(month) };
    });
    const statuses = [...(analytics?.ordersByStatus || [])].sort((a, b) => b.count - a.count);
    const totalOrders = statuses.reduce((sum, item) => sum + item.count, 0);
    const topShops = (analytics?.topShops || []).slice(0, 6).map((shop) => ({ ...shop, name: shop.shopName.length > 18 ? `${shop.shopName.slice(0, 18)}…` : shop.shopName }));
    const userGrowth = months.map((month) => ({ month, count: monthlyUsers.get(month)?.count || 0, label: formatMonth(month) }));

    return (
        <div className="min-h-full space-y-6 bg-slate-50/60 p-1 pb-8">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Control center</p><h1 className="mt-1 flex items-center gap-2 text-3xl font-black tracking-tight text-slate-950"><BarChart3 className="size-7 text-orange-500" /> Platform analytics</h1><p className="mt-2 text-sm text-slate-500">A visual view of marketplace growth, revenue, and order health.</p></div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">Live platform data</span>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <StatCard label="Total GMV" value={formatMoney(analytics?.gmv || 0)} detail="Gross merchandise value" icon={DollarSign} tone="bg-orange-50 text-orange-600" />
                <StatCard label="Total orders" value={(stats?.totalOrders || 0).toLocaleString()} detail="All-time marketplace orders" icon={ShoppingCart} tone="bg-violet-50 text-violet-600" />
                <StatCard label="Active shops" value={(stats?.totalShops || 0).toLocaleString()} detail="Registered tenant stores" icon={Store} tone="bg-emerald-50 text-emerald-600" />
                <StatCard label="Total users" value={(stats?.totalUsers || 0).toLocaleString()} detail="Registered platform accounts" icon={Users} tone="bg-blue-50 text-blue-600" />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
            <ChartCard title="Revenue overview" subtitle="Monthly GMV across all shops" className="min-h-[360px]">
                <div className="mb-3 flex items-center gap-4 text-[11px] font-semibold text-slate-500"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-orange-600" />Revenue</span><span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-600">Last 12 months</span></div>
                {monthly.length ? <ResponsiveContainer width="100%" height={270}><LineChart data={monthly} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#eef2f7" vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => [formatMoney(Number(value)), "Revenue"]} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                    <Line type="monotone" dataKey="revenue" stroke="#ea580c" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#ea580c", stroke: "#fff", strokeWidth: 3 }} />
                </LineChart></ResponsiveContainer> : <EmptyChart />}
            </ChartCard>
            <ChartCard title="User growth" subtitle="New registrations by month">
                <div className="mb-3 flex items-center gap-4 text-[11px] font-semibold text-slate-500"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-blue-600" />New users</span><span className="rounded-full bg-blue-50 px-2 py-1 text-blue-600">Last 12 months</span></div>
                {userGrowth.length ? <ResponsiveContainer width="100%" height={270}><LineChart data={userGrowth} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}><CartesianGrid stroke="#eef2f7" vertical={false} /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} /><Tooltip formatter={(value) => [Number(value).toLocaleString(), "New users"]} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} /><Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#2563eb", stroke: "#fff", strokeWidth: 3 }} /></LineChart></ResponsiveContainer> : <EmptyChart />}
            </ChartCard>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.35fr_.85fr]">
                <ChartCard title="Orders and revenue" subtitle="Compare monthly order volume with GMV">
                    {monthly.length ? <ResponsiveContainer width="100%" height={280}><BarChart data={monthly} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid stroke="#eef2f7" vertical={false} />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                        <YAxis yAxisId="orders" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                        <YAxis yAxisId="revenue" orientation="right" hide />
                        <Tooltip formatter={(value, name) => [name === "revenue" ? formatMoney(Number(value)) : Number(value).toLocaleString(), name === "revenue" ? "Revenue" : "Orders"]} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                        <Bar yAxisId="orders" dataKey="count" name="Orders" fill="#8b5cf6" radius={[5, 5, 0, 0]} />
                        <Bar yAxisId="revenue" dataKey="revenue" name="Revenue" fill="#f97316" radius={[5, 5, 0, 0]} />
                    </BarChart></ResponsiveContainer> : <EmptyChart />}
                </ChartCard>
                <ChartCard title="Order health" subtitle={`${totalOrders.toLocaleString()} orders by status`}>
                    {statuses.length ? <div className="flex flex-col items-center"><ResponsiveContainer width="100%" height={190}><PieChart><Pie data={statuses} dataKey="count" nameKey="status" innerRadius={55} outerRadius={78} paddingAngle={3}>{statuses.map((item) => <Cell key={item.status} fill={STATUS_COLORS[item.status] || "#94a3b8"} />)}</Pie><Tooltip formatter={(value, name) => [Number(value).toLocaleString(), String(name).replace(/_/g, " ")]} /></PieChart></ResponsiveContainer><div className="grid w-full grid-cols-2 gap-2">{statuses.slice(0, 6).map((item) => <div key={item.status} className="flex items-center gap-2 text-xs"><span className="size-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.status] || "#94a3b8" }} /><span className="truncate capitalize text-slate-600">{item.status.replace(/_/g, " ").toLowerCase()}</span><strong className="ml-auto text-slate-900">{item.count}</strong></div>)}</div></div> : <EmptyChart />}
                </ChartCard>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
                <ChartCard title="Top shops by revenue" subtitle="Leading marketplace sellers">
                    {topShops.length ? <ResponsiveContainer width="100%" height={280}><BarChart data={topShops} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
                        <CartesianGrid stroke="#eef2f7" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" width={115} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                        <Tooltip formatter={(value) => [formatMoney(Number(value)), "Revenue"]} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                        <Bar dataKey="revenue" fill="#10b981" radius={[0, 6, 6, 0]} barSize={22} />
                    </BarChart></ResponsiveContainer> : <EmptyChart />}
                </ChartCard>
            </div>
        </div>
    );
};

function EmptyChart() {
    return <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">No analytics data yet</div>;
}

export default AdminAnalyticsPage;
