import { useState, type FormEvent } from "react";
import { CheckCircle2, Clock3, Headphones, Mail, MessageSquare, Send, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "./Footer";
import { MarketplaceNavbar } from "../layouts/MarketplaceNavbar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function ContactSupportPage() {
  const [submitted, setSubmitted] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <MarketplaceNavbar />
    <main>
      <section className="relative flex min-h-[30vh] items-center overflow-hidden bg-gradient-to-br from-orange-50 via-white to-slate-100 px-4 py-12 text-slate-950 sm:px-6">
        <div className="absolute -right-20 -top-28 size-[22rem] rounded-full bg-orange-200/45 blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 size-[24rem] rounded-full bg-slate-200/70 blur-3xl" />
        <div className="relative mx-auto w-full max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-600">We are here to help</p>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] sm:text-6xl">Let&apos;s solve it together.</h1>
            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">Whether you have a question about an order, your store, or the NextG platform, our support team is ready to help.</p>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[.75fr_1.25fr] lg:py-20">
        <div className="space-y-4">
          {[
            [Headphones, "Customer support", "Questions about an order, return, or account? Start here."],
            [MessageSquare, "Store support", "Need help running your shop or managing a payout? We have you covered."],
            [Clock3, "Response times", "Most messages receive a reply within one business day."],
          ].map(([Icon, title, text]) => {
            const SupportIcon = Icon as typeof Headphones;
            return <div key={title as string} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><SupportIcon className="size-5" /></div><div><h2 className="font-black">{title as string}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{text as string}</p></div></div>
            </div>;
          })}
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
            <div className="flex items-center gap-2 text-sm font-black text-orange-900"><ShieldCheck className="size-4" /> Looking for quick answers?</div>
            <p className="mt-2 text-sm leading-6 text-orange-800">Browse the <Link to="/help" className="font-bold underline">Help Center</Link> for step-by-step guides.</p>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-9">
          {submitted ? <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="size-8" /></div>
            <h2 className="mt-6 text-2xl font-black">Message received.</h2>
            <p className="mt-3 max-w-sm leading-7 text-slate-600">Thanks for reaching out. Our team will get back to you within one business day.</p>
            <Button onClick={() => setSubmitted(false)} variant="outline" className="mt-7">Send another message</Button>
          </div> : <form onSubmit={submit} className="space-y-5">
            <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-500">Contact form</p><h2 className="mt-2 text-3xl font-black">How can we help?</h2></div>
            <div className="grid gap-5 sm:grid-cols-2"><label className="space-y-2 text-sm font-bold">Name<Input required placeholder="Your name" /></label><label className="space-y-2 text-sm font-bold">Email<Input required type="email" placeholder="you@example.com" /></label></div>
            <label className="block space-y-2 text-sm font-bold">Topic<select required defaultValue="" className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus:border-orange-400"><option value="" disabled>Choose a topic</option><option>Order & delivery</option><option>Returns & refunds</option><option>Account access</option><option>Shop owner support</option><option>Other</option></select></label>
            <label className="block space-y-2 text-sm font-bold">Message<Textarea required placeholder="Tell us what happened..." className="min-h-36 resize-y" /></label>
            <Button type="submit" className="h-11 w-full bg-orange-500 font-bold hover:bg-orange-600"><Send className="mr-2 size-4" /> Send message</Button>
            <p className="flex items-center justify-center gap-2 text-center text-xs text-slate-500"><Mail className="size-3.5" /> Prefer email? support@nextg.example</p>
          </form>}
        </div>
      </section>
    </main>
    <Footer />
  </div>;
}
