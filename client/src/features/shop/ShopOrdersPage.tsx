import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Eye,
  Package,
  RefreshCw,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Download,
  Calendar,
  X,
  Truck,
  RotateCcw,
  Clock,
} from "lucide-react";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

const orderStatusConfig: Record<
  string,
  { label: string; className: string }
> = {
  CONFIRMED: {
    label: "Confirmed (To Pack)",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  PROCESSING: {
    label: "Processing",
    className: "bg-blue-50 text-blue-800 border-blue-200",
  },
  SHIPPED: {
    label: "Shipped",
    className: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  DELIVERED: {
    label: "Delivered",
    className: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  PENDING: {
    label: "Pending Payment",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-rose-50 text-rose-800 border-rose-200",
  },
  REFUNDED: {
    label: "Refunded",
    className: "bg-purple-50 text-purple-800 border-purple-200",
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

export const ShopOrdersPage = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();

  // Search & Filter State
  const [searchInput, setSearchInput] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [datePreset, setDatePreset] = useState<DatePreset>("ALL");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Debounce search input by 350ms to prevent query flooding
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset to page 1 whenever search, status, or date filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, datePreset, customStartDate, customEndDate]);

  // Compute active date range based on preset or custom input
  const activeDateRange = useMemo(() => {
    if (datePreset === "CUSTOM") {
      return {
        startDate: customStartDate || undefined,
        endDate: customEndDate || undefined,
      };
    }
    return getDateRangeForPreset(datePreset);
  }, [datePreset, customStartDate, customEndDate]);

  // Query parameters sent to backend
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

  // Fetch shop orders with full server-side query parameters
  const { data, isLoading, isFetching, isError, refetch } = useShopOrders(
    shopId ?? "",
    queryParams
  );

  // Safe data parsing
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

  // Compute metrics and SVG geometry based on current view
  const { totalRevenue, confirmedCount, processingCount, completedCount, circumference, confirmedLen, processingLen } = useMemo(() => {
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

    const total = rawOrders.length || 1;
    const radius = 60;
    const circ = 2 * Math.PI * radius;
    const cLen = (confirmed / total) * circ;
    const pLen = (processing / total) * circ;

    return {
      totalRevenue: revenue.toFixed(2),
      confirmedCount: confirmed,
      processingCount: processing,
      completedCount: completed,
      circumference: circ,
      confirmedLen: cLen,
      processingLen: pLen,
    };
  }, [rawOrders]);

  // CSV Export Handler
  const handleExportCSV = async () => {
    if (!shopId) return;
    setIsExporting(true);
    try {
      // Fetch matching orders (up to 1,000 items) with active filters
      const exportResponse = await getShopOrdersRequest(shopId, {
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: debouncedSearch.trim() || undefined,
        startDate: activeDateRange.startDate,
        endDate: activeDateRange.endDate,
        page: 1,
        limit: 1000,
      });

      const resp = exportResponse?.data ?? exportResponse;
      const ordersToExport: any[] = resp?.orders ?? (Array.isArray(exportResponse) ? exportResponse : []);

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
        description: `Successfully exported ${ordersToExport.length} orders to CSV.`,
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

  // Has any active filter?
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

  // Early returns
  if (!shopId) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">Shop ID is missing.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
          <RefreshCw className="h-4 w-4 animate-spin text-orange-500" />
          Loading shop orders dashboard...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-sm font-semibold text-destructive">
          Failed to load shop orders.
        </p>
        <Button
          variant="outline"
          onClick={() => refetch()}
          className="rounded-xl cursor-pointer"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      </div>
    );
  }

  // Calculate item range for pagination label
  const startItem =
    pagination.total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, pagination.total);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <style>{`
        @keyframes spin-in {
          0% { transform: scale(0.5) rotate(-180deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .animate-spin-in {
          animation: spin-in 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
            Shop Orders
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time fulfillment tracking, customer lookup, and order history.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {/* CSV Export Button */}
          <Button
            onClick={handleExportCSV}
            disabled={isExporting || pagination.total === 0}
            variant="outline"
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold h-9 px-3.5 gap-1.5 cursor-pointer shadow-2xs"
            title="Export filtered orders to CSV for bookkeeping or physical fulfillment"
          >
            {isExporting ? (
              <RefreshCw className="size-3.5 animate-spin text-orange-500" />
            ) : (
              <Download className="size-3.5" />
            )}
            <span>Export Orders CSV</span>
          </Button>

          {/* Sync Button */}
          <Button
            onClick={() => refetch()}
            disabled={isFetching}
            variant="outline"
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold h-9 px-3.5 gap-1.5 cursor-pointer shadow-2xs"
          >
            <RefreshCw
              className={`size-3.5 ${
                isFetching ? "animate-spin text-orange-500" : ""
              }`}
            />
            <span>Sync</span>
          </Button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="rounded-2xl border-slate-200/90 shadow-2xs">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Active Page Revenue
                </p>
                <h3 className="text-2xl font-black mt-1 text-slate-900">
                  ${totalRevenue}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Across valid orders in view
                </p>
              </div>
              <div className="rounded-xl p-3 bg-emerald-50 text-emerald-600 border border-emerald-100">
                <DollarSign className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/90 shadow-2xs">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Total Matching Orders
                </p>
                <h3 className="text-2xl font-black mt-1 text-slate-900">
                  {pagination.total}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Filtered database records
                </p>
              </div>
              <div className="rounded-xl p-3 bg-orange-50 text-orange-600 border border-orange-100">
                <Package className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/90 shadow-2xs">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Awaiting Fulfillment
                </p>
                <h3 className="text-2xl font-black mt-1 text-slate-900">
                  {confirmedCount + processingCount}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {confirmedCount} to pack • {processingCount} processing
                </p>
              </div>
              <div className="rounded-xl p-3 bg-amber-50 text-amber-600 border border-amber-100">
                <Clock className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/90 shadow-2xs">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Shipped & Delivered
                </p>
                <h3 className="text-2xl font-black mt-1 text-slate-900">
                  {completedCount}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Dispatched customer orders
                </p>
              </div>
              <div className="rounded-xl p-3 bg-blue-50 text-blue-600 border border-blue-100">
                <Truck className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Animated Donut Chart */}
        <Card className="rounded-2xl border-slate-200/90 shadow-2xs flex flex-col justify-between items-center p-6">
          <div className="w-full flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Order Fulfillment Breakdown
            </h3>
            <Badge variant="secondary" className="text-[10px] font-bold">
              Current Page
            </Badge>
          </div>

          <div className="relative w-44 h-44 flex items-center justify-center my-2">
            <svg
              viewBox="0 0 160 160"
              className="w-full h-full -rotate-90 drop-shadow-xs"
            >
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="20"
              />
              <g className="origin-center animate-spin-in">
                {confirmedCount > 0 && (
                  <circle
                    cx="80"
                    cy="80"
                    r="60"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="20"
                    strokeDasharray={`${confirmedLen} ${circumference}`}
                    strokeDashoffset="0"
                    className="origin-center transition-transform duration-300 hover:scale-105 cursor-pointer"
                  />
                )}
                {processingCount > 0 && (
                  <circle
                    cx="80"
                    cy="80"
                    r="60"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="20"
                    strokeDasharray={`${processingLen} ${circumference}`}
                    strokeDashoffset={-confirmedLen}
                    className="origin-center transition-transform duration-300 hover:scale-105 cursor-pointer"
                  />
                )}
              </g>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                In View
              </span>
              <span className="text-2xl font-black text-slate-900">
                {rawOrders.length}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">
                Confirmed ({confirmedCount})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">
                Processing ({processingCount})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              <span className="text-muted-foreground">
                Other ({rawOrders.length - confirmedCount - processingCount})
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* FILTER CONTROLS & SEARCH BAR */}
      <div className="space-y-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by customer name, email, order ID, or tracking #..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-9 pl-9 pr-8 text-xs rounded-xl border-slate-200"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val ?? "ALL");
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[160px] h-9 text-xs rounded-xl border-slate-200">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed (To Pack)</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="SHIPPED">Shipped</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="PENDING">Pending Payment</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Preset Filter */}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <Select
                value={datePreset}
                onValueChange={(val) => {
                  setDatePreset((val as DatePreset) ?? "ALL");
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[145px] h-9 text-xs rounded-xl border-slate-200">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Time</SelectItem>
                  <SelectItem value="TODAY">Today</SelectItem>
                  <SelectItem value="YESTERDAY">Yesterday</SelectItem>
                  <SelectItem value="LAST_7_DAYS">Last 7 Days</SelectItem>
                  <SelectItem value="THIS_MONTH">This Month</SelectItem>
                  <SelectItem value="CUSTOM">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-9 px-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer rounded-xl gap-1"
              >
                <X className="h-3.5 w-3.5" />
                <span>Reset Filters</span>
              </Button>
            )}
          </div>
        </div>

        {/* Custom Date Range Inputs */}
        {datePreset === "CUSTOM" && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
            <span className="text-xs font-bold text-slate-700">Custom Date:</span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>From:</span>
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="h-8 w-36 rounded-xl text-xs border-slate-200"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>To:</span>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="h-8 w-36 rounded-xl text-xs border-slate-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Orders Table */}
      {rawOrders.length === 0 ? (
        <Card className="flex flex-col items-center justify-center border-dashed border-slate-200 py-16 rounded-3xl text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Package className="h-6 w-6" />
          </div>
          <CardTitle className="text-base font-bold text-slate-900">
            No orders found
          </CardTitle>
          <CardDescription className="mt-1 text-xs max-w-sm">
            {hasActiveFilters
              ? "No orders match your active search terms or date filters. Try modifying your filters or clearing search."
              : "No orders have been placed in your shop yet."}
          </CardDescription>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="mt-4 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="mr-1.5 size-3.5" /> Reset Filters
            </Button>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden border-slate-200/90 shadow-2xs rounded-3xl">
          <Table>
            <TableHeader className="bg-slate-50/70">
              <TableRow className="border-b border-slate-100 hover:bg-transparent">
                <TableHead className="w-[120px] text-xs font-bold text-slate-700">
                  Order ID
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700">
                  Customer & Destination
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700">
                  Items
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700">
                  Total Amount
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700">
                  Status
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700">
                  Fulfillment / Tracking
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700">
                  Date
                </TableHead>
                <TableHead className="text-right text-xs font-bold text-slate-700">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rawOrders.map((order: any) => {
                const config =
                  orderStatusConfig[order.status] ?? {
                    label: order.status,
                    className: "bg-slate-100 text-slate-700 border-slate-200",
                  };

                return (
                  <TableRow
                    key={order.id}
                    className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                  >
                    <TableCell className="font-mono text-xs font-semibold text-slate-900">
                      #{order.id.slice(0, 8)}...
                    </TableCell>

                    <TableCell>
                      <div className="font-semibold text-xs text-slate-900">
                        {order.customer?.name || order.shipTo?.fullName || "Guest Customer"}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {order.customer?.email ? `${order.customer.email} • ` : ""}
                        {order.shipTo?.city || order.shipTo?.country
                          ? `${order.shipTo?.city || ""}, ${order.shipTo?.country || ""}`
                          : "Direct Delivery"}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="bg-slate-100 text-slate-700 border-slate-200 text-[11px] font-normal"
                      >
                        {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                      </Badge>
                    </TableCell>

                    <TableCell className="font-bold text-xs text-slate-900">
                      ${Number(order.totalAmount).toFixed(2)}
                    </TableCell>

                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${config.className}`}
                      >
                        {config.label}
                      </span>
                    </TableCell>

                    <TableCell>
                      {order.shipment?.trackingNumber ? (
                        <div className="text-xs">
                          <span className="font-semibold text-slate-800">
                            {order.shipment.carrier || "Courier"}:
                          </span>{" "}
                          <span className="font-mono text-[11px] text-slate-500">
                            {order.shipment.trackingNumber}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Not dispatched
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate(`/dashboard/shop/${shopId}/orders/${order.id}`)
                        }
                        className="rounded-xl h-8 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer gap-1"
                      >
                        <Eye className="size-3.5" />
                        <span>View</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Server-Side Pagination Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-slate-100 px-6 py-4 bg-slate-50/40">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>
                Showing <span className="font-bold text-slate-900">{startItem}</span> to{" "}
                <span className="font-bold text-slate-900">{endItem}</span> of{" "}
                <span className="font-bold text-slate-900">{pagination.total}</span> orders
              </span>

              {/* Page size selector */}
              <div className="hidden sm:flex items-center gap-1.5 ml-2">
                <span>Per page:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(val) => {
                    setPageSize(Number(val));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-7 w-[70px] text-xs rounded-lg border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={!pagination.hasPrevPage && currentPage <= 1}
                className="h-8 rounded-xl border-slate-200 text-xs font-semibold cursor-pointer disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Previous
              </Button>

              <span className="text-xs font-semibold px-2 text-slate-700">
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={
                  !pagination.hasNextPage &&
                  currentPage >= (pagination.totalPages || 1)
                }
                className="h-8 rounded-xl border-slate-200 text-xs font-semibold cursor-pointer disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
