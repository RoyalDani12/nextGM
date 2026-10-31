import { Package, Plus, Search, ChevronLeft, ChevronRight, Layers, CheckCircle2, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type PaginationMeta } from "@/features/product/product.types";

export function ProductPageHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div className="flex items-center gap-3.5">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-sm shadow-orange-500/25">
          <Package className="size-5.5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products & Inventory</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage your catalog, variants, pricing, and stock levels.</p>
        </div>
      </div>
      <Button
        onClick={onAdd}
        className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl font-bold h-10 px-5 shadow-sm shadow-orange-500/20 transition-all hover:shadow-orange-500/35 hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer text-xs"
      >
        <Plus className="size-4" />
        <span>Add New Product</span>
      </Button>
    </div>
  );
}

export function ProductPageStats({ products = [], total = 0 }: { products: any[]; total: number }) {
  const physical = products.filter((p) => p.type === "PHYSICAL").length;
  const digital = products.filter((p) => p.type === "DIGITAL").length;
  const inStock = products.filter((p) => Number(p.stock) > 0).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      <StatCard label="Total Catalog" value={total} icon={Package} color="orange" />
      <StatCard label="Physical Goods" value={physical} icon={Box} color="blue" />
      <StatCard label="Digital Products" value={digital} icon={Layers} color="purple" />
      <StatCard label="In Stock Items" value={inStock} icon={CheckCircle2} color="emerald" />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: "orange" | "blue" | "purple" | "emerald" }) {
  const colorMap = {
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-sm transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <div className={`p-2 rounded-xl border ${colorMap[color]}`}>
          <Icon className="size-4" />
        </div>
      </div>
      <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
    </div>
  );
}

export function ProductSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs mb-6">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search catalog by title, SKU, tags or description..."
          className="pl-10 h-10 bg-slate-50/70 border-slate-200/80 focus-visible:bg-white focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-500/20 rounded-xl text-xs font-medium transition-all"
        />
      </div>
    </div>
  );
}

/* SERVER-SIDE PAGINATION CONTROLS */
interface ProductPaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  isFetching?: boolean;
}

export function ProductPagination({
  pagination,
  onPageChange,
  onLimitChange,
  isFetching = false,
}: ProductPaginationProps) {
  const { total, page, limit, totalPages, hasNextPage, hasPrevPage } = pagination;

  const startCount = total === 0 ? 0 : (page - 1) * limit + 1;
  const endCount = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200/80 pt-5 mt-6">
      {/* RANGE & TOTAL INFO */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
        <span>
          Showing <strong className="text-slate-900 font-bold">{startCount}</strong> to{" "}
          <strong className="text-slate-900 font-bold">{endCount}</strong> of{" "}
          <strong className="text-slate-900 font-bold">{total}</strong> products
        </span>

        {/* PAGE SIZE SELECTOR */}
        <div className="flex items-center gap-2 ml-2">
          <span className="text-[11px] text-slate-400">Per page:</span>
          <Select value={String(limit)} onValueChange={(val) => onLimitChange(Number(val))}>
            <SelectTrigger className="h-8 w-[72px] text-xs font-semibold rounded-lg border-slate-200 bg-white">
              <SelectValue placeholder={String(limit)} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 shadow-xl bg-white">
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage || isFetching}
          className="h-8 px-3 text-xs font-semibold rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 gap-1 cursor-pointer disabled:opacity-40"
        >
          <ChevronLeft className="size-3.5" /> Previous
        </Button>

        {/* NUMERIC INDICATOR */}
        <div className="flex items-center gap-1 px-2.5 text-xs font-bold text-slate-800">
          <span>{page}</span>
          <span className="text-slate-400 font-normal">/</span>
          <span className="text-slate-400 font-normal">{totalPages || 1}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage || isFetching}
          className="h-8 px-3 text-xs font-semibold rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 gap-1 cursor-pointer disabled:opacity-40"
        >
          Next <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function EmptyProducts({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-2xs">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
        <Package className="size-7" />
      </div>
      <h3 className="mt-4 text-base font-bold text-slate-900">No products in your catalog yet</h3>
      <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
        Start selling on Nexions by publishing your first physical item or digital download.
      </p>
      <Button
        onClick={onAdd}
        className="mt-6 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl font-bold h-10 px-5 shadow-sm shadow-orange-500/20 text-xs inline-flex items-center gap-2 cursor-pointer"
      >
        <Plus className="size-4" />
        Add Your First Product
      </Button>
    </div>
  );
}

export function ProductsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-40 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-4 w-72 animate-pulse rounded-lg bg-slate-100" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="aspect-[4/3] rounded-xl bg-slate-100 animate-pulse" />
            <div className="h-4 w-3/4 bg-slate-100 animate-pulse rounded" />
            <div className="h-3 w-1/2 bg-slate-100 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
