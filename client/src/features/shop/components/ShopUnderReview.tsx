import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Clock,
  CheckCircle2,
  RefreshCw,
  Store,
  ArrowRight,
  Mail,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useAuthStore } from "@/store/auth.store";

interface ShopUnderReviewProps {
  shop: {
    id: string;
    slug: string;
    status: string;
    createdAt?: string;
    profile?: {
      name?: string | null;
      description?: string | null;
    } | null;
    rejectionReason?: string;
    rejectionNotes?: string;
  };
  onRefresh: () => Promise<any> | void;
  isRefreshing?: boolean;
}

export function ShopUnderReview({ shop, onRefresh, isRefreshing = false }: ShopUnderReviewProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [checking, setChecking] = useState(false);
  const shopName = shop.profile?.name || shop.slug || "Your Shop";

  // Auto-check status every 12 seconds in the background
  useEffect(() => {
    if (shop.status?.toUpperCase() !== "PENDING") return;

    const interval = setInterval(() => {
      onRefresh();
    }, 12000);

    return () => clearInterval(interval);
  }, [shop.status, onRefresh]);

  const handleManualCheck = async () => {
    setChecking(true);
    try {
      const res = await onRefresh();
      const updatedShops = res?.data?.data || res?.data || [];
      const updatedShop = Array.isArray(updatedShops)
        ? updatedShops.find((s: any) => s.id === shop.id)
        : null;

      if (updatedShop && updatedShop.status?.toUpperCase() === "ACTIVE") {
        toast.add({
          title: "Shop Approved! 🎉",
          description: `Great news! "${shopName}" is now active and ready for business.`,
          type: "success",
        });
      } else if (updatedShop && updatedShop.status?.toUpperCase() === "REJECTED") {
        toast.add({
          title: "Application Status Updated",
          description: "Your shop application was reviewed by administration.",
          type: "error",
        });
      } else {
        toast.add({
          title: "Still Under Review",
          description: "Administrator review is in progress. We'll update you as soon as it's approved.",
          type: "info",
        });
      }
    } catch {
      toast.add({
        title: "Connection Issue",
        description: "Could not refresh shop status. Please check your connection.",
        type: "error",
      });
    } finally {
      setChecking(false);
    }
  };

  const isRejected = shop.status?.toUpperCase() === "REJECTED";
  const formattedDate = shop.createdAt
    ? new Date(shop.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

  return (
    <div className="mx-auto max-w-4xl py-6 px-4 sm:px-6 lg:py-10 animate-fade-in">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/shops" className="hover:text-orange-600 transition-colors">
            My Shops
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-900 truncate max-w-[200px]">{shopName}</span>
          <span>/</span>
          <span className="text-amber-600 font-medium">Review Status</span>
        </div>

        <div className="flex items-center gap-2">
          {isRejected ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 border border-rose-200 text-rose-700">
              <AlertCircle className="size-3.5 text-rose-600" />
              Application Rejected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 border border-amber-200 text-amber-700">
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              Under Administrator Review
            </span>
          )}
        </div>
      </div>

      {/* Main Review Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Banner Area */}
        <div
          className={`p-6 sm:p-8 border-b ${
            isRejected
              ? "bg-rose-50/50 border-rose-100"
              : "bg-gradient-to-r from-amber-50/80 via-orange-50/40 to-white border-amber-100/80"
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div
              className={`flex size-14 shrink-0 items-center justify-center rounded-2xl border shadow-sm ${
                isRejected
                  ? "bg-rose-100/80 border-rose-200 text-rose-600"
                  : "bg-amber-100/90 border-amber-200 text-amber-600"
              }`}
            >
              {isRejected ? (
                <AlertCircle className="size-7" />
              ) : (
                <Clock className="size-7 animate-pulse" />
              )}
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <Store className="size-4 text-orange-500" />
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate">
                  {isRejected
                    ? `Shop Application Rejected: ${shopName}`
                    : `Your shop "${shopName}" is under review`}
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                {isRejected
                  ? "An administrator has reviewed your application. Unfortunately, your shop could not be activated with the current information."
                  : "Thank you for creating your store! To maintain marketplace quality and buyer security, all new storefronts require administrative approval before they can be activated."}
              </p>
            </div>
          </div>
        </div>

        {/* Body Area */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Rejection Details Box (If rejected) */}
          {isRejected && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 space-y-2">
              <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="size-4 text-rose-600" />
                Reason for Rejection
              </h3>
              <p className="text-sm text-rose-700 font-medium">
                {shop.rejectionReason || "Store application did not meet marketplace requirements."}
              </p>
              {shop.rejectionNotes && (
                <p className="text-xs text-rose-600 pt-1 border-t border-rose-200/60">
                  <span className="font-semibold">Reviewer Notes:</span> {shop.rejectionNotes}
                </p>
              )}
            </div>
          )}

          {/* Stepper Timeline */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Verification Progress
            </h2>

            <div className="grid gap-4 sm:grid-cols-3">
              {/* Step 1 */}
              <div className="relative rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex size-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
                    <CheckCircle2 className="size-4" />
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600">Completed</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">1. Shop Registered</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Submitted on {formattedDate}. Basic store profile created.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div
                className={`relative rounded-xl border p-4 space-y-2 ${
                  isRejected
                    ? "border-rose-200 bg-rose-50/40"
                    : "border-amber-300 bg-amber-50/50 shadow-xs ring-1 ring-amber-400/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex size-7 items-center justify-center rounded-full text-white shadow-xs ${
                      isRejected ? "bg-rose-500" : "bg-amber-500"
                    }`}
                  >
                    {isRejected ? <AlertCircle className="size-4" /> : <Clock className="size-4" />}
                  </span>
                  <span
                    className={`text-[11px] font-bold ${
                      isRejected ? "text-rose-600" : "text-amber-700"
                    }`}
                  >
                    {isRejected ? "Action Required" : "In Review"}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">2. Admin Verification</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {isRejected
                      ? "Application audited. Needs revision or compliance update."
                      : "Super Admin is currently auditing your storefront compliance."}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-2 opacity-80">
                <div className="flex items-center justify-between">
                  <span className="flex size-7 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                    <Sparkles className="size-4" />
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">Up Next</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700">3. Live Activation</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Full catalog, order management, and payout tools unlock.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Information Strip */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3 text-xs text-slate-600">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-orange-500" />
              What to expect while under review
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Mail className="size-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Email Confirmation:</strong> We will automatically send an email to{" "}
                  <strong className="text-slate-900">{user?.email || "your email"}</strong> as soon
                  as the admin approves your shop.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <RefreshCw className="size-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  <strong>No Re-login Required:</strong> You do not need to log out and log back in.
                  The page automatically checks for approval every few seconds, or you can click the
                  refresh button below.
                </span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                onClick={handleManualCheck}
                disabled={checking || isRefreshing}
                className="h-10 px-5 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-xs transition-all cursor-pointer w-full sm:w-auto inline-flex items-center justify-center gap-2 active:scale-95"
              >
                <RefreshCw
                  className={`size-3.5 ${checking || isRefreshing ? "animate-spin" : ""}`}
                />
                <span>{checking || isRefreshing ? "Checking Status..." : "Refresh Approval Status"}</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate("/shops")}
                className="h-10 px-4 text-xs font-semibold rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 w-full sm:w-auto"
              >
                All My Shops
              </Button>
            </div>

            <Link
              to="/"
              className="text-xs font-medium text-slate-500 hover:text-orange-600 transition-colors inline-flex items-center gap-1"
            >
              <span>Back to Marketplace</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
