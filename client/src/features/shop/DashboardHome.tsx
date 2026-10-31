import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  CircleDashed,
  FileText,
  ImagePlus,
  Loader2,
  MapPin,
  PackagePlus,
  RefreshCw,
  Rocket,
  RotateCcw,
  Store,
  UserRound,
  ExternalLink,
  ShoppingBag,
  Package,
  MessageSquare,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyShops, usePublishReadiness, usePublishShop } from "./shop.hooks";
import type { PublishReadinessChecks, ShopStatus } from "./shop.types";

const statusStyle: Record<ShopStatus, { label: string; className: string }> = {
  PENDING: { label: "Setup in progress", className: "bg-amber-50 text-amber-800 border-amber-200" },
  ACTIVE: { label: "Trading & Live", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  PAUSED: { label: "Store Paused", className: "bg-blue-50 text-blue-800 border-blue-200" },
  SUSPENDED: { label: "Suspended", className: "bg-rose-50 text-rose-800 border-rose-200" },
  CLOSED: { label: "Store Closed", className: "bg-slate-100 text-slate-700 border-slate-300" },
};

const setupItems: Array<{
  key: keyof PublishReadinessChecks;
  title: string;
  description: string;
  icon: typeof Store;
  destination: "settings" | "products";
}> = [
  { key: "hasProfile", title: "Create store profile", description: "Establish your basic storefront identity.", icon: Store, destination: "settings" },
  { key: "hasName", title: "Add public store name", description: "The public trading name buyers will see.", icon: UserRound, destination: "settings" },
  { key: "hasDescription", title: "Add store description", description: "Describe your catalog and specialty to shoppers.", icon: FileText, destination: "settings" },
  { key: "hasLogo", title: "Upload store logo", description: "Add a recognizable visual identity and brand badge.", icon: ImagePlus, destination: "settings" },
  { key: "hasContactInfo", title: "Add merchant contact details", description: "Provide customer support email and phone.", icon: UserRound, destination: "settings" },
  { key: "hasAddress", title: "Add business address", description: "Physical operating address or registered office.", icon: MapPin, destination: "settings" },
  { key: "hasLegalInfo", title: "Legal & tax registration", description: "Provide tax ID/EIN and entity classification.", icon: Building2, destination: "settings" },
  { key: "hasAtLeastOneActiveProduct", title: "Publish active product", description: "Add at least one item available for instant checkout.", icon: PackagePlus, destination: "products" },
];

export function DashboardHome() {
  const { shopId = "" } = useParams<{ shopId: string }>();
  const readiness = usePublishReadiness(shopId);
  const publishShop = usePublishShop(shopId);
  const { data: shopsResponse } = useMyShops();
  const shop = shopsResponse?.data?.find((item) => item.id === shopId);
  const dashboardPath = `/dashboard/shop/${shopId}`;

  if (readiness.isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="mx-auto size-8 animate-spin text-orange-500" />
          <p className="text-xs font-semibold text-slate-500 tracking-wide">
            Verifying store readiness & status...
          </p>
        </div>
      </div>
    );
  }

  if (readiness.isError || !readiness.data) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-8 text-center max-w-xl mx-auto space-y-4">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <AlertCircle className="size-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Unable to retrieve shop readiness</h2>
          <p className="mt-1 text-xs text-slate-600">Your configuration is safe. Please check connection and try again.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => readiness.refetch()}
          className="rounded-xl border-slate-300 text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className="mr-1.5 size-3.5" /> Retry verification
        </Button>
      </div>
    );
  }

  const { checks, passed, shopStatus } = readiness.data;
  const completed = setupItems.filter((item) => checks[item.key]).length;
  const percent = Math.round((completed / setupItems.length) * 100);
  const status = statusStyle[shopStatus] || statusStyle.PENDING;
  const canPublish = passed && shopStatus === "PENDING";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-7">
      {/* 1. HERO STORE HEADER CARD */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 md:p-8 shadow-xs">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            {shop?.profile?.logo ? (
              <img
                src={shop.profile.logo}
                alt={shop.profile.name || "Store"}
                className="size-16 rounded-2xl object-cover border border-slate-200 shadow-2xs"
              />
            ) : (
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20">
                <Store className="size-8" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {shop?.profile?.name ?? "Merchant Workspace"}
                </h1>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${status.className}`}>
                  <BadgeCheck className="size-3.5" /> {status.label}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 font-medium">
                Store ID: <span className="font-mono text-slate-700">{shop?.slug ? `/${shop.slug}` : shopId}</span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => readiness.refetch()}
              disabled={readiness.isFetching}
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold h-9 px-3.5 gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${readiness.isFetching ? "animate-spin" : ""}`} />
              <span>Refresh Status</span>
            </Button>

            <Button
              size="sm"
              onClick={() => window.open(shop ? `/${shop.slug}` : "/", "_blank")}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold h-9 px-4 gap-1.5 cursor-pointer shadow-2xs"
            >
              <ExternalLink className="size-3.5" />
              <span>View Storefront</span>
            </Button>
          </div>
        </div>

        {/* Readiness Progress Bar */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Onboarding & Publishing Readiness</span>
            <span className="font-bold text-orange-600">
              {completed} of {setupItems.length} Requirements Verified ({percent}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </section>

      {/* 2. QUICK SHORTCUTS & OPERATIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to={`${dashboardPath}/products`}
          className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-orange-500/40 hover:shadow-sm transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Package className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors">Catalog Products</p>
              <p className="text-[11px] text-slate-400">Manage inventory</p>
            </div>
          </div>
          <ArrowRight className="size-4 text-slate-300 group-hover:text-orange-500 transition-colors" />
        </Link>

        <Link
          to={`${dashboardPath}/orders`}
          className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-orange-500/40 hover:shadow-sm transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShoppingBag className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Shop Orders</p>
              <p className="text-[11px] text-slate-400">Customer fulfillment</p>
            </div>
          </div>
          <ArrowRight className="size-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
        </Link>

        <Link
          to={`${dashboardPath}/returns`}
          className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-orange-500/40 hover:shadow-sm transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <RotateCcw className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition-colors">Returns & Refunds</p>
              <p className="text-[11px] text-slate-400">Claims & exchanges</p>
            </div>
          </div>
          <ArrowRight className="size-4 text-slate-300 group-hover:text-purple-500 transition-colors" />
        </Link>

        <Link
          to={`${dashboardPath}/reviews`}
          className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-orange-500/40 hover:shadow-sm transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <MessageSquare className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Customer Reviews</p>
              <p className="text-[11px] text-slate-400">Ratings & feedback</p>
            </div>
          </div>
          <ArrowRight className="size-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
        </Link>
      </div>

      {/* 3. STORE SETUP CHECKLIST */}
      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Onboarding Checklist</h2>
            <p className="text-xs text-slate-500">Complete each requirement to activate your store for public purchases.</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {setupItems.map((item) => {
            const Icon = item.icon;
            const isComplete = checks[item.key];
            return (
              <Link
                key={item.key}
                to={`${dashboardPath}/${item.destination}`}
                className="group flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all hover:border-orange-500/40 hover:shadow-sm"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${
                      isComplete
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : "bg-orange-50 text-orange-600 border-orange-100"
                    }`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                        {item.title}
                      </h3>
                      {isComplete && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500 truncate leading-relaxed">
                      {isComplete ? "Requirement satisfied." : item.description}
                    </p>
                  </div>
                </div>

                {isComplete ? (
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-500 ml-2" />
                ) : (
                  <CircleDashed className="size-5 shrink-0 text-orange-400 group-hover:text-orange-600 transition-colors ml-2" />
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. PUBLISH STORE BANNER */}
      {shopStatus === "PENDING" && (
        <section className="flex flex-col gap-4 rounded-3xl border border-orange-200/80 bg-gradient-to-r from-orange-50/60 via-amber-50/40 to-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="size-4.5 text-orange-600" />
              {passed ? "Your Store is Ready to Publish!" : "Finish Remaining Onboarding Steps"}
            </h2>
            <p className="mt-1 text-xs text-slate-600 max-w-xl">
              {passed
                ? "All requirements are verified by the platform. Click Publish to make your storefront live on the public marketplace."
                : `${setupItems.length - completed} item${setupItems.length - completed === 1 ? "" : "s"} still require your attention before publishing.`}
            </p>
            {publishShop.isError && (
              <p className="mt-2 text-xs font-semibold text-rose-600">
                Publishing failed. Please refresh verification and try again.
              </p>
            )}
          </div>

          <Button
            disabled={!canPublish || publishShop.isPending}
            onClick={() => publishShop.mutate()}
            className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold h-10 px-5 text-xs shadow-sm shadow-orange-500/25 shrink-0 cursor-pointer disabled:opacity-50"
          >
            {publishShop.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Rocket className="mr-2 size-4" />
            )}
            {passed ? "Publish Store Live" : "Requirements Incomplete"}
          </Button>
        </section>
      )}
    </div>
  );
}
