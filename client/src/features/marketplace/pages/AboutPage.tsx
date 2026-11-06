import { ArrowRight, BadgeCheck, Globe2, HeartHandshake, Sparkles, Store, Users } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "./Footer";
import { MarketplaceNavbar } from "../layouts/MarketplaceNavbar";

const principles = [
  { icon: Sparkles, title: "Curated, not crowded", text: "A calmer way to discover useful objects, independent brands, and products worth keeping." },
  { icon: HeartHandshake, title: "People over transactions", text: "We help shoppers and store owners build trust through clear information and thoughtful service." },
  { icon: Globe2, title: "Built for everywhere", text: "A multi-tenant commerce engine that gives ambitious stores room to grow across borders." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <MarketplaceNavbar />
      <main>
        <section className="relative flex min-h-[30vh] items-center overflow-hidden bg-gradient-to-br from-blue-50/50 via-white to-slate-100 px-4 py-12 text-slate-950 sm:px-6">
          <div className="absolute -right-24 -top-32 size-[24rem] rounded-full bg-blue-200/30 blur-3xl" />
          <div className="absolute -bottom-40 left-1/3 size-[22rem] rounded-full bg-slate-200/70 blur-3xl" />
          <div className="absolute inset-0 bg-white/20" />
          <div className="relative mx-auto w-full max-w-7xl">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-100/70 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#3665f3] shadow-sm">
                <Sparkles className="size-3.5" /> About NextG
              </span>
              <h1 className="mt-5 text-4xl font-black tracking-[-0.06em] sm:text-6xl">
                Commerce with a little more <span className="text-[#3665f3]">humanity.</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                NextG helps people find products they love and gives independent stores the infrastructure to sell with confidence.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800">
                  Explore the marketplace <ArrowRight className="size-4" />
                </Link>
                <Link to="/contact" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-blue-300 hover:text-[#3665f3]">
                  Talk to our team
                </Link>
              </div>
            </div>
            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {[["50+", "store tools"], ["24/7", "customer care"], ["0%", "first-order fees"]].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                  <p className="text-2xl font-black text-[#3665f3]">{value}</p>
                  <p className="mt-1 text-sm text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#3665f3]">The NextG point of view</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] sm:text-5xl">Make every discovery feel like a good one.</h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              We are building the connective layer between great products and the people looking for them. That means useful tools for sellers, honest context for shoppers, and a platform that gets out of the way when it should.
            </p>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {principles.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-[#3665f3]"><Icon className="size-6" /></div>
                <h3 className="mt-6 text-xl font-black">{title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white px-4 py-20 sm:px-6">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
            <div id="careers" className="rounded-3xl bg-slate-950 p-8 text-white sm:p-10">
              <Users className="size-8 text-blue-300" />
              <h2 className="mt-6 text-3xl font-black">Build what comes next.</h2>
              <p className="mt-4 leading-7 text-slate-300">We are looking for curious builders who care about craft, ownership, and making online commerce feel more personal.</p>
              <a href="mailto:careers@nextg.example" className="mt-7 inline-flex items-center gap-2 font-bold text-blue-300 hover:text-blue-200">See opportunities <ArrowRight className="size-4" /></a>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                ["blog", "NexG Journal", "Notes on product, commerce, and the independent brands shaping what is next.", Sparkles],
                ["press", "Press & stories", "Brand assets, company news, and the people behind the platform.", BadgeCheck],
              ].map(([id, title, text, Icon]) => {
                const SectionIcon = Icon as typeof Sparkles;
                return <article id={id as string} key={id as string} className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
                  <SectionIcon className="size-7 text-[#3665f3]" />
                  <h3 className="mt-5 text-xl font-black">{title as string}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{text as string}</p>
                  <Link to="/contact" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-[#3665f3]">Connect with us <ArrowRight className="size-4" /></Link>
                </article>;
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#3665f3]">The platform</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.045em]">Tools that keep commerce moving.</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["templates", "Store templates", "Flexible storefront foundations designed to help each brand feel like itself."],
              ["experts", "Product promotion", "A growing network of tools and expertise to help great products get discovered."],
              ["affiliates", "Affiliate community", "Share products you believe in and build value with the NextG community."],
              ["integrations", "Business tools", "A connected commerce foundation for payments, orders, customers, and growth."],
              ["currency", "Global payments", "Clear pricing and payment infrastructure designed for customers everywhere."],
            ].map(([id, title, text]) => (
              <article id={id} key={id} className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="rounded-[2rem] bg-[#3665f3] p-8 text-white sm:p-12">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-blue-100"><Store className="size-5" /> For independent stores</div>
                <h2 className="mt-3 text-3xl font-black tracking-tight">Your next chapter can start here.</h2>
              </div>
              <Link to="/shops/new" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold transition hover:bg-slate-800">Start selling <ArrowRight className="size-4" /></Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
