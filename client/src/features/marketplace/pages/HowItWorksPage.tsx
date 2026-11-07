import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  Cpu,
  HelpCircle,
  Layers,
  Lock,
  PackageCheck,
  RefreshCw,
  Scale,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  X,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "./Footer";
import { MarketplaceNavbar } from "../layouts/MarketplaceNavbar";
import HowItWorksSection from "../components/HowItWorksSection";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

/* ─── LIFECYCLE SIMULATOR STAGES (MATCHING REAL NEXTGM ORDER STATUSES) ─── */
interface LifecycleStage {
  id: number;
  label: string;
  statusCode: string;
  actor: "Shopper" | "Stripe" | "Merchant" | "Carrier" | "System";
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
    label: "1. Unified Cart & Auth",
    statusCode: "PENDING",
    actor: "Shopper",
    title: "Multi-Store Cart Authorization",
    description:
      "Customer bundles items from independent stores into one cart. NextGM generates a single parent Checkout and sub-orders per merchant. Stripe authorizes a single PaymentIntent.",
    logMessage: "stripe.payment_intent.authorized: checkout_id=chk_89182, total=$254.00, stores=2",
    statusBadge: "Pending Payment Authorization",
    badgeStyle: "bg-amber-50 text-amber-800 border-amber-200",
    timestamp: "10:00:00 AM",
  },
  {
    id: 2,
    label: "2. Atomic Settlement",
    statusCode: "CONFIRMED",
    actor: "Stripe",
    title: "Webhook Settlement & 90/10 Split",
    description:
      "Stripe webhook fires payment_intent.succeeded. Atomic transaction handler distributes 90% to each merchant's ShopWallet and 10% platform commission with 0% buyer surcharge.",
    logMessage: "atomic_settlement: shop_wallet_credited=$228.60 (90%), platform_wallet=$25.40 (10%)",
    statusBadge: "Confirmed (To Pack)",
    badgeStyle: "bg-orange-50 text-orange-800 border-orange-200",
    timestamp: "10:00:02 AM",
  },
  {
    id: 3,
    label: "3. Merchant Fulfillment",
    statusCode: "PROCESSING",
    actor: "Merchant",
    title: "Packing Slip & Carrier Label Generation",
    description:
      "Merchant dashboard notifies warehouse staff. Stock is deducted from SKU matrix, packing slips are printed, and parcel is handed over to FedEx with tracking barcode.",
    logMessage: "merchant_order.processing: shop=aura-soundworks, label=FEDEX_PRIORITY, tracking=NX-99482",
    statusBadge: "Processing & Label Generated",
    badgeStyle: "bg-blue-50 text-blue-800 border-blue-200",
    timestamp: "11:15:30 AM",
  },
  {
    id: 4,
    label: "4. Live Courier Transit",
    statusCode: "SHIPPED",
    actor: "Carrier",
    title: "Real-Time Tracking & Telemetry Sync",
    description:
      "Carrier scans barcode at regional transit hub. Universal tracking link and SMS delivery updates sync directly to the customer's Order Portal.",
    logMessage: "carrier.transit_update: carrier=FedEx, scan_hub=PDX_HUB, est_delivery=TOMORROW",
    statusBadge: "Shipped & In Transit",
    badgeStyle: "bg-indigo-50 text-indigo-800 border-indigo-200",
    timestamp: "03:45:10 PM",
  },
  {
    id: 5,
    label: "5. Delivery & 48h Payout",
    statusCode: "DELIVERED",
    actor: "System",
    title: "Verified Review Unlocked & Payout Release",
    description:
      "Package is signed for and delivered. Customer receives verified review authorization and 14-day return coverage. Merchant wallet balance unlocks for rolling Stripe Express bank transfer.",
    logMessage: "order.delivered: signature=J.DOE, review_token=ACTIVE, payout_status=TRANSFER_READY",
    statusBadge: "Delivered & Verified",
    badgeStyle: "bg-emerald-50 text-emerald-800 border-emerald-200",
    timestamp: "Next Day 12:15 PM",
  },
];

/* ─── DATA: COMPARISON TABLE ─────────────────────────────────────────── */
const COMPARISON_ROWS = [
  {
    feature: "Storefront Branding",
    legacy: "Your brand is hidden; customer sees only the generic giant marketplace.",
    nexions: "Branded custom store handle (nexions.com/:shopSlug) with logo, banner, and profile.",
  },
  {
    feature: "Buyer Checkout Markup",
    legacy: "5%–15% buyer service charges, surge pricing, or hidden fees added at checkout.",
    nexions: "$0.00 platform fee for buyers. Pure transparent merchant item pricing.",
  },
  {
    feature: "Merchant Revenue Split",
    legacy: "15% to 30% take rates plus listing fees, subscription tiers, and transaction cuts.",
    nexions: "Transparent 90% net merchant revenue split with zero listing or renewal fees.",
  },
  {
    feature: "Payout Velocity",
    legacy: "14 to 30 day payout lockups with arbitrary reserve freezes.",
    nexions: "Automated 2-day rolling deposits via Stripe Connect directly to your bank account.",
  },
  {
    feature: "Multi-Store Cart Bundling",
    legacy: "Items from different sellers trigger multiple checkout processes or fragmented tracking.",
    nexions: "One unified cart with a single PaymentIntent for orders across multiple stores.",
  },
  {
    feature: "Review Authenticity",
    legacy: "Flooded with bot farms, sponsored placements, and unverified ratings.",
    nexions: "Strict cryptographic validation: only delivered order IDs can post reviews.",
  },
  {
    feature: "14-Day Returns & Disputes",
    legacy: "Automated bots deny appeals; sellers have no voice in returns.",
    nexions: "Categorized return reasons with photo evidence upload and direct merchant review.",
  },
];

/* ─── DATA: FAQS ──────────────────────────────────────────────────────── */
const FAQS = [
  {
    q: "How does the unified multi-store cart work on NextGM?",
    a: "You can add items from different independent stores to your cart. NextGM bundles them into one single checkout, creates separate sub-orders for each store, and processes one single Stripe payment. You don't have to enter your card details multiple times.",
  },
  {
    q: "How does the 90% merchant settlement and Stripe Connect work?",
    a: "When a checkout succeeds, our atomic webhook handler credits 90% of the item total to the respective store's wallet and 10% to the platform. Merchants connect their bank account via Stripe Express to receive rolling 48-hour automated deposits.",
  },
  {
    q: "What are the 8 readiness checks required to open a store?",
    a: "To ensure a high-trust marketplace, store owners complete 8 setup criteria: profile, store name, description, brand logo, support contact, business address, tax/legal info, and at least one active product. Once verified, the shop status transitions to Active.",
  },
  {
    q: "How does NextGM eliminate fake reviews?",
    a: "Reviews can only be authored by customers with an authenticated account and an order that has reached 'Delivered' status. Unverified shoppers and bots cannot post reviews, guaranteeing authentic feedback.",
  },
  {
    q: "What is the return policy and how are refunds processed?",
    a: "Eligible physical items have a 14-day return window. Customers initiate a return from their order dashboard selecting categorized reasons (Damaged, Not As Described, etc.) and uploading photo evidence. The merchant reviews and approves the refund directly through their dashboard.",
  },
  {
    q: "Are there any hidden fees or listing charges for sellers?",
    a: "None. We do not charge per-listing insertion fees, subscription paywalls, or hidden payment surcharges. Merchants keep 90% of their sales with complete transparency.",
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
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-orange-500 selection:text-white">
      <MarketplaceNavbar />

      <main>
        {/* ─── 1. HERO SECTION: CLEAN LIGHT SAAS DESIGN WITH REAL IMAGES ─── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-orange-50/60 via-white to-slate-50/80 pt-16 pb-20 lg:pt-24 lg:pb-28 border-b border-slate-200/80">
          {/* Warm Orange Ambient Light Orb */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 size-[40rem] rounded-full bg-gradient-to-b from-orange-200/40 via-amber-100/20 to-transparent blur-3xl -z-10" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              {/* Left Column: Heading & Value Prop */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <ScrollReveal direction="up">
                  <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-xs font-bold text-orange-600 shadow-2xs">
                    <Sparkles className="size-3.5 text-orange-500" />
                    <span>The Next-Generation Multi-Tenant Commerce Engine</span>
                  </div>

                  <h1 className="mt-4 text-4xl font-black tracking-tight leading-[1.08] sm:text-5xl lg:text-6xl text-slate-950">
                    How NextGM Works:{" "}
                    <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                      Clarity, Speed & Fair Commerce.
                    </span>
                  </h1>

                  <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                    Discover how NextGM unites multi-store shoppers, independent merchants, and atomic Stripe
                    settlement with zero buyer fees, verified reviews, and rolling 48-hour bank payouts.
                  </p>

                  {/* Actions */}
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => scrollToSection("interactive-tour")}
                      className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3.5 text-sm shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/35 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span>Explore Interactive Tour</span>
                      <ArrowRight className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToSection("order-lifecycle")}
                      className="rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold px-6 py-3.5 text-sm border border-slate-200 shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="size-4 text-orange-600" />
                      <span>Order Lifecycle Simulator</span>
                    </button>
                    <Link
                      to="/shops/new"
                      className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3.5 text-sm transition-all flex items-center gap-2 shadow-xs"
                    >
                      <Store className="size-4 text-orange-400" />
                      <span>Open a Storefront</span>
                    </Link>
                  </div>

                  {/* Key Highlights */}
                  <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-200">
                    <div>
                      <span className="text-2xl font-black text-orange-600">$0.00</span>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">Zero Buyer Fees</p>
                      <p className="text-[11px] text-slate-500">No checkout surcharge</p>
                    </div>
                    <div>
                      <span className="text-2xl font-black text-slate-900">90.0%</span>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">Merchant Net</p>
                      <p className="text-[11px] text-slate-500">Direct wallet credit</p>
                    </div>
                    <div>
                      <span className="text-2xl font-black text-emerald-600">48 Hours</span>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">Rolling Deposits</p>
                      <p className="text-[11px] text-slate-500">Stripe Express bank</p>
                    </div>
                    <div>
                      <span className="text-2xl font-black text-blue-600">100%</span>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">Verified Reviews</p>
                      <p className="text-[11px] text-slate-500">Delivered orders only</p>
                    </div>
                  </div>
                </ScrollReveal>
              </div>

              {/* Right Column: Real Visual Dashboard Image Showcase */}
              <div className="lg:col-span-5">
                <ScrollReveal direction="scale">
                  <div className="relative rounded-3xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/5">
                    <div className="overflow-hidden rounded-2xl bg-slate-100 aspect-[4/3] relative group">
                      <img
                        src="/loginImage.png"
                        alt="NextG Dashboard Experience"
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent flex flex-col justify-end p-5 text-white">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-emerald-500/90 text-slate-950 font-black text-[10px] px-2 py-0.5">
                            LIVE PLATFORM
                          </span>
                          <span className="text-xs font-bold text-slate-200">Merchant & Shopper Suite</span>
                        </div>
                        <h3 className="mt-1 text-lg font-black leading-tight text-white">
                          NextGM Architecture in Action
                        </h3>
                        <p className="mt-1 text-xs text-slate-300">
                          Integrated multi-vendor cart, matrix variants, and Stripe Connect.
                        </p>
                      </div>
                    </div>

                    {/* Floating pill badge */}
                    <div className="mt-3 flex items-center justify-between px-2 text-xs text-slate-600">
                      <span className="flex items-center gap-1.5 font-bold text-slate-900">
                        <BadgeCheck className="size-4 text-orange-500" />
                        Production Verified System
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">v2.4 LTS</span>
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </div>

            {/* Quick Topic Jump Strip */}
            <div className="mt-14 pt-8 border-t border-slate-200 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2">
                Quick Jump:
              </span>
              {[
                { label: "Interactive Product Tour", id: "interactive-tour" },
                { label: "Order Lifecycle Simulator", id: "order-lifecycle" },
                { label: "NextGM vs Legacy Giants", id: "platform-comparison" },
                { label: "Tech Architecture", id: "tech-stack" },
                { label: "Platform FAQs", id: "faq" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => scrollToSection(pill.id)}
                  className="rounded-full bg-slate-100 hover:bg-orange-50 hover:text-orange-600 border border-slate-200/80 px-3.5 py-1 text-xs font-semibold text-slate-700 transition cursor-pointer"
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 2. INTERACTIVE CORE PLATFORM WALKTHROUGH ────────────────── */}
        <div id="interactive-tour">
          <HowItWorksSection />
        </div>

        {/* ─── 3. INTERACTIVE ORDER LIFECYCLE SIMULATOR (LIGHT MODE) ──── */}
        <section id="order-lifecycle" className="py-20 lg:py-28 bg-white border-b border-slate-200/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal direction="up">
              <div className="mx-auto max-w-3xl text-center space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700">
                  <RefreshCw className="size-3.5 text-blue-600" />
                  <span>Real Order Pipeline Simulator</span>
                </div>
                <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  Simulate the Lifecycle of an Order
                </h2>
                <p className="text-sm sm:text-base text-slate-600">
                  Step through what happens under the hood across customer checkout, webhook settlement,
                  warehouse dispatch, and carrier delivery.
                </p>
              </div>
            </ScrollReveal>

            {/* Stepper Tabs */}
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
                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {stage.label}
                  </button>
                );
              })}
            </div>

            {/* Light Stage Visualizer Card */}
            <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8 lg:p-10 shadow-lg">
              <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
                {/* Left Side: Step Details */}
                <div className="lg:col-span-6 space-y-4 text-left">
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider border ${activeStage.badgeStyle}`}
                    >
                      {activeStage.statusBadge}
                    </span>
                    <span className="text-xs font-mono text-slate-500">Actor: {activeStage.actor}</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-slate-950">{activeStage.title}</h3>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    {activeStage.description}
                  </p>

                  {/* Terminal Log Output (Clean Slate Log) */}
                  <div className="rounded-xl bg-white p-4 border border-slate-200 font-mono text-xs text-slate-800 space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] pb-1 border-b border-slate-100">
                      <span>EVENT_DISPATCH_TELEMETRY</span>
                      <span>{activeStage.timestamp}</span>
                    </div>
                    <p className="break-all pt-1 leading-relaxed text-orange-600 font-bold">
                      &gt; {activeStage.logMessage}
                    </p>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      disabled={activeStageId === 1}
                      onClick={() => setActiveStageId((s) => Math.max(1, s - 1))}
                      className="rounded-xl bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none px-4 py-2 text-xs font-bold text-slate-700 transition cursor-pointer shadow-2xs"
                    >
                      ← Previous Stage
                    </button>
                    <button
                      type="button"
                      disabled={activeStageId === LIFECYCLE_STAGES.length}
                      onClick={() =>
                        setActiveStageId((s) => Math.min(LIFECYCLE_STAGES.length, s + 1))
                      }
                      className="rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-30 disabled:pointer-events-none px-4 py-2 text-xs font-bold text-white transition cursor-pointer flex items-center gap-1.5 shadow-sm shadow-orange-500/25"
                    >
                      <span>Next Stage</span>
                      <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Right Side: Simulated Live State Box */}
                <div className="lg:col-span-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Live Order Telemetry
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">Order #NX-48918-B</h4>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                        <span>Escrow Protected</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Milestone Progress</span>
                        <span className="font-bold text-slate-900">
                          Stage {activeStage.id} of {LIFECYCLE_STAGES.length} ({activeStage.statusCode})
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500"
                          style={{
                            width: `${(activeStage.id / LIFECYCLE_STAGES.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Order Details Preview */}
                    <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Merchant Store:</span>
                        <span className="font-bold text-orange-600">Aura Soundworks (Oregon, USA)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Item:</span>
                        <span className="font-bold text-slate-900">Spatial ANC Wireless (Matte)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Single Checkout Amount:</span>
                        <span className="font-bold text-slate-900">$203.20</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Carrier / Tracking:</span>
                        <span className="font-mono text-slate-700">FedEx Ground #NX-99482</span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="rounded-lg bg-orange-50 border border-orange-200 p-2.5 text-xs text-orange-900 flex items-center gap-2">
                      <ShieldCheck className="size-4 shrink-0 text-orange-600" />
                      <span>Zero risk: Funds only disburse when delivery conditions pass.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 4. COMPARISON MATRIX: NEXTGM VS LEGACY GIANTS ───────────── */}
        <section
          id="platform-comparison"
          className="py-20 lg:py-28 bg-slate-50/70 border-b border-slate-200/80"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal direction="up">
              <div className="mx-auto max-w-3xl text-center space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1 text-xs font-bold text-orange-600">
                  <Scale className="size-3.5 text-orange-600" />
                  <span>Fairness by Architecture</span>
                </div>
                <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  NextGM vs Traditional Marketplaces
                </h2>
                <p className="text-sm sm:text-base text-slate-600">
                  Legacy giants squeeze merchants and tack on hidden buyer fees. Here is how NextGM operates
                  differently.
                </p>
              </div>
            </ScrollReveal>

            {/* Clean Light Comparison Table */}
            <div className="mt-12 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-4 px-6 w-1/4">Key Capability</th>
                    <th className="py-4 px-6 w-3/8 text-slate-500">Legacy Marketplaces (Amazon / Etsy)</th>
                    <th className="py-4 px-6 w-3/8 bg-orange-50/80 text-orange-700 font-black border-l border-orange-100">
                      NextGM Platform
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
                      <td className="py-4 px-6 text-xs sm:text-sm font-medium text-slate-900 bg-orange-50/[0.15] border-l border-orange-100">
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

        {/* ─── 5. ENTERPRISE TECH HIGHLIGHTS ───────────────────────────── */}
        <section id="tech-stack" className="py-20 lg:py-28 bg-white border-b border-slate-200/80">
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
                  Enterprise-grade security, sub-35ms API latency, and zero cross-tenant leakage.
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
                  <PackageCheck className="size-5" />
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

        {/* ─── 6. FREQUENTLY ASKED QUESTIONS ───────────────────────────── */}
        <section id="faq" className="py-20 lg:py-28 bg-slate-50/70 border-b border-slate-200/80">
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
                          isOpen ? "rotate-180 text-orange-600" : ""
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

        {/* ─── 7. DUAL HIGH-CONVERTING CALL-TO-ACTION (LIGHT THEMED) ───── */}
        <section className="py-20 lg:py-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Shopper CTA */}
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-orange-50/40 p-8 sm:p-10 text-slate-900 shadow-md flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                    <ShoppingBag className="size-3.5" />
                    <span>For Discerning Shoppers</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-950">
                    Discover Independent Brands Today.
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Explore high-quality handcrafted pieces, direct pricing, and unified express checkout
                    with full Stripe escrow protection.
                  </p>
                </div>
                <div className="mt-8 pt-4">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3.5 text-xs sm:text-sm shadow-md shadow-orange-500/25 transition cursor-pointer"
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
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold px-6 py-3.5 text-xs sm:text-sm shadow-lg transition cursor-pointer"
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