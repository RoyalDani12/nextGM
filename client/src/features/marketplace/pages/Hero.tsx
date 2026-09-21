"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  ShieldCheck,
  Zap,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  PackageOpen,
  Loader2,
  TrendingUp,
  ArrowRight,
  ChevronDown,
  Store,
  Award,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMarketplaceProducts } from "@/components/layout/marketplace/marketplace.hooks";
import type { DealCardProps } from "@/components/layout/marketplace/DealCard";
import { DealCard } from "@/components/layout/marketplace/DealCard";
import { FlashDealsSection } from "@/components/layout/marketplace/FlashDealsSection";
import { ProductDetailView } from "@/components/layout/marketplace/ProductDetailView";

/* REUSABLE SMOOTH SCROLL REVEAL COMPONENT */
function ScrollReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (ref.current) observer.unobserve(ref.current);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) transform ${
        isVisible
          ? "opacity-100 translate-y-0 filter-none"
          : "opacity-0 translate-y-12 blur-[2px]"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function Hero() {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const { data: products = [], isLoading, isError } = useMarketplaceProducts(searchTerm);

  const carouselSlides = [
    {
      title: "Spring Tech & Gadget Clearance",
      subtitle: "Save up to 60% on verified hardware and consumer electronics.",
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1600&h=900&fit=crop",
    },
    {
      title: "Independent Store Showcase",
      subtitle: "Support verified direct seller shops with competitive direct pricing.",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1600&h=900&fit=crop",
    },
    {
      title: "Fast Express Delivery Guaranteed",
      subtitle: "Get your orders delivered right to your doorstep within 48 hours.",
      image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1600&h=900&fit=crop",
    },
    {
      title: "Next-Gen Audio & Smart Wearables",
      subtitle: "Explore high performance wireless devices and premium accessories.",
      image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1600&h=900&fit=crop",
    },
    {
      title: "Flagship Workstation Setup & Hardware",
      subtitle: "Upgrade your productivity setup with top-rated verified hardware.",
      image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=1600&h=900&fit=crop",
    },
  ];

  const todaysDeals: DealCardProps[] = [
    {
      id: "deal-1",
      name: "Wireless Noise-Canceling Over-Ear Headphones",
      price: "49.99",
      originalPrice: "129.99",
      discount: "61% OFF",
      rating: 4.9,
      reviews: 312,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
      seller: "TechHub Audio",
    },
    {
      id: "deal-2",
      name: "Ultra HD 4K Action Camera Waterproof",
      price: "79.00",
      originalPrice: "159.00",
      discount: "50% OFF",
      rating: 4.7,
      reviews: 184,
      image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=600&fit=crop",
      seller: "ProGear Direct",
    },
    {
      id: "deal-3",
      name: "Minimalist Mechanical Keyboard RGB",
      price: "35.50",
      originalPrice: "75.00",
      discount: "53% OFF",
      rating: 4.8,
      reviews: 95,
      image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&h=600&fit=crop",
      seller: "KeyCraft Studio",
    },
    {
      id: "deal-4",
      name: "Smart Fitness Watch Heart Rate Monitor",
      price: "29.99",
      originalPrice: "69.99",
      discount: "57% OFF",
      rating: 4.6,
      reviews: 210,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop",
      seller: "Pulse Wearables",
    },
    {
      id: "deal-5",
      name: "Ergonomic Wireless Optical Mouse",
      price: "19.99",
      originalPrice: "39.99",
      discount: "50% OFF",
      rating: 4.5,
      reviews: 78,
      image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&h=600&fit=crop",
      seller: "ErgoTech Store",
    },
    {
      id: "deal-6",
      name: "Portable Bluetooth Speaker Stereo Bass",
      price: "39.99",
      originalPrice: "89.99",
      discount: "55% OFF",
      rating: 4.8,
      reviews: 142,
      image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&h=600&fit=crop",
      seller: "SoundMax Gear",
    },
  ];

  const popularTags = ["Headphones", "Keyboards", "Smart Watch", "4K Camera", "Earbuds"];

  const marqueeItems = [
    { icon: ShieldCheck, title: "100% Buyer Protection", desc: "Escrow payment & refunds", color: "text-blue-500" },
    { icon: Zap, title: "Fast Local Delivery", desc: "Dispatched within 24-48h", color: "text-amber-500" },
    { icon: Store, title: "Verified Factory Stores", desc: "Direct prices zero markup", color: "text-emerald-500" },
    { icon: RotateCcw, title: "Easy 30-Day Returns", desc: "Hassle-free return policy", color: "text-purple-500" },
    { icon: Award, title: "Top Rated Merchants", desc: "Verified merchant network", color: "text-rose-500" },
    { icon: Lock, title: "Secure Checkout", desc: "256-bit encrypted transactions", color: "text-indigo-500" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [carouselSlides.length]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
  };

  const handleTagClick = (tag: string) => {
    setSearchInput(tag);
    setSearchTerm(tag);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans antialiased overflow-x-hidden">
      
      {/* KEYFRAMES & UTILITY STYLES */}
      <style>{`
        @keyframes heroContentReveal {
          0% {
            opacity: 0;
            transform: translateY(18px);
            filter: blur(6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0px);
          }
        }
        @keyframes slideContentEnter {
          0% {
            opacity: 0;
            transform: translateY(14px);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0px);
          }
        }
        @keyframes marqueeScroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        
        /* Uses 'both' fill-mode so elements stay hidden during keyframe delay without flashing white background */
        .animate-intro-delay-1 {
          animation: heroContentReveal 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: 80ms;
        }
        .animate-intro-delay-2 {
          animation: heroContentReveal 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: 220ms;
        }
        .animate-intro-delay-3 {
          animation: heroContentReveal 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: 360ms;
        }

        .animate-slide-content {
          animation: slideContentEnter 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-marquee-smooth {
          display: flex;
          width: max-content;
          animation: marqueeScroll 35s linear infinite;
        }
        .animate-marquee-smooth:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* HERO BANNER CONTAINER (SOLID DARK BACKDROP ALWAYS PRESENT) */}
      <section className="relative w-full min-h-[360px] sm:min-h-[400px] lg:min-h-[440px] bg-slate-950 overflow-hidden flex items-center pt-4 pb-12">
        {carouselSlides.map((slide, idx) => {
          const isActive = idx === currentSlide;
          return (
            <div
              key={idx}
              className={`absolute inset-0 flex items-center transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <div className="absolute inset-0 z-0 animate-intro-delay-1">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className={`w-full h-full object-cover object-center transition-transform duration-[10000ms] ease-out ${
                    isActive ? "scale-105" : "scale-100"
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-transparent" />
              </div>

              <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 z-20">
                {isActive && (
                  <div key={currentSlide} className="max-w-2xl space-y-3 animate-slide-content">
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.15] drop-shadow-sm">
                      {slide.title}
                    </h1>
                    <p className="text-slate-200 text-xs sm:text-base font-normal leading-relaxed max-w-xl drop-shadow-sm">
                      {slide.subtitle}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Carousel Arrow Controls */}
        <div className="absolute bottom-6 right-6 z-30 flex items-center gap-2 animate-intro-delay-2">
          <button
            type="button"
            onClick={() =>
              setCurrentSlide((prev) => (prev === 0 ? carouselSlides.length - 1 : prev - 1))
            }
            className="p-2 rounded-full bg-slate-900/80 hover:bg-orange-500 text-white transition-all border border-slate-700/60 shadow-lg cursor-pointer active:scale-95"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div className="flex gap-1.5 px-1">
            {carouselSlides.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === currentSlide ? "w-6 bg-orange-500" : "w-1.5 bg-slate-500/60"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setCurrentSlide((prev) => (prev + 1) % carouselSlides.length)}
            className="p-2 rounded-full bg-slate-900/80 hover:bg-orange-500 text-white transition-all border border-slate-700/60 shadow-lg cursor-pointer active:scale-95"
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* FLOATING SEARCH BAR */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-30 animate-intro-delay-2">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl p-2 sm:p-2.5 border border-slate-200/80 shadow-2xl shadow-slate-900/10">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch gap-2">
            
            {/* Category Select Dropdown */}
            <div className="relative shrink-0 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700">
              <span className="text-slate-400 mr-1.5 hidden sm:inline">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent pr-5 outline-none font-bold text-slate-800 cursor-pointer appearance-none"
              >
                <option>All Categories</option>
                <option>Consumer Electronics</option>
                <option>Gadgets & Audio</option>
                <option>Computer Accessories</option>
                <option>Wearables</option>
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500 absolute right-2.5 pointer-events-none" />
            </div>

            {/* Main Search Input */}
            <div className="relative flex-1 flex items-center bg-slate-50 sm:bg-transparent border border-slate-200 sm:border-0 rounded-xl sm:rounded-none px-3 py-1">
              <Search className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search verified products, specifications, or store slugs..."
                className="w-full border-0 bg-transparent focus:ring-0 focus-visible:ring-0 text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm h-10 shadow-none font-medium"
              />
            </div>

            {/* CTA Search Button */}
            <Button
              type="submit"
              size="lg"
              className="rounded-xl px-7 bg-slate-900 hover:bg-orange-500 text-white font-extrabold text-xs h-11 transition-all duration-200 shadow-md hover:shadow-orange-500/20 active:scale-[0.98] shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <span>Search Marketplace</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Quick Search Tag Pills */}
          <div className="mt-2.5 px-2 pb-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-medium">
            <span className="inline-flex items-center gap-1 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <TrendingUp className="h-3 w-3 text-orange-500" /> Trending:
            </span>
            {popularTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-orange-50 hover:text-orange-600 border border-slate-200/60 transition-colors cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MARQUEE STRIP */}
      <div className="mt-8 py-3.5 border-y border-slate-200/60 bg-white/50 backdrop-blur-sm relative overflow-hidden animate-intro-delay-3">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-50 via-slate-50/80 to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee-smooth flex items-center gap-8 px-4">
          {[...marqueeItems, ...marqueeItems].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-2.5 shrink-0 px-3 py-1 rounded-full hover:bg-slate-100/70 transition-colors cursor-default"
              >
                <Icon className={`h-4 w-4 ${item.color} shrink-0`} />
                <span className="text-xs font-bold text-slate-900 tracking-tight whitespace-nowrap">
                  {item.title}
                </span>
                <span className="text-[11px] text-slate-400 font-normal whitespace-nowrap">
                  — {item.desc}
                </span>
                <span className="ml-4 text-slate-200">•</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT CONTAINER WITH SCROLL REVEAL */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">

        {/* FLASH DEALS SECTION */}
        <ScrollReveal delay={100}>
          <FlashDealsSection
            deals={todaysDeals.map((deal) => ({
              ...deal,
              onSelect: (id) => setSelectedProductId(id),
            }))}
          />
        </ScrollReveal>

        {/* LIVE MARKETPLACE FEED SECTION */}
        <div className="space-y-5">
          
          {/* Header Reveal */}
          <ScrollReveal delay={100}>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-slate-900" />
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Live Marketplace Feed
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full font-mono">
                {products.length} Products
              </span>
            </div>
          </ScrollReveal>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
              <p className="text-xs text-slate-500 font-medium">Loading products...</p>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="p-4 bg-rose-50 border-y border-rose-200 text-center text-rose-700 text-xs font-semibold">
              Unable to load marketplace products. Please check server connectivity.
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && products.length === 0 && (
            <div className="py-16 text-center space-y-2 border-y border-slate-100">
              <PackageOpen className="h-10 w-10 mx-auto text-slate-300 stroke-[1.2]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                No active products found
              </h3>
              <p className="text-xs text-slate-400">Try adjusting your search criteria.</p>
            </div>
          )}

          {/* RESPONSIVE PRODUCT FEED GRID WITH STAGGERED SCROLL REVEAL */}
          {!isLoading && !isError && products.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3 md:gap-3.5 lg:gap-4">
              {products.map((product: any, index: number) => (
                <ScrollReveal key={product.id} delay={(index % 6) * 60}>
                  <DealCard
                    id={product.id}
                    image={product.images?.[0]?.url}
                    name={product.name}
                    seller={
                      product.shop?.profile?.name ||
                      product.shop?.slug ||
                      "Verified Merchant"
                    }
                    price={product.basePrice}
                    type={product.type}
                    onSelect={(id) => setSelectedProductId(id)}
                  />
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SLIDING DRAWER COMPONENT */}
      <ProductDetailView
        productId={selectedProductId}
        isOpen={Boolean(selectedProductId)}
        onClose={() => setSelectedProductId(null)}
      />
    </div>
  );
}