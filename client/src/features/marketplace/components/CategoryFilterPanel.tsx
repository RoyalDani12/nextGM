import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, Search, X } from "lucide-react";
import type { MarketplaceCategory } from "../marketplace.api";

type Props = {
  categories: MarketplaceCategory[];
  selectedSlug?: string;
  onSelect: (slug?: string) => void;
  className?: string;
};

export function CategoryFilterPanel({ categories, selectedSlug, onSelect, className = "" }: Props) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(() =>
    categories.find((category) => category.slug === selectedSlug || category.children.some((child) => child.slug === selectedSlug))?.slug || null,
  );

  const visibleCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return categories;
    return categories
      .map((category) => ({
        ...category,
        children: category.children.filter((child) => child.name.toLowerCase().includes(normalizedQuery)),
      }))
      .filter((category) => category.name.toLowerCase().includes(normalizedQuery) || category.children.length > 0);
  }, [categories, query]);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search categories"
          aria-label="Search categories"
          className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
        />
        {query && <button type="button" aria-label="Clear category search" onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"><X className="size-4" /></button>}
      </div>

      <button
        type="button"
        onClick={() => onSelect(undefined)}
        className={`flex min-h-11 w-full items-center justify-between rounded-lg px-3 text-left text-sm transition ${!selectedSlug ? "bg-orange-50 font-bold text-orange-700" : "font-semibold text-slate-700 hover:bg-slate-50"}`}
      >
        <span>All categories</span>
        {!selectedSlug && <Check className="size-4" />}
      </button>

      <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
        {visibleCategories.length === 0 && <p className="px-3 py-6 text-center text-sm text-slate-500">No categories found.</p>}
        {visibleCategories.map((category) => {
          const isExpanded = expanded === category.slug || Boolean(query);
          const isParentSelected = selectedSlug === category.slug;
          const hasSelectedChild = category.children.some((child) => child.slug === selectedSlug);

          return (
            <div key={category.id} className="overflow-hidden rounded-lg">
              <div className={`flex min-h-11 items-center gap-1 ${isParentSelected || hasSelectedChild ? "bg-orange-50" : "hover:bg-slate-50"}`}>
                <button type="button" onClick={() => onSelect(category.slug)} className={`flex min-w-0 flex-1 items-center gap-2 px-3 text-left text-sm ${isParentSelected || hasSelectedChild ? "font-bold text-orange-700" : "font-semibold text-slate-700"}`}>
                  <span className="w-5 text-center text-base">{category.icon || "•"}</span>
                  <span className="truncate">{category.name}</span>
                  <span className="ml-auto shrink-0 text-xs font-normal text-slate-400">{category.productCount}</span>
                  {isParentSelected && <Check className="size-4 shrink-0 text-orange-600" />}
                </button>
                {category.children.length > 0 && (
                  <button type="button" aria-label={`${isExpanded ? "Collapse" : "Expand"} ${category.name}`} onClick={() => setExpanded(isExpanded ? null : category.slug)} className="mr-1 rounded p-2 text-slate-400 hover:bg-white hover:text-slate-700">
                    {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                  </button>
                )}
              </div>
              {isExpanded && category.children.length > 0 && (
                <div className="ml-7 border-l border-slate-200 py-1 pl-2">
                  {category.children.map((child) => (
                    <button type="button" key={child.id} onClick={() => onSelect(child.slug)} className={`flex min-h-10 w-full items-center justify-between rounded-md px-3 text-left text-sm transition ${selectedSlug === child.slug ? "bg-orange-100 font-bold text-orange-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                      <span className="truncate">{child.name}</span>
                      <span className="ml-2 flex shrink-0 items-center gap-2 text-xs text-slate-400">{child.productCount}{selectedSlug === child.slug && <Check className="size-4 text-orange-600" />}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
