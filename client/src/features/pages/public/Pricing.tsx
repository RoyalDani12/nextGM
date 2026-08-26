import { useState } from "react";
import { Link } from "react-router-dom";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
// import { NavbarRoot } from "@/layouts/NavbarRoot";
import { MarketplaceNavbar } from "@/layouts/MarketplaceNavbar";
import Footer from "./Footer";

type BillingPeriod = "monthly" | "yearly";

interface PricingPlan {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  popular?: boolean;
  features: string[];
  cta: string;
  href: string;
}

const plans: PricingPlan[] = [
  {
    name: "Free",
    description: "Perfect for getting started with your first online shop.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "1 online shop",
      "Up to 25 products",
      "Basic storefront",
      "Order management",
      "Basic analytics",
    ],
    cta: "Start Free",
    href: "/register",
  },
  {
    name: "Growth",
    description: "Tools to scale your sales and reach more customers.",
    monthlyPrice: 29,
    yearlyPrice: 290,
    popular: true,
    features: [
      "Everything in Free",
      "Up to 500 products",
      "Custom shop URL",
      "Advanced analytics",
      "Promotions & discounts",
      "Priority support",
    ],
    cta: "Start Growing",
    href: "/register",
  },
  {
    name: "Scale",
    description: "Advanced controls for high-volume stores.",
    monthlyPrice: 79,
    yearlyPrice: 790,
    features: [
      "Everything in Growth",
      "Unlimited products",
      "Multiple shop managers",
      "Advanced inventory",
      "Priority marketplace boost",
      "Dedicated support",
    ],
    cta: "Choose Scale",
    href: "/register",
  },
];

const comparisonFeatures = [
  { name: "Online shop", free: true, growth: true, scale: true },
  { name: "Product limit", free: "25", growth: "500", scale: "Unlimited" },
  { name: "Order management", free: true, growth: true, scale: true },
  { name: "Advanced analytics", free: false, growth: true, scale: true },
  { name: "Custom shop URL", free: false, growth: true, scale: true },
  { name: "Discounts & promos", free: false, growth: true, scale: true },
  { name: "Multiple managers", free: false, growth: false, scale: true },
  { name: "Priority support", free: false, growth: true, scale: true },
];

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <MarketplaceNavbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-slate-950 py-16 text-white lg:py-24">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-20 -top-20 size-96 rounded-full bg-green-500/20 blur-3xl" />
            <div className="absolute -right-20 top-1/3 size-96 rounded-full bg-orange-500/20 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
          </div>

          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Grow your shop.{" "}
              <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-orange-400 bg-clip-text text-transparent">
                We manage the rest.
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-base text-slate-300 sm:text-lg">
              Choose the right plan to showcase, manage, and scale your business seamlessly on Nexions.
            </p>

            {/* BILLING TOGGLE */}
            <div className="mt-8 flex justify-center">
              <div className="inline-flex items-center rounded-full border border-slate-800 bg-slate-900/80 p-1 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => setBillingPeriod("monthly")}
                  className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
                    billingPeriod === "monthly"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingPeriod("yearly")}
                  className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold transition-all ${
                    billingPeriod === "yearly"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Yearly
                  <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[9px] font-black text-green-400">
                    SAVE
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING CARDS */}
        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => {
              const price = billingPeriod === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;

              return (
                <Card
                  key={plan.name}
                  className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-lg ${
                    plan.popular
                      ? "border-green-600 ring-2 ring-green-600"
                      : "border-slate-200"
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute right-6 top-6 bg-green-600 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white hover:bg-green-600">
                      Most Popular
                    </Badge>
                  )}

                  <CardHeader className="p-0">
                    <h2 className="text-xl font-black text-slate-900">{plan.name}</h2>
                    <p className="mt-1.5 min-h-[36px] text-xs leading-5 text-slate-500">
                      {plan.description}
                    </p>

                    <div className="mt-5 flex items-baseline gap-1">
                      <span className="text-4xl font-black tracking-tight text-slate-900">
                        ${price}
                      </span>
                      {price > 0 && (
                        <span className="text-xs font-medium text-slate-500">
                          /{billingPeriod === "monthly" ? "mo" : "yr"}
                        </span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="mt-6 flex flex-1 flex-col p-0">
                    {/* Render standard Link directly without asChild */}
                    <Link
                      to={plan.href}
                      className={`flex h-10 w-full items-center justify-center rounded-xl text-xs font-bold transition-colors ${
                        plan.popular
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-slate-950 text-white hover:bg-slate-800"
                      }`}
                    >
                      {plan.cta}
                    </Link>

                    <Separator className="my-5" />

                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-900">
                      What's Included
                    </p>

                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2.5 text-xs text-slate-600">
                          <span className="size-1.5 shrink-0 rounded-full bg-green-600" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* FEATURE COMPARISON */}
        <section className="border-t border-slate-200 bg-slate-50/60 py-12">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-8 text-center text-2xl font-black text-slate-900">
              Plan Features Comparison
            </h2>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="p-4 font-bold text-slate-700">Features</th>
                    <th className="p-4 text-center font-bold text-slate-900">Free</th>
                    <th className="bg-green-50/50 p-4 text-center font-black text-green-700">
                      Growth
                    </th>
                    <th className="p-4 text-center font-bold text-slate-900">Scale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparisonFeatures.map((row) => (
                    <tr key={row.name}>
                      <td className="p-4 font-medium text-slate-700">{row.name}</td>
                      <td className="p-4 text-center">{renderTableValue(row.free)}</td>
                      <td className="bg-green-50/20 p-4 text-center">
                        {renderTableValue(row.growth)}
                      </td>
                      <td className="p-4 text-center">{renderTableValue(row.scale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* REDESIGNED CTA SECTION (NO ASCHILD, NO ICONS, BRAND COLORS) */}
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border-l-8 border-l-green-600 border-r-8 border-r-orange-500 bg-slate-900 p-8 shadow-2xl sm:p-12">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7">
                <span className="inline-block rounded-md bg-green-500/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-green-400">
                  Start Selling Online Today
                </span>
                <h3 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  Ready to launch your storefront?
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  Join hundreds of business owners. Set up your shop in minutes, showcase products, and connect directly with thousands of buyers across the platform.
                </p>
              </div>

              <div className="lg:col-span-5">
                <div className="rounded-2xl bg-slate-800/90 p-6 backdrop-blur-sm border border-slate-700/50">
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Instant Onboarding
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-white">
                    Zero setup fees. Free tier included.
                  </p>
                  
                  {/* Direct Link rendering using render pattern instead of asChild */}
                  <div className="mt-5">
                    <Link
                      to="/create-shop"
                      className="flex h-12 w-full items-center justify-center rounded-xl bg-orange-500 text-sm font-black text-white shadow-lg transition-all hover:bg-orange-600 hover:shadow-orange-500/20"
                    >
                      Create Your Shop Now
                    </Link>
                  </div>
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

function renderTableValue(val: boolean | string) {
  if (typeof val === "string") {
    return <span className="font-bold text-slate-900">{val}</span>;
  }
  return val ? (
    <span className="font-black text-green-600">Included</span>
  ) : (
    <span className="font-bold text-slate-300">—</span>
  );
}