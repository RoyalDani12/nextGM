import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Download,
  Lock,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Truck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

/* ─── TYPES & DATA STRUCTURES ─────────────────────────────────────────── */
type TrackId = "shoppers" | "merchants" | "settlement" | "trust";

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
  subtitle: string;
  icon: LucideIcon;
  colorClass: string;
  steps: StepDetail[];
}

/* ─── REAL APP RECHARTS DATA ──────────────────────────────────────────── */
const mockRevenueTimeline = [
  { day: "Mon", revenue: 2840, orders: 18 },
  { day: "Tue", revenue: 4120, orders: 26 },
  { day: "Wed", revenue: 3890, orders: 22 },
  { day: "Thu", revenue: 5460, orders: 34 },
  { day: "Fri", revenue: 7120, orders: 48 },
  { day: "Sat", revenue: 8940, orders: 56 },
  { day: "Sun", revenue: 6420, orders: 41 },
];

/* ─── NEXTGM REAL FEATURE TRACKS ─────────────────────────────────────── */
const TRACKS: TrackConfig[] = [
  {
    id: "shoppers",
    label: "Shopper Experience",
    subtitle: "From faceted discovery to multi-store unified checkout",
    icon: ShoppingBag,
    colorClass: "orange",
    steps: [
      {
        id: "curated-discovery",
        stepNumber: "01",
        badge: "Smart Discovery",
        title: "Faceted Search & Verified Storefronts",
        tagline: "Discover unique physical & digital products from independent merchants.",
        description:
          "Browse multi-level category breadcrumbs, filter by 4★+ verified reviews, price range, and instant in-stock availability across independent boutique storefronts.",
        metrics: [
          { label: "Search Index", value: "Real-Time" },
          { label: "Store Vetting", value: "100% KYC" },
        ],
        keyFeatures: [
          "Category taxonomy with deep nested breadcrumbs",
          "Verified merchant badge & customer ratings",
          "Real-time stock indicators with low-stock warnings",
        ],
      },
      {
        id: "unified-checkout",
        stepNumber: "02",
        badge: "Unified Basket",
        title: "Multi-Store Cart in One Single Payment",
        tagline: "Bundle multiple independent stores into one seamless checkout.",
        description:
          "Add pieces from multiple independent stores into one cart. NextGM groups items by shop, applies active store coupons, and initiates a single Stripe PaymentIntent.",
        metrics: [
          { label: "Store Bundling", value: "Automatic" },
          { label: "Buyer Surcharge", value: "$0.00 (Zero)" },
        ],
        keyFeatures: [
          "Cart automatically groups items per independent shop",
          "Real-time coupon discount code engine",
          "Guest cart automatically syncs upon sign-in",
        ],
      },
      {
        id: "order-tracking",
        stepNumber: "03",
        badge: "Live Telemetry",
        title: "Live Milestones, Invoices & 14-Day Returns",
        tagline: "Track carrier milestones, download invoices, and request hassle-free returns.",
        description:
          "Follow your package from CONFIRMED to PROCESSING to SHIPPED and DELIVERED. Download official PDF invoices and submit return requests with evidence photos in 1 click.",
        metrics: [
          { label: "Return Window", value: "14 Days" },
          { label: "Invoice Format", value: "Instant PDF" },
        ],
        keyFeatures: [
          "Universal carrier tracking ID integration (FedEx, UPS, DHL)",
          "Order invoice modal with full tax and item breakdown",
          "Structured return reasons (DAMAGED, NOT_AS_DESCRIBED, etc.)",
        ],
      },
    ],
  },
  {
    id: "merchants",
    label: "Merchant Operating System",
    subtitle: "Onboarding, matrix variant inventory & rolling bank payouts",
    icon: Store,
    colorClass: "blue",
    steps: [
      {
        id: "publish-readiness",
        stepNumber: "01",
        badge: "Shop Readiness",
        title: "8-Step Store Readiness Checklist",
        tagline: "Launch your independent storefront in under 3 minutes.",
        description:
          "Complete NextGM's 8 publish readiness checks: profile, name, description, logo, contact info, business address, tax ID, and first product to transition from PENDING to ACTIVE.",
        metrics: [
          { label: "Readiness Checks", value: "8 Criteria" },
          { label: "Branded URL", value: "nexions.com/:shopSlug" },
        ],
        keyFeatures: [
          "Unique branded storefront slug and social metadata",
          "Automated shop approval verification pipeline",
          "Cloudinary CDN image uploads for banners and logos",
        ],
      },
      {
        id: "variant-catalog",
        stepNumber: "02",
        badge: "Inventory Matrix",
        title: "Matrix Variant Engine & Physical/Digital Goods",
        tagline: "Granular control over SKUs, sizes, colors, and stock levels.",
        description:
          "Manage physical goods with shipping dimensions, weight, and color/size variants, or digital products with secure download tokens. Low-stock alerts protect against overselling.",
        metrics: [
          { label: "Product Types", value: "Physical & Digital" },
          { label: "Auto-Hide Stock", value: "Automatic" },
        ],
        keyFeatures: [
          "SKU-level stock tracking with low-stock alerts",
          "Multi-image Cloudinary media gallery with drag reorder",
          "Active promotion coupons (percentage or fixed discounts)",
        ],
      },
      {
        id: "fulfillment-payouts",
        stepNumber: "03",
        badge: "Stripe Connect",
        title: "Order Dispatch & 48h Rolling Payouts",
        tagline: "Fulfill orders with tracking numbers and withdraw wallet funds.",
        description:
          "View orders in CONFIRMED (To Pack) status, generate packing slips, assign carrier tracking IDs, and withdraw your 90% wallet earnings directly to your bank account via Stripe Express.",
        metrics: [
          { label: "Merchant Split", value: "90% Net" },
          { label: "Payout Schedule", value: "Rolling 48 Hours" },
        ],
        keyFeatures: [
          "One-click status update: CONFIRMED → PROCESSING → SHIPPED",
          "Live shop wallet balance with automated bank transfers",
          "Return request review board with direct refund authorization",
        ],
      },
    ],
  },
  {
    id: "settlement",
    label: "Atomic Settlement & Engine",
    subtitle: "Stripe Connect, BullMQ queues & hermetic multi-tenancy",
    icon: Zap,
    colorClass: "amber",
    steps: [
      {
        id: "atomic-split",
        stepNumber: "01",
        badge: "Atomic Settlement",
        title: "90% Merchant / 10% Platform Split",
        tagline: "Zero buyer markups. Instant ledger settlement via Stripe webhooks.",
        description:
          "When a customer pays via single Stripe PaymentIntent, the atomic webhook handler immediately credits 90% of each store's items to its ShopWallet and 10% to the PlatformWallet.",
        metrics: [
          { label: "Settlement Speed", value: "< 250ms" },
          { label: "Ledger Accuracy", value: "ACID Guaranteed" },
        ],
        keyFeatures: [
          "Single customer checkout creates grouped per-shop orders",
          "Automated ledger credit and debit transactions recorded",
          "No hidden buyer service fees or inflated currency spreads",
        ],
      },
      {
        id: "async-queues",
        stepNumber: "02",
        badge: "Redis BullMQ",
        title: "Asynchronous Background Processing",
        tagline: "High-throughput event workers for emails, webhooks, and analytics.",
        description:
          "Transactional emails, PDF invoice generation, Stripe webhook verifications, and analytics rollups run asynchronously on Redis BullMQ workers with exponential retry backoff.",
        metrics: [
          { label: "Worker Queue", value: "Redis BullMQ" },
          { label: "API Response", value: "< 35ms" },
        ],
        keyFeatures: [
          "Instant customer order confirmation dispatch",
          "Real-time WebSocket alerts to merchant dashboards",
          "Automatic dead-letter queue monitoring",
        ],
      },
      {
        id: "multi-tenant-db",
        stepNumber: "03",
        badge: "PostgreSQL",
        title: "Hermetic Multi-Tenant Data Isolation",
        tagline: "Relational database schema protecting every store's data.",
        description:
          "PostgreSQL architecture enforces strict tenant isolation. Customer databases, store inventories, payout accounts, and sales analytics never bleed across store boundaries.",
        metrics: [
          { label: "Data Isolation", value: "Tenant Boundary" },
          { label: "Security", value: "Role-Based Access" },
        ],
        keyFeatures: [
          "Row-level security and tenant-scoped query execution",
          "Optimized catalog indexes for high-speed faceted searches",
          "PCI-DSS compliant tokenization through Stripe Elements",
        ],
      },
    ],
  },
  {
    id: "trust",
    label: "Trust, Reviews & Returns",
    subtitle: "Verified buyer authentication, escrow safety & fraud defense",
    icon: ShieldCheck,
    colorClass: "emerald",
    steps: [
      {
        id: "verified-reviews-system",
        stepNumber: "01",
        badge: "Review Authenticity",
        title: "100% Verified Buyer Reviews Only",
        tagline: "Eliminating bot farms: reviews require completed, delivered orders.",
        description:
          "Only authenticated customers who purchased and received the product can leave star ratings and reviews. Verified Buyer badges give shoppers complete confidence.",
        metrics: [
          { label: "Fake Review Rate", value: "0.00%" },
          { label: "Seller Response", value: "Public Replies" },
        ],
        keyFeatures: [
          "Delivered order ID validation before review submission",
          "Verified buyer visual checkmark on product pages",
          "Merchant response capability for customer feedback",
        ],
      },
      {
        id: "returns-management",
        stepNumber: "02",
        badge: "Hassle-Free Returns",
        title: "Structured 14-Day Return & Refund Pipeline",
        tagline: "Fair dispute management with evidence photos and direct refunds.",
        description:
          "Customers can request returns with specific categorized reasons and photos. Merchants review and approve refunds directly from their dashboard with full ledger tracking.",
        metrics: [
          { label: "Standard Window", value: "14 Days" },
          { label: "Evidence Upload", value: "Cloudinary" },
        ],
        keyFeatures: [
          "Standardized return reasons (DAMAGED, WRONG_ITEM, etc.)",
          "Direct merchant-customer resolution workflow",
          "Automated wallet adjustment upon approved refund",
        ],
      },
      {
        id: "superadmin-governance",
        stepNumber: "03",
        badge: "Platform Governance",
        title: "SuperAdmin Oversight & Store Vetting",
        tagline: "Proactive shop moderation and transactional security.",
        description:
          "SuperAdmins review newly registered shops, monitor platform-wide GMV analytics, audit coupon usage, manage categories, and step in for dispute mediation when required.",
        metrics: [
          { label: "KYC Verification", value: "Stripe Connect" },
          { label: "Platform Uptime", value: "99.98%" },
        ],
        keyFeatures: [
          "SuperAdmin shop approval & suspension governance",
          "Platform-wide order, shipment, and payout audits",
          "Centralized category and coupon lifecycle management",
        ],
      },
    ],
  },
];

/* ─── REAL APP VISUAL MOCKUPS (LIGHT MODE, PRE-DEFINED NEXTGM COLORS) ─── */

/**
 * Shopper Experience Mockup
 */
function ShopperAppMockup({ activeStep }: { activeStep: string }) {
  const [selectedColor, setSelectedColor] = useState<"slate" | "white" | "amber">("slate");
  const [cartCount, setCartCount] = useState(2);
  const [couponApplied, setCouponApplied] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    setIsAdding(true);
    setTimeout(() => {
      setCartCount((c) => c + 1);
      setIsAdding(false);
    }, 400);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 overflow-hidden">
      {/* Light Chrome Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-slate-300" />
            <div className="size-2.5 rounded-full bg-slate-300" />
            <div className="size-2.5 rounded-full bg-slate-300" />
          </div>
          <div className="ml-3 hidden sm:flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 border border-slate-200">
            <Lock className="size-3 text-emerald-600" />
            <span>nexions.marketplace/discover/audio-studio</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200 px-3 py-1 text-xs font-bold text-orange-600">
            <ShoppingBag className="size-3.5" />
            <span>Cart ({cartCount})</span>
          </div>
          <div className="size-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-black shadow-sm">
            JD
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 sm:p-6 bg-white min-h-[460px]">
        {activeStep === "curated-discovery" && (
          <div className="space-y-4 animate-fade-in">
            {/* Store Breadcrumb & Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-orange-50/50 p-3.5 border border-orange-100">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-sm shadow-sm">
                  AS
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 text-sm">Aura Soundworks</span>
                    <BadgeCheck className="size-4 text-orange-500 fill-orange-500/20" />
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      Verified Store
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Acoustic Audio Boutique • Portland, OR</p>
                </div>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200 shadow-2xs">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                <span>4.96 (428 reviews)</span>
              </div>
            </div>

            {/* Product Card with Real Image */}
            <div className="grid gap-5 sm:grid-cols-[1.1fr_.9fr] items-center rounded-2xl border border-slate-200/80 p-4 bg-slate-50/40">
              <div className="relative group overflow-hidden rounded-xl bg-white border border-slate-200/70 aspect-[4/3]">
                <img
                  src="/hero-products/headphones.jpg"
                  alt="Aura Spatial ANC Wireless Headphones"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-2.5 left-2.5 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold text-orange-600 border border-orange-200 shadow-xs">
                  Staff Pick
                </span>
                <span className="absolute bottom-2.5 right-2.5 rounded-md bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-bold shadow-xs">
                  In Stock (8 left)
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
                    Studio Reference Series
                  </span>
                  <h4 className="mt-1 text-base sm:text-lg font-black text-slate-900 leading-tight">
                    Aura Spatial ANC Wireless Headphones
                  </h4>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">$189.00</span>
                    <span className="text-xs text-slate-400 line-through">$249.00</span>
                    <span className="rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[10px] font-bold">
                      SAVE 24%
                    </span>
                  </div>
                </div>

                {/* Variant Color Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Finish:{" "}
                    <span className="text-slate-900 font-bold">
                      {selectedColor === "slate"
                        ? "Matte Obsidian"
                        : selectedColor === "white"
                        ? "Arctic Frost"
                        : "Warm Amber"}
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedColor("slate")}
                      className={`size-6 rounded-full bg-slate-800 border-2 transition-all ${
                        selectedColor === "slate"
                          ? "border-orange-500 scale-110 shadow-sm"
                          : "border-slate-300"
                      }`}
                      title="Matte Obsidian"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedColor("white")}
                      className={`size-6 rounded-full bg-white border-2 transition-all ${
                        selectedColor === "white"
                          ? "border-orange-500 scale-110 shadow-sm"
                          : "border-slate-300"
                      }`}
                      title="Arctic Frost"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedColor("amber")}
                      className={`size-6 rounded-full bg-amber-600 border-2 transition-all ${
                        selectedColor === "amber"
                          ? "border-orange-500 scale-110 shadow-sm"
                          : "border-slate-300"
                      }`}
                      title="Warm Amber"
                    />
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={isAdding}
                  className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer"
                >
                  {isAdding ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin" />
                      <span>Syncing with Cart...</span>
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

        {activeStep === "unified-checkout" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Unified Multi-Store Basket</h4>
                <p className="text-xs text-slate-500">2 independent shops bundled into 1 single checkout</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                1 PaymentIntent • 0% Buyer Fee
              </span>
            </div>

            {/* Shop 1 Parcel */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-orange-600 flex items-center gap-1.5">
                  <Store className="size-3.5" /> Aura Soundworks (Oregon)
                </span>
                <span className="text-slate-500 text-[11px]">Sub-order #NX-99482-A</span>
              </div>
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3">
                  <img
                    src="/hero-products/headphones.jpg"
                    alt=""
                    className="size-12 rounded-lg object-cover border border-slate-200"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Aura Spatial ANC Wireless</p>
                    <p className="text-[11px] text-slate-500">Qty: 1 • Matte Obsidian</p>
                  </div>
                </div>
                <span className="text-sm font-black text-slate-900">$189.00</span>
              </div>
            </div>

            {/* Shop 2 Parcel */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-600 flex items-center gap-1.5">
                  <Store className="size-3.5" /> Peak Minimalist Goods (Tokyo)
                </span>
                <span className="text-slate-500 text-[11px]">Sub-order #NX-99482-B</span>
              </div>
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3">
                  <img
                    src="/hero-products/camera.jpg"
                    alt=""
                    className="size-12 rounded-lg object-cover border border-slate-200"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Classic Rangefinder Case & Strap</p>
                    <p className="text-[11px] text-slate-500">Qty: 1 • Olive Tan</p>
                  </div>
                </div>
                <span className="text-sm font-black text-slate-900">$65.00</span>
              </div>
            </div>

            {/* Interactive Coupon & Order Summary */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Subtotal (2 items)</span>
                <span className="font-bold text-slate-900">$254.00</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Active Coupon</span>
                  <button
                    type="button"
                    onClick={() => setCouponApplied(!couponApplied)}
                    className="rounded bg-orange-100 hover:bg-orange-200 text-orange-800 px-2 py-0.5 text-[10px] font-bold transition"
                  >
                    {couponApplied ? "SAVE20 Applied ✓" : "Apply SAVE20"}
                  </button>
                </div>
                <span className={couponApplied ? "font-bold text-emerald-600" : "text-slate-400"}>
                  {couponApplied ? "-$50.80" : "$0.00"}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                <span className="font-bold text-slate-900">Total at Express Checkout</span>
                <span className="text-base font-black text-slate-900">
                  ${couponApplied ? "203.20" : "254.00"}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeStep === "order-tracking" && (
          <div className="space-y-4 animate-fade-in">
            {/* Order Header */}
            <div className="flex items-center justify-between rounded-xl bg-orange-50/70 p-3.5 border border-orange-200">
              <div className="flex items-center gap-2.5">
                <Truck className="size-5 text-orange-600" />
                <div>
                  <p className="text-xs font-bold text-slate-900">FedEx Ground Priority #NX-99482</p>
                  <p className="text-[11px] text-slate-500">Shipped from Portland, OR</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 text-xs font-bold">
                In Transit (On Schedule)
              </span>
            </div>

            {/* Stepper Timeline */}
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              <div className="relative">
                <div className="absolute -left-6 top-0.5 size-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  ✓
                </div>
                <p className="text-xs font-bold text-slate-900">Payment Authorized via Stripe</p>
                <p className="text-[11px] text-slate-500">Today, 09:14 AM • $203.20 single checkout</p>
              </div>

              <div className="relative">
                <div className="absolute -left-6 top-0.5 size-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  ✓
                </div>
                <p className="text-xs font-bold text-slate-900">Merchant Packed & Label Printed</p>
                <p className="text-[11px] text-slate-500">Aura Soundworks Warehouse • 11:30 AM</p>
              </div>

              <div className="relative">
                <div className="absolute -left-6 top-0.5 size-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold shadow-xs animate-pulse">
                  •
                </div>
                <p className="text-xs font-bold text-orange-600">Out for Local Delivery</p>
                <p className="text-[11px] text-slate-500">Courier van on route • Expected by 4:00 PM</p>
              </div>

              <div className="relative opacity-60">
                <div className="absolute -left-6 top-0.5 size-5 rounded-full bg-slate-200 border-2 border-slate-300" />
                <p className="text-xs font-medium text-slate-600">Delivered & Review Unlocked</p>
                <p className="text-[11px] text-slate-400">14-day warranty begins upon delivery scan</p>
              </div>
            </div>

            {/* Invoices & Return Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-3 py-1.5 font-bold transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="size-3.5 text-orange-500" />
                  <span>Download Invoice PDF</span>
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-3 py-1.5 font-bold transition flex items-center gap-1.5 shadow-2xs"
                >
                  <RotateCcw className="size-3.5 text-slate-500" />
                  <span>14-Day Return Request</span>
                </button>
              </div>
              <span className="text-[11px] font-bold text-emerald-700">Protected by Nexions Shield</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-500" />
          Interactive Shopper Live Preview
        </span>
        <span className="text-[11px] font-mono text-slate-400">Stage: {activeStep}</span>
      </div>
    </div>
  );
}

/**
 * Merchant OS Mockup with Real NextGM Dashboard Features & Recharts Chart
 */
function MerchantAppMockup({ activeStep }: { activeStep: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 overflow-hidden">
      {/* Light Chrome Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-slate-300" />
            <div className="size-2.5 rounded-full bg-slate-300" />
            <div className="size-2.5 rounded-full bg-slate-300" />
          </div>
          <div className="ml-3 hidden sm:flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 border border-slate-200">
            <Store className="size-3 text-orange-600" />
            <span>dashboard.nexions.io/shop/aura-soundworks</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
            ACTIVE & TRADING
          </span>
          <div className="size-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-sm">
            AS
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 bg-white min-h-[460px]">
        {activeStep === "publish-readiness" && (
          <div className="space-y-4 animate-fade-in">
            {/* Real Login / Dashboard Overview Image Banner */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-50 aspect-[16/7] flex items-center justify-center">
              <img
                src="/loginImage.png"
                alt="NextG Dashboard Illustration"
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent flex items-end p-4">
                <span className="rounded-lg bg-white/95 px-3 py-1 text-xs font-black text-slate-900 backdrop-blur shadow-sm">
                  Storefront Launchpad: aura-soundworks
                </span>
              </div>
            </div>

            {/* 8-Step Readiness Checklist */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <BadgeCheck className="size-4 text-emerald-600" /> 8/8 Publish Readiness Checks Completed
                </span>
                <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                  100% READY
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-emerald-500 h-full w-full" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Check className="size-3 text-emerald-600 font-bold" /> Profile setup
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="size-3 text-emerald-600 font-bold" /> Store logo
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="size-3 text-emerald-600 font-bold" /> Business address
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="size-3 text-emerald-600 font-bold" /> Tax ID / Legal
                </div>
              </div>
            </div>
          </div>
        )}

        {activeStep === "variant-catalog" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Matrix Variant Inventory</h4>
                <p className="text-xs text-slate-500">Live stock counts with automatic low-stock warnings</p>
              </div>
              <button
                type="button"
                className="rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-3 py-1.5 transition shadow-sm"
              >
                + Add New Variant
              </button>
            </div>

            {/* Matrix Variant Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
              <div className="grid grid-cols-4 bg-slate-50 px-3.5 py-2 font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                <span className="col-span-2">Product & SKU</span>
                <span>Stock Count</span>
                <span className="text-right">Price</span>
              </div>
              <div className="divide-y divide-slate-100 bg-white">
                <div className="grid grid-cols-4 px-3.5 py-2.5 items-center">
                  <div className="col-span-2 flex items-center gap-2.5">
                    <img
                      src="/hero-products/headphones.jpg"
                      alt=""
                      className="size-9 rounded-lg object-cover border border-slate-200"
                    />
                    <div>
                      <p className="font-bold text-slate-900">Aura ANC (Obsidian)</p>
                      <p className="text-[10px] text-slate-400 font-mono">SKU: AUR-ANC-01</p>
                    </div>
                  </div>
                  <span className="text-emerald-700 font-bold">42 in stock</span>
                  <span className="text-right font-black text-slate-900">$189.00</span>
                </div>

                <div className="grid grid-cols-4 px-3.5 py-2.5 items-center">
                  <div className="col-span-2 flex items-center gap-2.5">
                    <img
                      src="/hero-products/camera.jpg"
                      alt=""
                      className="size-9 rounded-lg object-cover border border-slate-200"
                    />
                    <div>
                      <p className="font-bold text-slate-900">Leather Strap (Tan)</p>
                      <p className="text-[10px] text-slate-400 font-mono">SKU: STP-LTH-04</p>
                    </div>
                  </div>
                  <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded w-fit">
                    3 left (Low)
                  </span>
                  <span className="text-right font-black text-slate-900">$45.00</span>
                </div>

                <div className="grid grid-cols-4 px-3.5 py-2.5 items-center">
                  <div className="col-span-2 flex items-center gap-2.5">
                    <img
                      src="/hero-products/smartwatch.jpg"
                      alt=""
                      className="size-9 rounded-lg object-cover border border-slate-200"
                    />
                    <div>
                      <p className="font-bold text-slate-900">Titanium Smart Band</p>
                      <p className="text-[10px] text-slate-400 font-mono">SKU: TIT-SMT-09</p>
                    </div>
                  </div>
                  <span className="text-emerald-700 font-bold">18 in stock</span>
                  <span className="text-right font-black text-slate-900">$129.00</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-orange-50/80 border border-orange-200 p-3 text-xs text-orange-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="size-4 text-orange-600" />
                Cloudinary CDN active: Automatic AVIF image optimization
              </span>
              <span className="font-bold text-orange-700">98/100 Score</span>
            </div>
          </div>
        )}

        {activeStep === "fulfillment-payouts" && (
          <div className="space-y-4 animate-fade-in">
            {/* Top 3 KPI Cards */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Available Balance
                </span>
                <p className="mt-1 text-xl font-black text-emerald-700">$8,420.00</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Stripe Express Ready</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Pending Escrow
                </span>
                <p className="mt-1 text-xl font-black text-slate-900">$1,840.50</p>
                <p className="text-[10px] text-slate-500 mt-0.5">In-transit orders</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Net Merchant Split
                </span>
                <p className="mt-1 text-xl font-black text-orange-600">90.0% Net</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Automated settlement</p>
              </div>
            </div>

            {/* Real Recharts Interactive Sales Curve */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900">7-Day Gross Revenue Trend</span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  +24.8% this week
                </span>
              </div>
              <div className="h-28 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockRevenueTimeline} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#F97316" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderRadius: "8px",
                        border: "1px solid #E2E8F0",
                        fontSize: "11px",
                      }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={2.5} fill="url(#revenueGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Connected Bank Info */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <CreditCard className="size-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Stripe Express Direct Deposit</p>
                  <p className="text-[11px] text-slate-500">Chase Business Checking ••••• 8821</p>
                </div>
              </div>
              <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                Auto-Deposit Active
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-blue-500" />
          Interactive Merchant OS Preview
        </span>
        <span className="text-[11px] font-mono text-slate-400">Stage: {activeStep}</span>
      </div>
    </div>
  );
}

/**
 * Settlement Engine & Architecture Mockup (Light theme)
 */
function SettlementEngineMockup({ activeStep }: { activeStep: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 overflow-hidden">
      {/* Light Chrome Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-slate-300" />
            <div className="size-2.5 rounded-full bg-slate-300" />
            <div className="size-2.5 rounded-full bg-slate-300" />
          </div>
          <span className="ml-3 text-xs font-mono text-slate-600">engine.settlement.nexions.internal</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
          <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
          ACTIVE_PHASE: {activeStep.toUpperCase()}
        </div>
      </div>

      <div className="p-4 sm:p-6 bg-white min-h-[460px] space-y-4">
        {/* Real OG Cover Image Preview */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-50 aspect-[16/7] flex items-center justify-center">
          <img
            src="/og-cover.png"
            alt="NextG Platform Architecture"
            className="size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent flex items-end p-4">
            <div>
              <p className="text-white text-xs font-black">Next-Gen Multi-Tenant Commerce Architecture</p>
              <p className="text-slate-300 text-[10px]">Stripe Connect • BullMQ Job Queues • PostgreSQL ACID</p>
            </div>
          </div>
        </div>

        {/* Real Atomic Settlement Diagram */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Zap className="size-4 text-orange-500" /> Single PaymentIntent Split (Webhook Execution)
            </span>
            <span className="font-mono text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
              21ms latency
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-white p-2.5 border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 block">Total Buyer Charge</span>
              <span className="font-black text-slate-900 text-sm">$254.00</span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">0% Hidden Fee</span>
            </div>

            <div className="rounded-lg bg-white p-2.5 border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 block">90% ShopWallet</span>
              <span className="font-black text-emerald-700 text-sm">$228.60</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Credited to Shop</span>
            </div>

            <div className="rounded-lg bg-white p-2.5 border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 block">10% PlatformWallet</span>
              <span className="font-black text-blue-600 text-sm">$25.40</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Platform Commission</span>
            </div>
          </div>
        </div>

        {/* Live Event Dispatch Stream */}
        <div className="rounded-xl bg-slate-900 text-white p-3.5 font-mono text-[11px] leading-relaxed space-y-1.5">
          <div className="text-emerald-400 flex items-center gap-2">
            <span>[21:43:01]</span>
            <span className="font-bold text-white">STRIPE:</span>
            <span>payment_intent.succeeded (checkout_id=chk_88294)</span>
          </div>
          <div className="text-amber-400 flex items-center gap-2">
            <span>[21:43:01]</span>
            <span className="font-bold text-white">ATOMIC_SETTLE:</span>
            <span>90% credited to aura-soundworks wallet, 10% platform</span>
          </div>
          <div className="text-sky-300 flex items-center gap-2">
            <span>[21:43:02]</span>
            <span className="font-bold text-white">BULLMQ:</span>
            <span>dispatched customer invoice PDF & merchant email notifications</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-500">
        <span>Hermetic Tenant Isolation • ACID Transactions</span>
        <span className="text-emerald-700 font-bold">100% Guaranteed</span>
      </div>
    </div>
  );
}

/**
 * Trust, Reviews & Returns Mockup (Light theme)
 */
function TrustAppMockup({ activeStep }: { activeStep: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 overflow-hidden">
      {/* Light Chrome Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-900">Nexions Trust & Governance Portal</span>
        </div>
        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
          Escrow: {activeStep}
        </span>
      </div>

      <div className="p-4 sm:p-6 bg-white min-h-[460px] space-y-4">
        {/* Verified Review Sample Card */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xs">
                MC
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 text-xs">Marcus Chen</span>
                  <span className="rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="size-3 text-emerald-600" /> Verified Buyer
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">Order #NX-48918 • Delivered 2 days ago</p>
              </div>
            </div>
            <div className="flex items-center text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            "These Spatial ANC headphones from Aura Soundworks exceeded every expectation. Build quality is
            incredible and delivery arrived a full day ahead of schedule with complete FedEx tracking."
          </p>
          <div className="rounded-lg bg-white p-2.5 border border-slate-200 text-[11px] text-slate-600">
            <strong className="text-orange-600">Store Response from Aura Soundworks:</strong> "Thank you
            Marcus! We appreciate your support for independent audio craft!"
          </div>
        </div>

        {/* 14-Day Return Guarantee Breakdown */}
        <div className="grid gap-3 sm:grid-cols-3 text-xs">
          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1 shadow-2xs">
            <div className="text-emerald-700 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" /> Zero Markup
            </div>
            <p className="text-[11px] text-slate-500">No sneaky 5% service fees tacked on at checkout.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1 shadow-2xs">
            <div className="text-blue-700 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" /> 14-Day Returns
            </div>
            <p className="text-[11px] text-slate-500">Structured return reasons with direct refund guarantee.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1 shadow-2xs">
            <div className="text-purple-700 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" /> Stripe KYC
            </div>
            <p className="text-[11px] text-slate-500">Every merchant passes government identity vetting.</p>
          </div>
        </div>

        {/* Resolution Time Notice */}
        <div className="rounded-xl bg-orange-50 border border-orange-200 p-3.5 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-900">Platform Dispute Resolution SLA</span>
            <p className="text-[11px] text-slate-500">Dedicated concierge review for buyer protection</p>
          </div>
          <span className="text-orange-600 font-black text-sm">Under 24 Hours</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-500">
        <span>Compliant with Global Consumer Protection Standards</span>
        <span className="text-emerald-700 font-bold">100% Protected</span>
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ──────────────────────────────────────────────────── */

export default function HowItWorksSection() {
  const [activeTrackId, setActiveTrackId] = useState<TrackId>("shoppers");
  const currentTrack = TRACKS.find((t) => t.id === activeTrackId) || TRACKS[0];

  const [activeStepId, setActiveStepId] = useState<string>(currentTrack.steps[0].id);

  const handleTrackChange = (trackId: TrackId) => {
    setActiveTrackId(trackId);
    const track = TRACKS.find((t) => t.id === trackId) || TRACKS[0];
    setActiveStepId(track.steps[0].id);
  };

  const activeStep = currentTrack.steps.find((s) => s.id === activeStepId) || currentTrack.steps[0];
  const TrackIcon = currentTrack.icon;

  return (
    <section className="relative overflow-hidden border-y border-slate-200/80 bg-slate-50/70 py-20 lg:py-28 text-slate-900 font-sans">
      {/* Background warm orange ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-orange-100/40 via-amber-50/20 to-transparent blur-3xl -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal direction="up">
          <div className="mx-auto max-w-3xl text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1.5 text-xs font-bold text-orange-600 shadow-2xs">
              <Sparkles className="size-3.5 text-orange-500" />
              <span>Interactive Architecture & Product Walkthrough</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              One Unified Marketplace. Every Part of Modern Commerce.
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Explore how NextGM brings multi-store shoppers, independent store owners, and atomic Stripe
              settlement together in one clean, friction-free platform.
            </p>
          </div>
        </ScrollReveal>

        {/* Light Segmented Persona Controller */}
        <ScrollReveal delayMs={100} direction="up">
          <div className="mt-10 flex justify-center">
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
                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                        : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/70"
                    }`}
                  >
                    <Icon className={`size-4 ${isSelected ? "text-white" : "text-slate-400"}`} />
                    <span>{track.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </ScrollReveal>

        {/* Main Stage Grid */}
        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:items-start">
          {/* Left Column (5 cols): Step Milestones */}
          <div className="lg:col-span-5 space-y-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Milestones (Click to View Live State)
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
                      ? "border-orange-500 bg-white shadow-lg shadow-orange-500/10 ring-1 ring-orange-500/20"
                      : "border-slate-200/80 bg-white/70 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`flex size-6 items-center justify-center rounded-lg text-xs font-black transition-colors ${
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

                  <div className="mt-3.5 flex items-center gap-4 pt-3 border-t border-slate-100">
                    {step.metrics.map((m) => (
                      <div key={m.label} className="text-xs">
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
                    ? "Ready to launch your shop? Register a storefront"
                    : "Ready to explore products? Browse verified marketplace"}
                </span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column (7 cols): High Fidelity Light SaaS Mockup */}
          <div className="lg:col-span-7 sticky top-24">
            <ScrollReveal direction="scale">
              {activeTrackId === "shoppers" && <ShopperAppMockup activeStep={activeStep.id} />}
              {activeTrackId === "merchants" && <MerchantAppMockup activeStep={activeStep.id} />}
              {activeTrackId === "settlement" && <SettlementEngineMockup activeStep={activeStep.id} />}
              {activeTrackId === "trust" && <TrustAppMockup activeStep={activeStep.id} />}

              {/* Feature Highlights Card */}
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <TrackIcon className="size-4 text-orange-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Technical Capabilities
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
                      <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 mt-0.5" />
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