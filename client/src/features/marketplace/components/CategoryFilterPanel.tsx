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
          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-8 pr-8 text-xs outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 text-slate-800 placeholder:text-slate-400"
        />
        {query && <button type="button" aria-label="Clear category search" onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"><X className="size-3.5" /></button>}
      </div>

      <button
        type="button"
        onClick={() => onSelect(undefined)}
        className={`flex min-h-9 w-full items-center justify-between rounded-lg px-2.5 text-left text-xs transition ${!selectedSlug ? "bg-blue-50 font-bold text-blue-700 border border-blue-200/80" : "font-medium text-slate-700 hover:bg-slate-50"}`}
      >
        <span>All Categories</span>
        {!selectedSlug && <Check className="size-3.5 text-blue-600" />}
      </button>

      <div className="max-h-72 space-y-0.5 overflow-y-auto pr-1">
        {visibleCategories.length === 0 && <p className="px-3 py-6 text-center text-xs text-slate-400">No categories found.</p>}
        {visibleCategories.map((category) => {
          const isExpanded = expanded === category.slug || Boolean(query);
          const isParentSelected = selectedSlug === category.slug;
          const hasSelectedChild = category.children.some((child) => child.slug === selectedSlug);

          return (
            <div key={category.id} className="overflow-hidden rounded-lg">
              <div className={`flex min-h-9 items-center gap-1 rounded-lg ${isParentSelected ? "bg-blue-50 text-blue-700 font-bold border border-blue-200/80" : hasSelectedChild ? "bg-slate-100/80 text-slate-900 font-semibold" : "hover:bg-slate-50 text-slate-700"}`}>
                <button type="button" onClick={() => onSelect(category.slug)} className={`flex min-w-0 flex-1 items-center gap-2 px-2.5 py-1.5 text-left text-xs ${isParentSelected ? "font-bold text-blue-700" : "font-medium"}`}>
                  <span className="w-4 text-center text-xs opacity-75">{category.icon || "•"}</span>
                  <span className="truncate">{category.name}</span>
                  <span className="ml-auto shrink-0 text-[10px] font-normal text-slate-400">{category.productCount}</span>
                  {isParentSelected && <Check className="size-3.5 shrink-0 text-blue-600" />}
                </button>
                {category.children.length > 0 && (
                  <button type="button" aria-label={`${isExpanded ? "Collapse" : "Expand"} ${category.name}`} onClick={() => setExpanded(isExpanded ? null : category.slug)} className="mr-1 rounded p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700">
                    {isExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                  </button>
                )}
              </div>
              {isExpanded && category.children.length > 0 && (
                <div className="ml-5 border-l border-slate-200 my-0.5 pl-2 space-y-0.5">
                  {category.children.map((child) => (
                    <button type="button" key={child.id} onClick={() => onSelect(child.slug)} className={`flex min-h-8 w-full items-center justify-between rounded-md px-2 py-1 text-left text-xs transition ${selectedSlug === child.slug ? "bg-blue-50 font-bold text-blue-700 border border-blue-200/80" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                      <span className="truncate">{child.name}</span>
                      <span className="ml-2 flex shrink-0 items-center gap-1.5 text-[10px] text-slate-400">{child.productCount}{selectedSlug === child.slug && <Check className="size-3 text-blue-600" />}</span>
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
