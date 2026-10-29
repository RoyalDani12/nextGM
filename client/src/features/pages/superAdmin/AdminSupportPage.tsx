import { useState } from "react";
import {
  LifeBuoy, Search, Clock, CheckCircle2, XCircle,
  Loader2, Send, ChevronDown, RefreshCw, User,
  ArrowLeft,
} from "lucide-react";
import {
  useAdminTickets,
  useAdminTicket,
  useUpdateAdminTicket,
  useAdminReplyToTicket,
} from "@/features/support/support.hooks";
import { toast } from "@/components/ui/toast";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  OPEN: { label: "Open", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "bg-amber-50 text-amber-700 border-amber-200", icon: RefreshCw },
  WAITING_CUSTOMER: { label: "Awaiting Customer", color: "bg-orange-50 text-orange-700 border-orange-200", icon: Clock },
  RESOLVED: { label: "Resolved", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  CLOSED: { label: "Closed", color: "bg-slate-100 text-slate-500 border-slate-200", icon: XCircle },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  LOW: { label: "Low", color: "bg-slate-100 text-slate-500 border-slate-200" },
  MEDIUM: { label: "Medium", color: "bg-orange-50 text-orange-600 border-orange-200" },
  HIGH: { label: "High", color: "bg-amber-50 text-amber-600 border-amber-200" },
  URGENT: { label: "Urgent", color: "bg-rose-50 text-rose-600 border-rose-200" },
};

const CATEGORY_LABELS: Record<string, string> = {
  ORDER_ISSUE: "Order Issue",
  PAYMENT_ISSUE: "Payment Issue",
  SHIPPING_ISSUE: "Shipping Issue",
  RETURN_ISSUE: "Return / Refund",
  ACCOUNT_ISSUE: "Account Issue",
  PRODUCT_ISSUE: "Product Issue",
  GENERAL: "General Question",
  OTHER: "Other",
};

function TicketDetailPanel({ ticketId, onBack }: { ticketId: string; onBack: () => void }) {
  const { data: ticket, isLoading } = useAdminTicket(ticketId);
  const updateTicket = useUpdateAdminTicket(ticketId);
  const replyMutation = useAdminReplyToTicket(ticketId);
  const [reply, setReply] = useState("");

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-slate-400" />
      </div>
    );
  }
  if (!ticket) return null;

  const statusCfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
  const priorityCfg = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.MEDIUM;
  const customerName = ticket.user?.name || ticket.guestName || "Guest Customer";
  const customerEmail = ticket.user?.email || ticket.guestEmail || "—";

  const handleStatusChange = (status: string) => {
    updateTicket.mutate(
      { status },
      {
        onSuccess: () => toast.add({ title: "Status updated", type: "success" }),
        onError: () => toast.add({ title: "Failed to update status", type: "error" }),
      }
    );
  };

  const handlePriorityChange = (priority: string) => {
    updateTicket.mutate(
      { priority },
      {
        onSuccess: () => toast.add({ title: "Priority updated", type: "success" }),
        onError: () => toast.add({ title: "Failed to update priority", type: "error" }),
      }
    );
  };

  const handleSendReply = () => {
    if (!reply.trim()) return;
    replyMutation.mutate(reply.trim(), {
      onSuccess: () => {
        toast.add({ title: "Reply sent to customer", type: "success" });
        setReply("");
      },
      onError: (err: any) =>
        toast.add({
          title: "Failed to send reply",
          description: err?.response?.data?.message,
          type: "error",
        }),
    });
  };

  return (
    <div className="flex flex-col h-full space-y-5">
      {/* Back button and breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="size-3.5" /> All Tickets
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-xs font-mono font-bold text-orange-600">{ticket.ticketNumber}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Chat Thread (2 cols) */}
        <div className="lg:col-span-2 flex flex-col rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
          {/* Ticket Header Banner */}
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="font-black text-slate-900 text-base">{ticket.subject}</h2>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${priorityCfg.color}`}>
                {priorityCfg.label} Priority
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                {CATEGORY_LABELS[ticket.category] || ticket.category}
              </span>
            </div>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[500px]">
            {ticket.messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isStaff ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                    msg.isStaff
                      ? "bg-slate-900 text-white rounded-br-xs"
                      : "bg-slate-100 text-slate-900 rounded-bl-xs"
                  }`}
                >
                  <p className={`text-[11px] font-bold mb-1.5 ${msg.isStaff ? "text-orange-400" : "text-slate-500"}`}>
                    {msg.isStaff ? `🛡️ ${msg.senderName || "Support Team"}` : `👤 ${msg.senderName || "Customer"}`}
                  </p>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                  <p className={`text-[10px] mt-2.5 ${msg.isStaff ? "text-slate-400" : "text-slate-400"}`}>
                    {new Date(msg.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Admin Reply Input */}
          {ticket.status !== "CLOSED" ? (
            <div className="border-t border-slate-100 p-5 bg-slate-50/50">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your official response to the customer..."
                rows={3}
                className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-hidden resize-none transition"
              />
              <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-2">
                  {["RESOLVED", "CLOSED"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleStatusChange(s)}
                      disabled={updateTicket.isPending || ticket.status === s}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 ${
                        s === "RESOLVED"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Mark as {s.charAt(0) + s.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={replyMutation.isPending || !reply.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-5 py-2 text-xs font-bold text-white hover:bg-orange-600 disabled:opacity-60 transition shadow-xs"
                >
                  {replyMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Send className="size-3.5" />
                  )}
                  Send Reply
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-slate-100 p-4 bg-slate-50 text-center">
              <p className="text-xs text-slate-500">
                This ticket is marked as <strong>Closed</strong>. Reopen to send further replies.
              </p>
              <button
                type="button"
                onClick={() => handleStatusChange("IN_PROGRESS")}
                className="mt-2 text-xs font-bold text-orange-600 hover:underline"
              >
                Reopen Ticket
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Info & Controls (1 col) */}
        <div className="space-y-5">
          {/* Customer Metadata Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Customer Information</h3>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                <User className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{customerName}</p>
                <p className="text-xs text-slate-500 truncate">{customerEmail}</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Account Type</span>
              {ticket.user ? (
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" /> Registered
                </span>
              ) : (
                <span className="font-semibold text-slate-500">Guest User</span>
              )}
            </div>
          </div>

          {/* Ticket Metadata */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Ticket Information</h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Created At</span>
                <span className="font-semibold text-slate-700">
                  {new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Activity</span>
                <span className="font-semibold text-slate-700">
                  {new Date(ticket.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Message Count</span>
                <span className="font-semibold text-slate-700">{ticket.messages.length} messages</span>
              </div>
              {ticket.resolvedAt && (
                <div className="flex justify-between border-t border-slate-100 pt-2 text-emerald-600">
                  <span>Resolved On</span>
                  <span className="font-semibold">
                    {new Date(ticket.resolvedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status Changer */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Change Ticket Status</h3>
            <div className="space-y-1.5">
              {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusChange(status)}
                    disabled={ticket.status === status || updateTicket.isPending}
                    className={`w-full flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed ${
                      ticket.status === status
                        ? cfg.color + " shadow-xs font-bold"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    }`}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    {cfg.label}
                    {ticket.status === status && <span className="ml-auto text-[10px] font-bold">Active</span>}
                  </button>
                );
              })}
            </div>

            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mt-5 mb-2.5">Priority Level</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(PRIORITY_CONFIG).map(([priority, cfg]) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => handlePriorityChange(priority)}
                  disabled={ticket.priority === priority || updateTicket.isPending}
                  className={`flex items-center justify-center rounded-xl border px-2 py-1.5 text-xs font-bold transition disabled:cursor-not-allowed ${
                    ticket.priority === priority
                      ? cfg.color + " shadow-xs"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                  }`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminSupportPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useAdminTickets({
    status: statusFilter || undefined,
    search: search || undefined,
  });

  const tickets = data?.tickets || [];
  const counts = data?.counts || {};
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  if (selectedTicketId) {
    return <TicketDetailPanel ticketId={selectedTicketId} onBack={() => setSelectedTicketId(null)} />;
  }

  const statusTabs = [
    { key: "", label: "All Tickets", count: total },
    { key: "OPEN", label: "Open", count: counts.OPEN || 0 },
    { key: "IN_PROGRESS", label: "In Progress", count: counts.IN_PROGRESS || 0 },
    { key: "WAITING_CUSTOMER", label: "Awaiting Customer", count: counts.WAITING_CUSTOMER || 0 },
    { key: "RESOLVED", label: "Resolved", count: counts.RESOLVED || 0 },
    { key: "CLOSED", label: "Closed", count: counts.CLOSED || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
            <LifeBuoy className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Customer Support Desk</h1>
            <p className="text-xs text-slate-500">Manage, escalate, and resolve customer support inquiries</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
        >
          <RefreshCw className="size-3.5" /> Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-xs">
        {statusTabs.map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(key)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              statusFilter === key
                ? "bg-orange-50 text-orange-700 shadow-xs"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {label}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                statusFilter === key ? "bg-orange-200 text-orange-800" : "bg-slate-100 text-slate-600"
              }`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ticket number (#TKT-...), customer name, email, or issue..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-hidden transition shadow-xs"
        />
      </div>

      {/* Tickets List */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-slate-400" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white text-center">
          <LifeBuoy className="size-8 text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-600">No support tickets found</p>
          <p className="text-xs text-slate-400 mt-0.5">Try adjusting your filters or search keywords</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {tickets.map((ticket) => {
            const statusCfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
            const priorityCfg = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.MEDIUM;
            const lastMsg = ticket.messages?.[0];
            const customerName = ticket.user?.name || ticket.guestName || "Guest Customer";

            return (
              <button
                key={ticket.id}
                type="button"
                onClick={() => setSelectedTicketId(ticket.id)}
                className="w-full text-left rounded-3xl border border-slate-200/80 bg-white p-5 hover:border-orange-300 hover:shadow-xs transition shadow-xs"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[11px] font-black font-mono text-orange-600">{ticket.ticketNumber}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${priorityCfg.color}`}>
                        {priorityCfg.label}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                        {CATEGORY_LABELS[ticket.category] || ticket.category}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 truncate">{ticket.subject}</p>
                    {lastMsg && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                        {lastMsg.isStaff ? "Support: " : `${customerName}: `}
                        {lastMsg.body}
                      </p>
                    )}
                    <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                      <User className="size-3" /> {customerName} · Last updated{" "}
                      {new Date(ticket.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="shrink-0 text-slate-300">
                    <ChevronDown className="size-4 -rotate-90" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
