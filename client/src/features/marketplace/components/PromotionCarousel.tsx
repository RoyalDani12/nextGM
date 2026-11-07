import { useEffect, useRef, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { usePromotedProducts, useWishlist, useWishlistToggle } from "./marketplace.hooks";

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

  // 2. Backfill with fallback products so row is populated
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
    const timer = setTimeout(checkScroll, 100);
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [items.length]);

  if (!items.length) return null;

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

  return (
    <section className="mb-8 w-full relative font-sans">
      {/* Header */}
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Today's Deals
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            All with free shipping
          </p>
        </div>
      </div>

      {/* Horizontal Rail of Clean Alibaba-Style Product Cards */}
      <div className="relative group/carousel">
        {/* Left Arrow Button */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Previous deals"
            className="absolute -left-3 sm:-left-4 top-[40%] -translate-y-1/2 z-20 flex size-9 items-center justify-center rounded-full bg-white border border-slate-200/90 shadow-md text-slate-700 hover:bg-slate-50 hover:shadow-lg transition-all cursor-pointer"
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
            className="absolute -right-3 sm:-right-4 top-[40%] -translate-y-1/2 z-20 flex size-9 items-center justify-center rounded-full bg-white border border-slate-200/90 shadow-md text-slate-700 hover:bg-slate-50 hover:shadow-lg transition-all cursor-pointer"
          >
            <ChevronRight className="size-5" />
          </button>
        )}

        {/* Scroll Rail */}
        <div
          ref={track}
          className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item) => {
            const originalPrice = Number(item.basePrice);
            const coupon = item.coupon;
            let discountText: string | null = null;
            let salePrice = originalPrice;
            let hasDiscount = false;

            if (coupon) {
              hasDiscount = true;
              if (coupon.type === "PERCENTAGE") {
                discountText = `${Number(coupon.value)}% off`;
                salePrice = originalPrice * (1 - Number(coupon.value) / 100);
              } else if (coupon.type === "FIXED_AMOUNT") {
                discountText = `$${Number(coupon.value).toFixed(0)} off`;
                salePrice = Math.max(0, originalPrice - Number(coupon.value));
              } else if (coupon.type === "FREE_SHIPPING") {
                discountText = "Free Shipping";
                salePrice = originalPrice;
              }
            }

            const imageUrl = item.images?.[0]?.url;
            const isWishlisted = wishlist.some((w) => w.productId === item.id);

            return (
              <div
                key={item.id}
                onClick={() => onSelect(item.id)}
                className="group cursor-pointer bg-white rounded-xl p-2 border border-slate-100 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col justify-between h-full font-sans w-[165px] sm:w-[190px] shrink-0 snap-start"
              >
                {/* Product Image Tile — Alibaba style */}
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

                    {/* Bottom-Left Image Search Camera Icon (Alibaba Lens style) */}
                    <div className="absolute bottom-1 left-1 z-10 p-1 rounded-full bg-white/90 text-slate-700 shadow-xs hover:bg-white transition-colors">
                      <Camera className="h-3 w-3" />
                    </div>

                    {/* Top-Right Wishlist Icon */}
                    <button
                      type="button"
                      disabled={isWishlistPending}
                      onClick={(e) => handleWishlistClick(e, item, isWishlisted)}
                      className="absolute top-1 right-1 z-20 p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-400 hover:text-rose-600 transition-all shadow-xs cursor-pointer"
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
                    {/* SALE Badge & Orange 600 Discount Text */}
                    {hasDiscount && discountText && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="bg-orange-600 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider shadow-2xs">
                          SALE
                        </span>
                        <span className="text-[11px] font-bold text-orange-600 tracking-tight">
                          {discountText} {coupon?.code ? `· ${coupon.code}` : ""}
                        </span>
                      </div>
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

                    {/* Supplier / Seller Info */}
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
    </section>
  );
}
