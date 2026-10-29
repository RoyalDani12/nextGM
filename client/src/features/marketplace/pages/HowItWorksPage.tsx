import { ArrowRight, CheckCircle2, Handshake, Scale, ShieldCheck, Store, Users } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "./Footer";
import { MarketplaceNavbar } from "../layouts/MarketplaceNavbar";
import HowItWorksSection from "../components/HowItWorksSection";

const fairnessPrinciples = [
  {
    icon: Scale,
    title: "Clear costs",
    text: "Prices, shipping, and checkout totals are shown before you place an order. No hidden platform surprise at the final step.",
  },
  {
    icon: Store,
    title: "Independent stores stay visible",
    text: "NextG is built to help smaller stores present their products professionally instead of letting one seller own the whole marketplace.",
  },
  {
    icon: ShieldCheck,
    title: "Protected transactions",
    text: "Payments are processed securely, order events are tracked, and support is available when an order needs attention.",
  },
  {
    icon: Handshake,
    title: "Respect for both sides",
    text: "Shoppers get useful information and choice. Sellers get practical tools, ownership of their storefront, and transparent operations.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <MarketplaceNavbar />
      <main>
        <section className="relative flex min-h-[30vh] items-center overflow-hidden bg-gradient-to-br from-orange-50 via-white to-slate-100 px-4 py-14 sm:px-6">
          <div className="absolute -right-24 -top-32 size-[25rem] rounded-full bg-orange-200/45 blur-3xl" />
          <div className="absolute -bottom-40 left-1/4 size-[24rem] rounded-full bg-slate-200/70 blur-3xl" />
          <div className="relative mx-auto w-full max-w-7xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-600">How NextG works</p>
            <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_.7fr] lg:items-end">
              <div>
                <h1 className="max-w-3xl text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-6xl">
                  Better commerce starts with knowing how it works.
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                  NextG connects shoppers with independent stores, then gives both sides the tools and clarity to make every order feel fair.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
                <div className="flex items-center gap-3"><Users className="size-5 text-orange-600" /><span className="font-black text-slate-900">Two sides. One shared experience.</span></div>
                <p className="mt-3 text-sm leading-6 text-slate-600">Explore the shopper journey, seller workspace, platform safeguards, and what we are building next.</p>
              </div>
            </div>
          </div>
        </section>

        <HowItWorksSection />

        <section className="border-y border-slate-200 bg-white px-4 py-20 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-600">Our fairness promise</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-slate-950 sm:text-5xl">A marketplace should work for everyone.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">Fairness is not a slogan. It is the product experience: clear information, secure actions, real choice, and tools that do not treat independent sellers as an afterthought.</p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {fairnessPrinciples.map(({ icon: Icon, title, text }) => (
                <article key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600"><Icon className="size-5" /></div>
                  <h3 className="mt-5 font-black text-slate-950">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="rounded-[2rem] bg-orange-500 p-8 text-white sm:p-12">
            <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-orange-100"><CheckCircle2 className="size-5" /> Ready to try it?</div>
                <h2 className="mt-3 text-3xl font-black tracking-tight">Explore the marketplace your way.</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold hover:bg-slate-800">Start shopping <ArrowRight className="size-4" /></Link>
                <Link to="/shops/new" className="rounded-xl border border-orange-200/50 px-5 py-3 text-sm font-bold hover:bg-orange-400">Open a store</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
