import { Plus, Search, X, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { type PaginationMeta } from "@/features/product/product.types";

export function ProductPageHeader({
  onAdd,
  total,
}: {
  onAdd: () => void;
  total?: number;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Products & Inventory</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {total !== undefined ? `${total} products · ` : ""}Catalog, stock levels, and pricing
        </p>
      </div>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
      >
        <Plus size={13} />
        <span>Add product</span>
      </button>
    </div>
  );
}

export function ProductPageStats({
  products = [],
  total = 0,
}: {
  products: any[];
  total: number;
}) {
  const physical = products.filter((p) => p.type === "PHYSICAL").length;
  const digital = products.filter((p) => p.type === "DIGITAL").length;
  const inStock = products.filter((p) => Number(p.stock) > 0).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5">
        <p className="text-xs text-slate-500 font-medium">Total products</p>
        <p className="text-xl font-semibold text-slate-900 mt-1 tabular-nums">{total}</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5">
        <p className="text-xs text-slate-500 font-medium">In stock</p>
        <p className="text-xl font-semibold text-slate-900 mt-1 tabular-nums">{inStock}</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5">
        <p className="text-xs text-slate-500 font-medium">Physical items</p>
        <p className="text-xl font-semibold text-slate-900 mt-1 tabular-nums">{physical}</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5">
        <p className="text-xs text-slate-500 font-medium">Digital downloads</p>
        <p className="text-xl font-semibold text-slate-900 mt-1 tabular-nums">{digital}</p>
      </div>
    </div>
  );
}

export function ProductSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative flex-1">
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search products by title, SKU, or tags…"
        className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all placeholder:text-slate-400"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

interface ProductPaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  isFetching?: boolean;
}

export function ProductPagination({
  pagination,
  onPageChange,
  isFetching = false,
}: ProductPaginationProps) {
  const { total, page, limit, totalPages, hasNextPage, hasPrevPage } = pagination;

  const startCount = total === 0 ? 0 : (page - 1) * limit + 1;
  const endCount = Math.min(page * limit, total);

  if (total === 0 || totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between text-xs text-slate-500 py-1">
      <span>
        {startCount}–{endCount} of {total} products
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage || isFetching}
          className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer transition-colors"
          title="Previous page"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="px-2 font-medium text-slate-700">
          {page} of {totalPages || 1}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage || isFetching}
          className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer transition-colors"
          title="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export function EmptyProducts({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="py-16 text-center bg-white border border-slate-200 rounded-lg">
      <Package size={32} className="mx-auto text-slate-300 mb-2" />
      <p className="text-sm font-medium text-slate-700">No products yet</p>
      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
        Get started by adding your first product to your storefront catalog.
      </p>
      <button
        onClick={onAdd}
        className="mt-4 px-3.5 py-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
      >
        <Plus size={13} />
        <span>Add product</span>
      </button>
    </div>
  );
}

export function ProductsLoading() {
  return (
    <div className="space-y-4 max-w-[1200px] animate-pulse">
      <div className="h-6 w-48 rounded bg-slate-200" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-slate-100 border border-slate-200" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-64 rounded-lg bg-slate-100 border border-slate-200" />
        ))}
      </div>
    </div>
  );
}
