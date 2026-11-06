import { useEffect, useRef } from "react";
import { Clock3, Tag } from "lucide-react";
import { usePromotedProducts } from "./marketplace.hooks";

const discountLabel = (type: "PERCENTAGE" | "FIXED_AMOUNT", value: string | number) =>
  type === "PERCENTAGE" ? `${Number(value)}% OFF` : `$${Number(value).toFixed(2)} OFF`;

const expiryLabel = (expiresAt: string | null) => {
  if (!expiresAt) return "Limited-time offer";
  const ms = new Date(expiresAt).getTime() - Date.now();
  const hours = Math.max(0, Math.ceil(ms / 3_600_000));
  return hours < 24 ? `Ends in ${hours}h` : `Ends in ${Math.ceil(hours / 24)}d`;
};

const salePrice = (price: string | number, type: "PERCENTAGE" | "FIXED_AMOUNT", value: string | number) => {
  const amount = Number(price);
  return type === "PERCENTAGE" ? amount * (1 - Number(value) / 100) : Math.max(0, amount - Number(value));
};

export function PromotionCarousel({ onSelect }: { onSelect: (productId: string) => void }) {
  const { data: promotions = [] } = usePromotedProducts();
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!promotions.length) return;
    const id = window.setInterval(() => {
      const element = track.current;
      if (!element) return;
      const atEnd = element.scrollLeft + element.clientWidth >= element.scrollWidth - 12;
      element.scrollTo({ left: atEnd ? 0 : element.scrollLeft + 300, behavior: "smooth" });
    }, 3500);
    return () => window.clearInterval(id);
  }, [promotions.length]);

  if (!promotions.length) return null;

  return <section className="mb-8 overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-blue-50/40 via-slate-50 to-white p-4 shadow-xs sm:p-5 animate-fade-up delay-150">
    <div className="mb-4 flex items-end justify-between gap-3"><div><p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.18em] text-blue-600"><Tag className="size-3.5" /> Product offers</p><h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">Deals picked for you</h2></div><p className="hidden text-xs text-slate-500 sm:block">Scrolls automatically</p></div>
    <div ref={track} className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {promotions.map(({ coupon, product }) => <button key={`${coupon.id}-${product.id}`} onClick={() => onSelect(product.id)} className="group relative w-64 shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-200/60 bg-white text-left shadow-xs transition hover:-translate-y-1 hover:shadow-md">
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100"><img src={product.images[0]?.url} alt={product.name} className="size-full object-cover transition duration-500 group-hover:scale-105" /><span className="absolute left-3 top-3 rounded-full bg-blue-600 px-2.5 py-1 text-xs font-black text-white shadow">{discountLabel(coupon.type, coupon.value)}</span></div>
        <div className="p-3"><p className="truncate font-bold text-slate-900">{product.name}</p><p className="mt-0.5 truncate text-xs text-slate-500">{product.shop.profile?.name || product.shop.slug}</p><div className="mt-3 flex items-center justify-between"><span>{coupon.minOrderAmount && Number(product.basePrice) < Number(coupon.minOrderAmount) ? <span className="font-black text-slate-900">${Number(product.basePrice).toFixed(2)}</span> : <><span className="font-black text-slate-900">${salePrice(product.basePrice, coupon.type, coupon.value).toFixed(2)}</span><span className="ml-1.5 text-xs text-slate-400 line-through">${Number(product.basePrice).toFixed(2)}</span></>}</span><span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600"><Clock3 className="size-3" />{expiryLabel(coupon.expiresAt)}</span></div><p className="mt-2 truncate font-mono text-[11px] font-bold text-slate-500">Use code: {coupon.code}{coupon.minOrderAmount ? ` · Min $${Number(coupon.minOrderAmount).toFixed(2)}` : ""}</p></div>
      </button>)}
    </div>
  </section>;
}
