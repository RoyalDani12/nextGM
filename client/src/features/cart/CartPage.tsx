import { Link } from "react-router-dom";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { MarketplaceNavbar } from "@/layouts/MarketplaceNavbar";
import { Button } from "@/components/ui/button";

export function CartPage() {
  return <div className="min-h-screen bg-slate-50"><MarketplaceNavbar /><main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-20"><Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-950"><ArrowLeft className="size-4" /> Continue shopping</Link><div className="mb-8"><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Checkout</p><h1 className="mt-2 text-4xl font-black tracking-tight">Your cart</h1><p className="mt-2 text-sm text-slate-500">Review your picks before you check out.</p></div><div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm sm:p-16"><div className="mx-auto grid size-16 place-items-center rounded-2xl bg-slate-100 text-slate-500"><ShoppingBag className="size-7" /></div><h2 className="mt-5 text-xl font-black">Your cart is empty</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Explore independent shops and add something you love to see it here.</p><Button render={<Link to="/" />} className="mt-7 rounded-xl bg-slate-950 font-bold hover:bg-slate-800">Explore marketplace</Button></div></main></div>;
}
