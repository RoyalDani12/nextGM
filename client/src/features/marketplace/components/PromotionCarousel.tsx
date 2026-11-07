import { useEffect, useRef, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, Heart, Sparkles, Tag } from "lucide-react";
import { usePromotedProducts, useWishlist, useWishlistToggle } from "./marketplace.hooks";
import hotToast from "react-hot-toast";

type DealProductItem = {
  id: string;
  name: string;
  basePrice: number | string;
  images?: Array<{ url?: string }>;
  coupon?: {
    code: string;
    type: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
    value: number | string;
    minOrderAmount?: number | string | null;
  } | null;
  seller?: string;
};

interface PromotionCarouselProps {
  onSelect: (productId: string) => void;
  fallbackProducts?: Array<{
    id: string;
    name: string;
    basePrice: number | string;
    images?: Array<{ url?: string }>;
    promotion?: {
      code: string;
      type: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
      value: number | string;
      minOrderAmount?: number | string | null;
    } | null;
    shop?: {
      slug?: string;
      profile?: { name?: string };
    };
  }>;
}

export function PromotionCarousel({ onSelect, fallbackProducts = [] }: PromotionCarouselProps) {
  const { data: promotions = [] } = usePromotedProducts();
  const { data: wishlist = [] } = useWishlist();
  const { mutate: toggleWishlist, isPending: isWishlistPending } = useWishlistToggle();
  const track = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // 1. Promoted items with active coupons come first
  const items: DealProductItem[] = [];
  const seenIds = new Set<string>();

  for (const { coupon, product } of promotions) {
    if (!seenIds.has(product.id)) {
      seenIds.add(product.id);
      items.push({
        id: product.id,
        name: product.name,
        basePrice: product.basePrice,
        images: product.images,
        coupon,
        seller: product.shop?.profile?.name || product.shop?.slug,
      });
    }
  }

  // 2. Backfill with fallback products so carousel is always populated and not empty
  for (const p of fallbackProducts) {
    if (!seenIds.has(p.id)) {
      seenIds.add(p.id);
      items.push({
        id: p.id,
        name: p.name,
        basePrice: p.basePrice,
        images: p.images,
        coupon: p.promotion || null,
        seller: p.shop?.profile?.name || p.shop?.slug,
      });
    }
  }

  const checkScroll = () => {
    const el = track.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth + 8;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(hasOverflow && el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  const scroll = (direction: "left" | "right") => {
    const el = track.current;
    if (!el) return;
    const distance = 420;
    el.scrollBy({ left: direction === "left" ? -distance : distance, behavior: "smooth" });
  };

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [items.length]);

  if (!items.length) return null;

  const copyCoupon = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    hotToast.success(`Copied code: ${code}`, {
      icon: "🏷️",
      duration: 2000,
      style: {
        borderRadius: "10px",
        background: "#0f172a",
        color: "#fff",
        fontSize: "12px",
        fontWeight: "bold",
      },
    });
  };

  const handleWishlistClick = (e: React.MouseEvent, item: DealProductItem, isWishlisted: boolean) => {
    e.stopPropagation();
    toggleWishlist({
      productId: item.id,
      saved: isWishlisted,
      productData: {
        id: item.id,
        name: item.name,
        basePrice: Number(item.basePrice),
        stock: 10,
        shop: {
          id: `shop_${item.id}`,
          slug: item.seller || "store",
          profile: { name: item.seller || "Store" },
        },
        images: (item.images || []).map((img, idx) => ({
          id: `img_${idx}`,
          url: img.url || "",
          isPrimary: idx === 0,
        })),
      },
    });
  };

  // Helper to calculate pricing and coupon label
  const getDealData = (item: DealProductItem) => {
    const originalPrice = Number(item.basePrice);
    const coupon = item.coupon;
    let discountText: string | null = null;
    let salePrice = originalPrice;
    let hasDiscount = false;

    if (coupon) {
      hasDiscount = true;
      if (coupon.type === "PERCENTAGE") {
        discountText = `${Number(coupon.value)}% OFF: ${coupon.code}`;
        salePrice = originalPrice * (1 - Number(coupon.value) / 100);
      } else if (coupon.type === "FIXED_AMOUNT") {
        discountText = `$${Number(coupon.value).toFixed(0)} OFF: ${coupon.code}`;
        salePrice = Math.max(0, originalPrice - Number(coupon.value));
      } else if (coupon.type === "FREE_SHIPPING") {
        discountText = `FREE SHIPPING: ${coupon.code}`;
        salePrice = originalPrice;
      }
    }

    const imageUrl = item.images?.[0]?.url;
    return { originalPrice, salePrice, hasDiscount, discountText, imageUrl, coupon };
  };

  return (
    <section className="mb-10 w-full relative">
      {/* Clean Header */}
      <div className="mb-3.5 flex items-end justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Today's Deals
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            All with free shipping
          </p>
        </div>
      </div>

      {/* Case 1: When only 1 product exists — Display as a Featured Spotlight Deal to avoid empty whitespace */}
      {items.length === 1 ? (
        (() => {
          const item = items[0];
          const { originalPrice, salePrice, hasDiscount, discountText, imageUrl, coupon } = getDealData(item);
          const isWishlisted = wishlist.some((w) => w.productId === item.id);

          return (
            <div
              onClick={() => onSelect(item.id)}
              className="group cursor-pointer bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 max-w-2xl flex flex-col sm:flex-row items-center gap-5 font-sans"
            >
              {/* Product Image Tile */}
              <div className="relative aspect-square w-full sm:w-56 shrink-0 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center p-3">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-xs text-slate-400">No Image</div>
                )}

                {/* Wishlist Icon */}
                <button
                  type="button"
                  disabled={isWishlistPending}
                  onClick={(e) => handleWishlistClick(e, item, isWishlisted)}
                  className="absolute top-2 right-2 z-20 p-2 rounded-full bg-white/90 hover:bg-white text-slate-400 hover:text-rose-600 transition-all shadow-xs cursor-pointer"
                  aria-label="Save to wishlist"
                >
                  <Heart
                    className={`h-4 w-4 transition-transform active:scale-125 ${
                      isWishlisted ? "fill-rose-600 text-rose-600" : "text-slate-400 hover:text-rose-600"
                    }`}
                  />
                </button>
              </div>

              {/* Deal Details */}
              <div className="flex-1 space-y-2.5 w-full">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-600 font-extrabold text-[11px] uppercase tracking-wider">
                    <Sparkles className="size-3" />
                    Today's Top Deal
                  </span>
                  {item.seller && (
                    <span className="text-xs text-slate-500">by {item.seller}</span>
                  )}
                </div>

                {/* Orange 500/600 Discount Tag */}
                {discountText && (
                  <div
                    onClick={(e) => coupon?.code && copyCoupon(e, coupon.code)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-100 font-bold text-xs transition-colors"
                    title={coupon?.code ? `Click to copy: ${coupon.code}` : undefined}
                  >
                    <Tag className="size-3 text-orange-500" />
                    <span>{discountText}</span>
                  </div>
                )}

                {/* Product Name */}
                <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-orange-500 transition-colors">
                  {item.name}
                </h3>

                {/* Price */}
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    ${salePrice.toFixed(2)}
                  </span>
                  {hasDiscount && (
                    <span className="text-sm text-slate-400 line-through font-normal">
                      ${originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="pt-2">
                  <span className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm shadow-orange-500/25 transition-all">
                    View Deal Details →
                  </span>
                </div>
              </div>
            </div>
          );
        })()
      ) : (
        /* Case 2: When multiple products exist — Clean Horizontal Rail matching standard Product Cards */
        <div className="relative group/carousel">
          {/* Left Arrow Button */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Previous deals"
              className="absolute -left-3 sm:-left-4 top-[40%] -translate-y-1/2 z-20 flex size-9 items-center justify-center rounded-full bg-white border border-slate-200/90 shadow-md text-slate-700 hover:bg-slate-50 hover:shadow-lg transition-all"
            >
              <ChevronLeft className="size-5" />
            </button>
          )}

          {/* Right Arrow Button */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Next deals"
              className="absolute -right-3 sm:-right-4 top-[40%] -translate-y-1/2 z-20 flex size-9 items-center justify-center rounded-full bg-white border border-slate-200/90 shadow-md text-slate-700 hover:bg-slate-50 hover:shadow-lg transition-all"
            >
              <ChevronRight className="size-5" />
            </button>
          )}

          {/* Horizontal Scroll Rail */}
          <div
            ref={track}
            className="flex gap-4 overflow-x-auto scroll-smooth pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((item) => {
              const { originalPrice, salePrice, hasDiscount, discountText, imageUrl, coupon } = getDealData(item);
              const isWishlisted = wishlist.some((w) => w.productId === item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  className="group cursor-pointer bg-white rounded-xl p-2.5 border border-slate-100 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col justify-between h-full font-sans w-[180px] sm:w-[205px] shrink-0"
                >
                  {/* Product Image Tile — Exactly like DealCard */}
                  <div className="space-y-1.5">
                    <div className="relative aspect-square w-full rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                          loading="lazy"
                        />
                      ) : (
                        <div className="text-[10px] text-slate-400">No image</div>
                      )}

                      {/* Bottom-Left Image Search Camera Icon */}
                      <div className="absolute bottom-1.5 left-1.5 z-10 p-1 rounded-full bg-white/90 text-slate-700 shadow-xs hover:bg-white transition-colors">
                        <Camera className="h-3 w-3" />
                      </div>

                      {/* Top-Right Wishlist Icon */}
                      <button
                        type="button"
                        disabled={isWishlistPending}
                        onClick={(e) => handleWishlistClick(e, item, isWishlisted)}
                        className="absolute top-1.5 right-1.5 z-20 p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-400 hover:text-rose-600 transition-all shadow-xs cursor-pointer"
                        aria-label="Save to wishlist"
                      >
                        <Heart
                          className={`h-3.5 w-3.5 transition-transform active:scale-125 ${
                            isWishlisted ? "fill-rose-600 text-rose-600" : "text-slate-400 hover:text-rose-600"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Content Section */}
                    <div className="space-y-1 px-0.5">
                      {/* Orange 500/600 Discount Tag */}
                      {discountText ? (
                        <p
                          onClick={(e) => coupon?.code && copyCoupon(e, coupon.code)}
                          className="text-[11px] font-bold text-orange-600 tracking-tight truncate hover:underline"
                          title={coupon?.code ? `Click to copy code: ${coupon.code}` : undefined}
                        >
                          {discountText}
                        </p>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Featured
                        </span>
                      )}

                      {/* Product Name */}
                      <h3 className="text-[11px] sm:text-xs font-normal text-slate-900 leading-tight line-clamp-2 group-hover:text-orange-500 transition-colors">
                        {item.name}
                      </h3>

                      {/* Price Row */}
                      <div className="pt-0.5 flex items-baseline gap-1">
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
                          ${salePrice.toFixed(2)}
                        </span>
                        {hasDiscount && (
                          <span className="text-[10px] text-slate-400 line-through font-normal">
                            ${originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Seller Info */}
                      {item.seller && (
                        <div className="flex items-center gap-1 text-[10px] pt-1 border-t border-slate-100 truncate text-slate-500">
                          <span className="truncate">{item.seller}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
