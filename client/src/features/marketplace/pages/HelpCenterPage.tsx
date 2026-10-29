import { useMemo, useState } from "react";
import { ChevronDown, LifeBuoy, Search, ShoppingBag, Store, UserRound } from "lucide-react";
import Footer from "./Footer";
import { MarketplaceNavbar } from "../layouts/MarketplaceNavbar";
import { Link } from "react-router-dom";

const articles = [
  ["Shopping & orders", "How do I track my order?", "Open Your Orders from your account menu and select an order to see its latest status."],
  ["Shopping & orders", "How do returns work?", "Start with the seller’s return policy on the order details page. If you need help, contact our support team."],
  ["Account", "I cannot sign in", "Use the Forgot password link on the sign-in page. We will send a secure reset link to your email."],
  ["Selling on NextG", "How do I create a store?", "Choose Sell on NextG in the footer and follow the guided setup to create your store."],
  ["Selling on NextG", "When are payouts sent?", "Payout timing depends on your connected payment account and the settlement status of your orders."],
  ["Payments", "Is my payment secure?", "Payments are processed through Stripe. NextG does not store your full card details."],
];

export default function HelpCenterPage() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const filtered = useMemo(() => articles.filter(([category, question, answer]) => `${category} ${question} ${answer}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <MarketplaceNavbar />
    <main>
      <section className="relative flex min-h-[30vh] items-center overflow-hidden bg-gradient-to-br from-orange-50 via-white to-slate-100 px-4 py-12 text-slate-950 sm:px-6">
        <div className="absolute -left-24 -top-32 size-[24rem] rounded-full bg-orange-200/45 blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 size-[22rem] rounded-full bg-slate-200/70 blur-3xl" />
        <div className="relative mx-auto w-full max-w-4xl text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 shadow-sm"><LifeBuoy className="size-6" /></div>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] sm:text-6xl">How can we help?</h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">Search practical answers for shopping, orders, accounts, payments, and selling on NextG.</p>
          <div className="mx-auto mt-6 flex max-w-2xl items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"><Search className="ml-3 size-5 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the Help Center" className="h-11 min-w-0 flex-1 bg-transparent px-1 text-slate-900 outline-none placeholder:text-slate-500" /></div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="grid gap-4 md:grid-cols-3">
          {[[ShoppingBag, "Shopping & orders", "Track, manage, and understand your purchases."], [UserRound, "Account & payments", "Sign in, update details, and pay securely."], [Store, "Selling on NextG", "Build, manage, and grow your store."]].map(([Icon, title, text]) => {
            const HelpIcon = Icon as typeof ShoppingBag;
            return <div key={title as string} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><HelpIcon className="size-6 text-orange-500" /><h2 className="mt-4 font-black">{title as string}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{text as string}</p></div>;
          })}
        </div>
        <div className="mx-auto mt-14 max-w-4xl">
          <div className="mb-5 flex items-end justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-500">Popular answers</p><h2 className="mt-2 text-3xl font-black">Find your answer</h2></div><span className="text-sm text-slate-500">{filtered.length} articles</span></div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            {filtered.map(([category, question, answer]) => <div key={question} className="border-b border-slate-100 last:border-0"><button onClick={() => setOpen(open === question ? null : question)} className="flex w-full items-center justify-between gap-5 px-6 py-5 text-left transition hover:bg-slate-50"><span><span className="block text-xs font-bold uppercase tracking-wider text-orange-500">{category}</span><span className="mt-1 block font-bold text-slate-900">{question}</span></span><ChevronDown className={`size-5 shrink-0 text-slate-400 transition ${open === question ? "rotate-180" : ""}`} /></button>{open === question && <p className="px-6 pb-5 pr-14 text-sm leading-7 text-slate-600">{answer}</p>}</div>)}
            {filtered.length === 0 && <div className="p-12 text-center"><p className="font-bold">No articles found.</p><p className="mt-2 text-sm text-slate-500">Try another search or <Link to="/contact" className="font-bold text-orange-600">contact support</Link>.</p></div>}
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </div>;
}
