import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
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
  } | null;
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
    } | null;
  }>;
}

export function PromotionCarousel({ onSelect, fallbackProducts = [] }: PromotionCarouselProps) {
  const { data: promotions = [] } = usePromotedProducts();
  const { data: wishlist = [] } = useWishlist();
  const { mutate: toggleWishlist } = useWishlistToggle();
  const track = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Combine promoted products from backend API with fallback products
  const dealItems: DealProductItem[] =
    promotions.length > 0
      ? promotions.map(({ coupon, product }) => ({
          id: product.id,
          name: product.name,
          basePrice: product.basePrice,
          images: product.images,
          coupon,
        }))
      : fallbackProducts.map((p) => ({
          id: p.id,
          name: p.name,
          basePrice: p.basePrice,
          images: p.images,
          coupon: p.promotion || null,
        }));

  const checkScroll = () => {
    const el = track.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
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
    return () => el.removeEventListener("scroll", checkScroll);
  }, [dealItems.length]);

  if (!dealItems.length) return null;

  return (
    <section className="mb-10 w-full relative">
      {/* eBay style Clean Header */}
      <div className="mb-3.5">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Today's Deals
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          All with free shipping
        </p>
      </div>

      {/* Relative wrapper for floating circular arrow buttons */}
      <div className="relative group/carousel">
        {/* Left Arrow Button */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Previous deals"
            className="absolute -left-3 sm:-left-4 top-[38%] -translate-y-1/2 z-20 flex size-9 items-center justify-center rounded-full bg-white border border-slate-200/90 shadow-md text-slate-700 hover:bg-slate-50 hover:shadow-lg transition-all"
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
            className="absolute -right-3 sm:-right-4 top-[38%] -translate-y-1/2 z-20 flex size-9 items-center justify-center rounded-full bg-white border border-slate-200/90 shadow-md text-slate-700 hover:bg-slate-50 hover:shadow-lg transition-all"
          >
            <ChevronRight className="size-5" />
          </button>
        )}

        {/* Horizontal Scroll Rail */}
        <div
          ref={track}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {dealItems.map((item) => {
            const isWishlisted = wishlist.some((w) => w.productId === item.id);
            const coupon = item.coupon;
            const originalPrice = Number(item.basePrice);

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

            const imageUrl = item.images?.[0]?.url || "/placeholder.png";

            return (
              <div
                key={item.id}
                onClick={() => onSelect(item.id)}
                className="w-[170px] sm:w-[195px] shrink-0 flex flex-col group cursor-pointer"
              >
                {/* eBay Square Product Image Card */}
                <div className="relative aspect-square w-full rounded-2xl bg-[#f2f2f2] p-3 flex items-center justify-center overflow-hidden transition-colors group-hover:bg-[#ebebeb]">
                  <img
                    src={imageUrl}
                    alt={item.name}
                    className="size-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Wishlist Heart Icon Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist({ productId: item.id, saved: isWishlisted });
                    }}
                    className="absolute top-2.5 right-2.5 z-10 flex size-7 items-center justify-center rounded-full bg-white/90 shadow-xs hover:bg-white hover:scale-110 text-slate-700 transition-all"
                    aria-label="Save to wishlist"
                  >
                    <Heart
                      className={`size-3.5 transition-colors ${
                        isWishlisted ? "fill-red-500 text-red-500" : "text-slate-600"
                      }`}
                    />
                  </button>
                </div>

                {/* Red Discount Tag */}
                {discountText && (
                  <p
                    onClick={(e) => {
                      if (coupon?.code) {
                        e.stopPropagation();
                        navigator.clipboard.writeText(coupon.code);
                        hotToast.success(`Copied code: ${coupon.code}`, {
                          icon: "🏷️",
                          duration: 2000,
                        });
                      }
                    }}
                    className="mt-2 text-xs font-bold text-[#b91c1c] tracking-tight truncate hover:underline"
                    title={coupon?.code ? `Click to copy code: ${coupon.code}` : undefined}
                  >
                    {discountText}
                  </p>
                )}

                {/* Product Name */}
                <h3
                  className={`text-xs text-slate-800 font-normal line-clamp-2 leading-snug group-hover:underline ${
                    !discountText ? "mt-2" : "mt-0.5"
                  }`}
                >
                  {item.name}
                </h3>

                {/* Price Row */}
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-sm font-bold text-slate-900">
                    ${salePrice.toFixed(2)}
                  </span>
                  {hasDiscount && (
                    <span className="text-xs text-slate-400 line-through">
                      ${originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
