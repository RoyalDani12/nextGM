import { useState } from "react";
import type { MouseEvent } from "react";
import { useMyShops } from "@/features/shop/shop.hooks";
import {
  Store,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* Copyable Slug Component */
const CopySlugButton = ({ slug }: { slug: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!slug) return;
    navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      onClick={handleCopy}
      type="button"
      variant="outline"
      size="sm"
      className="h-6 gap-1 px-2 text-[11px] font-mono text-muted-foreground hover:text-foreground"
      title="Copy slug"
    >
      <span className="truncate max-w-[120px]">
        {slug ? `/${slug}` : "/no-slug"}
      </span>
      {copied ? (
        <Check className="h-3 w-3 text-emerald-600 shrink-0" />
      ) : (
        <Copy className="h-3 w-3 shrink-0" />
      )}
    </Button>
  );
};

/* Dynamic Status Badge */
const StatusBadge = ({ status }: { status: string }) => {
  const norm = status?.toLowerCase() || "";

  if (norm === "active" || norm === "approved") {
    return (
      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold uppercase text-[10px]">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
        {status}
      </Badge>
    );
  }

  if (norm === "pending") {
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-semibold uppercase text-[10px]">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1" />
        {status}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="font-semibold uppercase text-[10px]">
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mr-1" />
      {status || "Unknown"}
    </Badge>
  );
};

export const Shops = () => {
  const { data, isLoading, isError, refetch } = useMyShops();

  if (isLoading) {
    return <ShopsSkeleton />;
  }

  if (isError) {
    return (
      <Card className="max-w-sm mx-auto my-8 text-center p-6 space-y-4">
        <div className="flex flex-col items-center gap-2">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <CardTitle className="text-base">Failed to load shops</CardTitle>
          <CardDescription className="text-xs">
            An error occurred while fetching your storefront data.
          </CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch?.()} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      </Card>
    );
  }

  const shops = data?.data ?? [];

  if (shops.length === 0) {
    return (
      <Card className="max-w-sm mx-auto my-8 text-center p-8 border-dashed space-y-2">
        <div className="flex flex-col items-center gap-2">
          <Store className="h-8 w-8 text-muted-foreground" />
          <CardTitle className="text-base">No shops found</CardTitle>
          <CardDescription className="text-xs">
            You haven't created any shops yet.
          </CardDescription>
        </div>
      </Card>
    );
  }

  const topShop = shops[0];
  const gridShops = shops.length > 1 ? shops.slice(1) : shops;

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Shops</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your storefronts, copy public links, and view performance.
          </p>
        </div>
        <Badge variant="secondary" className="px-3 py-1 text-xs">
          {shops.length} {shops.length === 1 ? "Shop" : "Shops"}
        </Badge>
      </div>

      {/* TOP STOREFRONT HIGHLIGHT */}
      {topShop && (
        <section className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 tracking-wide uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            Top Storefront
          </div>

          <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-all">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                  <Store className="h-5 w-5" />
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold truncate">
                      {topShop.profile?.name || "Unnamed Shop"}
                    </h2>
                    <StatusBadge status={topShop.status} />
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <p className="truncate max-w-xs md:max-w-md hidden sm:block">
                      {topShop.profile?.description || "No description provided."}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-muted-foreground text-[11px]">Slug:</span>
                      <CopySlugButton slug={topShop.slug || topShop.id} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pure HTML Anchor Styled With Shadcn buttonVariants */}
              <a
                href={`/dashboard/shops/${topShop.id}/detail`}
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 gap-1.5"
                )}
              >
                <span>Detail</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ALL STOREFRONTS GRID */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold tracking-wide">All Storefronts</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {gridShops.map((shop) => (
            <Card key={shop.id} className="flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-md transition-all">
              <CardHeader className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Store className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <StatusBadge status={shop.status} />
                </div>

                <div>
                  <CardTitle className="text-sm font-semibold line-clamp-1">
                    {shop.profile?.name || "Unnamed Shop"}
                  </CardTitle>
                  <CardDescription className="text-xs line-clamp-2 mt-1">
                    {shop.profile?.description || "No description provided."}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardFooter className="flex flex-col p-4 pt-0 space-y-3 border-t mt-auto">
                <div className="flex items-center justify-between w-full pt-3 text-xs">
                  <span className="text-[11px] text-muted-foreground">Slug</span>
                  <CopySlugButton slug={shop.slug || shop.id} />
                </div>

                {/* Pure HTML Anchor Styled With Shadcn buttonVariants */}
                <a
                  href={`/dashboard/shops/${shop.id}/detail`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "w-full gap-1.5 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-colors"
                  )}
                >
                  <span>Detail</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

/* Skeleton Component using Shadcn Skeleton */
const ShopsSkeleton = () => (
  <div className="max-w-7xl mx-auto space-y-6 p-4">
    <div className="space-y-2">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-4 w-64" />
    </div>

    <Skeleton className="h-20 w-full rounded-xl" />

    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-9 w-full rounded-md" />
        </Card>
      ))}
    </div>
  </div>
);