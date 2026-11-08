import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Star,
  Search,
  X,
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Package,
  RefreshCw,
  AlertCircle,
  MessageSquare,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import {
  useShopReviews,
  useReplyShopReview,
  useDeleteShopReviewReply,
} from "./shop.hooks";
import type { ShopReview } from "./shop.api";

const REPLY_TABS = [
  { value: "all", label: "All reviews" },
  { value: "unreplied", label: "Pending reply" },
  { value: "replied", label: "Replied" },
];

const RATING_OPTIONS = [
  { value: "", label: "All ratings" },
  { value: "5", label: "5 stars" },
  { value: "4", label: "4 stars" },
  { value: "3", label: "3 stars" },
  { value: "2", label: "2 stars" },
  { value: "1", label: "1 star" },
];

export const ShopReviewsPage = () => {
  const { shopId = "" } = useParams<{ shopId: string }>();

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("");
  const [replyStatus, setReplyStatus] = useState<"all" | "replied" | "unreplied">("all");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [activeReview, setActiveReview] = useState<ShopReview | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data, isLoading, isError, isFetching, refetch } = useShopReviews(shopId, {
    search: search || undefined,
    rating: ratingFilter || undefined,
    replyStatus,
    page: currentPage,
    limit: 15,
  });

  const replyMutation = useReplyShopReview(shopId);
  const deleteReplyMutation = useDeleteShopReviewReply(shopId);

  const reviews = data?.reviews ?? [];
  const stats = data?.stats;
  const pagination = data?.pagination;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearch("");
    setSearchInput("");
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setSearchInput("");
    setRatingFilter("");
    setReplyStatus("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(search || ratingFilter || replyStatus !== "all");

  const handleOpenReplyDialog = (review: ShopReview) => {
    setActiveReview(review);
    setReplyText(review.reply?.comment || "");
  };

  const handleCloseReplyDialog = () => {
    setActiveReview(null);
    setReplyText("");
  };

  const handleSaveReply = () => {
    if (!activeReview || !replyText.trim()) return;

    replyMutation.mutate(
      { reviewId: activeReview.id, comment: replyText.trim() },
      {
        onSuccess: () => {
          toast.add({
            title: "Reply saved",
            description: "Your response is now visible on the product page.",
            type: "success",
          });
          handleCloseReplyDialog();
        },
        onError: (err: any) => {
          toast.add({
            title: "Failed to save reply",
            description: err?.response?.data?.message || "Something went wrong.",
            type: "error",
          });
        },
      }
    );
  };

  const handleDeleteReply = (reviewId: string) => {
    if (!window.confirm("Are you sure you want to delete this response?")) return;

    deleteReplyMutation.mutate(reviewId, {
      onSuccess: () => {
        toast.add({
          title: "Reply deleted",
          description: "Your response has been removed.",
          type: "success",
        });
        if (activeReview?.id === reviewId) {
          handleCloseReplyDialog();
        }
      },
      onError: (err: any) => {
        toast.add({
          title: "Failed to delete reply",
          description: err?.response?.data?.message || "Something went wrong.",
          type: "error",
        });
      },
    });
  };

  const totalPages = pagination?.totalPages || 1;

  if (isLoading) {
    return (
      <div className="flex min-h-[460px] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-sm mx-auto text-center py-20 space-y-3">
        <AlertCircle className="size-8 text-slate-300 mx-auto" />
        <p className="text-sm font-medium text-slate-700">Couldn't load reviews</p>
        <p className="text-xs text-slate-400">Check your connection and try again.</p>
        <button
          onClick={() => refetch()}
          className="text-xs font-medium text-orange-600 hover:text-orange-700 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-[1200px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Customer Reviews</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {stats?.totalCount ?? 0} {stats?.totalCount === 1 ? "review" : "reviews"}
            {stats?.averageRating ? ` · ${stats.averageRating} average rating` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-40"
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5">
          <p className="text-xs text-slate-500 font-medium">Average rating</p>
          <div className="flex items-baseline gap-1 mt-1">
            <p className="text-xl font-semibold text-slate-900 tabular-nums">
              {stats?.averageRating ?? "0.0"}
            </p>
            <span className="text-xs text-slate-400">/ 5.0</span>
          </div>
          <div className="flex items-center gap-0.5 mt-1 text-amber-400">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`size-3 ${
                  s <= Math.round(Number(stats?.averageRating || 0))
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-200"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5">
          <p className="text-xs text-slate-500 font-medium">Total reviews</p>
          <p className="text-xl font-semibold text-slate-900 mt-1 tabular-nums">
            {stats?.totalCount ?? 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Buyer feedback</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5">
          <p className="text-xs text-slate-500 font-medium">Replied</p>
          <p className="text-xl font-semibold text-slate-900 mt-1 tabular-nums">
            {stats?.repliedCount ?? 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats?.totalCount
              ? `${Math.round(((stats.repliedCount || 0) / stats.totalCount) * 100)}% response rate`
              : "0% response rate"}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5">
          <p className="text-xs text-slate-500 font-medium">Pending reply</p>
          <p className="text-xl font-semibold text-slate-900 mt-1 tabular-nums">
            {stats?.unrepliedCount ?? 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting response</p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="space-y-3">
        {/* Reply Status Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs font-medium">
          {REPLY_TABS.map((tab) => {
            const isActive = replyStatus === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setReplyStatus(tab.value as any);
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "border-orange-500 text-slate-900 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Rating Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search by product, customer, or comment…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all placeholder:text-slate-400"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2">
            <select
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-colors cursor-pointer"
            >
              {RATING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-medium text-rose-600 hover:text-rose-700 px-2 py-1.5 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Content List */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {reviews.length === 0 ? (
          <div className="py-16 text-center">
            <MessageSquare size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500 font-medium">No reviews found</p>
            <p className="text-xs text-slate-400 mt-1">
              {hasActiveFilters
                ? "Try adjusting search terms or filters."
                : "Customer reviews for your products will show here."}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-3 text-xs font-medium text-orange-600 hover:text-orange-700 cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 hover:bg-slate-50/50 transition-colors space-y-3">
                {/* Header row: Product + User + Rating + Action */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-9 shrink-0 rounded bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center">
                      {review.product.images?.[0]?.url ? (
                        <img
                          src={review.product.images[0].url}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <Package size={14} className="text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-900 truncate">
                        {review.product.name}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        <span className="text-slate-700 font-medium">{review.user.name}</span>
                        {" · "}
                        <span>
                          {new Date(review.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`size-3 ${
                            s <= review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-200"
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => handleOpenReplyDialog(review)}
                      className={`text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        review.reply
                          ? "border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium"
                          : "bg-orange-500 hover:bg-orange-600 text-white font-medium"
                      }`}
                    >
                      {review.reply ? "Edit reply" : "Reply"}
                    </button>
                  </div>
                </div>

                {/* Comment body */}
                <div className="pl-11.5">
                  {review.comment ? (
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {review.comment}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Star rating without written review.
                    </p>
                  )}
                </div>

                {/* Seller Reply Box */}
                {review.reply && (
                  <div className="ml-11.5 pl-3 py-2 border-l-2 border-orange-500 bg-slate-50/70 rounded-r-md flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">Your response</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(review.reply.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        {review.reply.comment}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteReply(review.id)}
                      disabled={deleteReplyMutation.isPending}
                      title="Delete response"
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer disabled:opacity-40 shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.total > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 py-1">
          <span>
            Page {pagination.page} of {totalPages} ({pagination.total} reviews)
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage <= 1}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer transition-colors"
              title="First page"
            >
              <ChevronsLeft size={14} />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer transition-colors"
              title="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-2 font-medium text-slate-700">
              {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer transition-colors"
              title="Next page"
            >
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer transition-colors"
              title="Last page"
            >
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Reply Modal Dialog */}
      <Dialog open={Boolean(activeReview)} onOpenChange={(open) => !open && handleCloseReplyDialog()}>
        <DialogContent className="sm:max-w-md rounded-lg bg-white p-5 shadow-xl border border-slate-200">
          <DialogHeader className="space-y-0.5">
            <DialogTitle className="text-base font-semibold text-slate-900">
              {activeReview?.reply ? "Edit response" : "Reply to review"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Your response will be displayed publicly below the customer's review.
            </DialogDescription>
          </DialogHeader>

          {activeReview && (
            <div className="space-y-3 pt-2">
              <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800">{activeReview.user.name}</span>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`size-3 ${
                          s <= activeReview.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-slate-600 line-clamp-3">
                  {activeReview.comment || "No written comment provided."}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Your response
                </label>
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a clear, helpful response to the buyer…"
                  className="w-full text-xs p-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 resize-none transition-all"
                />
                <span className="text-[11px] text-slate-400 block text-right">
                  {replyText.length} / 2000
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
            {activeReview?.reply ? (
              <button
                type="button"
                onClick={() => handleDeleteReply(activeReview.id)}
                className="text-xs font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={12} /> Delete reply
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCloseReplyDialog}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!replyText.trim() || replyMutation.isPending}
                onClick={handleSaveReply}
                className="px-4 py-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40 inline-flex items-center gap-1.5"
              >
                {replyMutation.isPending ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save response"
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
