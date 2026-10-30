import React, { useState } from "react";
import {
    Search,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Package,
    Store,
    ExternalLink,
    Eye,
    ShieldAlert,
    CheckCircle2,
    XCircle,
    Archive,
    X,
    Layers,
    Tag,
} from "lucide-react";
import { useAdminProducts, useAdminProductById, useUpdateProductStatus } from "@/features/admin/admin.hooks";
import { ModalPortal } from "@/components/ui/ds-components";
import type { AdminProduct } from "@/features/admin/admin.api";

const statusConfig: Record<string, { label: string; badge: string; border: string }> = {
    ACTIVE: { label: "Active (Published)", badge: "bg-emerald-100 text-emerald-700", border: "border-emerald-200" },
    DRAFT: { label: "Draft", badge: "bg-yellow-100 text-yellow-800", border: "border-yellow-200" },
    ARCHIVED: { label: "Archived / Delisted", badge: "bg-red-100 text-red-700", border: "border-red-200" },
};

const ProductStatusBadge = ({ status }: { status: string }) => {
    const cfg = statusConfig[status] ?? { label: status, badge: "bg-gray-100 text-gray-700", border: "border-gray-200" };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.badge}`}>
            {cfg.label}
        </span>
    );
};

export const AdminProductsPage = () => {
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [status, setStatus] = useState("");
    const [inStock, setInStock] = useState<string>("");
    const [page, setPage] = useState(1);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

    const { data, isLoading, isError } = useAdminProducts({
        search,
        status: status || undefined,
        inStock: inStock === "" ? undefined : inStock === "true",
        page,
        limit: 20,
    });

    const updateStatus = useUpdateProductStatus();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(1);
    };

    const resetFilters = () => {
        setSearch("");
        setSearchInput("");
        setStatus("");
        setInStock("");
        setPage(1);
    };

    const handleQuickStatusChange = (product: AdminProduct, newStatus: "ACTIVE" | "ARCHIVED") => {
        const actionLabel = newStatus === "ARCHIVED" ? "delist and take down" : "publish and activate";
        if (window.confirm(`Are you sure you want to ${actionLabel} "${product.name}"?`)) {
            updateStatus.mutate({ id: product.id, status: newStatus });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Package className="size-6 text-orange-600" />
                    Product Catalog & Moderation
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Inspect, moderate, and manage all merchant products listed across the platform
                </p>
            </div>

            {/* Stat Cards */}
            {data?.stats && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Total Products</p>
                        <p className="text-2xl font-bold text-gray-900">{data.stats.total.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">Active</p>
                        <p className="text-2xl font-bold text-emerald-600">{data.stats.active.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <p className="text-xs text-yellow-700 font-semibold uppercase tracking-wider mb-1">Drafts</p>
                        <p className="text-2xl font-bold text-yellow-700">{data.stats.draft.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <p className="text-xs text-red-600 font-semibold uppercase tracking-wider mb-1">Archived / Delisted</p>
                        <p className="text-2xl font-bold text-red-600">{data.stats.archived.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider mb-1">Out of Stock</p>
                        <p className="text-2xl font-bold text-amber-600">{data.stats.outOfStock.toLocaleString()}</p>
                    </div>
                </div>
            )}

            {/* Filter Bar */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                    <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by product title, SKU, shop name..."
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
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                setPage(1);
                            }}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="">All Statuses</option>
                            <option value="ACTIVE">Active (Published)</option>
                            <option value="DRAFT">Draft</option>
                            <option value="ARCHIVED">Archived / Delisted</option>
                        </select>

                        <select
                            value={inStock}
                            onChange={(e) => {
                                setInStock(e.target.value);
                                setPage(1);
                            }}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="">All Inventory</option>
                            <option value="true">In Stock Only</option>
                            <option value="false">Out of Stock Only</option>
                        </select>

                        {(search || status || inStock) && (
                            <button
                                onClick={resetFilters}
                                className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin text-orange-500" size={32} />
                    </div>
                ) : isError ? (
                    <div className="p-8 text-center text-red-500 text-sm">Failed to load product catalog.</div>
                ) : !data || data.products.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <Package className="mx-auto size-12 opacity-30 mb-2" />
                        <p className="font-semibold text-gray-600">No products found</p>
                        <p className="text-xs mt-1">Try adjusting your search criteria or status filter.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">Product</th>
                                    <th className="px-5 py-3 font-semibold">Store / Merchant</th>
                                    <th className="px-5 py-3 font-semibold">Category</th>
                                    <th className="px-5 py-3 font-semibold">Price & Stock</th>
                                    <th className="px-5 py-3 font-semibold">Status</th>
                                    <th className="px-5 py-3 font-semibold text-right">Moderation Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.products.map((product) => {
                                    const primaryImg = product.images.find((i) => i.isPrimary) || product.images[0];
                                    const isOutOfStock = product.stock <= 0;
                                    const isLowStock = product.stock > 0 && product.stock <= 5;

                                    return (
                                        <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                                            {/* Product Column */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                                                        {primaryImg ? (
                                                            <img
                                                                src={primaryImg.url}
                                                                alt={product.name}
                                                                className="size-full object-cover"
                                                            />
                                                        ) : (
                                                            <Package size={20} className="text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 max-w-xs">
                                                        <p className="font-semibold text-gray-900 truncate" title={product.name}>
                                                            {product.name}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            {product.sku && (
                                                                <span className="font-mono text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                                    SKU: {product.sku}
                                                                </span>
                                                            )}
                                                            {product._count.variants > 0 && (
                                                                <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                                                                    <Layers size={10} /> {product._count.variants} variants
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Store Column */}
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Store size={14} className="text-gray-400 shrink-0" />
                                                    <div>
                                                        <p className="font-medium text-gray-900 text-xs">
                                                            {product.shop.profile?.name || product.shop.slug}
                                                        </p>
                                                        <p className="text-[11px] text-gray-400">{product.shop.owner.email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Category Column */}
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                {product.platformCategory ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">
                                                        <Tag size={11} className="text-gray-400" />
                                                        {product.platformCategory.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>

                                            {/* Price & Stock Column */}
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <p className="font-bold text-gray-900">
                                                    ${Number(product.basePrice).toFixed(2)}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    {isOutOfStock ? (
                                                        <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                                            Out of stock
                                                        </span>
                                                    ) : isLowStock ? (
                                                        <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                                            Only {product.stock} left
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] text-gray-500">
                                                            {product.stock} in stock
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status Column */}
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <ProductStatusBadge status={product.status} />
                                            </td>

                                            {/* Action Column */}
                                            <td className="px-5 py-3.5 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* Storefront Link */}
                                                    <a
                                                        href={`/${product.shop.slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="View storefront"
                                                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                        <ExternalLink size={14} />
                                                    </a>

                                                    {/* Inspect Modal Button */}
                                                    <button
                                                        onClick={() => setSelectedProductId(product.id)}
                                                        title="Inspect full details"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                                    >
                                                        <Eye size={12} />
                                                        Details
                                                    </button>

                                                    {/* Moderation Toggle */}
                                                    {product.status === "ACTIVE" ? (
                                                        <button
                                                            onClick={() => handleQuickStatusChange(product, "ARCHIVED")}
                                                            disabled={updateStatus.isPending}
                                                            title="Takedown / Delist product from marketplace"
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                        >
                                                            <Archive size={12} />
                                                            Delist
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleQuickStatusChange(product, "ACTIVE")}
                                                            disabled={updateStatus.isPending}
                                                            title="Publish / Restore product to marketplace"
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                                                        >
                                                            <CheckCircle2 size={12} />
                                                            Publish
                                                        </button>
                                                    )}
                                                </div>
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
                            Page {data.page} of {data.totalPages} · {data.total.toLocaleString()} total products
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

            {/* Product Inspection Modal */}
            {selectedProductId && (
                <AdminProductDetailModal
                    productId={selectedProductId}
                    onClose={() => setSelectedProductId(null)}
                />
            )}
        </div>
    );
};

// ─── Product Inspection Modal ──────────────────────────────────────
const AdminProductDetailModal = ({
    productId,
    onClose,
}: {
    productId: string;
    onClose: () => void;
}) => {
    const { data: product, isLoading } = useAdminProductById(productId);
    const updateStatus = useUpdateProductStatus();

    const handleStatusUpdate = (newStatus: "ACTIVE" | "DRAFT" | "ARCHIVED") => {
        if (product) {
            updateStatus.mutate({ id: product.id, status: newStatus });
        }
    };

    return (
        <ModalPortal onClose={onClose}>
            <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
                <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full my-auto max-h-[92vh] overflow-y-auto border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
                        <div className="flex items-center gap-3">
                            <h2 className="font-bold text-gray-900 text-lg">Product Moderation Inspect</h2>
                            {product && <ProductStatusBadge status={product.status} />}
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer text-slate-400">
                            <X size={18} />
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="animate-spin text-orange-500" size={32} />
                        </div>
                    ) : product ? (
                        <div className="p-6 space-y-6 text-sm">
                            {/* Gallery */}
                            {product.images && product.images.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                        Product Images ({product.images.length})
                                    </p>
                                    <div className="flex gap-3 overflow-x-auto pb-2">
                                        {product.images.map((img: any, idx: number) => (
                                            <div
                                                key={img.id || idx}
                                                className="size-24 rounded-xl border border-gray-200 overflow-hidden shrink-0 relative"
                                            >
                                                <img src={img.url} alt="" className="size-full object-cover" />
                                                {img.isPrimary && (
                                                    <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                                                        Primary
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Core Details Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-semibold">Title</p>
                                    <p className="font-semibold text-gray-900 mt-0.5">{product.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-semibold">Base Price</p>
                                    <p className="font-bold text-orange-600 text-base mt-0.5">
                                        ${Number(product.basePrice).toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-semibold">Stock Quantity</p>
                                    <p className="font-semibold text-gray-900 mt-0.5">{product.stock} units</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-semibold">SKU</p>
                                    <p className="font-mono text-xs text-gray-700 mt-0.5">{product.sku || "None"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-semibold">Storefront</p>
                                    <p className="font-semibold text-gray-900 mt-0.5">
                                        {product.shop?.profile?.name || product.shop?.slug}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-semibold">Platform Category</p>
                                    <p className="text-gray-700 mt-0.5">{product.platformCategory?.name || "Uncategorized"}</p>
                                </div>
                            </div>

                            {/* Description */}
                            {product.description && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                                        Description
                                    </p>
                                    <p className="text-gray-700 bg-gray-50 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                                        {product.description}
                                    </p>
                                </div>
                            )}

                            {/* Variants */}
                            {product.variants && product.variants.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                        Variants ({product.variants.length})
                                    </p>
                                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                                                <tr>
                                                    <th className="px-4 py-2 font-semibold">Variant Name</th>
                                                    <th className="px-4 py-2 font-semibold">SKU</th>
                                                    <th className="px-4 py-2 font-semibold">Price</th>
                                                    <th className="px-4 py-2 font-semibold">Stock</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {product.variants.map((v: any) => (
                                                    <tr key={v.id}>
                                                        <td className="px-4 py-2 font-medium text-gray-900">{v.name}</td>
                                                        <td className="px-4 py-2 font-mono text-gray-500">{v.sku || "—"}</td>
                                                        <td className="px-4 py-2 font-semibold text-gray-900">${Number(v.price).toFixed(2)}</td>
                                                        <td className="px-4 py-2 text-gray-700">{v.stock}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Moderation Controls Box */}
                            <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100 space-y-3">
                                <div className="flex items-center gap-2">
                                    <ShieldAlert size={18} className="text-orange-600" />
                                    <h3 className="font-bold text-gray-900">Administrator Moderation Action</h3>
                                </div>
                                <p className="text-xs text-gray-600">
                                    Delisting a product immediately removes it from storefront searches and customer carts.
                                    You can restore it to Active once cleared.
                                </p>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    <button
                                        onClick={() => handleStatusUpdate("ACTIVE")}
                                        disabled={product.status === "ACTIVE" || updateStatus.isPending}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors cursor-pointer"
                                    >
                                        <CheckCircle2 size={13} />
                                        Publish (Active)
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate("DRAFT")}
                                        disabled={product.status === "DRAFT" || updateStatus.isPending}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-40 transition-colors cursor-pointer"
                                    >
                                        <XCircle size={13} />
                                        Set to Draft
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate("ARCHIVED")}
                                        disabled={product.status === "ARCHIVED" || updateStatus.isPending}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 transition-colors cursor-pointer"
                                    >
                                        <Archive size={13} />
                                        Delist / Take Down (Archived)
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-400 text-sm">Product not found.</div>
                    )}
                </div>
            </div>
        </ModalPortal>
    );
};

export default AdminProductsPage;
