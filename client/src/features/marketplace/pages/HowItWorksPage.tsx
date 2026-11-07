import { useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Cpu,
  HelpCircle,
  Layers,
  Lock,
  RefreshCw,
  Scale,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Terminal,
  X,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "./Footer";
import { MarketplaceNavbar } from "../layouts/MarketplaceNavbar";
import HowItWorksSection from "../components/HowItWorksSection";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

/* ─── DATA: ORDER LIFECYCLE SIMULATOR ─────────────────────────────────── */
interface LifecycleStage {
  id: number;
  label: string;
  short: string;
  actor: "Shopper" | "Stripe" | "Merchant" | "Courier" | "System";
  title: string;
  description: string;
  logMessage: string;
  statusBadge: string;
  badgeStyle: string;
  timestamp: string;
}

const LIFECYCLE_STAGES: LifecycleStage[] = [
  {
    id: 1,
    label: "1. Order Placed",
    short: "Checkout",
    actor: "Shopper",
    title: "Multi-Store Cart Authorization",
    description:
      "Customer places order across independent stores. Stripe creates an authorization intent; funds are placed into platform escrow.",
    logMessage: "stripe_payment_intent.authorized: amount=$254.00, escrow_ref=ESC-9921",
    statusBadge: "Payment Authorized",
    badgeStyle: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    timestamp: "10:00:00 AM",
  },
  {
    id: 2,
    label: "2. Tenant Dispatch",
    short: "Merchant",
    actor: "Merchant",
    title: "Storeowner Notification & Packing",
    description:
      "Aura Soundworks warehouse receives real-time webhook. Items are allocated from reserved stock and packed with packing slip.",
    logMessage: "webhook.dispatched: merchant=aura-soundworks, sku=AUR-ANC-01, status=PACKED",
    statusBadge: "Packed & Label Printed",
    badgeStyle: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    timestamp: "10:24:15 AM",
  },
  {
    id: 3,
    label: "3. Carrier Transit",
    short: "In Transit",
    actor: "Courier",
    title: "FedEx Ground Priority Transit",
    description:
      "Carrier scans package barcode. Live tracking number is synced to the customer order portal and SMS notification is triggered.",
    logMessage: "courier.tracking_synced: carrier=FedEx, tracking=NX-99482-US, transit_hub=ORD",
    statusBadge: "In Transit (On Schedule)",
    badgeStyle: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    timestamp: "02:15:40 PM",
  },
  {
    id: 4,
    label: "4. Delivery & Review",
    short: "Delivered",
    actor: "Courier",
    title: "Doorstep Signature Confirmation",
    description:
      "Package is delivered and signed. Order is marked fulfilled. Verified Buyer review authorization is unlocked for customer.",
    logMessage: "courier.delivered: signed_by=J. DOE, proof_photo=true, order=NX-48918",
    statusBadge: "Delivered & Verified",
    badgeStyle: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    timestamp: "Next Day 11:45 AM",
  },
  {
    id: 5,
    label: "5. Automated Settlement",
    short: "Settled",
    actor: "Stripe",
    title: "Stripe Connect Merchant Payout",
    description:
      "Escrow release conditions satisfied. Net revenue automatically transfers to Aura Soundworks' bank account with full ledger entry.",
    logMessage: "stripe_connect.transfer_created: dest=acct_aura, amount=$238.10, fee=$0.00",
    statusBadge: "Payout Deposited",
    badgeStyle: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    timestamp: "Rolling 48h",
  },
];

/* ─── DATA: COMPARISON MATRIX ─────────────────────────────────────────── */
const COMPARISON_ROWS = [
  {
    feature: "Independent Store Identity",
    legacy: "Your brand is buried inside a nameless catalog listing.",
    nexions: "Dedicated branded storefront with custom URL, policies, and banner.",
  },
  {
    feature: "Hidden Platform Markups",
    legacy: "5%–15% buyer service charges and hidden checkout markups.",
    nexions: "0% buyer surcharge. Transparent item pricing set by merchants.",
  },
  {
    feature: "Seller Commission Squeeze",
    legacy: "15% to 30% take rates plus listing and transaction cuts.",
    nexions: "Fair, flat merchant rate with zero nickel-and-diming.",
  },
  {
    feature: "Payout Release Velocity",
    legacy: "14 to 30 day holding periods with arbitrary freezes.",
    nexions: "Automated 2-day rolling deposits directly via Stripe Connect.",
  },
  {
    feature: "Unified Multi-Store Basket",
    legacy: "Items split into separate orders and checkout flows.",
    nexions: "Single express checkout with automated merchant parcel grouping.",
  },
  {
    feature: "Customer Review Integrity",
    legacy: "Plagued by bot farms and sponsored fake reviews.",
    nexions: "100% verified order ID required. Zero unverified reviews.",
  },
  {
    feature: "Data Ownership & Direct Support",
    legacy: "Customer contact info withheld; zero direct relationship.",
    nexions: "Direct merchant-to-customer communication & order management.",
  },
];

/* ─── DATA: FAQ ACCORDION ─────────────────────────────────────────────── */
const FAQS = [
  {
    q: "Can I buy from multiple independent stores in one single order?",
    a: "Yes! Nexions features a unified multi-store cart. You can add items from different boutique stores anywhere in the world and complete your purchase in one single Stripe checkout. The system automatically splits shipping and notifies each merchant separately.",
  },
  {
    q: "How does Stripe Escrow protect buyers?",
    a: "When you authorize a payment, funds are safely held in a platform escrow vault. The merchant is notified to pack and ship. Payouts are only released once the carrier confirms transit milestones. In the rare event of non-delivery or an unresolved issue, platform protection issues a rapid full refund.",
  },
  {
    q: "How fast do store owners get paid?",
    a: "Merchants receive automated 2-day rolling payouts via Stripe Connect directly to their bank account in 120+ countries. Every deposit includes an itemized ledger showing sales, shipping, and net revenue.",
  },
  {
    q: "Are there any hidden fees or listing charges for sellers?",
    a: "No. Unlike legacy marketplaces that charge per-listing fees, renewal penalties, and mandatory ad spend, Nexions operates on a transparent, fair flat model with no hidden charges.",
  },
  {
    q: "How does review verification work?",
    a: "Reviews on Nexions can only be submitted by verified purchasers with an authenticated order ID. Unverified public reviews, bot submissions, and incentivized fake ratings are mathematically blocked.",
  },
  {
    q: "How do returns and refunds work?",
    a: "Shoppers have a 14-day standard return window on eligible physical items. You can initiate a return directly from your Order Dashboard. If the storeowner accepts the return or fails to respond, platform buyer protection guarantees your resolution.",
  },
];

export default function HowItWorksPage() {
  const [activeStageId, setActiveStageId] = useState<number>(1);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const activeStage =
    LIFECYCLE_STAGES.find((s) => s.id === activeStageId) || LIFECYCLE_STAGES[0];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-500 selection:text-white">
      <MarketplaceNavbar />

      <main>
        {/* ─── 1. HERO BANNER: SaaS Modern Tech & Transparency ──────────── */}
        <section className="relative overflow-hidden bg-slate-950 text-white pt-20 pb-24 lg:pt-28 lg:pb-32">
          {/* Subtle glowing ambient lighting */}
          <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[45rem] rounded-full bg-gradient-to-b from-orange-500/20 via-amber-500/10 to-transparent blur-3xl -z-10" />
          <div className="pointer-events-none absolute bottom-0 right-10 size-80 rounded-full bg-blue-600/10 blur-3xl -z-10" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal direction="up">
              <div className="mx-auto max-w-3xl text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-bold text-orange-400 backdrop-blur shadow-inner">
                  <Sparkles className="size-3.5 text-orange-400" />
                  <span>The Next-Gen Multi-Vendor Commerce Platform</span>
                </div>

                <h1 className="mt-6 text-4xl font-black tracking-tight leading-[1.08] sm:text-5xl lg:text-6xl text-white">
                  Better Commerce Starts With{" "}
                  <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
                    Knowing How It Works.
                  </span>
                </h1>

                <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
                  Nexions replaces legacy marketplace friction with high velocity, fair flat pricing, and
                  end-to-end Stripe escrow. See how shoppers and independent brands thrive together.
                </p>

                {/* Primary Action Buttons */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => scrollToSection("interactive-tour")}
                    className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3.5 text-sm shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>Explore Interactive Tour</span>
                    <ArrowRight className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection("order-lifecycle")}
                    className="rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-6 py-3.5 text-sm border border-white/10 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="size-4 text-orange-400" />
                    <span>Order Simulator</span>
                  </button>
                  <Link
                    to="/shops/new"
                    className="rounded-xl bg-white/[0.06] hover:bg-white/10 text-white font-bold px-6 py-3.5 text-sm border border-white/10 transition-all flex items-center gap-2"
                  >
                    <Store className="size-4 text-sky-400" />
                    <span>Open a Storefront</span>
                  </Link>
                </div>
              </div>
            </ScrollReveal>

            {/* Quick-Nav Jump Strip */}
            <div className="mt-14 pt-8 border-t border-white/10">
              <p className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-4">
                Explore by Topic
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {[
                  { label: "Interactive Architecture", id: "interactive-tour" },
                  { label: "Order Lifecycle Simulator", id: "order-lifecycle" },
                  { label: "Nexions vs Legacy Platforms", id: "platform-comparison" },
                  { label: "Enterprise Tech Stack", id: "tech-stack" },
                  { label: "Platform FAQs", id: "faq" },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => scrollToSection(pill.id)}
                    className="rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/10 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Platform Metrics Ribbon */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center backdrop-blur">
                <span className="text-3xl font-black text-orange-400">$0.00</span>
                <p className="mt-1 text-xs font-bold text-slate-200">Zero Hidden Platform Fees</p>
                <p className="mt-0.5 text-[11px] text-slate-400">100% price transparency</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center backdrop-blur">
                <span className="text-3xl font-black text-white">&lt; 2.1s</span>
                <p className="mt-1 text-xs font-bold text-slate-200">Express Stripe Checkout</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Apple Pay, Cards & GPay</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center backdrop-blur">
                <span className="text-3xl font-black text-emerald-400">100%</span>
                <p className="mt-1 text-xs font-bold text-slate-200">Stripe Escrow Protected</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Funds held until delivery</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center backdrop-blur">
                <span className="text-3xl font-black text-sky-400">48 Hours</span>
                <p className="mt-1 text-xs font-bold text-slate-200">Rolling Merchant Deposits</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Direct to 120+ countries</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 2. CENTERPIECE INTERACTIVE SECTION ──────────────────────── */}
        <div id="interactive-tour">
          <HowItWorksSection />
        </div>

        {/* ─── 3. INTERACTIVE ORDER LIFECYCLE SIMULATOR ────────────────── */}
        <section id="order-lifecycle" className="py-20 lg:py-28 bg-white border-b border-slate-200/90">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal direction="up">
              <div className="mx-auto max-w-3xl text-center space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700">
                  <RefreshCw className="size-3.5 text-blue-600" />
                  <span>Interactive Flow Simulator</span>
                </div>
                <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  Simulate the Lifecycle of an Order
                </h2>
                <p className="text-sm sm:text-base text-slate-600">
                  Step through what actually happens under the hood when a customer purchases on Nexions.
                </p>
              </div>
            </ScrollReveal>

            {/* Step Selector Tabs */}
            <div className="mt-10 flex flex-wrap justify-center gap-2">
              {LIFECYCLE_STAGES.map((stage) => {
                const isActive = stage.id === activeStageId;
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setActiveStageId(stage.id)}
                    className={`rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-slate-950 text-white shadow-md shadow-slate-950/20"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-950"
                    }`}
                  >
                    {stage.label}
                  </button>
                );
              })}
            </div>

            {/* Interactive Stage Visualizer Card */}
            <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-950 text-white p-6 sm:p-8 lg:p-10 shadow-2xl">
              <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
                {/* Left Side: Step Info */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider border ${activeStage.badgeStyle}`}
                    >
                      {activeStage.statusBadge}
                    </span>
                    <span className="text-xs font-mono text-slate-400">Actor: {activeStage.actor}</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-white">{activeStage.title}</h3>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    {activeStage.description}
                  </p>

                  {/* Terminal Log Output */}
                  <div className="rounded-xl bg-slate-900 p-4 border border-white/10 font-mono text-xs text-emerald-400 space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-[10px] pb-1 border-b border-white/10">
                      <span>EVENT_DISPATCH_TELEMETRY</span>
                      <span>{activeStage.timestamp}</span>
                    </div>
                    <p className="break-all pt-1 leading-relaxed">&gt; {activeStage.logMessage}</p>
                  </div>

                  {/* Stepper controls */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      disabled={activeStageId === 1}
                      onClick={() => setActiveStageId((s) => Math.max(1, s - 1))}
                      className="rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none px-4 py-2 text-xs font-bold text-white transition cursor-pointer"
                    >
                      ← Previous Stage
                    </button>
                    <button
                      type="button"
                      disabled={activeStageId === LIFECYCLE_STAGES.length}
                      onClick={() =>
                        setActiveStageId((s) => Math.min(LIFECYCLE_STAGES.length, s + 1))
                      }
                      className="rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-30 disabled:pointer-events-none px-4 py-2 text-xs font-bold text-white transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Next Stage</span>
                      <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Right Side: Realistic Simulated State Card */}
                <div className="lg:col-span-6">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Live Order Telemetry
                        </span>
                        <h4 className="text-sm font-bold text-white">Order #NX-48918-B</h4>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                        <CheckCircle2 className="size-4" />
                        <span>Escrow Protected</span>
                      </div>
                    </div>

                    {/* Progress Bar through 5 stages */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Milestone Progress</span>
                        <span className="font-bold text-white">
                          Stage {activeStage.id} of {LIFECYCLE_STAGES.length}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500"
                          style={{
                            width: `${(activeStage.id / LIFECYCLE_STAGES.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Package details preview */}
                    <div className="rounded-xl bg-white/[0.03] p-3.5 border border-white/5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Merchant Store:</span>
                        <span className="font-bold text-orange-400">Aura Soundworks (Oregon, USA)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Product:</span>
                        <span className="font-bold text-white">Spatial ANC Wireless (Matte)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Total Escrow Vault:</span>
                        <span className="font-bold text-white">$215.90</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Carrier / Tracking:</span>
                        <span className="font-mono text-slate-300">FedEx Ground #NX-99482</span>
                      </div>
                    </div>

                    {/* Delivery Notification pill */}
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-300 flex items-center gap-2">
                      <ShieldCheck className="size-4 shrink-0 text-emerald-400" />
                      <span>Zero risk: Funds only disburse when delivery conditions pass.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 4. COMPARISON MATRIX: NEXIONS VS LEGACY MARKETPLACES ─────── */}
        <section
          id="platform-comparison"
          className="py-20 lg:py-28 bg-slate-50 border-b border-slate-200/90"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal direction="up">
              <div className="mx-auto max-w-3xl text-center space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1 text-xs font-bold text-orange-600">
                  <Scale className="size-3.5 text-orange-600" />
                  <span>Fairness by Architecture</span>
                </div>
                <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  Nexions vs Traditional Marketplaces
                </h2>
                <p className="text-sm sm:text-base text-slate-600">
                  Legacy giants squeeze merchants and tack on hidden buyer fees. Here is how Nexions does it
                  differently.
                </p>
              </div>
            </ScrollReveal>

            {/* Modern Comparison Table */}
            <div className="mt-12 overflow-x-auto rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-900/5">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-4 px-6 w-1/4">Key Capability</th>
                    <th className="py-4 px-6 w-3/8 text-slate-500">Legacy Marketplaces (Amazon / Etsy)</th>
                    <th className="py-4 px-6 w-3/8 bg-orange-500/5 text-orange-600 font-black">
                      Nexions Platform
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.feature} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-950 text-xs sm:text-sm">
                        {row.feature}
                      </td>
                      <td className="py-4 px-6 text-xs sm:text-sm text-slate-500">
                        <div className="flex items-start gap-2">
                          <X className="size-4 shrink-0 text-rose-500 mt-0.5" />
                          <span>{row.legacy}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs sm:text-sm font-medium text-slate-900 bg-orange-500/[0.02]">
                        <div className="flex items-start gap-2">
                          <Check className="size-4 shrink-0 text-emerald-600 font-bold mt-0.5" />
                          <span className="font-semibold text-slate-950">{row.nexions}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ─── 5. ENTERPRISE TECH STACK & ARCHITECTURE HIGHLIGHTS ───────── */}
        <section id="tech-stack" className="py-20 lg:py-28 bg-white border-b border-slate-200/90">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal direction="up">
              <div className="mx-auto max-w-3xl text-center space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3.5 py-1 text-xs font-bold text-purple-700">
                  <Cpu className="size-3.5 text-purple-600" />
                  <span>Engineering Highlights</span>
                </div>
                <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  Built on Modern Distributed Primitives
                </h2>
                <p className="text-sm sm:text-base text-slate-600">
                  Enterprise-grade security, extreme query throughput, and zero cross-tenant leakage.
                </p>
              </div>
            </ScrollReveal>

            <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 space-y-3 hover:shadow-md transition">
                <div className="flex size-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <Zap className="size-5" />
                </div>
                <h3 className="font-black text-slate-950 text-base">React 19 & Tailwind v4</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sub-second rendering powered by Vite, CSS container queries, and hardware-accelerated scroll
                  telemetry.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 space-y-3 hover:shadow-md transition">
                <div className="flex size-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Layers className="size-5" />
                </div>
                <h3 className="font-black text-slate-950 text-base">Hermetic Multi-Tenancy</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Relational PostgreSQL schema boundaries ensure independent stores never share catalog state
                  or financial records.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 space-y-3 hover:shadow-md transition">
                <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <Lock className="size-5" />
                </div>
                <h3 className="font-black text-slate-950 text-base">Stripe Connect Escrow</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  PCI-DSS Level 1 compliance with direct automated bank settlement and fraud protection across
                  120+ currencies.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 space-y-3 hover:shadow-md transition">
                <div className="flex size-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                  <Terminal className="size-5" />
                </div>
                <h3 className="font-black text-slate-950 text-base">Asynchronous BullMQ</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Heavy email dispatches, webhook signatures, and transactional analytics process on Redis
                  background workers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 6. INTERACTIVE FAQ ACCORDION ────────────────────────────── */}
        <section id="faq" className="py-20 lg:py-28 bg-slate-50 border-b border-slate-200/90">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal direction="up">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-bold text-slate-700 shadow-2xs">
                  <HelpCircle className="size-3.5 text-orange-500" />
                  <span>Got Questions?</span>
                </div>
                <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  Frequently Asked Questions
                </h2>
                <p className="text-sm sm:text-base text-slate-600">
                  Everything you need to know about shopping, launching a store, and platform guarantees.
                </p>
              </div>
            </ScrollReveal>

            <div className="mt-12 space-y-3">
              {FAQS.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={faq.q}
                    className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="flex w-full items-center justify-between p-5 text-left text-sm sm:text-base font-bold text-slate-900 cursor-pointer hover:bg-slate-50 transition"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`size-4 shrink-0 text-slate-400 transition-transform duration-300 ${
                          isOpen ? "rotate-180 text-orange-500" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 animate-fade-in">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── 7. HIGH-CONVERTING DUAL CALL-TO-ACTION ──────────────────── */}
        <section className="py-20 lg:py-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Shopper CTA */}
              <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-8 sm:p-10 text-white shadow-xl flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 px-3 py-1 text-xs font-bold text-orange-400 border border-orange-500/30">
                    <ShoppingBag className="size-3.5" />
                    <span>For Discerning Shoppers</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    Discover Independent Brands Today.
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Explore high-quality handcrafted pieces, direct pricing, and unified express checkout
                    with full Stripe escrow protection.
                  </p>
                </div>
                <div className="mt-8 pt-4">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 text-xs sm:text-sm shadow-lg shadow-orange-500/30 transition cursor-pointer"
                  >
                    <span>Start Shopping Now</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>

              {/* Merchant CTA */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 to-amber-600 p-8 sm:p-10 text-white shadow-xl flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white border border-white/30 backdrop-blur">
                    <Store className="size-3.5" />
                    <span>For Independent Creators</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    Launch Your Own Commerce Engine.
                  </h3>
                  <p className="text-xs sm:text-sm text-orange-100 leading-relaxed">
                    Set up your branded storefront in under 3 minutes. Zero listing fees, automated rolling
                    payouts, and enterprise management tools.
                  </p>
                </div>
                <div className="mt-8 pt-4">
                  <Link
                    to="/shops/new"
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold px-6 py-3 text-xs sm:text-sm shadow-lg transition cursor-pointer"
                  >
                    <span>Open a Storefront</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}