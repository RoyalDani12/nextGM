"use client";

import React, { useState } from "react";
import { Camera, Check, Heart, PackageOpen } from "lucide-react";

export interface DealCardProps {
  id: string;
  image?: string;
  name: string;
  seller?: string;
  price: number | string;
  originalPrice?: number | string;
  discount?: string;
  type?: string;
  moq?: string;
  sold?: string | number;
  reorderRate?: string;
  verified?: boolean;
  years?: number;
  country?: string;
  badge?: string;
  onSelect?: (id: string) => void;
}

export function DealCard({
  id,
  image,
  name,
  price,
  originalPrice,
  discount,
  moq = "1 pc",
  sold = "200+",
  reorderRate = "17%",
  verified = true,
  years = 2,
  country = "CN",
  badge = "Super",
  onSelect,
}: DealCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  const numericPrice = typeof price === "number" ? price : parseFloat(price) || 0;

  return (
    <div
      onClick={() => onSelect?.(id)}
      className="group cursor-pointer bg-white rounded-xl p-2 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full font-sans"
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
            onClick={(e) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
            className="absolute top-1 right-1 z-10 p-1 rounded-full bg-white/80 hover:bg-white text-slate-400 hover:text-rose-600 transition-colors shadow-xs"
            aria-label="Save item"
          >
            <Heart className={`h-3 w-3 ${isLiked ? "fill-rose-600 text-rose-600" : ""}`} />
          </button>
        </div>

        {/* Content Section — Tight & High-Density */}
        <div className="space-y-1 px-0.5">
          {/* Badges */}
          <div className="flex items-center gap-1 flex-wrap">
            {badge && (
              <span className="bg-orange-500 text-white font-extrabold text-[8px] px-1 py-0.2 rounded uppercase tracking-wider">
                {badge}
              </span>
            )}
            <span className="text-[8px] font-bold text-slate-500 border border-slate-200 px-0.5 py-0.2 rounded">
              CE
            </span>
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
              ${numericPrice.toFixed(2)}
            </span>
            {originalPrice && (
              <span className="text-[10px] text-slate-400 line-through font-normal hidden sm:inline">
                ${Number(originalPrice).toFixed(2)}
              </span>
            )}
          </div>

          {/* MOQ & Sales */}
          <div className="text-[10px] text-slate-800 font-medium leading-none truncate">
            MOQ: {moq} <span className="text-slate-400 font-normal ml-0.5">{sold} sold</span>
          </div>

          {/* Verification & Supplier Info */}
          <div className="flex items-center gap-1 text-[10px] pt-1 border-t border-slate-100 truncate">
            {verified && (
              <span className="text-sky-600 font-bold tracking-tight">Verified</span>
            )}
            <span className="text-slate-500">{years}yr</span>
            <span className="text-slate-400 font-medium uppercase">{country}</span>
          </div>
        </div>
      </div>
    </div>
  );
}