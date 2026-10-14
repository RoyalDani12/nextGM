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
  Sparkles,
  Store as StoreIcon,
  Tag,
  X,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
  ShoppingBag,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useProductDetails } from "./marketplace.hooks";
import { useAddToCart } from "@/features/cart/cart.hook";

interface ProductDetailViewProps {
  productId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
}

export function ProductDetailView({
  productId,
  isOpen,
  onClose,
}: ProductDetailViewProps) {
  const { data: product, isLoading, isError } = useProductDetails(productId || "");
  const addToCart = useAddToCart();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "specs" | "store" | "reviews">("description");
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

  if (!productId) return null;

  const images = product?.images?.length
    ? product.images
    : [{ id: "placeholder", url: "", isPrimary: true }];

  const sellerName = product?.shop?.profile?.name || product?.shop?.slug || "Verified Store";
  const sellerLogo = product?.shop?.profile?.logo;
  const sellerSlug = product?.shop?.slug || "official-store";

  const selectedVariant = product?.variants?.find((v: any) => v.id === selectedVariantId);
  const currentPrice = selectedVariant ? selectedVariant.price : product?.basePrice;
  const currentStock = selectedVariant ? selectedVariant.stock : (product?.stock ?? 0);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleAddToCart = () => {
    if (!product) return;

    addToCart.mutate({
      productId: product.id,
      ...(selectedVariantId ? { variantId: selectedVariantId } : {}),
      quantity,
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
              onClick={() => setIsLiked(!isLiked)}
              className="p-2 text-slate-500 hover:text-rose-600 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center h-9 w-9"
              title="Add to Wishlist"
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-rose-600 text-rose-600" : ""}`} />
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
                  <span className="absolute top-3 left-3 z-10 bg-rose-600 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shadow-sm tracking-wider">
                    40% OFF
                  </span>
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
                    <span className="font-bold text-slate-900 ml-1">4.9</span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <span className="hover:underline cursor-pointer">8 Reviews</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-900 font-semibold">40+ Sold</span>
                </div>
              </div>

              {/* Walmart / Alibaba Style Clean Pricing Banner */}
              <div className="bg-slate-50 border-y border-slate-100 py-3.5 px-4 -mx-5 lg:-mx-6 flex items-baseline justify-between gap-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                    ${Number(currentPrice || 0).toFixed(2)}
                  </span>
                  <span className="text-sm text-slate-400 line-through font-medium">
                    ${(Number(currentPrice || 0) * 1.4).toFixed(2)}
                  </span>
                </div>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded border border-rose-100">
                  Save 40%
                </span>
              </div>

              {/* Variants Selector */}
              {product.variants && product.variants.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                    Options / Specifications
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant: any) => (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setSelectedVariantId(variant.id === selectedVariantId ? null : variant.id)}
                        className={`px-3.5 py-2 text-xs rounded border transition-all shrink-0 ${
                          selectedVariantId === variant.id
                            ? "border-slate-900 bg-slate-900 text-white font-semibold"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        {variant.name} <span className="opacity-80">(${variant.price})</span>
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

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    disabled={currentStock <= 0}
                    className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded shadow-none transition-all disabled:opacity-50 gap-2"
                  >
                    <ShoppingBag className="h-4 w-4 shrink-0" />
                    {currentStock > 0 ? "Buy Now" : "Out of Stock"}
                  </Button>

                  <Button
                    variant="outline"
                    disabled={currentStock <= 0 || addToCart.isPending}
                    onClick={handleAddToCart}
                    className="flex-1 h-11 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-bold text-sm rounded shadow-none gap-2 transition-all"
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

            </div>

            {/* AI Summary Section (Clean Inline Highlight) */}
            <div className="p-5 lg:p-6 bg-slate-50/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-900">
                <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>AI Item Summary</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {product.description || "High-performance item verified for material quality, structural durability, and standard seller specifications."}
              </p>
            </div>

            {/* Navigation Tabs & Details Container */}
            <div className="p-5 lg:p-6 space-y-6">

              {/* Tabs */}
              <div className="flex border-b border-slate-200 text-sm font-semibold overflow-x-auto scrollbar-none">
                {(["description", "specs", "store", "reviews"] as const).map((tab) => (
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
                    {tab === "reviews" ? "Reviews (8)" : tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="text-sm text-slate-700 leading-relaxed">

                {/* Description */}
                {activeTab === "description" && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Product Description</h3>
                    <p className="whitespace-pre-line text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {product.description || "No detailed description provided by the merchant."}
                    </p>
                  </div>
                )}

                {/* Alibaba/Walmart Technical Specifications Table */}
                {activeTab === "specs" && (
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
                      <span className="font-bold text-slate-900 text-sm">5.0 / 5.0 Rating</span>
                    </div>

                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">John Smith</span>
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold uppercase">
                            Verified
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">2 days ago</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Item arrived quickly and exactly as described. Packaging was secure and build quality is top-notch.
                      </p>
                    </div>
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