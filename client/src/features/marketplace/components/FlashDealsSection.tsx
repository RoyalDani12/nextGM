"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Tag, ChevronLeft, ChevronRight } from "lucide-react";
import type { DealCardProps } from "./DealCard";
import { DealCard } from "./DealCard";

interface FlashDealsProps {
  deals: DealCardProps[];
}

export function FlashDealsSection({ deals }: FlashDealsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);

    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      setScrollProgress((scrollLeft / maxScroll) * 100);
    } else {
      setScrollProgress(100);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
    }
    window.addEventListener("resize", checkScroll);

    return () => {
      if (el) el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, deals]);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const containerWidth = scrollRef.current.clientWidth;
      const scrollAmount = direction === "left" ? -containerWidth : containerWidth;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-2.5 sm:space-y-3 font-sans">
      {/* Header — Title uses bold, high-contrast typography like your image */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-orange-50 text-orange-500 shrink-0">
            <Tag className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
          </span>
          <h2 className="text-base sm:text-lg lg:text-2xl font-extrabold text-slate-950 tracking-tight leading-none">
            Today's Flash Deals
          </h2>
        </div>
      </div>

      <div className="relative group">
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScroll("left")}
            className="absolute -left-3.5 top-1/2 -translate-y-1/2 z-30 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white text-slate-800 shadow-md border border-slate-200 flex items-center justify-center hover:bg-orange-500 hover:text-white hover:border-orange-500 active:scale-95 transition-all cursor-pointer"
            aria-label="Previous deals"
          >
            <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
          </button>
        )}

        {/* Right Scroll Button */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScroll("right")}
            className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-30 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white text-slate-800 shadow-md border border-slate-200 flex items-center justify-center hover:bg-orange-500 hover:text-white hover:border-orange-500 active:scale-95 transition-all cursor-pointer"
            aria-label="Next deals"
          >
            <ChevronRight className="h-4 w-4 stroke-[2.5]" />
          </button>
        )}

        {/* Horizontal Scroll Layout: 3 items mobile | 4 tablet | 5 desktop | 6 wide screen */}
        <div
          ref={scrollRef}
          className="flex gap-2 sm:gap-2.5 overflow-x-auto pb-2 pt-1 scroll-smooth snap-x snap-mandatory touch-pan-x"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {deals.map((deal) => (
            <div
              key={deal.id}
              className="w-[calc(33.333%-5.5px)] sm:w-[calc(25%-7.5px)] lg:w-[calc(20%-8px)] xl:w-[calc(16.666%-8.5px)] shrink-0 snap-start"
            >
              <DealCard {...deal} />
            </div>
          ))}
        </div>

        {/* Scroll Progress Bar */}
        <div className="mt-1.5 hidden sm:flex items-center gap-3 justify-center">
          <div className="w-48 h-1 bg-slate-200 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-orange-500 shadow-xs shadow-orange-500/40 transition-all duration-200 ease-out rounded-full"
              style={{ width: `${Math.max(scrollProgress, 20)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}