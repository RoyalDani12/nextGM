import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

type Walkthrough = {
  id: string;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  status: string;
  points: string[];
};

const walkthroughs: Walkthrough[] = [
  {
    id: "shop",
    label: "For shoppers",
    title: "From discovery to doorstep, without the friction.",
    description: "Search a curated marketplace, compare independent stores, and keep every order in one calm, clear workspace.",
    icon: ShoppingBag,
    status: "Live today",
    points: ["Smart marketplace search and filters", "Guest cart with sign-in sync", "Secure Stripe checkout and order tracking"],
  },
  {
    id: "sell",
    label: "For store owners",
    title: "A serious operating system for your store.",
    description: "Launch a storefront, manage products and variants, fulfil orders, and stay close to customers from one dashboard.",
    icon: Store,
    status: "Live today",
    points: ["Products, inventory, coupons, and reviews", "Multi-tenant shop workspaces", "Payout and order management"],
  },
  {
    id: "engine",
    label: "Under the hood",
    title: "The infrastructure that keeps commerce moving.",
    description: "Reliable payments, background workers, transactional notifications, sessions, and platform governance work together behind the scenes.",
    icon: ShieldCheck,
    status: "Live today",
    points: ["Stripe payments and webhook settlement", "Redis queues for email and notifications", "Role-based access and rate protection"],
  },
  {
    id: "next",
    label: "What is next",
    title: "A platform that keeps getting smarter.",
    description: "We are building the next layer of the experience with real-time updates, deeper insights, and tools that help stores grow.",
    icon: BarChart3,
    status: "On the roadmap",
    points: ["Real-time notifications with WebSockets", "Shop analytics and retention insights", "Employee roles, PWA, and advanced search"],
  },
];

function ProductMockup() {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600"><ShoppingBag className="size-4" /></div>
          <span className="text-sm font-black text-slate-900">Marketplace</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400"><Search className="size-4" /><div className="size-7 rounded-full bg-slate-100" /></div>
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-[1.1fr_.9fr]">
        <div className="overflow-hidden rounded-2xl bg-slate-100">
          <img src="/Gemini_Generated_Image_tsxoqhtsxoqhtsxo.jpg" alt="Featured product on the NextG marketplace" className="h-52 w-full object-cover transition duration-500 hover:scale-105" />
          <div className="p-4"><div className="h-3 w-24 rounded bg-slate-200" /><div className="mt-3 h-5 w-40 rounded bg-slate-900/80" /><div className="mt-4 flex items-center justify-between"><span className="text-lg font-black text-orange-600">$129.00</span><span className="rounded-lg bg-orange-500 px-3 py-2 text-[10px] font-bold text-white">Add to cart</span></div></div>
        </div>
        <div className="space-y-3">
          {["Independent stores", "Verified products", "Protected checkout"].map((item, index) => <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"><div className={`flex size-8 items-center justify-center rounded-lg ${index === 0 ? "bg-orange-100 text-orange-600" : "bg-emerald-100 text-emerald-600"}`}>{index === 0 ? <Store className="size-4" /> : <CheckCircle2 className="size-4" />}</div><span className="text-xs font-bold text-slate-700">{item}</span></div>)}
          <div className="rounded-xl bg-slate-950 p-4 text-white"><p className="text-[10px] font-bold uppercase tracking-wider text-orange-300">Your cart</p><p className="mt-2 text-2xl font-black">3 items</p><p className="mt-1 text-xs text-slate-400">Ready when you are.</p></div>
        </div>
      </div>
    </div>
  );
}

function StoreMockup() {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-950 shadow-2xl shadow-slate-900/10">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-white"><div className="flex items-center gap-2"><LayoutDashboard className="size-4 text-orange-300" /><span className="text-sm font-bold">Store workspace</span></div><div className="flex size-7 items-center justify-center rounded-full bg-orange-400 text-[10px] font-black text-slate-950">N</div></div>
      <div className="grid gap-3 p-5 sm:grid-cols-3">
        {[["Revenue", "$24,680", CircleDollarSign, "text-emerald-300"], ["Orders", "184", PackageCheck, "text-orange-300"], ["Customers", "1,240", Users, "text-sky-300"]].map(([label, value, Icon, color]) => { const MetricIcon = Icon as LucideIcon; return <div key={label as string} className="rounded-xl border border-white/10 bg-white/[0.06] p-4"><MetricIcon className={`size-4 ${color}`} /><p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">{label as string}</p><p className="mt-1 text-xl font-black text-white">{value as string}</p></div>; })}
      </div>
      <div className="grid gap-4 px-5 pb-5 sm:grid-cols-[1.25fr_.75fr]"><div className="rounded-xl border border-white/10 bg-white/[0.06] p-4"><div className="flex items-center justify-between text-xs font-bold text-white"><span>Sales overview</span><span className="text-orange-300">This month</span></div><div className="mt-6 flex h-24 items-end gap-2">{[35, 54, 42, 70, 58, 84, 76, 96].map((height, index) => <div key={index} className="flex-1 rounded-t bg-gradient-to-t from-orange-600 to-orange-300" style={{ height: `${height}%` }} />)}</div></div><div className="space-y-2"><div className="flex items-center gap-2 rounded-xl bg-emerald-400/10 p-3 text-xs text-emerald-200"><Truck className="size-4" /> 12 shipping today</div><div className="flex items-center gap-2 rounded-xl bg-orange-400/10 p-3 text-xs text-orange-200"><BellRing className="size-4" /> 4 new reviews</div><div className="flex items-center gap-2 rounded-xl bg-sky-400/10 p-3 text-xs text-sky-200"><CreditCard className="size-4" /> Payout ready</div></div></div>
    </div>
  );
}

export default function HowItWorksSection() {
  const [activeId, setActiveId] = useState("shop");
  const active = walkthroughs.find((item) => item.id === activeId) ?? walkthroughs[0];
  const ActiveIcon = active.icon;

  return (
    <section className="border-y border-slate-200 bg-white px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-600">See the whole picture</p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-slate-950 sm:text-5xl">One platform. Every part of the journey.</h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">Explore how NextG brings shoppers, stores, payments, and operations together in one modern commerce experience.</p>
        </div>
        <div className="mt-14 grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
          <div className="space-y-2">
            {walkthroughs.map((item, index) => {
              const Icon = item.icon;
              const isActive = item.id === active.id;
              return <button key={item.id} onClick={() => setActiveId(item.id)} className={`group flex w-full items-start gap-4 rounded-2xl p-4 text-left transition ${isActive ? "bg-orange-50 ring-1 ring-orange-200" : "hover:bg-slate-50"}`}>
                <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${isActive ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "bg-slate-100 text-slate-500 group-hover:bg-orange-100 group-hover:text-orange-600"}`}><Icon className="size-5" /></span>
                <span className="min-w-0"><span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400"><span>0{index + 1}</span><span className={isActive ? "text-orange-600" : ""}>{item.label}</span></span><span className={`mt-1 block font-black ${isActive ? "text-slate-950" : "text-slate-700"}`}>{item.title}</span></span>
              </button>;
            })}
            <Link to="/about" className="mt-5 inline-flex items-center gap-2 px-4 text-sm font-bold text-orange-600 hover:text-orange-700">Learn more about NextG <ArrowRight className="size-4" /></Link>
          </div>
          <div className="min-w-0">
            <div className="mb-6 flex items-start justify-between gap-5"><div><div className="flex items-center gap-2 text-sm font-bold text-orange-600"><ActiveIcon className="size-4" /> {active.label}</div><h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{active.title}</h3></div><span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${active.id === "next" ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"}`}>{active.status}</span></div>
            <p className="max-w-2xl leading-7 text-slate-600">{active.description}</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">{active.points.map((point) => <div key={point} className="flex items-start gap-2 text-xs font-semibold leading-5 text-slate-600"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />{point}</div>)}</div>
            <div className="mt-8">{active.id === "sell" || active.id === "engine" ? <StoreMockup /> : <ProductMockup />}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
