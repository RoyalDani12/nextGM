import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, User, Store, Mail, Calendar, Shield } from "lucide-react";
import { useAdminUser, useUpdateUserRole, useUpdateUserStatus } from "@/features/admin/admin.hooks";
import { toast } from "react-hot-toast";

const ROLES = ["CUSTOMER", "SHOP_OWNER", "SUPER_ADMIN"];
const STATUSES = ["ACTIVE", "SUSPENDED", "DEACTIVATED"];

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-sm text-gray-800">{value}</p>
    </div>
);

export const AdminUserDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: user, isLoading, isError } = useAdminUser(id!);
    const updateRole = useUpdateUserRole();
    const updateStatus = useUpdateUserStatus();

    if (isLoading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-gray-400" size={28} />
        </div>
    );

    if (isError || !user) return (
        <div className="flex items-center justify-center h-64 text-red-500 text-sm">
            User not found or failed to load.
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
                    <p className="text-sm text-gray-500">{user.email}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
                    <div className="flex items-center gap-4">
                        {user.profile?.avatar ? (
                            <img src={user.profile.avatar} className="w-16 h-16 rounded-full object-cover" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                                <User size={24} className="text-gray-500" />
                            </div>
                        )}
                        <div>
                            <p className="font-semibold text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.role.replace("_", " ")}</p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-gray-50">
                        <Field label="Email" value={user.email} />
                        <Field label="User ID" value={<span className="font-mono text-xs">{user.id}</span>} />
                        <Field label="Joined" value={new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
                        {user.profile?.phone && <Field label="Phone" value={user.profile.phone} />}
                    </div>
                </div>

                {/* Actions */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Role & Status */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Shield size={18} className="text-violet-500" /> Access Control
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-2">Role</label>
                                <select
                                    defaultValue={user.role}
                                    onChange={e => updateRole.mutate({ id: user.id, role: e.target.value })}
                                    disabled={updateRole.isPending}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {ROLES.map(r => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-2">Status</label>
                                <select
                                    defaultValue={user.status}
                                    onChange={e => updateStatus.mutate({ id: user.id, status: e.target.value })}
                                    disabled={updateStatus.isPending}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Owned Shops */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Store size={18} className="text-emerald-500" /> Owned Shops ({user.ownedShops?.length ?? 0})
                        </h2>
                        {!user.ownedShops?.length ? (
                            <p className="text-sm text-gray-400">No shops owned.</p>
                        ) : (
                            <div className="space-y-3">
                                {user.ownedShops.map((shop: any) => (
                                    <Link
                                        key={shop.id}
                                        to={`/superadmin/shops/${shop.id}`}
                                        className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                                <Store size={14} className="text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{shop.profile?.name || shop.slug}</p>
                                                <p className="text-xs text-gray-400">/{shop.slug}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                            shop.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                                        }`}>{shop.status}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
