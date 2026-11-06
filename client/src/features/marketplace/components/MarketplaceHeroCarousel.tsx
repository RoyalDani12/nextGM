import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

type HeroProduct = { id: string; name: string; images?: Array<{ url?: string }> };
type Category = { id: string; name: string; slug: string };

const slides = [
  { eyebrow: "Fresh finds, every day", title: "Big style.\nSmall prices.", body: "Discover independently made pieces and everyday essentials.", cta: "Shop new arrivals", theme: "from-[#fff0e6] via-[#ffd6ba] to-[#ffb076]", text: "text-[#4a1c00]", button: "bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-500/25" },
  { eyebrow: "Home, tech & more", title: "Find something\nworth keeping.", body: "Good design, useful tech, and the kind of things you will love using.", cta: "Explore picks", theme: "from-[#fff5eb] via-[#ffe0c2] to-[#ffc89b]", text: "text-[#3a1d00]", button: "bg-orange-600 hover:bg-orange-700 shadow-md shadow-orange-600/25" },
  { eyebrow: "Independent stores", title: "Made closer\nto home.", body: "Shop distinctive brands and support the people building them.", cta: "Meet the makers", theme: "from-[#f4d9ff] via-[#e4c4ff] to-[#b8b5ff]", text: "text-[#2c1748]", button: "bg-[#7a39c5] hover:bg-[#642ba8]" },
];

export function MarketplaceHeroCarousel({ products, categories, onCategory }: { products: HeroProduct[]; categories: Category[]; onCategory: (slug: string) => void }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = slides[active];
  const goTo = (next: number) => setActive((next + slides.length) % slides.length);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <section className="w-full px-4 pt-5 sm:px-6 lg:px-10 animate-fade-up">
      <div className={`relative min-h-[300px] overflow-hidden rounded-2xl bg-gradient-to-br ${slide.theme} transition-[background] duration-700 ease-out sm:min-h-[330px]`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-white/35 blur-2xl" />
        <div className="absolute -bottom-32 left-[42%] h-72 w-72 rounded-full bg-white/25 blur-3xl" />
        <div key={active} className={`relative z-10 flex min-h-[300px] items-center px-7 py-8 sm:min-h-[330px] sm:px-12 lg:px-16 ${slide.text} carousel-enter`}>
          <div className="max-w-sm">
            <p className="text-xs font-bold uppercase tracking-[.18em] opacity-70">{slide.eyebrow}</p>
            <h1 className="mt-3 whitespace-pre-line text-4xl font-black leading-[.94] tracking-[-.045em] sm:text-5xl">{slide.title}</h1>
            <p className="mt-4 max-w-xs text-sm leading-6 opacity-80 sm:text-base">{slide.body}</p>
            <Button className={`mt-6 h-10 rounded-full px-5 font-bold text-white shadow-sm ${slide.button}`} onClick={() => document.getElementById("marketplace-products")?.scrollIntoView({ behavior: "smooth" })}>{slide.cta}</Button>
          </div>
        </div>
        <div key={`products-${active}`} className="carousel-products absolute bottom-0 right-0 top-0 hidden w-[52%] items-center justify-center gap-3 pr-12 lg:flex">
          {[0, 1, 2].map((index) => {
            const product = products[(active + index) % Math.max(products.length, 1)];
            return <div key={`${active}-${index}`} className={`relative overflow-hidden rounded-2xl bg-white/70 shadow-xl shadow-slate-900/10 ${index === 1 ? "h-60 w-44 -translate-y-3" : "h-48 w-36 translate-y-6"}`}>
              {product?.images?.[0]?.url ? <img src={product.images[0].url} alt={product.name} className="h-full w-full object-cover" /> : <div className={`h-full w-full bg-gradient-to-br ${index === 0 ? "from-white to-orange-100" : index === 1 ? "from-white to-orange-200" : "from-white to-violet-200"}`} />}
              {index === 1 && product && <p className="absolute inset-x-0 bottom-0 bg-white/90 px-3 py-2 text-xs font-bold text-slate-800 backdrop-blur">{product.name}</p>}
            </div>;
          })}
        </div>
        <div className="absolute bottom-5 left-7 z-20 flex items-center gap-2 sm:left-12">
          {slides.map((item, index) => <button key={item.title} aria-label={`Show promotion ${index + 1}`} onClick={() => goTo(index)} className={`h-2 rounded-full transition-all duration-300 ${active === index ? "w-6 bg-current" : "w-2 bg-current/35 hover:bg-current/60"}`} />)}
        </div>
        <div className="absolute bottom-5 right-5 z-20 hidden items-center gap-2 sm:flex">
          <button onClick={() => goTo(active - 1)} aria-label="Previous promotion" className="flex size-9 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow-sm transition hover:scale-105 hover:bg-white"><ChevronLeft className="size-5" /></button>
          <button onClick={() => goTo(active + 1)} aria-label="Next promotion" className="flex size-9 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow-sm transition hover:scale-105 hover:bg-white"><ChevronRight className="size-5" /></button>
          <button onClick={() => setPaused((value) => !value)} aria-label={paused ? "Play promotions" : "Pause promotions"} className="flex size-9 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow-sm transition hover:scale-105 hover:bg-white">{paused ? <Play className="size-4" /> : <Pause className="size-4" />}</button>
        </div>
      </div>
      <div className="flex gap-5 overflow-x-auto border-b border-slate-200 py-4 text-sm font-medium text-slate-700 [scrollbar-width:none] animate-fade-up delay-100">
        {categories.slice(0, 9).map((category) => <button key={category.id} onClick={() => onCategory(category.slug)} className="shrink-0 transition hover:text-orange-500">{category.name}</button>)}
      </div>
    </section>
  );
}
