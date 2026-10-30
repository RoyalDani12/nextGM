import { Loader2, CreditCard, Building2, AlertTriangle, CheckCircle } from "lucide-react";
import { useBillingOverview } from "@/features/admin/admin.hooks";

const ShopStatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
        ACTIVE: "bg-emerald-100 text-emerald-700",
        PENDING: "bg-yellow-100 text-yellow-700",
        PAUSED: "bg-blue-100 text-blue-700",
        SUSPENDED: "bg-red-100 text-red-700",
        CLOSED: "bg-gray-100 text-gray-500",
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? "bg-gray-100"}`}>
            {status}
        </span>
    );
};

const MembershipBadge = ({ plan }: { plan: { name: string; price: string | number; billingCycle: string } | null | undefined }) => {
    if (!plan) return <span className="text-xs text-gray-400">—</span>;
    return (
        <div>
            <span className="inline-flex items-center px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-xs font-medium">
                {plan.name}
            </span>
            <p className="text-xs text-gray-400 mt-0.5">${Number(plan.price).toFixed(2)} / {plan.billingCycle}</p>
        </div>
    );
};

export const AdminBillingPage = () => {
    const { data, isLoading, isError } = useBillingOverview();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard className="size-6 text-orange-600" />
                    Global Billing
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Financial health overview of all shops. Actual billing is managed through Stripe.
                </p>
            </div>

            {/* Summary Cards */}
            {!isLoading && data && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 rounded-xl">
                            <CheckCircle size={22} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Active Shops</p>
                            <p className="text-2xl font-bold text-emerald-600">{data.totalActive}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                        <div className="p-3 bg-red-50 rounded-xl">
                            <AlertTriangle size={22} className="text-red-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Suspended</p>
                            <p className="text-2xl font-bold text-red-500">{data.totalSuspended}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                        <div className="p-3 bg-orange-50 rounded-xl">
                            <Building2 size={22} className="text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Shops</p>
                            <p className="text-2xl font-bold text-orange-600">{data.shops.length}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="animate-spin text-gray-400" size={28} />
                    </div>
                ) : isError ? (
                    <div className="flex items-center justify-center h-48 text-red-500 text-sm">Failed to load billing data.</div>
                ) : !data?.shops.length ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                        <Building2 size={32} className="mb-2 opacity-40" />
                        <p className="text-sm">No shops found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Shop</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Wallet</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Products</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data.shops.map((shop) => (
                                    <tr key={shop.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {shop.profile?.logo ? (
                                                    <img src={shop.profile.logo} alt="" className="size-8 rounded-lg object-cover" />
                                                ) : (
                                                    <div className="size-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                                        <Building2 size={14} className="text-orange-600" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-gray-900">{shop.profile?.name ?? shop.slug}</p>
                                                    <p className="text-xs text-gray-400">/{shop.slug}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-gray-900">{shop.owner.name}</p>
                                            <p className="text-xs text-gray-400">{shop.owner.email}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <ShopStatusBadge status={shop.status} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <MembershipBadge plan={shop.membership?.plan} />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`font-semibold ${Number(shop.wallet?.balance ?? 0) > 0 ? "text-orange-600" : "text-gray-400"}`}>
                                                ${Number(shop.wallet?.balance ?? 0).toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-600">{shop._count.products}</td>
                                        <td className="px-4 py-3 text-right text-gray-600">{shop._count.orders}</td>
                                        <td className="px-4 py-3 text-xs text-gray-400">
                                            {new Date(shop.createdAt).toLocaleDateString()}
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
};

export default AdminBillingPage;
