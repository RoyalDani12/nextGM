import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { usePayoutStatus, useWithdrawFunds, useGenerateOnboardingLink } from "./payouts.hooks";
import {
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Building,
  Wallet,
  Landmark,
  ShieldCheck,
  History,
  TrendingDown,
  TrendingUp,
  Receipt,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Activity,
  BarChart3,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function PayoutDashboard() {
  const { shopId = "" } = useParams<{ shopId: string }>();

  const { data: status, isLoading, isError, refetch, isFetching } = usePayoutStatus(shopId);
  const withdrawMutation = useWithdrawFunds(shopId);
  const onboardingMutation = useGenerateOnboardingLink(shopId);

  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
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
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="mx-auto size-8 animate-spin text-orange-500" />
          <p className="text-xs font-semibold text-slate-500 tracking-wide">
            Loading payout wallet & bank connection...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !status) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-8 text-center max-w-xl mx-auto space-y-4">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <AlertCircle className="size-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Failed to load payout status</h2>
          <p className="mt-1 text-xs text-slate-600">Unable to reach the payment processor. Please check connection and try again.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          className="rounded-xl border-slate-300 text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className="mr-1.5 size-3.5" /> Retry
        </Button>
      </div>
    );
  }

  const balance = Number(status.balance) || 0;
  const reserveAmount = Number(status.reserveAmount) ?? (balance > 0 ? Math.min(balance, Math.max(10, Math.round(balance * 0.1 * 100) / 100)) : 0);
  const maxWithdrawable = Number(status.maxWithdrawable) ?? Math.max(0, Math.round((balance - reserveAmount) * 100) / 100);
  const transactions = status.transactions || [];
  const totalWithdrawn = status.totalWithdrawn ?? transactions
    .filter((tx) => tx.type === "DEBIT")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  const totalEarned = status.totalEarned ?? Math.max(
    transactions.filter((tx) => tx.type === "CREDIT").reduce((sum, tx) => sum + Number(tx.amount), 0),
    balance + totalWithdrawn
  );

  const totalVolume = Math.max(balance + totalWithdrawn, totalEarned);
  const withdrawablePct = totalVolume > 0 ? Math.round((maxWithdrawable / totalVolume) * 100) : 0;
  const reservePct = totalVolume > 0 ? Math.round((reserveAmount / totalVolume) * 100) : 0;
  const cashedOutPct = totalVolume > 0 ? Math.max(0, 100 - withdrawablePct - reservePct) : 0;

  // Prepare chronological chart data from real database records
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
      note: tx.note || (tx.type === "DEBIT" ? "Bank Withdrawal" : "Wallet Credit"),
    };
  });

  const chartData =
    rawChartData.length === 1
      ? [
          { index: "#0", date: "Initial", time: "", balance: 0, withdrawal: 0, credit: 0, note: "Initial" },
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
      setLocalError("Sellers cannot withdraw their entire wallet balance. A safety reserve must remain for customer returns and dispute obligations.");
      return;
    }

    if (amountNum > maxWithdrawable) {
      setLocalError(`Cannot withdraw $${amountNum.toFixed(2)}. A minimum safety reserve of $${reserveAmount.toFixed(2)} must remain in your wallet. Maximum withdrawable amount is $${maxWithdrawable.toFixed(2)}.`);
      return;
    }

    try {
      await withdrawMutation.mutateAsync(amountNum);
      setWithdrawAmount("");
      setSuccessMsg(`Successfully withdrew $${amountNum.toFixed(2)} to your connected bank account!`);
      setTimeout(() => setSuccessMsg(null), 8000);
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
      setLocalError(err?.response?.data?.message || "Failed to generate bank onboarding link.");
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
      return matchNote || matchAmount || matchId;
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
      const signedAmt = tx.type === "DEBIT" ? `-${Number(tx.amount).toFixed(2)}` : `+${Number(tx.amount).toFixed(2)}`;

      return [
        `"${tx.id}"`,
        `"${tx.type === "DEBIT" ? "Bank Withdrawal" : "Wallet Credit"}"`,
        `"${signedAmt}"`,
        `"${Number(tx.balanceAfter).toFixed(2)}"`,
        `"${dateStr}"`,
        `"${timeStr}"`,
        `"Completed"`,
        `"${(tx.note || "").replace(/"/g, '""')}"`,
        `"${tx.orderId || ""}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `transactions-${shopId || "shop"}-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* ── 1. TOP HEADER & QUICK REFRESH ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20 ring-4 ring-orange-500/10">
            <Wallet className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payouts & Financial Center</h1>
              {status.payoutsEnabled ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="size-3 text-emerald-600" />
                  Direct Payouts Active
                </span>
              ) : status.stripeAccountId ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                  <Activity className="size-3 text-amber-600" />
                  Verification Pending
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                  <Landmark className="size-3 text-slate-500" />
                  Bank Not Connected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Manage live wallet liquidity, cash out funds, and monitor ledger activity.</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold h-9 px-3.5 gap-1.5 cursor-pointer shrink-0"
        >
          <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
          <span>Sync Balance</span>
        </Button>
      </div>

      {localError && (
        <Alert variant="destructive" className="rounded-2xl border-rose-200 bg-rose-50 text-rose-900">
          <AlertCircle className="size-4 text-rose-600" />
          <AlertTitle className="text-xs font-bold">Error</AlertTitle>
          <AlertDescription className="text-xs">{localError}</AlertDescription>
        </Alert>
      )}

      {successMsg && (
        <Alert className="rounded-2xl border-emerald-200 bg-emerald-50 text-emerald-900">
          <CheckCircle2 className="size-4 text-emerald-600" />
          <AlertTitle className="text-xs font-bold">Payout Completed</AlertTitle>
          <AlertDescription className="text-xs">{successMsg}</AlertDescription>
        </Alert>
      )}

      {/* ── 2. LIGHT-THEME FINANCIAL HERO BANNER ── */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* LEFT: Live Balance & Visual Three-Tier Meter */}
          <div className="lg:col-span-7 space-y-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex size-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Live Shop Wallet Balance</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 font-sans">
                  ${balance.toFixed(2)}
                </span>
                <span className="rounded-xl bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700 border border-orange-200/80">
                  USD
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Real-time ledger balance from customer sales settlements minus payouts.</p>
            </div>

            {/* THREE-TIER VISUAL PROGRESS TRACK */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-3 gap-2 text-[11px] font-bold">
                <span className="text-emerald-700 flex items-center gap-1.5 truncate">
                  <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                  Withdrawable: ${maxWithdrawable.toFixed(2)}
                </span>
                <span className="text-amber-700 flex items-center gap-1.5 truncate justify-center">
                  <span className="size-2 rounded-full bg-amber-500 shrink-0" />
                  Reserve: ${reserveAmount.toFixed(2)}
                </span>
                <span className="text-rose-600 flex items-center gap-1.5 truncate justify-end">
                  <span className="size-2 rounded-full bg-rose-500 shrink-0" />
                  Cashed Out: ${totalWithdrawn.toFixed(2)}
                </span>
              </div>

              {/* THREE-SEGMENT TRACK */}
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex p-0.5 border border-slate-200 shadow-inner">
                {withdrawablePct > 0 && (
                  <div
                    style={{ width: `${withdrawablePct}%` }}
                    className="h-full rounded-l-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                    title={`Withdrawable: ${withdrawablePct}% ($${maxWithdrawable.toFixed(2)})`}
                  />
                )}
                {reservePct > 0 && (
                  <div
                    style={{ width: `${reservePct}%` }}
                    className={`h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-500 ${withdrawablePct === 0 ? "rounded-l-full" : ""} ${cashedOutPct === 0 ? "rounded-r-full" : ""}`}
                    title={`Safety Reserve (Return Buffer): ${reservePct}% ($${reserveAmount.toFixed(2)})`}
                  />
                )}
                {cashedOutPct > 0 && (
                  <div
                    style={{ width: `${cashedOutPct}%` }}
                    className="h-full rounded-r-full bg-gradient-to-r from-rose-500 to-rose-600 transition-all duration-500"
                    title={`Total Cashed Out: ${cashedOutPct}% ($${totalWithdrawn.toFixed(2)})`}
                  />
                )}
                {totalVolume === 0 && (
                  <div className="h-full w-full bg-slate-200/70 rounded-full" />
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Total Lifetime Volume: <strong className="text-slate-800">${totalVolume.toFixed(2)}</strong></span>
                <span className="text-amber-700 font-bold flex items-center gap-1">
                  <ShieldCheck className="size-3 text-amber-600" />
                  Safety Reserve Active (min $10)
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: Metric Cards */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
            <div className="rounded-2xl bg-slate-50/80 border border-slate-200/80 p-4 space-y-1.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200">
                <ArrowUpRight className="size-4.5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Max Withdrawable</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">${maxWithdrawable.toFixed(2)}</p>
              </div>
              <p className="text-[10px] text-slate-400">Available to transfer now</p>
            </div>

            <div className="rounded-2xl bg-slate-50/80 border border-slate-200/80 p-4 space-y-1.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 border border-amber-200">
                <ShieldCheck className="size-4.5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Held Reserve Buffer</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">${reserveAmount.toFixed(2)}</p>
              </div>
              <p className="text-[10px] text-slate-400">10% customer return buffer</p>
            </div>

            <div className="rounded-2xl bg-slate-50/80 border border-slate-200/80 p-4 space-y-1.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600 border border-rose-200">
                <TrendingDown className="size-4.5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Withdrawn</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">${totalWithdrawn.toFixed(2)}</p>
              </div>
              <p className="text-[10px] text-slate-400">Transferred to bank</p>
            </div>

            <div className="rounded-2xl bg-slate-50/80 border border-slate-200/80 p-4 space-y-1.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200">
                <TrendingUp className="size-4.5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gross Earnings</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">${totalEarned.toFixed(2)}</p>
              </div>
              <p className="text-[10px] text-slate-400">Net order payouts (90%)</p>
            </div>

            <div className="col-span-2 rounded-2xl bg-slate-50/80 border border-slate-200/80 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600 border border-orange-200">
                  <Landmark className="size-4.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Stripe Express Bank Routing</p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {status.stripeAccountId ? `Account: ${status.stripeAccountId}` : "No bank linked"}
                  </p>
                </div>
              </div>
              {status.payoutsEnabled ? (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  Connected & Active
                </span>
              ) : status.stripeAccountId ? (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                  Verification Pending
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleConnectBank}
                  disabled={onboardingMutation.isPending}
                  className="rounded-xl border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-bold h-8 px-3 cursor-pointer"
                >
                  {onboardingMutation.isPending ? "Connecting..." : "Connect Bank"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. VISUAL BANK LIFECYCLE PIPELINE ── */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Automated Direct Payout Lifecycle</span>
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <Check className="size-3.5" /> 4/4 Steps Operational
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-orange-50/70 border border-orange-200/80">
            <div className="flex size-8 items-center justify-center rounded-xl bg-orange-500 text-white font-bold text-xs shrink-0 shadow-xs">
              1
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">1. Enter Amount</p>
              <p className="text-[10px] text-slate-500">Pick preset or custom</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500 text-white font-bold text-xs shrink-0 shadow-xs">
              2
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">2. Ledger Lock</p>
              <p className="text-[10px] text-slate-500">Atomic DB debit</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80">
            <div className="flex size-8 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xs shrink-0 shadow-xs">
              3
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">3. Stripe Transfer</p>
              <p className="text-[10px] text-slate-500">Encrypted bank routing</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-xs shrink-0 shadow-xs">
              4
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">4. Bank Deposit</p>
              <p className="text-[10px] text-slate-500">Direct checking settle</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. BOTH CHARTS SIDE BY SIDE (BALANCE CURVE & CASH IN / OUT) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: BALANCE CURVE */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-orange-500" />
                <h2 className="text-sm font-bold text-slate-900">Wallet Balance Curve</h2>
              </div>
              <span className="rounded-lg bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700 border border-orange-200">
                Current: ${balance.toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Historical trajectory of available funds over time</p>
          </div>

          {chartData.length === 0 ? (
            <div className="h-60 w-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-orange-100/70 text-orange-600 mb-2">
                <Activity className="size-5" />
              </div>
              <p className="text-xs font-bold text-slate-700">No balance history yet</p>
              <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                As your store receives and settles orders, your wallet trajectory will update here automatically.
              </p>
            </div>
          ) : (
            <div className="h-60 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="payoutBalanceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} />
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
                      borderRadius: "14px",
                      boxShadow: "0 10px 25px -5px rgb(15 23 42 / 0.12)",
                      fontSize: "12px",
                      padding: "8px 12px",
                    }}
                    formatter={(val: any) => [`$${Number(val).toFixed(2)}`, "Wallet Balance"]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    fill="url(#payoutBalanceGrad)"
                    name="Balance"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="size-2 rounded-full bg-orange-500" />
              Available Balance Trajectory
            </span>
            <span className="font-mono text-slate-600 font-semibold">${balance.toFixed(2)}</span>
          </div>
        </div>

        {/* CHART 2: CASH IN / OUT (BARS) */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">Cash In / Out Flow</h2>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold">
                <span className="text-emerald-700 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500" /> Credits
                </span>
                <span className="text-rose-600 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-rose-500" /> Withdrawals
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Order settlements vs. bank withdrawal payouts</p>
          </div>

          {chartData.length === 0 ? (
            <div className="h-60 w-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-600 mb-2">
                <BarChart3 className="size-5" />
              </div>
              <p className="text-xs font-bold text-slate-700">No cash flow recorded yet</p>
              <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                Net credits from customer sales and bank debit transfers will be logged here.
              </p>
            </div>
          ) : (
            <div className="h-60 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} />
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
                      borderRadius: "14px",
                      boxShadow: "0 10px 25px -5px rgb(15 23 42 / 0.12)",
                      fontSize: "12px",
                      padding: "8px 12px",
                    }}
                    formatter={(val: any, name: any) => [
                      `$${Number(val).toFixed(2)}`,
                      name === "credit" ? "Credit / Settlement" : "Bank Withdrawal",
                    ]}
                  />
                  <Bar dataKey="credit" fill="#10b981" radius={[4, 4, 0, 0]} name="credit" />
                  <Bar dataKey="withdrawal" fill="#f43f5e" radius={[4, 4, 0, 0]} name="withdrawal" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <span className="text-emerald-700 font-semibold">Credits: +${totalEarned.toFixed(2)}</span>
            <span className="text-rose-600 font-semibold">Withdrawn: -${totalWithdrawn.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* ── 5. DIRECT WITHDRAWAL ACTION CARD ── */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
              <Building className="size-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">Initiate Direct Bank Withdrawal</h2>
              <p className="text-xs text-slate-500">Funds transfer directly to your verified bank account with zero fees</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {maxWithdrawable > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                Available: ${maxWithdrawable.toFixed(2)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                <ShieldCheck className="size-3.5 text-amber-600" />
                Reserve Protected ($0 withdrawable)
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* LEFT: Quick Amount Presets */}
          <div className="lg:col-span-5 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Select Amount</span>
            <div className="grid grid-cols-4 gap-2">
              {[50, 100, 500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickAmount(amt)}
                  disabled={maxWithdrawable < amt}
                  className="py-2.5 text-xs font-bold rounded-xl border border-slate-200 hover:border-orange-500/50 hover:bg-orange-50/50 text-slate-700 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                >
                  ${amt}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleQuickAmount(maxWithdrawable)}
                disabled={maxWithdrawable <= 0}
                className="py-2.5 text-xs font-bold rounded-xl border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100/80 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                Max (${maxWithdrawable.toFixed(2)})
              </button>
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              Select a quick preset or type a custom amount. A 10% safety reserve (${reserveAmount.toFixed(2)}) remains in your wallet.
            </p>
          </div>

          {/* RIGHT: Input & Withdraw CTA */}
          <div className="lg:col-span-7">
            <form onSubmit={handleWithdraw} className="flex flex-col sm:flex-row items-end gap-3">
              <div className="w-full flex-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Amount to Withdraw ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={maxWithdrawable}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={withdrawMutation.isPending || maxWithdrawable <= 0}
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-8 pr-4 text-base font-bold text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:bg-slate-50 transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={withdrawMutation.isPending || maxWithdrawable <= 0 || !withdrawAmount || Number(withdrawAmount) > maxWithdrawable || Number(withdrawAmount) >= balance}
                className="w-full sm:w-auto px-6 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl font-bold h-11 text-xs shadow-sm shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all shrink-0"
              >
                {withdrawMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="size-4" />
                    <span>Withdraw Funds to Bank</span>
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-3 border-t border-slate-100">
          <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
          <span>Encrypted direct deposit routing with automatic double-entry ledger settlement and 10% safety reserve protection</span>
        </div>
      </div>

      {/* ── 6. TRANSACTION & WITHDRAWAL HISTORY ── */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 md:p-7 shadow-2xs space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <History className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Transaction & Withdrawal History</h2>
              <p className="text-xs text-slate-500">Full audit log of all withdrawals, payout transfers, and credits.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* EXPORT CSV BUTTON */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={filteredTransactions.length === 0}
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold h-9 px-3 gap-1.5 cursor-pointer disabled:opacity-50"
              title="Download transaction history as CSV"
            >
              <Download className="size-3.5 text-slate-500" />
              <span>Export CSV</span>
            </Button>

            {/* TYPE FILTER PILLS */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setFilterType("ALL")}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  filterType === "ALL"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                All ({transactions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("DEBIT")}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  filterType === "DEBIT"
                    ? "bg-white text-rose-700 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Withdrawals ({transactions.filter((t) => t.type === "DEBIT").length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("CREDIT")}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  filterType === "CREDIT"
                    ? "bg-white text-emerald-700 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Credits ({transactions.filter((t) => t.type === "CREDIT").length})
              </button>
            </div>
          </div>
        </div>

        {/* SEARCH BAR & PAGE SIZE SELECTOR */}
        {transactions.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by amount, transfer note, or transaction ID..."
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-xs font-medium text-slate-800 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-500 shrink-0">
              <span className="text-[11px] font-semibold text-slate-400">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        )}

        {/* TRANSACTIONS TABLE / LIST */}
        {filteredTransactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
              <Receipt className="size-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No transactions found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {transactions.length === 0
                ? "You haven't initiated any withdrawals yet. When you withdraw funds, they will appear here."
                : "No transactions match your current search or filter criteria."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto ds-scroll">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 pl-2">Type</th>
                    <th className="pb-3">Details / Note</th>
                    <th className="pb-3">Date & Time</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 text-right">Balance After</th>
                    <th className="pb-3 pr-2 text-right">Status</th>
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
                      hour12: true,
                    });

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 pl-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`flex size-8 items-center justify-center rounded-xl shrink-0 ${
                                isDebit
                                  ? "bg-rose-50 text-rose-600"
                                  : "bg-emerald-50 text-emerald-600"
                              }`}
                            >
                              {isDebit ? (
                                <ArrowUpRight className="size-4" />
                              ) : (
                                <ArrowDownLeft className="size-4" />
                              )}
                            </div>
                            <div>
                              <span
                                className={`font-bold ${
                                  isDebit ? "text-slate-900" : "text-emerald-900"
                                }`}
                              >
                                {isDebit ? "Bank Withdrawal" : "Wallet Credit"}
                              </span>
                              <p className="font-mono text-[10px] text-slate-400 truncate max-w-[110px]">
                                {tx.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 font-medium text-slate-700">
                          <p className="truncate max-w-[240px] text-xs">
                            {tx.note || (isDebit ? "Direct Bank Payout" : "Commission Credit")}
                          </p>
                          {tx.orderId && (
                            <span className="font-mono text-[10px] text-slate-400">
                              Order: {tx.orderId}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 text-slate-500 whitespace-nowrap">
                          <p className="font-medium text-slate-800">{formattedDate}</p>
                          <p className="text-[10px] text-slate-400">{formattedTime}</p>
                        </td>

                        <td className="py-3.5 text-right font-black whitespace-nowrap">
                          <span
                            className={`text-sm ${
                              isDebit ? "text-rose-600" : "text-emerald-600"
                            }`}
                          >
                            {isDebit ? "-" : "+"}${Number(tx.amount).toFixed(2)}
                          </span>
                        </td>

                        <td className="py-3.5 text-right font-mono font-semibold text-slate-700 whitespace-nowrap">
                          ${Number(tx.balanceAfter).toFixed(2)}
                        </td>

                        <td className="py-3.5 pr-2 text-right">
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                            <CheckCircle2 className="size-3 text-emerald-600" />
                            Completed
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION BAR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500">
              <p>
                Showing <strong className="font-bold text-slate-800">{totalItems === 0 ? 0 : startIndex + 1}</strong> to{" "}
                <strong className="font-bold text-slate-800">{endIndex}</strong> of{" "}
                <strong className="font-bold text-slate-800">{totalItems}</strong> transactions
              </p>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold h-8 px-2.5 gap-1 cursor-pointer disabled:opacity-40"
                >
                  <ChevronLeft className="size-3.5" />
                  <span>Prev</span>
                </Button>

                {/* Page numbers */}
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
                          className={`size-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            pageNum === safePage
                              ? "bg-slate-900 text-white shadow-xs"
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
                  className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold h-8 px-2.5 gap-1 cursor-pointer disabled:opacity-40"
                >
                  <span>Next</span>
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
