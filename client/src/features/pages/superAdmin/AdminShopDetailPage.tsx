import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Store, User, CreditCard, ShoppingCart } from "lucide-react";
import { useAdminShop, useUpdateShopStatus } from "@/features/admin/admin.hooks";

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <div className="text-sm text-gray-800">{value}</div>
    </div>
);

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

export const AdminShopDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: shop, isLoading, isError } = useAdminShop(id!);
    const updateStatus = useUpdateShopStatus();

    if (isLoading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-gray-400" size={28} />
        </div>
    );

    if (isError || !shop) return (
        <div className="flex items-center justify-center h-64 text-red-500 text-sm">
            Shop not found or failed to load.
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <ArrowLeft size={18} />
                </button>
                <div className="flex items-center gap-3">
                    {shop.profile?.logo ? (
                        <img src={shop.profile.logo} className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <Store size={20} className="text-emerald-600" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{shop.profile?.name || shop.slug}</h1>
                        <p className="text-sm text-gray-500">/{shop.slug}</p>
                    </div>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Status", value: <ShopStatusBadge status={shop.status} />, icon: Store, color: "bg-emerald-50" },
                    { label: "Wallet Balance", value: `$${Number(shop.wallet?.balance ?? 0).toFixed(2)}`, icon: CreditCard, color: "bg-amber-50" },
                    { label: "Products", value: shop._count.products, icon: Store, color: "bg-blue-50" },
                    { label: "Orders", value: shop._count.orders, icon: ShoppingCart, color: "bg-violet-50" },
                ].map(item => (
                    <div key={item.label} className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
                        <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                        <p className="text-lg font-bold text-gray-900">{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Shop Info */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <h2 className="text-base font-semibold text-gray-900">Shop Details</h2>
                    <Field label="Name" value={shop.profile?.name || shop.slug} />
                    <Field label="Slug" value={<span className="font-mono text-xs">/{shop.slug}</span>} />
                    <Field label="Shop ID" value={<span className="font-mono text-xs">{shop.id}</span>} />
                    <Field label="Created" value={new Date(shop.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
                    {shop.profile?.description && <Field label="Description" value={shop.profile.description} />}
                </div>

                {/* Owner + Actions */}
                <div className="space-y-4">
                    {/* Owner Card */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <User size={18} className="text-blue-500" /> Owner
                        </h2>
                        <Link
                            to={`/superadmin/users/${shop.owner.id}`}
                            className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                                <User size={16} className="text-gray-500" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">{shop.owner.name}</p>
                                <p className="text-xs text-gray-400">{shop.owner.email}</p>
                            </div>
                        </Link>
                    </div>

                    {/* Status Control */}
                    {shop.status !== "CLOSED" && (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">Shop Status</h2>
                            <div className="flex items-center gap-3">
                                <select
                                    defaultValue={shop.status}
                                    onChange={e => updateStatus.mutate({ id: shop.id, status: e.target.value })}
                                    disabled={updateStatus.isPending}
                                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="ACTIVE">Active</option>
                                    <option value="PAUSED">Paused</option>
                                    <option value="SUSPENDED">Suspended</option>
                                </select>
                                {updateStatus.isPending && <Loader2 size={18} className="animate-spin text-gray-400" />}
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Suspending a shop prevents customers from viewing or purchasing.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
