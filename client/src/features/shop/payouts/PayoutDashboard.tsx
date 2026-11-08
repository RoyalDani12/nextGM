import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  usePayoutStatus,
  useWithdrawFunds,
  useGenerateOnboardingLink,
} from "./payouts.hooks";
import {
  Wallet,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Check,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Package,
  Landmark,
  Activity,
  BarChart3,
  Loader2,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip as UiTooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formatUSD = (val: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);
};

const TYPE_OPTIONS = [
  { value: "ALL", label: "All Types" },
  { value: "CREDIT", label: "Earnings (Sales)" },
  { value: "DEBIT", label: "Payouts (Withdrawals)" },
];

const LIMIT_OPTIONS = [10, 20, 50, 100];

export function PayoutDashboard() {
  const { shopId = "" } = useParams<{ shopId: string }>();

  const {
    data: status,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = usePayoutStatus(shopId);
  const withdrawMutation = useWithdrawFunds(shopId);
  const onboardingMutation = useGenerateOnboardingLink(shopId);

  // Transfer Modal & Inputs
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filter Dropdowns matching the image UX
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<"ALL" | "CREDIT" | "DEBIT">("ALL");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [openFilterDropdown, setOpenFilterDropdown] = useState<"type" | "status" | "limit" | null>(null);

  // Reset to page 1 whenever search, filter, or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchQuery, pageSize]);

  if (isLoading) {
    return (
      <div className="flex min-h-[460px] items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="mx-auto size-7 animate-spin text-orange-500" />
          <p className="text-sm font-semibold text-slate-500">
            Loading payouts and balance...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !status) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 text-center max-w-lg mx-auto space-y-4">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <AlertCircle className="size-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Couldn't load payouts
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            We couldn't reach the payout service. Please check your connection and try again.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-sm transition-all cursor-pointer"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }

  const balance = Number(status.balance) || 0;
  const reserveAmount =
    Number(status.reserveAmount) ??
    (balance > 0
      ? Math.min(balance, Math.max(10, Math.round(balance * 0.1 * 100) / 100))
      : 0);
  const maxWithdrawable =
    Number(status.maxWithdrawable) ??
    Math.max(0, Math.round((balance - reserveAmount) * 100) / 100);
  const transactions = status.transactions || [];

  const totalWithdrawn =
    status.totalWithdrawn ??
    transactions
      .filter((tx) => tx.type === "DEBIT")
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const totalEarned =
    status.totalEarned ??
    Math.max(
      transactions
        .filter((tx) => tx.type === "CREDIT")
        .reduce((sum, tx) => sum + Number(tx.amount), 0),
      balance + totalWithdrawn
    );

  const totalVolume = Math.max(balance + totalWithdrawn, totalEarned);

  // Chronological chart data
  const chronologicalTxs = [...transactions].reverse();
  const rawChartData = chronologicalTxs.map((tx, idx) => {
    const d = new Date(tx.createdAt);
    return {
      index: `#${idx + 1}`,
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      balance: Number(tx.balanceAfter),
      withdrawal: tx.type === "DEBIT" ? Number(tx.amount) : 0,
      credit: tx.type === "CREDIT" ? Number(tx.amount) : 0,
      note: tx.note || (tx.type === "DEBIT" ? "Bank Withdrawal" : "Order Settlement"),
    };
  });

  const chartData =
    rawChartData.length === 1
      ? [
          {
            index: "#0",
            date: "Initial",
            time: "",
            balance: 0,
            withdrawal: 0,
            credit: 0,
            note: "Initial Ledger",
          },
          ...rawChartData,
        ]
      : rawChartData;

  const handleQuickAmount = (amt: number) => {
    setLocalError(null);
    const capped = Math.min(amt, maxWithdrawable);
    setWithdrawAmount(capped > 0 ? capped.toFixed(2) : "");
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMsg(null);
    const amountNum = parseFloat(withdrawAmount);

    if (isNaN(amountNum) || amountNum <= 0) {
      setLocalError("Please enter a valid withdrawal amount.");
      return;
    }

    if (amountNum >= balance) {
      setLocalError(
        "Sellers cannot withdraw their entire wallet balance. A 10% safety reserve must remain for refund and dispute obligations."
      );
      return;
    }

    if (amountNum > maxWithdrawable) {
      setLocalError(
        `Cannot withdraw ${formatUSD(amountNum)}. A required safety reserve of ${formatUSD(
          reserveAmount
        )} must remain in your wallet. Maximum withdrawable is ${formatUSD(
          maxWithdrawable
        )}.`
      );
      return;
    }

    try {
      await withdrawMutation.mutateAsync(amountNum);
      setWithdrawAmount("");
      setIsTransferOpen(false);
      setSuccessMsg(
        `Withdrawal of ${formatUSD(amountNum)} has been submitted to your connected bank account.`
      );
      setTimeout(() => setSuccessMsg(null), 9000);
    } catch (err: any) {
      setLocalError(err?.response?.data?.message || "Withdrawal failed.");
    }
  };

  const handleConnectBank = async () => {
    try {
      setLocalError(null);
      const res = await onboardingMutation.mutateAsync();
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      setLocalError(
        err?.response?.data?.message || "Failed to generate bank onboarding link."
      );
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (filterType !== "ALL" && tx.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNote = (tx.note || "").toLowerCase().includes(q);
      const matchAmount = tx.amount.toString().includes(q);
      const matchId = tx.id.toLowerCase().includes(q);
      const matchOrder = (tx.orderId || "").toLowerCase().includes(q);
      return matchNote || matchAmount || matchId || matchOrder;
    }
    return true;
  });

  // Pagination calculation
  const totalItems = filteredTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Pagination numbers helper (exact pattern from AdminUsersPage)
  const renderPaginationNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (safePage < totalPages - 2) pages.push("...");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }

    return pages.map((p, idx) => {
      if (p === "...") {
        return (
          <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400 text-xs select-none">
            …
          </span>
        );
      }
      const isCurrent = p === safePage;
      return (
        <button
          key={`page-${p}`}
          onClick={() => setCurrentPage(Number(p))}
          className={`size-8 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            isCurrent
              ? "bg-orange-500 text-white font-bold shadow-sm shadow-orange-100"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {p}
        </button>
      );
    });
  };

  // Export CSV handler
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;

    const headers = [
      "Transaction ID",
      "Type",
      "Amount (USD)",
      "Balance After (USD)",
      "Date",
      "Time",
      "Status",
      "Details / Note",
      "Order ID",
    ];

    const rows = filteredTransactions.map((tx) => {
      const dateObj = new Date(tx.createdAt);
      const dateStr = dateObj.toLocaleDateString("en-US");
      const timeStr = dateObj.toLocaleTimeString("en-US");
      const signedAmt =
        tx.type === "DEBIT"
          ? `-${Number(tx.amount).toFixed(2)}`
          : `+${Number(tx.amount).toFixed(2)}`;

      return [
        `"${tx.id}"`,
        `"${tx.type === "DEBIT" ? "Bank Withdrawal" : "Wallet Credit"}"`,
        `"${signedAmt}"`,
        `"${Number(tx.balanceAfter).toFixed(2)}"`,
        `"${dateStr}"`,
        `"${timeStr}"`,
        `"Active"`,
        `"${(tx.note || "").replace(/"/g, '""')}"`,
        `"${tx.orderId || ""}"`,
      ].join(",");
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ledger-report-${shopId || "shop"}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parsedWithdrawInput = parseFloat(withdrawAmount) || 0;
  const projectedRemaining = Math.max(0, balance - parsedWithdrawInput);

  const currentTypeLabel =
    TYPE_OPTIONS.find((t) => t.value === filterType)?.label || "All Types";

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* ── 1. HEADER SECTION ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <Wallet className="size-6 text-orange-500" />
              Payouts & Balance
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {transactions.length > 0
                ? `${transactions.length} transactions recorded • Balance: ${formatUSD(balance)}`
                : "Track your earnings, view history, and withdraw funds."}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* CSV Export Button */}
            <button
              onClick={handleExportCSV}
              disabled={filteredTransactions.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-40"
              title="Export transactions to CSV"
            >
              <Download size={14} className="text-orange-500" />
              Export CSV
            </button>

            {/* Sync Button */}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-40"
              title="Refresh payout data"
            >
              <RefreshCw
                size={14}
                className={`text-slate-500 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </button>

            {/* Withdraw Button */}
            <button
              onClick={() => {
                setLocalError(null);
                setWithdrawAmount("");
                setIsTransferOpen(true);
              }}
              disabled={maxWithdrawable <= 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-sm shadow-orange-100 transition-all cursor-pointer disabled:opacity-40"
            >
              <ArrowUpRight size={14} />
              Withdraw
            </button>
          </div>
        </div>

        {/* FEEDBACK ALERTS */}
        {localError && !isTransferOpen && (
          <Alert variant="destructive" className="rounded-2xl border-rose-200 bg-rose-50/80 text-rose-900 py-3 shadow-sm">
            <AlertCircle className="size-4 text-rose-600" />
            <AlertTitle className="text-xs font-bold">Transfer Notice</AlertTitle>
            <AlertDescription className="text-xs">{localError}</AlertDescription>
          </Alert>
        )}

        {successMsg && (
          <Alert className="rounded-2xl border-emerald-200 bg-emerald-50/80 text-emerald-950 py-3 shadow-sm">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <AlertTitle className="text-xs font-bold">Payout Initiated</AlertTitle>
            <AlertDescription className="text-xs">{successMsg}</AlertDescription>
          </Alert>
        )}

        {/* ── 2. FINANCIAL OVERVIEW CARDS (PIPELINE STYLE) ── */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            Overview
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* CARD 1: WALLET BALANCE (ORANGE THEME) */}
            <div className="rounded-2xl border border-orange-200/70 bg-orange-50/50 p-3.5 sm:p-4 transition-all hover:shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-800">Available Balance</span>
                  <Wallet className="size-4 text-orange-600" />
                </div>
                <div className="mt-2 text-lg sm:text-xl lg:text-2xl font-black text-orange-950 tabular-nums">
                  {formatUSD(balance)}
                </div>
                <p className="text-[11px] text-orange-700/80 mt-0.5 truncate">
                  Ready to withdraw
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-orange-200/60 flex items-center justify-between text-[11px] text-orange-900/80">
                <span className="font-medium truncate">
                  Available: <strong className="font-bold text-orange-950">{formatUSD(maxWithdrawable)}</strong>
                </span>
                {maxWithdrawable > 0 ? (
                  <button
                    type="button"
                    onClick={() => setIsTransferOpen(true)}
                    className="font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer shrink-0 ml-1"
                  >
                    Withdraw →
                  </button>
                ) : (
                  <span className="text-orange-600/70 text-[10px] font-semibold shrink-0">Reserve only</span>
                )}
              </div>
            </div>

            {/* CARD 2: SAFETY RESERVE (AMBER THEME) */}
            <div className="rounded-2xl border border-amber-200/70 bg-amber-50/50 p-3.5 sm:p-4 transition-all hover:shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800">Reserve</span>
                  <ShieldCheck className="size-4 text-amber-600" />
                </div>
                <div className="mt-2 text-lg sm:text-xl lg:text-2xl font-black text-amber-950 tabular-nums">
                  {formatUSD(reserveAmount)}
                </div>
                <p className="text-[11px] text-amber-700/80 mt-0.5 truncate">
                  Held for refunds & disputes
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-amber-900/80">
                <span className="font-medium">Safety Buffer</span>
                <span className="font-semibold text-amber-950">10% ($10 min)</span>
              </div>
            </div>

            {/* CARD 3: TOTAL WITHDRAWN (VIOLET THEME) */}
            <div className="rounded-2xl border border-violet-200/70 bg-violet-50/50 p-3.5 sm:p-4 transition-all hover:shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-violet-800">Total Payouts</span>
                  <ArrowUpRight className="size-4 text-violet-600" />
                </div>
                <div className="mt-2 text-lg sm:text-xl lg:text-2xl font-black text-violet-950 tabular-nums">
                  {formatUSD(totalWithdrawn)}
                </div>
                <p className="text-[11px] text-violet-700/80 mt-0.5 truncate">
                  Sent to your bank account
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-violet-200/60 flex items-center justify-between text-[11px] text-violet-900/80">
                <span className="font-medium">Completed Payouts</span>
                <span className="font-semibold text-violet-950">
                  {transactions.filter((t) => t.type === "DEBIT").length} transfers
                </span>
              </div>
            </div>

            {/* CARD 4: NET ORDER EARNINGS (EMERALD THEME) */}
            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/50 p-3.5 sm:p-4 transition-all hover:shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800">Net Earnings</span>
                  <CheckCircle2 className="size-4 text-emerald-600" />
                </div>
                <div className="mt-2 text-lg sm:text-xl lg:text-2xl font-black text-emerald-950 tabular-nums">
                  {formatUSD(totalEarned)}
                </div>
                <p className="text-[11px] text-emerald-700/80 mt-0.5 truncate">
                  Earnings after platform fees
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-900/80">
                <span className="font-medium">Total Sales</span>
                <span className="font-semibold text-emerald-950">{formatUSD(totalVolume)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. CONNECTED BANK BANNER ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="size-10 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center font-bold text-slate-700 shrink-0">
              <Landmark size={18} className="text-slate-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-900 text-sm">
                  Bank Account
                </p>
                {status.payoutsEnabled ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Connected
                  </span>
                ) : status.stripeAccountId ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
                    <span className="size-1.5 rounded-full bg-amber-500" />
                    In Review
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-slate-100 text-slate-600 border-slate-200">
                    <span className="size-1.5 rounded-full bg-slate-400" />
                    Not Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {status.stripeAccountId ? (
                  <span>
                    Account:{" "}
                    <strong className="font-mono text-slate-700">
                      {status.stripeAccountId}
                    </strong>{" "}
                    • Direct deposits enabled
                  </span>
                ) : (
                  "Connect your bank account to receive automatic or instant payouts."
                )}
              </p>
            </div>
          </div>

          <div className="shrink-0 self-end sm:self-auto">
            {status.payoutsEnabled ? (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5">
                <Check size={13} className="text-emerald-600" />
                Ready for Payouts
              </span>
            ) : (
              <button
                onClick={handleConnectBank}
                disabled={onboardingMutation.isPending}
                className="px-4 py-2 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm shadow-orange-100 transition-all cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {onboardingMutation.isPending ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink size={13} />
                    {status.stripeAccountId ? "Complete Setup" : "Connect Bank"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ── 4. ANALYTICS & CHARTS (SIDE BY SIDE) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* CHART 1: BALANCE HISTORY */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity size={15} className="text-orange-500" />
                  Balance History
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track how your balance changes over time
                </p>
              </div>

              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-orange-50 text-orange-700 border-orange-200 shrink-0">
                Current: {formatUSD(balance)}
              </span>
            </div>

            {chartData.length === 0 ? (
              <div className="h-60 w-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-1">
                <Activity className="size-8 opacity-30 mb-2" />
                <p className="font-semibold text-slate-700 text-sm">No balance history yet</p>
                <p className="text-xs text-slate-400 max-w-xs">
                  As you make sales and withdrawals, your balance trend will show here.
                </p>
              </div>
            ) : (
              <div className="h-60 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="chartBalanceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis
                      tickFormatter={(v) => `$${v}`}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e2e8f0",
                        borderRadius: "12px",
                        boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.08)",
                        fontSize: "12px",
                        color: "#0f172a",
                        padding: "8px 12px",
                        fontWeight: 600,
                      }}
                      itemStyle={{
                        color: "#0f172a",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                      labelStyle={{
                        color: "#64748b",
                        fontSize: "11px",
                        fontWeight: 500,
                        marginBottom: "4px",
                      }}
                      formatter={(val: any) => [`${formatUSD(Number(val))}`, "Balance"]}
                      labelFormatter={(label) => `Date: ${label}`}
                      cursor={{ stroke: "#ea580c", strokeWidth: 1.5, strokeDasharray: "4 4" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stroke="#ea580c"
                      strokeWidth={2}
                      fill="url(#chartBalanceGrad)"
                      name="Balance"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="size-2 rounded-full bg-orange-500" />
                Current Balance
              </span>
              <span className="font-mono font-bold text-slate-900">{formatUSD(balance)}</span>
            </div>
          </div>

          {/* CHART 2: EARNINGS & PAYOUTS */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 size={15} className="text-emerald-600" />
                  Earnings & Payouts
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Order earnings vs bank withdrawals
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Earnings
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-rose-50 text-rose-700 border-rose-200">
                  <span className="size-1.5 rounded-full bg-rose-500" />
                  Payouts
                </span>
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className="h-60 w-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-1">
                <BarChart3 className="size-8 opacity-30 mb-2" />
                <p className="font-semibold text-slate-700 text-sm">No activity recorded yet</p>
                <p className="text-xs text-slate-400 max-w-xs">
                  Sales earnings and bank withdrawals will appear here.
                </p>
              </div>
            ) : (
              <div className="h-60 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis
                      tickFormatter={(v) => `$${v}`}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e2e8f0",
                        borderRadius: "12px",
                        boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.08)",
                        fontSize: "12px",
                        color: "#0f172a",
                        padding: "8px 12px",
                        fontWeight: 600,
                      }}
                      itemStyle={{
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                      labelStyle={{
                        color: "#64748b",
                        fontSize: "11px",
                        fontWeight: 500,
                        marginBottom: "4px",
                      }}
                      formatter={(val: any, name: any) => [
                        `${formatUSD(Number(val))}`,
                        name === "credit" ? "Order Earnings" : "Bank Payout",
                      ]}
                      cursor={{ fill: "rgba(241, 245, 249, 0.5)", radius: 6 }}
                    />
                    <Bar dataKey="credit" fill="#10b981" radius={[4, 4, 0, 0]} name="credit" />
                    <Bar dataKey="withdrawal" fill="#f43f5e" radius={[4, 4, 0, 0]} name="withdrawal" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
              <span className="font-medium text-emerald-700">Earnings: +{formatUSD(totalEarned)}</span>
              <span className="font-medium text-rose-600">Payouts: -{formatUSD(totalWithdrawn)}</span>
            </div>
          </div>
        </div>

        {/* ── 5. TOP SEARCH & FILTERS ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by note, order #, or transaction ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm shadow-orange-100 transition-all shrink-0 cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Filter Dropdown Buttons */}
          <div className="flex flex-wrap items-center gap-2 relative">
            {/* Type Filter Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenFilterDropdown(openFilterDropdown === "type" ? null : "type");
                }}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  filterType !== "ALL"
                    ? "bg-orange-50 text-orange-700 border-orange-200"
                    : "bg-slate-50/50 hover:bg-white text-slate-700 border-slate-200"
                }`}
              >
                <Filter size={13} className={filterType !== "ALL" ? "text-orange-500" : "text-slate-400"} />
                <span>{currentTypeLabel}</span>
                <ChevronDown size={13} className="text-slate-400" />
              </button>

              {openFilterDropdown === "type" && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setOpenFilterDropdown(null)} />
                  <div className="absolute right-0 top-full mt-1.5 z-30 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                    {TYPE_OPTIONS.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => {
                          setFilterType(t.value as any);
                          setCurrentPage(1);
                          setOpenFilterDropdown(null);
                        }}
                        className={`w-full px-3.5 py-2 text-xs flex items-center justify-between font-medium transition-colors cursor-pointer ${
                          filterType === t.value
                            ? "bg-orange-50 text-orange-700 font-bold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{t.label}</span>
                        {filterType === t.value && <Check size={13} className="text-orange-500" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Status Filter Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenFilterDropdown(openFilterDropdown === "status" ? null : "status");
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white text-slate-700 transition-all cursor-pointer"
              >
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span>All Statuses</span>
                <ChevronDown size={13} className="text-slate-400" />
              </button>

              {openFilterDropdown === "status" && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setOpenFilterDropdown(null)} />
                  <div className="absolute right-0 top-full mt-1.5 z-30 w-40 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      onClick={() => setOpenFilterDropdown(null)}
                      className="w-full px-3.5 py-2 text-xs flex items-center justify-between font-medium text-orange-700 bg-orange-50 font-bold cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        <span>All (Active)</span>
                      </div>
                      <Check size={13} className="text-orange-500" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Per Page Limit Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenFilterDropdown(openFilterDropdown === "limit" ? null : "limit");
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white text-slate-700 transition-all cursor-pointer"
              >
                <span>{pageSize} per page</span>
                <ChevronDown size={13} className="text-slate-400" />
              </button>

              {openFilterDropdown === "limit" && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setOpenFilterDropdown(null)} />
                  <div className="absolute right-0 top-full mt-1.5 z-30 w-36 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                    {LIMIT_OPTIONS.map((lim) => (
                      <button
                        key={lim}
                        onClick={() => {
                          setPageSize(lim);
                          setCurrentPage(1);
                          setOpenFilterDropdown(null);
                        }}
                        className={`w-full px-3.5 py-2 text-xs flex items-center justify-between font-medium transition-colors cursor-pointer ${
                          pageSize === lim
                            ? "bg-orange-50 text-orange-700 font-bold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{lim} per page</span>
                        {pageSize === lim && <Check size={13} className="text-orange-500" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── 6. TABLE CONTAINER (EXACT STYLE FROM IMAGE) ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="p-16 text-center text-slate-400 space-y-1">
              <Wallet className="mx-auto size-12 opacity-30 mb-3" />
              <p className="font-semibold text-slate-700 text-base">No transactions yet</p>
              <p className="text-xs text-slate-400">
                {transactions.length === 0
                  ? "When you receive customer orders or withdraw funds, they will appear here."
                  : "Try clearing search filters or entering a different query."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/70 border-b border-slate-200/80 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Description</th>
                    <th className="px-5 py-3.5">Type</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Order</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5 text-right">Amount</th>
                    <th className="px-5 py-3.5 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedTransactions.map((tx) => {
                    const isDebit = tx.type === "DEBIT";
                    const dateObj = new Date(tx.createdAt);
                    const formattedDate = dateObj.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                    const formattedTime = dateObj.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    });

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Transaction Identity */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`size-10 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${
                                isDebit
                                  ? "bg-rose-50 text-rose-600 border-rose-200/70"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                              }`}
                            >
                              {isDebit ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 leading-tight">
                                {isDebit ? "Bank Payout" : "Order Payment"}
                              </p>
                              <p className="text-xs text-slate-400 font-mono mt-0.5">
                                {tx.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Type Badge (Exact RoleBadge style from image) */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {isDebit ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-orange-50 text-orange-700 border-orange-200">
                              PAYOUT
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-800 border-emerald-200">
                              EARNING
                            </span>
                          )}
                        </td>

                        {/* Status (Exact StatusBadge style from image) */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        </td>

                        {/* Order / Source Pill (Exact store pill style from image) */}
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                          {tx.orderId ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200/60 font-mono">
                              <Package size={12} className="text-slate-400" />
                              Order #{tx.orderId.slice(-8)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500 border border-slate-200/60">
                              <Landmark size={12} className="text-slate-400" />
                              Bank Transfer
                            </span>
                          )}
                        </td>

                        {/* Date (Exact Joined column style from image) */}
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500">
                          <div>
                            <p className="font-medium text-slate-700">{formattedDate}</p>
                            <p className="text-[11px] text-slate-400">{formattedTime}</p>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-5 py-4 whitespace-nowrap text-right font-bold text-sm tabular-nums">
                          <span className={isDebit ? "text-slate-900" : "text-emerald-700"}>
                            {isDebit ? "-" : "+"}
                            {formatUSD(Number(tx.amount))}
                          </span>
                        </td>

                        {/* Balance After */}
                        <td className="px-5 py-4 whitespace-nowrap text-right font-mono font-medium text-slate-600 tabular-nums">
                          {formatUSD(Number(tx.balanceAfter))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── 7. PAGINATION CONTROLS (EXACT STYLE FROM IMAGE) ── */}
        {totalItems > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              Showing <span className="font-bold text-slate-800">{startIndex + 1}</span> to{" "}
              <span className="font-bold text-slate-800">{endIndex}</span> of{" "}
              <span className="font-bold text-slate-800">{totalItems.toLocaleString()}</span> transactions
            </div>

            <div className="flex items-center gap-1.5">
              {/* First Button */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={safePage === 1}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 text-slate-700 transition-all font-semibold cursor-pointer"
                title="Go to first page"
              >
                <ChevronsLeft size={14} />
                First
              </button>

              {/* Prev Button */}
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 text-slate-700 transition-all font-semibold cursor-pointer"
              >
                <ChevronLeft size={14} />
                Prev
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1 mx-1">
                {renderPaginationNumbers()}
              </div>

              {/* Next Button */}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 text-slate-700 transition-all font-semibold cursor-pointer"
              >
                Next
                <ChevronRight size={14} />
              </button>

              {/* Last Button */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage >= totalPages}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 text-slate-700 transition-all font-semibold cursor-pointer"
                title="Go to last page"
              >
                Last
                <ChevronsRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── 8. DIRECT WITHDRAWAL MODAL DIALOG ── */}
        <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Landmark className="size-5 text-orange-500" />
                Withdraw to Bank
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Transfer your available balance directly to your bank account.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleWithdraw} className="space-y-4 pt-2">
              {/* BALANCE SUMMARY BOX */}
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Total Balance</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {formatUSD(balance)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    Safety reserve (10%)
                    <UiTooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="size-3 text-slate-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="text-xs bg-slate-900 text-slate-100 p-2 rounded-lg">
                        A 10% buffer is kept in your wallet for returns and dispute protection
                      </TooltipContent>
                    </UiTooltip>
                  </span>
                  <span className="font-semibold text-amber-700 tabular-nums">
                    -{formatUSD(reserveAmount)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Available to withdraw</span>
                  <span className="font-bold text-emerald-700 text-sm tabular-nums">
                    {formatUSD(maxWithdrawable)}
                  </span>
                </div>
              </div>

              {/* QUICK AMOUNT CHIPS */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">
                  Quick select
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[50, 100, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickAmount(amt)}
                      disabled={maxWithdrawable < amt}
                      className="py-2 text-xs font-semibold rounded-xl border border-slate-200 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 text-slate-700 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                    >
                      ${amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleQuickAmount(maxWithdrawable)}
                    disabled={maxWithdrawable <= 0}
                    className="py-2 text-xs font-bold rounded-xl border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100/80 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* AMOUNT INPUT */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={maxWithdrawable}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={withdrawMutation.isPending || maxWithdrawable <= 0}
                    className="w-full pl-8 pr-14 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-900 transition-all tabular-nums"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    USD
                  </span>
                </div>
              </div>

              {/* SETTLEMENT DETAILS */}
              <div className="rounded-xl bg-slate-50/70 p-3 text-xs space-y-1.5 text-slate-500 border border-slate-200/50">
                <div className="flex justify-between">
                  <span>Transfer fee</span>
                  <span className="font-semibold text-emerald-700">Free ($0.00)</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated arrival</span>
                  <span className="font-medium text-slate-700">1-2 business days (or instant)</span>
                </div>
                {parsedWithdrawInput > 0 && (
                  <div className="flex justify-between pt-1 border-t border-slate-200/60 font-medium">
                    <span>Balance after payout</span>
                    <span className="font-mono text-slate-800 font-semibold">
                      {formatUSD(projectedRemaining)}
                    </span>
                  </div>
                )}
              </div>

              {localError && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{localError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(false)}
                  disabled={withdrawMutation.isPending}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    withdrawMutation.isPending ||
                    maxWithdrawable <= 0 ||
                    !withdrawAmount ||
                    parsedWithdrawInput <= 0 ||
                    parsedWithdrawInput > maxWithdrawable ||
                    parsedWithdrawInput >= balance
                  }
                  className="px-5 py-2 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm shadow-orange-100 transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {withdrawMutation.isPending ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Transferring...</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpRight size={13} />
                      <span>Withdraw Funds</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
