import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

type HeroProduct = { id: string; name: string; images?: Array<{ url?: string }> };
type Category = { id: string; name: string; slug: string };

// 6 curated high quality products with Amazon-style mobile cards
export const HERO_SHOWCASE_PRODUCTS = [
  {
    id: "hero-prod-1",
    name: "Wireless ANC Headphones",
    eyebrow: "Fresh finds, every day",
    headline: "Big style.\nSmall prices.",
    badge: "35% OFF",
    priceText: "From $249",
    category: "Electronics",
    categorySlug: "electronics",
    image: "/hero-products/headphones.jpg",
    bg: "bg-[#E6F4FA] dark:bg-sky-950/40",
  },
  {
    id: "hero-prod-2",
    name: "Titanium OLED Smartwatch",
    eyebrow: "Trending Tech & Wearables",
    headline: "Precision tracking for every day.",
    badge: "HOT DEAL",
    priceText: "From $329",
    category: "Wearables",
    categorySlug: "electronics",
    image: "/hero-products/smartwatch.jpg",
    bg: "bg-[#FFF4E5] dark:bg-amber-950/40",
  },
  {
    id: "hero-prod-3",
    name: "Neon Edge Street Sneakers",
    eyebrow: "Streetwear & Footwear",
    headline: "Step up your street style.",
    badge: "TRENDING",
    priceText: "From $145",
    category: "Footwear",
    categorySlug: "mens",
    image: "/hero-products/sneakers.jpg",
    bg: "bg-[#FFF0E8] dark:bg-orange-950/40",
  },
  {
    id: "hero-prod-4",
    name: "Weatherproof Commuter Pack",
    eyebrow: "Everyday Carry & Travel",
    headline: "Built tough to carry it all.",
    badge: "TOP PICK",
    priceText: "From $119",
    category: "Bags & Travel",
    categorySlug: "womens",
    image: "/hero-products/backpack.jpg",
    bg: "bg-[#F0F4F8] dark:bg-slate-900/60",
  },
  {
    id: "hero-prod-5",
    name: "Acoustic Ambient Speaker",
    eyebrow: "Home, Tech & Sound",
    headline: "Warm sound for your living space.",
    badge: "NEW",
    priceText: "From $179",
    category: "Smart Home",
    categorySlug: "home-living",
    image: "/hero-products/speaker.jpg",
    bg: "bg-[#F6EEFD] dark:bg-purple-950/40",
  },
  {
    id: "hero-prod-6",
    name: "Retro 50mm Prime Camera",
    eyebrow: "Creative Photography",
    headline: "Find something worth keeping.",
    badge: "LIMITED",
    priceText: "From $899",
    category: "Photography",
    categorySlug: "electronics",
    image: "/hero-products/camera.jpg",
    bg: "bg-[#EEF7F2] dark:bg-emerald-950/40",
  },
];

const desktopSlides = [
  {
    eyebrow: "Fresh finds, every day",
    title: "Big style.\nSmall prices.",
    body: "Discover independently made pieces and everyday essentials.",
    cta: "Shop new arrivals",
    theme: "from-[#d9f6ff] via-[#bcecff] to-[#86cfff]",
    text: "text-[#132a4f]",
    button: "bg-[#3665f3] hover:bg-[#2854d9]",
  },
  {
    eyebrow: "Home, tech & more",
    title: "Find something\nworth keeping.",
    body: "Good design, useful tech, and the kind of things you will love using.",
    cta: "Explore picks",
    theme: "from-[#fff4cf] via-[#ffe6a0] to-[#ffc979]",
    text: "text-[#3a2500]",
    button: "bg-[#e65400] hover:bg-[#c94700]",
  },
  {
    eyebrow: "Independent stores",
    title: "Made closer\nto home.",
    body: "Shop distinctive brands and support the people building them.",
    cta: "Meet the makers",
    theme: "from-[#f4d9ff] via-[#e4c4ff] to-[#b8b5ff]",
    text: "text-[#2c1748]",
    button: "bg-[#7a39c5] hover:bg-[#642ba8]",
  },
];

export function MarketplaceHeroCarousel({
  products,
  categories,
  onCategory,
}: {
  products: HeroProduct[];
  categories: Category[];
  onCategory: (slug: string) => void;
}) {
  // Desktop carousel state
  const [activeDesktop, setActiveDesktop] = useState(0);
  const [pausedDesktop, setPausedDesktop] = useState(false);
  const desktopSlide = desktopSlides[activeDesktop];
  const goToDesktop = (next: number) =>
    setActiveDesktop((next + desktopSlides.length) % desktopSlides.length);

  // Mobile Amazon-style carousel state
  const [mobileActiveIndex, setMobileActiveIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const mobileCarouselRef = useRef<HTMLDivElement>(null);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Desktop auto-advance timer
  useEffect(() => {
    if (pausedDesktop) return;
    const timer = window.setInterval(
      () => setActiveDesktop((value) => (value + 1) % desktopSlides.length),
      6500
    );
    return () => window.clearInterval(timer);
  }, [pausedDesktop]);

  // Mobile Amazon-style auto-scroll timer
  useEffect(() => {
    if (isInteracting) return;

    const timer = setInterval(() => {
      setMobileActiveIndex((prev) => {
        const next = (prev + 1) % HERO_SHOWCASE_PRODUCTS.length;
        if (mobileCarouselRef.current) {
          const container = mobileCarouselRef.current;
          const card = container.children[next] as HTMLElement | undefined;
          if (card) {
            const targetScroll =
              card.offsetLeft - (container.offsetWidth - card.offsetWidth) / 2;
            container.scrollTo({ left: targetScroll, behavior: "smooth" });
          }
        }
        return next;
      });
    }, 4200);

    return () => clearInterval(timer);
  }, [isInteracting]);

  const handleMobileScroll = () => {
    if (!mobileCarouselRef.current) return;
    const container = mobileCarouselRef.current;
    const center = container.scrollLeft + container.offsetWidth / 2;
    let closest = 0;
    let minDiff = Infinity;

    Array.from(container.children).forEach((child, i) => {
      const el = child as HTMLElement;
      const childCenter = el.offsetLeft + el.offsetWidth / 2;
      const diff = Math.abs(center - childCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closest = i;
      }
    });

    setMobileActiveIndex(closest);
  };

  const scrollToSlide = (index: number) => {
    if (!mobileCarouselRef.current) return;
    const container = mobileCarouselRef.current;
    const card = container.children[index] as HTMLElement | undefined;
    if (card) {
      const targetScroll =
        card.offsetLeft - (container.offsetWidth - card.offsetWidth) / 2;
      container.scrollTo({ left: targetScroll, behavior: "smooth" });
      setMobileActiveIndex(index);
    }
  };

  const scrollToCatalog = () => {
    document.getElementById("marketplace-products")?.scrollIntoView({ behavior: "smooth" });
  };

  // Helper for desktop 3D layered card stack
  const getDesktopCard = (index: number) => {
    const realProd = products[(activeDesktop + index) % Math.max(products.length, 1)];
    const showcaseProd =
      HERO_SHOWCASE_PRODUCTS[(activeDesktop + index) % HERO_SHOWCASE_PRODUCTS.length];
    const imageUrl = realProd?.images?.[0]?.url || showcaseProd.image;
    const name = realProd?.name || showcaseProd.name;
    return { imageUrl, name };
  };

  return (
    <section className="w-full px-4 pt-3 sm:px-6 lg:px-10 animate-fade-up">
      {/* ============================================================ */}
      {/* 1. MOBILE VIEW: AMAZON-STYLE AUTO-SCROLLING PRODUCT CAROUSEL */}
      {/* ============================================================ */}
      <div className="relative w-full lg:hidden overflow-hidden py-1">
        {/* SWIPEABLE HORIZONTAL TRACK WITH PEEK ON BOTH EDGES */}
        <div
          ref={mobileCarouselRef}
          onScroll={handleMobileScroll}
          onTouchStart={() => {
            setIsInteracting(true);
            if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
          }}
          onTouchEnd={() => {
            if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
            resumeTimeoutRef.current = setTimeout(() => setIsInteracting(false), 4500);
          }}
          onMouseEnter={() => setIsInteracting(true)}
          onMouseLeave={() => setIsInteracting(false)}
          className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory scroll-smooth px-6 py-2 [scrollbar-width:none] [-webkit-overflow-scrolling:touch]"
        >
          {HERO_SHOWCASE_PRODUCTS.map((prod) => (
            <div
              key={prod.id}
              onClick={() => {
                onCategory(prod.categorySlug);
                scrollToCatalog();
              }}
              className={`w-[82vw] max-w-[340px] shrink-0 snap-center rounded-3xl ${prod.bg} border border-slate-200/80 dark:border-zinc-800/80 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between overflow-hidden select-none active:scale-[0.99]`}
            >
              {/* TOP TITLE & EYEBROW (MATCHES AMAZON APP SCREENSHOT) */}
              <div className="space-y-1 mb-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {prod.eyebrow}
                </p>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight line-clamp-2">
                  {prod.headline}
                </h2>
              </div>

              {/* LARGE HIGH-QUALITY PRODUCT IMAGE */}
              <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-white/70 dark:bg-zinc-900/70 shadow-sm border border-black/5 dark:border-white/5">
                <img
                  src={prod.image}
                  alt={prod.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />

                {/* PRODUCT NAME & DISCOUNT BADGE */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur text-xs font-bold text-slate-900 dark:text-white shadow-xs truncate">
                    {prod.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#F97316] text-white text-[10px] font-black uppercase tracking-wider shadow-xs shrink-0">
                    {prod.badge}
                  </span>
                </div>
              </div>

              {/* CARD FOOTER */}
              <div className="mt-3.5 flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {prod.priceText}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#F97316] hover:underline">
                  Shop now
                  <ChevronRight className="size-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* DOT INDICATORS FOR MOBILE */}
        <div className="flex justify-center items-center gap-1.5 pt-2">
          {HERO_SHOWCASE_PRODUCTS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                mobileActiveIndex === idx
                  ? "w-6 bg-[#F97316]"
                  : "w-1.5 bg-slate-300 dark:bg-zinc-700 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. DESKTOP VIEW: MULTI-THEMED PROMOTION HERO BANNER (LG+)   */}
      {/* ============================================================ */}
      <div
        className={`relative hidden lg:block min-h-[330px] overflow-hidden rounded-2xl bg-gradient-to-br ${desktopSlide.theme} transition-[background] duration-700 ease-out`}
        onMouseEnter={() => setPausedDesktop(true)}
        onMouseLeave={() => setPausedDesktop(false)}
      >
        <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-white/35 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-32 left-[42%] h-72 w-72 rounded-full bg-white/25 blur-3xl pointer-events-none" />

        {/* PROMOTION TEXT CONTENT */}
        <div
          key={activeDesktop}
          className={`relative z-10 flex min-h-[330px] items-center px-12 lg:px-16 ${desktopSlide.text} carousel-enter`}
        >
          <div className="max-w-sm">
            <p className="text-xs font-bold uppercase tracking-[.18em] opacity-70">
              {desktopSlide.eyebrow}
            </p>
            <h1 className="mt-2.5 whitespace-pre-line text-5xl font-black leading-[.95] tracking-[-.045em]">
              {desktopSlide.title}
            </h1>
            <p className="mt-3.5 max-w-xs text-base leading-6 opacity-80">
              {desktopSlide.body}
            </p>
            <Button
              className={`mt-6 h-10 rounded-full px-5 font-bold text-white shadow-sm cursor-pointer transition-transform active:scale-95 ${desktopSlide.button}`}
              onClick={scrollToCatalog}
            >
              {desktopSlide.cta}
            </Button>
          </div>
        </div>

        {/* DESKTOP 3D HERO CARD STACK */}
        <div
          key={`products-${activeDesktop}`}
          className="carousel-products absolute bottom-0 right-0 top-0 flex w-[52%] items-center justify-center gap-3 pr-12 pointer-events-none"
        >
          {[0, 1, 2].map((index) => {
            const card = getDesktopCard(index);
            return (
              <div
                key={`${activeDesktop}-${index}`}
                className={`relative overflow-hidden rounded-2xl bg-white/70 shadow-xl shadow-slate-900/10 pointer-events-auto ${
                  index === 1 ? "h-60 w-44 -translate-y-3" : "h-48 w-36 translate-y-6"
                }`}
              >
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
                {index === 1 && (
                  <p className="absolute inset-x-0 bottom-0 bg-white/90 px-3 py-2 text-xs font-bold text-slate-800 backdrop-blur truncate">
                    {card.name}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* DESKTOP SLIDE DOTS */}
        <div className="absolute bottom-5 left-12 z-20 flex items-center gap-2">
          {desktopSlides.map((item, index) => (
            <button
              key={item.title}
              aria-label={`Show promotion ${index + 1}`}
              onClick={() => goToDesktop(index)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                activeDesktop === index
                  ? "w-6 bg-current"
                  : "w-2 bg-current/35 hover:bg-current/60"
              }`}
            />
          ))}
        </div>

        {/* DESKTOP CONTROLS */}
        <div className="absolute bottom-5 right-5 z-20 flex items-center gap-2">
          <button
            onClick={() => goToDesktop(activeDesktop - 1)}
            aria-label="Previous promotion"
            className="flex size-9 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow-sm transition hover:scale-105 hover:bg-white cursor-pointer"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={() => goToDesktop(activeDesktop + 1)}
            aria-label="Next promotion"
            className="flex size-9 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow-sm transition hover:scale-105 hover:bg-white cursor-pointer"
          >
            <ChevronRight className="size-5" />
          </button>
          <button
            onClick={() => setPausedDesktop((value) => !value)}
            aria-label={pausedDesktop ? "Play promotions" : "Pause promotions"}
            className="flex size-9 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow-sm transition hover:scale-105 hover:bg-white cursor-pointer"
          >
            {pausedDesktop ? <Play className="size-4" /> : <Pause className="size-4" />}
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. CATEGORY PILLS BAR (BELOW HERO SECTION)                   */}
      {/* ============================================================ */}
      <div className="flex gap-4 sm:gap-5 overflow-x-auto border-b border-slate-200 dark:border-zinc-800 py-3.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 [scrollbar-width:none] animate-fade-up delay-100">
        {categories.slice(0, 9).map((category) => (
          <button
            key={category.id}
            onClick={() => onCategory(category.slug)}
            className="shrink-0 transition hover:text-[#F97316] dark:hover:text-[#F97316] cursor-pointer"
          >
            {category.name}
          </button>
        ))}
      </div>
    </section>
  );
}
