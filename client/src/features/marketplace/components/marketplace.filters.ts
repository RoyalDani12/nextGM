import type { MarketplaceFilters } from "../marketplace.api";

export type CatalogFilters = Omit<MarketplaceFilters, "search"> & { categorySlug?: string; minPrice?: string; maxPrice?: string };
export const emptyCatalogFilters: CatalogFilters = { sort: "createdAt", order: "desc" };
export const activeFilterCount = (filters: CatalogFilters) => [
  filters.categorySlug,
  filters.type,
  Boolean(filters.minPrice || filters.maxPrice),
  filters.minRating,
  filters.inStockOnly,
  filters.verifiedShopsOnly,
  Boolean(filters.sort && filters.sort !== "createdAt"),
].filter(Boolean).length;
export const sortOptions = [
  { label: "Newest", sort: "createdAt", order: "desc" },
  { label: "Price: Low to High", sort: "basePrice", order: "asc" },
  { label: "Price: High to Low", sort: "basePrice", order: "desc" },
  { label: "Top Rated", sort: "rating", order: "desc" },
] as const;
