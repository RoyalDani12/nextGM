import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  usePayoutStatus,
  useWithdrawFunds,
  useGenerateOnboardingLink,
} from "./payouts.hooks";
import {
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Check,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Landmark,
  Loader2,
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

const fmt = (val: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);

const TYPE_OPTIONS = [
  { value: "ALL", label: "All types" },
  { value: "CREDIT", label: "Earnings" },
  { value: "DEBIT", label: "Payouts" },
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

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<"ALL" | "CREDIT" | "DEBIT">("ALL");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [openDropdown, setOpenDropdown] = useState<"type" | "limit" | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchQuery, pageSize]);

  if (isLoading) {
    return (
      <div className="flex min-h-[460px] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (isError || !status) {
    return (
      <div className="max-w-sm mx-auto text-center py-20 space-y-3">
        <AlertCircle className="mx-auto size-8 text-slate-300" />
        <p className="text-sm font-medium text-slate-700">Couldn't load payouts</p>
        <p className="text-xs text-slate-400">Check your connection and try again.</p>
        <button
          onClick={() => refetch()}
          className="text-xs font-medium text-orange-600 hover:text-orange-700 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const balance = Number(status.balance) || 0;
  const reserveAmount =
    status.reserveAmount != null
      ? Number(status.reserveAmount)
      : balance > 0
      ? Math.min(balance, Math.max(10, Math.round(balance * 0.1 * 100) / 100))
      : 0;
  const maxWithdrawable =
    status.maxWithdrawable != null
      ? Number(status.maxWithdrawable)
      : Math.max(0, Math.round((balance - reserveAmount) * 100) / 100);
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

  const chronologicalTxs = [...transactions].reverse();
  const rawChartData = chronologicalTxs.map((tx, idx) => {
    const d = new Date(tx.createdAt);
    return {
      index: `#${idx + 1}`,
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      balance: Number(tx.balanceAfter),
      withdrawal: tx.type === "DEBIT" ? Number(tx.amount) : 0,
      credit: tx.type === "CREDIT" ? Number(tx.amount) : 0,
    };
  });

  const chartData =
    rawChartData.length === 1
      ? [{ index: "#0", date: "Start", balance: 0, withdrawal: 0, credit: 0 }, ...rawChartData]
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
      setLocalError("Enter a valid amount.");
      return;
    }

    if (amountNum >= balance) {
      setLocalError(
        "You can't withdraw the full balance. A 10% safety reserve must remain."
      );
      return;
    }

    if (amountNum > maxWithdrawable) {
      setLocalError(
        `Max withdrawal is ${fmt(maxWithdrawable)}. ${fmt(reserveAmount)} must stay as reserve.`
      );
      return;
    }

    try {
      await withdrawMutation.mutateAsync(amountNum);
      setWithdrawAmount("");
      setIsTransferOpen(false);
      setSuccessMsg(`${fmt(amountNum)} sent to your bank account.`);
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err: any) {
      setLocalError(err?.response?.data?.message || "Withdrawal failed.");
    }
  };

  const handleConnectBank = async () => {
    try {
      setLocalError(null);
      const res = await onboardingMutation.mutateAsync();
      if (res?.url) window.location.href = res.url;
    } catch (err: any) {
      setLocalError(err?.response?.data?.message || "Failed to start bank setup.");
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType !== "ALL" && tx.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (tx.note || "").toLowerCase().includes(q) ||
        tx.amount.toString().includes(q) ||
        tx.id.toLowerCase().includes(q) ||
        (tx.orderId || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalItems = filteredTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  const renderPageNumbers = () => {
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
          <span key={`e-${idx}`} className="px-1.5 text-slate-300 text-xs select-none">
            …
          </span>
        );
      }
      return (
        <button
          key={`p-${p}`}
          onClick={() => setCurrentPage(Number(p))}
          className={`size-7 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            p === safePage
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          {p}
        </button>
      );
    });
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;

    const headers = [
      "Transaction ID",
      "Type",
      "Amount (USD)",
      "Balance After (USD)",
      "Date",
      "Time",
      "Details / Note",
      "Order ID",
    ];

    const rows = filteredTransactions.map((tx) => {
      const dateObj = new Date(tx.createdAt);
      const signedAmt =
        tx.type === "DEBIT"
          ? `-${Number(tx.amount).toFixed(2)}`
          : `+${Number(tx.amount).toFixed(2)}`;

      return [
        `"${tx.id}"`,
        `"${tx.type === "DEBIT" ? "Payout" : "Earning"}"`,
        `"${signedAmt}"`,
        `"${Number(tx.balanceAfter).toFixed(2)}"`,
        `"${dateObj.toLocaleDateString("en-US")}"`,
        `"${dateObj.toLocaleTimeString("en-US")}"`,
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
    link.download = `payouts-${shopId || "shop"}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parsedInput = parseFloat(withdrawAmount) || 0;
  const projectedRemaining = Math.max(0, balance - parsedInput);

  const tooltipStyle = {
    backgroundColor: "#fff",
    borderColor: "#e2e8f0",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    fontSize: "12px",
    padding: "6px 10px",
  };

  return (
    <TooltipProvider>
      <div className="space-y-5 max-w-[1200px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Payouts</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {fmt(balance)} available
              {maxWithdrawable > 0 && ` · ${fmt(maxWithdrawable)} withdrawable`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={filteredTransactions.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-40"
            >
              <Download size={13} />
              Export
            </button>

            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-40"
            >
              <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              onClick={() => {
                setLocalError(null);
                setWithdrawAmount("");
                setIsTransferOpen(true);
              }}
              disabled={maxWithdrawable <= 0}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            >
              Withdraw
            </button>
          </div>
        </div>

        {/* Alerts */}
        {localError && !isTransferOpen && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-700">
            <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
            <span>{localError}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-emerald-200 bg-emerald-50 text-xs text-emerald-700">
            <CheckCircle2 className="size-3.5 mt-0.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Balance", value: fmt(balance) },
            { label: "Reserve", value: fmt(reserveAmount) },
            { label: "Total payouts", value: fmt(totalWithdrawn) },
            { label: "Net earnings", value: fmt(totalEarned) },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white border border-slate-200 rounded-lg px-4 py-3.5"
            >
              <p className="text-xs text-slate-500 font-medium">{card.label}</p>
              <p className="text-xl font-semibold text-slate-900 mt-1 tabular-nums">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Bank account */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white border border-slate-200 rounded-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <Landmark size={16} className="text-slate-400 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-800">Bank account</span>
                {status.payoutsEnabled ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Connected
                  </span>
                ) : status.stripeAccountId ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600">
                    <span className="size-1.5 rounded-full bg-amber-500" />
                    In review
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                    <span className="size-1.5 rounded-full bg-slate-300" />
                    Not connected
                  </span>
                )}
              </div>
              {status.stripeAccountId && (
                <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
                  {status.stripeAccountId}
                </p>
              )}
            </div>
          </div>

          <div className="shrink-0">
            {status.payoutsEnabled ? (
              <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                <Check size={12} />
                Ready
              </span>
            ) : (
              <button
                onClick={handleConnectBank}
                disabled={onboardingMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {onboardingMutation.isPending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <ExternalLink size={12} />
                )}
                {status.stripeAccountId ? "Complete setup" : "Connect"}
              </button>
            )}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h2 className="text-sm font-medium text-slate-800 mb-3">Balance</h2>
            {chartData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-xs text-slate-400">
                No data yet
              </div>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
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
                      contentStyle={tooltipStyle}
                      formatter={(val: any) => [fmt(Number(val)), "Balance"]}
                      labelFormatter={(l) => l}
                      cursor={{ stroke: "#cbd5e1", strokeWidth: 1, strokeDasharray: "4 4" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stroke="#f97316"
                      strokeWidth={1.5}
                      fill="url(#balGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-sm font-medium text-slate-800">Earnings & Payouts</h2>
              <div className="flex items-center gap-2 ml-auto text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-sm bg-emerald-500" />
                  In
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-sm bg-rose-400" />
                  Out
                </span>
              </div>
            </div>
            {chartData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-xs text-slate-400">
                No data yet
              </div>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
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
                      contentStyle={tooltipStyle}
                      formatter={(val: any, name: any) => [
                        fmt(Number(val)),
                        name === "credit" ? "Earning" : "Payout",
                      ]}
                      cursor={{ fill: "rgba(241, 245, 249, 0.4)" }}
                    />
                    <Bar dataKey="credit" fill="#10b981" radius={[3, 3, 0, 0]} name="credit" />
                    <Bar dataKey="withdrawal" fill="#f43f5e" radius={[3, 3, 0, 0]} name="withdrawal" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Transactions header + filters */}
        <div className="flex flex-col md:flex-row gap-2.5">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2">
            {/* Type filter */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdown(openDropdown === "type" ? null : "type");
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  filterType !== "ALL"
                    ? "bg-orange-50 text-orange-700 border-orange-200"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {TYPE_OPTIONS.find((t) => t.value === filterType)?.label}
                <ChevronDown size={12} className="text-slate-400" />
              </button>

              {openDropdown === "type" && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setOpenDropdown(null)} />
                  <div className="absolute right-0 top-full mt-1 z-30 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1">
                    {TYPE_OPTIONS.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => {
                          setFilterType(t.value as any);
                          setOpenDropdown(null);
                        }}
                        className={`w-full px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                          filterType === t.value
                            ? "bg-orange-50 text-orange-700 font-medium"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Per page */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdown(openDropdown === "limit" ? null : "limit");
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {pageSize} per page
                <ChevronDown size={12} className="text-slate-400" />
              </button>

              {openDropdown === "limit" && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setOpenDropdown(null)} />
                  <div className="absolute right-0 top-full mt-1 z-30 w-28 bg-white rounded-lg shadow-lg border border-slate-200 py-1">
                    {LIMIT_OPTIONS.map((lim) => (
                      <button
                        key={lim}
                        onClick={() => {
                          setPageSize(lim);
                          setOpenDropdown(null);
                        }}
                        className={`w-full px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                          pageSize === lim
                            ? "bg-orange-50 text-orange-700 font-medium"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {lim}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Transaction table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-slate-500">
                {transactions.length === 0
                  ? "No transactions yet"
                  : "No results for this search"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {transactions.length === 0
                  ? "Orders and withdrawals will show up here."
                  : "Try a different query."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500 font-medium">
                    <th className="text-left px-4 py-3 font-medium">Description</th>
                    <th className="text-left px-4 py-3 font-medium">Type</th>
                    <th className="text-left px-4 py-3 font-medium">Date</th>
                    <th className="text-right px-4 py-3 font-medium">Amount</th>
                    <th className="text-right px-4 py-3 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedTransactions.map((tx) => {
                    const isDebit = tx.type === "DEBIT";
                    const d = new Date(tx.createdAt);

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`size-7 rounded-full flex items-center justify-center shrink-0 ${
                                isDebit
                                  ? "bg-slate-100 text-slate-500"
                                  : "bg-emerald-50 text-emerald-600"
                              }`}
                            >
                              {isDebit ? (
                                <ArrowUpRight size={13} />
                              ) : (
                                <ArrowDownLeft size={13} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">
                                {tx.note ||
                                  (isDebit ? "Withdrawal" : "Order payment")}
                              </p>
                              {tx.orderId && (
                                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                  {tx.orderId.slice(-8)}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`text-xs font-medium ${
                              isDebit ? "text-slate-500" : "text-emerald-600"
                            }`}
                          >
                            {isDebit ? "Payout" : "Earning"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs text-slate-500">
                            {d.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right tabular-nums">
                          <span
                            className={`text-sm font-medium ${
                              isDebit ? "text-slate-800" : "text-emerald-600"
                            }`}
                          >
                            {isDebit ? "−" : "+"}
                            {fmt(Number(tx.amount))}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right tabular-nums text-sm text-slate-500">
                          {fmt(Number(tx.balanceAfter))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between text-xs text-slate-500 py-1">
            <span>
              {startIndex + 1}–{endIndex} of {totalItems}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={safePage === 1}
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer transition-colors"
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              {renderPageNumbers()}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer transition-colors"
              >
                <ChevronRight size={14} />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage >= totalPages}
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer transition-colors"
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Withdraw modal */}
        <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
          <DialogContent className="sm:max-w-md rounded-lg bg-white p-5 shadow-xl border border-slate-200">
            <DialogHeader className="space-y-0.5">
              <DialogTitle className="text-base font-semibold text-slate-900">
                Withdraw funds
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Transfer to your connected bank account.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleWithdraw} className="space-y-4 pt-3">
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Balance</span>
                  <span className="font-medium text-slate-800 tabular-nums">{fmt(balance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    Reserve (10%)
                    <UiTooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="size-3 text-slate-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="text-xs bg-slate-800 text-slate-100 p-2 rounded-md max-w-[200px]">
                        10% is held for refunds and disputes ($10 minimum)
                      </TooltipContent>
                    </UiTooltip>
                  </span>
                  <span className="font-medium text-amber-600 tabular-nums">
                    −{fmt(reserveAmount)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between">
                  <span className="font-medium text-slate-700">Available</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {fmt(maxWithdrawable)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Quick select</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[50, 100, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickAmount(amt)}
                      disabled={maxWithdrawable < amt}
                      className="py-1.5 text-xs font-medium rounded-md border border-slate-200 hover:border-orange-300 hover:text-orange-600 text-slate-600 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                    >
                      ${amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleQuickAmount(maxWithdrawable)}
                    disabled={maxWithdrawable <= 0}
                    className="py-1.5 text-xs font-semibold rounded-md border border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                  >
                    Max
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
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
                    className="w-full pl-7 pr-12 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 font-medium text-slate-900 tabular-nums transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400">
                    USD
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-2.5 text-xs space-y-1 text-slate-500 border border-slate-100">
                <div className="flex justify-between">
                  <span>Fee</span>
                  <span className="text-emerald-600 font-medium">Free</span>
                </div>
                <div className="flex justify-between">
                  <span>Arrival</span>
                  <span className="text-slate-600">1–2 business days</span>
                </div>
                {parsedInput > 0 && (
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span>Remaining balance</span>
                    <span className="font-medium text-slate-700 tabular-nums">
                      {fmt(projectedRemaining)}
                    </span>
                  </div>
                )}
              </div>

              {localError && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                  <span>{localError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(false)}
                  disabled={withdrawMutation.isPending}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    withdrawMutation.isPending ||
                    maxWithdrawable <= 0 ||
                    !withdrawAmount ||
                    parsedInput <= 0 ||
                    parsedInput > maxWithdrawable ||
                    parsedInput >= balance
                  }
                  className="px-4 py-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40 inline-flex items-center gap-1.5"
                >
                  {withdrawMutation.isPending ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Withdraw"
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
