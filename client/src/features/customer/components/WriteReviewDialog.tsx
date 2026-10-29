import { useState, useEffect } from "react";
import { Star, Loader2, Package, CheckCircle2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
    useSubmitProductReview,
    useMyProductReview,
} from "../reviews/reviews.hooks";

interface WriteReviewDialogProps {
    productId: string;
    productName: string;
    productImage?: string | null;
    isOpen: boolean;
    onClose: () => void;
}

const RATING_DESCRIPTIONS: Record<number, string> = {
    1: "Poor — Not as described",
    2: "Fair — Below expectations",
    3: "Good — Satisfactory quality",
    4: "Very Good — Highly recommended",
    5: "Excellent — Exceeded expectations!",
};

export function WriteReviewDialog({
    productId,
    productName,
    productImage,
    isOpen,
    onClose,
}: WriteReviewDialogProps) {
    const { data: existingReview, isLoading: isLoadingReview } =
        useMyProductReview(productId, isOpen);
    const submitReview = useSubmitProductReview(productId);

    const [rating, setRating] = useState<number>(5);
    const [hoverRating, setHoverRating] = useState<number | null>(null);
    const [comment, setComment] = useState<string>("");

    useEffect(() => {
        if (existingReview) {
            setRating(existingReview.rating);
            setComment(existingReview.comment || "");
        } else {
            setRating(5);
            setComment("");
        }
    }, [existingReview, isOpen]);

    const activeRating = hoverRating ?? rating;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating < 1 || rating > 5) {
            toast.add({
                title: "Please choose a rating",
                description: "Select 1 to 5 stars before submitting.",
                type: "warning",
            });
            return;
        }

        submitReview.mutate(
            { rating, comment },
            {
                onSuccess: () => {
                    toast.add({
                        title: existingReview ? "Review updated!" : "Review submitted!",
                        description: `Thank you for sharing your feedback for "${productName}".`,
                        type: "success",
                    });
                    onClose();
                },
                onError: (err: any) => {
                    const msg =
                        err?.response?.data?.message ||
                        err?.message ||
                        "Could not submit review. Please try again.";
                    toast.add({
                        title: "Failed to submit review",
                        description: msg,
                        type: "error",
                    });
                },
            }
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md rounded-3xl p-6 sm:p-7 bg-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
                        {existingReview ? "Edit Your Review" : "Rate & Review Product"}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        Help other customers by sharing your honest experience with this
                        item.
                    </DialogDescription>
                </DialogHeader>

                {/* Product Snippet */}
                <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 mt-1">
                    <div className="size-12 shrink-0 rounded-xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                        {productImage ? (
                            <img
                                src={productImage}
                                alt={productName}
                                className="size-full object-cover"
                            />
                        ) : (
                            <Package className="size-5 text-slate-400" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                            {productName}
                        </p>
                        <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="size-3" /> Verified Purchase
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 mt-3">
                    {/* Interactive Star Rating */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Overall Rating
                        </label>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(null)}
                                    className="p-1 text-slate-200 transition-transform hover:scale-110 focus:outline-hidden"
                                    title={`${star} Star${star > 1 ? "s" : ""}`}
                                >
                                    <Star
                                        className={`size-8 transition-colors ${
                                            star <= activeRating
                                                ? "text-amber-400 fill-amber-400 drop-shadow-xs"
                                                : "text-slate-200 hover:text-amber-200"
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>

                        {/* Rating text description */}
                        <p className="mt-1.5 text-xs font-semibold text-slate-700 min-h-4">
                            {RATING_DESCRIPTIONS[activeRating] || "Click to rate"}
                        </p>
                    </div>

                    {/* Review Comment */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label
                                htmlFor="review-comment"
                                className="text-xs font-bold uppercase tracking-wider text-slate-500"
                            >
                                Your Review (Optional)
                            </label>
                            <span className="text-[10px] text-slate-400 font-mono">
                                {comment.length} / 2000
                            </span>
                        </div>
                        <textarea
                            id="review-comment"
                            rows={4}
                            value={comment}
                            maxLength={2000}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="What did you like or dislike? How was the fit, material, or quality?"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:outline-hidden transition resize-none"
                        />
                    </div>

                    <DialogFooter className="flex-row gap-2 sm:justify-end pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={submitReview.isPending}
                            className="rounded-full text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitReview.isPending || isLoadingReview}
                            className="rounded-full bg-slate-900 text-white hover:bg-slate-800 text-xs px-6 font-semibold"
                        >
                            {submitReview.isPending ? (
                                <>
                                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                                    Submitting...
                                </>
                            ) : existingReview ? (
                                "Update Review"
                            ) : (
                                "Submit Review"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
