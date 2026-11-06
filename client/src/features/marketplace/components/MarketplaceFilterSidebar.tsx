import { useState, type FormEvent } from "react";
import {
  BadgeCheck,
  Check,
  ChevronDown,
  DollarSign,
  PackageCheck,
  RotateCcw,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import type { MarketplaceCategory } from "../marketplace.api";
import { activeFilterCount, type CatalogFilters } from "./marketplace.filters";
import { CategoryFilterPanel } from "./CategoryFilterPanel";

type Props = {
  categories: MarketplaceCategory[];
  filters: CatalogFilters;
  onChange: (next: CatalogFilters) => void;
  onReset: () => void;
  className?: string;
};

export function MarketplaceFilterSidebar({
  categories,
  filters,
  onChange,
  onReset,
  className = "",
}: Props) {
  const count = activeFilterCount(filters);

  // Collapsible section states (all open by default for immediate discoverability)
  const [openSections, setOpenSections] = useState({
    category: true,
    price: true,
    rating: true,
    merchant: true,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Local price inputs for smooth typing before submitting
  const [minPriceInput, setMinPriceInput] = useState(filters.minPrice || "");
  const [maxPriceInput, setMaxPriceInput] = useState(filters.maxPrice || "");

  const handlePriceSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    onChange({
      ...filters,
      minPrice: minPriceInput.trim() || undefined,
      maxPrice: maxPriceInput.trim() || undefined,
    });
  };

  const handlePricePreset = (min?: string, max?: string) => {
    setMinPriceInput(min || "");
    setMaxPriceInput(max || "");
    onChange({
      ...filters,
      minPrice: min,
      maxPrice: max,
    });
  };

  const isPriceActive = Boolean(filters.minPrice || filters.maxPrice);

  return (
    <aside
      aria-label="Product Catalog Filters"
      className={`w-full bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 font-sans divide-y divide-slate-100 ${className}`}
    >
      {/* ── Sidebar Header: Title, Active Count & Reset ── */}
      <div className="pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-orange-50 text-orange-500 border border-orange-200/70 shadow-xs shadow-orange-500/10">
            <SlidersHorizontal className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 tracking-tight">Refine Results</h2>
            <p className="text-[11px] text-slate-400 font-medium">B2B & Retail Filters</p>
          </div>
        </div>

        {count > 0 && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600 border border-orange-200">
              {count} active
            </span>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 text-slate-700 hover:text-orange-600 px-2 py-1 text-[11px] font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="size-3 text-orange-500" />
              Reset
            </button>
          </div>
        )}
      </div>

      {/* ── Section 1: Categories ── */}
      <div className="py-4">
        <button
          type="button"
          onClick={() => toggleSection("category")}
          className="flex w-full items-center justify-between py-1 text-left group cursor-pointer"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-slate-900 group-hover:text-orange-500 transition-colors">
            Categories
          </span>
          <ChevronDown
            className={`size-4 text-slate-400 transition-transform duration-200 ${
              openSections.category ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.category && (
          <div className="mt-3">
            <CategoryFilterPanel
              categories={categories}
              selectedSlug={filters.categorySlug}
              onSelect={(categorySlug) => onChange({ ...filters, categorySlug })}
            />
          </div>
        )}
      </div>

      {/* ── Section 2: Price Range ── */}
      <div className="py-4">
        <button
          type="button"
          onClick={() => toggleSection("price")}
          className="flex w-full items-center justify-between py-1 text-left group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 group-hover:text-orange-500 transition-colors">
              Price Range ($)
            </span>
            {isPriceActive && (
              <span className="size-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
            )}
          </div>
          <ChevronDown
            className={`size-4 text-slate-400 transition-transform duration-200 ${
              openSections.price ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.price && (
          <div className="mt-3 space-y-3">
            <form onSubmit={handlePriceSubmit} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={minPriceInput}
                    onChange={(e) => setMinPriceInput(e.target.value)}
                    placeholder="Min"
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-7 pr-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all font-medium"
                  />
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={maxPriceInput}
                    onChange={(e) => setMaxPriceInput(e.target.value)}
                    placeholder="Max"
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-7 pr-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-8 rounded-lg bg-slate-900 hover:bg-orange-500 hover:shadow-sm hover:shadow-orange-500/25 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                Apply Range
              </button>
            </form>

            {/* Price Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { label: "Under $25", min: undefined, max: "25" },
                { label: "$25 to $100", min: "25", max: "100" },
                { label: "$100 to $250", min: "100", max: "250" },
                { label: "$250+", min: "250", max: undefined },
              ].map((preset) => {
                const isActive =
                  filters.minPrice === preset.min && filters.maxPrice === preset.max;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      isActive
                        ? handlePricePreset(undefined, undefined)
                        : handlePricePreset(preset.min, preset.max)
                    }
                    className={`rounded-md px-2.5 py-1 text-[11px] font-semibold border transition-colors cursor-pointer ${
                      isActive
                        ? "bg-orange-50 text-orange-600 border-orange-300 font-bold shadow-xs"
                        : "bg-slate-50/80 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Section 3: Star Rating Breakdown ── */}
      <div className="py-4">
        <button
          type="button"
          onClick={() => toggleSection("rating")}
          className="flex w-full items-center justify-between py-1 text-left group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 group-hover:text-orange-500 transition-colors">
              Customer Rating
            </span>
            {filters.minRating && (
              <span className="size-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
            )}
          </div>
          <ChevronDown
            className={`size-4 text-slate-400 transition-transform duration-200 ${
              openSections.rating ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.rating && (
          <div className="mt-3 space-y-1">
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
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-orange-50 text-orange-600 font-bold border border-orange-200 shadow-xs"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 text-orange-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`size-3.5 ${
                            i < rating
                              ? "fill-current text-orange-400"
                              : "text-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-medium text-slate-600">
                      {rating}★ & above
                    </span>
                  </div>

                  {isSelected && <Check className="size-3.5 text-orange-500" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Section 4: Merchant & Fulfillment ── */}
      <div className="py-4">
        <button
          type="button"
          onClick={() => toggleSection("merchant")}
          className="flex w-full items-center justify-between py-1 text-left group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 group-hover:text-orange-500 transition-colors">
              Fulfillment & Trust
            </span>
            {(filters.inStockOnly || filters.verifiedShopsOnly || filters.type) && (
              <span className="size-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
            )}
          </div>
          <ChevronDown
            className={`size-4 text-slate-400 transition-transform duration-200 ${
              openSections.merchant ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.merchant && (
          <div className="mt-3 space-y-3">
            {/* Checkboxes */}
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center justify-between rounded-lg p-2 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <BadgeCheck className="size-4 text-orange-500" />
                  <span className="text-xs font-semibold text-slate-700">
                    Verified Merchants
                  </span>
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
                  className="size-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-lg p-2 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <PackageCheck className="size-4 text-orange-500" />
                  <span className="text-xs font-semibold text-slate-700">
                    Ready to Ship (In Stock)
                  </span>
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
                  className="size-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                />
              </label>
            </div>

            {/* Product Type Segment Control */}
            <div className="pt-2 border-t border-slate-100">
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Product Format
              </span>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/60">
                {[
                  { value: undefined, label: "All" },
                  { value: "PHYSICAL", label: "Physical" },
                  { value: "DIGITAL", label: "Digital" },
                ].map((item) => {
                  const isSelected = filters.type === item.value;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...filters,
                          type: item.value as CatalogFilters["type"],
                        })
                      }
                      className={`rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
