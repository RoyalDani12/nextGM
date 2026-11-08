import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Search,
  X,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { useShopOrders } from "./shop.hooks";
import { getShopOrdersRequest } from "../order/order.api";

export type DatePreset =
  | "ALL"
  | "TODAY"
  | "YESTERDAY"
  | "LAST_7_DAYS"
  | "THIS_MONTH"
  | "CUSTOM";

const fmt = (val: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);

const formatDateInput = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const getDateRangeForPreset = (
  preset: DatePreset
): { startDate?: string; endDate?: string } => {
  const now = new Date();
  const todayStr = formatDateInput(now);

  switch (preset) {
    case "TODAY":
      return { startDate: todayStr, endDate: todayStr };
    case "YESTERDAY": {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = formatDateInput(yesterday);
      return { startDate: yesterdayStr, endDate: yesterdayStr };
    }
    case "LAST_7_DAYS": {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 6);
      return { startDate: formatDateInput(sevenDaysAgo), endDate: todayStr };
    }
    case "THIS_MONTH": {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: formatDateInput(firstOfMonth), endDate: todayStr };
    }
    case "ALL":
    case "CUSTOM":
    default:
      return {};
  }
};

const STATUS_TABS = [
  { value: "ALL", label: "All" },
  { value: "CONFIRMED", label: "Unfulfilled" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

const DATE_PRESET_OPTIONS: { value: DatePreset; label: string }[] = [
  { value: "ALL", label: "All time" },
  { value: "TODAY", label: "Today" },
  { value: "YESTERDAY", label: "Yesterday" },
  { value: "LAST_7_DAYS", label: "Last 7 days" },
  { value: "THIS_MONTH", label: "This month" },
  { value: "CUSTOM", label: "Custom range" },
];

const LIMIT_OPTIONS = [10, 20, 50];

const renderStatus = (status: string) => {
  switch (status) {
    case "DELIVERED":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Delivered
        </span>
      );
    case "SHIPPED":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700">
          <span className="size-1.5 rounded-full bg-blue-500" />
          Shipped
        </span>
      );
    case "PROCESSING":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
          <span className="size-1.5 rounded-full bg-amber-500" />
          Processing
        </span>
      );
    case "CONFIRMED":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-700">
          <span className="size-1.5 rounded-full bg-orange-500" />
          To pack
        </span>
      );
    case "CANCELLED":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600">
          <span className="size-1.5 rounded-full bg-rose-500" />
          Cancelled
        </span>
      );
    case "REFUNDED":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-700">
          <span className="size-1.5 rounded-full bg-purple-500" />
          Refunded
        </span>
      );
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <span className="size-1.5 rounded-full bg-slate-400" />
          Pending payment
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
          {status}
        </span>
      );
  }
};

export const ShopOrdersPage = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [datePreset, setDatePreset] = useState<DatePreset>("ALL");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [openDropdown, setOpenDropdown] = useState<"date" | "limit" | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, datePreset, customStartDate, customEndDate, pageSize]);

  const activeDateRange = useMemo(() => {
    if (datePreset === "CUSTOM") {
      return {
        startDate: customStartDate || undefined,
        endDate: customEndDate || undefined,
      };
    }
    return getDateRangeForPreset(datePreset);
  }, [datePreset, customStartDate, customEndDate]);

  const queryParams = useMemo(() => {
    return {
      status: statusFilter === "ALL" ? undefined : statusFilter,
      search: debouncedSearch.trim() || undefined,
      startDate: activeDateRange.startDate,
      endDate: activeDateRange.endDate,
      page: currentPage,
      limit: pageSize,
    };
  }, [statusFilter, debouncedSearch, activeDateRange, currentPage, pageSize]);

  const { data, isLoading, isFetching, isError, refetch } = useShopOrders(
    shopId ?? "",
    queryParams
  );

  const responseData = data?.data ?? data;
  const rawOrders: any[] = useMemo(() => {
    if (!responseData) return [];
    return responseData?.orders ?? (Array.isArray(data) ? data : []);
  }, [data, responseData]);

  const pagination = responseData?.pagination ?? {
    total: rawOrders.length,
    page: currentPage,
    limit: pageSize,
    totalPages: Math.max(1, Math.ceil(rawOrders.length / pageSize)),
    hasNextPage: false,
    hasPrevPage: false,
  };

  const { totalRevenue, confirmedCount, processingCount, completedCount } = useMemo(() => {
    let revenue = 0;
    let confirmed = 0;
    let processing = 0;
    let completed = 0;

    rawOrders.forEach((order: any) => {
      const amount = parseFloat(order.totalAmount || "0");
      if (
        order.status === "CONFIRMED" ||
        order.status === "PROCESSING" ||
        order.status === "SHIPPED" ||
        order.status === "DELIVERED"
      ) {
        revenue += amount;
      }

      if (order.status === "CONFIRMED") confirmed++;
      else if (order.status === "PROCESSING") processing++;
      else if (order.status === "DELIVERED" || order.status === "SHIPPED") completed++;
    });

    return {
      totalRevenue: revenue,
      confirmedCount: confirmed,
      processingCount: processing,
      completedCount: completed,
    };
  }, [rawOrders]);

  const handleExportCSV = async () => {
    if (!shopId) return;
    setIsExporting(true);
    try {
      const exportResponse = await getShopOrdersRequest(shopId, {
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: debouncedSearch.trim() || undefined,
        startDate: activeDateRange.startDate,
        endDate: activeDateRange.endDate,
        page: 1,
        limit: 1000,
      });

      const resp = exportResponse?.data ?? exportResponse;
      const ordersToExport: any[] =
        resp?.orders ?? (Array.isArray(exportResponse) ? exportResponse : []);

      if (ordersToExport.length === 0) {
        toast.add({
          title: "No orders to export",
          description: "There are no orders matching your active filter criteria.",
          type: "error",
        });
        return;
      }

      const headers = [
        "Order ID",
        "Created Date",
        "Status",
        "Total Amount ($)",
        "Customer Name",
        "Customer Email",
        "Recipient Name",
        "Shipping City",
        "Shipping Country",
        "Items Count",
        "Payment Status",
        "Carrier",
        "Tracking Number",
      ];

      const rows = ordersToExport.map((order: any) => [
        order.id,
        new Date(order.createdAt).toISOString(),
        order.status,
        Number(order.totalAmount || 0).toFixed(2),
        order.customer?.name || "N/A",
        order.customer?.email || "N/A",
        order.shipTo?.fullName || "N/A",
        order.shipTo?.city || "N/A",
        order.shipTo?.country || "N/A",
        order.itemCount || 1,
        order.paymentStatus || "N/A",
        order.shipment?.carrier || "N/A",
        order.shipment?.trackingNumber || "N/A",
      ]);

      const csvContent =
        "\uFEFF" +
        [
          headers.join(","),
          ...rows.map((row) =>
            row
              .map((val) => `"${String(val ?? "").replaceAll('"', '""')}"`)
              .join(",")
          ),
        ].join("\r\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `shop-orders-${shopId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.add({
        title: "Export complete",
        description: `Exported ${ordersToExport.length} orders to CSV.`,
        type: "success",
      });
    } catch (err: any) {
      toast.add({
        title: "Export failed",
        description: err?.message || "Failed to download orders CSV report.",
        type: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const hasActiveFilters = Boolean(
    debouncedSearch ||
      statusFilter !== "ALL" ||
      datePreset !== "ALL" ||
      customStartDate ||
      customEndDate
  );

  const handleClearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setStatusFilter("ALL");
    setDatePreset("ALL");
    setCustomStartDate("");
    setCustomEndDate("");
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, pagination.totalPages || Math.ceil(pagination.total / pageSize));
  const startItem = pagination.total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, pagination.total);

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
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
            p === currentPage
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          {p}
        </button>
      );
    });
  };

  if (!shopId) {
    return (
      <div className="py-20 text-center text-xs text-rose-500">
        Shop ID is missing.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[460px] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-sm mx-auto text-center py-20 space-y-3">
        <AlertCircle className="mx-auto size-8 text-slate-300" />
        <p className="text-sm font-medium text-slate-700">Couldn't load orders</p>
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

  return (
    <div className="space-y-5 max-w-[1200px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Orders & Fulfillment</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {pagination.total} {pagination.total === 1 ? "order" : "orders"}
            {totalRevenue > 0 && ` · ${fmt(totalRevenue)} revenue`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={isExporting || pagination.total === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-40"
          >
            {isExporting ? (
              <Loader2 size={13} className="animate-spin text-orange-500" />
            ) : (
              <Download size={13} />
            )}
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
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Revenue", value: fmt(totalRevenue) },
          { label: "Total orders", value: pagination.total.toLocaleString() },
          { label: "Awaiting fulfillment", value: String(confirmedCount + processingCount) },
          { label: "Fulfilled", value: String(completedCount) },
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

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs font-medium">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "border-orange-500 text-slate-900 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Secondary Filters */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search by order ID, customer name, email, tracking…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all placeholder:text-slate-400"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Date Preset Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdown(openDropdown === "date" ? null : "date");
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  datePreset !== "ALL"
                    ? "bg-orange-50 text-orange-700 border-orange-200"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span>{DATE_PRESET_OPTIONS.find((d) => d.value === datePreset)?.label}</span>
                <ChevronDown size={12} className="text-slate-400" />
              </button>

              {openDropdown === "date" && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setOpenDropdown(null)} />
                  <div className="absolute right-0 top-full mt-1 z-30 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1">
                    {DATE_PRESET_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setDatePreset(opt.value);
                          setOpenDropdown(null);
                        }}
                        className={`w-full px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                          datePreset === opt.value
                            ? "bg-orange-50 text-orange-700 font-medium"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Limit Dropdown */}
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

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-medium text-rose-600 hover:text-rose-700 px-2 py-1.5 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Range */}
        {datePreset === "CUSTOM" && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="font-medium text-slate-700">Custom range:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {rawOrders.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-500">
              {hasActiveFilters ? "No orders match your filters" : "No orders yet"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {hasActiveFilters
                ? "Try adjusting search or status filters."
                : "When customers place orders, they will appear here."}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-3 text-xs font-medium text-orange-600 hover:text-orange-700 cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500 font-medium">
                  <th className="text-left px-4 py-3 font-medium">Order</th>
                  <th className="text-left px-4 py-3 font-medium">Customer</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Fulfillment</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-right px-4 py-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rawOrders.map((order: any) => {
                  const d = new Date(order.createdAt);
                  const customerName =
                    order.customer?.name || order.shipTo?.fullName || "Guest Customer";
                  const destination = [order.shipTo?.city, order.shipTo?.country]
                    .filter(Boolean)
                    .join(", ");

                  return (
                    <tr
                      key={order.id}
                      onClick={() => navigate(`/dashboard/shop/${shopId}/orders/${order.id}`)}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium text-slate-900">
                        #{order.id.slice(0, 8)}
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-800 leading-tight">
                          {customerName}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[200px] mt-0.5">
                          {order.customer?.email || destination || "Direct order"}
                        </p>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {renderStatus(order.status)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {order.shipment?.trackingNumber ? (
                          <div className="text-xs">
                            <span className="font-medium text-slate-700">
                              {order.shipment.carrier || "Courier"}:
                            </span>{" "}
                            <span className="font-mono text-[11px] text-slate-500">
                              {order.shipment.trackingNumber}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {order.status === "DELIVERED"
                              ? "Delivered"
                              : order.status === "CONFIRMED"
                              ? "Ready to pack"
                              : order.status === "PROCESSING"
                              ? "Packing"
                              : "Not dispatched"}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                        {d.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-right tabular-nums text-sm font-medium text-slate-900">
                        {fmt(Number(order.totalAmount || 0))}
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
      {pagination.total > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-500 py-1">
          <span>
            {startItem}–{endItem} of {pagination.total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage <= 1}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer transition-colors"
              title="First page"
            >
              <ChevronsLeft size={14} />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPrevPage && currentPage <= 1}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer transition-colors"
              title="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            {renderPageNumbers()}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={!pagination.hasNextPage && currentPage >= totalPages}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer transition-colors"
              title="Next page"
            >
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer transition-colors"
              title="Last page"
            >
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
