import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, ChevronLeft, ChevronRight, User } from "lucide-react";
import { useAdminUsers, useUpdateUserStatus } from "@/features/admin/admin.hooks";

const ROLES = ["", "CUSTOMER", "SHOP_OWNER", "SUPER_ADMIN"];
const STATUSES = ["", "ACTIVE", "PENDING", "SUSPENDED", "DEACTIVATED"];

const RoleBadge = ({ role }: { role: string }) => {
    const colors: Record<string, string> = {
        SUPER_ADMIN: "bg-violet-100 text-violet-700",
        SHOP_OWNER: "bg-blue-100 text-blue-700",
        CUSTOMER: "bg-gray-100 text-gray-600",
        SHOP_EMPLOYEE: "bg-amber-100 text-amber-700",
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[role] ?? "bg-gray-100 text-gray-600"}`}>
            {role.replace("_", " ")}
        </span>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
        ACTIVE: "bg-emerald-100 text-emerald-700",
        PENDING: "bg-yellow-100 text-yellow-700",
        SUSPENDED: "bg-red-100 text-red-700",
        DEACTIVATED: "bg-gray-100 text-gray-500",
        DELETED: "bg-red-200 text-red-800",
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? "bg-gray-100 text-gray-600"}`}>
            {status}
        </span>
    );
};

export const AdminUsersPage = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [role, setRole] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);

    const { data, isLoading, isError } = useAdminUsers({ search, role, status, page, limit: 20 });
    const updateStatus = useUpdateUserStatus();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(1);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Users</h1>
                <p className="text-sm text-gray-500 mt-1">
                    {data ? `${data.total.toLocaleString()} total users` : "Loading..."}
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
                <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search name or email..."
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button type="submit" className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors">
                        Search
                    </button>
                </form>
                <select
                    value={role}
                    onChange={e => { setRole(e.target.value); setPage(1); }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {ROLES.map(r => <option key={r} value={r}>{r || "All Roles"}</option>)}
                </select>
                <select
                    value={status}
                    onChange={e => { setStatus(e.target.value); setPage(1); }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {STATUSES.map(s => <option key={s} value={s}>{s || "All Statuses"}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="animate-spin text-gray-400" size={28} />
                    </div>
                ) : isError ? (
                    <div className="flex items-center justify-center h-48 text-red-500 text-sm">Failed to load users.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3 font-medium">User</th>
                                    <th className="px-6 py-3 font-medium">Role</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium">Shops</th>
                                    <th className="px-6 py-3 font-medium">Joined</th>
                                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data?.users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {user.profile?.avatar ? (
                                                    <img src={user.profile.avatar} className="w-8 h-8 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                        <User size={14} className="text-gray-500" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-gray-900">{user.name}</p>
                                                    <p className="text-xs text-gray-400">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><RoleBadge role={user.role} /></td>
                                        <td className="px-6 py-4"><StatusBadge status={user.status} /></td>
                                        <td className="px-6 py-4 text-gray-500">{user.ownedShops.length}</td>
                                        <td className="px-6 py-4 text-gray-400 text-xs">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/superadmin/users/${user.id}`)}
                                                    className="text-xs px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    View
                                                </button>
                                                <select
                                                    value={user.status}
                                                    onChange={e => updateStatus.mutate({ id: user.id, status: e.target.value })}
                                                    disabled={updateStatus.isPending}
                                                    className="text-xs px-2 py-1 border border-gray-200 rounded-lg focus:outline-none"
                                                >
                                                    <option value="ACTIVE">Active</option>
                                                    <option value="SUSPENDED">Suspended</option>
                                                    <option value="DEACTIVATED">Deactivated</option>
                                                </select>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {data?.users.length === 0 && (
                                    <tr><td colSpan={6} className="text-center py-12 text-gray-400">No users found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {data && data.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm">
                        <p className="text-gray-500">
                            Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, data.total)} of {data.total}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-gray-600">Page {page} of {data.totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                                disabled={page === data.totalPages}
                                className="p-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
