import React, { useState } from "react";
import { Search, Loader2, ChevronLeft, ChevronRight, Shield, Calendar, Database } from "lucide-react";
import { useAdminAuditLogs } from "@/features/admin/admin.hooks";
import { ModalPortal } from "@/components/ui/ds-components";

const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
    CREATE: { bg: "bg-emerald-100", text: "text-emerald-700" },
    UPDATE: { bg: "bg-amber-100", text: "text-amber-700" },
    DELETE: { bg: "bg-red-100", text: "text-red-700" },
    LOGIN: { bg: "bg-blue-100", text: "text-blue-700" },
    LOGOUT: { bg: "bg-gray-100", text: "text-gray-700" },
    REFUND: { bg: "bg-purple-100", text: "text-purple-700" },
    STATUS_CHANGE: { bg: "bg-orange-100", text: "text-orange-700" },
};

const ActionBadge = ({ action }: { action: string }) => {
    const style = ACTION_COLORS[action] ?? { bg: "bg-gray-100", text: "text-gray-600" };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${style.bg} ${style.text}`}>
            {action}
        </span>
    );
};

export const AdminAuditsPage = () => {
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [entity, setEntity] = useState("");
    const [action, setAction] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [page, setPage] = useState(1);
    const [selectedLog, setSelectedLog] = useState<any | null>(null);

    const { data, isLoading, isError } = useAdminAuditLogs({
        search,
        entity,
        action,
        dateFrom,
        dateTo,
        page,
        limit: 25,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(1);
    };

    const resetFilters = () => {
        setSearch("");
        setSearchInput("");
        setEntity("");
        setAction("");
        setDateFrom("");
        setDateTo("");
        setPage(1);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="size-6 text-orange-600" />
                    Security & Audit Logs
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    {data ? `${data.total.toLocaleString()} total platform audit records` : "Track security events and administrative actions"}
                </p>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                    <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by email, action, entity ID..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shrink-0"
                        >
                            Search
                        </button>
                    </form>

                    <div className="flex flex-wrap gap-2">
                        <select
                            value={entity}
                            onChange={(e) => {
                                setEntity(e.target.value);
                                setPage(1);
                            }}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="">All Entities</option>
                            <option value="USER">User</option>
                            <option value="SHOP">Shop</option>
                            <option value="ORDER">Order</option>
                            <option value="PRODUCT">Product</option>
                            <option value="RETURN">Return</option>
                            <option value="COUPON">Coupon</option>
                            <option value="AUTH">Auth / Session</option>
                        </select>

                        <select
                            value={action}
                            onChange={(e) => {
                                setAction(e.target.value);
                                setPage(1);
                            }}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="">All Actions</option>
                            <option value="CREATE">Create</option>
                            <option value="UPDATE">Update</option>
                            <option value="DELETE">Delete</option>
                            <option value="LOGIN">Login</option>
                            <option value="STATUS_CHANGE">Status Change</option>
                            <option value="REFUND">Refund</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                    <span className="flex items-center gap-1 font-medium text-gray-700">
                        <Calendar size={13} />
                        Date range:
                    </span>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => {
                            setDateFrom(e.target.value);
                            setPage(1);
                        }}
                        className="border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-orange-500"
                    />
                    <span>to</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => {
                            setDateTo(e.target.value);
                            setPage(1);
                        }}
                        className="border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-orange-500"
                    />

                    {(search || entity || action || dateFrom || dateTo) && (
                        <button
                            onClick={resetFilters}
                            className="ml-auto text-xs text-orange-600 hover:text-orange-700 font-semibold underline"
                        >
                            Reset filters
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin text-orange-500" size={32} />
                    </div>
                ) : isError ? (
                    <div className="p-8 text-center text-red-500 text-sm">Failed to load audit logs.</div>
                ) : !data || data.logs.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <Shield className="mx-auto size-12 opacity-30 mb-2" />
                        <p className="font-semibold text-gray-600">No audit records found</p>
                        <p className="text-xs mt-1">Try adjusting your filters or date range.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">Timestamp</th>
                                    <th className="px-5 py-3 font-semibold">User / Actor</th>
                                    <th className="px-5 py-3 font-semibold">Action</th>
                                    <th className="px-5 py-3 font-semibold">Entity</th>
                                    <th className="px-5 py-3 font-semibold">Entity ID</th>
                                    <th className="px-5 py-3 font-semibold">IP Address</th>
                                    <th className="px-5 py-3 font-semibold text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-3.5 whitespace-nowrap text-xs text-gray-500 font-mono">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {log.user ? (
                                                <div>
                                                    <p className="font-medium text-gray-900">{log.user.name}</p>
                                                    <p className="text-xs text-gray-400">{log.user.email}</p>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">System</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 whitespace-nowrap">
                                            <ActionBadge action={log.action} />
                                        </td>
                                        <td className="px-5 py-3.5 whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                                <Database size={11} className="text-gray-400" />
                                                {log.entity}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs text-gray-500">
                                            {log.entityId ? `${log.entityId.slice(0, 12)}...` : "—"}
                                        </td>
                                        <td className="px-5 py-3.5 whitespace-nowrap text-xs text-gray-500 font-mono">
                                            {log.ip || "—"}
                                        </td>
                                        <td className="px-5 py-3.5 whitespace-nowrap text-right">
                                            {(log.oldValue || log.newValue) && (
                                                <button
                                                    onClick={() => setSelectedLog(log)}
                                                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 underline"
                                                >
                                                    View diff
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {data && data.totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                            Page {data.page} of {data.totalPages} · {data.total.toLocaleString()} total entries
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="flex items-center gap-1 px-3 py-1 text-xs font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                            >
                                <ChevronLeft size={13} />
                                Prev
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                                disabled={page >= data.totalPages}
                                className="flex items-center gap-1 px-3 py-1 text-xs font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                            >
                                Next
                                <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Diff Modal */}
            {selectedLog && (
                <ModalPortal onClose={() => setSelectedLog(null)}>
                    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setSelectedLog(null); }}>
                        <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 space-y-4 border border-slate-100 my-auto animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <h3 className="font-bold text-gray-900">Audit Change Details</h3>
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="space-y-3 text-xs">
                                <div>
                                    <p className="font-semibold text-gray-600 mb-1">Previous State:</p>
                                    <pre className="p-3 bg-gray-50 rounded-lg border border-gray-100 overflow-x-auto text-gray-700 font-mono">
                                        {selectedLog.oldValue ? JSON.stringify(selectedLog.oldValue, null, 2) : "null"}
                                    </pre>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-600 mb-1">New State:</p>
                                    <pre className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 overflow-x-auto text-emerald-800 font-mono">
                                        {selectedLog.newValue ? JSON.stringify(selectedLog.newValue, null, 2) : "null"}
                                    </pre>
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="px-4 py-2 text-xs font-semibold bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
};
