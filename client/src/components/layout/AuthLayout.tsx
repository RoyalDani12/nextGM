import type { ReactNode } from "react";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandMark } from "./BrandMark";

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  bullets?: string[];
}

export function AuthLayout({ eyebrow, title, description, children, footer, bullets = [] }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <BrandMark />
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition-colors hover:text-slate-950">
            <ArrowLeft className="size-3.5" /> Back to marketplace
          </Link>
        </div>
      </header>
      <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-stretch lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
          <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 size-96 rounded-full bg-sky-500/15 blur-3xl" />
          <div className="relative space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
              <ShieldCheck className="size-3.5" /> {eyebrow}
            </div>
            <h2 className="max-w-lg text-5xl font-black leading-[1.05] tracking-tight xl:text-6xl">
              Commerce infrastructure built for <span className="text-emerald-300">momentum.</span>
            </h2>
            <p className="max-w-md text-base leading-7 text-slate-400">
              One secure workspace for your storefront, orders, customers, and growth.
            </p>
          </div>
          {bullets.length > 0 && (
            <ul className="relative space-y-3 border-t border-white/10 pt-8 text-sm text-slate-300">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex items-center gap-3">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-300" /> {bullet}
                </li>
              ))}
            </ul>
          )}
        </aside>
        <section className="flex items-center justify-center px-4 py-12 sm:px-8 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-8 space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">{eyebrow}</p>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
              <p className="text-sm leading-6 text-slate-500">{description}</p>
            </div>
            {children}
            {footer && <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>}
          </div>
        </section>
      </main>
    </div>
  );
}
