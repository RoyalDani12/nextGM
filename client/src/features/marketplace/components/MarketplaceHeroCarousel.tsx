import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

type HeroProduct = { id: string; name: string; images?: Array<{ url?: string }> };
type Category = { id: string; name: string; slug: string };

// 6 curated high quality products matching Amazon mobile hero cards
export const HERO_SHOWCASE_PRODUCTS = [
  {
    id: "hero-prod-1",
    name: "Wireless ANC Headphones",
    headline: "Big style.\nSmall prices.",
    category: "Electronics",
    categorySlug: "electronics",
    image: "/hero-products/headphones.jpg",
    bg: "bg-[#EAE8E5] dark:bg-stone-900",
    textColor: "text-slate-900 dark:text-white",
  },
  {
    id: "hero-prod-2",
    name: "Titanium OLED Smartwatch",
    headline: "Smart tech for\nyour routine",
    category: "Wearables",
    categorySlug: "electronics",
    image: "/hero-products/smartwatch.jpg",
    bg: "bg-[#14191D] dark:bg-zinc-950",
    textColor: "text-white",
  },
  {
    id: "hero-prod-3",
    name: "Neon Edge Street Sneakers",
    headline: "Start looking\nsharp",
    category: "Footwear",
    categorySlug: "mens",
    image: "/hero-products/sneakers.jpg",
    bg: "bg-[#E5ECEF] dark:bg-slate-900",
    textColor: "text-slate-900 dark:text-white",
  },
  {
    id: "hero-prod-4",
    name: "Weatherproof Commuter Pack",
    headline: "Built tough to\ncarry it all",
    category: "Bags & Travel",
    categorySlug: "womens",
    image: "/hero-products/backpack.jpg",
    bg: "bg-[#E2E7E6] dark:bg-zinc-800",
    textColor: "text-slate-900 dark:text-white",
  },
  {
    id: "hero-prod-5",
    name: "Acoustic Ambient Speaker",
    headline: "Warm sound for\nyour home",
    category: "Smart Home",
    categorySlug: "home-living",
    image: "/hero-products/speaker.jpg",
    bg: "bg-[#EAE4DC] dark:bg-stone-900",
    textColor: "text-slate-900 dark:text-white",
  },
  {
    id: "hero-prod-6",
    name: "Retro 50mm Prime Camera",
    headline: "Find something\nworth keeping",
    category: "Photography",
    categorySlug: "electronics",
    image: "/hero-products/camera.jpg",
    bg: "bg-[#DDE0E2] dark:bg-zinc-900",
    textColor: "text-slate-900 dark:text-white",
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
    <section className="w-full pt-2 animate-fade-up">
      {/* ============================================================ */}
      {/* 1. MOBILE VIEW: EXACT AMAZON FULL-BLEED HERO CAROUSEL (<LG)  */}
      {/* ============================================================ */}
      <div className="relative w-full lg:hidden overflow-hidden pb-2">
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
              className={`w-[84vw] max-w-[350px] h-[450px] sm:h-[490px] shrink-0 snap-center rounded-[28px] ${prod.bg} p-6 pb-4 flex flex-col justify-between overflow-hidden cursor-pointer select-none transition-transform active:scale-[0.99] shadow-xs`}
            >
              {/* TOP TITLE PRINTED DIRECTLY ON CARD (MATCHING AMAZON SCREENSHOT) */}
              <div className="pt-1">
                <h2
                  className={`text-2xl sm:text-[28px] font-black tracking-tight leading-[1.08] whitespace-pre-line ${prod.textColor}`}
                >
                  {prod.headline}
                </h2>
              </div>

              {/* LARGE PRODUCT IMAGE FILLING LOWER CARD SPACE (NO NESTED BOXES) */}
              <div className="w-full flex-1 mt-4 rounded-2xl overflow-hidden">
                <img
                  src={prod.image}
                  alt={prod.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>
          ))}
        </div>

        {/* DOT INDICATORS FOR MOBILE */}
        <div className="flex justify-center items-center gap-1.5 pt-3">
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
      <div className="hidden lg:block px-4 sm:px-6 lg:px-10">
        <div
          className={`relative min-h-[330px] overflow-hidden rounded-2xl bg-gradient-to-br ${desktopSlide.theme} transition-[background] duration-700 ease-out`}
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
      </div>

      {/* ============================================================ */}
      {/* 3. CATEGORY PILLS BAR (BELOW HERO SECTION)                   */}
      {/* ============================================================ */}
      <div className="px-4 sm:px-6 lg:px-10">
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
      </div>
    </section>
  );
}
