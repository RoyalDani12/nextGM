import React, { useState } from "react";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Star,
  Eye,
  EyeOff,
  Trash2,
  MessageSquare,
  ShieldAlert,
  CheckCircle2,
  Package,
  Store,
} from "lucide-react";
import {
  useAdminReviews,
  useToggleReviewVisibility,
  useAdminDeleteReview,
} from "@/features/admin/admin.hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";

export const AdminReviewsPage = () => {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [rating, setRating] = useState<string>("");
  const [visibility, setVisibility] = useState<string>("");
  const [page, setPage] = useState(1);

  const parsedVisibility =
    visibility === "visible" ? true : visibility === "hidden" ? false : undefined;

  const { data, isLoading, isError, refetch } = useAdminReviews({
    search: search || undefined,
    rating: rating ? parseInt(rating) : undefined,
    isVisible: parsedVisibility,
    page,
    limit: 20,
  });

  const toggleVisibilityMutation = useToggleReviewVisibility();
  const deleteReviewMutation = useAdminDeleteReview();

  const reviews = data?.reviews ?? [];
  const stats = data?.stats;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleToggleVisibility = (id: string, currentVisible: boolean) => {
    const nextState = !currentVisible;
    toggleVisibilityMutation.mutate(
      { id, isVisible: nextState },
      {
        onSuccess: () => {
          toast.add({
            title: nextState ? "Review is now visible" : "Review hidden from marketplace",
            description: nextState
              ? "Customers can now see this review on the product page."
              : "Review has been hidden from public product listings.",
            type: "success",
          });
        },
        onError: (err: any) => {
          toast.add({
            title: "Failed to update review",
            description: err?.response?.data?.message || "Something went wrong.",
            type: "error",
          });
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this review? This action cannot be undone."
      )
    ) {
      return;
    }

    deleteReviewMutation.mutate(id, {
      onSuccess: () => {
        toast.add({
          title: "Review deleted",
          description: "Review and associated replies were removed permanently.",
          type: "success",
        });
      },
      onError: (err: any) => {
        toast.add({
          title: "Failed to delete review",
          description: err?.response?.data?.message || "Something went wrong.",
          type: "error",
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reviews & Moderation</h1>
        <p className="text-sm text-gray-500 mt-1">
          {data ? `${data.total.toLocaleString()} total platform reviews` : "Loading reviews..."}
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Platform Reviews */}
        <Card className="border-gray-100 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Total Reviews
              </span>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <MessageSquare size={18} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-gray-900">
                {stats?.totalPlatformReviews?.toLocaleString() ?? 0}
              </span>
              <p className="text-xs text-gray-400 mt-1">Across all merchant stores</p>
            </div>
          </CardContent>
        </Card>

        {/* Average Rating */}
        <Card className="border-gray-100 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Platform Rating
              </span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-500">
                <Star size={18} className="fill-amber-400" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900">
                {stats?.avgRating ?? "0.0"}
              </span>
              <span className="text-sm text-gray-400 font-medium">/ 5.0</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">System-wide score</p>
          </CardContent>
        </Card>

        {/* Visible Reviews */}
        <Card className="border-gray-100 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Visible
              </span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-emerald-600">
                {stats?.visibleCount?.toLocaleString() ?? 0}
              </span>
              <p className="text-xs text-gray-400 mt-1">Published on product pages</p>
            </div>
          </CardContent>
        </Card>

        {/* Hidden Reviews */}
        <Card className="border-gray-100 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Hidden / Moderated
              </span>
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
                <ShieldAlert size={18} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-rose-600">
                {stats?.hiddenCount?.toLocaleString() ?? 0}
              </span>
              <p className="text-xs text-gray-400 mt-1">Flagged or invisible</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by comment, product, customer name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSearchInput("");
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </form>

        <div className="flex gap-2">
          {/* Visibility filter */}
          <select
            value={visibility}
            onChange={(e) => {
              setVisibility(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Visibility</option>
            <option value="visible">Visible Only</option>
            <option value="hidden">Hidden Only</option>
          </select>

          {/* Rating filter */}
          <select
            value={rating}
            onChange={(e) => {
              setRating(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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

      {/* Reviews Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="animate-spin text-gray-400" size={28} />
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-600">
            <p className="font-medium text-sm">Failed to load platform reviews.</p>
            <button
              onClick={() => refetch()}
              className="mt-3 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Retry
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <MessageSquare size={36} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-medium">No reviews match the selected criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5">Product & Merchant</th>
                  <th className="px-5 py-3.5">Reviewer</th>
                  <th className="px-5 py-3.5">Rating</th>
                  <th className="px-5 py-3.5">Comment & Reply</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Product & Store */}
                    <td className="px-5 py-4 max-w-xs">
                      <div className="flex items-center gap-3">
                        {review.product.images?.[0]?.url ? (
                          <img
                            src={review.product.images[0].url}
                            alt=""
                            className="h-9 w-9 rounded object-cover border border-gray-100 shrink-0 bg-gray-50"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded border border-gray-100 bg-gray-100 flex items-center justify-center shrink-0 text-gray-400">
                            <Package size={16} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-xs truncate">
                            {review.product.name}
                          </p>
                          <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                            <Store size={11} />
                            <span className="truncate">
                              {review.shop.profile?.name || review.shop.slug}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Reviewer */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="font-medium text-gray-900 text-xs">{review.user.name}</p>
                      <p className="text-[11px] text-gray-400">{review.user.email}</p>
                    </td>

                    {/* Rating */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={12}
                            className={s <= review.rating ? "fill-amber-400" : "text-gray-200"}
                          />
                        ))}
                        <span className="text-xs font-bold text-gray-700 ml-1">
                          {review.rating}.0
                        </span>
                      </div>
                    </td>

                    {/* Comment & Seller reply */}
                    <td className="px-5 py-4 max-w-sm">
                      <p className="text-xs text-gray-800 leading-relaxed line-clamp-2">
                        {review.comment || <span className="italic text-gray-400">No comment</span>}
                      </p>
                      {review.reply && (
                        <div className="mt-1.5 p-1.5 rounded bg-gray-50 border border-gray-100 text-[11px] text-gray-600 line-clamp-1">
                          <span className="font-bold text-gray-800">Merchant: </span>
                          {review.reply.comment}
                        </div>
                      )}
                    </td>

                    {/* Visibility status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {review.isVisible ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-[11px] hover:bg-emerald-50">
                          Visible
                        </Badge>
                      ) : (
                        <Badge className="bg-rose-50 text-rose-700 border border-rose-200 font-medium text-[11px] hover:bg-rose-50">
                          Hidden
                        </Badge>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleVisibility(review.id, review.isVisible)}
                          className={`h-7 px-2 text-xs font-medium ${
                            review.isVisible
                              ? "text-gray-500 hover:text-rose-600 hover:bg-rose-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={review.isVisible ? "Hide review" : "Make visible"}
                        >
                          {review.isVisible ? (
                            <>
                              <EyeOff size={13} className="mr-1" /> Hide
                            </>
                          ) : (
                            <>
                              <Eye size={13} className="mr-1" /> Show
                            </>
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(review.id)}
                          className="h-7 w-7 p-0 text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Permanently delete review"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {data && data.totalPages > 1 && (
          <div className="border-t border-gray-100 p-4 flex items-center justify-between text-xs text-gray-500">
            <span>
              Page {data.page} of {data.totalPages} ({data.total.toLocaleString()} total reviews)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 w-8 p-0"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
