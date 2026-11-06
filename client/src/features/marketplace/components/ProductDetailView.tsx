"use client";

import { useState, useRef, useEffect } from "react";
import {
  Heart,
  CheckCircle2,
  ShieldCheck,
  Truck,
  RotateCcw,
  PackageOpen,
  Share2,
  Star,
  Store as StoreIcon,
  Tag,
  X,
  Loader2,
  Pencil,
  Trash2,
  Minus,
  Plus,
  ShoppingCart,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useDeleteProductReview, useProductDetails, useProductReviews, useSaveProductReview, useWishlist, useWishlistToggle } from "./marketplace.hooks";
import { useAuthStore } from "@/store/auth.store";
import { useAddToCart } from "@/features/cart/cart.hook";
import { toast } from "@/components/ui/toast";
import { addGuestCartItem } from "@/features/cart/guest-cart";

interface ProductDetailViewProps {
  productId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
}

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export function ProductDetailView({
  productId,
  isOpen,
  onClose,
}: ProductDetailViewProps) {
  const { data: product, isLoading, isError } = useProductDetails(productId || "");
  const addToCart = useAddToCart();
  const { data: reviewData } = useProductReviews(productId || undefined);
  const saveReview = useSaveProductReview(productId || undefined);
  const deleteReview = useDeleteProductReview(productId || undefined);
  const wishlistToggle = useWishlistToggle();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentUser = useAuthStore((state) => state.user);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { data: wishlist = [] } = useWishlist();
  const isLiked = productId ? wishlist.some((item) => item.productId === productId) : false;
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "store" | "reviews">("overview");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [entered, setEntered] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setEntered(false);
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => setEntered(true));
        return () => cancelAnimationFrame(raf2);
      });
      return () => cancelAnimationFrame(raf1);
    } else {
      setEntered(false);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedVariantId(null);
    setQuantity(1);
  }, [productId]);

  if (!productId) return null;

  const images = product?.images?.length
    ? product.images
    : [{ id: "placeholder", url: "", isPrimary: true }];

  const sellerName = product?.shop?.profile?.name || product?.shop?.slug || "Verified Store";
  const sellerLogo = product?.shop?.profile?.logo;
  const sellerSlug = product?.shop?.slug || "official-store";

  const variants = (product?.variants ?? []) as ProductVariant[];
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId);
  const ownReview = reviewData?.reviews?.find((review: { userId: string }) => review.userId === currentUser?.id);
  const currentPrice = selectedVariant ? selectedVariant.price : product?.basePrice;
  const currentStock = selectedVariant ? selectedVariant.stock : (product?.stock ?? 0);
  const productPromotion = product?.coupons?.[0]?.coupon;
  const promotionLabel = productPromotion ? productPromotion.type === "PERCENTAGE" ? `${Number(productPromotion.value)}% OFF` : `$${Number(productPromotion.value).toFixed(2)} OFF` : null;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (variants.length > 0 && !selectedVariant) {
      toast.add({
        title: "Select an option",
        description: "Choose a product variant before adding this item to your cart.",
        type: "error",
      });
      return;
    }

    const payload = {
      productId: product.id,
      ...(selectedVariantId ? { variantId: selectedVariantId } : {}),
      quantity,
    };

    if (!isAuthenticated) {
      addGuestCartItem(product, payload);
      toast.add({
        title: "Added to cart",
        description: `${product.name} was added to your guest cart.`,
        type: "success",
      });
      return;
    }

    addToCart.mutate(payload, {
      onSuccess: () => toast.add({
        title: "Added to cart",
        description: `${product.name} was added to your cart.`,
        type: "success",
      }),
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className={`!w-screen !max-w-none lg:!w-[48vw] lg:!min-w-[700px] lg:!max-w-[800px] h-full p-0 flex flex-col bg-white border-l border-slate-200 shadow-2xl overflow-hidden font-sans transition-transform transition-opacity duration-300 ease-out ${
          entered ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        }`}
      >
        <SheetTitle className="sr-only">Product Details - {product?.name || "Loading"}</SheetTitle>

        {/* Top Header Bar */}
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 px-5 lg:px-6 py-3.5 flex items-center justify-between shrink-0 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
              SKU: {productId.slice(0, 8)}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-600 truncate">
              {sellerName}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleShare}
              className="p-2 text-slate-500 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center h-9 w-9"
              title="Share product"
            >
              {isCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              disabled={wishlistToggle.isPending}
              onClick={() => {
                if (!productId) return;
                wishlistToggle.mutate(
                  {
                    productId,
                    saved: isLiked,
                    productData: product
                      ? {
                          id: product.id,
                          name: product.name,
                          basePrice: currentPrice || product.basePrice,
                          stock: currentStock,
                          shop: product.shop,
                          images: product.images || [],
                        }
                      : undefined,
                  },
                  {
                    onSuccess: () => {
                      toast.add({
                        title: isLiked ? "Removed from wishlist" : "Added to wishlist",
                        description: isLiked
                          ? `"${product?.name}" removed from wishlist.`
                          : `"${product?.name}" saved to wishlist.`,
                        type: "success",
                      });
                    },
                    onError: () => {
                      toast.add({
                        title: "Failed to update wishlist",
                        description: "Please try again.",
                        type: "error",
                      });
                    },
                  }
                );
              }}
              className="p-2 text-slate-500 hover:text-rose-600 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center h-9 w-9 cursor-pointer"
              title={isLiked ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              <Heart
                className={`h-4 w-4 transition-transform active:scale-125 ${
                  isLiked ? "fill-rose-600 text-rose-600" : ""
                }`}
              />
            </button>
            <div className="h-4 w-px bg-slate-200 mx-1" />
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center h-9 w-9"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            <p className="text-sm text-slate-500 font-medium">Loading details...</p>
          </div>
        ) : isError || !product ? (
          <div className="flex-1 p-8 text-center flex flex-col items-center justify-center space-y-4 bg-white">
            <p className="text-base font-semibold text-rose-600">Failed to load product information.</p>
            <Button variant="outline" onClick={onClose} className="rounded-lg">
              Close Drawer
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto overflow-x-hidden divide-y divide-slate-100 bg-white">

            {/* Main Product Showcase Section */}
            <div className="p-5 lg:p-6 space-y-6">

              {/* Image Showcase */}
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto max-h-72 scrollbar-none shrink-0 w-full sm:w-16">
                    {images.map((img: { id?: string; url: string }, idx: number) => (
                      <button
                        key={img.id || idx}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`relative aspect-square w-14 sm:w-16 rounded-md overflow-hidden border transition-all shrink-0 bg-slate-50 ${
                          selectedImageIndex === idx
                            ? "border-orange-500 ring-1 ring-orange-500"
                            : "border-slate-200 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Main Image */}
                <div className="relative flex-1 aspect-square max-h-80 sm:max-h-96 w-full overflow-hidden rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center p-4">
                  {promotionLabel && <span className="absolute top-3 left-3 z-10 bg-rose-600 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shadow-sm tracking-wider">{promotionLabel}</span>}
                  {images[selectedImageIndex]?.url ? (
                    <img
                      src={images[selectedImageIndex].url}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                      <PackageOpen className="h-10 w-10 stroke-[1.2]" />
                      <span className="text-xs font-medium">No Image Available</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="space-y-3">
                {product.category && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <Tag className="h-3.5 w-3.5" />
                    <span>{product.category.name}</span>
                  </div>
                )}

                <h1 className="text-xl lg:text-2xl font-bold text-slate-900 leading-snug break-words">
                  {product.name}
                </h1>

                {/* Alibaba/Walmart Style Rating & Order Stats */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-1">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="font-bold text-slate-900 ml-1">{reviewData?.averageRating || "New"}</span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <span className="hover:underline cursor-pointer">{reviewData?.reviewCount ?? 0} Reviews</span>
                </div>
              </div>

              {/* Current product price and verified promotion */}
              <div className="bg-slate-50 border-y border-slate-100 py-3.5 px-4 -mx-5 lg:-mx-6 flex items-baseline justify-between gap-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                    ${Number(currentPrice || 0).toFixed(2)}
                  </span>
                </div>
                {promotionLabel && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">
                    {promotionLabel}
                  </span>
                )}
              </div>

              {/* Variants Selector */}
              {product.variants && product.variants.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                    Options / Specifications
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((variant) => (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setSelectedVariantId(variant.id)}
                        disabled={variant.stock <= 0}
                        className={`px-3.5 py-2 text-xs rounded border transition-all shrink-0 ${
                          selectedVariantId === variant.id
                            ? "border-slate-900 bg-slate-900 text-white font-semibold"
                            : variant.stock <= 0
                              ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        {variant.name} <span className="opacity-80">(${variant.price})</span>
                        {variant.stock <= 0 && <span className="ml-1">(Out of stock)</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector & CTAs */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider shrink-0">
                    Quantity
                  </span>
                  <div className="flex items-center border border-slate-200 rounded bg-white h-9 w-28">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-2.5 text-slate-600 hover:bg-slate-50 h-full flex items-center justify-center transition-colors"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="flex-1 text-center text-xs font-bold text-slate-900">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(currentStock || 99, q + 1))}
                      className="px-2.5 text-slate-600 hover:bg-slate-50 h-full flex items-center justify-center transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {currentStock > 0 ? `${currentStock} available` : "Out of stock"}
                  </span>
                </div>

                <Button
                  variant="outline"
                  disabled={currentStock <= 0 || (variants.length > 0 && !selectedVariant) || addToCart.isPending}
                  onClick={handleAddToCart}
                  className="w-full h-11 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-bold text-sm rounded shadow-none gap-2 transition-all"
                >
                  {addToCart.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-4 w-4 shrink-0" />
                  )}
                  {addToCart.isPending ? "Adding..." : "Add to Cart"}
                </Button>
              </div>

            </div>

            {/* Navigation Tabs & Details Container */}
            <div className="p-5 lg:p-6 space-y-6">

              {/* Tabs */}
              <div className="flex border-b border-slate-200 text-sm font-semibold overflow-x-auto scrollbar-none">
                {(["overview", "store", "reviews"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    ref={(el) => {
                      tabRefs.current[tab] = el;
                    }}
                    onClick={() => {
                      setActiveTab(tab);
                      tabRefs.current[tab]?.scrollIntoView({
                        behavior: "smooth",
                        inline: "center",
                        block: "nearest",
                      });
                    }}
                    className={`py-2.5 mr-6 border-b-2 transition-colors capitalize whitespace-nowrap ${
                      activeTab === tab
                        ? "border-slate-900 text-slate-900 font-bold"
                        : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    {tab === "reviews" ? `Reviews (${reviewData?.reviewCount ?? 0})` : tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="text-sm text-slate-700 leading-relaxed">

                {/* Description and product information */}
                {activeTab === "overview" && (
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Product Description</h3>
                      <p className="whitespace-pre-line text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {product.description || "No detailed description provided by the merchant."}
                      </p>
                    </div>
                    <div className="border border-slate-200 rounded-md overflow-hidden divide-y divide-slate-200 text-xs sm:text-sm">
                    <div className="grid grid-cols-3 p-3 bg-slate-50">
                      <span className="font-semibold text-slate-500">Product SKU</span>
                      <span className="col-span-2 font-mono text-slate-900">{product.id}</span>
                    </div>
                    <div className="grid grid-cols-3 p-3 bg-white">
                      <span className="font-semibold text-slate-500">Type</span>
                      <span className="col-span-2 text-slate-900">{product.type || "Physical Product"}</span>
                    </div>
                    <div className="grid grid-cols-3 p-3 bg-slate-50">
                      <span className="font-semibold text-slate-500">Category</span>
                      <span className="col-span-2 text-slate-900">{product.category?.name || "Uncategorized"}</span>
                    </div>
                    <div className="grid grid-cols-3 p-3 bg-white">
                      <span className="font-semibold text-slate-500">Seller Handle</span>
                      <span className="col-span-2 font-mono text-slate-900">@{sellerSlug}</span>
                    </div>
                    </div>
                  </div>
                )}

                {/* Merchant & Store Info */}
                {activeTab === "store" && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
                      {sellerLogo ? (
                        <img src={sellerLogo} alt="" className="h-12 w-12 rounded-full object-cover border border-slate-200" />
                      ) : (
                        <StoreIcon className="h-12 w-12 text-slate-400 p-2.5 bg-slate-100 rounded-full" />
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{sellerName}</h3>
                        <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 pt-0.5">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Verified Merchant
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <ShieldCheck className="h-4 w-4 text-emerald-600" /> Buyer Protection
                        </div>
                        <p className="text-slate-500">Full refund guarantees on eligible purchases.</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <Truck className="h-4 w-4 text-slate-700" /> Tracked Dispatch
                        </div>
                        <p className="text-slate-500">Direct warehouse dispatch with live tracking.</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <RotateCcw className="h-4 w-4 text-slate-700" /> Easy Returns
                        </div>
                        <p className="text-slate-500">30-day exchange & return window.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Customer Reviews */}
                {activeTab === "reviews" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="font-bold text-slate-900 text-sm">{reviewData?.averageRating ?? "New"} / 5.0 Rating</span>
                    </div>

                    {isAuthenticated && (
                      <form
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3"
                        onSubmit={(event) => {
                          event.preventDefault();
                          saveReview.mutate({ rating: reviewRating, comment: reviewComment.trim() || undefined }, {
                            onSuccess: () => {
                              toast.add({ title: "Review saved", description: "Your review has been published.", type: "success" });
                              setReviewComment("");
                            },
                            onError: () => toast.add({ title: "Unable to save review", description: "Please sign in with an eligible account and try again.", type: "error" }),
                          });
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{ownReview ? "Update your review" : "Review this product"}</span>
                          {ownReview && <button type="button" className="text-xs text-rose-600 hover:underline" disabled={deleteReview.isPending} onClick={() => deleteReview.mutate(ownReview.id, { onSuccess: () => toast.add({ title: "Review deleted", description: "Your review was removed.", type: "success" }) })}><Trash2 className="mr-1 inline size-3" />Delete</button>}
                        </div>
                        <div className="flex gap-1" aria-label="Rating">
                          {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`${value} stars`} onClick={() => setReviewRating(value)}><Star className={`size-5 ${value <= reviewRating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} /></button>)}
                        </div>
                        <textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} maxLength={2000} placeholder="Share your experience (optional)" className="min-h-20 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20" />
                        <Button type="submit" disabled={saveReview.isPending} size="sm" className="rounded-lg bg-slate-900 text-white hover:bg-slate-700">{saveReview.isPending ? <Loader2 className="mr-2 size-3 animate-spin" /> : <Pencil className="mr-2 size-3" />}{ownReview ? "Update review" : "Submit review"}</Button>
                      </form>
                    )}
                    <div className="space-y-4 pt-1">{reviewData?.reviews?.length ? reviewData.reviews.map((review: { id: string; userId: string; rating: number; comment?: string; createdAt: string; user: { name: string }; reply?: { comment: string } | null }) => <div key={review.id} className="border-b border-slate-100 pb-3"><div className="flex items-center justify-between"><span className="font-bold text-slate-900 text-xs">{review.user.name}{review.userId === currentUser?.id ? " (You)" : ""}</span><span className="text-[11px] text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</span></div><div className="mt-1 flex text-amber-400">{Array.from({ length: review.rating }).map((_, index) => <Star key={index} className="size-3 fill-current" />)}</div>{review.comment && <p className="mt-2 text-xs leading-relaxed text-slate-600">{review.comment}</p>}{review.reply && <div className="mt-3 rounded-lg bg-slate-50 p-2 text-xs text-slate-600"><span className="font-bold text-slate-900">Seller response: </span>{review.reply.comment}</div>}</div>) : <p className="text-xs text-slate-500">No customer reviews yet.</p>}</div>
                  </div>
                )}

              </div>
            </div>

          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
