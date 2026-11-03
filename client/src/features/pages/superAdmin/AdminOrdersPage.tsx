import React, { useState } from "react";
import { Search, Loader2, ChevronLeft, ChevronRight, ShoppingCart, Eye, X } from "lucide-react";
import { useAdminOrders, useAdminOrderById } from "@/features/admin/admin.hooks";
import { ModalPortal } from "@/components/ui/ds-components";
import { AdminOrderAnalyticsSection, OrderLifecyclePipeline } from "./AdminOrderAnalytics";

const ORDER_STATUSES = ["", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED", "EXPIRED", "REFUND_PENDING"];

const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
    CONFIRMED: { label: "Confirmed", className: "bg-blue-100 text-blue-700" },
    PROCESSING: { label: "Processing", className: "bg-orange-100 text-orange-700" },
    SHIPPED: { label: "Shipped", className: "bg-violet-100 text-violet-700" },
    DELIVERED: { label: "Delivered", className: "bg-emerald-100 text-emerald-700" },
    CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700" },
    REFUNDED: { label: "Refunded", className: "bg-gray-100 text-gray-600" },
    EXPIRED: { label: "Expired", className: "bg-gray-100 text-gray-500" },
    REFUND_PENDING: { label: "Refund Pending", className: "bg-amber-100 text-amber-700" },
    RETURN_REQUESTED: { label: "Return Requested", className: "bg-amber-100 text-amber-700" },
    RETURNED: { label: "Returned", className: "bg-gray-100 text-gray-500" },
};

const OrderStatusBadge = ({ status }: { status: string }) => {
    const cfg = statusConfig[status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.className}`}>
            {cfg.label}
        </span>
    );
};

export const AdminOrdersPage = () => {
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [status, setStatus] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [page, setPage] = useState(1);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    const { data, isLoading, isError } = useAdminOrders({ search, status, dateFrom, dateTo, page, limit: 20 });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(1);
    };

    const resetFilters = () => {
        setSearch("");
        setSearchInput("");
        setStatus("");
        setDateFrom("");
        setDateTo("");
        setPage(1);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ShoppingCart className="size-6 text-orange-600" />
                    All Orders
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    {data ? `${data.total.toLocaleString()} total platform orders` : "Loading..."}
                </p>
            </div>

            {/* ─── ORDER LIFECYCLE PIPELINE (TOP OF THE PAGE) ─── */}
            <OrderLifecyclePipeline
                dateFrom={dateFrom}
                dateTo={dateTo}
                activeStatus={status}
                onSelectStatus={(s) => {
                    setStatus(status === s ? "" : s);
                    setPage(1);
                }}
            />

            {/* Order Analytics Suite */}
            <AdminOrderAnalyticsSection parentDateFrom={dateFrom} parentDateTo={dateTo} />

            {/* Filter Bar */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by customer, email, order ID..."
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

                    {/* Status filter */}
                    <div className="flex gap-2">
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                setPage(1);
                            }}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="">All Statuses</option>
                            {ORDER_STATUSES.filter(Boolean).map((s) => (
                                <option key={s} value={s}>
                                    {statusConfig[s]?.label ?? s}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Date range row */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                    <span className="font-medium text-gray-700">Date range:</span>
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

                    {(search || status || dateFrom || dateTo) && (
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
                    <div className="p-8 text-center text-red-500 text-sm">Failed to load orders.</div>
                ) : !data || data.orders.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <ShoppingCart className="mx-auto size-12 opacity-30 mb-2" />
                        <p className="font-semibold text-gray-600">No orders found</p>
                        <p className="text-xs mt-1">Try adjusting your filters or date range.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">Order ID</th>
                                    <th className="px-5 py-3 font-semibold">Customer</th>
                                    <th className="px-5 py-3 font-semibold">Store</th>
                                    <th className="px-5 py-3 font-semibold">Status</th>
                                    <th className="px-5 py-3 font-semibold">Total</th>
                                    <th className="px-5 py-3 font-semibold">Items</th>
                                    <th className="px-5 py-3 font-semibold">Date</th>
                                    <th className="px-5 py-3 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-3.5 font-mono text-xs text-gray-500">
                                            {order.id.slice(0, 8)}...
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <p className="font-medium text-gray-900">{order.customer.name}</p>
                                            <p className="text-xs text-gray-400">{order.customer.email}</p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="font-medium text-gray-700">
                                                {order.shop.profile?.name ?? order.shop.slug}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <OrderStatusBadge status={order.status} />
                                        </td>
                                        <td className="px-5 py-3.5 font-bold text-orange-600">
                                            ${Number(order.totalAmount).toFixed(2)}
                                        </td>
                                        <td className="px-5 py-3.5 text-gray-500 text-xs">
                                            {order._count.items} {order._count.items === 1 ? "item" : "items"}
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <button
                                                onClick={() => setSelectedOrderId(order.id)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                                            >
                                                <Eye size={12} />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {data && data.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <p className="text-sm text-gray-500">
                            Page {data.page} of {data.totalPages} · {data.total} orders
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                            >
                                <ChevronLeft size={14} />
                                Prev
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                                disabled={page >= data.totalPages}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                            >
                                Next
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Order Detail Modal */}
            {selectedOrderId && (
                <AdminOrderModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
            )}
        </div>
    );
};

// ─── Order Detail Modal ──────────────────────────────────────
const AdminOrderModal = ({ orderId, onClose }: { orderId: string; onClose: () => void }) => {
    const { data: order, isLoading } = useAdminOrderById(orderId);

    return (
        <ModalPortal onClose={onClose}>
            <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
                <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-auto max-h-[90vh] overflow-y-auto border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between p-5 border-b border-gray-100">
                        <h2 className="font-bold text-gray-900">Order Detail</h2>
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer text-slate-400">
                            <X size={18} />
                        </button>
                    </div>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="animate-spin text-orange-500" size={24} />
                        </div>
                    ) : order ? (
                        <div className="p-5 space-y-5">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Order ID</p>
                                    <p className="font-mono text-gray-700">{order.id}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Status</p>
                                    <OrderStatusBadge status={order.status} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Customer</p>
                                    <p className="font-medium text-gray-900">{order.customer.name}</p>
                                    <p className="text-gray-400 text-xs">{order.customer.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Shop</p>
                                    <p className="text-gray-700">{order.shop.profile?.name ?? order.shop.slug}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total</p>
                                    <p className="font-bold text-orange-600 text-lg">${Number(order.totalAmount).toFixed(2)}</p>
                                </div>
                                {Number(order.discountAmount) > 0 && (
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Discount</p>
                                        <p className="text-emerald-600">-${Number(order.discountAmount).toFixed(2)}</p>
                                    </div>
                                )}
                            </div>

                            {/* Items */}
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Items</p>
                                <div className="space-y-2">
                                    {order.items.map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            {item.product.images[0] && (
                                                <img src={item.product.images[0].url} alt={item.product.name} className="size-10 object-cover rounded" />
                                            )}
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                                                {item.variant && <p className="text-xs text-gray-400">{item.variant.name}</p>}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-gray-700">×{item.quantity}</p>
                                                <p className="text-xs text-gray-400">${Number(item.unitPrice).toFixed(2)} ea</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Shipment */}
                            {order.shipment && (
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Shipment</p>
                                    <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                                        <p><span className="text-gray-400">Method:</span> {order.shipment.method}</p>
                                        {order.shipment.carrier && <p><span className="text-gray-400">Carrier:</span> {order.shipment.carrier}</p>}
                                        {order.shipment.trackingNumber && <p><span className="text-gray-400">Tracking:</span> {order.shipment.trackingNumber}</p>}
                                    </div>
                                </div>
                            )}

                            {/* Coupon */}
                            {order.coupon && (
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Coupon Applied</p>
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm">
                                        <span className="font-mono font-bold">{order.coupon.code}</span>
                                        <span className="text-xs text-emerald-500">
                                            {order.coupon.type === "PERCENTAGE" ? `${order.coupon.value}%` : `$${Number(order.coupon.value).toFixed(2)}`} off
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Order not found</div>
                    )}
                </div>
            </div>
        </ModalPortal>
    );
};

export default AdminOrdersPage;
