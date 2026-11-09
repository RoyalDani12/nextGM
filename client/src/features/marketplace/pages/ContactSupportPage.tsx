import { useState, type FormEvent } from "react";
import {
  CheckCircle2, Clock3, Headphones, Mail, MessageSquare, Send,
  ShieldCheck, Loader2, LifeBuoy, ChevronRight,
  Tag, Package, CreditCard, Truck, RotateCcw, HelpCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "./Footer";
import { MarketplaceNavbar } from "../layouts/MarketplaceNavbar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";
import { useSubmitSupportTicket, useMyTickets } from "@/features/support/support.hooks";
import { toast } from "@/components/ui/toast";

const CATEGORIES = [
  { value: "ORDER_ISSUE", label: "Order Issue", icon: Package },
  { value: "PAYMENT_ISSUE", label: "Payment Issue", icon: CreditCard },
  { value: "SHIPPING_ISSUE", label: "Shipping Issue", icon: Truck },
  { value: "RETURN_ISSUE", label: "Return / Refund", icon: RotateCcw },
  { value: "ACCOUNT_ISSUE", label: "Account Issue", icon: ShieldCheck },
  { value: "PRODUCT_ISSUE", label: "Product Issue", icon: Tag },
  { value: "GENERAL", label: "General Question", icon: HelpCircle },
  { value: "OTHER", label: "Other", icon: MessageSquare },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Open", color: "bg-blue-50 text-blue-700 border-blue-200" },
  IN_PROGRESS: { label: "In Progress", color: "bg-amber-50 text-amber-700 border-amber-200" },
  WAITING_CUSTOMER: { label: "Awaiting Your Reply", color: "bg-orange-50 text-orange-700 border-orange-200" },
  RESOLVED: { label: "Resolved", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CLOSED: { label: "Closed", color: "bg-slate-100 text-slate-500 border-slate-200" },
};

export default function ContactSupportPage() {
  const user = useAuthStore((s) => s.user);
  const submitTicket = useSubmitSupportTicket();
  const { data: myTickets = [] } = useMyTickets();

  const [form, setForm] = useState({
    guestName: "",
    guestEmail: "",
    subject: "",
    category: "GENERAL",
    message: "",
    priority: "MEDIUM",
  });
  const [submittedTicket, setSubmittedTicket] = useState<{ ticketNumber: string; id: string } | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitTicket.mutate(
      {
        subject: form.subject,
        category: form.category,
        message: form.message,
        priority: form.priority,
        guestName: user ? undefined : form.guestName,
        guestEmail: user ? undefined : form.guestEmail,
      },
      {
        onSuccess: (res) => {
          setSubmittedTicket(res.data.data);
          toast.add({
            title: "Support ticket opened",
            description: `Ticket #${res.data.data.ticketNumber} created successfully.`,
            type: "success",
          });
          setForm({
            guestName: "",
            guestEmail: "",
            subject: "",
            category: "GENERAL",
            message: "",
            priority: "MEDIUM",
          });
        },
        onError: (err: any) => {
          toast.add({
            title: "Failed to submit ticket",
            description: err?.response?.data?.message || "Please check your inputs and try again.",
            type: "error",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <MarketplaceNavbar />
      <main>
        {/* Hero */}
        <section className="relative flex min-h-[28vh] items-center overflow-hidden bg-gradient-to-br from-orange-50 via-white to-slate-100 px-4 py-12 sm:px-6">
          <div className="absolute -right-20 -top-28 size-[22rem] rounded-full bg-orange-200/45 blur-3xl" />
          <div className="absolute -bottom-40 left-1/4 size-[24rem] rounded-full bg-slate-200/70 blur-3xl" />
          <div className="relative mx-auto w-full max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-600">Nexions Customer Care</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">We're here to help you.</h1>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Have a question about an order, return, or store? Open a ticket below and our dedicated support team will resolve it promptly.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Row */}
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-slate-100">
            {[
              { icon: Clock3, label: "Avg. First Response", value: "< 2 hours" },
              { icon: CheckCircle2, label: "Issue Resolution Rate", value: "98.4%" },
              { icon: Headphones, label: "Live Escalations", value: "24 / 7" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex flex-col items-center gap-1 py-5 text-center">
                <Icon className="size-4 text-orange-500" />
                <p className="text-xl font-black text-slate-900">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:flex lg:gap-14">
          {/* Main Content (Left) */}
          <div className="lg:flex-1">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-orange-50">
                  <LifeBuoy className="size-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Open a Support Ticket</h2>
                  <p className="text-xs text-slate-500">Provide details so our specialists can assist you immediately</p>
                </div>
              </div>

              {submittedTicket ? (
                <div className="space-y-5 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-7 text-center">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="size-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Request Sent & Confirmation Emailed!</h3>
                    <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
                      Your ticket reference is{" "}
                      <span className="font-mono font-black text-orange-600">#{submittedTicket.ticketNumber}</span>.
                      We have sent an instant receipt to your email inbox. Our specialists will review your issue and reply directly to your email.
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-xs font-semibold text-emerald-800 shadow-xs">
                      <span>📬 You can safely close this page — all replies will arrive in your email inbox!</span>
                    </div>
                  </div>
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSubmittedTicket(null)}
                      className="rounded-xl border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Submit Another Ticket
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Guest vs Authenticated */}
                  {!user ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Your Name <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          placeholder="e.g. John Doe"
                          value={form.guestName}
                          onChange={(e) => setForm((f) => ({ ...f, guestName: e.target.value }))}
                          required
                          className="rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Email Address <span className="text-rose-500">*</span>
                          <span className="text-[10px] lowercase text-slate-400 font-normal ml-1">(where our reply will be sent)</span>
                        </label>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          value={form.guestEmail}
                          onChange={(e) => setForm((f) => ({ ...f, guestEmail: e.target.value }))}
                          required
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5">
                      <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                      <p className="text-xs text-emerald-700 font-medium">
                        Submitting as <span className="font-bold">{user.name || user.email}</span>. Responses will be delivered directly to <span className="font-bold underline">{user.email}</span>.
                      </p>
                    </div>
                  )}

                  {/* Category Selector */}
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Issue Category <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {CATEGORIES.map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, category: value }))}
                          className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition ${
                            form.category === value
                              ? "border-orange-500 bg-orange-50 text-orange-700 shadow-xs"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <Icon className="size-4" />
                          <span className="text-[11px] font-bold leading-tight">{label}</span>
                        </button>
                      ))}
                    </div>
                    {form.category === "RETURN_ISSUE" && (
                      <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-orange-200 bg-orange-50/80 p-3 text-xs text-orange-900">
                        <RotateCcw className="size-4 text-orange-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Looking to request a return or refund for an order?</p>
                          <p className="text-orange-700 mt-0.5">
                            You can submit an official claim directly from your order page for immediate shop review.
                          </p>
                          <Link to="/customer-order" className="mt-1 inline-block font-extrabold text-orange-600 underline hover:text-orange-800">
                            Go to My Orders →
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Subject <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      placeholder="Brief overview of the question or issue"
                      value={form.subject}
                      onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                      required
                      minLength={3}
                      className="rounded-xl"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Detailed Message <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] font-mono text-slate-400">{form.message.length} / 5000</span>
                    </div>
                    <Textarea
                      placeholder="Please describe your issue in detail. If this is about a specific order, include your Order ID or tracking number."
                      value={form.message}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                      rows={5}
                      required
                      maxLength={5000}
                      className="rounded-xl resize-none"
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Urgency Level</label>
                    <div className="flex gap-2">
                      {(["LOW", "MEDIUM", "HIGH", "URGENT"] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, priority: p }))}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                            form.priority === p
                              ? p === "URGENT"
                                ? "border-rose-400 bg-rose-50 text-rose-700 shadow-xs"
                                : p === "HIGH"
                                ? "border-amber-400 bg-amber-50 text-amber-700 shadow-xs"
                                : p === "MEDIUM"
                                ? "border-orange-400 bg-orange-50 text-orange-700 shadow-xs"
                                : "border-slate-400 bg-slate-100 text-slate-700 shadow-xs"
                              : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          {p.charAt(0) + p.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                    {form.category === "RETURN_ISSUE" && (
                      <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-orange-200 bg-orange-50/80 p-3 text-xs text-orange-900">
                        <RotateCcw className="size-4 text-orange-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Looking to request a return or refund for an order?</p>
                          <p className="text-orange-700 mt-0.5">
                            You can submit an official claim directly from your order page for immediate shop review.
                          </p>
                          <Link to="/customer-order" className="mt-1 inline-block font-extrabold text-orange-600 underline hover:text-orange-800">
                            Go to My Orders →
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={submitTicket.isPending}
                    className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60 transition"
                  >
                    {submitTicket.isPending ? (
                      <><Loader2 className="mr-2 size-4 animate-spin" /> Submitting Ticket...</>
                    ) : (
                      <><Send className="mr-2 size-4" /> Submit Support Ticket</>
                    )}
                  </Button>
                </form>
              )}
            </div>

            {/* My Tickets Section (for Logged-in Users) */}
            {user && myTickets.length > 0 && (
              <div className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-base font-black text-slate-900">Your Support Tickets ({myTickets.length})</h2>
                  <span className="text-xs text-slate-400">Live ticket updates</span>
                </div>
                <div className="space-y-3">
                  {myTickets.map((ticket) => {
                    const statusCfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
                    const lastMsg = ticket.messages[ticket.messages.length - 1];
                    return (
                      <div
                        key={ticket.id}
                        className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-slate-200"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-black font-mono text-orange-600">{ticket.ticketNumber}</span>
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusCfg.color}`}>
                                {statusCfg.label}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(ticket.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            </div>
                            <p className="mt-1 text-sm font-bold text-slate-900 truncate">{ticket.subject}</p>
                            {lastMsg && (
                              <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                                {lastMsg.isStaff ? "Support Team: " : "You: "}
                                {lastMsg.body}
                              </p>
                            )}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-400 mt-1">
                            {ticket.messages.length} msg{ticket.messages.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar (Right) */}
          <div className="mt-10 lg:mt-0 lg:w-80 space-y-6">
            {/* Email-First Communication Banner */}
            <div className="rounded-3xl border border-orange-200 bg-orange-50/70 p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-2 text-orange-950">
                <Mail className="size-4 text-orange-600" />
                <h3 className="text-xs font-black uppercase tracking-wider">Direct Email Communication</h3>
              </div>
              <p className="text-xs text-orange-900/90 leading-relaxed">
                Just like Amazon and eBay, you don't have to wait on this page. All receipts, updates, and replies from our specialists will be sent directly to your email inbox.
              </p>
            </div>

            {/* Direct Channels */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-black text-slate-900">Alternative Support Channels</h3>
              <div className="space-y-3">
                <a
                  href="mailto:support@nexions.io"
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 hover:bg-orange-50 hover:border-orange-200 transition"
                >
                  <div className="flex size-8 items-center justify-center rounded-xl bg-orange-100">
                    <Mail className="size-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Direct Email</p>
                    <p className="text-[11px] text-slate-500">support@nexions.io</p>
                  </div>
                </a>
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-slate-100">
                    <MessageSquare className="size-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Live Support Chat</p>
                    <p className="text-[11px] text-slate-500">Monday – Friday: 9am – 8pm EST</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Expedited Resolution Tips */}
            <div className="rounded-3xl border border-orange-100 bg-orange-50/70 p-6">
              <h3 className="mb-3 text-sm font-black text-orange-950">Tips for Faster Resolution</h3>
              <ul className="space-y-2.5">
                {[
                  "Provide Order ID (e.g. #ORD-...) if related to a purchase",
                  "Explain the issue clearly and include steps taken",
                  "Specify your browser or device if experiencing UI bugs",
                  "Check spam/junk folder for confirmation emails",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2 text-xs text-orange-900">
                    <CheckCircle2 className="size-3.5 shrink-0 text-orange-500 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Help Center Shortcut */}
            <Link
              to="/help"
              className="flex items-center justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm hover:border-orange-200 hover:bg-orange-50 transition"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-slate-100">
                  <HelpCircle className="size-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Help Center & FAQ</p>
                  <p className="text-xs text-slate-500">Read self-service guides</p>
                </div>
              </div>
              <ChevronRight className="size-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
