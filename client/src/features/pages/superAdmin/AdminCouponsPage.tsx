import React, { useState } from "react";
import { Search, Loader2, ChevronLeft, ChevronRight, Ticket, CheckCircle2, XCircle, Store, Percent, DollarSign } from "lucide-react";
import { useAdminCoupons, useToggleCoupon } from "@/features/admin/admin.hooks";

export const AdminCouponsPage = () => {
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [isActive, setIsActive] = useState<string>("");
    const [page, setPage] = useState(1);

    const { data, isLoading, isError } = useAdminCoupons({
        search,
        isActive: isActive === "" ? undefined : isActive === "true",
        page,
        limit: 20,
    });

    const toggleCoupon = useToggleCoupon();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(1);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Ticket className="size-6 text-orange-600" />
                    Platform Coupons
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Manage and moderate discount coupons across all stores
                </p>
            </div>

            {/* Stat Cards */}
            {data?.stats && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Total Coupons</p>
                        <p className="text-2xl font-bold text-gray-900">{data.stats.total.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">Active Coupons</p>
                        <p className="text-2xl font-bold text-emerald-600">{data.stats.active.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <p className="text-xs text-red-500 font-semibold uppercase tracking-wider mb-1">Expired / Inactive</p>
                        <p className="text-2xl font-bold text-red-500">{data.stats.expired.toLocaleString()}</p>
                    </div>
                </div>
            )}

            {/* Filter Bar */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
                <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by coupon code..."
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

                <div className="flex gap-2">
                    <select
                        value={isActive}
                        onChange={(e) => {
                            setIsActive(e.target.value);
                            setPage(1);
                        }}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="">All Statuses</option>
                        <option value="true">Active Only</option>
                        <option value="false">Inactive / Expired</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin text-orange-500" size={32} />
                    </div>
                ) : isError ? (
                    <div className="p-8 text-center text-red-500 text-sm">Failed to load coupons.</div>
                ) : !data || data.coupons.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <Ticket className="mx-auto size-12 opacity-30 mb-2" />
                        <p className="font-semibold text-gray-600">No coupons found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">Code</th>
                                    <th className="px-5 py-3 font-semibold">Store</th>
                                    <th className="px-5 py-3 font-semibold">Discount</th>
                                    <th className="px-5 py-3 font-semibold">Min Order</th>
                                    <th className="px-5 py-3 font-semibold">Usage</th>
                                    <th className="px-5 py-3 font-semibold">Expires</th>
                                    <th className="px-5 py-3 font-semibold">Status</th>
                                    <th className="px-5 py-3 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.coupons.map((coupon) => {
                                    const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                                    return (
                                        <tr key={coupon.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-3.5 whitespace-nowrap font-mono font-bold text-gray-900">
                                                <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-200">
                                                    {coupon.code}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Store size={14} className="text-gray-400" />
                                                    <span className="font-medium text-gray-900">
                                                        {coupon.shop?.profile?.name || coupon.shop?.slug}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1 font-semibold text-gray-800">
                                                    {coupon.type === "PERCENTAGE" ? (
                                                        <>
                                                            <Percent size={13} className="text-orange-500" />
                                                            {Number(coupon.value)}% off
                                                        </>
                                                    ) : (
                                                        <>
                                                            <DollarSign size={13} className="text-emerald-500" />
                                                            ${Number(coupon.value).toFixed(2)} off
                                                        </>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap text-gray-500">
                                                {coupon.minOrderAmount ? `$${Number(coupon.minOrderAmount).toFixed(2)}` : "None"}
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">
                                                <span className="font-semibold text-gray-900">{coupon.usedCount}</span>
                                                {coupon.maxUses ? ` / ${coupon.maxUses}` : " (unlimited)"}
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap text-xs text-gray-500">
                                                {coupon.expiresAt ? (
                                                    <span className={isExpired ? "text-red-500 font-semibold" : ""}>
                                                        {new Date(coupon.expiresAt).toLocaleDateString()}
                                                        {isExpired && " (Expired)"}
                                                    </span>
                                                ) : (
                                                    "Never"
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                {coupon.isActive && !isExpired ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-700">
                                                        <CheckCircle2 size={12} /> Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600">
                                                        <XCircle size={12} /> Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap text-right">
                                                <button
                                                    onClick={() => toggleCoupon.mutate(coupon.id)}
                                                    disabled={toggleCoupon.isPending}
                                                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                                                        coupon.isActive
                                                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                                                            : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                                    }`}
                                                >
                                                    {coupon.isActive ? "Deactivate" : "Activate"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {data && data.totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                            Page {data.page} of {data.totalPages} · {data.total.toLocaleString()} total coupons
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
        </div>
    );
};
