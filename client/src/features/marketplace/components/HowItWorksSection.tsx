import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Cpu,
  CreditCard,
  Lock,
  Package,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

/* ─── TYPES ───────────────────────────────────────────────────────────── */
type TrackId = "shoppers" | "merchants" | "engine" | "safeguards";

interface StepDetail {
  id: string;
  stepNumber: string;
  badge: string;
  title: string;
  tagline: string;
  description: string;
  metrics: { label: string; value: string }[];
  keyFeatures: string[];
}

interface TrackConfig {
  id: TrackId;
  label: string;
  shortLabel: string;
  subtitle: string;
  icon: LucideIcon;
  badgeColor: string;
  activeColor: string;
  steps: StepDetail[];
}

/* ─── TRACK DATA ──────────────────────────────────────────────────────── */
const TRACKS: TrackConfig[] = [
  {
    id: "shoppers",
    label: "For Shoppers",
    shortLabel: "Shoppers",
    subtitle: "From discovery to doorstep with zero friction",
    icon: ShoppingBag,
    badgeColor: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    activeColor: "border-orange-500 bg-orange-500 text-white",
    steps: [
      {
        id: "curated-discovery",
        stepNumber: "01",
        badge: "Smart Discovery",
        title: "Curated Brands & Real-Time Search",
        tagline: "Find handcrafted essentials and standout independent brands.",
        description:
          "Browse high-trust independent storefronts with instant category filters, verified buyer reviews, and real-time inventory previews.",
        metrics: [
          { label: "Search Latency", value: "< 45ms" },
          { label: "Verified Sellers", value: "100%" },
        ],
        keyFeatures: [
          "Multi-category faceted navigation",
          "Real-time stock indicators",
          "Direct storefront transparent pricing",
        ],
      },
      {
        id: "multi-cart",
        stepNumber: "02",
        badge: "Unified Basket",
        title: "One Multi-Store Cart. Zero Splitting.",
        tagline: "Bundle multiple independent stores into one seamless basket.",
        description:
          "Add pieces from different stores across the world. Our cart engine groups items by merchant, applies active coupons, and keeps your cart synced across devices.",
        metrics: [
          { label: "Device Sync", value: "Instant" },
          { label: "Guest Cart", value: "Supported" },
        ],
        keyFeatures: [
          "Automatic store parcel grouping",
          "Live coupon discount calculator",
          "Persistent guest session sync",
        ],
      },
      {
        id: "express-checkout",
        stepNumber: "03",
        badge: "Stripe Escrow",
        title: "Bank-Grade Express Checkout",
        tagline: "256-bit encrypted payments with Stripe Connect protection.",
        description:
          "Pay once with Apple Pay, Google Pay, or Credit Card. Funds are held in protected escrow until the merchant ships your verified order.",
        metrics: [
          { label: "Avg. Checkout", value: "2.1 sec" },
          { label: "Hidden Fees", value: "$0.00" },
        ],
        keyFeatures: [
          "Single-click payment authorization",
          "Full PCI DSS Level 1 encryption",
          "No hidden platform surcharges",
        ],
      },
      {
        id: "live-tracking",
        stepNumber: "04",
        badge: "Live Telemetry",
        title: "Doorstep Milestones & Tracking",
        tagline: "Track dispatch, carrier handoff, and delivery live.",
        description:
          "Receive automated webhook updates, track courier transit live, and enjoy a hassle-free 14-day return guarantee with direct merchant support.",
        metrics: [
          { label: "Delivery Updates", value: "Real-Time" },
          { label: "Return Window", value: "14 Days" },
        ],
        keyFeatures: [
          "Automated tracking numbers",
          "Status notifications & invoices",
          "Direct store dispute assistance",
        ],
      },
    ],
  },
  {
    id: "merchants",
    label: "For Store Owners",
    shortLabel: "Store Owners",
    subtitle: "A modern SaaS operating system for independent commerce",
    icon: Store,
    badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    activeColor: "border-blue-600 bg-blue-600 text-white",
    steps: [
      {
        id: "store-onboard",
        stepNumber: "01",
        badge: "Launch in Minutes",
        title: "Multi-Tenant Storefront Setup",
        tagline: "Claim your branded URL and customize your storefront.",
        description:
          "Create your independent digital boutique. Upload your custom logo, configure shipping zones, policy rules, and custom domain routing instantly.",
        metrics: [
          { label: "Setup Time", value: "< 3 mins" },
          { label: "Custom Subdomain", value: "Free" },
        ],
        keyFeatures: [
          "Unique storefront slug & branding",
          "Granular shipping rate tables",
          "Integrated SEO & social metadata",
        ],
      },
      {
        id: "catalog-variants",
        stepNumber: "02",
        badge: "Inventory Engine",
        title: "Multi-Variant Catalog Management",
        tagline: "Manage SKUs, physical sizes, colors, and stock levels.",
        description:
          "Effortlessly handle products with matrix variants, low-stock threshold alerts, Cloudinary image optimization, and flash deal promotions.",
        metrics: [
          { label: "Variant Combinations", value: "Unlimited" },
          { label: "Image CDN", value: "Cloudinary" },
        ],
        keyFeatures: [
          "SKU-level stock tracking & auto-hiding",
          "Promotional coupons & percentage discounts",
          "Instant digital and physical goods support",
        ],
      },
      {
        id: "order-fulfillment",
        stepNumber: "03",
        badge: "Dispatch Pipeline",
        title: "Fulfillment & Real-Time Tracking",
        tagline: "Process incoming orders, print packing slips, and ship.",
        description:
          "Real-time notifications trigger when shoppers buy. Assign carrier tracking IDs (FedEx, UPS, DHL), notify buyers, and trigger automatic status transitions.",
        metrics: [
          { label: "Notification Lag", value: "< 100ms" },
          { label: "Carrier Sync", value: "Universal" },
        ],
        keyFeatures: [
          "One-click packing slips & invoices",
          "Automated customer dispatch emails",
          "Return request workflow management",
        ],
      },
      {
        id: "automated-payouts",
        stepNumber: "04",
        badge: "Stripe Connect",
        title: "Direct Payouts to Your Bank",
        tagline: "Automated 2-day rolling deposits with transparent ledger.",
        description:
          "Enjoy direct payouts via Stripe Connect. View net earnings, taxes, settlement dates, and downloadable CSV ledgers with zero surprise deductions.",
        metrics: [
          { label: "Payout Schedule", value: "Rolling 48h" },
          { label: "Platform Cut", value: "Fair Flat" },
        ],
        keyFeatures: [
          "Direct deposit to 120+ countries",
          "Complete ledger breakdown & export",
          "Zero merchant lock-in or hidden cuts",
        ],
      },
    ],
  },
  {
    id: "engine",
    label: "Engine & Infrastructure",
    shortLabel: "Infrastructure",
    subtitle: "High-concurrency backend built on modern distributed primitives",
    icon: Cpu,
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    activeColor: "border-emerald-600 bg-emerald-600 text-white",
    steps: [
      {
        id: "gateway-auth",
        stepNumber: "01",
        badge: "Secure Gateway",
        title: "TypeScript API & Session Isolation",
        tagline: "Sub-50ms API endpoints protected by JWT and role governance.",
        description:
          "Enterprise API architecture with role-based routing (SuperAdmin, ShopOwner, Customer), rate limiting, and automated input validation via Zod schemas.",
        metrics: [
          { label: "API Response", value: "< 35ms" },
          { label: "Schema Safety", value: "100% Zod" },
        ],
        keyFeatures: [
          "HttpOnly secure session cookies",
          "Redis token revoking & rate defense",
          "Automated request audit trail",
        ],
      },
      {
        id: "data-isolation",
        stepNumber: "02",
        badge: "Multi-Tenancy",
        title: "PostgreSQL Multi-Tenant Architecture",
        tagline: "Hermetic data isolation for every independent merchant.",
        description:
          "Relational PostgreSQL architecture ensures complete data separation between stores. Inventory, customer records, and ledger balances never cross tenant boundaries.",
        metrics: [
          { label: "Query Execution", value: "< 12ms" },
          { label: "Data Integrity", value: "ACID Guaranteed" },
        ],
        keyFeatures: [
          "Multi-tenant schema partitioning",
          "Optimized B-tree indexing on catalog searches",
          "Zero cross-shop data leakage",
        ],
      },
      {
        id: "queues-webhooks",
        stepNumber: "03",
        badge: "Asynchronous Workers",
        title: "Redis BullMQ & Event Processing",
        tagline: "Decoupled job queues handle emails, webhooks, and analytics.",
        description:
          "Heavy tasks never block the user thread. Stripe webhooks, transactional receipts, notifications, and analytics rollups process through asynchronous workers.",
        metrics: [
          { label: "Queue Throughput", value: "10k+ jobs/s" },
          { label: "Webhook Reliability", value: "99.99%" },
        ],
        keyFeatures: [
          "Automatic exponential retry backoff",
          "Dead-letter queue inspection",
          "Real-time event broadcasting",
        ],
      },
      {
        id: "cdn-speed",
        stepNumber: "04",
        badge: "Edge Performance",
        title: "Global CDN & Asset Acceleration",
        tagline: "Sub-second page loads powered by Vite and Cloudinary CDN.",
        description:
          "Dynamic image transformations, WebP/AVIF automated formatting, and responsive srcset generation guarantee instant browsing on any network.",
        metrics: [
          { label: "Lighthouse Score", value: "98/100" },
          { label: "Image Format", value: "Next-Gen AVIF" },
        ],
        keyFeatures: [
          "Edge asset caching across 240+ PoPs",
          "Automatic device-aware downscaling",
          "Optimized bundle splitting",
        ],
      },
    ],
  },
  {
    id: "safeguards",
    label: "Trust & Buyer Protection",
    shortLabel: "Protection",
    subtitle: "Financial safeguards, fraud defense, and verified reviews",
    icon: ShieldCheck,
    badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    activeColor: "border-purple-600 bg-purple-600 text-white",
    steps: [
      {
        id: "escrow-protection",
        stepNumber: "01",
        badge: "Escrow Holding",
        title: "Guaranteed Buyer Escrow Vault",
        tagline: "Merchants only get settled once shipping is recorded.",
        description:
          "Your payment is secured in a platform vault. In the rare event of non-delivery or unresolved issues, platform protection guarantees a full and immediate refund.",
        metrics: [
          { label: "Buyer Coverage", value: "$100k Max" },
          { label: "Dispute Resolution", value: "< 24h" },
        ],
        keyFeatures: [
          "Automated shipment verification trigger",
          "One-click return dispute initiation",
          "Direct Stripe payment reversal guarantee",
        ],
      },
      {
        id: "verified-reviews",
        stepNumber: "02",
        badge: "Review Integrity",
        title: "100% Cryptographically Verified Reviews",
        tagline: "No bot farms. Only genuine confirmed purchasers can rate.",
        description:
          "Unlike legacy giants flooded with fake five-star feedback, reviews on Nexions require a completed, fulfilled order transaction ID. Fake reviews are mathematically eliminated.",
        metrics: [
          { label: "Verified Buyer Tag", value: "Strict Order ID" },
          { label: "Fake Review Rate", value: "0.00%" },
        ],
        keyFeatures: [
          "Order ID verification on submit",
          "Verified buyer visual checkmark",
          "Public merchant response threads",
        ],
      },
      {
        id: "zero-hidden-fees",
        stepNumber: "03",
        badge: "Transparent Pricing",
        title: "Zero Hidden Fees at Checkout",
        tagline: "What you see is what you pay. No platform markups.",
        description:
          "We never tack on sneaky 'convenience fees', 'marketplace service charges', or inflated currency spreads. Exact taxes and shipping are transparent before you click pay.",
        metrics: [
          { label: "Buyer Surcharge", value: "$0.00" },
          { label: "Fee Transparency", value: "100%" },
        ],
        keyFeatures: [
          "Itemized tax & carrier shipping rates",
          "No surge or peak pricing algorithms",
          "Item prices set directly by merchants",
        ],
      },
      {
        id: "seller-compliance",
        stepNumber: "04",
        badge: "Vetted Merchants",
        title: "Strict Merchant KYC & Vetting",
        tagline: "Every shop passes identity checks and quality verification.",
        description:
          "Store owners must complete identity verification and pass quality screening before their products reach the public marketplace. Spammers and drop-shippers are filtered out.",
        metrics: [
          { label: "Merchant KYC", value: "Stripe Verified" },
          { label: "Store Uptime", value: "Monitored 24/7" },
        ],
        keyFeatures: [
          "Government ID verification",
          "Live business status checks",
          "Automated prohibited item scanning",
        ],
      },
    ],
  },
];

/* ─── REALISTIC VISUAL APP MOCKUP COMPONENTS ──────────────────────────── */

/**
 * Shopper Live Interactive Mockup
 */
function ShopperMockup({ activeStep }: { activeStep: string }) {
  const [selectedColor, setSelectedColor] = useState<"slate" | "white" | "amber">("slate");
  const [cartCount, setCartCount] = useState(2);
  const [couponApplied, setCouponApplied] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = () => {
    setIsAdding(true);
    setTimeout(() => {
      setCartCount((c) => c + 1);
      setIsAdding(false);
    }, 450);
  };

  return (
    <div className="relative flex flex-col rounded-2xl border border-slate-200/90 bg-slate-950 text-white shadow-2xl shadow-slate-950/20 overflow-hidden">
      {/* OS / Browser Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-rose-500/80" />
            <div className="size-2.5 rounded-full bg-amber-500/80" />
            <div className="size-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="ml-3 hidden text-[11px] font-mono text-slate-400 sm:inline-block">
            nexions.marketplace/discover/audio-studio
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-slate-200">
            <ShoppingBag className="size-3 text-orange-400" />
            <span>Bag ({cartCount})</span>
          </div>
          <div className="size-6 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-black text-white">
            JD
          </div>
        </div>
      </div>

      {/* Dynamic Step View inside Browser */}
      <div className="p-4 sm:p-6 bg-gradient-to-b from-slate-900/50 to-slate-950 min-h-[420px]">
        {activeStep === "curated-discovery" && (
          <div className="space-y-4 animate-fade-in">
            {/* Top Store Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/[0.04] p-3 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center font-black text-white text-xs">
                  AS
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white">Aura Soundworks</span>
                    <BadgeCheck className="size-4 text-orange-400 fill-orange-400/20" />
                  </div>
                  <p className="text-[11px] text-slate-400">Independent Acoustic Studio • Portland, OR</p>
                </div>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                <Star className="size-3 fill-emerald-400 text-emerald-400" />
                <span>4.96 (428 reviews)</span>
              </div>
            </div>

            {/* Product Card Showcase */}
            <div className="grid gap-5 sm:grid-cols-[1.1fr_.9fr] items-center rounded-2xl bg-white/[0.03] p-4 border border-white/10">
              <div className="relative group overflow-hidden rounded-xl bg-slate-800/80 aspect-[4/3]">
                <img
                  src="/hero-products/headphones.jpg"
                  alt="Aura Studio Headphones"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-2.5 left-2.5 rounded-full bg-slate-950/80 px-2.5 py-0.5 text-[10px] font-bold text-orange-300 backdrop-blur border border-white/10">
                  Staff Pick
                </div>
                <div className="absolute bottom-2.5 right-2.5 rounded-md bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                  Ready to Ship (8 left)
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400">
                      Studio Reference
                    </span>
                    <span className="text-xs font-medium text-slate-400">Free 2-day delivery</span>
                  </div>
                  <h4 className="mt-1 text-base sm:text-lg font-black text-white leading-tight">
                    Aura Spatial ANC Wireless Headphones
                  </h4>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white">$189.00</span>
                    <span className="text-xs text-slate-400 line-through">$249.00</span>
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                      SAVE 24%
                    </span>
                  </div>
                </div>

                {/* Interactive Variant Color Selector */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                    Finish:{" "}
                    <span className="text-white capitalize font-bold">
                      {selectedColor === "slate" ? "Matte Obsidian" : selectedColor === "white" ? "Arctic Frost" : "Warm Amber"}
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedColor("slate")}
                      className={`size-6 rounded-full bg-slate-800 border-2 transition-all ${
                        selectedColor === "slate" ? "border-orange-400 scale-110 shadow-sm shadow-orange-500/50" : "border-white/30"
                      }`}
                      title="Matte Obsidian"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedColor("white")}
                      className={`size-6 rounded-full bg-slate-100 border-2 transition-all ${
                        selectedColor === "white" ? "border-orange-400 scale-110 shadow-sm shadow-orange-500/50" : "border-white/30"
                      }`}
                      title="Arctic Frost"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedColor("amber")}
                      className={`size-6 rounded-full bg-amber-600 border-2 transition-all ${
                        selectedColor === "amber" ? "border-orange-400 scale-110 shadow-sm shadow-orange-500/50" : "border-white/30"
                      }`}
                      title="Warm Amber"
                    />
                  </div>
                </div>

                {/* Add to Cart Simulation */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-[0.98]"
                >
                  {isAdding ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin" />
                      <span>Syncing Cart...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="size-3.5" />
                      <span>Instant Add to Cart</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeStep === "multi-cart" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white">Unified Multi-Store Basket</h4>
                <p className="text-[11px] text-slate-400">2 independent merchant packages in 1 order</p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
                Free Express Delivery Unlocked
              </span>
            </div>

            {/* Merchant 1 Item */}
            <div className="rounded-xl bg-white/[0.04] p-3 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-orange-400 flex items-center gap-1.5">
                  <Store className="size-3" /> Aura Soundworks (Oregon)
                </span>
                <span className="text-slate-400">Ships in 24h</span>
              </div>
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3">
                  <img
                    src="/hero-products/headphones.jpg"
                    alt="Aura ANC"
                    className="size-11 rounded-lg object-cover bg-slate-800"
                  />
                  <div>
                    <p className="text-xs font-bold text-white">Aura Spatial ANC Wireless</p>
                    <p className="text-[11px] text-slate-400">Qty: 1 • Matte Obsidian</p>
                  </div>
                </div>
                <span className="text-sm font-black text-white">$189.00</span>
              </div>
            </div>

            {/* Merchant 2 Item */}
            <div className="rounded-xl bg-white/[0.04] p-3 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-sky-400 flex items-center gap-1.5">
                  <Store className="size-3" /> Peak Minimalist Goods (Tokyo)
                </span>
                <span className="text-slate-400">Tracked Air Courier</span>
              </div>
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3">
                  <img
                    src="/hero-products/camera.jpg"
                    alt="Camera Pack"
                    className="size-11 rounded-lg object-cover bg-slate-800"
                  />
                  <div>
                    <p className="text-xs font-bold text-white">Classic Rangefinder Case & Strap</p>
                    <p className="text-[11px] text-slate-400">Qty: 1 • Olive Green</p>
                  </div>
                </div>
                <span className="text-sm font-black text-white">$65.00</span>
              </div>
            </div>

            {/* Interactive Coupon & Summary */}
            <div className="rounded-xl bg-slate-900 p-3 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Subtotal (2 items)</span>
                <span className="font-bold text-white">$254.00</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Promo Code</span>
                  <button
                    type="button"
                    onClick={() => setCouponApplied(!couponApplied)}
                    className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-bold text-orange-400 hover:bg-orange-500/30 transition"
                  >
                    {couponApplied ? "WELCOME15 Applied ✓" : "Apply WELCOME15"}
                  </button>
                </div>
                <span className={couponApplied ? "font-bold text-emerald-400" : "text-slate-500"}>
                  {couponApplied ? "-$38.10" : "$0.00"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
                <span className="font-bold text-white">Total at Stripe Checkout</span>
                <span className="text-base font-black text-white">
                  ${couponApplied ? "215.90" : "254.00"}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeStep === "express-checkout" && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="size-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300">256-bit Stripe Escrow Authorization</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">TLS 1.3 Verified</span>
            </div>

            {/* Express Pay Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="rounded-xl bg-white text-slate-950 font-black py-2.5 text-xs flex items-center justify-center gap-1.5 hover:bg-slate-100 transition shadow"
              >
                <span className="text-sm">Pay</span> Express
              </button>
              <button
                type="button"
                className="rounded-xl bg-slate-800 text-white font-bold py-2.5 text-xs flex items-center justify-center gap-1.5 hover:bg-slate-700 transition border border-white/10"
              >
                <CreditCard className="size-3.5 text-orange-400" /> Credit Card
              </button>
            </div>

            {/* Mock Credit Card Form Preview */}
            <div className="rounded-xl bg-white/[0.04] p-3.5 border border-white/10 space-y-2.5 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Cardholder Information
                </label>
                <div className="rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-slate-200 flex items-center justify-between">
                  <span>Jane Doe • jane@example.com</span>
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Card Details (Protected)
                </label>
                <div className="rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-slate-200 flex items-center justify-between font-mono">
                  <span>•••• •••• •••• 4242</span>
                  <span className="text-slate-400 text-[11px]">11/28 • CVC 982</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Shipping: Free Express</span>
                <span>Platform Fee: <strong className="text-emerald-400 font-bold">$0.00 (Zero)</strong></span>
              </div>
            </div>

            <button
              type="button"
              className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 text-xs shadow-lg shadow-orange-500/30 transition flex items-center justify-center gap-2"
            >
              <ShieldCheck className="size-4" />
              <span>Authorize & Place Order • $215.90</span>
            </button>
          </div>
        )}

        {activeStep === "live-tracking" && (
          <div className="space-y-4 animate-fade-in">
            {/* Tracking Badge */}
            <div className="flex items-center justify-between rounded-xl bg-white/[0.04] p-3 border border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <Truck className="size-4 text-orange-400" />
                  <span className="text-xs font-bold text-white">Tracking #NX-99482-US</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Courier: FedEx Ground Priority</p>
              </div>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                In Transit (On Schedule)
              </span>
            </div>

            {/* Stepper Timeline */}
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/15">
              <div className="relative">
                <div className="absolute -left-6 top-0.5 size-4 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] text-slate-950 font-bold">
                  ✓
                </div>
                <p className="text-xs font-bold text-white">Payment Authorized & Escrow Locked</p>
                <p className="text-[11px] text-slate-400">Today, 09:14 AM • Stripe Connect</p>
              </div>

              <div className="relative">
                <div className="absolute -left-6 top-0.5 size-4 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] text-slate-950 font-bold">
                  ✓
                </div>
                <p className="text-xs font-bold text-white">Merchant Packed & Sealed</p>
                <p className="text-[11px] text-slate-400">Aura Soundworks Warehouse • 11:30 AM</p>
              </div>

              <div className="relative">
                <div className="absolute -left-6 top-0.5 size-4 rounded-full bg-orange-500 animate-pulse flex items-center justify-center">
                  <div className="size-2 rounded-full bg-white" />
                </div>
                <p className="text-xs font-bold text-orange-300">Out for Local Delivery</p>
                <p className="text-[11px] text-slate-400">Courier van on route • Expected by 4:00 PM</p>
              </div>

              <div className="relative opacity-60">
                <div className="absolute -left-6 top-0.5 size-4 rounded-full bg-white/20 border border-white/40" />
                <p className="text-xs font-medium text-slate-300">Delivery Confirmation & Payout Release</p>
                <p className="text-[11px] text-slate-500">Signature required • 14-day warranty begins</p>
              </div>
            </div>

            {/* Support Pill */}
            <div className="rounded-xl bg-slate-900 p-3 border border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-400" />
                <span className="text-slate-300">Protected by Nexions Buyer Guarantee</span>
              </div>
              <span className="text-orange-400 font-bold hover:underline cursor-pointer">Contact Support</span>
            </div>
          </div>
        )}
      </div>

      {/* Mockup Status Footer */}
      <div className="flex items-center justify-between border-t border-white/10 bg-slate-900/60 px-4 py-2.5 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          Interactive Shopper Live Preview
        </span>
        <span className="text-[10px] text-slate-500 font-mono">Stage: {activeStep}</span>
      </div>
    </div>
  );
}

/**
 * Merchant Live Interactive Mockup
 */
function MerchantMockup({ activeStep }: { activeStep: string }) {
  return (
    <div className="relative flex flex-col rounded-2xl border border-slate-200/90 bg-slate-950 text-white shadow-2xl shadow-slate-950/20 overflow-hidden">
      {/* OS / Dashboard Top Bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-rose-500/80" />
            <div className="size-2.5 rounded-full bg-amber-500/80" />
            <div className="size-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="ml-3 hidden text-[11px] font-mono text-slate-400 sm:inline-block">
            dashboard.nexions.io/store/aura-soundworks
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
            Store Live
          </div>
          <span className="size-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black text-white">
            N
          </span>
        </div>
      </div>

      {/* Dynamic Content */}
      <div className="p-4 sm:p-6 bg-gradient-to-b from-slate-900/50 to-slate-950 min-h-[420px]">
        {activeStep === "store-onboard" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white">Storefront Configuration</h4>
                <p className="text-[11px] text-slate-400">Independent URL & brand identity</p>
              </div>
              <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                Tier: Merchant Pro
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-white/[0.04] p-3 border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Custom Merchant Handle
                </span>
                <p className="mt-1 text-sm font-mono text-orange-400 font-bold">
                  nexions.com/<span className="text-white">aura-soundworks</span>
                </p>
                <p className="mt-1 text-[11px] text-slate-400">DNS SSL Certificate: Active ✓</p>
              </div>

              <div className="rounded-xl bg-white/[0.04] p-3 border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Shipping Zone Matrix
                </span>
                <p className="mt-1 text-sm font-bold text-white">Domestic + 42 Global Regions</p>
                <p className="mt-1 text-[11px] text-slate-400">Carrier API: FedEx & DHL Sync</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-900 p-4 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-2">
                  <Store className="size-3.5 text-blue-400" /> Storefront Health Score
                </span>
                <span className="font-bold text-emerald-400">100% Ready</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full w-full" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-400 pt-1">
                <div>✓ Verified Payout Bank</div>
                <div>✓ Policy Pages Live</div>
                <div>✓ Catalog Indexed</div>
              </div>
            </div>
          </div>
        )}

        {activeStep === "catalog-variants" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white">Matrix Variant Inventory</h4>
                <p className="text-[11px] text-slate-400">Automated stock warnings & Cloudinary media</p>
              </div>
              <button
                type="button"
                className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] px-2.5 py-1 transition"
              >
                + Add Variant
              </button>
            </div>

            {/* Inventory Items Table */}
            <div className="rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden text-xs">
              <div className="grid grid-cols-4 bg-white/[0.04] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span className="col-span-2">Product & SKU</span>
                <span>Stock Level</span>
                <span className="text-right">Price</span>
              </div>
              <div className="divide-y divide-white/5">
                <div className="grid grid-cols-4 px-3 py-2.5 items-center">
                  <div className="col-span-2 flex items-center gap-2">
                    <img
                      src="/hero-products/headphones.jpg"
                      alt=""
                      className="size-8 rounded object-cover bg-slate-800"
                    />
                    <div>
                      <p className="font-bold text-white text-[11px]">Aura ANC (Obsidian)</p>
                      <p className="text-[9px] font-mono text-slate-400">SKU: AUR-ANC-01</p>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-bold text-[11px]">42 in stock</span>
                  <span className="text-right font-bold text-white">$189.00</span>
                </div>

                <div className="grid grid-cols-4 px-3 py-2.5 items-center">
                  <div className="col-span-2 flex items-center gap-2">
                    <img
                      src="/hero-products/camera.jpg"
                      alt=""
                      className="size-8 rounded object-cover bg-slate-800"
                    />
                    <div>
                      <p className="font-bold text-white text-[11px]">Leather Strap (Tan)</p>
                      <p className="text-[9px] font-mono text-slate-400">SKU: STP-LTH-04</p>
                    </div>
                  </div>
                  <span className="text-amber-400 font-bold text-[11px]">3 left (Low)</span>
                  <span className="text-right font-bold text-white">$45.00</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 flex items-center justify-between text-xs text-blue-200">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-blue-400" />
                <span>Auto-hiding out-of-stock items enabled</span>
              </div>
              <span className="text-[10px] font-bold text-blue-300">BullMQ Sync ✓</span>
            </div>
          </div>
        )}

        {activeStep === "order-fulfillment" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white">Order Dispatch Queue</h4>
                <p className="text-[11px] text-slate-400">Batch labels and tracking notifications</p>
              </div>
              <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-400">
                3 Pending Dispatch
              </span>
            </div>

            <div className="rounded-xl bg-white/[0.04] p-3 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-white">Order #NX-48918</span>
                  <p className="text-[10px] text-slate-400">Customer: Michael K. • Express 2-Day</p>
                </div>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  Paid $254.00
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/10">
                <button
                  type="button"
                  className="rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 text-[11px] font-bold transition flex items-center gap-1.5"
                >
                  <Package className="size-3" />
                  <span>Generate FedEx Label</span>
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 text-[11px] font-semibold transition border border-white/10"
                >
                  Print Packing Slip
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-slate-900 p-3 border border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-400">Customer automated dispatch email:</span>
              <span className="text-emerald-400 font-bold">Ready on scan</span>
            </div>
          </div>
        )}

        {activeStep === "automated-payouts" && (
          <div className="space-y-4 animate-fade-in">
            {/* Payout Hero Metrics */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-white/[0.05] p-3.5 border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Available Balance
                </span>
                <p className="mt-1 text-xl font-black text-emerald-400">$8,420.00</p>
                <p className="text-[10px] text-slate-400 mt-1">Transfers in 24h</p>
              </div>

              <div className="rounded-xl bg-white/[0.05] p-3.5 border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Pending Escrow
                </span>
                <p className="mt-1 text-xl font-black text-white">$1,840.50</p>
                <p className="text-[10px] text-slate-400 mt-1">In-transit orders</p>
              </div>

              <div className="rounded-xl bg-white/[0.05] p-3.5 border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Platform Fees
                </span>
                <p className="mt-1 text-xl font-black text-blue-400">Transparent</p>
                <p className="text-[10px] text-slate-400 mt-1">Zero hidden cut</p>
              </div>
            </div>

            {/* Payout Bank Target */}
            <div className="rounded-xl bg-white/[0.04] p-3.5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  <CreditCard className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Stripe Express Direct Transfer</p>
                  <p className="text-[10px] text-slate-400">Chase Business Checking ••••• 8821</p>
                </div>
              </div>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                Auto-Deposit Active
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Mockup Status Footer */}
      <div className="flex items-center justify-between border-t border-white/10 bg-slate-900/60 px-4 py-2.5 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-blue-400 animate-pulse" />
          Interactive Merchant OS Preview
        </span>
        <span className="text-[10px] text-slate-500 font-mono">Stage: {activeStep}</span>
      </div>
    </div>
  );
}

/**
 * Engine / Infrastructure Interactive Mockup
 */
function EngineMockup({ activeStep }: { activeStep: string }) {
  return (
    <div className="relative flex flex-col rounded-2xl border border-slate-200/90 bg-slate-950 text-white shadow-2xl shadow-slate-950/20 overflow-hidden font-mono">
      {/* Terminal Bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/90 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-rose-500" />
            <div className="size-2.5 rounded-full bg-amber-500" />
            <div className="size-2.5 rounded-full bg-emerald-500" />
          </div>
          <span className="ml-2 text-[11px] text-slate-400">engine.telemetry.nexions.internal</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-emerald-400">
          <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
          ACTIVE_PHASE: {activeStep.toUpperCase()}
        </div>
      </div>

      <div className="p-4 sm:p-6 bg-slate-950 min-h-[420px] text-xs space-y-4">
        {/* Node architecture pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
          <div className="rounded-lg bg-white/[0.04] p-2 border border-white/10 text-center">
            <span className="text-slate-400 block">Gateway</span>
            <span className="font-bold text-emerald-400">Fastify • 18ms</span>
          </div>
          <div className="rounded-lg bg-white/[0.04] p-2 border border-white/10 text-center">
            <span className="text-slate-400 block">Database</span>
            <span className="font-bold text-sky-400">PostgreSQL ACID</span>
          </div>
          <div className="rounded-lg bg-white/[0.04] p-2 border border-white/10 text-center">
            <span className="text-slate-400 block">Job Queue</span>
            <span className="font-bold text-amber-400">Redis BullMQ</span>
          </div>
          <div className="rounded-lg bg-white/[0.04] p-2 border border-white/10 text-center">
            <span className="text-slate-400 block">Payment</span>
            <span className="font-bold text-purple-400">Stripe Connect</span>
          </div>
        </div>

        {/* Live log feed */}
        <div className="rounded-xl bg-slate-900/90 p-4 border border-white/10 space-y-2 text-[11px] font-mono leading-relaxed overflow-x-auto">
          <div className="text-emerald-400 flex items-center gap-2">
            <span>[21:43:02.102]</span>
            <span className="text-white font-bold">INFO:</span>
            <span>POST /api/v1/checkout/session — 200 OK (21ms)</span>
          </div>
          <div className="text-sky-300 flex items-center gap-2">
            <span>[21:43:02.148]</span>
            <span className="text-white font-bold">EVENT:</span>
            <span>stripe_webhook: payment_intent.succeeded (escrow_id=esc_99184)</span>
          </div>
          <div className="text-amber-300 flex items-center gap-2">
            <span>[21:43:02.190]</span>
            <span className="text-white font-bold">WORKER:</span>
            <span>BullMQ: dispatched email receipt & order dispatch ticket (job_id=4821)</span>
          </div>
          <div className="text-purple-300 flex items-center gap-2">
            <span>[21:43:02.210]</span>
            <span className="text-white font-bold">DB:</span>
            <span>PostgreSQL tenant isolated commit: orders & order_items (lock_time=1.8ms)</span>
          </div>
          <div className="text-emerald-300 flex items-center gap-2">
            <span>[21:43:02.260]</span>
            <span className="text-white font-bold">NOTIFY:</span>
            <span>ShopOwner websocket: New order audio-studio received</span>
          </div>
        </div>

        {/* Latency and Uptime Stats */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="rounded-lg bg-white/[0.03] p-3 border border-white/10">
            <span className="text-[10px] text-slate-400 block">Global Uptime</span>
            <span className="text-lg font-bold text-white">99.98%</span>
          </div>
          <div className="rounded-lg bg-white/[0.03] p-3 border border-white/10">
            <span className="text-[10px] text-slate-400 block">Queue Lag</span>
            <span className="text-lg font-bold text-emerald-400">0.02s</span>
          </div>
          <div className="rounded-lg bg-white/[0.03] p-3 border border-white/10">
            <span className="text-[10px] text-slate-400 block">Active Tenants</span>
            <span className="text-lg font-bold text-sky-400">Multi-Isolated</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 bg-slate-900/60 px-4 py-2.5 text-[10px] text-slate-400">
        <span>Zero Cross-Tenant Leakage • Encrypted at Rest</span>
        <span className="text-emerald-400">TLS 1.3 / mTLS</span>
      </div>
    </div>
  );
}

/**
 * Trust & Safeguards Mockup
 */
function SafeguardsMockup({ activeStep }: { activeStep: string }) {
  return (
    <div className="relative flex flex-col rounded-2xl border border-slate-200/90 bg-slate-950 text-white shadow-2xl shadow-slate-950/20 overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/90 px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-emerald-400" />
          <span className="text-xs font-bold text-white">Nexions Trust & Settlement Engine</span>
        </div>
        <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
          Escrow: {activeStep}
        </span>
      </div>

      <div className="p-4 sm:p-6 bg-gradient-to-b from-slate-900/50 to-slate-950 min-h-[420px] space-y-4">
        {/* Shield Guarantee Card */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-900 to-purple-500/10 p-5 border border-emerald-500/20 space-y-3">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-white">Nexions Buyer & Merchant Shield</h4>
              <p className="text-xs text-slate-300">End-to-End Escrow & Cryptographic Purchase Receipts</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Funds deposited by buyers are securely held in Stripe escrow until carrier delivery tracking confirms
            safe transit. If goods do not arrive as described, the buyer receives an automated full refund.
          </p>
        </div>

        {/* 3 Pillars */}
        <div className="grid gap-3 sm:grid-cols-3 text-xs">
          <div className="rounded-xl bg-white/[0.04] p-3 border border-white/10 space-y-1">
            <div className="text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" /> Zero Markup
            </div>
            <p className="text-[11px] text-slate-400">No sneaky 5% service fees tacked on at checkout.</p>
          </div>
          <div className="rounded-xl bg-white/[0.04] p-3 border border-white/10 space-y-1">
            <div className="text-sky-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" /> Verified Reviews
            </div>
            <p className="text-[11px] text-slate-400">Only verified buyers with valid order IDs can post reviews.</p>
          </div>
          <div className="rounded-xl bg-white/[0.04] p-3 border border-white/10 space-y-1">
            <div className="text-purple-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" /> Stripe KYC
            </div>
            <p className="text-[11px] text-slate-400">Every merchant passes government identity checks.</p>
          </div>
        </div>

        {/* Dispute Resolution SLA */}
        <div className="rounded-xl bg-slate-900 p-3.5 border border-white/10 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-white">Dispute Response Resolution Time</span>
            <p className="text-[11px] text-slate-400">Dedicated platform concierge review</p>
          </div>
          <span className="text-emerald-400 font-black text-sm">Under 24 Hours</span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 bg-slate-900/60 px-4 py-2.5 text-[11px] text-slate-400">
        <span>Compliant with Global Consumer Protection Laws</span>
        <span className="text-emerald-400">100% Protected</span>
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ──────────────────────────────────────────────────── */

export default function HowItWorksSection() {
  const [activeTrackId, setActiveTrackId] = useState<TrackId>("shoppers");
  const currentTrack = TRACKS.find((t) => t.id === activeTrackId) || TRACKS[0];

  const [activeStepId, setActiveStepId] = useState<string>(currentTrack.steps[0].id);

  // When track changes, default to its first step
  const handleTrackChange = (trackId: TrackId) => {
    setActiveTrackId(trackId);
    const track = TRACKS.find((t) => t.id === trackId) || TRACKS[0];
    setActiveStepId(track.steps[0].id);
  };

  const activeStep = currentTrack.steps.find((s) => s.id === activeStepId) || currentTrack.steps[0];
  const TrackIcon = currentTrack.icon;

  return (
    <section className="relative overflow-hidden border-y border-slate-200/90 bg-gradient-to-b from-white via-slate-50 to-white py-20 lg:py-28 text-slate-900 font-sans">
      {/* Background Subtle Ambience Glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-orange-100/40 via-amber-50/20 to-transparent blur-3xl -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal direction="up">
          <div className="mx-auto max-w-3xl text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-orange-50/80 px-3.5 py-1.5 text-xs font-bold text-orange-600 shadow-sm backdrop-blur">
              <Sparkles className="size-3.5 text-orange-500" />
              <span>Interactive Platform Tour</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              One Architecture. Every Phase of Modern Commerce.
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Explore how Nexions connects shoppers, high-growth independent merchants, and high-velocity
              financial infrastructure in a unified experience.
            </p>
          </div>
        </ScrollReveal>

        {/* Segmented Persona Track Selector */}
        <ScrollReveal delayMs={100} direction="up">
          <div className="mt-12 flex justify-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
              {TRACKS.map((track) => {
                const Icon = track.icon;
                const isSelected = track.id === activeTrackId;
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => handleTrackChange(track.id)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-slate-950 text-white shadow-md shadow-slate-950/20"
                        : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80"
                    }`}
                  >
                    <Icon className={`size-4 ${isSelected ? "text-orange-400" : "text-slate-400"}`} />
                    <span>{track.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </ScrollReveal>

        {/* Main Interactive Stage Grid */}
        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:items-start">
          {/* Left Column (5 cols): Interactive Step Cards */}
          <div className="lg:col-span-5 space-y-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Workflow Milestones (Click to Preview)
              </span>
              <span className="text-xs font-semibold text-orange-600">
                {currentTrack.steps.findIndex((s) => s.id === activeStepId) + 1} of {currentTrack.steps.length}
              </span>
            </div>

            {currentTrack.steps.map((step) => {
              const isCurrent = step.id === activeStepId;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStepId(step.id)}
                  className={`group relative flex w-full flex-col rounded-2xl p-4.5 text-left transition-all border cursor-pointer ${
                    isCurrent
                      ? "border-orange-500/80 bg-white shadow-xl shadow-orange-500/5 ring-1 ring-orange-500/30"
                      : "border-slate-200/80 bg-white/70 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`flex size-6 items-center justify-center rounded-lg text-[11px] font-black transition-colors ${
                          isCurrent
                            ? "bg-orange-500 text-white"
                            : "bg-slate-100 text-slate-500 group-hover:bg-orange-100 group-hover:text-orange-600"
                        }`}
                      >
                        {step.stepNumber}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {step.badge}
                      </span>
                    </div>

                    <ChevronRight
                      className={`size-4 transition-transform duration-300 ${
                        isCurrent
                          ? "rotate-90 text-orange-500"
                          : "text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5"
                      }`}
                    />
                  </div>

                  <h3
                    className={`mt-2.5 text-base font-black tracking-tight ${
                      isCurrent ? "text-slate-950" : "text-slate-800"
                    }`}
                  >
                    {step.title}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {step.description}
                  </p>

                  {/* Highlight Metrics */}
                  <div className="mt-3.5 flex items-center gap-3 pt-3 border-t border-slate-100">
                    {step.metrics.map((m) => (
                      <div key={m.label} className="text-[11px]">
                        <span className="text-slate-400">{m.label}: </span>
                        <span className="font-bold text-slate-900">{m.value}</span>
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}

            {/* Quick Context Link */}
            <div className="pt-2 px-1">
              <Link
                to={activeTrackId === "merchants" ? "/shops/new" : "/"}
                className="inline-flex items-center gap-2 text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline"
              >
                <span>
                  {activeTrackId === "merchants"
                    ? "Ready to build your store? Launch a storefront"
                    : "Ready to explore products? Browse verified marketplace"}
                </span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column (7 cols): High Fidelity SaaS Mockup Screen */}
          <div className="lg:col-span-7 sticky top-24">
            <ScrollReveal direction="scale">
              {activeTrackId === "shoppers" && <ShopperMockup activeStep={activeStep.id} />}
              {activeTrackId === "merchants" && <MerchantMockup activeStep={activeStep.id} />}
              {activeTrackId === "engine" && <EngineMockup activeStep={activeStep.id} />}
              {activeTrackId === "safeguards" && <SafeguardsMockup activeStep={activeStep.id} />}

              {/* Active Step Feature Breakdown Card */}
              <div className="mt-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <TrackIcon className="size-4 text-orange-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Feature Deep-Dive
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">{activeStep.title}</span>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {activeStep.keyFeatures.map((feat) => (
                    <div
                      key={feat}
                      className="flex items-start gap-2 rounded-xl bg-slate-50 p-2.5 text-xs font-medium text-slate-700 border border-slate-100"
                    >
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-500 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}