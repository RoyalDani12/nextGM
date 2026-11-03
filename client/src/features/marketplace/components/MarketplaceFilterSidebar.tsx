import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Check,
  ChevronDown,
  CircleDollarSign,
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
};

function FilterDropdown({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="group relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-700"
      >
        <span>{label}</span>
        {value && <span className="max-w-32 truncate text-xs font-semibold text-orange-600">{value}</span>}
        <ChevronDown className={`ml-auto size-4 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div
        onClick={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest("button") || target.closest("label")) setOpen(false);
        }}
        className="absolute left-0 top-[calc(100%+0.5rem)] z-30 min-w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10"
      >
        {children}
      </div>}
    </div>
  );
}

export function MarketplaceFilterSidebar({ categories, filters, onChange, onReset }: Props) {
  const count = activeFilterCount(filters);
  const parent = categories.find(
    (item) => item.slug === filters.categorySlug || item.children.some((child) => child.slug === filters.categorySlug),
  );
  const selectedCategory = parent?.children.find((child) => child.slug === filters.categorySlug) || parent;
  const categoryLabel = selectedCategory?.name || "All categories";
  const priceLabel = filters.minPrice || filters.maxPrice
    ? `$${filters.minPrice || "0"} – $${filters.maxPrice || "∞"}`
    : undefined;
  const ratingLabel = filters.minRating ? `${filters.minRating}★ & up` : undefined;
  const typeLabel = filters.type === "PHYSICAL" ? "Physical" : filters.type === "DIGITAL" ? "Digital" : undefined;

  return (
    <section className="relative z-20 mb-6 hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 lg:block">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-1 flex items-center gap-2 text-sm font-black text-slate-900">
          <span className="flex size-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <SlidersHorizontal className="size-4" />
          </span>
          Filters
          {count > 0 && <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] text-white">{count}</span>}
        </div>

        <FilterDropdown label="Category" value={categoryLabel}>
          <CategoryFilterPanel categories={categories} selectedSlug={filters.categorySlug} onSelect={(categorySlug) => onChange({ ...filters, categorySlug })} className="w-80" />
        </FilterDropdown>

        <FilterDropdown label="Price" value={priceLabel}>
          <div className="grid grid-cols-2 gap-2">
            <label className="relative"><span className="sr-only">Minimum price</span><CircleDollarSign className="absolute left-2.5 top-2.5 size-4 text-slate-400" /><input value={filters.minPrice || ""} onChange={(event) => onChange({ ...filters, minPrice: event.target.value || undefined })} placeholder="Min" className="h-10 w-full rounded-xl border border-slate-200 pl-8 text-sm outline-none focus:border-orange-400" /></label>
            <label className="relative"><span className="sr-only">Maximum price</span><CircleDollarSign className="absolute left-2.5 top-2.5 size-4 text-slate-400" /><input value={filters.maxPrice || ""} onChange={(event) => onChange({ ...filters, maxPrice: event.target.value || undefined })} placeholder="Max" className="h-10 w-full rounded-xl border border-slate-200 pl-8 text-sm outline-none focus:border-orange-400" /></label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[[undefined, "50", "Under $50"], ["50", "200", "$50–$200"], ["200", undefined, "$200+"]].map(([min, max, label]) => (
              <button key={label} onClick={() => onChange({ ...filters, minPrice: min, maxPrice: max })} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700">{label}</button>
            ))}
          </div>
        </FilterDropdown>

        <FilterDropdown label="Rating" value={ratingLabel}>
          <div className="space-y-1">
            {[4, 3, 2].map((rating) => (
              <button key={rating} onClick={() => onChange({ ...filters, minRating: filters.minRating === rating ? undefined : rating })} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold ${filters.minRating === rating ? "bg-amber-50 text-amber-800" : "hover:bg-slate-50"}`}>
                <span className="flex text-amber-400">{Array.from({ length: rating }).map((_, index) => <Star key={index} className="size-3.5 fill-current" />)}</span>
                {rating} & up
                {filters.minRating === rating && <Check className="ml-auto size-4" />}
              </button>
            ))}
          </div>
        </FilterDropdown>

        <FilterDropdown label="Availability" value={filters.inStockOnly || filters.verifiedShopsOnly ? "Selected" : undefined}>
          <div className="space-y-1">
            {([["inStockOnly", "Ready to ship", PackageCheck], ["verifiedShopsOnly", "Verified sellers", BadgeCheck]] as const).map(([key, label, Icon]) => (
              <label key={key} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold hover:bg-slate-50">
                <input type="checkbox" checked={Boolean(filters[key])} onChange={(event) => onChange({ ...filters, [key]: event.target.checked || undefined })} className="size-4 accent-orange-500" />
                <Icon className="size-4 text-orange-500" /> {label}
              </label>
            ))}
          </div>
        </FilterDropdown>

        <FilterDropdown label="Type" value={typeLabel}>
          <div className="grid grid-cols-3 gap-2">
            {[[undefined, "All"], ["PHYSICAL", "Physical"], ["DIGITAL", "Digital"]].map(([value, label]) => (
              <button key={label} onClick={() => onChange({ ...filters, type: value as CatalogFilters["type"] })} className={`rounded-xl border px-3 py-2 text-xs font-bold ${filters.type === value ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 hover:border-orange-300"}`}>{label}</button>
            ))}
          </div>
        </FilterDropdown>

        {count > 0 && <button onClick={onReset} className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><RotateCcw className="size-4" /> Clear all</button>}
      </div>
    </section>
  );
}
