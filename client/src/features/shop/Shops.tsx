import React, { useState } from "react";
import { useMyShops } from "@/features/shop/shop.hooks";
import {
    Store,
    Copy,
    Check,
    ArrowRight,
    Sparkles,
    AlertCircle,
    RefreshCw,
    Plus,
    Globe
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button, buttonVariants } from "@/components/ui/button";
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

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (!slug) return;
        navigator.clipboard.writeText(slug);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            type="button"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200/80 text-[11px] font-mono text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Copy slug"
        >
            <Globe className="size-3 text-slate-400" />
            <span className="truncate max-w-[130px]">
                {slug ? `/${slug}` : "/no-slug"}
            </span>
            {copied ? (
                <Check className="size-3 text-orange-600 shrink-0" />
            ) : (
                <Copy className="size-3 text-slate-400 shrink-0" />
            )}
        </button>
    );
};

/* Dynamic Status Badge */
const StatusBadge = ({ status }: { status: string }) => {
    const norm = status?.toLowerCase() || "";

    if (norm === "active" || norm === "approved") {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200/60 font-bold uppercase tracking-wider text-[9px]">
                <span className="size-1.5 rounded-full bg-orange-500 animate-pulse" />
                {status}
            </span>
        );
    }

    if (norm === "pending") {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 font-bold uppercase tracking-wider text-[9px]">
                <span className="size-1.5 rounded-full bg-amber-500" />
                {status}
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-bold uppercase tracking-wider text-[9px]">
            <span className="size-1.5 rounded-full bg-slate-400" />
            {status || "Unknown"}
        </span>
    );
};

export const Shops = () => {
    const { data, isLoading, isError, refetch } = useMyShops();
    const navigate = useNavigate();

    if (isLoading) {
        return <ShopsSkeleton />;
    }

    if (isError) {
        return (
            <div className="max-w-md mx-auto my-16">
                <Card className="text-center p-8 border-slate-200/80 shadow-lg shadow-slate-100 rounded-3xl space-y-4">
                    <div className="size-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                        <AlertCircle className="size-6" />
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-base font-black text-slate-900">Failed to load shops</CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                            An error occurred while fetching your storefront data from the server.
                        </CardDescription>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => refetch?.()} className="gap-2 rounded-full cursor-pointer">
                        <RefreshCw className="size-3.5" />
                        Try Again
                    </Button>
                </Card>
            </div>
        );
    }

    const shops = data?.data ?? [];

    if (shops.length === 0) {
        return (
            <div className="max-w-md mx-auto my-16">
                <Card className="text-center p-10 border-dashed border-2 border-slate-200 rounded-3xl space-y-4 bg-slate-50/50">
                    <div className="size-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto shadow-sm">
                        <Store className="size-6" />
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-base font-black text-slate-900">No shops found</CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                            You haven't created any active storefronts yet. Get started by building your first shop.
                        </CardDescription>
                    </div>
                    <Button 
                        size="sm" 
                        onClick={() => navigate("/dashboard/shops/new")}
                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold shadow-md shadow-orange-500/20 cursor-pointer"
                    >
                        <Plus className="size-4 mr-1.5" /> Create Shop
                    </Button>
                </Card>
            </div>
        );
    }

    const topShop = shops[0];
    const gridShops = shops.length > 1 ? shops.slice(1) : shops;

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Storefronts</h1>
                    <p className="text-xs text-slate-500 font-medium">
                        Manage your active e-commerce brands, copy custom route links, and configure parameters.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                        {shops.length} {shops.length === 1 ? "Store" : "Stores"} Total
                    </span>
                    <Button
                        size="sm"
                        onClick={() => navigate("/dashboard/shops/new")}
                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold h-9 px-4 shadow-sm shadow-orange-500/20 cursor-pointer"
                    >
                        <Plus className="size-4 mr-1.5" />
                        <span>Create Shop</span>
                    </Button>
                </div>
            </div>

            {/* TOP FEATURED STOREFRONT */}
            {topShop && (
                <section className="space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 uppercase tracking-wider">
                        <Sparkles className="size-3.5" />
                        Featured Primary Storefront
                    </div>

                    <Card className="border border-orange-200/80 bg-gradient-to-r from-orange-50/40 via-white to-white rounded-3xl shadow-sm hover:shadow-md transition-all">
                        <CardContent className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 gap-6">
                            <div className="flex items-start sm:items-center gap-4 min-w-0">
                                <div className="size-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
                                    <Store className="size-7" />
                                </div>

                                <div className="space-y-1.5 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <h2 className="text-lg font-black text-slate-900 truncate">
                                            {topShop.profile?.name || "Unnamed Shop"}
                                        </h2>
                                        <StatusBadge status={topShop.status} />
                                    </div>

                                    <p className="text-xs text-slate-500 line-clamp-1 max-w-xl font-medium">
                                        {topShop.profile?.description || "No public description specified for this storefront."}
                                    </p>

                                    <div className="pt-1">
                                        <CopySlugButton slug={topShop.slug || (topShop.profile as any)?.slug || topShop.id} />
                                    </div>
                                </div>
                            </div>

                            <a
                                href={`/dashboard/shops/${topShop.id}/detail`}
                                className={cn(
                                    buttonVariants({ size: "sm" }),
                                    "bg-slate-900 hover:bg-slate-800 text-white rounded-full h-10 px-5 shrink-0 gap-2 font-bold shadow-sm cursor-pointer ml-auto lg:ml-0"
                                )}
                            >
                                <span>Manage Storefront</span>
                                <ArrowRight className="size-4" />
                            </a>
                        </CardContent>
                    </Card>
                </section>
            )}

            {/* ALL STOREFRONTS GRID */}
            {gridShops.length > 0 && (
                <section className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Other Storefronts</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {gridShops.map((shop) => (
                            <Card key={shop.id} className="flex flex-col justify-between border border-slate-200/80 rounded-3xl bg-white hover:border-orange-500/40 hover:shadow-xl hover:shadow-slate-100 transition-all group">
                                <CardHeader className="p-5 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="size-10 rounded-xl bg-slate-100 group-hover:bg-orange-50 group-hover:text-orange-600 text-slate-600 flex items-center justify-center shrink-0 transition-colors">
                                            <Store className="size-5" />
                                        </div>
                                        <StatusBadge status={shop.status} />
                                    </div>

                                    <div className="space-y-1">
                                        <CardTitle className="text-sm font-black text-slate-900 line-clamp-1">
                                            {shop.profile?.name || "Unnamed Shop"}
                                        </CardTitle>
                                        <CardDescription className="text-xs text-slate-500 line-clamp-2 font-medium">
                                            {shop.profile?.description || "No description provided."}
                                        </CardDescription>
                                    </div>
                                </CardHeader>

                                <CardFooter className="flex flex-col p-5 pt-0 space-y-4 border-t border-slate-100 mt-auto">
                                    <div className="flex items-center justify-between w-full pt-4">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Route</span>
                                        <CopySlugButton slug={shop.slug || (shop.profile as any)?.slug || shop.id} />
                                    </div>

                                    <a
                                        href={`/dashboard/shops/${shop.id}/detail`}
                                        className={cn(
                                            buttonVariants({ variant: "outline", size: "sm" }),
                                            "w-full rounded-xl h-9 font-bold border-slate-200 text-slate-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all cursor-pointer gap-1.5"
                                        )}
                                    >
                                        <span>Manage Store</span>
                                        <ArrowRight className="size-3.5" />
                                    </a>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

/* Skeleton Component using Shadcn Skeleton */
const ShopsSkeleton = () => (
    <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8">
        <div className="flex justify-between items-center pb-6 border-b border-slate-100">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48 rounded-lg" />
                <Skeleton className="h-4 w-72 rounded-lg" />
            </div>
            <Skeleton className="h-10 w-32 rounded-full" />
        </div>

        <Skeleton className="h-32 w-full rounded-3xl" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
                <Card key={i} className="p-5 space-y-4 rounded-3xl border-slate-200">
                    <div className="flex justify-between items-center">
                        <Skeleton className="size-10 rounded-xl" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-3/4 rounded-md" />
                        <Skeleton className="h-3 w-full rounded-md" />
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                        <Skeleton className="h-7 w-24 rounded-md" />
                        <Skeleton className="h-9 w-full rounded-xl" />
                    </div>
                </Card>
            ))}
        </div>
    </div>
);