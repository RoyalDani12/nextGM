import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  usePayoutStatus,
  useWithdrawFunds,
  useGenerateOnboardingLink,
} from "./payouts.hooks";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  ShieldCheck,
  RefreshCw,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Landmark,
  CreditCard,
  ExternalLink,
  Check,
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
import { Button } from "@/components/ui/button";
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

  // Analytics & Filtering
  const [activeChartTab, setActiveChartTab] = useState<"balance" | "cashflow">(
    "balance"
  );
  const [filterType, setFilterType] = useState<"ALL" | "DEBIT" | "CREDIT">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset to page 1 whenever search, filter, or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchQuery, pageSize]);

  if (isLoading) {
    return (
      <div className="flex min-h-[460px] items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="mx-auto size-7 animate-spin text-orange-500" />
          <p className="text-xs font-medium text-slate-500 tracking-wide">
            Retrieving ledger balances and bank settlement routing...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !status) {
    return (
      <div className="rounded-2xl border border-rose-200/90 bg-rose-50/50 p-8 text-center max-w-lg mx-auto space-y-4">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <AlertCircle className="size-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Unable to connect to financial ledger
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            We encountered an issue retrieving your shop wallet balance. Please check
            your connection and try again.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          className="rounded-xl border-slate-300 text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className="mr-1.5 size-3.5" /> Retry Sync
        </Button>
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
  const withdrawablePct =
    balance > 0 ? Math.round((maxWithdrawable / balance) * 100) : 0;
  const reservePct = balance > 0 ? 100 - withdrawablePct : 0;

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
        "Sellers cannot withdraw their entire wallet balance. A 10% safety reserve must remain for refund and dispute security."
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
        `"Settled"`,
        `"${(tx.note || "").replace(/"/g, '""')}"`,
        `"${tx.orderId || ""}"`,
      ].join(",");
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `ledger-${shopId || "shop"}-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parsedWithdrawInput = parseFloat(withdrawAmount) || 0;
  const projectedRemaining = Math.max(0, balance - parsedWithdrawInput);

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8 pb-12">
        {/* ── 1. HEADER & GLOBAL ACTIONS ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Payouts & Balance
              </h1>
              {status.payoutsEnabled ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/70">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Stripe Direct Active
                </span>
              ) : status.stripeAccountId ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200/70">
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  Verification In Review
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-200">
                  <span className="size-1.5 rounded-full bg-slate-400" />
                  Bank Account Unlinked
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Audited shop wallet liquidity, automated order settlements, and bank wire transfers.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-9 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold px-3 gap-1.5 cursor-pointer shadow-xs"
              title="Refresh ledger balances"
            >
              <RefreshCw
                className={`size-3.5 text-slate-500 ${isFetching ? "animate-spin" : ""}`}
              />
              <span>Sync</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={filteredTransactions.length === 0}
              className="h-9 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold px-3 gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="size-3.5 text-slate-500" />
              <span>Export CSV</span>
            </Button>

            <Button
              size="sm"
              onClick={() => {
                setLocalError(null);
                setWithdrawAmount("");
                setIsTransferOpen(true);
              }}
              disabled={maxWithdrawable <= 0}
              className="h-9 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs px-4 gap-1.5 cursor-pointer shadow-sm shadow-orange-600/20 disabled:opacity-50"
            >
              <ArrowUpRight className="size-3.5" />
              <span>Withdraw Funds</span>
            </Button>
          </div>
        </div>

        {/* NOTIFICATIONS */}
        {localError && !isTransferOpen && (
          <Alert variant="destructive" className="rounded-2xl border-rose-200 bg-rose-50/80 text-rose-900 py-3">
            <AlertCircle className="size-4 text-rose-600" />
            <AlertTitle className="text-xs font-bold">Transfer Notice</AlertTitle>
            <AlertDescription className="text-xs">{localError}</AlertDescription>
          </Alert>
        )}

        {successMsg && (
          <Alert className="rounded-2xl border-emerald-200 bg-emerald-50/80 text-emerald-950 py-3 shadow-xs">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <AlertTitle className="text-xs font-bold">Payout Processed</AlertTitle>
            <AlertDescription className="text-xs">{successMsg}</AlertDescription>
          </Alert>
        )}

        {/* ── 2. FINANCIAL BALANCES OVERVIEW ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CARD 1: AVAILABLE LIVE BALANCE */}
          <div className="relative rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Wallet Balance
                </span>
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                  USD
                </span>
              </div>
              <div className="flex items-baseline gap-2 pt-0.5">
                <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {formatUSD(balance)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 pt-0.5">
                Total net funds held in double-entry merchant ledger.
              </p>
            </div>

            {/* WITHDRAWABLE VS RESERVE TRACK */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Withdrawable: <strong className="font-semibold text-slate-800">{formatUSD(maxWithdrawable)}</strong>
                </span>
                <span className="text-slate-400">({withdrawablePct}%)</span>
              </div>

              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden flex p-0.5 border border-slate-200/60">
                {withdrawablePct > 0 && (
                  <div
                    style={{ width: `${withdrawablePct}%` }}
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    title={`Available to transfer: ${formatUSD(maxWithdrawable)}`}
                  />
                )}
                {reservePct > 0 && (
                  <div
                    style={{ width: `${reservePct}%` }}
                    className="h-full rounded-full bg-amber-400 transition-all duration-300 ml-0.5"
                    title={`Safety reserve buffer: ${formatUSD(reserveAmount)}`}
                  />
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Reserve Buffer (10%): {formatUSD(reserveAmount)}</span>
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(true)}
                  disabled={maxWithdrawable <= 0}
                  className="font-semibold text-orange-600 hover:text-orange-700 disabled:opacity-40 cursor-pointer"
                >
                  Withdraw →
                </button>
              </div>
            </div>
          </div>

          {/* CARD 2: SAFETY RESERVE BUFFER */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Safety Reserve
                </span>
                <UiTooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-slate-400 hover:text-slate-600 transition-colors cursor-help"
                    >
                      <HelpCircle className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs p-2.5 bg-slate-900 text-slate-100 rounded-xl">
                    Standard 10% rolling reserve (min $10.00) held to cover customer refund settlements, chargeback disputes, and order adjustments.
                  </TooltipContent>
                </UiTooltip>
              </div>
              <div className="flex items-baseline gap-2 pt-0.5">
                <span className="text-3xl font-bold tracking-tight text-amber-700 tabular-nums">
                  {formatUSD(reserveAmount)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 pt-0.5">
                10% minimum buffer retained for customer dispute protection.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
                <ShieldCheck className="size-3.5 text-amber-600" />
                Reserve Protection
              </span>
              <span className="text-slate-400 font-mono text-[10px]">Min: $10.00</span>
            </div>
          </div>

          {/* CARD 3: TOTAL WITHDRAWN */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Total Withdrawn
                </span>
                <TrendingDown className="size-3.5 text-slate-400" />
              </div>
              <div className="flex items-baseline gap-2 pt-0.5">
                <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {formatUSD(totalWithdrawn)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 pt-0.5">
                Lifetime funds transferred to your designated bank account.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Payout Transfers</span>
              <span className="font-semibold text-slate-800">
                {transactions.filter((t) => t.type === "DEBIT").length} completed
              </span>
            </div>
          </div>

          {/* CARD 4: GROSS SALES EARNINGS */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Net Order Earnings
                </span>
                <TrendingUp className="size-3.5 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-2 pt-0.5">
                <span className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {formatUSD(totalEarned)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 pt-0.5">
                90% merchant settlement credit from fulfilled orders.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Lifetime Gross</span>
              <span className="font-semibold text-slate-800">{formatUSD(totalVolume)}</span>
            </div>
          </div>
        </div>

        {/* ── 3. CONNECTED BANK & PAYOUT DESTINATION STRIP ── */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 shrink-0 border border-slate-200/60">
                <Building2 className="size-5 text-slate-600" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900">
                    Stripe Express Bank Deposit
                  </h3>
                  {status.payoutsEnabled ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                      <Check className="size-3 text-emerald-600" />
                      Active Route
                    </span>
                  ) : status.stripeAccountId ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                      Pending Verification
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      Not Linked
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  {status.stripeAccountId ? (
                    <span>
                      Account:{" "}
                      <strong className="font-mono text-slate-700">
                        {status.stripeAccountId}
                      </strong>{" "}
                      • Direct wire routing with zero platform transfer fee.
                    </span>
                  ) : (
                    <span>
                      Connect a bank account to enable direct payouts and instant withdrawals.
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
              {status.payoutsEnabled ? (
                <div className="text-right hidden sm:block">
                  <p className="text-[11px] font-semibold text-slate-700">
                    Settlement Speed
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Instant transfer to connected account
                  </p>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={handleConnectBank}
                  disabled={onboardingMutation.isPending}
                  className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs h-8.5 px-3.5 gap-1.5 cursor-pointer shadow-xs"
                >
                  {onboardingMutation.isPending ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="size-3.5" />
                      <span>{status.stripeAccountId ? "Complete Onboarding" : "Connect Stripe Account"}</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── 4. FINANCIAL ANALYTICS & VISUAL TRAJECTORY ── */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Financial Trajectory & Cash Flow
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Real-time ledger curve from settled orders and direct withdrawal debits.
              </p>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/70 shrink-0">
              <button
                type="button"
                onClick={() => setActiveChartTab("balance")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  activeChartTab === "balance"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Activity className="size-3.5 text-orange-500" />
                <span>Balance Curve</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveChartTab("cashflow")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  activeChartTab === "cashflow"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <BarChart3 className="size-3.5 text-emerald-600" />
                <span>Inflow & Outflow</span>
              </button>
            </div>
          </div>

          {/* CHART CANVAS */}
          {chartData.length === 0 ? (
            <div className="h-64 w-full flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-2.5">
                <BarChart3 className="size-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                No ledger activity recorded yet
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm mt-1">
                When your store receives customer orders or issues payout transfers, your financial trajectory will graph here automatically.
              </p>
            </div>
          ) : activeChartTab === "balance" ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="fintechBalanceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
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
                      backgroundColor: "#0f172a",
                      borderColor: "#1e293b",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.25)",
                      fontSize: "12px",
                      color: "#f8fafc",
                      padding: "8px 12px",
                    }}
                    formatter={(val: any) => [`${formatUSD(Number(val))}`, "Ledger Balance"]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#ea580c"
                    strokeWidth={2}
                    fill="url(#fintechBalanceGrad)"
                    name="Balance"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 w-full">
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
                      backgroundColor: "#0f172a",
                      borderColor: "#1e293b",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.25)",
                      fontSize: "12px",
                      color: "#f8fafc",
                      padding: "8px 12px",
                    }}
                    formatter={(val: any, name: any) => [
                      `${formatUSD(Number(val))}`,
                      name === "credit" ? "Order Settlement" : "Bank Payout",
                    ]}
                  />
                  <Bar
                    dataKey="credit"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    name="credit"
                  />
                  <Bar
                    dataKey="withdrawal"
                    fill="#f43f5e"
                    radius={[4, 4, 0, 0]}
                    name="withdrawal"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100 gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="size-2 rounded-full bg-emerald-500" />
                Settlements: +{formatUSD(totalEarned)}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="size-2 rounded-full bg-rose-500" />
                Withdrawn: -{formatUSD(totalWithdrawn)}
              </span>
            </div>
            <span className="font-medium text-slate-600">
              Current Ledger Position:{" "}
              <strong className="font-mono text-slate-900">{formatUSD(balance)}</strong>
            </span>
          </div>
        </div>

        {/* ── 5. TRANSACTION & LEDGER AUDIT TABLE ── */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Ledger Activity & Audited Transactions
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Complete journal entries of sales credits and direct deposit debits.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* FILTER PILLS */}
              <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/60 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFilterType("ALL")}
                  className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                    filterType === "ALL"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  All ({transactions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("CREDIT")}
                  className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                    filterType === "CREDIT"
                      ? "bg-white text-emerald-800 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Credits ({transactions.filter((t) => t.type === "CREDIT").length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("DEBIT")}
                  className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                    filterType === "DEBIT"
                      ? "bg-white text-rose-800 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Payouts ({transactions.filter((t) => t.type === "DEBIT").length})
                </button>
              </div>
            </div>
          </div>

          {/* SEARCH & CONTROLS */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions by reference, note, order ID, or amount..."
                className="w-full rounded-xl border border-slate-200/90 py-2 pl-9 pr-4 text-xs font-medium text-slate-800 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-500 shrink-0">
              <span className="text-[11px] text-slate-400 font-medium">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* TABLE */}
          {filteredTransactions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center space-y-2">
              <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                <CreditCard className="size-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                {transactions.length === 0
                  ? "No financial transactions recorded"
                  : "No matching transactions found"}
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                {transactions.length === 0
                  ? "Completed customer orders and bank payouts will be logged here."
                  : "Try clearing search filters or entering a different query."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto ds-scroll rounded-xl border border-slate-200/70">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                      <th className="py-2.5 pl-3">Type & Reference</th>
                      <th className="py-2.5 px-2">Description</th>
                      <th className="py-2.5 px-2">Timestamp</th>
                      <th className="py-2.5 px-2 text-right">Amount</th>
                      <th className="py-2.5 px-2 text-right">Ledger Balance</th>
                      <th className="py-2.5 pr-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
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
                        <tr
                          key={tx.id}
                          className="hover:bg-slate-50/60 transition-colors"
                        >
                          <td className="py-3 pl-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`flex size-7 items-center justify-center rounded-lg shrink-0 ${
                                  isDebit
                                    ? "bg-rose-50 text-rose-600 border border-rose-200/60"
                                    : "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
                                }`}
                              >
                                {isDebit ? (
                                  <ArrowUpRight className="size-3.5" />
                                ) : (
                                  <ArrowDownLeft className="size-3.5" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 leading-tight">
                                  {isDebit ? "Bank Payout" : "Order Settlement"}
                                </p>
                                <p className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                                  {tx.id}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-2 font-medium text-slate-600">
                            <p className="truncate max-w-[260px] text-xs">
                              {tx.note || (isDebit ? "Direct Bank Payout" : "Net sales settlement")}
                            </p>
                            {tx.orderId && (
                              <span className="font-mono text-[10px] text-slate-400">
                                Order #{tx.orderId.slice(-8)}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-2 text-slate-500 whitespace-nowrap">
                            <p className="font-medium text-slate-700">{formattedDate}</p>
                            <p className="text-[10px] text-slate-400">{formattedTime}</p>
                          </td>

                          <td className="py-3 px-2 text-right font-semibold whitespace-nowrap tabular-nums">
                            <span
                              className={isDebit ? "text-slate-900" : "text-emerald-700 font-bold"}
                            >
                              {isDebit ? "-" : "+"}
                              {formatUSD(Number(tx.amount))}
                            </span>
                          </td>

                          <td className="py-3 px-2 text-right font-mono font-medium text-slate-600 whitespace-nowrap tabular-nums">
                            {formatUSD(Number(tx.balanceAfter))}
                          </td>

                          <td className="py-3 pr-3 text-right">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">
                              <span className="size-1 rounded-full bg-emerald-500" />
                              Settled
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION CONTROLS */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <p>
                  Showing{" "}
                  <strong className="font-semibold text-slate-800">
                    {totalItems === 0 ? 0 : startIndex + 1}
                  </strong>{" "}
                  to{" "}
                  <strong className="font-semibold text-slate-800">{endIndex}</strong>{" "}
                  of{" "}
                  <strong className="font-semibold text-slate-800">{totalItems}</strong>{" "}
                  entries
                </p>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className="h-8 px-2.5 rounded-lg border-slate-200 text-xs font-semibold cursor-pointer disabled:opacity-40"
                  >
                    <ChevronLeft className="size-3.5 mr-0.5" />
                    <span>Prev</span>
                  </Button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= safePage - 1 && pageNum <= safePage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`size-7.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              pageNum === safePage
                                ? "bg-slate-900 text-white font-bold"
                                : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      if (pageNum === safePage - 2 || pageNum === safePage + 2) {
                        return (
                          <span key={pageNum} className="px-1 text-slate-400">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                    className="h-8 px-2.5 rounded-lg border-slate-200 text-xs font-semibold cursor-pointer disabled:opacity-40"
                  >
                    <span>Next</span>
                    <ChevronRight className="size-3.5 ml-0.5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── 6. DIRECT WITHDRAWAL MODAL DIALOG ── */}
        <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Landmark className="size-4.5 text-orange-600" />
                Transfer Funds to Bank
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Direct wire transfer from your shop ledger to your verified Stripe Express checking account.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleWithdraw} className="space-y-4 pt-2">
              {/* BALANCE SUMMARY BOX */}
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Current Wallet Balance</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {formatUSD(balance)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    Safety Reserve (10% held)
                    <UiTooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="size-3 text-slate-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="text-xs bg-slate-900 text-slate-100 p-2 rounded-lg">
                        Mandatory 10% reserve for customer return guarantees
                      </TooltipContent>
                    </UiTooltip>
                  </span>
                  <span className="font-medium text-amber-700 tabular-nums">
                    -{formatUSD(reserveAmount)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Max Withdrawable Now</span>
                  <span className="font-bold text-emerald-700 text-sm tabular-nums">
                    {formatUSD(maxWithdrawable)}
                  </span>
                </div>
              </div>

              {/* QUICK AMOUNT CHIPS */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Quick Select Amount
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[50, 100, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickAmount(amt)}
                      disabled={maxWithdrawable < amt}
                      className="py-1.5 text-xs font-semibold rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                    >
                      ${amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleQuickAmount(maxWithdrawable)}
                    disabled={maxWithdrawable <= 0}
                    className="py-1.5 text-xs font-bold rounded-lg border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100/80 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* AMOUNT INPUT */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Withdrawal Amount (USD)
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
                    className="w-full rounded-xl border border-slate-200/90 py-2.5 pl-8 pr-14 text-sm font-bold text-slate-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 tabular-nums"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    USD
                  </span>
                </div>
              </div>

              {/* SETTLEMENT DETAILS */}
              <div className="rounded-xl bg-slate-50/70 p-3 text-xs space-y-1.5 text-slate-500">
                <div className="flex justify-between">
                  <span>Transfer Fee</span>
                  <span className="font-semibold text-emerald-700">Free ($0.00)</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Arrival</span>
                  <span className="font-medium text-slate-700">Instant via Stripe</span>
                </div>
                {parsedWithdrawInput > 0 && (
                  <div className="flex justify-between pt-1 border-t border-slate-200/60 font-medium">
                    <span>Remaining in Wallet</span>
                    <span className="font-mono text-slate-800">
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTransferOpen(false)}
                  disabled={withdrawMutation.isPending}
                  className="rounded-xl border-slate-200 text-xs font-semibold h-10 px-4 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    withdrawMutation.isPending ||
                    maxWithdrawable <= 0 ||
                    !withdrawAmount ||
                    parsedWithdrawInput <= 0 ||
                    parsedWithdrawInput > maxWithdrawable ||
                    parsedWithdrawInput >= balance
                  }
                  className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs h-10 px-5 gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm shadow-orange-600/25"
                >
                  {withdrawMutation.isPending ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Transferring...</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="size-3.5" />
                      <span>Confirm & Withdraw</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
