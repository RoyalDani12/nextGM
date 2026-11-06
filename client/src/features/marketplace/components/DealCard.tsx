"use client";

import { Camera, Check, Heart, PackageOpen } from "lucide-react";
import { useWishlist, useWishlistToggle } from "./marketplace.hooks";
import { toast } from "@/components/ui/toast";

export interface DealCardProps {
  id: string;
  image?: string;
  name: string;
  seller?: string;
  price: number | string;
  originalPrice?: number | string;
  promotion?: { code: string; type: "PERCENTAGE" | "FIXED_AMOUNT"; value: number | string; minOrderAmount?: number | string | null; expiresAt?: string | null } | null;
  type?: string;
  moq?: string;
  sold?: string | number;
  reorderRate?: string;
  verified?: boolean;
  years?: number;
  country?: string;
  onSelect?: (id: string) => void;
}

export function DealCard({
  id,
  image,
  name,
  seller,
  price,
  originalPrice,
  promotion,
  moq,
  sold,
  reorderRate,
  verified,
  years,
  country,
  onSelect,
}: DealCardProps) {
  const { data: wishlist = [] } = useWishlist();
  const wishlistToggle = useWishlistToggle();
  const isLiked = wishlist.some((item) => item.productId === id);

  const numericPrice = typeof price === "number" ? price : parseFloat(price) || 0;
  const appliesToPrice = !promotion?.minOrderAmount || numericPrice >= Number(promotion.minOrderAmount);
  const salePrice = promotion && appliesToPrice
    ? promotion.type === "PERCENTAGE" ? numericPrice * (1 - Number(promotion.value) / 100) : Math.max(0, numericPrice - Number(promotion.value))
    : numericPrice;
  const realDiscountLabel = promotion ? promotion.type === "PERCENTAGE" ? `${Number(promotion.value)}% OFF` : `$${Number(promotion.value).toFixed(2)} OFF` : null;

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation(); // Do not trigger onSelect (opening the detail drawer)
    wishlistToggle.mutate(
      {
        productId: id,
        saved: isLiked,
        productData: {
          id,
          name,
          basePrice: numericPrice,
          stock: 10,
          shop: { id: `guest_shop_${id}`, slug: seller || "store", profile: { name: seller || "Store" } },
          images: image ? [{ url: image }] : [],
        },
      },
      {
        onSuccess: () => {
          toast.add({
            title: isLiked ? "Removed from wishlist" : "Added to wishlist",
            description: isLiked
              ? `"${name}" was removed from your wishlist.`
              : `"${name}" was saved to your wishlist.`,
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
  };

  return (
    <div
      onClick={() => onSelect?.(id)}
      className="group cursor-pointer bg-white rounded-xl p-2 border border-slate-100 hover:border-orange-200 hover:shadow-xl hover:shadow-slate-900/5 hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col justify-between h-full font-sans"
    >
      {/* Product Image Tile — Compact & Proportional */}
      <div className="space-y-1.5">
        <div className="relative aspect-square w-full max-h-[170px] sm:max-h-[190px] rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-300">
              <PackageOpen className="h-6 w-6 stroke-[1.2]" />
              <span className="text-[9px]">No image</span>
            </div>
          )}

          {/* Bottom-Left Image Search Camera Icon */}
          <div className="absolute bottom-1 left-1 z-10 p-1 rounded-full bg-white/90 text-slate-700 shadow-xs hover:bg-white transition-colors">
            <Camera className="h-3 w-3" />
          </div>

          {/* Top-Right Wishlist Icon */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            disabled={wishlistToggle.isPending}
            className="absolute top-1 right-1 z-20 p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-400 hover:text-rose-600 transition-all shadow-xs cursor-pointer"
            aria-label={isLiked ? "Remove from wishlist" : "Save to wishlist"}
          >
            <Heart
              className={`h-3.5 w-3.5 transition-transform active:scale-125 ${
                isLiked ? "fill-rose-600 text-rose-600" : "text-slate-400 hover:text-rose-600"
              }`}
            />
          </button>
        </div>

        {/* Content Section — Tight & High-Density */}
        <div className="space-y-1 px-0.5">
          {/* Badges */}
          <div className="flex items-center gap-1 flex-wrap">
            {realDiscountLabel && (
              <span className="bg-orange-500 text-white font-extrabold text-[8px] px-1 py-0.2 rounded uppercase tracking-wider">
                {realDiscountLabel}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-[11px] sm:text-xs font-normal text-slate-900 leading-tight line-clamp-2 group-hover:text-orange-600 transition-colors">
            {name}
          </h3>

          {/* Reorder Rate */}
          {reorderRate && (
            <div className="flex items-center gap-0.5 text-[10px] text-slate-500 font-normal">
              <Check className="h-2.5 w-2.5 text-slate-800 stroke-[2.5]" />
              <span className="truncate">Reorder rate {reorderRate}</span>
            </div>
          )}

          {/* Price */}
          <div className="pt-0.5 flex items-baseline gap-1">
            <span className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
              ${salePrice.toFixed(2)}
            </span>
            {(promotion && appliesToPrice) || originalPrice ? (
              <span className="text-[10px] text-slate-400 line-through font-normal hidden sm:inline">
                ${Number(originalPrice ?? numericPrice).toFixed(2)}
              </span>
            ) : null}
          </div>

          {/* MOQ & Sales */}
          {(moq || sold) && <div className="text-[10px] text-slate-800 font-medium leading-none truncate">{moq && <>MOQ: {moq}</>} {sold && <span className="text-slate-400 font-normal ml-0.5">{sold} sold</span>}</div>}

          {/* Verification & Supplier Info */}
          {(verified || years || country || seller) && <div className="flex items-center gap-1 text-[10px] pt-1 border-t border-slate-100 truncate">
            {verified && (
              <span className="text-sky-600 font-bold tracking-tight">Verified</span>
            )}
            {years && <span className="text-slate-500">{years}yr</span>}
            {country && <span className="text-slate-400 font-medium uppercase">{country}</span>}
            {seller && <span className="truncate text-slate-500">{seller}</span>}
          </div>
          }
        </div>
      </div>
    </div>
  );
}
