import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Star,
  MessageSquare,
  Search,
  Loader2,
  Trash2,
  Edit3,
  Send,
  MessageCircleOff,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import {
  useShopReviews,
  useReplyShopReview,
  useDeleteShopReviewReply,
} from "./shop.hooks";
import type { ShopReview } from "./shop.api";

export const ShopReviewsPage = () => {
  const { shopId } = useParams<{ shopId: string }>();

  // Filter & pagination state
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("");
  const [replyStatus, setReplyStatus] = useState<"all" | "replied" | "unreplied">("all");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reply dialog state
  const [activeReview, setActiveReview] = useState<ShopReview | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data, isLoading, isError, refetch } = useShopReviews(shopId ?? "", {
    search: search || undefined,
    rating: ratingFilter || undefined,
    replyStatus,
    page: currentPage,
    limit: 15,
  });

  const replyMutation = useReplyShopReview(shopId ?? "");
  const deleteReplyMutation = useDeleteShopReviewReply(shopId ?? "");

  const reviews = data?.reviews ?? [];
  const stats = data?.stats;
  const pagination = data?.pagination;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setCurrentPage(1);
  };

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
            description: "Your response has been published to customers.",
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

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customer Reviews</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor customer satisfaction, reply to buyer feedback, and address concerns.
        </p>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Rating */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Average Rating
              </span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-500">
                <Star className="h-5 w-5 fill-amber-400" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {stats?.averageRating ?? "0.0"}
              </span>
              <span className="text-sm text-slate-400 font-medium">/ 5.0</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-4 w-4 ${
                    s <= Math.round(stats?.averageRating || 0)
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-200"
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Total Reviews */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Reviews
              </span>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <MessageSquare className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900">
                {stats?.totalCount ?? 0}
              </span>
              <p className="text-xs text-slate-500 mt-1">Published buyer ratings</p>
            </div>
          </CardContent>
        </Card>

        {/* Replied Reviews */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Replied
              </span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Send className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-emerald-600">
                {stats?.repliedCount ?? 0}
              </span>
              <p className="text-xs text-slate-500 mt-1">
                {stats?.totalCount
                  ? `${Math.round(((stats.repliedCount || 0) / stats.totalCount) * 100)}% response rate`
                  : "0% response rate"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Needs Reply */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Needs Reply
              </span>
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
                <MessageCircleOff className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-rose-600">
                {stats?.unrepliedCount ?? 0}
              </span>
              <p className="text-xs text-slate-500 mt-1">Pending seller interaction</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by product, customer, or comment..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <Button type="submit" size="sm" className="bg-slate-900 text-white hover:bg-slate-800">
            Search
          </Button>
          {search && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setSearchInput("");
                setCurrentPage(1);
              }}
            >
              Clear
            </Button>
          )}
        </form>

        <div className="flex gap-2 flex-wrap">
          {/* Status filter */}
          <select
            value={replyStatus}
            onChange={(e) => {
              setReplyStatus(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
          >
            <option value="all">All Feedback</option>
            <option value="unreplied">Pending Reply</option>
            <option value="replied">Replied</option>
          </select>

          {/* Rating filter */}
          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* Reviews Content List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-2">
            <Loader2 className="h-7 w-7 animate-spin" />
            <span className="text-xs font-medium">Loading reviews...</span>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-rose-600">
            <p className="font-semibold text-sm">Failed to load reviews.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
              Retry
            </Button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <MessageSquare className="h-10 w-10 mx-auto text-slate-300 mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No reviews found</h3>
            <p className="text-xs text-slate-400 mt-1">
              {search || ratingFilter || replyStatus !== "all"
                ? "Try adjusting your filters or search keywords."
                : "Customer reviews for your products will appear here."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reviews.map((review) => (
              <div key={review.id} className="p-5 hover:bg-slate-50/60 transition-colors space-y-3">
                {/* Product & Header info */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {review.product.images?.[0]?.url ? (
                      <img
                        src={review.product.images[0].url}
                        alt=""
                        className="h-11 w-11 rounded-lg object-cover border border-slate-100 shrink-0 bg-slate-50"
                      />
                    ) : (
                      <div className="h-11 w-11 rounded-lg border border-slate-100 bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                        <Package className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {review.product.name}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-medium text-slate-700">{review.user.name}</span>
                        <span>•</span>
                        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating + Action Button */}
                  <div className="flex items-center gap-3">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3.5 w-3.5 ${
                            s <= review.rating ? "fill-amber-400" : "text-slate-200"
                          }`}
                        />
                      ))}
                    </div>

                    <Button
                      size="sm"
                      variant={review.reply ? "outline" : "default"}
                      onClick={() => handleOpenReplyDialog(review)}
                      className={
                        review.reply
                          ? "h-8 text-xs border-slate-200 text-slate-700"
                          : "h-8 text-xs bg-slate-900 text-white hover:bg-slate-800"
                      }
                    >
                      {review.reply ? (
                        <>
                          <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit Reply
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5 mr-1" /> Reply
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Customer Comment */}
                {review.comment ? (
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-14">
                    {review.comment}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic pl-14">
                    Customer left a star rating without written comments.
                  </p>
                )}

                {/* Seller Reply Box (if present) */}
                {review.reply && (
                  <div className="ml-14 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-slate-900 text-white text-[10px] font-semibold"
                        >
                          Your Response
                        </Badge>
                        <span className="text-[11px] text-slate-400">
                          {new Date(review.reply.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {review.reply.comment}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={deleteReplyMutation.isPending}
                      onClick={() => handleDeleteReply(review.id)}
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-7 w-7 p-0 shrink-0"
                      title="Delete reply"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        {pagination && pagination.totalPages > 1 && (
          <div className="border-t border-slate-100 p-4 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} reviews)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= pagination.totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Reply Modal Dialog */}
      <Dialog open={Boolean(activeReview)} onOpenChange={(open) => !open && handleCloseReplyDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {activeReview?.reply ? "Edit Store Response" : "Reply to Customer Review"}
            </DialogTitle>
            <DialogDescription>
              Your public response will be displayed directly below the customer's review on the
              product page.
            </DialogDescription>
          </DialogHeader>

          {activeReview && (
            <div className="space-y-4 py-2">
              {/* Review summary preview */}
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{activeReview.user.name}</span>
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3 w-3 ${
                          s <= activeReview.rating ? "fill-amber-400" : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600 line-clamp-3">
                  {activeReview.comment || "No written comment provided."}
                </p>
              </div>

              {/* Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Your Response (Public)
                </label>
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Thank you for your feedback! We are glad you enjoyed the item..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                />
                <span className="text-[11px] text-slate-400 block text-right">
                  {replyText.length} / 2000 characters
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            {activeReview?.reply ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteReply(activeReview.id)}
                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete Reply
              </Button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleCloseReplyDialog}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!replyText.trim() || replyMutation.isPending}
                onClick={handleSaveReply}
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                {replyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Send className="h-4 w-4 mr-1" />
                )}
                Save Response
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
