import { useState } from "react";
import { BadgeCheck, Check, PackageCheck, RotateCcw, SlidersHorizontal, Star } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { MarketplaceCategory } from "../marketplace.api";
import { activeFilterCount, sortOptions, type CatalogFilters } from "./marketplace.filters";
import { CategoryFilterPanel } from "./CategoryFilterPanel";

type Props = {
  categories: MarketplaceCategory[];
  filters: CatalogFilters;
  total: number;
  onChange: (filters: CatalogFilters) => void;
  onReset: () => void;
};

export function MobileFilterSheet({
  categories,
  filters,
  total,
  onChange,
  onReset,
}: Props) {
  const [open, setOpen] = useState(false);
  const count = activeFilterCount(filters);

  const apply = () => setOpen(false);

  return (
    <div className="fixed inset-x-0 bottom-5 z-40 px-4 lg:hidden pointer-events-none flex justify-center">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="pointer-events-auto flex min-h-12 items-center gap-2.5 rounded-full bg-slate-900 px-6 text-sm font-bold text-white shadow-2xl hover:bg-slate-800 active:scale-95 transition-all border border-slate-700/50 backdrop-blur-md">
          <SlidersHorizontal className="size-4 text-orange-400" />
          <span>Filters & Sort</span>
          {count > 0 && (
            <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-black text-white shadow-xs">
              {count}
            </span>
          )}
        </SheetTrigger>

        <SheetContent
          side="bottom"
          className="max-h-[90vh] rounded-t-3xl border-slate-200 bg-white p-0 shadow-2xl overflow-hidden font-sans transition-transform duration-300 ease-out"
        >
          {/* Header */}
          <SheetHeader className="border-b border-slate-100 px-5 py-4 flex flex-row items-center justify-between">
            <div>
              <SheetTitle className="text-left text-base font-black text-slate-900">
                Refine Results
              </SheetTitle>
              <p className="text-xs text-slate-500 font-medium text-left">
                {total} products found
              </p>
            </div>
            {count > 0 && (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 border border-orange-200/80 hover:bg-orange-100 text-orange-600 px-2.5 py-1 text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw className="size-3 text-orange-500" />
                <span>Reset ({count})</span>
              </button>
            )}
          </SheetHeader>

          {/* Scrollable Filters Body */}
          <div className="max-h-[calc(90vh-140px)] space-y-6 overflow-y-auto p-5 overscroll-contain">
            {/* Sort Dropdown */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Sort By
              </label>
              <select
                value={`${filters.sort || "createdAt"}:${filters.order || "desc"}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split(":");
                  onChange({
                    ...filters,
                    sort: sort as CatalogFilters["sort"],
                    order: order as CatalogFilters["order"],
                  });
                }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-orange-500 focus:bg-white"
              >
                {sortOptions.map((item) => (
                  <option key={item.label} value={`${item.sort}:${item.order}`}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Categories */}
            <div className="pt-2 border-t border-slate-100">
              <div className="mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Categories
                </h3>
              </div>
              <CategoryFilterPanel
                categories={categories}
                selectedSlug={filters.categorySlug}
                onSelect={(categorySlug) => onChange({ ...filters, categorySlug })}
              />
            </div>

            {/* Price Range */}
            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
                Price Range ($)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={filters.minPrice || ""}
                  onChange={(e) =>
                    onChange({ ...filters, minPrice: e.target.value || undefined })
                  }
                  placeholder="Min $"
                  inputMode="decimal"
                  className="h-10 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-semibold outline-none focus:border-orange-500 focus:bg-white"
                />
                <input
                  value={filters.maxPrice || ""}
                  onChange={(e) =>
                    onChange({ ...filters, maxPrice: e.target.value || undefined })
                  }
                  placeholder="Max $"
                  inputMode="decimal"
                  className="h-10 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-semibold outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Customer Rating */}
            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                Customer Rating
              </h3>
              <div className="space-y-1.5">
                {[4, 3, 2, 1].map((rating) => {
                  const isSelected = filters.minRating === rating;
                  return (
                    <button
                      key={rating}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...filters,
                          minRating: isSelected ? undefined : rating,
                        })
                      }
                      className={`flex min-h-10 w-full items-center justify-between rounded-xl border px-3 text-xs font-semibold transition-colors ${
                        isSelected
                          ? "border-orange-300 bg-orange-50 text-orange-600 font-bold shadow-xs"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-orange-400">
                        {Array.from({ length: rating }).map((_, i) => (
                          <Star key={i} className="size-3.5 fill-current" />
                        ))}
                        <span className="ml-1 text-slate-600 font-medium">
                          {rating}★ & above
                        </span>
                      </div>
                      {isSelected && <Check className="size-3.5 text-orange-500" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Product Format */}
            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                Product Format
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  [undefined, "All"],
                  ["PHYSICAL", "Physical"],
                  ["DIGITAL", "Digital"],
                ].map(([value, label]) => (
                  <button
                    key={label as string}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...filters,
                        type: value as CatalogFilters["type"],
                      })
                    }
                    className={`min-h-10 rounded-xl border text-xs font-bold transition-colors ${
                      filters.type === value
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {label as string}
                  </button>
                ))}
              </div>
            </div>

            {/* Merchant & Trust Checks */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="flex min-h-11 items-center justify-between font-semibold text-xs text-slate-800 cursor-pointer">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="size-4 text-orange-500" />
                  <span>Verified Merchants Only</span>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(filters.verifiedShopsOnly)}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      verifiedShopsOnly: e.target.checked || undefined,
                    })
                  }
                  className="size-4 rounded accent-orange-500"
                />
              </label>

              <label className="flex min-h-11 items-center justify-between font-semibold text-xs text-slate-800 cursor-pointer">
                <div className="flex items-center gap-2">
                  <PackageCheck className="size-4 text-orange-500" />
                  <span>In Stock (Ready to Ship)</span>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(filters.inStockOnly)}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      inStockOnly: e.target.checked || undefined,
                    })
                  }
                  className="size-4 rounded accent-orange-500"
                />
              </label>
            </div>
          </div>

          {/* Sticky Footer Actions */}
          <div className="flex gap-3 border-t border-slate-100 bg-white p-4">
            <button
              type="button"
              onClick={onReset}
              className="min-h-11 flex-1 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 active:scale-98 transition-all"
            >
              Reset All
            </button>
            <button
              type="button"
              onClick={apply}
              className="min-h-11 flex-1 rounded-xl bg-orange-500 hover:bg-orange-600 font-bold text-xs text-white active:scale-98 transition-all shadow-md shadow-orange-500/25"
            >
              Show Results ({total})
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
