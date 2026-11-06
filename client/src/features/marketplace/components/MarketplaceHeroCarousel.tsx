import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, Flame, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type HeroProduct = { id: string; name: string; images?: Array<{ url?: string }> };
type Category = { id: string; name: string; slug: string };

export const HERO_SHOWCASE_PRODUCTS = [
  {
    id: "hero-prod-1",
    name: "Wireless ANC Headphones",
    tagline: "Studio Acoustic Architecture",
    badge: "35% OFF",
    price: 249,
    originalPrice: 389,
    rating: 4.9,
    reviews: 1240,
    category: "Electronics",
    categorySlug: "electronics",
    image: "/hero-products/headphones.jpg",
  },
  {
    id: "hero-prod-2",
    name: "Titanium OLED Smartwatch",
    tagline: "Precision Fitness Telemetry",
    badge: "HOT DEAL",
    price: 329,
    originalPrice: 429,
    rating: 4.8,
    reviews: 850,
    category: "Wearables",
    categorySlug: "electronics",
    image: "/hero-products/smartwatch.jpg",
  },
  {
    id: "hero-prod-3",
    name: "Neon Edge Street Sneakers",
    tagline: "Ultra-Cushion Responsive Sole",
    badge: "TRENDING",
    price: 145,
    originalPrice: 195,
    rating: 4.9,
    reviews: 2180,
    category: "Footwear",
    categorySlug: "mens",
    image: "/hero-products/sneakers.jpg",
  },
  {
    id: "hero-prod-4",
    name: "Weatherproof Commuter Pack",
    tagline: "Magnetic Buckle & Tech Sleeve",
    badge: "TOP PICK",
    price: 119,
    originalPrice: 169,
    rating: 4.7,
    reviews: 620,
    category: "Bags & Travel",
    categorySlug: "womens",
    image: "/hero-products/backpack.jpg",
  },
  {
    id: "hero-prod-5",
    name: "Acoustic Ambient Speaker",
    tagline: "360° Sound & Soft Glow Ring",
    badge: "NEW",
    price: 179,
    originalPrice: 229,
    rating: 4.8,
    reviews: 430,
    category: "Smart Home",
    categorySlug: "home-living",
    image: "/hero-products/speaker.jpg",
  },
  {
    id: "hero-prod-6",
    name: "Retro 50mm Prime Camera",
    tagline: "Machined Dials & Glass Sensor",
    badge: "LIMITED",
    price: 899,
    originalPrice: 1150,
    rating: 5.0,
    reviews: 310,
    category: "Photography",
    categorySlug: "electronics",
    image: "/hero-products/camera.jpg",
  },
];

const slides = [
  { eyebrow: "Fresh finds, every day", title: "Big style.\nSmall prices.", body: "Discover independently made pieces and everyday essentials.", cta: "Shop new arrivals", theme: "from-[#d9f6ff] via-[#bcecff] to-[#86cfff]", text: "text-[#132a4f]", button: "bg-[#3665f3] hover:bg-[#2854d9]" },
  { eyebrow: "Home, tech & more", title: "Find something\nworth keeping.", body: "Good design, useful tech, and the kind of things you will love using.", cta: "Explore picks", theme: "from-[#fff4cf] via-[#ffe6a0] to-[#ffc979]", text: "text-[#3a2500]", button: "bg-[#e65400] hover:bg-[#c94700]" },
  { eyebrow: "Independent stores", title: "Made closer\nto home.", body: "Shop distinctive brands and support the people building them.", cta: "Meet the makers", theme: "from-[#f4d9ff] via-[#e4c4ff] to-[#b8b5ff]", text: "text-[#2c1748]", button: "bg-[#7a39c5] hover:bg-[#642ba8]" },
];

export function MarketplaceHeroCarousel({ products, categories, onCategory }: { products: HeroProduct[]; categories: Category[]; onCategory: (slug: string) => void }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = slides[active];
  const goTo = (next: number) => setActive((next + slides.length) % slides.length);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -240, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 240, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [paused]);

  const scrollToCatalog = () => {
    document.getElementById("marketplace-products")?.scrollIntoView({ behavior: "smooth" });
  };

  // Helper to retrieve display image for desktop 3D hero cards
  const getDesktopCard = (index: number) => {
    const realProd = products[(active + index) % Math.max(products.length, 1)];
    const showcaseProd = HERO_SHOWCASE_PRODUCTS[(active + index) % HERO_SHOWCASE_PRODUCTS.length];
    const imageUrl = realProd?.images?.[0]?.url || showcaseProd.image;
    const name = realProd?.name || showcaseProd.name;
    return { imageUrl, name };
  };

  return (
    <section className="w-full px-4 pt-5 sm:px-6 lg:px-10 animate-fade-up">
      {/* MAIN HERO PROMOTION BANNER */}
      <div
        className={`relative min-h-[290px] overflow-hidden rounded-2xl bg-gradient-to-br ${slide.theme} transition-[background] duration-700 ease-out sm:min-h-[330px]`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-white/35 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-32 left-[42%] h-72 w-72 rounded-full bg-white/25 blur-3xl pointer-events-none" />

        {/* PROMOTION TEXT CONTENT */}
        <div
          key={active}
          className={`relative z-10 flex min-h-[290px] items-center px-6 py-7 sm:min-h-[330px] sm:px-12 lg:px-16 ${slide.text} carousel-enter`}
        >
          <div className="max-w-sm">
            <p className="text-xs font-bold uppercase tracking-[.18em] opacity-70">{slide.eyebrow}</p>
            <h1 className="mt-2.5 whitespace-pre-line text-3xl sm:text-5xl font-black leading-[.95] tracking-[-.045em]">
              {slide.title}
            </h1>
            <p className="mt-3.5 max-w-xs text-xs sm:text-base leading-5 sm:leading-6 opacity-80">
              {slide.body}
            </p>
            <Button
              className={`mt-5 sm:mt-6 h-9 sm:h-10 rounded-full px-5 font-bold text-white shadow-sm cursor-pointer transition-transform active:scale-95 ${slide.button}`}
              onClick={scrollToCatalog}
            >
              {slide.cta}
            </Button>
          </div>
        </div>

        {/* DESKTOP 3D HERO CARD STACK (LG+ ONLY) */}
        <div
          key={`products-${active}`}
          className="carousel-products absolute bottom-0 right-0 top-0 hidden w-[52%] items-center justify-center gap-3 pr-12 lg:flex pointer-events-none"
        >
          {[0, 1, 2].map((index) => {
            const card = getDesktopCard(index);
            return (
              <div
                key={`${active}-${index}`}
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

        {/* SLIDE NAVIGATION DOTS */}
        <div className="absolute bottom-4 left-6 z-20 flex items-center gap-2 sm:bottom-5 sm:left-12">
          {slides.map((item, index) => (
            <button
              key={item.title}
              aria-label={`Show promotion ${index + 1}`}
              onClick={() => goTo(index)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                active === index ? "w-6 bg-current" : "w-2 bg-current/35 hover:bg-current/60"
              }`}
            />
          ))}
        </div>

        {/* DESKTOP ARROW CONTROLS */}
        <div className="absolute bottom-5 right-5 z-20 hidden items-center gap-2 sm:flex">
          <button
            onClick={() => goTo(active - 1)}
            aria-label="Previous promotion"
            className="flex size-9 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow-sm transition hover:scale-105 hover:bg-white cursor-pointer"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={() => goTo(active + 1)}
            aria-label="Next promotion"
            className="flex size-9 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow-sm transition hover:scale-105 hover:bg-white cursor-pointer"
          >
            <ChevronRight className="size-5" />
          </button>
          <button
            onClick={() => setPaused((value) => !value)}
            aria-label={paused ? "Play promotions" : "Pause promotions"}
            className="flex size-9 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow-sm transition hover:scale-105 hover:bg-white cursor-pointer"
          >
            {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
          </button>
        </div>
      </div>

      {/* AMAZON-STYLE MOBILE HERO PRODUCTS CAROUSEL */}
      <div className="mt-5 w-full">
        {/* SECTION HEADER */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-[#F97316]">
              <Flame className="size-4 fill-orange-500 text-orange-500" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                Trending Deals & Popular Picks
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Explore hand-picked bestsellers ready to ship
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={scrollToCatalog}
              className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-[#F97316] hover:text-[#ea660c] transition-colors cursor-pointer"
            >
              <span>See all</span>
              <ArrowRight className="size-3.5" />
            </button>
            <button
              onClick={scrollLeft}
              aria-label="Scroll left"
              className="flex size-7 sm:size-8 items-center justify-center rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 shadow-xs hover:bg-slate-50 transition cursor-pointer"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={scrollRight}
              aria-label="Scroll right"
              className="flex size-7 sm:size-8 items-center justify-center rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 shadow-xs hover:bg-slate-50 transition cursor-pointer"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {/* HORIZONTAL SWIPEABLE PRODUCTS TRACK (AMAZON STYLE) */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-3 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [-webkit-overflow-scrolling:touch]"
        >
          {HERO_SHOWCASE_PRODUCTS.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onCategory(item.categorySlug);
                scrollToCatalog();
              }}
              className="w-[160px] sm:w-[185px] shrink-0 snap-start bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 p-2.5 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700 transition-all cursor-pointer group flex flex-col justify-between"
            >
              {/* IMAGE CONTAINER WITH BADGES */}
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 mb-2">
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                
                {/* DISCOUNT / STATUS BADGE */}
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#F97316] text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                  {item.badge}
                </span>

                {/* STAR RATING PILL */}
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-white/90 dark:bg-zinc-900/90 backdrop-blur text-[10px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-0.5 shadow-xs">
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  <span>{item.rating}</span>
                </span>
              </div>

              {/* CARD DETAILS */}
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                  {item.category}
                </p>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-[#F97316] transition-colors">
                  {item.name}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                  {item.tagline}
                </p>

                {/* PRICE & DISCOUNT */}
                <div className="pt-1 flex items-baseline gap-1.5">
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    ${item.price}
                  </span>
                  <span className="text-[11px] text-slate-400 line-through">
                    ${item.originalPrice}
                  </span>
                </div>
              </div>

              {/* ACTION PILL */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-bold text-[#F97316]">
                <span>Shop deal</span>
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CATEGORY FILTER PILLS BAR */}
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
